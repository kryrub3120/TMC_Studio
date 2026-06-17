/**
 * tutorialSteps - Coach Tour data for the first-user onboarding.
 * Storytelling: "Create your first training session" — 8 steps.
 * Each step builds on the previous, guiding the user through a real coaching workflow.
 *
 * Role variants adapt content per plan (guest/free/pro/team/clubAdmin).
 */

/** Mirror of apps/web Plan type for tutorial role awareness */
export type Plan = 'guest' | 'free' | 'pro' | 'team';

/** Content fields that can be overridden per role */
export interface TutorialStepContent {
  eyebrow: string;
  title: string;
  description: string;
  cta?: string;
}

export interface TutorialStep {
  id: number;
  eyebrow: string;
  title: string;
  description: string;
  /** CSS selector for the target element. Falls back to center if not found. */
  targetSelector?: string;
  /** Position of the tooltip relative to the target: 'top' | 'bottom' | 'left' | 'right' */
  position: 'top' | 'bottom' | 'left' | 'right';
  /** Duration in ms before auto-advancing */
  durationMs: number;
  /** Keyboard shortcuts highlighted in this step. */
  keycaps?: string[];
  /** Short label rendered next to the target spotlight. */
  targetLabel?: string;
  /** Visual demo variant rendered inside the coachmark. */
  demo: 'shortcuts' | 'arrows' | 'orientation' | 'equipment' | 'squad' | 'steps' | 'save' | 'export' | 'premium' | 'team';
  /** CTA label for the next button. */
  cta?: string;
  /** Role-specific content overrides — merged on top of base step */
  roleVariants?: Partial<Record<Plan, Partial<TutorialStepContent>>>;
}

/**
 * Merge base step with role variant.
 * Returns a new object with overridden fields.
 */
export function getStepForPlan(step: TutorialStep, plan: Plan): TutorialStep {
  const variant = step.roleVariants?.[plan];
  if (!variant) return step;
  return {
    ...step,
    ...variant,
    eyebrow: variant.eyebrow ?? step.eyebrow,
    title: variant.title ?? step.title,
    description: variant.description ?? step.description,
    cta: variant.cta ?? step.cta,
  };
}

/**
 * Get the list of steps for a given plan.
 * Club Admin gets an extra step 9 (Team Management).
 */
