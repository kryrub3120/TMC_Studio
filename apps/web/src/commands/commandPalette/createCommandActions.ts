/**
 * createCommandActions - Pure factory for Command Palette actions
 * Extracted from useBoardPageHandlers for modularity
 */

import type { CommandAction } from '@tmc/ui';

export interface CreateCommandActionsDeps {
  // Platform
  isMac: boolean;

  // Elements
  addHomePlayer: () => void;
  addAwayPlayer: () => void;
  addBall: () => void;
  addPassArrow: () => void;
  addRunArrow: () => void;
  addZone: () => void;
  addText: () => void;

  // Edit
  duplicateSelected: () => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  selectAll: () => void;
  clearSelection: () => void;

  // View
  toggleInspector: () => void;
  toggleCheatSheet: () => void;
  toggleFocusMode: () => void;
  showToast: (msg: string) => void;

  // Steps / playback
  addStepWithGating: () => void;
  prevStep: () => void;
  nextStep: () => void;
  play: () => void;
  pause: () => void;
  toggleLoop: () => void;

  // Export
  exportPNG: () => void;
  exportAllStepsPNG: () => void;
  exportGIF: () => void;
  exportPDF: () => void;
  exportSVG: () => void;

  // State for disabled/labels
  selectedCount: number;
  canUndo: boolean;
  canRedo: boolean;
  currentStepIndex: number;
  stepsCount: number;
  isPlaying: boolean;
  isLooping: boolean;
}

export function createCommandActions(deps: CreateCommandActionsDeps): CommandAction[] {
  const cmd = deps.isMac ? '⌘' : 'Ctrl+';

  return [
    // Elements
    { id: 'add-home-player', label: 'Add Home Player', shortcut: 'P', category: 'elements', onExecute: deps.addHomePlayer },
    { id: 'add-away-player', label: 'Add Away Player', shortcut: '⇧P', category: 'elements', onExecute: deps.addAwayPlayer },
    { id: 'add-ball', label: 'Add Ball', shortcut: 'B', category: 'elements', onExecute: deps.addBall },
    { id: 'add-pass-arrow', label: 'Add Pass Arrow', shortcut: 'A', category: 'elements', onExecute: deps.addPassArrow },
    { id: 'add-run-arrow', label: 'Add Run Arrow', shortcut: 'R', category: 'elements', onExecute: deps.addRunArrow },
    { id: 'add-zone', label: 'Add Zone', shortcut: 'Z', category: 'elements', onExecute: deps.addZone },
    { id: 'add-text', label: 'Add Text', shortcut: 'T', category: 'elements', onExecute: deps.addText },

    // Edit
    { id: 'duplicate', label: 'Duplicate Selection', shortcut: `${cmd}D`, category: 'edit', onExecute: deps.duplicateSelected, disabled: deps.selectedCount === 0 },
    { id: 'delete', label: 'Delete Selection', shortcut: 'Del', category: 'edit', onExecute: deps.deleteSelected, disabled: deps.selectedCount === 0 },
    { id: 'undo', label: 'Undo', shortcut: `${cmd}Z`, category: 'edit', onExecute: deps.undo, disabled: !deps.canUndo },
    { id: 'redo', label: 'Redo', shortcut: `⇧${cmd}Z`, category: 'edit', onExecute: deps.redo, disabled: !deps.canRedo },
    { id: 'select-all', label: 'Select All', shortcut: `${cmd}A`, category: 'edit', onExecute: deps.selectAll },
    { id: 'clear-selection', label: 'Clear Selection', shortcut: 'Esc', category: 'edit', onExecute: () => {} },

    // View
    { id: 'toggle-inspector', label: 'Toggle Inspector', shortcut: 'I', category: 'view', onExecute: deps.toggleInspector },
    { id: 'toggle-cheatsheet', label: 'Toggle Shortcuts', shortcut: '?', category: 'view', onExecute: deps.toggleCheatSheet },
    { id: 'toggle-grid', label: 'Toggle Grid', shortcut: 'G', category: 'view', onExecute: () => deps.showToast('Grid coming soon') },
    { id: 'toggle-snap', label: 'Toggle Snap', shortcut: 'S', category: 'view', onExecute: () => deps.showToast('Snap toggle coming soon') },
    { id: 'focus-mode', label: 'Focus Mode', shortcut: 'F', category: 'view', onExecute: deps.toggleFocusMode },

    // Steps
    { id: 'add-step', label: 'Add Step', shortcut: 'N', category: 'steps', onExecute: () => { deps.addStepWithGating(); deps.showToast('New step added'); } },
    { id: 'prev-step', label: 'Previous Step', shortcut: '←', category: 'steps', onExecute: deps.prevStep, disabled: deps.currentStepIndex === 0 },
    { id: 'next-step', label: 'Next Step', shortcut: '→', category: 'steps', onExecute: deps.nextStep, disabled: deps.currentStepIndex >= deps.stepsCount - 1 },
    { id: 'play-pause', label: deps.isPlaying ? 'Pause' : 'Play', shortcut: 'Space', category: 'steps', onExecute: () => { deps.isPlaying ? deps.pause() : deps.play(); } },
    { id: 'toggle-loop', label: 'Toggle Loop', shortcut: 'L', category: 'steps', onExecute: () => { deps.toggleLoop(); deps.showToast(deps.isLooping ? 'Loop disabled' : 'Loop enabled'); } },

    // Export
    { id: 'export-png', label: 'Export PNG', shortcut: `${cmd}E`, category: 'export', onExecute: deps.exportPNG },
    { id: 'export-steps', label: 'Export All Steps PNG', shortcut: `⇧${cmd}E`, category: 'export', onExecute: deps.exportAllStepsPNG },
    { id: 'export-gif', label: 'Export Animated GIF', shortcut: `⇧${cmd}G`, category: 'export', onExecute: deps.exportGIF, disabled: deps.stepsCount < 2 },
    { id: 'export-pdf', label: 'Export PDF (all steps)', shortcut: `⇧${cmd}P`, category: 'export', onExecute: deps.exportPDF },
    { id: 'export-svg', label: 'Export SVG', category: 'export', onExecute: deps.exportSVG },
  ];
}
