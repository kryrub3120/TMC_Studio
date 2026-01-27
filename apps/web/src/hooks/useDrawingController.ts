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
  activeTool: ActiveTool;
  
  // Handlers for Stage events
  handleDrawingMouseDown: (pos: Position) => boolean;
  handleDrawingMouseMove: (pos: Position) => void;
  handleDrawingMouseUp: () => boolean;
  
  // Check if tool is drawing-related
  isDrawingTool: (tool: ActiveTool) => boolean;
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
           tool === 'zone' || 
           tool === 'zone-ellipse';
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
    
    // Arrow/zone tools
    if (activeTool === 'arrow-pass' || activeTool === 'arrow-run' || activeTool === 'zone' || activeTool === 'zone-ellipse') {
      startDrawing(pos);
      return true;
    }

    return false;
  }, [activeTool, startDrawing, startFreehandDrawing]);

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
    
    // If drawing arrow/zone, update the end position
    if (drawingStart) {
      updateDrawing(pos);
    }
  }, [drawingStart, updateDrawing, freehandPoints, activeTool, updateFreehandDrawing]);

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

  return {
    drawingStart,
    drawingEnd,
    freehandPoints,
    activeTool,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    isDrawingTool,
  };
}
