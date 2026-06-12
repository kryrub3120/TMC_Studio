/**
 * tutorialSteps - Coach Tour data for the first-user onboarding.
 * Each step defines a target, a concise value message, and a small visual demo.
 */

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
  demo: 'shortcuts' | 'inspector' | 'orientation' | 'equipment' | 'export' | 'premium';
  /** CTA label for the next button. */
  cta?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    eyebrow: 'Speed first',
    title: 'Build with shortcuts, not menus',
    description: 'Open commands or the shortcut sheet, then drop players, balls and arrows without breaking your coaching flow.',
    targetSelector: '[data-tour="shortcuts"]',
    position: 'left',
    durationMs: 6500,
    keycaps: ['P', 'B', 'A', '?', '⌘K'],
    targetLabel: 'Command center',
    demo: 'shortcuts',
    cta: 'Show editing',
  },
  {
    id: 2,
    eyebrow: 'Edit like a coach',
    title: 'Select, right-click, adjust',
    description: 'Use the inspector for precise edits, or right-click any element when you need quick tactical changes.',
    targetSelector: '[data-tour="inspector"]',
    position: 'left',
    durationMs: 6500,
    keycaps: ['I', 'PPM', 'Enter'],
    targetLabel: 'Inspector',
    demo: 'inspector',
    cta: 'Show orientation',
  },
  {
    id: 3,
    eyebrow: 'Readable movement',
    title: 'Flip the pitch and aim player vision',
    description: 'Use pitch orientation for layout, then rotate selected players so their intent is obvious at a glance.',
    targetSelector: '[data-tour="inspector"]',
    position: 'left',
    durationMs: 6500,
    keycaps: ['O', '[', ']', 'V'],
    targetLabel: 'Orientation controls',
    demo: 'orientation',
    cta: 'Show equipment',
  },
  {
    id: 4,
    eyebrow: 'Training design',
    title: 'Add equipment in seconds',
    description: 'Create drills with goals, ladders, cones and hurdles using the same fast keyboard workflow.',
    targetSelector: '[data-tour="shortcuts"]',
    position: 'left',
    durationMs: 6500,
    keycaps: ['J', 'Y', 'C', 'U'],
    targetLabel: 'Equipment shortcuts',
    demo: 'equipment',
    cta: 'Show export',
  },
  {
    id: 5,
    eyebrow: 'Share the plan',
    title: 'Export a clean session board',
    description: 'Send the drill to players, staff or your training library as a polished tactical image.',
    targetSelector: '[data-tour="export"]',
    position: 'bottom',
    durationMs: 6500,
    keycaps: ['Export', 'PNG', 'PDF', 'GIF'],
    targetLabel: 'Export',
    demo: 'export',
    cta: 'Finish tour',
  },
  {
    id: 6,
    eyebrow: 'Go further',
    title: 'Keep building with Pro when you need more',
    description: 'Organize more work, unlock advanced flows and keep your coaching library ready for matchday.',
    targetSelector: '[data-tour="premium"]',
    position: 'bottom',
    durationMs: 8000,
    keycaps: ['Projects', 'Cloud', 'Pro'],
    targetLabel: 'Account and plan',
    demo: 'premium',
    cta: 'Start building',
  },
];
