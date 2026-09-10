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
 * - Idempotency (INSERT-first claim with safe retry recovery)
 * - client_reference_id for reliable user lookup
 * - Audit trail in stripe_webhook_events table
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getTierFromPriceId } from './_stripeConfig';
import { checkRateLimit } from './_rateLimit';

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

type SubscriptionTier = 'free' | 'pro' | 'team';
type StripeSubscriptionWithLegacyPeriod = Stripe.Subscription & {
  current_period_end?: number | null;
  current_period_start?: number | null;
};
type StripeSubscriptionItemWithPeriod = Stripe.SubscriptionItem & {
  current_period_end?: number | null;
  current_period_start?: number | null;
};
type StripeInvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
  period_end?: number | null;
  lines?: Stripe.ApiList<Stripe.InvoiceLineItem>;
};

function maskId(id: string | null | undefined): string {
  if (!id) return 'unknown';
  if (id.length <= 12) return `${id.slice(0, 4)}...`;
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function isActivePaidStatus(status: Stripe.Subscription.Status): boolean {
  return status === 'active' || status === 'trialing';
}

function getPrimarySubscriptionItem(
  subscription: Stripe.Subscription
): StripeSubscriptionItemWithPeriod | null {
  return (subscription.items.data[0] as StripeSubscriptionItemWithPeriod | undefined) ?? null;
}

function getSubscriptionPriceId(subscription: Stripe.Subscription): string | null {
  return getPrimarySubscriptionItem(subscription)?.price?.id ?? null;
}

function getKnownPaidTier(subscription: Stripe.Subscription): Exclude<SubscriptionTier, 'free'> | null {
  const priceId = getSubscriptionPriceId(subscription);
  if (!priceId) return null;
  const tier = getTierFromPriceId(priceId);
  return tier === 'free' ? null : tier;
}

function calculatePeriodEndFromStartAndPrice(subscription: Stripe.Subscription): number | null {
  const startedAt = subscription.start_date;
  const price = getPrimarySubscriptionItem(subscription)?.price;
  const interval = price?.recurring?.interval;
  const intervalCount = price?.recurring?.interval_count ?? 1;

  if (!startedAt || !interval) return null;

  const end = new Date(startedAt * 1000);
  if (interval === 'month') {
    end.setMonth(end.getMonth() + intervalCount);
  } else if (interval === 'year') {
    end.setFullYear(end.getFullYear() + intervalCount);
  } else if (interval === 'week') {
    end.setDate(end.getDate() + (7 * intervalCount));
  } else if (interval === 'day') {
    end.setDate(end.getDate() + intervalCount);
  } else {
    return null;
  }

  return Math.floor(end.getTime() / 1000);
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date {
  const subscriptionWithLegacyPeriod = subscription as StripeSubscriptionWithLegacyPeriod;
  const primaryItem = getPrimarySubscriptionItem(subscription);
  const expandedInvoice = typeof subscription.latest_invoice === 'object'
    ? subscription.latest_invoice as StripeInvoiceWithSubscription
    : null;

  const periodEnd =
    primaryItem?.current_period_end ??
    subscriptionWithLegacyPeriod.current_period_end ??
    expandedInvoice?.period_end ??
    calculatePeriodEndFromStartAndPrice(subscription);

  if (!periodEnd || typeof periodEnd !== 'number') {
    throw new Error(`Could not determine subscription period end. Status: ${subscription.status}`);
  }

  const expiresAt = new Date(periodEnd * 1000);
  if (Number.isNaN(expiresAt.getTime())) {
    throw new Error(`Invalid subscription period end: ${periodEnd}`);
  }

  return expiresAt;
}

function getSubscriptionIdFromInvoice(invoice: StripeInvoiceWithSubscription): string | null {
  const invoiceSubscription = invoice.subscription;
  if (typeof invoiceSubscription === 'string') return invoiceSubscription;
  if (invoiceSubscription && typeof invoiceSubscription === 'object') return invoiceSubscription.id;

  for (const line of invoice.lines?.data ?? []) {
    const lineParent = line.parent as unknown as {
      subscription_item_details?: { subscription?: string | null };
    } | null;
    const subscriptionId = lineParent?.subscription_item_details?.subscription;
    if (subscriptionId) return subscriptionId;
  }

  return null;
}

async function retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price', 'latest_invoice'],
  });
}

