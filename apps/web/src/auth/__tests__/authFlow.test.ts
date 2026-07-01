import { describe, expect, it } from 'vitest';
import { idleAuthFlow } from '../authFlow';

describe('idleAuthFlow', () => {
  it('starts with no method, surface, error, or retry', () => {
    expect(idleAuthFlow).toEqual({
      status: 'idle',
      method: null,
      surface: null,
      startedAt: null,
      error: null,
      retryable: false,
    });
  });
});

