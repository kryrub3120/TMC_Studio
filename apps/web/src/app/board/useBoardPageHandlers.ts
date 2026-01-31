/**
 * useBoardPageHandlers - Callbacks and handlers for BoardPage
 * Extracted from App.tsx for modularity
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import type { Position, PlayerElement as PlayerElementType } from '@tmc/core';
import { isPlayerElement, isTextElement, isZoneElement } from '@tmc/core';
import type { CommandAction } from '@tmc/ui';
import { createCommandActions } from '../../commands/commandPalette/createCommandActions';
import { useBoardStore } from '../../store';

// B5: Resize popover state
type ResizePopoverState = {
  open: boolean;
  anchor: { x: number; y: number };
  ids: string[];
  startRadiiById: Record<string, number | undefined>;
  startPercent: number;
  percent: number;
  isMixed: boolean;
  hasChanged: boolean;
};

// B5: Helper constants & functions
const PLAYER_RADIUS = 18;
const clampPercent = (p: number) => Math.max(40, Math.min(250, p));
const radiusFromPercent = (p: number) => (PLAYER_RADIUS * p) / 100;
const percentFromRadius = (r: number) => Math.round((r / PLAYER_RADIUS) * 100);
const effectiveRadius = (r?: number) => r ?? PLAYER_RADIUS;
const q = (x: number) => Math.round(x * 1000); // float-safe quantize

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

  // B5: Resize popover state & store hooks
  const [resizePopover, setResizePopover] = useState<ResizePopoverState | null>(null);
  const storeElements = useBoardStore(s => s.elements);
  const previewSetPlayersRadius = useBoardStore(s => s.previewSetPlayersRadius);
  const commitSetPlayersRadius = useBoardStore(s => s.commitSetPlayersRadius);
  const previewResetPlayersRadius = useBoardStore(s => s.previewResetPlayersRadius);

  // B5: Open resize popover
  const openResizePopover = useCallback((ids: string[], anchor: { x: number; y: number }) => {
    const players = ids
      .map(id => storeElements.find(e => e.id === id))
      .filter((e): e is any => !!e && isPlayerElement(e));

    if (players.length === 0) return;

    const startRadiiById: Record<string, number | undefined> = {};
    players.forEach(p => (startRadiiById[p.id] = (p as any).radius));

    const radii = players.map(p => effectiveRadius((p as any).radius));
    const isMixed = new Set(radii.map(q)).size > 1;

    const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;
    const startPercent = clampPercent(percentFromRadius(avgRadius));

    setResizePopover({
      open: true,
      anchor,
      ids: players.map(p => p.id),
      startRadiiById,
      startPercent,
      percent: startPercent,
      isMixed,
      hasChanged: false,
    });
  }, [storeElements]);

  // B5: Preview resize (drag slider)
  const previewResize = useCallback((nextPercent: number) => {
    if (!resizePopover) return;
    const percent = clampPercent(nextPercent);
    const newRadius = radiusFromPercent(percent);

    setResizePopover(s => s ? { ...s, percent, hasChanged: true, isMixed: false } : s);
    previewSetPlayersRadius(resizePopover.ids, newRadius);
  }, [resizePopover, previewSetPlayersRadius]);

  // B5: Commit resize
  const commitResize = useCallback(() => {
    if (!resizePopover || !resizePopover.hasChanged) {
      setResizePopover(null);
      return;
    }

    const finalRadius = radiusFromPercent(resizePopover.percent);
    commitSetPlayersRadius(resizePopover.ids, finalRadius);
    setResizePopover(null);
    showToast(`Resized to ${resizePopover.percent}%`);
  }, [resizePopover, commitSetPlayersRadius, showToast]);

  // B5: Preview reset
  const previewReset = useCallback(() => {
    if (!resizePopover) return;
    setResizePopover(s => s ? { ...s, percent: 100, hasChanged: true, isMixed: false } : s);
    previewResetPlayersRadius(resizePopover.ids);
  }, [resizePopover, previewResetPlayersRadius]);

  // B5: Cancel resize (revert to snapshot)
  const cancelResize = useCallback(() => {
    if (!resizePopover) return;

    // Revert each element to exact original radius
    for (const id of resizePopover.ids) {
      const r = resizePopover.startRadiiById[id];
      if (r == null) {
        previewResetPlayersRadius([id]);
      } else {
        previewSetPlayersRadius([id], r);
      }
    }

    setResizePopover(null);
  }, [resizePopover, previewSetPlayersRadius, previewResetPlayersRadius]);

  // B5: Keyboard handlers (Esc/Enter)
  useEffect(() => {
    if (!resizePopover?.open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelResize();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        commitResize();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [resizePopover?.open, cancelResize, commitResize]);

  // Context menu actions
  const contextMenuActions = useMemo(() => {
    // B5: Check if selection is players-only for resize gating
    const selected = selectedIds.map(id => elements.find(e => e.id === id)).filter(Boolean);
    const onlyPlayers = selected.length > 0 && selected.every(el => isPlayerElement(el as any));
    
    return {
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
      // B5: Resize handler - only provided when players-only selected
      ...(onlyPlayers && {
        onResize: (e?: React.MouseEvent) => {
          const anchor = e ? { x: e.clientX, y: e.clientY } : { x: 400, y: 300 };
          openResizePopover(selectedIds, anchor);
          hideMenu();
        },
      }),
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
      onChangePlayerColor: () => {
        cycleSelectedColor(1);
        hideMenu();
        showToast('Player color changed (use Alt+↓/↑ to cycle)');
      },
      onChangeTextColor: () => {
        cycleSelectedColor(1);
        hideMenu();
        showToast('Text color changed (use Alt+↓/↑ to cycle)');
      },
    };
  }, [
    deleteSelected, duplicateSelected, copySelection, pasteClipboard, selectAll,
    addPlayerAtCursor, addBallAtCursor, addArrowAtCursor, addZoneAtCursor,
    cyclePlayerShape, cycleZoneShape, cycleSelectedColor,
    elements, menuElementId, hideMenu, showToast, selectElement, updateSelectedElement,
    setEditingTextId, setEditingTextValue, handlePlayerQuickEdit, selectedIds, openResizePopover
  ]);

  // Command palette actions
  const commandActions: CommandAction[] = useMemo(() => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
    
    return createCommandActions({
      isMac,
      addHomePlayer: () => addPlayerAtCursor('home'),
      addAwayPlayer: () => addPlayerAtCursor('away'),
      addBall: addBallAtCursor,
      addPassArrow: () => addArrowAtCursor('pass'),
      addRunArrow: () => addArrowAtCursor('run'),
      addZone: addZoneAtCursor,
      addText: addTextAtCursor,
      duplicateSelected,
      deleteSelected,
      undo,
      redo,
      selectAll,
      clearSelection: () => {},
      toggleInspector,
      toggleCheatSheet,
      toggleFocusMode,
      showToast,
      addStepWithGating: addStep,
      prevStep,
      nextStep,
      play,
      pause,
      toggleLoop,
      exportPNG: handleExportPNG,
      exportAllStepsPNG: handleExportAllSteps,
      exportGIF: handleExportGIF,
      exportPDF: handleExportPDF,
      exportSVG: handleExportSVG,
      selectedCount: selectedIds.length,
      canUndo,
      canRedo,
      currentStepIndex,
      stepsCount,
      isPlaying,
      isLooping,
    });
  }, [
    addPlayerAtCursor,
    addBallAtCursor,
    addArrowAtCursor,
    addZoneAtCursor,
    addTextAtCursor,
    duplicateSelected,
    deleteSelected,
    undo,
    redo,
    selectAll,
    toggleInspector,
    toggleCheatSheet,
    toggleFocusMode,
    showToast,
    addStep,
    prevStep,
    nextStep,
    play,
    pause,
    toggleLoop,
    handleExportPNG,
    handleExportAllSteps,
    handleExportGIF,
    handleExportPDF,
    handleExportSVG,
    selectedIds.length,
    canUndo,
    canRedo,
    currentStepIndex,
    stepsCount,
    isPlaying,
    isLooping,
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
    // B5: Resize popover exports
    resizePopover,
    previewResize,
    commitResize,
    previewReset,
    cancelResize,
  };
}
