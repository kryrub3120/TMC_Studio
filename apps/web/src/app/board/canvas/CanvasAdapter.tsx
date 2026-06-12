/**
 * CanvasAdapter - Wiring layer for legacy Konva canvas
 *
 * ╔═══════════════════ True Virtual Canvas Invariants (ETAP 2) ══════════════════╗
 * ║  1. Stage ALWAYS fills the container:                                        ║
 * ║       width={containerWidth}  height={containerHeight}                       ║
 * ║       scaleX={1}  scaleY={1}  x={0}  y={0}                                  ║
 * ║     → Stage MUST NOT be resized physically or scaled.                        ║
 * ║                                                                               ║
 * ║  2. All zoom/pan lives on the root Layer (via CanvasElements):               ║
 * ║       <Layer x={groupPan.x} y={groupPan.y}                                   ║
 * ║              scaleX={groupZoom} scaleY={groupZoom}>                          ║
 * ║                                                                               ║
 * ║  3. NO <div> or HTML inside <Stage>. DOM overlays (empty-state, edit inputs) ║
 * ║     are rendered OUTSIDE Stage, in CanvasShell's sibling DOM nodes.          ║
 * ║     Violation causes: "Konva error: You may only add groups and shapes to    ║
 * ║     groups" — which is a React crash, not a graceful error.                  ║
 * ║                                                                               ║
 * ║  4. World coords: worldX = (stagePointerX - groupPanX) / groupZoom           ║
 * ║     Use getCanvasWorldCoords(stage, panX, panY, zoom) from viewportUtils.ts   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 *
 * NO store imports. Bundles interpolators and passes props to CanvasElements.
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
  polygonPoints: number[] | null;
  polygonCursor: Position | null;
  
  // Stage event handlers
  onStageClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onStageMouseDown: (e: any) => void;
  onStageMouseMove: (e: any) => void;
  onStageMouseUp: () => void;
  onStageDblClick?: () => void;
  onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  
  // Element event handlers
  onElementSelect: (id: string, addToSelection: boolean) => void;
  onElementDragEnd: (id: string, position: Position) => void;
  onElementDragStart: (id: string, mouseX?: number, mouseY?: number) => boolean;
  onResizeZone: (id: string, position: Position, width: number, height: number) => void;
  onUpdateZonePoints?: (id: string, points: number[]) => void;
  onResizeEquipment?: (id: string, scale: number) => void;
  onUpdateArrowEndpoint: (id: string, endpoint: 'start' | 'end', position: Position) => void;
  onPlayerQuickEdit: (id: string, currentNumber: number | null | undefined) => void;
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
    polygonPoints,
    polygonCursor,
    onStageClick,
    onStageMouseDown,
    onStageMouseMove,
    onStageMouseUp,
    onStageDblClick,
    onContextMenu,
    onElementSelect,
    onElementDragEnd,
    onElementDragStart,
    onResizeZone,
    onUpdateZonePoints,
    onResizeEquipment,
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
      onDblClick={onStageDblClick}
      onDblTap={onStageDblClick}
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
        polygonPoints={polygonPoints}
        polygonCursor={polygonCursor}
        interpolators={interpolators}
        onElementSelect={onElementSelect}
        onElementDragEnd={onElementDragEnd}
        onElementDragStart={onElementDragStart}
        onResizeZone={onResizeZone}
        onUpdateZonePoints={onUpdateZonePoints}
        onResizeEquipment={onResizeEquipment}
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
