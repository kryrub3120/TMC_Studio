/**
 * Entitlements Library
 * TMC Studio - Monetization Foundation
 * 
 * Defines plan types, entitlement mapping, and permission checking.
 * 
 * IMPORTANT: This is infrastructure only (PR-MON-CORE).
 * Enforcement in UI happens in future PRs:
 * - PR-MON-EXPORT: Gate GIF/PDF export
 * - PR-MON-PROJECT-LIMITS: Gate project creation
 * - PR-MON-STEP-LIMITS: Gate step addition
 */

// ===== TYPES =====

export type Plan = 'guest' | 'free' | 'pro' | 'team';

export interface Entitlements {
  maxProjects: number | 'unlimited';
  maxStepsPerProject: number | 'unlimited';
  maxFolders: number | 'unlimited';
  cloudSync: boolean;
  canExportPNG: boolean;
  canExportGIF: boolean;
  canExportPDF: boolean;
  maxSeats: number;
  canInviteMembers: boolean;
  canShareProjects: boolean;
}

export type EntitledAction =
  | 'createProject'
  | 'exportPNG'
  | 'exportGIF'
  | 'exportPDF'
  | 'addStep'
  | 'createFolder'
  | 'syncToCloud'
  | 'inviteMember';

export type CanResult = boolean | 'soft-prompt' | 'hard-block';

// ===== CANONICAL ENTITLEMENTS MAP =====

/**
 * Single source of truth for plan entitlements.
 * Must match docs/MONETIZATION_PLAN.md
 */
export const ENTITLEMENTS_BY_PLAN: Record<Plan, Entitlements> = {
  guest: {
    maxProjects: 1,
    maxStepsPerProject: 5,
    maxFolders: 0,
    cloudSync: false,
    canExportPNG: true,
    canExportGIF: false,
    canExportPDF: false,
    maxSeats: 1,
    canInviteMembers: false,
    canShareProjects: false,
  },
  free: {
    maxProjects: 3,
    maxStepsPerProject: 10,
    maxFolders: 3,
    cloudSync: true,
    canExportPNG: true,
    canExportGIF: false,
    canExportPDF: false,
    maxSeats: 1,
    canInviteMembers: false,
    canShareProjects: false,
  },
  pro: {
    maxProjects: 'unlimited',
    maxStepsPerProject: 'unlimited',
    maxFolders: 'unlimited',
    cloudSync: true,
    canExportPNG: true,
    canExportGIF: true,
    canExportPDF: true,
    maxSeats: 1,
    canInviteMembers: false,
    canShareProjects: false,
  },
  team: {
    maxProjects: 'unlimited',
    maxStepsPerProject: 'unlimited',
    maxFolders: 'unlimited',
    cloudSync: true,
    canExportPNG: true,
    canExportGIF: true,
    canExportPDF: true,
    maxSeats: 5,
    canInviteMembers: true,
    canShareProjects: false, // Future: shared library
  },
};

// ===== HELPER FUNCTIONS =====

/**
 * Get entitlements for a given plan
 */
export function getEntitlements(plan: Plan): Entitlements {
  return ENTITLEMENTS_BY_PLAN[plan];
}

/**
 * Derive plan from authentication state
 * 
 * @param isAuthenticated - Whether user is authenticated
 * @param subscriptionTier - User's subscription tier from database
 * @returns Derived plan
 */
export function derivePlan(
  isAuthenticated: boolean,
  subscriptionTier?: 'free' | 'pro' | 'team'
): Plan {
  if (!isAuthenticated) return 'guest';
  return subscriptionTier ?? 'free';
}

/**
 * Check if a plan can perform an action
 * 
 * @param plan - User's plan
 * @param action - Action to check
 * @param context - Optional context (project/step/folder counts)
 * @returns Permission result:
 *   - true: Allowed
 *   - 'soft-prompt': Approaching limit, show upgrade hint
 *   - 'hard-block': Not allowed, prevent action
 * 
 * NOTE: In PR-MON-CORE, this function is NOT YET USED by UI.
 * Enforcement comes in PR-MON-EXPORT and PR-MON-PROJECT-LIMITS.
 */
export function can(
  plan: Plan,
  action: EntitledAction,
  context?: { projectCount?: number; stepCount?: number; folderCount?: number }
): CanResult {
  const ent = getEntitlements(plan);

  switch (action) {
    case 'exportPNG':
      return ent.canExportPNG;

    case 'exportGIF':
      return ent.canExportGIF ? true : 'hard-block';

    case 'exportPDF':
      return ent.canExportPDF ? true : 'hard-block';

    case 'syncToCloud':
      return ent.cloudSync ? true : 'hard-block';

    case 'inviteMember':
      return ent.canInviteMembers ? true : 'hard-block';

    case 'createProject': {
      if (ent.maxProjects === 'unlimited') return true;
      const count = context?.projectCount ?? 0;
      // At limit → hard block
      if (count >= ent.maxProjects) return 'hard-block';
      // One before limit → soft prompt (upgrade hint)
      if (count === ent.maxProjects - 1) return 'soft-prompt';
      return true;
    }

    case 'addStep': {
      if (ent.maxStepsPerProject === 'unlimited') return true;
      const count = context?.stepCount ?? 0;
      // At limit → hard block
      if (count >= ent.maxStepsPerProject) return 'hard-block';
      // One before limit → soft prompt
      if (count === ent.maxStepsPerProject - 1) return 'soft-prompt';
      return true;
    }

    case 'createFolder': {
      if (ent.maxFolders === 'unlimited') return true;
      const count = context?.folderCount ?? 0;
      // At limit → hard block
      if (count >= ent.maxFolders) return 'hard-block';
      return true;
    }

    default:
      return true;
  }
}
