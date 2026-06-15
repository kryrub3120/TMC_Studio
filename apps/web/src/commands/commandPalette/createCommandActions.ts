/**
 * createCommandActions - Pure factory for Command Palette actions
 * Extracted from useBoardPageHandlers for modularity
 */

import type { CommandAction, TFunction } from '@tmc/ui';

export interface CreateCommandActionsDeps {
  // Platform
  isMac: boolean;

  // Elements
  addHomePlayer: () => void;
  addAwayPlayer: () => void;
  addBall: () => void;
  addPassArrow: () => void;
  addRunArrow: () => void;
  addShootArrow: () => void;
  addDribbleArrow: () => void;
  addZone: () => void;
  addEllipseZone: () => void;
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
  toggleGrid: () => void;
  toggleSnap: () => void;
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

  /**
   * When false, all Steps & Playback actions are excluded from the returned
   * list so they never appear in the Command Palette.
   * Defaults to `true` to preserve backward compatibility.
   */
  animationEnabled?: boolean;

  /** Optional i18n translator; labels fall back to English literals when omitted. */
  t?: TFunction;
}

export function createCommandActions(deps: CreateCommandActionsDeps): CommandAction[] {
  const cmd = deps.isMac ? '⌘' : 'Ctrl+';
  const animationEnabled = deps.animationEnabled ?? true;
  const label = (id: string, fallback: string) => deps.t?.(`commands.${id}`) ?? fallback;
  const toast = (id: string, fallback: string) => deps.t?.(`commands.toast.${id}`) ?? fallback;

  return [
    // Elements
    { id: 'add-home-player', label: label('add-home-player', 'Add Home Player'), shortcut: 'P', category: 'elements', onExecute: deps.addHomePlayer },
    { id: 'add-away-player', label: label('add-away-player', 'Add Away Player'), shortcut: 'Shift+P', category: 'elements', onExecute: deps.addAwayPlayer },
    { id: 'add-ball', label: label('add-ball', 'Add Ball'), shortcut: 'B', category: 'elements', onExecute: deps.addBall },
    { id: 'add-pass-arrow', label: label('add-pass-arrow', 'Add Pass Arrow'), shortcut: 'A', category: 'elements', onExecute: deps.addPassArrow },
    { id: 'add-run-arrow', label: label('add-run-arrow', 'Add Run Arrow'), shortcut: 'R', category: 'elements', onExecute: deps.addRunArrow },
    { id: 'add-shoot-arrow', label: label('add-shoot-arrow', 'Add Shot Arrow'), shortcut: 'S', category: 'elements', onExecute: deps.addShootArrow },
    { id: 'add-dribble-arrow', label: label('add-dribble-arrow', 'Add Dribble Arrow'), shortcut: 'D', category: 'elements', onExecute: deps.addDribbleArrow },
    { id: 'add-zone', label: label('add-zone', 'Add Zone'), shortcut: 'Z', category: 'elements', onExecute: deps.addZone },
    { id: 'add-ellipse-zone', label: label('add-ellipse-zone', 'Add Ellipse Zone'), shortcut: 'Shift+Z', category: 'elements', onExecute: deps.addEllipseZone },
    { id: 'add-text', label: label('add-text', 'Add Text'), shortcut: 'T', category: 'elements', onExecute: deps.addText },

    // Edit
    { id: 'duplicate', label: label('duplicate', 'Duplicate Selection'), shortcut: `${cmd}D`, category: 'edit', onExecute: deps.duplicateSelected, disabled: deps.selectedCount === 0 },
    { id: 'delete', label: label('delete', 'Delete Selection'), shortcut: 'Del', category: 'edit', onExecute: deps.deleteSelected, disabled: deps.selectedCount === 0 },
    { id: 'undo', label: label('undo', 'Undo'), shortcut: `${cmd}Z`, category: 'edit', onExecute: deps.undo, disabled: !deps.canUndo },
    { id: 'redo', label: label('redo', 'Redo'), shortcut: `Shift+${cmd}Z`, category: 'edit', onExecute: deps.redo, disabled: !deps.canRedo },
    { id: 'select-all', label: label('select-all', 'Select All'), shortcut: `${cmd}A`, category: 'edit', onExecute: deps.selectAll },
    { id: 'clear-selection', label: label('clear-selection', 'Clear Selection'), shortcut: 'Esc', category: 'edit', onExecute: () => {} },

    // View
    { id: 'toggle-inspector', label: label('toggle-inspector', 'Toggle Inspector'), shortcut: 'I', category: 'view', onExecute: deps.toggleInspector },
    { id: 'toggle-cheatsheet', label: label('toggle-cheatsheet', 'Toggle Shortcuts'), shortcut: '?', category: 'view', onExecute: deps.toggleCheatSheet },
    { id: 'toggle-grid', label: label('toggle-grid', 'Toggle Grid'), shortcut: 'G', category: 'view', onExecute: deps.toggleGrid },
    { id: 'toggle-snap', label: label('toggle-snap', 'Toggle Snap'), shortcut: 'S', category: 'view', onExecute: deps.toggleSnap },
    { id: 'focus-mode', label: label('focus-mode', 'Focus Mode'), shortcut: 'F', category: 'view', onExecute: deps.toggleFocusMode },

    // Steps & Playback (animation module — excluded when feature flag is off)
    ...(animationEnabled ? [
      { id: 'add-step', label: label('add-step', 'Add Step'), shortcut: 'N', category: 'steps', onExecute: () => { deps.addStepWithGating(); deps.showToast(toast('stepAdded', 'New step added')); } },
      { id: 'prev-step', label: label('prev-step', 'Previous Step'), shortcut: '←', category: 'steps', onExecute: deps.prevStep, disabled: deps.currentStepIndex === 0 },
      { id: 'next-step', label: label('next-step', 'Next Step'), shortcut: '→', category: 'steps', onExecute: deps.nextStep, disabled: deps.currentStepIndex >= deps.stepsCount - 1 },
      { id: 'play-pause', label: deps.isPlaying ? label('pause', 'Pause') : label('play', 'Play'), shortcut: 'Space', category: 'steps', onExecute: () => { deps.isPlaying ? deps.pause() : deps.play(); } },
      { id: 'toggle-loop', label: label('toggle-loop', 'Toggle Loop'), shortcut: 'L', category: 'steps', onExecute: () => { deps.toggleLoop(); deps.showToast(deps.isLooping ? toast('loopOff', 'Loop disabled') : toast('loopOn', 'Loop enabled')); } },
    ] as CommandAction[] : []),

    // Export
    { id: 'export-png', label: label('export-png', 'Export PNG'), shortcut: `${cmd}E`, category: 'export', onExecute: deps.exportPNG },
    { id: 'export-steps', label: label('export-steps', 'Export All Steps PNG'), shortcut: `Shift+${cmd}E`, category: 'export', onExecute: deps.exportAllStepsPNG },
    { id: 'export-gif', label: label('export-gif', 'Export Animated GIF'), shortcut: `Shift+${cmd}G`, category: 'export', onExecute: deps.exportGIF, disabled: !animationEnabled || deps.stepsCount < 2 },
    { id: 'export-pdf', label: label('export-pdf', 'Export PDF (all steps)'), shortcut: `Shift+${cmd}P`, category: 'export', onExecute: deps.exportPDF },
    { id: 'export-svg', label: label('export-svg', 'Export SVG'), category: 'export', onExecute: deps.exportSVG },
  ];
}
