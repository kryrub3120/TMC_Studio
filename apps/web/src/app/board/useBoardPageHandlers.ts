/**
 * useBoardPageHandlers - Callbacks and handlers for BoardPage
 * Extracted from App.tsx for modularity
 */

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import type { ArrowType, Position, PlayerElement as PlayerElementType, Team, ZoneShape } from '@tmc/core';
import { isPlayerElement, isTextElement, isZoneElement, isArrowElement } from '@tmc/core';
import { useTranslation, type CommandAction } from '@tmc/ui';
import { createCommandActions } from '../../commands/commandPalette/createCommandActions';
import { useBoardStore } from '../../store';
import { useUIStore } from '../../store/useUIStore';
import { ANIMATION_ENABLED } from '../../config/featureFlags';

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
  addPlayerAtCursor: (team: Team) => void;
  addBallAtCursor: () => void;
  addArrowAtCursor: (type: ArrowType) => void;
  addZoneAtCursor: (shape?: ZoneShape) => void;
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
  toggleSelectedLock: () => void;
  lockSelected: () => void;
  unlockSelected: () => void;
  isElementLocked: (id: string) => boolean;
  createGroup: () => void;
  ungroupSelection: () => void;
  
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
  const { t } = useTranslation();
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
    toggleSelectedLock,
    lockSelected,
    unlockSelected,
    isElementLocked,
    createGroup,
    ungroupSelection,
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
  const defaultArrowType = useUIStore((s) => s.defaultArrowType);

  // Quick action handler
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'add-home-player': addPlayerAtCursor('home'); break;
      case 'add-away-player': addPlayerAtCursor('away'); break;
      case 'add-ball': addBallAtCursor(); break;
      case 'add-pass-arrow': addArrowAtCursor('pass'); break;
      case 'add-run-arrow': addArrowAtCursor('run'); break;
      case 'add-shoot-arrow': addArrowAtCursor('shoot'); break;
      case 'add-dribble-arrow': addArrowAtCursor('dribble'); break;
      case 'add-zone': addZoneAtCursor(); break;
      case 'add-ellipse-zone': addZoneAtCursor('ellipse'); break;
      case 'add-freehand-draw': useUIStore.getState().setActiveTool('drawing'); break;
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
  // I5 follow-up: replace with cmdRegistry.canvas.moveElementLive +
  // cmdRegistry.history.commitUserAction once the new canvas path is active.
  const handleElementDragEnd = useCallback(
    (id: string, position: Position) => {
      moveElementById(id, position);
      pushHistory();
    },
    [moveElementById, pushHistory]
  );

  // Update element handler
  const handleUpdateElement = useCallback(
    (updates: {
      number?: number; label?: string; showLabel?: boolean; fontSize?: number;
      textColor?: string; opacity?: number; isGoalkeeper?: boolean;
      showNumber?: boolean; arrowNumber?: number;
      // Arrow head style (PR-5) + thickness
      color?: string;
      startHead?: 'arrow' | 'none' | 'bar' | 'dot';
      endHead?: 'arrow' | 'none' | 'bar' | 'dot';
      strokeWidth?: number;
      // Zone border style (PR-4)
      borderStyle?: 'solid' | 'dashed' | 'none';
      borderColor?: string; borderWidth?: number; showCorners?: boolean;
    }) => {
      const store = useBoardStore.getState();
      if (store.selectedIds.length !== 1) return;
      const el = store.elements.find(e => e.id === store.selectedIds[0]);
      if (!el) return;

      if (isArrowElement(el as any)) {
        // Arrow style props (heads + thickness) — route to dedicated store action.
        if ('startHead' in updates || 'endHead' in updates || 'strokeWidth' in updates || 'color' in updates) {
          const patch: { startHead?: 'arrow' | 'none' | 'bar' | 'dot'; endHead?: 'arrow' | 'none' | 'bar' | 'dot'; strokeWidth?: number; color?: string } = {};
          if ('startHead' in updates) patch.startHead = updates.startHead;
          if ('endHead' in updates) patch.endHead = updates.endHead;
          if ('strokeWidth' in updates) patch.strokeWidth = updates.strokeWidth;
          if ('color' in updates) patch.color = updates.color;
          store.updateArrowStyle(el.id, patch);
          return;
        }
        // Numbering. arrowNumber ma priorytet przed showNumber.
        if ('arrowNumber' in updates) {
          store.setArrowNumber(el.id, updates.arrowNumber);
        } else if ('showNumber' in updates) {
          store.toggleArrowNumber(el.id);
        }
        return;
      }

      if (isZoneElement(el as any)) {
        // Zone border / corner style — route to dedicated store action.
        const patch: { borderStyle?: 'solid' | 'dashed' | 'none'; borderColor?: string; borderWidth?: number; showCorners?: boolean; opacity?: number } = {};
        if ('borderStyle' in updates) patch.borderStyle = updates.borderStyle;
        if ('borderColor' in updates) patch.borderColor = updates.borderColor;
        if ('borderWidth' in updates) patch.borderWidth = updates.borderWidth;
        if ('showCorners' in updates) patch.showCorners = updates.showCorners;
        if ('opacity' in updates) patch.opacity = updates.opacity;
        if (Object.keys(patch).length > 0) store.updateZoneStyle(el.id, patch);
        return;
      }

      // Player (and other player-like) elements.
      updateSelectedElement(updates as Partial<PlayerElementType>);
    },
    [updateSelectedElement]
  );

  // Save the currently-selected arrow's style as the user-level default.
  const handleSetArrowDefault = useCallback(() => {
    const store = useBoardStore.getState();
    if (store.selectedIds.length !== 1) return;
    const el = store.elements.find((e) => e.id === store.selectedIds[0]);
    if (!el || !isArrowElement(el as any)) return;
    const a = el as any;
    useUIStore.getState().setArrowDefaults({
      strokeWidth: { [a.arrowType]: a.strokeWidth ?? 4 } as any,
      color: { [a.arrowType]: a.color },
      startHead: a.startHead ?? 'none',
      endHead: a.endHead ?? 'arrow',
    });
    showToast(t('inspector.setAsDefaultDone'));
  }, [showToast, t]);

  // Save the currently-selected zone's style as the user-level default.
  const handleSetZoneDefault = useCallback(() => {
    const store = useBoardStore.getState();
    if (store.selectedIds.length !== 1) return;
    const el = store.elements.find((e) => e.id === store.selectedIds[0]);
    if (!el || !isZoneElement(el as any)) return;
    const z = el as any;
    useUIStore.getState().setZoneDefaults({
      borderStyle: z.borderStyle ?? 'none',
      borderWidth: z.borderWidth ?? 3,
      borderColor: z.borderColor,
      showCorners: z.showCorners ?? false,
      fillColor: z.fillColor,
      opacity: z.opacity,
    });
    showToast(t('inspector.setAsDefaultDone'));
  }, [showToast, t]);

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
  const handlePlayerQuickEdit = useCallback((id: string, currentNumber: number | null | undefined) => {
    setEditingPlayerId(id);
    setEditingPlayerNumber(currentNumber !== null && currentNumber !== undefined ? String(currentNumber) : '');
    selectElement(id, false);
  }, [selectElement, setEditingPlayerId, setEditingPlayerNumber]);

  const handlePlayerNumberSave = useCallback((editingPlayerId: string | null, editingPlayerNumber: string) => {
    if (editingPlayerId) {
      const trimmed = editingPlayerNumber.trim();
      
      if (!trimmed) {
        // Empty input → remove number
        selectElement(editingPlayerId, false);
        updateSelectedElement({ number: undefined });
        setEditingPlayerId(null);
        setEditingPlayerNumber('');
        return;
      }
      
      const numValue = parseInt(trimmed, 10);
      if (!isNaN(numValue) && numValue >= 1 && numValue <= 99) {
        selectElement(editingPlayerId, false);
        updateSelectedElement({ number: numValue });
        showToast(`#${numValue}`);
      }
      // Invalid input (0 or out of range) → cancel edit, keep original number
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
  
  // ALT+Drag rotation hooks
  const previewPlayerOrientationAbsolute = useBoardStore(s => s.previewPlayerOrientationAbsolute);
  const commitPlayerOrientationAbsolute = useBoardStore(s => s.commitPlayerOrientationAbsolute);

  // State to track start orientations for multi-selection rotation
  const rotationStartRef = useRef<{ clickedId: string; startOrientations: Record<string, number> } | null>(null);

  // ALT+Drag rotation handlers (with multi-selection support)
  const handleOrientationPreview = useCallback((id: string, orientation: number) => {
    // If clicked player is in selection, rotate all selected players
    if (selectedIds.includes(id) && selectedIds.length > 1) {
      // Initialize start orientations on first preview call for this rotation
      if (!rotationStartRef.current || rotationStartRef.current.clickedId !== id) {
        const startOrientations: Record<string, number> = {};
        selectedIds.forEach(selectedId => {
          const player = storeElements.find(el => el.id === selectedId);
          if (player && isPlayerElement(player)) {
            startOrientations[selectedId] = (player as any).orientation ?? 0;
          }
        });
        rotationStartRef.current = { clickedId: id, startOrientations };
      }
      
      const startOrientations = rotationStartRef.current.startOrientations;
      const clickedStartOrientation = startOrientations[id] ?? 0;
      const delta = orientation - clickedStartOrientation;
      
      // Apply same delta to all selected players
      selectedIds.forEach(selectedId => {
        const startOrientation = startOrientations[selectedId];
        if (startOrientation !== undefined) {
          const newOrientation = (startOrientation + delta + 360) % 360;
          previewPlayerOrientationAbsolute(selectedId, newOrientation);
        }
      });
    } else {
      // Single player rotation
      rotationStartRef.current = null;
      previewPlayerOrientationAbsolute(id, orientation);
    }
  }, [selectedIds, storeElements, previewPlayerOrientationAbsolute]);

  const handleOrientationCommit = useCallback((id: string, orientation: number) => {
    // If clicked player is in selection, commit all selected players
    if (selectedIds.includes(id) && selectedIds.length > 1 && rotationStartRef.current) {
      const startOrientations = rotationStartRef.current.startOrientations;
      const clickedStartOrientation = startOrientations[id] ?? 0;
      const delta = orientation - clickedStartOrientation;
      
      // Commit same delta to all selected players
      selectedIds.forEach(selectedId => {
        const startOrientation = startOrientations[selectedId];
        if (startOrientation !== undefined) {
          const newOrientation = (startOrientation + delta + 360) % 360;
          commitPlayerOrientationAbsolute(selectedId, newOrientation);
        }
      });
    } else {
      // Single player rotation
      commitPlayerOrientationAbsolute(id, orientation);
    }
    
    // Clear rotation state
    rotationStartRef.current = null;
  }, [selectedIds, commitPlayerOrientationAbsolute]);

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
    showToast(t('commands.toast.resizedTo', { percent: resizePopover.percent }));
  }, [resizePopover, commitSetPlayersRadius, showToast, t]);

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
    const selectedLocked = selected.length > 0 && selected.every((el) => isElementLocked(el!.id));
    
    return {
      onDelete: () => { deleteSelected(); hideMenu(); showToast(t('commands.toast.deleted')); },
      onDuplicate: () => { duplicateSelected(); hideMenu(); showToast(t('commands.toast.duplicated')); },
      onBringToFront: () => { hideMenu(); showToast(t('commands.toast.layerControlSoon')); },
      onSendToBack: () => { hideMenu(); showToast(t('commands.toast.layerControlSoon')); },
      onBringForward: () => { hideMenu(); showToast(t('commands.toast.layerControlSoon')); },
      onSendBackward: () => { hideMenu(); showToast(t('commands.toast.layerControlSoon')); },
      onCopy: () => { copySelection(); hideMenu(); showToast(t('commands.toast.copied')); },
      onPaste: () => { pasteClipboard(); hideMenu(); showToast(t('commands.toast.pasted')); },
      onSelectAll: () => { selectAll(); hideMenu(); },
      onAddPlayer: () => { addPlayerAtCursor('home'); hideMenu(); showToast(t('commands.toast.playerAdded')); },
      onAddPlayerTeam1: () => { addPlayerAtCursor('home'); hideMenu(); showToast(t('commands.toast.team1Player')); },
      onAddPlayerTeam2: () => { addPlayerAtCursor('away'); hideMenu(); showToast(t('commands.toast.team2Player')); },
      onAddPlayerTeam3: () => { addPlayerAtCursor('team3'); hideMenu(); showToast(t('commands.toast.team3Player')); },
      onAddPlayerTeam4: () => { addPlayerAtCursor('team4'); hideMenu(); showToast(t('commands.toast.team4Player')); },
      onAddBall: () => { addBallAtCursor(); hideMenu(); showToast(t('commands.toast.ballAdded')); },
      onAddArrow: () => { addArrowAtCursor(defaultArrowType); hideMenu(); showToast(t('commands.toast.arrowAdded')); },
      onAddZone: () => { addZoneAtCursor(); hideMenu(); showToast(t('commands.toast.zoneAdded')); },
      onGroupSelected: () => { createGroup(); hideMenu(); showToast(t('commands.toast.groupCreated')); },
      onUngroupSelected: () => { ungroupSelection(); hideMenu(); showToast(t('commands.toast.groupUngrouped')); },
      onToggleLock: () => { toggleSelectedLock(); hideMenu(); showToast(t('commands.toast.selectionLockToggled')); },
      onLockSelected: () => { lockSelected(); hideMenu(); showToast(t('commands.toast.selectionLocked')); },
      onUnlockSelected: () => { unlockSelected(); hideMenu(); showToast(t('commands.toast.selectionUnlocked')); },
      isSelectedLocked: selectedLocked,
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
        showToast(t('commands.toast.colorChanged'));
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
          showToast(t('commands.toast.switchedTeam', { team: newTeam }));
        }
        hideMenu();
      },
      onChangePlayerColor: () => {
        cycleSelectedColor(1);
        hideMenu();
        showToast(t('commands.toast.playerColorChanged'));
      },
      onChangeTextColor: () => {
        cycleSelectedColor(1);
        hideMenu();
        showToast(t('commands.toast.textColorChanged'));
      },
      onEditArrowNumber: () => {
        // PR-ARROW-NUMBER: Simply toggle numbering via Smart Sequencing — no prompt
        const store = useBoardStore.getState();
        if (menuElementId) store.toggleArrowNumber(menuElementId);
        hideMenu();
      },
      onRenumberArrows: () => {
        useBoardStore.getState().renumberAllArrowsWithHistory();
        showToast(t('inspector.renumber'));
        hideMenu();
      },
      onToggleAutoNumbering: () => {
        useBoardStore.getState().toggleAutoNumbering();
        const isOn = useBoardStore.getState().isAutoNumbering;
        showToast(isOn ? t('commands.toast.autoNumberingOn') : t('commands.toast.autoNumberingOff'));
        hideMenu();
      },
      get isAutoNumbering() { return useBoardStore.getState().isAutoNumbering; },
    };
  }, [
    deleteSelected, duplicateSelected, copySelection, pasteClipboard, selectAll,
    addPlayerAtCursor, addBallAtCursor, addArrowAtCursor, addZoneAtCursor,
    createGroup, ungroupSelection, pushHistory, toggleSelectedLock, lockSelected, unlockSelected, isElementLocked,
    cyclePlayerShape, cycleZoneShape, cycleSelectedColor,
    elements, menuElementId, hideMenu, showToast, selectElement, updateSelectedElement,
    setEditingTextId, setEditingTextValue, handlePlayerQuickEdit, selectedIds, openResizePopover, defaultArrowType, t
  ]);

  // Command palette actions
  const commandActions: CommandAction[] = useMemo(() => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
    const toggleGridWithToast = () => {
      useUIStore.getState().toggleGrid();
      showToast(useUIStore.getState().gridVisible ? t('commands.toast.gridVisible') : t('commands.toast.gridHidden'));
    };
    return createCommandActions({
      isMac,
      addHomePlayer: () => addPlayerAtCursor('home'),
      addAwayPlayer: () => addPlayerAtCursor('away'),
      addTeam3Player: () => addPlayerAtCursor('team3'),
      addTeam4Player: () => addPlayerAtCursor('team4'),
      addBall: addBallAtCursor,
      addPassArrow: () => addArrowAtCursor('pass'),
      addRunArrow: () => addArrowAtCursor('run'),
      addShootArrow: () => addArrowAtCursor('shoot'),
      addDribbleArrow: () => addArrowAtCursor('dribble'),
      addZone: addZoneAtCursor,
      addEllipseZone: () => addZoneAtCursor('ellipse'),
      addText: addTextAtCursor,
      duplicateSelected,
      deleteSelected,
      undo,
      redo,
      selectAll,
      clearSelection: () => {},
      toggleInspector,
      toggleCheatSheet,
      toggleGrid: toggleGridWithToast,
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
      animationEnabled: ANIMATION_ENABLED,
      t,
    });
  }, [
    t,
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
    // ALT+Drag rotation exports
    handleOrientationPreview,
    handleOrientationCommit,
    handleSetArrowDefault,
    handleSetZoneDefault,
  };
}
