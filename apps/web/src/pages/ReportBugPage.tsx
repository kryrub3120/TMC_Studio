import { useState, type FormEvent } from 'react';
import { useTranslation } from '@tmc/ui';
import appPackage from '../../package.json';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { PublicPageShell } from './PublicPageShell';

export function ReportBugPage() {
  const { t, language } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  useDocumentMeta({ title: `${t('bugReport.title')} | TMC Studio`, description: t('bugReport.description'), path: '/report-bug' });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('sending');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const context = JSON.stringify({ version: appPackage.version, language, url: window.location.href, userAgent: navigator.userAgent }, null, 2);
    try {
      const response = await fetch('/api/report-bug', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, context }) });
      if (!response.ok) throw new Error('delivery failed');
      event.currentTarget.reset();
      setStatus('sent');
    } catch { setStatus('error'); }
  };

  return (
    <PublicPageShell title={t('bugReport.title')} description={t('bugReport.description')}>
      <div className="rounded-md border border-accent/30 bg-accent/10 p-4 text-sm leading-6 text-text">{t('bugReport.community')}</div>
      {status === 'sent' ? (
        <div className="mt-8 rounded-md border border-accent bg-surface p-8 text-center"><h2 className="text-xl font-semibold text-text">{t('bugReport.sentTitle')}</h2><p className="mt-2 text-muted">{t('bugReport.sentBody')}</p></div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5" data-testid="bug-report-form">
          <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
          <label className="block text-sm font-medium text-text">{t('bugReport.titleLabel')}<input name="title" required minLength={5} maxLength={120} className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-text" /></label>
          <label className="block text-sm font-medium text-text">{t('bugReport.descriptionLabel')}<textarea name="description" required minLength={15} rows={5} className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-text" /></label>
          <label className="block text-sm font-medium text-text">{t('bugReport.stepsLabel')}<textarea name="steps" rows={4} className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-text" /></label>
          <label className="block text-sm font-medium text-text">{t('bugReport.expectedLabel')}<textarea name="expected" rows={3} className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-text" /></label>
          <label className="block text-sm font-medium text-text">{t('bugReport.emailLabel')}<input name="email" type="email" className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-text" /></label>
          {status === 'error' && <p role="alert" className="text-sm text-red-400">{t('bugReport.error')}</p>}
          <button disabled={status === 'sending'} className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-bg disabled:opacity-50">{status === 'sending' ? t('bugReport.sending') : t('bugReport.submit')}</button>
        </form>
      )}
    </PublicPageShell>
  );
}
