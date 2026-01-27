/**
 * BoardCanvasSection - Canvas rendering section for BoardPage
 * Contains CanvasShell, Stage, and all canvas layers
 */

import { ReactNode } from 'react';
import { Stage, Layer } from 'react-konva';
import { Line } from 'react-konva';
import type Konva from 'konva';
import { DEFAULT_PITCH_SETTINGS, isPlayerElement, isBallElement, isArrowElement, isZoneElement, isTextElement, isDrawingElement, isEquipmentElement } from '@tmc/core';
import type { BoardElement, Position, PitchSettings, TeamSettings, EquipmentElement } from '@tmc/core';
import { Pitch, PlayerNode, BallNode, ArrowNode, ZoneNode, TextNode, ArrowPreview, ZonePreview, SelectionBox, DrawingNode, EquipmentNode } from '@tmc/board';
import { CanvasShell } from '../../components/CanvasShell';
import { BoardCanvas } from '../../components/Canvas/BoardCanvas';

export interface BoardCanvasSectionProps {
  // Canvas config
  stageRef: React.RefObject<Konva.Stage>;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  pitchConfig: ReturnType<typeof import('@tmc/core').getPitchDimensions>;
  pitchSettings: PitchSettings;
  teamSettings: TeamSettings;
  gridVisible: boolean;
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
  
  // Marquee state
  marqueeStart: Position | null;
  marqueeEnd: Position | null;
  
  // Drawing state
  drawingStart: Position | null;
  drawingEnd: Position | null;
  freehandPoints: number[] | null;
  
  // Animation state
  animationProgress: number;
  nextStepElements: BoardElement[] | null;
  
  // Empty state overlay
  emptyStateOverlay: ReactNode;
  
  // Event handlers
  onStageClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onStageMouseDown: (e: any) => void;
  onStageMouseMove: (e: any) => void;
  onStageMouseUp: () => void;
  onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => void;
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
  
  // Feature flag
  useNewCanvas?: boolean;
  activeCanvasInteraction?: any;
}

export function BoardCanvasSection(props: BoardCanvasSectionProps) {
  const {
    stageRef,
    canvasWidth,
    canvasHeight,
    zoom,
    pitchConfig,
    pitchSettings,
    teamSettings,
    gridVisible,
    layerVisibility,
    hiddenByGroup,
    elements,
    selectedIds,
    isPlaying,
    activeTool,
    marqueeStart,
    marqueeEnd,
    drawingStart,
    drawingEnd,
    freehandPoints,
    emptyStateOverlay,
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
    useNewCanvas = false,
    activeCanvasInteraction,
  } = props;

  return (
    <div 
      className="shadow-canvas rounded-[20px] overflow-hidden border border-border/50 p-3 bg-surface/50 backdrop-blur-sm transition-transform"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
    >
      <CanvasShell emptyStateOverlay={emptyStateOverlay}>
        {useNewCanvas ? (
          <BoardCanvas
            ref={stageRef}
            width={canvasWidth}
            height={canvasHeight}
            elements={elements}
            selectedIds={selectedIds}
            pitchConfig={pitchConfig}
            pitchSettings={pitchSettings ?? DEFAULT_PITCH_SETTINGS}
            teamSettings={teamSettings ?? { home: { primaryColor: '#3b82f6', secondaryColor: '#1e40af', name: 'Home' }, away: { primaryColor: '#ef4444', secondaryColor: '#b91c1c', name: 'Away' } }}
            gridVisible={gridVisible}
            layerVisibility={{
              zones: layerVisibility.zones,
              arrows: layerVisibility.arrows,
              homePlayers: layerVisibility.homePlayers,
              awayPlayers: layerVisibility.awayPlayers,
              ball: layerVisibility.ball,
              equipment: true,
              text: layerVisibility.labels,
              drawings: true,
            }}
            hiddenByGroup={hiddenByGroup}
            isPlaying={isPlaying}
            freehandPoints={freehandPoints ? freehandPoints.map((val, idx) => idx % 2 === 0 ? { x: val, y: freehandPoints[idx + 1] ?? 0 } : null).filter((p): p is { x: number; y: number } => p !== null) : null}
            freehandType={
              activeTool === 'highlighter' ? 'highlighter' :
              activeTool === 'drawing' ? 'drawing' :
              null
            }
            marqueeStart={marqueeStart}
            marqueeEnd={marqueeEnd}
            onStageClick={onStageClick}
            onStageMouseDown={onStageMouseDown}
            onStageMouseMove={onStageMouseMove}
            onStageMouseUp={onStageMouseUp}
            onElementSelect={activeCanvasInteraction?.handleElementSelect}
            onElementDragEnd={activeCanvasInteraction?.handleElementDragEnd}
            onElementDragStart={activeCanvasInteraction?.handleDragStart}
            onResizeZone={onResizeZone}
            onUpdateArrowEndpoint={onUpdateArrowEndpoint}
            onPlayerQuickEdit={(id) => {
              const player = elements.find(el => el.id === id && isPlayerElement(el));
              if (player && isPlayerElement(player)) {
                onPlayerQuickEdit(id, player.number);
              }
            }}
          />
        ) : (
          <Stage
            ref={stageRef}
            width={canvasWidth}
            height={canvasHeight}
            onClick={onStageClick}
            onTap={onStageClick}
            onMouseDown={onStageMouseDown}
            onTouchStart={onStageMouseDown}
            onMouseUp={onStageMouseUp}
            onTouchEnd={onStageMouseUp}
            onMouseMove={onStageMouseMove}
            onTouchMove={onStageMouseMove}
            onContextMenu={onContextMenu}
          >
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
          </Stage>
        )}
      </CanvasShell>
    </div>
  );
}
