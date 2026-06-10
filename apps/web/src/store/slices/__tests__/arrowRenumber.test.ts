/**
 * Unit tests for renumberAllArrows and deleteSelected with arrow renumbering
 * Sprint C — Numeracja strzałek bez dziur + jedno undo
 */

import { describe, it, expect } from 'vitest';
import type { BoardElement, ArrowElement } from '@tmc/core';

// ============================================================
// EXTRACTED LOGIC for pure unit testing (no Zustand store)
// These functions mirror the logic in elementsSlice.ts
// ============================================================

function renumberAllArrows(elements: BoardElement[]): BoardElement[] {
  // Assign sequential numbers 1..N in insertion order
  const numberMap = new Map<string, number>();
  elements.forEach((el) => {
    if (el.type === 'arrow' && (el as ArrowElement).showNumber) {
      numberMap.set(el.id, numberMap.size + 1);
    }
  });
  if (numberMap.size === 0) return elements;

  return elements.map((el) => {
    const newNum = numberMap.get(el.id);
    if (newNum !== undefined && el.type === 'arrow') {
      return { ...el, number: newNum };
    }
    return el;
  });
}

function deleteSelected(
  elements: BoardElement[],
  selectedIds: string[]
): { result: BoardElement[]; hadNumberedArrows: boolean } {
  const hadNumberedArrows = selectedIds.some((id) => {
    const el = elements.find((e) => e.id === id);
    return el && el.type === 'arrow' && (el as ArrowElement).showNumber;
  });

  const result = elements.filter((el) => !selectedIds.includes(el.id));

  // After removal, renumber if needed
  if (hadNumberedArrows) {
    return { result: renumberAllArrows(result), hadNumberedArrows: true };
  }
  return { result, hadNumberedArrows: false };
}

// ============================================================
// HELPERS
// ============================================================

function makeArrow(
  id: string,
  overrides: Partial<ArrowElement> = {}
): ArrowElement {
  return {
    id,
    type: 'arrow',
    arrowType: 'pass',
    startPoint: { x: 100, y: 200 },
    endPoint: { x: 300, y: 200 },
    color: '#1a1a1a',
    strokeWidth: 4,
    ...overrides,
  };
}

function makePlayer(id: string): BoardElement {
  return {
    id,
    type: 'player',
    position: { x: 100, y: 100 },
    team: 'home',
    number: 1,
    color: '#ef4444',
  } as BoardElement;
}

function makeBall(id: string): BoardElement {
  return {
    id,
    type: 'ball',
    position: { x: 200, y: 200 },
  } as BoardElement;
}

// ============================================================
// TESTS — renumberAllArrows
// ============================================================

describe('renumberAllArrows', () => {
  it('renumbers 3 numbered arrows sequentially 1,2,3', () => {
    const elements: BoardElement[] = [
      makeArrow('a1', { showNumber: true, number: 10 }),
      makeArrow('a2', { showNumber: true, number: 5 }),
      makeArrow('a3', { showNumber: true, number: 99 }),
    ];

    const result = renumberAllArrows(elements);

    const arrows = result.filter((e) => e.type === 'arrow') as ArrowElement[];
    expect(arrows[0].number).toBe(1);
    expect(arrows[1].number).toBe(2);
    expect(arrows[2].number).toBe(3);
  });

  it('ignores arrows with showNumber=false', () => {
    const elements: BoardElement[] = [
      makeArrow('a1', { showNumber: true, number: 7 }),
      makeArrow('a2', { showNumber: false, number: 3 }),
      makeArrow('a3', { showNumber: true, number: 1 }),
    ];

    const result = renumberAllArrows(elements);

    const a1 = result.find((e) => e.id === 'a1') as ArrowElement;
    const a2 = result.find((e) => e.id === 'a2') as ArrowElement;
    const a3 = result.find((e) => e.id === 'a3') as ArrowElement;

    expect(a1.number).toBe(1);
    expect(a2.number).toBe(3); // unchanged
    expect(a3.number).toBe(2);
  });

  it('handles empty array', () => {
    const result = renumberAllArrows([]);
    expect(result).toEqual([]);
  });

  it('does nothing when no arrows have showNumber', () => {
    const elements: BoardElement[] = [
      makeArrow('a1', { showNumber: false }),
      makePlayer('p1'),
      makeBall('b1'),
    ];

    const result = renumberAllArrows(elements);
    expect(result).toEqual(elements);
  });

  it('does not affect non-arrow elements', () => {
    const elements: BoardElement[] = [
      makeArrow('a1', { showNumber: true, number: 5 }),
      makePlayer('p1'),
      makeBall('b1'),
      makeArrow('a2', { showNumber: true, number: 3 }),
    ];

    const result = renumberAllArrows(elements);

    expect(result.find((e) => e.id === 'p1')).toBeDefined();
    expect(result.find((e) => e.id === 'b1')).toBeDefined();

    const arrows = result.filter((e) => e.type === 'arrow') as ArrowElement[];
    expect(arrows[0].number).toBe(1); // a1 was first
    expect(arrows[1].number).toBe(2); // a2 was second
  });
});

// ============================================================
// TESTS — deleteSelected + renumber integration
// ============================================================

