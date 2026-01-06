/**
 * DrawingNode - Renders freehand/highlighter strokes on the canvas
 */

import React from 'react';
import { Line } from 'react-konva';
import type { DrawingElement } from '@tmc/core';

export interface DrawingNodeProps {
  drawing: DrawingElement;
  isSelected?: boolean;
  onSelect?: (id: string, addToSelection: boolean) => void;
}

/** Freehand drawing stroke component */
export const DrawingNode: React.FC<DrawingNodeProps> = ({
  drawing,
  isSelected = false,
  onSelect,
}) => {
  const { id, drawingType, points, color, strokeWidth, opacity } = drawing;

  // Configure line cap and join for smooth strokes
  const lineCap = 'round';
  const lineJoin = 'round';

  // Highlighter has different properties
  const isHighlighter = drawingType === 'highlighter';
  const effectiveOpacity = isHighlighter ? Math.min(opacity, 0.4) : opacity;
  const effectiveStrokeWidth = isHighlighter ? strokeWidth * 3 : strokeWidth;

  return (
    <Line
      id={`drawing-${id}`}
      points={points}
      stroke={color}
      strokeWidth={effectiveStrokeWidth}
      opacity={effectiveOpacity}
      lineCap={lineCap}
      lineJoin={lineJoin}
      tension={0.5}
      // Selection highlight
      shadowColor={isSelected ? '#3b82f6' : undefined}
      shadowBlur={isSelected ? 10 : 0}
      shadowOpacity={isSelected ? 0.8 : 0}
      // Click handling
      onClick={(e) => {
        if (onSelect) {
          onSelect(id, e.evt.shiftKey);
        }
      }}
      onTap={() => {
        if (onSelect) {
          onSelect(id, false);
        }
      }}
      // Cursor
      // hitStrokeWidth={Math.max(strokeWidth * 2, 10)} // Easier to select thin lines
    />
  );
};

export default DrawingNode;
