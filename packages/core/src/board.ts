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
  DrawingElement,
  Position,
  Team,
  ElementId,
  PitchConfig,
  DEFAULT_PITCH_CONFIG,
  ArrowType,
  ZoneShape,
  EquipmentType,
  EquipmentVariant,
  DrawingType,
  PlayerShape,
  SquadPlayer,
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

/** Options for creating a new player element */
export interface CreatePlayerOptions {
  position: Position;
  team: Team;
  number?: number | null; // undefined/null = no number displayed
  isGoalkeeper?: boolean; // undefined = backward-compat (renderer falls back to number===1)
  shape?: PlayerShape;
  color?: string;
  orientation?: number | null; // null = feature OFF, number = explicit degrees
  radius?: number;
  label?: string;
  showLabel?: boolean;
  gridSize?: number;
}

/** Create a new player element */
export function createPlayer(options: CreatePlayerOptions): PlayerElement {
  const {
    position,
    team,
    number,
    isGoalkeeper,
    shape,
    color,
    orientation,
    radius,
    label,
    showLabel,
    gridSize = DEFAULT_PITCH_CONFIG.gridSize,
  } = options;

  const result: PlayerElement = {
    id: generateId(),
    type: 'player',
    position: snapToGrid(position, gridSize),
    team,
    number: number ?? undefined,
    shape: shape ?? (
      team === 'home' ? 'triangle' :
      team === 'away' ? 'circle' :
      team === 'team3' ? 'square' : 'diamond'
    ),
    isGoalkeeper: isGoalkeeper ?? false,
    orientation: orientation ?? 0, // Explicit default (north/up) — required for deterministic orientation transforms on pitch flip
  };

  // Only include defined optional fields
  if (color !== undefined) result.color = color;
  if (radius !== undefined) result.radius = radius;
  if (label !== undefined) result.label = label;
  if (showLabel !== undefined) result.showLabel = showLabel;
  if (orientation === null) result.orientation = undefined;

  return result;
}

/** Generate a unique ID for squad players */
export function generateSquadId(): string {
  return `squad-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Create a new squad player entry */
export function createSquadPlayer(name: string, number: number, team: Team): SquadPlayer {
  return {
    id: generateSquadId(),
    name,
    number,
    team,
  };
}

/** Create a new ball element */
export function createBall(
  position: Position,
  gridSize: number = DEFAULT_PITCH_CONFIG.gridSize,
  variant: 'single' | 'cluster' = 'single'
): BallElement {
  return {
    id: generateId(),
    type: 'ball',
    position: snapToGrid(position, gridSize),
    color: '#ffffff',
    strokeColor: '#1a1a1a',
    strokeWidth: 2,
    variant,
  };
}

/** Create a new arrow element */
export function createArrow(
  startPoint: Position,
  arrowType: ArrowType = 'pass',
  gridSize: number = DEFAULT_PITCH_CONFIG.gridSize
): ArrowElement {
  const snappedStart = snapToGrid(startPoint, gridSize);
  // Default colors: pass = dark gray, run = orange, shoot = red, dribble = blue
  let defaultColor: string;
  let defaultStroke: number;
  
  switch (arrowType) {
    case 'pass':
      defaultColor = '#1a1a1a'; // Dark gray
      defaultStroke = 4;
      break;
    case 'run':
      defaultColor = '#f97316'; // Orange
      defaultStroke = 3;
      break;
    case 'shoot':
      defaultColor = '#ef4444'; // Red
      defaultStroke = 5; // Thicker for shoot
      break;
    case 'dribble':
      defaultColor = '#1d4ed8'; // Tactical blue
      defaultStroke = 4;
      break;
    default:
      defaultColor = '#1a1a1a';
      defaultStroke = 4;
  }
  
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
    showNumber: false,
  };
}

/** Create a new zone element */
export function createZone(
  position: Position,
  shape: ZoneShape = 'rect',
  gridSize: number = DEFAULT_PITCH_CONFIG.gridSize
): ZoneElement {
  const base: ZoneElement = {
    id: generateId(),
    type: 'zone',
    position: snapToGrid(position, gridSize),
    width: 120,
    height: 80,
    shape,
    fillColor: '#ef4444', // Red default
    opacity: 0.25,
    borderStyle: 'none',
  };
  if (shape === 'polygon') {
    // Default to a triangle relative to position (used only as a fallback;
    // interactive drawing supplies real vertices via createPolygonZone).
    base.points = [0, 0, 120, 0, 60, 80];
  }
  return base;
}

/**
 * Create a polygon zone from absolute world-space vertices.
 * Computes the bounding-box top-left as `position` and stores `points`
 * relative to that origin.
 */
export function createPolygonZone(
  absolutePoints: number[]
): ZoneElement {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < absolutePoints.length; i += 2) {
    xs.push(absolutePoints[i]);
    ys.push(absolutePoints[i + 1]);
  }
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const relative: number[] = [];
  for (let i = 0; i < absolutePoints.length; i += 2) {
    relative.push(absolutePoints[i] - minX, absolutePoints[i + 1] - minY);
  }
  return {
    id: generateId(),
    type: 'zone',
    position: { x: minX, y: minY },
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
    shape: 'polygon',
    fillColor: '#ef4444',
    opacity: 0.25,
    borderStyle: 'solid',
    borderColor: '#ef4444',
    points: relative,
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
    fontSize: options?.fontSize ?? 22,
    fontFamily: options?.fontFamily ?? 'Inter',
    color: options?.color ?? '#ffffff',
    backgroundColor: options?.backgroundColor ?? '#ef4444',
    bold: options?.bold ?? false,
    italic: options?.italic ?? false,
  };
}

/** Default drawing colors */
const DRAWING_DEFAULTS: Record<DrawingType, Pick<DrawingElement, 'color' | 'strokeWidth' | 'opacity'>> = {
  freehand: { color: '#ff0000', strokeWidth: 3, opacity: 1.0 },
  highlighter: { color: '#ffff00', strokeWidth: 20, opacity: 0.4 },
};

/** Create a new drawing element (freehand / highlighter) */
export function createDrawing(
  drawingType: DrawingType,
  points: number[],
): DrawingElement {
  const defaults = DRAWING_DEFAULTS[drawingType];
  return {
    id: generateId(),
    type: 'drawing',
    drawingType,
    points,
    color: defaults.color,
    strokeWidth: defaults.strokeWidth,
    opacity: defaults.opacity,
  };
}

/** Default colors for equipment types */
const EQUIPMENT_COLORS: Record<EquipmentType, string> = {
  goal: '#ffffff',      // White goal posts
  mannequin: '#fbbf24', // Yellow mannequin (PTU-style)
  cone: '#f97316',      // Orange cone
  ladder: '#eab308',    // Yellow ladder
  hoop: '#ef4444',      // Red hoop
  hurdle: '#4a4a4a',    // Dark gray hurdle
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
    createPlayer({
      position: pos,
      team,
      number: index + 1,
      gridSize: pitchConfig.gridSize,
    })
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
