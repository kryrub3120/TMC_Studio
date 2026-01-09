/**
 * Shared types for Zustand store slices
 */

import type {
  BoardElement,
  ElementId,
} from '@tmc/core';

/** History entry for undo/redo */
export interface HistoryEntry {
  elements: BoardElement[];
  selectedIds: ElementId[];
}

/** Group of elements that move together */
export interface Group {
  id: string;
  name: string;
  memberIds: string[];
  locked: boolean;
  visible: boolean;
}

/** Combined app state from all slices - will be computed from slice types */
export type AppState = 
  & import('./slices/elementsSlice').ElementsSlice
  & import('./slices/selectionSlice').SelectionSlice
  & import('./slices/historySlice').HistorySlice
  & import('./slices/stepsSlice').StepsSlice
  & import('./slices/groupsSlice').GroupsSlice
  & import('./slices/documentSlice').DocumentSlice
  & import('./slices/drawingSlice').DrawingSlice;
