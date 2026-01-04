/**
 * Main App component for TMC Studio
 */

import { useEffect, useCallback, useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { DEFAULT_PITCH_CONFIG, isPlayerElement, isBallElement } from '@tmc/core';
import type { Position, PlayerElement as PlayerElementType } from '@tmc/core';
import { Pitch, PlayerNode, BallNode } from '@tmc/board';
import { Toolbar, RightPanel } from '@tmc/ui';
import { useBoardStore } from './store/useBoardStore';

/** Main App component */
export default function App() {
  const stageRef = useRef<Konva.Stage>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store state
  const {
    elements,
    selectedIds,
    cursorPosition,
    document: boardDoc,
    addPlayerAtCursor,
    addBallAtCursor,
    moveElementById,
    selectElement,
    clearSelection,
    deleteSelected,
    duplicateSelected,
    updateSelectedElement,
    setCursorPosition,
    undo,
    redo,
    saveDocument,
    loadDocument,
    newDocument,
    getSelectedElement,
    canUndo,
    canRedo,
    pushHistory,
  } = useBoardStore();

  // Get selected element for right panel
  const selectedElement = getSelectedElement();
  const selectedElementForPanel = selectedElement
    ? {
        id: selectedElement.id,
        type: selectedElement.type,
        team: isPlayerElement(selectedElement) ? selectedElement.team : undefined,
        number: isPlayerElement(selectedElement) ? selectedElement.number : undefined,
        label: isPlayerElement(selectedElement) ? selectedElement.label : undefined,
        x: selectedElement.position.x,
        y: selectedElement.position.y,
      }
    : undefined;

  // Canvas dimensions
  const canvasWidth = DEFAULT_PITCH_CONFIG.width + DEFAULT_PITCH_CONFIG.padding * 2;
  const canvasHeight = DEFAULT_PITCH_CONFIG.height + DEFAULT_PITCH_CONFIG.padding * 2;

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      
      // Don't handle if typing in input
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'p':
          if (!isCmd) {
            e.preventDefault();
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
          }
          break;
        case 'a':
          if (isCmd) {
            e.preventDefault();
            useBoardStore.getState().selectAll();
          }
          break;
        case 'delete':
        case 'backspace':
          e.preventDefault();
          deleteSelected();
          break;
        case 'escape':
          clearSelection();
          break;
      }
    },
    [addPlayerAtCursor, addBallAtCursor, duplicateSelected, undo, redo, deleteSelected, clearSelection, saveDocument]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle stage mouse move for cursor tracking
  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (pos) {
        setCursorPosition(pos);
      }
    },
    [setCursorPosition]
  );

  // Handle stage click (deselect)
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only deselect if clicking on the stage itself or pitch
      const clickedOnEmpty = e.target === e.target.getStage() || 
                             e.target.name() === 'pitch-background';
      if (clickedOnEmpty) {
        clearSelection();
      }
    },
    [clearSelection]
  );

  // Handle element selection
  const handleElementSelect = useCallback(
    (id: string, addToSelection: boolean) => {
      selectElement(id, addToSelection);
    },
    [selectElement]
  );

  // Handle element drag end
  const handleElementDragEnd = useCallback(
    (id: string, position: Position) => {
      moveElementById(id, position);
      pushHistory();
    },
    [moveElementById, pushHistory]
  );

  // Handle file load
  const handleLoadClick = () => {
    // For now, just load from localStorage
    const loaded = loadDocument();
    if (!loaded) {
      newDocument();
    }
  };

  // Handle element update from right panel
  const handleUpdateElement = (updates: { number?: number; label?: string }) => {
    updateSelectedElement(updates as Partial<PlayerElementType>);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Toolbar */}
      <Toolbar
        onAddPlayer={addPlayerAtCursor}
        onAddBall={addBallAtCursor}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
        onUndo={undo}
        onRedo={redo}
        onSave={saveDocument}
        onLoad={handleLoadClick}
        onNewBoard={newDocument}
        canUndo={canUndo()}
        canRedo={canRedo()}
        hasSelection={selectedIds.length > 0}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center bg-gray-850 p-4 overflow-auto">
          <div className="shadow-2xl rounded-lg overflow-hidden">
            <Stage
              ref={stageRef}
              width={canvasWidth}
              height={canvasHeight}
              onMouseMove={handleStageMouseMove}
              onClick={handleStageClick}
              onTap={handleStageClick}
            >
              <Layer>
                {/* Pitch background */}
                <Pitch config={DEFAULT_PITCH_CONFIG} />

                {/* Players */}
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

                {/* Balls */}
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
        </div>

        {/* Right panel */}
        <RightPanel
          selectedCount={selectedIds.length}
          selectedElement={selectedElementForPanel}
          onUpdateElement={handleUpdateElement}
        />
      </div>

      {/* Status bar */}
      <div className="h-8 px-4 flex items-center justify-between bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Elements: {elements.length}</span>
          <span>Selected: {selectedIds.length}</span>
          {cursorPosition && (
            <span>
              Cursor: ({Math.round(cursorPosition.x)}, {Math.round(cursorPosition.y)})
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>{boardDoc.name}</span>
          <span>v{boardDoc.version}</span>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.tmc.json"
        className="hidden"
        onChange={() => {}}
      />
    </div>
  );
}
