import { afterEach, describe, expect, it, vi } from 'vitest';
import appPackage from '../../../package.json';
import { APP_VERSION, resolveEnvironment } from '../health';

describe('health environment', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('recognizes the canonical Netlify production URL', () => {
    vi.stubEnv('URL', 'https://tmcstudio.app');
    expect(resolveEnvironment()).toBe('production');
  });

  it('keeps local and preview runtimes outside production', () => {
    vi.stubEnv('URL', 'http://localhost:8888');
    expect(resolveEnvironment()).toBe('development');
  });

  it('reports the shared monorepo product version', () => {
    expect(APP_VERSION).toBe(appPackage.version);
  });
});
