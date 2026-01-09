/**
 * BoardCanvas - Main canvas component composition
 * 
 * Composes all canvas layers with proper z-ordering.
 * Receives view models via props (no direct store access).
 */

import { forwardRef } from 'react';
import { Stage } from 'react-konva';
import type Konva from 'konva';
import type { BoardElement, PitchConfig, PitchSettings, TeamSettings } from '@tmc/core';
import { PitchLayer } from './layers/PitchLayer';
import { ZonesLayer } from './layers/ZonesLayer';
import { ArrowsLayer } from './layers/ArrowsLayer';
import { PlayersLayer } from './layers/PlayersLayer';
import { DrawingLayer } from './layers/DrawingLayer';
import { OverlayLayer } from './layers/OverlayLayer';

export interface BoardCanvasProps {
  // Dimensions
  width: number;
  height: number;
  
  // View models (no store access in layers)
  elements: BoardElement[];
  selectedIds: string[];
  pitchConfig: PitchConfig;
  pitchSettings: PitchSettings;
  teamSettings: TeamSettings;
  
  // UI state
  gridVisible: boolean;
  layerVisibility: {
    zones: boolean;
    arrows: boolean;
    homePlayers: boolean;
    awayPlayers: boolean;
    ball: boolean;
    equipment: boolean;
    text: boolean;
    drawings: boolean;
  };
  hiddenByGroup: Set<string>;
  isPlaying: boolean;
  
  // Drawing state
  freehandPoints: Array<{ x: number; y: number }> | null;
  freehandType: 'drawing' | 'highlighter' | null;
  marqueeStart: { x: number; y: number } | null;
  marqueeEnd: { x: number; y: number } | null;
  
  // Event handlers (passed to OverlayLayer only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onStageClick?: (e: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onStageMouseDown?: (e: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onStageMouseMove?: (e: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onStageMouseUp?: (e: any) => void;
  onElementSelect?: (id: string, addToSelection: boolean) => void;
  onElementDragEnd?: (id: string, newPos: { x: number; y: number }) => void;
  onElementDragStart?: (id: string) => boolean;
  onResizeZone?: (id: string, pos: { x: number; y: number }, width: number, height: number) => void;
  onUpdateArrowEndpoint?: (id: string, endpoint: 'start' | 'end', pos: { x: number; y: number }) => void;
  onPlayerQuickEdit?: (id: string) => void;
}

export const BoardCanvas = forwardRef<Konva.Stage, BoardCanvasProps>((props, ref) => {
  const {
    width,
    height,
    elements,
    selectedIds,
    pitchConfig,
    pitchSettings,
    teamSettings,
    gridVisible,
    layerVisibility,
    hiddenByGroup,
    isPlaying,
    freehandPoints,
    freehandType,
    marqueeStart,
    marqueeEnd,
    onStageClick,
    onStageMouseDown,
    onStageMouseMove,
    onStageMouseUp,
    onElementSelect,
    onElementDragEnd,
    onElementDragStart,
    onResizeZone,
    onUpdateArrowEndpoint,
    onPlayerQuickEdit,
  } = props;
  
  return (
    <Stage
      ref={ref}
      width={width}
      height={height}
      onClick={onStageClick}
      onTap={onStageClick}
      onMouseDown={onStageMouseDown}
      onTouchStart={onStageMouseDown}
      onMouseUp={onStageMouseUp}
      onTouchEnd={onStageMouseUp}
      onMouseMove={onStageMouseMove}
      onTouchMove={onStageMouseMove}
    >
      {/* Layer 1: Pitch background (static) */}
      <PitchLayer
        config={pitchConfig}
        pitchSettings={pitchSettings}
        gridVisible={gridVisible}
      />
      
      {/* Layer 2: Zones (lowest z-order for elements) */}
      <ZonesLayer
        elements={elements}
        selectedIds={selectedIds}
        pitchConfig={pitchConfig}
        isPlaying={isPlaying}
        visible={layerVisibility.zones}
        onSelect={onElementSelect}
        onDragEnd={onElementDragEnd}
        onResize={onResizeZone}
      />
      
      {/* Layer 3: Arrows */}
      <ArrowsLayer
        elements={elements}
        selectedIds={selectedIds}
        pitchConfig={pitchConfig}
        isPlaying={isPlaying}
        visible={layerVisibility.arrows}
        onSelect={onElementSelect}
        onDragEnd={onElementDragEnd}
        onEndpointDrag={onUpdateArrowEndpoint}
      />
      
      {/* Layer 4: Players + Ball */}
      <PlayersLayer
        elements={elements}
        selectedIds={selectedIds}
        pitchConfig={pitchConfig}
        teamSettings={teamSettings}
        layerVisibility={layerVisibility}
        hiddenByGroup={hiddenByGroup}
        isPlaying={isPlaying}
        onSelect={onElementSelect}
        onDragEnd={onElementDragEnd}
        onDragStart={onElementDragStart}
        onPlayerQuickEdit={onPlayerQuickEdit}
      />
      
      {/* Layer 5: Freehand drawings */}
      <DrawingLayer
        elements={elements}
        selectedIds={selectedIds}
        isPlaying={isPlaying}
        visible={layerVisibility.drawings}
        onSelect={onElementSelect}
      />
      
      {/* Layer 6: Overlays (selection box, drawing preview) */}
      <OverlayLayer
        freehandPoints={freehandPoints}
        freehandType={freehandType}
        marqueeStart={marqueeStart}
        marqueeEnd={marqueeEnd}
      />
    </Stage>
  );
});

BoardCanvas.displayName = 'BoardCanvas';
