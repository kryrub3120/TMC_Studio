import { describe, expect, it } from 'vitest';
import { resolveAuthEmailLocale } from '../authEmailLocale';

describe('resolveAuthEmailLocale', () => {
  it('prefers a supported language saved by the user', () => {
    expect(resolveAuthEmailLocale('pl', 'es-ES')).toBe('pl');
  });

  it('falls back to the supported browser language', () => {
    expect(resolveAuthEmailLocale(null, 'es-MX')).toBe('es');
  });

  it('uses English for unsupported or missing languages', () => {
    expect(resolveAuthEmailLocale('de', 'fr-FR')).toBe('en');
    expect(resolveAuthEmailLocale()).toBe('en');
  });
});
