/**
 * Shared Stripe Configuration for Netlify Functions
 * 
 * This is the source of truth for backend Stripe configuration.
 * Keep in sync with apps/web/src/config/stripe.ts (frontend).
 * 
 * Note: Functions should NOT import from apps/web (bundling issues).
 * This file is specifically for backend use.
 */

/**
 * Stripe Price IDs for subscriptions
 * Retrieved from Stripe Dashboard on 2026-01-11
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
 * Get tier from Price ID (with fallback to 'pro')
 */
export function getTierFromPriceId(priceId: string): 'pro' | 'team' {
  return PRICE_TO_TIER[priceId] ?? 'pro';
}
