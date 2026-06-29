/**
 * Netlify Function: Create Stripe Checkout Session
 * TMC Studio - Subscription checkout with auth verification
 *
 * Security:
 * - Requires valid Supabase JWT (Authorization header)
 * - client_reference_id set from authenticated user, NOT from body
 * - customer_id/email from user profile, NOT from body
 * - priceId validated against allowlist in _stripeConfig.ts
 * - successUrl/cancelUrl validated against CORS allowlist
 * - CORS restricted to allowed origins
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from './_rateLimit';
import { getCorsHeaders, handlePreflight } from './_cors';
import { verifyAuth, AuthError } from './_auth';
import { STRIPE_PRICES, getTierFromPriceId } from './_stripeConfig';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Validated price IDs from backend config.
 * Keys are the actual price IDs that are allowed.
 */
const ALLOWED_PRICE_IDS: ReadonlySet<string> = new Set([
  STRIPE_PRICES.pro.monthly,
  STRIPE_PRICES.pro.yearly,
  STRIPE_PRICES.team.monthly,
  STRIPE_PRICES.team.yearly,
]);

/**
 * Allowed origins for success/cancel URLs.
 * Only path-based URLs under these origins are accepted.
 */
const ALLOWED_URL_ORIGINS: ReadonlySet<string> = new Set([
  'https://tmcstudio.app',
  'https://www.tmcstudio.app',
  'http://localhost:5173',
  'http://localhost:8888',
]);

/**
 * Validate that a redirect URL is safe to use.
 * Accepts only paths (e.g. /app?checkout=success) or full URLs
 * whose origin is in the allowlist.
 */
function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://tmcstudio.app'); // base for relative

    // Relative URL (no protocol) — always safe, use as-is
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return true;
    }

    // Full URL — must be in allowlist
    return ALLOWED_URL_ORIGINS.has(parsed.origin);
  } catch {
    return false;
  }
}

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // ── CORS ──────────────────────────────────────────────────────
  const origin =
    typeof event.headers.origin === 'string'
      ? event.headers.origin
      : undefined;
  const corsHeaders = getCorsHeaders(origin);
  if (!corsHeaders) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Origin not allowed' }),
    };
  }

  const preflight = handlePreflight(event);
  if (preflight) return preflight;

  // ── Rate limiting ─────────────────────────────────────────────
  const clientIp =
    event.headers['x-forwarded-for'] ||
    event.headers['client-ip'] ||
    'unknown';
  const rateCheck = checkRateLimit(
    typeof clientIp === 'string' ? clientIp : clientIp[0],
    { maxRequests: 5, windowMs: 60_000 }
  );
  if (!rateCheck.allowed) {
    return {
      statusCode: 429,
      headers: {
        'Retry-After': String(rateCheck.retryAfter),
        ...corsHeaders.headers,
      },
      body: JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    };
  }

  // ── Method check ──────────────────────────────────────────────
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      ...corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // ── Stripe key check ──────────────────────────────────────────
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not configured');
    return {
      statusCode: 500,
      ...corsHeaders,
      body: JSON.stringify({ error: 'Payment system not configured' }),
    };
  }

  try {
    // ══════════════════════════════════════════════════════════════
    // SECURITY: Verify auth FIRST — all subsequent data comes from
    // the authenticated user, not from the request body.
    // ══════════════════════════════════════════════════════════════
    const authUser = await verifyAuth(event.headers.authorization);

    // ── Parse body (only trusted fields) ─────────────────────────
    const body: {
      priceId?: string;
      successUrl?: string;
      cancelUrl?: string;
    } = JSON.parse(event.body || '{}');

    const { priceId, successUrl, cancelUrl } = body;

    // ── Validate priceId ─────────────────────────────────────────
    if (!priceId) {
      return {
        statusCode: 400,
        ...corsHeaders,
        body: JSON.stringify({ error: 'Price ID is required' }),
      };
    }

    if (!ALLOWED_PRICE_IDS.has(priceId)) {
      return {
        statusCode: 400,
        ...corsHeaders,
        body: JSON.stringify({ error: 'Invalid price ID' }),
      };
    }

    // ── Validate redirect URLs ───────────────────────────────────
    if (!successUrl || !cancelUrl) {
      return {
        statusCode: 400,
        ...corsHeaders,
        body: JSON.stringify({ error: 'Success and cancel URLs are required' }),
      };
    }

    if (!isValidRedirectUrl(successUrl) || !isValidRedirectUrl(cancelUrl)) {
      return {
        statusCode: 400,
        ...corsHeaders,
        body: JSON.stringify({ error: 'Invalid redirect URL' }),
      };
    }

    // ── Get user profile for stripe_customer_id ──────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', authUser.id)
      .single();

    // ── Determine tier from priceId ──────────────────────────────
    const tier = getTierFromPriceId(priceId);
    const billingCycle = priceId.includes('yearly') ? 'yearly' : 'monthly';

    // ── Build session params ─────────────────────────────────────
    // NOTE: client_reference_id is set from AUTH, not from body.
    // customer and customer_email are set from the profile/auth.
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      // CRITICAL: client_reference_id = auth user ID (for webhook)
      client_reference_id: authUser.id,
      // Use existing Stripe customer if available
      ...(profile?.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: authUser.email || undefined }),
      subscription_data: {
        metadata: {
          source: 'tmc-studio-web',
          user_id: authUser.id,
          plan: tier,
          billing_cycle: billingCycle,
          created_at: new Date().toISOString(),
        },
      },
    };

    // ── Create checkout session ──────────────────────────────────
    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      ...corsHeaders,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
    };
  } catch (error) {
    console.error('Checkout error:', error);

    if (error instanceof AuthError) {
      return {
        statusCode: error.statusCode,
        ...corsHeaders,
        body: JSON.stringify({ error: error.message }),
      };
    }

    if (error instanceof Stripe.errors.StripeError) {
      return {
        statusCode: 400,
        ...corsHeaders,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 500,
      ...corsHeaders,
      body: JSON.stringify({ error: 'Failed to create checkout session' }),
    };
  }
};

export { handler };
