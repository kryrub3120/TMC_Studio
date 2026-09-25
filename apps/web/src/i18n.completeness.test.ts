/**
 * Every translation key must exist in English, Polish and Spanish with a
 * non-empty string (CLAUDE.md invariant 4). A missing key shows the raw key
 * or English text to Polish and Spanish users.
 */
import { describe, expect, it } from 'vitest';
import { en } from '../../../packages/ui/src/locales/en';
import { pl } from '../../../packages/ui/src/locales/pl';
import { es } from '../../../packages/ui/src/locales/es';

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else for (const [k, v] of leaves(value, path)) out.set(k, v);
  }
  return out;
}

const base = leaves(en as unknown as Tree);

describe.each([
  ['pl', pl],
  ['es', es],
])('%s translations', (_lang, locale) => {
  const translated = leaves(locale as unknown as Tree);

  it('have every English key', () => {
    expect([...base.keys()].filter((key) => !translated.has(key))).toEqual([]);
  });

  it('have no keys that English does not have', () => {
    expect([...translated.keys()].filter((key) => !base.has(key))).toEqual([]);
  });

  it('have no empty strings', () => {
    expect([...translated].filter(([, value]) => value.trim() === '').map(([key]) => key)).toEqual([]);
  });

  it('keep the same {{placeholders}}', () => {
    const vars = (text: string) => [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort().join(',');
    const mismatched = [...base]
      .filter(([key, value]) => translated.has(key) && vars(value) !== vars(translated.get(key)!))
      .map(([key]) => key);
    expect(mismatched).toEqual([]);
  });
});
