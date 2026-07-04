export const AUTH_POPUP_NAME = 'tmc-google-auth';
export const AUTH_POPUP_MESSAGE = 'tmc:auth-popup-result';
export const AUTH_POPUP_CALLBACK_PATH = '/auth/popup-callback.html';

export type AuthPopupMessage = {
  type: typeof AUTH_POPUP_MESSAGE;
  /** PKCE authorization code returned by the OAuth provider. */
  code?: string;
  error?: string;
};

function writeOAuthPopupShell(popup: Window) {
  try {
    popup.document.title = 'TMC Studio - Google login';
    popup.document.body.innerHTML = `
      <main style="
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        background: #0f172a;
        color: #f8fafc;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <section style="width: min(340px, calc(100vw - 32px)); text-align: center;">
          <div style="
            width: 48px;
            height: 48px;
            margin: 0 auto 18px;
            border-radius: 999px;
            border: 4px solid rgba(255,255,255,.18);
            border-top-color: #38bdf8;
            animation: tmcSpin .8s linear infinite;
          "></div>
          <h1 style="margin: 0 0 8px; font-size: 20px;">TMC Studio</h1>
          <p style="margin: 0; color: #cbd5e1; line-height: 1.5;">Opening Google login...</p>
        </section>
        <style>@keyframes tmcSpin { to { transform: rotate(360deg); } }</style>
      </main>
    `;
  } catch {
    // Some browsers restrict writing to the popup. The OAuth flow can continue.
  }
}

export function openOAuthPopup(): Window {
  const width = 500;
  const height = 680;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${Math.round(left)}`,
    `top=${Math.round(top)}`,
    'popup=yes',
    'resizable=yes',
    'scrollbars=yes',
  ].join(',');

  const popup = window.open('', AUTH_POPUP_NAME, features);
  if (!popup) {
    throw new Error('Google login popup was blocked by the browser');
  }
  writeOAuthPopupShell(popup);
  popup.focus();
  return popup;
}

/**
 * Waits for the static popup callback page to post the PKCE authorization
 * code back to this (opener) window. The popup never touches Supabase or
 * tokens — the code is exchanged for a session here, in the main window.
 */
export function waitForOAuthPopupCode(popup: Window): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const settle = (action: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      action();
    };

    const timeout = window.setTimeout(() => {
      settle(() => {
        try {
          popup.close();
        } catch {
          // no-op
        }
        reject(new Error('Google login took too long. Please try again.'));
      });
    }, 120000);

    // Detect the user closing the popup. Grace period lets a message that
    // was posted right before self-close still arrive.
    const closedPoll = window.setInterval(() => {
      if (!popup.closed) return;
      window.clearInterval(closedPoll);
      window.setTimeout(() => {
        settle(() => reject(new Error('Google login window was closed before finishing.')));
      }, 1500);
    }, 400);

    const onMessage = (event: MessageEvent<AuthPopupMessage>) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== AUTH_POPUP_MESSAGE) return;

      const { code, error } = event.data;
      settle(() => {
        if (code) {
          resolve(code);
        } else {
          reject(new Error(error ?? 'Google login failed.'));
        }
      });
    };

    const cleanup = () => {
      window.clearTimeout(timeout);
      window.clearInterval(closedPoll);
      window.removeEventListener('message', onMessage);
    };

    window.addEventListener('message', onMessage);
  });
}
