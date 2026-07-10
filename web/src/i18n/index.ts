/**
 * i18n + theme — tiny dependency-free state for the Amazon Apple Tracker.
 *
 * Language:
 *   - Default: zh-Hant (Traditional Chinese, HK conventions)
 *   - Secondary: en
 *   - Persisted in localStorage; browser detection used only as a hint
 *
 * Theme:
 *   - Default: "light" (Amazon-themed)
 *   - Secondary: "dark" (Bloomberg terminal style)
 *   - Persisted in localStorage; no auto-detection (explicit choice only)
 *
 * Usage:
 *   import { useT, useLang, useTheme } from './i18n';
 *   const t = useT();
 *   const [theme, setTheme] = useTheme();
 *   return <h1>{t('title')}</h1>;
 */

import { useEffect, useState, useCallback } from "react";

export type Lang = "zh-Hant" | "en";
export type Theme = "light" | "dark";

const LANG_KEY = "amazon-tracker-lang";
const THEME_KEY = "amazon-tracker-theme";
const DEFAULT_LANG: Lang = "zh-Hant";
const DEFAULT_THEME: Theme = "light";

export const SUPPORTED_LANGS: Lang[] = ["zh-Hant", "en"];
export const SUPPORTED_THEMES: Theme[] = ["light", "dark"];

export const LANG_LABEL: Record<Lang, string> = {
  "zh-Hant": "繁體",
  en: "EN",
};

// =====================================================================
// Language
// =====================================================================

/**
 * Detect the user's preferred language from the browser.
 * We use this ONLY as a hint — we never override the explicit default
 * (zh-Hant) just because the browser says English. The site is HK-centric.
 */
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
// Theme
// =====================================================================

function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    if (v && (SUPPORTED_THEMES as string[]).includes(v)) return v as Theme;
  } catch {}
  return null;
}

function writeStoredTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(THEME_KEY, theme); } catch {}
}

let currentTheme: Theme = DEFAULT_THEME;
const themeListeners = new Set<() => void>();

function initTheme() {
  if (typeof window === "undefined") return;
  currentTheme = readStoredTheme() ?? DEFAULT_THEME;
}

function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
    // Color-scheme hint for native form controls & scrollbars
    document.documentElement.style.colorScheme = theme;
  }
}

function setThemeInternal(theme: Theme) {
  currentTheme = theme;
  writeStoredTheme(theme);
  applyTheme(theme);
  themeListeners.forEach((fn) => fn());
}

export function getTheme(): Theme { return currentTheme; }
export function setTheme(theme: Theme) { setThemeInternal(theme); }

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setLocalTheme] = useState<Theme>(currentTheme);
  useEffect(() => {
    const fn = () => setLocalTheme(currentTheme);
    themeListeners.add(fn);
    return () => { themeListeners.delete(fn); };
  }, []);
  const update = useCallback((t: Theme) => setThemeInternal(t), []);
  return [theme, update];
}

// =====================================================================
// Init on first import (client-side only)
// =====================================================================

if (typeof window !== "undefined") {
  initLang();
  initTheme();
  applyTheme(currentTheme);
  // Make sure lang is reflected on <html> on first paint too
  if (typeof document !== "undefined") {
    document.documentElement.lang = currentLang === "zh-Hant" ? "zh-Hant" : "en";
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