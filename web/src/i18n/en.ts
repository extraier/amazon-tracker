/**
 * English — secondary language. Keep tone matched to the Chinese version.
 */
const en: Record<string, string> = {
  // Header
  "title": "Apple Price Drops — Amazon US",
  "subtitle": "Apple products on Amazon US priced below the regular MSRP. Catching the discounts before they expire.",
  "themeLight": "Light",
  "themeDark": "Dark",
  "themeAuto": "Auto",
  "themeAria": "Color theme",
  "sourceLabel": "Source:",
  "lastFetchPrefix": "last fetch",
  "lastFetchJustNow": "just now",
  "lastFetchSecondsAgo": "{n}s ago",
  "lastFetchMinutesAgo": "{n}m ago",
  "lastFetchHoursAgo": "{n}h ago",

  // Stats
  "statsTracked": "tracked",
  "statsDeals": "still discounted",
  "statsErrors": "fetch errors",
  "statsBiggestDeal": "Biggest drop:",
  "statsBiggestDealValue": "{name} −{pct}%",

  // Controls
  "searchPlaceholder": "Search by name, ASIN, or title…",
  "allCategories": "All categories",
  "dealsOnly": "Discounted only",
  "viewTable": "Table",
  "viewAlerts": "Deals",
  "viewModeAria": "View mode",

  // Table headers
  "colCategory": "Category",
  "colProduct": "Product",
  "colPrice": "Current",
  "colNewMsrp": "Regular",
  "colSavings": "Drop",
  "col30Day": "30-day",
  "colAvailability": "Availability",
  "sortAsc": " ↑",
  "sortDesc": " ↓",

  // Cell values
  "dealBadge": "Drop",
  "noSavings": "—",
  // Alert card (Keepa-style)
  "alertNewMsrp": "regular price",
  "alertCurrentPrice": "dropped to",
  "alertSavings": "you save",
  "alertViewOnAmazon": "View on Amazon →",
  // Modal
  "modalClose": "Close",
  "modalCurrentPrice": "Dropped price",
  "modalAvailability": "Availability",
  "modalSeller": "Seller",
  "modalLastSeen": "Last seen",
  "modalPriceHistory": "30-day price history",
  "modalLegendPrice": "actual price",
  "modalLegendThreshold": "regular MSRP",
  "modalCopyAsin": "Copy ASIN",
  "modalCopied": "Copied!",
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
