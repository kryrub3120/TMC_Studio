/**
 * useCanvasInteraction - Canvas event handling hook
 * 
 * Handles all canvas interactions and dispatches to CommandRegistry.
 * Manages drag state, selection, and multi-element interactions.
 */

import { useCallback, useRef } from 'react';
import { useBoardStore } from '../store';
import { cmd } from '../commands';

interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startPosition: { x: number; y: number } | null;
}

export function useCanvasInteraction() {
  const dragState = useRef<DragState>({
    isDragging: false,
    elementId: null,
    startPosition: null,
  });
  
  const selectedIds = useBoardStore((s) => s.selectedIds);
  const selectElement = useBoardStore((s) => s.selectElement);
  const clearSelection = useBoardStore((s) => s.clearSelection);
  
  /**
   * Handle element selection
   */
  const handleElementSelect = useCallback((elementId: string, addToSelection: boolean) => {
    selectElement(elementId, addToSelection);
  }, [selectElement]);
  
  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((elementId: string) => {
    // Start continuous mode for history batching
    cmd.intent.moveStart(selectedIds.includes(elementId) ? selectedIds : [elementId]);
    
    dragState.current = {
      isDragging: true,
      elementId,
      startPosition: null,
    };
    
    return true; // Allow drag
  }, [selectedIds]);
  
  /**
   * Handle element drag (continuous)
   */
  const handleElementDragEnd = useCallback((elementId: string, newPos: { x: number; y: number }) => {
    // Update position via intent command (no history)
    cmd.intent.moveDelta(elementId, newPos);
  }, []);
  
  /**
   * Handle drag end - commits history
   */
  const handleDragComplete = useCallback(() => {
    if (dragState.current.isDragging) {
      cmd.effect.moveEnd();
      dragState.current = {
        isDragging: false,
        elementId: null,
        startPosition: null,
      };
    }
  }, []);
  
  /**
   * Handle zone resize start
   */
  const handleResizeStart = useCallback((zoneId: string) => {
    cmd.intent.resizeStart(zoneId);
  }, []);
  
  /**
   * Handle zone resize (continuous)
   */
  const handleZoneResize = useCallback((
    zoneId: string,
    position: { x: number; y: number },
    width: number,
    height: number
  ) => {
    cmd.intent.resizeDelta(zoneId, position, width, height);
  }, []);
  
  /**
   * Handle resize end - commits history
   */
  const handleResizeEnd = useCallback(() => {
    cmd.effect.resizeEnd();
  }, []);
  
  /**
   * Handle arrow endpoint drag
   */
  const handleArrowEndpointDrag = useCallback((
    arrowId: string,
    endpoint: 'start' | 'end',
    position: { x: number; y: number }
  ) => {
    cmd.intent.arrowEndpointDelta(arrowId, endpoint, position);
  }, []);
  
  /**
   * Handle arrow endpoint drag end
   */
  const handleArrowEndpointEnd = useCallback(() => {
    cmd.effect.arrowEndpointEnd();
  }, []);
  
  /**
   * Handle stage click (background click)
   */
  const handleStageClick = useCallback((e: any) => {
    // Check if clicked on stage background (not on shape)
    if (e.target === e.target.getStage()) {
      clearSelection();
    }
  }, [clearSelection]);
  
  /**
   * Handle player number quick edit
   */
  const handlePlayerQuickEdit = useCallback((playerId: string) => {
    // This can trigger a modal or inline edit
    console.log('Quick edit player:', playerId);
    // TODO: Implement quick edit UI
  }, []);
  
  return {
    // Selection
    handleElementSelect,
    handleStageClick,
    
    // Drag operations
    handleDragStart,
    handleElementDragEnd,
    handleDragComplete,
    
    // Resize operations  
    handleResizeStart,
    handleZoneResize,
    handleResizeEnd,
    
    // Arrow operations
    handleArrowEndpointDrag,
    handleArrowEndpointEnd,
    
    // Player operations
    handlePlayerQuickEdit,
  };
}
