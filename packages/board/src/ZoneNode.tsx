/**
 * ZoneNode - Konva Zone component with resize handles
 * Uses manual mouse tracking for resize (not Konva draggable)
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Group, Rect, Ellipse } from 'react-konva';
import type Konva from 'konva';
import type { ZoneElement, Position, PitchConfig } from '@tmc/core';

export interface ZoneNodeProps {
  zone: ZoneElement;
  pitchConfig: PitchConfig;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
  onResize?: (id: string, position: Position, width: number, height: number) => void;
}

/** Zone color presets */
export const ZONE_COLOR_PRESETS = [
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
];

/** Handle positions for 8-point resize */
type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/** ZoneNode component */
export const ZoneNode: React.FC<ZoneNodeProps> = ({
  zone,
  pitchConfig: _pitchConfig,
  isSelected,
  onSelect,
  onDragEnd,
  onResize,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  
  // Resize state
  const [activeHandle, setActiveHandle] = useState<HandlePosition | null>(null);
  const resizeDataRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startZoneX: number;
    startZoneY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  
  // Preview bounds during resize
  const [previewBounds, setPreviewBounds] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Display values
  const displayX = previewBounds?.x ?? zone.position.x;
  const displayY = previewBounds?.y ?? zone.position.y;
  const displayWidth = previewBounds?.width ?? zone.width;
  const displayHeight = previewBounds?.height ?? zone.height;

  const borderDash = zone.borderStyle === 'dashed' ? [6, 3] : undefined;
  const borderStroke = zone.borderStyle !== 'none' ? (zone.borderColor || zone.fillColor) : undefined;

  // Calculate new bounds from mouse position
  const calculateBounds = useCallback((handle: HandlePosition, mouseX: number, mouseY: number) => {
    const data = resizeDataRef.current;
    if (!data) return null;
    
    const dx = mouseX - data.startMouseX;
    const dy = mouseY - data.startMouseY;
    const minSize = 20;
    
    let x = data.startZoneX;
    let y = data.startZoneY;
    let w = data.startWidth;
    let h = data.startHeight;
    
    switch (handle) {
      case 'nw':
        w = Math.max(minSize, data.startWidth - dx);
        h = Math.max(minSize, data.startHeight - dy);
        x = data.startZoneX + data.startWidth - w;
        y = data.startZoneY + data.startHeight - h;
        break;
      case 'n':
        h = Math.max(minSize, data.startHeight - dy);
        y = data.startZoneY + data.startHeight - h;
        break;
      case 'ne':
        w = Math.max(minSize, data.startWidth + dx);
        h = Math.max(minSize, data.startHeight - dy);
        y = data.startZoneY + data.startHeight - h;
        break;
      case 'e':
        w = Math.max(minSize, data.startWidth + dx);
        break;
      case 'se':
        w = Math.max(minSize, data.startWidth + dx);
        h = Math.max(minSize, data.startHeight + dy);
        break;
      case 's':
        h = Math.max(minSize, data.startHeight + dy);
        break;
      case 'sw':
        w = Math.max(minSize, data.startWidth - dx);
        h = Math.max(minSize, data.startHeight + dy);
        x = data.startZoneX + data.startWidth - w;
        break;
      case 'w':
        w = Math.max(minSize, data.startWidth - dx);
        x = data.startZoneX + data.startWidth - w;
        break;
    }
    
    return { x, y, width: w, height: h };
  }, []);

  // Global mouse move/up handlers for resize
  useEffect(() => {
    if (!activeHandle) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const stage = groupRef.current?.getStage();
      if (!stage) return;
      
      // Get mouse position relative to stage
      const rect = stage.container().getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const bounds = calculateBounds(activeHandle, mouseX, mouseY);
      if (bounds) {
        setPreviewBounds(bounds);
      }
    };
    
    const handleMouseUp = () => {
      if (previewBounds && onResize) {
        onResize(zone.id, { x: previewBounds.x, y: previewBounds.y }, previewBounds.width, previewBounds.height);
      }
      setActiveHandle(null);
      setPreviewBounds(null);
      resizeDataRef.current = null;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeHandle, calculateBounds, previewBounds, zone.id, onResize]);

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      onSelect(zone.id, e.evt.shiftKey || e.evt.metaKey);
    },
    [zone.id, onSelect]
  );

  const handleGroupDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (activeHandle) return;
      const node = e.target;
      onDragEnd(zone.id, { x: node.x(), y: node.y() });
    },
    [zone.id, onDragEnd, activeHandle]
  );

  // Start resize on handle mouse down
  const handleResizeStart = useCallback(
    (handle: HandlePosition, e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      
      const stage = e.target.getStage();
      if (!stage) return;
      
      const rect = stage.container().getBoundingClientRect();
      const mouseX = e.evt.clientX - rect.left;
      const mouseY = e.evt.clientY - rect.top;
      
      resizeDataRef.current = {
        startMouseX: mouseX,
        startMouseY: mouseY,
        startZoneX: zone.position.x,
        startZoneY: zone.position.y,
        startWidth: zone.width,
        startHeight: zone.height,
      };
      
      setActiveHandle(handle);
    },
    [zone.position.x, zone.position.y, zone.width, zone.height]
  );

  // Shape props
  const shapeProps = {
    fill: zone.fillColor,
    opacity: zone.opacity,
    stroke: borderStroke,
    strokeWidth: borderStroke ? 3 : 0, // Thicker border
    dash: borderDash,
  };

  // Handle positions
  const handles: Array<{ pos: HandlePosition; x: number; y: number; cursor: string }> = [
    { pos: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
    { pos: 'n', x: displayWidth / 2, y: 0, cursor: 'ns-resize' },
    { pos: 'ne', x: displayWidth, y: 0, cursor: 'nesw-resize' },
    { pos: 'e', x: displayWidth, y: displayHeight / 2, cursor: 'ew-resize' },
    { pos: 'se', x: displayWidth, y: displayHeight, cursor: 'nwse-resize' },
    { pos: 's', x: displayWidth / 2, y: displayHeight, cursor: 'ns-resize' },
    { pos: 'sw', x: 0, y: displayHeight, cursor: 'nesw-resize' },
    { pos: 'w', x: 0, y: displayHeight / 2, cursor: 'ew-resize' },
  ];

  return (
    <Group id={zone.id}
      ref={groupRef}
      x={displayX}
      y={displayY}
      draggable={!activeHandle}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleGroupDragEnd}
    >
      {/* Zone shape */}
      {zone.shape === 'rect' ? (
        <Rect
          width={displayWidth}
          height={displayHeight}
          cornerRadius={6}
          {...shapeProps}
        />
      ) : (
        <Ellipse
          x={displayWidth / 2}
          y={displayHeight / 2}
          radiusX={displayWidth / 2}
          radiusY={displayHeight / 2}
          {...shapeProps}
        />
      )}

      {/* Selection border and handles */}
      {isSelected && (
        <>
          {zone.shape === 'rect' ? (
            <Rect
              width={displayWidth}
              height={displayHeight}
              stroke="#3b82f6"
              strokeWidth={2}
              dash={[4, 2]}
              cornerRadius={6}
              listening={false}
            />
          ) : (
            <Ellipse
              x={displayWidth / 2}
              y={displayHeight / 2}
              radiusX={displayWidth / 2}
              radiusY={displayHeight / 2}
              stroke="#3b82f6"
              strokeWidth={2}
              dash={[4, 2]}
              listening={false}
            />
          )}

          {/* Resize handles - NOT draggable, use mousedown + window events */}
          {handles.map(({ pos, x, y, cursor }) => (
            <Rect
              key={pos}
              x={x - 6}
              y={y - 6}
              width={12}
              height={12}
              fill="#fff"
              stroke="#3b82f6"
              strokeWidth={2}
              cornerRadius={2}
              onMouseDown={(e) => handleResizeStart(pos, e)}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = cursor;
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
          ))}
        </>
      )}
    </Group>
  );
};

export default ZoneNode;
