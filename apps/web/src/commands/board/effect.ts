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

import {
  DEFAULT_PITCH_CONFIG,
  createArrow,
  createEquipment,
  createText,
  createZone,
  isArrowElement,
  snapToGrid,
} from '@tmc/core';
import type { BoardElement, EquipmentType, Position } from '@tmc/core';
import type { CanvasCommands, SelectionCommands, HistoryCommands } from '../types';
import { useBoardStore } from '../../store';
import { useUIStore } from '../../store/useUIStore';

const getGridSize = () => useUIStore.getState().gridSize ?? DEFAULT_PITCH_CONFIG.gridSize;

const getDefaultPosition = (): Position => ({
  x: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.width / 2,
  y: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.height / 2,
});

const commitElement = (element: BoardElement) => {
  useBoardStore.getState().addElement(element);
};

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

    addArrow: (type: 'pass' | 'run' | 'shoot' | 'dribble', start?: Position, end?: Position) => {
      const store = useBoardStore.getState();
      if (!start && !end) {
        store.addArrowAtCursor(type);
        return;
      }

      const arrow = createArrow(start ?? getDefaultPosition(), type, getGridSize());
      if (end) {
        arrow.endPoint = snapToGrid(end, getGridSize());
      }
      if (store.isAutoNumbering) {
        const highest = store.elements
          .filter(isArrowElement)
          .reduce((max, el) => Math.max(max, el.number ?? 0), 0);
        arrow.number = highest + 1;
        arrow.showNumber = true;
      }
      commitElement(arrow);
    },

    addZone: (position?: Position, width?: number, height?: number) => {
      const store = useBoardStore.getState();
      if (!position && width === undefined && height === undefined) {
        store.addZoneAtCursor();
        return;
      }

      const zone = createZone(position ?? getDefaultPosition(), 'rect', getGridSize());
      if (width !== undefined) zone.width = Math.max(1, width);
      if (height !== undefined) zone.height = Math.max(1, height);
      commitElement(zone);
    },

    addText: (position?: Position, content?: string) => {
      const store = useBoardStore.getState();
      if (!position && content === undefined) {
        store.addTextAtCursor();
        return;
      }

      const text = createText(
        snapToGrid(position ?? getDefaultPosition(), getGridSize()),
        content ?? 'Text'
      );
      commitElement(text);
    },

    addEquipment: (type: string, position?: Position) => {
      const store = useBoardStore.getState();
      if (!position) {
        store.addEquipmentAtCursor(type as EquipmentType);
        return;
      }

      commitElement(createEquipment(position, type as EquipmentType, 'standard', getGridSize()));
    },

    deleteElement: (id: string) => {
      const store = useBoardStore.getState();
      // Select element first, then delete
      store.selectElement(id, false);
      store.deleteSelected();
      // ✅ deleteSelected already calls pushHistory
    },

    updateElement: (id: string, updates: Partial<any>) => {
      const store = useBoardStore.getState();
      const elements = store.elements;
      const element = elements.find((el) => el.id === id);
      if (!element) return;

      useBoardStore.setState({
        elements: elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
      });
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
      const store = useBoardStore.getState();
      const before = store.groups.length;
      store.createGroup();
      if (useBoardStore.getState().groups.length !== before) {
        store.pushHistory();
      }
    },

    ungroupSelected: () => {
      const store = useBoardStore.getState();
      const before = store.groups.length;
      store.ungroupSelection();
      if (useBoardStore.getState().groups.length !== before) {
        store.pushHistory();
      }
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
