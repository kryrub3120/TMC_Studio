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

/** Goal equipment - football goal frame */
const GoalShape: React.FC<{ color: string; scale: number; variant: string }> = ({ color, scale, variant }) => {
  const width = variant === 'mini' ? 40 : 80;
  const height = variant === 'mini' ? 25 : 50;
  const depth = 15 * scale;
  
  return (
    <Group>
      {/* Goal posts */}
      <Rect x={-width/2} y={-height/2} width={4} height={height} fill={color} />
      <Rect x={width/2 - 4} y={-height/2} width={4} height={height} fill={color} />
      {/* Crossbar */}
      <Rect x={-width/2} y={-height/2} width={width} height={4} fill={color} />
      {/* Net lines (simplified) */}
      <Line points={[-width/2, -height/2, -width/2 - depth, -height/2 + depth]} stroke={color} strokeWidth={1} opacity={0.5} />
      <Line points={[width/2, -height/2, width/2 + depth, -height/2 + depth]} stroke={color} strokeWidth={1} opacity={0.5} />
      <Line points={[-width/2, height/2, -width/2 - depth, height/2 - depth]} stroke={color} strokeWidth={1} opacity={0.5} />
      <Line points={[width/2, height/2, width/2 + depth, height/2 - depth]} stroke={color} strokeWidth={1} opacity={0.5} />
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
  
  const handleClick = (e: any) => {
    const addToSelection = e.evt?.shiftKey ?? false;
    onSelect(id, addToSelection);
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
      x={position.x}
      y={position.y}
      rotation={rotation}
      draggable
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
    >
      {/* Selection highlight */}
      {isSelected && (
        <Circle
          radius={35 * scale}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[4, 4]}
          fill="transparent"
        />
      )}
      
      {/* Equipment shape */}
      {renderShape()}
    </Group>
  );
};

export default EquipmentNode;
