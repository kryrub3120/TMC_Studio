/**
 * Main Store - Composed from all slices
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

import type { AppState } from './types';
import {
  createElementsSlice,
  createSelectionSlice,
  createHistorySlice,
  createStepsSlice,
  createGroupsSlice,
  createDocumentSlice,
  createDrawingSlice,
} from './slices';

/**
 * Combined Zustand store with all slices
 * Replaces the monolithic useBoardStore
 */
export const useBoardStore = create<AppState>()(
  devtools(
    subscribeWithSelector(
      (...a) => {
        // Initialize document first to get initial elements
        const documentSlice = createDocumentSlice(...a);
        const initialElements = documentSlice.document.steps[0]?.elements ?? [];
        
        return {
          // Document slice (must be first - provides initial state)
          ...documentSlice,
          
          // Elements slice
          ...createElementsSlice(...a),
          elements: initialElements, // Override with document's initial elements
          
          // Selection slice
          ...createSelectionSlice(...a),
          
          // History slice
          ...createHistorySlice(...a),
          history: [{ elements: initialElements, selectedIds: [] }],
          historyIndex: 0,
          
          // Steps slice
          ...createStepsSlice(...a),
          
          // Groups slice
          ...createGroupsSlice(...a),
          
          // Drawing slice
          ...createDrawingSlice(...a),
        };
      }
    ),
    { name: 'TMC-Board-Store' }
  )
);

// Re-export for backward compatibility
export { useBoardStore as default };

// Typed selector hooks for performance (optional - can be added later)
// export const useElements = () => useBoardStore((s) => s.elements);
// export const useSelectedIds = () => useBoardStore((s) => s.selectedIds);
// export const useCurrentStep = () => useBoardStore((s) => s.currentStepIndex);
