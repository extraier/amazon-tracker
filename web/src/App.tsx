import { useEffect, useMemo, useState } from "react";
import { Sparkline } from "./Sparkline";

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

const AFFILIATE_DISCLOSURE = (
  <p>
    As an Amazon Associate I earn from qualifying purchases. Links to Amazon
    products on this page are tagged with my affiliate ID; the price you pay
    is the same.{" "}
    <a
      href="https://affiliate-program.amazon.com/help/operating/operating"
      target="_blank"
      rel="noopener noreferrer"
    >
      More info
    </a>
    .
  </p>
);

function priceClass(price: number | null, msrp: number, threshold: number): string {
  if (price === null) return "ok";
  if (price < msrp * threshold) return "deal";
  if (price < msrp * 0.95) return "warn";
  return "ok";
}

function priceFmt(price: number | null, currency = "USD"): string {
  if (price === null) return "—";
  if (currency === "USD") return `$${price.toFixed(2)}`;
  return `${price.toFixed(2)} ${currency}`;
}

function relativeTime(iso: string): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return new Date(iso).toLocaleString();
}

export default function App() {
  const [live, setLive] = useState<Live | null>(null);
  const [history, setHistory] = useState<History>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [dealsOnly, setDealsOnly] = useState(false);
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
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="app">
      <header>
        <div>
          <h1>Amazon Apple Tracker</h1>
          <div className="subtitle">
            Listings still priced below the post-2026-06-25 Apple US MSRP.
          </div>
        </div>
        <div className="meta">
          {live ? (
            <>
              Source: <code>{live.source}</code> · last fetch{" "}
              {relativeTime(live.fetched_at)}
            </>
          ) : (
            "Loading…"
          )}
        </div>
      </header>

      {live && (
        <div className="stats">
          <div>
            <span className="stat-val">{stats.total}</span>tracked
          </div>
          <div>
            <span className="stat-val" style={{ color: "var(--deal)" }}>
              {stats.deals}
            </span>
            still at old price
          </div>
          <div>
            <span className="stat-val" style={{ color: "var(--text-faint)" }}>
              {stats.fetchErr}
            </span>
            fetch errors
          </div>
          {stats.biggestSavings && (
            <div>
              Biggest deal:{" "}
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
          placeholder="Search by name, ASIN, or title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
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
          Deals only
        </label>
      </div>

      {!live && <div className="empty">Loading data…</div>}
      {live && filtered.length === 0 && (
        <div className="empty">No items match your filter.</div>
      )}

      {live && filtered.length > 0 && (
        <table>
          <thead>
            <tr>
              <th onClick={() => setSort("category")} className={sortKey === "category" ? "sorted" : ""}>
                Category{sortIndicator("category")}
              </th>
              <th onClick={() => setSort("name")} className={sortKey === "name" ? "sorted" : ""}>
                Product{sortIndicator("name")}
              </th>
              <th onClick={() => setSort("current_price")} className={sortKey === "current_price" ? "sorted" : ""}>
                Price{sortIndicator("current_price")}
              </th>
              <th onClick={() => setSort("new_msrp")} className={sortKey === "new_msrp" ? "sorted" : ""}>
                New MSRP{sortIndicator("new_msrp")}
              </th>
              <th onClick={() => setSort("savings_pct")} className={sortKey === "savings_pct" ? "sorted" : ""}>
                Savings{sortIndicator("savings_pct")}
              </th>
              <th>30-day</th>
              <th onClick={() => setSort("availability")} className={sortKey === "availability" ? "sorted" : ""}>
                Availability{sortIndicator("availability")}
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
                        {i.is_deal && <span className="deals-only-badge">Deal</span>}
                      </a>
                      <span className="asin">
                        {i.asin}
                        {i.seller && i.seller !== "Apple" && <> · {i.seller}</>}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`price ${cls}`}>
                      {priceFmt(i.current_price, i.currency)}
                    </span>
                  </td>
                  <td>
                    <span className="price" style={{ color: "var(--text-dim)" }}>
                      {priceFmt(i.new_msrp, "USD")}
                    </span>
                  </td>
                  <td>
                    {i.is_deal ? (
                      <span className="savings">−{i.savings_pct}%</span>
                    ) : (
                      <span style={{ color: "var(--text-faint)" }}>—</span>
                    )}
                  </td>
                  <td>
                    <Sparkline
                      values={histPrices}
                      threshold={i.new_msrp}
                      stroke={i.is_deal ? "#ef4444" : "#a3a3a3"}
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
        {AFFILIATE_DISCLOSURE}
        <p style={{ marginTop: 12 }}>
          Prices scraped from{" "}
          <a href="https://www.amazon.com" target="_blank" rel="noopener noreferrer">
            amazon.com
          </a>
          . Currency, seller, and availability reflect the listing at fetch time.
          No guarantees — verify on Amazon before purchasing. Last build:{" "}
          <code>{live?.fetched_at ?? "—"}</code>.
        </p>
      </footer>
    </div>
  );
}
