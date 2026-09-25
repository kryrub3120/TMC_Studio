import { describe, expect, it } from 'vitest';
import {
  AccountDeletionError,
  assertDeleteConfirmation,
  deleteUserAccount,
  type DeletionStripe,
  type DeletionSupabase,
} from '../_accountDeletion';

const USER = 'user-1';

interface FakeData {
  ownedClubs?: string[];
  otherMembers?: number;
  customerId?: string | null;
  projects?: string[];
  avatars?: string[];
  subscriptions?: Array<{ id: string; status: string }>;
  stripeError?: { code?: string; message: string };
  deleteUserError?: string;
}

function fakes(data: FakeData = {}) {
  const calls: string[] = [];
  const ok = <T>(value: T) => Promise.resolve({ data: value, error: null });
  const rows = (ids: string[]) => ids.map((id) => ({ id }));

  const supabase: DeletionSupabase = {
    from(table: string) {
      return {
        select() {
          return {
            eq(column: string) {
              const result =
                table === 'organizations'
                  ? ok(rows(data.ownedClubs ?? []))
                  : table === 'projects'
                    ? ok(rows(data.projects ?? []))
                    : ok([]);
              return Object.assign(result, {
                maybeSingle: () => ok(table === 'profiles' ? { stripe_customer_id: data.customerId ?? null } : null),
                neq: () => ok([]),
              }) as never;
            },
            in() {
              return { neq: () => ok(Array.from({ length: data.otherMembers ?? 0 }, () => ({ organization_id: 'c' }))) };
            },
          };
        },
      };
    },
    storage: {
      from(bucket: string) {
        return {
          list: () => ok((data.avatars ?? []).map((name) => ({ name }))),
          remove: (paths: string[]) => {
            calls.push(`remove ${bucket} ${paths.join(',')}`);
            return ok(null);
          },
        };
      },
    },
    auth: {
      admin: {
        deleteUser: async (id: string) => {
          calls.push(`deleteUser ${id}`);
          return { error: data.deleteUserError ? { message: data.deleteUserError } : null };
        },
      },
    },
  };

  const stripe: DeletionStripe = {
    subscriptions: {
      list: async () => {
        if (data.stripeError) throw data.stripeError;
        return { data: data.subscriptions ?? [] };
      },
      cancel: async (id: string) => {
        calls.push(`cancel ${id}`);
      },
    },
    customers: {
      del: async (id: string) => {
        calls.push(`deleteCustomer ${id}`);
      },
    },
  };

  return { supabase, stripe, calls };
}

describe('account deletion', () => {
  it('requires the typed DELETE confirmation', () => {
    expect(() => assertDeleteConfirmation({})).toThrow(AccountDeletionError);
    expect(() => assertDeleteConfirmation({ confirm: 'delete' })).toThrow(AccountDeletionError);
    expect(() => assertDeleteConfirmation({ confirm: 'DELETE' })).not.toThrow();
  });

  it('cancels billing, removes files and then deletes the auth user', async () => {
    const { supabase, stripe, calls } = fakes({
      customerId: 'cus_1',
      subscriptions: [
        { id: 'sub_active', status: 'active' },
        { id: 'sub_old', status: 'canceled' },
      ],
      projects: ['p1', 'p2'],
      avatars: ['avatar.png'],
    });

    await deleteUserAccount({ supabase, stripe }, USER);

    expect(calls).toEqual([
      'cancel sub_active',
      'deleteCustomer cus_1',
      'remove thumbnails p1/thumbnail.png,p2/thumbnail.png',
      `remove avatars ${USER}/avatar.png`,
      `deleteUser ${USER}`,
    ]);
  });

  it('skips Stripe for a user who never paid', async () => {
    const { supabase, stripe, calls } = fakes({ customerId: null });
    await deleteUserAccount({ supabase, stripe: null }, USER);
    expect(calls).toEqual([`deleteUser ${USER}`]);
    await deleteUserAccount({ supabase, stripe }, USER);
  });

  it('refuses while the user owns a club with other members, and deletes nothing', async () => {
    const { supabase, stripe, calls } = fakes({ ownedClubs: ['club-1'], otherMembers: 2, customerId: 'cus_1' });
    await expect(deleteUserAccount({ supabase, stripe }, USER)).rejects.toMatchObject({
      code: 'ownsClubWithMembers',
      statusCode: 409,
    });
    expect(calls).toEqual([]);
  });

  it('deletes a user who owns a club without other members', async () => {
    const { supabase, stripe, calls } = fakes({ ownedClubs: ['club-1'], otherMembers: 0 });
    await deleteUserAccount({ supabase, stripe }, USER);
    expect(calls).toEqual([`deleteUser ${USER}`]);
  });

  it('continues when the Stripe customer is already gone', async () => {
    const { supabase, stripe, calls } = fakes({ customerId: 'cus_gone', stripeError: { code: 'resource_missing', message: 'No such customer' } });
    await deleteUserAccount({ supabase, stripe }, USER);
    expect(calls).toEqual([`deleteUser ${USER}`]);
  });

  it('stops before deleting the user when billing cannot be cancelled', async () => {
    const { supabase, stripe, calls } = fakes({ customerId: 'cus_1', stripeError: { message: 'Stripe is down' } });
    await expect(deleteUserAccount({ supabase, stripe }, USER)).rejects.toMatchObject({ code: 'deletionFailed', statusCode: 500 });
    expect(calls).not.toContain(`deleteUser ${USER}`);
  });

  it('reports a failed auth deletion', async () => {
    const { supabase, stripe } = fakes({ deleteUserError: 'boom' });
    await expect(deleteUserAccount({ supabase, stripe }, USER)).rejects.toMatchObject({ code: 'deletionFailed' });
  });
});
