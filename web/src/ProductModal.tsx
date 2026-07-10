/**
 * ProductModal — full-detail lightbox for a product.
 *
 * Opens when the user clicks an AlertCard. Shows everything we know about the
 * product: large image, full title, price comparison, availability, seller,
 * 30-day price history sparkline, and CTAs to Amazon + copy-ASIN.
 *
 * UX details:
 *   - Closes on: ESC, click on overlay, click on close button
 *   - Focus trap inside the dialog (Tab cycles through focusable elements)
 *   - Returns focus to the originally-clicked element on close
 *   - aria-modal + role="dialog" for screen readers
 *   - Smooth fade-in (200ms) + scale-up (95% → 100%)
 *   - Locks body scroll while open
 */

import { useEffect, useRef } from "react";
import { formatPrice, formatRelativeTime } from "./i18n/format";
import { useT, useLang, type Lang } from "./i18n";
import { Sparkline } from "./Sparkline";
import { FlagForCurrency, COUNTRY_NAMES } from "./Flags";

export type ProductModalItem = {
  asin: string;
  name: string;
  category: string;
  title?: string | null;
  current_price: number | null;
  list_price?: number | null;
  new_msrp: number;
  currency: string;
  seller?: string | null;
  savings_pct: number;
  availability?: string | null;
  fetched_at: string;
  url: string;
  image_url?: string | null;
  /** ISO date for the most recent price history point (optional) */
  last_history_date?: string | null;
};

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.708 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
  </svg>
);

const ExternalIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8.5 1.5A.5.5 0 0 1 9 1h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V2.707L8.354 7.854a.5.5 0 1 1-.708-.708L13.293 2H9.5a.5.5 0 0 1-.5-.5z" />
    <path d="M2 2.5A1.5 1.5 0 0 1 3.5 1H6a.5.5 0 0 1 0 1H3.5a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V10a.5.5 0 0 1 1 0v2.5A1.5 1.5 0 0 1 13.5 14h-10A1.5 1.5 0 0 1 2 12.5v-10z" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M5.5 4v1h-2A1.5 1.5 0 0 0 2 6.5v8A1.5 1.5 0 0 0 3.5 16h8a1.5 1.5 0 0 0 1.5-1.5v-2h1v2A2.5 2.5 0 0 1 11.5 17h-8A2.5 2.5 0 0 1 1 14.5v-8A2.5 2.5 0 0 1 3.5 4h2zm5-2A2.5 2.5 0 0 1 13 4.5v8a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 0 12.5v-8A2.5 2.5 0 0 1 2.5 2h8zM3 4.5v8a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
  </svg>
);

