/**
 * Drawing Slice - Temporary UI state for drawing operations
 */

import type { StateCreator } from 'zustand';
import type { Position, ElementId, ArrowType, ZoneShape, DrawingType } from '@tmc/core';
import { createArrow, createZone } from '@tmc/core';
import type { AppState } from '../types';

export interface DrawingSlice {
  // Drawing state (for click-drag creation of arrows/zones)
  drawingStart: Position | null;
  drawingEnd: Position | null;
  
  // Freehand drawing state
  freehandPoints: number[] | null;
  freehandType: DrawingType | null;
  
  // Multi-drag state
  multiDragOffsets: Map<ElementId, Position> | null;
  
  // Click-drag drawing actions
  startDrawing: (position: Position) => void;
  updateDrawing: (position: Position) => void;
  finishArrowDrawing: (arrowType: ArrowType) => void;
  finishZoneDrawing: (shape: ZoneShape) => void;
  cancelDrawing: () => void;
  
  // Freehand drawing actions
  startFreehandDrawing: (type: DrawingType, position: Position) => void;
  updateFreehandDrawing: (position: Position) => void;
}

export const createDrawingSlice: StateCreator<
  AppState,
  [],
  [],
  DrawingSlice
> = (set, get) => ({
  drawingStart: null,
  drawingEnd: null,
  freehandPoints: null,
  freehandType: null,
  multiDragOffsets: null,
  
  startDrawing: (position) => {
    set({ drawingStart: position, drawingEnd: position });
  },
  
  updateDrawing: (position) => {
    set({ drawingEnd: position });
  },
  
  finishArrowDrawing: (arrowType) => {
    const { drawingStart, drawingEnd } = get();
    if (!drawingStart || !drawingEnd) return;
    
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
    
    const x = Math.min(drawingStart.x, drawingEnd.x);
    const y = Math.min(drawingStart.y, drawingEnd.y);
    const width = Math.abs(drawingEnd.x - drawingStart.x);
    const height = Math.abs(drawingEnd.y - drawingStart.y);
    
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
  
  startFreehandDrawing: (type, position) => {
    set({ 
      freehandType: type, 
      freehandPoints: [position.x, position.y],
    });
  },
  
  updateFreehandDrawing: (position) => {
    set((state) => ({
      freehandPoints: state.freehandPoints 
        ? [...state.freehandPoints, position.x, position.y]
        : null,
    }));
  },
});
