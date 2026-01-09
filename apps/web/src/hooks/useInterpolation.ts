/**
 * useInterpolation - Element position interpolation during animation
 * 
 * Computes interpolated element positions based on animation progress.
 * Handles different element types (players, arrows, zones, etc.)
 */

import { useMemo } from 'react';
import type { Position, BoardElement } from '@tmc/core';
import { useBoardStore } from '../store';
import { useUIStore } from '../store/useUIStore';

/**
 * Linear interpolation between two numbers
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Linear interpolation between two positions
 */
function lerpPosition(a: Position, b: Position, t: number): Position {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  };
}

/**
 * Interpolate a single element based on animation progress
 */
function interpolateElement(
  from: BoardElement,
  to: BoardElement,
  progress: number
): BoardElement {
  // Handle position-based elements (player, ball, equipment, text)
  if ('position' in from && 'position' in to) {
    return {
      ...to,
      position: lerpPosition(
        from.position as Position,
        to.position as Position,
        progress
      ),
    };
  }
  
  // Handle arrows (startPoint + endPoint)
  if (from.type === 'arrow' && to.type === 'arrow') {
    return {
      ...to,
      startPoint: lerpPosition(from.startPoint, to.startPoint, progress),
      endPoint: lerpPosition(from.endPoint, to.endPoint, progress),
    };
  }
  
  // Handle zones (position + width + height)
  if (from.type === 'zone' && to.type === 'zone') {
    return {
      ...to,
      position: lerpPosition(from.position, to.position, progress),
      width: lerp(from.width, to.width, progress),
      height: lerp(from.height, to.height, progress),
    };
  }
  
  // Default: return target element (no interpolation)
  return to;
}

/**
 * Hook to get interpolated elements for current animation frame
 */
export function useInterpolatedElements(): BoardElement[] {
  const elements = useBoardStore((s) => s.elements);
  const currentStepIndex = useBoardStore((s) => s.currentStepIndex);
  const steps = useBoardStore((s) => s.document.steps);
  
  const isPlaying = useUIStore((s) => s.isPlaying);
  const animationProgress = useUIStore((s) => s.animationProgress);
  
  return useMemo(() => {
    // If not playing or no progress, return current elements
    if (!isPlaying || animationProgress === 0) {
      return elements;
    }
    
    // Get next step
    const nextStep = steps[currentStepIndex + 1];
    if (!nextStep) {
      return elements;
    }
    
    // Interpolate each element
    return elements.map((el) => {
      const nextEl = nextStep.elements.find((e) => e.id === el.id);
      if (!nextEl) return el;
      
      return interpolateElement(el, nextEl, animationProgress);
    });
  }, [elements, steps, currentStepIndex, isPlaying, animationProgress]);
}
