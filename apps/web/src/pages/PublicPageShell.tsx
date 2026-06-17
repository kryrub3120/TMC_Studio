import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LanguageSwitcher, useTranslation } from '@tmc/ui';

export const LEGAL_UPDATED_AT = 'June 16, 2026';

export const CONTACT_EMAILS = {
  support: 'support@tacticsmadeclear.store',
  privacy: 'privacy@tacticsmadeclear.store',
  legal: 'legal@tacticsmadeclear.store',
} as const;

export const COMPANY_DETAILS = {
  name: 'SPORTPREDICTOR SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ',
  displayName: 'SPORTPREDICTOR SP. Z O.O.',
  krs: '0000945245',
  nip: '8982272393',
  regon: '520952838',
  address: 'Marii Curie-Skłodowskiej 12, 50-381 Wrocław, Polska',
  registeredAt: '10 stycznia 2022 r.',
} as const;

/**
 * Force DARK theme while mounted (brand v1.1 is dark-first).
 * Restores the previous theme on unmount.
 */
export function usePublicDarkTheme() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    const body = document.body;
    const hadDark = html.classList.contains('dark');
    const previousColorScheme = html.style.colorScheme;

    html.classList.add('dark');
    html.style.colorScheme = 'dark';
    body.classList.remove('bg-surface', 'text-text');

    return () => {
      if (hadDark) html.classList.add('dark');
      else html.classList.remove('dark');
      html.style.colorScheme = previousColorScheme;
    };
  }, []);
}

export function usePublicLightTheme() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    const body = document.body;
    const hadDark = html.classList.contains('dark');
    const previousColorScheme = html.style.colorScheme;

    html.classList.remove('dark');
    html.style.colorScheme = 'light';
    body.classList.remove('bg-gray-900', 'text-white');
    body.classList.add('bg-surface', 'text-text');

    return () => {
      if (hadDark) html.classList.add('dark');
      else html.classList.remove('dark');
      html.style.colorScheme = previousColorScheme;
      body.classList.remove('bg-surface', 'text-text');
    };
  }, []);
}

interface PublicPageShellProps {
  title: string;
  description?: string;
  updatedAt?: string;
  children: ReactNode;
}

export function PublicPageShell({ title, description, updatedAt, children }: PublicPageShellProps) {
  const { t } = useTranslation();
  usePublicDarkTheme();

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      <header className="sticky top-0 z-topbar border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight text-text">TMC&nbsp;Studio</Link>
          <nav className="hidden items-center gap-5 md:flex" aria-label="Public navigation">
            <Link to="/pricing" className="text-sm font-medium text-muted hover:text-text">
              {t('landing.nav.pricing')}
            </Link>
            <Link to="/privacy" className="text-sm font-medium text-muted hover:text-text">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="text-sm font-medium text-muted hover:text-text">
              {t('footer.terms')}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/app" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
              {t('landing.nav.openBoard')}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 border-b border-border pb-8">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-text">
            <span aria-hidden="true">←</span>
            {t('legal.back')}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-text sm:text-5xl">{title}</h1>
          {description && <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{description}</p>}
          {updatedAt && <p className="mt-4 text-sm text-muted">{t('legal.updated', { date: updatedAt })}</p>}
        </div>

        <div className="space-y-8">{children}</div>

        <CompanyPanel />
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight text-text">{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-7 text-muted">{children}</div>
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 text-muted">{children}</ul>;
}

export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="font-medium text-accent hover:text-accent-hover hover:underline">
      {children}
    </a>
  );
}

function CompanyPanel() {
  return (
    <aside className="mt-10 rounded-lg border border-border bg-surface p-5 text-sm leading-6 text-muted shadow-sm">
      <p className="font-semibold text-text">{COMPANY_DETAILS.displayName}</p>
      <p>{COMPANY_DETAILS.address}</p>
      <p>KRS: {COMPANY_DETAILS.krs} · NIP: {COMPANY_DETAILS.nip} · REGON: {COMPANY_DETAILS.regon}</p>
    </aside>
  );
}
