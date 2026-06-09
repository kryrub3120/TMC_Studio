/**
 * CanvasAdapter - Wiring layer for legacy Konva canvas
 * 
 * True Virtual Canvas Model:
 * - Stage fills the container (width/height = containerWidth/Height), scale=1, x=y=0
 * - CanvasElements renders a single <Layer> with scaleX/Y=groupZoom, x/y=groupPan
 * - World coordinate mapping: worldX = (stagePointerX - groupPanX) / groupZoom
 * 
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
  canvasWidth: number;   // world/pitch width (unchanged, for pitch rendering)
  canvasHeight: number;  // world/pitch height
  containerWidth: number;  // Stage physical width = container width
  containerHeight: number; // Stage physical height = container height
  /** Zoom level applied to root Group */
  groupZoom: number;
  /** Pan offset applied to root Group (world origin position in screen coords) */
  groupPan: { x: number; y: number };
  pitchConfig: ReturnType<typeof import('@tmc/core').getPitchDimensions>;
  pitchSettings: PitchSettings;
  teamSettings: TeamSettings;
  playerOrientationSettings: PlayerOrientationSettings;
  gridVisible: boolean;
  zoom: number; // passed through to CanvasElements for PlayerOrientation zoom threshold
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
  
  // ALT+Drag rotation
  onOrientationPreview: (id: string, orientation: number) => void;
  onOrientationCommit: (id: string, orientation: number) => void;
  
  // Interpolation helpers
  getInterpolatedPosition: (elementId: string, currentPos: Position) => Position;
  getInterpolatedZone: (elementId: string, currentPos: Position, width: number, height: number) => { position: Position; width: number; height: number };
  getInterpolatedArrowEndpoints: (elementId: string, start: Position, end: Position) => { start: Position; end: Position };
}

export function CanvasAdapter(props: CanvasAdapterProps) {
  const {
    stageRef,
    containerWidth,
    containerHeight,
    groupZoom,
    groupPan,
    pitchConfig,
    pitchSettings,
    teamSettings,
    playerOrientationSettings,
    gridVisible,
    zoom,
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
    onOrientationPreview,
    onOrientationCommit,
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
    // Stage fills the viewport container — scale=1, no pan transform on Stage
    <Stage
      ref={stageRef}
      width={containerWidth}
      height={containerHeight}
      x={0}
      y={0}
      scaleX={1}
      scaleY={1}
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
        groupZoom={groupZoom}
        groupPanX={groupPan.x}
        groupPanY={groupPan.y}
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
        onOrientationPreview={onOrientationPreview}
        onOrientationCommit={onOrientationCommit}
      />
    </Stage>
  );
}
