import { useTranslation } from '@tmc/ui';

const UPDATED_AT = 'January 10, 2026';
const essentialKeys = ['authentication', 'session', 'security'];
const preferenceKeys = ['theme', 'language', 'ui'];
const analyticsKeys = ['usage', 'performance', 'errors'];
const storageKeys = ['cache', 'state', 'project'];
const browserKeys = ['blockAll', 'blockThirdParty', 'deleteSession', 'viewDelete'];

export function CookiePolicy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('legal.cookies.title')}</h1>
          <p className="text-muted">{t('legal.updated', { date: UPDATED_AT })}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.cookies.what.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.cookies.what.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.cookies.use.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.cookies.use.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.cookies.types.title')}</h2>

            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.cookies.types.essentialTitle')}</h3>
            <p className="text-muted leading-relaxed mb-2">{t('legal.cookies.types.essentialBody')}</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              {essentialKeys.map((key) => (
                <li key={key}>
                  <strong>{t(`legal.cookies.types.essential.${key}.label`)}</strong> - {t(`legal.cookies.types.essential.${key}.body`)}
                </li>
              ))}
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.cookies.types.preferenceTitle')}</h3>
            <p className="text-muted leading-relaxed mb-2">{t('legal.cookies.types.preferenceBody')}</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              {preferenceKeys.map((key) => (
                <li key={key}>
                  <strong>{t(`legal.cookies.types.preference.${key}.label`)}</strong> - {t(`legal.cookies.types.preference.${key}.body`)}
                </li>
              ))}
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.cookies.types.analyticsTitle')}</h3>
            <p className="text-muted leading-relaxed mb-2">{t('legal.cookies.types.analyticsBody')}</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              {analyticsKeys.map((key) => (
                <li key={key}>
                  <strong>{t(`legal.cookies.types.analytics.${key}.label`)}</strong> - {t(`legal.cookies.types.analytics.${key}.body`)}
                </li>
              ))}
            </ul>
            <p className="text-muted text-sm mt-2">{t('legal.cookies.types.analyticsNote')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.cookies.thirdParty.title')}</h2>
            <p className="text-muted leading-relaxed mb-2">{t('legal.cookies.thirdParty.body')}</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Supabase</strong> - {t('legal.cookies.thirdParty.supabase')}</li>
              <li><strong>Stripe</strong> - {t('legal.cookies.thirdParty.stripe')}</li>
            </ul>
            <p className="text-muted leading-relaxed mt-3">{t('legal.cookies.thirdParty.policies')}</p>
            <ul className="list-disc pl-6 space-y-2 text-muted mt-2">
              <li><a href="https://supabase.com/privacy" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">{t('legal.cookies.thirdParty.supabasePolicy')}</a></li>
              <li><a href="https://stripe.com/privacy" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">{t('legal.cookies.thirdParty.stripePolicy')}</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.cookies.localStorage.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.cookies.localStorage.body')}</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              {storageKeys.map((key) => <li key={key}>{t(`legal.cookies.localStorage.items.${key}`)}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.cookies.manage.title')}</h2>
            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.cookies.manage.browserTitle')}</h3>
            <p className="text-muted leading-relaxed">{t('legal.cookies.manage.browserBody')}</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              {browserKeys.map((key) => <li key={key}>{t(`legal.cookies.manage.browser.${key}`)}</li>)}
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-4">{t('legal.cookies.manage.impactTitle')}</h3>
            <p className="text-muted leading-relaxed">
              <strong>{t('legal.cookies.manage.important')}</strong> {t('legal.cookies.manage.impactBody')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.cookies.duration.title')}</h2>
            <div className="space-y-3 text-muted">
              <div className="p-3 bg-surface rounded-lg">
                <strong>{t('legal.cookies.duration.sessionTitle')}</strong> - {t('legal.cookies.duration.sessionBody')}
              </div>
              <div className="p-3 bg-surface rounded-lg">
                <strong>{t('legal.cookies.duration.persistentTitle')}</strong> - {t('legal.cookies.duration.persistentBody')}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.cookies.updates.title')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.cookies.updates.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.cookies.contact.title')}</h2>
            <p className="text-muted leading-relaxed">
              {t('legal.cookies.contact.body')}{' '}
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
