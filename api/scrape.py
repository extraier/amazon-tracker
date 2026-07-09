"""
Vercel serverless function: GET/POST /api/scrape

Runs on Vercel Functions (Python 3.12 runtime).
Triggered by:
  - Vercel Cron (configured in vercel.json) every 6 hours
  - Manual HTTP GET to refresh on-demand

Returns JSON of the latest scrape. Stores the result in Vercel Blob so the
/api/deals endpoint can serve it to the frontend.

US region by default (vercel.json sets functions region: iad1) — gives us a
US IP, so Amazon serves USD prices instead of geo-locating to HK.
"""
import os
import sys
import json
from http.server import BaseHTTPRequestHandler

# Make the project root importable so we can pull in scraper_lib + storage
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import scraper_lib
import storage


# Path to the seed YAML — sits at the repo root, two levels up from /api/
SEED_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "apple_seed.yaml",
)


def _verify_cron_auth(headers):
    """
    Vercel sends `Authorization: Bearer <CRON_SECRET>` on cron invocations
    (auto-injected from the CRON_SECRET env var). For manual on-demand calls
    (no auth header), allow if ?secret= matches, or if no CRON_SECRET is set
    (dev convenience).
    """
    expected = os.environ.get("CRON_SECRET")
    if not expected:
        return True  # no secret configured → open (dev mode)
    auth = headers.get("authorization", "")
    if auth == f"Bearer {expected}":
        return True
    return False


def _do_scrape(seeds, affiliate_tag):
    """Run the scrape and return (result_dict, storage_backend)."""

    def on_progress(i, total, asin, parsed, dt):
        price_str = (
            f"${parsed.get('current_price', 0):.2f} {parsed.get('currency', '?')}"
            if parsed.get("current_price") else
            f"ERR({parsed.get('error', '?')})"
        )
        # Single-line log; Vercel captures stdout in the function logs
        print(f"  [{i+1}/{total}] {asin}  {price_str}  {dt:.2f}s", flush=True)

    result = scraper_lib.scrape_all(
        seeds, affiliate_tag=affiliate_tag,
        sleep_s=1.5, jitter=0.3, on_progress=on_progress,
    )
    backend = storage.save_deals(result)
    result["storage_backend"] = backend
    return result


class handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Quiet the default request logger; we print our own progress.
        pass

    def do_GET(self):
        self._handle()

    def do_POST(self):
        self._handle()

    def _handle(self):
        # Auth check (skipped if CRON_SECRET not set in env)
        if not _verify_cron_auth(self.headers):
            self.send_response(401)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Unauthorized")
            return

        try:
            affiliate_tag = os.environ.get(
                "AMAZON_AFFILIATE_TAG", scraper_lib.DEFAULT_AFFILIATE_TAG
            )
            seeds = scraper_lib.load_seed(SEED_PATH)
            print(f"[scrape] Starting scrape of {len(seeds)} ASINs", flush=True)
            result = _do_scrape(seeds, affiliate_tag)
            print(
                f"[scrape] Done. {result['deals_count']} deals, "
                f"storage={result['storage_backend']}",
                flush=True,
            )
            body = json.dumps(result).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            print(f"[scrape] FAILED: {type(e).__name__}: {e}", flush=True)
            err_body = json.dumps({"error": str(e)[:500]}).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(err_body)))
            self.end_headers()
            self.wfile.write(err_body)
