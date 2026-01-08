/**
 * Stripe Webhook Handler
 * TMC Studio - Netlify Function
 * 
 * Handles Stripe subscription events and updates user profiles in Supabase
 * 
 * Events handled:
 * - checkout.session.completed → New subscription
 * - customer.subscription.updated → Plan change
 * - customer.subscription.deleted → Cancellation
 * - invoice.payment_succeeded → Renewal
 * - invoice.payment_failed → Payment issue
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize clients
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Subscription tier mapping
const PRICE_TO_TIER: Record<string, 'free' | 'pro' | 'team'> = {
  // Add your Stripe Price IDs here
  'price_pro_monthly': 'pro',
  'price_pro_yearly': 'pro',
  'price_team_monthly': 'team',
  'price_team_yearly': 'team',
};

/**
 * Update user subscription tier in Supabase
 */
async function updateUserSubscription(
  customerId: string,
  tier: 'free' | 'pro' | 'team',
  expiresAt: Date | null
): Promise<void> {
  // Get user by Stripe customer ID (stored in metadata)
  const { data: profile, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (selectError || !profile) {
    console.error('User not found for customer:', customerId);
    
    // Try to find by email from Stripe
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      throw new Error('Customer deleted in Stripe');
    }
    
    const email = customer.email;
    if (!email) {
      throw new Error('No email found for customer');
    }
    
    const { data: profileByEmail, error: emailError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    
    if (emailError || !profileByEmail) {
      throw new Error(`User not found for email: ${email}`);
    }
    
    // Update with customer ID for future lookups
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiresAt?.toISOString() ?? null,
        stripe_customer_id: customerId,
      })
      .eq('id', profileByEmail.id);
    
    if (updateError) {
      throw updateError;
    }
    
    console.log(`Updated subscription for user ${profileByEmail.id}: ${tier}`);
    return;
  }

  // Update user subscription
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_expires_at: expiresAt?.toISOString() ?? null,
    })
    .eq('id', profile.id);

  if (updateError) {
    throw updateError;
  }

  console.log(`Updated subscription for user ${profile.id}: ${tier}`);
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  console.log('Processing checkout session:', session.id);

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    console.log('No subscription in session, skipping');
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const tier = PRICE_TO_TIER[priceId] || 'pro';
  const expiresAt = new Date(subscription.current_period_end * 1000);

  await updateUserSubscription(customerId, tier, expiresAt);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  console.log('Processing subscription update:', subscription.id);

  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const tier = PRICE_TO_TIER[priceId] || 'pro';
  
  // Check subscription status
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    const expiresAt = new Date(subscription.current_period_end * 1000);
    await updateUserSubscription(customerId, tier, expiresAt);
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    // Downgrade to free
    await updateUserSubscription(customerId, 'free', null);
  }
}

/**
 * Handle subscription deletion (cancellation)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log('Processing subscription deletion:', subscription.id);

  const customerId = subscription.customer as string;
  await updateUserSubscription(customerId, 'free', null);
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  console.log('Processing paid invoice:', invoice.id);

  // Subscription renewals are handled by subscription.updated
  // This is mainly for logging/analytics
  const customerId = invoice.customer as string;
  const amount = invoice.amount_paid / 100;
  
  console.log(`Invoice paid: ${amount} ${invoice.currency?.toUpperCase()} from customer ${customerId}`);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('Processing failed invoice:', invoice.id);

  // Log the failure - Stripe will retry automatically
  const customerId = invoice.customer as string;
  console.warn(`Payment failed for customer ${customerId}, attempt ${invoice.attempt_count}`);
  
  // Optional: Send notification email via Postmark/Resend
  // await sendPaymentFailedEmail(customerId, invoice);
}

/**
 * Main webhook handler
 */
const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Verify required environment variables
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  // Get signature header
  const signature = event.headers['stripe-signature'];
  if (!signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing signature' }),
    };
  }

  let stripeEvent: Stripe.Event;

  // Verify webhook signature
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${message}` }),
    };
  }

  console.log(`Received event: ${stripeEvent.type}`);

  // Handle event
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaid(stripeEvent.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoiceFailed(stripeEvent.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error processing webhook:', message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: message }),
    };
  }
};

export { handler };
