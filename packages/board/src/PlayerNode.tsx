/**
 * Player node component for the tactical board
 * Performance optimized with React.memo
 */

import React, { useRef, useState, memo } from 'react';
import { Group, Circle, Rect, RegularPolygon, Text } from 'react-konva';
import type Konva from 'konva';
import type { PlayerElement, Position, PitchConfig, TeamSettings } from '@tmc/core';
import { snapToGrid, clampToBounds, DEFAULT_TEAM_SETTINGS } from '@tmc/core';

/** Team color configuration */
export interface TeamColors {
  fill: string;
  stroke: string;
  text: string;
}

export interface PlayerNodeProps {
  player: PlayerElement;
  pitchConfig: PitchConfig;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
  /** Called on mousedown - return true to prevent Konva's default drag (for multi-drag) */
  onDragStart?: (id: string, mouseX: number, mouseY: number) => boolean;
  /** Optional team settings for custom colors */
  teamSettings?: TeamSettings;
  /** Called when user double-clicks to quick-edit number */
  onQuickEditNumber?: (id: string, currentNumber: number) => void;
}

/** Default goalkeeper color (yellow) */
const DEFAULT_GK_COLOR = '#fbbf24';

/** Convert team settings to render colors */
function getTeamColors(team: 'home' | 'away', teamSettings?: TeamSettings, isGoalkeeper?: boolean): TeamColors {
  const settings = teamSettings ?? DEFAULT_TEAM_SETTINGS;
  const teamSetting = settings[team];
  
  // Use goalkeeper color if player is GK, otherwise use primary
  const primaryHex = isGoalkeeper
    ? (teamSetting.goalkeeperColor ?? DEFAULT_GK_COLOR)
    : teamSetting.primaryColor;
  
  // Darken color for stroke
  const darkenedStroke = darkenColor(primaryHex, 20);
  
  return {
    fill: primaryHex,
    stroke: darkenedStroke,
    text: teamSetting.secondaryColor,
  };
}

/** Darken hex color by percentage */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

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
  teamSettings,
  onQuickEditNumber,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [multiDragActive, setMultiDragActive] = useState(false);
  const colors = getTeamColors(player.team, teamSettings, player.isGoalkeeper);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const addToSelection = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
    onSelect(player.id, addToSelection);
  };

  const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    if (onQuickEditNumber) {
      onQuickEditNumber(player.id, player.number ?? 0);
    }
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
      id={player.id}
      x={player.position.x}
      y={player.position.y}
      opacity={player.opacity ?? 1}
      draggable={!multiDragActive}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
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
      
      {/* Player number or label (inside shape) */}
      {(player.showLabel && player.label) || player.number != null ? (
        <Text
          x={-PLAYER_RADIUS}
          y={-(player.fontSize ?? 14) / 2}
          width={PLAYER_RADIUS * 2}
          text={player.showLabel && player.label ? player.label : String(player.number)}
          fontSize={player.fontSize ?? 14}
          fontFamily="Inter, system-ui, sans-serif"
          fontStyle="bold"
          fill={player.textColor ?? colors.text}
          align="center"
          verticalAlign="middle"
          listening={false}
          perfectDrawEnabled={false}
        />
      ) : null}
      
      {/* Additional label below shape (only if not showing label inside) */}
      {player.label && !player.showLabel && (
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
  // Check teamSettings colors (including goalkeeper color)
  const prevColors = prevProps.teamSettings?.[prevProps.player.team];
  const nextColors = nextProps.teamSettings?.[nextProps.player.team];
  const colorsEqual = prevColors?.primaryColor === nextColors?.primaryColor &&
                      prevColors?.secondaryColor === nextColors?.secondaryColor &&
                      prevColors?.goalkeeperColor === nextColors?.goalkeeperColor;
  
  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.player.position.x === nextProps.player.position.x &&
    prevProps.player.position.y === nextProps.player.position.y &&
    prevProps.player.number === nextProps.player.number &&
    prevProps.player.team === nextProps.player.team &&
    prevProps.player.label === nextProps.player.label &&
    prevProps.player.shape === nextProps.player.shape &&
    prevProps.player.showLabel === nextProps.player.showLabel &&
    prevProps.player.fontSize === nextProps.player.fontSize &&
    prevProps.player.textColor === nextProps.player.textColor &&
    prevProps.player.opacity === nextProps.player.opacity &&
    prevProps.player.isGoalkeeper === nextProps.player.isGoalkeeper &&
    prevProps.isSelected === nextProps.isSelected &&
    colorsEqual
  );
});

export default PlayerNode;
