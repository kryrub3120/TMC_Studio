/**
 * useEntitlements Hook
 * TMC Studio - Monetization Foundation
 * 
 * Provides access to user's plan and entitlements.
 * 
 * IMPORTANT: This hook is created in PR-MON-CORE but NOT YET USED by UI.
 * Enforcement comes in future PRs:
 * - PR-MON-EXPORT: Use can('exportGIF') to gate export buttons
 * - PR-MON-PROJECT-LIMITS: Use can('createProject') to gate project creation
 * - PR-MON-STEP-LIMITS: Use can('addStep') to gate step addition
 */

import { useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import type {
  Plan,
  Entitlements,
  EntitledAction,
  CanResult,
} from '../lib/entitlements';
import {
  getEntitlements,
  derivePlan,
  can as canHelper,
} from '../lib/entitlements';

export interface UseEntitlementsResult {
  plan: Plan;
  entitlements: Entitlements;
  can: (
    action: EntitledAction,
    context?: { projectCount?: number; stepCount?: number; folderCount?: number }
  ) => CanResult;
  // Convenience booleans
  isGuest: boolean;
  isPro: boolean;
  isTeam: boolean;
}

/**
 * Hook to access user's entitlements based on their plan
 * 
 * @returns Plan, entitlements, permission checker, and convenience flags
 * 
 * @example
 * ```tsx
 * const { plan, can, isPro } = useEntitlements();
 * 
 * // Check if user can export GIF
 * const canExportGIF = can('exportGIF');
 * // Returns: true | 'soft-prompt' | 'hard-block'
 * 
 * // Check if user can create another project
 * const canCreateProject = can('createProject', { projectCount: 2 });
 * ```
 */
export function useEntitlements(): UseEntitlementsResult {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useMemo(() => {
    const plan = derivePlan(isAuthenticated, user?.subscription_tier);
    const entitlements = getEntitlements(plan);

    return {
      plan,
      entitlements,
      can: (action, context) => canHelper(plan, action, context),
      isGuest: plan === 'guest',
      isPro: plan === 'pro' || plan === 'team',
      isTeam: plan === 'team',
    };
  }, [isAuthenticated, user?.subscription_tier]);
}
