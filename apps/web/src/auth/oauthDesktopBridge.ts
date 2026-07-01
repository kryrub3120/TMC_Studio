const DESKTOP_AUTH_CALLBACK = 'tmcstudio://auth/callback';
const DESKTOP_AUTH_TIMEOUT_MS = 120000;

type TauriDeepLinkApi = {
  getCurrent?: () => Promise<string[] | null>;
  onOpenUrl?: (handler: (urls: string[]) => void) => Promise<() => void>;
};

type TauriOpenerApi = {
  openUrl?: (url: string) => Promise<void>;
};

type TauriGlobal = {
  deepLink?: TauriDeepLinkApi;
  opener?: TauriOpenerApi;
};

function getTauriGlobal(): TauriGlobal | null {
  const candidate = (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__;
  return candidate ?? null;
}

export function getDesktopAuthRedirectTo(): string {
  return DESKTOP_AUTH_CALLBACK;
}

function readOAuthCode(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'tmcstudio:') return null;
    if (parsed.hostname !== 'auth' || parsed.pathname !== '/callback') return null;

    const error = parsed.searchParams.get('error_description') ?? parsed.searchParams.get('error');
    if (error) {
      throw new Error(error);
    }

    return parsed.searchParams.get('code');
  } catch (error) {
    if (error instanceof Error) throw error;
    return null;
  }
}

export async function waitForDesktopOAuthCode(authUrl: string): Promise<string> {
  const tauri = getTauriGlobal();
  const deepLink = tauri?.deepLink;
  const opener = tauri?.opener;

  if (!deepLink?.onOpenUrl || !opener?.openUrl) {
    throw new Error('Desktop login bridge is not available');
  }

  const getCurrent = deepLink.getCurrent;
  const onOpenUrl = deepLink.onOpenUrl;
  const openUrl = opener.openUrl;

  return new Promise((resolve, reject) => {
    let settled = false;
    let unlisten: (() => void) | null = null;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      try {
        unlisten?.();
      } catch {
        // no-op
      }
    };

    const acceptUrls = (urls: string[] | null | undefined) => {
      if (!urls?.length) return;

      for (const url of urls) {
        try {
          const code = readOAuthCode(url);
          if (!code) continue;
          cleanup();
          resolve(code);
          return;
        } catch (error) {
          cleanup();
          reject(error);
          return;
        }
      }
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Google login took too long. Please try again.'));
    }, DESKTOP_AUTH_TIMEOUT_MS);

    (async () => {
      try {
        unlisten = await onOpenUrl((urls) => acceptUrls(urls));

        if (getCurrent) {
          acceptUrls(await getCurrent());
        }

        await openUrl(authUrl);
      } catch (error) {
        cleanup();
        reject(error);
      }
    })();
  });
}
