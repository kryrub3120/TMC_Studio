/**
 * useKeyboardShortcuts Hook
 * 
 * Registers all global keyboard shortcuts using KeyboardService.
 * Replaces the monolithic handleKeyDown from App.tsx.
 * 
 * Total shortcuts: ~85
 * 
 * @see docs/REFACTOR_ROADMAP.md - PR-REFACTOR-1
 */

import { useEffect, useCallback, type RefObject } from 'react';
import { useBoardStore } from '../store';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { isTextElement, isPlayerElement, isZoneElement, isArrowElement, PITCH_THEMES } from '@tmc/core';
import { formations } from '@tmc/presets';
import { useTranslation } from '@tmc/ui';
import { useCommandRegistry } from './useCommandRegistry';
import { ANIMATION_ENABLED } from '../config/featureFlags';

/**
 * Props for useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsParams {
  // Export handlers (require stageRef access)
  handleExportPNG: () => void;
  handleExportAllSteps: () => void;
  handleExportPDF: () => void;
  handleExportGIF: () => void;
  
  // Toast notification
  showToast: (message: string) => void;
  
  // Text editing callbacks
  onStartEditingText?: (id: string, content: string) => void;
  
  // Player number editing callback (H2)
  onStartEditingPlayerNumber?: (id: string, currentNumber: number | undefined) => void;
  
  // Focus label input in RightInspector (Sprint A — Enter→edit label)
  onFocusLabelInput?: () => void;
  
  // Step management (gated by entitlements)
  addStep: () => void;
  
  // Pricing modal (PR3)
  onOpenPricingModal?: () => void;
  
  // Context menu state (for guards)
  contextMenuVisible: boolean;

  // Konva stage ref for pointer hit-testing (scroll-to-resize)
  stageRef: RefObject<any>;
}

/**
 * Hook that registers all keyboard shortcuts
 */
