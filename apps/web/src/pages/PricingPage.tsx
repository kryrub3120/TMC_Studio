/**
 * PricingPage — public `/pricing` page.
 *
 * Comparison of Guest / Free / Pro / Team built from the single source of
 * truth (`ENTITLEMENTS_BY_PLAN`). Paid CTAs route to `/app?upgrade=<plan>`,
 * which auto-opens the in-app pricing modal (PricingModal / useBillingController)
 * to start sign-in + Stripe Checkout — we don't duplicate checkout logic here.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, LanguageSwitcher, DISPLAY_PRICES, SAVE_PERCENT } from '@tmc/ui';
import type { Cycle } from '@tmc/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { track, EVENTS } from '../lib/analytics';
import { ENTITLEMENTS_BY_PLAN, type Plan } from '../lib/entitlements';
import { usePublicDarkTheme } from './PublicPageShell';

const PLANS: Plan[] = ['guest', 'free', 'pro', 'team'];

export function PricingPage() {
  const { t } = useTranslation();
  usePublicDarkTheme();
  useDocumentMeta({ title: t('seo.pricing.title'), description: t('seo.pricing.description'), path: '/pricing' });
  useEffect(() => { track(EVENTS.PRICING_VIEW); }, []);

  // Structured data: FAQPage for billing questions
  useEffect(() => {
    const faqData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: t('pricingPage.faq.q1'), acceptedAnswer: { '@type': 'Answer', text: t('pricingPage.faq.a1') } },
        { '@type': 'Question', name: t('pricingPage.faq.q2'), acceptedAnswer: { '@type': 'Answer', text: t('pricingPage.faq.a2') } },
        { '@type': 'Question', name: t('pricingPage.faq.q3'), acceptedAnswer: { '@type': 'Answer', text: t('pricingPage.faq.a3') } },
        { '@type': 'Question', name: t('pricingPage.faq.q4'), acceptedAnswer: { '@type': 'Answer', text: t('pricingPage.faq.a4') } },
      ],
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'tmc-faq-structured-data';
    script.textContent = JSON.stringify(faqData);
    document.head.appendChild(script);
    return () => { document.head.querySelector('#tmc-faq-structured-data')?.remove(); };
  }, [t]);

  const [cycle, setCycle] = useState<Cycle>('monthly');

  const num = (v: number | 'unlimited') =>
    v === 'unlimited' ? t('pricingPage.matrix.unlimited') : String(v);
  const bool = (v: boolean) => (v ? '✓' : '—');

  const rows: { label: string; render: (p: Plan) => string }[] = [
    { label: t('pricingPage.matrix.projects'), render: (p) => num(ENTITLEMENTS_BY_PLAN[p].maxProjects) },
    { label: t('pricingPage.matrix.steps'), render: (p) => num(ENTITLEMENTS_BY_PLAN[p].maxStepsPerProject) },
    { label: t('pricingPage.matrix.folders'), render: (p) => num(ENTITLEMENTS_BY_PLAN[p].maxFolders) },
    { label: t('pricingPage.matrix.cloudSync'), render: (p) => bool(ENTITLEMENTS_BY_PLAN[p].cloudSync) },
    { label: t('pricingPage.matrix.exportPng'), render: (p) => bool(ENTITLEMENTS_BY_PLAN[p].canExportPNG) },
    { label: t('pricingPage.matrix.exportGif'), render: (p) => bool(ENTITLEMENTS_BY_PLAN[p].canExportGIF) },
    { label: t('pricingPage.matrix.exportPdf'), render: (p) => bool(ENTITLEMENTS_BY_PLAN[p].canExportPDF) },
    { label: t('pricingPage.matrix.seats'), render: (p) => String(ENTITLEMENTS_BY_PLAN[p].maxSeats) },
    { label: t('pricingPage.matrix.invite'), render: (p) => bool(ENTITLEMENTS_BY_PLAN[p].canInviteMembers) },
  ];

  const planMeta: Record<Plan, { name: string; tagline: string; price: string; period: string; cta: string }> = {
    guest: { name: t('pricingPage.plans.guestName'), tagline: t('pricingPage.plans.guestTagline'), price: t('pricingPage.plans.free'), period: '', cta: t('pricingPage.plans.guestCta') },
    free: { name: t('pricingPage.plans.freeName'), tagline: t('pricingPage.plans.freeTagline'), price: t('pricingPage.plans.free'), period: '', cta: t('pricingPage.plans.freeCta') },
    pro: { name: t('pricingPage.plans.proName'), tagline: t('pricingPage.plans.proTagline'), price: DISPLAY_PRICES.pro[cycle], period: cycle === 'monthly' ? t('pricingPage.plans.perMonth') : t('pricingPage.plans.perYear'), cta: t('pricingPage.plans.proCta') },
    team: { name: t('pricingPage.plans.teamName'), tagline: t('pricingPage.plans.teamTagline'), price: DISPLAY_PRICES.team[cycle], period: cycle === 'monthly' ? t('pricingPage.plans.perMonth') : t('pricingPage.plans.perYear'), cta: t('pricingPage.plans.teamCta') },
  };

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      {/* Header */}
      <header className="sticky top-0 z-topbar border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight text-text">TMC&nbsp;Studio</Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/app" className="rounded-md bg-accent px-4 py-2 text-base font-medium text-white transition-colors hover:bg-accent-hover">
              {t('landing.nav.openBoard')}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-center text-3xl font-bold tracking-tight md:text-5xl">{t('pricingPage.hero.title')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted">{t('pricingPage.hero.subtitle')}</p>

        {/* Billing cycle toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="inline-flex rounded-lg border border-border bg-surface p-1" role="group" aria-label="Billing cycle">
            {(['monthly', 'yearly'] as Cycle[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCycle(c)}
                aria-current={cycle === c ? 'true' : undefined}
                className={`rounded-md px-4 py-1.5 text-base font-medium transition-colors relative ${cycle === c ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
              >
                {t(`pricingPage.billing.${c}`)}
                {c === 'yearly' && (
                  <span className="absolute -top-2.5 -right-2.5 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-tight">
                    Save {SAVE_PERCENT}%
                  </span>
                )}
              </button>
            ))}
          </div>
          {cycle === 'yearly' && (
            <span className="text-sm font-medium text-accent">{t('pricingPage.billing.yearlyHint')}</span>
          )}
        </div>

        {/* Plan cards */}
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => {
            const m = planMeta[p];
            const highlight = p === 'pro';
            const upgradeHref = p === 'pro' || p === 'team' ? `/app?upgrade=${p}&cycle=${cycle}` : '/app';
            return (
              <div key={p} className={`relative flex flex-col rounded-xl border p-6 ${highlight ? 'border-accent bg-surface ring-1 ring-accent' : 'border-border bg-surface'}`}>
                {highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                    {t('pricing.mostPopular')}
                  </span>
                )}
                <h2 className="text-xl font-semibold">{m.name}</h2>
                <p className="mt-1 text-sm text-muted">{m.tagline}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-3xl font-bold">{m.price}</span>
                  {m.period && <span className="pb-1 text-base text-muted">{m.period}</span>}
                </div>
                <Link
                  to={upgradeHref}
                  className={`mt-6 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-base font-medium transition-colors ${highlight ? 'bg-accent text-white hover:bg-accent-hover' : 'border border-border text-text hover:bg-surface2'}`}
                >
                  {m.cta}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Comparison matrix */}
        <div className="mt-14 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-base">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-3 py-3 text-left font-semibold">{t('pricingPage.matrix.feature')}</th>
                {PLANS.map((p) => (
                  <th key={p} scope="col" className="px-3 py-3 text-center font-semibold">{planMeta[p].name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-border">
                  <th scope="row" className="px-3 py-3 text-left font-normal text-muted">{r.label}</th>
                  {PLANS.map((p) => (
                    <td key={p} className="px-3 py-3 text-center">{r.render(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted">{t('pricingPage.vatNote')}</p>

        {/* FAQ */}
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">{t('pricingPage.faq.title')}</h2>
          <dl className="mt-8 space-y-6">
            {['1', '2', '3', '4'].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-surface p-5">
                <dt className="font-semibold">{t(`pricingPage.faq.q${i}`)}</dt>
                <dd className="mt-2 text-base text-muted">{t(`pricingPage.faq.a${i}`)}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Team value calculator */}
        <section className="mx-auto mt-16 max-w-3xl rounded-xl border border-border bg-surface p-8">
          <h2 className="text-center text-2xl font-bold tracking-tight">{t('pricingPage.teamCalc.title')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-base text-muted">{t('pricingPage.teamCalc.subtitle')}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface2 p-5 text-center">
              <p className="text-sm text-muted">{t('pricingPage.teamCalc.fivePro')}</p>
              <p className="mt-1 text-2xl font-bold text-text">
                {cycle === 'yearly' ? '$450' : '$45'}
                <span className="text-base font-normal text-muted">{cycle === 'yearly' ? '/yr' : '/mo'}</span>
              </p>
              <p className="mt-1 text-xs text-muted">5 × {t(`pricingPage.plans.${cycle === 'yearly' ? 'perYear' : 'perMonth'}`)}</p>
            </div>
            <div className="flex items-center justify-center">
              <svg className="h-8 w-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <div className="rounded-lg border-2 border-accent bg-accent/5 p-5 text-center">
              <p className="text-sm font-semibold text-accent">{t('pricingPage.teamCalc.teamPlan')}</p>
              <p className="mt-1 text-2xl font-bold text-text">
                {cycle === 'yearly' ? '$290' : '$29'}
                <span className="text-base font-normal text-muted">{cycle === 'yearly' ? '/yr' : '/mo'}</span>
              </p>
              <p className="mt-1 text-xs font-medium text-accent">
                {t('pricingPage.teamCalc.savings', {
                  amount: cycle === 'yearly' ? '$160' : '$16',
                })}
              </p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link
              to={`/app?upgrade=team&cycle=${cycle}`}
              className="inline-flex items-center rounded-md bg-accent px-6 py-3 text-base font-medium text-white transition-colors hover:bg-accent-hover"
            >
              {t('pricingPage.teamCalc.cta')}
            </Link>
          </div>
        </section>

        <p className="mt-12 text-center text-base text-muted">
          {t('pricing.footer')} {t('pricing.footerSecond')}
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-8">
          <Link to="/" className="text-base text-muted hover:text-text">TMC Studio</Link>
          <Link to="/privacy" className="text-base text-muted hover:text-text">{t('footer.privacy')}</Link>
          <Link to="/terms" className="text-base text-muted hover:text-text">{t('footer.terms')}</Link>
          <Link to="/cookies" className="text-base text-muted hover:text-text">{t('footer.cookies')}</Link>
          <Link to="/refunds" className="text-base text-muted hover:text-text">{t('landing.footer.refunds')}</Link>
        </div>
      </footer>
    </div>
  );
}

export default PricingPage;
