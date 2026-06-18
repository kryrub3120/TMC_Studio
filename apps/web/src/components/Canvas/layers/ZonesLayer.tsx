/**
 * ZonesLayer - Renders zone elements
 * 
 * NO store access - receives all data via props
 * NO mapping in render - uses selectors only
 */

import { memo } from 'react';
import { Layer } from 'react-konva';
import type { BoardElement, PitchConfig } from '@tmc/core';
import { isZoneElement } from '@tmc/core';
import { ZoneNode } from '@tmc/board';

export interface ZonesLayerProps {
  elements: BoardElement[];
  selectedIds: string[];
  pitchConfig: PitchConfig;
  isPlaying: boolean;
  visible: boolean;
  isElementLocked?: (id: string) => boolean;
  onSelect?: (id: string, addToSelection: boolean) => void;
  onDragEnd?: (id: string, newPos: { x: number; y: number }) => void;
  onResize?: (id: string, pos: { x: number; y: number }, width: number, height: number) => void;
}

export const ZonesLayer = memo<ZonesLayerProps>(({
  elements,
  selectedIds,
  pitchConfig,
  isPlaying,
  visible,
  isElementLocked = (id: string) => elements.find((el) => el.id === id)?.locked === true,
  onSelect,
  onDragEnd,
  onResize,
}) => {
  if (!visible) return null;
  
  const zones = elements.filter(isZoneElement);
  
  return (
    <Layer>
      {zones.map((zone) => (
        <ZoneNode
          key={zone.id}
          zone={zone}
          pitchConfig={pitchConfig}
          isSelected={!isPlaying && selectedIds.includes(zone.id)}
          isLocked={isElementLocked(zone.id)}
          onSelect={isPlaying ? () => {} : (onSelect || (() => {}))}
          onDragEnd={isPlaying ? () => {} : (onDragEnd || (() => {}))}
          onResize={onResize}
        />
      ))}
    </Layer>
  );
});

ZonesLayer.displayName = 'ZonesLayer';
