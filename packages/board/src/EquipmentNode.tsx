/**
 * EquipmentNode - Renders training equipment (goals, cones, mannequins, etc.)
 * Refactored: shapes extracted to equipment/ module
 */

import React from 'react';
import { Group, Rect } from 'react-konva';
import type { EquipmentElement } from '@tmc/core';
import { EQUIPMENT_RENDERERS, getEquipmentHitBounds } from './equipment';

export interface EquipmentNodeProps {
  element: EquipmentElement;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export const EquipmentNode: React.FC<EquipmentNodeProps> = ({
  element,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  const { id, position, equipmentType, variant, rotation, color, scale } = element;
  
  // Get hit area from centralized function
  const hitBounds = getEquipmentHitBounds(element);
  
  // Get shape renderer from map
  const ShapeComponent = EQUIPMENT_RENDERERS[equipmentType];
  
  const handleClick = (e: any) => {
    const addToSelection = e.evt?.shiftKey ?? false;
    onSelect(id, addToSelection);
  };
  
  const handleContextMenu = (e: any) => {
    // Prevent native browser context menu
    e.evt.preventDefault();
    // DO NOT set e.cancelBubble - let event reach Stage for global menu handler
  };
  
  const handleMouseDown = (e: any) => {
    // Block marquee selection on right-click only
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
  
  return (
    <Group
      id={id}
      x={position.x}
      y={position.y}
      rotation={rotation}
      draggable
      onDragEnd={handleDragEnd}
    >
      {/* Hit area (listening=true) - MUST BE FIRST for proper event capture */}
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
      
      {/* Selection highlight (listening=false) */}
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
      
      {/* Equipment shape (listening=false) */}
      <Group listening={false}>
        {ShapeComponent && <ShapeComponent color={color} scale={scale} variant={variant} />}
      </Group>
    </Group>
  );
};

export default EquipmentNode;
