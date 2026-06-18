/**
 * shortcutMap.test.ts — Detects duplicate keys and stale PPM/palette entries.
 */
import { describe, it, expect } from 'vitest';
import { SHORTCUT_MAP } from './shortcutMap';

describe('shortcutMap - no duplicate keys', () => {
  it('no duplicate (key, context) pairs', () => {
    const seen = new Map<string, string[]>();
    for (const entry of SHORTCUT_MAP) {
      const key = `${entry.key}:${entry.context}`;
      if (!seen.has(key)) {
        seen.set(key, [entry.id]);
      } else {
        seen.get(key)!.push(entry.id);
      }
    }
    const duplicates = [...seen.entries()].filter(([, ids]) => ids.length > 1);
    expect(duplicates).toEqual([]);
  });

  it('no duplicate ids', () => {
    const ids = SHORTCUT_MAP.map((e) => e.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });
});

describe('shortcutMap - no stale shortcuts referenced in PPM', () => {
  it('PPM keys exist in shortcutMap', () => {
    // ContextMenu uses shortcuts; check that known PPM-used keys are in the map.
    // This is a basic check — we verify `S`, `Shift+S`, `C`, etc. are defined.
    const ppmKeys = ['S', 'Shift+S', 'C', 'Del', 'B', 'A', 'R', 'D', 'Z', 'T', 'J', 'M', 'K', 'Y', 'Q', 'U', 'H', 'E', 'P', 'G', 'L', 'F', 'I', 'O', 'W', 'V'];
    const mapKeys = new Set(SHORTCUT_MAP.map((e) => e.key));
    for (const key of ppmKeys) {
      expect(mapKeys.has(key)).toBe(true);
    }
  });
});