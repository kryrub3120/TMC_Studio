/**
 * Unit tests for the unified resize/color/alignment shortcut logic
 * introduced by the Label Editor Upgrade (tasks/LABEL_EDITOR_UPGRADE_2026-07-01.md).
 *
 * Mirrors elementsSlice.ts:
 *   - resizeSelected (per-type dispatch, now including arrow/drawing stroke width)
 *   - cycleSelectedColor (text branch — previously unreachable via Alt+Up/Down)
 *   - cycleTextAlign (new)
 *
 * Extracted as pure functions for testing, matching the existing convention
 * in arrowRenumber.test.ts / vision.logic.test.ts (no Zustand store needed).
 */

import { describe, it, expect } from 'vitest';

type TextAlign = 'left' | 'center' | 'right' | 'justify';

interface MinimalEl {
  id: string;
  type: string;
  radius?: number;
  scale?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  strokeWidth?: number;
  color?: string;
  fillColor?: string;
  backgroundColor?: string;
  textAlign?: TextAlign;
}

// ============================================================
// EXTRACTED LOGIC — mirrors elementsSlice.resizeSelected
// ============================================================
function resizeSelected(elements: MinimalEl[], selectedIds: string[], scaleFactor: number): MinimalEl[] {
  const clampedScale = Math.max(0.4, Math.min(2.5, scaleFactor));
  const resizable = new Set(selectedIds);

  return elements.map((el) => {
    if (!resizable.has(el.id)) return el;

    if (el.type === 'player' || el.type === 'ball') {
      const defaultRadius = el.type === 'ball' ? 8 : 18;
      const currentRadius = el.radius ?? defaultRadius;
      return { ...el, radius: currentRadius * clampedScale };
    }
    if (el.type === 'equipment') {
      return { ...el, scale: (el.scale ?? 1) * clampedScale };
    }
    if (el.type === 'zone') {
      return {
        ...el,
        width: (el.width ?? 120) * clampedScale,
        height: (el.height ?? 80) * clampedScale,
      };
    }
    if (el.type === 'text') {
      const currentSize = el.fontSize ?? 18;
      return { ...el, fontSize: Math.round(currentSize * clampedScale) };
    }
    if (el.type === 'arrow') {
      const current = el.strokeWidth ?? 3;
      const delta = clampedScale >= 1 ? 1 : -1;
      return { ...el, strokeWidth: Math.max(1, Math.min(10, current + delta)) };
    }
    if (el.type === 'drawing') {
      const current = el.strokeWidth ?? 3;
      const delta = clampedScale >= 1 ? 2 : -2;
      return { ...el, strokeWidth: Math.max(1, Math.min(30, current + delta)) };
    }
    return el;
  });
}

// ============================================================
// EXTRACTED LOGIC — mirrors elementsSlice.cycleSelectedColor
// (text branch specifically — this was unreachable from the
// keyboard before the Alt+Up/Down fix in useKeyboardShortcuts.ts)
// ============================================================
const SHARED_COLORS = ['#000000', '#ff0000', '#ff6b6b', '#00ff00', '#3b82f6', '#eab308', '#f97316', '#ffffff'];

function cycleSelectedColor(elements: MinimalEl[], selectedIds: string[], direction: number): MinimalEl[] {
  return elements.map((el) => {
    if (!selectedIds.includes(el.id)) return el;
    if (el.type !== 'text') return el;
    const current = el.color ?? '#ffffff';
    const currentIndex = SHARED_COLORS.indexOf(current);
    const newIndex = currentIndex === -1
      ? 0
      : (currentIndex + direction + SHARED_COLORS.length) % SHARED_COLORS.length;
    return { ...el, color: SHARED_COLORS[newIndex] };
  });
}

// ============================================================
// EXTRACTED LOGIC — mirrors elementsSlice.cycleTextAlign
// ============================================================
const ALIGNS: TextAlign[] = ['left', 'center', 'right', 'justify'];

function cycleTextAlign(elements: MinimalEl[], selectedIds: string[], direction: number): MinimalEl[] {
  return elements.map((el) => {
    if (!selectedIds.includes(el.id) || el.type !== 'text') return el;
    const current = el.textAlign ?? 'left';
    const currentIndex = ALIGNS.indexOf(current);
    const newIndex = (currentIndex + direction + ALIGNS.length) % ALIGNS.length;
    return { ...el, textAlign: ALIGNS[newIndex] };
  });
}

