/**
 * tutorialSteps - Tutorial data for the 5-step onboarding
 * Each step has a target CSS selector, title, description, and position hint.
 */

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  /** CSS selector for the target element. Falls back to center if not found. */
  targetSelector?: string;
  /** Position of the tooltip relative to the target: 'top' | 'bottom' | 'left' | 'right' */
  position: 'top' | 'bottom' | 'left' | 'right';
  /** Duration in ms before auto-advancing */
  durationMs: number;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Add a Player',
    description: 'Press P or click the canvas to place a home player',
    position: 'top',
    durationMs: 4000,
  },
  {
    id: 2,
    title: 'Add an Arrow',
    description: 'Press A and drag from a player to show passes',
    targetSelector: '[data-tool="arrow-pass"]',
    position: 'bottom',
    durationMs: 4000,
  },
  {
    id: 3,
    title: 'Drag Players',
    description: 'Click and drag any player to move them around the pitch',
    position: 'top',
    durationMs: 4000,
  },
  {
    id: 4,
    title: 'Animate',
    description: 'Press Space to play your tactic step by step',
    targetSelector: '[data-testid="play-button"]',
    position: 'top',
    durationMs: 4000,
  },
  {
    id: 5,
    title: 'You\'re Ready!',
    description: 'Press ? to see all shortcuts whenever you need help',
    position: 'bottom',
    durationMs: 4000,
  },
];