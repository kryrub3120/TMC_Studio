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
    monthly: 'price_1Sr4E7ANogcZdSR3Dwu2aPbV', // $9.00 USD/month (TEST)
    yearly: 'price_1Sr4JVANogcZdSR3locOvXlL',  // $90.00 USD/year (TEST)
  },
  team: {
    monthly: 'price_1Sr4MEANogcZdSR3nM2fRLT8', // $29.00 USD/month (TEST)
    yearly: 'price_1Sr4DaANogcZdSR3OCEudUHk',  // $290.00 USD/year (TEST)
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
