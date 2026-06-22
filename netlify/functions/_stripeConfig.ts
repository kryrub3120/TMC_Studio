/**
 * Shared Stripe Configuration for Netlify Functions
 * TMC Studio - Backend source of truth for Stripe price IDs
 *
 * STATUS: All prices are in TEST mode.
 * Before going LIVE, replace these with live price IDs from Stripe Dashboard.
 *
 * Keep in sync with apps/web/src/config/stripe.ts (frontend).
 * Functions should NOT import from apps/web (bundling issues).
 */

/**
 * Stripe Price IDs for subscriptions
 * Retrieved from Stripe Dashboard on 2026-01-11
 * Mode: TEST (update for LIVE before production launch)
 */
export const STRIPE_PRICES = {
  pro: {
    monthly: 'price_1Sr4E7ANogcZdSR3Dwu2aPbV', // $9.00 USD/month
    yearly: 'price_1Sr4JVANogcZdSR3locOvXlL',  // $90.00 USD/year
  },
  team: {
    monthly: 'price_1Sr4MEANogcZdSR3nM2fRLT8', // $29.00 USD/month
    yearly: 'price_1Sr4DaANogcZdSR3OCEudUHk',  // $290.00 USD/year
  },
} as const;

/**
 * Map Stripe Price IDs to subscription tiers
 * Used by webhook to determine which tier to assign after payment
 */
export const PRICE_TO_TIER: Record<string, 'pro' | 'team'> = {
  // Pro plans
  [STRIPE_PRICES.pro.monthly]: 'pro',
  [STRIPE_PRICES.pro.yearly]: 'pro',
  
  // Team plans
  [STRIPE_PRICES.team.monthly]: 'team',
  [STRIPE_PRICES.team.yearly]: 'team',
};

/**
 * Get tier from Price ID (with fallback to 'free' for safety)
 */
export function getTierFromPriceId(priceId: string): 'free' | 'pro' | 'team' {
  return PRICE_TO_TIER[priceId] ?? 'free';
}

/**
 * Map Stripe Price IDs to billing cycles
 * Used by create-checkout to set billing_cycle metadata
 */
export const PRICE_TO_CYCLE: Record<string, 'monthly' | 'yearly'> = {
  // Pro plans
  [STRIPE_PRICES.pro.monthly]: 'monthly',
  [STRIPE_PRICES.pro.yearly]: 'yearly',
  
  // Team plans
  [STRIPE_PRICES.team.monthly]: 'monthly',
  [STRIPE_PRICES.team.yearly]: 'yearly',
};

/**
 * Get billing cycle from Price ID
 */
export function getCycleFromPriceId(priceId: string): 'monthly' | 'yearly' {
  return PRICE_TO_CYCLE[priceId] ?? 'monthly';
}
