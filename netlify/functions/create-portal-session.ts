/**
 * Netlify Function: Create Stripe Customer Portal Session
 * Allows users to manage their subscription, payment methods, and invoices
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Check environment variables
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  try {
    // Get authorization token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing or invalid authorization token' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired token' }),
      };
    }

    // Get user profile with stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User profile not found' }),
      };
    }

    if (!profile.stripe_customer_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No subscription found. Please upgrade first.' }),
      };
    }

    // Parse return URL from request
    const body = JSON.parse(event.body || '{}');
    const returnUrl = body.returnUrl || `${event.headers.origin || 'http://localhost:5173'}/settings`;

    // Create Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: session.url,
      }),
    };
  } catch (error) {
    console.error('Portal session error:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create portal session' }),
    };
  }
};

export { handler };
