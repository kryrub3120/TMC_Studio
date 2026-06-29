import { useTranslation } from '@tmc/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import {
  CONTACT_EMAILS,
  LEGAL_UPDATED_AT,
  LegalLink,
  LegalList,
  LegalSection,
  PublicPageShell,
} from './PublicPageShell';

const essentialKeys = ['authentication', 'session', 'security'];
const preferenceKeys = ['theme', 'language', 'ui'];
const analyticsKeys = ['usage', 'performance', 'errors'];
const storageKeys = ['cache', 'state', 'project'];
const browserKeys = ['blockAll', 'blockThirdParty', 'deleteSession', 'viewDelete'];

export function CookiePolicy() {
  const { t } = useTranslation();
  const title = t('legal.cookies.title');
  const description = t('legal.cookies.what.body');
  useDocumentMeta({ title: `${title} | TMC Studio`, description, path: '/cookies' });

  return (
    <PublicPageShell title={title} description={description} updatedAt={LEGAL_UPDATED_AT}>
      <LegalSection title={t('legal.cookies.use.title')}>
        <p>{t('legal.cookies.use.body')}</p>
      </LegalSection>

      <LegalSection title={t('legal.cookies.types.title')}>
        <h3 className="font-semibold text-text">{t('legal.cookies.types.essentialTitle')}</h3>
        <p>{t('legal.cookies.types.essentialBody')}</p>
        <LegalList>
          {essentialKeys.map((key) => (
            <li key={key}>
              <strong>{t(`legal.cookies.types.essential.${key}.label`)}</strong> - {t(`legal.cookies.types.essential.${key}.body`)}
            </li>
          ))}
        </LegalList>

        <h3 className="font-semibold text-text">{t('legal.cookies.types.preferenceTitle')}</h3>
        <p>{t('legal.cookies.types.preferenceBody')}</p>
        <LegalList>
          {preferenceKeys.map((key) => (
            <li key={key}>
              <strong>{t(`legal.cookies.types.preference.${key}.label`)}</strong> - {t(`legal.cookies.types.preference.${key}.body`)}
            </li>
          ))}
        </LegalList>

        <h3 className="font-semibold text-text">{t('legal.cookies.types.analyticsTitle')}</h3>
        <p>{t('legal.cookies.types.analyticsBody')}</p>
        <LegalList>
          {analyticsKeys.map((key) => (
            <li key={key}>
              <strong>{t(`legal.cookies.types.analytics.${key}.label`)}</strong> - {t(`legal.cookies.types.analytics.${key}.body`)}
            </li>
          ))}
        </LegalList>
        <p className="text-sm text-muted">{t('legal.cookies.types.analyticsNote')}</p>
      </LegalSection>

      <LegalSection title={t('legal.cookies.thirdParty.title')}>
        <p>{t('legal.cookies.thirdParty.body')}</p>
        <LegalList>
          <li><strong>Supabase</strong> - {t('legal.cookies.thirdParty.supabase')}</li>
          <li><strong>Stripe</strong> - {t('legal.cookies.thirdParty.stripe')}</li>
        </LegalList>
        <p>{t('legal.cookies.thirdParty.policies')}</p>
        <LegalList>
          <li><LegalLink href="https://supabase.com/privacy">{t('legal.cookies.thirdParty.supabasePolicy')}</LegalLink></li>
          <li><LegalLink href="https://stripe.com/privacy">{t('legal.cookies.thirdParty.stripePolicy')}</LegalLink></li>
        </LegalList>
      </LegalSection>

      <LegalSection title={t('legal.cookies.localStorage.title')}>
        <p>{t('legal.cookies.localStorage.body')}</p>
        <LegalList>
          {storageKeys.map((key) => <li key={key}>{t(`legal.cookies.localStorage.items.${key}`)}</li>)}
        </LegalList>
      </LegalSection>

      <LegalSection title={t('legal.cookies.manage.title')}>
        <h3 className="font-semibold text-text">{t('legal.cookies.manage.browserTitle')}</h3>
        <p>{t('legal.cookies.manage.browserBody')}</p>
        <LegalList>
          {browserKeys.map((key) => <li key={key}>{t(`legal.cookies.manage.browser.${key}`)}</li>)}
        </LegalList>
        <h3 className="font-semibold text-text">{t('legal.cookies.manage.impactTitle')}</h3>
        <p><strong>{t('legal.cookies.manage.important')}</strong> {t('legal.cookies.manage.impactBody')}</p>
      </LegalSection>

      <LegalSection title={t('legal.cookies.duration.title')}>
        <p><strong>{t('legal.cookies.duration.sessionTitle')}</strong> - {t('legal.cookies.duration.sessionBody')}</p>
        <p><strong>{t('legal.cookies.duration.persistentTitle')}</strong> - {t('legal.cookies.duration.persistentBody')}</p>
      </LegalSection>

      <LegalSection title={t('legal.cookies.updates.title')}>
        <p>{t('legal.cookies.updates.body')}</p>
      </LegalSection>

      <LegalSection title={t('legal.cookies.contact.title')}>
        <p>
          {t('legal.cookies.contact.body')}{' '}
          <LegalLink href={`mailto:${CONTACT_EMAILS.privacy}`}>{CONTACT_EMAILS.privacy}</LegalLink>
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
