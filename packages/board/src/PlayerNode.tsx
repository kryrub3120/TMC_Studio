/**
 * Player node component for the tactical board
 * Performance optimized with React.memo
 */

import React, { useRef, useState, memo } from 'react';
import { Group, Circle, Rect, RegularPolygon, Text } from 'react-konva';
import type Konva from 'konva';
import type { PlayerElement, Position, PitchConfig } from '@tmc/core';
import { snapToGrid, clampToBounds } from '@tmc/core';

export interface PlayerNodeProps {
  player: PlayerElement;
  pitchConfig: PitchConfig;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
  /** Called on mousedown - return true to prevent Konva's default drag (for multi-drag) */
  onDragStart?: (id: string, mouseX: number, mouseY: number) => boolean;
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
const PlayerNodeComponent: React.FC<PlayerNodeProps> = ({
  player,
  pitchConfig,
  isSelected,
  onSelect,
  onDragEnd,
  onDragStart,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [multiDragActive, setMultiDragActive] = useState(false);
  const colors = TEAM_COLORS[player.team];

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const addToSelection = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
    onSelect(player.id, addToSelection);
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Check if multi-drag should handle this
    if (onDragStart) {
      const stage = e.target.getStage();
      const rect = stage?.container().getBoundingClientRect();
      if (rect) {
        const shouldMultiDrag = onDragStart(
          player.id,
          e.evt.clientX - rect.left,
          e.evt.clientY - rect.top
        );
        if (shouldMultiDrag) {
          // Prevent default Konva drag
          e.cancelBubble = true;
          setMultiDragActive(true);
          return;
        }
      }
    }
    setMultiDragActive(false);
  };

  const handleDragStart = () => {
    if (multiDragActive) return; // Skip if multi-drag is handling this
    setIsDragging(true);
    // Visual feedback during drag
    if (groupRef.current) {
      groupRef.current.moveToTop();
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false);
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
      draggable={!multiDragActive}
      onClick={handleClick}
      onTap={handleClick}
      onMouseDown={handleMouseDown}
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
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Player shape - circle (default) */}
      {(!player.shape || player.shape === 'circle') && (
        <Circle
          x={0}
          y={0}
          radius={PLAYER_RADIUS}
          fill={colors.fill}
          stroke={isSelected ? '#ffd60a' : colors.stroke}
          strokeWidth={isSelected ? SELECTED_STROKE_WIDTH : NORMAL_STROKE_WIDTH}
          shadowColor={isDragging ? undefined : 'rgba(0,0,0,0.25)'}
          shadowBlur={isDragging ? 0 : 3}
          shadowOffset={isDragging ? undefined : { x: 1, y: 1 }}
          shadowEnabled={!isDragging}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Player shape - square */}
      {player.shape === 'square' && (
        <Rect
          x={-PLAYER_RADIUS}
          y={-PLAYER_RADIUS}
          width={PLAYER_RADIUS * 2}
          height={PLAYER_RADIUS * 2}
          cornerRadius={4}
          fill={colors.fill}
          stroke={isSelected ? '#ffd60a' : colors.stroke}
          strokeWidth={isSelected ? SELECTED_STROKE_WIDTH : NORMAL_STROKE_WIDTH}
          shadowColor={isDragging ? undefined : 'rgba(0,0,0,0.25)'}
          shadowBlur={isDragging ? 0 : 3}
          shadowOffset={isDragging ? undefined : { x: 1, y: 1 }}
          shadowEnabled={!isDragging}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Player shape - triangle (pointing up) */}
      {player.shape === 'triangle' && (
        <RegularPolygon
          x={0}
          y={0}
          sides={3}
          radius={PLAYER_RADIUS + 2}
          fill={colors.fill}
          stroke={isSelected ? '#ffd60a' : colors.stroke}
          strokeWidth={isSelected ? SELECTED_STROKE_WIDTH : NORMAL_STROKE_WIDTH}
          shadowColor={isDragging ? undefined : 'rgba(0,0,0,0.25)'}
          shadowBlur={isDragging ? 0 : 3}
          shadowOffset={isDragging ? undefined : { x: 1, y: 1 }}
          shadowEnabled={!isDragging}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Player shape - diamond (rotated square) */}
      {player.shape === 'diamond' && (
        <Rect
          x={-PLAYER_RADIUS}
          y={-PLAYER_RADIUS}
          width={PLAYER_RADIUS * 2}
          height={PLAYER_RADIUS * 2}
          rotation={45}
          offsetX={-PLAYER_RADIUS}
          offsetY={-PLAYER_RADIUS}
          fill={colors.fill}
          stroke={isSelected ? '#ffd60a' : colors.stroke}
          strokeWidth={isSelected ? SELECTED_STROKE_WIDTH : NORMAL_STROKE_WIDTH}
          shadowColor={isDragging ? undefined : 'rgba(0,0,0,0.25)'}
          shadowBlur={isDragging ? 0 : 3}
          shadowOffset={isDragging ? undefined : { x: 1, y: 1 }}
          shadowEnabled={!isDragging}
          perfectDrawEnabled={false}
        />
      )}
      
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
        perfectDrawEnabled={false}
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
          perfectDrawEnabled={false}
        />
      )}
    </Group>
  );
};

/** Memoized PlayerNode - only re-renders when props actually change */
export const PlayerNode = memo(PlayerNodeComponent, (prevProps, nextProps) => {
  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.player.position.x === nextProps.player.position.x &&
    prevProps.player.position.y === nextProps.player.position.y &&
    prevProps.player.number === nextProps.player.number &&
    prevProps.player.team === nextProps.player.team &&
    prevProps.player.label === nextProps.player.label &&
    prevProps.player.shape === nextProps.player.shape &&
    prevProps.isSelected === nextProps.isSelected
  );
});

export default PlayerNode;
