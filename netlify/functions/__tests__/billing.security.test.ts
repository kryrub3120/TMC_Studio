/**
 * Billing Security Tests - Sprint 1
 * TMC Studio
 *
 * Tests for:
 * - CORS allowlist (_cors.ts)
 * - Auth verification (_auth.ts)
 * - Checkout security (create-checkout.ts)
 * - Portal security (create-portal-session.ts)
 * - Stripe config consistency (all sources)
 *
 * These tests mock Stripe and Supabase to avoid requiring
 * environment variables or network access.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ────────────────────────────────────────────────────────────────
// Mock dependencies that require env vars / network access
// ────────────────────────────────────────────────────────────────

vi.mock('stripe', () => {
  const mockCheckoutSessionsCreate = vi.fn();
  const mockBillingPortalSessionsCreate = vi.fn();

  class StripeError extends Error {
    constructor(msg: string) { super(msg); this.name = 'StripeError'; }
  }

  const MockStripe = vi.fn(() => ({
    checkout: { sessions: { create: mockCheckoutSessionsCreate } },
    billingPortal: { sessions: { create: mockBillingPortalSessionsCreate } },
  }));

  // Static errors property used by real Stripe SDK
  (MockStripe as any).errors = { StripeError };

  return {
    default: MockStripe,
    Stripe: MockStripe,
    StripeError,
    // Expose mocks for assertions
    __mockCheckoutSessionsCreate: mockCheckoutSessionsCreate,
    __mockBillingPortalSessionsCreate: mockBillingPortalSessionsCreate,
  };
});

vi.mock('@supabase/supabase-js', () => {
  const mockFrom = vi.fn();
  const mockGetUser = vi.fn();
  const mockGetSession = vi.fn();

  const mockSupabase = {
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
    },
    from: mockFrom,
  };

  return {
    createClient: vi.fn(() => mockSupabase),
    __mockSupabase: mockSupabase,
  };
});

// ────────────────────────────────────────────────────────────────
// Import helpers after mocks are set up
// ────────────────────────────────────────────────────────────────

import { getCorsHeaders, handlePreflight } from '../_cors';

// ================================================================
// 1. CORS Allowlist Tests
// ================================================================

describe('CORS (_cors.ts)', () => {
  beforeEach(() => {
    // Clear env between tests
    delete process.env.ALLOWED_ORIGINS;
  });

  it('allows production origin (tmcstudio.app)', () => {
    const result = getCorsHeaders('https://tmcstudio.app');
    expect(result).not.toBeNull();
    expect(result!.headers['Access-Control-Allow-Origin']).toBe('https://tmcstudio.app');
    expect(result!.headers['Vary']).toBe('Origin');
    expect(result!.headers['Access-Control-Allow-Headers']).toContain('Authorization');
  });

  it('allows www production origin', () => {
    const result = getCorsHeaders('https://www.tmcstudio.app');
    expect(result).not.toBeNull();
    expect(result!.headers['Access-Control-Allow-Origin']).toBe('https://www.tmcstudio.app');
  });

  it('allows localhost dev origins', () => {
    const result1 = getCorsHeaders('http://localhost:5173');
    expect(result1).not.toBeNull();
    expect(result1!.headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173');

    const result2 = getCorsHeaders('http://localhost:8888');
    expect(result2).not.toBeNull();
  });

  it('rejects disallowed origin', () => {
    const result = getCorsHeaders('https://evil.com');
    expect(result).toBeNull();
  });

  it('rejects unknown origin', () => {
    const result = getCorsHeaders('https://random-site.org');
    expect(result).toBeNull();
  });

  it('allows missing origin (server-to-server) with production default', () => {
    const result = getCorsHeaders(undefined);
    expect(result).not.toBeNull();
    expect(result!.headers['Access-Control-Allow-Origin']).toBe('https://tmcstudio.app');
  });

  it('includes Vary: Origin header', () => {
    const result = getCorsHeaders('https://tmcstudio.app');
    expect(result!.headers['Vary']).toBe('Origin');
  });

  it('handles OPTIONS preflight for allowed origin', () => {
    const preflightResult = handlePreflight({
      httpMethod: 'OPTIONS',
      headers: { origin: 'https://tmcstudio.app' },
    });
    expect(preflightResult).not.toBeNull();
    expect(preflightResult!.statusCode).toBe(204);
    expect(preflightResult!.headers['Access-Control-Allow-Origin']).toBe('https://tmcstudio.app');
  });

  it('handles OPTIONS preflight for disallowed origin', () => {
    const preflightResult = handlePreflight({
      httpMethod: 'OPTIONS',
      headers: { origin: 'https://evil.com' },
    });
    expect(preflightResult).not.toBeNull();
    // Should return 204 but without CORS headers
    expect(preflightResult!.statusCode).toBe(204);
    expect(preflightResult!.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('returns null for non-OPTIONS method', () => {
    const result = handlePreflight({
      httpMethod: 'POST',
      headers: { origin: 'https://tmcstudio.app' },
    });
    expect(result).toBeNull();
  });

  it('respects ALLOWED_ORIGINS env var for deploy previews', () => {
    process.env.ALLOWED_ORIGINS = 'https://preview--tmcstudio.netlify.app';
    const result = getCorsHeaders('https://preview--tmcstudio.netlify.app');
    expect(result).not.toBeNull();
    expect(result!.headers['Access-Control-Allow-Origin']).toBe('https://preview--tmcstudio.netlify.app');
  });

  it('parses comma-separated ALLOWED_ORIGINS correctly', () => {
    process.env.ALLOWED_ORIGINS = 'https://a.netlify.app, https://b.netlify.app';
    const resultA = getCorsHeaders('https://a.netlify.app');
    expect(resultA).not.toBeNull();
    const resultB = getCorsHeaders('https://b.netlify.app');
    expect(resultB).not.toBeNull();
    // Non-listed should still fail
    const resultC = getCorsHeaders('https://c.netlify.app');
    expect(resultC).toBeNull();
  });
});

// ================================================================
// 2. Auth Verification Tests
// ================================================================

describe('Auth (_auth.ts)', () => {
  let verifyAuth: typeof import('../_auth').verifyAuth;

  beforeEach(async () => {
    vi.resetModules();
    // Set env for auth tests
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    const mod = await import('../_auth');
    verifyAuth = mod.verifyAuth;
    vi.clearAllMocks();
  });

  it('throws 401 when no auth header', async () => {
    await expect(verifyAuth(undefined)).rejects.toThrow('Missing or invalid authorization token');
    try { await verifyAuth(undefined); } catch (e: any) {
      expect(e.statusCode).toBe(401);
    }
  });

  it('throws 401 when auth header is empty string', async () => {
    await expect(verifyAuth('')).rejects.toThrow('Missing or invalid authorization token');
    try { await verifyAuth(''); } catch (e: any) {
      expect(e.statusCode).toBe(401);
    }
  });

  it('throws 401 when auth header is not Bearer', async () => {
    await expect(verifyAuth('Basic dXNlcjpwYXNz')).rejects.toThrow('Missing or invalid authorization token');
  });

  it('throws 401 when Bearer token is empty', async () => {
    await expect(verifyAuth('Bearer ')).rejects.toThrow('Missing authorization token');
  });

  it('throws 401 when token is invalid (Supabase returns error)', async () => {
    const { __mockSupabase } = await import('@supabase/supabase-js');
    (__mockSupabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    await expect(verifyAuth('Bearer some-bad-token')).rejects.toThrow('Invalid token');
    try { await verifyAuth('Bearer some-bad-token'); } catch (e: any) {
      expect(e.statusCode).toBe(401);
    }
  });

  it('returns user when token is valid', async () => {
    const { __mockSupabase } = await import('@supabase/supabase-js');
    (__mockSupabase.auth.getUser as any).mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' },
      },
      error: null,
    });

    const user = await verifyAuth('Bearer valid-token');
    expect(user.id).toBe('user-123');
    expect(user.email).toBe('test@example.com');
  });
});

// ================================================================
// 3. Checkout Security Tests
// ================================================================

describe('Checkout Security (create-checkout.ts)', () => {
  let handler: typeof import('../create-checkout').handler;
  const validOrigin = 'https://tmcstudio.app';
  const validToken = 'Bearer valid-supabase-token';
  const validPriceId = 'price_1Sr4E7ANogcZdSR3Dwu2aPbV'; // pro monthly

  beforeEach(async () => {
    vi.resetModules();
    // Mock env vars
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    delete process.env.ALLOWED_ORIGINS;

    const { __mockSupabase } = await import('@supabase/supabase-js');

    // Default: valid auth
    (__mockSupabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    // Default: has no stripe_customer_id yet
    const mockSelectChain = vi.fn().mockReturnThis();
    const mockEqChain = vi.fn().mockReturnThis();
    const mockSingleChain = vi.fn().mockResolvedValue({
      data: { stripe_customer_id: null },
      error: null,
    });

    (__mockSupabase.from as any).mockReturnValue({
      select: mockSelectChain,
      eq: mockEqChain,
      single: mockSingleChain,
    });

    const mod = await import('../create-checkout');
    handler = mod.handler;
  });

  function makeEvent(overrides: Record<string, any> = {}) {
    return {
      httpMethod: overrides.httpMethod ?? 'POST',
      headers: {
        origin: validOrigin,
        authorization: validToken,
        'x-forwarded-for': '127.0.0.1',
        ...(overrides.headers || {}),
      },
      body: JSON.stringify({
        priceId: validPriceId,
        successUrl: '/app?checkout=success',
        cancelUrl: '/app?checkout=cancelled',
        ...(overrides.body || {}),
      }),
    } as any;
  }

  it('returns 401 when no auth token', async () => {
    const event = makeEvent({ headers: { origin: validOrigin } });
    delete event.headers.authorization;

    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('authorization');
  });

  it('returns 401 with invalid token', async () => {
    const { __mockSupabase } = await import('@supabase/supabase-js');
    (__mockSupabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const event = makeEvent({ headers: { origin: validOrigin, authorization: 'Bearer bad-token' } });
    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when priceId is missing', async () => {
    const event = makeEvent();
    const body = JSON.parse(event.body);
    delete body.priceId;
    event.body = JSON.stringify(body);
    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(400);
    const body2 = JSON.parse(res.body);
    expect(body2.error).toContain('Price ID');
  });

  it('returns 400 when priceId is unknown', async () => {
    const event = makeEvent({ body: { priceId: 'price_unknown', successUrl: '/app', cancelUrl: '/app' } });
    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('Invalid price ID');
  });

  it('returns 400 when successUrl is missing', async () => {
    const event = makeEvent();
    const body = JSON.parse(event.body);
    delete body.successUrl;
    event.body = JSON.stringify(body);
    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when redirect URL has disallowed origin', async () => {
    const event = makeEvent();
    const body = JSON.parse(event.body);
    body.successUrl = 'https://evil.com/phish';
    event.body = JSON.stringify(body);
    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(400);
    const body2 = JSON.parse(res.body);
    expect(body2.error).toContain('redirect URL');
  });

  it('returns 403 when CORS origin is not allowed', async () => {
    const event = makeEvent({ headers: { origin: 'https://evil.com' } });
    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(403);
  });

  it('ignores userId/customerId/email from body and uses auth values instead', async () => {
    const { __mockSupabase } = await import('@supabase/supabase-js');

    // Auth still returns user-123
    (__mockSupabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    // Even though profile has a stripe_customer_id
    const mockSingle = vi.fn().mockResolvedValue({
      data: { stripe_customer_id: 'cus_mocked_456' },
      error: null,
    });
    (__mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    });

    // Pass DIFFERENT userId/customerId/email in body
    const event = makeEvent({
      body: {
        priceId: validPriceId,
        successUrl: '/app?checkout=success',
        cancelUrl: '/app?checkout=cancelled',
        userId: 'user-hacker',
        customerId: 'cus_hacker',
        email: 'hacker@evil.com',
      },
    });

    // Mock Stripe create to capture what's passed
    const stripeModule = await import('stripe');
    const mockCreate = (stripeModule as any).__mockCheckoutSessionsCreate;
    mockCreate.mockResolvedValue({ id: 'cs_test_123', url: 'https://checkout.stripe.com/test' });

    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(200);

    // Verify the function used auth values, NOT body values
    const callArgs = mockCreate.mock.lastCall[0];
    expect(callArgs.client_reference_id).toBe('user-123');
    expect(callArgs.client_reference_id).not.toBe('user-hacker');
    expect(callArgs.customer).toBe('cus_mocked_456');
    expect(callArgs.customer).not.toBe('cus_hacker');
    // customer_email should NOT be set since we returned a customer ID
    expect(callArgs.customer_email).toBeUndefined();
  });

  it('uses customer_email when user has no stripe_customer_id', async () => {
    const supabaseJs = await import('@supabase/supabase-js');
    const mockSupabase = (supabaseJs as any).__mockSupabase;

    // Ensure single() returns null stripe_customer_id
    const mockSingle = vi.fn().mockResolvedValue({
      data: { stripe_customer_id: null },
      error: null,
    });
    const mockChain = vi.fn().mockReturnThis();
    mockSupabase.from.mockReturnValue({
      select: mockChain,
      eq: mockChain,
      single: mockSingle,
    });

    const stripeModule = await import('stripe');
    const mockCreate = (stripeModule as any).__mockCheckoutSessionsCreate;
    mockCreate.mockClear();
    mockCreate.mockResolvedValue({ id: 'cs_test_123', url: 'https://checkout.stripe.com/test' });

    const event = makeEvent({});
    const res = await handler(event, {} as any);
    if (res.statusCode !== 200) {
      console.log('ERROR RESPONSE:', res.statusCode, res.body);
    }
    expect(res.statusCode).toBe(200);

    const callArgs = mockCreate.mock.lastCall[0];
    expect(callArgs.customer_email).toBe('test@example.com');
    expect(callArgs.client_reference_id).toBe('user-123');
  });

  it('includes metadata with user_id, plan, billing_cycle', async () => {
    const stripeModule = await import('stripe');
    const mockCreate = (stripeModule as any).__mockCheckoutSessionsCreate;
    mockCreate.mockClear();
    mockCreate.mockResolvedValue({ id: 'cs_test_123', url: 'https://checkout.stripe.com/test' });

    const event = makeEvent({});
    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(200);

    const callArgs = mockCreate.mock.lastCall[0];
    expect(callArgs.subscription_data.metadata.user_id).toBe('user-123');
    expect(callArgs.subscription_data.metadata.plan).toBe('pro');
    expect(callArgs.subscription_data.metadata.billing_cycle).toBe('monthly');
    expect(callArgs.subscription_data.metadata.source).toBe('tmc-studio-web');
  });

  it('returns 429 after too many requests', async () => {
    const stripeModule = await import('stripe');
    const mockCreate = (stripeModule as any).__mockCheckoutSessionsCreate;
    mockCreate.mockResolvedValue({ id: 'cs_test_123', url: 'https://checkout.stripe.com/test' });

    // Make 5 requests (rate limit is 5/min)
    for (let i = 0; i < 5; i++) {
      const event = makeEvent({});
      await handler(event, {} as any);
    }

    // 6th should be rate limited
    const event = makeEvent({});
    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(429);
  });
});

// ================================================================
// 4. Portal Security Tests
// ================================================================

describe('Portal Security (create-portal-session.ts)', () => {
  let handler: typeof import('../create-portal-session').handler;
  const validOrigin = 'https://tmcstudio.app';
  const validToken = 'Bearer valid-supabase-token';

  beforeEach(async () => {
    vi.resetModules();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    delete process.env.ALLOWED_ORIGINS;

    const { __mockSupabase } = await import('@supabase/supabase-js');

    // Default: valid auth
    (__mockSupabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    // Default: has stripe_customer_id
    const mockSingle = vi.fn().mockResolvedValue({
      data: { stripe_customer_id: 'cus_mocked_456' },
      error: null,
    });
    (__mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    });

    const mod = await import('../create-portal-session');
    handler = mod.handler;
  });

  function makeEvent(overrides: Record<string, any> = {}) {
    return {
      httpMethod: overrides.httpMethod ?? 'POST',
      headers: {
        origin: validOrigin,
        authorization: validToken,
        'x-forwarded-for': '127.0.0.1',
        ...(overrides.headers || {}),
      },
      body: JSON.stringify({
        returnUrl: '/app',
        ...(overrides.body || {}),
      }),
    } as any;
  }

  it('returns 401 when no auth token', async () => {
    const event = makeEvent({ headers: { origin: validOrigin } });
    delete event.headers.authorization;

    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when returnUrl is a foreign domain', async () => {
    const event = makeEvent({
      body: { returnUrl: 'https://evil.com/phish' },
    });
    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('return URL');
  });

  it('accepts relative returnUrl', async () => {
    const stripeModule = await import('stripe');
    const mockCreate = (stripeModule as any).__mockBillingPortalSessionsCreate;
    mockCreate.mockResolvedValue({ url: 'https://billing.stripe.com/session' });

    const event = makeEvent({ body: { returnUrl: '/settings' } });
    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(200);
  });

  it('uses customer from profile, not from body', async () => {
    const stripeModule = await import('stripe');
    const mockCreate = (stripeModule as any).__mockBillingPortalSessionsCreate;
    mockCreate.mockClear();
    mockCreate.mockResolvedValue({ url: 'https://billing.stripe.com/session' });

    // Body tries to pass a different customer
    const event = makeEvent({
      body: { returnUrl: '/app', customer: 'cus_hacker' },
    });
    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(200);

    const callArgs = mockCreate.mock.lastCall[0];
    expect(callArgs.customer).toBe('cus_mocked_456');
    expect(callArgs.customer).not.toBe('cus_hacker');
  });

  it('returns 400 when user has no stripe_customer_id', async () => {
    const { __mockSupabase } = await import('@supabase/supabase-js');
    const mockSingle = vi.fn().mockResolvedValue({
      data: { stripe_customer_id: null },
      error: null,
    });
    (__mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    });

    const event = makeEvent({});
    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('No subscription');
  });

  it('returns 403 when CORS origin is not allowed', async () => {
    const event = makeEvent({ headers: { origin: 'https://evil.com' } });
    const res = await handler(event, {} as any);
    expect(res.statusCode).toBe(403);
  });
});

// ================================================================
// 5. Stripe Config Consistency Tests
// ================================================================

describe('Stripe Config Consistency', () => {
  it('backend and frontend configs have matching price IDs', async () => {
    // Load backend config
    const backend = await import('../_stripeConfig');

    // Load frontend config (from the alias, since functions can't import apps/web)
    // We read the file directly and compare values
    const fs = await import('fs');
    const path = await import('path');

    const frontendPath = path.resolve(__dirname, '../../../apps/web/src/config/stripe.ts');
    const backendPath = path.resolve(__dirname, '../_stripeConfig.ts');

    const frontendContent = fs.readFileSync(frontendPath, 'utf-8');
    const backendContent = fs.readFileSync(backendPath, 'utf-8');

    // Extract price IDs from both files
    const priceIdRegex = /'price_[A-Za-z0-9]+'/g;
    const frontendIds = new Set(frontendContent.match(priceIdRegex)?.map(s => s.replace(/'/g, '')) || []);
    const backendIds = new Set(backendContent.match(priceIdRegex)?.map(s => s.replace(/'/g, '')) || []);

    // They should have the same IDs
    expect(frontendIds.size).toBeGreaterThan(0);
    expect(backendIds.size).toBeGreaterThan(0);

    // All backend IDs should exist in frontend
    for (const id of backendIds) {
      expect(frontendIds.has(id)).toBe(true);
    }

    // All frontend IDs should exist in backend
    for (const id of frontendIds) {
      expect(backendIds.has(id)).toBe(true);
    }
  });

  it('PricingModal has matching price IDs', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const pricingPath = path.resolve(__dirname, '../../../packages/ui/src/PricingModal.tsx');
    const backendPath = path.resolve(__dirname, '../_stripeConfig.ts');

    const pricingContent = fs.readFileSync(pricingPath, 'utf-8');
    const backendContent = fs.readFileSync(backendPath, 'utf-8');

    const priceIdRegex = /'price_[A-Za-z0-9]+'/g;
    const pricingIds = new Set(pricingContent.match(priceIdRegex)?.map(s => s.replace(/'/g, '')) || []);
    const backendIds = new Set(backendContent.match(priceIdRegex)?.map(s => s.replace(/'/g, '')) || []);

    expect(pricingIds.size).toBeGreaterThan(0);
    expect(backendIds.size).toBeGreaterThan(0);

    // All pricing modal IDs should exist in backend
    for (const id of pricingIds) {
      expect(backendIds.has(id)).toBe(true);
    }

    // All backend IDs should exist in pricing modal
    for (const id of backendIds) {
      expect(pricingIds.has(id)).toBe(true);
    }
  });

  it('backend PRICE_TO_TIER covers all defined price IDs', async () => {
    const backend = await import('../_stripeConfig');

    const allIds = [
      backend.STRIPE_PRICES.pro.monthly,
      backend.STRIPE_PRICES.pro.yearly,
      backend.STRIPE_PRICES.team.monthly,
      backend.STRIPE_PRICES.team.yearly,
    ];

    for (const id of allIds) {
      const tier = backend.getTierFromPriceId(id);
      expect(tier).not.toBe('free');
    }

    // Unknown ID returns 'free'
    expect(backend.getTierFromPriceId('price_unknown')).toBe('free');
  });
});