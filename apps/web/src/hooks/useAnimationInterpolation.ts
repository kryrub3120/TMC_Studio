/**
 * useAnimationInterpolation - Animation interpolation hook
 * 
 * Provides interpolation functions for animating elements between steps.
 * Handles position, zone, and arrow endpoint interpolation.
 */

import { useMemo, useCallback } from 'react';
import { hasPosition, isZoneElement, isArrowElement } from '@tmc/core';
import type { BoardElement } from '@tmc/core';

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

  /** Elements that exist only in the next step; drawn fading in during the transition. */
  appearingElements: BoardElement[];

  /** 1 for elements in both steps; fades out elements leaving and fades in elements arriving. */
  getFadeOpacity: (elementId: string) => number;

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

type Point = { x: number; y: number };

function lerpPoint(from: Point, to: Point, t: number): Point {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

function findNext(nextStepElements: unknown[] | null, elementId: string): unknown {
  return nextStepElements?.find((e) => (e as { id?: string }).id === elementId);
}

/**
 * Position of an element `progress01` of the way to its place in the next
 * step. An element missing from the next step (it disappears) or with no
 * position there stays where it is until the step changes.
 */
export function interpolatePosition(
  nextStepElements: unknown[] | null,
  elementId: string,
  currentPos: Point,
  progress01: number,
): Point {
  const nextEl = findNext(nextStepElements, elementId);
  if (!nextEl || !hasPosition(nextEl as never)) return currentPos;
  return lerpPoint(currentPos, (nextEl as { position: Point }).position, progress01);
}

/** Zone position and size `progress01` of the way to the next step. */
export function interpolateZone(
  nextStepElements: unknown[] | null,
  elementId: string,
  currentPos: Point,
  currentWidth: number,
  currentHeight: number,
  progress01: number,
): { position: Point; width: number; height: number } {
  const nextEl = findNext(nextStepElements, elementId);
  if (!nextEl || !isZoneElement(nextEl as never)) {
    return { position: currentPos, width: currentWidth, height: currentHeight };
  }
  const zone = nextEl as { position: Point; width: number; height: number };
  return {
    position: lerpPoint(currentPos, zone.position, progress01),
    width: currentWidth + (zone.width - currentWidth) * progress01,
    height: currentHeight + (zone.height - currentHeight) * progress01,
  };
}

/** Arrow endpoints `progress01` of the way to the next step. */
export function interpolateArrowEndpoints(
  nextStepElements: unknown[] | null,
  elementId: string,
  currentStart: Point,
  currentEnd: Point,
  progress01: number,
): { start: Point; end: Point } {
  const nextEl = findNext(nextStepElements, elementId);
  if (!nextEl || !isArrowElement(nextEl as never)) return { start: currentStart, end: currentEnd };
  const arrow = nextEl as { startPoint: Point; endPoint: Point };
  return {
    start: lerpPoint(currentStart, arrow.startPoint, progress01),
    end: lerpPoint(currentEnd, arrow.endPoint, progress01),
  };
}

/**
 * Opacity of an element during the transition to the next step: an element
 * missing from the next step fades out, one new in the next step fades in.
 */
export function transitionOpacity(
  elementId: string,
  currentIds: ReadonlySet<string>,
  nextIds: ReadonlySet<string> | null,
  progress01: number,
): number {
  if (!nextIds) return 1;
  if (!nextIds.has(elementId)) return 1 - progress01;
  if (!currentIds.has(elementId)) return progress01;
  return 1;
}

/** Elements of the next step that the current step does not have. */
export function arrivingElements<T extends { id: string }>(current: readonly T[], next: readonly T[] | null): T[] {
  if (!next) return [];
  const currentIds = new Set(current.map((e) => e.id));
  return next.filter((e) => !currentIds.has(e.id));
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

  const idle = !isPlaying || progress01 === 0 || !nextStepElements;

  const currentStepElements = steps[currentStepIndex]?.elements as Array<{ id: string }> | undefined;
  const currentIds = useMemo(
    () => new Set((currentStepElements ?? []).map((e) => e.id)),
    [currentStepElements]
  );
  const nextIds = useMemo(
    () => (nextStepElements ? new Set((nextStepElements as Array<{ id: string }>).map((e) => e.id)) : null),
    [nextStepElements]
  );

  const appearingElements = useMemo(
    (): BoardElement[] =>
      idle ? [] : (arrivingElements(currentStepElements ?? [], nextStepElements) as BoardElement[]),
    [idle, currentStepElements, nextStepElements]
  );

  const getFadeOpacity = useCallback(
    (elementId: string) => (idle ? 1 : transitionOpacity(elementId, currentIds, nextIds, progress01)),
    [idle, currentIds, nextIds, progress01]
  );

  const getInterpolatedPosition = useCallback(
    (elementId: string, currentPos: Point): Point =>
      idle ? currentPos : interpolatePosition(nextStepElements, elementId, currentPos, progress01),
    [idle, progress01, nextStepElements]
  );

  const getInterpolatedZone = useCallback(
    (elementId: string, currentPos: Point, currentWidth: number, currentHeight: number) =>
      idle
        ? { position: currentPos, width: currentWidth, height: currentHeight }
        : interpolateZone(nextStepElements, elementId, currentPos, currentWidth, currentHeight, progress01),
    [idle, progress01, nextStepElements]
  );

  const getInterpolatedArrowEndpoints = useCallback(
    (elementId: string, currentStart: Point, currentEnd: Point) =>
      idle
        ? { start: currentStart, end: currentEnd }
        : interpolateArrowEndpoints(nextStepElements, elementId, currentStart, currentEnd, progress01),
    [idle, progress01, nextStepElements]
  );

  return {
    nextStepElements,
    appearingElements,
    getFadeOpacity,
    getInterpolatedPosition,
    getInterpolatedZone,
    getInterpolatedArrowEndpoints,
  };
}