async function findActiveSubscriptionForCustomer(customerId: string): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 20,
    expand: ['data.items.data.price'],
  });

  return subscriptions.data.find((subscription) =>
    isActivePaidStatus(subscription.status) && getKnownPaidTier(subscription) !== null
  ) ?? null;
}

async function syncSubscriptionToProfile(
  subscription: Stripe.Subscription,
  preferredUserId?: string | null
): Promise<void> {
  const customerId = subscription.customer as string;
  if (!getSubscriptionPriceId(subscription)) {
    throw new Error(`No price ID found in subscription ${subscription.id}`);
  }

  const tier = getKnownPaidTier(subscription);
  if (!tier) {
    throw new Error(`Unknown paid Stripe price ID for subscription ${maskId(subscription.id)}`);
  }

  if (!isActivePaidStatus(subscription.status)) {
    console.log(`Subscription ${maskId(subscription.id)} is ${subscription.status}; skipping paid sync`);
    return;
  }

  const expiresAt = getSubscriptionPeriodEnd(subscription);

  if (preferredUserId) {
    await updateUserById(preferredUserId, customerId, tier, expiresAt);
    if (tier === 'team') {
      await ensureTeamForUser(preferredUserId, customerId);
    }
    return;
  }

  const profile = await updateUserByCustomerId(customerId, tier, expiresAt);
  if (tier === 'team') {
    await ensureTeamForUser(profile.id, customerId);
  }
}

async function downgradeCustomerToFreeIfNoActiveSubscription(customerId: string): Promise<void> {
  const activeSubscription = await findActiveSubscriptionForCustomer(customerId);
  if (activeSubscription) {
    console.log(
      `Skipping downgrade for customer ${maskId(customerId)}; active known subscription ${maskId(activeSubscription.id)} still exists`
    );
    await syncSubscriptionToProfile(activeSubscription);
    return;
  }

  await updateUserByCustomerId(customerId, 'free', null);
}

/**
 * Claim event for processing (INSERT-first idempotency pattern)
 * 
 * Returns { claimed: true } if we successfully claimed this event
 * Returns { claimed: false } if event was already processed (duplicate)
 * Throws on unexpected database errors
 */
const STALE_PROCESSING_MS = 5 * 60 * 1000;

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
    const { data: existing, error: lookupError } = await supabase
      .from('stripe_webhook_events')
      .select('status, created_at')
      .eq('event_id', eventId)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    const processingStartedAt = existing?.created_at
      ? new Date(existing.created_at).getTime()
      : Number.NaN;
    const isStaleProcessing = existing?.status === 'processing' &&
      Number.isFinite(processingStartedAt) &&
      Date.now() - processingStartedAt >= STALE_PROCESSING_MS;
    const canRetry = existing?.status === 'error' || isStaleProcessing;

    if (!existing || !canRetry) {
      console.log(`Event ${eventId} already processing/processed (duplicate)`);
      return { claimed: false };
    }

    const retryStartedAt = new Date().toISOString();
    const { data: reclaimed, error: reclaimError } = await supabase
      .from('stripe_webhook_events')
      .update({
        status: 'processing',
        error_message: null,
        processed_at: null,
        created_at: retryStartedAt,
      })
      .eq('event_id', eventId)
      .eq('status', existing.status)
      .eq('created_at', existing.created_at)
      .select('event_id')
      .maybeSingle();

    if (reclaimError) {
      throw reclaimError;
    }

    if (reclaimed) {
      console.log(`Reclaimed ${existing.status} event ${eventId} for retry`);
      return { claimed: true };
    }

    console.log(`Event ${eventId} was claimed by another retry`);
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
  tier: SubscriptionTier,
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

  console.log(`Updated user ${maskId(userId)} to ${tier} (expires: ${expiresAt?.toISOString() ?? 'never'})`);
}

/**
 * Update user subscription by Stripe customer ID (fallback)
 */
async function updateUserByCustomerId(
  customerId: string,
  tier: SubscriptionTier,
  expiresAt: Date | null
): Promise<{ id: string }> {
  // Try customer ID lookup first
  const { data: profile, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profile) {
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

    console.log(`Updated user ${maskId(profile.id)} to ${tier} (via customer ID)`);
    return profile;
  }

  // Fallback: lookup by email from Stripe
  console.warn(`User not found for customer ${maskId(customerId)}, trying email lookup...`);
  
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
  
  console.log(`Updated user ${maskId(profileByEmail.id)} to ${tier} (via email fallback)`);
  return profileByEmail;
}

