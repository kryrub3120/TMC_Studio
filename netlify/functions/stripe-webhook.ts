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
 * 
 * Features:
 * - Idempotency (INSERT-first pattern prevents duplicate processing)
 * - client_reference_id for reliable user lookup
 * - Audit trail in stripe_webhook_events table
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getTierFromPriceId } from './_stripeConfig';

// Environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize clients
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Claim event for processing (INSERT-first idempotency pattern)
 * 
 * Returns { claimed: true } if we successfully claimed this event
 * Returns { claimed: false } if event was already processed (duplicate)
 * Throws on unexpected database errors
 */
async function claimEvent(eventId: string, eventType: string): Promise<{ claimed: boolean }> {
  const { error } = await supabase
    .from('stripe_webhook_events')
    .insert({
      event_id: eventId,
      event_type: eventType,
      status: 'processing',
    });

  if (!error) {
    return { claimed: true };
  }

  // Check if it's a duplicate key violation
  const isDuplicate = error.message?.toLowerCase().includes('duplicate') ||
                      error.code === '23505'; // PostgreSQL unique violation code

  if (isDuplicate) {
    console.log(`Event ${eventId} already processing/processed (duplicate)`);
    return { claimed: false };
  }

  // Unknown database error
  console.error('Unexpected error claiming event:', error);
  throw error;
}

/**
 * Mark event as successfully processed
 */
async function markEventSuccess(eventId: string): Promise<void> {
  await supabase
    .from('stripe_webhook_events')
    .update({
      status: 'success',
      processed_at: new Date().toISOString(),
    })
    .eq('event_id', eventId);
}

/**
 * Mark event as failed
 */
async function markEventError(eventId: string, errorMessage: string): Promise<void> {
  await supabase
    .from('stripe_webhook_events')
    .update({
      status: 'error',
      error_message: errorMessage,
      processed_at: new Date().toISOString(),
    })
    .eq('event_id', eventId);
}

/**
 * Update user subscription by user ID (direct lookup - most reliable)
 */
async function updateUserById(
  userId: string,
  customerId: string,
  tier: 'free' | 'pro' | 'team',
  expiresAt: Date | null
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_expires_at: expiresAt?.toISOString() ?? null,
      stripe_customer_id: customerId, // Store for future lookups
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }

  console.log(`✅ Updated user ${userId} to ${tier} (expires: ${expiresAt?.toISOString() ?? 'never'})`);
}

/**
 * Update user subscription by Stripe customer ID (fallback)
 */
async function updateUserByCustomerId(
  customerId: string,
  tier: 'free' | 'pro' | 'team',
  expiresAt: Date | null
): Promise<void> {
  // Try customer ID lookup first
  const { data: profile, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiresAt?.toISOString() ?? null,
      })
      .eq('id', profile.id);

    console.log(`✅ Updated user ${profile.id} to ${tier} (via customer ID)`);
    return;
  }

  // Fallback: lookup by email from Stripe
  console.warn(`User not found for customer ${customerId}, trying email lookup...`);
  
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
  await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_expires_at: expiresAt?.toISOString() ?? null,
      stripe_customer_id: customerId,
    })
    .eq('id', profileByEmail.id);
  
  console.log(`✅ Updated user ${profileByEmail.id} to ${tier} (via email fallback)`);
}

