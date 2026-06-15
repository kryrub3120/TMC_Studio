import { useTranslation } from '@tmc/ui';

const UPDATED_AT = 'January 10, 2026';
const prohibitedKeys = ['laws', 'ip', 'malware', 'offensive'];
const acceptableKeys = ['reverse', 'automated', 'disrupt', 'share', 'illegal'];

export function TermsOfService() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('legal.terms.title')}</h1>
          <p className="text-muted">{t('legal.updated', { date: UPDATED_AT })}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.acceptance.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.terms.acceptance.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.description.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.terms.description.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.accounts.title')}</h2>
            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.terms.accounts.registrationTitle')}</h3>
            <p className="text-muted leading-relaxed">{t('legal.terms.accounts.registration')}</p>

            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.terms.accounts.securityTitle')}</h3>
            <p className="text-muted leading-relaxed">{t('legal.terms.accounts.security')}</p>

            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.terms.accounts.terminationTitle')}</h3>
            <p className="text-muted leading-relaxed">{t('legal.terms.accounts.termination')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.payments.title')}</h2>
            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.terms.payments.pricingTitle')}</h3>
            <p className="text-muted leading-relaxed">{t('legal.terms.payments.pricing')}</p>

            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.terms.payments.billingTitle')}</h3>
            <p className="text-muted leading-relaxed">{t('legal.terms.payments.billing')}</p>

            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.terms.payments.refundsTitle')}</h3>
            <p className="text-muted leading-relaxed">{t('legal.terms.payments.refunds')}</p>

            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.terms.payments.cancellationTitle')}</h3>
            <p className="text-muted leading-relaxed">{t('legal.terms.payments.cancellation')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.content.title')}</h2>
            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.terms.content.ownershipTitle')}</h3>
            <p className="text-muted leading-relaxed">{t('legal.terms.content.ownership')}</p>

            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.terms.content.licenseTitle')}</h3>
            <p className="text-muted leading-relaxed">{t('legal.terms.content.license')}</p>

            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.terms.content.prohibitedTitle')}</h3>
            <p className="text-muted leading-relaxed mb-2">{t('legal.terms.content.prohibitedIntro')}</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              {prohibitedKeys.map((key) => <li key={key}>{t(`legal.terms.content.prohibited.${key}`)}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.acceptable.title')}</h2>
            <p className="text-muted leading-relaxed mb-2">{t('legal.terms.acceptable.intro')}</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              {acceptableKeys.map((key) => <li key={key}>{t(`legal.terms.acceptable.items.${key}`)}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.ip.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.terms.ip.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.disclaimers.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.terms.disclaimers.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.liability.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.terms.liability.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.backup.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.terms.backup.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.changes.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.terms.changes.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.law.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.terms.law.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.contact.title')}</h2>
            <p className="text-muted leading-relaxed">
              {t('legal.terms.contact.body')}{' '}
              <a href="mailto:legal@tmcstudio.app" className="text-accent hover:underline">
                legal@tmcstudio.app
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <a href="/" className="inline-flex items-center gap-2 text-accent hover:underline">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('legal.back')}
          </a>
        </div>
      </div>
    </div>
  );
}
