import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_POPUP_MESSAGE, waitForOAuthPopupCode } from '../oauthWebPopup';

describe('waitForOAuthPopupCode', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function setupWindow() {
    let messageListener: ((event: MessageEvent) => void) | undefined;

    vi.stubGlobal('window', {
      location: { origin: 'https://tmcstudio.test' },
      setTimeout,
      clearTimeout,
      addEventListener: (type: string, listener: (event: MessageEvent) => void) => {
        if (type === 'message') messageListener = listener;
      },
      removeEventListener: (type: string) => {
        if (type === 'message') messageListener = undefined;
      },
    });

    return (data: object) => {
      messageListener?.({
        origin: 'https://tmcstudio.test',
        data,
      } as MessageEvent);
    };
  }

  it('resolves with the PKCE code sent by the same-origin callback', async () => {
    const sendMessage = setupWindow();
    const popup = { close: vi.fn() } as unknown as Window;
    const codePromise = waitForOAuthPopupCode(popup);

    sendMessage({ type: AUTH_POPUP_MESSAGE, code: 'pkce-code' });

    await expect(codePromise).resolves.toBe('pkce-code');
  });

  it('does not read popup.closed under COOP', async () => {
    const sendMessage = setupWindow();
    const popup = { close: vi.fn() } as Window;
    Object.defineProperty(popup, 'closed', {
      get: () => {
        throw new Error('popup.closed must not be read');
      },
    });

    const codePromise = waitForOAuthPopupCode(popup);
    sendMessage({ type: AUTH_POPUP_MESSAGE, code: 'pkce-code' });

    await expect(codePromise).resolves.toBe('pkce-code');
  });
});
