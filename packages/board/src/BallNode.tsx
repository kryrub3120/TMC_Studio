/**
 * Ball node component for the tactical board
 */

import React, { useRef } from 'react';
import { Group, Circle } from 'react-konva';
import type Konva from 'konva';
import type { BallElement, Position, PitchConfig } from '@tmc/core';
import { snapToGrid, clampToBounds } from '@tmc/core';

export interface BallNodeProps {
  ball: BallElement;
  pitchConfig: PitchConfig;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
}

const BALL_RADIUS = 10;
const BALL_COLORS = {
  fill: '#ffffff',
  stroke: '#1a1a1a',
  pattern: '#1a1a1a',
};

/** Draggable ball element */
export const BallNode: React.FC<BallNodeProps> = ({
  ball,
  pitchConfig,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  const groupRef = useRef<Konva.Group>(null);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const addToSelection = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
    onSelect(ball.id, addToSelection);
  };

  const handleDragStart = () => {
    if (groupRef.current) {
      groupRef.current.moveToTop();
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const rawPosition: Position = { x: node.x(), y: node.y() };
    
    // Snap to grid and clamp to bounds
    const snapped = snapToGrid(rawPosition, pitchConfig.gridSize);
    const clamped = clampToBounds(snapped, pitchConfig);
    
    node.x(clamped.x);
    node.y(clamped.y);
    
    onDragEnd(ball.id, clamped);
  };

  return (
    <Group
      ref={groupRef}
      x={ball.position.x}
      y={ball.position.y}
      draggable
      onClick={handleClick}
      onTap={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Selection ring */}
      {isSelected && (
        <Circle
          x={0}
          y={0}
          radius={BALL_RADIUS + 4}
          stroke="#ffd60a"
          strokeWidth={2}
          dash={[4, 2]}
          fill="transparent"
        />
      )}
      
      {/* Ball base */}
      <Circle
        x={0}
        y={0}
        radius={BALL_RADIUS}
        fill={BALL_COLORS.fill}
        stroke={isSelected ? '#ffd60a' : BALL_COLORS.stroke}
        strokeWidth={isSelected ? 3 : 2}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={4}
        shadowOffset={{ x: 2, y: 2 }}
      />
      
      {/* Simple ball pattern - pentagon shapes */}
      <Circle
        x={0}
        y={0}
        radius={4}
        fill={BALL_COLORS.pattern}
        listening={false}
      />
    </Group>
  );
};

export default BallNode;
