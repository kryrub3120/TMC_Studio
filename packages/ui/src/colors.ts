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

/**
 * Predefined team kit presets (primary/secondary/goalkeeper).
 * Each preset is chosen to give good contrast between primary fill
 * and secondary (number/text) color out of the box.
 */
export interface TeamKitPreset {
  id: string;
  /** i18n key for the display name */
  labelKey: string;
  primaryColor: string;
  secondaryColor: string;
  goalkeeperColor: string;
}

export const TEAM_KIT_PRESETS: TeamKitPreset[] = [
  { id: 'red-white', labelKey: 'teamsPanel.kits.redWhite', primaryColor: '#ef4444', secondaryColor: '#ffffff', goalkeeperColor: '#fbbf24' },
  { id: 'blue-white', labelKey: 'teamsPanel.kits.blueWhite', primaryColor: '#3b82f6', secondaryColor: '#ffffff', goalkeeperColor: '#f97316' },
  { id: 'green-white', labelKey: 'teamsPanel.kits.greenWhite', primaryColor: '#22c55e', secondaryColor: '#ffffff', goalkeeperColor: '#ec4899' },
  { id: 'black-white', labelKey: 'teamsPanel.kits.blackWhite', primaryColor: '#000000', secondaryColor: '#ffffff', goalkeeperColor: '#fbbf24' },
  { id: 'white-black', labelKey: 'teamsPanel.kits.whiteBlack', primaryColor: '#ffffff', secondaryColor: '#000000', goalkeeperColor: '#3b82f6' },
  { id: 'yellow-blue', labelKey: 'teamsPanel.kits.yellowBlue', primaryColor: '#eab308', secondaryColor: '#1d4ed8', goalkeeperColor: '#16a34a' },
  { id: 'orange-black', labelKey: 'teamsPanel.kits.orangeBlack', primaryColor: '#f97316', secondaryColor: '#000000', goalkeeperColor: '#3b82f6' },
  { id: 'navy-skyblue', labelKey: 'teamsPanel.kits.navySkyblue', primaryColor: '#1e3a8a', secondaryColor: '#7dd3fc', goalkeeperColor: '#fbbf24' },
];
