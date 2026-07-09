/**
 * i18n — tiny dependency-free i18n for the Amazon Apple Tracker.
 * Default language: zh-Hant (Traditional Chinese, HK conventions).
 * Secondary: en. Toggle persisted in localStorage; falls back to browser,
 * then to zh-Hant.
 *
 * Usage:
 *   import { useT, useLang, setLang } from './i18n';
 *   const t = useT();
 *   return <h1>{t('title')}</h1>;
 */

import { useEffect, useState, useCallback } from "react";

export type Lang = "zh-Hant" | "en";

const STORAGE_KEY = "amazon-tracker-lang";
const DEFAULT_LANG: Lang = "zh-Hant";

export const SUPPORTED_LANGS: Lang[] = ["zh-Hant", "en"];

export const LANG_LABEL: Record<Lang, string> = {
  "zh-Hant": "繁體",
  en: "EN",
};

/**
 * Detect the user's preferred language from the browser.
 * We use this ONLY as a hint — we never override the explicit default
 * (zh-Hant) just because the browser says English. The site is HK-centric.
 */
function detectBrowserLang(): Lang {
  if (typeof navigator === "undefined") return DEFAULT_LANG;
  const candidates = [
    navigator.language,
    ...(navigator.languages || []),
  ];
  for (const c of candidates) {
    const lower = c.toLowerCase();
    if (lower.startsWith("zh")) {
      // Any Chinese variant → Traditional Chinese (HK conventions)
      return "zh-Hant";
    }
  }
  // For any non-Chinese browser language, stay on the site default
  // (zh-Hant). Users can switch to English via the toggle.
  return DEFAULT_LANG;
}

function readStoredLang(): Lang | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && (SUPPORTED_LANGS as string[]).includes(v)) {
      return v as Lang;
    }
  } catch {
    // localStorage blocked — ignore
  }
  return null;
}

function writeStoredLang(lang: Lang) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

// Module-level state so all components share one observer
let currentLang: Lang = DEFAULT_LANG;
const listeners = new Set<() => void>();

function init() {
  if (typeof window === "undefined") return;
  const stored = readStoredLang();
  currentLang = stored ?? detectBrowserLang();
}

function setLangInternal(lang: Lang) {
  currentLang = lang;
  writeStoredLang(lang);
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang === "zh-Hant" ? "zh-Hant" : "en";
  }
  listeners.forEach((fn) => fn());
}

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang) {
  setLangInternal(lang);
}

/** React hook: returns the current language. Re-renders on change. */
export function useLang(): [Lang, (lang: Lang) => void] {
  const [lang, setLocalLang] = useState<Lang>(currentLang);
  useEffect(() => {
    const fn = () => setLocalLang(currentLang);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  const update = useCallback((l: Lang) => setLangInternal(l), []);
  return [lang, update];
}

// Initialise on first import (client-side only)
if (typeof window !== "undefined") {
  init();
}

// Re-export types and translation files
import zhHant from "./zh-Hant";
import en from "./en";

const STRINGS: Record<Lang, Record<string, string>> = { "zh-Hant": zhHant, en };

/**
 * Translate a key. Falls back to the key itself if missing — easy to spot
 * missing translations in development.
 */
export function translate(lang: Lang, key: string): string {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

/** React hook: returns a `t(key)` function bound to the current language. */
export function useT() {
  const [lang] = useLang();
  return (key: string) => translate(lang, key);
}
