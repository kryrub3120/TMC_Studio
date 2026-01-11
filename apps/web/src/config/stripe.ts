/**
 * Stripe Configuration
 * TMC Studio - Centralized payment config
 * 
 * IMPORTANT: These are LIVE price IDs from Stripe Dashboard.
 * Update these if creating new products or switching test/production.
 */

/**
 * Stripe Price IDs for subscriptions
 * 
 * Retrieved from Stripe Dashboard on 2026-01-11
 * Test Mode: Yes
 */
export const STRIPE_PRICES = {
  pro: {
    monthly: 'price_1SnQvaANogcZdSR39JL60iCS', // $9.00 USD/month
    yearly: 'price_1SnQvaANogcZdSR3f6Pv3xZ8',  // $90.00 USD/year
  },
  team: {
    monthly: 'price_1SnQvzANogcZdSR3BiUrQvqc', // $29.00 USD/month
    yearly: 'price_1SnQwfANogcZdSR3Kdp2j8FB',  // $290.00 USD/year
  },
} as const;

/**
 * Map Stripe Price IDs to subscription tiers
 * Used by webhook to determine which tier to assign
 */
export const PRICE_TO_TIER: Record<string, 'free' | 'pro' | 'team'> = {
  // Pro plans
  [STRIPE_PRICES.pro.monthly]: 'pro',
  [STRIPE_PRICES.pro.yearly]: 'pro',
  
  // Team plans
  [STRIPE_PRICES.team.monthly]: 'team',
  [STRIPE_PRICES.team.yearly]: 'team',
} as const;

/**
 * Stripe Lookup Keys (for reference)
 * These can be used instead of Price IDs if configured in Stripe
 */
export const STRIPE_LOOKUP_KEYS = {
  pro: {
    monthly: 'tmc_pro_monthly',
    yearly: 'tmc_pro_yearly',
  },
  team: {
    monthly: 'tmc_team_monthly',
    yearly: 'tmc_team_yearly',
  },
} as const;

/**
 * Helper: Get tier from Price ID
 * Returns 'free' if Price ID not found (fallback)
 */
export function getTierFromPriceId(priceId: string): 'free' | 'pro' | 'team' {
  return PRICE_TO_TIER[priceId] ?? 'free';
}

/**
 * Helper: Validate Price ID exists in config
 */
export function isValidPriceId(priceId: string): boolean {
  return priceId in PRICE_TO_TIER;
}
