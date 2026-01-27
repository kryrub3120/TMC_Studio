/**
 * useBoardPageHandlers - Callbacks and handlers for BoardPage
 * Extracted from App.tsx for modularity
 */

import { useCallback, useMemo } from 'react';
import type { Position, PlayerElement as PlayerElementType } from '@tmc/core';
import { isPlayerElement, isTextElement, isZoneElement } from '@tmc/core';
import type { CommandAction } from '@tmc/ui';

export interface BoardPageHandlersInput {
  // Board store actions
  addPlayerAtCursor: (team: 'home' | 'away') => void;
  addBallAtCursor: () => void;
  addArrowAtCursor: (type: 'pass' | 'run') => void;
  addZoneAtCursor: () => void;
  addTextAtCursor: () => void;
  selectElement: (id: string, addToSelection: boolean) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copySelection: () => void;
  pasteClipboard: () => void;
  updateSelectedElement: (updates: Partial<PlayerElementType>) => void;
  updateTextContent: (id: string, content: string) => void;
  moveElementById: (id: string, position: Position) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  selectAll: () => void;
  cycleSelectedColor: (direction: 1 | -1) => void;
  cyclePlayerShape: () => void;
  cycleZoneShape: () => void;
  
  // Steps
  addStep: () => void;
  prevStep: () => void;
  nextStep: () => void;
  
  // UI actions
  openCommandPalette: () => void;
  toggleInspector: () => void;
  toggleCheatSheet: () => void;
  toggleFocusMode: () => void;
  showToast: (message: string) => void;
  play: () => void;
  pause: () => void;
  toggleLoop: () => void;
  
  // Export
  handleExportPNG: () => void;
  handleExportAllSteps: () => void;
  handleExportGIF: () => void;
  handleExportPDF: () => void;
  handleExportSVG: () => void;
  
  // State
  elements: { id: string; type: string }[];
  selectedIds: string[];
  canUndo: boolean;
  canRedo: boolean;
  currentStepIndex: number;
  stepsCount: number;
  isPlaying: boolean;
  isLooping: boolean;
  
  // Editing state setters
  setEditingTextId: (id: string | null) => void;
  setEditingTextValue: (value: string) => void;
  setEditingPlayerId: (id: string | null) => void;
  setEditingPlayerNumber: (value: string) => void;
  
  // Context menu
  hideMenu: () => void;
  menuElementId: string | null;
}

