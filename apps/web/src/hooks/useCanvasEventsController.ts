/**
 * PR-REFACTOR-7: Canvas Events Controller Hook
 * 
 * Manages all canvas interaction events:
 * - Multi-drag for moving multiple selected elements
 * - Marquee selection (drag-to-select rectangle)
 * - Stage mouse event orchestration
 * - Element selection and drag handlers
 * 
 * This is the LARGEST extraction (~200 lines from App.tsx)
 * Coordinates between drawing tools, selection, and element manipulation
 * 
 * Extracts ~180-200 lines from App.tsx
 * 
 * @see docs/REFACTOR_ROADMAP.md - PR-REFACTOR-1
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Position, BoardElement } from '@tmc/core';
import { isArrowElement, hasPosition } from '@tmc/core';
import type { ActiveTool } from '../store/useUIStore';
import { useCommandRegistry } from './useCommandRegistry';

interface UseCanvasEventsOptions {
  // Dependencies from stores
  elements: BoardElement[];
  selectedIds: string[];
  activeTool: ActiveTool;
  isPlaying: boolean;
  
  // Store actions (non-selection, non-move, non-history)
  // ✅ PR1: selectElement, selectElementsInRect via cmdRegistry
  // ✅ PR2: moveElementById, pushHistory via cmdRegistry
  clearSelection: () => void;
  updateArrowEndpoint: (id: string, endpoint: 'start' | 'end', position: Position) => void;
  
  // Stage ref for boundary calculations
  stageRef: React.RefObject<any>;
}

interface CanvasEventsController {
  // Marquee selection state
  marqueeStart: Position | null;
  marqueeEnd: Position | null;
  isMultiDragging: boolean;
  
  // Handlers for multi-drag
  startMultiDrag: (draggedId: string, mouseX: number, mouseY: number) => boolean;
  
  // Handlers for element interactions (to pass to nodes)
  handleElementSelect: (id: string, addToSelection: boolean) => void;
  handleElementDragEnd: (id: string, position: Position) => void;
  
  // Stage event handlers
  handleStageMouseDown: (pos: Position, clickedOnInteractive: boolean) => void;
  handleStageMouseMove: (pos: Position) => void;
  handleStageMouseUp: () => void;
}

/**
 * Canvas events controller hook - All canvas interaction logic
 * 
 * Orchestrates:
 * - Multi-drag: Moving multiple selected elements together
 * - Marquee: Drag-to-select rectangle
 * - Element interactions: Select, drag, multi-select
 * 
 * @param options - Dependencies and callbacks from stores
 * @returns Controller with state and event handlers
 */
