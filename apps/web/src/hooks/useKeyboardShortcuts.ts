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
import { isTextElement, isPlayerElement, isZoneElement} from '@tmc/core';
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
  
  // Step management (gated by entitlements)
  addStep: () => void;
  
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
    addStep,
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
  const updateTextProperties = useBoardStore((s) => s.updateTextProperties);
  const applyFormation = useBoardStore((s) => s.applyFormation);
  const removeStep = useBoardStore((s) => s.removeStep);
  const prevStep = useBoardStore((s) => s.prevStep);
  const nextStep = useBoardStore((s) => s.nextStep);
  
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
  const pause = useUIStore((s) => s.pause);
  const toggleLoop = useUIStore((s) => s.toggleLoop);
  
  // ===== Auth Store =====
  const authIsAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
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
        } else {
          // C = Clear all drawings
          e.preventDefault();
          clearAllDrawings();
          showToast('Drawings cleared');
        }
        break;
        
      case 'v':
        if (isCmd) {
          e.preventDefault();
          pasteClipboard();
          showToast('Pasted');
        } else {
          // V = Cycle pitch views
          e.preventDefault();
          const VIEWS = ['full', 'plain', 'half-left', 'half-right'] as const;
          const currentView = getPitchSettings()?.view ?? 'full';
          const currentIdx = VIEWS.indexOf(currentView as typeof VIEWS[number]);
          const nextIdx = (currentIdx + 1) % VIEWS.length;
          const nextView = VIEWS[nextIdx];
          
          if (nextView === 'plain') {
            updatePitchSettings({
              view: nextView,
              lines: {
                showOutline: false, showCenterLine: false, showCenterCircle: false,
                showPenaltyAreas: false, showGoalAreas: false, showCornerArcs: false, showPenaltySpots: false,
              },
            });
          } else {
            updatePitchSettings({
              view: nextView,
              lines: {
                showOutline: true, showCenterLine: true, showCenterCircle: true,
                showPenaltyAreas: true, showGoalAreas: true, showCornerArcs: true, showPenaltySpots: true,
              },
            });
          }
          const viewNames: Record<string, string> = {
            full: 'Full pitch', plain: 'Plain grass', 'half-left': 'Half (left)', 'half-right': 'Half (right)',
          };
          showToast(viewNames[nextView] ?? nextView);
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
        } else if (hasSelectedPlayer()) {
          // S key = cycle player shape
          e.preventDefault();
          cyclePlayerShape();
          showToast('Shape changed');
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
        // W = Toggle print friendly mode
        if (!isCmd) {
          e.preventDefault();
          const currentSettings = getPitchSettings();
          const isPrintFriendly = currentSettings?.primaryColor === '#ffffff' && currentSettings?.lineColor === '#000000';
          if (isPrintFriendly) {
            updatePitchSettings({ 
              primaryColor: '#4ade80', stripeColor: '#22c55e', lineColor: '#ffffff', showStripes: true
            });
            showToast('Normal colors');
          } else {
            updatePitchSettings({ 
              primaryColor: '#ffffff', stripeColor: '#ffffff', lineColor: '#000000', showStripes: false
            });
            showToast('Print Friendly mode');
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
        // Enter on selected text = start editing
        if (selectedIds.length === 1) {
          const textEl = getSelectedText();
          if (textEl && onStartEditingText) {
            e.preventDefault();
            onStartEditingText(textEl.id, textEl.content);
          }
        }
        break;
        
      // ===== STEPS & PLAYBACK =====
      case ' ':
        e.preventDefault();
        isPlaying ? pause() : play();
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
        
      // ===== ZOOM =====
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
        
      // ===== ROTATION =====
      case '[':
        if (!isCmd) {
          e.preventDefault();
          rotateSelected(-15);
          showToast('Rotated -15°');
        }
        break;
        
      case ']':
        if (!isCmd) {
          e.preventDefault();
          rotateSelected(15);
          showToast('Rotated +15°');
        }
        break;
        
      case '{':
        if (!isCmd) {
          e.preventDefault();
          rotateSelected(-90);
          showToast('Rotated -90°');
        }
        break;
        
      case '}':
        if (!isCmd) {
          e.preventDefault();
          rotateSelected(90);
          showToast('Rotated +90°');
        }
        break;
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
    duplicateSelected, copySelection, pasteClipboard, clearAllDrawings, createGroup,
    undo, redo, deleteSelected,
    cycleZoneShape, cyclePlayerShape, saveDocument, saveToCloud, fetchCloudProjects,
    updatePitchSettings, getPitchSettings, nudgeSelected, adjustSelectedStrokeWidth,
    cycleSelectedColor, rotateSelected, updateTextProperties, applyFormation,
    setActiveTool, toggleGrid, toggleInspector, toggleFocusMode, toggleCheatSheet,
    zoomIn, zoomOut, isPlaying, play, pause, toggleLoop,
    removeStep, prevStep, nextStep, addStep,
    authIsAuthenticated,
    handleExportPNG, handleExportAllSteps, handleExportPDF, handleExportGIF,
    showToast, onStartEditingText,
  ]);
  
  // Attach/detach event listener
  // Use capture: true to intercept events BEFORE browser shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown]);
}
