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
      if (variant === 'flat') {
        const radiusX = 25 * scale;
        const radiusY = 8 * scale;
        return { x: -radiusX, y: -radiusY, width: radiusX * 2, height: radiusY * 2 };
      }
      
      const bodyHeight = 45 * scale;
      const bodyWidth = 12 * scale;
      const headRadius = 8 * scale;
      const baseWidth = 20 * scale;
      
      const width = Math.max(bodyWidth, baseWidth) + 10;
      const height = bodyHeight + headRadius * 2 + 13; // head + body + base
      return { x: -width/2, y: -height/2 - headRadius, width, height };
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
