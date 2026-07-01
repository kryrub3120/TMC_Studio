export type GoogleOAuthSurface = 'web-popup' | 'web-redirect' | 'desktop-deeplink';

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function resolveGoogleOAuthSurface(): GoogleOAuthSurface {
  const configured = import.meta.env.VITE_AUTH_GOOGLE_SURFACE as string | undefined;

  if (configured === 'redirect') return 'web-redirect';
  if (configured === 'popup') return 'web-popup';
  if (configured === 'desktop' && isTauriRuntime()) return 'desktop-deeplink';

  return isTauriRuntime() ? 'desktop-deeplink' : 'web-popup';
}

