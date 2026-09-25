/**
 * Board document validation before a cloud save.
 *
 * Errors block the save: a document with them would not load back correctly
 * (no steps, elements without id/type, NaN coordinates that JSON turns into
 * null) or is unreasonably large. Warnings are suspicious but loadable, so
 * the save goes through and only monitoring hears about them.
 *
 * Messages carry paths only (`steps[2].elements[5].position.x`), never user
 * content, so they are safe to send to Sentry.
 */

import type { BoardElement } from './types.js';

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MAX_STEPS = 500;
const MAX_REPORTED_ISSUES = 20;

const ELEMENT_TYPES: ReadonlySet<string> = new Set<BoardElement['type']>([
  'player',
  'ball',
  'arrow',
  'zone',
  'text',
  'drawing',
  'equipment',
]);

export interface DocumentValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

type Issues = { errors: string[]; warnings: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function push(list: string[], message: string): void {
  if (list.length < MAX_REPORTED_ISSUES) list.push(message);
}

function checkPoint(value: unknown, path: string, issues: Issues): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    push(issues.errors, `${path} is not an object`);
    return;
  }
  for (const axis of ['x', 'y'] as const) {
    if (!Number.isFinite(value[axis])) push(issues.errors, `${path}.${axis} is not a finite number`);
  }
}

function checkFiniteNumbers(value: unknown, path: string, issues: Issues): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    push(issues.errors, `${path} is not an array`);
    return;
  }
  const bad = value.findIndex((n) => !Number.isFinite(n));
  if (bad !== -1) push(issues.errors, `${path}[${bad}] is not a finite number`);
}

function checkElement(element: unknown, path: string, seenIds: Set<string>, issues: Issues): void {
  if (!isRecord(element)) {
    push(issues.errors, `${path} is not an object`);
    return;
  }
  if (typeof element.id !== 'string' || element.id.length === 0) {
    push(issues.errors, `${path}.id is missing`);
  } else if (seenIds.has(element.id)) {
    push(issues.warnings, `${path}.id is duplicated in the step`);
  } else {
    seenIds.add(element.id);
  }

  if (typeof element.type !== 'string') {
    push(issues.errors, `${path}.type is missing`);
  } else if (!ELEMENT_TYPES.has(element.type)) {
    push(issues.warnings, `${path}.type "${element.type}" is unknown`);
  }

  checkPoint(element.position, `${path}.position`, issues);
  checkPoint(element.startPoint, `${path}.startPoint`, issues);
  checkPoint(element.endPoint, `${path}.endPoint`, issues);
  checkFiniteNumbers(element.points, `${path}.points`, issues);
  for (const size of ['width', 'height'] as const) {
    if (element[size] !== undefined && !Number.isFinite(element[size])) {
      push(issues.errors, `${path}.${size} is not a finite number`);
    }
  }
}

/** Validate a board document before it is written to the cloud. */
export function validateBoardDocument(doc: unknown): DocumentValidationResult {
  const issues: Issues = { errors: [], warnings: [] };

  if (!isRecord(doc)) {
    return { ok: false, errors: ['document is not an object'], warnings: [] };
  }

  if (typeof doc.version !== 'string' || doc.version.length === 0) push(issues.errors, 'version is missing');
  if (typeof doc.name !== 'string') push(issues.errors, 'name is not a string');
  if (!isRecord(doc.pitchConfig)) {
    push(issues.errors, 'pitchConfig is missing');
  } else if (!Number.isFinite(doc.pitchConfig.width) || !Number.isFinite(doc.pitchConfig.height)) {
    push(issues.errors, 'pitchConfig size is not finite');
  }

  if (!Array.isArray(doc.steps)) {
    push(issues.errors, 'steps is not an array');
  } else {
    if (doc.steps.length === 0) push(issues.errors, 'steps is empty');
    if (doc.steps.length > MAX_STEPS) push(issues.errors, `steps has more than ${MAX_STEPS} items`);

    const stepIds = new Set<string>();
    doc.steps.forEach((step, index) => {
      const path = `steps[${index}]`;
      if (!isRecord(step)) {
        push(issues.errors, `${path} is not an object`);
        return;
      }
      if (typeof step.id !== 'string' || step.id.length === 0) {
        push(issues.errors, `${path}.id is missing`);
      } else if (stepIds.has(step.id)) {
        push(issues.warnings, `${path}.id is duplicated`);
      } else {
        stepIds.add(step.id);
      }
      if (!Array.isArray(step.elements)) {
        push(issues.errors, `${path}.elements is not an array`);
        return;
      }
      const elementIds = new Set<string>();
      step.elements.forEach((element, elementIndex) =>
        checkElement(element, `${path}.elements[${elementIndex}]`, elementIds, issues),
      );
    });

    const index = doc.currentStepIndex;
    if (index !== undefined && (!Number.isInteger(index) || (index as number) < 0 || (index as number) >= doc.steps.length)) {
      push(issues.warnings, 'currentStepIndex is out of range');
    }
  }

  // Only measure size when the structure is sane; a cyclic object would throw.
  if (issues.errors.length === 0) {
    try {
      const bytes = new TextEncoder().encode(JSON.stringify(doc)).length;
      if (bytes > MAX_DOCUMENT_BYTES) push(issues.errors, `document is larger than ${MAX_DOCUMENT_BYTES} bytes`);
    } catch {
      push(issues.errors, 'document cannot be serialized to JSON');
    }
  }

  return { ok: issues.errors.length === 0, errors: issues.errors, warnings: issues.warnings };
}
