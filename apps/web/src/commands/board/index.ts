/**
 * Board Commands Module
 * 
 * Combines intent and effect commands into cohesive domain commands
 * 
 * @see docs/REFACTOR_ROADMAP.md - PR-REFACTOR-0
 */

import type { BoardCommands } from '../types';
import {
  createCanvasIntentCommands,
  createSelectionIntentCommands,
} from './intent';
import {
  createCanvasEffectCommands,
  createSelectionEffectCommands,
  createHistoryCommands,
} from './effect';

/**
 * Create board commands registry
 * 
 * Combines all board-related commands into sub-command structure
 */
export function createBoardCommands(): BoardCommands {
  // Intent commands (high-frequency, no side effects)
  const canvasIntent = createCanvasIntentCommands();
  const selectionIntent = createSelectionIntentCommands();

  // Effect commands (user actions with history/autosave)
  const canvasEffect = createCanvasEffectCommands();
  const selectionEffect = createSelectionEffectCommands();

  // History commands
  const history = createHistoryCommands();

  return {
    canvas: {
      // Merge intent + effect
      ...canvasIntent,
      ...canvasEffect,
    },
    selection: {
      // Merge intent + effect
      ...selectionIntent,
      ...selectionEffect,
    },
    history,
  };
}
