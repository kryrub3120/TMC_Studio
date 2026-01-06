/**
 * Board operations for TMC Studio
 */

import {
  BoardElement,
  PlayerElement,
  BallElement,
  ArrowElement,
  ZoneElement,
  TextElement,
  EquipmentElement,
  Position,
  Team,
  ElementId,
  PitchConfig,
  DEFAULT_PITCH_CONFIG,
  ArrowType,
  ZoneShape,
  EquipmentType,
  EquipmentVariant,
  isArrowElement,
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
    shape: 'circle', // Default shape is circle
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

/** Create a new arrow element */
export function createArrow(
  startPoint: Position,
  arrowType: ArrowType = 'pass',
  gridSize: number = DEFAULT_PITCH_CONFIG.gridSize
): ArrowElement {
  const snappedStart = snapToGrid(startPoint, gridSize);
  // Default colors: pass = bright red, run = bright blue
  const defaultColor = arrowType === 'pass' ? '#ff0000' : '#3b82f6';
  const defaultStroke = arrowType === 'pass' ? 4 : 3;
  
  return {
    id: generateId(),
    type: 'arrow',
    arrowType,
    startPoint: snappedStart,
    endPoint: {
      x: snappedStart.x + 80,
      y: snappedStart.y,
    },
    color: defaultColor,
    strokeWidth: defaultStroke,
  };
}

/** Create a new zone element */
export function createZone(
  position: Position,
  shape: ZoneShape = 'rect',
  gridSize: number = DEFAULT_PITCH_CONFIG.gridSize
): ZoneElement {
  return {
    id: generateId(),
    type: 'zone',
    position: snapToGrid(position, gridSize),
    width: 120,
    height: 80,
    shape,
    fillColor: '#22c55e', // Green default
    opacity: 0.25,
    borderStyle: 'none',
  };
}

/** Create a new text element */
export function createText(
  position: Position,
  content: string = 'Text',
  options?: Partial<Omit<TextElement, 'id' | 'type' | 'position'>>
): TextElement {
  return {
    id: generateId(),
    type: 'text',
    position,
    content,
    fontSize: options?.fontSize ?? 18,
    fontFamily: options?.fontFamily ?? 'Inter',
    color: options?.color ?? '#ffffff',
    bold: options?.bold ?? false,
    italic: options?.italic ?? false,
  };
}

/** Default colors for equipment types */
const EQUIPMENT_COLORS: Record<EquipmentType, string> = {
  goal: '#ffffff',      // White goal posts
  mannequin: '#1e40af', // Blue mannequin
  cone: '#f97316',      // Orange cone
  ladder: '#fbbf24',    // Yellow ladder
  hoop: '#ef4444',      // Red hoop
  hurdle: '#22c55e',    // Green hurdle
  pole: '#f97316',      // Orange pole
};

/** Create a new equipment element */
export function createEquipment(
  position: Position,
  equipmentType: EquipmentType,
  variant: EquipmentVariant = 'standard',
  gridSize: number = DEFAULT_PITCH_CONFIG.gridSize
): EquipmentElement {
  return {
    id: generateId(),
    type: 'equipment',
    position: snapToGrid(position, gridSize),
    equipmentType,
    variant,
    rotation: 0,
    color: EQUIPMENT_COLORS[equipmentType],
    scale: 1.0,
  };
}

/** Update element position (handles arrows differently) */
export function moveElement(
  element: BoardElement,
  newPosition: Position,
  gridSize: number = DEFAULT_PITCH_CONFIG.gridSize
): BoardElement {
  if (isArrowElement(element)) {
    // For arrows, move both endpoints by the delta
    const oldCenter = {
      x: (element.startPoint.x + element.endPoint.x) / 2,
      y: (element.startPoint.y + element.endPoint.y) / 2,
    };
    const snapped = snapToGrid(newPosition, gridSize);
    const dx = snapped.x - oldCenter.x;
    const dy = snapped.y - oldCenter.y;
    return {
      ...element,
      startPoint: { x: element.startPoint.x + dx, y: element.startPoint.y + dy },
      endPoint: { x: element.endPoint.x + dx, y: element.endPoint.y + dy },
    };
  }
  // Elements with position (player, ball, zone)
  return {
    ...element,
    position: snapToGrid(newPosition, gridSize),
  } as BoardElement;
}

/** Duplicate an element with new ID and offset position */
export function duplicateElement(
  element: BoardElement,
  offset: Position = { x: 20, y: 20 }
): BoardElement {
  if (isArrowElement(element)) {
    return {
      ...element,
      id: generateId(),
      startPoint: {
        x: element.startPoint.x + offset.x,
        y: element.startPoint.y + offset.y,
      },
      endPoint: {
        x: element.endPoint.x + offset.x,
        y: element.endPoint.y + offset.y,
      },
    };
  }
  // Elements with position (player, ball, zone)
  const el = element as PlayerElement | BallElement | ZoneElement;
  return {
    ...el,
    id: generateId(),
    position: {
      x: el.position.x + offset.x,
      y: el.position.y + offset.y,
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
