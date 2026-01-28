/**
 * useBoardPageEffects - Animation, interpolation, and event handling hooks
 * Extracted from App.tsx for modularity
 */

import { useCallback } from 'react';
import type Konva from 'konva';
import type { Position, BoardElement } from '@tmc/core';
import { useBoardStore } from '../../store';
import { useAnimationPlayback as useAnimationPlaybackCore } from '../../hooks/useAnimationPlayback';
import { useAnimationInterpolation } from '../../hooks/useAnimationInterpolation';

// Animation playback hook (wrapper for backward compatibility)
export interface AnimationPlaybackInput {
  isPlaying: boolean;
  isLooping: boolean;
  stepDuration: number;
  stepsCount: number;
  pause: () => void;
  goToStep: (index: number) => void;
  nextStep: () => void;
  setAnimationProgress: (progress: number) => void;
}

export function useAnimationPlayback(input: AnimationPlaybackInput) {
  const { isPlaying, isLooping, stepDuration, pause, goToStep, nextStep, setAnimationProgress } = input;

  // Use the core hook with getters pattern to avoid stale closures
  useAnimationPlaybackCore({
    isPlaying,
    isLooping,
    stepDurationSec: stepDuration,
    getCurrentStepIndex: () => useBoardStore.getState().currentStepIndex,
    getStepsCount: () => useBoardStore.getState().document.steps.length,
    onSetProgress: setAnimationProgress,
    onNextStep: nextStep,
    onGoToStep: goToStep,
    onPause: pause,
  });
}

// Re-export interpolation hook for backward compatibility
export { useAnimationInterpolation as useInterpolation };

// Stage event handlers hook
export interface StageEventHandlersInput {
  drawingController: {
    handleDrawingMouseDown: (pos: Position) => boolean;
    handleDrawingMouseMove: (pos: Position) => void;
    handleDrawingMouseUp: () => boolean;
  };
  canvasEventsController: {
    handleStageMouseDown: (pos: Position, clickedOnInteractive: boolean) => void;
    handleStageMouseMove: (pos: Position) => void;
    handleStageMouseUp: () => void;
  };
  activeTool: string | null;
  clearSelection: () => void;
  marqueeStart: Position | null;
}

export function useStageEventHandlers(input: StageEventHandlersInput) {
  const { drawingController, canvasEventsController, activeTool, clearSelection, marqueeStart } = input;

  const handleStageMouseDown = useCallback(
    (e: any) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      
      const handled = drawingController.handleDrawingMouseDown(pos);
      if (handled) return;
      
      const target = e.target;
      const isStage = target === stage;
      const isLayer = target.nodeType === 'Layer';
      const isPitchElement = target.name()?.startsWith('pitch') || !target.name();
      const isInteractive = target.id() && (
        target.id().startsWith('player-') ||
        target.id().startsWith('ball-') ||
        target.id().startsWith('arrow-') ||
        target.id().startsWith('zone-')
      );
      const clickedOnInteractive = isInteractive || !(isStage || isLayer || isPitchElement);
      
      canvasEventsController.handleStageMouseDown(pos, clickedOnInteractive);
    },
    [drawingController, canvasEventsController]
  );

  const handleStageMouseMove = useCallback(
    (e: any) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      
      drawingController.handleDrawingMouseMove(pos);
      canvasEventsController.handleStageMouseMove(pos);
    },
    [drawingController, canvasEventsController]
  );

  const handleStageMouseUp = useCallback(
    () => {
      const handled = drawingController.handleDrawingMouseUp();
      if (handled) return;
      
      canvasEventsController.handleStageMouseUp();
    },
    [drawingController, canvasEventsController]
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool) return;
      if (e.evt.button === 2) return;
      
      const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const isMultiModifier = isMac ? e.evt.metaKey : e.evt.ctrlKey;
      if (isMultiModifier) return;
      
      const clickedOnEmpty = e.target === e.target.getStage() || 
                             e.target.name() === 'pitch-background';
      if (clickedOnEmpty && !marqueeStart) {
        clearSelection();
      }
    },
    [clearSelection, activeTool, marqueeStart]
  );

  return {
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    handleStageClick,
  };
}

// Context menu handler hook
export interface ContextMenuHandlerInput {
  elements: BoardElement[];
  selectedIds: string[];
  selectElement: (id: string, addToSelection: boolean) => void;
  clearSelection: () => void;
  showMenu: (x: number, y: number, elementId: string | null) => void;
}

export function useContextMenuHandler(input: ContextMenuHandlerInput) {
  const { elements, selectedIds, selectElement, clearSelection, showMenu } = input;

  return useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;

      const canvasRect = stage?.container().getBoundingClientRect();
      if (!canvasRect) return;
      
      const viewportX = pos.x + canvasRect.left;
      const viewportY = pos.y + canvasRect.top;

      const target = e.target;
      let elementId = '';
      let node: any = target;
      
      while (node && node !== stage) {
        const nodeId = node.id?.();
        if (nodeId && nodeId.length > 0) {
          elementId = nodeId;
          break;
        }
        node = node.parent;
      }
      
      const clickedElement = elements.find(el => el.id === elementId);
      
      const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const isMultiModifier = isMac ? e.evt.metaKey : e.evt.ctrlKey;

      if (clickedElement) {
        if (isMultiModifier) {
          if (selectedIds.includes(elementId)) {
            showMenu(viewportX, viewportY, elementId);
          } else {
            selectElement(elementId, true);
            showMenu(viewportX, viewportY, elementId);
          }
        } else {
          selectElement(elementId, false);
          showMenu(viewportX, viewportY, elementId);
        }
      } else {
        if (isMultiModifier) {
          clearSelection();
        }
        showMenu(viewportX, viewportY, null);
      }
    },
    [elements, selectedIds, selectElement, clearSelection, showMenu]
  );
}
