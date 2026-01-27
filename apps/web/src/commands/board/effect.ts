/**
 * Board Effect Commands
 * 
 * User actions with side effects:
 * - History commits
 * - Autosave triggers
 * - Semantic user operations (add, delete, paste, group)
 * 
 * @see docs/REFACTOR_ROADMAP.md - PR-REFACTOR-0
 */

import type { Position } from '@tmc/core';
import type { CanvasCommands, SelectionCommands, HistoryCommands } from '../types';
import { useBoardStore } from '../../store';

/**
 * Create effect commands (pass-through to store for now)
 * 
 * ⚠️ PR0 ONLY: Direct store access allowed for scaffolding
 * MUST be removed when UI is wired to cmd.* (PR1+)
 */
export function createCanvasEffectCommands(): Pick<
  CanvasCommands,
  | 'addPlayer'
  | 'addBall'
  | 'addArrow'
  | 'addZone'
  | 'addText'
  | 'addEquipment'
  | 'deleteElement'
  | 'updateElement'
> {
  return {
    addPlayer: (team: 'home' | 'away', position?: Position) => {
      const store = useBoardStore.getState();
      if (position) {
        store.setCursorPosition(position);
      }
      store.addPlayerAtCursor(team);
      // ✅ addPlayerAtCursor already calls pushHistory (effect!)
    },

    addBall: (position?: Position) => {
      const store = useBoardStore.getState();
      if (position) {
        store.setCursorPosition(position);
      }
      store.addBallAtCursor();
      // ✅ addBallAtCursor already calls pushHistory
    },

    addArrow: (type: 'pass' | 'run', start?: Position, _end?: Position) => {
      const store = useBoardStore.getState();
      if (start) {
        store.setCursorPosition(start);
      }
      store.addArrowAtCursor(type);
      // ✅ addArrowAtCursor already calls pushHistory
      // TODO: Handle start/end positions properly
    },

    addZone: (position?: Position, _width?: number, _height?: number) => {
      const store = useBoardStore.getState();
      if (position) {
        store.setCursorPosition(position);
      }
      store.addZoneAtCursor();
      // ✅ addZoneAtCursor already calls pushHistory
      // TODO: Handle width/height parameters
    },

    addText: (position?: Position, _content?: string) => {
      const store = useBoardStore.getState();
      if (position) {
        store.setCursorPosition(position);
      }
      store.addTextAtCursor();
      // ✅ addTextAtCursor already calls pushHistory
      // TODO: Handle content parameter
    },

    addEquipment: (type: string, position?: Position) => {
      const store = useBoardStore.getState();
      if (position) {
        store.setCursorPosition(position);
      }
      // Cast type to appropriate equipment type
      store.addEquipmentAtCursor(type as any);
      // ✅ addEquipmentAtCursor already calls pushHistory
    },

    deleteElement: (id: string) => {
      const store = useBoardStore.getState();
      // Select element first, then delete
      store.selectElement(id, false);
      store.deleteSelected();
      // ✅ deleteSelected already calls pushHistory
    },

    updateElement: (id: string, _updates: Partial<any>) => {
      const store = useBoardStore.getState();
      // This is a generic update - will be refined in later PRs
      const elements = store.elements;
      const element = elements.find((el) => el.id === id);
      if (!element) return;

      // For now, use the existing update methods based on element type
      // This will be refactored in later PRs
      store.pushHistory();
    },
  };
}

/**
 * Create selection effect commands (with history)
 */
export function createSelectionEffectCommands(): Pick<
  SelectionCommands,
  | 'copySelected'
  | 'pasteClipboard'
  | 'deleteSelected'
  | 'duplicateSelected'
  | 'groupSelected'
  | 'ungroupSelected'
> {
  return {
    copySelected: () => {
      const store = useBoardStore.getState();
      store.copySelection();
      // ✅ NO history commit - copy doesn't change state
    },

    pasteClipboard: () => {
      const store = useBoardStore.getState();
      store.pasteClipboard();
      // ✅ pasteClipboard already calls pushHistory (effect!)
    },

    deleteSelected: () => {
      const store = useBoardStore.getState();
      store.deleteSelected();
      // ✅ deleteSelected already calls pushHistory (effect!)
    },

    duplicateSelected: () => {
      const store = useBoardStore.getState();
      store.duplicateSelected();
      // ✅ duplicateSelected already calls pushHistory (effect!)
    },

    groupSelected: () => {
      // TODO: Implement grouping in later PRs
      console.warn('groupSelected not yet implemented');
    },

    ungroupSelected: () => {
      // TODO: Implement ungrouping in later PRs
      console.warn('ungroupSelected not yet implemented');
    },
  };
}

/**
 * Create history commands
 */
export function createHistoryCommands(): HistoryCommands {
  return {
    commitUserAction: () => {
      const store = useBoardStore.getState();
      store.pushHistory();
      // ✅ Explicit semantic name for user action commits
    },

    undo: () => {
      const store = useBoardStore.getState();
      store.undo();
    },

    redo: () => {
      const store = useBoardStore.getState();
      store.redo();
    },

    canUndo: () => {
      const store = useBoardStore.getState();
      return store.canUndo();
    },

    canRedo: () => {
      const store = useBoardStore.getState();
      return store.canRedo();
    },
  };
}
