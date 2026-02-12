/**
 * Unit tests for viewport utility functions
 * Part of canvas stabilization pass
 */

import { describe, it, expect } from 'vitest';
import {
  screenToWorld,
  computeZoomToCursorPan,
  clampPanOffset,
} from '../viewportUtils';

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
