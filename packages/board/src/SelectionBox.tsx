/**
 * Selection box for multi-select dragging
 */

import React from 'react';
import { Rect } from 'react-konva';

export interface SelectionBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

/** Rectangle drawn when drag-selecting multiple elements */
export const SelectionBox: React.FC<SelectionBoxProps> = ({
  x,
  y,
  width,
  height,
  visible,
}) => {
  if (!visible) return null;

  // Normalize negative dimensions
  const normalizedX = width < 0 ? x + width : x;
  const normalizedY = height < 0 ? y + height : y;
  const normalizedWidth = Math.abs(width);
  const normalizedHeight = Math.abs(height);

  return (
    <Rect
      x={normalizedX}
      y={normalizedY}
      width={normalizedWidth}
      height={normalizedHeight}
      fill="rgba(100, 149, 237, 0.2)"
      stroke="rgba(100, 149, 237, 0.8)"
      strokeWidth={1}
      dash={[4, 4]}
      listening={false}
    />
  );
};

/** Check if a point is inside a selection box */
export function isPointInSelectionBox(
  pointX: number,
  pointY: number,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number
): boolean {
  // Normalize box coordinates
  const minX = boxWidth < 0 ? boxX + boxWidth : boxX;
  const maxX = boxWidth < 0 ? boxX : boxX + boxWidth;
  const minY = boxHeight < 0 ? boxY + boxHeight : boxY;
  const maxY = boxHeight < 0 ? boxY : boxY + boxHeight;

  return pointX >= minX && pointX <= maxX && pointY >= minY && pointY <= maxY;
}

export default SelectionBox;
