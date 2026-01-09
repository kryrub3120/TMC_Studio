/**
 * DrawingLayer - Renders freehand drawings
 */

import { memo } from 'react';
import { Layer } from 'react-konva';
import type { BoardElement } from '@tmc/core';
import { DrawingNode } from '@tmc/board';

export interface DrawingLayerProps {
  elements: BoardElement[];
  selectedIds: string[];
  isPlaying: boolean;
  visible: boolean;
  onSelect?: (id: string, addToSelection: boolean) => void;
}

export const DrawingLayer = memo<DrawingLayerProps>(({
  elements,
  selectedIds,
  isPlaying,
  visible,
  onSelect,
}) => {
  if (!visible) return null;
  
  const drawings = elements.filter((el) => el.type === 'drawing');
  
  return (
    <Layer>
      {drawings.map((drawing) => (
        <DrawingNode
          key={drawing.id}
          drawing={drawing}
          isSelected={!isPlaying && selectedIds.includes(drawing.id)}
          onSelect={isPlaying ? () => {} : (onSelect || (() => {}))}
        />
      ))}
    </Layer>
  );
});

DrawingLayer.displayName = 'DrawingLayer';
