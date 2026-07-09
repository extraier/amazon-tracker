"""
scraper_lib — pure-Python scraper logic, importable from both:
  - Local CLI:  python scrape.py
  - Vercel:     api/scrape.py imports from here

The CLI wrapper (scrape.py) and the Vercel function (api/scrape.py) both
call scrape_all() to do the actual work. Storage is injected as a callback.
"""
import datetime
import gzip
import random
import re
import time
import urllib.error
import urllib.request

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0_1) "
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15")

DEFAULT_AFFILIATE_TAG = "comperige03-20"
DEAL_THRESHOLD = 0.98


def fetch_html(asin, timeout=15):
    """Fetch the Amazon product page. Returns (status, body, error, dt_seconds)."""
    url = f"https://www.amazon.com/dp/{asin}"
    headers = {
        "User-Agent": UA,
        "Accept": ("text/html,application/xhtml+xml,application/xml;q=0.9,"
                   "image/webp,*/*;q=0.8"),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
        "Referer": "https://www.amazon.com/",
    }
    req = urllib.request.Request(url, headers=headers)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read()
            if raw[:2] == b"\x1f\x8b":
                try:
                    body = gzip.decompress(raw).decode("utf-8", errors="replace")
                except Exception:
                    body = raw.decode("utf-8", errors="replace")
            else:
                body = raw.decode("utf-8", errors="replace")
            return r.status, body, None, time.time() - t0
    except urllib.error.HTTPError as e:
        return e.code, "", f"HTTPError {e.code}", time.time() - t0
    except Exception as e:
        return 0, "", f"{type(e).__name__}: {str(e)[:100]}", time.time() - t0


def parse_price(whole_str, frac_str):
    """Build a float from Amazon's split price (a-price-whole + a-price-fraction)."""
    if not whole_str:
        return None
    try:
        whole_clean = whole_str.replace(",", "").strip()
        frac_clean = (frac_str or "00").replace(",", "").strip()
        return float(f"{whole_clean}.{frac_clean}")
    except ValueError:
        return None


def parse_product_page(html):
    """Parse an Amazon product page. Returns dict with title, prices, etc."""
    if "/errors/validateCaptcha" in html or "Enter the characters you see below" in html:
        return {"error": "captcha_wall"}
    if "Sorry, we just need to make sure you're not a robot" in html:
        return {"error": "robot_check"}
    if "Page Not Found" in html and "productTitle" not in html:
        return {"error": "page_not_found"}
    if not html or len(html) < 50_000:
        return {"error": "tiny_response"}

    out = {}

    m = re.search(r'<span[^>]+id="productTitle"[^>]*>\s*(.+?)\s*</span>', html, re.S)
    if m:
        out["title"] = re.sub(r"\s+", " ", m.group(1)).strip()

    currency = "USD"
    sym_m = re.search(
        r'<span class="a-price-symbol">([^<]+)</span>\s*'
        r'<span class="a-price-whole">',
        html
    )
    if sym_m:
        sym = sym_m.group(1).strip()
        if "HKD" in sym:
            currency = "HKD"
        elif "€" in sym or "EUR" in sym:
            currency = "EUR"
        elif "£" in sym or "GBP" in sym:
            currency = "GBP"
        elif "¥" in sym or "JPY" in sym:
            currency = "JPY"
    out["currency"] = currency

    m = re.search(
        r'<span class="a-price-whole">([^<]+)<span class="a-price-decimal">'
        r'\.</span></span>\s*<span class="a-price-fraction">([^<]+)</span>',
        html
    )
    if m:
        out["current_price"] = parse_price(m.group(1), m.group(2))
    else:
        m = re.search(
            r'<span class="a-price-whole">([^<]+)</span>'
            r'\s*(?:<span class="a-price-fraction">([^<]+)</span>)?',
            html
        )
        if m:
            out["current_price"] = parse_price(m.group(1), m.group(2))

    m = re.search(
        r'class="a-price a-text-price"[^>]*>.*?'
        r'<span class="a-offscreen">\s*\$?([0-9,]+\.\d{2})\s*</span>',
        html, re.S
    )
    if m:
        try:
            out["list_price"] = float(m.group(1).replace(",", ""))
        except ValueError:
            pass

    m = re.search(
        r'<div id="availability"[^>]*>\s*<span[^>]*>([^<]+)</span>',
        html
    )
    if m:
        out["availability"] = re.sub(r"\s+", " ", m.group(1)).strip()
    else:
        out["availability"] = "Unknown"

    m = re.search(
        r'id="bylineInfo"[^>]*>.*?(?:<a[^>]+>|\s)([^<]+?)(?:</a>|\s*</div)',
        html, re.S
    )
    if m:
        out["seller"] = re.sub(r"\s+", " ", m.group(1)).strip()[:200]

    return out


def build_item(seed_entry, parsed, affiliate_tag):
    """Combine seed + parsed + computed fields into the output item."""
    asin = seed_entry["asin"]
    new_msrp = float(seed_entry["new_msrp"])
    now_iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    item = {
        "asin": asin,
        "category": seed_entry.get("category", ""),
        "name": seed_entry.get("name", ""),
        "title": parsed.get("title"),
        "current_price": parsed.get("current_price"),
        "list_price": parsed.get("list_price"),
        "currency": parsed.get("currency", "USD"),
        "availability": parsed.get("availability"),
        "seller": parsed.get("seller"),
        "is_deal": False,
        "savings_pct": 0.0,
        "new_msrp": new_msrp,
        "url": f"https://www.amazon.com/dp/{asin}?tag={affiliate_tag}",
        "fetched_at": now_iso,
        "error": parsed.get("error"),
    }
    if item["current_price"] is not None and item["currency"] == "USD":
        if item["current_price"] < new_msrp * DEAL_THRESHOLD:
            item["is_deal"] = True
            item["savings_pct"] = round(
                (new_msrp - item["current_price"]) / new_msrp * 100, 2
            )
    return item


def scrape_all(seeds, affiliate_tag=DEFAULT_AFFILIATE_TAG, sleep_s=1.5,
               jitter=0.3, on_progress=None):
    """
    Scrape all ASINs in `seeds`. Returns the full result dict.
    `on_progress(index, total, asin, parsed_or_error)` is called for each ASIN.
    """
    items = []
    fetched_at = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    for i, seed in enumerate(seeds):
        asin = seed["asin"]
        status, html, err, dt = fetch_html(asin)
        if err:
            parsed = {"error": err}
        else:
            parsed = parse_product_page(html)

        if on_progress:
            try:
                on_progress(i, len(seeds), asin, parsed, dt)
            except Exception:
                pass

        items.append(build_item(seed, parsed, affiliate_tag))

        if i < len(seeds) - 1:
            time.sleep(max(0.1, sleep_s * (1 + random.uniform(-jitter, jitter))))

    deals = [it for it in items if it["is_deal"]]
    return {
        "fetched_at": fetched_at,
        "source": "amazon.com",
        "deal_threshold": DEAL_THRESHOLD,
        "items": items,
        "deals_count": len(deals),
        "scraped_count": len(items),
    }


def load_seed(path="apple_seed.yaml", only_asins=None):
    """Load ASIN list from a YAML file. Falls back to a tiny built-in list if PyYAML missing."""
    try:
        import yaml
    except ImportError:
        raise RuntimeError("PyYAML is required: pip install pyyaml")
    with open(path) as f:
        data = yaml.safe_load(f)
    items = data.get("apple_seed", [])
    if only_asins:
        only_set = set(only_asins.split(","))
        items = [x for x in items if x["asin"] in only_set]
    return items
