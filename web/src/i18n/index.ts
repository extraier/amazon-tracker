/**
 * i18n + theme — tiny dependency-free state for the Amazon Apple Tracker.
 *
 * Language:
 *   - Default: zh-Hant (Traditional Chinese, HK conventions)
 *   - Secondary: en
 *   - Persisted in localStorage; browser detection used only as a hint
 *
 * Theme (3-way):
 *   - light:  force Amazon-inspired light palette
 *   - dark:   force Bloomberg-terminal dark palette
 *   - system: follow OS preference via prefers-color-scheme
 *   - Default: "system" (respects user's OS, falls back to light on no-pref)
 *   - Persisted in localStorage
 *
 * Internally, we resolve "system" to either "light" or "dark" before applying
 * the data-theme attribute on <html>. The user-facing API stays 3-valued.
 *
 * Usage:
 *   import { useT, useLang, useTheme } from './i18n';
 *   const t = useT();
 *   const [theme, setTheme] = useTheme();
 *   return <h1>{t('title')}</h1>;
 */

import { useEffect, useState, useCallback } from "react";

export type Lang = "zh-Hant" | "en";
export type ThemeChoice = "light" | "dark" | "system";
export type Theme = "light" | "dark"; // resolved

const LANG_KEY = "amazon-tracker-lang";
const THEME_KEY = "amazon-tracker-theme";
const DEFAULT_LANG: Lang = "zh-Hant";
const DEFAULT_THEME: ThemeChoice = "system";

export const SUPPORTED_LANGS: Lang[] = ["zh-Hant", "en"];
export const SUPPORTED_THEMES: ThemeChoice[] = ["light", "dark", "system"];

export const LANG_LABEL: Record<Lang, string> = {
  "zh-Hant": "繁體",
  en: "EN",
};

// =====================================================================
// Language
// =====================================================================

function detectBrowserLang(): Lang {
  if (typeof navigator === "undefined") return DEFAULT_LANG;
  const candidates = [navigator.language, ...(navigator.languages || [])];
  for (const c of candidates) {
    const lower = c.toLowerCase();
    if (lower.startsWith("zh")) return "zh-Hant";
  }
  return DEFAULT_LANG;
}

function readStoredLang(): Lang | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(LANG_KEY);
    if (v && (SUPPORTED_LANGS as string[]).includes(v)) return v as Lang;
  } catch {}
  return null;
}

function writeStoredLang(lang: Lang) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LANG_KEY, lang); } catch {}
}

let currentLang: Lang = DEFAULT_LANG;
const langListeners = new Set<() => void>();

function initLang() {
  if (typeof window === "undefined") return;
  currentLang = readStoredLang() ?? detectBrowserLang();
}

function setLangInternal(lang: Lang) {
  currentLang = lang;
  writeStoredLang(lang);
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang === "zh-Hant" ? "zh-Hant" : "en";
  }
  langListeners.forEach((fn) => fn());
}

export function getLang(): Lang { return currentLang; }
export function setLang(lang: Lang) { setLangInternal(lang); }

export function useLang(): [Lang, (lang: Lang) => void] {
  const [lang, setLocalLang] = useState<Lang>(currentLang);
  useEffect(() => {
    const fn = () => setLocalLang(currentLang);
    langListeners.add(fn);
    return () => { langListeners.delete(fn); };
  }, []);
  const update = useCallback((l: Lang) => setLangInternal(l), []);
  return [lang, update];
}

// =====================================================================
// Theme — 3-way choice, resolved to 2-way application
// =====================================================================

/** Detect OS preference. Returns null if matchMedia isn't available. */
function detectSystemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): ThemeChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    if (v && (SUPPORTED_THEMES as string[]).includes(v)) return v as ThemeChoice;
  } catch {}
  return null;
}

function writeStoredTheme(theme: ThemeChoice) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(THEME_KEY, theme); } catch {}
}

/** Resolve a 3-way choice to a 2-way value (only "system" needs resolving). */
function resolveTheme(choice: ThemeChoice): Theme {
  return choice === "system" ? detectSystemTheme() : choice;
}

let currentChoice: ThemeChoice = DEFAULT_THEME;
let currentResolved: Theme = "light";
const themeListeners = new Set<() => void>();

function initTheme() {
  if (typeof window === "undefined") return;
  currentChoice = readStoredTheme() ?? DEFAULT_THEME;
  currentResolved = resolveTheme(currentChoice);
}

function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }
}

function setThemeInternal(choice: ThemeChoice) {
  const previousChoice = currentChoice;
  const previousResolved = currentResolved;
  currentChoice = choice;
  currentResolved = resolveTheme(choice);
  writeStoredTheme(choice);

  if (typeof document !== "undefined") {
    // Add a temporary 'theme-transitioning' class on <html> so CSS fades all
    // properties smoothly, then remove it after the transition completes.
    if (previousChoice !== choice || previousResolved !== currentResolved) {
      const html = document.documentElement;
      html.classList.add("theme-transitioning");
      applyTheme(currentResolved);
      // Force a reflow so the class change picks up before removing
      // (avoids some browsers collapsing the animation).
      void html.offsetWidth;
      window.setTimeout(() => {
        html.classList.remove("theme-transitioning");
      }, 220);
    } else {
      applyTheme(currentResolved);
    }
  }
  themeListeners.forEach((fn) => fn());
}

/** Called when the OS preference changes while user is on "system". */
function handleSystemChange() {
  if (currentChoice !== "system") return;
  const next = detectSystemTheme();
  if (next === currentResolved) return;
  currentResolved = next;
  if (typeof document !== "undefined") {
    const html = document.documentElement;
    html.classList.add("theme-transitioning");
    applyTheme(currentResolved);
    void html.offsetWidth;
    window.setTimeout(() => {
      html.classList.remove("theme-transitioning");
    }, 220);
  }
  themeListeners.forEach((fn) => fn());
}

export function getTheme(): Theme { return currentResolved; }
export function getThemeChoice(): ThemeChoice { return currentChoice; }
export function setTheme(choice: ThemeChoice) { setThemeInternal(choice); }

export function useTheme(): [ThemeChoice, (choice: ThemeChoice) => void] {
  const [choice, setLocalChoice] = useState<ThemeChoice>(currentChoice);
  useEffect(() => {
    const fn = () => setLocalChoice(currentChoice);
    themeListeners.add(fn);
    return () => { themeListeners.delete(fn); };
  }, []);
  const update = useCallback((c: ThemeChoice) => setThemeInternal(c), []);
  return [choice, update];
}

// =====================================================================
// Init on first import (client-side only)
// =====================================================================

if (typeof window !== "undefined") {
  initLang();
  initTheme();
  applyTheme(currentResolved);
  if (typeof document !== "undefined") {
    document.documentElement.lang = currentLang === "zh-Hant" ? "zh-Hant" : "en";
  }
  // Listen for OS theme changes when user is on "system"
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", handleSystemChange);
    else if (mq.addListener) mq.addListener(handleSystemChange); // Safari < 14
  }
}

// =====================================================================
// Translation strings
// =====================================================================

import zhHant from "./zh-Hant";
import en from "./en";

const STRINGS: Record<Lang, Record<string, string>> = { "zh-Hant": zhHant, en };

export function translate(lang: Lang, key: string): string {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

export function useT() {
  const [lang] = useLang();
  return (key: string) => translate(lang, key);
}