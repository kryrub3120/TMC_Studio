/**
 * EquipmentNode - Renders training equipment (goals, cones, mannequins, etc.)
 * Refactored: shapes extracted to equipment/ module
 * Adds corner drag-handles for uniform scale resize (rotation-aware).
 */

import React from 'react';
import { Group, Rect } from 'react-konva';
import type { EquipmentElement } from '@tmc/core';
import { EQUIPMENT_RENDERERS, getEquipmentHitBounds } from './equipment';
import { cursorGrab, cursorDefault, applyGrabbing, applyGrab } from './cursorUtils';

export interface EquipmentNodeProps {
  element: EquipmentElement;
  isSelected: boolean;
  isLocked?: boolean;
  isPrintMode?: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  /** Commit a new absolute scale after drag-resize. */
  onResize?: (id: string, scale: number) => void;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;

/**
 * Sanitize colors for print mode — ALL equipment renders as black on paper
 * to ensure crisp B/W output regardless of equipment type or custom color.
 */
function sanitizeForPrint(color: string, isPrintMode: boolean): string {
  if (!isPrintMode) return color;
  // In print mode, every color becomes black — pure B/W output
  return '#000000';
}

type Corner = 'nw' | 'ne' | 'se' | 'sw';

export const EquipmentNode: React.FC<EquipmentNodeProps> = ({
  element,
  isSelected,
  isLocked = false,
  isPrintMode,
  onSelect,
  onDragEnd,
  onResize,
}) => {
  const { id, position, equipmentType, variant, rotation, color, scale } = element;
  const groupRef = React.useRef<any>(null);

  // Live preview scale during a resize drag (null when not resizing).
  const [previewScale, setPreviewScale] = React.useState<number | null>(null);
  const [activeCorner, setActiveCorner] = React.useState<Corner | null>(null);
  const resizeStart = React.useRef<{ startScale: number; startDist: number } | null>(null);

  const effScale = previewScale ?? scale;

  // Sanitize white to black in print mode (only for white equipment)
  const effectiveColor = color ? sanitizeForPrint(color, isPrintMode ?? false) : color;

  // Get hit area from centralized function (reflects live preview scale)
  const hitBounds = getEquipmentHitBounds({ ...element, scale: effScale });

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

  const handleDragStart = () => {
    if (isLocked) return;
    applyGrabbing(groupRef);
  };

  const handleDragEnd = (e: any) => {
    applyGrab(groupRef);
    if (isLocked) return;
    onDragEnd(id, e.target.x(), e.target.y());
  };

  // ─── Resize handles ────────────────────────────────────────────────
  // Uniform scale around the shape's bounding-box centre. Using the bbox
  // centre (rather than the group pivot, which sits at the base for goals /
  // mannequins / poles) keeps every corner symmetric, so dragging a corner
  // outward always grows and inward always shrinks. getRelativePointerPosition
  // returns unrotated local coords, so this works at any rotation.
  // distRef holds the fixed bbox-centre captured at drag start.
  const distRef = React.useRef<{ cx: number; cy: number } | null>(null);

  const localPointer = React.useCallback(() => {
    const group = groupRef.current;
    if (!group) return null;
    return group.getRelativePointerPosition() as { x: number; y: number } | null;
  }, []);

  const handleResizeStart = (corner: Corner) => (e: any) => {
    e.cancelBubble = true;
    if (isLocked) return;
    const group = groupRef.current;
    const stage = group?.getStage?.();
    if (stage) stage.setPointersPositions(e.evt);
    const b = getEquipmentHitBounds({ ...element, scale });
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    const p = localPointer();
    if (!p) return;
    const startDist = Math.hypot(p.x - cx, p.y - cy);
    if (startDist < 1) return;
    distRef.current = { cx, cy };
    resizeStart.current = { startScale: scale, startDist };
    setActiveCorner(corner);
    setPreviewScale(scale);
  };

  React.useEffect(() => {
    if (!activeCorner) return;

    const onMove = (ev: MouseEvent) => {
      const group = groupRef.current;
      const stage = group?.getStage?.();
      if (stage) stage.setPointersPositions(ev);
      const data = resizeStart.current;
      const ref = distRef.current;
      const p = localPointer();
      if (!data || !ref || !p) return;
      const dist = Math.hypot(p.x - ref.cx, p.y - ref.cy);
      const ratio = dist / data.startDist;
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, data.startScale * ratio));
      setPreviewScale(next);
    };

    const onUp = () => {
      const finalScale = previewScale;
      setActiveCorner(null);
      resizeStart.current = null;
      distRef.current = null;
      setPreviewScale(null);
      if (finalScale != null && onResize && Math.abs(finalScale - scale) > 0.001) {
        onResize(id, finalScale);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [activeCorner, localPointer, previewScale, onResize, id, scale, element]);

  // Push handles a few px outside the bbox so they sit clear of the shape.
  const HANDLE_OUT = 5;
  const bx0 = hitBounds.x - HANDLE_OUT;
  const by0 = hitBounds.y - HANDLE_OUT;
  const bx1 = hitBounds.x + hitBounds.width + HANDLE_OUT;
  const by1 = hitBounds.y + hitBounds.height + HANDLE_OUT;
  const corners: Array<{ pos: Corner; x: number; y: number; cursor: string }> = [
    { pos: 'nw', x: bx0, y: by0, cursor: 'nwse-resize' },
    { pos: 'ne', x: bx1, y: by0, cursor: 'nesw-resize' },
    { pos: 'se', x: bx1, y: by1, cursor: 'nwse-resize' },
    { pos: 'sw', x: bx0, y: by1, cursor: 'nesw-resize' },
  ];

  return (
    <Group
      ref={groupRef}
      id={id}
      x={position.x}
      y={position.y}
      rotation={rotation}
      draggable={!activeCorner && !isLocked}
      onDragStart={handleDragStart}
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
        onMouseEnter={isLocked ? cursorDefault : cursorGrab}
        onMouseLeave={cursorDefault}
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
        {ShapeComponent && <ShapeComponent color={effectiveColor} scale={effScale} variant={variant} />}
      </Group>

      {/* Resize handles (corner, uniform scale) */}
      {isSelected && !isLocked && onResize &&
        corners.map(({ pos, x, y, cursor }) => (
          <Rect
            key={pos}
            x={x - 8}
            y={y - 8}
            width={16}
            height={16}
            fill="#fff"
            stroke="#3b82f6"
            strokeWidth={2.5}
            cornerRadius={3}
            onMouseDown={handleResizeStart(pos)}
            onDblClick={(e) => {
              e.cancelBubble = true;
              // Double-click a handle → reset to default size (scale 1).
              if (onResize && Math.abs(scale - 1) > 0.001) onResize(id, 1);
            }}
            onDblTap={(e) => {
              e.cancelBubble = true;
              if (onResize && Math.abs(scale - 1) > 0.001) onResize(id, 1);
            }}
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
    </Group>
  );
};

export default EquipmentNode;
