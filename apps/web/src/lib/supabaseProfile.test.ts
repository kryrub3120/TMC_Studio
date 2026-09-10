import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  from: vi.fn(),
}));

vi.unmock('./supabase');
vi.unmock('../lib/supabase');

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}));

vi.mock('./logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../auth/authEmailLocale', () => ({
  buildLocalizedAuthUrl: (path: string) => `https://tmcstudio.test${path}`,
  getAuthEmailLocale: () => 'en',
}));

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    mocks.getUser.mockReset();
    mocks.updateUser.mockReset();
    mocks.from.mockReset();
    mocks.createClient.mockReset();
    mocks.createClient.mockReturnValue({
      auth: {
        getUser: mocks.getUser,
        updateUser: mocks.updateUser,
      },
      from: mocks.from,
    });
  });

  it('returns team_id from the fresh profile record', async () => {
    const authUser = {
      id: 'user-1',
      email: 'coach@example.com',
      app_metadata: {},
      aud: 'authenticated',
      created_at: '2026-09-10T00:00:00.000Z',
      user_metadata: { locale: 'en' },
    };
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'user-1',
        email: 'coach@example.com',
        full_name: 'Coach',
        avatar_url: null,
        subscription_tier: 'team',
        stripe_customer_id: 'cus_123',
        team_id: 'team-123',
      },
      error: null,
    });
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    mocks.from.mockReturnValue({ select });

    const { getCurrentUser } = await import('./supabase');
    const user = await getCurrentUser(authUser as SupabaseAuthUser);

    expect(user).toMatchObject({
      id: 'user-1',
      subscription_tier: 'team',
      stripe_customer_id: 'cus_123',
      team_id: 'team-123',
    });
  });
});
