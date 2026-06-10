/**
 * Ball node component for the tactical board
 * Professional vector ball with pentagon pattern
 * Performance optimized with React.memo
 */

import React, { useRef, useState, memo } from 'react';
import { Group, Circle, RegularPolygon, Ellipse } from 'react-konva';
import type Konva from 'konva';
import { cursorGrab, cursorDefault, applyGrabbing, applyGrab } from './cursorUtils';
import type { BallElement, Position, PitchConfig } from '@tmc/core';
import { snapToGrid, clampToBounds } from '@tmc/core';

export interface BallNodeProps {
  ball: BallElement;
  pitchConfig: PitchConfig;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
  /** Called on mousedown - return true to prevent Konva's default drag (for multi-drag) */
  onDragStart?: (id: string, mouseX: number, mouseY: number) => boolean;
}

const BALL_RADIUS = 11;

/** Professional vector ball component */
const BallNodeComponent: React.FC<BallNodeProps> = ({
  ball,
  pitchConfig,
  isSelected,
  onSelect,
  onDragEnd,
  onDragStart,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [multiDragActive, setMultiDragActive] = useState(false);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const addToSelection = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
    onSelect(ball.id, addToSelection);
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (onDragStart) {
      const stage = e.target.getStage();
      const rect = stage?.container().getBoundingClientRect();
      if (rect) {
        const shouldMultiDrag = onDragStart(
          ball.id,
          e.evt.clientX - rect.left,
          e.evt.clientY - rect.top
        );
        if (shouldMultiDrag) {
          e.cancelBubble = true;
          setMultiDragActive(true);
          return;
        }
      }
    }
    setMultiDragActive(false);
  };

  const handleDragStartKonva = () => {
    if (multiDragActive) return;
    setIsDragging(true);
    if (groupRef.current) {
      groupRef.current.moveToTop();
    }
    applyGrabbing(groupRef);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false);
    applyGrab(groupRef);
    const node = e.target;
    const rawPosition: Position = { x: node.x(), y: node.y() };
    
    // Snap to grid and clamp to bounds
    const snapped = snapToGrid(rawPosition, pitchConfig.gridSize);
    const clamped = clampToBounds(snapped, pitchConfig);
    
    node.x(clamped.x);
    node.y(clamped.y);
    
    onDragEnd(ball.id, clamped);
  };

  // Resolve visual properties from ball element with fallbacks
  const fillColor = ball.color || '#ffffff';
  const strokeColor = ball.strokeColor || '#1a1a1a';
  const strokeWidth = ball.strokeWidth ?? 2;

  // Pentagon positions for ball pattern (5 around center)
  const pentagonPositions = [
    { x: 0, y: -5 },      // top
    { x: 4.8, y: -1.5 },  // top-right
    { x: 3, y: 4 },       // bottom-right
    { x: -3, y: 4 },      // bottom-left
    { x: -4.8, y: -1.5 }, // top-left
  ];

  return (
    <Group
      ref={groupRef}
      id={ball.id}
      x={ball.position.x}
      y={ball.position.y}
      draggable={!multiDragActive}
      onClick={handleClick}
      onMouseEnter={cursorGrab}
      onMouseLeave={cursorDefault}
      onTap={handleClick}
      onMouseDown={handleMouseDown}
      onDragStart={handleDragStartKonva}
      onDragEnd={handleDragEnd}
    >
      {/* Selection ring */}
      {isSelected && (
        <Circle
          x={0}
          y={0}
          radius={BALL_RADIUS + 5}
          stroke="#ffd60a"
          strokeWidth={2}
          dash={[4, 2]}
          fill="transparent"
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Ball shadow - disabled during drag */}
      {!isDragging && (
        <Ellipse
          x={1}
          y={2}
          radiusX={BALL_RADIUS - 1}
          radiusY={BALL_RADIUS - 2}
          fill="rgba(0,0,0,0.2)"
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Ball base */}
      <Circle
        x={0}
        y={0}
        radius={BALL_RADIUS}
        fill={fillColor}
        stroke={isSelected ? '#ffd60a' : strokeColor}
        strokeWidth={isSelected ? 2.5 : strokeWidth}
        perfectDrawEnabled={false}
      />
      
      {/* Center pentagon */}
      <RegularPolygon
        x={0}
        y={0}
        sides={5}
        radius={4}
        rotation={-18}
        fill={strokeColor}
        listening={false}
        perfectDrawEnabled={false}
      />
      
      {/* Outer pentagon patches */}
      {pentagonPositions.map((pos, i) => (
        <RegularPolygon
          key={i}
          x={pos.x}
          y={pos.y}
          sides={5}
          radius={2.5}
          rotation={(i * 72) - 18}
          fill="#4a4a4a"
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}
      
      {/* Highlight reflection - top left */}
      <Ellipse
        x={-3}
        y={-4}
        radiusX={2.5}
        radiusY={1.5}
        rotation={-30}
        fill="rgba(255,255,255,0.6)"
        listening={false}
        perfectDrawEnabled={false}
      />
    </Group>
  );
};

/** Memoized BallNode - only re-renders when props actually change */
export const BallNode = memo(BallNodeComponent, (prevProps, nextProps) => {
  return (
    prevProps.ball.id === nextProps.ball.id &&
    prevProps.ball.position.x === nextProps.ball.position.x &&
    prevProps.ball.position.y === nextProps.ball.position.y &&
    prevProps.ball.color === nextProps.ball.color &&
    prevProps.ball.strokeColor === nextProps.ball.strokeColor &&
    prevProps.ball.strokeWidth === nextProps.ball.strokeWidth &&
    prevProps.isSelected === nextProps.isSelected
  );
});

export default BallNode;
