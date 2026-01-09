/**
 * History Slice - Undo/Redo management with explicit continuous mode
 */

import type { StateCreator } from 'zustand';
import type { AppState, HistoryEntry } from '../types';

const MAX_HISTORY = 50;

export interface HistorySlice {
  // State
  history: HistoryEntry[];
  historyIndex: number;
  isContinuous: boolean; // ⚠️ EXPLICIT FLAG - blocks history during drag/resize/draw
  
  // Actions
  beginContinuous: () => void; // Call on pointerDown (drag start)
  endContinuous: (label: string) => void; // Call on pointerUp (drag end) - commits history
  
  pushHistory: () => void; // For atomic operations (add, delete)
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // Computed
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const createHistorySlice: StateCreator<
  AppState,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  history: [],
  historyIndex: -1,
  isContinuous: false,
  
  // ⚠️ Call on pointerDown (drag/resize/draw start)
  beginContinuous: () => {
    set({ isContinuous: true });
  },
  
  // ⚠️ Call on pointerUp (drag/resize/draw end) - commits history
  endContinuous: (_label: string) => {
    const { isContinuous } = get();
    if (!isContinuous) return;
    
    set({ isContinuous: false });
    get().pushHistory();
  },
  
  pushHistory: () => {
    // ⚠️ Block during continuous operations
    if (get().isContinuous) return;
    
    set((state) => {
      // Truncate future history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      
      // Add current state
      newHistory.push({
        elements: structuredClone(state.elements),
        selectedIds: [...state.selectedIds],
      });
      
      // Limit size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      
      // ALSO: Sync current elements to document.steps to keep in sync
      const updatedSteps = [...state.document.steps];
      if (updatedSteps[state.currentStepIndex]) {
        updatedSteps[state.currentStepIndex] = {
          ...updatedSteps[state.currentStepIndex],
          elements: structuredClone(state.elements),
        };
      }
      
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
        document: {
          ...state.document,
          steps: updatedSteps,
        },
      };
    });
    
    // Mark as dirty and schedule autosave after every history change
    get().markDirty();
  },
  
  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    
    set({
      elements: structuredClone(entry.elements),
      selectedIds: [...entry.selectedIds],
      historyIndex: newIndex,
    });
  },
  
  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    
    set({
      elements: structuredClone(entry.elements),
      selectedIds: [...entry.selectedIds],
      historyIndex: newIndex,
    });
  },
  
  clearHistory: () => {
    set({ history: [], historyIndex: -1 });
  },
  
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
});
