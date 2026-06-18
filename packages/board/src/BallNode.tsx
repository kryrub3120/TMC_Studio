/**
 * Ball node component for the tactical board
 * Professional vector ball with classic pentagon/seam pattern.
 * Supports two variants:
 *  - 'single'  : one ball
 *  - 'cluster' : a pile of balls that moves as one element
 * Performance optimized with React.memo
 */

import React, { useRef, useState, memo } from 'react';
import { Group, Circle, Line, Ellipse } from 'react-konva';
import type Konva from 'konva';
import { cursorGrab, cursorDefault, applyGrabbing, applyGrab } from './cursorUtils';
import type { BallElement, Position, PitchConfig } from '@tmc/core';
import { snapToGrid, clampToBounds } from '@tmc/core';

export interface BallNodeProps {
  ball: BallElement;
  pitchConfig: PitchConfig;
  isSelected: boolean;
  isLocked?: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
  /** Called on mousedown - return true to prevent Konva's default drag (for multi-drag) */
  onDragStart?: (id: string, mouseX: number, mouseY: number) => boolean;
}

const BALL_RADIUS = 11;

/**
 * Classic football pattern: a central black pentagon with seams radiating to
 * five surrounding black pentagons. We approximate the look with a central
 * pentagon, five small outer pentagons and connecting seam lines — crisper and
 * more "real ball" than scattered patches.
 */
const TAU = Math.PI * 2;

/** Build a regular polygon point list centered at (cx,cy). */
function polygonPoints(cx: number, cy: number, radius: number, sides: number, rotationDeg: number): number[] {
  const pts: number[] = [];
  const rot = (rotationDeg * Math.PI) / 180;
  for (let i = 0; i < sides; i += 1) {
    const a = rot + (i / sides) * TAU - Math.PI / 2;
    pts.push(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
  }
  return pts;
}

/** Single ball graphics (centered at 0,0), reused by cluster. */
const BallGraphic: React.FC<{
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  withShadow: boolean;
}> = ({ fillColor, strokeColor, strokeWidth, withShadow }) => {
  // Five outer pentagon centers around the ball
  const outer = [0, 1, 2, 3, 4].map((i) => {
    const a = (i / 5) * TAU - Math.PI / 2;
    const r = 6.6;
    return { x: r * Math.cos(a), y: r * Math.sin(a), rot: (i * 72) };
  });

  // Central pentagon vertices (for seam lines)
  const centralVerts = [0, 1, 2, 3, 4].map((i) => {
    const a = (i / 5) * TAU - Math.PI / 2;
    const r = 3.4;
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  });

  return (
    <>
      {/* Drop shadow */}
      {withShadow && (
        <Ellipse
          x={1}
          y={2.5}
          radiusX={BALL_RADIUS - 0.5}
          radiusY={BALL_RADIUS - 1.5}
          fill="rgba(0,0,0,0.18)"
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
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        perfectDrawEnabled={false}
      />

      {/* Seam lines: from central pentagon vertices outwards */}
      {centralVerts.map((p, i) => (
        <Line
          key={`seam-${i}`}
          points={[p.x, p.y, p.x * 2.6, p.y * 2.6]}
          stroke={strokeColor}
          strokeWidth={0.9}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}

      {/* Central black pentagon */}
      <Line
        points={polygonPoints(0, 0, 3.6, 5, 0)}
        closed
        fill={strokeColor}
        listening={false}
        perfectDrawEnabled={false}
      />

      {/* Outer pentagon patches */}
      {outer.map((o, i) => (
        <Line
          key={`outer-${i}`}
          points={polygonPoints(o.x, o.y, 2.4, 5, o.rot + 36)}
          closed
          fill={strokeColor}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}

      {/* Soft top-left highlight for a subtle 3D feel */}
      <Ellipse
        x={-3.4}
        y={-4}
        radiusX={2.6}
        radiusY={1.6}
        rotation={-30}
        fill="rgba(255,255,255,0.55)"
        listening={false}
        perfectDrawEnabled={false}
      />
    </>
  );
};

/** Professional vector ball component */
const BallNodeComponent: React.FC<BallNodeProps> = ({
  ball,
  pitchConfig,
  isSelected,
  isLocked = false,
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
    if (isLocked) {
      setMultiDragActive(false);
      return;
    }
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
  const isCluster = ball.variant === 'cluster';

  // Cluster layout: 5 balls in a tidy pile (offsets in px)
  const clusterOffsets = [
    { x: -10, y: 4, s: 0.92 },
    { x: 10, y: 5, s: 0.92 },
    { x: -4, y: -8, s: 0.96 },
    { x: 7, y: -6, s: 0.96 },
    { x: 0, y: 0, s: 1.04 },
  ];

  const selectionRadius = isCluster ? BALL_RADIUS + 16 : BALL_RADIUS + 5;

  return (
    <Group
      ref={groupRef}
      id={ball.id}
      x={ball.position.x}
      y={ball.position.y}
      draggable={!multiDragActive && !isLocked}
      onClick={handleClick}
      onMouseEnter={isLocked ? cursorDefault : cursorGrab}
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
          radius={selectionRadius}
          stroke="#ffd60a"
          strokeWidth={2}
          dash={[4, 2]}
          fill="transparent"
          perfectDrawEnabled={false}
        />
      )}

      {/* Invisible hit area so the whole cluster is grabbable */}
      {isCluster && (
        <Circle x={0} y={0} radius={selectionRadius} fill="rgba(0,0,0,0.001)" />
      )}

      {isCluster ? (
        clusterOffsets.map((o, i) => (
          <Group key={i} x={o.x} y={o.y} scaleX={o.s} scaleY={o.s}>
            <BallGraphic
              fillColor={fillColor}
              strokeColor={strokeColor}
              strokeWidth={strokeWidth}
              withShadow={!isDragging}
            />
          </Group>
        ))
      ) : (
        <BallGraphic
          fillColor={fillColor}
          strokeColor={isSelected ? '#ffd60a' : strokeColor}
          strokeWidth={isSelected ? 2.5 : strokeWidth}
          withShadow={!isDragging}
        />
      )}
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
    prevProps.ball.variant === nextProps.ball.variant &&
    prevProps.isSelected === nextProps.isSelected
  );
});

export default BallNode;
