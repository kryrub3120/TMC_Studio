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
  ArrowType,
  ZoneShape,
} from '@tmc/core';
import {
  DEFAULT_PITCH_CONFIG,
  createDocument,
  createPlayer,
  createBall,
  createArrow,
  createZone,
  duplicateElements,
  moveElement,
  removeElementsByIds,
  filterElementsByIds,
  saveToLocalStorage,
  loadFromLocalStorage,
  isPlayerElement,
  isArrowElement,
} from '@tmc/core';

/** History entry for undo/redo */
interface HistoryEntry {
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

/** Board store state */
interface BoardState {
  // Document state
  document: BoardDocument;
  
  // Current elements (from active step)
  elements: BoardElement[];
  selectedIds: ElementId[];
  
  // Groups
  groups: Group[];
  
  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  
  // UI state
  cursorPosition: Position | null;
  
  // Multi-drag state (for dragging multiple selected elements)
  multiDragOffsets: Map<ElementId, Position> | null;
  
  // Drawing state (for click-drag creation of arrows/zones)
  drawingStart: Position | null;
  drawingEnd: Position | null;
  
  // Actions
  setElements: (elements: BoardElement[]) => void;
  addElement: (element: BoardElement) => void;
  addPlayerAtCursor: (team: Team) => void;
  addBallAtCursor: () => void;
  addArrowAtCursor: (arrowType: ArrowType) => void;
  addZoneAtCursor: (shape?: ZoneShape) => void;
  moveElementById: (id: ElementId, position: Position) => void;
  resizeZone: (id: ElementId, position: Position, width: number, height: number) => void;
  updateArrowEndpoint: (id: ElementId, endpoint: 'start' | 'end', position: Position) => void;
  selectElement: (id: ElementId, addToSelection: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  updateSelectedElement: (updates: Partial<PlayerElement>) => void;
  nudgeSelected: (dx: number, dy: number) => void;
  adjustSelectedStrokeWidth: (delta: number) => void;
  cycleSelectedColor: (direction: number) => void;
  selectElementsInRect: (start: Position, end: Position) => void;
  setCursorPosition: (position: Position | null) => void;
  
  // Drawing actions
  startDrawing: (position: Position) => void;
  updateDrawing: (position: Position) => void;
  finishArrowDrawing: (arrowType: ArrowType) => void;
  finishZoneDrawing: (shape: ZoneShape) => void;
  cancelDrawing: () => void;
  
  // History actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // Document actions
  saveDocument: () => void;
  loadDocument: () => boolean;
  newDocument: () => void;
  
  // Group actions
  createGroup: () => void;
  ungroupSelection: () => void;
  selectGroup: (groupId: string) => void;
  getGroups: () => Group[];
  toggleGroupLock: (groupId: string) => void;
  toggleGroupVisibility: (groupId: string) => void;
  renameGroup: (groupId: string, name: string) => void;
  
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
    groups: [],
    history: [{ elements: initialElements, selectedIds: [] }],
    historyIndex: 0,
    cursorPosition: null,
    multiDragOffsets: null,
    drawingStart: null,
    drawingEnd: null,

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

    addArrowAtCursor: (arrowType) => {
      const { cursorPosition } = get();
      const position = cursorPosition ?? { 
        x: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.width / 2,
        y: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.height / 2,
      };
      const arrow = createArrow(position, arrowType);
      get().addElement(arrow);
    },

    addZoneAtCursor: (shape = 'rect') => {
      const { cursorPosition } = get();
      const position = cursorPosition ?? { 
        x: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.width / 2 - 60,
        y: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.height / 2 - 40,
      };
      const zone = createZone(position, shape);
      get().addElement(zone);
    },

    moveElementById: (id, position) => {
      set((state) => ({
        elements: state.elements.map((el) =>
          el.id === id ? moveElement(el, position) : el
        ),
      }));
      // Don't push history on every move - only on drag end
    },

    resizeZone: (id, position, width, height) => {
      set((state) => ({
        elements: state.elements.map((el) => {
          if (el.id === id && el.type === 'zone') {
            return { ...el, position, width, height };
          }
          return el;
        }),
      }));
      get().pushHistory();
    },

    updateArrowEndpoint: (id, endpoint, position) => {
      set((state) => ({
        elements: state.elements.map((el) => {
          if (el.id === id && isArrowElement(el)) {
            if (endpoint === 'start') {
              return { ...el, startPoint: position };
            } else {
              return { ...el, endPoint: position };
            }
          }
          return el;
        }),
      }));
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
      // duplicateElements from core already adds offset (+12px)
      const duplicated = duplicateElements(selectedElements, { x: 12, y: 12 });
      
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

    nudgeSelected: (dx, dy) => {
      const { selectedIds } = get();
      if (selectedIds.length === 0) return;
      
      set((state) => ({
        elements: state.elements.map((el) => {
          if (selectedIds.includes(el.id)) {
            // Handle elements with position property
            if ('position' in el) {
              return {
                ...el,
                position: {
                  x: (el.position as Position).x + dx,
                  y: (el.position as Position).y + dy,
                },
              };
            }
            // Handle arrows (startPoint/endPoint)
            if (isArrowElement(el)) {
              return {
                ...el,
                startPoint: { x: el.startPoint.x + dx, y: el.startPoint.y + dy },
                endPoint: { x: el.endPoint.x + dx, y: el.endPoint.y + dy },
              };
            }
          }
          return el;
        }),
      }));
      get().pushHistory();
    },

    adjustSelectedStrokeWidth: (delta) => {
      const { selectedIds } = get();
      if (selectedIds.length === 0) return;
      
      set((state) => ({
        elements: state.elements.map((el) => {
          if (selectedIds.includes(el.id)) {
            // Arrows have strokeWidth
            if (isArrowElement(el)) {
              const current = el.strokeWidth ?? 3;
              const newWidth = Math.max(1, Math.min(10, current + delta));
              return { ...el, strokeWidth: newWidth };
            }
            // Zones have borderWidth for border stroke
            if (el.type === 'zone') {
              const zone = el as { borderWidth?: number };
              const current = zone.borderWidth ?? 2;
              const newWidth = Math.max(0, Math.min(8, current + delta));
              return { ...el, borderWidth: newWidth };
            }
          }
          return el;
        }),
      }));
      get().pushHistory();
    },

    cycleSelectedColor: (direction) => {
      const { selectedIds } = get();
      if (selectedIds.length === 0) return;
      
      const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7', '#f97316'];
      
      set((state) => ({
        elements: state.elements.map((el) => {
          if (selectedIds.includes(el.id)) {
            // Arrows have color
            if (isArrowElement(el)) {
              const current = el.color ?? '#ffffff';
              const currentIndex = COLORS.indexOf(current);
              const newIndex = currentIndex === -1 
                ? 0 
                : (currentIndex + direction + COLORS.length) % COLORS.length;
              return { ...el, color: COLORS[newIndex] };
            }
            // Zones have fillColor
            if (el.type === 'zone') {
              const zone = el as { fillColor?: string };
              const current = zone.fillColor ?? '#22c55e';
              const currentIndex = COLORS.indexOf(current);
              const newIndex = currentIndex === -1 
                ? 0 
                : (currentIndex + direction + COLORS.length) % COLORS.length;
              return { ...el, fillColor: COLORS[newIndex] };
            }
          }
          return el;
        }),
      }));
      get().pushHistory();
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
        
        // Get element position
        if ('position' in el) {
          x = (el.position as Position).x;
          y = (el.position as Position).y;
        } else if (isArrowElement(el)) {
          // For arrows, check if either endpoint is in rect
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
        
        // Check if element center is in selection rect
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          inRect.push(el.id);
        }
      }
      
      set({ selectedIds: inRect });
    },

    setCursorPosition: (position) => {
      set({ cursorPosition: position });
    },

    // Drawing actions for click-drag creation
    startDrawing: (position) => {
      set({ drawingStart: position, drawingEnd: position });
    },

    updateDrawing: (position) => {
      set({ drawingEnd: position });
    },

    finishArrowDrawing: (arrowType) => {
      const { drawingStart, drawingEnd } = get();
      if (!drawingStart || !drawingEnd) return;
      
      // Create arrow from start to end
      const arrow = {
        ...createArrow(drawingStart, arrowType),
        startPoint: drawingStart,
        endPoint: drawingEnd,
      };
      
      set((state) => ({
        elements: [...state.elements, arrow],
        selectedIds: [arrow.id],
        drawingStart: null,
        drawingEnd: null,
      }));
      get().pushHistory();
    },

    finishZoneDrawing: (shape) => {
      const { drawingStart, drawingEnd } = get();
      if (!drawingStart || !drawingEnd) return;
      
      // Calculate zone bounds from start/end
      const x = Math.min(drawingStart.x, drawingEnd.x);
      const y = Math.min(drawingStart.y, drawingEnd.y);
      const width = Math.abs(drawingEnd.x - drawingStart.x);
      const height = Math.abs(drawingEnd.y - drawingStart.y);
      
      // Minimum size check
      if (width < 20 || height < 20) {
        set({ drawingStart: null, drawingEnd: null });
        return;
      }
      
      const zone = {
        ...createZone({ x, y }, shape),
        width,
        height,
      };
      
      set((state) => ({
        elements: [...state.elements, zone],
        selectedIds: [zone.id],
        drawingStart: null,
        drawingEnd: null,
      }));
      get().pushHistory();
    },

    cancelDrawing: () => {
      set({ drawingStart: null, drawingEnd: null });
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

    // Group actions
    createGroup: () => {
      const { selectedIds, groups } = get();
      if (selectedIds.length < 2) return; // Need at least 2 elements to group

      const groupNumber = groups.length + 1;
      const newGroup: Group = {
        id: `group-${Date.now()}`,
        name: `Group ${groupNumber}`,
        memberIds: [...selectedIds],
        locked: false,
        visible: true,
      };

      set((state) => ({
        groups: [...state.groups, newGroup],
      }));
    },

    ungroupSelection: () => {
      const { selectedIds, groups } = get();
      if (selectedIds.length === 0) return;

      // Find groups that contain any of the selected elements
      const groupsToRemove = groups.filter((g) =>
        g.memberIds.some((id) => selectedIds.includes(id))
      );

      if (groupsToRemove.length === 0) return;

      set((state) => ({
        groups: state.groups.filter((g) => !groupsToRemove.includes(g)),
      }));
    },

    selectGroup: (groupId) => {
      const { groups } = get();
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      set({ selectedIds: [...group.memberIds] });
    },

    getGroups: () => get().groups,

    toggleGroupLock: (groupId) => {
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, locked: !g.locked } : g
        ),
      }));
    },

    toggleGroupVisibility: (groupId) => {
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, visible: !g.visible } : g
        ),
      }));
    },

    renameGroup: (groupId, name) => {
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, name } : g
        ),
      }));
    },
  };
});
