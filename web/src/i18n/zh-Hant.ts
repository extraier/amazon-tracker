/**
 * zh-Hant (Traditional Chinese, HK conventions) — primary language.
 *
 * Tone: casual, like reading a tech blog. Uses HK vocabulary where it
 * differs from Taiwan Mandarin (e.g. 嘅、喺、咗 for Cantonese-flavored
 * HK Chinese; 軟件 not 軟體). Cantonese is written in the same characters
 * as Traditional Chinese — the difference is mostly word choice.
 */
const zhHant: Record<string, string> = {
  // Header
  "title": "Apple 劈價追蹤 — 美國 Amazon",
  "subtitle": "美國 Amazon 上低過正價嘅 Apple 產品,趁劈價仲未完即追蹤緊。",
  "themeLight": "光",
  "themeDark": "暗",
  "themeAuto": "自動",
  "themeAria": "色調",
  "sourceLabel": "資料來源:",
  "lastFetchPrefix": "上次更新:",
  "lastFetchJustNow": "啱啱",
  "lastFetchSecondsAgo": "{n} 秒前",
  "lastFetchMinutesAgo": "{n} 分鐘前",
  "lastFetchHoursAgo": "{n} 個鐘前",

  // Stats
  "statsTracked": "件商品",
  "statsDeals": "仲劈緊價",
  "statsErrors": "個錯誤",
  "statsBiggestDeal": "劈最多:",
  "statsBiggestDealValue": "{name} -{pct}%",

  // Controls
  "searchPlaceholder": "搜尋名稱、ASIN 或標題…",
  "allCategories": "全部類別",
  "dealsOnly": "只顯示劈價",
  "viewTable": "列表",
  "viewAlerts": "特價牆",
  "viewModeAria": "顯示方式",

  // Table headers
  "colCategory": "類別",
  "colProduct": "產品",
  "colPrice": "現價",
  "colNewMsrp": "正價",
  "colSavings": "減幅",
  "col30Day": "30 日",
  "colAvailability": "供貨",
  "sortAsc": " ↑",
  "sortDesc": " ↓",

  // Cell values
  "dealBadge": "劈價",
  "noSavings": "—",
  // Alert card (Keepa-style)
  "alertNewMsrp": "正價",
  "alertCurrentPrice": "劈到",
  "alertSavings": "慳咗",
  "alertViewOnAmazon": "去 Amazon 睇 →",
  // Modal
  "modalClose": "關閉",
  "modalCurrentPrice": "劈價後",
  "modalAvailability": "供貨",
  "modalSeller": "賣家",
  "modalLastSeen": "最後更新",
  "modalPriceHistory": "30 日價格走勢",
  "modalLegendPrice": "實際價格",
  "modalLegendThreshold": "正價",
  "modalCopyAsin": "複製 ASIN",
  "modalCopied": "已複製!",
  "sellerLabel": "賣家",
  "asinLabel": "ASIN",
  "amazonStore": "Amazon",

  // Empty / loading
  "loading": "載入緊…",
  "noMatch": "冇嘢啱你個 filter。",

  // Footer
  "affiliateDisclosure": "本網站含推廣連結,經連結買嘢我會收佣。亞馬遜規定要講,所以講咗你知。",
  "affiliateMoreInfo": "詳情",
  "priceScrapedFrom": "價格由 ",
  "priceScrapedFrom2": " 擷取。貨幣、賣家、供貨以下載入為準。",
  "priceVerify": "落單前請自行到 Amazon 確認。",

  // Time / units
  "agoFormat": "{n} {unit}{s}前",
  "unitSecond": "秒",
  "unitMinute": "分鐘",
  "unitHour": "個鐘",
  "unitDay": "日",
};

export default zhHant;
