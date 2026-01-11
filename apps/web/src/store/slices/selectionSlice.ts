/**
 * Selection Slice - Selection state management
 */

import type { StateCreator } from 'zustand';
import type { BoardElement, ElementId, Position } from '@tmc/core';
import { filterElementsByIds, isArrowElement, duplicateElements } from '@tmc/core';
import type { AppState } from '../types';

export interface SelectionSlice {
  // State
  selectedIds: ElementId[];
  cursorPosition: Position | null;
  clipboard: BoardElement[];
  
  // Selection actions
  selectElement: (id: ElementId, addToSelection: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectElementsInRect: (start: Position, end: Position) => void;
  setCursorPosition: (position: Position | null) => void;
  
  // Clipboard actions
  copySelection: () => void;
  pasteClipboard: () => void;
  
  // Computed
  getSelectedElements: () => BoardElement[];
  getSelectedElement: () => BoardElement | undefined;
}

export const createSelectionSlice: StateCreator<
  AppState,
  [],
  [],
  SelectionSlice
> = (set, get) => ({
  selectedIds: [],
  cursorPosition: null,
  clipboard: [],
  
  selectElement: (id, addToSelection) => {
    set((state) => {
      if (addToSelection) {
        const isSelected = state.selectedIds.includes(id);
        return {
          selectedIds: isSelected
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id],
        };
      }
      return { selectedIds: [id] };
    });
  },
  
  selectAll: () => {
    set((state) => ({
      selectedIds: state.elements.map((el) => el.id),
    }));
  },
  
  clearSelection: () => {
    set({ selectedIds: [] });
  },
  
  selectElementsInRect: (start, end) => {
    const { elements } = get();
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    
    const inRect: ElementId[] = [];
    
    for (const el of elements) {
      let x: number, y: number;
      
      if ('position' in el) {
        x = (el.position as Position).x;
        y = (el.position as Position).y;
      } else if (isArrowElement(el)) {
        const startIn = el.startPoint.x >= minX && el.startPoint.x <= maxX &&
                        el.startPoint.y >= minY && el.startPoint.y <= maxY;
        const endIn = el.endPoint.x >= minX && el.endPoint.x <= maxX &&
                      el.endPoint.y >= minY && el.endPoint.y <= maxY;
        if (startIn || endIn) {
          inRect.push(el.id);
        }
        continue;
      } else {
        continue;
      }
      
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        inRect.push(el.id);
      }
    }
    
    set({ selectedIds: inRect });
  },
  
  setCursorPosition: (position) => {
    set({ cursorPosition: position });
  },
  
  copySelection: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.length === 0) return;
    
    const selectedElements = filterElementsByIds(elements, selectedIds);
    set({ clipboard: structuredClone(selectedElements) });
  },
  
  pasteClipboard: () => {
    const { clipboard } = get();
    if (clipboard.length === 0) return;
    
    const pasted = duplicateElements(clipboard, { x: 20, y: 20 });
    
    set((state) => ({
      elements: [...state.elements, ...pasted],
      selectedIds: pasted.map((el: BoardElement) => el.id),
    }));
    get().pushHistory();
  },
  
  getSelectedElements: () => {
    const { elements, selectedIds } = get();
    return filterElementsByIds(elements, selectedIds);
  },
  
  getSelectedElement: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.length !== 1) return undefined;
    return elements.find((el) => el.id === selectedIds[0]);
  },
});
