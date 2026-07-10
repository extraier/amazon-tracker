/**
 * AlertCard — Keepa-inspired alert card for "still at old price" deals.
 *
 * Layout (matches the Keepa screenshot):
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  Product title (truncated, large bold)                  │
 *   │                                                         │
 *   │  ┌───────┐                                              │
 *   │  │       │    amazon                                   │
 *   │  │ IMG   │                       $ 49.97                 │
 *   │  │       │    🇺🇸                                       │
 *   │  └───────┘                                              │
 *   │                🗓  Jan 6, 2026, 8:52 AM (5 months ago)   │
 *   │  ─────────────────────────────────────────────────────  │
 *   │  🔔 ↓             Amazon              ↗                  │
 *   │  $ 30.00          $ 49.97            40% / $ 19.97       │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Adapts to our schema:
 *   - title         = item.name
 *   - left price    = item.new_msrp ("the post-hike price" — what sellers SHOULD now charge)
 *   - right price   = item.current_price (what they're ACTUALLY charging = alert trigger)
 *   - savings %     = (new_msrp - current_price) / new_msrp
 *   - seller        = item.seller (Apple vs third-party)
 */

import { formatPrice, formatRelativeTime } from "./i18n/format";
import { useT, useLang, type Lang } from "./i18n";
import { FlagForCurrency, COUNTRY_NAMES } from "./Flags";

export type AlertCardItem = {
  asin: string;
  name: string;
  category: string;
  title?: string | null;
  current_price: number | null;
  new_msrp: number;
  currency: string;
  seller?: string | null;
  savings_pct: number;
  availability?: string | null;
  fetched_at: string;
  url: string;
  image_url?: string | null;
};

// Inline SVGs — no extra deps
const CalendarIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M4.5 0a.5.5 0 0 1 .5.5V1h6V.5a.5.5 0 0 1 1 0V1h.5A1.5 1.5 0 0 1 14 2.5v11A1.5 1.5 0 0 1 12.5 15h-9A1.5 1.5 0 0 1 2 13.5v-11A1.5 1.5 0 0 1 3.5 1H4V.5a.5.5 0 0 1 .5-.5zM3 4v9.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V4H3z" />
    <path d="M4 1.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5V2H4v-.5z" opacity=".4" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.718-4.44-4.005-4.901z" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 2a.5.5 0 0 1 .5.5v8.793l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 0 1 .708-.708L7.5 11.293V2.5A.5.5 0 0 1 8 2z" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 14a.5.5 0 0 1-.5-.5V4.707L4.854 7.354a.5.5 0 1 1-.708-.708l3.5-3.5a.5.5 0 0 1 .708 0l3.5 3.5a.5.5 0 0 1-.708.708L8.5 4.707V13.5A.5.5 0 0 1 8 14z" />
  </svg>
);

// Amazon "smile" arrow — taken from Amazon's actual brand mark (simplified path)
const AmazonLogo = () => (
  <svg viewBox="0 0 90 32" aria-hidden="true" style={{ width: 90, height: 32 }}>
    <text
      x="0"
      y="24"
      fontFamily="-apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif"
      fontWeight="700"
      fontSize="26"
      fill="currentColor"
      letterSpacing="-1"
    >
      amazon
    </text>
    {/* Curved arrow under "amazon" — the smile */}
    <path
      d="M 8 28 Q 45 38 82 27"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    {/* Arrowhead at right end of smile */}
    <path
      d="M 76 24 L 84 27 L 78 32 Z"
      fill="currentColor"
    />
  </svg>
);

// Category emoji mapping for the placeholder thumbnail
const CATEGORY_EMOJI: Record<string, string> = {
  "MacBook Air": "💻",
  "MacBook Pro": "💻",
  "iPad Pro": "📱",
  "iPad Air": "📱",
  iPhone: "📱",
  AirPods: "🎧",
  Watch: "⌚",
};

function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? "🍎";
}

export function AlertCard({ item }: { item: AlertCardItem }) {
  const t = useT();
  const [lang] = useLang();
  const seller = item.seller ?? "Apple";
  const productImage = categoryEmoji(item.category);
  const lastSeen = formatRelativeTime(item.fetched_at, lang, t);
  const absSavings = item.current_price !== null
    ? item.new_msrp - item.current_price
    : 0;

  return (
    <article className="alert-card" aria-label={item.name}>
      {/* Title row */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="alert-title"
        title={item.title || item.name}
      >
        {item.title || item.name}
      </a>

      {/* Image + meta + price row */}
      <div className="alert-top">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="alert-thumb"
          aria-label="View product on Amazon"
        >
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="alert-thumb-img"
              loading="lazy"
              // Referrer policy matters — Amazon's image CDN returns 403
              // when the referrer is missing. The default `strict-origin`
              // works on most browsers; we set it explicitly to be safe.
              referrerPolicy="no-referrer-when-downgrade"
              onError={(e) => {
                // Fall back to the emoji if the image fails to load
                // (broken ASIN, expired CDN URL, offline, etc.)
                const target = e.currentTarget;
                target.style.display = "none";
                const sibling = target.nextElementSibling;
                if (sibling) (sibling as HTMLElement).style.display = "";
              }}
            />
          ) : null}
          <span
            className="alert-thumb-emoji"
            aria-hidden="true"
            style={{ display: item.image_url ? "none" : undefined }}
          >{productImage}</span>
        </a>

        <div className="alert-meta">
          <div className="alert-amazon"><AmazonLogo /></div>
          <div className="alert-flag">
            <FlagForCurrency currency={item.currency} width={30} height={22} />
          </div>
        </div>

        <div className="alert-price-big">
          <span className="alert-price-currency">$</span>
          <span className="alert-price-amount">
            {item.current_price !== null
              ? item.current_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : "—"}
          </span>
        </div>
      </div>

      {/* Timestamp row */}
      <div className="alert-timestamp">
        <CalendarIcon />
        <span>
          {new Date(item.fetched_at).toLocaleString(
            lang === "zh-Hant" ? "zh-Hant-HK" : "en-US",
            { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
          )}{" "}
          ({lastSeen})
        </span>
      </div>

      <div className="alert-divider" />

      {/* Bottom row — alert data: trigger / seller / savings */}
      <div className="alert-bottom">
        <div className="alert-cell alert-cell-trigger">
          <div className="alert-cell-label">
            <BellIcon />
            <ArrowDownIcon />
          </div>
          <div className="alert-cell-value alert-cell-value-trigger">
            {formatPrice(item.new_msrp, "USD")}
          </div>
          <div className="alert-cell-sub">{t("alertNewMsrp")}</div>
        </div>

        <div className="alert-cell alert-cell-seller">
          <div className="alert-cell-label alert-cell-label-plain">{seller}</div>
          <div className="alert-cell-value alert-cell-value-seller">
            {formatPrice(item.current_price ?? 0, "USD")}
          </div>
          <div className="alert-cell-sub">{t("alertCurrentPrice")}</div>
        </div>

        <div className="alert-cell alert-cell-savings">
          <div className="alert-cell-label">
            <span className="alert-savings-badge">
              <ArrowUpIcon />
            </span>
          </div>
          <div className="alert-cell-value alert-cell-value-savings">
            {item.savings_pct}% <span className="alert-savings-sep">/</span>{" "}
            {formatPrice(absSavings, "USD")}
          </div>
          <div className="alert-cell-sub">{t("alertSavings")}</div>
        </div>
      </div>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="alert-cta"
      >
        {t("alertViewOnAmazon")}
      </a>
    </article>
  );
}