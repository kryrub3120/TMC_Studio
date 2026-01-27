/**
 * Board Intent Commands
 * 
 * High-frequency operations with NO side effects:
 * - No history commits
 * - No autosave triggers
 * - Live updates during drag/resize/etc.
 * 
 * @see docs/REFACTOR_ROADMAP.md - PR-REFACTOR-0
 */

import type { Position } from '@tmc/core';
import type { CanvasCommands, SelectionCommands } from '../types';
import { useBoardStore } from '../../store';

/**
 * Create intent commands (pass-through to store for now)
 * 
 * ⚠️ PR0 ONLY: Direct store access allowed for scaffolding
 * MUST be removed when UI is wired to cmd.* (PR1+)
 */
export function createCanvasIntentCommands(): Pick<
  CanvasCommands,
  'moveElementLive' | 'resizeZoneLive' | 'updateArrowLive'
> {
  return {
    moveElementLive: (id: string, position: Position) => {
      const store = useBoardStore.getState();
      store.moveElementById(id, position);
      // ✅ NO history commit - intent only
    },

    resizeZoneLive: (id: string, width: number, height: number) => {
      const store = useBoardStore.getState();
      const element = store.elements.find((el) => el.id === id);
      if (!element || element.type !== 'zone') return;
      
      // Assuming element has position property
      const position = 'position' in element ? element.position as Position : { x: 0, y: 0 };
      store.resizeZone(id, position, width, height);
      // Note: resizeZone currently calls pushHistory - this will be fixed in PR2
    },

    updateArrowLive: (id: string, start: Position, end: Position) => {
      const store = useBoardStore.getState();
      store.updateArrowEndpoint(id, 'start', start);
      store.updateArrowEndpoint(id, 'end', end);
      // ✅ NO history commit during drag - intent only
    },
  };
}

/**
 * Create selection intent commands (no history)
 */
export function createSelectionIntentCommands(): Pick<
  SelectionCommands,
  'select' | 'clear' | 'selectAll' | 'selectInRect'
> {
  return {
    select: (id: string, addToSelection: boolean) => {
      const store = useBoardStore.getState();
      store.selectElement(id, addToSelection);
      // ✅ NO history commit - selection is not undoable
    },

    clear: () => {
      const store = useBoardStore.getState();
      store.clearSelection();
      // ✅ NO history commit
    },

    selectAll: () => {
      const store = useBoardStore.getState();
      store.selectAll();
      // ✅ NO history commit
    },

    selectInRect: (start: Position, end: Position) => {
      const store = useBoardStore.getState();
      store.selectElementsInRect(start, end);
      // ✅ NO history commit
    },
  };
}
