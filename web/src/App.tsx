import { useEffect, useMemo, useState } from "react";
import { Sparkline } from "./Sparkline";
import { useT, useLang } from "./i18n";
import { LanguageToggle } from "./i18n/LanguageToggle";
import { ThemeToggle } from "./i18n/ThemeToggle";
import { formatRelativeTime, formatPrice } from "./i18n/format";
import { AlertCard } from "./AlertCard";
import { ProductModal } from "./ProductModal";

type Item = {
  asin: string;
  category: string;
  name: string;
  title: string | null;
  current_price: number | null;
  list_price: number | null;
  currency: string;
  availability: string | null;
  seller: string | null;
  image_url: string | null;
  is_deal: boolean;
  savings_pct: number;
  new_msrp: number;
  url: string;
  fetched_at: string;
  error: string | null;
};

type Live = {
  fetched_at: string;
  source: string;
  deal_threshold: number;
  items: Item[];
};

type History = {
  [asin: string]: { ts: string; price: number }[];
};

function priceClass(price: number | null, msrp: number, threshold: number): string {
  if (price === null) return "ok";
  if (price < msrp * threshold) return "deal";
  if (price < msrp * 0.95) return "warn";
  return "ok";
}

export default function App() {
  const t = useT();
  const [lang] = useLang();
  const [live, setLive] = useState<Live | null>(null);
  const [history, setHistory] = useState<History>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [dealsOnly, setDealsOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "alerts">("alerts");
  // When the user clicks a card, the corresponding Item is stored here and
  // the modal renders with full details.
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [sortKey, setSortKey] = useState<keyof Item>("is_deal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Load data. Try /api/deals first (Vercel Function in prod);
  // fall back to /data/live.json for local dev with `npm run dev`.
  useEffect(() => {
    (async () => {
      let liveData: Live | null = null;

      // 1. Try /api/deals (production)
      try {
        const r = await fetch("/api/deals");
        if (r.ok) {
          const ct = r.headers.get("content-type") || "";
          if (ct.includes("json")) {
            liveData = await r.json();
          }
        }
      } catch {
        // network or 404 — fall through
      }

      // 2. Fall back to /data/live.json (local dev / static hosting)
      if (!liveData) {
        try {
          const r = await fetch("/data/live.json");
          if (r.ok) liveData = await r.json();
        } catch {
          // give up
        }
      }

      setLive(liveData);

      // History: same dual path
      try {
        const r = await fetch("/data/history.json");
        if (r.ok) setHistory(await r.json());
      } catch {
        setHistory({});
      }
    })();
  }, []);

  const categories = useMemo(() => {
    if (!live) return [];
    return Array.from(new Set(live.items.map((i) => i.category))).sort();
  }, [live]);

  const filtered = useMemo(() => {
    if (!live) return [];
    return live.items
      .filter((i) => {
        if (category !== "all" && i.category !== category) return false;
        if (dealsOnly && !i.is_deal) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !i.name.toLowerCase().includes(q) &&
            !i.asin.includes(q) &&
            !(i.title || "").toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av === bv) return 0;
        if (av === null || av === undefined) return 1;
        if (bv === null || bv === undefined) return -1;
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
  }, [live, search, category, dealsOnly, sortKey, sortDir]);

  // Auto-switch to alerts view when the user enables "deals only" filter.
  // UX rationale: if every visible item is a deal, the card layout is more
  // useful than a table. The user can still override back to table.
  useEffect(() => {
    if (dealsOnly && viewMode === "table" && filtered.length > 0
        && filtered.every((i) => i.is_deal)) {
      setViewMode("alerts");
    }
  }, [dealsOnly, filtered, viewMode]);

  const stats = useMemo(() => {
    if (!live)
      return { total: 0, deals: 0, fetchErr: 0, biggestSavings: null as Item | null };
    const deals = live.items.filter((i) => i.is_deal);
    const errs = live.items.filter((i) => i.error);
    return {
      total: live.items.length,
      deals: deals.length,
      fetchErr: errs.length,
      biggestSavings: deals.sort((a, b) => b.savings_pct - a.savings_pct)[0] ?? null,
    };
  }, [live]);

  const setSort = (key: keyof Item) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "category" ? "asc" : "desc");
    }
  };

  const sortIndicator = (key: keyof Item) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? t("sortAsc") : t("sortDesc");
  };

  const formatPriceLocal = (price: number | null, currency: string = "USD") =>
    formatPrice(price, currency);

  return (
    <div className="app">
      <header>
        <div>
          <h1>{t("title")}</h1>
          <div className="subtitle">{t("subtitle")}</div>
        </div>
        <div className="header-right">
          {live && (
            <div className="meta">
              {t("sourceLabel")} <code>{live.source}</code> · {t("lastFetchPrefix")}{" "}
              {formatRelativeTime(live.fetched_at, lang, t)}
            </div>
          )}
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {live && (
        <div className="stats">
          <div>
            <span className="stat-val">{stats.total}</span>
            {t("statsTracked")}
          </div>
          <div>
            <span className="stat-val" style={{ color: "var(--deal)" }}>
              {stats.deals}
            </span>
            {t("statsDeals")}
          </div>
          <div>
            <span className="stat-val" style={{ color: "var(--text-faint)" }}>
              {stats.fetchErr}
            </span>
            {t("statsErrors")}
          </div>
          {stats.biggestSavings && (
            <div>
              {t("statsBiggestDeal")}{" "}
              <span className="stat-val">
                {stats.biggestSavings.name} −{stats.biggestSavings.savings_pct}%
              </span>
            </div>
          )}
        </div>
      )}

      <div className="controls">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--text-dim)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={dealsOnly}
            onChange={(e) => setDealsOnly(e.target.checked)}
            style={{ width: "auto" }}
          />
          {t("dealsOnly")}
        </label>
        <div className="view-toggle" role="group" aria-label={t("viewModeAria")}>
          <button
            className={`view-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
          >
            {t("viewTable")}
          </button>
          <button
            className={`view-btn ${viewMode === "alerts" ? "active" : ""}`}
            onClick={() => setViewMode("alerts")}
            aria-pressed={viewMode === "alerts"}
          >
            {t("viewAlerts")}
          </button>
        </div>
      </div>

      {!live && <div className="empty">{t("loading")}</div>}
      {live && filtered.length === 0 && (
        <div className="empty">{t("noMatch")}</div>
      )}

      {/* Alert cards (Keepa-style) — default view */}
      {live && filtered.length > 0 && viewMode === "alerts" && (
        <div className="alert-grid">
          {filtered.map((i) => (
            <AlertCard
              key={i.asin}
              item={{
                ...i,
                fetched_at: live.fetched_at,
              }}
              onOpen={() => setSelectedItem(i)}
            />
          ))}
        </div>
      )}

      {/* Data table */}
      {live && filtered.length > 0 && viewMode === "table" && (
        <table>
          <thead>
            <tr>
              <th onClick={() => setSort("category")} className={sortKey === "category" ? "sorted" : ""}>
                {t("colCategory")}{sortIndicator("category")}
              </th>
              <th onClick={() => setSort("name")} className={sortKey === "name" ? "sorted" : ""}>
                {t("colProduct")}{sortIndicator("name")}
              </th>
              <th onClick={() => setSort("current_price")} className={sortKey === "current_price" ? "sorted" : ""}>
                {t("colPrice")}{sortIndicator("current_price")}
              </th>
              <th onClick={() => setSort("new_msrp")} className={sortKey === "new_msrp" ? "sorted" : ""}>
                {t("colNewMsrp")}{sortIndicator("new_msrp")}
              </th>
              <th onClick={() => setSort("savings_pct")} className={sortKey === "savings_pct" ? "sorted" : ""}>
                {t("colSavings")}{sortIndicator("savings_pct")}
              </th>
              <th>{t("col30Day")}</th>
              <th onClick={() => setSort("availability")} className={sortKey === "availability" ? "sorted" : ""}>
                {t("colAvailability")}{sortIndicator("availability")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const cls = priceClass(i.current_price, i.new_msrp, live.deal_threshold);
              const hist = history[i.asin] ?? [];
              const histPrices = hist.map((p) => p.price);
              return (
                <tr key={i.asin} className={i.is_deal ? "deal" : ""}>
                  <td>{i.category}</td>
                  <td>
                    <div className="title-cell">
                      <a
                        href={i.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="name"
                      >
                        {i.name}
                        {i.is_deal && <span className="deals-only-badge">{t("dealBadge")}</span>}
                      </a>
                      <span className="asin">
                        {i.asin}
                        {i.seller && i.seller !== "Apple" && <> · {i.seller}</>}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`price ${cls}`}>
                      {formatPriceLocal(i.current_price, i.currency)}
                    </span>
                  </td>
                  <td>
                    <span className="price" style={{ color: "var(--text-dim)" }}>
                      {formatPriceLocal(i.new_msrp, "USD")}
                    </span>
                  </td>
                  <td>
                    {i.is_deal ? (
                      <span className="savings">−{i.savings_pct}%</span>
                    ) : (
                      <span style={{ color: "var(--text-faint)" }}>{t("noSavings")}</span>
                    )}
                  </td>
                  <td>
                    <Sparkline
                      values={histPrices}
                      threshold={i.new_msrp}
                      style={{ color: i.is_deal ? "var(--deal)" : "var(--text-faint)" }}
                    />
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {i.availability || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <footer>
        <p>{t("affiliateDisclosure")}{" "}
          <a
            href="https://affiliate-program.amazon.com/help/operating/operating"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("affiliateMoreInfo")}
          </a>
        </p>
        <p style={{ marginTop: 12 }}>
          {t("priceScrapedFrom")}
          <a href="https://www.amazon.com" target="_blank" rel="noopener noreferrer">
            amazon.com
          </a>
          {t("priceScrapedFrom2")} {t("priceVerify")}
        </p>
      </footer>

      {/* Product detail modal — opens when a card is clicked */}
      <ProductModal
        item={selectedItem}
        history={
          selectedItem
            ? (history[selectedItem.asin] ?? []).map((p) => p.price)
            : []
        }
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
