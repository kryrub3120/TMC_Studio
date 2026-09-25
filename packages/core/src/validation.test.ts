import { describe, expect, it } from 'vitest';
import { createDocument } from './serialization.js';
import { MAX_DOCUMENT_BYTES, validateBoardDocument } from './validation.js';
import type { BoardDocument } from './types.js';

function docWith(elements: unknown[], patch: Partial<BoardDocument> = {}): BoardDocument {
  const doc = createDocument('Test');
  return {
    ...doc,
    steps: [{ ...doc.steps[0], elements: elements as BoardDocument['steps'][0]['elements'] }],
    ...patch,
  };
}

const player = (id: string, x = 100, y = 100) => ({ id, type: 'player', position: { x, y }, team: 'home' });

describe('validateBoardDocument', () => {
  it('accepts a fresh document and a normal board', () => {
    expect(validateBoardDocument(createDocument('New'))).toEqual({ ok: true, errors: [], warnings: [] });
    expect(validateBoardDocument(docWith([player('p1'), player('p2')])).ok).toBe(true);
  });

  it('rejects non-objects and missing structure', () => {
    expect(validateBoardDocument(null).errors).toEqual(['document is not an object']);
    expect(validateBoardDocument(docWith([], { steps: [] })).errors).toContain('steps is empty');
    expect(validateBoardDocument({ ...createDocument(), steps: 'x' }).errors).toContain('steps is not an array');
    expect(validateBoardDocument({ ...createDocument(), pitchConfig: undefined }).errors).toContain('pitchConfig is missing');
  });

  it('rejects elements without id or type and steps without elements', () => {
    const result = validateBoardDocument(docWith([{ type: 'player', position: { x: 1, y: 1 } }, { id: 'b' }]));
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(['steps[0].elements[0].id is missing', 'steps[0].elements[1].type is missing']);

    const doc = createDocument();
    const broken = { ...doc, steps: [{ ...doc.steps[0], elements: null }] };
    expect(validateBoardDocument(broken).errors).toContain('steps[0].elements is not an array');
  });

  it('rejects NaN and Infinity coordinates, which JSON would turn into null', () => {
    const result = validateBoardDocument(docWith([
      player('p1', Number.NaN, 5),
      { id: 'a1', type: 'arrow', startPoint: { x: 0, y: 0 }, endPoint: { x: Infinity, y: 0 } },
      { id: 'd1', type: 'drawing', points: [0, 1, Number.NaN, 3] },
    ]));
    expect(result.errors).toEqual([
      'steps[0].elements[0].position.x is not a finite number',
      'steps[0].elements[1].endPoint.x is not a finite number',
      'steps[0].elements[2].points[2] is not a finite number',
    ]);
  });

  it('only warns about duplicated ids, unknown types and a bad step index', () => {
    const result = validateBoardDocument(docWith(
      [player('p1'), player('p1'), { id: 'x', type: 'hologram', position: { x: 0, y: 0 } }],
      { currentStepIndex: 7 },
    ));
    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual([
      'steps[0].elements[1].id is duplicated in the step',
      'steps[0].elements[2].type "hologram" is unknown',
      'currentStepIndex is out of range',
    ]);
  });

  it('rejects a document larger than the size limit', () => {
    const huge = docWith([], { description: 'x'.repeat(MAX_DOCUMENT_BYTES) });
    expect(validateBoardDocument(huge).errors).toEqual([`document is larger than ${MAX_DOCUMENT_BYTES} bytes`]);
  });

  it('never puts user content into messages', () => {
    const secret = 'Private drill notes';
    const result = validateBoardDocument(docWith([{ id: '', type: 'text', text: secret, position: { x: 0, y: Number.NaN } }], { name: secret }));
    expect(JSON.stringify(result)).not.toContain(secret);
  });
});
