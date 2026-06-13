/**
 * LanguageSwitcher - flag dropdown for the top bar.
 * Self-contained: reads/writes language via the i18n context.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation, LANGUAGES, type Language } from './i18n.js';

/** Small inline SVG flags (never emoji — emoji render inconsistently across OS). */
const Flag: React.FC<{ lang: Language; className?: string }> = ({ lang, className }) => {
  const common = { viewBox: '0 0 20 14', className, preserveAspectRatio: 'none' as const };
  if (lang === 'pl') {
    return (
      <svg {...common}>
        <rect width="20" height="7" fill="#ffffff" />
        <rect y="7" width="20" height="7" fill="#dc143c" />
      </svg>
    );
  }
  if (lang === 'es') {
    return (
      <svg {...common}>
        <rect width="20" height="14" fill="#c60b1e" />
        <rect y="3.5" width="20" height="7" fill="#ffc400" />
      </svg>
    );
  }
  // en — St George's cross (recognisable, simple)
  return (
    <svg {...common}>
      <rect width="20" height="14" fill="#ffffff" />
      <rect x="8" width="4" height="14" fill="#ce1124" />
      <rect y="5" width="20" height="4" fill="#ce1124" />
    </svg>
  );
};

const ChevronDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const Check: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted hover:text-text hover:bg-surface2 transition-colors"
        title={t('common.language')}
        aria-label={t('common.language')}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="w-5 h-3.5 rounded-sm overflow-hidden border border-border inline-flex">
          <Flag lang={language} className="w-full h-full" />
        </span>
        <span className="text-xs font-medium uppercase">{language}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('common.language')}
          className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-lg shadow-lg p-1 z-floating"
        >
          {LANGUAGES.map((lng) => {
            const active = lng === language;
            return (
              <button
                key={lng}
                role="option"
                aria-selected={active}
                onClick={() => {
                  setLanguage(lng);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                  active ? 'bg-surface2 text-text' : 'text-muted hover:text-text hover:bg-surface2'
                }`}
              >
                <span className="w-5 h-3.5 rounded-sm overflow-hidden border border-border inline-flex">
                  <Flag lang={lng} className="w-full h-full" />
                </span>
                <span className="flex-1 text-left">{t(`languages.${lng}`)}</span>
                {active && <Check className="w-4 h-4 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
