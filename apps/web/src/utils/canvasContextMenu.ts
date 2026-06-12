/**
 * Canvas Context Menu Helpers
 * PR-UX-5: Generate context menu items based on element type
 */

import type { BoardElement } from '@tmc/core';
import type { ContextMenuItem } from '@tmc/ui';
import { isPlayerElement, isZoneElement, isTextElement, isArrowElement, isBallElement, isEquipmentElement } from '@tmc/core';

interface ContextMenuHandlers {
  onDelete: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  // Element-specific
  onChangeNumber?: () => void;
  onSwitchTeam?: () => void;
  onCycleShape?: () => void;
  onEdit?: () => void;
  onCycleColor?: () => void;
  onChangePlayerColor?: () => void;
  onChangeTextColor?: () => void;
  onResize?: () => void; // B5: PPM Resize Slider
  onEditArrowNumber?: () => void; // PR-ARROW-NUMBER — toggles auto-numbering mode
  // Empty space actions
  onAddPlayer?: () => void;
  onAddBall?: () => void;
  onAddArrow?: () => void;
  onAddZone?: () => void;
  // PR-ARROW-NUMBER: Auto-numbering mode toggle for empty space
  onToggleAutoNumbering?: () => void;
  isAutoNumbering?: boolean;
}

// Detect platform for correct shortcuts
const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
const cmd = isMac ? '⌘' : 'Ctrl+';

/**
 * Generate contextual header for menu
 * PR-UX-5: Shows what element was clicked
 */
export function getContextMenuHeader(element: BoardElement | null): string | undefined {
  if (!element) return undefined;

  if (isPlayerElement(element)) {
    const team = element.team === 'home' ? 'Home' : 'Away';
    return `🎽 Player #${element.number} (${team})`;
  }

  if (isZoneElement(element)) {
    const shape = element.shape === 'rect' ? 'Rectangle' : 'Ellipse';
    return `🟦 Zone (${shape})`;
  }

  if (isTextElement(element)) {
    const preview = element.content.slice(0, 20) + (element.content.length > 20 ? '...' : '');
    return `📝 Text: "${preview}"`;
  }

  if (isArrowElement(element)) {
    const type = {
      pass: 'Pass',
      run: 'Run',
      shoot: 'Shot',
      dribble: 'Dribble',
    }[element.arrowType];
    return `➡️ ${type} Arrow`;
  }

  if (isBallElement(element)) {
    return `⚽ Ball`;
  }

  if (isEquipmentElement(element)) {
    const typeLabel = element.equipmentType.charAt(0).toUpperCase() + element.equipmentType.slice(1);
    return `🏋️ ${typeLabel}`;
  }

  return undefined;
}