export function getStepsForPlan(plan: Plan): TutorialStep[] {
  const base = TUTORIAL_STEPS.map((s) => getStepForPlan(s, plan));
  if (plan === 'team') {
    base.push(getStepForPlan(TEAM_STEP, plan));
  }
  return base;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ─── Step 1: Warm-up — Add players ───────────────────────────────
  {
    id: 1,
    eyebrow: '🏋️ Warm-up',
    title: 'Set up your players',
    description: 'Press P to add home players, Shift+P for away. Use number keys 1-6 for instant formations. Your tactical board starts here.',
    targetSelector: '[data-tour="players"]',
    position: 'bottom',
    durationMs: 7000,
    keycaps: ['P', 'Shift+P', '1-6'],
    targetLabel: 'Add players',
    demo: 'shortcuts',
    cta: 'Draw tactics',
  },

  // ─── Step 2: Plan the movement — Arrows ──────────────────────────
  {
    id: 2,
    eyebrow: '🏃 Movement',
    title: 'Draw your tactics',
    description: 'Press A for pass arrows, R for runs, S for shots. Click-drag on the pitch to show exactly how your team should move.',
    targetSelector: '[data-tour="arrows"]',
    position: 'bottom',
    durationMs: 7000,
    keycaps: ['A', 'R', 'S', 'Shift+N'],
    targetLabel: 'Tactical arrows',
    demo: 'arrows',
    cta: 'Set direction',
  },

  // ─── Step 3: Set direction — Orientation + Vision ────────────────
  {
    id: 3,
    eyebrow: '🧭 Direction',
    title: 'Show where players look',
    description: 'Select a player and press [ or ] to rotate them. Press V to show their vision cone — perfect for pressing drills and defensive shape.',
    targetSelector: '[data-tour="inspector"]',
    position: 'left',
    durationMs: 7000,
    keycaps: ['[', ']', 'V', 'O'],
    targetLabel: 'Orientation',
    demo: 'orientation',
    cta: 'Add equipment',
  },

  // ─── Step 4: Training equipment ──────────────────────────────────
  {
    id: 4,
    eyebrow: '🏋️ Equipment',
    title: 'Build your drill',
    description: 'Add goals (J), cones (K), ladders (Y) and hurdles (U). Use Z for zones, T for text labels. Everything a coach needs for a session.',
    targetSelector: '[data-tour="equipment"]',
    position: 'bottom',
    durationMs: 7000,
    keycaps: ['J', 'K', 'Y', 'U', 'Z', 'T'],
    targetLabel: 'Drill equipment',
    demo: 'equipment',
    cta: 'Manage squad',
  },

  // ─── Step 5: Squad Bench ─────────────────────────────────────────
  {
    id: 5,
    eyebrow: '📋 Squad',
    title: 'Your full roster at hand',
    description: 'The Squad Bench holds your players. Drag them onto the pitch to substitute or add new roles. Click the eye icon to toggle visibility.',
    targetSelector: '[data-tour="squad"]',
    position: 'top',
    durationMs: 7000,
    keycaps: ['Drag & drop'],
    targetLabel: 'Squad Bench',
    demo: 'squad',
    cta: 'Animate tactic',
    roleVariants: {
      guest: {
        description: 'The Squad Bench holds your players. Drag them onto the pitch. Sign up for free to save your squad between sessions.',
      },
      free: {
        description: 'The Squad Bench holds up to 5 players on Free. Drag them onto the pitch. Upgrade to Pro for unlimited squad slots.',
      },
    },
  },

  // ─── Step 6: Steps & Animation ───────────────────────────────────
  {
    id: 6,
    eyebrow: '▶️ Animation',
    title: 'Bring your tactic to life',
    description: 'Press N to add a new step, then adjust positions. Press Space to play — watch your drill animate step by step. Loop with L.',
    targetSelector: '[data-tour="timeline"]',
    position: 'top',
    durationMs: 8000,
    keycaps: ['N', '←', '→', 'Space', 'L'],
    targetLabel: 'Step timeline',
    demo: 'steps',
    cta: 'Save project',
  },

  // ─── Step 7: Save & Projects ─────────────────────────────────────
  {
    id: 7,
    eyebrow: '💾 Save',
    title: 'Never lose your work',
    description: 'Press ⌘S to save. Your projects are auto-saved to the cloud. Open the Projects panel to rename, organize, or pick up where you left off.',
    targetSelector: '[data-tour="shortcuts"]',
    position: 'left',
    durationMs: 7000,
    keycaps: ['⌘S', '⌘O'],
    targetLabel: 'Save & projects',
    demo: 'save',
    cta: 'Share & export',
    roleVariants: {
      guest: {
        title: 'Save your work — create a free account',
        description: 'Press ⌘S to save locally. Create a free account to save to the cloud, access your projects anywhere, and unlock more features.',
        cta: 'Sign up free',
      },
      free: {
        description: 'Press ⌘S to save. Your projects are auto-saved to the cloud. Upgrade to Pro for unlimited projects and GIF/PDF export.',
      },
    },
  },

  // ─── Step 8: Export & Share ──────────────────────────────────────
  {
    id: 8,
    eyebrow: '📤 Share',
    title: 'Export and share with your team',
    description: 'Export your drill as PNG, GIF animation, or PDF. Press ? for the full shortcut sheet. Your tactical library is ready for matchday.',
    targetSelector: '[data-tour="export"]',
    position: 'bottom',
    durationMs: 8000,
    keycaps: ['⌘E', '⇧⌘G', '⇧⌘P', '?'],
    targetLabel: 'Export',
    demo: 'export',
    cta: 'Start coaching',
    roleVariants: {
      guest: {
        title: 'Export PNG — upgrade for more',
        description: 'Export your drill as PNG. Create a free account to unlock more formats and cloud saving.',
        cta: 'Sign up free',
      },
      free: {
        title: 'Export PNG — upgrade for GIF & PDF',
        description: 'Export as PNG. Upgrade to Pro for GIF animations and PDF — perfect for sharing with players and staff.',
        cta: 'Upgrade to Pro',
      },
      pro: {
        title: 'Export in any format',
        description: 'You have full export access: PNG, GIF animation, PDF. Press ? for the full shortcut sheet and command palette.',
        cta: 'Start coaching',
      },
      team: {
        title: 'You have Club Premium — full access',
        description: 'Export PNG, GIF, PDF — everything is unlocked. Press ? for shortcuts. Check the Team panel to manage your club members.',
        cta: 'Start coaching',
      },
    },
  },
];

// ─── Step 9 (Club Admin only): Team Management ─────────────────────
export const TEAM_STEP: TutorialStep = {
  id: 9,
  eyebrow: '👥 Club',
  title: 'Manage your team',
  description: 'Open the Team panel in Inspector to invite coaches and staff. You control who has Club Premium access. Add members, manage billing, and grow your club.',
  targetSelector: '[data-tour="inspector"]',
  position: 'left',
  durationMs: 8000,
  keycaps: ['Team panel', 'Invite', 'Manage'],
  targetLabel: 'Club management',
  demo: 'team',
  cta: 'Start coaching',
};
