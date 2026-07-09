#!/usr/bin/env python3
"""
Local CLI for the Amazon Apple tracker. Same scraper logic as the Vercel
function — just a different entry point. Useful for:
  - Verifying the seed YAML
  - Ad-hoc single ASIN tests (e.g. python scrape.py --asins B0D2RX5LW9)
  - Saving the latest scrape to data/live.json for the Vite dev server

The web frontend, by default, fetches /api/deals on Vercel — but during
local dev (npm run dev) the Vite proxy routes /api → api/ on your Mac,
which by default doesn't have the storage backend. Set
AMAZON_TRACKER_LOCAL_DEALS=1 and run this script before `npm run dev` to
seed web/public/data/live.json with the latest scrape output.
"""
import argparse
import json
import os
import sys

import scraper_lib


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", default="apple_seed.yaml", help="path to seed YAML")
    ap.add_argument("--output", default="web/public/data/live.json",
                    help="output JSON path")
    ap.add_argument("--asins", default=None, help="comma-separated ASIN subset")
    ap.add_argument("--affiliate-tag", default=scraper_lib.DEFAULT_AFFILIATE_TAG)
    ap.add_argument("--sleep", type=float, default=2.0,
                    help="seconds between requests (default 2.0)")
    ap.add_argument("--jitter", type=float, default=0.3)
    args = ap.parse_args()

    seeds = scraper_lib.load_seed(args.seed, args.asins)
    print(f"Loaded {len(seeds)} ASINs from {args.seed}", file=sys.stderr)

    def on_progress(i, total, asin, parsed, dt):
        status = (
            f"${parsed.get('current_price', 0):>7.2f} {parsed.get('currency', '?')}"
            if parsed.get("current_price") else f"ERR({parsed.get('error', '?')})"
        )
        deal = "🔥" if (
            parsed.get("current_price") is not None
            and parsed.get("currency") == "USD"
            and parsed["current_price"] < seeds[i]["new_msrp"] * scraper_lib.DEAL_THRESHOLD
        ) else ""
        print(f"  [{i+1}/{total}] {asin}  {status}  {dt:.2f}s  {deal}", file=sys.stderr)

    result = scraper_lib.scrape_all(
        seeds, affiliate_tag=args.affiliate_tag,
        sleep_s=args.sleep, jitter=args.jitter,
        on_progress=on_progress,
    )

    out_path = args.output
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nWrote {len(result['items'])} items to {out_path}", file=sys.stderr)
    print(f"Deals flagged: {result['deals_count']}", file=sys.stderr)
    for d in [i for i in result["items"] if i["is_deal"]]:
        print(f"  🔥 {d['category']:12s} {d['name']:42s} "
              f"${d['current_price']:.2f}  (was ${d['new_msrp']:.0f}, "
              f"-{d['savings_pct']:.1f}%)  {d['url']}", file=sys.stderr)


if __name__ == "__main__":
    main()
