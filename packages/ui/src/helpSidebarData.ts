/**
 * helpSidebarData - Shared shortcut data for HelpSidebar and CheatSheetOverlay
 * Single source of truth for keyboard shortcut documentation
 */

export interface HelpShortcutItem {
  id: string;
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
      { id: 'add-home-player', key: 'P', description: 'Add Home Player' },
      { id: 'add-away-player', key: 'Shift+P', description: 'Add Away Player' },
      { id: 'add-team3-player', key: 'Alt+P', description: 'Add Team 3 Player' },
      { id: 'add-team4-player', key: 'Alt+Shift+P', description: 'Add Team 4 Player' },
      { id: 'add-ball', key: 'B', description: 'Add Ball' },
      { id: 'pass-arrow', key: 'A', description: 'Pass Arrow' },
      { id: 'run-arrow', key: 'R', description: 'Run Arrow' },
      { id: 'shot-arrow', key: 'S', description: 'Shot Arrow' },
      { id: 'dribble-arrow', key: 'D', description: 'Dribble Arrow' },
      { id: 'rect-zone', key: 'Z', description: 'Rect Zone' },
      { id: 'ellipse-zone', key: 'Shift+Z', description: 'Ellipse Zone' },
      { id: 'text-label', key: 'T', description: 'Text Label' },
      { id: 'freehand-draw', key: 'Shift+D', description: 'Freehand Draw' },
      { id: 'highlighter', key: 'H', description: 'Highlighter' },
    ],
  },
  {
    title: 'Edit',
    items: [
      { id: 'undo', key: '⌘Z', description: 'Undo' },
      { id: 'redo', key: 'Shift+⌘Z', description: 'Redo' },
      { id: 'copy', key: '⌘C', description: 'Copy' },
      { id: 'paste', key: '⌘V', description: 'Paste' },
      { id: 'duplicate', key: '⌘D', description: 'Duplicate' },
      { id: 'delete', key: 'Del', description: 'Delete' },
      { id: 'deselect', key: 'Esc', description: 'Deselect' },
      { id: 'select-all', key: '⌘A', description: 'Select All' },
      { id: 'cycle-player-shape', key: 'Shift+S', description: 'Cycle Player Shape' },
      { id: 'cycle-zone-shape', key: 'E', description: 'Cycle Zone Shape' },
      { id: 'group-selection', key: '⌘G', description: 'Group Selection' },
      { id: 'ungroup-selection', key: 'Alt+G', description: 'Ungroup Selection' },
      { id: 'lock-unlock', key: 'Shift+L', description: 'Lock / Unlock Selection' },
      { id: 'cycle-color', key: 'Alt+↑↓', description: 'Cycle Color' },
      { id: 'stroke-width', key: 'Alt+←→', description: 'Stroke Width (text: Alignment)' },
      { id: 'resize-selected', key: 'Shift+±', description: 'Resize Selected' },
      { id: 'text-bold-italic', key: 'Ctrl+B / Ctrl+I', description: 'Bold / Italic (text)' },
    ],
  },
  {
    title: 'View & Pitch',
    items: [
      { id: 'focus-mode', key: 'F', description: 'Focus Mode' },
      { id: 'toggle-inspector', key: 'I', description: 'Toggle Inspector' },
      { id: 'player-orientation', key: 'O', description: 'Player Orientation' },
      { id: 'print-mode', key: 'W', description: 'Print Mode' },
      { id: 'cycle-pitch-view', key: 'V', description: 'Cycle Pitch View' },
      { id: 'all-shortcuts', key: '?', description: 'All Shortcuts' },
      { id: 'command-palette', key: '⌘K', description: 'Command Palette' },
    ],
  },
  {
    title: 'Steps & Playback',
    items: [
      { id: 'prev-next-step', key: '←/→', description: 'Prev/Next Step' },
      { id: 'play-pause', key: 'Space', description: 'Play/Pause' },
      { id: 'new-step', key: 'N', description: 'New Step' },
      { id: 'delete-step', key: 'X', description: 'Delete Step' },
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
