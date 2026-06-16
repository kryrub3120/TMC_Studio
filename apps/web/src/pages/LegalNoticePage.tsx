import { useTranslation } from '@tmc/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import {
  COMPANY_DETAILS,
  CONTACT_EMAILS,
  LegalLink,
  LegalSection,
  PublicPageShell,
} from './PublicPageShell';

export function LegalNoticePage() {
  const { t } = useTranslation();
  const title = t('legal.legalNotice.title');
  const description = t('legal.legalNotice.intro');
  useDocumentMeta({ title: `${title} | TMC Studio`, description, path: '/legal' });

  return (
    <PublicPageShell title={title} description={description}>
      <LegalSection title={t('legal.legalNotice.providerTitle')}>
        <p className="whitespace-pre-line">
          {COMPANY_DETAILS.name}{'\n'}
          {COMPANY_DETAILS.address}{'\n'}
          KRS: {COMPANY_DETAILS.krs}{'\n'}
          NIP: {COMPANY_DETAILS.nip}{'\n'}
          REGON: {COMPANY_DETAILS.regon}{'\n'}
          {t('legal.legalNotice.registeredAt', { date: COMPANY_DETAILS.registeredAt })}
        </p>
      </LegalSection>

      <LegalSection title={t('legal.legalNotice.contactTitle')}>
        <p>
          {t('legal.legalNotice.contactBody')}{' '}
          <LegalLink href={`mailto:${CONTACT_EMAILS.legal}`}>{CONTACT_EMAILS.legal}</LegalLink>
        </p>
      </LegalSection>

      <LegalSection title={t('legal.legalNotice.vatTitle')}>
        <p>{t('legal.legalNotice.vatBody', { nip: COMPANY_DETAILS.nip })}</p>
      </LegalSection>

      <LegalSection title={t('legal.legalNotice.responsibleTitle')}>
        <p>{t('legal.legalNotice.responsibleBody')}</p>
      </LegalSection>

      <LegalSection title={t('legal.legalNotice.odrTitle')}>
        <p>
          {t('legal.legalNotice.odrBody')}{' '}
          <LegalLink href="https://ec.europa.eu/consumers/odr">https://ec.europa.eu/consumers/odr</LegalLink>
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}

export default LegalNoticePage;
