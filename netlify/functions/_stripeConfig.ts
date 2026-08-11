/**
 * Shared Stripe Configuration for Netlify Functions
 * TMC Studio - Backend source of truth for Stripe price IDs
 *
 * STATUS: LIVE prices configured for the production Stripe account.
 *
 * Keep in sync with apps/web/src/config/stripe.ts (frontend).
 * Functions should NOT import from apps/web (bundling issues).
 */

/**
 * Stripe Price IDs for subscriptions
 * Retrieved from Stripe Dashboard on 2026-08-11
 * Mode: LIVE
 */
export const STRIPE_PRICES = {
  pro: {
    monthly: 'price_1U3JbYANogcZdSR3J6Nvw41T', // PLN 29 / $9 per month
    yearly: 'price_1U3JblANogcZdSR3PsBkwsqJ',  // PLN 290 / $90 per year
  },
  team: {
    monthly: 'price_1U3JadANogcZdSR3opimMNnN', // PLN 99 / $29 per month
    yearly: 'price_1U3Jb7ANogcZdSR32Kqr5Jx5',  // PLN 990 / $290 per year
  },
} as const;

// Existing subscriptions keep their original Stripe price IDs.
export const LEGACY_STRIPE_PRICES = {
  pro: {
    monthly: 'price_1SnQvaANogcZdSR39JL60iCS',
    yearly: 'price_1SnQvaANogcZdSR3f6Pv3xZ8',
  },
  team: {
    monthly: 'price_1SnQvzANogcZdSR3BiUrQvqc',
    yearly: 'price_1SnQwfANogcZdSR3Kdp2j8FB',
  },
} as const;

/**
 * Map Stripe Price IDs to subscription tiers
 * Used by webhook to determine which tier to assign after payment
 */
export type PaidTier = 'pro' | 'team';
export type BillingCycle = 'monthly' | 'yearly';

export const PRICE_DETAILS: Record<string, { tier: PaidTier; cycle: BillingCycle }> = {
  [STRIPE_PRICES.pro.monthly]: { tier: 'pro', cycle: 'monthly' },
  [STRIPE_PRICES.pro.yearly]: { tier: 'pro', cycle: 'yearly' },
  [STRIPE_PRICES.team.monthly]: { tier: 'team', cycle: 'monthly' },
  [STRIPE_PRICES.team.yearly]: { tier: 'team', cycle: 'yearly' },
  [LEGACY_STRIPE_PRICES.pro.monthly]: { tier: 'pro', cycle: 'monthly' },
  [LEGACY_STRIPE_PRICES.pro.yearly]: { tier: 'pro', cycle: 'yearly' },
  [LEGACY_STRIPE_PRICES.team.monthly]: { tier: 'team', cycle: 'monthly' },
  [LEGACY_STRIPE_PRICES.team.yearly]: { tier: 'team', cycle: 'yearly' },
};

export const PRICE_TO_TIER: Record<string, PaidTier> = Object.fromEntries(
  Object.entries(PRICE_DETAILS).map(([priceId, details]) => [priceId, details.tier]),
) as Record<string, PaidTier>;

/**
 * Get tier from Price ID (with fallback to 'free' for safety)
 */
export function getTierFromPriceId(priceId: string): 'free' | 'pro' | 'team' {
  return PRICE_TO_TIER[priceId] ?? 'free';
}

export function getBillingCycleFromPriceId(priceId: string): BillingCycle | null {
  return PRICE_DETAILS[priceId]?.cycle ?? null;
}
