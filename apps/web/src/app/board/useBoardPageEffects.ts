/**
 * useBoardPageEffects - Animation, interpolation, and event handling hooks
 * Extracted from App.tsx for modularity
 */

import { useEffect, useCallback } from 'react';
import type Konva from 'konva';
import { hasPosition, isZoneElement, isArrowElement } from '@tmc/core';
import type { Position, BoardElement } from '@tmc/core';
import { useBoardStore } from '../../store';

// Animation playback hook
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
  const { isPlaying, isLooping, stepDuration, stepsCount, pause, goToStep, nextStep, setAnimationProgress } = input;

  useEffect(() => {
    if (!isPlaying) {
      setAnimationProgress(0);
      return;
    }
    
    if (stepsCount <= 1) {
      pause();
      return;
    }
    
    let startTime: number | null = null;
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const elapsed = timestamp - startTime;
      const durationMs = stepDuration * 1000;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Ease-in-out cubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      setAnimationProgress(eased);
      
      if (progress >= 1) {
        const current = useBoardStore.getState().currentStepIndex;
        const total = useBoardStore.getState().document.steps.length;
        
        if (current >= total - 1) {
          if (isLooping) {
            goToStep(0);
            startTime = null;
            setAnimationProgress(0);
            animationFrameId = requestAnimationFrame(animate);
          } else {
            pause();
            setAnimationProgress(0);
          }
        } else {
          nextStep();
          startTime = null;
          setAnimationProgress(0);
          animationFrameId = requestAnimationFrame(animate);
        }
      } else {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      setAnimationProgress(0);
    };
  }, [isPlaying, isLooping, stepDuration, stepsCount, pause, goToStep, nextStep, setAnimationProgress]);
}

// Interpolation helpers hook
export interface InterpolationInput {
  isPlaying: boolean;
  animationProgress: number;
  nextStepElements: BoardElement[] | null;
}

export function useInterpolation(input: InterpolationInput) {
  const { isPlaying, animationProgress, nextStepElements } = input;

  const getInterpolatedPosition = useCallback((elementId: string, currentPos: Position): Position => {
    if (!isPlaying || animationProgress === 0 || !nextStepElements) {
      return currentPos;
    }
    
    const nextEl = nextStepElements.find((e) => e.id === elementId);
    if (!nextEl || !hasPosition(nextEl)) {
      return currentPos;
    }
    
    const nextPos = nextEl.position;
    return {
      x: currentPos.x + (nextPos.x - currentPos.x) * animationProgress,
      y: currentPos.y + (nextPos.y - currentPos.y) * animationProgress,
    };
  }, [isPlaying, animationProgress, nextStepElements]);

  const getInterpolatedZone = useCallback((elementId: string, currentPos: Position, currentWidth: number, currentHeight: number): { position: Position; width: number; height: number } => {
    if (!isPlaying || animationProgress === 0 || !nextStepElements) {
      return { position: currentPos, width: currentWidth, height: currentHeight };
    }
    
    const nextEl = nextStepElements.find((e) => e.id === elementId);
    if (!nextEl || !isZoneElement(nextEl)) {
      return { position: currentPos, width: currentWidth, height: currentHeight };
    }
    
    return {
      position: {
        x: currentPos.x + (nextEl.position.x - currentPos.x) * animationProgress,
        y: currentPos.y + (nextEl.position.y - currentPos.y) * animationProgress,
      },
      width: currentWidth + (nextEl.width - currentWidth) * animationProgress,
      height: currentHeight + (nextEl.height - currentHeight) * animationProgress,
    };
  }, [isPlaying, animationProgress, nextStepElements]);

  const getInterpolatedArrowEndpoints = useCallback((elementId: string, currentStart: Position, currentEnd: Position): { start: Position; end: Position } => {
    if (!isPlaying || animationProgress === 0 || !nextStepElements) {
      return { start: currentStart, end: currentEnd };
    }
    
    const nextEl = nextStepElements.find((e) => e.id === elementId);
    if (!nextEl || !isArrowElement(nextEl)) {
      return { start: currentStart, end: currentEnd };
    }
    
    return {
      start: {
        x: currentStart.x + (nextEl.startPoint.x - currentStart.x) * animationProgress,
        y: currentStart.y + (nextEl.startPoint.y - currentStart.y) * animationProgress,
      },
      end: {
        x: currentEnd.x + (nextEl.endPoint.x - currentEnd.x) * animationProgress,
        y: currentEnd.y + (nextEl.endPoint.y - currentEnd.y) * animationProgress,
      },
    };
  }, [isPlaying, animationProgress, nextStepElements]);

  return {
    getInterpolatedPosition,
    getInterpolatedZone,
    getInterpolatedArrowEndpoints,
  };
}

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
