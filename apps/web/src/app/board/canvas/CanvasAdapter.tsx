/**
 * CanvasAdapter - Wiring layer for legacy Konva canvas
 * NO store imports. Bundles interpolators and passes props to CanvasElements
 */

import { useMemo } from 'react';
import { Stage } from 'react-konva';
import type Konva from 'konva';
import type { BoardElement, Position, PitchSettings, TeamSettings, PlayerOrientationSettings } from '@tmc/core';
import { CanvasElements } from './CanvasElements';

export interface CanvasAdapterProps {
  // Canvas config
  stageRef: React.RefObject<Konva.Stage>;
  canvasWidth: number;
  canvasHeight: number;
  stageScale?: number; // PR-FIX-4: applied to Stage scaleX/scaleY
  stagePosition?: { x: number; y: number }; // PR-FIX-4: center + pan offset
  pitchConfig: ReturnType<typeof import('@tmc/core').getPitchDimensions>;
  pitchSettings: PitchSettings;
  teamSettings: TeamSettings;
  playerOrientationSettings: PlayerOrientationSettings; // PR3
  gridVisible: boolean;
  zoom: number; // PR3
  layerVisibility: {
    zones: boolean;
    arrows: boolean;
    homePlayers: boolean;
    awayPlayers: boolean;
    ball: boolean;
    labels: boolean;
  };
  hiddenByGroup: Set<string>;
  
  // Board state
  elements: BoardElement[];
  selectedIds: string[];
  isPlaying: boolean;
  activeTool: string | null;
  isPrintMode: boolean;
  
  // Marquee state
  marqueeStart: Position | null;
  marqueeEnd: Position | null;
  
  // Drawing state
  drawingStart: Position | null;
  drawingEnd: Position | null;
  freehandPoints: number[] | null;
  
  // Stage event handlers
  onStageClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onStageMouseDown: (e: any) => void;
  onStageMouseMove: (e: any) => void;
  onStageMouseUp: () => void;
  onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  
  // Element event handlers
  onElementSelect: (id: string, addToSelection: boolean) => void;
  onElementDragEnd: (id: string, position: Position) => void;
  onElementDragStart: (id: string, mouseX?: number, mouseY?: number) => boolean;
  onResizeZone: (id: string, position: Position, width: number, height: number) => void;
  onUpdateArrowEndpoint: (id: string, endpoint: 'start' | 'end', position: Position) => void;
  onPlayerQuickEdit: (id: string, currentNumber: number) => void;
  onTextDoubleClick: (id: string) => void;
  pushHistory: () => void;
  
  // Interpolation helpers
  getInterpolatedPosition: (elementId: string, currentPos: Position) => Position;
  getInterpolatedZone: (elementId: string, currentPos: Position, width: number, height: number) => { position: Position; width: number; height: number };
  getInterpolatedArrowEndpoints: (elementId: string, start: Position, end: Position) => { start: Position; end: Position };
}

export function CanvasAdapter(props: CanvasAdapterProps) {
  const {
    stageRef,
    canvasWidth,
    canvasHeight,
    stageScale = 1, // PR-FIX-4
    stagePosition = { x: 0, y: 0 }, // PR-FIX-4
    pitchConfig,
    pitchSettings,
    teamSettings,
    playerOrientationSettings, // PR3
    gridVisible,
    zoom, // PR3
    layerVisibility,
    hiddenByGroup,
    elements,
    selectedIds,
    isPlaying,
    activeTool,
    isPrintMode,
    marqueeStart,
    marqueeEnd,
    drawingStart,
    drawingEnd,
    freehandPoints,
    onStageClick,
    onStageMouseDown,
    onStageMouseMove,
    onStageMouseUp,
    onContextMenu,
    onElementSelect,
    onElementDragEnd,
    onElementDragStart,
    onResizeZone,
    onUpdateArrowEndpoint,
    onPlayerQuickEdit,
    onTextDoubleClick,
    pushHistory,
    getInterpolatedPosition,
    getInterpolatedZone,
    getInterpolatedArrowEndpoints,
  } = props;

  // Bundle interpolators into stable object for memoization
  const interpolators = useMemo(
    () => ({
      getInterpolatedPosition,
      getInterpolatedZone,
      getInterpolatedArrowEndpoints,
    }),
    [getInterpolatedPosition, getInterpolatedZone, getInterpolatedArrowEndpoints]
  );

  return (
    <Stage
      ref={stageRef}
      width={canvasWidth}
      height={canvasHeight}
      x={stagePosition.x}
      y={stagePosition.y}
      scaleX={stageScale}
      scaleY={stageScale}
      onClick={onStageClick}
      onTap={onStageClick}
      onMouseDown={onStageMouseDown}
      onTouchStart={onStageMouseDown}
      onMouseMove={onStageMouseMove}
      onTouchMove={onStageMouseMove}
      onMouseUp={onStageMouseUp}
      onTouchEnd={onStageMouseUp}
      onContextMenu={onContextMenu}
    >
      <CanvasElements
        elements={elements}
        selectedIds={selectedIds}
        hiddenByGroup={hiddenByGroup}
        layerVisibility={layerVisibility}
        pitchConfig={pitchConfig}
        pitchSettings={pitchSettings}
        teamSettings={teamSettings}
        playerOrientationSettings={playerOrientationSettings}
        gridVisible={gridVisible}
        zoom={zoom}
        isPlaying={isPlaying}
        activeTool={activeTool}
        isPrintMode={isPrintMode}
        marqueeStart={marqueeStart}
        marqueeEnd={marqueeEnd}
        drawingStart={drawingStart}
        drawingEnd={drawingEnd}
        freehandPoints={freehandPoints}
        interpolators={interpolators}
        onElementSelect={onElementSelect}
        onElementDragEnd={onElementDragEnd}
        onElementDragStart={onElementDragStart}
        onResizeZone={onResizeZone}
        onUpdateArrowEndpoint={onUpdateArrowEndpoint}
        onPlayerQuickEdit={onPlayerQuickEdit}
        onTextDoubleClick={onTextDoubleClick}
        pushHistory={pushHistory}
      />
    </Stage>
  );
}
