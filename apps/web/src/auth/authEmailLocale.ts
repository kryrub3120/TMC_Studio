export type AuthEmailLocale = 'en' | 'pl' | 'es';

const AUTH_EMAIL_LOCALES = new Set<AuthEmailLocale>(['en', 'pl', 'es']);

export function resolveAuthEmailLocale(
  storedLanguage?: string | null,
  browserLanguage?: string | null,
): AuthEmailLocale {
  const stored = storedLanguage?.toLowerCase() as AuthEmailLocale | undefined;
  if (stored && AUTH_EMAIL_LOCALES.has(stored)) return stored;

  const browser = browserLanguage?.toLowerCase().split('-')[0] as AuthEmailLocale | undefined;
  return browser && AUTH_EMAIL_LOCALES.has(browser) ? browser : 'en';
}

export function getAuthEmailLocale(): AuthEmailLocale {
  if (typeof window === 'undefined') return 'en';

  return resolveAuthEmailLocale(
    window.localStorage.getItem('tmc-language'),
    window.navigator.language,
  );
}

export function buildLocalizedAuthUrl(path: string, origin?: string): string {
  const baseOrigin = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const url = new URL(path, baseOrigin);
  url.searchParams.set('lang', getAuthEmailLocale());
  return url.toString();
}