export function useKeyboardShortcuts(params: UseKeyboardShortcutsParams): void {
  const {
    handleExportPNG,
    handleExportAllSteps,
    handleExportPDF,
    handleExportGIF,
    showToast,
    onStartEditingText,
    onStartEditingPlayerNumber,
    onFocusLabelInput,
    addStep,
    onOpenPricingModal, // PR3
    contextMenuVisible,
    stageRef,
  } = params;
  const { t } = useTranslation();
  const showTranslatedToast = useCallback(
    (key: string, vars?: Record<string, string | number>) => showToast(t(`commands.toast.${key}`, vars)),
    [showToast, t]
  );
  
  // ===== Command Registry (PR1) =====
  const cmdRegistry = useCommandRegistry();
  
  // ===== Board Store Actions =====
  const addPlayerAtCursor = useBoardStore((s) => s.addPlayerAtCursor);
  const addBallAtCursor = useBoardStore((s) => s.addBallAtCursor);
  const addBallGroupAtCursor = useBoardStore((s) => s.addBallGroupAtCursor);
  const addTextAtCursor = useBoardStore((s) => s.addTextAtCursor);
  const addEquipmentAtCursor = useBoardStore((s) => s.addEquipmentAtCursor);
  const duplicateSelected = useBoardStore((s) => s.duplicateSelected);
  const copySelection = useBoardStore((s) => s.copySelection);
  const pasteClipboard = useBoardStore((s) => s.pasteClipboard);
  const clearAllDrawings = useBoardStore((s) => s.clearAllDrawings);
  const setElements = useBoardStore((s) => s.setElements);
  const createGroup = useBoardStore((s) => s.createGroup);
  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);
  // ✅ selectAll, clearSelection now via cmdRegistry (PR1)
  const deleteSelected = useBoardStore((s) => s.deleteSelected);
  const cycleZoneShape = useBoardStore((s) => s.cycleZoneShape);
  const cyclePlayerShape = useBoardStore((s) => s.cyclePlayerShape);
  const saveDocument = useBoardStore((s) => s.saveDocument);
  const manualSave = useBoardStore((s) => s.manualSave);
  const saveToCloud = useBoardStore((s) => s.saveToCloud);
  const fetchCloudProjects = useBoardStore((s) => s.fetchCloudProjects);
  const updatePitchSettings = useBoardStore((s) => s.updatePitchSettings);
  const getPitchSettings = useBoardStore((s) => s.getPitchSettings);
  const nudgeSelected = useBoardStore((s) => s.nudgeSelected);
  const adjustSelectedStrokeWidth = useBoardStore((s) => s.adjustSelectedStrokeWidth);
  const cycleSelectedColor = useBoardStore((s) => s.cycleSelectedColor);
  const rotateSelected = useBoardStore((s) => s.rotateSelected);
  const resizeSelected = useBoardStore((s) => s.resizeSelected);
  const scaleSelectedEquipmentBy = useBoardStore((s) => s.scaleSelectedEquipmentBy);
  const updateTextProperties = useBoardStore((s) => s.updateTextProperties);
  const applyFormation = useBoardStore((s) => s.applyFormation);
  const cycleGoalkeeperColor = useBoardStore((s) => s.cycleGoalkeeperColor);
  const removeStep = useBoardStore((s) => s.removeStep);
  const prevStep = useBoardStore((s) => s.prevStep);
  const nextStep = useBoardStore((s) => s.nextStep);
  const setPlayerOrientation = useBoardStore((s) => s.setPlayerOrientation); // PR3
  const resetPlayerOrientation = useBoardStore((s) => s.resetPlayerOrientation); // PR3
  const updatePlayerOrientationSettings = useBoardStore((s) => s.updatePlayerOrientationSettings);
  const togglePlayerVision = useBoardStore((s) => s.togglePlayerVision); // Per-player vision toggle
  const toggleArrowNumber = useBoardStore((s) => s.toggleArrowNumber); // PR-ARROW-NUMBER
  const toggleAutoNumbering = useBoardStore((s) => s.toggleAutoNumbering); // PR-ARROW-NUMBER
  const setNextArrowShouldBeNumbered = useBoardStore((s) => s.setNextArrowShouldBeNumbered); // PR-ARROW-NUMBER
  // setPlayerVision available if needed for future use
  
  // ===== UI Store State & Actions =====
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const closeCommandPalette = useUIStore((s) => s.closeCommandPalette);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const toggleGrid = useUIStore((s) => s.toggleGrid);
  const toggleInspector = useUIStore((s) => s.toggleInspector);
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);
  const toggleCheatSheet = useUIStore((s) => s.toggleCheatSheet);
  const zoomIn = useUIStore((s) => s.zoomIn);
  const zoomOut = useUIStore((s) => s.zoomOut);
  const isPlaying = useUIStore((s) => s.isPlaying);
  const play = useUIStore((s) => s.play);
  const pause = useUIStore ((s) => s.pause);
  const toggleLoop = useUIStore((s) => s.toggleLoop);
  const togglePrintMode = useUIStore((s) => s.togglePrintMode);
  const isPrintMode = useUIStore((s) => s.isPrintMode);
  
  // ===== Auth Store =====
  const authIsAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authIsPro = useAuthStore((s) => s.isPro); // PR3
  
  // Main keyboard event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isCmd = e.metaKey || e.ctrlKey;
    const target = e.target as HTMLElement;
    
    // === Guard: Skip if typing in input / select / contentEditable ===
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }
    
    // === Guard: Context menu open (only Escape allowed) ===
    if (contextMenuVisible && e.key !== 'Escape') {
      return;
    }
    
    // === Command Palette Toggle (always available) ===
    if (isCmd && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      commandPaletteOpen ? closeCommandPalette() : openCommandPalette();
      return;
    }
    
    // === Guard: Skip if command palette is open ===
    if (commandPaletteOpen) return;
    
    // Get current state for conditional shortcuts
    const state = useBoardStore.getState();
    const uiState = useUIStore.getState();
    const { elements, selectedIds, currentStepIndex, document: boardDoc } = state;
    
    // Helper: Check if selected element is text
    const getSelectedText = () => {
      if (selectedIds.length !== 1) return null;
      const el = elements.find((e) => e.id === selectedIds[0]);
      return el && isTextElement(el) ? el : null;
    };
    
    // Helper: Check if selected element is player
    const hasSelectedPlayer = () => elements.some((el) => 
      selectedIds.includes(el.id) && isPlayerElement(el)
    );
    
    // Helper: Check if selected element is zone
    const hasSelectedZone = () => elements.some((el) => 
      selectedIds.includes(el.id) && isZoneElement(el)
    );
    
    // Helper: Check if selected element is equipment
    const hasSelectedEquipment = () => elements.some((el) => 
      selectedIds.includes(el.id) && el.type === 'equipment'
    );
    
    // Helper: Check if selected element is arrow (PR-ARROW-NUMBER)
    const hasSelectedArrow = () => selectedIds.length === 1 && elements.some((el) =>
      selectedIds.includes(el.id) && isArrowElement(el)
    );
    
    const key = e.key.toLowerCase();
    
    // Prevent browser shortcuts that conflict with ours
    if (isCmd) {
      const browserShortcuts = ['d', 's', 'e', 'g', 'k', 'a', 'c', 'v', 'z', '+', '=', '-'];
      if (browserShortcuts.includes(key)) {
        e.preventDefault();
      }
    }
    
    switch (key) {
      // ===== ELEMENTS =====
      case 'p':
        if (isCmd && e.shiftKey) {
          e.preventDefault();
          handleExportPDF();
        } else if (!isCmd && e.altKey && e.shiftKey) {
          e.preventDefault();
          addPlayerAtCursor('team4');
          showTranslatedToast('team4Player');
        } else if (!isCmd && e.altKey) {
          e.preventDefault();
          addPlayerAtCursor('team3');
          showTranslatedToast('team3Player');
        } else if (!isCmd && e.shiftKey) {
          e.preventDefault();
          addPlayerAtCursor('away');
          showTranslatedToast('team2Player');
        } else if (!isCmd) {
          e.preventDefault();
          addPlayerAtCursor('home');
          showTranslatedToast('team1Player');
        }
        break;
        
      case 'b':
        if (!isCmd) {
          e.preventDefault();
          if (e.shiftKey) {
            addBallGroupAtCursor();
            showTranslatedToast('ballCluster');
          } else {
            addBallAtCursor();
            showTranslatedToast('ball');
          }
        }
        break;
        
      case 't':
        if (!isCmd) {
          e.preventDefault();
          addTextAtCursor();
          showTranslatedToast('text');
        }
        break;
        
      // === Equipment ===
      case 'm':
        if (!isCmd) {
          e.preventDefault();
          if (e.shiftKey) {
            addEquipmentAtCursor('mannequin', 'flat');
            showTranslatedToast('lyingMannequin');
          } else {
            addEquipmentAtCursor('mannequin');
            showTranslatedToast('mannequin');
          }
        }
        break;
        
      case 'k':
        if (!isCmd) {
          e.preventDefault();
          // Cone family: K = standard cone, Alt+K = flat disc marker,
          // Shift+K = pole (legacy binding kept). Mirrors the Z/Shift+Z/Alt+Z
          // zone pattern so modifiers stay consistent across tools.
          if (e.altKey) {
            addEquipmentAtCursor('cone', 'flat');
            showTranslatedToast('discMarker');
          } else if (e.shiftKey) {
            addEquipmentAtCursor('pole');
            showTranslatedToast('pole');
          } else {
            addEquipmentAtCursor('cone');
            showTranslatedToast('cone');
          }
        }
        break;
        
      case 'q':
        if (!isCmd) {
          e.preventDefault();
          addEquipmentAtCursor('hoop');
          showTranslatedToast('hoop');
        }
        break;
        
      case 'u':
        if (!isCmd) {
          e.preventDefault();
          addEquipmentAtCursor('hurdle');
          showTranslatedToast('hurdle');
        }
        break;
        
      case 'y':
        if (!isCmd) {
          e.preventDefault();
          addEquipmentAtCursor('ladder');
          showTranslatedToast('ladder');
        }
        break;
        
      case 'j':
        if (!isCmd) {
          e.preventDefault();
          if (e.shiftKey) {
            addEquipmentAtCursor('goal', 'mini');
            showTranslatedToast('miniGoal');
          } else {
            addEquipmentAtCursor('goal');
            showTranslatedToast('goal');
          }
        }
        break;
        
      // ===== EDIT COMMANDS =====
      case 'z':
        if (isCmd && e.shiftKey) {
          e.preventDefault();
          redo();
          showTranslatedToast('redo');
        } else if (isCmd) {
          e.preventDefault();
          undo();
          showTranslatedToast('undo');
        } else {
          // Z = rect zone tool, Shift+Z = ellipse zone tool, Alt+Z = polygon zone tool
          e.preventDefault();
          setActiveTool(e.altKey ? 'zone-polygon' : e.shiftKey ? 'zone-ellipse' : 'zone');
        }
        break;
        
      case 'd':
        if (isCmd) {
          e.preventDefault();
          duplicateSelected();
          showTranslatedToast('duplicated');
        } else if (e.shiftKey) {
          e.preventDefault();
          setActiveTool('drawing');
        } else {
          e.preventDefault();
          setActiveTool('arrow-dribble');
          showTranslatedToast('dribbleArrow');
        }
        break;
        
      case 'c':
        if (isCmd) {
          e.preventDefault();
          copySelection();
          showTranslatedToast('copied');
        } else if (e.shiftKey) {
          // Shift+C = Clear all elements on this step
          e.preventDefault();
          useUIStore.getState().showConfirmModal({
            title: 'Clear All Elements?',
            description: 'This will remove all elements from the current step. You can undo this action with Cmd+Z.',
            confirmLabel: 'Clear All',
            danger: true,
            onConfirm: () => {
              setElements([]);
              showTranslatedToast('allElementsCleared');
              useUIStore.getState().closeConfirmModal();
            },
          });
        } else {
          // C = Clear drawings only (no confirmation, undoable)
          e.preventDefault();
          const drawingsCount = elements.filter(el => el.type === 'drawing').length;
          if (drawingsCount === 0) {
            showTranslatedToast('noDrawingsToClear');
          } else {
            clearAllDrawings();
            showTranslatedToast('drawingsCleared', { count: drawingsCount });
          }
        }
        break;
        
      case 'v':
        if (isCmd) {
          // Cmd+V = Paste — handled here, no orientation guard needed.
          e.preventDefault();
          pasteClipboard();
          showTranslatedToast('pasted');
          break;
        }
        // V / Shift+V = Vision / orientation toggle (requires orientation feature enabled).
        // Handled ONLY here — no duplicate e.code block below.
        e.preventDefault();
        {
          const orientationSettings = useBoardStore.getState().getPlayerOrientationSettings();
          if (!orientationSettings.enabled) {
            showTranslatedToast('enableOrientation');
            break;
          }
          if (e.shiftKey) {
            // Shift+V = Toggle vision for ALL players on board
            const allPlayerIds = elements
              .filter((el) => isPlayerElement(el))
              .map((el) => el.id);
            if (allPlayerIds.length > 0) {
              // Mirror togglePlayerVision logic: any explicitly-off → turns all ON; else all OFF
              const anyExplicitlyOff = elements.some(
                (el) => allPlayerIds.includes(el.id) && isPlayerElement(el) && el.showVision === false
              );
              const willTurnOn = anyExplicitlyOff;
              togglePlayerVision(allPlayerIds);
              showTranslatedToast(willTurnOn ? 'visionAllOn' : 'visionAllOff', { count: allPlayerIds.length });
            } else {
              showTranslatedToast('noPlayersOnBoard');
            }
          } else {
            // V = Toggle vision for SELECTED players only
            const selectedPlayerIds = elements
              .filter((el) => selectedIds.includes(el.id) && isPlayerElement(el))
              .map((el) => el.id);
            if (selectedPlayerIds.length > 0) {
              togglePlayerVision(selectedPlayerIds);
              showTranslatedToast('visionSelected', { count: selectedPlayerIds.length });
            } else {
              showTranslatedToast('selectPlayersForVision');
            }
          }
        }
        break;
        
      case 'g':
        if (isCmd && e.shiftKey) {
          e.preventDefault();
          handleExportGIF();
        } else if (isCmd) {
          e.preventDefault();
          createGroup();
          showTranslatedToast('groupCreated');
        } else if (e.shiftKey) {
          // Shift+G = goalkeeper: promote a single selected player to GK,
          // otherwise cycle the relevant team's goalkeeper jersey color.
          e.preventDefault();
          const res = cycleGoalkeeperColor();
          const teamLabel =
            res.team === 'home' ? 'Home' :
            res.team === 'away' ? 'Away' :
            res.team === 'team3' ? 'Team 3' : 'Team 4';
          showTranslatedToast(
            res.promoted ? 'goalkeeperSet' : 'goalkeeperColor',
            { team: teamLabel, color: res.color.toUpperCase() }
          );
        } else {
          // G = Toggle grid
          e.preventDefault();
          toggleGrid();
          showTranslatedToast(uiState.gridVisible ? 'gridHidden' : 'gridVisible');
        }
        break;
        
      case 'a':
        if (isCmd) {
          e.preventDefault();
          cmdRegistry.board.selection.selectAll();
        } else if (e.shiftKey) {
          // Shift+A = activate pass arrow tool + auto-number one-shot (PR-ARROW-NUMBER)
          e.preventDefault();
          setNextArrowShouldBeNumbered(true);
          setActiveTool('arrow-pass');
          showTranslatedToast('passArrowAutoNumber');
        } else {
          e.preventDefault();
          setActiveTool('arrow-pass');
        }
        break;
        
      case 'r':
        if (!isCmd) {
          if (e.shiftKey) {
            // Shift+R = activate run arrow tool + auto-number one-shot (PR-ARROW-NUMBER)
            e.preventDefault();
            setNextArrowShouldBeNumbered(true);
            setActiveTool('arrow-run');
            showTranslatedToast('runArrowAutoNumber');
          } else {
            e.preventDefault();
            setActiveTool('arrow-run');
          }
        }
        break;

      case 'h':
        if (!isCmd) {
          e.preventDefault();
          setActiveTool('highlighter');
        }
        break;
        
      case 'e':
        // E = cycle zone shape when zone selected
        if (!isCmd && hasSelectedZone()) {
          e.preventDefault();
          cycleZoneShape();
          showTranslatedToast('zoneShapeChanged');
        } else if (isCmd) {
          // Cmd+E = Export PNG
          e.preventDefault();
          if (e.shiftKey) {
            handleExportAllSteps();
          } else {
            handleExportPNG();
          }
        }
        break;
        
      case 's':
        if (isCmd) {
          e.preventDefault();
          manualSave().then((cloudSaved) => {
            if (authIsAuthenticated) {
              fetchCloudProjects();
              showTranslatedToast(cloudSaved ? 'savedCloud' : 'cloudSaveFailed');
            } else {
              showTranslatedToast('savedLocal');
            }
          });
        } else if (e.shiftKey && hasSelectedPlayer()) {
          // Shift+S = cycle player shape (when player selected)
          e.preventDefault();
          cyclePlayerShape();
          showTranslatedToast('shapeChanged');
        } else if (!e.shiftKey) {
          // S = shoot arrow (primary shortcut)
          e.preventDefault();
          setActiveTool('arrow-shoot');
        }
        break;
        
      // ===== VIEW =====
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
        
      case 'o':
        // O = Toggle orientation
        if (!isCmd) {
          e.preventDefault();
          const currentOrientation = getPitchSettings()?.orientation ?? 'landscape';
          const newOrientation = currentOrientation === 'landscape' ? 'portrait' : 'landscape';
          updatePitchSettings({ orientation: newOrientation });
          if (newOrientation === 'portrait') {
            useUIStore.getState().setZoom(0.75);
          } else {
            useUIStore.getState().setZoom(1.0);
          }
          showTranslatedToast(newOrientation === 'portrait' ? 'portraitMode' : 'landscapeMode');
        }
        break;
        
      case 'w':
        // W = Toggle print mode (with pitch color change)
        if (!isCmd) {
          e.preventDefault();
          const currentPitchSettings = getPitchSettings();
          const isPrintFriendly = currentPitchSettings?.primaryColor === '#ffffff';
          
          if (isPrintFriendly) {
            // Toggle back to grass theme AND disable print mode
            const grassTheme = PITCH_THEMES['grass'];
            updatePitchSettings({
              theme: 'grass',
              ...grassTheme,
            });
            if (isPrintMode) {
              togglePrintMode();
            }
            showTranslatedToast('printModeOff');
          } else {
            // Set to print-friendly mode AND enable print mode
            updatePitchSettings({
              theme: 'custom',
              primaryColor: '#ffffff',
              stripeColor: '#f5f5f5',
              lineColor: '#000000',
              showStripes: false,
            });
            if (!isPrintMode) {
              togglePrintMode();
            }
            showTranslatedToast('printModeOn');
          }
        }
        break;
        
      // ===== SELECTION =====
      case 'delete':
      case 'backspace':
        e.preventDefault();
        deleteSelected();
        break;
        
      case 'escape':
        cmdRegistry.board.selection.clear();
        break;
        
      case 'enter':
        // Sprint A: Enter on selected player → focus label input in RightInspector
        // Fallback: Enter on selected player = start editing number (H2 string)
        // Enter on selected text = start editing text
        if (selectedIds.length === 1) {
          const el = elements.find((e) => e.id === selectedIds[0]);
          
          if (el && isPlayerElement(el)) {
            e.preventDefault();
            // Prefer focus label input (Sprint A)
            if (onFocusLabelInput) {
              onFocusLabelInput();
            } else if (onStartEditingPlayerNumber) {
              onStartEditingPlayerNumber(el.id, (el as any).number);
            }
          } else if (el && isTextElement(el) && onStartEditingText) {
            e.preventDefault();
            onStartEditingText(el.id, (el as any).content);
          }
        }
        break;
        
      // ===== STEPS & PLAYBACK =====
      // Space is reserved for temporary hand pan (PR-FIX-4)
      // Pan is handled in BoardCanvasSection via Space+drag
      case ' ':
        e.preventDefault();
        // No action — Space is pan-only now
        break;
        
      // Animation shortcut (L = toggle loop) - gated behind feature flag for MVP
      case 'l':
        if (ANIMATION_ENABLED && !isCmd) {
          e.preventDefault();
          toggleLoop();
          showTranslatedToast(uiState.isLooping ? 'loopOff' : 'loopOn');
        }
        break;
        
      // Animation shortcut (N = add step) - gated behind feature flag for MVP
      case 'n':
        if (!isCmd && e.shiftKey) {
          // Shift+N = toggle auto-numbering mode (PR-ARROW-NUMBER)
          e.preventDefault();
          toggleAutoNumbering();
          const isOn = useBoardStore.getState().isAutoNumbering;
          showTranslatedToast(isOn ? 'autoNumberingOn' : 'autoNumberingOff');
        } else if (ANIMATION_ENABLED && !isCmd) {
          e.preventDefault();
          addStep();
          showTranslatedToast('stepAdded');
        }
        break;
        
      // Animation shortcut (X = delete current step) - gated behind feature flag for MVP
      case 'x':
        // X = Delete current step (only if more than 1 step)
        if (ANIMATION_ENABLED && !isCmd && boardDoc.steps.length > 1) {
          e.preventDefault();
          removeStep(currentStepIndex);
          showTranslatedToast('stepDeleted');
        }
        break;
        
      // ===== ARROW KEYS =====
      case 'arrowup':
        e.preventDefault();
        {
          const textEl = getSelectedText();
          if (textEl) {
            if (e.shiftKey) {
              // Shift+Up = cycle background color
              const BG_COLORS = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#3b82f6', '#1f2937'];
              const currentBg = textEl.backgroundColor;
              const currentIndex = currentBg ? BG_COLORS.indexOf(currentBg) : -1;
              const newBg = BG_COLORS[(currentIndex + 1) % BG_COLORS.length];
              updateTextProperties(textEl.id, { backgroundColor: newBg });
              showTranslatedToast('background', { color: newBg });
            } else {
              // Up = increase font size
              const newSize = Math.min(72, (textEl.fontSize || 18) + 2);
              updateTextProperties(textEl.id, { fontSize: newSize });
              showTranslatedToast('fontSize', { size: newSize });
            }
          } else if (e.altKey) {
            cycleSelectedColor(-1);
            showTranslatedToast('previousColor');
          } else {
            nudgeSelected(0, e.shiftKey ? -1 : -5);
          }
        }
        break;
        
      case 'arrowdown':
        e.preventDefault();
        {
          const textEl = getSelectedText();
          if (textEl) {
            if (e.shiftKey) {
              updateTextProperties(textEl.id, { backgroundColor: undefined });
              showTranslatedToast('backgroundRemoved');
            } else {
              const newSize = Math.max(8, (textEl.fontSize || 18) - 2);
              updateTextProperties(textEl.id, { fontSize: newSize });
              showTranslatedToast('fontSize', { size: newSize });
            }
          } else if (e.altKey) {
            cycleSelectedColor(1);
            showTranslatedToast('nextColor');
          } else {
            nudgeSelected(0, e.shiftKey ? 1 : 5);
          }
        }
        break;
        
      case 'arrowleft':
        e.preventDefault();
        {
          const textEl = getSelectedText();
          if (textEl) {
            updateTextProperties(textEl.id, { bold: !textEl.bold });
            showTranslatedToast(textEl.bold ? 'normal' : 'bold');
          } else if (e.altKey) {
            adjustSelectedStrokeWidth(-1);
            showTranslatedToast('thinnerStroke');
          } else if (ANIMATION_ENABLED && !isCmd && selectedIds.length === 0) {
            // Animation: previous step (gated behind feature flag for MVP)
            prevStep();
          } else {
            nudgeSelected(e.shiftKey ? -1 : -5, 0);
          }
        }
        break;
        
      case 'arrowright':
        e.preventDefault();
        {
          // PR-ARROW-NUMBER: ArrowRight on selected arrow toggles numbering
          if (hasSelectedArrow()) {
            const arrowId = selectedIds[0];
            toggleArrowNumber(arrowId);
            showTranslatedToast('arrowNumberToggled');
            break;
          }
          const textEl = getSelectedText();
          if (textEl) {
            updateTextProperties(textEl.id, { italic: !textEl.italic });
            showTranslatedToast(textEl.italic ? 'normal' : 'italic');
          } else if (e.altKey) {
            adjustSelectedStrokeWidth(1);
            showTranslatedToast('thickerStroke');
          } else if (ANIMATION_ENABLED && !isCmd && selectedIds.length === 0) {
            // Animation: next step (gated behind feature flag for MVP)
            nextStep();
          } else {
            nudgeSelected(e.shiftKey ? 1 : 5, 0);
          }
        }
        break;
        
      // ===== ZOOM & RESIZE =====
      case '=':
      case '+':
        // ✅ IMPERATIVE guard — lock disables zoom shortcuts
        if (useUIStore.getState().viewportLocked) break;
        if (isCmd && e.altKey) {
          // Option+Cmd+= = Resize up +10%
          e.preventDefault();
          resizeSelected(1.1);
          showTranslatedToast('resizedUp');
        } else if (isCmd) {
          e.preventDefault();
          zoomIn();
        } else if (!isCmd && hasSelectedEquipment()) {
          // + = Equipment resize +15%
          e.preventDefault();
          scaleSelectedEquipmentBy(1.15);
          showTranslatedToast('equipmentUp');
        } else if (!isCmd) {
          // Plain + / = = Zoom In (no selection required)
          e.preventDefault();
          zoomIn();
        }
        break;
        
      case '-':
        // ✅ IMPERATIVE guard — lock disables zoom shortcuts
        if (useUIStore.getState().viewportLocked) break;
        if (isCmd && e.altKey) {
          // Option+Cmd+- = Resize down -10%
          e.preventDefault();
          resizeSelected(0.9);
          showTranslatedToast('resizedDown');
        } else if (isCmd) {
          e.preventDefault();
          zoomOut();
        } else if (!isCmd && hasSelectedEquipment()) {
          // - = Equipment resize -15%
          e.preventDefault();
          scaleSelectedEquipmentBy(0.85);
          showTranslatedToast('equipmentDown');
        } else if (!isCmd) {
          // Plain - = Zoom Out (no selection required)
          e.preventDefault();
          zoomOut();
        }
        break;
        
      // ===== ROTATION =====
      // Note: Use e.code instead of e.key for bracket keys to support macOS Alt key
      
      case '0':
        if (!isCmd && e.altKey && hasSelectedPlayer()) {
          // Alt+0 = Reset player orientation
          e.preventDefault();
          const playerIds = elements.filter(el => selectedIds.includes(el.id) && isPlayerElement(el)).map(el => el.id);
          resetPlayerOrientation(playerIds);
          state.pushHistory();
          showTranslatedToast('orientationReset');
        } else if (!isCmd && !e.altKey && !e.shiftKey) {
          // ✅ IMPERATIVE guard — lock disables zoom shortcuts
          if (useUIStore.getState().viewportLocked) break;
          // 0 = Fit (reset zoom and pan)
          e.preventDefault();
          useUIStore.getState().zoomFit();
        }
        break;
    }
    
    // ===== BRACKET ROTATION (e.code check for macOS compatibility) =====
    // Priority: players first (orientation), then equipment (rotation)
    if (e.code === 'BracketLeft' && !isCmd) {
      // [ key - plain (no modifiers)
      e.preventDefault();
      if (hasSelectedPlayer()) {
        // [ = Player orientation -15° (or -5° with Shift)
        const playerIds = elements.filter(el => selectedIds.includes(el.id) && isPlayerElement(el)).map(el => el.id);
        const delta = e.shiftKey ? -5 : -15;
        setPlayerOrientation(playerIds, delta);
        state.pushHistory();
        showTranslatedToast('playerOrientation', { delta });
      } else if (hasSelectedEquipment()) {
        // [ = Equipment rotation (fallback)
        rotateSelected(-15);
        showTranslatedToast('rotatedLeft15');
      }
    }
    
    if (e.code === 'BracketRight' && !isCmd) {
      // ] key - plain (no modifiers)
      e.preventDefault();
      if (hasSelectedPlayer()) {
        // ] = Player orientation +15° (or +5° with Shift)
        const playerIds = elements.filter(el => selectedIds.includes(el.id) && isPlayerElement(el)).map(el => el.id);
        const delta = e.shiftKey ? 5 : 15;
        setPlayerOrientation(playerIds, delta);
        state.pushHistory();
        showTranslatedToast('playerOrientation', { delta: `+${delta}` });
      } else if (hasSelectedEquipment()) {
        // ] = Equipment rotation (fallback)
        rotateSelected(15);
        showTranslatedToast('rotatedRight15');
      }
    }
    
    // Shift+[ and Shift+] produce { and } - equipment 90° rotation
    if (key === '{' && !isCmd && hasSelectedEquipment()) {
      e.preventDefault();
      rotateSelected(-90);
      showTranslatedToast('rotatedLeft90');
    }
    
    if (key === '}' && !isCmd && hasSelectedEquipment()) {
      e.preventDefault();
      rotateSelected(90);
      showTranslatedToast('rotatedRight90');
    }
    
    // ===== FORMATIONS (1-6, Shift+1-6) =====
    if (!isCmd && !e.altKey) {
      const formationIndex: Record<string, number> = {
        'Digit1': 0, 'Numpad1': 0, 'Digit2': 1, 'Numpad2': 1,
        'Digit3': 2, 'Numpad3': 2, 'Digit4': 3, 'Numpad4': 3,
        'Digit5': 4, 'Numpad5': 4, 'Digit6': 5, 'Numpad6': 5,
      };
      
      const idx = formationIndex[e.code];
      if (idx !== undefined && formations[idx]) {
        e.preventDefault();
        const team = e.shiftKey ? 'away' : 'home';
        applyFormation(formations[idx].id, team);
        showTranslatedToast('formationApplied', { formation: formations[idx].shortName, team });
      }
    }
  }, [
    // Dependencies
    cmdRegistry,
    commandPaletteOpen, closeCommandPalette, openCommandPalette, contextMenuVisible,
    addPlayerAtCursor, addBallAtCursor, addBallGroupAtCursor, addTextAtCursor, addEquipmentAtCursor,
    duplicateSelected, copySelection, pasteClipboard, clearAllDrawings, setElements, createGroup,
    undo, redo, deleteSelected,
    cycleZoneShape, cyclePlayerShape, saveDocument, manualSave, saveToCloud, fetchCloudProjects,
    updatePitchSettings, getPitchSettings, nudgeSelected, adjustSelectedStrokeWidth,
    cycleSelectedColor, rotateSelected, resizeSelected, scaleSelectedEquipmentBy, updateTextProperties, applyFormation,
    cycleGoalkeeperColor,
    setActiveTool, toggleGrid, toggleInspector, toggleFocusMode, toggleCheatSheet,
    zoomIn, zoomOut, isPlaying, play, pause, toggleLoop, togglePrintMode, isPrintMode,
    removeStep, prevStep, nextStep, addStep,
    authIsAuthenticated, authIsPro, // PR3
    setPlayerOrientation, resetPlayerOrientation, updatePlayerOrientationSettings, togglePlayerVision, // Vision/orientation
    handleExportPNG, handleExportAllSteps, handleExportPDF, handleExportGIF,
    showToast, onStartEditingText, onStartEditingPlayerNumber, onOpenPricingModal, // PR3
  ]);
  
  // Attach/detach event listener
  // Use capture: true to intercept events BEFORE browser shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown]);
  
  // Alt+wheel for player orientation with debounced history
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;
    
    const handleWheel = (e: WheelEvent) => {
      // Only handle when Alt is pressed
      if (!e.altKey) return;
      
      // Check if any players are selected
      const state = useBoardStore.getState();
      const { elements, selectedIds } = state;
      const selectedPlayers = elements.filter(el => 
        selectedIds.includes(el.id) && isPlayerElement(el)
      );
      
      if (selectedPlayers.length === 0) return;
      
      // Prevent default zoom behavior when Alt + wheel on players
      e.preventDefault();
      
      // Calculate rotation delta (+15 or -15 based on wheel direction)
      const delta = e.deltaY > 0 ? 15 : -15;
      
      // Apply orientation change immediately
      const playerIds = selectedPlayers.map(p => p.id);
      setPlayerOrientation(playerIds, delta);
      
      // Clear existing debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // Set new debounce timer for history commit (300ms)
      debounceTimer = setTimeout(() => {
        state.pushHistory();
        debounceTimer = null;
      }, 300);
    };
    
    // Attach wheel listener
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [setPlayerOrientation, showToast]);

  // Scroll-to-resize: wheel over a SELECTED element scales it (no modifier keys).
  // Equipment -> scaleSelectedEquipmentBy (multiplicative); others -> resizeSelected.
  // Ctrl/Cmd = zoom and Alt = orientation are handled elsewhere and excluded here.
  useEffect(() => {
    let lastApplied = 0;
    const STEP_MS = 60;

    const handleResizeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (useUIStore.getState().viewportLocked) return;

      const stage = stageRef.current;
      if (!stage) return;

      const state = useBoardStore.getState();
      const { selectedIds, elements } = state;
      if (selectedIds.length === 0) return;

      // Resolve pointer -> top-most node under cursor, walk up to an element id.
      stage.setPointersPositions(e);
      const pos = stage.getPointerPosition();
      if (!pos) return;

      let node: any = stage.getIntersection(pos);
      let hitId: string | null = null;
      while (node) {
        const nid = typeof node.id === 'function' ? node.id() : undefined;
        if (nid && selectedIds.includes(nid)) { hitId = nid; break; }
        node = typeof node.getParent === 'function' ? node.getParent() : null;
      }
      if (!hitId) return;

      e.preventDefault();

      // Throttle smooth/trackpad wheels into discrete steps.
      const now = Date.now();
      if (now - lastApplied < STEP_MS) return;
      lastApplied = now;

      const el = elements.find((x) => x.id === hitId);
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      if (el && el.type === 'equipment') {
        state.scaleSelectedEquipmentBy(factor);
      } else {
        state.resizeSelected(factor);
      }
    };

    window.addEventListener('wheel', handleResizeWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleResizeWheel);
  }, [stageRef]);
}
