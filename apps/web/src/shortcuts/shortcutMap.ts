/**
 * shortcutMap.ts — Single source of truth for keyboard shortcuts.
 *
 * Every shortcut in the app is defined ONCE here. Consumers (useKeyboardShortcuts,
 * command palette, cheat sheet, PPM labels) read from this map.
 *
 * @see docs/FEATURE_SPEC.md §1.4.6
 */

export type ShortcutContext =
  | 'global'
  | 'selection'
  | 'element-player'
  | 'element-arrow'
  | 'element-zone'
  | 'element-text'
  | 'element-ball'
  | 'element-equipment'
  | 'steps-playback'
  | 'export'
  | 'formations';

export interface ShortcutEntry {
  /** Stable identifier (used for i18n key `shortcuts.{id}.label`) */
  id: string;
  /** Human-readable key label (e.g. "P", "⌘Z", "Shift+S") */
  key: string;
  /** Description fallback (English, overridden by i18n) */
  description: string;
  /** Category for grouping in cheat sheet / palette */
  category: 'elements' | 'edit' | 'view' | 'steps' | 'export' | 'formations';
  /** Context — when multiple shortcuts share the same key, only the active context wins */
  context: ShortcutContext;
  /** Optional: when non-empty, the shortcut is skipped unless this feature flag is 'true' */
  featureFlag?: 'ANIMATION_ENABLED';
  /** If true, this entry is for reference only (not a real handler) */
  isInformational?: boolean;
}

/**
 * THE map. Add every shortcut here.
 *
 * ⚠️  Duplicate (key, context) pairs trigger a dev-time warning.
 * ⚠️  If a PPM or palette entry shows a key not in this map, a test fails.
 */
