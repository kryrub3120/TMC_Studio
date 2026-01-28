/**
 * useAnimationInterpolation - Animation interpolation hook
 * 
 * Provides interpolation functions for animating elements between steps.
 * Handles position, zone, and arrow endpoint interpolation.
 */

import { useMemo, useCallback } from 'react';
import { hasPosition, isZoneElement, isArrowElement } from '@tmc/core';

/**
 * Options for animation interpolation
 */
export interface UseAnimationInterpolationOptions<TStepElements> {
  isPlaying: boolean;
  progress01: number; // 0..1
  currentStepIndex: number;
  steps: Array<{ elements: TStepElements }>;
}

/**
 * Result of animation interpolation
 */
export interface UseAnimationInterpolationResult {
  nextStepElements: any[] | null;

  getInterpolatedPosition: (elementId: string, currentPos: { x: number; y: number }) => { x: number; y: number };

  getInterpolatedZone: (
    elementId: string,
    currentPos: { x: number; y: number },
    currentWidth: number,
    currentHeight: number
  ) => { position: { x: number; y: number }; width: number; height: number };

  getInterpolatedArrowEndpoints: (
    elementId: string,
    currentStart: { x: number; y: number },
    currentEnd: { x: number; y: number }
  ) => { start: { x: number; y: number }; end: { x: number; y: number } };
}

/**
 * Hook for interpolating element positions during animation playback
 */
export function useAnimationInterpolation(
  opts: UseAnimationInterpolationOptions<any>
): UseAnimationInterpolationResult {
  const { isPlaying, progress01, currentStepIndex, steps } = opts;

  // Compute next step elements
  const nextStepElements = useMemo(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= steps.length) return null;
    return steps[nextIndex]?.elements ?? null;
  }, [currentStepIndex, steps]);

  // Interpolate position for position-based elements
  const getInterpolatedPosition = useCallback(
    (elementId: string, currentPos: { x: number; y: number }): { x: number; y: number } => {
      if (!isPlaying || progress01 === 0 || !nextStepElements) {
        return currentPos;
      }

      const nextEl = nextStepElements.find((e: any) => e.id === elementId);
      if (!nextEl || !hasPosition(nextEl)) {
        return currentPos;
      }

      const nextPos = nextEl.position;
      return {
        x: currentPos.x + (nextPos.x - currentPos.x) * progress01,
        y: currentPos.y + (nextPos.y - currentPos.y) * progress01,
      };
    },
    [isPlaying, progress01, nextStepElements]
  );

  // Interpolate zone (position + width + height)
  const getInterpolatedZone = useCallback(
    (
      elementId: string,
      currentPos: { x: number; y: number },
      currentWidth: number,
      currentHeight: number
    ): { position: { x: number; y: number }; width: number; height: number } => {
      if (!isPlaying || progress01 === 0 || !nextStepElements) {
        return { position: currentPos, width: currentWidth, height: currentHeight };
      }

      const nextEl = nextStepElements.find((e: any) => e.id === elementId);
      if (!nextEl || !isZoneElement(nextEl)) {
        return { position: currentPos, width: currentWidth, height: currentHeight };
      }

      return {
        position: {
          x: currentPos.x + (nextEl.position.x - currentPos.x) * progress01,
          y: currentPos.y + (nextEl.position.y - currentPos.y) * progress01,
        },
        width: currentWidth + (nextEl.width - currentWidth) * progress01,
        height: currentHeight + (nextEl.height - currentHeight) * progress01,
      };
    },
    [isPlaying, progress01, nextStepElements]
  );

  // Interpolate arrow endpoints (startPoint + endPoint)
  const getInterpolatedArrowEndpoints = useCallback(
    (
      elementId: string,
      currentStart: { x: number; y: number },
      currentEnd: { x: number; y: number }
    ): { start: { x: number; y: number }; end: { x: number; y: number } } => {
      if (!isPlaying || progress01 === 0 || !nextStepElements) {
        return { start: currentStart, end: currentEnd };
      }

      const nextEl = nextStepElements.find((e: any) => e.id === elementId);
      if (!nextEl || !isArrowElement(nextEl)) {
        return { start: currentStart, end: currentEnd };
      }

      return {
        start: {
          x: currentStart.x + (nextEl.startPoint.x - currentStart.x) * progress01,
          y: currentStart.y + (nextEl.startPoint.y - currentStart.y) * progress01,
        },
        end: {
          x: currentEnd.x + (nextEl.endPoint.x - currentEnd.x) * progress01,
          y: currentEnd.y + (nextEl.endPoint.y - currentEnd.y) * progress01,
        },
      };
    },
    [isPlaying, progress01, nextStepElements]
  );

  return {
    nextStepElements,
    getInterpolatedPosition,
    getInterpolatedZone,
    getInterpolatedArrowEndpoints,
  };
}
