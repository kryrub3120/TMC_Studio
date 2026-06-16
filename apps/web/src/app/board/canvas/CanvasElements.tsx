/**
 * CanvasElements - Pure rendering component for legacy Konva canvas
 * NO store imports, NO hooks (except memo), receives all data via props
 */

import React, { useRef, useEffect } from 'react';
import { Layer, Line, Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { BoardElement, Position, PitchSettings, TeamSettings, PlayerOrientationSettings, EquipmentElement } from '@tmc/core';
import { isPlayerElement, isBallElement, isArrowElement, isZoneElement, isTextElement, isDrawingElement, isEquipmentElement } from '@tmc/core';
import { Pitch, PlayerNode, BallNode, ArrowNode, ZoneNode, TextNode, ArrowPreview, ZonePreview, PolygonPreview, SelectionBox, DrawingNode, EquipmentNode } from '@tmc/board';

export interface CanvasElementsProps {
  // Data
  canvasWidth: number;
  canvasHeight: number;
  elements: BoardElement[];
  selectedIds: string[];
  hiddenByGroup: Set<string>;
  layerVisibility: {
    zones: boolean;
    arrows: boolean;
    homePlayers: boolean;
    awayPlayers: boolean;
    ball: boolean;
    labels: boolean;
  };
  
  // Config
  pitchConfig: ReturnType<typeof import('@tmc/core').getPitchDimensions>;
  pitchSettings: PitchSettings;
  teamSettings: TeamSettings;
  playerOrientationSettings: PlayerOrientationSettings; // PR3
  gridVisible: boolean;
  zoom: number; // PR3
  
  // Animation state
  isPlaying: boolean;
  activeTool: string | null;
  isPrintMode: boolean;
  
  // Marquee
  marqueeStart: Position | null;
  marqueeEnd: Position | null;
  
  // Drawing preview
  drawingStart: Position | null;
  drawingEnd: Position | null;
  freehandPoints: number[] | null;
  polygonPoints: number[] | null;
  polygonCursor: Position | null;
  
  // Interpolators (stable object)
  interpolators: {
    getInterpolatedPosition: (elementId: string, currentPos: Position) => Position;
    getInterpolatedZone: (elementId: string, currentPos: Position, width: number, height: number) => { position: Position; width: number; height: number };
    getInterpolatedArrowEndpoints: (elementId: string, start: Position, end: Position) => { start: Position; end: Position };
  };
  
  // True Virtual Canvas: Group transform applied to Layer
  groupZoom?: number;
  groupPanX?: number;
  groupPanY?: number;
  
  // Handlers
  onElementSelect: (id: string, addToSelection: boolean) => void;
  onElementDragEnd: (id: string, position: Position) => void;
  onElementDragStart: (id: string, mouseX?: number, mouseY?: number) => boolean;
  onResizeZone: (id: string, position: Position, width: number, height: number) => void;
  onUpdateZonePoints?: (id: string, points: number[]) => void;
  onResizeEquipment?: (id: string, scale: number) => void;
  onUpdateArrowEndpoint: (id: string, endpoint: 'start' | 'end' | 'control', position: Position) => void;
  onPlayerQuickEdit: (id: string, currentNumber: number | null | undefined) => void;
  onTextDoubleClick: (id: string) => void;
  pushHistory: () => void;
  
  // ALT+Drag rotation
  onOrientationPreview: (id: string, orientation: number) => void;
  onOrientationCommit: (id: string, orientation: number) => void;
}

export const CanvasElements = React.memo(function CanvasElements(props: CanvasElementsProps) {
  const {
    elements,
    canvasWidth,
    canvasHeight,
    selectedIds,
    hiddenByGroup,
    layerVisibility,
    pitchConfig,
    pitchSettings,
    teamSettings,
    playerOrientationSettings, // PR3
    gridVisible,
    zoom, // PR3
    isPlaying,
    activeTool,
    isPrintMode,
    marqueeStart,
    marqueeEnd,
    drawingStart,
    polygonPoints,
    polygonCursor,
    drawingEnd,
    freehandPoints,
    interpolators,
    groupZoom = 1,
    groupPanX = 0,
    groupPanY = 0,
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
  } = props;

  const { getInterpolatedPosition, getInterpolatedZone, getInterpolatedArrowEndpoints } = interpolators;

  const transformerRef = useRef<Konva.Transformer>(null);

  // Attach Konva Transformer to the selected TextNode only (Sprint B POC)
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;

    if (!isPlaying && selectedIds.length === 1) {
      const selectedId = selectedIds[0];
      // Verify the selected element is a TextNode
      const isText = elements.some((el) => el.id === selectedId && isTextElement(el));
      if (isText) {
        const stage = tr.getStage();
        if (stage) {
          const node = stage.findOne('#' + selectedId);
          if (node) {
            tr.nodes([node]);
            tr.getLayer()?.batchDraw();
            return;
          }
        }
      }
    }

    // Detach transformer when no valid single TextNode is selected
    tr.nodes([]);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, elements, isPlaying]);

  return (
    <Layer
      x={groupPanX}
      y={groupPanY}
      scaleX={groupZoom}
      scaleY={groupZoom}
    >
      {isPrintMode && (
        <Rect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          fill="#ffffff"
          listening={false}
        />
      )}

      <Pitch config={pitchConfig} pitchSettings={pitchSettings} gridVisible={gridVisible} />

      {/* Zones */}
      {layerVisibility.zones && elements
        .filter(isZoneElement)
        .map((zone) => {
          const interpolated = getInterpolatedZone(zone.id, zone.position, zone.width, zone.height);
          const animatedZone = { ...zone, position: interpolated.position, width: interpolated.width, height: interpolated.height };
          return (
            <ZoneNode
              key={zone.id}
              zone={animatedZone}
              pitchConfig={pitchConfig}
              isSelected={!isPlaying && selectedIds.includes(zone.id)}
              onSelect={isPlaying ? () => {} : onElementSelect}
              onDragEnd={isPlaying ? () => {} : onElementDragEnd}
              onResize={onResizeZone}
              onUpdatePoints={isPlaying ? undefined : onUpdateZonePoints}
            />
          );
        })}

      {/* Arrows */}
      {layerVisibility.arrows && elements
        .filter(isArrowElement)
        .map((arrow) => {
          const endpoints = getInterpolatedArrowEndpoints(arrow.id, arrow.startPoint, arrow.endPoint);
          const animatedArrow = { ...arrow, startPoint: endpoints.start, endPoint: endpoints.end };
          return (
            <ArrowNode
              key={arrow.id}
              arrow={animatedArrow}
              pitchConfig={pitchConfig}
              isSelected={!isPlaying && selectedIds.includes(arrow.id)}
              onSelect={isPlaying ? () => {} : onElementSelect}
              onDragEnd={isPlaying ? () => {} : onElementDragEnd}
              isPrintMode={isPrintMode}
              onEndpointDrag={(id, endpoint, pos) => {
                onUpdateArrowEndpoint(id, endpoint, pos);
                pushHistory();
              }}
            />
          );
        })}

      {/* Players */}
      {elements
        .filter(isPlayerElement)
        .filter((player) => !hiddenByGroup.has(player.id))
        .filter((player) => 
          (player.team === 'home' && layerVisibility.homePlayers) ||
          (player.team === 'away' && layerVisibility.awayPlayers) ||
          (player.team !== 'home' && player.team !== 'away' &&
            (layerVisibility.homePlayers || layerVisibility.awayPlayers))
        )
        .map((player) => {
          const animatedPlayer = { ...player, position: getInterpolatedPosition(player.id, player.position) };
          return (
            <PlayerNode
              key={player.id}
              player={animatedPlayer}
              pitchConfig={pitchConfig}
              teamSettings={teamSettings}
              playerOrientationSettings={playerOrientationSettings}
              zoom={Math.round(zoom * 100)}
              isPrintMode={isPrintMode}
              isSelected={!isPlaying && selectedIds.includes(player.id)}
              onSelect={isPlaying ? () => {} : onElementSelect}
              onDragEnd={isPlaying ? () => {} : onElementDragEnd}
              onDragStart={isPlaying ? () => false : onElementDragStart}
              onQuickEditNumber={isPlaying ? undefined : onPlayerQuickEdit}
              onOrientationPreview={isPlaying ? undefined : onOrientationPreview}
              onOrientationCommit={isPlaying ? undefined : onOrientationCommit}
            />
          );
        })}

      {/* Ball */}
      {layerVisibility.ball && elements
        .filter(isBallElement)
        .filter((ball) => !hiddenByGroup.has(ball.id))
        .map((ball) => {
          const animatedBall = { ...ball, position: getInterpolatedPosition(ball.id, ball.position) };
          return (
            <BallNode
              key={ball.id}
              ball={animatedBall}
              pitchConfig={pitchConfig}
              isSelected={!isPlaying && selectedIds.includes(ball.id)}
              onSelect={isPlaying ? () => {} : onElementSelect}
              onDragEnd={isPlaying ? () => {} : onElementDragEnd}
              onDragStart={isPlaying ? () => false : onElementDragStart}
            />
          );
        })}

      {/* Equipment */}
      {elements
        .filter(isEquipmentElement)
        .map((equipment) => {
          const animatedEquipment = { ...equipment, position: getInterpolatedPosition(equipment.id, equipment.position) };
          return (
            <EquipmentNode
              key={equipment.id}
              element={animatedEquipment as EquipmentElement}
              isSelected={!isPlaying && selectedIds.includes(equipment.id)}
              isPrintMode={isPrintMode}
              onSelect={isPlaying ? () => {} : onElementSelect}
              onDragEnd={isPlaying ? () => {} : (id, x, y) => {
                onElementDragEnd(id, { x, y });
              }}
              onResize={isPlaying ? undefined : onResizeEquipment}
            />
          );
        })}

      {/* Text elements */}
      {layerVisibility.labels && elements
        .filter(isTextElement)
        .map((textEl) => {
          const animatedText = { ...textEl, position: getInterpolatedPosition(textEl.id, textEl.position) };
          return (
            <TextNode
              key={textEl.id}
              text={animatedText}
              pitchConfig={pitchConfig}
              isPrintMode={isPrintMode}
              isSelected={!isPlaying && selectedIds.includes(textEl.id)}
              onSelect={isPlaying ? () => {} : onElementSelect}
              onDragEnd={isPlaying ? () => {} : onElementDragEnd}
              onDragStart={isPlaying ? () => false : onElementDragStart}
              onDoubleClick={isPlaying ? undefined : onTextDoubleClick}
            />
          );
        })}

      {/* Transformer for selected TextNode — Sprint B POC */}
      <Transformer
        ref={transformerRef}
        borderEnabled={true}
        borderStroke="#3b82f6"
        borderStrokeWidth={1}
        anchorStroke="#3b82f6"
        anchorFill="#ffffff"
        anchorSize={8}
        rotateAnchorOffset={25}
        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        boundBoxFunc={(oldBox, newBox) => {
          // Prevent shrinking below minimum size
          if (newBox.width < 20 || newBox.height < 10) return oldBox;
          return newBox;
        }}
      />

      {/* Drawing preview */}
      {drawingStart && drawingEnd && (activeTool === 'arrow-pass' || activeTool === 'arrow-run' || activeTool === 'arrow-shoot' || activeTool === 'arrow-dribble') && (
        <ArrowPreview
          start={drawingStart}
          end={drawingEnd}
          type={
            activeTool === 'arrow-pass'
              ? 'pass'
              : activeTool === 'arrow-run'
                ? 'run'
                : activeTool === 'arrow-shoot'
                  ? 'shoot'
                  : 'dribble'
          }
        />
      )}
      {drawingStart && drawingEnd && activeTool === 'zone' && (
        <ZonePreview start={drawingStart} end={drawingEnd} shape="rect" />
      )}
      {drawingStart && drawingEnd && activeTool === 'zone-ellipse' && (
        <ZonePreview start={drawingStart} end={drawingEnd} shape="ellipse" />
      )}
      {activeTool === 'zone-polygon' && polygonPoints && (
        <PolygonPreview points={polygonPoints} cursor={polygonCursor} />
      )}

      {/* Freehand drawings */}
      {elements.filter(isDrawingElement).map((drawing) => (
        <DrawingNode
          key={drawing.id}
          drawing={drawing}
          isSelected={selectedIds.includes(drawing.id)}
          onSelect={onElementSelect}
        />
      ))}

      {/* Live freehand preview */}
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
  );
});
