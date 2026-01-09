/**
 * CommandRegistry - Central command dispatcher
 * 
 * All UI interactions go through CommandRegistry.
 * Separates intent (frequent, no side-effects) from effect (history + autosave).
 */

import { useBoardStore } from '../store';
import { autosaveService } from '../services';
import type { BoardElement, Position } from '@tmc/core';

/**
 * Intent Commands - Frequent, no side-effects
 * Used during continuous interactions (drag, resize, etc.)
 */
export const intentCommands = {
  /**
   * Start moving elements (continuous interaction)
   */
  moveStart: (_elementIds: string[]) => {
    const { beginContinuous } = useBoardStore.getState();
    beginContinuous();
  },
  
  /**
   * Update element position during drag (no history)
   */
  moveDelta: (elementId: string, position: Position) => {
    const { moveElementById } = useBoardStore.getState();
    moveElementById(elementId, position);
  },
  
  /**
   * Start resizing zone (continuous interaction)
   */
  resizeStart: (_zoneId: string) => {
    const { beginContinuous } = useBoardStore.getState();
    beginContinuous();
  },
  
  /**
   * Update zone size during resize (no history)
   */
  resizeDelta: (zoneId: string, position: Position, width: number, height: number) => {
    const { resizeZone } = useBoardStore.getState();
    resizeZone(zoneId, position, width, height);
  },
  
  /**
   * Update arrow endpoint during drag (no history)
   */
  arrowEndpointDelta: (arrowId: string, endpoint: 'start' | 'end', position: Position) => {
    const { updateArrowEndpoint } = useBoardStore.getState();
    updateArrowEndpoint(arrowId, endpoint, position);
  },
};

/**
 * Effect Commands - Commits history + triggers autosave
 * Called on pointerUp, add, delete, group, paste, etc.
 */
export const effectCommands = {
  /**
   * End moving elements (commit history)
   */
  moveEnd: (label?: string) => {
    const { endContinuous } = useBoardStore.getState();
    endContinuous(label || 'Move elements');
    autosaveService.markDirty();
  },
  
  /**
   * End resizing zone (commit history)
   */
  resizeEnd: (label?: string) => {
    const { endContinuous } = useBoardStore.getState();
    endContinuous(label || 'Resize zone');
    autosaveService.markDirty();
  },
  
  /**
   * End arrow endpoint drag (commit history)
   */
  arrowEndpointEnd: (label?: string) => {
    const { endContinuous } = useBoardStore.getState();
    endContinuous(label || 'Update arrow');
    autosaveService.markDirty();
  },
  
  /**
   * Add element (commit history immediately)
   */
  addElement: (element: BoardElement, _label?: string) => {
    const { addElement } = useBoardStore.getState();
    addElement(element);
    // addElement already pushes history
    autosaveService.markDirty();
  },
  
  /**
   * Delete selected elements (commit history immediately)
   */
  deleteSelected: (_label?: string) => {
    const { deleteSelected } = useBoardStore.getState();
    deleteSelected();
    // deleteSelected already pushes history
    autosaveService.markDirty();
  },
  
  /**
   * Duplicate selected elements (commit history immediately)
   */
  duplicateSelected: () => {
    const { duplicateSelected } = useBoardStore.getState();
    duplicateSelected();
    autosaveService.markDirty();
  },
  
  /**
   * Nudge selected elements (commit history immediately)
   */
  nudgeSelected: (dx: number, dy: number) => {
    const { nudgeSelected } = useBoardStore.getState();
    nudgeSelected(dx, dy);
    autosaveService.markDirty();
  },
  
  /**
   * Group selected elements (commit history immediately)
   */
  groupSelected: () => {
    const { createGroup, pushHistory } = useBoardStore.getState();
    createGroup(); // uses selectedIds from store
    pushHistory();
    autosaveService.markDirty();
  },
  
  /**
   * Ungroup selected elements (commit history immediately)
   */
  ungroupSelected: () => {
    const { ungroupSelection, pushHistory } = useBoardStore.getState();
    ungroupSelection();
    pushHistory();
    autosaveService.markDirty();
  },
  
  /**
   * Undo last action
   */
  undo: () => {
    const { undo } = useBoardStore.getState();
    undo();
    autosaveService.markDirty();
  },
  
  /**
   * Redo last undone action
   */
  redo: () => {
    const { redo } = useBoardStore.getState();
    redo();
    autosaveService.markDirty();
  },
  
  /**
   * Commit any pending changes with custom label
   */
  commitHistory: (_label: string) => {
    const { pushHistory } = useBoardStore.getState();
    pushHistory();
    autosaveService.markDirty();
  },
  
  /**
   * Schedule autosave (debounced)
   */
  scheduleAutosave: () => {
    autosaveService.markDirty();
  },
};

/**
 * CommandRegistry - Centralized command dispatcher
 */
export const cmd = {
  intent: intentCommands,
  effect: effectCommands,
};
