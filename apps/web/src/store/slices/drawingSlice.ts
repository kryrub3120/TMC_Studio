/**
 * Drawing Slice - Temporary UI state for drawing operations
 */

import type { StateCreator } from 'zustand';
import type { Position, ElementId, ArrowType, ZoneShape, DrawingType, BoardElement } from '@tmc/core';
import { createArrow, createZone, createPolygonZone, isArrowElement } from '@tmc/core';
import type { AppState } from '../types';

export interface DrawingSlice {
  // Drawing state (for click-drag creation of arrows/zones)
  drawingStart: Position | null;
  drawingEnd: Position | null;
  
  // Freehand drawing state
  freehandPoints: number[] | null;
  freehandType: DrawingType | null;
  
  // Polygon zone drawing state (click-to-place vertices)
  /** Committed polygon vertices as flat absolute coords [x1,y1,...] */
  polygonPoints: number[] | null;
  /** Live cursor position for the rubber-band segment to the next vertex */
  polygonCursor: Position | null;
  
  // Multi-drag state
  multiDragOffsets: Map<ElementId, Position> | null;
  
  // PR-ARROW-NUMBER: One-shot auto-number flag for next arrow drawn via drag
  nextArrowShouldBeNumbered: boolean;
  
  // Click-drag drawing actions
  startDrawing: (position: Position) => void;
  updateDrawing: (position: Position) => void;
  finishArrowDrawing: (arrowType: ArrowType) => void;
  finishZoneDrawing: (shape: ZoneShape) => void;
  cancelDrawing: () => void;
  
  // PR-ARROW-NUMBER: Set one-shot auto-number flag
  setNextArrowShouldBeNumbered: (value: boolean) => void;
  
  // Freehand drawing actions
  startFreehandDrawing: (type: DrawingType, position: Position) => void;
  updateFreehandDrawing: (position: Position) => void;
  
  // Polygon zone drawing actions
  addPolygonPoint: (position: Position) => void;
  updatePolygonCursor: (position: Position) => void;
  finishPolygonDrawing: () => void;
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
  polygonPoints: null,
  polygonCursor: null,
  multiDragOffsets: null,
  nextArrowShouldBeNumbered: false,
  
  startDrawing: (position) => {
    set({ drawingStart: position, drawingEnd: position });
  },
  
  updateDrawing: (position) => {
    set({ drawingEnd: position });
  },
  
  finishArrowDrawing: (arrowType) => {
    const { drawingStart, drawingEnd, nextArrowShouldBeNumbered, elements, isAutoNumbering } = get();
    if (!drawingStart || !drawingEnd) return;
    
    // PR-ARROW-NUMBER: Discard threshold — ignore mini-arrows (taps/clicks)
    const dx = drawingEnd.x - drawingStart.x;
    const dy = drawingEnd.y - drawingStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 20) {
      set({ drawingStart: null, drawingEnd: null, nextArrowShouldBeNumbered: false });
      return;
    }
    
    const arrow = {
      ...createArrow(drawingStart, arrowType),
      startPoint: drawingStart,
      endPoint: drawingEnd,
    };
    
    // PR-ARROW-NUMBER: Auto-number if flag is set or global mode is on
    if (nextArrowShouldBeNumbered || isAutoNumbering) {
      const numbers = elements
        .filter(isArrowElement)
        .map((a: BoardElement) => (a as any).number)
        .filter((n): n is number => n != null);
      const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
      arrow.number = nextNumber;
      arrow.showNumber = true;
    }
    
    set((state) => ({
      elements: [...state.elements, arrow],
      selectedIds: [arrow.id],
      drawingStart: null,
      drawingEnd: null,
      nextArrowShouldBeNumbered: false,
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
    set({ drawingStart: null, drawingEnd: null, nextArrowShouldBeNumbered: false, polygonPoints: null, polygonCursor: null });
  },
  
  // PR-ARROW-NUMBER: Set one-shot auto-number flag
  setNextArrowShouldBeNumbered: (value) => {
    set({ nextArrowShouldBeNumbered: value });
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
  
  addPolygonPoint: (position) => {
    set((state) => ({
      polygonPoints: state.polygonPoints
        ? [...state.polygonPoints, position.x, position.y]
        : [position.x, position.y],
      polygonCursor: position,
    }));
  },
  
  updatePolygonCursor: (position) => {
    set({ polygonCursor: position });
  },
  
  finishPolygonDrawing: () => {
    const { polygonPoints } = get();
    if (!polygonPoints) return;
    let pts = polygonPoints.slice();
    // The finishing double-click fires TWO mousedown cycles, so it appends two
    // near-identical vertices. If the last two points sit on top of each other
    // (and we still have >=3 real vertices left), drop BOTH — the double-click
    // means "finish", not "add a vertex".
    if (pts.length >= 10) {
      const n = pts.length;
      const dx = pts[n - 2] - pts[n - 4];
      const dy = pts[n - 1] - pts[n - 3];
      if (Math.hypot(dx, dy) < 8) {
        pts = pts.slice(0, n - 4);
      }
    } else if (pts.length >= 4) {
      // Fallback: collapse a single trailing duplicate.
      const n = pts.length;
      const dx = pts[n - 2] - pts[n - 4];
      const dy = pts[n - 1] - pts[n - 3];
      if (Math.hypot(dx, dy) < 8) {
        pts = pts.slice(0, n - 2);
      }
    }
    // Need at least 3 distinct vertices to form a polygon.
    if (pts.length < 6) {
      set({ polygonPoints: null, polygonCursor: null });
      return;
    }
    const zone = createPolygonZone(pts);
    set((state) => ({
      elements: [...state.elements, zone],
      selectedIds: [zone.id],
      polygonPoints: null,
      polygonCursor: null,
    }));
    get().pushHistory();
  },
});
