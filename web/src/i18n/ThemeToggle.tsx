import { useTheme, useT, SUPPORTED_THEMES, type ThemeChoice } from "./index";

// Three inline SVG icons so we don't need to add an icon library.
const SunIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm0 1.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0Zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm8-5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8ZM2.75 7.25a.75.75 0 0 1-.75.75H.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75ZM14.95 2.05a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM3.17 13.83a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0Zm11.78 0a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 0 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06ZM3.17 2.05a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06L3.17 3.11a.75.75 0 0 1 0-1.06Z" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M6 0a6 6 0 1 0 6 6c0-.33-.03-.65-.08-.96A5.5 5.5 0 0 1 4.96 7.92 5.92 5.92 0 0 0 6 0Zm0 1.5A4.5 4.5 0 0 0 5.36 9.43l.16.13.18-.03A7 7 0 0 0 10.5 4.65l.03-.18-.13-.16A4.5 4.5 0 0 0 6 1.5Z" />
  </svg>
);

// Half-sun, half-moon — classic OS "auto" indicator
const AutoIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <circle cx="8" cy="8" r="4" />
    <path
      d="M8 0a8 8 0 0 0 0 16V0Z"
      opacity="0.55"
    />
  </svg>
);

const ICONS: Record<ThemeChoice, () => JSX.Element> = {
  light: SunIcon,
  dark: MoonIcon,
  system: AutoIcon,
};

export function ThemeToggle() {
  const [choice, setChoice] = useTheme();
  const t = useT();
  return (
    <div className="theme-toggle" role="group" aria-label={t("themeAria")}>
      {SUPPORTED_THEMES.map((c, i) => {
        const Icon = ICONS[c];
        const label = c === "light" ? t("themeLight") : c === "dark" ? t("themeDark") : t("themeAuto");
        return (
          <span key={c} style={{ display: "inline-flex", alignItems: "center" }}>
            {i > 0 && <span className="lang-sep">·</span>}
            <button
              className={`theme-btn ${choice === c ? "active" : ""}`}
              onClick={() => setChoice(c)}
              aria-pressed={choice === c}
              title={label}
            >
              <Icon />
              <span style={{ marginLeft: 4 }}>{label}</span>
            </button>
          </span>
        );
      })}
    </div>
  );
}