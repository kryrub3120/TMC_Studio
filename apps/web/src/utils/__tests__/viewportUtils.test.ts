/**
 * Unit tests for viewport utility functions
 * Part of canvas stabilization pass + PR-UX-3 ETAP 1.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getCanvasWorldCoords,
  screenToWorld,
  computeZoomToCursorPan,
  clampPanOffset,
} from '../viewportUtils';

// ─── getCanvasWorldCoords ───────────────────────────────────────────────────

describe('getCanvasWorldCoords', () => {
  /** Helper: create a minimal Konva.Stage mock with a given pointer position */
  function makeStage(screenX: number, screenY: number) {
    return {
      getPointerPosition: vi.fn().mockReturnValue({ x: screenX, y: screenY }),
    } as any;
  }

  it('returns null when stage is null', () => {
    expect(getCanvasWorldCoords(null, 0, 0, 1)).toBeNull();
  });

  it('returns null when getPointerPosition returns null', () => {
    const stage = { getPointerPosition: vi.fn().mockReturnValue(null) } as any;
    expect(getCanvasWorldCoords(stage, 0, 0, 1)).toBeNull();
  });

  it('converts correctly at scale=1 with no pan', () => {
    const world = getCanvasWorldCoords(makeStage(100, 200), 0, 0, 1);
    expect(world).toEqual({ x: 100, y: 200 });
  });

  it('converts correctly with pan offset', () => {
    // screen(150,250), pan(50,100), zoom=1 → world(100, 150)
    const world = getCanvasWorldCoords(makeStage(150, 250), 50, 100, 1);
    expect(world).toEqual({ x: 100, y: 150 });
  });

  it('converts correctly with zoom > 1', () => {
    // screen(200,400), pan(0,0), zoom=2 → world(100, 200)
    const world = getCanvasWorldCoords(makeStage(200, 400), 0, 0, 2);
    expect(world).toEqual({ x: 100, y: 200 });
  });

  it('converts correctly with both pan and zoom', () => {
    // screen(260,420), pan(60,20), zoom=2 → world((260-60)/2, (420-20)/2) = (100, 200)
    const world = getCanvasWorldCoords(makeStage(260, 420), 60, 20, 2);
    expect(world).toEqual({ x: 100, y: 200 });
  });

  it('handles fractional zoom (zoom < 1)', () => {
    // screen(50,50), pan(0,0), zoom=0.5 → world(100, 100)
    const world = getCanvasWorldCoords(makeStage(50, 50), 0, 0, 0.5);
    expect(world).toEqual({ x: 100, y: 100 });
  });

  it('negative pan (canvas larger than container) still works', () => {
    // pan(-100,-80), zoom=1.5, screen(200,160) → world((200-(-100))/1.5, (160-(-80))/1.5) = (200, 160)
    const world = getCanvasWorldCoords(makeStage(200, 160), -100, -80, 1.5);
    expect(world!.x).toBeCloseTo(200, 5);
    expect(world!.y).toBeCloseTo(160, 5);
  });

  it('world coord round-trips back to screen coord', () => {
    const panX = 30;
    const panY = -20;
    const zoom = 1.25;
    const screenX = 400;
    const screenY = 300;

    const world = getCanvasWorldCoords(makeStage(screenX, screenY), panX, panY, zoom)!;
    // Verify: screenX = worldX * zoom + panX
    expect(world.x * zoom + panX).toBeCloseTo(screenX, 5);
    expect(world.y * zoom + panY).toBeCloseTo(screenY, 5);
  });
});

describe('screenToWorld', () => {
  it('should convert screen coords to world coords at scale=1 with no offset', () => {
    const result = screenToWorld(100, 200, 0, 0, 1);
    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
  });

  it('should account for stage offset', () => {
    const result = screenToWorld(150, 250, 50, 100, 1);
    expect(result.x).toBe(100);
    expect(result.y).toBe(150);
  });

  it('should account for scale', () => {
    const result = screenToWorld(200, 400, 0, 0, 2);
    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
  });

  it('should account for both offset and scale', () => {
    const result = screenToWorld(260, 420, 60, 20, 2);
    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
  });

  it('should handle fractional scale', () => {
    const result = screenToWorld(50, 50, 0, 0, 0.5);
    expect(result.x).toBe(100);
    expect(result.y).toBe(100);
  });
});