export const SHORTCUT_MAP: ShortcutEntry[] = [
  // ===== ELEMENTS =====
  { id: 'add-home-player', key: 'P', description: 'Add Home Player', category: 'elements', context: 'global' },
  { id: 'add-away-player', key: 'Shift+P', description: 'Add Away Player', category: 'elements', context: 'global' },
  { id: 'add-team3-player', key: 'Alt+P', description: 'Add Team 3 Player', category: 'elements', context: 'global' },
  { id: 'add-team4-player', key: 'Alt+Shift+P', description: 'Add Team 4 Player', category: 'elements', context: 'global' },
  { id: 'add-ball', key: 'B', description: 'Add Ball', category: 'elements', context: 'global' },
  { id: 'add-ball-cluster', key: 'Shift+B', description: 'Add Ball Cluster', category: 'elements', context: 'global' },
  { id: 'add-pass-arrow', key: 'A', description: 'Pass Arrow', category: 'elements', context: 'global' },
  { id: 'add-pass-arrow-auto-num', key: 'Shift+A', description: 'Pass Arrow + Auto-Number', category: 'elements', context: 'global' },
  { id: 'add-run-arrow', key: 'R', description: 'Run Arrow', category: 'elements', context: 'global' },
  { id: 'add-run-arrow-auto-num', key: 'Shift+R', description: 'Run Arrow + Auto-Number', category: 'elements', context: 'global' },
  { id: 'add-shoot-arrow', key: 'S', description: 'Shot Arrow', category: 'elements', context: 'global' },
  { id: 'add-dribble-arrow', key: 'D', description: 'Dribble Arrow', category: 'elements', context: 'global' },
  { id: 'add-zone', key: 'Z', description: 'Rect Zone', category: 'elements', context: 'global' },
  { id: 'add-ellipse-zone', key: 'Shift+Z', description: 'Ellipse Zone', category: 'elements', context: 'global' },
  { id: 'add-text', key: 'T', description: 'Text Label', category: 'elements', context: 'global' },
  { id: 'freehand-draw', key: 'Shift+D', description: 'Freehand Draw', category: 'elements', context: 'global' },
  { id: 'highlighter', key: 'H', description: 'Highlighter', category: 'elements', context: 'global' },
  { id: 'clear-drawings', key: 'C', description: 'Clear Drawings', category: 'elements', context: 'global' },
  { id: 'clear-all-elements', key: 'Shift+C', description: 'Clear All Elements (confirm)', category: 'elements', context: 'global' },

  // Equipment
  { id: 'add-goal', key: 'J', description: 'Goal', category: 'elements', context: 'global' },
  { id: 'add-mini-goal', key: 'Shift+J', description: 'Mini Goal', category: 'elements', context: 'global' },
  { id: 'add-mannequin', key: 'M', description: 'Mannequin', category: 'elements', context: 'global' },
  { id: 'add-flat-mannequin', key: 'Shift+M', description: 'Flat Mannequin', category: 'elements', context: 'global' },
  { id: 'add-cone', key: 'K', description: 'Cone', category: 'elements', context: 'global' },
  { id: 'add-flat-cone', key: 'Alt+K', description: 'Flat Disc Marker', category: 'elements', context: 'global' },
  { id: 'add-pole', key: 'Shift+K', description: 'Pole', category: 'elements', context: 'global' },
  { id: 'add-ladder', key: 'Y', description: 'Ladder', category: 'elements', context: 'global' },
  { id: 'add-hoop', key: 'Q', description: 'Hoop', category: 'elements', context: 'global' },
  { id: 'add-hurdle', key: 'U', description: 'Hurdle', category: 'elements', context: 'global' },

  // Manipulation
  { id: 'rotate-ccw', key: '[', description: 'Rotate -15°', category: 'elements', context: 'selection' },
  { id: 'rotate-cw', key: ']', description: 'Rotate +15°', category: 'elements', context: 'selection' },
  { id: 'rotate-ccw-90', key: '{', description: 'Rotate -90°', category: 'elements', context: 'selection' },
  { id: 'rotate-cw-90', key: '}', description: 'Rotate +90°', category: 'elements', context: 'selection' },
  { id: 'cycle-player-shape', key: 'Shift+S', description: 'Cycle Player Shape', category: 'elements', context: 'selection' },
  { id: 'cycle-zone-shape', key: 'E', description: 'Cycle Zone Shape', category: 'elements', context: 'selection' },
  { id: 'cycle-color', key: 'Alt+↓', description: 'Cycle Color', category: 'elements', context: 'selection' },
  { id: 'cycle-color-up', key: 'Alt+↑', description: 'Cycle Color (reverse)', category: 'elements', context: 'selection' },
  { id: 'stroke-width-inc', key: 'Alt+→', description: 'Increase Stroke Width', category: 'elements', context: 'selection' },
  { id: 'stroke-width-dec', key: 'Alt+←', description: 'Decrease Stroke Width', category: 'elements', context: 'selection' },

  // Arrow-specific
  { id: 'toggle-arrow-number', key: '→', description: 'Toggle Arrow Number', category: 'elements', context: 'element-arrow' },
  { id: 'toggle-auto-numbering', key: 'Shift+N', description: 'Toggle Auto-Numbering', category: 'elements', context: 'global' },

  // Orientation / Vision
  { id: 'orientation-mode', key: 'Shift+O', description: 'Toggle Player Orientation Mode', category: 'view', context: 'global' },
  { id: 'toggle-vision', key: 'V', description: 'Enable Vision (selected)', category: 'edit', context: 'selection' },
  { id: 'orientation-handles', key: 'Shift+V', description: 'Toggle Player Orientation Handles', category: 'edit', context: 'global' },
  { id: 'reset-orientation', key: 'Alt+0', description: 'Reset Player Orientation', category: 'edit', context: 'selection' },
  { id: 'cycle-pitch-view', key: 'W', description: 'Cycle Pitch View', category: 'view', context: 'global' },

  // ===== EDIT =====
  { id: 'copy', key: '⌘C', description: 'Copy', category: 'edit', context: 'selection' },
  { id: 'paste', key: '⌘V', description: 'Paste', category: 'edit', context: 'global' },
  { id: 'duplicate', key: '⌘D', description: 'Duplicate', category: 'edit', context: 'selection' },
  { id: 'delete', key: 'Del', description: 'Delete', category: 'edit', context: 'selection' },
  { id: 'undo', key: '⌘Z', description: 'Undo', category: 'edit', context: 'global' },
  { id: 'redo', key: 'Shift+⌘Z', description: 'Redo', category: 'edit', context: 'global' },
  { id: 'select-all', key: '⌘A', description: 'Select All', category: 'edit', context: 'global' },
  { id: 'clear-selection', key: 'Esc', description: 'Clear Selection', category: 'edit', context: 'global' },
  { id: 'group-selected', key: '⌘G', description: 'Group Selection', category: 'edit', context: 'selection' },
  { id: 'ungroup-selected', key: 'Alt+G', description: 'Ungroup Selection', category: 'edit', context: 'selection' },
  { id: 'lock-selection', key: 'Shift+L', description: 'Lock / Unlock Selection', category: 'edit', context: 'selection' },

  // ===== VIEW =====
  { id: 'command-palette', key: '⌘K', description: 'Command Palette', category: 'view', context: 'global' },
  { id: 'focus-mode', key: 'F', description: 'Focus Mode', category: 'view', context: 'global' },
  { id: 'toggle-inspector', key: 'I', description: 'Toggle Inspector', category: 'view', context: 'global' },
  { id: 'toggle-orientation', key: 'O', description: 'Toggle Pitch Orientation', category: 'view', context: 'global' },
  { id: 'open-projects', key: '⌘P', description: 'Open Projects', category: 'view', context: 'global' },
  { id: 'print-mode', key: 'Shift+W', description: 'Print Friendly Mode', category: 'view', context: 'global' },
  { id: 'toggle-grid', key: 'G', description: 'Toggle Grid', category: 'view', context: 'global' },
  { id: 'zoom-in', key: '+', description: 'Zoom In', category: 'view', context: 'global' },
  { id: 'zoom-out', key: '-', description: 'Zoom Out', category: 'view', context: 'global' },
  { id: 'toggle-shortcuts', key: '?', description: 'Toggle Shortcuts', category: 'view', context: 'global' },

  // ===== STEPS & PLAYBACK =====
  { id: 'prev-step', key: '←', description: 'Previous Step', category: 'steps', context: 'global', featureFlag: 'ANIMATION_ENABLED' },
  { id: 'next-step', key: '→', description: 'Next Step', category: 'steps', context: 'global', featureFlag: 'ANIMATION_ENABLED' },
  { id: 'add-step', key: 'N', description: 'Add Step', category: 'steps', context: 'global', featureFlag: 'ANIMATION_ENABLED' },
  { id: 'delete-step', key: 'X', description: 'Delete Step', category: 'steps', context: 'global', featureFlag: 'ANIMATION_ENABLED' },
  { id: 'toggle-loop', key: 'L', description: 'Toggle Loop', category: 'steps', context: 'global', featureFlag: 'ANIMATION_ENABLED' },

  // ===== EXPORT =====
  { id: 'export-png', key: '⌘E', description: 'Export PNG', category: 'export', context: 'global' },
  { id: 'export-all-steps', key: 'Shift+⌘E', description: 'Export All Steps PNG', category: 'export', context: 'global' },
  { id: 'export-gif', key: 'Shift+⌘G', description: 'Export Animated GIF', category: 'export', context: 'global' },
  { id: 'export-pdf', key: 'Shift+⌘P', description: 'Export PDF', category: 'export', context: 'global' },

  // ===== FORMATIONS =====
  { id: 'formation-1', key: '1', description: 'Apply Home Formation 1', category: 'formations', context: 'global' },
  { id: 'formation-2', key: '2', description: 'Apply Home Formation 2', category: 'formations', context: 'global' },
  { id: 'formation-3', key: '3', description: 'Apply Home Formation 3', category: 'formations', context: 'global' },
  { id: 'formation-4', key: '4', description: 'Apply Home Formation 4', category: 'formations', context: 'global' },
  { id: 'formation-5', key: '5', description: 'Apply Home Formation 5', category: 'formations', context: 'global' },
  { id: 'formation-6', key: '6', description: 'Apply Home Formation 6', category: 'formations', context: 'global' },
  { id: 'formation-away-1', key: 'Shift+1', description: 'Apply Away Formation 1', category: 'formations', context: 'global' },
  { id: 'formation-away-2', key: 'Shift+2', description: 'Apply Away Formation 2', category: 'formations', context: 'global' },
  { id: 'formation-away-3', key: 'Shift+3', description: 'Apply Away Formation 3', category: 'formations', context: 'global' },
  { id: 'formation-away-4', key: 'Shift+4', description: 'Apply Away Formation 4', category: 'formations', context: 'global' },
  { id: 'formation-away-5', key: 'Shift+5', description: 'Apply Away Formation 5', category: 'formations', context: 'global' },
  { id: 'formation-away-6', key: 'Shift+6', description: 'Apply Away Formation 6', category: 'formations', context: 'global' },
  { id: 'goalkeeper', key: 'Shift+G', description: 'Set GK / Cycle GK Color', category: 'formations', context: 'selection' },
];

