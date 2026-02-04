/**
 * Equipment Hit Bounds Calculator
 * Single source of truth for hit area calculation
 */
import type { EquipmentElement } from '@tmc/core';

/**
 * Calculate hit area bounds for equipment
 * Returns bounding box in local coordinates (relative to equipment position)
 */
export function getEquipmentHitBounds(element: EquipmentElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const { equipmentType, variant, scale } = element;

  switch (equipmentType) {
    case 'goal': {
      // V4 3D bounding box logic - MUST match GoalShape geometry
      const baseW = variant === 'mini' ? 54 : 110;
      const baseH = variant === 'mini' ? 30 : 44;
      const baseD = variant === 'mini' ? 16 : 26;
      
      const width = baseW * scale;
      const height = baseH * scale;
      const depth = baseD * scale;
      
      const dx = depth * 0.3;
      const dy = -depth * 0.6;
      
      // Hit area encompasses entire 3D bounding box + margin
      const margin = 8;
      const minX = -width/2 - margin;
      const maxX = width/2 + dx + margin;
      const minY = -height/2 + dy - margin;
      const maxY = height/2 + margin;
      
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    case 'ladder': {
      const width = 40 * scale;
      const rungCount = 5;
      const rungSpacing = 15 * scale;
      const height = rungSpacing * (rungCount - 1);
      return { x: -width/2, y: -rungSpacing * 2, width, height };
    }

    case 'hurdle': {
      const width = 50 * scale;
      const height = 25 * scale;
      return { x: -width/2, y: -height/2, width, height };
    }

    case 'cone': {
      const size = variant === 'tall' ? 28 : 20;
      const radius = size * scale;
      return { x: -radius, y: -radius, width: radius * 2, height: radius * 2 };
    }

    case 'mannequin': {
      // PTU-style geometry (scale=1 reference):
      // BASE_PLATE_W=30, LEGS_H=20, TORSO_H=36, HEAD_H=10, HEAD_GAP=7
      
      if (variant === 'flat') {
        const radiusX = 25 * scale;
        const radiusY = 8 * scale;
        return { x: -radiusX, y: -radiusY, width: radiusX * 2, height: radiusY * 2 };
      }
      
      if (variant === 'wall_3') {
        // 3 mannequins in a row: gap=18, basePlateW=30
        const gap = 18 * scale;
        const basePlateW = 30 * scale;
        const totalHeight = (20 + 36 + 7 + 10) * scale; // legs + torso + gap + head
        const margin = 8 * scale;
        
        const width = (gap * 2 + basePlateW) + margin * 2;
        const height = totalHeight + margin * 2;
        
        return { 
          x: -width / 2, 
          y: -height + margin, // pivot at y=0 (base)
          width, 
          height 
        };
      }
      
      // Single standing mannequin
      const basePlateW = 30 * scale;
      const legsH = 20 * scale;
      const torsoH = 36 * scale;
      const headGap = 7 * scale;
      const headH = 10 * scale;
      const basePlateH = 5 * scale;
      
      const totalHeight = legsH + torsoH + headGap + headH;
      const margin = 6 * scale;
      
      const width = basePlateW + margin * 2;
      const height = totalHeight + basePlateH / 2 + margin * 2;
      
      return { 
        x: -width / 2, 
        y: -totalHeight - margin, // extends from head to base plate bottom
        width, 
        height 
      };
    }

    case 'hoop': {
      const radius = 20 * scale;
      const strokeWidth = 4 * scale;
      const totalRadius = radius + strokeWidth;
      return { x: -totalRadius, y: -totalRadius, width: totalRadius * 2, height: totalRadius * 2 };
    }

    case 'pole': {
      const width = 10 * scale;
      const height = 55 * scale;
      return { x: -width/2, y: -height/2, width, height };
    }

    default:
      // Fallback for unknown types
      return { x: -40 * scale, y: -40 * scale, width: 80 * scale, height: 80 * scale };
  }
}
