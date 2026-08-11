/**
 * useBillingController Hook
 * 
 * Handles all billing and payment operations:
 * - Pricing modal management
 * - Upgrade success modal management
 * - Billing portal access
 * - Payment return flow coordination
 * 
 * Part of PR-REFACTOR-4: Extract billing logic from App.tsx
 */

import { logger } from '../lib/logger';
import { useState, useCallback } from 'react';
import { useTranslation } from '@tmc/ui';
import { useUIStore } from '../store/useUIStore';
import { supabase } from '../lib/supabase';
import { EVENTS, track } from '../lib/analytics';

export interface UseBillingControllerParams {
  // No params needed - all internal
}

export interface BillingController {
  // Modal state
  pricingModalOpen: boolean;
  pricingCycle: 'monthly' | 'yearly';
  upgradeSuccessModalOpen: boolean;
  subscriptionActivating: boolean;
  upgradedTier: 'pro' | 'team';
  
  // Actions
  openPricingModal: (cycle?: 'monthly' | 'yearly') => void;
  closePricingModal: () => void;
  openUpgradeActivationModal: () => void;
  openUpgradeSuccessModal: (tier: 'pro' | 'team') => void;
  closeUpgradeSuccessModal: () => void;
  manageBilling: () => Promise<void>;
}

/**
 * Hook that provides billing and payment management
 */
export function useBillingController(_params?: UseBillingControllerParams): BillingController {
  const { t } = useTranslation();
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [upgradeSuccessModalOpen, setUpgradeSuccessModalOpen] = useState(false);
  const [subscriptionActivating, setSubscriptionActivating] = useState(false);
  const [upgradedTier, setUpgradedTier] = useState<'pro' | 'team'>('pro');
  
  const showToast = useUIStore((s) => s.showToast);
  
  /**
   * Open pricing modal
   */
  const openPricingModal = useCallback((cycle: 'monthly' | 'yearly' = 'monthly') => {
    setPricingCycle(cycle);
    setPricingModalOpen(true);
  }, []);
  
  /**
   * Close pricing modal
   */
  const closePricingModal = useCallback(() => {
    setPricingModalOpen(false);
  }, []);
  
  /**
   * Open upgrade success modal
   */
  const openUpgradeActivationModal = useCallback(() => {
    setUpgradedTier('pro');
    setSubscriptionActivating(true);
    setUpgradeSuccessModalOpen(true);
  }, []);

  const openUpgradeSuccessModal = useCallback((tier: 'pro' | 'team') => {
    setUpgradedTier(tier);
    setSubscriptionActivating(false);
    setUpgradeSuccessModalOpen(true);
  }, []);
  
  /**
   * Close upgrade success modal
   */
  const closeUpgradeSuccessModal = useCallback(() => {
    setSubscriptionActivating(false);
    setUpgradeSuccessModalOpen(false);
  }, []);
  
  /**
   * Open Stripe billing portal
   */
  const manageBilling = useCallback(async () => {
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session?.access_token) {
        showToast(t('billingToast.signInFirst'));
        return;
      }

      track(EVENTS.BILLING_PORTAL_OPENED);

      const response = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ returnUrl: `${window.location.origin}/board?portal=return` }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to open billing portal');
      if (data.url) window.location.href = data.url;
    } catch (error) {
      track(EVENTS.BILLING_PORTAL_FAILED);
      logger.error('Billing portal error:', error);
      showToast(t('billingToast.portalFailed'));
    }
  }, [showToast, t]);
  
  return {
    // Modal state
    pricingModalOpen,
    pricingCycle,
    upgradeSuccessModalOpen,
    subscriptionActivating,
    upgradedTier,
    
    // Actions
    openPricingModal,
    closePricingModal,
    openUpgradeActivationModal,
    openUpgradeSuccessModal,
    closeUpgradeSuccessModal,
    manageBilling,
  };
}
