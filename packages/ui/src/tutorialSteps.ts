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
  // One unified tutorial for every plan — step 9 (Settings) is shown to all.
  base.push(getStepForPlan(SETTINGS_STEP, plan));
  return base;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ─── Step 1: Warm-up — Add players ───────────────────────────────
  {
    id: 1,
    eyebrow: '🏋️ Warm-up',
    title: 'Set up your players',
    description: 'Press P to add home players, Shift+P for away. Use number keys 1-6 for instant formations. Your tactical board starts here.',
    targetSelector: '[data-tour="players-menu"]',
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
    targetSelector: '[data-tour="arrows-menu"]',
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
    targetSelector: '[data-tour="equipment-menu"]',
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
    title: 'Your squad and tactical presets',
    description: 'Drag squad players onto the pitch, save named setups in Settings, then load Low block, Mid block or pressing directly under the team name. Use the pencil to edit on the pitch.',
    targetSelector: '[data-tour="squad"]',
    position: 'top',
    durationMs: 7000,
    keycaps: ['Drag & drop', 'Option/Alt+1–9'],
    targetLabel: 'Squad Bench',
    demo: 'squad',
    cta: 'Animate tactic',
    roleVariants: {
      guest: {
        description: 'Drag players from the Squad Bench onto the pitch. Create a free account to save your roster and named tactical setups between sessions.',
      },
      free: {
        description: 'Free stores up to 5 squad players. Save named tactical setups and load them under the team name; Pro expands the roster to 35 per team.',
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
    eyebrow: '📚 Library',
    title: 'Turn drawings into sessions',
    description: 'Open Projects: save a board as a Graphic, turn it into an Exercise with coaching details, then add exercises to an ordered Session plan.',
    targetSelector: '[data-tour="projects-panel"]',
    position: 'right',
    durationMs: 7000,
    keycaps: ['Graphic', 'Exercise', 'Session'],
    targetLabel: 'Coaching library',
    demo: 'save',
    cta: 'Share & export',
    roleVariants: {
      guest: {
        title: 'Build a coaching library — create a free account',
        description: 'Draw freely as a guest. Create a free account to save Graphics, build Exercises and assemble Session plans in the cloud.',
        cta: 'Sign up free',
      },
      free: {
        description: 'Create up to three Graphics, Exercises and Session plans. Use the “How it works” guide in Projects; Pro removes library limits.',
      },
    },
  },

  // ─── Step 8: Export & Share ──────────────────────────────────────
  {
    id: 8,
    eyebrow: '📤 Share',
    title: 'Export and share with your team',
    description: 'Export your drill as PNG, GIF animation, or PDF. Press ? for the full shortcut sheet. Your tactical library is ready for matchday.',
    targetSelector: '[data-tour="export-menu"]',
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

// ─── Step 9 (all plans): Settings ──────────────────────────────────
export const SETTINGS_STEP: TutorialStep = {
  id: 9,
  eyebrow: '⚙️ Settings',
  title: 'Manage your settings',
  description: 'Open Settings to customise your profile, editor preferences, teams and pitch — and manage your account and subscription.',
  targetSelector: '[data-tour="settings-modal"]',
  position: 'left',
  durationMs: 8000,
  targetLabel: 'Settings',
  demo: 'team',
  cta: 'Start coaching',
};

/** @deprecated kept as alias for backwards-compat */
export const TEAM_STEP = SETTINGS_STEP;
