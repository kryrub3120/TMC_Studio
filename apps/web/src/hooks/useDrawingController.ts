/**
 * PR-REFACTOR-6: Drawing Controller Hook
 * 
 * Manages canvas drawing operations:
 * - Freehand drawing (pen/highlighter)
 * - Arrow drawing (pass/run)
 * - Zone drawing (rect/ellipse)
 * - Drawing state management
 * 
 * Extracts ~50-120 lines from App.tsx
 */

import { useCallback } from 'react';
import type { Position } from '@tmc/core';
import { useBoardStore } from '../store';
import { useUIStore, type ActiveTool } from '../store/useUIStore';

interface DrawingController {
  // State from stores
  drawingStart: Position | null;
  drawingEnd: Position | null;
  freehandPoints: number[] | null;
  polygonPoints: number[] | null;
  polygonCursor: Position | null;
  activeTool: ActiveTool;
  
  // Handlers for Stage events
  handleDrawingMouseDown: (pos: Position) => boolean;
  handleDrawingMouseMove: (pos: Position) => void;
  handleDrawingMouseUp: () => boolean;
  
  // Check if tool is drawing-related
  isDrawingTool: (tool: ActiveTool) => boolean;
  
  // Polygon zone: finish current polygon (called on stage double-click)
  finishPolygon: () => void;
}

/**
 * Drawing controller hook - Canvas drawing operations
 * 
 * Coordinates drawing tools (freehand, arrows, zones) with store actions.
 * Returns handlers that should be called from Stage event handlers.
 * 
 * @returns Controller with drawing state and handlers
 */
export function useDrawingController(): DrawingController {
  // Get drawing state from board store
  const drawingStart = useBoardStore((s) => s.drawingStart);
  const drawingEnd = useBoardStore((s) => s.drawingEnd);
  const freehandPoints = useBoardStore((s) => s.freehandPoints);
  
  // Get drawing actions from board store
  const startDrawing = useBoardStore((s) => s.startDrawing);
  const updateDrawing = useBoardStore((s) => s.updateDrawing);
  const finishArrowDrawing = useBoardStore((s) => s.finishArrowDrawing);
  const finishZoneDrawing = useBoardStore((s) => s.finishZoneDrawing);
  const startFreehandDrawing = useBoardStore((s) => s.startFreehandDrawing);
  const updateFreehandDrawing = useBoardStore((s) => s.updateFreehandDrawing);
  const finishFreehandDrawing = useBoardStore((s) => s.finishFreehandDrawing);
  const addPolygonPoint = useBoardStore((s) => s.addPolygonPoint);
  const updatePolygonCursor = useBoardStore((s) => s.updatePolygonCursor);
  const finishPolygonDrawing = useBoardStore((s) => s.finishPolygonDrawing);
  const polygonPoints = useBoardStore((s) => s.polygonPoints);
  const polygonCursor = useBoardStore((s) => s.polygonCursor);
  
  // Get active tool from UI store
  const activeTool = useUIStore((s) => s.activeTool);
  const clearActiveTool = useUIStore((s) => s.clearActiveTool);

  /**
   * Check if a tool is drawing-related
   */
  const isDrawingTool = useCallback((tool: ActiveTool): boolean => {
    return tool === 'drawing' || 
           tool === 'highlighter' || 
           tool === 'arrow-pass' || 
           tool === 'arrow-run' || 
           tool === 'arrow-shoot' ||
           tool === 'arrow-dribble' ||
           tool === 'zone' || 
           tool === 'zone-ellipse' ||
           tool === 'zone-polygon';
  }, []);

  /**
   * Handle mouse down for drawing
   * Returns true if event was handled (drawing started)
   */
  const handleDrawingMouseDown = useCallback((pos: Position): boolean => {
    if (!activeTool) return false;

    // Freehand drawing mode (pen/highlighter)
    if (activeTool === 'drawing' || activeTool === 'highlighter') {
      startFreehandDrawing(activeTool === 'highlighter' ? 'highlighter' : 'freehand', pos);
      return true;
    }
    
    // Polygon zone — each click places a vertex (handled here on mousedown).
    if (activeTool === 'zone-polygon') {
      addPolygonPoint(pos);
      return true;
    }

    // Arrow/zone tools
    if (activeTool === 'arrow-pass' || activeTool === 'arrow-run' || activeTool === 'arrow-shoot' || activeTool === 'arrow-dribble' || activeTool === 'zone' || activeTool === 'zone-ellipse') {
      startDrawing(pos);
      return true;
    }

    return false;
  }, [activeTool, startDrawing, startFreehandDrawing, addPolygonPoint]);

  /**
   * Handle mouse move for drawing
   * Updates drawing preview
   */
  const handleDrawingMouseMove = useCallback((pos: Position) => {
    // Freehand drawing - update points
    if (freehandPoints && (activeTool === 'drawing' || activeTool === 'highlighter')) {
      updateFreehandDrawing(pos);
      return;
    }
    
    // Polygon zone — track cursor for the rubber-band preview segment
    if (activeTool === 'zone-polygon' && polygonPoints) {
      updatePolygonCursor(pos);
      return;
    }
    
    // If drawing arrow/zone, update the end position
    if (drawingStart) {
      updateDrawing(pos);
    }
  }, [drawingStart, updateDrawing, freehandPoints, activeTool, updateFreehandDrawing, polygonPoints, updatePolygonCursor]);

  /**
   * Handle mouse up for drawing
   * Finishes drawing and clears active tool
   * Returns true if event was handled (drawing finished)
   */
  const handleDrawingMouseUp = useCallback((): boolean => {
    // Finish freehand drawing
    if (freehandPoints && (activeTool === 'drawing' || activeTool === 'highlighter')) {
      finishFreehandDrawing();
      clearActiveTool();
      return true;
    }
    
    // Polygon zone — consume the mouseup so it doesn't start marquee/selection.
    // The vertex was already placed on mousedown; finishing happens on double-click.
    if (activeTool === 'zone-polygon') {
      return true;
    }
    
    // Finish arrow/zone drawing
    if (drawingStart) {
      if (activeTool === 'arrow-pass') {
        finishArrowDrawing('pass');
        clearActiveTool();
        return true;
      } else if (activeTool === 'arrow-run') {
        finishArrowDrawing('run');
        clearActiveTool();
        return true;
      } else if (activeTool === 'arrow-shoot') {
        finishArrowDrawing('shoot');
        clearActiveTool();
        return true;
      } else if (activeTool === 'arrow-dribble') {
        finishArrowDrawing('dribble');
        clearActiveTool();
        return true;
      } else if (activeTool === 'zone') {
        finishZoneDrawing('rect');
        clearActiveTool();
        return true;
      } else if (activeTool === 'zone-ellipse') {
        finishZoneDrawing('ellipse');
        clearActiveTool();
        return true;
      }
    }

    return false;
  }, [activeTool, drawingStart, finishArrowDrawing, finishZoneDrawing, freehandPoints, finishFreehandDrawing, clearActiveTool]);

  const finishPolygon = useCallback(() => {
    if (activeTool !== 'zone-polygon') return;
    finishPolygonDrawing();
    clearActiveTool();
  }, [activeTool, finishPolygonDrawing, clearActiveTool]);

  return {
    drawingStart,
    drawingEnd,
    freehandPoints,
    polygonPoints,
    polygonCursor,
    activeTool,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    isDrawingTool,
    finishPolygon,
  };
}
