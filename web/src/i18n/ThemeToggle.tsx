import { useTheme, useT, type Theme } from "./index";

// Inline SVG icons so we don't need to add an icon library
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

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const t = useT();
  const isLight = theme === "light";
  // Show the OTHER theme as the action — what you'll get by clicking.
  // Icon: current theme (sun = currently light, moon = currently dark)
  return (
    <button
      className="theme-btn active"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      title={isLight ? t("themeDark") : t("themeLight")}
      aria-label={t("themeAria")}
      aria-pressed={isLight}
    >
      {isLight ? <SunIcon /> : <MoonIcon />}
      <span style={{ marginLeft: 4 }}>{isLight ? t("themeLight") : t("themeDark")}</span>
    </button>
  );
}