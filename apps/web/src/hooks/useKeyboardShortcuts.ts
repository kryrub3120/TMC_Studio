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

import { useEffect, useCallback } from 'react';
import { useBoardStore } from '../store';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { isTextElement, isPlayerElement, isZoneElement, PITCH_THEMES } from '@tmc/core';
import { formations } from '@tmc/presets';
import { useCommandRegistry } from './useCommandRegistry';

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
  onStartEditingPlayerNumber?: (id: string, currentNumber: number) => void;
  
  // Step management (gated by entitlements)
  addStep: () => void;
  
  // Pricing modal (PR3)
  onOpenPricingModal?: () => void;
  
  // Context menu state (for guards)
  contextMenuVisible: boolean;
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
    addStep,
    onOpenPricingModal, // PR3
    contextMenuVisible,
  } = params;
  
  // ===== Command Registry (PR1) =====
  const cmdRegistry = useCommandRegistry();
  
  // ===== Board Store Actions =====
  const addPlayerAtCursor = useBoardStore((s) => s.addPlayerAtCursor);
  const addBallAtCursor = useBoardStore((s) => s.addBallAtCursor);
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
  const removeStep = useBoardStore((s) => s.removeStep);
  const prevStep = useBoardStore((s) => s.prevStep);
  const nextStep = useBoardStore((s) => s.nextStep);
  const setPlayerOrientation = useBoardStore((s) => s.setPlayerOrientation); // PR3
  const resetPlayerOrientation = useBoardStore((s) => s.resetPlayerOrientation); // PR3
  const updatePlayerOrientationSettings = useBoardStore((s) => s.updatePlayerOrientationSettings);
  const togglePlayerVision = useBoardStore((s) => s.togglePlayerVision); // Per-player vision toggle
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
    
    // === Guard: Skip if typing in input ===
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
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
        } else if (!isCmd && e.shiftKey) {
          e.preventDefault();
          addPlayerAtCursor('away');
          showToast('Away Player');
        } else if (!isCmd) {
          e.preventDefault();
          addPlayerAtCursor('home');
          showToast('Home Player');
        }
        break;
        
      case 'b':
        if (!isCmd) {
          e.preventDefault();
          addBallAtCursor();
          showToast('Ball');
        }
        break;
        
      case 't':
        if (!isCmd) {
          e.preventDefault();
          addTextAtCursor();
          showToast('Text');
        }
        break;
        
      // === Equipment ===
      case 'm':
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
        
      case 'k':
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
        
      case 'q':
        if (!isCmd) {
          e.preventDefault();
          addEquipmentAtCursor('hoop');
          showToast('Hoop');
        }
        break;
        
      case 'u':
        if (!isCmd) {
          e.preventDefault();
          addEquipmentAtCursor('hurdle');
          showToast('Hurdle');
        }
        break;
        
      case 'y':
        if (!isCmd) {
          e.preventDefault();
          addEquipmentAtCursor('ladder');
          showToast('Ladder');
        }
        break;
        
      case 'j':
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
        
      // ===== EDIT COMMANDS =====
      case 'z':
        if (isCmd && e.shiftKey) {
          e.preventDefault();
          redo();
        } else if (isCmd) {
          e.preventDefault();
          undo();
        } else {
          // Z = rect zone tool, Shift+Z = ellipse zone tool
          e.preventDefault();
          setActiveTool(e.shiftKey ? 'zone-ellipse' : 'zone');
        }
        break;
        
      case 'd':
        if (isCmd) {
          e.preventDefault();
          duplicateSelected();
          showToast('Duplicated');
        } else {
          e.preventDefault();
          setActiveTool('drawing');
        }
        break;
        
      case 'c':
        if (isCmd) {
          e.preventDefault();
          copySelection();
          showToast('Copied');
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
              showToast('All elements cleared');
              useUIStore.getState().closeConfirmModal();
            },
          });
        } else {
          // C = Clear drawings only (no confirmation, undoable)
          e.preventDefault();
          const drawingsCount = elements.filter(el => el.type === 'drawing').length;
          if (drawingsCount === 0) {
            showToast('No drawings to clear');
          } else {
            clearAllDrawings();
            showToast(`${drawingsCount} drawing${drawingsCount > 1 ? 's' : ''} cleared • Undo: Cmd+Z`);
          }
        }
        break;
        
      case 'v':
        // Cmd+V = Paste only. Plain V vision toggle handled via e.code === 'KeyV' below.
        if (isCmd) {
          e.preventDefault();
          pasteClipboard();
          showToast('Pasted');
        }
        break;
        
      case 'g':
        if (isCmd && e.shiftKey) {
          e.preventDefault();
          handleExportGIF();
        } else if (isCmd) {
          e.preventDefault();
          createGroup();
          showToast('Group created');
        } else {
          // G = Toggle grid
          e.preventDefault();
          toggleGrid();
          showToast(uiState.gridVisible ? 'Grid hidden' : 'Grid visible');
        }
        break;
        
      case 'a':
        if (isCmd) {
          e.preventDefault();
          cmdRegistry.board.selection.selectAll();
        } else {
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
          showToast('Zone shape changed');
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
          saveDocument();
          if (authIsAuthenticated) {
            saveToCloud().then(async (success) => {
              if (success) {
                await fetchCloudProjects();
                showToast('Saved to cloud ☁️');
              } else {
                showToast('Saved locally');
              }
            });
          } else {
            showToast('Saved locally');
          }
        } else if (e.shiftKey && hasSelectedPlayer()) {
          // Shift+S = cycle player shape (when player selected)
          e.preventDefault();
          cyclePlayerShape();
          showToast('Shape changed');
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
          showToast(newOrientation === 'portrait' ? 'Portrait mode (75%)' : 'Landscape mode');
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
            showToast('Print Mode OFF');
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
            showToast('Print Mode ON');
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
        // H2: Enter on selected player = start editing number
        // Enter on selected text = start editing text
        if (selectedIds.length === 1) {
          const el = elements.find((e) => e.id === selectedIds[0]);
          
          if (el && isPlayerElement(el) && onStartEditingPlayerNumber) {
            e.preventDefault();
            onStartEditingPlayerNumber(el.id, (el as any).number ?? 0);
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
        
      case 'l':
        if (!isCmd) {
          e.preventDefault();
          toggleLoop();
          showToast(uiState.isLooping ? 'Loop disabled' : 'Loop enabled');
        }
        break;
        
      case 'n':
        if (!isCmd) {
          e.preventDefault();
          addStep();
          showToast('New step added');
        }
        break;
        
      case 'x':
        // X = Delete current step (only if more than 1 step)
        if (!isCmd && boardDoc.steps.length > 1) {
          e.preventDefault();
          removeStep(currentStepIndex);
          showToast('Step deleted');
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
              showToast(`Background: ${newBg}`);
            } else {
              // Up = increase font size
              const newSize = Math.min(72, (textEl.fontSize || 18) + 2);
              updateTextProperties(textEl.id, { fontSize: newSize });
              showToast(`Font size: ${newSize}px`);
            }
          } else if (e.altKey) {
            cycleSelectedColor(-1);
            showToast('Previous color');
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
              showToast('Background removed');
            } else {
              const newSize = Math.max(8, (textEl.fontSize || 18) - 2);
              updateTextProperties(textEl.id, { fontSize: newSize });
              showToast(`Font size: ${newSize}px`);
            }
          } else if (e.altKey) {
            cycleSelectedColor(1);
            showToast('Next color');
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
            showToast(textEl.bold ? 'Normal' : 'Bold');
          } else if (e.altKey) {
            adjustSelectedStrokeWidth(-1);
            showToast('Thinner stroke');
          } else if (!isCmd && selectedIds.length === 0) {
            prevStep();
          } else {
            nudgeSelected(e.shiftKey ? -1 : -5, 0);
          }
        }
        break;
        
      case 'arrowright':
        e.preventDefault();
        {
          const textEl = getSelectedText();
          if (textEl) {
            updateTextProperties(textEl.id, { italic: !textEl.italic });
            showToast(textEl.italic ? 'Normal' : 'Italic');
          } else if (e.altKey) {
            adjustSelectedStrokeWidth(1);
            showToast('Thicker stroke');
          } else if (!isCmd && selectedIds.length === 0) {
            nextStep();
          } else {
            nudgeSelected(e.shiftKey ? 1 : 5, 0);
          }
        }
        break;
        
      // ===== ZOOM & RESIZE =====
      case '=':
      case '+':
        if (isCmd && e.altKey) {
          // Option+Cmd+= = Resize up +10%
          e.preventDefault();
          resizeSelected(1.1);
          showToast('Resized +10%');
        } else if (isCmd) {
          e.preventDefault();
          zoomIn();
        } else if (!isCmd && hasSelectedEquipment()) {
          // + = Equipment resize +15%
          e.preventDefault();
          scaleSelectedEquipmentBy(1.15);
          showToast('Equipment +15%');
        }
        break;
        
      case '-':
        if (isCmd && e.altKey) {
          // Option+Cmd+- = Resize down -10%
          e.preventDefault();
          resizeSelected(0.9);
          showToast('Resized -10%');
        } else if (isCmd) {
          e.preventDefault();
          zoomOut();
        } else if (!isCmd && hasSelectedEquipment()) {
          // - = Equipment resize -15%
          e.preventDefault();
          scaleSelectedEquipmentBy(0.85);
          showToast('Equipment -15%');
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
          showToast('Player orientation reset');
        } else if (!isCmd && !e.altKey && !e.shiftKey) {
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
        showToast(`Player orientation ${delta}°`);
      } else if (hasSelectedEquipment()) {
        // [ = Equipment rotation (fallback)
        rotateSelected(-15);
        showToast('Rotated -15°');
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
        showToast(`Player orientation +${delta}°`);
      } else if (hasSelectedEquipment()) {
        // ] = Equipment rotation (fallback)
        rotateSelected(15);
        showToast('Rotated +15°');
      }
    }
    
    // Shift+[ and Shift+] produce { and } - equipment 90° rotation
    if (key === '{' && !isCmd && hasSelectedEquipment()) {
      e.preventDefault();
      rotateSelected(-90);
      showToast('Rotated -90°');
    }
    
    if (key === '}' && !isCmd && hasSelectedEquipment()) {
      e.preventDefault();
      rotateSelected(90);
      showToast('Rotated +90°');
    }
    
    // ===== PER-PLAYER VISION TOGGLE (e.code === 'KeyV') =====
    if (e.code === 'KeyV' && !isCmd) {
      e.preventDefault();
      
      // Vision requires orientation feature to be enabled
      const orientationSettings = useBoardStore.getState().getPlayerOrientationSettings();
      if (!orientationSettings.enabled) {
        showToast('Enable "Show orientation" first (Props → Player Orientation)');
        return;
      }
      
      if (e.shiftKey) {
        // Shift+V = Toggle vision for ALL players on board
        const allPlayerIds = elements.filter(el => isPlayerElement(el)).map(el => el.id);
        if (allPlayerIds.length > 0) {
          togglePlayerVision(allPlayerIds);
          showToast('Vision toggled for all players');
        } else {
          showToast('No players on board');
        }
      } else if (hasSelectedPlayer()) {
        // V = Toggle vision for selected players
        const selectedPlayerIds = elements.filter(el => selectedIds.includes(el.id) && isPlayerElement(el)).map(el => el.id);
        togglePlayerVision(selectedPlayerIds);
        showToast(`Vision toggled for ${selectedPlayerIds.length} player(s)`);
      } else {
        showToast('Select player(s) first');
      }
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
        showToast(`${formations[idx].shortName} applied (${team})`);
      }
    }
  }, [
    // Dependencies
    cmdRegistry,
    commandPaletteOpen, closeCommandPalette, openCommandPalette, contextMenuVisible,
    addPlayerAtCursor, addBallAtCursor, addTextAtCursor, addEquipmentAtCursor,
    duplicateSelected, copySelection, pasteClipboard, clearAllDrawings, setElements, createGroup,
    undo, redo, deleteSelected,
    cycleZoneShape, cyclePlayerShape, saveDocument, saveToCloud, fetchCloudProjects,
    updatePitchSettings, getPitchSettings, nudgeSelected, adjustSelectedStrokeWidth,
    cycleSelectedColor, rotateSelected, resizeSelected, scaleSelectedEquipmentBy, updateTextProperties, applyFormation,
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
}
