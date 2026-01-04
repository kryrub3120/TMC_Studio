/**
 * Player node component for the tactical board
 */

import React, { useRef } from 'react';
import { Group, Circle, Text } from 'react-konva';
import type Konva from 'konva';
import type { PlayerElement, Position, PitchConfig } from '@tmc/core';
import { snapToGrid, clampToBounds } from '@tmc/core';

export interface PlayerNodeProps {
  player: PlayerElement;
  pitchConfig: PitchConfig;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
}

/** Team colors */
const TEAM_COLORS = {
  home: {
    fill: '#e63946',
    stroke: '#c1121f',
    text: '#ffffff',
  },
  away: {
    fill: '#457b9d',
    stroke: '#1d3557',
    text: '#ffffff',
  },
};

const PLAYER_RADIUS = 18;
const SELECTED_STROKE_WIDTH = 3;
const NORMAL_STROKE_WIDTH = 2;

/** Draggable player circle with number */
export const PlayerNode: React.FC<PlayerNodeProps> = ({
  player,
  pitchConfig,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const colors = TEAM_COLORS[player.team];

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const addToSelection = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
    onSelect(player.id, addToSelection);
  };

  const handleDragStart = () => {
    // Visual feedback during drag
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
    
    // Update node position to snapped location
    node.x(clamped.x);
    node.y(clamped.y);
    
    onDragEnd(player.id, clamped);
  };

  return (
    <Group
      ref={groupRef}
      x={player.position.x}
      y={player.position.y}
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
          radius={PLAYER_RADIUS + 4}
          stroke="#ffd60a"
          strokeWidth={2}
          dash={[4, 2]}
          fill="transparent"
        />
      )}
      
      {/* Player circle */}
      <Circle
        x={0}
        y={0}
        radius={PLAYER_RADIUS}
        fill={colors.fill}
        stroke={isSelected ? '#ffd60a' : colors.stroke}
        strokeWidth={isSelected ? SELECTED_STROKE_WIDTH : NORMAL_STROKE_WIDTH}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={4}
        shadowOffset={{ x: 2, y: 2 }}
      />
      
      {/* Player number */}
      <Text
        x={-PLAYER_RADIUS}
        y={-8}
        width={PLAYER_RADIUS * 2}
        text={String(player.number)}
        fontSize={14}
        fontFamily="Inter, system-ui, sans-serif"
        fontStyle="bold"
        fill={colors.text}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
      
      {/* Player label (if exists) */}
      {player.label && (
        <Text
          x={-30}
          y={PLAYER_RADIUS + 4}
          width={60}
          text={player.label}
          fontSize={10}
          fontFamily="Inter, system-ui, sans-serif"
          fill="#ffffff"
          align="center"
          listening={false}
        />
      )}
    </Group>
  );
};

export default PlayerNode;
