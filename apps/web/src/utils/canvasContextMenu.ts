/**
 * Canvas Context Menu Helpers
 * Generates context-aware menu items for the tactical board.
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
  onGroupSelected?: () => void;
  onUngroupSelected?: () => void;
  onLockSelected?: () => void;
  onUnlockSelected?: () => void;
  onToggleLock?: () => void;
  isSelectedLocked?: boolean;
  // Element-specific
  onChangeNumber?: () => void;
  onSwitchTeam?: () => void;
  onCycleShape?: () => void;
  onEdit?: () => void;
  onCycleColor?: () => void;
  onChangePlayerColor?: () => void;
  onChangeTextColor?: () => void;
  onResize?: () => void;
  onEditArrowNumber?: () => void;
  onRenumberArrows?: () => void;
  // Empty space actions
  onAddPlayer?: () => void;
  onAddPlayerTeam1?: () => void;
  onAddPlayerTeam2?: () => void;
  onAddPlayerTeam3?: () => void;
  onAddPlayerTeam4?: () => void;
  onAddBall?: () => void;
  onAddArrow?: () => void;
  onAddZone?: () => void;
  onToggleAutoNumbering?: () => void;
  isAutoNumbering?: boolean;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
const cmd = isMac ? '⌘' : 'Ctrl+';
const opt = isMac ? 'Opt' : 'Alt';

const translate = (t: TFunction | undefined, key: string, fallback: string, vars?: Record<string, string | number>) =>
  t?.(key, vars) ?? fallback;

export function getContextMenuHeader(element: BoardElement | null, t?: TFunction): string | undefined {
  if (!element) return undefined;

  if (isPlayerElement(element)) {
    const team = element.team === 'home'
      ? translate(t, 'teamsPanel.team1', 'Team 1')
      : element.team === 'away'
        ? translate(t, 'teamsPanel.team2', 'Team 2')
        : element.team === 'team3'
          ? translate(t, 'teamsPanel.team3', 'Team 3')
          : translate(t, 'teamsPanel.team4', 'Team 4');
    return translate(t, 'contextMenu.header.player', 'Player #{{number}} ({{team}})', {
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
    return translate(t, 'contextMenu.header.zone', 'Zone ({{shape}})', { shape });
  }

  if (isTextElement(element)) {
    const preview = element.content.slice(0, 20) + (element.content.length > 20 ? '...' : '');
    return translate(t, 'contextMenu.header.text', 'Text: "{{preview}}"', { preview });
  }

  if (isArrowElement(element)) {
    const type = {
      pass: translate(t, 'contextMenu.arrow.pass', 'Pass'),
      run: translate(t, 'contextMenu.arrow.run', 'Run'),
      shoot: translate(t, 'contextMenu.arrow.shoot', 'Shot'),
      dribble: translate(t, 'contextMenu.arrow.dribble', 'Dribble'),
    }[element.arrowType];
    return translate(t, 'contextMenu.header.arrow', '{{type}} Arrow', { type });
  }

  if (isBallElement(element)) {
    return translate(t, 'contextMenu.header.ball', 'Ball');
  }

  if (isEquipmentElement(element)) {
    const typeLabel = element.equipmentType.charAt(0).toUpperCase() + element.equipmentType.slice(1);
    return translate(t, 'contextMenu.header.equipment', '{{type}}', { type: typeLabel });
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
  const divider = (): ContextMenuItem => ({ label: '', icon: '', onClick: () => {}, divider: true });
  const autoNumLabel = handlers.isAutoNumbering
    ? label('autoNumberingOn', 'Auto-numbering: ON')
    : label('autoNumberingOff', 'Auto-numbering: OFF');
  const lockLabel = handlers.isSelectedLocked
    ? label('unlockElement', 'Unlock element')
    : label('lockElement', 'Lock element');
  const lockIcon = handlers.isSelectedLocked ? 'unlock' : 'lock';

  if (selectedCount && selectedCount > 1) {
    return [
      { label: label('selectedCount', '{{count}} elements selected', { count: selectedCount }), icon: 'check', onClick: () => {} },
      divider(),
      { label: label('groupSelected', 'Group selected'), icon: 'group', onClick: handlers.onGroupSelected ?? (() => {}), shortcut: `${cmd}G` },
      { label: label('ungroup', 'Ungroup'), icon: 'ungroup', onClick: handlers.onUngroupSelected ?? (() => {}), shortcut: `${opt}+G` },
      handlers.isSelectedLocked
        ? { label: label('unlockSelected', 'Unlock selected'), icon: 'unlock', onClick: handlers.onUnlockSelected ?? handlers.onToggleLock ?? (() => {}), shortcut: 'Shift+L' }
        : { label: label('lockSelected', 'Lock selected'), icon: 'lock', onClick: handlers.onLockSelected ?? handlers.onToggleLock ?? (() => {}), shortcut: 'Shift+L' },
      divider(),
      { label: label('copy', 'Copy'), icon: 'copy', onClick: handlers.onCopy, shortcut: `${cmd}C` },
      { label: label('duplicate', 'Duplicate'), icon: 'duplicate', onClick: handlers.onDuplicate, shortcut: `${cmd}D` },
      ...(handlers.onResize ? [{ label: label('resize', 'Resize...'), icon: 'resize', onClick: handlers.onResize, shortcut: `${opt}+${cmd}+/-` }] : []),
      divider(),
      { label: label('delete', 'Delete'), icon: 'trash', onClick: handlers.onDelete, variant: 'danger', shortcut: 'Del' },
    ];
  }

  if (!element) {
    return [
      { label: label('paste', 'Paste'), icon: 'paste', onClick: handlers.onPaste, shortcut: `${cmd}V` },
      { label: label('selectAll', 'Select all'), icon: 'check', onClick: handlers.onSelectAll, shortcut: `${cmd}A` },
      divider(),
      { label: label('addPlayerTeam1', 'Add Team 1 player'), icon: 'player', onClick: handlers.onAddPlayerTeam1 ?? handlers.onAddPlayer ?? (() => {}), shortcut: 'P' },
      { label: label('addPlayerTeam2', 'Add Team 2 player'), icon: 'player', onClick: handlers.onAddPlayerTeam2 ?? (() => {}), shortcut: 'Shift+P' },
      { label: label('addPlayerTeam3', 'Add Team 3 player'), icon: 'player', onClick: handlers.onAddPlayerTeam3 ?? (() => {}), shortcut: `${opt}+P` },
      { label: label('addPlayerTeam4', 'Add Team 4 player'), icon: 'player', onClick: handlers.onAddPlayerTeam4 ?? (() => {}), shortcut: `${opt}+Shift+P` },
      divider(),
      { label: label('addBall', 'Add ball'), icon: 'ball', onClick: handlers.onAddBall ?? (() => {}), shortcut: 'B' },
      { label: label('addArrow', 'Add arrow'), icon: 'arrow', onClick: handlers.onAddArrow ?? (() => {}), shortcut: 'A' },
      { label: label('addZone', 'Add zone'), icon: 'zone', onClick: handlers.onAddZone ?? (() => {}), shortcut: 'Z' },
      divider(),
      { label: autoNumLabel, icon: 'number', onClick: handlers.onToggleAutoNumbering ?? (() => {}), shortcut: 'Shift+N' },
    ];
  }

  const layerItems: ContextMenuItem[] = [
    divider(),
    { label: label('bringToFront', 'Bring to front'), icon: 'front', onClick: handlers.onBringToFront },
    { label: label('bringForward', 'Bring forward'), icon: 'up', onClick: handlers.onBringForward },
    { label: label('sendBackward', 'Send backward'), icon: 'down', onClick: handlers.onSendBackward },
    { label: label('sendToBack', 'Send to back'), icon: 'back', onClick: handlers.onSendToBack },
  ];

  const commonItems: ContextMenuItem[] = [
    divider(),
    { label: lockLabel, icon: lockIcon, onClick: handlers.onToggleLock ?? (() => {}), shortcut: 'Shift+L' },
    { label: label('copy', 'Copy'), icon: 'copy', onClick: handlers.onCopy, shortcut: `${cmd}C` },
    { label: label('duplicate', 'Duplicate'), icon: 'duplicate', onClick: handlers.onDuplicate, shortcut: `${cmd}D` },
    divider(),
    { label: label('delete', 'Delete'), icon: 'trash', onClick: handlers.onDelete, variant: 'danger', shortcut: 'Del' },
  ];

  if (isPlayerElement(element)) {
    return [
      { label: label('changeNumber', 'Change number'), icon: 'number', onClick: handlers.onChangeNumber ?? (() => {}), shortcut: 'double-click' },
      { label: label('switchTeam', 'Switch team'), icon: 'switch', onClick: handlers.onSwitchTeam ?? (() => {}), shortcut: 'Shift+P' },
      { label: label('cycleShape', 'Cycle shape'), icon: 'shape', onClick: handlers.onCycleShape ?? (() => {}), shortcut: 'Shift+S' },
      ...(handlers.onChangePlayerColor ? [{ label: label('changeColor', 'Change color...'), icon: 'palette', onClick: handlers.onChangePlayerColor }] : []),
      ...(handlers.onResize ? [{ label: label('resize', 'Resize...'), icon: 'resize', onClick: handlers.onResize, shortcut: `${opt}+${cmd}+/-` }] : []),
      ...layerItems,
      ...commonItems,
    ];
  }

  if (isZoneElement(element)) {
    return [
      { label: label('cycleShape', 'Cycle shape'), icon: 'shape', onClick: handlers.onCycleShape ?? (() => {}), shortcut: 'E' },
      { label: label('changeColor', 'Change color'), icon: 'palette', onClick: handlers.onCycleColor ?? (() => {}), shortcut: `${opt}+↓` },
      ...layerItems,
      ...commonItems,
    ];
  }

  if (isTextElement(element)) {
    return [
      { label: label('editText', 'Edit text'), icon: 'edit', onClick: handlers.onEdit ?? (() => {}), shortcut: 'Enter' },
      ...(handlers.onChangeTextColor ? [{ label: label('changeColor', 'Change color...'), icon: 'palette', onClick: handlers.onChangeTextColor }] : []),
      ...layerItems,
      ...commonItems,
    ];
  }

  if (isArrowElement(element)) {
    return [
      { label: label('editArrowNumber', 'Add/edit number'), icon: 'number', onClick: handlers.onEditArrowNumber ?? (() => {}), shortcut: '→' },
      { label: autoNumLabel, icon: 'number', onClick: handlers.onToggleAutoNumbering ?? (() => {}), shortcut: 'Shift+N' },
      { label: label('renumberArrows', 'Renumber from 1'), icon: 'number', onClick: handlers.onRenumberArrows ?? (() => {}) },
      { label: label('changeColor', 'Change color'), icon: 'palette', onClick: handlers.onCycleColor ?? (() => {}), shortcut: `${opt}+↓` },
      ...layerItems,
      ...commonItems,
    ];
  }

  if (isEquipmentElement(element)) {
    return [
      { label: label('changeColor', 'Change color'), icon: 'palette', onClick: handlers.onCycleColor ?? (() => {}), shortcut: `${opt}+↓` },
      { label: label('rotate', 'Rotate'), icon: 'rotate', onClick: () => {}, shortcut: '[ ]' },
      ...layerItems,
      ...commonItems,
    ];
  }

  return [
    ...layerItems,
    ...commonItems,
  ];
}
