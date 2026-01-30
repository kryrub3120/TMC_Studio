/**
 * HurdleShape - speed hurdle
 */
import React from 'react';
import { Group, Rect } from 'react-konva';
import type { EquipmentShapeProps } from './types';

export const HurdleShape: React.FC<EquipmentShapeProps> = ({ color, scale }) => (
  <Group listening={false}>
    {/* Top bar */}
    <Rect x={-25 * scale} y={-15 * scale} width={50 * scale} height={5 * scale} fill={color} cornerRadius={2} listening={false} />
    {/* Legs */}
    <Rect x={-23 * scale} y={-15 * scale} width={4 * scale} height={20 * scale} fill={color} listening={false} />
    <Rect x={19 * scale} y={-15 * scale} width={4 * scale} height={20 * scale} fill={color} listening={false} />
  </Group>
);
