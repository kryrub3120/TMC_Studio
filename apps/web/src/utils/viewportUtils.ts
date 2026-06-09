/**
 * viewportUtils - Viewport coordinate helpers for canvas interactions
 * 
 * Provides world-space pointer position from Konva Stage,
 * accounting for scale and translation (zoom + pan).
 * 
 * True Virtual Canvas model (PR-UX-3 ETAP 1):
 * - Stage always fills the container: scale=1, x=0, y=0.
 * - All zoom/pan lives on the root Group: scaleX/Y={zoom}, x/y={panX, panY}.
 * - World coordinates: worldX = (screenX - panX) / zoom
 * - Public API: getCanvasWorldCoords() — single source of truth for screen→world.
 */

import type Konva from 'konva';

export interface WorldPoint {
  x: number;
  y: number;
}

/**
 * Convert a Stage pointer position to world (canvas) coordinates.
 *
 * True Virtual Canvas formula:
 *   worldX = (stagePointerX - panX) / zoom
 *   worldY = (stagePointerY - panY) / zoom
 *
 * This is the **primary public API** for screen→world conversion.
 * Use this everywhere in place of `stage.getPointerPosition()` + manual math.
 *
 * @param stage - Konva Stage (must have scale=1, x=0, y=0)
 * @param panX  - Root Group x offset (= panOffset.x from BoardCanvasSection)
 * @param panY  - Root Group y offset (= panOffset.y from BoardCanvasSection)
 * @param zoom  - Root Group zoom (= effectiveZoom = userZoom * fitZoom)
 */
export function getCanvasWorldCoords(
  stage: Konva.Stage | null,
  panX: number,
  panY: number,
  zoom: number,
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
 * @deprecated Use `getCanvasWorldCoords(stage, panX, panY, zoom)` instead.
 *
 * Legacy: uses Stage absolute transform inverse — only correct when Stage
 * itself holds the scale (old model). In True Virtual Canvas the Stage has
 * no transform; use getCanvasWorldCoords instead.
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
 * @deprecated Use `getCanvasWorldCoords(stage, panX, panY, zoom)` instead.
 *
 * True Virtual Canvas: convert Stage pointer position to world coords.
 * Kept for backward compatibility; identical logic to getCanvasWorldCoords.
 */
export function groupPointerToWorld(
  stage: Konva.Stage | null,
  zoom: number,
  panX: number,
  panY: number,
): WorldPoint | null {
  return getCanvasWorldCoords(stage, panX, panY, zoom);
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

/**
 * Compute the panOffset that centers the (scaled) canvas in the container.
 * 
 * True Virtual Canvas formula (Stage scale=1, Group transform):
 *   panOffset.x = (containerW - scaledW) / 2
 *   panOffset.y = (containerH - scaledH) / 2
 *
 * @param containerW  - Container viewport width (px)
 * @param containerH  - Container viewport height (px)
 * @param canvasW     - Base canvas (pitch) width (world units)
 * @param canvasH     - Base canvas (pitch) height (world units)
 * @param zoom        - Current effective zoom (= userZoom * fitZoom)
 */
export function centerPanOffset(
  containerW: number,
  containerH: number,
  canvasW: number,
  canvasH: number,
  zoom: number,
): { x: number; y: number } {
  return {
    x: (containerW - canvasW * zoom) / 2,
    y: (containerH - canvasH * zoom) / 2,
  };
}
