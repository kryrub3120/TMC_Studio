/**
 * LandingPage — public marketing page at `/`.
 *
 * Browser-first redesign. Honest copy (no fabricated metrics, no desktop/sync
 * promises). The visuals are a faithful vector render of a real TMC tactic:
 * the same 1050x680 pitch geometry, team colors and 4-3-3 build-up sequence
 * the app produces — no placeholder graphics.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, LanguageSwitcher, DISPLAY_PRICES } from '@tmc/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { track, EVENTS } from '../lib/analytics';
import { usePublicDarkTheme, PublicFooter } from './PublicPageShell';

/* ---------- micro components ---------- */

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center rounded-md border border-border bg-surface2 px-2 py-1 font-mono text-xs font-medium text-text">
    {children}
  </kbd>
);

const I = ({ d, className = 'h-5 w-5' }: { d: string; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.split('|').map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const ICONS = {
  players: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8|M22 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75',
  movement: 'M5 19 19 5|M12 5h7v7',
  export: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M7 10l5 5 5-5|M12 15V3',
  speed: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  steps: 'M3 6h18|M3 12h18|M3 18h18',
  browser: 'M2 4h20v16H2z|M2 8h20|M5 6h.01|M8 6h.01',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8|M16 6l-4-4-4 4|M12 2v13',
  check: 'M20 6L9 17l-5-5',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  keyboard: 'M4 6h16v12H4z|M6 10h.01|M10 10h.01|M14 10h.01|M18 10h.01|M6 14h.01|M10 14h.01M14 14h.01|M18 14h.01|M6 18h12',
  layers: 'M12 2l9 5-9 5-9-5z|M3 12l9 5 9-5|M3 17l9 5 9-5',
  zones: 'M3 3h18v18H3z|M3 12h18',
  cone: 'M12 3 4 21h16z|M8.5 14h7',
  command: 'M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z',
} as const;

const IconTile = ({ d }: { d: string }) => (
  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
    <I d={d} />
  </span>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-accent">{children}</p>
);

/* =====================================================================
   Faithful pitch render — real geometry (1050x680), real tactic.
   ===================================================================== */

const MINT = '#2EE6A6';

type Pl = { n: number; x: number; y: number; team: 'home' | 'away'; gk?: boolean };
const HOME: Pl[] = [
  { n: 1, x: 95, y: 340, team: 'home', gk: true },
  { n: 2, x: 210, y: 150, team: 'home' }, { n: 5, x: 195, y: 285, team: 'home' },
  { n: 6, x: 195, y: 395, team: 'home' }, { n: 3, x: 210, y: 530, team: 'home' },
  { n: 8, x: 420, y: 215, team: 'home' }, { n: 4, x: 380, y: 340, team: 'home' }, { n: 10, x: 420, y: 465, team: 'home' },
  { n: 7, x: 665, y: 175, team: 'home' }, { n: 9, x: 720, y: 340, team: 'home' }, { n: 11, x: 665, y: 505, team: 'home' },
];
const AWAY: Pl[] = [
  { n: 1, x: 960, y: 340, team: 'away', gk: true },
  { n: 4, x: 560, y: 255, team: 'away' }, { n: 6, x: 560, y: 425, team: 'away' }, { n: 8, x: 650, y: 340, team: 'away' },
  { n: 7, x: 790, y: 210, team: 'away' }, { n: 11, x: 790, y: 470, team: 'away' },
];

type Ar = { x1: number; y1: number; x2: number; y2: number; t: 'pass' | 'run' | 'shoot'; cx: number; cy: number };
type Stp = { label: string; arrows: Ar[]; ball: { x: number; y: number } };
const STEPS: Stp[] = [
  { label: 'Ustawienie 4-3-3', arrows: [], ball: { x: 140, y: 340 } },
  { label: 'Rozegranie od bramkarza', ball: { x: 360, y: 340 }, arrows: [
    { x1: 120, y1: 360, x2: 192, y2: 393, t: 'pass', cx: 150, cy: 420 },
    { x1: 200, y1: 393, x2: 372, y2: 345, t: 'pass', cx: 290, cy: 400 },
    { x1: 665, y1: 175, x2: 812, y2: 152, t: 'run', cx: 740, cy: 150 },
  ] },
  { label: 'Wejście w pole karne', ball: { x: 902, y: 340 }, arrows: [
    { x1: 388, y1: 340, x2: 706, y2: 344, t: 'pass', cx: 545, cy: 298 },
    { x1: 720, y1: 340, x2: 910, y2: 340, t: 'shoot', cx: 815, cy: 338 },
    { x1: 665, y1: 505, x2: 818, y2: 558, t: 'run', cx: 745, cy: 545 },
  ] },
];

function Arrow({ a }: { a: Ar }) {
  const ang = Math.atan2(a.y2 - a.cy, a.x2 - a.cx);
  const hs = 20;
  const p1 = `${a.x2 - hs * Math.cos(ang - 0.42)},${a.y2 - hs * Math.sin(ang - 0.42)}`;
  const p2 = `${a.x2 - hs * Math.cos(ang + 0.42)},${a.y2 - hs * Math.sin(ang + 0.42)}`;
  const w = a.t === 'shoot' ? 6 : 5;
  const dash = a.t === 'run' ? '12 9' : undefined;
  return (
    <g>
      <path d={`M ${a.x1} ${a.y1} Q ${a.cx} ${a.cy} ${a.x2} ${a.y2}`} fill="none" stroke={MINT} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
      <polygon points={`${a.x2},${a.y2} ${p1} ${p2}`} fill={MINT} />
    </g>
  );
}

function Ball({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={7.5} fill="#fff" stroke="#0B1220" strokeWidth={1.5} />;
}

function Players() {
  const fill = (p: Pl) => (p.gk ? (p.team === 'home' ? '#fbbf24' : '#f97316') : p.team === 'home' ? '#ef4444' : '#3b82f6');
  return (
    <>
      {[...HOME, ...AWAY].map((p) => (
        <g key={p.team + p.n}>
          <circle cx={p.x} cy={p.y} r={15.5} fill={fill(p)} stroke="#fff" strokeWidth={2.5} />
          <text x={p.x} y={p.y + 5.5} textAnchor="middle" fontSize={15} fontWeight={700} fill="#fff">{p.n}</text>
        </g>
      ))}
    </>
  );
}

const LINE = 'rgba(255,255,255,0.5)';
function PitchMarkings() {
  const stripes = Array.from({ length: 8 }, (_, i) => (
    <rect key={i} x={40 + i * 121.25} y={40} width={121.25} height={600} fill={i % 2 ? '#2f9342' : '#2c8a3d'} />
  ));
  const ln = { fill: 'none', stroke: LINE, strokeWidth: 2.5 } as const;
  return (
    <>
      <rect x={40} y={40} width={970} height={600} rx={6} fill="#2c8a3d" />
      <clipPath id="pf"><rect x={40} y={40} width={970} height={600} rx={6} /></clipPath>
      <g clipPath="url(#pf)">{stripes}</g>
      <rect x={40} y={40} width={970} height={600} rx={6} {...ln} />
      <line x1={525} y1={40} x2={525} y2={640} stroke={LINE} strokeWidth={2.5} />
      <circle cx={525} cy={340} r={84} {...ln} />
      <circle cx={525} cy={340} r={4} fill={LINE} />
      {/* penalty + goal areas */}
      <rect x={40} y={154} width={152} height={372} {...ln} />
      <rect x={858} y={154} width={152} height={372} {...ln} />
      <rect x={40} y={255} width={51} height={170} {...ln} />
      <rect x={959} y={255} width={51} height={170} {...ln} />
      <circle cx={141} cy={340} r={3} fill={LINE} />
      <circle cx={909} cy={340} r={3} fill={LINE} />
      <path d="M 192 274 A 84 84 0 0 1 192 406" {...ln} />
      <path d="M 858 274 A 84 84 0 0 0 858 406" {...ln} />
      {/* goals */}
      <rect x={31} y={306} width={9} height={68} fill="rgba(255,255,255,0.35)" stroke={LINE} strokeWidth={1.5} />
      <rect x={1010} y={306} width={9} height={68} fill="rgba(255,255,255,0.35)" stroke={LINE} strokeWidth={1.5} />
      {/* corner arcs */}
      <path d="M 40 50 A 10 10 0 0 1 50 40" {...ln} />
      <path d="M 1000 40 A 10 10 0 0 1 1010 50" {...ln} />
      <path d="M 50 640 A 10 10 0 0 1 40 630" {...ln} />
      <path d="M 1010 630 A 10 10 0 0 1 1000 640" {...ln} />
    </>
  );
}

function Pitch({ step = 0, animated = false, ariaLabel }: { step?: number; animated?: boolean; ariaLabel?: string }) {
  return (
    <svg viewBox="0 0 1050 680" className="h-full w-full" role={ariaLabel ? 'img' : undefined} aria-label={ariaLabel} xmlns="http://www.w3.org/2000/svg">
      {animated && (
        <style>{`
          .pstep{opacity:0;animation:pcyc 12s ease-in-out infinite}
          .pstep-1{animation-delay:4s}.pstep-2{animation-delay:8s}
          @keyframes pcyc{0%,3%{opacity:0}7%,30%{opacity:1}34%,100%{opacity:0}}
          @media (prefers-reduced-motion:reduce){.pstep{opacity:1;animation:none}.pstep-0,.pstep-1{opacity:0}}
        `}</style>
      )}
      <PitchMarkings />
      <Players />
      {animated
        ? STEPS.map((s, i) => (
            <g key={i} className={`pstep pstep-${i}`}>
              {s.arrows.map((a, j) => <Arrow key={j} a={a} />)}
              <Ball x={s.ball.x} y={s.ball.y} />
            </g>
          ))
        : (
            <g>
              {STEPS[step].arrows.map((a, j) => <Arrow key={j} a={a} />)}
              <Ball x={STEPS[step].ball.x} y={STEPS[step].ball.y} />
            </g>
          )}
    </svg>
  );
}

/* ---------- App window chrome (hero) ---------- */

const WIN_TOOLS = [ICONS.players, ICONS.movement, ICONS.zones, ICONS.cone, ICONS.browser, ICONS.export];

function HeroDemo({ label }: { label: string }) {
  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl ring-1 ring-white/5">
      <div className="flex items-center gap-3 border-b border-border bg-surface2/70 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-team-home/70" />
          <span className="h-3 w-3 rounded-full bg-selection/70" />
          <span className="h-3 w-3 rounded-full bg-accent/70" />
        </div>
        <span className="ml-1 text-xs font-medium text-muted">TMC Studio — Build-up 4-3-3</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Zapisano
        </span>
        <kbd className="hidden items-center rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted sm:inline-flex">⌘K</kbd>
      </div>
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2">
        {WIN_TOOLS.map((d, i) => (
          <span key={i} className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${i === 1 ? 'bg-accent/15 text-accent ring-1 ring-accent/40' : 'text-muted'}`}>
            <I d={d} className="h-4 w-4" />
          </span>
        ))}
      </div>
      <div className="bg-bg p-3 sm:p-5">
        <div className="mx-auto" style={{ aspectRatio: '1050/680', maxWidth: 980 }}>
          <Pitch animated ariaLabel={label} />
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-border bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <span key={n} className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <span className={`h-2 w-2 rounded-full ${n === 1 ? 'bg-accent' : 'bg-surface2'}`} /> Krok {n}
            </span>
          ))}
        </div>
        <span className="ml-auto font-mono text-xs text-muted">PNG · GIF · PDF · SVG</span>
      </div>
    </div>
  );
}

/* ---------- Feature mockups ---------- */

function PaletteMock() {
  const rows = [
    { icon: ICONS.players, kb: 'P' },
    { icon: ICONS.movement, kb: 'A' },
    { icon: ICONS.movement, kb: 'R' },
    { icon: ICONS.steps, kb: 'N' },
    { icon: ICONS.export, kb: '⌘E' },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-md">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface2 px-3 py-2">
        <I d={ICONS.command} className="h-4 w-4 text-accent" />
        <span className="text-sm text-muted">Szukaj polecenia…</span>
        <kbd className="ml-auto rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted">⌘K</kbd>
      </div>
      <div className="mt-2 space-y-1">
        {rows.map((r, i) => (
          <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${i === 0 ? 'bg-accent/10 ring-1 ring-accent/30' : ''}`}>
            <I d={r.icon} className={`h-4 w-4 ${i === 0 ? 'text-accent' : 'text-muted'}`} />
            <span className="h-2 w-24 rounded bg-surface2" />
            <kbd className="ml-auto rounded border border-border bg-surface2 px-2 py-0.5 font-mono text-[11px] text-text">{r.kb}</kbd>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepsMock() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-md">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((n) => (
          <div key={n} className={`overflow-hidden rounded-lg border ${n === 2 ? 'border-accent/50 ring-1 ring-accent/30' : 'border-border'}`}>
            <div className="overflow-hidden bg-bg" style={{ aspectRatio: '1050/680' }}><Pitch step={n} /></div>
            <div className={`px-2 py-1 text-[11px] font-medium ${n === 2 ? 'text-accent' : 'text-muted'}`}>Step {n + 1}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {['PNG', 'GIF', 'PDF', 'SVG'].map((f) => (
          <span key={f} className="rounded-md border border-border bg-surface2 px-2.5 py-1 font-mono text-xs font-medium text-text">{f}</span>
        ))}
        <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-accent"><I d={ICONS.export} className="h-4 w-4" /> ⌘E</span>
      </div>
    </div>
  );
}

function BrowserMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-md">
      <div className="flex items-center gap-2 border-b border-border bg-surface2/70 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-team-home/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-selection/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
        </div>
        <div className="ml-2 flex flex-1 items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1">
          <I d={ICONS.browser} className="h-3.5 w-3.5 text-muted" />
          <span className="font-mono text-[11px] text-muted">tmcstudio.app/board</span>
          <span className="ml-auto rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">Gość</span>
        </div>
      </div>
      <div className="overflow-hidden bg-bg p-3" style={{ aspectRatio: '1050/620' }}><Pitch step={1} /></div>
    </div>
  );
}

/* ---------- Section + Pillar ---------- */

function Section({ id, className = '', children }: { id?: string; className?: string; children: React.ReactNode }) {
  return <section id={id} className={`py-20 md:py-28 ${className}`}>{children}</section>;
}

function Pillar({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent/40">
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

  const [openFaq, setOpenFaq] = useState<string | null>(null);

  useEffect(() => {
    const faqData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'TMC Studio',
          applicationCategory: 'Multimedia',
          operatingSystem: 'Web',
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
    <Link to="/board" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-bg transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20">
      {t('landing.hero.ctaPrimary')}
      <I d={ICONS.arrowRight} className="h-4 w-4" />
    </Link>
  );
  const CtaSecondary = () => (
    <Link to="/pricing" className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-base font-semibold text-text transition-colors hover:bg-surface">
      {t('landing.hero.ctaSecondary')}
    </Link>
  );

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-modal focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        {t('landing.hero.ctaPrimary')}
      </a>

      {/* 1. Sticky nav */}
      <header className="sticky top-0 z-topbar border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-text">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-bg"><I d={ICONS.movement} className="h-4 w-4" /></span>
            TMC&nbsp;Studio
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            <a href="#features" className="text-sm font-medium text-muted hover:text-text">{t('landing.nav.features')}</a>
            <Link to="/pricing" className="text-sm font-medium text-muted hover:text-text">{t('landing.nav.pricing')}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/board" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover">
              {t('landing.nav.openBoard')}
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* 2. Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-16 text-center md:px-8 md:pt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {t('landing.hero.badge')}
            </span>
            <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              {t('landing.hero.titlePre')}
              <span className="bg-gradient-to-r from-accent to-team-away-light bg-clip-text text-transparent">{t('landing.hero.titleHighlight')}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
              {t('landing.hero.subtitle')}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <CtaPrimary />
              <CtaSecondary />
            </div>
            <p className="mt-4 text-sm text-muted">{t('landing.hero.trustLine')}</p>
            <div className="mt-14">
              <HeroDemo label={t('landing.hero.demoAlt')} />
            </div>
          </div>
        </section>

        {/* 3. Honest highlight strip */}
        <Section className="border-t border-border bg-surface/40 !py-14">
          <div className="mx-auto max-w-5xl px-4 md:px-8">
            <Eyebrow>{t('landing.credibility.title')}</Eyebrow>
            <div className="mt-8 grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-surface px-4 py-6">
                  <p className="text-3xl font-bold text-text md:text-4xl">{t(`landing.credibility.item${i}Metric`)}</p>
                  <p className="mt-2 text-sm text-muted">{t(`landing.credibility.item${i}Label`)}</p>
                </div>
              ))}
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
                { n:'3', k:'s3', icon:ICONS.export, kb: <Kbd>⌘E</Kbd> },
              ].map((s) => (
                <li key={s.n} className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent/40">
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

        {/* 5. Key functions */}
        <Section id="features" className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <Eyebrow>{t('landing.nav.features')}</Eyebrow>
            <h2 className="mt-3 text-center text-3xl font-bold tracking-tight md:text-4xl">{t('landing.pillars.title')}</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Pillar icon={ICONS.speed} title={t('landing.pillars.speedTitle')} desc={t('landing.pillars.speedDesc')} />
              <Pillar icon={ICONS.steps} title={t('landing.pillars.stepsTitle')} desc={t('landing.pillars.stepsDesc')} />
              <Pillar icon={ICONS.browser} title={t('landing.pillars.everywhereTitle')} desc={t('landing.pillars.everywhereDesc')} />
              <Pillar icon={ICONS.share} title={t('landing.pillars.shareTitle')} desc={t('landing.pillars.shareDesc')} />
            </div>
          </div>
        </Section>

        {/* 6a. Spotlight — keyboard-first */}
        <Section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:px-8">
            <div>
              <IconTile d={ICONS.keyboard} />
              <h2 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">{t('landing.spotlight.kbTitle')}</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">{t('landing.spotlight.kbDesc')}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Kbd>⌘K</Kbd> <Kbd>P</Kbd> <Kbd>A</Kbd> <Kbd>R</Kbd> <Kbd>N</Kbd> <Kbd>1–6</Kbd>
              </div>
            </div>
            <PaletteMock />
          </div>
        </Section>

        {/* 6b. Spotlight — steps & export */}
        <Section className="border-t border-border bg-surface/40">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:px-8">
            <div className="md:order-2">
              <IconTile d={ICONS.layers} />
              <h2 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">{t('landing.spotlight.stepsTitle')}</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">{t('landing.spotlight.stepsDesc')}</p>
            </div>
            <div className="md:order-1"><StepsMock /></div>
          </div>
        </Section>

        {/* 6c. Spotlight — browser-first */}
        <Section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:px-8">
            <div>
              <IconTile d={ICONS.browser} />
              <h2 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">{t('landing.spotlight.syncTitle')}</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">{t('landing.spotlight.syncDesc')}</p>
              <Link to="/board" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-hover">
                {t('landing.everywhere.cta')}
                <I d={ICONS.arrowRight} className="h-4 w-4" />
              </Link>
            </div>
            <BrowserMock />
          </div>
        </Section>

        {/* 7. Use cases */}
        <Section className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">{t('landing.useCases.title')}</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface p-6">
                <IconTile d={ICONS.speed} />
                <h3 className="mt-4 text-lg font-semibold text-text">{t('landing.useCases.coachesTitle')}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted">{t('landing.useCases.coachesDesc')}</p>
                <Link to="/board" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">{t('landing.nav.openBoard')} →</Link>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-6">
                <IconTile d={ICONS.export} />
                <h3 className="mt-4 text-lg font-semibold text-text">{t('landing.useCases.creatorsTitle')}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted">{t('landing.useCases.creatorsDesc')}</p>
                <Link to="/board" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">{t('landing.nav.openBoard')} →</Link>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-6">
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
              <div className="rounded-2xl border border-border bg-surface p-6 text-left">
                <h3 className="text-xl font-semibold text-text">{t('pricingPage.plans.freeName')}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-bold text-text">{t('pricingPage.plans.free')}</span>
                  <span className="pb-1 text-sm text-muted">{t('pricingPage.plans.perMonth')}</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted" role="list">
                  {String(t('pricing.plans.free.features')).split('|').map((f) => (
                    <li key={f} className="flex items-center gap-2"><I d={ICONS.check} className="h-4 w-4 text-accent" /> {f}</li>
                  ))}
                </ul>
                <Link to="/board" className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface">
                  {t('pricingPage.plans.freeCta')}
                </Link>
              </div>
              <div className="relative rounded-2xl border-2 border-accent bg-surface p-6 text-left shadow-lg ring-1 ring-accent/30">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-bg">
                  {t('pricing.mostPopular')}
                </span>
                <h3 className="text-xl font-semibold text-text">{t('pricingPage.plans.proName')}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-bold text-text">{DISPLAY_PRICES.pro.monthly}</span>
                  <span className="pb-1 text-sm text-muted">{t('pricingPage.plans.perMonth')}</span>
                </div>
                <p className="mt-1 text-xs text-accent">{t('pricingPage.billing.yearlyHint')} — {DISPLAY_PRICES.pro.yearly}/yr</p>
                <ul className="mt-4 space-y-2 text-sm text-muted" role="list">
                  {String(t('pricing.plans.pro.features')).split('|').map((f) => (
                    <li key={f} className="flex items-center gap-2"><I d={ICONS.check} className="h-4 w-4 text-accent" /> {f}</li>
                  ))}
                </ul>
                <Link to="/board?upgrade=pro" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover">
                  {t('pricingPage.plans.proCta')}
                </Link>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-6 text-left">
                <h3 className="text-xl font-semibold text-text">{t('pricingPage.plans.teamName')}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-bold text-text">{DISPLAY_PRICES.team.monthly}</span>
                  <span className="pb-1 text-sm text-muted">{t('pricingPage.plans.perMonth')}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{t('pricingPage.billing.yearlyHint')} — {DISPLAY_PRICES.team.yearly}/yr</p>
                <ul className="mt-4 space-y-2 text-sm text-muted" role="list">
                  {String(t('pricing.plans.team.features')).split('|').map((f) => (
                    <li key={f} className="flex items-center gap-2"><I d={ICONS.check} className="h-4 w-4 text-accent" /> {f}</li>
                  ))}
                </ul>
                <Link to="/pricing" className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface">
                  {t('landing.pricingTeaser.cta')}
                </Link>
              </div>
            </div>
          </div>
        </Section>

        {/* 9. FAQ */}
        <Section className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-3xl px-4 md:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">{t('landing.faq.title')}</h2>
            <dl className="mt-12 space-y-4">
              {['1','2','3','4','5','6'].map((i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className="rounded-2xl border border-border bg-surface">
                    <dt>
                      <button type="button" onClick={() => setOpenFaq(isOpen ? null : i)}
                        className="flex w-full items-center justify-between px-6 py-4 text-left text-base font-semibold text-text" aria-expanded={isOpen}>
                        {t(`landing.faq.q${i}`)}
                        <span className={`ml-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden>▼</span>
                      </button>
                    </dt>
                    {isOpen && (
                      <dd className="border-t border-border px-6 pb-4 pt-3 text-base leading-relaxed text-muted">
                        {t(`landing.faq.a${i}`)}
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

        {/* 10. Final CTA */}
        <Section className="border-t border-border">
          <div className="relative mx-auto max-w-3xl overflow-hidden px-4 text-center md:px-8">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
            <h2 className="relative text-3xl font-bold tracking-tight md:text-5xl">{t('landing.finalCta.title')}</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-muted">{t('landing.finalCta.desc')}</p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <CtaPrimary />
              <CtaSecondary />
            </div>
            <p className="relative mt-4 text-sm text-muted">{t('landing.hero.trustLine')}</p>
          </div>
        </Section>
      </main>

      <PublicFooter />
    </div>
  );
}

export default LandingPage;
