/**
 * Unit tests for orientation transform in documentSlice
 * PR-FIX-5: Orientation transform gaps
 */

import { describe, it, expect } from 'vitest';
import type { BoardElement, DrawingElement, PlayerElement, TextElement, EquipmentElement } from '@tmc/core';
import { DEFAULT_PITCH_CONFIG } from '@tmc/core';

// Helper to simulate the transform logic from documentSlice
// This is extracted for testing purposes
function transformElementForOrientation(
  el: BoardElement,
  settings: { orientation: 'portrait' | 'landscape' },
  currentSettings: { orientation: 'portrait' | 'landscape' }
): BoardElement {
  const padding = DEFAULT_PITCH_CONFIG.padding;
  
  // FROM dimensions (current orientation)
  const fromInnerW = currentSettings.orientation === 'portrait'
    ? DEFAULT_PITCH_CONFIG.height
    : DEFAULT_PITCH_CONFIG.width;
  const fromInnerH = currentSettings.orientation === 'portrait'
    ? DEFAULT_PITCH_CONFIG.width
    : DEFAULT_PITCH_CONFIG.height;
  
  // TO dimensions (new orientation)
  const toInnerW = settings.orientation === 'portrait'
    ? DEFAULT_PITCH_CONFIG.height
    : DEFAULT_PITCH_CONFIG.width;
  const toInnerH = settings.orientation === 'portrait'
    ? DEFAULT_PITCH_CONFIG.width
    : DEFAULT_PITCH_CONFIG.height;
  
  // Transform point: fromCenter → rotate 90° → toCenter
  const transformInnerPoint = (x: number, y: number) => {
    // 1. Move to fromCenter
    const dx = x - fromInnerW / 2;
    const dy = y - fromInnerH / 2;
    
    // 2. Rotate 90°
    let rx: number, ry: number;
    if (settings.orientation === 'portrait') {
      // CCW
      rx = -dy;
      ry = dx;
    } else {
      // CW
      rx = dy;
      ry = -dx;
    }
    
    // 3. Move to toCenter
    return {
      x: rx + toInnerW / 2,
      y: ry + toInnerH / 2,
    };
  };
  
  const transformStagePoint = (p: { x: number; y: number }) => {
    const relX = p.x - padding;
    const relY = p.y - padding;
    const t = transformInnerPoint(relX, relY);
    return { x: t.x + padding, y: t.y + padding };
  };
  
  // Transform single element (same logic as documentSlice)
  const rotationDelta = settings.orientation === 'portrait' ? -90 : 90;
  
  if ('position' in el && el.position && el.type !== 'zone') {
    const next: any = {
      ...el,
      position: transformStagePoint(el.position),
    };
    
    // Unified rotation rule: Apply to ANY element with 'rotation' property
    if ('rotation' in el && typeof el.rotation === 'number') {
      next.rotation = (el.rotation + rotationDelta + 360) % 360;
    }
    
    // Unified orientation rule: Apply to ANY element with 'orientation' property
    if ('orientation' in el && el.orientation !== undefined) {
      next.orientation = (el.orientation + rotationDelta + 360) % 360;
    }
    
    // Text special case: keep text upright (readable)
    if (el.type === 'text') {
      if ('rotation' in next) {
        next.rotation = 0;
      }
    }
    
    return next;
  }
  
  // Drawing - transform all points in the flat array [x1, y1, x2, y2, ...]
  if (el.type === 'drawing') {
    const transformedPoints: number[] = [];
    for (let i = 0; i < el.points.length; i += 2) {
      const x = el.points[i];
      const y = el.points[i + 1];
      const transformed = transformStagePoint({ x, y });
      transformedPoints.push(transformed.x, transformed.y);
    }
    return {
      ...el,
      points: transformedPoints,
    } as any;
  }
  
  return el;
}

