/**
 * Pricing Modal - Subscription plans with Stripe checkout
 */

import { useState } from 'react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'free' | 'pro' | 'team';
  isAuthenticated: boolean;
  onSignUp: () => void;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  priceId: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceId: '',
    period: 'forever',
    features: [
      '3 projects',
      'Basic pitch customization',
      'PNG export',
      'Local save only',
    ],
    cta: 'Current Plan',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    priceId: 'price_pro_monthly', // Replace with actual Stripe price ID
    period: '/month',
    features: [
      'Unlimited projects',
      'All pitch styles & sports',
      'GIF & PDF export',
      'Cloud sync & backup',
      'Team templates',
      'Priority support',
    ],
    highlighted: true,
    cta: 'Upgrade to Pro',
  },
  {
    id: 'team',
    name: 'Team',
    price: '$29',
    priceId: 'price_team_monthly', // Replace with actual Stripe price ID
    period: '/month',
    features: [
      'Everything in Pro',
      '5 team members',
      'Shared project library',
      'Team branding',
      'Analytics dashboard',
      'API access',
    ],
    cta: 'Contact Sales',
  },
];

export function PricingModal({
  isOpen,
  onClose,
  currentPlan,
  isAuthenticated,
  onSignUp,
}: PricingModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === 'free') return;
    if (plan.id === 'team') {
      window.open('mailto:sales@tmcstudio.app?subject=Team Plan Inquiry', '_blank');
      return;
    }

    if (!isAuthenticated) {
      onSignUp();
      return;
    }

    setIsLoading(plan.id);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          successUrl: `${window.location.origin}/?checkout=success`,
          cancelUrl: `${window.location.origin}/?checkout=cancelled`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
            <h2 className="text-2xl font-bold text-text">Choose Your Plan</h2>
            <p className="text-muted mt-1">
              Unlock powerful features for your coaching workflow
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
              const isCurrent = currentPlan === plan.id;
              const isHighlighted = plan.highlighted;

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
                      Most Popular
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-text">
                      {plan.name}
                    </h3>
                    <div className="mt-2">
                      <span className="text-4xl font-bold text-text">
                        {plan.price}
                      </span>
                      <span className="text-muted">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
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

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent || isLoading === plan.id}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                      isCurrent
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
                        Processing...
                      </span>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : (
                      plan.cta
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-surface2/50 text-center">
          <p className="text-sm text-muted">
            All plans include 14-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