// ===== DEV-TIME AUDIT =====

/** Check for duplicate (key, context) pairs. Runs only in development. */
export function auditShortcutConflicts(): void {
  if (typeof process === 'undefined' || process.env.NODE_ENV === 'production') return;
  
  const seen = new Map<string, string[]>();
  for (const entry of SHORTCUT_MAP) {
    const key = `${entry.key}:${entry.context}`;
    if (!seen.has(key)) {
      seen.set(key, [entry.id]);
    } else {
      seen.get(key)!.push(entry.id);
      console.warn(
        `[Shortcut Audit] Duplicate (key="${entry.key}", context="${entry.context}"): ` +
        `${seen.get(key)!.join(', ')}`
      );
    }
  }
}

/** Map helper: find entry by id */
export function findShortcut(id: string): ShortcutEntry | undefined {
  return SHORTCUT_MAP.find((e) => e.id === id);
}

/** Map helper: find entries by category */
export function shortcutsByCategory(category: ShortcutEntry['category']): ShortcutEntry[] {
  return SHORTCUT_MAP.filter((e) => e.category === category);
}

/** Map helper: find entries by context */
export function shortcutsByContext(context: ShortcutContext): ShortcutEntry[] {
  return SHORTCUT_MAP.filter((e) => e.context === context);
}
