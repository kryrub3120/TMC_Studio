/**
 * usePaymentReturn Hook
 * 
 * Handles post-payment flow after returning from Stripe Checkout or Portal
 * 
 * Features:
 * - Detects ?checkout=success|cancelled query params
 * - Detects ?portal=return query param
 * - Retries auth refresh up to 3 times (handles webhook race condition)
 * - Calls back to App.tsx for UI updates (keeps App composition-only)
 */

import { logger } from '../lib/logger';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export interface PaymentReturnCallbacks {
  /**
   * Called when starting subscription activation check
   */
  onActivateStart: () => void;

  /**
   * Called when subscription successfully activated
   */
  onActivateSuccess: (tier: 'pro' | 'team') => void;

  /**
   * Called when subscription activation delayed (webhook not processed yet)
   */
  onActivateDelayed: () => void;

  /**
   * Called when user returns from Stripe Customer Portal
   */
  onPortalReturn: (tierChanged: boolean, newTier?: 'free' | 'pro' | 'team') => void;

  /**
   * Called when checkout was cancelled
   */
  onCancelled: () => void;
}

/**
 * Hook to handle payment return flows
 * 
 * Usage:
 * ```tsx
 * usePaymentReturn({
 *   onActivateStart: () => setSubscriptionActivating(true),
 *   onActivateSuccess: (tier) => { setActivating(false); showSuccessModal(); },
 *   onActivateDelayed: () => { setActivating(false); showToast('Processing...'); },
 *   onPortalReturn: (changed, newTier) => showToast(`Updated to ${newTier}`),
 *   onCancelled: () => showToast('Cancelled'),
 * });
 * ```
 */
export function usePaymentReturn(callbacks: PaymentReturnCallbacks): void {
  const hasRun = useRef(false);

  useEffect(() => {
    // Only run once per mount
    if (hasRun.current) return;

    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const portalReturn = params.get('portal');

    // CHECKOUT SUCCESS - retry with delay for webhook
    if (checkoutStatus === 'success') {
      hasRun.current = true;
      callbacks.onActivateStart();

      const checkSubscription = async (attempt: number): Promise<'free' | 'pro' | 'team'> => {
        logger.debug(`[Payment] Checking subscription (attempt ${attempt}/3)...`);
        await useAuthStore.getState().initialize();
        const user = useAuthStore.getState().user;
        return user?.subscription_tier ?? 'free';
      };

      (async () => {
        // Attempt 1
        let tier = await checkSubscription(1);
        if (tier !== 'free') {
          callbacks.onActivateSuccess(tier as 'pro' | 'team');
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }

        // Attempt 2 (after 1.2s)
        await new Promise((r) => setTimeout(r, 1200));
        tier = await checkSubscription(2);
        if (tier !== 'free') {
          callbacks.onActivateSuccess(tier as 'pro' | 'team');
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }

        // Attempt 3 (after another 1.2s)
        await new Promise((r) => setTimeout(r, 1200));
        tier = await checkSubscription(3);
        if (tier !== 'free') {
          callbacks.onActivateSuccess(tier as 'pro' | 'team');
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }

        // Still free after 3 attempts - webhook delayed
        callbacks.onActivateDelayed();
        window.history.replaceState({}, '', window.location.pathname);
      })();
    }

    // PORTAL RETURN - check for tier changes
    else if (portalReturn === 'return') {
      hasRun.current = true;

      const currentUser = useAuthStore.getState().user;
      const previousTier = currentUser?.subscription_tier ?? 'free';

      useAuthStore.getState().initialize().then(() => {
        const user = useAuthStore.getState().user;
        const newTier = user?.subscription_tier ?? 'free';
        const tierChanged = newTier !== previousTier;

        callbacks.onPortalReturn(tierChanged, newTier);
        window.history.replaceState({}, '', window.location.pathname);
      });
    }

    // CHECKOUT CANCELLED
    else if (checkoutStatus === 'cancelled') {
      hasRun.current = true;
      callbacks.onCancelled();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [callbacks]);
}
