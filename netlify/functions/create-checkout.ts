/**
 * Netlify Function: Create Stripe Checkout Session
 * Creates a checkout session for subscription upgrades
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

interface CheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId?: string;      // Supabase user ID for client_reference_id
  customerId?: string;   // Existing Stripe customer ID
  email?: string;        // User email for new customer creation
}

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
    return { statusCode: 204, headers, body: JSON.stringify({}) };
  }

  // Only POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Check Stripe key
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not configured');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Payment system not configured' }),
    };
  }

  try {
    const body: CheckoutRequest = JSON.parse(event.body || '{}');
    const { priceId, successUrl, cancelUrl, userId, customerId, email } = body;

    if (!priceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Price ID is required' }),
      };
    }

    if (!successUrl || !cancelUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Success and cancel URLs are required' }),
      };
    }

    // Build session params
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
    };

    // Add user ID for webhook correlation (critical for finding user in DB)
    if (userId) {
      sessionParams.client_reference_id = userId;
    }

    // If customer exists, use it; otherwise collect email
    if (customerId) {
      sessionParams.customer = customerId;
    } else if (email) {
      sessionParams.customer_email = email;
    }

    // Add subscription metadata
    sessionParams.subscription_data = {
      metadata: {
        source: 'tmc-studio-web',
        created_at: new Date().toISOString(),
      },
    };

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
    };
  } catch (error) {
    console.error('Checkout error:', error);

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
      body: JSON.stringify({ error: 'Failed to create checkout session' }),
    };
  }
};

export { handler };
