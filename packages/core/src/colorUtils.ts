/**
 * Color contrast utilities
 * Used to ensure jersey numbers/labels stay readable against any team color.
 */

/** Parse a hex color (#rgb or #rrggbb) into 0-255 RGB components */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  const num = parseInt(h, 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

/** Relative luminance per WCAG 2.0 (0 = black, 1 = white) */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** WCAG contrast ratio between two colors (1 = no contrast, 21 = max) */
export function getContrastRatio(hexA: string, hexB: string): number {
  const lA = getRelativeLuminance(hexA);
  const lB = getRelativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Best black/white text color for a given background, by luminance */
export function getReadableTextColor(backgroundHex: string): '#000000' | '#ffffff' {
  return getRelativeLuminance(backgroundHex) > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Resolve the color to use for jersey numbers/text.
 * Keeps the preferred color (e.g. team secondaryColor) if it has enough
 * contrast against the background; otherwise falls back to auto black/white.
 */
export function resolveReadableTextColor(
  backgroundHex: string,
  preferredHex: string | undefined,
  minContrast = 2.5
): string {
  if (preferredHex && getContrastRatio(backgroundHex, preferredHex) >= minContrast) {
    return preferredHex;
  }
  return getReadableTextColor(backgroundHex);
}
