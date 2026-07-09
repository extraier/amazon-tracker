"""
Smoke test: load the seed, run the scraper for 2 ASINs, verify output structure.
Does NOT hit the network — uses scraper_lib's pure-Python logic with mock HTML.
"""
import sys
import os
import json
import importlib.util

# Make the project importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import scraper_lib
import storage


# Mock HTML to test the parser — based on real Amazon MacBook Air page structure.
# The real pages are 250-380KB; the parser's tiny_response guard (<50KB) would
# reject any short mock. Pad the mock to look like a real product page.
def _build_mock_html():
    body = """
    <div class="a-container">
        <span id="productTitle" class="a-size-large product-title-word-break">
            2024 Apple MacBook Air 13-inch Laptop Apple M3 Chip 8GB RAM 256GB SSD
            Storage Backlit Keyboard FaceTime HD Camera Touch ID Works with
            iPhone/iPad Midnight
        </span>
        <div id="availability" class="a-section a-spacing-none a-spacing-top-micro">
            <span class="a-color-state a-text-bold">In Stock</span>
        </div>
        <div id="bylineInfo" class="a-section a-spacing-micro">
            <a href="/apple/b?ie=UTF8">Visit the Apple Store</a>
        </div>
        <div class="a-section a-spacing-none">
            <span class="a-price-symbol">$</span>
            <span class="a-price-whole">999<span class="a-price-decimal">.</span></span>
            <span class="a-price-fraction">00</span>
        </div>
    </div>
    """
    # Pad with realistic-looking filler to cross the 50KB threshold
    filler = (
        "<!-- feature bullets, ad slots, reviews, scripts, etc. -->\n"
        + ('<div class="feature">Apple M3 chip with 8-core CPU</div>\n' * 1500)
    )
    return "<html><body>" + body + filler + "</body></html>"


MOCK_HTML = _build_mock_html()


def test_parser():
    parsed = scraper_lib.parse_product_page(MOCK_HTML)
    assert parsed["title"] is not None, "title missing"
    assert "MacBook Air" in parsed["title"], f"unexpected title: {parsed['title']}"
    assert parsed["current_price"] == 999.00, f"expected 999.00, got {parsed['current_price']}"
    assert parsed["currency"] == "USD", f"expected USD, got {parsed['currency']}"
    assert parsed["availability"] == "In Stock"
    assert "Apple Store" in (parsed.get("seller") or ""), f"seller: {parsed.get('seller')}"
    print("  ✓ parse_product_page works")
    return parsed


def test_build_item():
    parsed = test_parser()
    seed = {
        "asin": "B0CHX2F5QT",
        "category": "MacBook Air",
        "name": "MacBook Air 13\" M3 8GB 256GB",
        "new_msrp": 1099,
    }
    item = scraper_lib.build_item(seed, parsed, "comparetige03-20")
    assert item["asin"] == "B0CHX2F5QT"
    assert item["current_price"] == 999.00
    assert item["new_msrp"] == 1099
    assert item["is_deal"] is True, "should be flagged as a deal (999 < 1099*0.98=1077.02)"
    assert item["savings_pct"] == round((1099 - 999) / 1099 * 100, 2)
    assert item["url"] == "https://www.amazon.com/dp/B0CHX2F5QT?tag=comparetige03-20"
    print(f"  ✓ build_item: deal={item['is_deal']}, savings={item['savings_pct']}%, url={item['url']}")


def test_load_seed():
    seeds = scraper_lib.load_seed("apple_seed.yaml")
    assert len(seeds) > 0, "no seeds loaded"
    assert all("asin" in s and "new_msrp" in s for s in seeds)
    print(f"  ✓ load_seed: {len(seeds)} ASINs loaded, first = {seeds[0]['name']}")


def test_storage_roundtrip():
    payload = {
        "fetched_at": "2026-07-09T15:00:00Z",
        "items": [{"asin": "B0TEST1234", "current_price": 999.0}],
    }
    backend = storage.save_deals(payload)
    loaded = storage.load_deals()
    assert loaded is not None, "load_deals returned None"
    assert loaded["items"][0]["asin"] == "B0TEST1234"
    assert loaded["items"][0]["current_price"] == 999.0
    print(f"  ✓ storage roundtrip: backend={backend}")


if __name__ == "__main__":
    print("Running smoke tests...")
    test_load_seed()
    test_parser()
    test_build_item()
    test_storage_roundtrip()
    print("\n✅ All smoke tests passed.")
