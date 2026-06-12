/**
 * ZoneNode - Konva Zone component with resize handles (rect/ellipse) and
 * polygon vertex editing.
 *
 * - rect/ellipse: 8-point resize handles (manual mouse tracking).
 * - polygon: draggable vertex handles; double-click an edge to add a vertex;
 *   right-click a vertex to remove it. The whole shape drags as a group.
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Group, Rect, Ellipse, Line, Circle } from 'react-konva';
import type Konva from 'konva';
import { cursorGrab, cursorDefault, applyGrabbing, applyGrab } from './cursorUtils';
import type { ZoneElement, Position, PitchConfig } from '@tmc/core';

export interface ZoneNodeProps {
  zone: ZoneElement;
  pitchConfig: PitchConfig;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
  onResize?: (id: string, position: Position, width: number, height: number) => void;
  /** Replace polygon vertices (flat array relative to zone.position). */
  onUpdatePoints?: (id: string, points: number[]) => void;
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
  onUpdatePoints,
}) => {
  const groupRef = useRef<Konva.Group>(null);

  const isPolygon = zone.shape === 'polygon';

  // Resize state (rect/ellipse)
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

  // Polygon vertex-drag preview state
  const [previewPoints, setPreviewPoints] = useState<number[] | null>(null);
  const [draggingVertex, setDraggingVertex] = useState(false);

  // Display values
  const displayX = previewBounds?.x ?? zone.position.x;
  const displayY = previewBounds?.y ?? zone.position.y;
  const displayWidth = previewBounds?.width ?? zone.width;
  const displayHeight = previewBounds?.height ?? zone.height;

  const borderDash = zone.borderStyle === 'dashed' ? [6, 3] : undefined;
  const borderStroke = zone.borderStyle !== 'none' ? (zone.borderColor || zone.fillColor) : undefined;

  // Current polygon points (preview while dragging a vertex, else committed)
  const points = previewPoints ?? zone.points ?? [];

  // ===== Resize (rect/ellipse) =====
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

  useEffect(() => {
    if (!activeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const stage = groupRef.current?.getStage();
      if (!stage) return;

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
      if (activeHandle || draggingVertex) return;
      applyGrab(groupRef);
      const node = e.target;
      onDragEnd(zone.id, { x: node.x(), y: node.y() });
    },
    [zone.id, onDragEnd, activeHandle, draggingVertex]
  );

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

  // ===== Polygon vertex editing =====
  const handleVertexDragStart = useCallback(() => {
    setDraggingVertex(true);
    setPreviewPoints((zone.points ?? []).slice());
  }, [zone.points]);

  const handleVertexDragMove = useCallback(
    (index: number, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      setPreviewPoints((prev) => {
        const base = (prev ?? zone.points ?? []).slice();
        base[index * 2] = node.x();
        base[index * 2 + 1] = node.y();
        return base;
      });
    },
    [zone.points]
  );

  const handleVertexDragEnd = useCallback(() => {
    if (previewPoints && onUpdatePoints) {
      onUpdatePoints(zone.id, previewPoints);
    }
    setDraggingVertex(false);
    setPreviewPoints(null);
  }, [previewPoints, onUpdatePoints, zone.id]);

  // Remove a vertex on right-click (keep at least a triangle)
  const handleVertexContextMenu = useCallback(
    (index: number, e: Konva.KonvaEventObject<PointerEvent>) => {
      e.cancelBubble = true;
      e.evt.preventDefault();
      const current = zone.points ?? [];
      if (current.length / 2 <= 3) return; // need >=3 vertices
      const next = current.slice();
      next.splice(index * 2, 2);
      onUpdatePoints?.(zone.id, next);
    },
    [zone.points, zone.id, onUpdatePoints]
  );

  // Add a vertex on double-click of an edge (insert at nearest segment)
  const handlePolygonDblClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      const group = groupRef.current;
      if (!group || !onUpdatePoints) return;
      const local = group.getRelativePointerPosition();
      if (!local) return;
      const pts = zone.points ?? [];
      const count = pts.length / 2;
      if (count < 2) return;

      // Find the segment (i -> i+1, wrapping) whose midpoint/projection is
      // closest to the click, then insert the click point after vertex i.
      let bestIndex = 0;
      let bestDist = Infinity;
      for (let i = 0; i < count; i += 1) {
        const ax = pts[i * 2];
        const ay = pts[i * 2 + 1];
        const j = (i + 1) % count;
        const bx = pts[j * 2];
        const by = pts[j * 2 + 1];
        // Distance from local point to segment a-b
        const dx = bx - ax;
        const dy = by - ay;
        const lenSq = dx * dx + dy * dy || 1;
        let t = ((local.x - ax) * dx + (local.y - ay) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const px = ax + t * dx;
        const py = ay + t * dy;
        const dist = Math.hypot(local.x - px, local.y - py);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      }
      const next = pts.slice();
      next.splice((bestIndex + 1) * 2, 0, local.x, local.y);
      onUpdatePoints(zone.id, next);
    },
    [zone.points, zone.id, onUpdatePoints]
  );

  // Shape props
  const shapeProps = {
    fill: zone.fillColor,
    opacity: zone.opacity,
    stroke: borderStroke,
    strokeWidth: borderStroke ? 3 : 0,
    dash: borderDash,
  };

  // Resize handle positions (rect/ellipse)
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
      draggable={!activeHandle && !draggingVertex}
      onClick={handleClick}
      onTap={handleClick}
      onMouseEnter={cursorGrab}
      onMouseLeave={cursorDefault}
      onDragStart={() => applyGrabbing(groupRef)}
      onDragEnd={handleGroupDragEnd}
    >
      {/* Zone shape */}
      {isPolygon ? (
        <Line
          points={points}
          closed
          {...shapeProps}
          onDblClick={isSelected ? handlePolygonDblClick : undefined}
          onDblTap={isSelected ? handlePolygonDblClick : undefined}
        />
      ) : zone.shape === 'rect' ? (
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
          {isPolygon ? (
            <>
              {/* Selection outline */}
              <Line
                points={points}
                closed
                stroke="#3b82f6"
                strokeWidth={2}
                dash={[4, 2]}
                listening={false}
              />
              {/* Vertex handles */}
              {Array.from({ length: points.length / 2 }).map((_, i) => (
                <Circle
                  key={i}
                  x={points[i * 2]}
                  y={points[i * 2 + 1]}
                  radius={6}
                  fill="#fff"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  draggable
                  onDragStart={handleVertexDragStart}
                  onDragMove={(e) => handleVertexDragMove(i, e)}
                  onDragEnd={handleVertexDragEnd}
                  onContextMenu={(e) => handleVertexContextMenu(i, e)}
                  onMouseEnter={(e) => {
                    const c = e.target.getStage()?.container();
                    if (c) c.style.cursor = 'grab';
                  }}
                  onMouseLeave={(e) => {
                    const c = e.target.getStage()?.container();
                    if (c) c.style.cursor = 'default';
                  }}
                />
              ))}
            </>
          ) : zone.shape === 'rect' ? (
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

          {/* Resize handles - only for rect/ellipse */}
          {!isPolygon && handles.map(({ pos, x, y, cursor }) => (
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
