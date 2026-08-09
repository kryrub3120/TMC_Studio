import { useEffect } from 'react';
import { LanguageSwitcher, useTranslation, type Language } from '@tmc/ui';
import { formations } from '@tmc/presets';
import { LocalizedLink as Link } from '../components/LocalizedLink';
import { EVENTS, track } from '../lib/analytics';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import {
  getGrowthPage,
  getGrowthPageTitle,
  type GrowthPagePath,
} from '../seo/growthContent';
import { PublicFooter, usePublicDarkTheme } from './PublicPageShell';

const uiCopy: Record<Language, {
  product: string;
  templates: string;
  pricing: string;
  openBoard: string;
  workflow: string;
  related: string;
  secondaryCta: string;
  freeNote: string;
}> = {
  en: {
    product: 'Product', templates: 'Formation templates', pricing: 'Pricing', openBoard: 'Open board',
    workflow: 'A simple workflow', related: 'Continue exploring', secondaryCta: 'See pricing',
    freeNote: 'Start as a guest. No card required.',
  },
  pl: {
    product: 'Produkt', templates: 'Szablony formacji', pricing: 'Cennik', openBoard: 'Otwórz tablicę',
    workflow: 'Prosty proces', related: 'Zobacz także', secondaryCta: 'Zobacz cennik',
    freeNote: 'Zacznij jako gość. Bez karty.',
  },
  es: {
    product: 'Producto', templates: 'Plantillas de formación', pricing: 'Precios', openBoard: 'Abrir pizarra',
    workflow: 'Un proceso sencillo', related: 'Sigue explorando', secondaryCta: 'Ver precios',
    freeNote: 'Empieza como invitado. Sin tarjeta.',
  },
};