export function useCanvasEventsController(options: UseCanvasEventsOptions): CanvasEventsController {
  const {
    elements,
    selectedIds,
    activeTool,
    updateArrowEndpoint,
    stageRef,
  } = options;

  // ===== Command Registry (PR1 + PR2) =====
  const cmdRegistry = useCommandRegistry();

  // Marquee selection state
  const [marqueeStart, setMarqueeStart] = useState<Position | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<Position | null>(null);
  
  // Multi-drag state
  const multiDragRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    elementOffsets: Map<string, { x: number; y: number; isArrow?: boolean; startPoint?: Position; endPoint?: Position }>;
  } | null>(null);
  const [isMultiDragging, setIsMultiDragging] = useState(false);

  /**
   * Start multi-drag when dragging a selected element that's part of multi-selection
   * Returns true if multi-drag started, false otherwise
   */
  const startMultiDrag = useCallback((draggedId: string, mouseX: number, mouseY: number): boolean => {
    if (selectedIds.length <= 1) return false;
    if (!selectedIds.includes(draggedId)) return false;

    const offsets = new Map<string, { x: number; y: number; isArrow?: boolean; startPoint?: Position; endPoint?: Position }>();

    for (const id of selectedIds) {
      const el = elements.find((e) => e.id === id);
      if (!el) continue;

      if (isArrowElement(el)) {
        offsets.set(id, {
          x: 0,
          y: 0,
          isArrow: true,
          startPoint: { ...el.startPoint },
          endPoint: { ...el.endPoint },
        });
      } else if (hasPosition(el)) {
        offsets.set(id, {
          x: el.position.x,
          y: el.position.y,
        });
      }
    }

    multiDragRef.current = {
      startMouseX: mouseX,
      startMouseY: mouseY,
      elementOffsets: offsets,
    };
    setIsMultiDragging(true);
    return true;
  }, [selectedIds, elements]);

  /**
   * Multi-drag window event handlers
   * Handles mouse move and mouse up during multi-drag
   * 
   * ✅ PR2: Intent/Effect separation
   * - handleMouseMove: moveElementLive (Intent - high frequency, no history)
   * - handleMouseUp: commitUserAction (Effect - ONLY on pointer up)
   */
  useEffect(() => {
    if (!isMultiDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!multiDragRef.current) return;
      
      const stage = stageRef.current;
      if (!stage) return;
      
      const rect = stage.container().getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const dx = mouseX - multiDragRef.current.startMouseX;
      const dy = mouseY - multiDragRef.current.startMouseY;
      
      // Update all selected elements
      // ✅ INTENT: moveElementLive - no history commits during drag
      multiDragRef.current.elementOffsets.forEach((offset, id) => {
        if (offset.isArrow && offset.startPoint && offset.endPoint) {
          // For arrows, update both endpoints
          updateArrowEndpoint(id, 'start', {
            x: offset.startPoint.x + dx,
            y: offset.startPoint.y + dy,
          });
          updateArrowEndpoint(id, 'end', {
            x: offset.endPoint.x + dx,
            y: offset.endPoint.y + dy,
          });
        } else {
          // For position-based elements - INTENT (live update)
          cmdRegistry.board.canvas.moveElementLive(id, {
            x: offset.x + dx,
            y: offset.y + dy,
          });
        }
      });
    };

    const handleMouseUp = () => {
      setIsMultiDragging(false);
      multiDragRef.current = null;
      // ✅ EFFECT: commitUserAction - ONLY on pointer up
      cmdRegistry.board.history.commitUserAction();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMultiDragging, updateArrowEndpoint, stageRef, cmdRegistry]);

  /**
   * Handle element selection (from node click)
   * ✅ Uses cmd.board.selection instead of store action
   */
  const handleElementSelect = useCallback(
    (id: string, addToSelection: boolean) => {
      cmdRegistry.board.selection.select(id, addToSelection);
    },
    [cmdRegistry]
  );

  /**
   * Handle element drag end (from node drag)
   * 
   * ✅ PR2: Intent/Effect separation
   * - moveElementLive: Update final position (Intent)
   * - commitUserAction: Commit to history ONLY on dragEnd (Effect)
   */
  const handleElementDragEnd = useCallback(
    (id: string, position: Position) => {
      // INTENT: Final position update
      cmdRegistry.board.canvas.moveElementLive(id, position);
      // EFFECT: Commit to history (ONLY on dragEnd, not during drag)
      cmdRegistry.board.history.commitUserAction();
    },
    [cmdRegistry]
  );

  /**
   * Handle stage mouse down
   * Only handles marquee selection start (drawing is handled by drawingController)
   */
  const handleStageMouseDown = useCallback(
    (pos: Position, clickedOnInteractive: boolean) => {
      // Only start marquee if no tool active and clicked on empty space
      if (!activeTool && !clickedOnInteractive) {
        setMarqueeStart(pos);
        setMarqueeEnd(pos);
      }
    },
    [activeTool]
  );

  /**
   * Handle stage mouse move
   * Updates marquee selection rectangle
   */
  const handleStageMouseMove = useCallback(
    (pos: Position) => {
      // Update marquee selection
      if (marqueeStart) {
        setMarqueeEnd(pos);
      }
    },
    [marqueeStart]
  );

  /**
   * Handle stage mouse up
   * Finishes marquee selection
   * ✅ Uses cmd.board.selection.selectInRect instead of store action
   */
  const handleStageMouseUp = useCallback(
    () => {
      // Finish marquee selection
      if (marqueeStart && marqueeEnd) {
        cmdRegistry.board.selection.selectInRect(marqueeStart, marqueeEnd);
        setMarqueeStart(null);
        setMarqueeEnd(null);
      }
    },
    [marqueeStart, marqueeEnd, cmdRegistry]
  );

  return {
    marqueeStart,
    marqueeEnd,
    isMultiDragging,
    startMultiDrag,
    handleElementSelect,
    handleElementDragEnd,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
  };
}
