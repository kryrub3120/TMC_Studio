/**
 * useBoardPageState - All state and store access for BoardPage
 * Extracted from App.tsx for modularity
 */

import { useCallback, useRef, useMemo, useEffect } from 'react';
import type Konva from 'konva';
import { DEFAULT_PITCH_SETTINGS, DEFAULT_PLAYER_ORIENTATION_SETTINGS, getPitchDimensions, isPlayerElement, isArrowElement, isZoneElement, hasPosition } from '@tmc/core';
import { useTranslation, type InspectorElement, type ElementInList, type SettingsTab } from '@tmc/ui';
import { useBoardStore } from '../../store';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore, useInitializeTheme } from '../../store/useUIStore';
import { useEntitlements, useExportController, useCanvasEventsController, useDrawingController, useCanvasInteraction, useKeyboardShortcuts } from '../../hooks';
import { useCanvasContextMenu } from '../../hooks/useCanvasContextMenu';
import { useTextEditController } from '../../hooks/useTextEditController';

// Feature flag for new canvas architecture
const USE_NEW_CANVAS = false;

export interface BoardPageProps {
  onOpenProjectsDrawer: () => void;
  onCloseProjectsDrawer: () => void;
  onCloseSettingsModal: () => void;
  onOpenAuthModal: () => void;
  onOpenSettingsModal: (tab?: SettingsTab) => void;
  onOpenPricingModal: () => void;
  onOpenLimitModal: (type: 'guest-step' | 'guest-project' | 'free-step' | 'free-project', current: number, max: number) => void;
  onRenameProject: (newName: string) => void;
  /** App version (package.json) shown in the bottom bar's compact footer row */
  appVersion?: string;
  /** Navigate to a legal page (privacy/terms/cookies) from the bottom bar's footer links */
  onNavigateFooter?: (path: string) => void;
}

