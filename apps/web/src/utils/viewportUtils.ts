/**
 * viewportUtils - Viewport coordinate helpers for canvas interactions
 * 
 * Provides world-space pointer position from Konva Stage,
 * accounting for scale and translation (zoom + pan).
 */

import type Konva from 'konva';

export interface WorldPoint {
  x: number;
  y: number;
}

/**
 * Get the pointer position in world (unscaled) coordinates.
 * 
 * Uses Stage.getPointerPosition() (screen coords) and the inverse
 * of the Stage's absolute transform to convert to world space.
 * 
 * Usage:
 *   const world = getWorldPointer(stageRef.current);
 *   // world.x, world.y are in pitch coordinate space
 */
export function getWorldPointer(stage: Konva.Stage | null): WorldPoint | null {
  if (!stage) return null;
  
  const pointerPos = stage.getPointerPosition();
  if (!pointerPos) return null;
  
  // Get the stage's absolute transform and invert it
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  
  // Apply inverse transform to screen pointer position → world coords
  return transform.point(pointerPos);
}

/**
 * True Virtual Canvas: convert Stage pointer position to world coords.
 * 
 * In the True Virtual Canvas model, the Stage has no transform (scale=1, x=0, y=0).
 * Instead, a root Group inside the Stage has scaleX/Y={zoom} and x/y={panX/Y}.
 * 
 * Formula:
 *   worldX = (stagePointerX - panX) / zoom
 *   worldY = (stagePointerY - panY) / zoom
 *
 * @param stage - Konva Stage (scale=1)
 * @param zoom  - Current zoom level applied on the root Group
 * @param panX  - Group x offset
 * @param panY  - Group y offset
 */
export function groupPointerToWorld(
  stage: Konva.Stage | null,
  zoom: number,
  panX: number,
  panY: number,
): WorldPoint | null {
  if (!stage) return null;
  const pos = stage.getPointerPosition();
  if (!pos) return null;
  return {
    x: (pos.x - panX) / zoom,
    y: (pos.y - panY) / zoom,
  };
}

/**
 * Convert screen coordinates to world coordinates given stage transform.
 * Useful when you have screen coords from a DOM event rather than Konva.
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  stageX: number,
  stageY: number,
  scale: number,
): WorldPoint {
  return {
    x: (screenX - stageX) / scale,
    y: (screenY - stageY) / scale,
  };
}

/**
 * Compute the new panOffset so that a given world point stays fixed
 * under the cursor when zoom changes.
 * 
 * zoomToPoint formula (True Virtual Canvas / Group transform):
 *   screenPos = worldPoint * zoom + panOffset
 *   → newPanOffset = screenPos - worldPoint * newZoom
 *
 * @param screenX - Cursor X relative to Stage (= container)
 * @param screenY - Cursor Y relative to Stage (= container)
 * @param worldX  - World X under cursor before zoom change
 * @param worldY  - World Y under cursor before zoom change
 * @param newZoom - New zoom level
 */
export function zoomToCursorPan(
  screenX: number,
  screenY: number,
  worldX: number,
  worldY: number,
  newZoom: number,
): { x: number; y: number } {
  return {
    x: screenX - worldX * newZoom,
    y: screenY - worldY * newZoom,
  };
}

/**
 * Compute the new panOffset so that a given world point stays fixed
 * under the cursor when zoom changes.
 * 
 * zoomToPoint formula:
 *   Before zoom: screenPos = worldPoint * oldScale + oldStagePos
 *   After zoom:  screenPos = worldPoint * newScale + newStagePos
 *   → newStagePos = screenPos - worldPoint * newScale
 *   → newPanOffset = newStagePos - centerOffset
 *   
 * Where centerOffset = (containerW - canvasW * newScale) / 2
 */
export function computeZoomToCursorPan(
  /** Pointer position in screen (container-relative) coords */
  screenX: number,
  screenY: number,
  /** The world point under cursor before zoom */
  worldX: number,
  worldY: number,
  /** New effective zoom (after change) */
  newScale: number,
  /** Container dimensions */
  containerW: number,
  containerH: number,
  /** Canvas base dimensions */
  canvasW: number,
  canvasH: number,
): { x: number; y: number } {
  // Where the stage origin needs to be to keep worldPoint under screenPos
  const newStageX = screenX - worldX * newScale;
  const newStageY = screenY - worldY * newScale;
  
  // Center offset for the new scale
  const scaledW = canvasW * newScale;
  const scaledH = canvasH * newScale;
  const centerX = (containerW - scaledW) / 2;
  const centerY = (containerH - scaledH) / 2;
  
  // panOffset = stagePosition - centerOffset
  return {
    x: newStageX - centerX,
    y: newStageY - centerY,
  };
}

/**
 * Clamp panOffset so the pitch can't be panned completely out of view.
 * Ensures at least `margin` px of pitch remain visible on each side.
 */
export function clampPanOffset(
  panX: number,
  panY: number,
  scaledW: number,
  scaledH: number,
  containerW: number,
  containerH: number,
  margin: number = 80,
): { x: number; y: number } {
  const maxPanX = Math.max(0, (scaledW - containerW) / 2 + margin);
  const maxPanY = Math.max(0, (scaledH - containerH) / 2 + margin);
  
  return {
    x: Math.max(-maxPanX, Math.min(maxPanX, panX)),
    y: Math.max(-maxPanY, Math.min(maxPanY, panY)),
  };
}
