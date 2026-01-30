/**
 * EquipmentNode - Renders training equipment (goals, cones, mannequins, etc.)
 */

import React from 'react';
import { Group, Rect, Circle, Line, RegularPolygon, Ellipse } from 'react-konva';
import type { EquipmentElement } from '@tmc/core';

export interface EquipmentNodeProps {
  element: EquipmentElement;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

/** Goal equipment - V4 top-forward perspective (premium wireframe) */
const GoalShape: React.FC<{ color: string; scale: number; variant: string }> = ({ color, scale, variant }) => {
  // Base dimensions in px (then scaled)
  const baseW = variant === 'mini' ? 54 : 110;
  const baseH = variant === 'mini' ? 30 : 44;
  const baseD = variant === 'mini' ? 16 : 26;

  const width = baseW * scale;
  const height = baseH * scale;
  const depth = baseD * scale;

  // Perspective offsets
  const dx = Math.round(depth * 0.3);
  const dy = -Math.round(depth * 0.6);

  // Mesh density (perf adaptive)
  const meshCols = scale < 0.9 ? 8 : 12;
  const meshRows = scale < 0.9 ? 4 : 5;

  const xL = -width / 2;
  const xR = width / 2;
  const yB = height / 2;
  const yT = -height / 2;

  // Back frame (slightly narrower)
  const bxL = xL + dx;
  const bxR = xR + dx;
  const byB = yB + dy;
  const byT = yT + dy;

  const backWidthScale = variant === 'mini' ? 0.85 : 0.95;
  const backCenter = (bxL + bxR) / 2;
  const bxL2 = backCenter - (width * backWidthScale) / 2;
  const bxR2 = backCenter + (width * backWidthScale) / 2;

  const frontStroke = variant === 'mini' ? 3 : 4;
  const backStroke = Math.max(1, 1.5 * scale);
  const meshStroke = Math.max(0.5, 0.6 * scale);

  // Front frame MUST be U-shape (no bottom bar)
  const frontU = [
    xL, yB,
    xL, yT,
    xR, yT,
    xR, yB,
  ];

  return (
    <Group listening={false}>
      {/* 1) Ground/back base (subtle) */}
      <Line
        points={[xL, yB, bxL2, byB, bxR2, byB, xR, yB]}
        stroke={color}
        strokeWidth={backStroke}
        opacity={0.25}
        lineJoin="round"
        lineCap="round"
      />

      {/* 2) Rear mesh panel (subtle grid) */}
      <Group opacity={0.18}>
        {/* vertical lines */}
        {Array.from({ length: meshCols + 1 }).map((_, i) => {
          const t = i / meshCols;
          const x = bxL2 + (bxR2 - bxL2) * t;
          return (
            <Line
              key={`rv-${i}`}
              points={[x, byT, x, byB]}
              stroke={color}
              strokeWidth={meshStroke}
            />
          );
        })}
        {/* horizontal lines */}
        {Array.from({ length: meshRows + 1 }).map((_, i) => {
          const t = i / meshRows;
          const y = byT + (byB - byT) * t;
          return (
            <Line
              key={`rh-${i}`}
              points={[bxL2, y, bxR2, y]}
              stroke={color}
              strokeWidth={meshStroke}
            />
          );
        })}
      </Group>

      {/* 3) Side net "panels" (very subtle fill) */}
      <Group opacity={0.12}>
        <Line
          points={[xL, yT, bxL2, byT, bxL2, byB, xL, yB]}
          closed
          stroke={color}
          strokeWidth={meshStroke}
          fill={color}
          opacity={0.06}
        />
        <Line
          points={[xR, yT, bxR2, byT, bxR2, byB, xR, yB]}
          closed
          stroke={color}
          strokeWidth={meshStroke}
          fill={color}
          opacity={0.06}
        />
      </Group>

      {/* 4) Support connectors (top only) */}
      <Line points={[xL, yT, bxL2, byT]} stroke={color} strokeWidth={backStroke} opacity={0.55} />
      <Line points={[xR, yT, bxR2, byT]} stroke={color} strokeWidth={backStroke} opacity={0.55} />

      {/* 5) Back top bar */}
      <Line points={[bxL2, byT, bxR2, byT]} stroke={color} strokeWidth={backStroke} opacity={0.65} />

      {/* 6) Front U-frame (dominant) */}
      <Line
        points={frontU}
        stroke={color}
        strokeWidth={frontStroke}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
};

/** Mannequin - training dummy (simple body shape) */
const MannequinShape: React.FC<{ color: string; scale: number; variant: string }> = ({ color, scale, variant }) => {
  const bodyHeight = variant === 'flat' ? 15 : 45 * scale;
  const bodyWidth = 12 * scale;
  
  if (variant === 'flat') {
    // Lying mannequin - horizontal ellipse
    return <Ellipse radiusX={25 * scale} radiusY={8 * scale} fill={color} />;
  }
  
  return (
    <Group>
      {/* Head */}
      <Circle radius={8 * scale} y={-bodyHeight/2 - 8 * scale} fill={color} />
      {/* Body */}
      <Rect x={-bodyWidth/2} y={-bodyHeight/2} width={bodyWidth} height={bodyHeight} fill={color} cornerRadius={3} />
      {/* Base */}
      <Rect x={-10 * scale} y={bodyHeight/2 - 5} width={20 * scale} height={8 * scale} fill={color} cornerRadius={2} />
    </Group>
  );
};

/** Cone - training cone (triangle) */
const ConeShape: React.FC<{ color: string; scale: number; variant: string }> = ({ color, scale, variant }) => {
  const size = variant === 'tall' ? 28 : 20;
  
  return (
    <RegularPolygon
      sides={3}
      radius={size * scale}
      fill={color}
      stroke="#ffffff"
      strokeWidth={1}
    />
  );
};

/** Pole - vertical stick/slalom pole */
const PoleShape: React.FC<{ color: string; scale: number }> = ({ color, scale }) => (
  <Group>
    <Rect x={-3 * scale} y={-25 * scale} width={6 * scale} height={50 * scale} fill={color} cornerRadius={3} />
    <Circle radius={5 * scale} y={-25 * scale} fill={color} />
  </Group>
);

/** Ladder - agility ladder (horizontal rungs) */
const LadderShape: React.FC<{ color: string; scale: number }> = ({ color, scale }) => {
  const width = 40 * scale;
  const rungCount = 5;
  const rungSpacing = 15 * scale;
  
  return (
    <Group>
      {/* Side rails */}
      <Rect x={-width/2} y={-rungSpacing * 2} width={3} height={rungSpacing * (rungCount - 1)} fill={color} />
      <Rect x={width/2 - 3} y={-rungSpacing * 2} width={3} height={rungSpacing * (rungCount - 1)} fill={color} />
      {/* Rungs */}
      {Array.from({ length: rungCount }).map((_, i) => (
        <Rect
          key={i}
          x={-width/2}
          y={-rungSpacing * 2 + i * rungSpacing}
          width={width}
          height={3}
          fill={color}
        />
      ))}
    </Group>
  );
};

/** Hoop - agility ring */
const HoopShape: React.FC<{ color: string; scale: number }> = ({ color, scale }) => (
  <Circle
    radius={20 * scale}
    stroke={color}
    strokeWidth={4 * scale}
    fill="transparent"
  />
);

/** Hurdle - speed hurdle */
const HurdleShape: React.FC<{ color: string; scale: number }> = ({ color, scale }) => (
  <Group>
    {/* Top bar */}
    <Rect x={-25 * scale} y={-15 * scale} width={50 * scale} height={5 * scale} fill={color} cornerRadius={2} />
    {/* Legs */}
    <Rect x={-23 * scale} y={-15 * scale} width={4 * scale} height={20 * scale} fill={color} />
    <Rect x={19 * scale} y={-15 * scale} width={4 * scale} height={20 * scale} fill={color} />
  </Group>
);

/** EquipmentNode Component */
export const EquipmentNode: React.FC<EquipmentNodeProps> = ({
  element,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  const { id, position, equipmentType, variant, rotation, color, scale } = element;
  
  // Calculate hit area bounds (varies by equipment type)
  const getHitAreaBounds = () => {
    switch (equipmentType) {
      case 'goal': {
        const baseW = variant === 'mini' ? 54 : 110;
        const baseH = variant === 'mini' ? 30 : 44;
        const baseD = variant === 'mini' ? 16 : 26;
        
        const width = baseW * scale;
        const height = baseH * scale;
        const depth = baseD * scale;
        
        const dx = depth * 0.3;
        const dy = -depth * 0.6;
        
        // Hit area encompasses entire 3D bounding box + margin
        const margin = 8;
        const minX = -width/2 - margin;
        const maxX = width/2 + dx + margin;
        const minY = -height/2 + dy - margin;
        const maxY = height/2 + margin;
        
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }
      default:
        return { x: -40 * scale, y: -40 * scale, width: 80 * scale, height: 80 * scale };
    }
  };
  
  const hitBounds = getHitAreaBounds();
  
  const handleClick = (e: any) => {
    const addToSelection = e.evt?.shiftKey ?? false;
    onSelect(id, addToSelection);
  };
  
  const handleContextMenu = (e: any) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
  };
  
  const handleMouseDown = (e: any) => {
    // Block marquee selection on right-click
    if (e.evt.button === 2) {
      e.cancelBubble = true;
    }
  };
  
  const handleMouseEnter = (e: any) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'move';
  };
  
  const handleMouseLeave = (e: any) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'default';
  };
  
