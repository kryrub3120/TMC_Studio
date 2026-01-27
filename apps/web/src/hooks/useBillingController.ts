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

import { useState, useCallback } from 'react';
import { useUIStore } from '../store/useUIStore';
import { supabase } from '../lib/supabase';

export interface UseBillingControllerParams {
  // No params needed - all internal
}

export interface BillingController {
  // Modal state
  pricingModalOpen: boolean;
  upgradeSuccessModalOpen: boolean;
  subscriptionActivating: boolean;
  upgradedTier: 'pro' | 'team';
  
  // Actions
  openPricingModal: () => void;
  closePricingModal: () => void;
  openUpgradeSuccessModal: (tier: 'pro' | 'team', activating?: boolean) => void;
  closeUpgradeSuccessModal: () => void;
  setSubscriptionActivating: (activating: boolean) => void;
  manageBilling: () => Promise<void>;
}

/**
 * Hook that provides billing and payment management
 */
export function useBillingController(_params?: UseBillingControllerParams): BillingController {
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [upgradeSuccessModalOpen, setUpgradeSuccessModalOpen] = useState(false);
  const [subscriptionActivating, setSubscriptionActivating] = useState(false);
  const [upgradedTier, setUpgradedTier] = useState<'pro' | 'team'>('pro');
  
  const showToast = useUIStore((s) => s.showToast);
  
  /**
   * Open pricing modal
   */
  const openPricingModal = useCallback(() => {
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
  const openUpgradeSuccessModal = useCallback((tier: 'pro' | 'team', activating = false) => {
    setUpgradedTier(tier);
    setSubscriptionActivating(activating);
    setUpgradeSuccessModalOpen(true);
  }, []);
  
  /**
   * Close upgrade success modal
   */
  const closeUpgradeSuccessModal = useCallback(() => {
    setUpgradeSuccessModalOpen(false);
  }, []);
  
  /**
   * Open Stripe billing portal
   */
  const manageBilling = useCallback(async () => {
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session?.access_token) {
        showToast('Please sign in first');
        return;
      }

      const response = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ returnUrl: `${window.location.origin}/?portal=return` }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to open billing portal');
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Billing portal error:', error);
      showToast('Failed to open billing portal');
    }
  }, [showToast]);
  
  return {
    // Modal state
    pricingModalOpen,
    upgradeSuccessModalOpen,
    subscriptionActivating,
    upgradedTier,
    
    // Actions
    openPricingModal,
    closePricingModal,
    openUpgradeSuccessModal,
    closeUpgradeSuccessModal,
    setSubscriptionActivating,
    manageBilling,
  };
}
