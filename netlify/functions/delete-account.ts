/**
 * Netlify Function: delete the signed-in user's account and data.
 *
 * Security:
 * - requires a valid Supabase JWT; the user id comes from the token, never
 *   from the body
 * - the body must confirm with { "confirm": "DELETE" }
 * - CORS restricted to allowed origins, rate limited
 * See _accountDeletion.ts for what is deleted and in which order.
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth, AuthError } from './_auth';
import { getCorsHeaders, handlePreflight } from './_cors';
import { checkRateLimit } from './_rateLimit';
import {
  AccountDeletionError,
  assertDeleteConfirmation,
  deleteUserAccount,
  type DeletionStripe,
  type DeletionSupabase,
} from './_accountDeletion';

function response(statusCode: number, cors: { headers: Record<string, string> }, body: object) {
  return { statusCode, ...cors, body: JSON.stringify(body) };
}

export const handler: Handler = async (event: HandlerEvent) => {
  const origin = typeof event.headers.origin === 'string' ? event.headers.origin : undefined;
  const cors = getCorsHeaders(origin);
  if (!cors) return { statusCode: 403, body: JSON.stringify({ error: 'Origin not allowed' }) };

  const preflight = handlePreflight(event);
  if (preflight) return preflight;
  if (event.httpMethod !== 'POST') return response(405, cors, { error: 'Method not allowed' });

  const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  const rateCheck = checkRateLimit(Array.isArray(clientIp) ? clientIp[0] : clientIp, {
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (!rateCheck.allowed) {
    return {
      statusCode: 429,
      headers: { ...cors.headers, 'Retry-After': String(rateCheck.retryAfter) },
      body: JSON.stringify({ error: 'Too many requests', code: 'rateLimited' }),
    };
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Account deletion is missing required configuration');
    return response(500, cors, { error: 'Account deletion is not configured', code: 'configurationError' });
  }

  try {
    const authUser = await verifyAuth(event.headers.authorization);
    assertDeleteConfirmation(JSON.parse(event.body || '{}'));

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' })
      : null;

    await deleteUserAccount(
      {
        supabase: supabase as unknown as DeletionSupabase,
        stripe: stripe as unknown as DeletionStripe | null,
      },
      authUser.id,
    );
    return response(200, cors, { deleted: true });
  } catch (error) {
    if (error instanceof AuthError) return response(error.statusCode, cors, { error: error.message, code: 'unauthorized' });
    if (error instanceof AccountDeletionError) {
      if (error.statusCode >= 500) console.error('Account deletion failed:', error.message);
      return response(error.statusCode, cors, { error: error.message, code: error.code });
    }
    if (error instanceof SyntaxError) return response(400, cors, { error: 'Invalid JSON', code: 'invalidRequest' });
    console.error('Account deletion failed:', error);
    return response(500, cors, { error: 'Account deletion failed', code: 'deletionFailed' });
  }
};
