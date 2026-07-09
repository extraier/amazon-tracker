/**
 * Locale-aware formatters for date, time, numbers.
 */
import type { Lang } from "./index";

export function formatRelativeTime(iso: string, lang: Lang, t: (k: string, params?: Record<string, string | number>) => string): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 5) return t("lastFetchJustNow");
  if (diffSec < 60) return t("lastFetchSecondsAgo", { n: diffSec });
  if (diffSec < 3600) return t("lastFetchMinutesAgo", { n: Math.floor(diffSec / 60) });
  if (diffSec < 86400) return t("lastFetchHoursAgo", { n: Math.floor(diffSec / 3600) });
  // Older than 24h → show absolute date
  return new Date(iso).toLocaleString(lang === "zh-Hant" ? "zh-Hant-HK" : "en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function formatPrice(price: number | null, currency: string = "USD"): string {
  if (price === null || price === undefined) return "—";
  if (currency === "USD") return `$${price.toFixed(2)}`;
  return `${price.toFixed(2)} ${currency}`;
}
