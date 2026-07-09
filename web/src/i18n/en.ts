/**
 * English — secondary language. Keep tone matched to the Chinese version.
 */
const en: Record<string, string> = {
  // Header
  "title": "Amazon Apple Tracker",
  "subtitle": "Amazon US listings still priced below the post-2026-06-25 Apple US MSRP.",
  "sourceLabel": "Source:",
  "lastFetchPrefix": "last fetch",
  "lastFetchJustNow": "just now",
  "lastFetchSecondsAgo": "{n}s ago",
  "lastFetchMinutesAgo": "{n}m ago",
  "lastFetchHoursAgo": "{n}h ago",

  // Stats
  "statsTracked": "tracked",
  "statsDeals": "still at old price",
  "statsErrors": "fetch errors",
  "statsBiggestDeal": "Biggest deal:",
  "statsBiggestDealValue": "{name} −{pct}%",

  // Controls
  "searchPlaceholder": "Search by name, ASIN, or title…",
  "allCategories": "All categories",
  "dealsOnly": "Deals only",

  // Table headers
  "colCategory": "Category",
  "colProduct": "Product",
  "colPrice": "Price",
  "colNewMsrp": "New MSRP",
  "colSavings": "Savings",
  "col30Day": "30-day",
  "colAvailability": "Availability",
  "sortAsc": " ↑",
  "sortDesc": " ↓",

  // Cell values
  "dealBadge": "Deal",
  "noSavings": "—",
  "sellerLabel": "by",
  "asinLabel": "ASIN",
  "amazonStore": "Amazon",

  // Empty / loading
  "loading": "Loading data…",
  "noMatch": "No items match your filter.",

  // Footer
  "affiliateDisclosure": "As an Amazon Associate I earn from qualifying purchases. Links to Amazon products on this page are tagged with my affiliate ID; the price you pay is the same.",
  "affiliateMoreInfo": "More info",
  "priceScrapedFrom": "Prices scraped from ",
  "priceScrapedFrom2": ". Currency, seller, and availability reflect the listing at fetch time.",
  "priceVerify": "No guarantees — verify on Amazon before purchasing.",

  // Time / units
  "agoFormat": "{n} {unit}{s} ago",
  "unitSecond": "sec",
  "unitMinute": "min",
  "unitHour": "hr",
  "unitDay": "day",
};

export default en;
