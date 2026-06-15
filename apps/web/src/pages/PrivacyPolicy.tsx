import { useTranslation } from '@tmc/ui';

const UPDATED_AT = 'January 10, 2026';
const providedKeys = ['account', 'project', 'payment'];
const automaticKeys = ['usage', 'device', 'location'];
const useKeys = ['maintain', 'payments', 'updates', 'improve', 'legal'];
const rightsKeys = ['access', 'correct', 'delete', 'export', 'optOut'];

export function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('legal.privacy.title')}</h1>
          <p className="text-muted">{t('legal.updated', { date: UPDATED_AT })}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.privacy.intro.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.privacy.intro.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.privacy.collect.title')}</h2>
            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.privacy.collect.providedTitle')}</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              {providedKeys.map((key) => <li key={key}>{t(`legal.privacy.collect.provided.${key}`)}</li>)}
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.privacy.collect.automaticTitle')}</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              {automaticKeys.map((key) => <li key={key}>{t(`legal.privacy.collect.automatic.${key}`)}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.privacy.use.title')}</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              {useKeys.map((key) => <li key={key}>{t(`legal.privacy.use.items.${key}`)}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.privacy.storage.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.privacy.storage.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.privacy.sharing.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.privacy.sharing.body')}</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Stripe</strong> - {t('legal.privacy.sharing.stripe')}</li>
              <li><strong>Supabase</strong> - {t('legal.privacy.sharing.supabase')}</li>
              <li><strong>Netlify</strong> - {t('legal.privacy.sharing.netlify')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.privacy.rights.title')}</h2>
            <p className="text-muted leading-relaxed mb-2">{t('legal.privacy.rights.body')}</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              {rightsKeys.map((key) => <li key={key}>{t(`legal.privacy.rights.items.${key}`)}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.privacy.cookies.title')}</h2>
            <p className="text-muted leading-relaxed">
              {t('legal.privacy.cookies.before')}{' '}
              <a href="/cookies" className="text-accent hover:underline">{t('legal.privacy.cookies.link')}</a>{' '}
              {t('legal.privacy.cookies.after')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.privacy.children.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.privacy.children.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.privacy.changes.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.privacy.changes.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.privacy.contact.title')}</h2>
            <p className="text-muted leading-relaxed">
              {t('legal.privacy.contact.body')}{' '}
              <a href="mailto:privacy@tmcstudio.app" className="text-accent hover:underline">
                privacy@tmcstudio.app
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
