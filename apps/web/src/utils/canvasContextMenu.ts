/**
 * Canvas Context Menu Helpers
 * PR-UX-5: Generate context menu items based on element type
 */

import type { BoardElement } from '@tmc/core';
import type { ContextMenuItem, TFunction } from '@tmc/ui';
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
const translate = (t: TFunction | undefined, key: string, fallback: string, vars?: Record<string, string | number>) =>
  t?.(key, vars) ?? fallback;

export function getContextMenuHeader(element: BoardElement | null, t?: TFunction): string | undefined {
  if (!element) return undefined;

  if (isPlayerElement(element)) {
    const team = element.team === 'home'
      ? translate(t, 'teamsPanel.team1', 'Home')
      : element.team === 'away'
        ? translate(t, 'teamsPanel.team2', 'Away')
        : element.team === 'team3'
          ? translate(t, 'teamsPanel.team3', 'Team 3')
          : translate(t, 'teamsPanel.team4', 'Team 4');
    return translate(t, 'contextMenu.header.player', `🎽 Player #${element.number} (${team})`, {
      number: element.number ?? '-',
      team,
    });
  }

  if (isZoneElement(element)) {
    const shape = element.shape === 'rect'
      ? translate(t, 'contextMenu.shape.rectangle', 'Rectangle')
      : element.shape === 'ellipse'
        ? translate(t, 'contextMenu.shape.ellipse', 'Ellipse')
        : translate(t, 'contextMenu.shape.polygon', 'Polygon');
    return translate(t, 'contextMenu.header.zone', `🟦 Zone (${shape})`, { shape });
  }

  if (isTextElement(element)) {
    const preview = element.content.slice(0, 20) + (element.content.length > 20 ? '...' : '');
    return translate(t, 'contextMenu.header.text', `📝 Text: "${preview}"`, { preview });
  }

  if (isArrowElement(element)) {
    const type = {
      pass: translate(t, 'contextMenu.arrow.pass', 'Pass'),
      run: translate(t, 'contextMenu.arrow.run', 'Run'),
      shoot: translate(t, 'contextMenu.arrow.shoot', 'Shot'),
      dribble: translate(t, 'contextMenu.arrow.dribble', 'Dribble'),
    }[element.arrowType];
    return translate(t, 'contextMenu.header.arrow', `➡️ ${type} Arrow`, { type });
  }

  if (isBallElement(element)) {
    return translate(t, 'contextMenu.header.ball', '⚽ Ball');
  }

  if (isEquipmentElement(element)) {
    const typeLabel = element.equipmentType.charAt(0).toUpperCase() + element.equipmentType.slice(1);
    return translate(t, 'contextMenu.header.equipment', `🏋️ ${typeLabel}`, { type: typeLabel });
  }

  return undefined;
}

