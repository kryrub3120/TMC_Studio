/**
 * Lightweight, zero-dependency i18n layer for TMC Studio.
 *
 * The public API intentionally mirrors react-i18next (`useTranslation().t`,
 * `i18n.changeLanguage`) so the engine can later be swapped for react-i18next
 * — for the macOS / Android / desktop builds — without touching call sites.
 * Translation dictionaries live in ./locales and are plain JSON-shaped objects,
 * so they are reusable across web, React Native and Electron/Tauri.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { en } from './locales/en.js';
import { pl } from './locales/pl.js';
import { es } from './locales/es.js';

export type Language = 'en' | 'pl' | 'es';
export const LANGUAGES: Language[] = ['pl', 'en', 'es'];

const dictionaries: Record<Language, unknown> = { en, pl, es };
const STORAGE_KEY = 'tmc-language';

function detectInitial(): Language {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && LANGUAGES.includes(saved)) return saved;
    } catch {
      /* ignore storage errors */
    }
    const nav = (navigator?.language || 'en').slice(0, 2).toLowerCase();
    if (nav === 'pl' || nav === 'es') return nav;
  }
  return 'en';
}

function resolve(dict: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>(
    (acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined),
    dict
  );
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{{${k}}}`));
}

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

function makeT(language: Language): TFunction {
  return (key, vars) => {
    const val = resolve(dictionaries[language], key) ?? resolve(dictionaries.en, key) ?? key;
    return typeof val === 'string' ? interpolate(val, vars) : key;
  };
}

/** Non-React translation helper for stores/services that cannot use hooks. */
export function translate(key: string, vars?: Record<string, string | number>, language?: Language): string {
  return makeT(language ?? detectInitial())(key, vars);
}

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TFunction;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(detectInitial);

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const t = useCallback<TFunction>((key, vars) => makeT(language)(key, vars), [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>
  );
};

/** Mirrors react-i18next's useTranslation(); safe to use without a provider. */
export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    const t = makeT('en');
    return {
      t,
      language: 'en' as Language,
      setLanguage: (_lang: Language) => {},
      i18n: { language: 'en' as Language, changeLanguage: (_lang: Language) => {} },
    };
  }
  return {
    t: ctx.t,
    language: ctx.language,
    setLanguage: ctx.setLanguage,
    i18n: { language: ctx.language, changeLanguage: ctx.setLanguage },
  };
}
