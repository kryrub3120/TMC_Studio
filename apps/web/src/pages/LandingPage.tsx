/**
 * LandingPage — public marketing page at `/`.
 *
 * Complete redesign with outcome-focused copy, large hero demo,
 * credibility bar, feature spotlights, FAQ, and final CTA band.
 * Style: Linear/Vercel – whitespace, scale typography, alternating spotlights.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, LanguageSwitcher, DISPLAY_PRICES } from '@tmc/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { track, EVENTS } from '../lib/analytics';
import { usePublicDarkTheme, PublicFooter } from './PublicPageShell';

/* ---------- micro components ---------- */

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
  check: 'M20 6L9 17l-5-5',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  keyboard: 'M4 6h16v12H4z|M6 10h.01|M10 10h.01|M14 10h.01|M18 10h.01|M6 14h.01|M10 14h.01M14 14h.01|M18 14h.01|M6 18h12',
  layers: 'M12 2l9 5-9 5-9-5z|M3 12l9 5 9-5|M3 17l9 5 9-5',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z|M2 12h20|M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
} as const;

const IconTile = ({ d }: { d: string }) => (
  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
    <I d={d} />
  </span>
);

/* ---------- Hero demo (ENHANCED: larger, wider, more players, steps) ---------- */

/** Animated hero demo — large, prominent, loops through formation+arrow+steps+export. */
function HeroDemo({ label }: { label: string }) {
  const home = '#e63946';
  const away = '#457b9d';
  const players = [
    { cx: 150, cy: 225, n: '1', fill: home, d: 0.0 },
    { cx: 250, cy: 130, n: '4', fill: home, d: 0.12 },
    { cx: 250, cy: 320, n: '5', fill: home, d: 0.2 },
    { cx: 360, cy: 80, n: '8', fill: home, d: 0.28 },
    { cx: 360, cy: 370, n: '11', fill: home, d: 0.34 },
    { cx: 470, cy: 150, n: '7', fill: home, d: 0.4 },
    { cx: 470, cy: 300, n: '9', fill: home, d: 0.46 },
    { cx: 560, cy: 225, n: '6', fill: away, d: 0.52 },
    { cx: 600, cy: 130, n: '3', fill: away, d: 0.58 },
    { cx: 620, cy: 320, n: '2', fill: away, d: 0.64 },
  ];
  return (
    <div
      role="img"
      aria-label={label}
      className="mx-auto mt-14 w-full max-w-6xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      style={{ aspectRatio: '800/450' }}
    >
      <svg viewBox="0 0 800 450" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes hd-pop { 0%,6% { opacity:0; transform:scale(.3);} 14%,100% { opacity:1; transform:scale(1);} }
          @keyframes hd-draw { 0%,25% { stroke-dashoffset:560;} 50%,100% { stroke-dashoffset:0;} }
          @keyframes hd-head { 0%,40% { opacity:0;} 55%,100% { opacity:1;} }
          @keyframes hd-chip { 0%,55% { opacity:0; transform:translateY(10px) scale(.85);} 68%,90% { opacity:1; transform:translateY(0) scale(1);} 100% { opacity:0; } }
          @keyframes hd-step { 0%,48% { opacity:0;} 58%,100% { opacity:1;} }
          .hd-p { animation: hd-pop 7s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
          .hd-arrow { stroke-dasharray:560; animation: hd-draw 7s ease-in-out infinite; }
          .hd-arrowhead { animation: hd-head 7s ease-in-out infinite; }
          .hd-chip { animation: hd-chip 7s ease-in-out infinite; }
          .hd-step-label { animation: hd-step 7s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce){ .hd-p,.hd-arrow,.hd-arrowhead,.hd-chip,.hd-step-label{ animation:none; opacity:1; stroke-dashoffset:0;} }
        `}</style>

        {/* Pitch background */}
        <rect x="40" y="40" width="720" height="370" rx="12" fill="var(--color-pitch)" fillOpacity="0.10" stroke="var(--color-border)" strokeWidth="2" />
        <line x1="400" y1="40" x2="400" y2="410" stroke="var(--color-muted)" strokeWidth="1.5" strokeOpacity="0.5" />
        <circle cx="400" cy="225" r="48" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeOpacity="0.5" />
        <circle cx="400" cy="225" r="3" fill="var(--color-muted)" fillOpacity="0.6" />
        <rect x="40" y="150" width="74" height="150" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeOpacity="0.45" />
        <rect x="686" y="150" width="74" height="150" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeOpacity="0.45" />

        {/* Step indicator */}
        <g className="hd-step-label">
          <rect x="318" y="54" width="164" height="30" rx="15" fill="var(--color-accent)" fillOpacity="0.15" />
          <text x="400" y="74" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--color-accent)">Step 2 — 1:2 → 1:3</text>
        </g>

        {/* Players */}
        {players.map((p) => (
          <g key={p.n} className="hd-p" style={{ animationDelay: `${p.d * 7 * 0.14}s` }}>
            <circle cx={p.cx} cy={p.cy} r="15" fill={p.fill} stroke="#fff" strokeWidth="2" />
            <text x={p.cx} y={p.cy + 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">{p.n}</text>
          </g>
        ))}

        {/* Tactical arrow */}
        <path className="hd-arrow" d="M 360 225 C 420 130, 510 150, 560 200" fill="none"
          stroke="var(--color-accent)" strokeWidth="5" strokeLinecap="round" />
        <polygon className="hd-arrowhead" points="572,188 548,206 566,214" fill="var(--color-accent)" />

        {/* Second arrow */}
        <path className="hd-arrow" d="M 360 80 C 430 80, 480 130, 470 200" fill="none"
          stroke="var(--color-accent)" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 4"
          style={{ animationDelay: '0.5s' }} />
        <polygon className="hd-arrowhead" points="472,212 458,206 482,200" fill="var(--color-accent)"
          style={{ animationDelay: '0.5s' }} />

        {/* Export chip */}
        <g className="hd-chip">
          <rect x="318" y="392" width="164" height="34" rx="17" fill="var(--color-accent)" />
          <text x="400" y="414" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">PNG · GIF · PDF</text>
        </g>
      </svg>
    </div>
  );
}

/* ---------- Section helpers ---------- */

function Section({ id, className = '', children }: { id?: string; className?: string; children: React.ReactNode }) {
  return <section id={id} className={`py-20 md:py-24 ${className}`}>{children}</section>;
}

function Pillar({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-accent/40">
      <IconTile d={icon} />
      <h3 className="mt-4 text-lg font-semibold text-text">{title}</h3>
      <p className="mt-2 text-base leading-relaxed text-muted">{desc}</p>
    </div>
  );
}

/* ---------- Main page ---------- */

export function LandingPage() {
  const { t } = useTranslation();
  usePublicDarkTheme();
  useDocumentMeta({ title: t('seo.landing.title'), description: t('seo.landing.description'), path: '/' });
  useEffect(() => { track(EVENTS.LANDING_VIEW); }, []);

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // Structured data
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
          mainEntity: ['1','2','3','4','5','6'].map((i) => ({
            '@type': 'Question',
            name: t(`landing.faq.q${i}`),
            acceptedAnswer: { '@type': 'Answer', text: t(`landing.faq.a${i}`) },
          })),
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

  const CtaPrimary = () => (
    <Link to="/app" className="inline-flex items-center rounded-lg bg-accent px-6 py-3 text-base font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-lg">
      {t('landing.hero.ctaPrimary')}
      <I d={ICONS.arrowRight} />
    </Link>
  );

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-modal focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        {t('landing.hero.ctaPrimary')}
      </a>

      {/* 1. Sticky nav */}
      <header className="sticky top-0 z-topbar border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link to="/" className="text-lg font-bold tracking-tight text-text">TMC&nbsp;Studio</Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            <a href="#features" className="text-sm font-medium text-muted hover:text-text">{t('landing.nav.features')}</a>
            <Link to="/pricing" className="text-sm font-medium text-muted hover:text-text">{t('landing.nav.pricing')}</Link>
            <Link to="/download" className="text-sm font-medium text-muted hover:text-text">{t('landing.nav.download')}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/app" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
              {t('landing.nav.openBoard')}
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* 2. Hero (above-fold) */}
        <Section className="text-center">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              {t('landing.hero.titlePre')}
              <span className="text-accent">{t('landing.hero.titleHighlight')}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted md:text-xl">
              {t('landing.hero.subtitle')}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <CtaPrimary />
              <Link to="/pricing" className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-base font-semibold text-text transition-colors hover:bg-surface">
                {t('landing.hero.ctaSecondary')}
              </Link>
            </div>
            {/* Trust line */}
            <p className="mt-4 text-sm text-muted">{t('landing.hero.trustLine')}</p>

            {/* Hero visual */}
            <HeroDemo label={t('landing.hero.demoAlt')} />
          </div>
        </Section>

        {/* 3. Credibility bar (NEW) */}
        <Section className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-5xl px-4 md:px-8">
            <p className="text-center text-sm font-medium uppercase tracking-widest text-muted">{t('landing.credibility.title')}</p>
            <div className="mt-8 grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-text md:text-4xl">{t('landing.credibility.item1Metric')}</p>
                <p className="mt-1 text-sm text-muted">{t('landing.credibility.item1Label')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-text md:text-4xl">{t('landing.credibility.item2Metric')}</p>
                <p className="mt-1 text-sm text-muted">{t('landing.credibility.item2Label')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-text md:text-4xl">{t('landing.credibility.item3Metric')}</p>
                <p className="mt-1 text-sm text-muted">{t('landing.credibility.item3Label')}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* 4. How it works */}
        <Section id="how" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">{t('landing.how.title')}</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3" role="list">
              {[
                { n:'1', k:'s1', icon:ICONS.players, kb: <Kbd>1–6</Kbd> },
                { n:'2', k:'s2', icon:ICONS.movement, kb: <><Kbd>A</Kbd> <Kbd>R</Kbd></> },
                { n:'3', k:'s3', icon:ICONS.export, kb: <Kbd>Cmd+E</Kbd> },
              ].map((s) => (
                <li key={s.n} className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <IconTile d={s.icon} />
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">{s.n}</span>
                    </div>
                    {s.kb}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-text">{t(`landing.how.${s.k}Title`)}</h3>
                  <p className="mt-2 text-base leading-relaxed text-muted">{t(`landing.how.${s.k}Desc`)}</p>
                </li>
              ))}
            </div>
          </div>
        </Section>

        {/* 5. Pillars — outcome-focused copy */}
        <Section id="features" className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">{t('landing.pillars.title')}</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Pillar icon={ICONS.speed} title={t('landing.pillars.speedTitle')} desc={t('landing.pillars.speedDesc')} />
              <Pillar icon={ICONS.steps} title={t('landing.pillars.stepsTitle')} desc={t('landing.pillars.stepsDesc')} />
              <Pillar icon={ICONS.everywhere} title={t('landing.pillars.everywhereTitle')} desc={t('landing.pillars.everywhereDesc')} />
              <Pillar icon={ICONS.share} title={t('landing.pillars.shareTitle')} desc={t('landing.pillars.shareDesc')} />
            </div>
          </div>
        </Section>

        {/* 6. Feature spotlight — Keyboard-first (NEW) */}
        <Section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <div className="flex flex-col items-center gap-10 md:flex-row">
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t('landing.spotlight.kbTitle')}</h2>
                <p className="mt-4 text-base leading-relaxed text-muted">{t('landing.spotlight.kbDesc')}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Kbd>Cmd+K</Kbd> <Kbd>P</Kbd> <Kbd>A</Kbd> <Kbd>R</Kbd> <Kbd>N</Kbd> <Kbd>1–6</Kbd>
                </div>
              </div>
              <div className="flex-1">
                <div className="rounded-xl border border-border bg-surface p-8 shadow-md">
                  <IconTile d={ICONS.keyboard} />
                  <p className="mt-4 text-sm italic text-muted">{t('landing.keyboard.palette')}</p>
                  <div className="mt-4 h-2 w-full rounded-full bg-surface2">
                    <div className="h-2 w-3/4 rounded-full bg-accent/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 6b. Feature spotlight — Steps & export (NEW) */}
        <Section className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <div className="flex flex-col items-center gap-10 md:flex-row-reverse">
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t('landing.spotlight.stepsTitle')}</h2>
                <p className="mt-4 text-base leading-relaxed text-muted">{t('landing.spotlight.stepsDesc')}</p>
              </div>
              <div className="flex-1">
                <div className="rounded-xl border border-border bg-surface p-8 shadow-md">
                  <IconTile d={ICONS.layers} />
                  <p className="mt-4 text-sm text-muted">PNG · GIF · PDF · SVG</p>
                  <div className="mt-4 flex gap-2">
                    <span className="rounded-md border border-border bg-surface2 px-3 py-1 text-xs font-medium text-muted">Step 1</span>
                    <span className="rounded-md border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Step 2</span>
                    <span className="rounded-md border border-border bg-surface2 px-3 py-1 text-xs font-medium text-muted">Step 3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 6c. Feature spotlight — Sync everywhere (NEW) */}
        <Section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <div className="flex flex-col items-center gap-10 md:flex-row">
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t('landing.spotlight.syncTitle')}</h2>
                <p className="mt-4 text-base leading-relaxed text-muted">{t('landing.spotlight.syncDesc')}</p>
                <Link to="/download" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover">
                  {t('landing.everywhere.cta')}
                  <I d={ICONS.arrowRight} />
                </Link>
              </div>
              <div className="flex-1">
                <div className="rounded-xl border border-border bg-surface p-8 shadow-md">
                  <IconTile d={ICONS.globe} />
                  <p className="mt-4 text-sm text-muted">macOS · Windows · Web</p>
                  <div className="mt-4 flex gap-2">
                    <span className="h-8 w-8 rounded-full bg-accent/20" />
                    <span className="h-8 w-8 rounded-full bg-accent/15" />
                    <span className="h-8 w-8 rounded-full bg-accent/30" />
                    <span className="h-8 w-8 rounded-full bg-accent/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 7. Use cases — outcome-focused copy */}
        <Section className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">{t('landing.useCases.title')}</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface p-6">
                <IconTile d={ICONS.speed} />
                <h3 className="mt-4 text-lg font-semibold text-text">{t('landing.useCases.coachesTitle')}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted">{t('landing.useCases.coachesDesc')}</p>
                <Link to="/app" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">{t('landing.nav.openBoard')} →</Link>
              </div>
              <div className="rounded-xl border border-border bg-surface p-6">
                <IconTile d={ICONS.export} />
                <h3 className="mt-4 text-lg font-semibold text-text">{t('landing.useCases.creatorsTitle')}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted">{t('landing.useCases.creatorsDesc')}</p>
                <Link to="/app" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">{t('landing.nav.openBoard')} →</Link>
              </div>
              <div className="rounded-xl border border-border bg-surface p-6">
                <IconTile d={ICONS.share} />
                <h3 className="mt-4 text-lg font-semibold text-text">{t('landing.useCases.clubsTitle')}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted">{t('landing.useCases.clubsDesc')}</p>
                <Link to="/pricing" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">{t('landing.nav.pricing')} →</Link>
              </div>
            </div>
          </div>
        </Section>

        {/* 8. Pricing teaser */}
        <Section id="pricing" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 text-center md:px-8">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t('landing.pricingTeaser.title')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">{t('landing.pricingTeaser.desc')}</p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {/* Free card */}
              <div className="rounded-xl border border-border bg-surface p-6 text-left">
                <h3 className="text-xl font-semibold text-text">{t('pricingPage.plans.freeName')}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-bold text-text">{t('pricingPage.plans.free')}</span>
                  <span className="pb-1 text-sm text-muted">{t('pricingPage.plans.perMonth')}</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted" role="list">
                  <li className="flex items-center gap-2"><I d={ICONS.check} /> 3 projects</li>
                  <li className="flex items-center gap-2"><I d={ICONS.check} /> 10 steps/project</li>
                  <li className="flex items-center gap-2"><I d={ICONS.check} /> Cloud sync</li>
                  <li className="flex items-center gap-2"><I d={ICONS.check} /> PNG / JPG export</li>
                </ul>
                <Link to="/app" className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface">
                  {t('pricingPage.plans.freeCta')}
                </Link>
              </div>
              {/* Pro card (highlighted) */}
              <div className="relative rounded-xl border-2 border-accent bg-surface p-6 text-left shadow-lg ring-1 ring-accent/30">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                  {t('pricing.mostPopular')}
                </span>
                <h3 className="text-xl font-semibold text-text">{t('pricingPage.plans.proName')}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-bold text-text">{DISPLAY_PRICES.pro.monthly}</span>
                  <span className="pb-1 text-sm text-muted">{t('pricingPage.plans.perMonth')}</span>
                </div>
                <p className="mt-1 text-xs text-accent">{t('pricingPage.billing.yearlyHint')} — {DISPLAY_PRICES.pro.yearly}/yr</p>
                <ul className="mt-4 space-y-2 text-sm text-muted" role="list">
                  <li className="flex items-center gap-2"><I d={ICONS.check} /> Unlimited projects</li>
                  <li className="flex items-center gap-2"><I d={ICONS.check} /> Unlimited steps</li>
                  <li className="flex items-center gap-2"><I d={ICONS.check} /> GIF & PDF export</li>
                  <li className="flex items-center gap-2"><I d={ICONS.check} /> Priority support</li>
                </ul>
                <Link to="/app?upgrade=pro" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
                  {t('pricingPage.plans.proCta')}
                </Link>
              </div>
              {/* Team card */}
              <div className="rounded-xl border border-border bg-surface p-6 text-left">
                <h3 className="text-xl font-semibold text-text">{t('pricingPage.plans.teamName')}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-bold text-text">{DISPLAY_PRICES.team.monthly}</span>
                  <span className="pb-1 text-sm text-muted">{t('pricingPage.plans.perMonth')}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{t('pricingPage.billing.yearlyHint')} — {DISPLAY_PRICES.team.yearly}/yr</p>
                <ul className="mt-4 space-y-2 text-sm text-muted" role="list">
                  <li className="flex items-center gap-2"><I d={ICONS.check} /> 5 team members</li>
                  <li className="flex items-center gap-2"><I d={ICONS.check} /> Shared billing</li>
                  <li className="flex items-center gap-2"><I d={ICONS.check} /> Individual workspaces</li>
                  <li className="flex items-center gap-2"><I d={ICONS.check} /> Everything in Pro</li>
                </ul>
                <Link to="/pricing" className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface">
                  {t('landing.pricingTeaser.cta')}
                </Link>
              </div>
            </div>
          </div>
        </Section>

        {/* 9. FAQ (NEW) */}
        <Section className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-3xl px-4 md:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">{t('landing.faq.title')}</h2>
            <dl className="mt-12 space-y-4">
              {['1','2','3','4','5','6'].map((i) => {
                const qKey = `landing.faq.q${i}`;
                const aKey = `landing.faq.a${i}`;
                const isOpen = openFaq === i;
                return (
                  <div key={i} className="rounded-xl border border-border bg-surface">
                    <dt>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        className="flex w-full items-center justify-between px-6 py-4 text-left text-base font-semibold text-text"
                        aria-expanded={isOpen}
                      >
                        {t(qKey)}
                        <span className={`ml-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden>▼</span>
                      </button>
                    </dt>
                    {isOpen && (
                      <dd className="border-t border-border px-6 pb-4 pt-3 text-base leading-relaxed text-muted">
                        {t(aKey)}
                      </dd>
                    )}
                  </div>
                );
              })}
            </dl>
            <p className="mt-8 text-center text-sm text-muted">
              <Link to="/pricing" className="font-medium text-accent hover:text-accent-hover">{t('pricingPage.faq.title')}</Link> — {t('pricingPage.teamCalc.subtitle')}
            </p>
          </div>
        </Section>

        {/* 10. Final CTA band (NEW) */}
        <Section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{t('landing.finalCta.title')}</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{t('landing.finalCta.desc')}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <CtaPrimary />
              <Link to="/pricing" className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-base font-semibold text-text transition-colors hover:bg-surface">
                {t('landing.hero.ctaSecondary')}
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">{t('landing.hero.trustLine')}</p>
          </div>
        </Section>
      </main>

      {/* 11. Footer */}
      <PublicFooter />
    </div>
  );
}

export default LandingPage;
