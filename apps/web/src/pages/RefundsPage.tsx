import { useTranslation } from '@tmc/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import {
  CONTACT_EMAILS,
  LEGAL_UPDATED_AT,
  LegalLink,
  LegalSection,
  PublicPageShell,
} from './PublicPageShell';

const SECTIONS = ['withdrawal', 'waiver', 'cancel', 'refund'] as const;

export function RefundsPage() {
  const { t } = useTranslation();
  const title = t('legal.refunds.title');
  const description = t('legal.refunds.intro');
  useDocumentMeta({ title: `${title} | TMC Studio`, description, path: '/refunds' });

  return (
    <PublicPageShell title={title} description={description} updatedAt={LEGAL_UPDATED_AT}>
      {SECTIONS.map((key) => (
        <LegalSection key={key} title={t(`legal.refunds.${key}Title`)}>
          <p>{t(`legal.refunds.${key}Body`)}</p>
        </LegalSection>
      ))}

      <LegalSection title={t('legal.refunds.contactTitle')}>
        <p>
          {t('legal.refunds.contactBody')}{' '}
          <LegalLink href={`mailto:${CONTACT_EMAILS.support}`}>{CONTACT_EMAILS.support}</LegalLink>
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}

export default RefundsPage;
