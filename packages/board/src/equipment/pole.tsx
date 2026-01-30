/**
 * PoleShape - vertical stick/slalom pole
 */
import React from 'react';
import { Group, Rect, Circle } from 'react-konva';
import type { EquipmentShapeProps } from './types';

export const PoleShape: React.FC<EquipmentShapeProps> = ({ color, scale }) => (
  <Group listening={false}>
    <Rect x={-3 * scale} y={-25 * scale} width={6 * scale} height={50 * scale} fill={color} cornerRadius={3} listening={false} />
    <Circle radius={5 * scale} y={-25 * scale} fill={color} listening={false} />
  </Group>
);
