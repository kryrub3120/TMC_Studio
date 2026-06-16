/**
 * CookieConsentBanner — GDPR/ePrivacy compliant opt-in consent.
 *
 * Non-essential (analytics) cookies stay OFF until the user explicitly accepts.
 * Accept and Reject are given equal prominence (no dark pattern). The choice is
 * stored in localStorage and can be changed later from the Cookie Policy page.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@tmc/ui';

const STORAGE_KEY = 'tmc-cookie-consent';

export type CookieConsent = { analytics: boolean; ts: string };

export function getCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CookieConsent) : null;
  } catch {
    return null;
  }
}

export function CookieConsentBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getCookieConsent() === null) setVisible(true);
  }, []);

  const decide = (analytics: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics, ts: new Date().toISOString() }));
    } catch {
      /* ignore storage errors */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t('cookieBanner.label')}
      className="fixed inset-x-0 bottom-0 z-toast border-t border-border bg-surface/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base text-muted">
          {t('cookieBanner.message')}{' '}
          <Link to="/cookies" className="text-accent hover:underline">{t('cookieBanner.policy')}</Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide(false)}
            className="rounded-md border border-border px-4 py-2 text-base font-medium text-text transition-colors hover:bg-surface2"
          >
            {t('cookieBanner.reject')}
          </button>
          <button
            type="button"
            onClick={() => decide(true)}
            className="rounded-md bg-accent px-4 py-2 text-base font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {t('cookieBanner.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsentBanner;
