/**
 * Board operations for TMC Studio
 */

import {
  BoardElement,
  PlayerElement,
  BallElement,
  Position,
  Team,
  ElementId,
  PitchConfig,
  DEFAULT_PITCH_CONFIG,
} from './types.js';

/** Generate a unique ID */
export function generateId(): ElementId {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Snap position to grid */
export function snapToGrid(position: Position, gridSize: number): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

/** Create a new player element */
export function createPlayer(
  position: Position,
  team: Team,
  number: number,
  gridSize: number = DEFAULT_PITCH_CONFIG.gridSize
): PlayerElement {
  return {
    id: generateId(),
    type: 'player',
    position: snapToGrid(position, gridSize),
    team,
    number,
  };
}

/** Create a new ball element */
export function createBall(
  position: Position,
  gridSize: number = DEFAULT_PITCH_CONFIG.gridSize
): BallElement {
  return {
    id: generateId(),
    type: 'ball',
    position: snapToGrid(position, gridSize),
  };
}

/** Update element position */
export function moveElement(
  element: BoardElement,
  newPosition: Position,
  gridSize: number = DEFAULT_PITCH_CONFIG.gridSize
): BoardElement {
  return {
    ...element,
    position: snapToGrid(newPosition, gridSize),
  };
}

/** Duplicate an element with new ID and offset position */
export function duplicateElement(
  element: BoardElement,
  offset: Position = { x: 20, y: 20 }
): BoardElement {
  return {
    ...element,
    id: generateId(),
    position: {
      x: element.position.x + offset.x,
      y: element.position.y + offset.y,
    },
  };
}

/** Duplicate multiple elements */
export function duplicateElements(
  elements: BoardElement[],
  offset: Position = { x: 20, y: 20 }
): BoardElement[] {
  return elements.map((el) => duplicateElement(el, offset));
}

/** Find element by ID */
export function findElementById(
  elements: BoardElement[],
  id: ElementId
): BoardElement | undefined {
  return elements.find((el) => el.id === id);
}

/** Filter elements by IDs */
export function filterElementsByIds(
  elements: BoardElement[],
  ids: ElementId[]
): BoardElement[] {
  return elements.filter((el) => ids.includes(el.id));
}

/** Remove elements by IDs */
export function removeElementsByIds(
  elements: BoardElement[],
  ids: ElementId[]
): BoardElement[] {
  return elements.filter((el) => !ids.includes(el.id));
}

/** Update elements in list */
export function updateElements(
  elements: BoardElement[],
  updates: BoardElement[]
): BoardElement[] {
  const updateMap = new Map(updates.map((el) => [el.id, el]));
  return elements.map((el) => updateMap.get(el.id) ?? el);
}

/** Check if position is within pitch bounds */
export function isWithinBounds(
  position: Position,
  pitchConfig: PitchConfig
): boolean {
  const { width, height, padding } = pitchConfig;
  return (
    position.x >= padding &&
    position.x <= width + padding &&
    position.y >= padding &&
    position.y <= height + padding
  );
}

/** Clamp position to pitch bounds */
export function clampToBounds(
  position: Position,
  pitchConfig: PitchConfig
): Position {
  const { width, height, padding } = pitchConfig;
  return {
    x: Math.max(padding, Math.min(width + padding, position.x)),
    y: Math.max(padding, Math.min(height + padding, position.y)),
  };
}

/** Get initial positions for a 4-4-2 formation */
export function getInitialFormation442(
  team: Team,
  pitchConfig: PitchConfig = DEFAULT_PITCH_CONFIG
): Position[] {
  const { width, height, padding } = pitchConfig;
  const isHome = team === 'home';
  const halfWidth = width / 2;
  
  // Positions are mirrored for away team
  const baseX = isHome ? padding + halfWidth * 0.15 : padding + width - halfWidth * 0.15;
  const multiplier = isHome ? 1 : -1;

  const positions: Position[] = [
    // GK
    { x: baseX, y: padding + height / 2 },
    // Defenders (4)
    { x: baseX + multiplier * halfWidth * 0.25, y: padding + height * 0.2 },
    { x: baseX + multiplier * halfWidth * 0.25, y: padding + height * 0.4 },
    { x: baseX + multiplier * halfWidth * 0.25, y: padding + height * 0.6 },
    { x: baseX + multiplier * halfWidth * 0.25, y: padding + height * 0.8 },
    // Midfielders (4)
    { x: baseX + multiplier * halfWidth * 0.55, y: padding + height * 0.2 },
    { x: baseX + multiplier * halfWidth * 0.55, y: padding + height * 0.4 },
    { x: baseX + multiplier * halfWidth * 0.55, y: padding + height * 0.6 },
    { x: baseX + multiplier * halfWidth * 0.55, y: padding + height * 0.8 },
    // Strikers (2)
    { x: baseX + multiplier * halfWidth * 0.8, y: padding + height * 0.35 },
    { x: baseX + multiplier * halfWidth * 0.8, y: padding + height * 0.65 },
  ];

  return positions;
}

/** Create initial lineup for a team */
export function createTeamLineup(
  team: Team,
  pitchConfig: PitchConfig = DEFAULT_PITCH_CONFIG
): PlayerElement[] {
  const positions = getInitialFormation442(team, pitchConfig);
  return positions.map((pos, index) =>
    createPlayer(pos, team, index + 1, pitchConfig.gridSize)
  );
}

/** Create initial board with both teams */
export function createInitialBoard(
  pitchConfig: PitchConfig = DEFAULT_PITCH_CONFIG
): BoardElement[] {
  const homeTeam = createTeamLineup('home', pitchConfig);
  const awayTeam = createTeamLineup('away', pitchConfig);
  return [...homeTeam, ...awayTeam];
}