describe('resizeSelected — unified Shift+"+/-" dispatch', () => {
  it('scales player radius', () => {
    const els: MinimalEl[] = [{ id: 'p1', type: 'player', radius: 18 }];
    const out = resizeSelected(els, ['p1'], 1.1);
    expect(out[0].radius).toBeCloseTo(19.8);
  });

  it('scales equipment via `scale`', () => {
    const els: MinimalEl[] = [{ id: 'e1', type: 'equipment', scale: 1 }];
    const out = resizeSelected(els, ['e1'], 1.1);
    expect(out[0].scale).toBeCloseTo(1.1);
  });

  it('scales zone width/height', () => {
    const els: MinimalEl[] = [{ id: 'z1', type: 'zone', width: 120, height: 80 }];
    const out = resizeSelected(els, ['z1'], 0.9);
    expect(out[0].width).toBeCloseTo(108);
    expect(out[0].height).toBeCloseTo(72);
  });

  it('scales text fontSize and rounds it', () => {
    const els: MinimalEl[] = [{ id: 't1', type: 'text', fontSize: 18 }];
    const out = resizeSelected(els, ['t1'], 1.1);
    expect(out[0].fontSize).toBe(20); // 18 * 1.1 = 19.8 -> rounds to 20
  });

  it('adjusts arrow strokeWidth by ±1 instead of scaling (no scale concept for arrows)', () => {
    const els: MinimalEl[] = [{ id: 'a1', type: 'arrow', strokeWidth: 3 }];
    expect(resizeSelected(els, ['a1'], 1.1)[0].strokeWidth).toBe(4);
    expect(resizeSelected(els, ['a1'], 0.9)[0].strokeWidth).toBe(2);
  });

  it('clamps arrow strokeWidth to 1-10', () => {
    const thin: MinimalEl[] = [{ id: 'a1', type: 'arrow', strokeWidth: 1 }];
    expect(resizeSelected(thin, ['a1'], 0.9)[0].strokeWidth).toBe(1);
    const thick: MinimalEl[] = [{ id: 'a1', type: 'arrow', strokeWidth: 10 }];
    expect(resizeSelected(thick, ['a1'], 1.1)[0].strokeWidth).toBe(10);
  });

  it('adjusts drawing strokeWidth by ±2, clamped 1-30', () => {
    const els: MinimalEl[] = [{ id: 'd1', type: 'drawing', strokeWidth: 3 }];
    expect(resizeSelected(els, ['d1'], 1.1)[0].strokeWidth).toBe(5);
    const atMax: MinimalEl[] = [{ id: 'd1', type: 'drawing', strokeWidth: 30 }];
    expect(resizeSelected(atMax, ['d1'], 1.1)[0].strokeWidth).toBe(30);
  });

  it('does not touch unselected elements', () => {
    const els: MinimalEl[] = [
      { id: 'p1', type: 'player', radius: 18 },
      { id: 'p2', type: 'player', radius: 18 },
    ];
    const out = resizeSelected(els, ['p1'], 1.1);
    expect(out[1].radius).toBe(18);
  });
});

describe('cycleSelectedColor — text branch (regression: was unreachable via Alt+Up/Down)', () => {
  it('cycles text ink color forward through SHARED_COLORS', () => {
    const els: MinimalEl[] = [{ id: 't1', type: 'text', color: '#000000' }];
    const out = cycleSelectedColor(els, ['t1'], 1);
    expect(out[0].color).toBe('#ff0000');
  });

  it('cycles text ink color backward and wraps around', () => {
    const els: MinimalEl[] = [{ id: 't1', type: 'text', color: '#000000' }];
    const out = cycleSelectedColor(els, ['t1'], -1);
    expect(out[0].color).toBe('#ffffff'); // wraps to last entry
  });

  it('falls back to index 0 when current color is not in the shared palette', () => {
    const els: MinimalEl[] = [{ id: 't1', type: 'text', color: '#123456' }];
    const out = cycleSelectedColor(els, ['t1'], 1);
    expect(out[0].color).toBe('#000000');
  });
});

describe('cycleTextAlign — new Alt+←/→ behavior', () => {
  it('cycles left -> center -> right -> justify -> left', () => {
    let els: MinimalEl[] = [{ id: 't1', type: 'text', textAlign: 'left' }];
    els = cycleTextAlign(els, ['t1'], 1);
    expect(els[0].textAlign).toBe('center');
    els = cycleTextAlign(els, ['t1'], 1);
    expect(els[0].textAlign).toBe('right');
    els = cycleTextAlign(els, ['t1'], 1);
    expect(els[0].textAlign).toBe('justify');
    els = cycleTextAlign(els, ['t1'], 1);
    expect(els[0].textAlign).toBe('left');
  });

  it('cycles backward from the implicit default (undefined -> left)', () => {
    const els: MinimalEl[] = [{ id: 't1', type: 'text' }];
    const out = cycleTextAlign(els, ['t1'], -1);
    expect(out[0].textAlign).toBe('justify');
  });
});
