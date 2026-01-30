/**
 * MannequinShape - training dummy (simple body shape)
 */
import React from 'react';
import { Group, Circle, Rect, Ellipse } from 'react-konva';
import type { EquipmentShapeProps } from './types';

export const MannequinShape: React.FC<EquipmentShapeProps> = ({ color, scale, variant }) => {
  const bodyHeight = variant === 'flat' ? 15 : 45 * scale;
  const bodyWidth = 12 * scale;
  
  if (variant === 'flat') {
    // Lying mannequin - horizontal ellipse
    return <Ellipse radiusX={25 * scale} radiusY={8 * scale} fill={color} listening={false} />;
  }
  
  return (
    <Group listening={false}>
      {/* Head */}
      <Circle radius={8 * scale} y={-bodyHeight/2 - 8 * scale} fill={color} listening={false} />
      {/* Body */}
      <Rect x={-bodyWidth/2} y={-bodyHeight/2} width={bodyWidth} height={bodyHeight} fill={color} cornerRadius={3} listening={false} />
      {/* Base */}
      <Rect x={-10 * scale} y={bodyHeight/2 - 5} width={20 * scale} height={8 * scale} fill={color} cornerRadius={2} listening={false} />
    </Group>
  );
};
