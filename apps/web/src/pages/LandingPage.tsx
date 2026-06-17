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
import { usePublicDarkTheme } from './PublicPageShell';

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center rounded-sm border border-border bg-surface2 px-1.5 py-0.5 font-mono text-xs text-text">
    {children}
  </kbd>
);

const I = ({ d }: { d: string }) => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.split('|').map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const ICONS = {
  players: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8|M22 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75',
  movement: 'M5 19 19 5|M12 5h7v7',
  export: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M7 10l5 5 5-5|M12 15V3',
  speed: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  steps: 'M3 6h18|M3 12h18|M3 18h18',
  everywhere: 'M2 4h20v12H2z|M8 20h8|M12 16v4',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8|M16 6l-4-4-4 4|M12 2v13',
} as const;

const IconTile = ({ d }: { d: string }) => (
  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
    <I d={d} />
  </span>
);

function Pillar({ title, desc, icon }: { title: string; desc: string; icon?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent/40">
      {icon && <div className="mb-3"><IconTile d={icon} /></div>}
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      <p className="mt-2 text-base text-muted">{desc}</p>
    </div>
  );
}

/** Animated, brand-styled product demo that loops: place players → draw a tactic → export. */
function HeroDemo({ label }: { label: string }) {
  const home = '#e63946';
  const away = '#457b9d';
  const players = [
    { cx: 150, cy: 225, n: '1', fill: home, d: 0.0 },
    { cx: 250, cy: 130, n: '4', fill: home, d: 0.15 },
    { cx: 250, cy: 320, n: '5', fill: home, d: 0.25 },
    { cx: 360, cy: 225, n: '8', fill: home, d: 0.35 },
    { cx: 470, cy: 150, n: '7', fill: home, d: 0.45 },
    { cx: 470, cy: 300, n: '11', fill: home, d: 0.5 },
    { cx: 560, cy: 225, n: '9', fill: home, d: 0.6 },
    { cx: 600, cy: 130, n: '6', fill: away, d: 0.7 },
    { cx: 620, cy: 320, n: '3', fill: away, d: 0.8 },
  ];
  return (
    <div
      role="img"
      aria-label={label}
      className="mx-auto mt-14 w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
    >
      <svg viewBox="0 0 800 450" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes hd-pop { 0%,8% { opacity:0; transform:scale(.4);} 16%,100% { opacity:1; transform:scale(1);} }
          @keyframes hd-draw { 0%,30% { stroke-dashoffset:520;} 55%,100% { stroke-dashoffset:0;} }
          @keyframes hd-head { 0%,52% { opacity:0;} 60%,100% { opacity:1;} }
          @keyframes hd-chip { 0%,68% { opacity:0; transform:translateY(8px) scale(.9);} 76%,94% { opacity:1; transform:translateY(0) scale(1);} 100% { opacity:0; } }
          .hd-p { animation: hd-pop 6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
          .hd-arrow { stroke-dasharray:520; animation: hd-draw 6s ease-in-out infinite; }
          .hd-arrowhead { animation: hd-head 6s ease-in-out infinite; }
          .hd-chip { animation: hd-chip 6s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce){ .hd-p,.hd-arrow,.hd-arrowhead,.hd-chip{ animation:none; opacity:1; stroke-dashoffset:0;} }
        `}</style>

        {/* Pitch */}
        <rect x="40" y="40" width="720" height="370" rx="12" fill="var(--color-pitch)" fillOpacity="0.10" stroke="var(--color-border)" strokeWidth="2" />
        <line x1="400" y1="40" x2="400" y2="410" stroke="var(--color-muted)" strokeWidth="1.5" strokeOpacity="0.5" />
        <circle cx="400" cy="225" r="48" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeOpacity="0.5" />
        <circle cx="400" cy="225" r="3" fill="var(--color-muted)" fillOpacity="0.6" />
        <rect x="40" y="150" width="74" height="150" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeOpacity="0.45" />
        <rect x="686" y="150" width="74" height="150" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeOpacity="0.45" />

        {/* Players */}
        {players.map((p) => (
          <g key={p.n} className="hd-p" style={{ animationDelay: `${p.d * 6 * 0.16}s` }}>
            <circle cx={p.cx} cy={p.cy} r="15" fill={p.fill} stroke="#fff" strokeWidth="2" />
            <text x={p.cx} y={p.cy + 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">{p.n}</text>
          </g>
        ))}

        {/* Tactical arrow (hero) */}
        <path className="hd-arrow" d="M 360 225 C 430 150, 510 150, 560 200" fill="none"
          stroke="var(--color-accent)" strokeWidth="5" strokeLinecap="round" />
        <polygon className="hd-arrowhead" points="572,188 548,206 566,214" fill="var(--color-accent)" />

        {/* Export chip */}
        <g className="hd-chip">
          <rect x="318" y="392" width="164" height="34" rx="17" fill="var(--color-accent)" />
          <text x="400" y="414" textAnchor="middle" fontSize="14" fontWeight="700" fill="#062016">PNG · GIF · PDF</text>
        </g>
      </svg>
    </div>
  );
}

export function LandingPage() {
  const { t } = useTranslation();
  usePublicDarkTheme();
  useDocumentMeta({ title: t('seo.landing.title'), description: t('seo.landing.description'), path: '/' });
  useEffect(() => { track(EVENTS.LANDING_VIEW); }, []);

  // Structured data for SEO: SoftwareApplication + FAQPage
  useEffect(() => {
    const faqData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'TMC Studio',
          applicationCategory: 'Multimedia',
          operatingSystem: 'Web, macOS, Windows',
          offers: {
            '@type': 'AggregateOffer',
            offer: [
              { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
              { '@type': 'Offer', name: 'Pro', price: '9', priceCurrency: 'USD' },
              { '@type': 'Offer', name: 'Team', price: '29', priceCurrency: 'USD' },
            ],
            priceCurrency: 'USD',
          },
          description: t('seo.landing.description'),
          url: 'https://tmcstudio.app/',
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: t('pricingPage.faq.q1'), acceptedAnswer: { '@type': 'Answer', text: t('pricingPage.faq.a1') } },
            { '@type': 'Question', name: t('pricingPage.faq.q2'), acceptedAnswer: { '@type': 'Answer', text: t('pricingPage.faq.a2') } },
            { '@type': 'Question', name: t('pricingPage.faq.q3'), acceptedAnswer: { '@type': 'Answer', text: t('pricingPage.faq.a3') } },
            { '@type': 'Question', name: t('pricingPage.faq.q4'), acceptedAnswer: { '@type': 'Answer', text: t('pricingPage.faq.a4') } },
          ],
        },
      ],
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'tmc-structured-data';
    script.textContent = JSON.stringify(faqData);
    document.head.appendChild(script);
    return () => { document.head.querySelector('#tmc-structured-data')?.remove(); };
  }, [t]);

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
          {/* Animated product demo — formation -> tactical arrow -> export, looping */}
          <HeroDemo label={t('landing.hero.demoAlt')} />
        </section>

        {/* How it works in 30s */}
        <section id="how" className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center text-3xl font-bold tracking-tight">{t('landing.how.title')}</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3" role="list">
              {[{n:'1',k:'s1',icon:ICONS.players,kb:<Kbd>1–6</Kbd>},{n:'2',k:'s2',icon:ICONS.movement,kb:<><Kbd>A</Kbd> <Kbd>R</Kbd></>},{n:'3',k:'s3',icon:ICONS.export,kb:<Kbd>Cmd+E</Kbd>}].map((s)=>(
                <li key={s.n} className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <IconTile d={s.icon} />
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">{s.n}</span>
                    </div>
                    {s.kb}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{t(`landing.how.${s.k}Title`)}</h3>
                  <p className="mt-1 text-base text-muted">{t(`landing.how.${s.k}Desc`)}</p>
                </li>
              ))}
            </div>
          </div>
        </section>

        {/* Pillars / features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight">{t('landing.pillars.title')}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Pillar icon={ICONS.speed} title={t('landing.pillars.speedTitle')} desc={t('landing.pillars.speedDesc')} />
            <Pillar icon={ICONS.steps} title={t('landing.pillars.stepsTitle')} desc={t('landing.pillars.stepsDesc')} />
            <Pillar icon={ICONS.everywhere} title={t('landing.pillars.everywhereTitle')} desc={t('landing.pillars.everywhereDesc')} />
            <Pillar icon={ICONS.share} title={t('landing.pillars.shareTitle')} desc={t('landing.pillars.shareDesc')} />
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
