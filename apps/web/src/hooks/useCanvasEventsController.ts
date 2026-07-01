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
import { isArrowElement, hasPosition, snapToGrid, DEFAULT_PITCH_CONFIG } from '@tmc/core';
import type { ActiveTool } from '../store/useUIStore';
import { useUIStore } from '../store/useUIStore';
import { useBoardStore } from '../store';
import { useCommandRegistry } from './useCommandRegistry';

interface UseCanvasEventsOptions {
  // Dependencies from stores
  elements: BoardElement[];
  selectedIds: string[];
  activeTool: ActiveTool;
  isPlaying: boolean;
  isElementLocked?: (id: string) => boolean;
  
  // Store actions (non-selection, non-move, non-history)
  // ✅ PR1: selectElement, selectElementsInRect via cmdRegistry
  // ✅ PR2: moveElementById, pushHistory via cmdRegistry
  clearSelection: () => void;
  updateArrowEndpoint: (id: string, endpoint: 'start' | 'end' | 'control', position: Position) => void;
  
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
    isElementLocked = () => false,
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
    elementOffsets: Map<string, { x: number; y: number; isArrow?: boolean; startPoint?: Position; endPoint?: Position; controlPoint?: Position }>;
  } | null>(null);
  const [isMultiDragging, setIsMultiDragging] = useState(false);

  /**
   * Start multi-drag when dragging a selected element that's part of multi-selection
   * Returns true if multi-drag started, false otherwise
   */
  const startMultiDrag = useCallback((draggedId: string, mouseX: number, mouseY: number): boolean => {
    const selectedSet = new Set(selectedIds);
    const groups = useBoardStore.getState().groups;
    const draggedGroups = groups.filter((group) => group.memberIds.includes(draggedId));
    const groupMemberIds = draggedGroups.flatMap((group) => group.memberIds);
    const shouldDragSelected = selectedSet.size > 1 && selectedSet.has(draggedId);
    const shouldDragGroup = groupMemberIds.length > 1;

    if (!shouldDragSelected && !shouldDragGroup) return false;

    const dragIds = new Set<string>();
    if (shouldDragSelected) {
      selectedIds.forEach((id) => dragIds.add(id));
    }
    if (shouldDragGroup) {
      groupMemberIds.forEach((id) => dragIds.add(id));
    }
    if (dragIds.size <= 1) return false;

    const offsets = new Map<string, { x: number; y: number; isArrow?: boolean; startPoint?: Position; endPoint?: Position; controlPoint?: Position }>();

    for (const id of dragIds) {
      if (isElementLocked(id)) continue;
      const el = elements.find((e) => e.id === id);
      if (!el) continue;

      if (isArrowElement(el)) {
        offsets.set(id, {
          x: 0,
          y: 0,
          isArrow: true,
          startPoint: { ...el.startPoint },
          endPoint: { ...el.endPoint },
          controlPoint: el.curveControl ? { ...el.curveControl } : undefined,
        });
      } else if (hasPosition(el)) {
        offsets.set(id, {
          x: el.position.x,
          y: el.position.y,
        });
      }
    }

    if (offsets.size === 0) return false;

    multiDragRef.current = {
      startMouseX: mouseX,
      startMouseY: mouseY,
      elementOffsets: offsets,
    };
    setIsMultiDragging(true);
    return true;
  }, [selectedIds, elements, isElementLocked]);

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
      const snapEnabled = useUIStore.getState().snapEnabled !== false;
      const gridSize = useUIStore.getState().gridSize ?? DEFAULT_PITCH_CONFIG.gridSize;
      
      // Update all selected elements
      // ✅ INTENT: moveElementLive - no history commits during drag
      multiDragRef.current.elementOffsets.forEach((offset, id) => {
        if (offset.isArrow && offset.startPoint && offset.endPoint) {
          const oldCenter = {
            x: (offset.startPoint.x + offset.endPoint.x) / 2,
            y: (offset.startPoint.y + offset.endPoint.y) / 2,
          };
          const targetCenter = { x: oldCenter.x + dx, y: oldCenter.y + dy };
          const nextCenter = snapEnabled ? snapToGrid(targetCenter, gridSize) : targetCenter;
          const arrowDx = nextCenter.x - oldCenter.x;
          const arrowDy = nextCenter.y - oldCenter.y;

          // For arrows, update both endpoints
          updateArrowEndpoint(id, 'start', {
            x: offset.startPoint.x + arrowDx,
            y: offset.startPoint.y + arrowDy,
          });
          updateArrowEndpoint(id, 'end', {
            x: offset.endPoint.x + arrowDx,
            y: offset.endPoint.y + arrowDy,
          });
          if (offset.controlPoint) {
            updateArrowEndpoint(id, 'control', {
              x: offset.controlPoint.x + arrowDx,
              y: offset.controlPoint.y + arrowDy,
            });
          }
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
   * Updates marquee selection rectangle + tracks cursor position for element placement
   */
  const handleStageMouseMove = useCallback(
    (pos: Position) => {
      // Track cursor position so element placement (addPlayerAtCursor etc.) uses it
      useBoardStore.getState().setCursorPosition(pos);

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
