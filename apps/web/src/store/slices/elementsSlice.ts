/**
 * Elements Slice - CRUD operations for board elements
 */

import type { StateCreator } from 'zustand';
import type {
  BoardElement,
  Position,
  Team,
  ElementId,
  PlayerElement,
  ArrowType,
  ZoneShape,
  EquipmentType,
  EquipmentVariant,
} from '@tmc/core';
import {
  DEFAULT_PITCH_CONFIG,
  createPlayer,
  createBall,
  createArrow,
  createZone,
  createText,
  createEquipment,
  moveElement,
  duplicateElements,
  removeElementsByIds,
  filterElementsByIds,
  isPlayerElement,
  isArrowElement,
  isTextElement,
} from '@tmc/core';
import type { AppState } from '../types';

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

export interface ElementsSlice {
  // State
  elements: BoardElement[];
  
  // Core CRUD
  setElements: (elements: BoardElement[]) => void;
  addElement: (element: BoardElement) => void;
  
  // Convenience creators
  addPlayerAtCursor: (team: Team) => void;
  addBallAtCursor: () => void;
  addArrowAtCursor: (arrowType: ArrowType) => void;
  addZoneAtCursor: (shape?: ZoneShape) => void;
  addTextAtCursor: () => void;
  addEquipmentAtCursor: (equipmentType: EquipmentType, variant?: EquipmentVariant) => void;
  
  // Element updates
  updateTextContent: (id: ElementId, content: string) => void;
  updateTextProperties: (id: ElementId, updates: { fontSize?: number; bold?: boolean; italic?: boolean; fontFamily?: string; backgroundColor?: string }) => void;
  moveElementById: (id: ElementId, position: Position) => void;
  resizeZone: (id: ElementId, position: Position, width: number, height: number) => void;
  updateArrowEndpoint: (id: ElementId, endpoint: 'start' | 'end', position: Position) => void;
  
  // Batch operations on selected
  deleteSelected: () => void;
  duplicateSelected: () => void;
  updateSelectedElement: (updates: Partial<PlayerElement>) => void;
  nudgeSelected: (dx: number, dy: number) => void;
  
  // Property adjustments
  adjustSelectedStrokeWidth: (delta: number) => void;
  cycleSelectedColor: (direction: number) => void;
  cyclePlayerShape: () => void;
  cycleZoneShape: () => void;
  rotateSelected: (degrees: number) => void;
  
  // Freehand drawing
  finishFreehandDrawing: () => void;
  cancelFreehandDrawing: () => void;
  clearAllDrawings: () => void;
  
  // Formation
  applyFormation: (formationId: string, team: Team) => void;
}

export const createElementsSlice: StateCreator<
  AppState,
  [],
  [],
  ElementsSlice
