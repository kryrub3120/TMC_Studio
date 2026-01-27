/**
 * CommandRegistry Type Definitions
 * 
 * This file defines the contract for the command registry.
 * Commands are split into:
 * - Intent: High-frequency, no side effects (drag, move, resize)
 * - Effect: User actions with history commits and autosave triggers
 * 
 * @see docs/REFACTOR_ROADMAP.md - PR-REFACTOR-0
 */

import type { Position } from '@tmc/core';

// ============================================================================
// Main Registry
// ============================================================================

export interface CommandRegistry {
  board: BoardCommands;
  animation: AnimationCommands;
  edit: EditCommands;
}

// ============================================================================
// Board Commands (R6 - Sub-commands per domain)
// ============================================================================

export interface BoardCommands {
  canvas: CanvasCommands;
  selection: SelectionCommands;
  history: HistoryCommands;
}

// ============================================================================
// Canvas Commands (Intent vs Effect)
// ============================================================================

export interface CanvasCommands {
  // ========== INTENT - High frequency, no side effects ==========
  
  /**
   * Move element during drag (live update, no history commit)
   */
  moveElementLive: (id: string, position: Position) => void;
  
  /**
   * Resize zone during drag (live update, no history commit)
   */
  resizeZoneLive: (id: string, width: number, height: number) => void;
  
  /**
   * Update arrow during drag (live update, no history commit)
   */
  updateArrowLive: (id: string, start: Position, end: Position) => void;
  
  // ========== EFFECT - Commits history, triggers autosave ==========
  
  /**
   * Add player to canvas (commits history)
   */
  addPlayer: (team: 'home' | 'away', position?: Position) => void;
  
  /**
   * Add ball to canvas (commits history)
   */
  addBall: (position?: Position) => void;
  
  /**
   * Add arrow to canvas (commits history)
   */
  addArrow: (type: 'pass' | 'run', start?: Position, end?: Position) => void;
  
  /**
   * Add zone to canvas (commits history)
   */
  addZone: (position?: Position, width?: number, height?: number) => void;
  
  /**
   * Add text to canvas (commits history)
   */
  addText: (position?: Position, content?: string) => void;
  
  /**
   * Add equipment to canvas (commits history)
   */
  addEquipment: (type: string, position?: Position) => void;
  
  /**
   * Delete element (commits history)
   */
  deleteElement: (id: string) => void;
  
  /**
   * Update element properties (commits history on completion)
   */
  updateElement: (id: string, updates: Partial<any>) => void;
}

// ============================================================================
// Selection Commands (Intent vs Effect)
// ============================================================================

export interface SelectionCommands {
  // ========== INTENT - No history ==========
  
  /**
   * Select element(s)
   */
  select: (id: string, addToSelection: boolean) => void;
  
  /**
   * Clear selection
   */
  clear: () => void;
  
  /**
   * Select all elements
   */
  selectAll: () => void;
  
  /**
   * Select elements in rectangular area (marquee)
   */
  selectInRect: (start: Position, end: Position) => void;
  
  // ========== EFFECT - With history (copy/paste/delete) ==========
  
  /**
   * Copy selected elements to clipboard
   */
  copySelected: () => void;
  
  /**
   * Paste clipboard content (commits history)
   */
  pasteClipboard: () => void;
  
  /**
   * Delete selected elements (commits history)
   */
  deleteSelected: () => void;
  
  /**
   * Duplicate selected elements (commits history)
   */
  duplicateSelected: () => void;
  
  /**
   * Group selected elements (commits history)
   */
  groupSelected: () => void;
  
  /**
   * Ungroup selected elements (commits history)
   */
  ungroupSelected: () => void;
}

// ============================================================================
// History Commands
// ============================================================================

export interface HistoryCommands {
  /**
   * Commit user action to history
   * ONLY called on: pointerUp, add, delete, group, paste
   */
  commitUserAction: () => void;
  
  /**
   * Undo last action
   */
  undo: () => void;
  
  /**
   * Redo last undone action
   */
  redo: () => void;
  
  /**
   * Check if undo is available
   */
  canUndo: () => boolean;
  
  /**
   * Check if redo is available
   */
  canRedo: () => boolean;
}

// ============================================================================
// Animation Commands (TODO: PR1+)
// ============================================================================

export interface AnimationCommands {
  // Placeholder for now - will be implemented in later PRs
  play?: () => void;
  pause?: () => void;
  stop?: () => void;
}

// ============================================================================
// Edit Commands (TODO: PR1+)
// ============================================================================

export interface EditCommands {
  // Placeholder for now - will be implemented in later PRs
  cut?: () => void;
  copy?: () => void;
  paste?: () => void;
}