describe('PR-FIX-5: Orientation Transform', () => {
  describe('DrawingElement points transform', () => {
    it('should transform all points when switching landscape to portrait', () => {
      const drawing: DrawingElement = {
        id: 'draw1',
        type: 'drawing',
        drawingType: 'freehand',
        points: [100, 100, 200, 200, 300, 150],
        color: '#000000',
        strokeWidth: 2,
        opacity: 1,
      };

      const result = transformElementForOrientation(
        drawing,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as DrawingElement;

      expect(result.type).toBe('drawing');
      expect(result.points.length).toBe(6); // Same number of points
      expect(result.points).not.toEqual(drawing.points); // Points should be transformed
      
      // Verify points are still valid numbers
      result.points.forEach(p => {
        expect(typeof p).toBe('number');
        expect(isFinite(p)).toBe(true);
      });
    });

    it('should transform back to original when orientation is toggled twice', () => {
      const original: DrawingElement = {
        id: 'draw2',
        type: 'drawing',
        drawingType: 'highlighter',
        points: [150, 250, 350, 450],
        color: '#ffff00',
        strokeWidth: 10,
        opacity: 0.5,
      };

      // Landscape → Portrait
      const step1 = transformElementForOrientation(
        original,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as DrawingElement;

      // Portrait → Landscape (back)
      const step2 = transformElementForOrientation(
        step1,
        { orientation: 'landscape' },
        { orientation: 'portrait' }
      ) as DrawingElement;

      // Should be very close to original (within rounding error)
      step2.points.forEach((point, i) => {
        expect(point).toBeCloseTo(original.points[i], 1);
      });
    });
  });

  describe('PlayerElement orientation rotation', () => {
    it('should rotate player.orientation by -90 degrees when switching to portrait', () => {
      const player: PlayerElement = {
        id: 'p1',
        type: 'player',
        team: 'home',
        position: { x: 500, y: 400 },
        orientation: 90, // Facing right
      };

      const result = transformElementForOrientation(
        player,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as PlayerElement;

      expect(result.orientation).toBe(0); // 90 - 90 = 0 (facing up/north)
    });

    it('should rotate player.orientation by +90 degrees when switching to landscape', () => {
      const player: PlayerElement = {
        id: 'p2',
        type: 'player',
        team: 'away',
        position: { x: 300, y: 200 },
        orientation: 0, // Facing up
      };

      const result = transformElementForOrientation(
        player,
        { orientation: 'landscape' },
        { orientation: 'portrait' }
      ) as PlayerElement;

      expect(result.orientation).toBe(90); // 0 + 90 = 90 (facing right)
    });

    it('should keep orientation within 0-359 range when wrapping', () => {
      const player: PlayerElement = {
        id: 'p3',
        type: 'player',
        team: 'home',
        position: { x: 400, y: 300 },
        orientation: 350, // Almost facing north
      };

      const result = transformElementForOrientation(
        player,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as PlayerElement;

      expect(result.orientation).toBe(260); // (350 - 90 + 360) % 360 = 260
      expect(result.orientation).toBeGreaterThanOrEqual(0);
      expect(result.orientation).toBeLessThan(360);
    });

    it('should not modify orientation when player.orientation is undefined', () => {
      const player: PlayerElement = {
        id: 'p4',
        type: 'player',
        team: 'home',
        position: { x: 200, y: 200 },
        // orientation is undefined (feature disabled for this player)
      };

      const result = transformElementForOrientation(
        player,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as PlayerElement;

      expect(result.orientation).toBeUndefined();
    });

    it('should return to original orientation after double toggle', () => {
      const original: PlayerElement = {
        id: 'p5',
        type: 'player',
        team: 'away',
        position: { x: 600, y: 500 },
        orientation: 135,
      };

      // Landscape → Portrait
      const step1 = transformElementForOrientation(
        original,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as PlayerElement;

      // Portrait → Landscape
      const step2 = transformElementForOrientation(
        step1,
        { orientation: 'landscape' },
        { orientation: 'portrait' }
      ) as PlayerElement;

      expect(step2.orientation).toBe(original.orientation);
    });
  });

  describe('TextElement position-only transform', () => {
    it('should transform text position but not rotate the text itself', () => {
      const text: TextElement = {
        id: 't1',
        type: 'text',
        position: { x: 400, y: 300 },
        content: 'Test Label',
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
        bold: false,
        italic: false,
      };

      const result = transformElementForOrientation(
        text,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as TextElement;

      expect(result.type).toBe('text');
      expect(result.position).not.toEqual(text.position); // Position should change
      expect(result.content).toBe(text.content); // Content unchanged
      expect(result.fontSize).toBe(text.fontSize); // Size unchanged
      // No rotation property should be added
      expect('rotation' in result).toBe(false);
    });

    it('should keep text upright (readable) after orientation change', () => {
      // Text should remain readable - this is ensured by NOT rotating it
      const text: TextElement = {
        id: 't2',
        type: 'text',
        position: { x: 500, y: 400 },
        content: 'Goals: 3',
        fontSize: 20,
        fontFamily: 'Inter',
        color: '#ff0000',
        bold: true,
        italic: false,
      };

      const transformed = transformElementForOrientation(
        text,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as TextElement;

      // Verify position changed (showing it was transformed)
      expect(transformed.position.x).not.toBe(text.position.x);
      expect(transformed.position.y).not.toBe(text.position.y);
      
      // Verify no rotation was applied (text stays upright)
      expect('rotation' in transformed).toBe(false);
      expect(transformed.content).toBe(text.content);
    });

    it('should force text rotation to 0 if rotation property exists', () => {
      // If text somehow has a rotation property, it should be forced to 0
      const text: any = {
        id: 't3',
        type: 'text',
        position: { x: 400, y: 300 },
        content: 'Test',
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
        bold: false,
        italic: false,
        rotation: 45, // Some rotation that should be cleared
      };

      const transformed = transformElementForOrientation(
        text,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as any;

      // Text rotation should be forced to 0 to stay upright
      expect(transformed.rotation).toBe(0);
      expect(transformed.content).toBe(text.content);
    });
  });

  describe('EquipmentElement rotation (unified rule)', () => {
    it('should rotate cone by -90 degrees when switching to portrait', () => {
      const cone: EquipmentElement = {
        id: 'eq1',
        type: 'equipment',
        position: { x: 300, y: 300 },
        equipmentType: 'cone',
        variant: 'standard',
        rotation: 45,
        color: '#ff9900',
        scale: 1,
      };

      const result = transformElementForOrientation(
        cone,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as EquipmentElement;

      expect(result.rotation).toBe(315); // (45 - 90 + 360) % 360 = 315
    });

    it('should rotate mannequin by -90 degrees when switching to portrait', () => {
      const mannequin: EquipmentElement = {
        id: 'eq2',
        type: 'equipment',
        position: { x: 400, y: 400 },
        equipmentType: 'mannequin',
        variant: 'standard',
        rotation: 0, // Facing up
        color: '#ffaa00',
        scale: 1,
      };

      const result = transformElementForOrientation(
        mannequin,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as EquipmentElement;

      expect(result.rotation).toBe(270); // (0 - 90 + 360) % 360 = 270
    });

    it('should rotate goal by +90 degrees when switching to landscape', () => {
      const goal: EquipmentElement = {
        id: 'eq3',
        type: 'equipment',
        position: { x: 500, y: 300 },
        equipmentType: 'goal',
        variant: 'standard',
        rotation: 270, // Facing left in portrait
        color: '#ffffff',
        scale: 1,
      };

      const result = transformElementForOrientation(
        goal,
        { orientation: 'landscape' },
        { orientation: 'portrait' }
      ) as EquipmentElement;

      expect(result.rotation).toBe(0); // (270 + 90) % 360 = 0
    });

    it('should keep equipment rotation within 0-360 range on wrap', () => {
      const equipment: EquipmentElement = {
        id: 'eq4',
        type: 'equipment',
        position: { x: 400, y: 400 },
        equipmentType: 'ladder',
        variant: 'standard',
        rotation: 350,
        color: '#00ff00',
        scale: 1.5,
      };

      const result = transformElementForOrientation(
        equipment,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as EquipmentElement;

      expect(result.rotation).toBe(260); // (350 - 90 + 360) % 360 = 260
      expect(result.rotation).toBeGreaterThanOrEqual(0);
      expect(result.rotation).toBeLessThan(360);
    });

    it('should return equipment to original rotation after double toggle', () => {
      const equipment: EquipmentElement = {
        id: 'eq5',
        type: 'equipment',
        position: { x: 200, y: 200 },
        equipmentType: 'hoop',
        variant: 'standard',
        rotation: 135,
        color: '#ff00ff',
        scale: 1,
      };

      // Landscape → Portrait
      const step1 = transformElementForOrientation(
        equipment,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as EquipmentElement;

      // Portrait → Landscape
      const step2 = transformElementForOrientation(
        step1,
        { orientation: 'landscape' },
        { orientation: 'portrait' }
      ) as EquipmentElement;

      expect(step2.rotation).toBe(equipment.rotation);
    });
  });

  describe('Data integrity - no corruption on double toggle', () => {
    it('should preserve all element data through double orientation toggle', () => {
      const elements: BoardElement[] = [
        {
          id: 'p1',
          type: 'player',
          team: 'home',
          position: { x: 300, y: 300 },
          orientation: 90,
          number: 10,
        } as PlayerElement,
        {
          id: 'd1',
          type: 'drawing',
          drawingType: 'freehand',
          points: [100, 100, 200, 200, 300, 300],
          color: '#000000',
          strokeWidth: 2,
          opacity: 1,
        } as DrawingElement,
        {
          id: 't1',
          type: 'text',
          position: { x: 500, y: 500 },
          content: 'Test',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#000000',
          bold: false,
          italic: false,
        } as TextElement,
      ];

      // Transform landscape → portrait → landscape
      const step1 = elements.map(el =>
        transformElementForOrientation(el, { orientation: 'portrait' }, { orientation: 'landscape' })
      );
      const step2 = step1.map(el =>
        transformElementForOrientation(el, { orientation: 'landscape' }, { orientation: 'portrait' })
      );

      // Check player
      const originalPlayer = elements[0] as PlayerElement;
      const finalPlayer = step2[0] as PlayerElement;
      expect(finalPlayer.orientation).toBe(originalPlayer.orientation);
      expect(finalPlayer.number).toBe(originalPlayer.number);

      // Check drawing points (should be close to original within rounding)
      const originalDrawing = elements[1] as DrawingElement;
      const finalDrawing = step2[1] as DrawingElement;
      finalDrawing.points.forEach((p, i) => {
        expect(p).toBeCloseTo(originalDrawing.points[i], 1);
      });

      // Check text
      const originalText = elements[2] as TextElement;
      const finalText = step2[2] as TextElement;
      expect(finalText.content).toBe(originalText.content);
      expect(finalText.fontSize).toBe(originalText.fontSize);
    });

    it('should preserve mixed element collection through double toggle (all types)', () => {
      const elements: BoardElement[] = [
        {
          id: 'p1',
          type: 'player',
          team: 'home',
          position: { x: 200, y: 300 },
          orientation: 45,
          number: 7,
        } as PlayerElement,
        {
          id: 'eq1',
          type: 'equipment',
          position: { x: 400, y: 200 },
          equipmentType: 'goal',
          variant: 'standard',
          rotation: 180,
          color: '#ffffff',
          scale: 1,
        } as EquipmentElement,
        {
          id: 'eq2',
          type: 'equipment',
          position: { x: 600, y: 500 },
          equipmentType: 'mannequin',
          variant: 'standard',
          rotation: 270,
          color: '#ffaa00',
          scale: 1,
        } as EquipmentElement,
        {
          id: 'eq3',
          type: 'equipment',
          position: { x: 300, y: 400 },
          equipmentType: 'cone',
          variant: 'standard',
          rotation: 0,
          color: '#ff6600',
          scale: 1,
        } as EquipmentElement,
        {
          id: 't1',
          type: 'text',
          position: { x: 500, y: 350 },
          content: 'Formation A',
          fontSize: 20,
          fontFamily: 'Inter',
          color: '#ffffff',
          bold: true,
          italic: false,
        } as TextElement,
        {
          id: 'd1',
          type: 'drawing',
          drawingType: 'freehand',
          points: [100, 100, 200, 150, 300, 200, 400, 250],
          color: '#ff0000',
          strokeWidth: 3,
          opacity: 0.8,
        } as DrawingElement,
      ];

      // Landscape → Portrait → Landscape (full round-trip)
      const step1 = elements.map(el =>
        transformElementForOrientation(el, { orientation: 'portrait' }, { orientation: 'landscape' })
      );
      const step2 = step1.map(el =>
        transformElementForOrientation(el, { orientation: 'landscape' }, { orientation: 'portrait' })
      );

      // Player
      expect((step2[0] as PlayerElement).orientation).toBe(45);
      expect((step2[0] as PlayerElement).number).toBe(7);

      // Goal
      expect((step2[1] as EquipmentElement).rotation).toBe(180);
      expect((step2[1] as EquipmentElement).equipmentType).toBe('goal');

      // Mannequin
      expect((step2[2] as EquipmentElement).rotation).toBe(270);

      // Cone
      expect((step2[3] as EquipmentElement).rotation).toBe(0);

      // Text (content and font preserved)
      expect((step2[4] as TextElement).content).toBe('Formation A');
      expect((step2[4] as TextElement).fontSize).toBe(20);

      // Drawing (points close to original)
      const origDrawing = elements[5] as DrawingElement;
      const finalDrawing = step2[5] as DrawingElement;
      expect(finalDrawing.points.length).toBe(origDrawing.points.length);
      finalDrawing.points.forEach((p, i) => {
        expect(p).toBeCloseTo(origDrawing.points[i], 1);
      });
    });
  });

  describe('Rotation normalization', () => {
    it('should normalize rotation to 0-359 range for all boundary values', () => {
      // Test rotation normalization formula: (rotation + delta + 360) % 360
      const normalize = (rotation: number, delta: number) =>
        (rotation + delta + 360) % 360;

      // Standard cases
      expect(normalize(0, -90)).toBe(270);
      expect(normalize(90, -90)).toBe(0);
      expect(normalize(180, -90)).toBe(90);
      expect(normalize(270, -90)).toBe(180);

      // Reverse direction
      expect(normalize(0, 90)).toBe(90);
      expect(normalize(90, 90)).toBe(180);
      expect(normalize(180, 90)).toBe(270);
      expect(normalize(270, 90)).toBe(0);

      // Boundary wrap-arounds
      expect(normalize(350, -90)).toBe(260);
      expect(normalize(10, -90)).toBe(280);
      expect(normalize(350, 90)).toBe(80);
      expect(normalize(10, 90)).toBe(100);
    });

    it('should keep rotation within [0, 360) after any number of toggles', () => {
      let rotation = 45;
      // Toggle 10 times (5 full cycles)
      for (let i = 0; i < 10; i++) {
        const delta = i % 2 === 0 ? -90 : 90;
        rotation = (rotation + delta + 360) % 360;
        expect(rotation).toBeGreaterThanOrEqual(0);
        expect(rotation).toBeLessThan(360);
      }
      // After even number of toggles, should return to original
      expect(rotation).toBe(45);
    });
  });

  describe('Unified property-based rotation (no type-specific checks)', () => {
    it('should rotate any element with rotation property regardless of type', () => {
      // Simulate the unified rule: 'rotation' in el && typeof rotation === 'number'
      const elementsWithRotation = [
        { id: 'eq1', type: 'equipment', equipmentType: 'goal', position: { x: 100, y: 100 }, rotation: 0, color: '#fff', scale: 1, variant: 'standard' },
        { id: 'eq2', type: 'equipment', equipmentType: 'mannequin', position: { x: 200, y: 200 }, rotation: 90, color: '#fff', scale: 1, variant: 'standard' },
        { id: 'eq3', type: 'equipment', equipmentType: 'cone', position: { x: 300, y: 300 }, rotation: 180, color: '#fff', scale: 1, variant: 'standard' },
        { id: 'eq4', type: 'equipment', equipmentType: 'ladder', position: { x: 400, y: 400 }, rotation: 270, color: '#fff', scale: 1, variant: 'standard' },
      ];

      for (const el of elementsWithRotation) {
        const result = transformElementForOrientation(
          el as any,
          { orientation: 'portrait' },
          { orientation: 'landscape' }
        ) as any;

        // All should get -90 delta
        const expected = (el.rotation - 90 + 360) % 360;
        expect(result.rotation).toBe(expected);
      }
    });

    it('should not add rotation to elements without rotation property', () => {
      const ball = {
        id: 'b1',
        type: 'ball',
        position: { x: 500, y: 400 },
      };

      const result = transformElementForOrientation(
        ball as any,
        { orientation: 'portrait' },
        { orientation: 'landscape' }
      ) as any;

      expect(result.rotation).toBeUndefined();
    });
  });
});