> = (set, get) => ({
  elements: [],
  
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
  
  addTextAtCursor: () => {
    const { cursorPosition } = get();
    const position = cursorPosition ?? { 
      x: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.width / 2,
      y: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.height / 2,
    };
    const text = createText(position, 'Text');
    get().addElement(text);
  },
  
  addEquipmentAtCursor: (equipmentType, variant = 'standard') => {
    const { cursorPosition } = get();
    const position = cursorPosition ?? { 
      x: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.width / 2,
      y: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.height / 2,
    };
    const equipment = createEquipment(position, equipmentType, variant);
    get().addElement(equipment);
  },
  
  updateTextContent: (id, content) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (el.id === id && isTextElement(el)) {
          return { ...el, content };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  updateTextProperties: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (el.id === id && isTextElement(el)) {
          return { ...el, ...updates };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  moveElementById: (id, position) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? moveElement(el, position) : el
      ),
    }));
    // ⚠️ Don't push history on every move - only on drag end via endContinuous
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
    // ⚠️ Don't push history during drag - only on drag end
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
          if ('position' in el) {
            return {
              ...el,
              position: {
                x: (el.position as Position).x + dx,
                y: (el.position as Position).y + dy,
              },
            };
          }
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
          if (isArrowElement(el)) {
            const current = el.strokeWidth ?? 3;
            const newWidth = Math.max(1, Math.min(10, current + delta));
            return { ...el, strokeWidth: newWidth };
          }
          if (el.type === 'zone') {
            const zone = el as { borderWidth?: number };
            const current = zone.borderWidth ?? 2;
            const newWidth = Math.max(0, Math.min(8, current + delta));
            return { ...el, borderWidth: newWidth };
          }
          if (el.type === 'drawing') {
            const drawing = el as { strokeWidth?: number };
            const current = drawing.strokeWidth ?? 3;
            const newWidth = Math.max(1, Math.min(30, current + delta * 2));
            return { ...el, strokeWidth: newWidth };
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
    
    const COLORS = ['#ff0000', '#ff6b6b', '#00ff00', '#3b82f6', '#eab308', '#f97316', '#ffffff'];
    
    set((state) => ({
      elements: state.elements.map((el) => {
        if (selectedIds.includes(el.id)) {
          if (isArrowElement(el)) {
            const current = el.color ?? '#ffffff';
            const currentIndex = COLORS.indexOf(current);
            const newIndex = currentIndex === -1 
              ? 0 
              : (currentIndex + direction + COLORS.length) % COLORS.length;
            return { ...el, color: COLORS[newIndex] };
          }
          if (el.type === 'zone') {
            const zone = el as { fillColor?: string };
            const current = zone.fillColor ?? '#22c55e';
            const currentIndex = COLORS.indexOf(current);
            const newIndex = currentIndex === -1 
              ? 0 
              : (currentIndex + direction + COLORS.length) % COLORS.length;
            return { ...el, fillColor: COLORS[newIndex] };
          }
          if (el.type === 'drawing') {
            const drawing = el as { color?: string };
            const current = drawing.color ?? '#ff0000';
            const currentIndex = COLORS.indexOf(current);
            const newIndex = currentIndex === -1 
              ? 0 
              : (currentIndex + direction + COLORS.length) % COLORS.length;
            return { ...el, color: COLORS[newIndex] };
          }
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  cyclePlayerShape: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    
    const SHAPES: Array<'circle' | 'square' | 'triangle' | 'diamond'> = ['circle', 'square', 'triangle', 'diamond'];
    
    set((state) => ({
      elements: state.elements.map((el) => {
        if (selectedIds.includes(el.id) && isPlayerElement(el)) {
          const currentShape = el.shape || 'circle';
          const currentIndex = SHAPES.indexOf(currentShape);
          const newIndex = (currentIndex + 1) % SHAPES.length;
          return { ...el, shape: SHAPES[newIndex] };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  cycleZoneShape: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    
    const ZONE_SHAPES: Array<'rect' | 'ellipse'> = ['rect', 'ellipse'];
    
    set((state) => ({
      elements: state.elements.map((el) => {
        if (selectedIds.includes(el.id) && el.type === 'zone') {
          const zone = el as { shape?: 'rect' | 'ellipse' };
          const currentShape = zone.shape || 'rect';
          const currentIndex = ZONE_SHAPES.indexOf(currentShape);
          const newIndex = (currentIndex + 1) % ZONE_SHAPES.length;
          return { ...el, shape: ZONE_SHAPES[newIndex] };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  rotateSelected: (degrees) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    
    set((state) => ({
      elements: state.elements.map((el) => {
        if (selectedIds.includes(el.id) && el.type === 'equipment') {
          const equipment = el as { rotation?: number };
          const currentRotation = equipment.rotation ?? 0;
          const newRotation = ((currentRotation + degrees) % 360 + 360) % 360;
          return { ...el, rotation: newRotation };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  finishFreehandDrawing: () => {
    const { freehandPoints, freehandType } = get();
    if (!freehandPoints || freehandPoints.length < 4 || !freehandType) {
      set({ freehandPoints: null, freehandType: null });
      return;
    }
    
    const drawing = {
      id: `drawing-${Date.now()}`,
      type: 'drawing' as const,
      drawingType: freehandType,
      points: freehandPoints,
      color: freehandType === 'highlighter' ? '#ffff00' : '#ff0000',
      strokeWidth: freehandType === 'highlighter' ? 20 : 3,
      opacity: freehandType === 'highlighter' ? 0.4 : 1,
    };
    
    set((state) => ({
      elements: [...state.elements, drawing],
      selectedIds: [drawing.id],
      freehandPoints: null,
      freehandType: null,
    }));
    get().pushHistory();
  },
  
  cancelFreehandDrawing: () => {
    set({ freehandPoints: null, freehandType: null });
  },
  
  clearAllDrawings: () => {
    set((state) => ({
      elements: state.elements.filter((el) => el.type !== 'drawing'),
      selectedIds: state.selectedIds.filter((id) => 
        !state.elements.find((el) => el.id === id && el.type === 'drawing')
      ),
    }));
    get().pushHistory();
  },
  
  applyFormation: (formationId, team) => {
    const { getFormationById, getAbsolutePositions } = require('@tmc/presets');
    const formation = getFormationById(formationId);
    if (!formation) return;
    
    const { elements } = get();
    
    const positions = getAbsolutePositions(
      formation,
      DEFAULT_PITCH_CONFIG.width,
      DEFAULT_PITCH_CONFIG.height,
      DEFAULT_PITCH_CONFIG.padding,
      team === 'away'
    );
    
    const filteredElements = elements.filter(
      (el) => !isPlayerElement(el) || el.team !== team
    );
    
    const newPlayers = positions.map((pos: { x: number; y: number; number: number }) => 
      createPlayer({ x: pos.x, y: pos.y }, team, pos.number)
    );
    
    set({
      elements: [...filteredElements, ...newPlayers],
      selectedIds: newPlayers.map((p: BoardElement) => p.id),
    });
    
    get().pushHistory();
  },
});
