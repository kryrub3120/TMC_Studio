/**
 * Football Formation Templates
 * Positions are in percentages (0-100) of pitch dimensions
 * 
 * ORIENTATION (HORIZONTAL PITCH):
 * - X axis: 0 = LEFT goal, 100 = RIGHT goal
 * - Y axis: 0 = TOP touchline, 100 = BOTTOM touchline
 * 
 * - Home team: GK on LEFT (x=5%), attack at midfield (~45%)
 * - Away team: GK on RIGHT (x=95%), attack at midfield (~55%)
 */

export interface FormationPosition {
  /** X position as percentage (0 = left goal, 50 = center, 100 = right goal) */
  x: number;
  /** Y position as percentage (0 = top, 50 = center, 100 = bottom) */
  y: number;
  /** Player role abbreviation */
  role: string;
  /** Default jersey number for this position */
  defaultNumber: number;
}

export interface Formation {
  id: string;
  name: string;
  /** Short name like "4-3-3" */
  shortName: string;
  /** 11 player positions - for HOME team (left half, GK on left) */
  positions: FormationPosition[];
}

/**
 * All available formations
 * Positions are for HOME TEAM (GK on left side, attack toward center)
 * For AWAY team, X positions are mirrored (100 - x) so GK is on right
 */
export const formations: Formation[] = [
  {
    id: '4-3-3',
    name: '4-3-3 Classic',
    shortName: '4-3-3',
    positions: [
      // GK on left
      { x: 4, y: 50, role: 'GK', defaultNumber: 1 },
      // Defense line (~12-16%)
      { x: 14, y: 15, role: 'LB', defaultNumber: 3 },
      { x: 12, y: 38, role: 'CB', defaultNumber: 4 },
      { x: 12, y: 62, role: 'CB', defaultNumber: 5 },
      { x: 14, y: 85, role: 'RB', defaultNumber: 2 },
      // Midfield line (~28-32%)
      { x: 30, y: 30, role: 'CM', defaultNumber: 8 },
      { x: 26, y: 50, role: 'CDM', defaultNumber: 6 },
      { x: 30, y: 70, role: 'CM', defaultNumber: 10 },
      // Attack line (~42-46%, before midfield)
      { x: 44, y: 15, role: 'LW', defaultNumber: 11 },
      { x: 46, y: 50, role: 'ST', defaultNumber: 9 },
      { x: 44, y: 85, role: 'RW', defaultNumber: 7 },
    ],
  },
  {
    id: '4-4-2',
    name: '4-4-2 Flat',
    shortName: '4-4-2',
    positions: [
      { x: 4, y: 50, role: 'GK', defaultNumber: 1 },
      // Defense
      { x: 14, y: 15, role: 'LB', defaultNumber: 3 },
      { x: 12, y: 38, role: 'CB', defaultNumber: 4 },
      { x: 12, y: 62, role: 'CB', defaultNumber: 5 },
      { x: 14, y: 85, role: 'RB', defaultNumber: 2 },
      // Midfield (flat line)
      { x: 30, y: 12, role: 'LM', defaultNumber: 11 },
      { x: 28, y: 38, role: 'CM', defaultNumber: 8 },
      { x: 28, y: 62, role: 'CM', defaultNumber: 6 },
      { x: 30, y: 88, role: 'RM', defaultNumber: 7 },
      // Attack (two strikers)
      { x: 44, y: 38, role: 'ST', defaultNumber: 9 },
      { x: 44, y: 62, role: 'ST', defaultNumber: 10 },
    ],
  },
  {
    id: '4-4-2-diamond',
    name: '4-4-2 Diamond',
    shortName: '4-4-2 ♦',
    positions: [
      { x: 4, y: 50, role: 'GK', defaultNumber: 1 },
      // Defense
      { x: 14, y: 15, role: 'LB', defaultNumber: 3 },
      { x: 12, y: 38, role: 'CB', defaultNumber: 4 },
      { x: 12, y: 62, role: 'CB', defaultNumber: 5 },
      { x: 14, y: 85, role: 'RB', defaultNumber: 2 },
      // Diamond midfield
      { x: 22, y: 50, role: 'CDM', defaultNumber: 6 },
      { x: 30, y: 28, role: 'CM', defaultNumber: 8 },
      { x: 30, y: 72, role: 'CM', defaultNumber: 7 },
      { x: 38, y: 50, role: 'CAM', defaultNumber: 10 },
      // Attack
      { x: 46, y: 38, role: 'ST', defaultNumber: 9 },
      { x: 46, y: 62, role: 'ST', defaultNumber: 11 },
    ],
  },
  {
    id: '4-2-3-1',
    name: '4-2-3-1',
    shortName: '4-2-3-1',
    positions: [
      { x: 4, y: 50, role: 'GK', defaultNumber: 1 },
      // Defense
      { x: 14, y: 15, role: 'LB', defaultNumber: 3 },
      { x: 12, y: 38, role: 'CB', defaultNumber: 4 },
      { x: 12, y: 62, role: 'CB', defaultNumber: 5 },
      { x: 14, y: 85, role: 'RB', defaultNumber: 2 },
      // Double pivot
      { x: 24, y: 38, role: 'CDM', defaultNumber: 6 },
      { x: 24, y: 62, role: 'CDM', defaultNumber: 8 },
      // Attacking midfield trio
      { x: 36, y: 15, role: 'LW', defaultNumber: 11 },
      { x: 34, y: 50, role: 'CAM', defaultNumber: 10 },
      { x: 36, y: 85, role: 'RW', defaultNumber: 7 },
      // Lone striker
      { x: 46, y: 50, role: 'ST', defaultNumber: 9 },
    ],
  },
  {
    id: '3-5-2',
    name: '3-5-2',
    shortName: '3-5-2',
    positions: [
      { x: 4, y: 50, role: 'GK', defaultNumber: 1 },
      // 3 center backs
      { x: 12, y: 25, role: 'CB', defaultNumber: 3 },
      { x: 10, y: 50, role: 'CB', defaultNumber: 4 },
      { x: 12, y: 75, role: 'CB', defaultNumber: 5 },
      // 5 midfielders (wingbacks + 3 central)
      { x: 28, y: 8, role: 'LWB', defaultNumber: 11 },
      { x: 26, y: 30, role: 'CM', defaultNumber: 8 },
      { x: 23, y: 50, role: 'CDM', defaultNumber: 6 },
      { x: 26, y: 70, role: 'CM', defaultNumber: 10 },
      { x: 28, y: 92, role: 'RWB', defaultNumber: 2 },
      // 2 strikers
      { x: 44, y: 38, role: 'ST', defaultNumber: 9 },
      { x: 44, y: 62, role: 'ST', defaultNumber: 7 },
    ],
  },
  {
    id: '5-3-2',
    name: '5-3-2',
    shortName: '5-3-2',
    positions: [
      { x: 4, y: 50, role: 'GK', defaultNumber: 1 },
      // 5 defenders (3 CB + 2 wingbacks)
      { x: 16, y: 8, role: 'LWB', defaultNumber: 3 },
      { x: 12, y: 28, role: 'CB', defaultNumber: 4 },
      { x: 10, y: 50, role: 'CB', defaultNumber: 5 },
      { x: 12, y: 72, role: 'CB', defaultNumber: 6 },
      { x: 16, y: 92, role: 'RWB', defaultNumber: 2 },
      // 3 midfielders
      { x: 30, y: 30, role: 'CM', defaultNumber: 8 },
      { x: 28, y: 50, role: 'CDM', defaultNumber: 10 },
      { x: 30, y: 70, role: 'CM', defaultNumber: 7 },
      // 2 strikers
      { x: 44, y: 38, role: 'ST', defaultNumber: 9 },
      { x: 44, y: 62, role: 'ST', defaultNumber: 11 },
    ],
  },
];

/** Get formation by ID */
export function getFormationById(id: string): Formation | undefined {
  return formations.find((f) => f.id === id);
}

/** Get all formation IDs */
export function getFormationIds(): string[] {
  return formations.map((f) => f.id);
}

/** 
 * Convert formation positions to absolute pitch coordinates
 * @param formation - Formation to convert
 * @param pitchWidth - Actual pitch width in pixels
 * @param pitchHeight - Actual pitch height in pixels
 * @param padding - Pitch padding in pixels
 * @param mirror - If true, mirror X positions (for Away team: GK on right)
 */
export function getAbsolutePositions(
  formation: Formation,
  pitchWidth: number,
  pitchHeight: number,
  padding: number,
  mirror: boolean = false
): Array<{ x: number; y: number; role: string; number: number }> {
  return formation.positions.map((pos) => {
    // Mirror X for away team: x=4% becomes x=96%, x=46% becomes x=54%
    const xPercent = mirror ? (100 - pos.x) : pos.x;
    const x = padding + (xPercent / 100) * pitchWidth;
    const y = padding + (pos.y / 100) * pitchHeight;
    
    return {
      x,
      y,
      role: pos.role,
      number: pos.defaultNumber,
    };
  });
}

export default formations;