export function useBoardPageState(props: BoardPageProps) {
  const { onOpenLimitModal, onOpenPricingModal } = props;
  const { t } = useTranslation();

  const stageRef = useRef<Konva.Stage>(null);

  // ─── Label input ref and callback for Enter→focus (Sprint A) ─────
  const labelInputRef = useRef<HTMLInputElement>(null);
  const onFocusLabelInput = useCallback(() => {
    labelInputRef.current?.focus();
  }, []);

  // Auth store
  const authUser = useAuthStore((s) => s.user);
  const authIsAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authIsPro = useAuthStore((s) => s.isPro);
  const signOut = useAuthStore((s) => s.signOut);
  // DEV-ONLY: see useAuthStore.devLogin
  const devLogin = useAuthStore((s) => s.devLogin);
  // DEV-ONLY: see useAuthStore.devClearData
  const devClearData = useAuthStore((s) => s.devClearData);

  // Entitlements
  const { can, plan } = useEntitlements();

  // Initialize theme
  useInitializeTheme();

  // Pozyskane wcześnie, by efekt post-mount mógł spełnić exhaustive-deps
  const setInspectorOpen = useUIStore((s) => s.setInspectorOpen);

  // Post-mount inspector correction (Hard Rule B)
  useEffect(() => {
    const stored = localStorage.getItem('tmc-ui-settings');
    const hasPreference = stored?.includes('inspectorOpen');
    if (!hasPreference) {
      const shouldBeOpen = window.innerWidth >= 1280;
      setInspectorOpen(shouldBeOpen);
    }
  }, [setInspectorOpen]);

  // Board store state
  const elements = useBoardStore((s) => s.elements);
  const selectedIds = useBoardStore((s) => s.selectedIds);
  const boardDoc = useBoardStore((s) => s.document);
  // Reaktywne selektory pól (zamiast wywoływania getterów w renderze)
  const teamSettings = useBoardStore((s) => s.document.teamSettings);
  const pitchSettings = useBoardStore((s) => s.document.pitchSettings);
  const playerOrientationSettingsRaw = useBoardStore((s) => s.document.playerOrientationSettings); // PR3
  const updatePitchSettings = useBoardStore((s) => s.updatePitchSettings);
  const updatePlayerOrientationSettings = useBoardStore((s) => s.updatePlayerOrientationSettings); // PR4

  // Board store actions
  const addPlayerAtCursor = useBoardStore((s) => s.addPlayerAtCursor);
  const addPlayerFromSquad = useBoardStore((s) => s.addPlayerFromSquad);
  const addBallAtCursor = useBoardStore((s) => s.addBallAtCursor);
  const addBallGroupAtCursor = useBoardStore((s) => s.addBallGroupAtCursor);
  const addArrowAtCursor = useBoardStore((s) => s.addArrowAtCursor);
  const addEquipmentAtCursor = useBoardStore((s) => s.addEquipmentAtCursor);
  const addZoneAtCursor = useBoardStore((s) => s.addZoneAtCursor);
  const addTextAtCursor = useBoardStore((s) => s.addTextAtCursor);
  const moveElementById = useBoardStore((s) => s.moveElementById);
  const resizeZone = useBoardStore((s) => s.resizeZone);
  const updateZonePoints = useBoardStore((s) => s.updateZonePoints);
  const setEquipmentScale = useBoardStore((s) => s.setEquipmentScale);
  const selectElement = useBoardStore((s) => s.selectElement);
  const clearSelection = useBoardStore((s) => s.clearSelection);
  const deleteSelected = useBoardStore((s) => s.deleteSelected);
  const duplicateSelected = useBoardStore((s) => s.duplicateSelected);
  const copySelection = useBoardStore((s) => s.copySelection);
  const pasteClipboard = useBoardStore((s) => s.pasteClipboard);
  const updateSelectedElement = useBoardStore((s) => s.updateSelectedElement);
  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);
  const isAutoNumbering = useBoardStore((s) => s.isAutoNumbering); // PR-ARROW-NUMBER
  // Reaktywne selektory wartości (re-render przy zmianie historii)
  const canUndo = useBoardStore((s) => s.historyIndex > 0);
  const canRedo = useBoardStore((s) => s.historyIndex < s.history.length - 1);
  const pushHistory = useBoardStore((s) => s.pushHistory);
  const selectAll = useBoardStore((s) => s.selectAll);
  const cycleSelectedColor = useBoardStore((s) => s.cycleSelectedColor);
  const cyclePlayerShape = useBoardStore((s) => s.cyclePlayerShape);
  const cycleZoneShape = useBoardStore((s) => s.cycleZoneShape);
  const toggleSelectedLock = useBoardStore((s) => s.toggleSelectedLock);
  const lockSelected = useBoardStore((s) => s.lockSelected);
  const unlockSelected = useBoardStore((s) => s.unlockSelected);
  const isElementLocked = useBoardStore((s) => s.isElementLocked);
  const createGroup = useBoardStore((s) => s.createGroup);
  const ungroupSelection = useBoardStore((s) => s.ungroupSelection);
  const updateArrowEndpoint = useBoardStore((s) => s.updateArrowEndpoint);
  const groups = useBoardStore((s) => s.groups);
  const selectGroup = useBoardStore((s) => s.selectGroup);
  const toggleGroupLock = useBoardStore((s) => s.toggleGroupLock);
  const toggleGroupVisibility = useBoardStore((s) => s.toggleGroupVisibility);
  const renameGroup = useBoardStore((s) => s.renameGroup);
  const updateTeamSettings = useBoardStore((s) => s.updateTeamSettings);
  const updateTextContent = useBoardStore((s) => s.updateTextContent);
  const addSquadPlayer = useBoardStore((s) => s.addSquadPlayer);
  const removeSquadPlayer = useBoardStore((s) => s.removeSquadPlayer);
  const setSquadVisible = useBoardStore((s) => s.setSquadVisible);
  const toggleSquadVisible = useBoardStore((s) => s.toggleSquadVisible);

  // Cloud/step actions
  const cloudProjectId = useBoardStore((s) => s.cloudProjectId);
  const isSaving = useBoardStore((s) => s.isSaving);
  const currentStepIndex = useBoardStore((s) => s.currentStepIndex);
  const addStepRaw = useBoardStore((s) => s.addStep);
  const removeStep = useBoardStore((s) => s.removeStep);
  const renameStep = useBoardStore((s) => s.renameStep);
  const goToStep = useBoardStore((s) => s.goToStep);
  const nextStep = useBoardStore((s) => s.nextStep);
  const prevStep = useBoardStore((s) => s.prevStep);

  // UI store state
  const theme = useUIStore((s) => s.theme);
  const focusMode = useUIStore((s) => s.focusMode);
  const inspectorOpen = useUIStore((s) => s.inspectorOpen);
  const inspectorWidth = useUIStore((s) => s.inspectorWidth);
  const setInspectorWidth = useUIStore((s) => s.setInspectorWidth);
  const cheatSheetVisible = useUIStore((s) => s.cheatSheetVisible);
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const activeToast = useUIStore((s) => s.activeToast);
  const layerVisibility = useUIStore((s) => s.layerVisibility);
  const zoom = useUIStore((s) => s.zoom);
  const viewportLocked = useUIStore((s) => s.viewportLocked); // ETAP 4
  const hasSeenShortcutsHint = useUIStore((s) => s.hasSeenShortcutsHint);
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const gridVisible = useUIStore((s) => s.gridVisible);
  const gridSize = useUIStore((s) => s.gridSize);
  const defaultArrowType = useUIStore((s) => s.defaultArrowType);
  const isPrintMode = useUIStore((s) => s.isPrintMode);
  const isOnline = useUIStore((s) => s.isOnline);
  const breakpoint = useUIStore((s) => s.breakpoint);
  const bottomBarHeight = useUIStore((s) => s.bottomBarHeight);
  const bottomBarCollapsed = useUIStore((s) => s.bottomBarCollapsed);

  // UI store actions
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);
  const toggleInspector = useUIStore((s) => s.toggleInspector);
  const toggleCheatSheet = useUIStore((s) => s.toggleCheatSheet);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const closeCommandPalette = useUIStore((s) => s.closeCommandPalette);
  const showToast = useUIStore((s) => s.showToast);
  const toggleLayerVisibility = useUIStore((s) => s.toggleLayerVisibility);
  const setBottomBarHeight = useUIStore((s) => s.setBottomBarHeight);
  const toggleBottomBarCollapsed = useUIStore((s) => s.toggleBottomBarCollapsed);
  const zoomIn = useUIStore((s) => s.zoomIn);
  const zoomOut = useUIStore((s) => s.zoomOut);
  const zoomFit = useUIStore((s) => s.zoomFit);
  const setHasSeenShortcutsHint = useUIStore((s) => s.setHasSeenShortcutsHint);
  const setCheatSheetVisible = useUIStore((s) => s.setCheatSheetVisible);
  const togglePrintMode = useUIStore((s) => s.togglePrintMode);
  const toggleViewportLock = useUIStore((s) => s.toggleViewportLock); // ETAP 4
  const helpSidebarOpen = useUIStore((s) => s.helpSidebarOpen);
  const setHelpSidebarOpen = useUIStore((s) => s.setHelpSidebarOpen);
  const toggleHelpSidebar = useUIStore((s) => s.toggleHelpSidebar);
  const projectSaveStatus = useUIStore((s) => s.projectSaveStatus);
  const tutorialCompleted = useUIStore((s) => s.tutorialCompleted);
  const tutorialForceVisible = useUIStore((s) => s.tutorialForceVisible);
  const setTutorialCompleted = useUIStore((s) => s.setTutorialCompleted);
  const setShowTutorial = useUIStore((s) => s.setShowTutorial);
  const showTutorial = useUIStore((s) => s.showTutorial);
  const replayTutorial = useUIStore((s) => s.replayTutorial);

  // Playback state
  const isPlaying = useUIStore((s) => s.isPlaying);
  const isLooping = useUIStore((s) => s.isLooping);
  const stepDuration = useUIStore((s) => s.stepDuration);
  const animationProgress = useUIStore((s) => s.animationProgress);
  const play = useUIStore((s) => s.play);
  const pause = useUIStore((s) => s.pause);
  const toggleLoop = useUIStore((s) => s.toggleLoop);
  const setStepDuration = useUIStore((s) => s.setStepDuration);
  const setAnimationProgress = useUIStore((s) => s.setAnimationProgress);

  // Normalizacja orientacji (kontrakt: showVision musi być jawnym boolean; undefined => false)
  const playerOrientationSettings = useMemo(() => {
    const settings = playerOrientationSettingsRaw ?? DEFAULT_PLAYER_ORIENTATION_SETTINGS;
    return settings.showVision === undefined
      ? { ...settings, showVision: false }
      : settings;
  }, [playerOrientationSettingsRaw]);

  // Derived state (reaktywne — liczone z elements/selectedIds zamiast getterów w renderze)
  const selectedElement = useMemo(() => {
    if (selectedIds.length !== 1) return undefined;
    return elements.find((el) => el.id === selectedIds[0]);
  }, [elements, selectedIds]);

  // Save status: not dirty = saved (regardless of isSaving state)
  const isDirty = useBoardStore((s) => s.isDirty);
  const isSaved = !isDirty;

  // Hidden by group
  const hiddenByGroup = useMemo(() => {
    const hidden = new Set<string>();
    for (const g of groups) {
      if (!g.visible) {
        g.memberIds.forEach((id) => hidden.add(id));
      }
    }
    return hidden;
  }, [groups]);

  // Pitch config
  const pitchConfig = useMemo(() => ({
    ...getPitchDimensions(
      pitchSettings?.orientation ?? 'landscape',
      pitchSettings?.view ?? 'full',
    ),
    gridSize,
  }), [gridSize, pitchSettings?.orientation, pitchSettings?.view]);

  const canvasWidth = pitchConfig.width + pitchConfig.padding * 2;
  const canvasHeight = pitchConfig.height + pitchConfig.padding * 2;

  // Export controller
  const exportController = useExportController({
    stageRef,
    canvasWidth,
    canvasHeight,
    onOpenPricingModal,
  });

  // Steps data (liczone bezpośrednio z boardDoc.steps — jedno źródło prawdy)
  const stepsData = useMemo(() => {
    return boardDoc.steps.map((step, index) => ({
      id: step.id,
      label: step.name ?? `Step ${index + 1}`,
      index,
    }));
  }, [boardDoc.steps]);

  // Gated step addition
  const addStep = useCallback(() => {
    const stepCount = boardDoc.steps.length;
    const canAddStep = can('addStep', { stepCount });

    if (!authIsAuthenticated && canAddStep === 'hard-block') {
      onOpenLimitModal('guest-step', stepCount, 5);
      return;
    }

    if (authIsAuthenticated && !authIsPro && canAddStep === 'hard-block') {
      onOpenLimitModal('free-step', stepCount, 10);
      return;
    }

    if (authIsAuthenticated && !authIsPro && canAddStep === 'soft-prompt') {
      showToast(t('commands.toast.stepLimitFree', { count: stepCount }));
    }

    addStepRaw();
  }, [can, authIsAuthenticated, authIsPro, boardDoc.steps.length, addStepRaw, showToast, onOpenLimitModal, t]);

  // Inspector element
  const inspectorElement: InspectorElement | undefined = useMemo(() => {
    if (!selectedElement) return undefined;

    // Zone first — ZoneElement has `position`, so it would otherwise be
    // captured by the hasPosition() branch and lose its border/corner props.
    if (isZoneElement(selectedElement)) {
      return {
        id: selectedElement.id,
        type: 'zone' as const,
        x: selectedElement.position.x,
        y: selectedElement.position.y,
        locked: selectedElement.locked === true,
        opacity: selectedElement.opacity,
        borderStyle: selectedElement.borderStyle,
        borderColor: selectedElement.borderColor,
        borderWidth: selectedElement.borderWidth,
        showCorners: selectedElement.showCorners,
      } satisfies InspectorElement as InspectorElement;
    }

    if (hasPosition(selectedElement)) {
      return {
        id: selectedElement.id,
        type: selectedElement.type as 'player' | 'ball',
        team: isPlayerElement(selectedElement) ? selectedElement.team : undefined,
        number: isPlayerElement(selectedElement) ? selectedElement.number : undefined,
        label: isPlayerElement(selectedElement) ? selectedElement.label : undefined,
        showLabel: isPlayerElement(selectedElement) ? selectedElement.showLabel : undefined,
        fontSize: isPlayerElement(selectedElement) ? selectedElement.fontSize : undefined,
        textColor: isPlayerElement(selectedElement) ? selectedElement.textColor : undefined,
        opacity: isPlayerElement(selectedElement) ? selectedElement.opacity : undefined,
        locked: selectedElement.locked === true,
        x: selectedElement.position.x,
        y: selectedElement.position.y,
      };
    }

    if (isArrowElement(selectedElement)) {
      return {
        id: selectedElement.id,
        type: 'arrow' as const,
        x: selectedElement.startPoint.x,
        y: selectedElement.startPoint.y,
        locked: selectedElement.locked === true,
        showNumber: selectedElement.showNumber,
        arrowNumber: selectedElement.number,
        color: selectedElement.color,
        startHead: selectedElement.startHead,
        endHead: selectedElement.endHead,
        strokeWidth: selectedElement.strokeWidth,
        arrowType: selectedElement.arrowType,
      } satisfies InspectorElement as InspectorElement;
    }

    return undefined;
  }, [selectedElement]);

  // Elements list
  const elementsList: ElementInList[] = useMemo(() => {
    return elements.map((el) => ({
      id: el.id,
      type: el.type,
      team: isPlayerElement(el) ? el.team : undefined,
      label: isPlayerElement(el)
        ? `${el.team === 'home' ? 'Home' : 'Away'} #${el.number}`
        : 'Ball',
    }));
  }, [elements]);

  // Canvas events controller
  const canvasEventsController = useCanvasEventsController({
    elements,
    selectedIds,
    activeTool,
    isPlaying,
    isElementLocked,
    clearSelection,
    updateArrowEndpoint,
    stageRef,
  });

  // Drawing controller
  const drawingController = useDrawingController();

  // Canvas interaction (new architecture)
  const canvasInteraction = useCanvasInteraction();
  const activeCanvasInteraction = USE_NEW_CANVAS ? canvasInteraction : null;

  // Context menu
  const contextMenu = useCanvasContextMenu();

  // Text edit controller (new hook with overlay positioning)
  const editOverlay = useTextEditController({
    elements,
    getZoom: () => zoom,
    getCanvasRect: () => ({ width: canvasWidth, height: canvasHeight }),
    onUpdateText: updateTextContent,
    onUpdatePlayerNumber: (id: string, number: number) => {
      selectElement(id, false);
      // 0 signals removal → convert to undefined
      updateSelectedElement({ number: number === 0 ? undefined : number });
    },
    onSelectElement: (id: string) => selectElement(id, false),
    onToast: showToast,
  });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    handleExportPNG: exportController.exportPNG,
    handleExportAllSteps: exportController.exportAllSteps,
    handleExportPDF: exportController.exportPDF,
    handleExportGIF: exportController.exportGIF,
    showToast,
    onStartEditingText: editOverlay.text.start,
    onFocusLabelInput,
    addStep,
    onOpenPricingModal, // PR3
    onOpenProjectsDrawer: props.onOpenProjectsDrawer,
    contextMenuVisible: contextMenu.menuState.visible,
    stageRef,
  });

  // NOTE: Handler functions (handleQuickAction, handleElementSelect,
  // handleElementDragEnd, handleUpdateElement, handleTextDoubleClick,
  // handleTextEditSave, handlePlayerQuickEdit, handlePlayerNumberSave)
  // were removed from this file in I5. BoardPage now uses
  // useBoardPageHandlers as the single source of truth for all handlers.

  return {
    t,

    // Refs
    stageRef,
    labelInputRef,

    // Feature flags
    USE_NEW_CANVAS,

    // Auth
    authUser,
    authIsAuthenticated,
    authIsPro,
    plan, // for role-aware tutorial
    signOut,
    devLogin,
    devClearData,

    // Board state
    elements,
    selectedIds,
    boardDoc,
    teamSettings,
    pitchSettings: pitchSettings ?? DEFAULT_PITCH_SETTINGS,
    playerOrientationSettings, // PR3
    groups,
    hiddenByGroup,
    cloudProjectId,
    isSaving,

    // Board actions
    addPlayerAtCursor,
    addPlayerFromSquad,
    addBallAtCursor,
    addBallGroupAtCursor,
    addArrowAtCursor,
    addEquipmentAtCursor,
    addZoneAtCursor,
    addTextAtCursor,
    selectElement,
    clearSelection,
    deleteSelected,
    duplicateSelected,
    copySelection,
    pasteClipboard,
    updateSelectedElement,
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
    updateArrowEndpoint,
    resizeZone,
    updateZonePoints,
    setEquipmentScale,
    moveElementById,
    pushHistory,
    updatePitchSettings,
    updatePlayerOrientationSettings, // PR4
    updateTeamSettings,
    selectGroup,
    toggleGroupLock,
    toggleGroupVisibility,
    renameGroup,
    updateTextContent,

    // Steps
    currentStepIndex,
    stepsData,
    addStep,
    removeStep,
    renameStep,
    goToStep,
    nextStep,
    prevStep,

    // Callbacks (Sprint A)
    onFocusLabelInput,

    // UI state
    theme,
    focusMode,
    inspectorOpen,
    inspectorWidth,
    setInspectorWidth,
    cheatSheetVisible,
    commandPaletteOpen,
    activeToast,
    layerVisibility,
    zoom,
    effectiveZoom: zoom,
    hasSeenShortcutsHint,
    activeTool,
    setActiveTool,
    gridVisible,
    gridSize,
    defaultArrowType,
    isPrintMode,
    bottomBarHeight,
    bottomBarCollapsed,
    setBottomBarHeight,
    toggleBottomBarCollapsed,
    isOnline,
    breakpoint,

    // UI actions
    toggleTheme,
    toggleFocusMode,
    toggleInspector,
    toggleCheatSheet,
    openCommandPalette,
    closeCommandPalette,
    showToast,
    toggleLayerVisibility,
    zoomIn,
    zoomOut,
    zoomFit,
    setHasSeenShortcutsHint,
    setCheatSheetVisible,
    togglePrintMode,
    viewportLocked, // ETAP 4
    toggleViewportLock, // ETAP 4
    setInspectorOpen,
    helpSidebarOpen, // Sprint E
    setHelpSidebarOpen,
    toggleHelpSidebar,
    projectSaveStatus,
    tutorialCompleted,
    tutorialForceVisible,
    setTutorialCompleted,
    showTutorial,
    setShowTutorial,
    replayTutorial,

    // Playback
    isPlaying,
    isLooping,
    stepDuration,
    animationProgress,
    play,
    pause,
    toggleLoop,
    setStepDuration,
    setAnimationProgress,

    // Derived
    selectedElement,
    canUndo,
    canRedo,
    isSaved,
    inspectorElement,
    elementsList,
    isAutoNumbering, // PR-ARROW-NUMBER

    // Canvas
    pitchConfig,
    canvasWidth,
    canvasHeight,

    // Controllers
    exportController,
    canvasEventsController,
    drawingController,
    activeCanvasInteraction,
    contextMenu,
    editOverlay,

    // Text editing (from controller)
    editingTextId: editOverlay.text.editingId,
    editingTextValue: editOverlay.text.value,
    setEditingTextId: (id: string | null) => id ? editOverlay.text.start(id) : editOverlay.text.cancel(),
    setEditingTextValue: editOverlay.text.setValue,
    editingTextElement: editOverlay.text.element,

    // Player editing (from controller)
    editingPlayerId: editOverlay.player.editingId,
    editingPlayerNumber: editOverlay.player.value,
    setEditingPlayerId: (id: string | null) => id ? editOverlay.player.start(id) : editOverlay.player.cancel(),
    setEditingPlayerNumber: editOverlay.player.setValue,
    editingPlayerElement: editOverlay.player.element,

    // Squad bench
    squad: boardDoc.squad ?? [],
    squadVisible: boardDoc.squadVisible ?? false,
    addSquadPlayer,
    removeSquadPlayer,
    setSquadVisible,
    toggleSquadVisible,
  };
}
