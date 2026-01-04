/**
 * Step management for animations in TMC Studio
 */

import { Step, BoardElement } from './types.js';
import { generateId } from './board.js';

/** Default step duration in milliseconds */
export const DEFAULT_STEP_DURATION = 1000;

/** Create a new step */
export function createStep(
  elements: BoardElement[],
  name?: string,
  duration: number = DEFAULT_STEP_DURATION
): Step {
  return {
    id: generateId(),
    name: name ?? `Step ${Date.now()}`,
    elements: structuredClone(elements),
    duration,
  };
}

/** Update step elements */
export function updateStepElements(step: Step, elements: BoardElement[]): Step {
  return {
    ...step,
    elements: structuredClone(elements),
  };
}

/** Update step name */
export function updateStepName(step: Step, name: string): Step {
  return {
    ...step,
    name,
  };
}

/** Update step duration */
export function updateStepDuration(step: Step, duration: number): Step {
  return {
    ...step,
    duration: Math.max(100, duration), // Minimum 100ms
  };
}

/** Duplicate a step */
export function duplicateStep(step: Step, nameSuffix: string = ' (copy)'): Step {
  return {
    ...step,
    id: generateId(),
    name: step.name + nameSuffix,
    elements: structuredClone(step.elements),
  };
}

/** Insert step at index */
export function insertStepAt(steps: Step[], step: Step, index: number): Step[] {
  const newSteps = [...steps];
  newSteps.splice(index, 0, step);
  return newSteps;
}

/** Remove step at index */
export function removeStepAt(steps: Step[], index: number): Step[] {
  if (index < 0 || index >= steps.length) return steps;
  const newSteps = [...steps];
  newSteps.splice(index, 1);
  return newSteps;
}

/** Move step from one index to another */
export function moveStep(steps: Step[], fromIndex: number, toIndex: number): Step[] {
  if (
    fromIndex < 0 ||
    fromIndex >= steps.length ||
    toIndex < 0 ||
    toIndex >= steps.length
  ) {
    return steps;
  }
  const newSteps = [...steps];
  const [removed] = newSteps.splice(fromIndex, 1);
  newSteps.splice(toIndex, 0, removed);
  return newSteps;
}

/** Get total duration of all steps */
export function getTotalDuration(steps: Step[]): number {
  return steps.reduce((total, step) => total + step.duration, 0);
}

/** Find step by ID */
export function findStepById(steps: Step[], id: string): Step | undefined {
  return steps.find((step) => step.id === id);
}

/** Get step index by ID */
export function findStepIndexById(steps: Step[], id: string): number {
  return steps.findIndex((step) => step.id === id);
}
