import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn(),
  from: vi.fn(),
}));

vi.unmock('./supabase');
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
vi.mock('./logger', () => ({ logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

describe('deleteAccount', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-1' } } });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.createClient.mockReturnValue({
      auth: { getSession: mocks.getSession, signOut: mocks.signOut },
      from: mocks.from,
    });
  });

  it('asks the server to delete the account and signs out locally', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ deleted: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const { deleteAccount } = await import('./supabase');

    await deleteAccount();

    expect(fetchMock).toHaveBeenCalledWith('/api/delete-account', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer jwt-1' }),
      body: JSON.stringify({ confirm: 'DELETE' }),
    }));
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
    // It no longer deletes the profile from the browser (RLS silently ignored it).
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('keeps the session and passes the server error code on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ code: 'ownsClubWithMembers', error: 'Transfer club ownership first' }),
    }));
    const { deleteAccount } = await import('./supabase');

    await expect(deleteAccount()).rejects.toMatchObject({ code: 'ownsClubWithMembers' });
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
});
