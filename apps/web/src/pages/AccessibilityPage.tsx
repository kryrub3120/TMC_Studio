import { useTranslation } from '@tmc/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import {
  CONTACT_EMAILS,
  LEGAL_UPDATED_AT,
  LegalLink,
  LegalSection,
  PublicPageShell,
} from './PublicPageShell';

export function AccessibilityPage() {
  const { t } = useTranslation();
  const title = t('legal.accessibility.title');
  const description = t('legal.accessibility.commitmentBody');
  useDocumentMeta({ title: `${title} | TMC Studio`, description, path: '/accessibility' });

  return (
    <PublicPageShell title={title} description={description} updatedAt={LEGAL_UPDATED_AT}>
      <LegalSection title={t('legal.accessibility.statusTitle')}>
        <p>{t('legal.accessibility.statusBody')}</p>
      </LegalSection>

      <LegalSection title={t('legal.accessibility.feedbackTitle')}>
        <p>
          {t('legal.accessibility.feedbackBody')}{' '}
          <LegalLink href={`mailto:${CONTACT_EMAILS.support}`}>{CONTACT_EMAILS.support}</LegalLink>
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}

export default AccessibilityPage;
