/**
 * PricingPage — public `/pricing` page.
 *
 * Comparison of Guest / Free / Pro / Team built from the single source of
 * truth (`ENTITLEMENTS_BY_PLAN`). Upgrade CTAs route to `/app`, where the
 * existing auth + billing flow (PricingModal / useBillingController) handles
 * sign-in and Stripe Checkout — we don't duplicate checkout logic here.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, LanguageSwitcher } from '@tmc/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { track, EVENTS } from '../lib/analytics';
import { ENTITLEMENTS_BY_PLAN, type Plan } from '../lib/entitlements';

type Cycle = 'monthly' | 'yearly';

// Display prices mirror apps/web/src/config/stripe.ts (USD). EU consumers see
// VAT-inclusive amounts via Stripe at checkout (see docs/STRIPE_TAX_SETUP.md).
const PRICE: Record<'pro' | 'team', Record<Cycle, string>> = {
  pro: { monthly: '$9', yearly: '$90' },
  team: { monthly: '$29', yearly: '$290' },
};

const PLANS: Plan[] = ['guest', 'free', 'pro', 'team'];

export function PricingPage() {
  const { t } = useTranslation();
  useDocumentMeta({ title: t('seo.pricing.title'), description: t('seo.pricing.description'), path: '/pricing' });
  useEffect(() => { track(EVENTS.PRICING_VIEW); }, []);
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
    pro: { name: t('pricingPage.plans.proName'), tagline: t('pricingPage.plans.proTagline'), price: PRICE.pro[cycle], period: cycle === 'monthly' ? t('pricingPage.plans.perMonth') : t('pricingPage.plans.perYear'), cta: t('pricingPage.plans.proCta') },
    team: { name: t('pricingPage.plans.teamName'), tagline: t('pricingPage.plans.teamTagline'), price: PRICE.team[cycle], period: cycle === 'monthly' ? t('pricingPage.plans.perMonth') : t('pricingPage.plans.perYear'), cta: t('pricingPage.plans.teamCta') },
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
                aria-pressed={cycle === c}
                className={`rounded-md px-4 py-1.5 text-base font-medium transition-colors ${cycle === c ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
              >
                {t(`pricingPage.billing.${c}`)}
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
            return (
              <div key={p} className={`flex flex-col rounded-xl border p-6 ${highlight ? 'border-accent bg-surface' : 'border-border bg-surface'}`}>
                <h2 className="text-xl font-semibold">{m.name}</h2>
                <p className="mt-1 text-sm text-muted">{m.tagline}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-3xl font-bold">{m.price}</span>
                  {m.period && <span className="pb-1 text-base text-muted">{m.period}</span>}
                </div>
                <Link
                  to="/app"
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
