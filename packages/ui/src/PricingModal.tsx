/**
 * Pricing Modal - Subscription plans with Stripe checkout
 */

import { useState } from 'react';
import { useTranslation } from './i18n.js';

// NOTE: This import path works because ui package is in the monorepo
// If build fails, we can pass stripe config as props instead
let STRIPE_PRICES: any;
try {
  // Dynamic import to handle potential build issues across packages
  STRIPE_PRICES = require('../../apps/web/src/config/stripe').STRIPE_PRICES;
} catch (error) {
  console.warn('[PricingModal] Could not import Stripe config, using fallback');
  // Fallback: Hardcoded Price IDs (keep in sync with apps/web/src/config/stripe.ts)
  STRIPE_PRICES = {
    pro: {
      monthly: 'price_1Sr4E7ANogcZdSR3Dwu2aPbV',
      yearly: 'price_1Sr4JVANogcZdSR3locOvXlL',
    },
    team: {
      monthly: 'price_1Sr4MEANogcZdSR3nM2fRLT8',
      yearly: 'price_1Sr4DaANogcZdSR3OCEudUHk',
    },
  };
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'guest' | 'free' | 'pro' | 'team';
  isAuthenticated: boolean;
  onSignUp: () => void;
  user?: {
    id: string;
    email: string;
    stripe_customer_id?: string | null;
  } | null;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  priceId: string;
  period: string;
  microcopy?: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 'Included',
    priceId: '',
    period: ' after sign-in',
    microcopy: 'This is the default plan after login',
    features: [
      'Up to 3 projects',
      'Cloud sync & backup',
      'PNG export',
      'Organize with folders',
    ],
    cta: 'Continue for free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    priceId: STRIPE_PRICES.pro.monthly, // Real Stripe Price ID
    period: '/month',
    microcopy: 'For coaches who create a lot of drills and exports',
    features: [
      'Unlimited projects',
      'GIF & PDF export',
      'Unlimited steps',
      'Priority support',
    ],
    highlighted: true,
    cta: 'Upgrade to Pro',
  },
  {
    id: 'team',
    name: 'Team',
    price: '$29',
    priceId: STRIPE_PRICES.team.monthly, // Real Stripe Price ID
    period: '/month',
    microcopy: 'Pro + invite your staff by email',
    features: [
      '5 team members',
      'Shared billing',
      'Individual workspaces',
      'Everything in Pro',
    ],
    cta: 'Upgrade to Team',
  },
];

export function PricingModal({
  isOpen,
  onClose,
  currentPlan,
  isAuthenticated,
  onSignUp,
  user,
}: PricingModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPlan = async (plan: Plan) => {
    // Free plan: Sign up for guests, no-op for existing Free users
    if (plan.id === 'free') {
      if (!isAuthenticated) {
        onSignUp();
      }
      return;
    }

    // Pro/Team plan: Sign up if guest, otherwise start checkout
    if (!isAuthenticated) {
      onSignUp();
      return;
    }

    setIsLoading(plan.id);
    setError(null);

    try {
      // Build checkout request with user context
      const checkoutBody: any = {
        priceId: plan.priceId,
        successUrl: `${window.location.origin}/?checkout=success`,
        cancelUrl: `${window.location.origin}/?checkout=cancelled`,
      };

      // Pass user data for webhook correlation
      if (user) {
        checkoutBody.userId = user.id; // For client_reference_id
        checkoutBody.email = user.email; // For customer creation
        if (user.stripe_customer_id) {
          checkoutBody.customerId = user.stripe_customer_id; // Reuse existing customer
        }
      }

      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutBody),
      });

      // Safe JSON parsing
      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(t('pricing.checkoutFailed'));
      }

      if (!response.ok) {
        throw new Error(data.error || t('pricing.checkoutSessionFailed'));
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(t('pricing.checkoutFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pricing.genericError'));
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-text">{t('pricing.title')}</h2>
            <p className="text-muted mt-1">
              {t('pricing.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface2 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Plans */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const planKey = plan.id as 'free' | 'pro' | 'team';
              const planName = t(`pricing.plans.${planKey}.name`);
              const planPrice = t(`pricing.plans.${planKey}.price`);
              const planPeriod = t(`pricing.plans.${planKey}.period`);
              const planMicrocopy = t(`pricing.plans.${planKey}.microcopy`);
              const planFeatures = t(`pricing.plans.${planKey}.features`).split('|');
              const isCurrent = currentPlan === plan.id;
              const isHighlighted = plan.highlighted;
              
              // Free plan logic: Guest sees active CTA, authenticated sees Current Plan
              let buttonLabel = t(`pricing.plans.${planKey}.cta`);
              let buttonDisabled = isLoading === plan.id;
              
              if (plan.id === 'free') {
                if (isAuthenticated) {
                  // Authenticated user on Free → Current Plan (disabled)
                  buttonLabel = t('pricing.currentPlan');
                  buttonDisabled = true;
                } else {
                  // Guest → Continue for free (active)
                  buttonLabel = t('pricing.plans.free.cta');
                  buttonDisabled = false;
                }
              } else if (isCurrent) {
                // Pro/Team current plan
                buttonLabel = t('pricing.currentPlan');
                buttonDisabled = true;
              }

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl p-6 transition-all ${
                    isHighlighted
                      ? 'bg-accent/10 border-2 border-accent scale-105 shadow-lg shadow-accent/20'
                      : 'bg-surface2 border border-border'
                  }`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full">
                      {t('pricing.mostPopular')}
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-text">
                      {planName}
                    </h3>
                    <div className="mt-2">
                      <span className="text-4xl font-bold text-text">
                        {planPrice}
                      </span>
                      <span className="text-muted">{planPeriod}</span>
                    </div>
                    {planMicrocopy && (
                      <p className="text-xs text-muted/70 mt-2 italic">
                        {planMicrocopy}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {planFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <svg
                          className={`w-5 h-5 flex-shrink-0 ${
                            isHighlighted ? 'text-accent' : 'text-green-500'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div>
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={buttonDisabled}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                        buttonDisabled
                          ? 'bg-surface border border-border text-muted cursor-default'
                          : isHighlighted
                            ? 'bg-accent hover:bg-accent/90 text-white'
                            : 'bg-surface hover:bg-surface2 border border-border text-text'
                      } ${isLoading === plan.id ? 'opacity-50' : ''}`}
                    >
                      {isLoading === plan.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          {t('pricing.processing')}
                        </span>
                      ) : (
                        buttonLabel
                      )}
                    </button>
                    {plan.id === 'free' && !isAuthenticated && (
                      <p className="text-xs text-muted/60 text-center mt-2">
                        {t('pricing.signInHint')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-surface2/50 text-center">
          <p className="text-sm text-muted">
            {t('pricing.footer')}<br />
            {t('pricing.footerSecond')}
          </p>
        </div>
      </div>
    </div>
  );
}
