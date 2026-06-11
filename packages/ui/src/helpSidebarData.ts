/**
 * helpSidebarData - Shared shortcut data for HelpSidebar and CheatSheetOverlay
 * Single source of truth for keyboard shortcut documentation
 */

export interface HelpShortcutItem {
  key: string;
  description: string;
}

export interface HelpSection {
  title: string;
  items: HelpShortcutItem[];
}

/** Shortcuts data — same structure as CheatSheetOverlay */
export const SHORTCUT_SECTIONS: HelpSection[] = [
  {
    title: 'Elements',
    items: [
      { key: 'P', description: 'Add Home Player' },
      { key: '⇧P', description: 'Add Away Player' },
      { key: 'B', description: 'Add Ball' },
      { key: 'A', description: 'Pass Arrow' },
      { key: 'R', description: 'Run Arrow' },
      { key: 'Z', description: 'Rect Zone' },
      { key: '⇧Z', description: 'Ellipse Zone' },
      { key: 'T', description: 'Text Label' },
      { key: 'D', description: 'Freehand Draw' },
      { key: 'H', description: 'Highlighter' },
    ],
  },
  {
    title: 'Edit',
    items: [
      { key: '⌘Z', description: 'Undo' },
      { key: '⇧⌘Z', description: 'Redo' },
      { key: '⌘C', description: 'Copy' },
      { key: '⌘V', description: 'Paste' },
      { key: '⌘D', description: 'Duplicate' },
      { key: 'Del', description: 'Delete' },
      { key: 'Esc', description: 'Deselect' },
      { key: '⌘A', description: 'Select All' },
    ],
  },
  {
    title: 'View & Pitch',
    items: [
      { key: 'F', description: 'Focus Mode' },
      { key: 'I', description: 'Toggle Inspector' },
      { key: 'O', description: 'Player Orientation' },
      { key: 'W', description: 'Print Mode' },
      { key: 'V', description: 'Cycle Pitch View' },
      { key: '?', description: 'All Shortcuts' },
      { key: '⌘K', description: 'Command Palette' },
    ],
  },
  {
    title: 'Steps & Playback',
    items: [
      { key: '←/→', description: 'Prev/Next Step' },
      { key: 'Space', description: 'Play/Pause' },
      { key: 'N', description: 'New Step' },
      { key: 'X', description: 'Delete Step' },
    ],
  },
];

/** Quick tool actions for the "Narzędzia" section */
export interface ToolAction {
  id: string;
  label: string;
  description: string;
  action: string;
}

export const TOOL_ACTIONS: ToolAction[] = [
  { id: 'zoom-fit', label: 'Zoom Fit', description: 'Reset view to fit pitch', action: 'zoomFit' },
  { id: 'focus-mode', label: 'Focus Mode', description: 'Minimal UI for focused work', action: 'toggleFocus' },
  { id: 'print-mode', label: 'Print Mode', description: 'Clean layout for export', action: 'togglePrint' },
  { id: 'export', label: 'Export', description: 'Export as PNG/PDF/GIF', action: 'export' },
];

/** Contextual tips */
export interface HelpTip {
  id: string;
  text: string;
  condition?: string;
}

export const HELP_TIPS: HelpTip[] = [
  { id: 'tip-1', text: 'Select a player and press → to add an arrow with number' },
  { id: 'tip-2', text: 'Double-click a player to quickly edit their number' },
  { id: 'tip-3', text: 'Hold Shift while clicking to multi-select elements' },
  { id: 'tip-4', text: 'Press ? to see the full shortcut cheat sheet' },
  { id: 'tip-5', text: 'Use Ctrl+Scroll to zoom in and out' },
  { id: 'tip-6', text: 'Space + drag to pan the canvas' },
];
