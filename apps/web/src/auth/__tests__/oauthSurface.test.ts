import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveGoogleOAuthSurface } from '../oauthSurface';

describe('resolveGoogleOAuthSurface', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses full-page redirect outside Tauri by default', () => {
    expect(resolveGoogleOAuthSurface()).toBe('web-redirect');
  });

  it('uses desktop deep-link inside Tauri by default', () => {
    vi.stubGlobal('window', { __TAURI_INTERNALS__: {} });

    expect(resolveGoogleOAuthSurface()).toBe('desktop-deeplink');
  });
});
