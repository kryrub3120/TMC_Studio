/**
 * LadderShape - agility ladder (horizontal rungs)
 */
import React from 'react';
import { Group, Rect } from 'react-konva';
import type { EquipmentShapeProps } from './types';

export const LadderShape: React.FC<EquipmentShapeProps> = ({ color, scale }) => {
  const width = 40 * scale;
  const rungCount = 5;
  const rungSpacing = 15 * scale;
  
  return (
    <Group listening={false}>
      {/* Side rails */}
      <Rect x={-width/2} y={-rungSpacing * 2} width={3} height={rungSpacing * (rungCount - 1)} fill={color} listening={false} />
      <Rect x={width/2 - 3} y={-rungSpacing * 2} width={3} height={rungSpacing * (rungCount - 1)} fill={color} listening={false} />
      {/* Rungs */}
      {Array.from({ length: rungCount }).map((_, i) => (
        <Rect
          key={i}
          x={-width/2}
          y={-rungSpacing * 2 + i * rungSpacing}
          width={width}
          height={3}
          fill={color}
          listening={false}
        />
      ))}
    </Group>
  );
};
