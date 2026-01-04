/**
 * Formation presets for TMC Studio
 * This file contains placeholder schemas for future formation presets
 */

import type { Position, Team, PitchConfig } from '@tmc/core';

/** Formation definition schema */
export interface FormationPreset {
  id: string;
  name: string;
  code: string; // e.g., "4-4-2", "4-3-3"
  description?: string;
  positions: Position[];
}

/** Available formation presets */
export const FORMATIONS: FormationPreset[] = [
  {
    id: 'formation-442',
    name: '4-4-2',
    code: '4-4-2',
    description: 'Classic balanced formation with 4 defenders, 4 midfielders, and 2 strikers',
    positions: [], // Will be calculated based on pitch config
  },
  {
    id: 'formation-433',
    name: '4-3-3',
    code: '4-3-3',
    description: 'Attacking formation with wide wingers',
    positions: [],
  },
  {
    id: 'formation-352',
    name: '3-5-2',
    code: '3-5-2',
    description: 'Wing-back formation with strong midfield presence',
    positions: [],
  },
  {
    id: 'formation-4231',
    name: '4-2-3-1',
    code: '4-2-3-1',
    description: 'Modern formation with double pivot and attacking midfield',
    positions: [],
  },
  {
    id: 'formation-541',
    name: '5-4-1',
    code: '5-4-1',
    description: 'Defensive formation with 5 at the back',
    positions: [],
  },
];

/**
 * Get formation positions for a specific team and pitch configuration
 * @placeholder - Will be implemented with actual position calculations
 */
export function getFormationPositions(
  _formation: FormationPreset,
  _team: Team,
  _pitchConfig: PitchConfig
): Position[] {
  // Placeholder - will be implemented in future
  return [];
}

/**
 * Find formation by ID
 */
export function findFormationById(id: string): FormationPreset | undefined {
  return FORMATIONS.find((f) => f.id === id);
}

/**
 * Find formation by code
 */
export function findFormationByCode(code: string): FormationPreset | undefined {
  return FORMATIONS.find((f) => f.code === code);
}