export function useBoardPageHandlers(input: BoardPageHandlersInput) {
  const {
    addPlayerAtCursor,
    addBallAtCursor,
    addArrowAtCursor,
    addZoneAtCursor,
    addTextAtCursor,
    selectElement,
    deleteSelected,
    duplicateSelected,
    copySelection,
    pasteClipboard,
    updateSelectedElement,
    updateTextContent,
    moveElementById,
    pushHistory,
    undo,
    redo,
    selectAll,
    cycleSelectedColor,
    cyclePlayerShape,
    cycleZoneShape,
    addStep,
    prevStep,
    nextStep,
    openCommandPalette,
    toggleInspector,
    toggleCheatSheet,
    toggleFocusMode,
    showToast,
    play,
    pause,
    toggleLoop,
    handleExportPNG,
    handleExportAllSteps,
    handleExportGIF,
    handleExportPDF,
    handleExportSVG,
    elements,
    selectedIds,
    canUndo,
    canRedo,
    currentStepIndex,
    stepsCount,
    isPlaying,
    isLooping,
    setEditingTextId,
    setEditingTextValue,
    setEditingPlayerId,
    setEditingPlayerNumber,
    hideMenu,
    menuElementId,
  } = input;

  // Quick action handler
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'add-home-player': addPlayerAtCursor('home'); break;
      case 'add-away-player': addPlayerAtCursor('away'); break;
      case 'add-ball': addBallAtCursor(); break;
      case 'add-pass-arrow': addArrowAtCursor('pass'); break;
      case 'add-run-arrow': addArrowAtCursor('run'); break;
      case 'add-zone': addZoneAtCursor(); break;
      case 'add-text': addTextAtCursor(); break;
      case 'open-palette': openCommandPalette(); break;
    }
  }, [addPlayerAtCursor, addBallAtCursor, addArrowAtCursor, addZoneAtCursor, addTextAtCursor, openCommandPalette]);

  // Element select handler
  const handleElementSelect = useCallback(
    (id: string, addToSelection: boolean) => selectElement(id, addToSelection),
    [selectElement]
  );

  // Element drag end handler
  const handleElementDragEnd = useCallback(
    (id: string, position: Position) => {
      moveElementById(id, position);
      pushHistory();
    },
    [moveElementById, pushHistory]
  );

  // Update element handler
  const handleUpdateElement = useCallback(
    (updates: { number?: number; label?: string; showLabel?: boolean; fontSize?: number; textColor?: string; opacity?: number }) => {
      updateSelectedElement(updates as Partial<PlayerElementType>);
    },
    [updateSelectedElement]
  );

  // Text editing handlers
  const handleTextDoubleClick = useCallback((id: string) => {
    const textEl = elements.find((el) => el.id === id);
    if (textEl && isTextElement(textEl as any)) {
      setEditingTextId(id);
      setEditingTextValue((textEl as any).content || '');
    }
  }, [elements, setEditingTextId, setEditingTextValue]);

  const handleTextEditSave = useCallback((editingTextId: string | null, editingTextValue: string) => {
    if (editingTextId && editingTextValue.trim()) {
      updateTextContent(editingTextId, editingTextValue.trim());
    }
    setEditingTextId(null);
    setEditingTextValue('');
  }, [updateTextContent, setEditingTextId, setEditingTextValue]);

  const handleTextEditCancel = useCallback(() => {
    setEditingTextId(null);
    setEditingTextValue('');
  }, [setEditingTextId, setEditingTextValue]);

  // Player quick-edit handlers
  const handlePlayerQuickEdit = useCallback((id: string, currentNumber: number) => {
    setEditingPlayerId(id);
    setEditingPlayerNumber(String(currentNumber));
    selectElement(id, false);
  }, [selectElement, setEditingPlayerId, setEditingPlayerNumber]);

  const handlePlayerNumberSave = useCallback((editingPlayerId: string | null, editingPlayerNumber: string) => {
    if (editingPlayerId && editingPlayerNumber.trim()) {
      const numValue = parseInt(editingPlayerNumber.trim(), 10);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 99) {
        selectElement(editingPlayerId, false);
        updateSelectedElement({ number: numValue });
        showToast(`#${numValue}`);
      }
    }
    setEditingPlayerId(null);
    setEditingPlayerNumber('');
  }, [selectElement, updateSelectedElement, showToast, setEditingPlayerId, setEditingPlayerNumber]);

  const handlePlayerNumberCancel = useCallback(() => {
    setEditingPlayerId(null);
    setEditingPlayerNumber('');
  }, [setEditingPlayerId, setEditingPlayerNumber]);

  // Context menu actions
  const contextMenuActions = useMemo(() => ({
    onDelete: () => { deleteSelected(); hideMenu(); showToast('Deleted'); },
    onDuplicate: () => { duplicateSelected(); hideMenu(); showToast('Duplicated'); },
    onBringToFront: () => { hideMenu(); showToast('Layer control coming soon'); },
    onSendToBack: () => { hideMenu(); showToast('Layer control coming soon'); },
    onBringForward: () => { hideMenu(); showToast('Layer control coming soon'); },
    onSendBackward: () => { hideMenu(); showToast('Layer control coming soon'); },
    onCopy: () => { copySelection(); hideMenu(); showToast('Copied'); },
    onPaste: () => { pasteClipboard(); hideMenu(); showToast('Pasted'); },
    onSelectAll: () => { selectAll(); hideMenu(); },
    onAddPlayer: () => { addPlayerAtCursor('home'); hideMenu(); showToast('Player added'); },
    onAddBall: () => { addBallAtCursor(); hideMenu(); showToast('Ball added'); },
    onAddArrow: () => { addArrowAtCursor('pass'); hideMenu(); showToast('Arrow added'); },
    onAddZone: () => { addZoneAtCursor(); hideMenu(); showToast('Zone added'); },
    onCycleShape: () => {
      const el = elements.find(e => e.id === menuElementId);
      if (el && isPlayerElement(el as any)) cyclePlayerShape();
      else if (el && isZoneElement(el as any)) cycleZoneShape();
      hideMenu();
    },
    onCycleColor: () => {
      cycleSelectedColor(1);
      hideMenu();
      showToast('Color changed');
    },
    onEdit: () => {
      const el = elements.find(e => e.id === menuElementId);
      if (el && isTextElement(el as any)) {
        setEditingTextId(el.id);
        setEditingTextValue((el as any).content || '');
      }
      hideMenu();
    },
    onChangeNumber: () => {
      const el = elements.find(e => e.id === menuElementId);
      if (el && isPlayerElement(el as any)) {
        handlePlayerQuickEdit(el.id, (el as any).number);
      }
      hideMenu();
    },
    onSwitchTeam: () => {
      const el = elements.find(e => e.id === menuElementId);
      if (el && isPlayerElement(el as any)) {
        const newTeam = (el as any).team === 'home' ? 'away' : 'home';
        selectElement(el.id, false);
        updateSelectedElement({ team: newTeam });
        showToast(`Switched to ${newTeam}`);
      }
      hideMenu();
    },
  }), [
    deleteSelected, duplicateSelected, copySelection, pasteClipboard, selectAll,
    addPlayerAtCursor, addBallAtCursor, addArrowAtCursor, addZoneAtCursor,
    cyclePlayerShape, cycleZoneShape, cycleSelectedColor,
    elements, menuElementId, hideMenu, showToast, selectElement, updateSelectedElement,
    setEditingTextId, setEditingTextValue, handlePlayerQuickEdit
  ]);

  // Command palette actions
  const commandActions: CommandAction[] = useMemo(() => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
    const cmd = isMac ? '⌘' : 'Ctrl+';

    return [
      // Elements
      { id: 'add-home-player', label: 'Add Home Player', shortcut: 'P', category: 'elements', onExecute: () => addPlayerAtCursor('home') },
      { id: 'add-away-player', label: 'Add Away Player', shortcut: '⇧P', category: 'elements', onExecute: () => addPlayerAtCursor('away') },
      { id: 'add-ball', label: 'Add Ball', shortcut: 'B', category: 'elements', onExecute: () => addBallAtCursor() },
      { id: 'add-pass-arrow', label: 'Add Pass Arrow', shortcut: 'A', category: 'elements', onExecute: () => addArrowAtCursor('pass') },
      { id: 'add-run-arrow', label: 'Add Run Arrow', shortcut: 'R', category: 'elements', onExecute: () => addArrowAtCursor('run') },
      { id: 'add-zone', label: 'Add Zone', shortcut: 'Z', category: 'elements', onExecute: () => addZoneAtCursor() },
      { id: 'add-text', label: 'Add Text', shortcut: 'T', category: 'elements', onExecute: () => addTextAtCursor() },

      // Edit
      { id: 'duplicate', label: 'Duplicate Selection', shortcut: `${cmd}D`, category: 'edit', onExecute: duplicateSelected, disabled: selectedIds.length === 0 },
      { id: 'delete', label: 'Delete Selection', shortcut: 'Del', category: 'edit', onExecute: deleteSelected, disabled: selectedIds.length === 0 },
      { id: 'undo', label: 'Undo', shortcut: `${cmd}Z`, category: 'edit', onExecute: undo, disabled: !canUndo },
      { id: 'redo', label: 'Redo', shortcut: `⇧${cmd}Z`, category: 'edit', onExecute: redo, disabled: !canRedo },
      { id: 'select-all', label: 'Select All', shortcut: `${cmd}A`, category: 'edit', onExecute: selectAll },
      { id: 'clear-selection', label: 'Clear Selection', shortcut: 'Esc', category: 'edit', onExecute: () => {} },

      // View
      { id: 'toggle-inspector', label: 'Toggle Inspector', shortcut: 'I', category: 'view', onExecute: toggleInspector },
      { id: 'toggle-cheatsheet', label: 'Toggle Shortcuts', shortcut: '?', category: 'view', onExecute: toggleCheatSheet },
      { id: 'toggle-grid', label: 'Toggle Grid', shortcut: 'G', category: 'view', onExecute: () => showToast('Grid coming soon') },
      { id: 'toggle-snap', label: 'Toggle Snap', shortcut: 'S', category: 'view', onExecute: () => showToast('Snap toggle coming soon') },
      { id: 'focus-mode', label: 'Focus Mode', shortcut: 'F', category: 'view', onExecute: toggleFocusMode },

      // Steps
      { id: 'add-step', label: 'Add Step', shortcut: 'N', category: 'steps', onExecute: () => { addStep(); showToast('New step added'); } },
      { id: 'prev-step', label: 'Previous Step', shortcut: '←', category: 'steps', onExecute: prevStep, disabled: currentStepIndex === 0 },
      { id: 'next-step', label: 'Next Step', shortcut: '→', category: 'steps', onExecute: nextStep, disabled: currentStepIndex >= stepsCount - 1 },
      { id: 'play-pause', label: isPlaying ? 'Pause' : 'Play', shortcut: 'Space', category: 'steps', onExecute: () => { isPlaying ? pause() : play(); } },
      { id: 'toggle-loop', label: 'Toggle Loop', shortcut: 'L', category: 'steps', onExecute: () => { toggleLoop(); showToast(isLooping ? 'Loop disabled' : 'Loop enabled'); } },

      // Export
      { id: 'export-png', label: 'Export PNG', shortcut: `${cmd}E`, category: 'export', onExecute: () => handleExportPNG() },
      { id: 'export-steps', label: 'Export All Steps PNG', shortcut: `⇧${cmd}E`, category: 'export', onExecute: () => handleExportAllSteps() },
      { id: 'export-gif', label: 'Export Animated GIF', shortcut: `⇧${cmd}G`, category: 'export', onExecute: () => handleExportGIF(), disabled: stepsCount < 2 },
      { id: 'export-pdf', label: 'Export PDF (all steps)', shortcut: `⇧${cmd}P`, category: 'export', onExecute: () => handleExportPDF() },
      { id: 'export-svg', label: 'Export SVG', category: 'export', onExecute: () => handleExportSVG() },
    ];
  }, [
    addPlayerAtCursor, addBallAtCursor, addArrowAtCursor, addZoneAtCursor, addTextAtCursor,
    duplicateSelected, deleteSelected, undo, redo, selectAll,
    toggleInspector, toggleCheatSheet, toggleFocusMode, showToast,
    addStep, prevStep, nextStep, play, pause, toggleLoop,
    handleExportPNG, handleExportAllSteps, handleExportGIF, handleExportPDF, handleExportSVG,
    selectedIds.length, canUndo, canRedo, currentStepIndex, stepsCount, isPlaying, isLooping
  ]);

  return {
    handleQuickAction,
    handleElementSelect,
    handleElementDragEnd,
    handleUpdateElement,
    handleTextDoubleClick,
    handleTextEditSave,
    handleTextEditCancel,
    handlePlayerQuickEdit,
    handlePlayerNumberSave,
    handlePlayerNumberCancel,
    contextMenuActions,
    commandActions,
  };
}
