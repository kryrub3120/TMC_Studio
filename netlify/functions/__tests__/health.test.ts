import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveEnvironment } from '../health';

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
});
