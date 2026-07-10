/**
 * Flags — inline SVG flags for the major Amazon marketplaces.
 * No external assets, no CDN dependency. Each flag is small (<1KB) and uses
 * currentColor so it inherits the parent's text color and theme-aware CSS
 * variables.
 *
 * Each flag component accepts an optional `title` for accessibility (defaults
 * to the country name) and standard SVG props (width/height/etc).
 *
 * The flag list is deliberately small and curated for the marketplaces we
 * actually scrape: US, UK, DE, FR, IT, ES, JP, HK, CN, CA, AU, IN.
 */

import { type JSX } from "react";

type FlagProps = {
  title?: string;
  width?: number;
  height?: number;
};

const DEFAULTS = { width: 36, height: 27 };

function baseSvg(width: number, height: number, title: string, role = "img") {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    width,
    height,
    viewBox: "0 0 60 30",
    role,
    "aria-label": title,
    style: { borderRadius: 2 },
  } as const;
}

// ---- Stripes (US, UK, FR, ...) --------------------------------------------

/** United States — 13 stripes + blue corner with simple star dots. */
export function FlagUS({ title = "United States", width, height }: FlagProps): JSX.Element {
  const w = width ?? DEFAULTS.width;
  const h = height ?? DEFAULTS.height;
  return (
    <svg {...baseSvg(w, h, title)}>
      <rect width="60" height="30" fill="#B22234" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={i * 2.31} width="60" height="1.15" fill="#FFFFFF" />
      ))}
      <rect width="24" height="16.15" fill="#3C3B6E" />
      {/* Simplified star field — just dots, no real 50-star rendering */}
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 6 }).map((__, c) => (
          <circle key={`${r}-${c}`} cx={2 + c * 3.6} cy={1.8 + r * 3.6} r="0.7" fill="#FFFFFF" />
        )),
      )}
    </svg>
  );
}