describe('deleteSelected with renumber', () => {
  it('delete one numbered arrow renumbers remaining 2,1', () => {
    const elements: BoardElement[] = [
      makeArrow('a1', { showNumber: true, number: 1 }),
      makeArrow('a2', { showNumber: true, number: 2 }),
      makeArrow('a3', { showNumber: true, number: 3 }),
    ];

    const { result, hadNumberedArrows } = deleteSelected(elements, ['a2']);

    expect(hadNumberedArrows).toBe(true);
    const arrows = result.filter((e) => e.type === 'arrow') as ArrowElement[];
    expect(arrows).toHaveLength(2);
    expect(arrows[0].id).toBe('a1');
    expect(arrows[0].number).toBe(1);
    expect(arrows[1].id).toBe('a3');
    expect(arrows[1].number).toBe(2);
  });

  it('delete middle arrow from 5 renumbers remaining 1..4', () => {
    const elements: BoardElement[] = [
      makeArrow('a1', { showNumber: true, number: 1 }),
      makeArrow('a2', { showNumber: true, number: 2 }),
      makeArrow('a3', { showNumber: true, number: 3 }),
      makeArrow('a4', { showNumber: true, number: 4 }),
      makeArrow('a5', { showNumber: true, number: 5 }),
    ];

    const { result } = deleteSelected(elements, ['a3']);

    const arrows = result.filter((e) => e.type === 'arrow') as ArrowElement[];
    expect(arrows.map((a) => a.number)).toEqual([1, 2, 3, 4]);
  });

  it('delete first arrow renumbers remaining 1..N-1', () => {
    const elements: BoardElement[] = [
      makeArrow('a1', { showNumber: true, number: 1 }),
      makeArrow('a2', { showNumber: true, number: 2 }),
      makeArrow('a3', { showNumber: true, number: 3 }),
    ];

    const { result } = deleteSelected(elements, ['a1']);

    const arrows = result.filter((e) => e.type === 'arrow') as ArrowElement[];
    expect(arrows[0].number).toBe(1);
    expect(arrows[1].number).toBe(2);
  });

  it('delete last arrow renumbers remaining 1..N-1', () => {
    const elements: BoardElement[] = [
      makeArrow('a1', { showNumber: true, number: 1 }),
      makeArrow('a2', { showNumber: true, number: 2 }),
      makeArrow('a3', { showNumber: true, number: 3 }),
    ];

    const { result } = deleteSelected(elements, ['a3']);

    const arrows = result.filter((e) => e.type === 'arrow') as ArrowElement[];
    expect(arrows[0].number).toBe(1);
    expect(arrows[1].number).toBe(2);
  });

  it('delete multiple arrows renumbers remaining', () => {
    const elements: BoardElement[] = [
      makeArrow('a1', { showNumber: true, number: 1 }),
      makeArrow('a2', { showNumber: true, number: 2 }),
      makeArrow('a3', { showNumber: true, number: 3 }),
      makeArrow('a4', { showNumber: true, number: 4 }),
    ];

    const { result } = deleteSelected(elements, ['a2', 'a3']);

    const arrows = result.filter((e) => e.type === 'arrow') as ArrowElement[];
    expect(arrows).toHaveLength(2);
    expect(arrows[0].id).toBe('a1');
    expect(arrows[0].number).toBe(1);
    expect(arrows[1].id).toBe('a4');
    expect(arrows[1].number).toBe(2);
  });

  it('delete non-arrow elements does not trigger renumber', () => {
    const elements: BoardElement[] = [
      makeArrow('a1', { showNumber: true, number: 1 }),
      makePlayer('p1'),
      makeBall('b1'),
    ];

    const { hadNumberedArrows } = deleteSelected(elements, ['p1', 'b1']);
    expect(hadNumberedArrows).toBe(false);
  });

  it('delete non-numbered arrow does not trigger renumber', () => {
    const elements: BoardElement[] = [
      makeArrow('a1', { showNumber: true, number: 1 }),
      makeArrow('a2', { showNumber: false, number: 2 }),
    ];

    const { hadNumberedArrows } = deleteSelected(elements, ['a2']);
    expect(hadNumberedArrows).toBe(false);
  });

  it('mixed delete (arrow + non-arrow) triggers renumber if any arrow was numbered', () => {
    const elements: BoardElement[] = [
      makeArrow('a1', { showNumber: true, number: 1 }),
      makeArrow('a2', { showNumber: true, number: 2 }),
      makePlayer('p1'),
    ];

    const { result, hadNumberedArrows } = deleteSelected(elements, ['a1', 'p1']);
    expect(hadNumberedArrows).toBe(true);

    const arrows = result.filter((e) => e.type === 'arrow') as ArrowElement[];
    expect(arrows).toHaveLength(1);
    expect(arrows[0].id).toBe('a2');
    expect(arrows[0].number).toBe(1);
  });

  it('does not renumber when no arrows selected at all', () => {
    const elements: BoardElement[] = [
      makeArrow('a1', { showNumber: true, number: 1 }),
      makeArrow('a2', { showNumber: true, number: 2 }),
    ];

    const { hadNumberedArrows } = deleteSelected(elements, ['p1']);
    expect(hadNumberedArrows).toBe(false);
  });
});