/**
 * Handle checkout.session.completed event
 * Uses client_reference_id as PRIMARY lookup method
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  console.log('Processing checkout session:', session.id);

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const userId = session.client_reference_id; // Supabase user ID (from PR-PAY-2)

  if (!subscriptionId) {
    console.log('No subscription in session, skipping');
    return;
  }

  // Get subscription details with full expansion
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price', 'latest_invoice']
  });
  const priceId = subscription.items.data[0]?.price.id;
  
  if (!priceId) {
    throw new Error('No price ID found in subscription');
  }

  const tier = getTierFromPriceId(priceId);
  
  // Get expiration date - try multiple sources
  // @ts-expect-error - current_period_end may exist but type definition incomplete
  let periodEnd = subscription.current_period_end;
  
  // Fallback 1: Get from expanded latest_invoice
  if (!periodEnd && subscription.latest_invoice) {
    const invoice = subscription.latest_invoice;
    // @ts-expect-error - period_end exists on invoice
    periodEnd = typeof invoice === 'object' ? invoice.period_end : null;
    console.log(`Using period_end from latest_invoice: ${periodEnd}`);
  }
  
  // Fallback 2: Calculate from start_date + interval
  if (!periodEnd && subscription.start_date) {
    const plan = subscription.items.data[0]?.price;
    // @ts-expect-error - interval exists on price/plan
    const interval = plan?.recurring?.interval || plan?.interval;
    // @ts-expect-error - interval_count exists
    const intervalCount = plan?.recurring?.interval_count || plan?.interval_count || 1;
    
    if (interval === 'month') {
      const startDate = new Date(subscription.start_date * 1000);
      startDate.setMonth(startDate.getMonth() + intervalCount);
      periodEnd = Math.floor(startDate.getTime() / 1000);
      console.log(`Calculated period_end from start_date + ${intervalCount} month(s): ${periodEnd}`);
    } else if (interval === 'year') {
      const startDate = new Date(subscription.start_date * 1000);
      startDate.setFullYear(startDate.getFullYear() + intervalCount);
      periodEnd = Math.floor(startDate.getTime() / 1000);
      console.log(`Calculated period_end from start_date + ${intervalCount} year(s): ${periodEnd}`);
    }
  }
  
  if (!periodEnd || typeof periodEnd !== 'number') {
    console.error('Subscription object:', JSON.stringify(subscription, null, 2));
    throw new Error(`Could not determine subscription period end. Status: ${subscription.status}`);
  }
  
  const expiresAt = new Date(periodEnd * 1000);

  // PRIMARY: Direct user ID lookup (most reliable)
  if (userId) {
    console.log(`Using client_reference_id for user lookup: ${userId}`);
    await updateUserById(userId, customerId, tier, expiresAt);
    return;
  }

  // FALLBACK: Customer ID or email lookup (for older sessions without client_reference_id)
  console.log('No client_reference_id, falling back to customer lookup');
  await updateUserByCustomerId(customerId, tier, expiresAt);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  console.log('Processing subscription update:', subscription.id);

  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  
  if (!priceId) {
    console.warn('No price ID in subscription, skipping');
    return;
  }

  const tier = getTierFromPriceId(priceId);
  
  // Check subscription status
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    // Get expiration date with fallback logic (same as checkout handler)
    // @ts-expect-error - current_period_end may exist but type definition incomplete
    let periodEnd = subscription.current_period_end;
    
    // Fallback: Calculate from start_date + interval if needed
    if (!periodEnd && subscription.start_date) {
      const plan = subscription.items.data[0]?.price;
      // @ts-expect-error - interval exists on price/plan
      const interval = plan?.recurring?.interval || plan?.interval;
      // @ts-expect-error - interval_count exists
      const intervalCount = plan?.recurring?.interval_count || plan?.interval_count || 1;
      
      if (interval === 'month') {
        const startDate = new Date(subscription.start_date * 1000);
        startDate.setMonth(startDate.getMonth() + intervalCount);
        periodEnd = Math.floor(startDate.getTime() / 1000);
        console.log(`[subscription.updated] Calculated period_end: ${periodEnd}`);
      } else if (interval === 'year') {
        const startDate = new Date(subscription.start_date * 1000);
        startDate.setFullYear(startDate.getFullYear() + intervalCount);
        periodEnd = Math.floor(startDate.getTime() / 1000);
        console.log(`[subscription.updated] Calculated period_end: ${periodEnd}`);
      }
    }
    
    if (!periodEnd || typeof periodEnd !== 'number') {
      throw new Error(`Could not determine subscription period end`);
    }
    
    const expiresAt = new Date(periodEnd * 1000);
    await updateUserByCustomerId(customerId, tier, expiresAt);
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    // Downgrade to free
    await updateUserByCustomerId(customerId, 'free', null);
  }
}

/**
 * Handle subscription deletion (cancellation)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log('Processing subscription deletion:', subscription.id);

  const customerId = subscription.customer as string;
  await updateUserByCustomerId(customerId, 'free', null);
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
  
  console.log(`💰 Invoice paid: ${amount} ${invoice.currency?.toUpperCase()} from customer ${customerId}`);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('Processing failed invoice:', invoice.id);

  // Log the failure - Stripe will retry automatically
  const customerId = invoice.customer as string;
  console.warn(`⚠️ Payment failed for customer ${customerId}, attempt ${invoice.attempt_count}`);
  
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
    console.error('❌ Webhook signature verification failed:', message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${message}` }),
    };
  }

  console.log(`📨 Received event: ${stripeEvent.type} (${stripeEvent.id})`);

  // IDEMPOTENCY CHECK - claim event first (INSERT-first pattern)
  let claimed = false;
  try {
    const result = await claimEvent(stripeEvent.id, stripeEvent.type);
    claimed = result.claimed;
    
    if (!claimed) {
      // Already processed - return success to prevent Stripe retries
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true, duplicate: true }),
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Error claiming event:', message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database error' }),
    };
  }

  // Process event
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
        console.log(`ℹ️ Unhandled event type: ${stripeEvent.type}`);
    }

    // Mark as successfully processed
    await markEventSuccess(stripeEvent.id);

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Error processing webhook:', message);
    
    // Mark as error
    await markEventError(stripeEvent.id, message);
    
    // Return 500 so Stripe retries
    return {
      statusCode: 500,
      body: JSON.stringify({ error: message }),
    };
  }
};

export { handler };
