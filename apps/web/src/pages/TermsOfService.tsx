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

const prohibitedKeys = ['laws', 'ip', 'malware', 'offensive'];
const acceptableKeys = ['reverse', 'automated', 'disrupt', 'share', 'illegal'];

export function TermsOfService() {
  const { t } = useTranslation();
  const title = t('legal.terms.title');
  const description = t('legal.terms.description.body');
  useDocumentMeta({ title: `${title} | TMC Studio`, description, path: '/terms' });

  return (
    <PublicPageShell title={title} description={description} updatedAt={LEGAL_UPDATED_AT}>
      <LegalSection title={t('legal.terms.acceptance.title')}>
        <p>{t('legal.terms.acceptance.body')}</p>
      </LegalSection>

      <LegalSection title={t('legal.terms.accounts.title')}>
        <h3 className="font-semibold text-text">{t('legal.terms.accounts.registrationTitle')}</h3>
        <p>{t('legal.terms.accounts.registration')}</p>
        <h3 className="font-semibold text-text">{t('legal.terms.accounts.securityTitle')}</h3>
        <p>{t('legal.terms.accounts.security')}</p>
        <h3 className="font-semibold text-text">{t('legal.terms.accounts.terminationTitle')}</h3>
        <p>{t('legal.terms.accounts.termination')}</p>
      </LegalSection>

      <LegalSection title={t('legal.terms.payments.title')}>
        <h3 className="font-semibold text-text">{t('legal.terms.payments.pricingTitle')}</h3>
        <p>{t('legal.terms.payments.pricing')}</p>
        <h3 className="font-semibold text-text">{t('legal.terms.payments.billingTitle')}</h3>
        <p>{t('legal.terms.payments.billing')}</p>
        <h3 className="font-semibold text-text">{t('legal.terms.payments.refundsTitle')}</h3>
        <p>{t('legal.terms.payments.refunds')}</p>
        <h3 className="font-semibold text-text">{t('legal.terms.payments.cancellationTitle')}</h3>
        <p>{t('legal.terms.payments.cancellation')}</p>
      </LegalSection>

      <LegalSection title={t('legal.terms.content.title')}>
        <h3 className="font-semibold text-text">{t('legal.terms.content.ownershipTitle')}</h3>
        <p>{t('legal.terms.content.ownership')}</p>
        <h3 className="font-semibold text-text">{t('legal.terms.content.licenseTitle')}</h3>
        <p>{t('legal.terms.content.license')}</p>
        <h3 className="font-semibold text-text">{t('legal.terms.content.prohibitedTitle')}</h3>
        <p>{t('legal.terms.content.prohibitedIntro')}</p>
        <LegalList>
          {prohibitedKeys.map((key) => <li key={key}>{t(`legal.terms.content.prohibited.${key}`)}</li>)}
        </LegalList>
      </LegalSection>

      <LegalSection title={t('legal.terms.acceptable.title')}>
        <p>{t('legal.terms.acceptable.intro')}</p>
        <LegalList>
          {acceptableKeys.map((key) => <li key={key}>{t(`legal.terms.acceptable.items.${key}`)}</li>)}
        </LegalList>
      </LegalSection>

      <LegalSection title={t('legal.terms.ip.title')}>
        <p>{t('legal.terms.ip.body')}</p>
      </LegalSection>

      <LegalSection title={t('legal.terms.disclaimers.title')}>
        <p>{t('legal.terms.disclaimers.body')}</p>
      </LegalSection>

      <LegalSection title={t('legal.terms.liability.title')}>
        <p>{t('legal.terms.liability.body')}</p>
      </LegalSection>

      <LegalSection title={t('legal.terms.backup.title')}>
        <p>{t('legal.terms.backup.body')}</p>
      </LegalSection>

      <LegalSection title={t('legal.terms.changes.title')}>
        <p>{t('legal.terms.changes.body')}</p>
      </LegalSection>

      <LegalSection title={t('legal.terms.law.title')}>
        <p>{t('legal.terms.law.body')}</p>
      </LegalSection>

      <LegalSection title={t('legal.terms.contact.title')}>
        <p>
          {t('legal.terms.contact.body')}{' '}
          <LegalLink href={`mailto:${CONTACT_EMAILS.legal}`}>{CONTACT_EMAILS.legal}</LegalLink>
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
