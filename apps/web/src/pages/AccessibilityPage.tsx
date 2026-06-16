import { useTranslation } from '@tmc/ui';

const UPDATED_AT = 'June 15, 2026';

export function AccessibilityPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('legal.accessibility.title')}</h1>
          <p className="text-muted">{t('legal.updated', { date: UPDATED_AT })}</p>
        </div>
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.accessibility.commitmentTitle')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.accessibility.commitmentBody')}</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.accessibility.statusTitle')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.accessibility.statusBody')}</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.accessibility.feedbackTitle')}</h2>
            <p className="text-muted leading-relaxed">
              {t('legal.accessibility.feedbackBody')}{' '}
              <a href="mailto:privacy@tmcstudio.app" className="text-accent hover:underline">privacy@tmcstudio.app</a>.
            </p>
          </section>
        </div>
        <div className="mt-12 pt-8 border-t border-border">
          <a href="/" className="inline-flex items-center gap-2 text-accent hover:underline">{t('legal.back')}</a>
        </div>
      </div>
    </div>
  );
}
export default AccessibilityPage;
