/**
 * LandingPage — public marketing page at `/`.
 *
 * Separated from the editor (now at `/app`) so the landing stays light and
 * SEO-friendly and does not load the Konva editor bundle.
 * All copy goes through the i18n layer (`@tmc/ui`); default language EN,
 * PL/ES served by browser/locale detection + LanguageSwitcher.
 */
import { Link } from 'react-router-dom';
import { useTranslation, LanguageSwitcher } from '@tmc/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useEffect } from 'react';
import { track, EVENTS } from '../lib/analytics';

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center rounded-sm border border-border bg-surface2 px-1.5 py-0.5 font-mono text-xs text-text">
    {children}
  </kbd>
);

function Pillar({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      <p className="mt-2 text-base text-muted">{desc}</p>
    </div>
  );
}

export function LandingPage() {
  const { t } = useTranslation();
  useDocumentMeta({ title: t('seo.landing.title'), description: t('seo.landing.description'), path: '/' });
  useEffect(() => { track(EVENTS.LANDING_VIEW); }, []);

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-modal focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        {t('landing.hero.ctaPrimary')}
      </a>

      {/* Header */}
      <header className="sticky top-0 z-topbar border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight text-text">TMC&nbsp;Studio</Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            <a href="#features" className="text-base text-muted hover:text-text">{t('landing.nav.features')}</a>
            <Link to="/pricing" className="text-base text-muted hover:text-text">{t('landing.nav.pricing')}</Link>
            <Link to="/download" className="text-base text-muted hover:text-text">{t('landing.nav.download')}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/app" className="rounded-md bg-accent px-4 py-2 text-base font-medium text-white transition-colors hover:bg-accent-hover">
              {t('landing.nav.openBoard')}
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            {t('landing.hero.titlePre')}
            <span className="text-accent">{t('landing.hero.titleHighlight')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">{t('landing.hero.subtitle')}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/app" className="rounded-md bg-accent px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-accent-hover">
              {t('landing.hero.ctaPrimary')}
            </Link>
            <Link to="/pricing" className="rounded-md border border-border px-6 py-3 text-lg font-medium text-text transition-colors hover:bg-surface">
              {t('landing.hero.ctaSecondary')}
            </Link>
          </div>
          {/* Demo placeholder — replaced by animated WebM/MP4 in S2 */}
          <div
            role="img"
            aria-label={t('landing.hero.demoAlt')}
            className="mx-auto mt-14 flex aspect-video w-full max-w-4xl items-center justify-center rounded-xl border border-border bg-surface text-muted shadow-lg"
          >
            <span className="font-mono text-sm">1 → P → A → Cmd+E</span>
          </div>
        </section>

        {/* How it works in 30s */}
        <section id="how" className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center text-3xl font-bold tracking-tight">{t('landing.how.title')}</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                { n: '1', k: 's1', kb: <Kbd>1–6</Kbd> },
                { n: '2', k: 's2', kb: <><Kbd>A</Kbd> <Kbd>R</Kbd></> },
                { n: '3', k: 's3', kb: <Kbd>Cmd+E</Kbd> },
              ].map((s) => (
                <li key={s.n} className="rounded-lg border border-border bg-surface p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{s.n}</span>
                    {s.kb}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{t(`landing.how.${s.k}Title`)}</h3>
                  <p className="mt-1 text-base text-muted">{t(`landing.how.${s.k}Desc`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pillars / features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight">{t('landing.pillars.title')}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Pillar title={t('landing.pillars.speedTitle')} desc={t('landing.pillars.speedDesc')} />
            <Pillar title={t('landing.pillars.stepsTitle')} desc={t('landing.pillars.stepsDesc')} />
            <Pillar title={t('landing.pillars.everywhereTitle')} desc={t('landing.pillars.everywhereDesc')} />
            <Pillar title={t('landing.pillars.shareTitle')} desc={t('landing.pillars.shareDesc')} />
          </div>
        </section>

        {/* Keyboard-first */}
        <section className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight">{t('landing.keyboard.title')}</h2>
            <p className="mt-4 text-lg text-muted">{t('landing.keyboard.desc')}</p>
            <p className="mt-4 text-base text-muted"><Kbd>Cmd+K</Kbd> — {t('landing.keyboard.palette')}</p>
          </div>
        </section>

        {/* Everywhere / download */}
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t('landing.everywhere.title')}</h2>
          <p className="mt-4 text-lg text-muted">{t('landing.everywhere.desc')}</p>
          <Link to="/download" className="mt-6 inline-block rounded-md border border-border px-6 py-3 text-lg font-medium text-text transition-colors hover:bg-surface">
            {t('landing.everywhere.cta')}
          </Link>
        </section>

        {/* Use cases */}
        <section className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center text-3xl font-bold tracking-tight">{t('landing.useCases.title')}</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <Pillar title={t('landing.useCases.coachesTitle')} desc={t('landing.useCases.coachesDesc')} />
              <Pillar title={t('landing.useCases.creatorsTitle')} desc={t('landing.useCases.creatorsDesc')} />
              <Pillar title={t('landing.useCases.clubsTitle')} desc={t('landing.useCases.clubsDesc')} />
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section id="pricing" className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t('landing.pricingTeaser.title')}</h2>
          <p className="mt-4 text-lg text-muted">{t('landing.pricingTeaser.desc')}</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/app" className="rounded-md bg-accent px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-accent-hover">
              {t('landing.hero.ctaPrimary')}
            </Link>
            <Link to="/pricing" className="rounded-md border border-border px-6 py-3 text-lg font-medium text-text transition-colors hover:bg-surface">
              {t('landing.pricingTeaser.cta')}
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-lg font-bold">TMC Studio</div>
            <p className="mt-2 max-w-xs text-base text-muted">{t('landing.footer.tagline')}</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Legal">
            <Link to="/privacy" className="text-base text-muted hover:text-text">{t('footer.privacy')}</Link>
            <Link to="/terms" className="text-base text-muted hover:text-text">{t('footer.terms')}</Link>
            <Link to="/cookies" className="text-base text-muted hover:text-text">{t('footer.cookies')}</Link>
            <Link to="/refunds" className="text-base text-muted hover:text-text">{t('landing.footer.refunds')}</Link>
            <Link to="/legal" className="text-base text-muted hover:text-text">{t('landing.footer.legalNotice')}</Link>
            <Link to="/accessibility" className="text-base text-muted hover:text-text">{t('landing.footer.accessibility')}</Link>
            <Link to="/download" className="text-base text-muted hover:text-text">{t('footer.download')}</Link>
          </nav>
        </div>
        <div className="border-t border-border px-4 py-4 text-center text-sm text-muted">
          © {new Date().getFullYear()} TMC Studio · {t('landing.footer.rights')}
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
