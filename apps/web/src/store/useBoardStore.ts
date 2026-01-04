/**
 * Zustand store for board state management
 */

import { create } from 'zustand';
import type {
  BoardElement,
  BoardDocument,
  Position,
  Team,
  ElementId,
  PlayerElement,
} from '@tmc/core';
import {
  DEFAULT_PITCH_CONFIG,
  createDocument,
  createPlayer,
  createBall,
  duplicateElements,
  moveElement,
  removeElementsByIds,
  filterElementsByIds,
  saveToLocalStorage,
  loadFromLocalStorage,
  isPlayerElement,
} from '@tmc/core';

/** History entry for undo/redo */
interface HistoryEntry {
  elements: BoardElement[];
  selectedIds: ElementId[];
}

/** Board store state */
interface BoardState {
  // Document state
  document: BoardDocument;
  
  // Current elements (from active step)
  elements: BoardElement[];
  selectedIds: ElementId[];
  
  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  
  // UI state
  cursorPosition: Position | null;
  
  // Actions
  setElements: (elements: BoardElement[]) => void;
  addElement: (element: BoardElement) => void;
  addPlayerAtCursor: (team: Team) => void;
  addBallAtCursor: () => void;
  moveElementById: (id: ElementId, position: Position) => void;
  selectElement: (id: ElementId, addToSelection: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  updateSelectedElement: (updates: Partial<PlayerElement>) => void;
  setCursorPosition: (position: Position | null) => void;
  
  // History actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // Document actions
  saveDocument: () => void;
  loadDocument: () => boolean;
  newDocument: () => void;
  
  // Computed
  getSelectedElements: () => BoardElement[];
  getSelectedElement: () => BoardElement | undefined;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

/** Get next available player number */
function getNextPlayerNumber(elements: BoardElement[], team: Team): number {
  const teamPlayers = elements.filter(
    (el) => isPlayerElement(el) && el.team === team
  ) as PlayerElement[];
  const numbers = teamPlayers.map((p) => p.number);
  let next = 1;
  while (numbers.includes(next)) {
    next++;
  }
  return next;
}

/** Create the board store */
export const useBoardStore = create<BoardState>((set, get) => {
  // Initialize with saved document or new document
  const savedDoc = loadFromLocalStorage();
  const initialDoc = savedDoc ?? createDocument('Untitled Board');
  const initialElements = initialDoc.steps[0]?.elements ?? [];

  return {
    document: initialDoc,
    elements: initialElements,
    selectedIds: [],
    history: [{ elements: initialElements, selectedIds: [] }],
    historyIndex: 0,
    cursorPosition: null,

    setElements: (elements) => {
      set({ elements });
      get().pushHistory();
    },

    addElement: (element) => {
      set((state) => ({
        elements: [...state.elements, element],
        selectedIds: [element.id],
      }));
      get().pushHistory();
    },

    addPlayerAtCursor: (team) => {
      const { cursorPosition, elements } = get();
      const position = cursorPosition ?? { 
        x: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.width / 2,
        y: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.height / 2,
      };
      const number = getNextPlayerNumber(elements, team);
      const player = createPlayer(position, team, number);
      get().addElement(player);
    },

    addBallAtCursor: () => {
      const { cursorPosition } = get();
      const position = cursorPosition ?? { 
        x: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.width / 2,
        y: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.height / 2,
      };
      const ball = createBall(position);
      get().addElement(ball);
    },

    moveElementById: (id, position) => {
      set((state) => ({
        elements: state.elements.map((el) =>
          el.id === id ? moveElement(el, position) : el
        ),
      }));
      // Don't push history on every move - only on drag end
    },

    selectElement: (id, addToSelection) => {
      set((state) => {
        if (addToSelection) {
          // Toggle selection
          const isSelected = state.selectedIds.includes(id);
          return {
            selectedIds: isSelected
              ? state.selectedIds.filter((sid) => sid !== id)
              : [...state.selectedIds, id],
          };
        } else {
          return { selectedIds: [id] };
        }
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

    deleteSelected: () => {
      const { selectedIds } = get();
      if (selectedIds.length === 0) return;
      
      set((state) => ({
        elements: removeElementsByIds(state.elements, selectedIds),
        selectedIds: [],
      }));
      get().pushHistory();
    },

    duplicateSelected: () => {
      const { selectedIds, elements } = get();
      if (selectedIds.length === 0) return;
      
      const selectedElements = filterElementsByIds(elements, selectedIds);
      const duplicated = duplicateElements(selectedElements);
      
      set((state) => ({
        elements: [...state.elements, ...duplicated],
        selectedIds: duplicated.map((el) => el.id),
      }));
      get().pushHistory();
    },

    updateSelectedElement: (updates) => {
      const { selectedIds, elements } = get();
      if (selectedIds.length !== 1) return;
      
      const id = selectedIds[0];
      set({
        elements: elements.map((el) => {
          if (el.id === id && isPlayerElement(el)) {
            return { ...el, ...updates };
          }
          return el;
        }),
      });
      get().pushHistory();
    },

    setCursorPosition: (position) => {
      set({ cursorPosition: position });
    },

    pushHistory: () => {
      set((state) => {
        // Remove any redo history
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        
        // Add current state
        newHistory.push({
          elements: structuredClone(state.elements),
          selectedIds: [...state.selectedIds],
        });
        
        // Limit history size
        const maxHistory = 50;
        if (newHistory.length > maxHistory) {
          newHistory.shift();
        }
        
        return {
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      });
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

    saveDocument: () => {
      const { document, elements } = get();
      const updatedDoc: BoardDocument = {
        ...document,
        steps: [
          {
            ...document.steps[0],
            elements: structuredClone(elements),
          },
          ...document.steps.slice(1),
        ],
        updatedAt: new Date().toISOString(),
      };
      saveToLocalStorage(updatedDoc);
      set({ document: updatedDoc });
    },

    loadDocument: () => {
      const doc = loadFromLocalStorage();
      if (!doc) return false;
      
      const elements = doc.steps[0]?.elements ?? [];
      set({
        document: doc,
        elements,
        selectedIds: [],
        history: [{ elements, selectedIds: [] }],
        historyIndex: 0,
      });
      return true;
    },

    newDocument: () => {
      const doc = createDocument('Untitled Board');
      const elements = doc.steps[0]?.elements ?? [];
      set({
        document: doc,
        elements,
        selectedIds: [],
        history: [{ elements, selectedIds: [] }],
        historyIndex: 0,
      });
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

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,
  };
});
