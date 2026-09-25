import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
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
    mocks.rpc.mockReset();
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    mocks.createClient.mockReset();
    mocks.createClient.mockReturnValue({
      auth: {
        getUser: mocks.getUser,
        updateUser: mocks.updateUser,
      },
      from: mocks.from,
      rpc: mocks.rpc,
    });
  });

  function mockProfile(profile: Record<string, unknown>) {
    const single = vi.fn().mockResolvedValue({ data: profile, error: null });
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    mocks.from.mockReturnValue({ select });
  }

  const freeMemberAuthUser = {
    id: 'user-2',
    email: 'member@example.com',
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-09-10T00:00:00.000Z',
    user_metadata: { locale: 'en' },
  };

  it('returns the club that grants Team access to a member', async () => {
    mockProfile({ id: 'user-2', email: 'member@example.com', subscription_tier: 'free', team_id: null });
    mocks.rpc.mockResolvedValue({ data: 'org-1', error: null });

    const { getCurrentUser } = await import('./supabase');
    const user = await getCurrentUser(freeMemberAuthUser as SupabaseAuthUser);

    expect(mocks.rpc).toHaveBeenCalledWith('get_my_club_access');
    expect(user).toMatchObject({ subscription_tier: 'free', club_organization_id: 'org-1' });
  });

  it('falls back to the own plan when the club access check fails', async () => {
    mockProfile({ id: 'user-2', email: 'member@example.com', subscription_tier: 'free', team_id: null });
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'function not found', code: 'PGRST202' } });

    const { getCurrentUser } = await import('./supabase');
    const user = await getCurrentUser(freeMemberAuthUser as SupabaseAuthUser);

    expect(user).toMatchObject({ subscription_tier: 'free', club_organization_id: null });
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
