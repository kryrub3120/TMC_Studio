import { useTranslation } from '@tmc/ui';

export function LegalNoticePage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">{t('legal.legalNotice.title')}</h1>
        <p className="text-muted mb-8">{t('legal.legalNotice.intro')}</p>
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.legalNotice.providerTitle')}</h2>
            <p className="text-muted leading-relaxed whitespace-pre-line">{t('legal.legalNotice.providerBody')}</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.legalNotice.contactTitle')}</h2>
            <p className="text-muted leading-relaxed">
              {t('legal.legalNotice.contactBody')}{' '}
              <a href="mailto:privacy@tmcstudio.app" className="text-accent hover:underline">privacy@tmcstudio.app</a>
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.legalNotice.vatTitle')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.legalNotice.vatBody')}</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.legalNotice.responsibleTitle')}</h2>
            <p className="text-muted leading-relaxed">{t('legal.legalNotice.responsibleBody')}</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('legal.legalNotice.odrTitle')}</h2>
            <p className="text-muted leading-relaxed">
              {t('legal.legalNotice.odrBody')}{' '}
              <a href="https://ec.europa.eu/consumers/odr" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a>
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
export default LegalNoticePage;
