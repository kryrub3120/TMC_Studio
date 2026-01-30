/**
 * Equipment Module
 * Centralized exports for equipment rendering system
 */

import { GoalShape } from './goal';
import { LadderShape } from './ladder';
import { HurdleShape } from './hurdle';
import { ConeShape } from './cone';
import { MannequinShape } from './mannequin';
import { HoopShape } from './hoop';
import { PoleShape } from './pole';

/**
 * Equipment renderer map
 * Maps equipment type to its shape component
 */
export const EQUIPMENT_RENDERERS = {
  goal: GoalShape,
  ladder: LadderShape,
  hurdle: HurdleShape,
  cone: ConeShape,
  mannequin: MannequinShape,
  hoop: HoopShape,
  pole: PoleShape,
} as const;

export type EquipmentType = keyof typeof EQUIPMENT_RENDERERS;

// Re-export utilities
export { getEquipmentHitBounds } from './hitBounds';
export type { EquipmentShapeProps } from './types';
