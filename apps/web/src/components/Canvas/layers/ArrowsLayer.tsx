/**
 * ArrowsLayer - Renders arrow elements
 */

import { memo } from 'react';
import { Layer } from 'react-konva';
import type { BoardElement, PitchConfig } from '@tmc/core';
import { isArrowElement } from '@tmc/core';
import { ArrowNode } from '@tmc/board';

export interface ArrowsLayerProps {
  elements: BoardElement[];
  selectedIds: string[];
  pitchConfig: PitchConfig;
  isPlaying: boolean;
  visible: boolean;
  isPrintMode?: boolean;
  onSelect?: (id: string, addToSelection: boolean) => void;
  onDragEnd?: (id: string, newPos: { x: number; y: number }) => void;
  onEndpointDrag?: (id: string, endpoint: 'start' | 'end' | 'control', pos: { x: number; y: number }) => void;
}

export const ArrowsLayer = memo<ArrowsLayerProps>(({
  elements,
  selectedIds,
  pitchConfig,
  isPlaying,
  visible,
  isPrintMode,
  onSelect,
  onDragEnd,
  onEndpointDrag,
}) => {
  if (!visible) return null;
  
  const arrows = elements.filter(isArrowElement);
  
  return (
    <Layer>
      {arrows.map((arrow) => (
        <ArrowNode
          key={arrow.id}
          arrow={arrow}
          pitchConfig={pitchConfig}
          isSelected={!isPlaying && selectedIds.includes(arrow.id)}
          onSelect={isPlaying ? () => {} : (onSelect || (() => {}))}
          onDragEnd={isPlaying ? () => {} : (onDragEnd || (() => {}))}
          isPrintMode={isPrintMode}
          onEndpointDrag={onEndpointDrag || (() => {})}
        />
      ))}
    </Layer>
  );
});

ArrowsLayer.displayName = 'ArrowsLayer';