export function ProductModal({
  item,
  history,
  onClose,
}: {
  item: ProductModalItem | null;
  history: number[];
  onClose: () => void;
}) {
  const t = useT();
  const [lang] = useLang();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // ESC key, focus trap, body scroll lock, focus restore
  useEffect(() => {
    if (!item) return;

    // Remember what had focus so we can restore on close
    previouslyFocused.current = document.activeElement as HTMLElement;

    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the dialog
    setTimeout(() => dialogRef.current?.focus(), 50);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab") {
        // Focus trap: keep focus inside the dialog
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a, button, input, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus();
    };
  }, [item, onClose]);

  if (!item) return null;

  const seller = item.seller ?? "Apple";
  const absSavings = item.current_price !== null
    ? item.new_msrp - item.current_price
    : 0;
  const isDeal = item.current_price !== null
    && item.current_price < item.new_msrp * 0.98;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        // Click on overlay (not the panel) closes
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="modal-panel"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-price-summary"
        tabIndex={-1}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label={t("modalClose")}
          autoFocus
        >
          <CloseIcon />
        </button>

        {/* Header: large image + title block */}
        <div className="modal-header">
          <div className="modal-image-wrap">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="modal-image"
              />
            ) : (
              <span className="modal-image-fallback" aria-hidden="true">
                {categoryEmoji(item.category)}
              </span>
            )}
          </div>

          <div className="modal-info">
            <div className="modal-category-row">
              <span className="modal-category">{item.category}</span>
              <span className="modal-flag-inline">
                <FlagForCurrency currency={item.currency} width={22} height={16} />
              </span>
            </div>
            <h2 id="modal-title" className="modal-title">{item.title || item.name}</h2>
            <div className="modal-subtitle">
              <span className="modal-name">{item.name}</span>
              <span className="modal-asin">ASIN <code>{item.asin}</code></span>
            </div>

            {/* Price summary */}
            <div id="modal-price-summary" className="modal-price-summary">
              <div className="modal-price-current-row">
                <span className="modal-price-current-label">{t("modalCurrentPrice")}</span>
                <span className={`modal-price-current ${isDeal ? "is-deal" : ""}`}>
                  {formatPrice(item.current_price ?? 0, item.currency)}
                </span>
              </div>
              <div className="modal-price-msrp-row">
                <span className="modal-price-msrp-label">{t("alertNewMsrp")}</span>
                <span className="modal-price-msrp">
                  {formatPrice(item.new_msrp, "USD")}
                </span>
              </div>
              {isDeal && (
                <div className="modal-savings-row">
                  <span className="modal-savings-pct">−{item.savings_pct}%</span>
                  <span className="modal-savings-abs">
                    ({t("alertSavings")} {formatPrice(absSavings, "USD")})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="modal-divider" />

        {/* Metadata grid */}
        <dl className="modal-meta">
          <div className="modal-meta-row">
            <dt>{t("modalAvailability")}</dt>
            <dd>{item.availability || "—"}</dd>
          </div>
          <div className="modal-meta-row">
            <dt>{t("modalSeller")}</dt>
            <dd>
              {seller}
              {" · "}
              {COUNTRY_NAMES[
                (currencyToCountry[item.currency?.toUpperCase()] ?? "US")
              ] ?? item.currency}
            </dd>
          </div>
          <div className="modal-meta-row">
            <dt>{t("modalLastSeen")}</dt>
            <dd>
              {new Date(item.fetched_at).toLocaleString(
                lang === "zh-Hant" ? "zh-Hant-HK" : "en-US",
                { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
              )}
              {" ("}
              {formatRelativeTime(item.fetched_at, lang, t)}
              {")"}
            </dd>
          </div>
        </dl>

        {/* Sparkline (only when we have history) */}
        {history.length > 1 && (
          <>
            <div className="modal-divider" />
            <div className="modal-sparkline-section">
              <h3 className="modal-section-title">{t("modalPriceHistory")}</h3>
              <div className="modal-sparkline-wrap">
                <Sparkline
                  values={history}
                  threshold={item.new_msrp}
                  width={600}
                  height={120}
                  strokeWidth={2}
                  style={{ color: isDeal ? "var(--deal)" : "var(--accent)" }}
                />
              </div>
              <div className="modal-sparkline-legend">
                <span className="modal-legend-item">
                  <span className="modal-legend-line" /> {t("modalLegendPrice")}
                </span>
                <span className="modal-legend-item">
                  <span className="modal-legend-threshold" /> {t("modalLegendThreshold")}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Action bar */}
        <div className="modal-actions">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="modal-cta-primary"
          >
            <ExternalIcon />
            <span>{t("alertViewOnAmazon")}</span>
          </a>
          <CopyAsinButton asin={item.asin} label={t("modalCopyAsin")} copiedLabel={t("modalCopied")} />
        </div>
      </div>
    </div>
  );
}

function CopyAsinButton({ asin, label, copiedLabel }: { asin: string; label: string; copiedLabel: string }) {
  // Local "copied" feedback (no React state needed — inline visibility toggle)
  return (
    <button
      className="modal-cta-secondary"
      onClick={(e) => {
        const btn = e.currentTarget;
        const icon = btn.querySelector(".copy-icon") as HTMLElement | null;
        const check = btn.querySelector(".check-icon") as HTMLElement | null;
        try {
          navigator.clipboard.writeText(asin);
          if (icon) icon.style.display = "none";
          if (check) check.style.display = "";
          btn.classList.add("copied");
          setTimeout(() => {
            if (icon) icon.style.display = "";
            if (check) check.style.display = "none";
            btn.classList.remove("copied");
          }, 1500);
        } catch {
          // Clipboard API blocked (very old browsers, http on insecure origin)
          // — fall back to a text-selection prompt via prompt()
          window.prompt(`Copy this ASIN:`, asin);
        }
      }}
    >
      <span className="copy-icon"><CopyIcon /></span>
      <span className="check-icon" style={{ display: "none" }}><CheckIcon /></span>
      <span>{label}</span>
    </button>
  );
}

// Reused from AlertCard — duplicated here to keep the modal self-contained
function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    "MacBook Air": "💻",
    "MacBook Pro": "💻",
    "iPad Pro": "📱",
    "iPad Air": "📱",
    iPhone: "📱",
    AirPods: "🎧",
    Watch: "⌚",
  };
  return map[category] ?? "🍎";
}

// Currency → country code (mirrors the table in Flags.tsx)
// Duplicated here so this component stays self-contained.
const currencyToCountry: Record<string, keyof typeof COUNTRY_NAMES> = {
  USD: "US", GBP: "UK", EUR: "DE", JPY: "JP",
  HKD: "HK", CNY: "CN", CAD: "CA", AUD: "AU", INR: "IN",
};