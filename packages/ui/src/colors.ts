/**
 * Shared Color Palette
 * Single source of truth for all color pickers and cycles
 */

/** Shared color palette - used across all color pickers */
export const SHARED_COLORS = [
  '#000000', // black - NEW
  '#ff0000', // red
  '#ff6b6b', // light red
  '#00ff00', // green
  '#3b82f6', // blue
  '#eab308', // yellow
  '#f97316', // orange
  '#ffffff', // white
];

/**
 * Get colors for current mode
 * In print mode, white is filtered out from selectable colors
 */
export function getColorsForMode(isPrintMode: boolean): string[] {
  return isPrintMode 
    ? SHARED_COLORS.filter(c => c.toLowerCase() !== '#ffffff')
    : SHARED_COLORS;
}

/**
 * Sanitize white to black in print mode
 * This is render-time only, does NOT mutate documents
 */
export function sanitizeColorForPrint(
  color: string | undefined, 
  isPrintMode: boolean
): string {
  // Handle undefined: default to black in print mode, white otherwise
  if (!color) {
    return isPrintMode ? '#000000' : '#ffffff';
  }
  
  // Normalize and check for white
  const normalized = color.trim().toLowerCase();
  if (isPrintMode && normalized === '#ffffff') {
    return '#000000';
  }
  
  return color;
}