function FormationPreview({ formationId, label }: { formationId: string; label: string }) {
  const formation = formations.find((item) => item.id === formationId) ?? formations[0];
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
      <div className="flex min-h-11 items-center justify-between gap-4 border-b border-border px-4 py-2">
        <span className="truncate text-sm font-semibold text-text">{formation.name}</span>
        <span className="shrink-0 rounded border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-xs text-accent">TMC Studio</span>
      </div>
      <div className="bg-[#132218] p-3 sm:p-5">
        <svg viewBox="0 0 1050 680" className="block h-auto w-full" role="img" aria-label={label}>
          <defs>
            <clipPath id={`pitch-${formation.id}`}><rect x="35" y="35" width="980" height="610" rx="5" /></clipPath>
            <marker id={`arrow-${formation.id}`} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#f6c453" />
            </marker>
          </defs>
          <g clipPath={`url(#pitch-${formation.id})`}>
            {Array.from({ length: 10 }, (_, index) => (
              <rect key={index} x={35 + index * 98} y="35" width="98" height="610" fill={index % 2 ? '#24843d' : '#2a9145'} />
            ))}
          </g>
          <g fill="none" stroke="rgba(255,255,255,.72)" strokeWidth="3">
            <rect x="35" y="35" width="980" height="610" rx="5" />
            <line x1="525" y1="35" x2="525" y2="645" />
            <circle cx="525" cy="340" r="86" />
            <rect x="35" y="155" width="155" height="370" />
            <rect x="860" y="155" width="155" height="370" />
            <rect x="35" y="250" width="58" height="180" />
            <rect x="957" y="250" width="58" height="180" />
          </g>
          <g stroke="#f6c453" strokeWidth="6" strokeLinecap="round" opacity=".9" markerEnd={`url(#arrow-${formation.id})`}>
            <path d="M360 245 Q445 195 505 235" fill="none" />
            <path d="M365 435 Q450 475 510 430" fill="none" strokeDasharray="13 10" />
          </g>
          {formation.positions.map((position) => {
            const x = 55 + (position.x / 50) * 450;
            const y = 55 + (position.y / 100) * 570;
            const goalkeeper = position.role === 'GK';
            return (
              <g key={`${position.role}-${position.defaultNumber}`}>
                <circle cx={x} cy={y} r="22" fill={goalkeeper ? '#f6c453' : '#e5484d'} stroke="#fff" strokeWidth="3" />
                <text x={x} y={y + 6} textAnchor="middle" fill={goalkeeper ? '#161a18' : '#fff'} fontSize="18" fontWeight="700">
                  {position.defaultNumber}
                </text>
              </g>
            );
          })}
          <circle cx="525" cy="340" r="9" fill="#fff" stroke="#17201a" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

export function GrowthPage({ path }: { path: GrowthPagePath }) {
  const { language } = useTranslation();
  const copy = uiCopy[language];
  const page = getGrowthPage(path, language);
  usePublicDarkTheme();
  useDocumentMeta({ title: page.metaTitle, description: page.metaDescription, path });

  useEffect(() => {
    track(EVENTS.CONTENT_VIEW, { path, kind: page.kind, language });
  }, [language, page.kind, path]);

  const source = path.replace(/^\//, '').replaceAll('/', '_');
  const boardUrl = page.kind === 'template'
    ? `/board?source=${encodeURIComponent(source)}&formation=${encodeURIComponent(page.formationId)}`
    : `/board?source=${encodeURIComponent(source)}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.metaDescription,
  };

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-modal focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        {page.title}
      </a>

      <header className="sticky top-0 z-topbar border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2 text-base font-bold text-text sm:text-lg">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-black text-bg">T</span>
            <span className="hidden sm:inline">TMC Studio</span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Growth pages">
            <Link to="/football-tactics-board" className="text-sm font-medium text-muted hover:text-text">{copy.product}</Link>
            <Link to="/templates/4-3-3-formation" className="text-sm font-medium text-muted hover:text-text">{copy.templates}</Link>
            <Link to="/pricing" className="text-sm font-medium text-muted hover:text-text">{copy.pricing}</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link to={boardUrl} className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover sm:px-4">
              {copy.openBoard}
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-8 md:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase text-accent">{page.eyebrow}</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">{page.title}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{page.lead}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={boardUrl} className="inline-flex min-h-12 items-center justify-center rounded-md bg-accent px-6 py-3 text-base font-semibold text-bg transition-colors hover:bg-accent-hover">
                  {page.primaryCta} <span className="ml-2" aria-hidden="true">→</span>
                </Link>
                <Link to="/pricing" className="inline-flex min-h-12 items-center justify-center rounded-md border border-border px-6 py-3 text-base font-semibold text-text transition-colors hover:bg-surface">
                  {copy.secondaryCta}
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted">{copy.freeNote}</p>
            </div>
            <FormationPreview formationId={page.formationId} label={page.visualLabel} />
          </div>
        </section>

        <section className="border-b border-border bg-surface/45">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h2 className="text-3xl font-bold">{page.proofTitle}</h2>
                <p className="mt-4 text-base leading-7 text-muted">{page.proofBody}</p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-3" role="list">
                {page.benefits.map((benefit, index) => (
                  <li key={benefit} className="rounded-lg border border-border bg-surface p-5 text-base leading-6 text-text">
                    <span className="mb-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">{index + 1}</span>
                    <p>{benefit}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
            <h2 className="text-3xl font-bold">{copy.workflow}</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {page.steps.map((step, index) => (
                <li key={step.title} className="border-t-2 border-accent pt-5">
                  <div className="font-mono text-sm text-accent">0{index + 1}</div>
                  <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-base leading-7 text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-10 rounded-lg border border-border bg-surface px-5 py-4 text-sm leading-6 text-muted">{page.note}</p>
          </div>
        </section>

        <section className="bg-surface/45">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
            <h2 className="text-3xl font-bold">{copy.related}</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {page.relatedPaths.map((relatedPath) => (
                <Link key={relatedPath} to={relatedPath} className="group rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent/50">
                  <span className="text-lg font-semibold text-text">{getGrowthPageTitle(relatedPath, language)}</span>
                  <span className="mt-5 block text-sm font-semibold text-accent group-hover:text-accent-hover">{copy.product} <span aria-hidden="true">→</span></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

export default GrowthPage;
