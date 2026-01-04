/**
 * TMC Studio - Main App Component
 * VS Code-like command-palette-first tactical board
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { DEFAULT_PITCH_CONFIG, isPlayerElement, isBallElement } from '@tmc/core';
import type { Position, PlayerElement as PlayerElementType } from '@tmc/core';
import { Pitch, PlayerNode, BallNode } from '@tmc/board';
import {
  TopBar,
  RightInspector,
  BottomStepsBar,
  CommandPaletteModal,
  CheatSheetOverlay,
  ToastHint,
  ZoomWidget,
  type CommandAction,
  type InspectorElement,
  type ElementInList,
} from '@tmc/ui';
import { useBoardStore } from './store/useBoardStore';
import { useUIStore, useInitializeTheme } from './store/useUIStore';

/** Main App component */
export default function App() {
  const stageRef = useRef<Konva.Stage>(null);

  // Initialize theme on mount
  useInitializeTheme();

  // Board store state  
  const elements = useBoardStore((s) => s.elements);
  const selectedIds = useBoardStore((s) => s.selectedIds);
  const boardDoc = useBoardStore((s) => s.document);
  
  // Board store actions
  const addPlayerAtCursor = useBoardStore((s) => s.addPlayerAtCursor);
  const addBallAtCursor = useBoardStore((s) => s.addBallAtCursor);
  const moveElementById = useBoardStore((s) => s.moveElementById);
  const selectElement = useBoardStore((s) => s.selectElement);
  const clearSelection = useBoardStore((s) => s.clearSelection);
  const deleteSelected = useBoardStore((s) => s.deleteSelected);
  const duplicateSelected = useBoardStore((s) => s.duplicateSelected);
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

  // Derived state
  const selectedElement = getSelectedElement();
  const canUndo = canUndoFn();
  const canRedo = canRedoFn();
  const isSaved = true; // TODO: track actual save state

  // Prepare selected element for inspector
  const inspectorElement: InspectorElement | undefined = useMemo(() => {
    if (!selectedElement) return undefined;
    return {
      id: selectedElement.id,
      type: selectedElement.type as 'player' | 'ball',
      team: isPlayerElement(selectedElement) ? selectedElement.team : undefined,
      number: isPlayerElement(selectedElement) ? selectedElement.number : undefined,
      label: isPlayerElement(selectedElement) ? selectedElement.label : undefined,
      x: selectedElement.position.x,
      y: selectedElement.position.y,
    };
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
        showToast('Pass arrows coming soon');
        break;
      case 'add-zone':
        showToast('Zones coming soon');
        break;
      case 'open-palette':
        openCommandPalette();
        break;
      default:
        break;
    }
  }, [addPlayerAtCursor, addBallAtCursor, showToast, openCommandPalette]);

  // Steps data (placeholder for now)
  const steps = useMemo(() => [
    { id: 'step-1', label: 'Step 1', index: 0 },
  ], []);

  // Canvas dimensions
  const canvasWidth = DEFAULT_PITCH_CONFIG.width + DEFAULT_PITCH_CONFIG.padding * 2;
  const canvasHeight = DEFAULT_PITCH_CONFIG.height + DEFAULT_PITCH_CONFIG.padding * 2;

  // Command palette actions
  const commandActions: CommandAction[] = useMemo(() => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
    const cmd = isMac ? '⌘' : 'Ctrl+';

    return [
      // Elements
      { id: 'add-home-player', label: 'Add Home Player', shortcut: 'P', category: 'elements', onExecute: () => addPlayerAtCursor('home') },
      { id: 'add-away-player', label: 'Add Away Player', shortcut: '⇧P', category: 'elements', onExecute: () => addPlayerAtCursor('away') },
      { id: 'add-ball', label: 'Add Ball', shortcut: 'B', category: 'elements', onExecute: () => addBallAtCursor() },
      { id: 'add-pass-arrow', label: 'Add Pass Arrow', shortcut: 'A', category: 'elements', onExecute: () => showToast('Pass arrows coming soon') },
      { id: 'add-run-arrow', label: 'Add Run Arrow', shortcut: 'R', category: 'elements', onExecute: () => showToast('Run arrows coming soon') },
      { id: 'add-zone', label: 'Add Zone', shortcut: 'Z', category: 'elements', onExecute: () => showToast('Zones coming soon') },
      { id: 'add-text', label: 'Add Text', shortcut: 'T', category: 'elements', onExecute: () => showToast('Text coming soon') },

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
      { id: 'add-step', label: 'Add Step', shortcut: 'N', category: 'steps', onExecute: () => showToast('Steps coming soon') },
      { id: 'prev-step', label: 'Previous Step', shortcut: '←', category: 'steps', onExecute: () => showToast('Steps coming soon') },
      { id: 'next-step', label: 'Next Step', shortcut: '→', category: 'steps', onExecute: () => showToast('Steps coming soon') },
      { id: 'play-pause', label: 'Play/Pause', shortcut: 'Space', category: 'steps', onExecute: () => showToast('Playback coming soon') },
      { id: 'toggle-loop', label: 'Toggle Loop', shortcut: 'L', category: 'steps', onExecute: () => showToast('Loop coming soon') },

      // Export
      { id: 'export-png', label: 'Export PNG', shortcut: `${cmd}E`, category: 'export', onExecute: () => handleExport() },
      { id: 'export-steps', label: 'Export All Steps PNG', shortcut: `⇧${cmd}E`, category: 'export', onExecute: () => showToast('Export steps coming soon') },
    ];
  }, [addPlayerAtCursor, addBallAtCursor, duplicateSelected, deleteSelected, undo, redo, selectAll, clearSelection, toggleInspector, toggleCheatSheet, toggleFocusMode, showToast, selectedIds.length, canUndo, canRedo]);

  // Export handler
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
          if (e.shiftKey) {
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
          }
          break;
        case 'z':
          if (isCmd && e.shiftKey) {
            e.preventDefault();
            redo();
          } else if (isCmd) {
            e.preventDefault();
            undo();
          }
          break;
        case 's':
          if (isCmd) {
            e.preventDefault();
            saveDocument();
            showToast('Saved to localStorage');
          }
          break;
        case 'a':
          if (isCmd) {
            e.preventDefault();
            selectAll();
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
        case '1':
          if (e.shiftKey) {
            e.preventDefault();
            zoomFit();
          }
          break;
      }
    },
    [commandPaletteOpen, closeCommandPalette, openCommandPalette, addPlayerAtCursor, addBallAtCursor, duplicateSelected, undo, redo, saveDocument, selectAll, toggleInspector, toggleFocusMode, toggleCheatSheet, deleteSelected, clearSelection, showToast, zoomIn, zoomOut, zoomFit]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Stage event handlers
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const clickedOnEmpty = e.target === e.target.getStage() || 
                             e.target.name() === 'pitch-background';
      if (clickedOnEmpty) {
        clearSelection();
      }
    },
    [clearSelection]
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
    (updates: { number?: number; label?: string }) => {
      updateSelectedElement(updates as Partial<PlayerElementType>);
    },
    [updateSelectedElement]
  );

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      {/* Top Bar - hidden in focus mode */}
      {!focusMode && (
        <TopBar
          projectName={boardDoc.name}
          isSaved={isSaved}
          focusMode={focusMode}
          theme={theme}
          onExport={handleExport}
          onToggleFocus={toggleFocusMode}
          onToggleTheme={toggleTheme}
          onOpenPalette={openCommandPalette}
          onOpenHelp={toggleCheatSheet}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area - centered with neutral background */}
        <div className="flex-1 flex items-center justify-center bg-bg p-4 overflow-auto relative">
          {/* Canvas container - premium pitch card with zoom */}
          <div 
            className="shadow-canvas rounded-[20px] overflow-hidden border border-border/50 p-3 bg-surface/50 backdrop-blur-sm transition-transform"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          >
            <Stage
              ref={stageRef}
              width={canvasWidth}
              height={canvasHeight}
              onClick={handleStageClick}
              onTap={handleStageClick}
            >
              <Layer>
                <Pitch config={DEFAULT_PITCH_CONFIG} />

                {elements
                  .filter(isPlayerElement)
                  .map((player) => (
                    <PlayerNode
                      key={player.id}
                      player={player}
                      pitchConfig={DEFAULT_PITCH_CONFIG}
                      isSelected={selectedIds.includes(player.id)}
                      onSelect={handleElementSelect}
                      onDragEnd={handleElementDragEnd}
                    />
                  ))}

                {elements
                  .filter(isBallElement)
                  .map((ball) => (
                    <BallNode
                      key={ball.id}
                      ball={ball}
                      pitchConfig={DEFAULT_PITCH_CONFIG}
                      isSelected={selectedIds.includes(ball.id)}
                      onSelect={handleElementSelect}
                      onDragEnd={handleElementDragEnd}
                    />
                  ))}
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
            onUpdateElement={handleUpdateElement}
            onSelectElement={(id) => selectElement(id, false)}
            onToggleLayerVisibility={toggleLayerVisibility}
            onQuickAction={handleQuickAction}
          />
        )}
      </div>

      {/* Bottom Steps Bar */}
      <BottomStepsBar
        steps={steps}
        currentStepIndex={0}
        isPlaying={false}
        isLooping={false}
        duration={0.8}
        onStepSelect={() => {}}
        onAddStep={() => showToast('Add step coming soon')}
        onDeleteStep={() => {}}
        onPlay={() => showToast('Playback coming soon')}
        onPause={() => {}}
        onPrevStep={() => {}}
        onNextStep={() => {}}
        onToggleLoop={() => {}}
        onDurationChange={() => {}}
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
    </div>
  );
}
