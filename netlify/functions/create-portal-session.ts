/**
 * Netlify Function: Create Stripe Customer Portal Session
 * TMC Studio - Secure billing portal access
 *
 * Security:
 * - Requires valid Supabase JWT (Authorization header)
 * - Customer retrieved from authenticated user's profile, NOT from body
 * - returnUrl validated against allowed origins
 * - CORS restricted to allowed origins
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from './_rateLimit';
import { getCorsHeaders, handlePreflight } from './_cors';
import { verifyAuth, AuthError } from './_auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Allowed origins for returnUrl validation.
 */
const ALLOWED_RETURN_ORIGINS: ReadonlySet<string> = new Set([
  'https://tmcstudio.app',
  'https://www.tmcstudio.app',
  'http://localhost:5173',
  'http://localhost:8888',
]);

/**
 * Validate returnUrl — accepts relative paths or allowed origins.
 */
function isValidReturnUrl(url: string): boolean {
  try {
    // Relative URL (e.g. /settings, /app) — always safe
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return true;
    }

    const parsed = new URL(url);
    return ALLOWED_RETURN_ORIGINS.has(parsed.origin);
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
    { maxRequests: 3, windowMs: 60_000 }
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

  // ── Env check ─────────────────────────────────────────────────
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables');
    return {
      statusCode: 500,
      ...corsHeaders,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  try {
    // ══════════════════════════════════════════════════════════════
    // SECURITY: Verify auth FIRST
    // ══════════════════════════════════════════════════════════════
    const authUser = await verifyAuth(event.headers.authorization);

    // ── Get user profile (customer ID from DB, NOT from body) ────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return {
        statusCode: 404,
        ...corsHeaders,
        body: JSON.stringify({ error: 'User profile not found' }),
      };
    }

    if (!profile.stripe_customer_id) {
      return {
        statusCode: 400,
        ...corsHeaders,
        body: JSON.stringify({ error: 'No subscription found. Please upgrade first.' }),
      };
    }

    // ── Parse returnUrl ──────────────────────────────────────────
    const body: { returnUrl?: string } = JSON.parse(event.body || '{}');
    let returnUrl = body.returnUrl;

    // Default to app settings route if no returnUrl provided
    if (!returnUrl) {
      returnUrl = '/app';
    }

    // Validate returnUrl
    if (!isValidReturnUrl(returnUrl)) {
      return {
        statusCode: 400,
        ...corsHeaders,
        body: JSON.stringify({ error: 'Invalid return URL' }),
      };
    }

    // Construct full return URL for Stripe
    const fullReturnUrl = returnUrl.startsWith('http')
      ? returnUrl
      : `${origin || 'https://tmcstudio.app'}${returnUrl}`;

    // ── Create portal session ────────────────────────────────────
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: fullReturnUrl,
    });

    return {
      statusCode: 200,
      ...corsHeaders,
      body: JSON.stringify({
        url: session.url,
      }),
    };
  } catch (error) {
    console.error('Portal session error:', error);

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
      body: JSON.stringify({ error: 'Failed to create portal session' }),
    };
  }
};

export { handler };
