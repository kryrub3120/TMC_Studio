/**
 * TMC Studio - Main App Component
 * VS Code-like command-palette-first tactical board
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { DEFAULT_PITCH_SETTINGS, getPitchDimensions, isPlayerElement, isBallElement, isArrowElement, isZoneElement, isTextElement, isDrawingElement, isEquipmentElement, hasPosition } from '@tmc/core';
import type { Position, PlayerElement as PlayerElementType, EquipmentElement } from '@tmc/core';
import { Pitch, PlayerNode, BallNode, ArrowNode, ZoneNode, TextNode, ArrowPreview, ZonePreview, SelectionBox, DrawingNode, EquipmentNode } from '@tmc/board';
import { Line } from 'react-konva';
import { useState, useEffect as useEffectReact } from 'react';
import {
  TopBar,
  RightInspector,
  BottomStepsBar,
  CommandPaletteModal,
  CheatSheetOverlay,
  ToastHint,
  ZoomWidget,
  AuthModal,
  PricingModal,
  WelcomeOverlay,
  ProjectsDrawer,
  type CommandAction,
  type InspectorElement,
  type ElementInList,
  type ProjectItem,
} from '@tmc/ui';
import { deleteProject as deleteProjectApi } from './lib/supabase';
import { useBoardStore } from './store/useBoardStore';
import { useAuthStore } from './store/useAuthStore';
import { useUIStore, useInitializeTheme } from './store/useUIStore';
import { formations } from '@tmc/presets';
import { exportGIF, exportPDF, exportSVG } from './utils/exportUtils';

/** Main App component */
export default function App() {
  const stageRef = useRef<Konva.Stage>(null);
  
  // Multi-drag state for moving multiple selected elements together
  const multiDragRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    elementOffsets: Map<string, { x: number; y: number; isArrow?: boolean; startPoint?: Position; endPoint?: Position }>;
  } | null>(null);
  const [isMultiDragging, setIsMultiDragging] = useState(false);
  
  // Auth state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [projectsDrawerOpen, setProjectsDrawerOpen] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(() => {
    // Show welcome only for first-time visitors
    const hasVisited = localStorage.getItem('tmc-visited');
    return !hasVisited;
  });
  const authUser = useAuthStore((s) => s.user);
  const authIsAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authIsPro = useAuthStore((s) => s.isPro);
  const authIsLoading = useAuthStore((s) => s.isLoading);
  const authError = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signOut = useAuthStore((s) => s.signOut);
  const clearAuthError = useAuthStore((s) => s.clearError);

  // Initialize theme on mount
  useInitializeTheme();

  // Board store state  
  const elements = useBoardStore((s) => s.elements);
  const selectedIds = useBoardStore((s) => s.selectedIds);
  const boardDoc = useBoardStore((s) => s.document);
  const teamSettings = useBoardStore((s) => s.getTeamSettings());
  const pitchSettings = useBoardStore((s) => s.getPitchSettings());
  const updatePitchSettings = useBoardStore((s) => s.updatePitchSettings);
  
  // Board store actions
  const addPlayerAtCursor = useBoardStore((s) => s.addPlayerAtCursor);
  const addBallAtCursor = useBoardStore((s) => s.addBallAtCursor);
  const addArrowAtCursor = useBoardStore((s) => s.addArrowAtCursor);
  const addZoneAtCursor = useBoardStore((s) => s.addZoneAtCursor);
  const addTextAtCursor = useBoardStore((s) => s.addTextAtCursor);
  const addEquipmentAtCursor = useBoardStore((s) => s.addEquipmentAtCursor);
  const updateTextProperties = useBoardStore((s) => s.updateTextProperties);
  const moveElementById = useBoardStore((s) => s.moveElementById);
  const resizeZone = useBoardStore((s) => s.resizeZone);
  const selectElement = useBoardStore((s) => s.selectElement);
  const clearSelection = useBoardStore((s) => s.clearSelection);
  const deleteSelected = useBoardStore((s) => s.deleteSelected);
  const duplicateSelected = useBoardStore((s) => s.duplicateSelected);
  const copySelection = useBoardStore((s) => s.copySelection);
  const pasteClipboard = useBoardStore((s) => s.pasteClipboard);
  const updateSelectedElement = useBoardStore((s) => s.updateSelectedElement);
  // Removed: setCursorPosition - was causing lag on every mouse move
  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);
  const saveDocument = useBoardStore((s) => s.saveDocument);
  const getSelectedElement = useBoardStore((s) => s.getSelectedElement);
  const canUndoFn = useBoardStore((s) => s.canUndo);
  const canRedoFn = useBoardStore((s) => s.canRedo);
  const pushHistory = useBoardStore((s) => s.pushHistory);
  const selectAll = useBoardStore((s) => s.selectAll);
  const nudgeSelected = useBoardStore((s) => s.nudgeSelected);
  const adjustSelectedStrokeWidth = useBoardStore((s) => s.adjustSelectedStrokeWidth);
  const cycleSelectedColor = useBoardStore((s) => s.cycleSelectedColor);
  const cyclePlayerShape = useBoardStore((s) => s.cyclePlayerShape);
  const cycleZoneShape = useBoardStore((s) => s.cycleZoneShape);
  const rotateSelected = useBoardStore((s) => s.rotateSelected);
  const selectElementsInRect = useBoardStore((s) => s.selectElementsInRect);
  const updateArrowEndpoint = useBoardStore((s) => s.updateArrowEndpoint);
  const createGroup = useBoardStore((s) => s.createGroup);
  const ungroupSelection = useBoardStore((s) => s.ungroupSelection);
  const groups = useBoardStore((s) => s.groups);
  const selectGroup = useBoardStore((s) => s.selectGroup);
  const toggleGroupLock = useBoardStore((s) => s.toggleGroupLock);
  const toggleGroupVisibility = useBoardStore((s) => s.toggleGroupVisibility);
  const renameGroup = useBoardStore((s) => s.renameGroup);
  const applyFormation = useBoardStore((s) => s.applyFormation);
  const updateTeamSettings = useBoardStore((s) => s.updateTeamSettings);
  
  // Cloud save actions
  const saveToCloud = useBoardStore((s) => s.saveToCloud);
  const loadFromCloud = useBoardStore((s) => s.loadFromCloud);
  const fetchCloudProjects = useBoardStore((s) => s.fetchCloudProjects);
  const cloudProjectId = useBoardStore((s) => s.cloudProjectId);
  const isSaving = useBoardStore((s) => s.isSaving);
  const cloudProjects = useBoardStore((s) => s.cloudProjects);
  const newDocument = useBoardStore((s) => s.newDocument);
  
  // Step actions
  const currentStepIndex = useBoardStore((s) => s.currentStepIndex);
  const addStep = useBoardStore((s) => s.addStep);
  const removeStep = useBoardStore((s) => s.removeStep);
  const renameStep = useBoardStore((s) => s.renameStep);
  const goToStep = useBoardStore((s) => s.goToStep);
  const nextStep = useBoardStore((s) => s.nextStep);
  const prevStep = useBoardStore((s) => s.prevStep);
  const getSteps = useBoardStore((s) => s.getSteps);
  
  // Get IDs of elements hidden by groups
  const hiddenByGroup = useMemo(() => {
    const hidden = new Set<string>();
    for (const g of groups) {
      if (!g.visible) {
        g.memberIds.forEach((id) => hidden.add(id));
      }
    }
    return hidden;
  }, [groups]);

  // Marquee selection state
  const [marqueeStart, setMarqueeStart] = useState<Position | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<Position | null>(null);
  
  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');
  const updateTextContent = useBoardStore((s) => s.updateTextContent);

  // Player quick-edit number state
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerNumber, setEditingPlayerNumber] = useState<string>('');

  // UI store state
  const theme = useUIStore((s) => s.theme);
  const focusMode = useUIStore((s) => s.focusMode);
  const inspectorOpen = useUIStore((s) => s.inspectorOpen);
  const cheatSheetVisible = useUIStore((s) => s.cheatSheetVisible);
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const activeToast = useUIStore((s) => s.activeToast);
  const layerVisibility = useUIStore((s) => s.layerVisibility);
  const zoom = useUIStore((s) => s.zoom);
  
  // UI store actions
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);
  const toggleInspector = useUIStore((s) => s.toggleInspector);
  const toggleCheatSheet = useUIStore((s) => s.toggleCheatSheet);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const closeCommandPalette = useUIStore((s) => s.closeCommandPalette);
  const showToast = useUIStore((s) => s.showToast);
  const toggleLayerVisibility = useUIStore((s) => s.toggleLayerVisibility);
  const zoomIn = useUIStore((s) => s.zoomIn);
  const zoomOut = useUIStore((s) => s.zoomOut);
  const zoomFit = useUIStore((s) => s.zoomFit);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const activeTool = useUIStore((s) => s.activeTool);
  const gridVisible = useUIStore((s) => s.gridVisible);
  
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

  // Derived state
  const selectedElement = getSelectedElement();
  const canUndo = canUndoFn();
  const canRedo = canRedoFn();
  const isSaved = true; // TODO: track actual save state

  // Prepare selected element for inspector
  const inspectorElement: InspectorElement | undefined = useMemo(() => {
    if (!selectedElement) return undefined;
    
    // Handle elements with position (players, ball, zones)
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
        x: selectedElement.position.x,
        y: selectedElement.position.y,
      };
    }
    
    // Handle arrows (use startPoint as position)
    if (isArrowElement(selectedElement)) {
      return {
        id: selectedElement.id,
        type: 'arrow' as unknown as 'player' | 'ball', // TODO: extend InspectorElement type
        x: selectedElement.startPoint.x,
        y: selectedElement.startPoint.y,
      };
    }
    
    return undefined;
  }, [selectedElement]);

  // Prepare elements list for Objects tab
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

  // Quick action handler
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'add-home-player':
        addPlayerAtCursor('home');
        break;
      case 'add-away-player':
        addPlayerAtCursor('away');
        break;
      case 'add-ball':
        addBallAtCursor();
        break;
      case 'add-pass-arrow':
        addArrowAtCursor('pass');
        break;
      case 'add-run-arrow':
        addArrowAtCursor('run');
        break;
      case 'add-zone':
        addZoneAtCursor();
        break;
      case 'add-text':
        addTextAtCursor();
        break;
      case 'open-palette':
        openCommandPalette();
        break;
      default:
        break;
    }
  }, [addPlayerAtCursor, addBallAtCursor, addArrowAtCursor, addZoneAtCursor, addTextAtCursor, openCommandPalette]);

  // Steps data from store
  const stepsData = useMemo(() => {
    const stepsList = getSteps();
    return stepsList.map((s) => ({
      id: s.id,
      label: s.name,
      index: s.index,
    }));
  }, [getSteps, boardDoc.steps]); // Re-compute when steps change

  // Dynamic pitch config based on orientation
  const pitchConfig = useMemo(() => 
    getPitchDimensions(pitchSettings?.orientation ?? 'landscape'),
    [pitchSettings?.orientation]
  );

  // Canvas dimensions (dynamic based on orientation)
  const canvasWidth = pitchConfig.width + pitchConfig.padding * 2;
  const canvasHeight = pitchConfig.height + pitchConfig.padding * 2;

  // Use zoom directly - no limit for portrait (user controls zoom)
  const effectiveZoom = zoom;

  // Export single PNG handler
  const handleExport = useCallback(() => {
    if (stageRef.current) {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${boardDoc.name || 'tactics'}.png`;
      link.href = dataUrl;
      link.click();
      showToast('PNG exported!');
    }
  }, [boardDoc.name, showToast]);

  // Export all steps as PNGs
  const handleExportAllSteps = useCallback(async () => {
    if (!stageRef.current) return;
    
    const originalStep = currentStepIndex;
    const totalSteps = boardDoc.steps.length;
    
    showToast(`Exporting ${totalSteps} steps...`);
    
    for (let i = 0; i < totalSteps; i++) {
      // Go to step
      goToStep(i);
      
      // Wait for render
      await new Promise((resolve) => setTimeout(resolve, 150));
      
      // Export PNG
      const dataUrl = stageRef.current?.toDataURL({ pixelRatio: 2 });
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `${boardDoc.name || 'tactics'}-step-${i + 1}.png`;
        link.href = dataUrl;
        link.click();
      }
      
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    
    // Return to original step
    goToStep(originalStep);
    showToast(`Exported ${totalSteps} PNGs!`);
  }, [boardDoc.name, boardDoc.steps.length, currentStepIndex, goToStep, showToast]);

  // Export animated GIF
  const handleExportGIF = useCallback(async () => {
    if (!stageRef.current) return;
    if (boardDoc.steps.length < 2) {
      showToast('Need at least 2 steps for GIF');
      return;
    }
    
    const originalStep = currentStepIndex;
    showToast('Creating GIF...');
    
    try {
      await exportGIF(
        async () => {
          await new Promise((r) => setTimeout(r, 50));
          return stageRef.current?.toDataURL({ pixelRatio: 2 }) ?? '';
        },
        goToStep,
        boardDoc.steps.length,
        { filename: boardDoc.name || 'tactics', stepDuration },
        (percent) => {
          if (percent === 50) showToast('Encoding GIF...');
        }
      );
      showToast('GIF exported!');
    } catch (error) {
      showToast('GIF export failed');
      console.error(error);
    }
    
    goToStep(originalStep);
  }, [boardDoc.name, boardDoc.steps.length, currentStepIndex, goToStep, stepDuration, showToast]);

  // Export multi-page PDF
  const handleExportPDF = useCallback(async () => {
    if (!stageRef.current) return;
    
    const originalStep = currentStepIndex;
    showToast('Creating PDF...');
    
    try {
      await exportPDF(
        async () => {
          await new Promise((r) => setTimeout(r, 50));
          return stageRef.current?.toDataURL({ pixelRatio: 2 }) ?? '';
        },
        goToStep,
        boardDoc.steps.length,
        { filename: boardDoc.name || 'tactics' }
      );
      showToast('PDF exported!');
    } catch (error) {
      showToast('PDF export failed');
      console.error(error);
    }
    
    goToStep(originalStep);
  }, [boardDoc.name, boardDoc.steps.length, currentStepIndex, goToStep, showToast]);

  // Export SVG
  const handleExportSVG = useCallback(async () => {
    if (!stageRef.current) return;
    
    try {
      await exportSVG(
        stageRef.current,
        canvasWidth,
        canvasHeight,
        { filename: boardDoc.name || 'tactics' }
      );
      showToast('SVG exported!');
    } catch (error) {
      showToast('SVG export failed');
      console.error(error);
    }
  }, [boardDoc.name, canvasWidth, canvasHeight, showToast]);

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
      { id: 'clear-selection', label: 'Clear Selection', shortcut: 'Esc', category: 'edit', onExecute: clearSelection },

      // View
      { id: 'toggle-inspector', label: 'Toggle Inspector', shortcut: 'I', category: 'view', onExecute: toggleInspector },
      { id: 'toggle-cheatsheet', label: 'Toggle Shortcuts', shortcut: '?', category: 'view', onExecute: toggleCheatSheet },
      { id: 'toggle-grid', label: 'Toggle Grid', shortcut: 'G', category: 'view', onExecute: () => showToast('Grid coming soon') },
      { id: 'toggle-snap', label: 'Toggle Snap', shortcut: 'S', category: 'view', onExecute: () => showToast('Snap toggle coming soon') },
      { id: 'focus-mode', label: 'Focus Mode', shortcut: 'F', category: 'view', onExecute: toggleFocusMode },

      // Steps
      { id: 'add-step', label: 'Add Step', shortcut: 'N', category: 'steps', onExecute: () => { addStep(); showToast('New step added'); } },
      { id: 'prev-step', label: 'Previous Step', shortcut: '←', category: 'steps', onExecute: prevStep, disabled: currentStepIndex === 0 },
      { id: 'next-step', label: 'Next Step', shortcut: '→', category: 'steps', onExecute: nextStep, disabled: currentStepIndex >= boardDoc.steps.length - 1 },
      { id: 'play-pause', label: isPlaying ? 'Pause' : 'Play', shortcut: 'Space', category: 'steps', onExecute: () => { isPlaying ? pause() : play(); } },
      { id: 'toggle-loop', label: 'Toggle Loop', shortcut: 'L', category: 'steps', onExecute: () => { toggleLoop(); showToast(isLooping ? 'Loop disabled' : 'Loop enabled'); } },

      // Export
      { id: 'export-png', label: 'Export PNG', shortcut: `${cmd}E`, category: 'export', onExecute: () => handleExport() },
      { id: 'export-steps', label: 'Export All Steps PNG', shortcut: `⇧${cmd}E`, category: 'export', onExecute: () => handleExportAllSteps() },
      { id: 'export-gif', label: 'Export Animated GIF', shortcut: `⇧${cmd}G`, category: 'export', onExecute: () => handleExportGIF(), disabled: boardDoc.steps.length < 2 },
      { id: 'export-pdf', label: 'Export PDF (all steps)', shortcut: `⇧${cmd}P`, category: 'export', onExecute: () => handleExportPDF() },
      { id: 'export-svg', label: 'Export SVG', category: 'export', onExecute: () => handleExportSVG() },
    ];
  }, [addPlayerAtCursor, addBallAtCursor, addArrowAtCursor, addZoneAtCursor, duplicateSelected, deleteSelected, undo, redo, selectAll, clearSelection, toggleInspector, toggleCheatSheet, toggleFocusMode, showToast, selectedIds.length, canUndo, canRedo, handleExport, handleExportAllSteps, handleExportGIF, handleExportPDF, handleExportSVG, boardDoc.steps.length]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      
      // Don't handle if typing in input or command palette is open
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Command palette toggle
      if (isCmd && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (commandPaletteOpen) {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
        return;
      }

      // Don't handle other shortcuts if palette is open
      if (commandPaletteOpen) return;

      switch (e.key.toLowerCase()) {
        case 'p':
          e.preventDefault();
          if (isCmd && e.shiftKey) {
            // Cmd+Shift+P = Export PDF
            handleExportPDF();
          } else if (e.shiftKey) {
            addPlayerAtCursor('away');
          } else {
            addPlayerAtCursor('home');
          }
          break;
        case 'b':
          if (!isCmd) {
            e.preventDefault();
            addBallAtCursor();
          }
          break;
        case 'd':
          if (isCmd) {
            e.preventDefault();
            duplicateSelected();
          } else if (!e.shiftKey) {
            e.preventDefault();
            setActiveTool('drawing');
          }
          break;
        case 'h':
          if (!isCmd) {
            setActiveTool('highlighter');
            e.preventDefault();
          }
          break;
        case 'c':
          if (isCmd) {
            // Cmd+C = Copy selection
            e.preventDefault();
            copySelection();
            showToast('Copied');
          } else {
            // C = Clear all drawings (freehand & highlighter)
            e.preventDefault();
            clearAllDrawings();
            showToast('Drawings cleared');
          }
          break;
        case 'v':
          if (isCmd) {
            // Cmd+V = Paste from clipboard
            e.preventDefault();
            pasteClipboard();
            showToast('Pasted');
          } else if (!commandPaletteOpen) {
            // V = Cycle pitch views (full → plain → half-left → half-right)
            e.preventDefault();
            const VIEWS = ['full', 'plain', 'half-left', 'half-right'] as const;
            const currentView = useBoardStore.getState().getPitchSettings()?.view ?? 'full';
            const currentIdx = VIEWS.indexOf(currentView as typeof VIEWS[number]);
            const nextIdx = (currentIdx + 1) % VIEWS.length;
            const nextView = VIEWS[nextIdx];
            
            // If switching to plain, hide all lines
            if (nextView === 'plain') {
              useBoardStore.getState().updatePitchSettings({ 
                view: nextView,
                lines: {
                  showOutline: false,
                  showCenterLine: false,
                  showCenterCircle: false,
                  showPenaltyAreas: false,
                  showGoalAreas: false,
                  showCornerArcs: false,
                  showPenaltySpots: false
                }
              });
            } else {
              // Show all lines for other views
              useBoardStore.getState().updatePitchSettings({ 
                view: nextView,
                lines: {
                  showOutline: true,
                  showCenterLine: true,
                  showCenterCircle: true,
                  showPenaltyAreas: true,
                  showGoalAreas: true,
                  showCornerArcs: true,
                  showPenaltySpots: true
                }
              });
            }
            const viewNames: Record<string, string> = {
              'full': 'Full pitch',
              'plain': 'Plain grass',
              'half-left': 'Half (left)',
              'half-right': 'Half (right)'
            };
            showToast(viewNames[nextView] ?? nextView);
          }
          break;
        case 'g':
          if (isCmd && e.shiftKey) {
            e.preventDefault();
            // Cmd+Shift+G = Export GIF
            handleExportGIF();
          } else if (isCmd) {
            e.preventDefault();
            createGroup();
            showToast('Group created');
          } else {
            // G = Toggle grid
            e.preventDefault();
            useUIStore.getState().toggleGrid();
            showToast(useUIStore.getState().gridVisible ? 'Grid visible' : 'Grid hidden');
          }
          break;
        case 'z':
          if (isCmd && e.shiftKey) {
            e.preventDefault();
            redo();
          } else if (isCmd) {
            e.preventDefault();
            undo();
          } else {
            e.preventDefault();
            // Z = rect zone tool, Shift+Z = ellipse zone tool
            setActiveTool(e.shiftKey ? 'zone-ellipse' : 'zone');
          }
          break;
        case 'e':
          // E key = cycle zone shape when zone selected
          if (!isCmd && selectedIds.length > 0) {
            const hasZone = elements.some((el) => selectedIds.includes(el.id) && isZoneElement(el));
            if (hasZone) {
              e.preventDefault();
              cycleZoneShape();
              showToast('Zone shape changed');
            }
          }
          break;
        case 's':
          if (isCmd) {
            e.preventDefault();
            // Save to localStorage always
            saveDocument();
            // Also save to cloud if authenticated
            if (authIsAuthenticated) {
              saveToCloud().then(async (success) => {
                if (success) {
                  // Refresh project list after save
                  await fetchCloudProjects();
                  showToast('Saved to cloud ☁️');
                } else {
                  showToast('Saved locally');
                }
              });
            } else {
              showToast('Saved locally');
            }
          } else if (selectedIds.length > 0) {
            // S key = cycle player shape
            const hasPlayer = elements.some((el) => selectedIds.includes(el.id) && isPlayerElement(el));
            if (hasPlayer) {
              e.preventDefault();
              cyclePlayerShape();
              showToast('Shape changed');
            }
          }
          break;
        case 'a':
          if (isCmd) {
            e.preventDefault();
            selectAll();
          } else if (!e.shiftKey) {
            e.preventDefault();
            setActiveTool('arrow-pass');
          }
          break;
        case 'r':
          if (!isCmd) {
            e.preventDefault();
            setActiveTool('arrow-run');
          }
          break;
        case 't':
          if (!isCmd) {
            e.preventDefault();
            addTextAtCursor();
          }
          break;
        
        // Equipment shortcuts
        case 'm': // Mannequin
          if (!isCmd) {
            e.preventDefault();
            if (e.shiftKey) {
              addEquipmentAtCursor('mannequin', 'flat');
              showToast('Lying Mannequin');
            } else {
              addEquipmentAtCursor('mannequin');
              showToast('Mannequin');
            }
          }
          break;
        case 'k': // Cone / Pole
          if (!isCmd) {
            e.preventDefault();
            if (e.shiftKey) {
              addEquipmentAtCursor('pole');
              showToast('Pole');
            } else {
              addEquipmentAtCursor('cone');
              showToast('Cone');
            }
          }
          break;
        case 'q': // Hoop
          if (!isCmd) {
            e.preventDefault();
            addEquipmentAtCursor('hoop');
            showToast('Hoop');
          }
          break;
        case 'u': // Hurdle
          if (!isCmd) {
            e.preventDefault();
            addEquipmentAtCursor('hurdle');
            showToast('Hurdle');
          }
          break;
        case 'y': // Ladder
          if (!isCmd) {
            e.preventDefault();
            addEquipmentAtCursor('ladder');
            showToast('Ladder');
          }
          break;
        case 'j': // Goal
          if (!isCmd) {
            e.preventDefault();
            if (e.shiftKey) {
              addEquipmentAtCursor('goal', 'mini');
              showToast('Mini Goal');
            } else {
              addEquipmentAtCursor('goal');
              showToast('Goal');
            }
          }
          break;
        case 'i':
          if (!isCmd) {
            e.preventDefault();
            toggleInspector();
          }
          break;
        case 'f':
          if (!isCmd) {
            e.preventDefault();
            toggleFocusMode();
          }
          break;
        case '?':
          e.preventDefault();
          toggleCheatSheet();
          break;
        case 'delete':
        case 'backspace':
          e.preventDefault();
          deleteSelected();
          break;
        case 'escape':
          clearSelection();
          break;
        case 'enter':
          // Enter on selected text = start editing
          if (selectedIds.length === 1) {
            const sel = useBoardStore.getState().elements.find((el) => el.id === selectedIds[0]);
            if (sel && isTextElement(sel)) {
              e.preventDefault();
              setEditingTextId(sel.id);
              setEditingTextValue(sel.content);
            }
          }
          break;
        case 'arrowup':
          e.preventDefault();
          // Check if selected element is text - adjust properties
          if (selectedIds.length === 1) {
            const sel = useBoardStore.getState().elements.find((el) => el.id === selectedIds[0]);
            if (sel && isTextElement(sel)) {
              if (e.shiftKey) {
                // Shift+Up = cycle background color
                const BG_COLORS = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#3b82f6', '#1f2937'];
                const currentBg = sel.backgroundColor;
                const currentIndex = currentBg ? BG_COLORS.indexOf(currentBg) : -1;
                const newBg = BG_COLORS[(currentIndex + 1) % BG_COLORS.length];
                updateTextProperties(sel.id, { backgroundColor: newBg });
                showToast(`Background: ${newBg}`);
              } else {
                // Up = increase font size
                const newSize = Math.min(72, (sel.fontSize || 18) + 2);
                updateTextProperties(sel.id, { fontSize: newSize });
                showToast(`Font size: ${newSize}px`);
              }
              break;
            }
          }
          if (e.altKey) {
            cycleSelectedColor(-1);
            showToast('Previous color');
          } else {
            nudgeSelected(0, e.shiftKey ? -1 : -5);
          }
          break;
        case 'arrowdown':
          e.preventDefault();
          // Check if selected element is text - adjust properties
          if (selectedIds.length === 1) {
            const sel = useBoardStore.getState().elements.find((el) => el.id === selectedIds[0]);
            if (sel && isTextElement(sel)) {
              if (e.shiftKey) {
                // Shift+Down = remove background
                updateTextProperties(sel.id, { backgroundColor: undefined });
                showToast('Background removed');
              } else {
                // Down = decrease font size
                const newSize = Math.max(8, (sel.fontSize || 18) - 2);
                updateTextProperties(sel.id, { fontSize: newSize });
                showToast(`Font size: ${newSize}px`);
              }
              break;
            }
          }
          if (e.altKey) {
            cycleSelectedColor(1);
            showToast('Next color');
          } else {
            nudgeSelected(0, e.shiftKey ? 1 : 5);
          }
          break;
        case 'arrowleft':
          e.preventDefault();
          // Check if selected element is text - toggle bold
          if (selectedIds.length === 1) {
            const sel = useBoardStore.getState().elements.find((el) => el.id === selectedIds[0]);
            if (sel && isTextElement(sel)) {
              updateTextProperties(sel.id, { bold: !sel.bold });
              showToast(sel.bold ? 'Normal' : 'Bold');
              break;
            }
          }
          if (e.altKey) {
            adjustSelectedStrokeWidth(-1);
            showToast('Thinner stroke');
          } else if (!isCmd && selectedIds.length === 0) {
            // Arrow keys navigate steps when nothing selected
            prevStep();
          } else {
            nudgeSelected(e.shiftKey ? -1 : -5, 0);
          }
          break;
        case 'arrowright':
          e.preventDefault();
          // Check if selected element is text - toggle italic
          if (selectedIds.length === 1) {
            const sel = useBoardStore.getState().elements.find((el) => el.id === selectedIds[0]);
            if (sel && isTextElement(sel)) {
              updateTextProperties(sel.id, { italic: !sel.italic });
              showToast(sel.italic ? 'Normal' : 'Italic');
              break;
            }
          }
          if (e.altKey) {
            adjustSelectedStrokeWidth(1);
            showToast('Thicker stroke');
          } else if (!isCmd && selectedIds.length === 0) {
            // Arrow keys navigate steps when nothing selected
            nextStep();
          } else {
            nudgeSelected(e.shiftKey ? 1 : 5, 0);
          }
          break;
        case ' ':
          // Space = Play/Pause
          e.preventDefault();
          if (isPlaying) {
            pause();
          } else {
            play();
          }
          break;
        case 'l':
          // L = Toggle loop
          if (!isCmd) {
            e.preventDefault();
            toggleLoop();
            showToast(useUIStore.getState().isLooping ? 'Loop enabled' : 'Loop disabled');
          }
          break;
        case 'n':
          // N = New step
          if (!isCmd) {
            e.preventDefault();
            addStep();
            showToast('New step added');
          }
          break;
        case 'o':
          // O = Toggle orientation (landscape/portrait) + auto-adjust zoom
          if (!isCmd) {
            e.preventDefault();
            const currentOrientation = useBoardStore.getState().getPitchSettings()?.orientation ?? 'landscape';
            const newOrientation = currentOrientation === 'landscape' ? 'portrait' : 'landscape';
            useBoardStore.getState().updatePitchSettings({ orientation: newOrientation });
            // Auto-adjust zoom for portrait (75%) to fit tall pitch on screen
            if (newOrientation === 'portrait') {
              useUIStore.getState().setZoom(0.75);
            } else {
              useUIStore.getState().setZoom(1.0);
            }
            showToast(newOrientation === 'portrait' ? 'Portrait mode (75%)' : 'Landscape mode');
          }
          break;
        case 'w':
          // W = Toggle print friendly (white pitch, black lines, NO stripes)
          if (!isCmd) {
            e.preventDefault();
            const currentSettings = useBoardStore.getState().getPitchSettings();
            const isPrintFriendly = currentSettings?.primaryColor === '#ffffff' && currentSettings?.lineColor === '#000000';
            if (isPrintFriendly) {
              // Back to default green with stripes
              useBoardStore.getState().updatePitchSettings({ 
                primaryColor: '#4ade80',
                stripeColor: '#22c55e', 
                lineColor: '#ffffff',
                showStripes: true
              });
              showToast('Normal colors');
            } else {
              // Set print friendly - white, black lines, NO stripes
              useBoardStore.getState().updatePitchSettings({ 
                primaryColor: '#ffffff',
                stripeColor: '#ffffff', // Same as primary for pure white
                lineColor: '#000000',
                showStripes: false
              });
              showToast('Print Friendly mode');
            }
          }
          break;
        case 'x':
          // X = Delete current step (only if more than 1 step)
          if (!isCmd && useBoardStore.getState().document.steps.length > 1) {
            e.preventDefault();
            const current = useBoardStore.getState().currentStepIndex;
            removeStep(current);
            showToast('Step deleted');
          }
          break;
        case '=':
        case '+':
          if (isCmd) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (isCmd) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case '[':
          // Rotate selected equipment counter-clockwise (fine)
          if (!isCmd) {
            e.preventDefault();
            rotateSelected(-15);
            showToast('Rotated -15°');
          }
          break;
        case ']':
          // Rotate selected equipment clockwise (fine)
          if (!isCmd) {
            e.preventDefault();
            rotateSelected(15);
            showToast('Rotated +15°');
          }
          break;
        case '{':
          // Shift+[ on most keyboards = fast rotate counter-clockwise
          if (!isCmd) {
            e.preventDefault();
            rotateSelected(-90);
            showToast('Rotated -90°');
          }
          break;
        case '}':
          // Shift+] on most keyboards = fast rotate clockwise
          if (!isCmd) {
            e.preventDefault();
            rotateSelected(90);
            showToast('Rotated +90°');
          }
          break;
      }
      
      // Formation shortcuts using e.code (works with Shift)
      // 1-6 = Home team, Shift+1-6 = Away team (using e.code for reliability)
      if (!isCmd && !e.altKey) {
        const formationIndex = {
          'Digit1': 0, 'Numpad1': 0,
          'Digit2': 1, 'Numpad2': 1,
          'Digit3': 2, 'Numpad3': 2,
          'Digit4': 3, 'Numpad4': 3,
          'Digit5': 4, 'Numpad5': 4,
          'Digit6': 5, 'Numpad6': 5,
        }[e.code];
        
        if (formationIndex !== undefined && formations[formationIndex]) {
          e.preventDefault();
          const team = e.shiftKey ? 'away' : 'home';
          applyFormation(formations[formationIndex].id, team);
          showToast(`${formations[formationIndex].shortName} applied (${team})`);
        }
      }
    },
    [commandPaletteOpen, closeCommandPalette, openCommandPalette, addPlayerAtCursor, addBallAtCursor, addArrowAtCursor, addZoneAtCursor, addTextAtCursor, updateTextProperties, duplicateSelected, undo, redo, saveDocument, selectAll, toggleInspector, toggleFocusMode, toggleCheatSheet, deleteSelected, clearSelection, showToast, zoomIn, zoomOut, zoomFit, setActiveTool, nudgeSelected, adjustSelectedStrokeWidth, cycleSelectedColor, cyclePlayerShape, createGroup, ungroupSelection, selectedIds, elements, prevStep, nextStep, isPlaying, pause, play, toggleLoop, addStep, removeStep, applyFormation]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Smooth animation playback effect using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      setAnimationProgress(0);
      return;
    }
    
    const totalSteps = stepsData.length;
    if (totalSteps <= 1) {
      pause();
      return;
    }
    
    let startTime: number | null = null;
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const elapsed = timestamp - startTime;
      const durationMs = stepDuration * 1000;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Ease-in-out cubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      setAnimationProgress(eased);
      
      if (progress >= 1) {
        // Animation complete for this step
        const current = useBoardStore.getState().currentStepIndex;
        const total = useBoardStore.getState().document.steps.length;
        
        if (current >= total - 1) {
          if (isLooping) {
            goToStep(0);
            startTime = null;
            setAnimationProgress(0);
            animationFrameId = requestAnimationFrame(animate);
          } else {
            pause();
            setAnimationProgress(0);
          }
        } else {
          nextStep();
          startTime = null;
          setAnimationProgress(0);
          animationFrameId = requestAnimationFrame(animate);
        }
      } else {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      setAnimationProgress(0);
    };
  }, [isPlaying, isLooping, stepDuration, stepsData.length, pause, goToStep, nextStep, setAnimationProgress]);
  
  // Get next step elements for interpolation
  const nextStepElements = useMemo(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= boardDoc.steps.length) return null;
    return boardDoc.steps[nextIndex]?.elements ?? null;
  }, [boardDoc.steps, currentStepIndex]);
  
  // Helper to interpolate position between current and next step
  const getInterpolatedPosition = useCallback((elementId: string, currentPos: Position): Position => {
    if (!isPlaying || animationProgress === 0 || !nextStepElements) {
      return currentPos;
    }
    
    // Find this element in next step
    const nextEl = nextStepElements.find((e) => e.id === elementId);
    if (!nextEl || !hasPosition(nextEl)) {
      return currentPos;
    }
    
    const nextPos = nextEl.position;
    
    // Lerp between positions
    return {
      x: currentPos.x + (nextPos.x - currentPos.x) * animationProgress,
      y: currentPos.y + (nextPos.y - currentPos.y) * animationProgress,
    };
  }, [isPlaying, animationProgress, nextStepElements]);
  
  // Helper to interpolate zone (position + size)
  const getInterpolatedZone = useCallback((elementId: string, currentPos: Position, currentWidth: number, currentHeight: number): { position: Position; width: number; height: number } => {
    if (!isPlaying || animationProgress === 0 || !nextStepElements) {
      return { position: currentPos, width: currentWidth, height: currentHeight };
    }
    
    // Find this zone in next step
    const nextEl = nextStepElements.find((e) => e.id === elementId);
    if (!nextEl || !isZoneElement(nextEl)) {
      return { position: currentPos, width: currentWidth, height: currentHeight };
    }
    
    // Lerp position and size
    return {
      position: {
        x: currentPos.x + (nextEl.position.x - currentPos.x) * animationProgress,
        y: currentPos.y + (nextEl.position.y - currentPos.y) * animationProgress,
      },
      width: currentWidth + (nextEl.width - currentWidth) * animationProgress,
      height: currentHeight + (nextEl.height - currentHeight) * animationProgress,
    };
  }, [isPlaying, animationProgress, nextStepElements]);
  
  // Helper to interpolate arrow endpoints
  const getInterpolatedArrowEndpoints = useCallback((elementId: string, currentStart: Position, currentEnd: Position): { start: Position; end: Position } => {
    if (!isPlaying || animationProgress === 0 || !nextStepElements) {
      return { start: currentStart, end: currentEnd };
    }
    
    // Find this arrow in next step
    const nextEl = nextStepElements.find((e) => e.id === elementId);
    if (!nextEl || !isArrowElement(nextEl)) {
      return { start: currentStart, end: currentEnd };
    }
    
    // Lerp both endpoints
    return {
      start: {
        x: currentStart.x + (nextEl.startPoint.x - currentStart.x) * animationProgress,
        y: currentStart.y + (nextEl.startPoint.y - currentStart.y) * animationProgress,
      },
      end: {
        x: currentEnd.x + (nextEl.endPoint.x - currentEnd.x) * animationProgress,
        y: currentEnd.y + (nextEl.endPoint.y - currentEnd.y) * animationProgress,
      },
    };
  }, [isPlaying, animationProgress, nextStepElements]);

  // Multi-drag window event handlers
  useEffect(() => {
    if (!isMultiDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!multiDragRef.current) return;
      
      const stage = stageRef.current;
      if (!stage) return;
      
      const rect = stage.container().getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const dx = mouseX - multiDragRef.current.startMouseX;
      const dy = mouseY - multiDragRef.current.startMouseY;
      
      // Update all selected elements
      multiDragRef.current.elementOffsets.forEach((offset, id) => {
        if (offset.isArrow && offset.startPoint && offset.endPoint) {
          // For arrows, update both endpoints
          updateArrowEndpoint(id, 'start', {
            x: offset.startPoint.x + dx,
            y: offset.startPoint.y + dy,
          });
          updateArrowEndpoint(id, 'end', {
            x: offset.endPoint.x + dx,
            y: offset.endPoint.y + dy,
          });
        } else {
          // For position-based elements
          moveElementById(id, {
            x: offset.x + dx,
            y: offset.y + dy,
          });
        }
      });
    };

    const handleMouseUp = () => {
      setIsMultiDragging(false);
      multiDragRef.current = null;
      pushHistory();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMultiDragging, moveElementById, updateArrowEndpoint, pushHistory]);

  // Start multi-drag when dragging a selected element that's part of multi-selection
  const startMultiDrag = useCallback((draggedId: string, mouseX: number, mouseY: number): boolean => {
    if (selectedIds.length <= 1) return false;
    if (!selectedIds.includes(draggedId)) return false;

    const offsets = new Map<string, { x: number; y: number; isArrow?: boolean; startPoint?: Position; endPoint?: Position }>();

    for (const id of selectedIds) {
      const el = elements.find((e) => e.id === id);
      if (!el) continue;

      if (isArrowElement(el)) {
        offsets.set(id, {
          x: 0,
          y: 0,
          isArrow: true,
          startPoint: { ...el.startPoint },
          endPoint: { ...el.endPoint },
        });
      } else if (hasPosition(el)) {
        offsets.set(id, {
          x: el.position.x,
          y: el.position.y,
        });
      }
    }

    multiDragRef.current = {
      startMouseX: mouseX,
      startMouseY: mouseY,
      elementOffsets: offsets,
    };
    setIsMultiDragging(true);
    return true;
  }, [selectedIds, elements]);

  // Get drawing actions from board store
  const startDrawing = useBoardStore((s) => s.startDrawing);
  const updateDrawing = useBoardStore((s) => s.updateDrawing);
  const finishArrowDrawing = useBoardStore((s) => s.finishArrowDrawing);
  const finishZoneDrawing = useBoardStore((s) => s.finishZoneDrawing);
  const drawingStart = useBoardStore((s) => s.drawingStart);
  const drawingEnd = useBoardStore((s) => s.drawingEnd);
  const clearActiveTool = useUIStore((s) => s.clearActiveTool);
  
  // Freehand drawing actions
  const startFreehandDrawing = useBoardStore((s) => s.startFreehandDrawing);
  const updateFreehandDrawing = useBoardStore((s) => s.updateFreehandDrawing);
  const finishFreehandDrawing = useBoardStore((s) => s.finishFreehandDrawing);
  const freehandPoints = useBoardStore((s) => s.freehandPoints);
  const clearAllDrawings = useBoardStore((s) => s.clearAllDrawings);

  // Stage event handlers (use any event type for compatibility)
  const handleStageMouseDown = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      
      // Freehand drawing mode
      if (activeTool === 'drawing' || activeTool === 'highlighter') {
        startFreehandDrawing(activeTool === 'highlighter' ? 'highlighter' : 'freehand', pos);
        return;
      }
      
      // Arrow/zone tools
      if (activeTool === 'arrow-pass' || activeTool === 'arrow-run' || activeTool === 'zone' || activeTool === 'zone-ellipse') {
        startDrawing(pos);
      } else if (!activeTool) {
        // Check if we clicked on an interactive element (they have id starting with specific prefixes)
        const target = e.target;
        const isStage = target === stage;
        const isLayer = target.nodeType === 'Layer';
        const isPitchElement = target.name()?.startsWith('pitch') || !target.name();
        const isInteractive = target.id() && (
          target.id().startsWith('player-') ||
          target.id().startsWith('ball-') ||
          target.id().startsWith('arrow-') ||
          target.id().startsWith('zone-')
        );
        
        // Start marquee selection if clicking on empty space (not on interactive elements)
        if ((isStage || isLayer || isPitchElement) && !isInteractive) {
          setMarqueeStart(pos);
          setMarqueeEnd(pos);
        }
      }
    },
    [activeTool, startDrawing, startFreehandDrawing]
  );

  const handleStageMouseMove = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      
      // Freehand drawing - update points
      if (freehandPoints && (activeTool === 'drawing' || activeTool === 'highlighter')) {
        updateFreehandDrawing(pos);
        return;
      }
      
      // If drawing, update the end position
      if (drawingStart) {
        updateDrawing(pos);
      }
      // If marquee selection, update end
      if (marqueeStart) {
        setMarqueeEnd(pos);
      }
    },
    [drawingStart, updateDrawing, marqueeStart, freehandPoints, activeTool, updateFreehandDrawing]
  );

  const handleStageMouseUp = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      
      // Finish freehand drawing
      if (freehandPoints && (activeTool === 'drawing' || activeTool === 'highlighter')) {
        finishFreehandDrawing();
        clearActiveTool();
        return;
      }
      
      // If drawing, finish the element
      if (drawingStart && pos) {
        if (activeTool === 'arrow-pass') {
          finishArrowDrawing('pass');
          clearActiveTool();
        } else if (activeTool === 'arrow-run') {
          finishArrowDrawing('run');
          clearActiveTool();
        } else if (activeTool === 'zone') {
          finishZoneDrawing('rect');
          clearActiveTool();
        } else if (activeTool === 'zone-ellipse') {
          finishZoneDrawing('ellipse');
          clearActiveTool();
        }
      }
      
      // Finish marquee selection
      if (marqueeStart && marqueeEnd) {
        selectElementsInRect(marqueeStart, marqueeEnd);
        setMarqueeStart(null);
        setMarqueeEnd(null);
      }
    },
    [activeTool, drawingStart, finishArrowDrawing, finishZoneDrawing, clearActiveTool, marqueeStart, marqueeEnd, selectElementsInRect, freehandPoints, finishFreehandDrawing]
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Don't clear if marquee was active (selection was made via drag)
      // Also skip if tool is active
      if (activeTool) return;
      
      // Click without drag = clear selection
      const clickedOnEmpty = e.target === e.target.getStage() || 
                             e.target.name() === 'pitch-background';
      if (clickedOnEmpty && !marqueeStart) {
        clearSelection();
      }
    },
    [clearSelection, activeTool, marqueeStart]
  );

  const handleElementSelect = useCallback(
    (id: string, addToSelection: boolean) => {
      selectElement(id, addToSelection);
    },
    [selectElement]
  );

  const handleElementDragEnd = useCallback(
    (id: string, position: Position) => {
      moveElementById(id, position);
      pushHistory();
    },
    [moveElementById, pushHistory]
  );

  const handleUpdateElement = useCallback(
    (updates: { number?: number; label?: string; showLabel?: boolean; fontSize?: number; textColor?: string; opacity?: number }) => {
      updateSelectedElement(updates as Partial<PlayerElementType>);
    },
    [updateSelectedElement]
  );

  // Text editing handlers
  const handleTextDoubleClick = useCallback((id: string) => {
    const textEl = elements.find((el) => el.id === id);
    if (textEl && isTextElement(textEl)) {
      setEditingTextId(id);
      setEditingTextValue(textEl.content);
    }
  }, [elements]);

  const handleTextEditSave = useCallback(() => {
    if (editingTextId && editingTextValue.trim()) {
      updateTextContent(editingTextId, editingTextValue.trim());
    }
    setEditingTextId(null);
    setEditingTextValue('');
  }, [editingTextId, editingTextValue, updateTextContent]);

  const handleTextEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTextEditSave();
    } else if (e.key === 'Escape') {
      setEditingTextId(null);
      setEditingTextValue('');
    }
  }, [handleTextEditSave]);

  // Get editing text element for overlay positioning
  const editingTextElement = editingTextId 
    ? elements.find((el) => el.id === editingTextId && isTextElement(el))
    : null;

  // Player quick-edit handlers
  const handlePlayerQuickEdit = useCallback((id: string, currentNumber: number) => {
    setEditingPlayerId(id);
    setEditingPlayerNumber(String(currentNumber));
    selectElement(id, false);
  }, [selectElement]);

  const handlePlayerNumberSave = useCallback(() => {
    if (editingPlayerId && editingPlayerNumber.trim()) {
      const numValue = parseInt(editingPlayerNumber.trim(), 10);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 99) {
        // Update the player's number by selecting and updating
        selectElement(editingPlayerId, false);
        updateSelectedElement({ number: numValue });
        showToast(`#${numValue}`);
      }
    }
    setEditingPlayerId(null);
    setEditingPlayerNumber('');
  }, [editingPlayerId, editingPlayerNumber, selectElement, updateSelectedElement, showToast]);

  const handlePlayerNumberKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePlayerNumberSave();
    } else if (e.key === 'Escape') {
      setEditingPlayerId(null);
      setEditingPlayerNumber('');
    }
  }, [handlePlayerNumberSave]);

  // Get editing player element for overlay positioning
  const editingPlayerElement = editingPlayerId 
    ? elements.find((el) => el.id === editingPlayerId && isPlayerElement(el))
    : null;

  // Convert cloud projects to ProjectItem format for ProjectsDrawer
  const projectItems: ProjectItem[] = useMemo(() => {
    return cloudProjects.map((p) => ({
      id: p.id,
      name: p.name,
      updatedAt: p.updated_at,
      thumbnailUrl: p.thumbnail_url ?? undefined,
      isCloud: true,
    }));
  }, [cloudProjects]);

  // Fetch cloud projects when drawer opens
  useEffectReact(() => {
    if (projectsDrawerOpen && authIsAuthenticated) {
      setProjectsLoading(true);
      fetchCloudProjects().finally(() => setProjectsLoading(false));
    }
  }, [projectsDrawerOpen, authIsAuthenticated, fetchCloudProjects]);

  // ProjectsDrawer handlers
  const handleOpenProjectsDrawer = useCallback(() => {
    setProjectsDrawerOpen(true);
  }, []);

  const handleSelectProject = useCallback(async (id: string) => {
    const success = await loadFromCloud(id);
    if (success) {
      setProjectsDrawerOpen(false);
      showToast('Project loaded ☁️');
    } else {
      showToast('Failed to load project');
    }
  }, [loadFromCloud, showToast]);

  const handleCreateProject = useCallback(async () => {
    newDocument();
    setProjectsDrawerOpen(false);
    showToast('New project created');
    
    // Auto-save to cloud if authenticated
    if (authIsAuthenticated) {
      try {
        const success = await saveToCloud();
        if (success) {
          await fetchCloudProjects();
          showToast('Project saved to cloud ☁️');
        } else {
          showToast('Failed to save to cloud ❌');
        }
      } catch (error) {
        console.error('Cloud save error:', error);
        showToast('Cloud save error - check console ❌');
      }
    }
  }, [newDocument, showToast, authIsAuthenticated, saveToCloud, fetchCloudProjects]);

  const handleDeleteProject = useCallback(async (id: string) => {
    const success = await deleteProjectApi(id);
    if (success) {
      await fetchCloudProjects();
      showToast('Project deleted');
    } else {
      showToast('Failed to delete project');
    }
  }, [fetchCloudProjects, showToast]);

  const handleDuplicateProject = useCallback(async (id: string) => {
    // Load the project first, then save as new (cloudProjectId will be cleared)
    const success = await loadFromCloud(id);
    if (success) {
      // Reset cloud ID so save creates new project
      useBoardStore.setState({ cloudProjectId: null });
      await saveToCloud();
      await fetchCloudProjects();
      showToast('Project duplicated ☁️');
    }
  }, [loadFromCloud, saveToCloud, fetchCloudProjects, showToast]);

  // Rename project handler
  const handleRenameProject = useCallback((newName: string) => {
    useBoardStore.setState((state) => ({
      document: {
        ...state.document,
        name: newName,
        updatedAt: new Date().toISOString(),
      },
    }));
    showToast('Project renamed');
  }, [showToast]);

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      {/* Top Bar - hidden in focus mode */}
      {!focusMode && (
        <TopBar
          projectName={boardDoc.name}
          isSaved={isSaved}
          focusMode={focusMode}
          theme={theme}
          plan={authIsPro ? 'pro' : 'free'}
          userInitials={authUser?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || (authIsAuthenticated ? 'U' : '?')}
          isSyncing={isSaving}
          stepInfo={boardDoc.steps.length > 1 ? `Step ${currentStepIndex + 1}/${boardDoc.steps.length}` : undefined}
          onExport={handleExport}
          onToggleFocus={toggleFocusMode}
          onToggleTheme={toggleTheme}
          onOpenPalette={openCommandPalette}
          onOpenHelp={toggleCheatSheet}
          onOpenProjects={handleOpenProjectsDrawer}
          onRename={handleRenameProject}
          onOpenAccount={authIsAuthenticated ? () => showToast('Account settings coming soon') : () => setAuthModalOpen(true)}
          onUpgrade={() => setPricingModalOpen(true)}
          onLogout={authIsAuthenticated ? signOut : undefined}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area - centered with neutral background */}
        <div className="flex-1 flex items-center justify-center bg-bg p-4 overflow-auto relative">
          {/* Canvas container - premium pitch card with zoom */}
          <div 
            className="shadow-canvas rounded-[20px] overflow-hidden border border-border/50 p-3 bg-surface/50 backdrop-blur-sm transition-transform"
            style={{ transform: `scale(${effectiveZoom})`, transformOrigin: 'center' }}
          >
            <Stage
              ref={stageRef}
              width={canvasWidth}
              height={canvasHeight}
              onClick={handleStageClick}
              onTap={handleStageClick}
              onMouseDown={handleStageMouseDown}
              onTouchStart={handleStageMouseDown}
              onMouseUp={handleStageMouseUp}
              onTouchEnd={handleStageMouseUp}
              onMouseMove={handleStageMouseMove}
              onTouchMove={handleStageMouseMove}
            >
              <Layer>
                <Pitch config={pitchConfig} pitchSettings={pitchSettings} gridVisible={gridVisible} />

                {/* Zones (lowest z-order) - filtered by layer visibility */}
                {layerVisibility.zones && elements
                  .filter(isZoneElement)
                  .map((zone) => {
                    // During animation, interpolate position and size
                    const interpolated = isPlaying && animationProgress > 0 && nextStepElements
                      ? getInterpolatedZone(zone.id, zone.position, zone.width, zone.height)
                      : { position: zone.position, width: zone.width, height: zone.height };
                    
                    const animatedZone = {
                      ...zone,
                      position: interpolated.position,
                      width: interpolated.width,
                      height: interpolated.height,
                    };
                    
                    return (
                      <ZoneNode
                        key={zone.id}
                        zone={animatedZone}
                        pitchConfig={pitchConfig}
                        isSelected={!isPlaying && selectedIds.includes(zone.id)}
                        onSelect={isPlaying ? () => {} : handleElementSelect}
                        onDragEnd={isPlaying ? () => {} : handleElementDragEnd}
                        onResize={resizeZone}
                      />
                    );
                  })}

                {/* Arrows - filtered by layer visibility */}
                {layerVisibility.arrows && elements
                  .filter(isArrowElement)
                  .map((arrow) => {
                    // During animation, interpolate endpoints
                    const endpoints = isPlaying && animationProgress > 0 && nextStepElements
                      ? getInterpolatedArrowEndpoints(arrow.id, arrow.startPoint, arrow.endPoint)
                      : { start: arrow.startPoint, end: arrow.endPoint };
                    
                    const animatedArrow = {
                      ...arrow,
                      startPoint: endpoints.start,
                      endPoint: endpoints.end,
                    };
                    
                    return (
                      <ArrowNode
                        key={arrow.id}
                        arrow={animatedArrow}
                        pitchConfig={pitchConfig}
                        isSelected={!isPlaying && selectedIds.includes(arrow.id)}
                        onSelect={isPlaying ? () => {} : handleElementSelect}
                        onDragEnd={isPlaying ? () => {} : handleElementDragEnd}
                        onEndpointDrag={(id, endpoint, pos) => {
                          updateArrowEndpoint(id, endpoint, pos);
                          pushHistory();
                        }}
                      />
                    );
                  })}

                {/* Players - filtered by team visibility and group visibility */}
                {elements
                  .filter(isPlayerElement)
                  .filter((player) => !hiddenByGroup.has(player.id))
                  .filter((player) => 
                    (player.team === 'home' && layerVisibility.homePlayers) ||
                    (player.team === 'away' && layerVisibility.awayPlayers)
                  )
                  .map((player) => {
                    // During animation, interpolate position
                    const animatedPlayer = isPlaying && animationProgress > 0 && nextStepElements
                      ? { ...player, position: getInterpolatedPosition(player.id, player.position) }
                      : player;
                    
                    return (
                      <PlayerNode
                        key={player.id}
                        player={animatedPlayer}
                        pitchConfig={pitchConfig}
                        teamSettings={teamSettings}
                        isSelected={!isPlaying && selectedIds.includes(player.id)}
                        onSelect={isPlaying ? () => {} : handleElementSelect}
                        onDragEnd={isPlaying ? () => {} : handleElementDragEnd}
                        onDragStart={isPlaying ? () => false : startMultiDrag}
                        onQuickEditNumber={isPlaying ? undefined : handlePlayerQuickEdit}
                      />
                    );
                  })}

                {/* Ball (highest z-order) - filtered by layer visibility and group visibility */}
                {layerVisibility.ball && elements
                  .filter(isBallElement)
                  .filter((ball) => !hiddenByGroup.has(ball.id))
                  .map((ball) => {
                    // During animation, interpolate position
                    const animatedBall = isPlaying && animationProgress > 0 && nextStepElements
                      ? { ...ball, position: getInterpolatedPosition(ball.id, ball.position) }
                      : ball;
                    
                    return (
                      <BallNode
                        key={ball.id}
                        ball={animatedBall}
                        pitchConfig={pitchConfig}
                        isSelected={!isPlaying && selectedIds.includes(ball.id)}
                        onSelect={isPlaying ? () => {} : handleElementSelect}
                        onDragEnd={isPlaying ? () => {} : handleElementDragEnd}
                        onDragStart={isPlaying ? () => false : startMultiDrag}
                      />
                    );
                  })}

                {/* Equipment - training objects like cones, goals, mannequins */}
                {elements
                  .filter(isEquipmentElement)
                  .map((equipment) => {
                    // During animation, interpolate position
                    const animatedEquipment = isPlaying && animationProgress > 0 && nextStepElements
                      ? { ...equipment, position: getInterpolatedPosition(equipment.id, equipment.position) }
                      : equipment;
                    
                    return (
                      <EquipmentNode
                        key={equipment.id}
                        element={animatedEquipment as EquipmentElement}
                        isSelected={!isPlaying && selectedIds.includes(equipment.id)}
                        onSelect={isPlaying ? () => {} : handleElementSelect}
                        onDragEnd={isPlaying ? () => {} : (id, x, y) => {
                          moveElementById(id, { x, y });
                          pushHistory();
                        }}
                      />
                    );
                  })}

                {/* Text elements - filtered by layer visibility */}
                {layerVisibility.labels && elements
                  .filter(isTextElement)
                  .filter((t) => t.id !== editingTextId) // Hide text being edited
                  .map((textEl) => {
                    // During animation, interpolate position
                    const animatedText = isPlaying && animationProgress > 0 && nextStepElements
                      ? { ...textEl, position: getInterpolatedPosition(textEl.id, textEl.position) }
                      : textEl;
                    
                    return (
                      <TextNode
                        key={textEl.id}
                        text={animatedText}
                        pitchConfig={pitchConfig}
                        isSelected={!isPlaying && selectedIds.includes(textEl.id)}
                        onSelect={isPlaying ? () => {} : handleElementSelect}
                        onDragEnd={isPlaying ? () => {} : handleElementDragEnd}
                        onDragStart={isPlaying ? () => false : startMultiDrag}
                        onDoubleClick={isPlaying ? undefined : handleTextDoubleClick}
                      />
                    );
                  })}

                {/* Drawing preview - ghost while dragging */}
                {drawingStart && drawingEnd && (activeTool === 'arrow-pass' || activeTool === 'arrow-run') && (
                  <ArrowPreview
                    start={drawingStart}
                    end={drawingEnd}
                    type={activeTool === 'arrow-pass' ? 'pass' : 'run'}
                  />
                )}
                {drawingStart && drawingEnd && activeTool === 'zone' && (
                  <ZonePreview
                    start={drawingStart}
                    end={drawingEnd}
                    shape="rect"
                  />
                )}
                {drawingStart && drawingEnd && activeTool === 'zone-ellipse' && (
                  <ZonePreview
                    start={drawingStart}
                    end={drawingEnd}
                    shape="ellipse"
                  />
                )}

                {/* Freehand drawing elements */}
                {elements.filter(isDrawingElement).map((drawing) => (
                  <DrawingNode
                    key={drawing.id}
                    drawing={drawing}
                    isSelected={selectedIds.includes(drawing.id)}
                    onSelect={handleElementSelect}
                  />
                ))}

                {/* Live freehand preview while drawing */}
                {freehandPoints && freehandPoints.length >= 4 && (
                  <Line
                    points={freehandPoints}
                    stroke={activeTool === 'highlighter' ? '#ffff00' : '#ff0000'}
                    strokeWidth={activeTool === 'highlighter' ? 20 : 3}
                    opacity={activeTool === 'highlighter' ? 0.4 : 1}
                    lineCap="round"
                    lineJoin="round"
                    listening={false}
                  />
                )}

                {/* Marquee selection box */}
                {marqueeStart && marqueeEnd && (
                  <SelectionBox
                    x={marqueeStart.x}
                    y={marqueeStart.y}
                    width={marqueeEnd.x - marqueeStart.x}
                    height={marqueeEnd.y - marqueeStart.y}
                    visible={true}
                  />
                )}
              </Layer>
            </Stage>
          </div>

          {/* Cheat Sheet Overlay - inside canvas area */}
          {!focusMode && (
            <CheatSheetOverlay
              isVisible={cheatSheetVisible}
              onClose={toggleCheatSheet}
            />
          )}

          {/* Zoom Widget - bottom right corner */}
          <ZoomWidget
            zoom={zoom}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onZoomFit={zoomFit}
          />

          {/* Text editing input overlay */}
          {editingTextElement && isTextElement(editingTextElement) && (
            <div
              className="absolute pointer-events-auto"
              style={{
                left: `calc(50% - ${canvasWidth * zoom / 2}px + ${(editingTextElement.position.x + 12) * zoom}px)`,
                top: `calc(50% - ${canvasHeight * zoom / 2}px + ${(editingTextElement.position.y - 4) * zoom}px)`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            >
              <input
                type="text"
                value={editingTextValue}
                onChange={(e) => setEditingTextValue(e.target.value)}
                onKeyDown={handleTextEditKeyDown}
                onBlur={handleTextEditSave}
                autoFocus
                className="px-2 py-1 bg-surface border border-accent rounded text-white text-base min-w-[100px] outline-none shadow-lg"
                style={{
                  fontSize: editingTextElement.fontSize,
                  fontWeight: editingTextElement.bold ? 'bold' : 'normal',
                  fontFamily: editingTextElement.fontFamily,
                }}
              />
            </div>
          )}

          {/* Player number quick-edit overlay */}
          {editingPlayerElement && isPlayerElement(editingPlayerElement) && (
            <div
              className="absolute pointer-events-auto z-50"
              style={{
                left: `calc(50% - ${canvasWidth * zoom / 2}px + ${editingPlayerElement.position.x * zoom}px)`,
                top: `calc(50% - ${canvasHeight * zoom / 2}px + ${editingPlayerElement.position.y * zoom}px)`,
                transform: `scale(${zoom}) translate(-50%, -50%)`,
                transformOrigin: 'center',
              }}
            >
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={editingPlayerNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setEditingPlayerNumber(val);
                }}
                onKeyDown={handlePlayerNumberKeyDown}
                onBlur={handlePlayerNumberSave}
                autoFocus
                className="w-12 h-10 text-center bg-surface border-2 border-accent rounded-lg text-white text-xl font-bold outline-none shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Right Inspector - hidden in focus mode */}
        {!focusMode && (
          <RightInspector
            isOpen={inspectorOpen}
            onToggle={toggleInspector}
            selectedCount={selectedIds.length}
            selectedElement={inspectorElement}
            elements={elementsList}
            layerVisibility={layerVisibility}
            groups={groups}
            onUpdateElement={handleUpdateElement}
            onSelectElement={(id) => selectElement(id, false)}
            onToggleLayerVisibility={toggleLayerVisibility}
            onSelectGroup={selectGroup}
            onToggleGroupLock={toggleGroupLock}
            onToggleGroupVisibility={toggleGroupVisibility}
            onRenameGroup={renameGroup}
            onQuickAction={handleQuickAction}
            teamSettings={teamSettings}
            onUpdateTeam={updateTeamSettings}
            pitchSettings={pitchSettings ?? DEFAULT_PITCH_SETTINGS}
            onUpdatePitch={updatePitchSettings}
          />
        )}
      </div>

      {/* Bottom Steps Bar */}
      <BottomStepsBar
        steps={stepsData}
        currentStepIndex={currentStepIndex}
        isPlaying={isPlaying}
        isLooping={isLooping}
        duration={stepDuration}
        onStepSelect={goToStep}
        onAddStep={addStep}
        onDeleteStep={removeStep}
        onRenameStep={renameStep}
        onPlay={play}
        onPause={pause}
        onPrevStep={prevStep}
        onNextStep={nextStep}
        onToggleLoop={toggleLoop}
        onDurationChange={setStepDuration}
      />

      {/* Command Palette Modal */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={closeCommandPalette}
        actions={commandActions}
      />

      {/* Toast Hint */}
      <ToastHint message={activeToast?.message ?? null} />

      {/* Focus Mode Exit - mini bar on mouse near top */}
      {focusMode && (
        <div 
          className="fixed top-0 left-0 right-0 h-2 z-50 group"
          onMouseEnter={() => {}}
        >
          <div className="absolute inset-x-0 top-0 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-surface/95 backdrop-blur-sm border-b border-border">
            <button
              onClick={toggleFocusMode}
              className="px-3 py-1 text-sm text-muted hover:text-text rounded-md hover:bg-surface2 transition-colors"
            >
              Exit Focus Mode
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          clearAuthError();
        }}
        onSignIn={async (email, password) => {
          await signIn(email, password);
          setAuthModalOpen(false);
          showToast('Welcome back!');
        }}
        onSignUp={signUp}
        onSignInWithGoogle={signInWithGoogle}
        error={authError}
        isLoading={authIsLoading}
      />

      {/* Pricing Modal */}
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        currentPlan={authIsPro ? 'pro' : 'free'}
        isAuthenticated={authIsAuthenticated}
        onSignUp={() => {
          setPricingModalOpen(false);
          setAuthModalOpen(true);
        }}
      />

      {/* Welcome Overlay - first time visitors */}
      <WelcomeOverlay
        isVisible={welcomeVisible && !authIsAuthenticated}
        onGetStarted={() => {
          localStorage.setItem('tmc-visited', 'true');
          setWelcomeVisible(false);
          setAuthModalOpen(true);
        }}
        onSignIn={() => {
          localStorage.setItem('tmc-visited', 'true');
          setWelcomeVisible(false);
          setAuthModalOpen(true);
        }}
        onDismiss={() => {
          localStorage.setItem('tmc-visited', 'true');
          setWelcomeVisible(false);
        }}
      />

      {/* Projects Drawer - Cloud projects management */}
      <ProjectsDrawer
        isOpen={projectsDrawerOpen}
        onClose={() => setProjectsDrawerOpen(false)}
        projects={projectItems}
        currentProjectId={cloudProjectId}
        isAuthenticated={authIsAuthenticated}
        isLoading={projectsLoading}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        onSignIn={() => {
          setProjectsDrawerOpen(false);
          setAuthModalOpen(true);
        }}
        onRefresh={async () => {
          setProjectsLoading(true);
          await fetchCloudProjects();
          setProjectsLoading(false);
          showToast('Projects refreshed');
        }}
      />
    </div>
  );
}
