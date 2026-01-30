/**
 * HoopShape - agility ring
 */
import React from 'react';
import { Circle } from 'react-konva';
import type { EquipmentShapeProps } from './types';

export const HoopShape: React.FC<EquipmentShapeProps> = ({ color, scale }) => (
  <Circle
    radius={20 * scale}
    stroke={color}
    strokeWidth={4 * scale}
    fill="transparent"
    listening={false}
  />
);