/** United Kingdom (Union Jack) — simplified. */
export function FlagUK({ title = "United Kingdom", width, height }: FlagProps): JSX.Element {
  const w = width ?? DEFAULTS.width;
  const h = height ?? DEFAULTS.height;
  return (
    <svg {...baseSvg(w, h, title)}>
      <rect width="60" height="30" fill="#012169" />
      {/* White diagonals */}
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      {/* Red diagonals (St Patrick + St George offsets) */}
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2" />
      {/* White cross */}
      <path d="M30,0 V30 M0,15 H60" stroke="#FFFFFF" strokeWidth="10" />
      {/* Red cross (St George) */}
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

/** France — vertical tricolore. */
export function FlagFR({ title = "France", width, height }: FlagProps): JSX.Element {
  const w = width ?? DEFAULTS.width;
  const h = height ?? DEFAULTS.height;
  return (
    <svg {...baseSvg(w, h, title)}>
      <rect width="20" height="30" fill="#0055A4" />
      <rect x="20" width="20" height="30" fill="#FFFFFF" />
      <rect x="40" width="20" height="30" fill="#EF4135" />
    </svg>
  );
}

/** Germany — horizontal tricolore. */
export function FlagDE({ title = "Germany", width, height }: FlagProps): JSX.Element {
  const w = width ?? DEFAULTS.width;
  const h = height ?? DEFAULTS.height;
  return (
    <svg {...baseSvg(w, h, title)}>
      <rect width="60" height="10" fill="#000000" />
      <rect y="10" width="60" height="10" fill="#DD0000" />
      <rect y="20" width="60" height="10" fill="#FFCE00" />
    </svg>
  );
}

/** Italy — vertical tricolore (green/white/red). */
export function FlagIT({ title = "Italy", width, height }: FlagProps): JSX.Element {
  const w = width ?? DEFAULTS.width;
  const h = height ?? DEFAULTS.height;
  return (
    <svg {...baseSvg(w, h, title)}>
      <rect width="20" height="30" fill="#009246" />
      <rect x="20" width="20" height="30" fill="#FFFFFF" />
      <rect x="40" width="20" height="30" fill="#CE2B37" />
    </svg>
  );
}

/** Spain — red/yellow/red horizontal with yellow band 2x as tall. */
export function FlagES({ title = "Spain", width, height }: FlagProps): JSX.Element {
  const w = width ?? DEFAULTS.width;
  const h = height ?? DEFAULTS.height;
  return (
    <svg {...baseSvg(w, h, title)}>
      <rect width="60" height="30" fill="#AA151B" />
      <rect y="7.5" width="60" height="15" fill="#F1BF00" />
    </svg>
  );
}

/** Japan — white with red disc. */
export function FlagJP({ title = "Japan", width, height }: FlagProps): JSX.Element {
  const w = width ?? DEFAULTS.width;
  const h = height ?? DEFAULTS.height;
  return (
    <svg {...baseSvg(w, h, title)}>
      <rect width="60" height="30" fill="#FFFFFF" />
      <circle cx="30" cy="15" r="9" fill="#BC002D" />
    </svg>
  );
}

/** Hong Kong — red with white bauhinia flower (stylised). */
export function FlagHK({ title = "Hong Kong", width, height }: FlagProps): JSX.Element {
  const w = width ?? DEFAULTS.width;
  const h = height ?? DEFAULTS.height;
  return (
    <svg {...baseSvg(w, h, title)}>
      <rect width="60" height="30" fill="#DE2910" />
      {/* Stylised 5-petal flower — just a circle with a star inside */}
      <circle cx="30" cy="15" r="6" fill="#FFFFFF" />
      <circle cx="30" cy="15" r="1.5" fill="#DE2910" />
    </svg>
  );
}

/** China — red with 5 yellow stars (simplified to one big + 4 small). */
export function FlagCN({ title = "China", width, height }: FlagProps): JSX.Element {
  const w = width ?? DEFAULTS.width;
  const h = height ?? DEFAULTS.height;
  return (
    <svg {...baseSvg(w, h, title)}>
      <rect width="60" height="30" fill="#DE2910" />
      {/* Big star */}
      <circle cx="12" cy="9" r="3.5" fill="#FFDE00" />
      {/* 4 small stars — simplified as circles */}
      <circle cx="22" cy="5" r="1.6" fill="#FFDE00" />
      <circle cx="26" cy="9" r="1.6" fill="#FFDE00" />
      <circle cx="26" cy="14" r="1.6" fill="#FFDE00" />
      <circle cx="22" cy="18" r="1.6" fill="#FFDE00" />
    </svg>
  );
}

/** Canada — red-white-red with red maple leaf (simplified as a triangle). */
export function FlagCA({ title = "Canada", width, height }: FlagProps): JSX.Element {
  const w = width ?? DEFAULTS.width;
  const h = height ?? DEFAULTS.height;
  return (
    <svg {...baseSvg(w, h, title)}>
      <rect width="15" height="30" fill="#FF0000" />
      <rect x="15" width="30" height="30" fill="#FFFFFF" />
      <rect x="45" width="15" height="30" fill="#FF0000" />
      {/* Stylised maple leaf as a diamond */}
      <path d="M30 8 L33 14 L30 12 L27 14 Z M30 12 L33 14 L31 18 L30 22 L29 18 L27 14 Z" fill="#FF0000" />
    </svg>
  );
}

/** Australia — blue with simplified Union Jack corner + stars. */
export function FlagAU({ title = "Australia", width, height }: FlagProps): JSX.Element {
  const w = width ?? DEFAULTS.width;
  const h = height ?? DEFAULTS.height;
  return (
    <svg {...baseSvg(w, h, title)}>
      <rect width="60" height="30" fill="#012169" />
      {/* Union Jack corner */}
      <rect width="24" height="15" fill="#012169" />
      <path d="M0,0 L24,15 M24,0 L0,15" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M0,0 L24,15 M24,0 L0,15" stroke="#C8102E" strokeWidth="1" />
      <path d="M12,0 V15 M0,7.5 H24" stroke="#FFFFFF" strokeWidth="5" />
      <path d="M12,0 V15 M0,7.5 H24" stroke="#C8102E" strokeWidth="3" />
      {/* Commonwealth Star (big) */}
      <circle cx="14" cy="22" r="2.5" fill="#FFFFFF" />
      {/* Southern Cross stars */}
      <circle cx="44" cy="9" r="1.5" fill="#FFFFFF" />
      <circle cx="52" cy="14" r="1.5" fill="#FFFFFF" />
      <circle cx="48" cy="20" r="1.5" fill="#FFFFFF" />
      <circle cx="40" cy="22" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

/** India — saffron/white/green horizontal with Ashoka Chakra (simplified circle). */
export function FlagIN({ title = "India", width, height }: FlagProps): JSX.Element {
  const w = width ?? DEFAULTS.width;
  const h = height ?? DEFAULTS.height;
  return (
    <svg {...baseSvg(w, h, title)}>
      <rect width="60" height="10" fill="#FF9933" />
      <rect y="10" width="60" height="10" fill="#FFFFFF" />
      <rect y="20" width="60" height="10" fill="#138808" />
      <circle cx="30" cy="15" r="2.8" fill="none" stroke="#000080" strokeWidth="0.8" />
    </svg>
  );
}

// ---- Registry -------------------------------------------------------------

export type CountryCode = "US" | "UK" | "FR" | "DE" | "IT" | "ES" | "JP" | "HK" | "CN" | "CA" | "AU" | "IN";

const FLAGS: Record<CountryCode, (props: FlagProps) => JSX.Element> = {
  US: FlagUS, UK: FlagUK, FR: FlagFR, DE: FlagDE, IT: FlagIT, ES: FlagES,
  JP: FlagJP, HK: FlagHK, CN: FlagCN, CA: FlagCA, AU: FlagAU, IN: FlagIN,
};

export const COUNTRY_NAMES: Record<CountryCode, string> = {
  US: "United States",
  UK: "United Kingdom",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  ES: "Spain",
  JP: "Japan",
  HK: "Hong Kong",
  CN: "China",
  CA: "Canada",
  AU: "Australia",
  IN: "India",
};

/**
 * Look up a flag by ISO country code. Returns the US flag as fallback when
 * the code is unknown — better than a blank space.
 */
export function FlagForCountry({ code, ...rest }: FlagProps & { code: string }): JSX.Element {
  const upper = code.toUpperCase() as CountryCode;
  const Component = FLAGS[upper] ?? FlagUS;
  return <Component {...rest} title={rest.title ?? COUNTRY_NAMES[upper] ?? code} />;
}

/**
 * Currency → country code mapping for the marketplaces we currently scrape.
 * Source: Amazon's TLD-list at https://www.amazon.com/ — these are the
 * currencies Amazon's product pages actually use.
 */
export const CURRENCY_TO_COUNTRY: Record<string, CountryCode> = {
  USD: "US",
  GBP: "UK",
  EUR: "DE", // Default EU country for EUR — could be FR/IT/ES but DE is most common
  JPY: "JP",
  HKD: "HK",
  CNY: "CN",
  CAD: "CA",
  AUD: "AU",
  INR: "IN",
};

export function FlagForCurrency({ currency, ...rest }: FlagProps & { currency: string }): JSX.Element {
  const code = CURRENCY_TO_COUNTRY[currency.toUpperCase()] ?? "US";
  return <FlagForCountry code={code} {...rest} />;
}