export function getCanvasContextMenuItems(
  element: BoardElement | null,
  handlers: ContextMenuHandlers,
  selectedCount?: number,
  t?: TFunction
): ContextMenuItem[] {
  const label = (key: string, fallback: string, vars?: Record<string, string | number>) =>
    translate(t, `contextMenu.${key}`, fallback, vars);
  const autoNumLabel = handlers.isAutoNumbering
    ? label('autoNumberingOn', '🔢 Auto-numbering: ON')
    : label('autoNumberingOff', '🔢 Auto-numbering: OFF');

  // Multi-selection menu (when multiple elements are selected)
  if (selectedCount && selectedCount > 1) {
    return [
      { label: label('selectedCount', `${selectedCount} elements selected`, { count: selectedCount }), icon: '☑️', onClick: () => {} },
      { label: '', icon: '', onClick: () => {}, divider: true },
      { label: label('copy', 'Copy'), icon: '📄', onClick: handlers.onCopy, shortcut: `${cmd}C` },
      { label: label('duplicate', 'Duplicate'), icon: '📋', onClick: handlers.onDuplicate, shortcut: `${cmd}D` },
      ...(handlers.onResize ? [{ label: label('resize', 'Resize…'), icon: '🔍', onClick: handlers.onResize, shortcut: 'Opt+Cmd +/-' }] : []),
      { label: label('delete', 'Delete'), icon: '🗑️', onClick: handlers.onDelete, variant: 'danger', shortcut: 'Del' },
      { label: '', icon: '', onClick: () => {}, divider: true },
      { label: label('bringToFront', 'Bring to Front'), icon: '⬆️', onClick: handlers.onBringToFront },
      { label: label('sendToBack', 'Send to Back'), icon: '⬇️', onClick: handlers.onSendToBack },
    ];
  }
  
  // Empty space menu (no element selected)
  if (!element) {
    return [
      { label: label('paste', 'Paste'), icon: '📋', onClick: handlers.onPaste, shortcut: `${cmd}V` },
      { label: label('selectAll', 'Select All'), icon: '☑️', onClick: handlers.onSelectAll, shortcut: `${cmd}A` },
      { label: '', icon: '', onClick: () => {}, divider: true },
      { label: label('addPlayer', 'Add Player'), icon: '🎽', onClick: handlers.onAddPlayer ?? (() => {}), shortcut: 'P' },
      { label: label('addBall', 'Add Ball'), icon: '⚽', onClick: handlers.onAddBall ?? (() => {}), shortcut: 'B' },
      { label: label('addArrow', 'Add Arrow'), icon: '➡️', onClick: handlers.onAddArrow ?? (() => {}), shortcut: 'A' },
      { label: label('addZone', 'Add Zone'), icon: '🟦', onClick: handlers.onAddZone ?? (() => {}), shortcut: 'Z' },
      { label: '', icon: '', onClick: () => {}, divider: true },
      { label: autoNumLabel, icon: '🔄', onClick: handlers.onToggleAutoNumbering ?? (() => {}), shortcut: 'Shift+N' },
    ];
  }

  // Common layer control items for all elements
  const layerItems: ContextMenuItem[] = [
    { label: '', icon: '', onClick: () => {}, divider: true },
    { label: label('bringToFront', 'Bring to Front'), icon: '⬆️', onClick: handlers.onBringToFront },
    { label: label('bringForward', 'Bring Forward'), icon: '↗️', onClick: handlers.onBringForward },
    { label: label('sendBackward', 'Send Backward'), icon: '↘️', onClick: handlers.onSendBackward },
    { label: label('sendToBack', 'Send to Back'), icon: '⬇️', onClick: handlers.onSendToBack },
  ];

  // Common edit items for all elements
  const commonItems: ContextMenuItem[] = [
    { label: '', icon: '', onClick: () => {}, divider: true },
    { label: label('copy', 'Copy'), icon: '📄', onClick: handlers.onCopy, shortcut: `${cmd}C` },
    { label: label('duplicate', 'Duplicate'), icon: '📋', onClick: handlers.onDuplicate, shortcut: `${cmd}D` },
    { label: label('delete', 'Delete'), icon: '🗑️', onClick: handlers.onDelete, variant: 'danger', shortcut: 'Del' },
  ];

  // Player-specific menu
  if (isPlayerElement(element)) {
    return [
      { label: label('changeNumber', 'Change Number'), icon: '🔢', onClick: handlers.onChangeNumber!, shortcut: 'double-tap' },
      { label: label('switchTeam', 'Switch Team'), icon: '🔄', onClick: handlers.onSwitchTeam!, shortcut: 'Shift+P' },
      { label: label('cycleShape', 'Cycle Shape'), icon: '◼️', onClick: handlers.onCycleShape!, shortcut: 'S' },
      ...(handlers.onChangePlayerColor ? [{ label: label('changeColor', 'Change Color…'), icon: '🎨', onClick: handlers.onChangePlayerColor }] : []),
      ...(handlers.onResize ? [{ label: label('resize', 'Resize…'), icon: '🔍', onClick: handlers.onResize, shortcut: 'Opt+Cmd +/-' }] : []),
      ...layerItems,
      ...commonItems,
    ];
  }

  // Zone-specific menu
  if (isZoneElement(element)) {
    return [
      { label: label('cycleShape', 'Cycle Shape'), icon: '◼️', onClick: handlers.onCycleShape!, shortcut: 'E' },
      { label: label('changeColor', 'Change Color'), icon: '🎨', onClick: handlers.onCycleColor!, shortcut: 'Alt+↓' },
      ...layerItems,
      ...commonItems,
    ];
  }

  // Text-specific menu
  if (isTextElement(element)) {
    return [
      { label: label('editText', 'Edit Text'), icon: '✏️', onClick: handlers.onEdit!, shortcut: 'Enter' },
      ...(handlers.onChangeTextColor ? [{ label: label('changeColor', 'Change Color…'), icon: '🎨', onClick: handlers.onChangeTextColor }] : []),
      ...layerItems,
      ...commonItems,
    ];
  }

  // Arrow-specific menu
  if (isArrowElement(element)) {
    return [
      { label: label('editArrowNumber', 'Add/Edit Number'), icon: '🔢', onClick: handlers.onEditArrowNumber!, shortcut: '→' },
      { label: autoNumLabel, icon: '🔄', onClick: handlers.onToggleAutoNumbering!, shortcut: 'Shift+N' },
      { label: label('changeColor', 'Change Color'), icon: '🎨', onClick: handlers.onCycleColor!, shortcut: 'Alt+↓' },
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
      { label: label('changeColor', 'Change Color'), icon: '🎨', onClick: handlers.onCycleColor!, shortcut: 'Alt+↓' },
      { label: label('rotate', 'Rotate'), icon: '🔄', onClick: () => {}, shortcut: '[  ]' },
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
