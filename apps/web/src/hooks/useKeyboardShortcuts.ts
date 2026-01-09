/**
 * useKeyboardShortcuts Hook
 * 
 * Registers all global keyboard shortcuts using KeyboardService.
 * Replaces the monolithic handleKeyDown from App.tsx.
 */

import { useEffect } from 'react';
import { useBoardStore } from '../store';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { keyboardService } from '../services/KeyboardService';

export function useKeyboardShortcuts(
  handlers: {
    handleExportPDF: () => void;
    handleExportGIF: () => void;
    showToast: (message: string) => void;
  }
): void {
  const { handleExportPDF, handleExportGIF, showToast } = handlers;
  
  // Get store actions (not state - to avoid re-renders)
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
  const selectAll = useBoardStore((s) => s.selectAll);
  const cycleZoneShape = useBoardStore((s) => s.cycleZoneShape);
  const cyclePlayerShape = useBoardStore((s) => s.cyclePlayerShape);
  const saveDocument = useBoardStore((s) => s.saveDocument);
  const saveToCloud = useBoardStore((s) => s.saveToCloud);
  const fetchCloudProjects = useBoardStore((s) => s.fetchCloudProjects);
  const updatePitchSettings = useBoardStore((s) => s.updatePitchSettings);
  const getPitchSettings = useBoardStore((s) => s.getPitchSettings);
  
  // UI state selectors
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const closeCommandPalette = useUIStore((s) => s.closeCommandPalette);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const toggleGrid = useUIStore((s) => s.toggleGrid);
  const gridVisible = useUIStore((s) => s.gridVisible);
  
  // Auth state
  const authIsAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  useEffect(() => {
    // Helper to check if NOT typing in input
    const isNotTyping = () => {
      const target = document.activeElement as HTMLElement;
      return target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA';
    };
    
    // Helper for palette closed
    const paletteClosedAndNotTyping = () => !commandPaletteOpen && isNotTyping();
    
    // Register all shortcuts
    const unsubscribe = keyboardService.registerMany([
      // === Command Palette ===
      {
        key: 'k',
        modifiers: ['meta'],
        action: () => commandPaletteOpen ? closeCommandPalette() : openCommandPalette(),
        description: 'Toggle Command Palette',
        category: 'navigation',
        when: isNotTyping,
      },
      
      // === Elements - Players, Ball, Text ===
      {
        key: 'p',
        action: () => addPlayerAtCursor('home'),
        description: 'Add Home Player',
        category: 'elements',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'p',
        modifiers: ['shift'],
        action: () => addPlayerAtCursor('away'),
        description: 'Add Away Player',
        category: 'elements',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'b',
        action: () => addBallAtCursor(),
        description: 'Add Ball',
        category: 'elements',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 't',
        action: () => addTextAtCursor(),
        description: 'Add Text',
        category: 'elements',
        when: paletteClosedAndNotTyping,
      },
      
      // === Equipment ===
      {
        key: 'm',
        action: () => addEquipmentAtCursor('mannequin', 'standard'),
        description: 'Add Mannequin',
        category: 'elements',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'm',
        modifiers: ['shift'],
        action: () => addEquipmentAtCursor('mannequin', 'flat'),
        description: 'Add Flat Mannequin',
        category: 'elements',
        when: paletteClosedAndNotTyping,
      },
      
      // === Edit Commands ===
      {
        key: 'z',
        modifiers: ['meta'],
        action: () => undo(),
        description: 'Undo',
        category: 'edit',
      },
      {
        key: 'z',
        modifiers: ['meta', 'shift'],
        action: () => redo(),
        description: 'Redo',
        category: 'edit',
      },
      {
        key: 'd',
        modifiers: ['meta'],
        action: () => duplicateSelected(),
        description: 'Duplicate',
        category: 'edit',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'c',
        modifiers: ['meta'],
        action: () => {
          copySelection();
          showToast('Copied');
        },
        description: 'Copy',
        category: 'edit',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'v',
        modifiers: ['meta'],
        action: () => {
          pasteClipboard();
          showToast('Pasted');
        },
        description: 'Paste',
        category: 'edit',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'a',
        modifiers: ['meta'],
        action: () => selectAll(),
        description: 'Select All',
        category: 'edit',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'g',
        modifiers: ['meta'],
        action: () => {
          createGroup();
          showToast('Group created');
        },
        description: 'Create Group',
        category: 'edit',
        when: paletteClosedAndNotTyping,
      },
      
      // === Tools ===
      {
        key: 'd',
        action: () => setActiveTool('drawing'),
        description: 'Drawing Tool',
        category: 'tools',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'h',
        action: () => setActiveTool('highlighter'),
        description: 'Highlighter Tool',
        category: 'tools',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'a',
        action: () => setActiveTool('arrow-pass'),
        description: 'Pass Arrow Tool',
        category: 'tools',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'r',
        action: () => setActiveTool('arrow-run'),
        description: 'Run Arrow Tool',
        category: 'tools',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'z',
        action: () => setActiveTool('zone'),
        description: 'Rectangle Zone Tool',
        category: 'tools',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'z',
        modifiers: ['shift'],
        action: () => setActiveTool('zone-ellipse'),
        description: 'Ellipse Zone Tool',
        category: 'tools',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'c',
        action: () => {
          clearAllDrawings();
          showToast('Drawings cleared');
        },
        description: 'Clear All Drawings',
        category: 'tools',
        when: paletteClosedAndNotTyping,
      },
      
      // === Edit Selected ===
      {
        key: 'e',
        action: () => {
          const elements = useBoardStore.getState().elements;
          const selectedIds = useBoardStore.getState().selectedIds;
          const hasZone = elements.some((el) => 
            selectedIds.includes(el.id) && el.type === 'zone'
          );
          if (hasZone) {
            cycleZoneShape();
            showToast('Zone shape changed');
          }
        },
        description: 'Cycle Zone Shape',
        category: 'edit',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 's',
        action: () => {
          const elements = useBoardStore.getState().elements;
          const selectedIds = useBoardStore.getState().selectedIds;
          const hasPlayer = elements.some((el) => 
            selectedIds.includes(el.id) && el.type === 'player'
          );
          if (hasPlayer) {
            cyclePlayerShape();
            showToast('Shape changed');
          }
        },
       description: 'Cycle Player Shape',
        category: 'edit',
        when: paletteClosedAndNotTyping,
      },
      
      // === View ===
      {
        key: 'v',
        action: () => {
          const VIEWS = ['full', 'plain', 'half-left', 'half-right'] as const;
          const currentView = getPitchSettings()?.view ?? 'full';
          const currentIdx = VIEWS.indexOf(currentView as typeof VIEWS[number]);
          const nextIdx = (currentIdx + 1) % VIEWS.length;
          const nextView = VIEWS[nextIdx];
          
          if (nextView === 'plain') {
            updatePitchSettings({
              view: nextView,
              lines: {
                showOutline: false,
                showCenterLine: false,
                showCenterCircle: false,
                showPenaltyAreas: false,
                showGoalAreas: false,
                showCornerArcs: false,
                showPenaltySpots: false,
              },
            });
          } else {
            updatePitchSettings({
              view: nextView,
              lines: {
                showOutline: true,
                showCenterLine: true,
                showCenterCircle: true,
                showPenaltyAreas: true,
                showGoalAreas: true,
                showCornerArcs: true,
                showPenaltySpots: true,
              },
            });
          }
          
          const viewNames: Record<string, string> = {
            full: 'Full pitch',
            plain: 'Plain grass',
            'half-left': 'Half (left)',
            'half-right': 'Half (right)',
          };
          showToast(viewNames[nextView] ?? nextView);
        },
        description: 'Cycle Pitch View',
        category: 'view',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'g',
        action: () => {
          toggleGrid();
          showToast(gridVisible ? 'Grid hidden' : 'Grid visible');
        },
        description: 'Toggle Grid',
        category: 'view',
        when: paletteClosedAndNotTyping,
      },
      
      // === Save ===
      {
        key: 's',
        modifiers: ['meta'],
        action: async () => {
          saveDocument();
          if (authIsAuthenticated) {
            const success = await saveToCloud();
            if (success) {
              await fetchCloudProjects();
              showToast('Saved to cloud ☁️');
            } else {
              showToast('Saved locally');
            }
          } else {
            showToast('Saved locally');
          }
        },
        description: 'Save Document',
        category: 'edit',
      },
      
      // === Export ===
      {
        key: 'p',
        modifiers: ['meta', 'shift'],
        action: () => handleExportPDF(),
        description: 'Export PDF',
        category: 'export',
        when: paletteClosedAndNotTyping,
      },
      {
        key: 'g',
        modifiers: ['meta', 'shift'],
        action: () => handleExportGIF(),
        description: 'Export GIF',
        category: 'export',
        when: paletteClosedAndNotTyping,
      },
    ]);
    
    // Global keyboard event listener
    const handleKeyDown = (e: KeyboardEvent) => {
      keyboardService.handleKeyDown(e);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribe();
    };
  }, [
    // Dependencies - all functions from stores and handlers
    addPlayerAtCursor,
    addBallAtCursor,
    addTextAtCursor,
    addEquipmentAtCursor,
    duplicateSelected,
    copySelection,
    pasteClipboard,
    clearAllDrawings,
    createGroup,
    undo,
    redo,
    selectAll,
    cycleZoneShape,
    cyclePlayerShape,
    saveDocument,
    saveToCloud,
    fetchCloudProjects,
    updatePitchSettings,
    getPitchSettings,
    commandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    setActiveTool,
    toggleGrid,
    gridVisible,
    authIsAuthenticated,
    handleExportPDF,
    handleExportGIF,
    showToast,
  ]);
}
