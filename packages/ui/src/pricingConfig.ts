/**
 * Shared Pricing Configuration for TMC Studio
 *
 * Single source of truth for:
 *   - Display prices (PricingPage, PricingModal)
 *   - Stripe Price IDs (must mirror netlify/functions/_stripeConfig.ts)
 *
 * STATUS: LIVE prices configured for the production Stripe account.
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
    monthly: 'price_1U3JbYANogcZdSR3J6Nvw41T', // PLN 29 / $9 per month
    yearly: 'price_1U3JblANogcZdSR3PsBkwsqJ',  // PLN 290 / $90 per year
  },
  team: {
    monthly: 'price_1U3JadANogcZdSR3opimMNnN', // PLN 99 / $29 per month
    yearly: 'price_1U3Jb7ANogcZdSR32Kqr5Jx5',  // PLN 990 / $290 per year
  },
} as const;

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
 * Display prices (USD). EU consumers see VAT-inclusive amounts
 * via Stripe at checkout (see docs/STRIPE_TAX_SETUP.md).
 */
export const DISPLAY_PRICES: Record<'pro' | 'team', Record<Cycle, string>> = {
  pro: { monthly: '$9', yearly: '$90' },
  team: { monthly: '$29', yearly: '$290' },
};

export const DISPLAY_PRICES_PLN: Record<'pro' | 'team', Record<Cycle, string>> = {
  pro: { monthly: '29 PLN', yearly: '290 PLN' },
  team: { monthly: '99 PLN', yearly: '990 PLN' },
};

export function getDisplayPrices(language: string) {
  return language === 'pl' ? DISPLAY_PRICES_PLN : DISPLAY_PRICES;
}

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
