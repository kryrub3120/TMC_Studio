/**
 * Full account deletion (GDPR right to erasure).
 *
 * Runs with the service role, after the caller's JWT was verified. Order:
 * 1. refuse when the user owns a club that has other members (they must
 *    transfer ownership first; deleting would delete the club for everyone);
 * 2. Stripe: cancel open subscriptions and delete the customer (Stripe keeps
 *    invoices it must retain for accounting);
 * 3. storage: the user's project thumbnails and avatar files;
 * 4. auth user: deleting it cascades to profiles, projects, folders,
 *    memberships and preferences.
 *
 * Every step can be retried: a second call finishes what a failed one left.
 * Sentry holds no user identifiers (sendDefaultPii is off), so nothing to
 * delete there.
 */

export class AccountDeletionError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AccountDeletionError';
  }
}

type QueryResult<T> = Promise<{ data: T | null; error: { message: string } | null }>;

/** The slice of the Supabase admin client this module uses. */
export interface DeletionSupabase {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): QueryResult<Array<Record<string, unknown>>> & {
        maybeSingle(): QueryResult<Record<string, unknown>>;
        neq(column: string, value: string): QueryResult<Array<Record<string, unknown>>>;
      };
      in(column: string, values: string[]): {
        neq(column: string, value: string): QueryResult<Array<Record<string, unknown>>>;
      };
    };
  };
  storage: {
    from(bucket: string): {
      list(prefix: string): QueryResult<Array<{ name: string }>>;
      remove(paths: string[]): QueryResult<unknown>;
    };
  };
  auth: {
    admin: {
      deleteUser(id: string): Promise<{ error: { message: string } | null }>;
    };
  };
}

/** The slice of the Stripe client this module uses. */
export interface DeletionStripe {
  subscriptions: {
    list(params: { customer: string; status: 'all'; limit: number }): Promise<{
      data: Array<{ id: string; status: string }>;
    }>;
    cancel(id: string): Promise<unknown>;
  };
  customers: {
    del(id: string): Promise<unknown>;
  };
}

const OPEN_SUBSCRIPTION = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete']);

function fail(step: string, error: { message: string } | null | undefined): never {
  throw new AccountDeletionError('deletionFailed', 500, `${step}: ${error?.message ?? 'unknown error'}`);
}

function isMissingStripeResource(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === 'resource_missing';
}

export function assertDeleteConfirmation(body: unknown): void {
  if ((body as { confirm?: unknown } | null)?.confirm !== 'DELETE') {
    throw new AccountDeletionError('confirmationRequired', 400, 'Type DELETE to confirm');
  }
}

export async function deleteUserAccount(
  deps: { supabase: DeletionSupabase; stripe: DeletionStripe | null },
  userId: string,
): Promise<void> {
  const { supabase, stripe } = deps;

  // 1. A club with other members must not disappear under them.
  const owned = await supabase.from('organizations').select('id').eq('owner_id', userId);
  if (owned.error) fail('clubs', owned.error);
  const ownedIds = (owned.data ?? []).map((row) => String(row.id));
  if (ownedIds.length > 0) {
    const others = await supabase
      .from('organization_members')
      .select('organization_id')
      .in('organization_id', ownedIds)
      .neq('user_id', userId);
    if (others.error) fail('club members', others.error);
    if ((others.data ?? []).length > 0) {
      throw new AccountDeletionError(
        'ownsClubWithMembers',
        409,
        'Transfer club ownership or remove the members before deleting the account',
      );
    }
  }

  // 2. Stripe.
  const profile = await supabase.from('profiles').select('stripe_customer_id').eq('id', userId).maybeSingle();
  if (profile.error) fail('profile', profile.error);
  const customerId = profile.data?.stripe_customer_id;
  if (typeof customerId === 'string' && customerId) {
    if (!stripe) throw new AccountDeletionError('configurationError', 500, 'Billing is not configured');
    try {
      const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 });
      for (const subscription of subscriptions.data) {
        if (OPEN_SUBSCRIPTION.has(subscription.status)) await stripe.subscriptions.cancel(subscription.id);
      }
      await stripe.customers.del(customerId);
    } catch (error) {
      if (!isMissingStripeResource(error)) {
        fail('billing', { message: (error as Error)?.message ?? String(error) });
      }
    }
  }

  // 3. Files.
  const projects = await supabase.from('projects').select('id').eq('user_id', userId);
  if (projects.error) fail('projects', projects.error);
  const thumbnails = (projects.data ?? []).map((row) => `${String(row.id)}/thumbnail.png`);
  if (thumbnails.length > 0) {
    const removed = await supabase.storage.from('thumbnails').remove(thumbnails);
    if (removed.error) fail('thumbnails', removed.error);
  }
  const avatars = await supabase.storage.from('avatars').list(userId);
  if (avatars.error) fail('avatars', avatars.error);
  const avatarPaths = (avatars.data ?? []).map((file) => `${userId}/${file.name}`);
  if (avatarPaths.length > 0) {
    const removed = await supabase.storage.from('avatars').remove(avatarPaths);
    if (removed.error) fail('avatars', removed.error);
  }

  // 4. The auth user; the database cascades the rest.
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) fail('auth user', error);
}
