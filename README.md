# Amazon Apple Tracker

Live tracker of Amazon US listings still priced below the **post-2026-06-25 Apple US MSRP**.
When Apple raised MSRPs (memory-cost story, June 2026), third-party Amazon sellers
take 1–14 days to update their listings. We catch the gap.

**Live URL**: https://amazon-tracker.vercel.app (after first deploy)

## How it works

```
┌──────────────────────────────────────────────────────────────────────┐
│ VERCEL CRON (every 6h)                                               │
│   ↓                                                                   │
│ api/scrape.py  (Python, US region = iad1 → US IP → USD prices)        │
│   ├─ reads apple_seed.yaml                                           │
│   ├─ for each ASIN: fetch amazon.com/dp/<ASIN>                       │
│   ├─ parse title, current_price, list_price, currency, seller        │
│   └─ flag deal if current_price < new_msrp × 0.98                    │
│   ↓                                                                   │
│   writes result to Vercel Blob (key: "deals.json")                    │
│                                                                       │
│ api/deals.py  (Python, US region)                                     │
│   └─ reads deals.json from Blob, returns JSON                        │
│                                                                       │
│ Static frontend (Vite + React)                                        │
│   └─ fetches /api/deals on page load, renders table + sparklines      │
└──────────────────────────────────────────────────────────────────────┘
```

The US region (iad1) is critical — your Mac in HK gets geo-located to HKD prices.
Vercel's US-East region gets USD.

## Project layout

```
amazon-tracker/
├── api/                    # Vercel serverless functions
│   ├── scrape.py           # /api/scrape — runs the scraper (called by cron + manual)
│   ├── deals.py            # /api/deals — returns the last scrape result
│   └── requirements.txt    # pyyaml
├── web/                    # Vite + React frontend
│   ├── src/
│   │   ├── App.tsx         # Main page (table + filters + sparklines)
│   │   ├── Sparkline.tsx   # Inline SVG price-history chart
│   │   ├── index.css       # Bloomberg-terminal style
│   │   └── main.tsx
│   └── public/data/        # Sample data for local dev
├── scraper_lib.py          # Pure-Python scraper logic (importable)
├── storage.py              # Vercel Blob (prod) / filesystem (local) abstraction
├── scrape.py               # Local CLI — same code path as the Vercel function
├── apple_seed.yaml         # ASINs + new MSRP baseline per product
├── vercel.json             # Cron + region config
├── .python-version         # 3.12
├── test_smoke.py           # Parser/seed/storage unit tests
└── README.md
```

## First-time deploy

1. **Create a GitHub repo** (or use an existing one) and push this folder.
2. **Import the repo into Vercel** at https://vercel.com/new — set project name
   to `amazon-tracker` (gives the `amazon-tracker.vercel.app` domain).
3. **Add a Vercel Blob store**: Storage tab → Create Database → Blob → name it
   `amazon-tracker-deals`. This injects `BLOB_READ_WRITE_TOKEN` into the
   project env automatically.
4. **Set env vars** (Settings → Environment Variables):
   - `AMAZON_AFFILIATE_TAG` = `comparetige03-20` (your Amazon Associates ID)
   - `CRON_SECRET` = any random 32+ char string (Vercel auto-injects as
     `Authorization: Bearer <CRON_SECRET>` on cron invocations)
5. **Deploy**. After the first build, hit the URL to verify.
6. **Trigger a scrape** (initial data population):
   ```bash
   curl -H "Authorization: Bearer <your CRON_SECRET>" \
        https://amazon-tracker.vercel.app/api/scrape
   ```
7. **Visit https://amazon-tracker.vercel.app** — you should see real USD
   prices (because the function runs on US-East region).

## Local dev

```bash
# Python deps
pip3 install --user pyyaml

# Smoke tests (no network needed)
python3 test_smoke.py

# Frontend dev server
cd web
npm install
npm run dev
# open http://localhost:5173 — uses /data/live.json (sample)
```

To run the scraper locally and update the local JSON:

```bash
python3 scrape.py --output web/public/data/live.json
# ^ this hits the real Amazon with your Mac's HK IP — will give HKD prices,
#   but the parser logic + deal detection can still be verified
```

## Detection rule

A deal is any listing where `current_price < new_msrp * 0.98`.

- 2% slack absorbs normal Amazon sale noise.
- Real "stale listing" hits (5–15% below new MSRP) cross this bar easily.
- Listings served in non-USD currency are ignored (we can only compare apples
  to apples in USD).

## Anti-bot safety

From the HK probe, 3 req/sec from a US region with full Safari browser
headers gets through Amazon with no captcha. The scraper runs at 1.5s
sleep between requests = ~0.67 req/sec. With ~15 ASINs per run, each cron
scrape takes ~30s end-to-end (well under the 60s `maxDuration`).

If Amazon starts blocking, two knobs:
- Increase `--sleep` (in `api/scrape.py`: `sleep_s=1.5` → 3.0)
- Add a `Referer` from a real Amazon search page (already set, but could
  rotate)

## Affiliate disclosure

Required by Amazon Associates. The footer in `App.tsx` includes the standard
disclosure. Your tag `comparetige03-20` is wired into every product URL via
`scraper_lib.DEFAULT_AFFILIATE_TAG` (overridable by env var).

Apple MacBook category pays **1% commission**. Phones/tablets pay 4%. You'll
need 3 qualifying sales in 180 days to keep the Associates account active.

## Why this design

- **Vercel free tier** is sufficient: Hobby plan gives 100k function invocations/mo,
  100GB-hours. We're using 4/day = 122/mo + the /api/deals reads.
- **Vercel Blob** is the only "external" service; KV was deprecated. Blob is
  included free on all plans (500MB).
- **Static frontend** deploys to Vercel's CDN; ~150KB JS, ~3KB CSS, ~250ms build.
- **No Mac dependency** — your laptop can be off; the cron runs server-side.
