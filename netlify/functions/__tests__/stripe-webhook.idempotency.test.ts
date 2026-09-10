import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  constructEvent: vi.fn(),
  subscriptionsRetrieve: vi.fn(),
  subscriptionsList: vi.fn(),
}));

vi.hoisted(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock';
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
});

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    webhooks: { constructEvent: mocks.constructEvent },
    subscriptions: {
      retrieve: mocks.subscriptionsRetrieve,
      list: mocks.subscriptionsList,
    },
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mocks.from })),
}));

import {
  claimEvent,
  getSubscriptionIdFromInvoice,
  getSubscriptionPeriodEnd,
  handler,
} from '../stripe-webhook';

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

function updateSuccess() {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq }));

  return { update, eq };
}

function profileByCustomer(profileId = 'user-123') {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: profileId },
          error: null,
        }),
      })),
    })),
  };
}

function webhookEvent(type: string, object: Record<string, unknown>) {
  return {
    id: `evt_${type.replaceAll('.', '_')}`,
    type,
    data: { object },
  };
}

function handlerEvent(type: string, object: Record<string, unknown>) {
  mocks.constructEvent.mockReturnValue(webhookEvent(type, object));

  return {
    httpMethod: 'POST',
    headers: {
      'stripe-signature': 'sig_test',
      'x-forwarded-for': `127.0.0.${Math.floor(Math.random() * 200) + 1}`,
    },
    body: JSON.stringify(object),
  } as any;
}

function modernSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_modern',
    status: 'active',
    customer: 'cus_123',
    start_date: 1_786_467_758,
    items: {
      data: [
        {
          id: 'si_123',
          current_period_start: 1_786_467_758,
          current_period_end: 1_789_146_158,
          price: {
            id: 'price_1SnQvaANogcZdSR39JL60iCS',
            recurring: { interval: 'month', interval_count: 1 },
          },
        },
      ],
    },
    ...overrides,
  } as any;
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

describe('Stripe webhook subscription sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReset();
    mocks.constructEvent.mockReset();
    mocks.subscriptionsRetrieve.mockReset();
    mocks.subscriptionsList.mockReset();
  });

  it('reads the current period end from the subscription item for modern Stripe API responses', () => {
    const expiresAt = getSubscriptionPeriodEnd(modernSubscription({ current_period_end: undefined }));

    expect(expiresAt.toISOString()).toBe('2026-09-11T17:02:38.000Z');
  });

  it('extracts a subscription ID from modern invoice line parents', () => {
    const invoice = {
      lines: {
        data: [
          {
            parent: {
              subscription_item_details: {
                subscription: 'sub_from_line_parent',
              },
            },
          },
        ],
      },
    } as any;

    expect(getSubscriptionIdFromInvoice(invoice)).toBe('sub_from_line_parent');
  });

  it('syncs checkout.session.completed to Pro using item-level period dates', async () => {
    const profileUpdate = updateSuccess();
    mocks.from
      .mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ error: null }) })
      .mockReturnValueOnce(profileUpdate)
      .mockReturnValueOnce(updateSuccess());
    mocks.subscriptionsRetrieve.mockResolvedValueOnce(modernSubscription());

    const res = await handler(handlerEvent('checkout.session.completed', {
      id: 'cs_123',
      customer: 'cus_123',
      subscription: 'sub_modern',
      client_reference_id: 'user-123',
    }), {} as any);

    expect(res.statusCode).toBe(200);
    expect(mocks.subscriptionsRetrieve).toHaveBeenCalledWith('sub_modern', {
      expand: ['items.data.price', 'latest_invoice'],
    });
    expect(profileUpdate.update).toHaveBeenCalledWith({
      subscription_tier: 'pro',
      subscription_expires_at: '2026-09-11T17:02:38.000Z',
      stripe_customer_id: 'cus_123',
    });
  });

  it('syncs invoice.payment_succeeded renewals instead of only logging them', async () => {
    const profileUpdate = updateSuccess();
    mocks.from
      .mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ error: null }) })
      .mockReturnValueOnce(profileByCustomer('user-123'))
      .mockReturnValueOnce(profileUpdate)
      .mockReturnValueOnce(updateSuccess());
    mocks.subscriptionsRetrieve.mockResolvedValueOnce(modernSubscription());

    const res = await handler(handlerEvent('invoice.payment_succeeded', {
      id: 'in_123',
      customer: 'cus_123',
      amount_paid: 2900,
      currency: 'pln',
      lines: {
        data: [
          {
            parent: {
              subscription_item_details: {
                subscription: 'sub_modern',
              },
            },
          },
        ],
      },
    }), {} as any);

    expect(res.statusCode).toBe(200);
    expect(profileUpdate.update).toHaveBeenCalledWith({
      subscription_tier: 'pro',
      subscription_expires_at: '2026-09-11T17:02:38.000Z',
    });
  });

  it('does not downgrade a customer when a deleted event arrives after another active subscription exists', async () => {
    const profileUpdate = updateSuccess();
    mocks.from
      .mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ error: null }) })
      .mockReturnValueOnce(profileByCustomer('user-123'))
      .mockReturnValueOnce(profileUpdate)
      .mockReturnValueOnce(updateSuccess());
    mocks.subscriptionsList.mockResolvedValueOnce({
      data: [modernSubscription({ id: 'sub_active_replacement' })],
    });

    const res = await handler(handlerEvent('customer.subscription.deleted', {
      id: 'sub_old',
      customer: 'cus_123',
      status: 'canceled',
      items: { data: [] },
    }), {} as any);

    expect(res.statusCode).toBe(200);
    expect(profileUpdate.update).toHaveBeenCalledWith({
      subscription_tier: 'pro',
      subscription_expires_at: '2026-09-11T17:02:38.000Z',
    });
  });

  it('ignores active subscriptions with unknown prices when deciding whether downgrade is safe', async () => {
    const profileUpdate = updateSuccess();
    mocks.from
      .mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ error: null }) })
      .mockReturnValueOnce(profileByCustomer('user-123'))
      .mockReturnValueOnce(profileUpdate)
      .mockReturnValueOnce(updateSuccess());
    mocks.subscriptionsList.mockResolvedValueOnce({
      data: [modernSubscription({
        id: 'sub_unknown_price',
        items: {
          data: [
            {
              id: 'si_unknown',
              current_period_end: 1_789_146_158,
              price: {
                id: 'price_unknown_external',
                recurring: { interval: 'month', interval_count: 1 },
              },
            },
          ],
        },
      })],
    });

    const res = await handler(handlerEvent('customer.subscription.deleted', {
      id: 'sub_old',
      customer: 'cus_123',
      status: 'canceled',
      items: { data: [] },
    }), {} as any);

    expect(res.statusCode).toBe(200);
    expect(profileUpdate.update).toHaveBeenCalledWith({
      subscription_tier: 'free',
      subscription_expires_at: null,
    });
  });
});
