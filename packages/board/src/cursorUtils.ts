/**
 * Cursor utilities for Konva canvas nodes.
 * Provides consistent cursor feedback for draggable elements.
 *
 * Usage:
 *   onMouseEnter={cursorGrab}
 *   onMouseLeave={cursorDefault}
 *   onDragStart={() => { cursorGrabbingRaw(groupRef); }}
 *   onDragEnd={() => { cursorGrabRaw(groupRef); }}
 */

import type Konva from 'konva';

/** Set cursor on the stage container */
export function setStageCursor(
  e: Konva.KonvaEventObject<MouseEvent>,
  cursor: string
): void {
  const container = e.target.getStage()?.container();
  if (container) container.style.cursor = cursor;
}

/** Reset cursor to default (no special cursor) */
export function cursorDefault(e: Konva.KonvaEventObject<MouseEvent>): void {
  setStageCursor(e, 'default');
}

/** Show grab cursor — element is draggable */
export function cursorGrab(e: Konva.KonvaEventObject<MouseEvent>): void {
  setStageCursor(e, 'grab');
}

/** Show move cursor — alternative to grab */
export function cursorMove(e: Konva.KonvaEventObject<MouseEvent>): void {
  setStageCursor(e, 'move');
}

/** Show crosshair cursor — for rotation handle */
export function cursorCrosshair(e: Konva.KonvaEventObject<MouseEvent>): void {
  setStageCursor(e, 'crosshair');
}

/**
 * Apply grabbing cursor directly via group ref (for use in drag handlers).
 * Call in onDragStart, reset in onDragEnd.
 */
export function applyGrabbing(groupRef: React.RefObject<Konva.Group | null>): void {
  const container = groupRef.current?.getStage()?.container();
  if (container) container.style.cursor = 'grabbing';
}

export function applyGrab(groupRef: React.RefObject<Konva.Group | null>): void {
  const container = groupRef.current?.getStage()?.container();
  if (container) container.style.cursor = 'grab';
}