describe('computeZoomToCursorPan', () => {
  const containerW = 1200;
  const containerH = 800;
  const canvasW = 1130; // 1050 + 2*40 padding
  const canvasH = 760;  // 680 + 2*40 padding

  it('should keep world point under cursor after zoom', () => {
    // At scale=1, center offset = (1200-1130)/2 = 35, (800-760)/2 = 20
    // stageX = 35 + panX, stageY = 20 + panY
    // With panOffset = {0,0}: stageX=35, stageY=20
    const oldScale = 1;
    const newScale = 1.5;

    // Cursor at screen (400, 300)
    const screenX = 400;
    const screenY = 300;

    // World point under cursor at old scale:
    // worldX = (screenX - stageX) / oldScale = (400 - 35) / 1 = 365
    // worldY = (screenY - stageY) / oldScale = (300 - 20) / 1 = 280
    const worldX = (screenX - 35) / oldScale;
    const worldY = (screenY - 20) / oldScale;

    const newPan = computeZoomToCursorPan(
      screenX, screenY,
      worldX, worldY,
      newScale,
      containerW, containerH,
      canvasW, canvasH,
    );

    // Verify: at new scale, the same world point should map to same screen pos
    // newScaledW = 1130 * 1.5 = 1695
    // newScaledH = 760 * 1.5 = 1140
    // newCenterX = (1200 - 1695) / 2 = -247.5
    // newCenterY = (800 - 1140) / 2 = -170
    // newStageX = newCenterX + newPan.x
    // newStageY = newCenterY + newPan.y
    // verifyScreenX = worldX * newScale + newStageX
    const newScaledW = canvasW * newScale;
    const newScaledH = canvasH * newScale;
    const newCenterX = (containerW - newScaledW) / 2;
    const newCenterY = (containerH - newScaledH) / 2;

    const verifyScreenX = worldX * newScale + newCenterX + newPan.x;
    const verifyScreenY = worldY * newScale + newCenterY + newPan.y;

    expect(verifyScreenX).toBeCloseTo(screenX, 5);
    expect(verifyScreenY).toBeCloseTo(screenY, 5);
  });

  it('should return zero pan when zooming at center of canvas', () => {
    const newScale = 2;

    // Center of canvas in screen coords at scale=1
    const screenX = containerW / 2;
    const screenY = containerH / 2;

    // World point at center
    const worldX = canvasW / 2;
    const worldY = canvasH / 2;

    const newPan = computeZoomToCursorPan(
      screenX, screenY,
      worldX, worldY,
      newScale,
      containerW, containerH,
      canvasW, canvasH,
    );

    // When zooming at the exact center, pan should remain roughly 0
    expect(newPan.x).toBeCloseTo(0, 1);
    expect(newPan.y).toBeCloseTo(0, 1);
  });
});

describe('clampPanOffset', () => {
  it('should return {0,0} when scaled size fits within container', () => {
    // scaledW < containerW, scaledH < containerH
    const result = clampPanOffset(100, 100, 500, 400, 800, 600, 80);
    // maxPanX = max(0, (500-800)/2 + 80) = max(0, -150+80) = max(0, -70) = 0
    // maxPanY = max(0, (400-600)/2 + 80) = max(0, -100+80) = max(0, -20) = 0
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('should clamp pan within bounds when scaled content is larger', () => {
    // scaledW > containerW
    const result = clampPanOffset(500, 500, 1600, 1200, 800, 600, 80);
    // maxPanX = max(0, (1600-800)/2 + 80) = max(0, 400+80) = 480
    // maxPanY = max(0, (1200-600)/2 + 80) = max(0, 300+80) = 380
    expect(result.x).toBe(480);
    expect(result.y).toBe(380);
  });

  it('should clamp negative pan values', () => {
    const result = clampPanOffset(-500, -500, 1600, 1200, 800, 600, 80);
    expect(result.x).toBe(-480);
    expect(result.y).toBe(-380);
  });

  it('should pass through values within bounds', () => {
    const result = clampPanOffset(100, 50, 1600, 1200, 800, 600, 80);
    expect(result.x).toBe(100);
    expect(result.y).toBe(50);
  });

  it('should use default margin of 80', () => {
    const result = clampPanOffset(0, 0, 1000, 800, 800, 600);
    // maxPanX = max(0, (1000-800)/2 + 80) = max(0, 100+80) = 180
    // maxPanY = max(0, (800-600)/2 + 80) = max(0, 100+80) = 180
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('should handle zero margin', () => {
    const result = clampPanOffset(200, 200, 1600, 1200, 800, 600, 0);
    // maxPanX = max(0, (1600-800)/2 + 0) = 400
    // maxPanY = max(0, (1200-600)/2 + 0) = 300
    expect(result.x).toBe(200);
    expect(result.y).toBe(200);
  });
});
