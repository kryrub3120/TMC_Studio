import { describe, expect, it } from 'vitest';
import { GROWTH_PAGE_PATHS, getGrowthPage } from '../growthContent';

describe('growth content', () => {
  it('contains 6 product pages and 6 real formation templates', () => {
    const pages = GROWTH_PAGE_PATHS.map((path) => getGrowthPage(path, 'en'));
    expect(pages.filter((page) => page.kind === 'product')).toHaveLength(6);
    expect(pages.filter((page) => page.kind === 'template')).toHaveLength(6);
    expect(new Set(pages.map((page) => page.formationId))).toEqual(
      new Set(['4-3-3', '4-4-2', '4-4-2-diamond', '4-2-3-1', '3-5-2', '5-3-2']),
    );
  });

  it('has complete and unique metadata in every language', () => {
    for (const language of ['en', 'pl', 'es'] as const) {
      const pages = GROWTH_PAGE_PATHS.map((path) => getGrowthPage(path, language));
      expect(new Set(pages.map((page) => page.metaTitle)).size).toBe(pages.length);
      expect(new Set(pages.map((page) => page.metaDescription)).size).toBe(pages.length);
      for (const page of pages) {
        expect(page.title.length).toBeGreaterThan(20);
        expect(page.metaDescription.length).toBeGreaterThan(80);
        expect(page.benefits).toHaveLength(3);
        expect(page.steps).toHaveLength(3);
        expect(page.relatedPaths).toHaveLength(3);
      }
    }
  });
});