export function getCanvasContextMenuItems(
  element: BoardElement | null,
  handlers: ContextMenuHandlers,
  selectedCount?: number
): ContextMenuItem[] {
  // Multi-selection menu (when multiple elements are selected)
  if (selectedCount && selectedCount > 1) {
    return [
      { label: `${selectedCount} elements selected`, icon: '☑️', onClick: () => {} },
      { label: '', icon: '', onClick: () => {}, divider: true },
      { label: 'Copy', icon: '📄', onClick: handlers.onCopy, shortcut: `${cmd}C` },
      { label: 'Duplicate', icon: '📋', onClick: handlers.onDuplicate, shortcut: `${cmd}D` },
      ...(handlers.onResize ? [{ label: 'Resize…', icon: '🔍', onClick: handlers.onResize, shortcut: 'Opt+Cmd +/-' }] : []),
      { label: 'Delete', icon: '🗑️', onClick: handlers.onDelete, variant: 'danger', shortcut: 'Del' },
      { label: '', icon: '', onClick: () => {}, divider: true },
      { label: 'Bring to Front', icon: '⬆️', onClick: handlers.onBringToFront },
      { label: 'Send to Back', icon: '⬇️', onClick: handlers.onSendToBack },
    ];
  }
  
  // Empty space menu (no element selected)
  if (!element) {
    const autoNumLabel = handlers.isAutoNumbering ? '🔢 Auto-numeracja: ON' : '🔢 Auto-numeracja: OFF';
    return [
      { label: 'Paste', icon: '📋', onClick: handlers.onPaste, shortcut: `${cmd}V` },
      { label: 'Select All', icon: '☑️', onClick: handlers.onSelectAll, shortcut: `${cmd}A` },
      { label: '', icon: '', onClick: () => {}, divider: true },
      { label: 'Add Player', icon: '🎽', onClick: handlers.onAddPlayer ?? (() => {}), shortcut: 'P' },
      { label: 'Add Ball', icon: '⚽', onClick: handlers.onAddBall ?? (() => {}), shortcut: 'B' },
      { label: 'Add Arrow', icon: '➡️', onClick: handlers.onAddArrow ?? (() => {}), shortcut: 'A' },
      { label: 'Add Zone', icon: '🟦', onClick: handlers.onAddZone ?? (() => {}), shortcut: 'Z' },
      { label: '', icon: '', onClick: () => {}, divider: true },
      { label: autoNumLabel, icon: '🔄', onClick: handlers.onToggleAutoNumbering ?? (() => {}), shortcut: 'Shift+N' },
    ];
  }

  // Common layer control items for all elements
  const layerItems: ContextMenuItem[] = [
    { label: '', icon: '', onClick: () => {}, divider: true },
    { label: 'Bring to Front', icon: '⬆️', onClick: handlers.onBringToFront },
    { label: 'Bring Forward', icon: '↗️', onClick: handlers.onBringForward },
    { label: 'Send Backward', icon: '↘️', onClick: handlers.onSendBackward },
    { label: 'Send to Back', icon: '⬇️', onClick: handlers.onSendToBack },
  ];

  // Common edit items for all elements
  const commonItems: ContextMenuItem[] = [
    { label: '', icon: '', onClick: () => {}, divider: true },
    { label: 'Copy', icon: '📄', onClick: handlers.onCopy, shortcut: `${cmd}C` },
    { label: 'Duplicate', icon: '📋', onClick: handlers.onDuplicate, shortcut: `${cmd}D` },
    { label: 'Delete', icon: '🗑️', onClick: handlers.onDelete, variant: 'danger', shortcut: 'Del' },
  ];

  // Player-specific menu
  if (isPlayerElement(element)) {
    return [
      { label: 'Change Number', icon: '🔢', onClick: handlers.onChangeNumber!, shortcut: 'double-tap' },
      { label: 'Switch Team', icon: '🔄', onClick: handlers.onSwitchTeam!, shortcut: 'Shift+P' },
      { label: 'Cycle Shape', icon: '◼️', onClick: handlers.onCycleShape!, shortcut: 'S' },
      ...(handlers.onChangePlayerColor ? [{ label: 'Change Color…', icon: '🎨', onClick: handlers.onChangePlayerColor }] : []),
      ...(handlers.onResize ? [{ label: 'Resize…', icon: '🔍', onClick: handlers.onResize, shortcut: 'Opt+Cmd +/-' }] : []),
      ...layerItems,
      ...commonItems,
    ];
  }

  // Zone-specific menu
  if (isZoneElement(element)) {
    return [
      { label: 'Cycle Shape', icon: '◼️', onClick: handlers.onCycleShape!, shortcut: 'E' },
      { label: 'Change Color', icon: '🎨', onClick: handlers.onCycleColor!, shortcut: 'Alt+↓' },
      ...layerItems,
      ...commonItems,
    ];
  }

  // Text-specific menu
  if (isTextElement(element)) {
    return [
      { label: 'Edit Text', icon: '✏️', onClick: handlers.onEdit!, shortcut: 'Enter' },
      ...(handlers.onChangeTextColor ? [{ label: 'Change Color…', icon: '🎨', onClick: handlers.onChangeTextColor }] : []),
      ...layerItems,
      ...commonItems,
    ];
  }

  // Arrow-specific menu
  if (isArrowElement(element)) {
    const autoNumLabel = handlers.isAutoNumbering ? '🔢 Auto-numeracja: ON' : '🔢 Auto-numeracja: OFF';
    return [
      { label: 'Dodaj/Edytuj numer', icon: '🔢', onClick: handlers.onEditArrowNumber!, shortcut: '→' },
      { label: autoNumLabel, icon: '🔄', onClick: handlers.onToggleAutoNumbering!, shortcut: 'Shift+N' },
      { label: 'Change Color', icon: '🎨', onClick: handlers.onCycleColor!, shortcut: 'Alt+↓' },
      ...layerItems,
      ...commonItems,
    ];
  }

  // Ball-specific menu
  if (isBallElement(element)) {
    return [
      ...layerItems,
      ...commonItems,
    ];
  }

  // Equipment-specific menu
  if (isEquipmentElement(element)) {
    return [
      { label: 'Change Color', icon: '🎨', onClick: handlers.onCycleColor!, shortcut: 'Alt+↓' },
      { label: 'Rotate', icon: '🔄', onClick: () => {}, shortcut: '[  ]' },
      ...layerItems,
      ...commonItems,
    ];
  }

  // Default menu for other element types
  return [
    ...layerItems,
    ...commonItems,
  ];
}
