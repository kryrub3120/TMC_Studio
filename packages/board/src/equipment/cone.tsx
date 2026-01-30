/**
 * ConeShape - training cone (triangle)
 */
import React from 'react';
import { RegularPolygon } from 'react-konva';
import type { EquipmentShapeProps } from './types';

export const ConeShape: React.FC<EquipmentShapeProps> = ({ color, scale, variant }) => {
  const size = variant === 'tall' ? 28 : 20;
  
  return (
    <RegularPolygon
      sides={3}
      radius={size * scale}
      fill={color}
      stroke="#ffffff"
      strokeWidth={1}
      listening={false}
    />
  );
};
