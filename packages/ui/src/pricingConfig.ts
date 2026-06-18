/**
 * Shared Pricing Configuration for TMC Studio
 *
 * Single source of truth for:
 *   - Display prices (PricingPage, PricingModal)
 *   - Stripe Price IDs (must mirror netlify/functions/_stripeConfig.ts)
 *
 * STATUS: All prices are in TEST mode.
 * Before going LIVE, replace Price IDs with live IDs from Stripe Dashboard.
 */

export type Cycle = 'monthly' | 'yearly';

/**
 * Stripe Price IDs — must stay in sync with:
 *   - netlify/functions/_stripeConfig.ts  (backend)
 *   - apps/web/src/config/stripe.ts       (frontend config)
 * If the "stripe price IDs are in sync" test fails, fix all three.
 */
export const STRIPE_PRICES = {
  pro: {
    monthly: 'price_1Sr4E7ANogcZdSR3Dwu2aPbV', // $9/mo
    yearly: 'price_1Sr4JVANogcZdSR3locOvXlL',  // $90/yr
  },
  team: {
    monthly: 'price_1Sr4MEANogcZdSR3nM2fRLT8', // $29/mo
    yearly: 'price_1Sr4DaANogcZdSR3OCEudUHk',  // $290/yr
  },
} as const;

/**
 * Display prices (USD). EU consumers see VAT-inclusive amounts
 * via Stripe at checkout (see docs/STRIPE_TAX_SETUP.md).
 */
export const DISPLAY_PRICES: Record<'pro' | 'team', Record<Cycle, string>> = {
  pro: { monthly: '$9', yearly: '$90' },
  team: { monthly: '$29', yearly: '$290' },
};

/**
 * Annual savings calculation.
 * Pro:  $9/mo × 12 = $108 → $90/yr = saves $18 (17%)
 * Team: $29/mo × 12 = $348 → $290/yr = saves $58 (17%)
 */
export const SAVE_PERCENT = 17;

/** Monthly price used to calculate annual savings for display */
export const ANNUAL_SAVINGS: Record<'pro' | 'team', number> = {
  pro: 12 * 9 - 90,   // $18
  team: 12 * 29 - 290, // $58
};

/**
 * Get a readable savings string like "Save $18/yr (17%)"
 */
export function getSavingsText(plan: 'pro' | 'team'): string {
  const saved = ANNUAL_SAVINGS[plan];
  return `Save $${saved}/yr (${SAVE_PERCENT}%)`;
}