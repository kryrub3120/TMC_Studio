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

const providedKeys = ['account', 'project', 'payment'];
const automaticKeys = ['usage', 'device', 'location'];
const useKeys = ['maintain', 'payments', 'updates', 'improve', 'legal'];
const rightsKeys = ['access', 'correct', 'delete', 'export', 'optOut'];

export function PrivacyPolicy() {
  const { t } = useTranslation();
  const title = t('legal.privacy.title');
  const description = t('legal.privacy.intro.body');
  useDocumentMeta({ title: `${title} | TMC Studio`, description, path: '/privacy' });

  return (
    <PublicPageShell title={title} description={description} updatedAt={LEGAL_UPDATED_AT}>
      <LegalSection title={t('legal.privacy.collect.title')}>
        <h3 className="font-semibold text-slate-950">{t('legal.privacy.collect.providedTitle')}</h3>
        <LegalList>
          {providedKeys.map((key) => <li key={key}>{t(`legal.privacy.collect.provided.${key}`)}</li>)}
        </LegalList>
        <h3 className="font-semibold text-slate-950">{t('legal.privacy.collect.automaticTitle')}</h3>
        <LegalList>
          {automaticKeys.map((key) => <li key={key}>{t(`legal.privacy.collect.automatic.${key}`)}</li>)}
        </LegalList>
      </LegalSection>

      <LegalSection title={t('legal.privacy.use.title')}>
        <LegalList>
          {useKeys.map((key) => <li key={key}>{t(`legal.privacy.use.items.${key}`)}</li>)}
        </LegalList>
      </LegalSection>

      <LegalSection title={t('legal.privacy.storage.title')}>
        <p>{t('legal.privacy.storage.body')}</p>
      </LegalSection>

      <LegalSection title={t('legal.privacy.sharing.title')}>
        <p>{t('legal.privacy.sharing.body')}</p>
        <LegalList>
          <li><strong>Stripe</strong> - {t('legal.privacy.sharing.stripe')}</li>
          <li><strong>Supabase</strong> - {t('legal.privacy.sharing.supabase')}</li>
          <li><strong>Netlify</strong> - {t('legal.privacy.sharing.netlify')}</li>
        </LegalList>
      </LegalSection>

      <LegalSection title={t('legal.privacy.rights.title')}>
        <p>{t('legal.privacy.rights.body')}</p>
        <LegalList>
          {rightsKeys.map((key) => <li key={key}>{t(`legal.privacy.rights.items.${key}`)}</li>)}
        </LegalList>
      </LegalSection>

      <LegalSection title={t('legal.privacy.cookies.title')}>
        <p>
          {t('legal.privacy.cookies.before')}{' '}
          <LegalLink href="/cookies">{t('legal.privacy.cookies.link')}</LegalLink>{' '}
          {t('legal.privacy.cookies.after')}
        </p>
      </LegalSection>

      <LegalSection title={t('legal.privacy.children.title')}>
        <p>{t('legal.privacy.children.body')}</p>
      </LegalSection>

      <LegalSection title={t('legal.privacy.changes.title')}>
        <p>{t('legal.privacy.changes.body')}</p>
      </LegalSection>

      <LegalSection title={t('legal.privacy.contact.title')}>
        <p>
          {t('legal.privacy.contact.body')}{' '}
          <LegalLink href={`mailto:${CONTACT_EMAILS.privacy}`}>{CONTACT_EMAILS.privacy}</LegalLink>
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