/**
 * Handle checkout.session.completed event
 * Uses client_reference_id as PRIMARY lookup method
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  console.log('Processing checkout session:', maskId(session.id));

  const subscriptionId = session.subscription as string;
  const userId = session.client_reference_id; // Supabase user ID (from PR-PAY-2)

  if (!subscriptionId) {
    console.log('No subscription in session, skipping');
    return;
  }

  const subscription = await retrieveSubscription(subscriptionId);

  // PRIMARY: Direct user ID lookup (most reliable)
  if (userId) {
    console.log(`Using client_reference_id for user lookup: ${maskId(userId)}`);
    await syncSubscriptionToProfile(subscription, userId);
    return;
  }

  // FALLBACK: Customer ID or email lookup (for older sessions without client_reference_id)
  console.log('No client_reference_id, falling back to customer lookup');
  await syncSubscriptionToProfile(subscription);
}

/**
 * Create a team + team_members row for Club Premium checkout.
 * Idempotent — checks stripe_customer_id before creating.
 */
async function ensureTeamForUser(userId: string, customerId: string): Promise<void> {
  // Check if team already exists for this customer (idempotent)
  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (existingTeam) {
    console.log(`Team already exists for customer ${maskId(customerId)}, skipping creation`);
    return;
  }

  // Create team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      name: 'My Club',
      owner_id: userId,
      stripe_customer_id: customerId,
      max_members: 5,
    })
    .select('id')
    .single();

  if (teamError || !team) {
    console.error('Failed to create team:', teamError);
    throw teamError;
  }

  console.log(`Created team ${maskId(team.id)} for user ${maskId(userId)}`);

  // Add owner as admin member
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: userId,
      role: 'admin',
    });

  if (memberError) {
    console.error('Failed to add admin member:', memberError);
    throw memberError;
  }

  console.log(`Added user ${maskId(userId)} as admin of team ${maskId(team.id)}`);

  // Update user's team_id in profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ team_id: team.id })
    .eq('id', userId);

  if (profileError) {
    console.error('Failed to update profile team_id:', profileError);
    throw profileError;
  }

  console.log(`Updated profile team_id for user ${maskId(userId)}`);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  console.log('Processing subscription update:', maskId(subscription.id));

  const customerId = subscription.customer as string;
  
  // Check subscription status
  if (isActivePaidStatus(subscription.status)) {
    await syncSubscriptionToProfile(subscription);
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    await downgradeCustomerToFreeIfNoActiveSubscription(customerId);
  }
}

/**
 * Handle subscription deletion (cancellation)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log('Processing subscription deletion:', maskId(subscription.id));

  const customerId = subscription.customer as string;
  await downgradeCustomerToFreeIfNoActiveSubscription(customerId);
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  console.log('Processing paid invoice:', maskId(invoice.id));

  const customerId = invoice.customer as string;
  const amount = invoice.amount_paid / 100;
  
  console.log(`Invoice paid: ${amount} ${invoice.currency?.toUpperCase()} from customer ${maskId(customerId)}`);

  const subscriptionId = getSubscriptionIdFromInvoice(invoice as StripeInvoiceWithSubscription);
  const subscription = subscriptionId
    ? await retrieveSubscription(subscriptionId)
    : await findActiveSubscriptionForCustomer(customerId);

  if (!subscription) {
    console.log(`No active known subscription found for paid invoice ${maskId(invoice.id)}; skipping entitlement sync`);
    return;
  }

  await syncSubscriptionToProfile(subscription);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('Processing failed invoice:', maskId(invoice.id));

  // Log the failure - Stripe will retry automatically
  const customerId = invoice.customer as string;
  console.warn(`Payment failed for customer ${maskId(customerId)}, attempt ${invoice.attempt_count}`);
  
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

  // Rate limiting: max 20 webhook events per IP per minute
  // Liberal limit — Stripe retries legitimate events
  const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  const rateCheck = checkRateLimit(
    typeof clientIp === 'string' ? clientIp : clientIp[0],
    { maxRequests: 20, windowMs: 60_000 }
  );
  if (!rateCheck.allowed) {
    console.warn(`Webhook rate limit exceeded for ${stripeEvent.type}`);
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Rate limit exceeded' }),
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

export {
  claimEvent,
  getSubscriptionIdFromInvoice,
  getSubscriptionPeriodEnd,
  getSubscriptionPriceId,
  handler,
  isActivePaidStatus,
};
