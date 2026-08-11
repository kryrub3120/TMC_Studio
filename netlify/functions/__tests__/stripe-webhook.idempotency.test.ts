import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    webhooks: { constructEvent: vi.fn() },
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mocks.from })),
}));

process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

import { claimEvent } from '../stripe-webhook';

function duplicateInsert() {
  return {
    insert: vi.fn().mockResolvedValue({
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    }),
  };
}

function existingEvent(status: string, createdAt: string) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { status, created_at: createdAt },
          error: null,
        }),
      })),
    })),
  };
}

function reclaimResult(data: { event_id: string } | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const select = vi.fn(() => ({ maybeSingle }));
  const thirdEq = vi.fn(() => ({ select }));
  const secondEq = vi.fn(() => ({ eq: thirdEq }));
  const firstEq = vi.fn(() => ({ eq: secondEq }));
  const update = vi.fn(() => ({ eq: firstEq }));

  return { update };
}

describe('Stripe webhook event claiming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('claims a new event', async () => {
    mocks.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    await expect(claimEvent('evt_new', 'invoice.paid')).resolves.toEqual({ claimed: true });
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it('ignores an event that already succeeded', async () => {
    mocks.from
      .mockReturnValueOnce(duplicateInsert())
      .mockReturnValueOnce(existingEvent('success', new Date().toISOString()));

    await expect(claimEvent('evt_success', 'invoice.paid')).resolves.toEqual({ claimed: false });
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });

  it('reclaims an event that previously failed', async () => {
    const createdAt = new Date().toISOString();
    mocks.from
      .mockReturnValueOnce(duplicateInsert())
      .mockReturnValueOnce(existingEvent('error', createdAt))
      .mockReturnValueOnce(reclaimResult({ event_id: 'evt_error' }));

    await expect(claimEvent('evt_error', 'invoice.payment_failed')).resolves.toEqual({ claimed: true });
    expect(mocks.from).toHaveBeenCalledTimes(3);
  });

  it('reclaims a stale processing event after an interrupted invocation', async () => {
    const staleCreatedAt = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    mocks.from
      .mockReturnValueOnce(duplicateInsert())
      .mockReturnValueOnce(existingEvent('processing', staleCreatedAt))
      .mockReturnValueOnce(reclaimResult({ event_id: 'evt_stale' }));

    await expect(claimEvent('evt_stale', 'customer.subscription.updated')).resolves.toEqual({ claimed: true });
  });

  it('does not steal an event from an active invocation', async () => {
    mocks.from
      .mockReturnValueOnce(duplicateInsert())
      .mockReturnValueOnce(existingEvent('processing', new Date().toISOString()));

    await expect(claimEvent('evt_active', 'invoice.paid')).resolves.toEqual({ claimed: false });
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });

  it('loses a concurrent reclaim race without processing twice', async () => {
    const createdAt = new Date().toISOString();
    mocks.from
      .mockReturnValueOnce(duplicateInsert())
      .mockReturnValueOnce(existingEvent('error', createdAt))
      .mockReturnValueOnce(reclaimResult(null));

    await expect(claimEvent('evt_race', 'invoice.paid')).resolves.toEqual({ claimed: false });
  });
});
