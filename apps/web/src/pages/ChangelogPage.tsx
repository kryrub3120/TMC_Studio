import { useTranslation } from '@tmc/ui';
import appPackage from '../../package.json';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { PublicPageShell } from './PublicPageShell';

const RELEASES = [
  { version: '0.13.0', translationKey: 'v013', date: '2026-08-13', sections: { new: ['lineups', 'feedback'], improved: ['library', 'responsive'], fixed: ['returnFlow', 'presetMenu'] } },
  { version: '0.12.0', translationKey: 'v012', date: '2026-08-12', sections: { new: ['sessions', 'intervals'], improved: ['bulk', 'roster'], fixed: ['pdf', 'navigation'] } },
  { version: '0.11.0', translationKey: 'v011', date: '2026-08-12', sections: { new: ['workflow', 'seo'], improved: ['oauth'], fixed: ['pdf', 'authCallback'] } },
] as const;

const SECTION_STYLES = {
  new: 'border-accent/30 bg-accent/10 text-accent',
  improved: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  fixed: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
} as const;

export function ChangelogPage() {
  const { t } = useTranslation();
  useDocumentMeta({ title: `${t('changelog.title')} | TMC Studio`, description: t('changelog.description'), path: '/changelog' });
  return (
    <PublicPageShell title={t('changelog.title')} description={t('changelog.description')}>
      <div className="space-y-8">
        <div className="rounded-md border border-accent/30 bg-accent/10 p-4 text-sm text-text">
          {t('changelog.current', { version: appPackage.version })}
        </div>
        {RELEASES.map((release) => (
          <article key={release.version} className="border-t border-border pt-7 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-semibold text-text">v{release.version}</h2>
              <time className="text-sm text-muted">{release.date}</time>
            </div>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted">{t(`changelog.releases.${release.translationKey}.summary`)}</p>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {(Object.entries(release.sections) as Array<[keyof typeof release.sections, readonly string[]]>).map(([section, items]) => (
                <section key={section}>
                  <h3 className={`inline-flex rounded border px-2 py-1 text-xs font-semibold uppercase ${SECTION_STYLES[section]}`}>
                    {t(`changelog.sections.${section}`)}
                  </h3>
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-muted">
                    {items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{t(`changelog.releases.${release.translationKey}.${item}`)}</li>)}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
    </PublicPageShell>
  );
}