  const handleDragEnd = (e: any) => {
    onDragEnd(id, e.target.x(), e.target.y());
  };
  
  /** Render appropriate shape based on equipment type */
  const renderShape = () => {
    switch (equipmentType) {
      case 'goal':
        return <GoalShape color={color} scale={scale} variant={variant} />;
      case 'mannequin':
        return <MannequinShape color={color} scale={scale} variant={variant} />;
      case 'cone':
        return <ConeShape color={color} scale={scale} variant={variant} />;
      case 'pole':
        return <PoleShape color={color} scale={scale} />;
      case 'ladder':
        return <LadderShape color={color} scale={scale} />;
      case 'hoop':
        return <HoopShape color={color} scale={scale} />;
      case 'hurdle':
        return <HurdleShape color={color} scale={scale} />;
      default:
        return <Circle radius={15} fill={color} />;
    }
  };
  
  return (
    <Group
      id={id}
      x={position.x}
      y={position.y}
      rotation={rotation}
      draggable
      onDragEnd={handleDragEnd}
    >
      {/* Invisible hit area - MUST BE FIRST for proper event capture */}
      <Rect
        x={hitBounds.x}
        y={hitBounds.y}
        width={hitBounds.width}
        height={hitBounds.height}
        fill="transparent"
        listening={true}
        onClick={handleClick}
        onTap={handleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onPointerDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Selection highlight (dashed outline glow) */}
      {isSelected && (
        <Rect
          x={hitBounds.x}
          y={hitBounds.y}
          width={hitBounds.width}
          height={hitBounds.height}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[5, 5]}
          opacity={0.6}
          fill="transparent"
          listening={false}
        />
      )}
      
      {/* Equipment shape */}
      <Group listening={false}>
        {renderShape()}
      </Group>
    </Group>
  );
};

export default EquipmentNode;
