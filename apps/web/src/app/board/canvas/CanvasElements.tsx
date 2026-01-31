/**
 * CanvasElements - Pure rendering component for legacy Konva canvas
 * NO store imports, NO hooks (except memo), receives all data via props
 */

import React from 'react';
import { Layer, Line } from 'react-konva';
import type { BoardElement, Position, PitchSettings, TeamSettings, EquipmentElement } from '@tmc/core';
import { isPlayerElement, isBallElement, isArrowElement, isZoneElement, isTextElement, isDrawingElement, isEquipmentElement } from '@tmc/core';
import { Pitch, PlayerNode, BallNode, ArrowNode, ZoneNode, TextNode, ArrowPreview, ZonePreview, SelectionBox, DrawingNode, EquipmentNode } from '@tmc/board';

export interface CanvasElementsProps {
  // Data
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
  gridVisible: boolean;
  
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
  
  // Interpolators (stable object)
  interpolators: {
    getInterpolatedPosition: (elementId: string, currentPos: Position) => Position;
    getInterpolatedZone: (elementId: string, currentPos: Position, width: number, height: number) => { position: Position; width: number; height: number };
    getInterpolatedArrowEndpoints: (elementId: string, start: Position, end: Position) => { start: Position; end: Position };
  };
  
  // Handlers
  onElementSelect: (id: string, addToSelection: boolean) => void;
  onElementDragEnd: (id: string, position: Position) => void;
  onElementDragStart: (id: string, mouseX?: number, mouseY?: number) => boolean;
  onResizeZone: (id: string, position: Position, width: number, height: number) => void;
  onUpdateArrowEndpoint: (id: string, endpoint: 'start' | 'end', position: Position) => void;
  onPlayerQuickEdit: (id: string, currentNumber: number) => void;
  onTextDoubleClick: (id: string) => void;
  pushHistory: () => void;
}

export const CanvasElements = React.memo(function CanvasElements(props: CanvasElementsProps) {
  const {
    elements,
    selectedIds,
    hiddenByGroup,
    layerVisibility,
    pitchConfig,
    pitchSettings,
    teamSettings,
    gridVisible,
    isPlaying,
    activeTool,
    isPrintMode,
    marqueeStart,
    marqueeEnd,
    drawingStart,
    drawingEnd,
    freehandPoints,
    interpolators,
    onElementSelect,
    onElementDragEnd,
    onElementDragStart,
    onResizeZone,
    onUpdateArrowEndpoint,
    onPlayerQuickEdit,
    onTextDoubleClick,
    pushHistory,
  } = props;

  const { getInterpolatedPosition, getInterpolatedZone, getInterpolatedArrowEndpoints } = interpolators;

  return (
    <Layer>
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
          (player.team === 'away' && layerVisibility.awayPlayers)
        )
        .map((player) => {
          const animatedPlayer = { ...player, position: getInterpolatedPosition(player.id, player.position) };
          return (
            <PlayerNode
              key={player.id}
              player={animatedPlayer}
              pitchConfig={pitchConfig}
              teamSettings={teamSettings}
              isPrintMode={isPrintMode}
              isSelected={!isPlaying && selectedIds.includes(player.id)}
              onSelect={isPlaying ? () => {} : onElementSelect}
              onDragEnd={isPlaying ? () => {} : onElementDragEnd}
              onDragStart={isPlaying ? () => false : onElementDragStart}
              onQuickEditNumber={isPlaying ? undefined : onPlayerQuickEdit}
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

      {/* Drawing preview */}
      {drawingStart && drawingEnd && (activeTool === 'arrow-pass' || activeTool === 'arrow-run') && (
        <ArrowPreview start={drawingStart} end={drawingEnd} type={activeTool === 'arrow-pass' ? 'pass' : 'run'} />
      )}
      {drawingStart && drawingEnd && activeTool === 'zone' && (
        <ZonePreview start={drawingStart} end={drawingEnd} shape="rect" />
      )}
      {drawingStart && drawingEnd && activeTool === 'zone-ellipse' && (
        <ZonePreview start={drawingStart} end={drawingEnd} shape="ellipse" />
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
