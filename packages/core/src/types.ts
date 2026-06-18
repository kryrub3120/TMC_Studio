/**
 * Core types for TMC Studio tactical board
 */

/** 2D position on the board */
export interface Position {
  x: number;
  y: number;
}

/** Team identifier (home/away kept for back-compat = Team 1/Team 2) */
export type Team = 'home' | 'away' | 'team3' | 'team4';

/** Player shape types */
export type PlayerShape = 'circle' | 'square' | 'triangle' | 'diamond';

/** Unique identifier for board elements */
export type ElementId = string;

/** Base properties for all board elements */
export interface BoardElementBase {
  id: ElementId;
  position: Position;
  zIndex?: number; // Optional for backward compatibility - PR-UX-2
  /** Optional element lock. Missing/false means the element is editable/movable. */
  locked?: boolean;
}

/** Player element on the board */
export interface PlayerElement extends BoardElementBase {
  type: 'player';
  team: Team;
  number?: number | null; // Optional - null or undefined means no number displayed
  label?: string;
  shape?: PlayerShape; // Default: 'circle'
  showLabel?: boolean; // Show label instead of number
  fontSize?: number; // Custom font size (default: 12)
  textColor?: string; // Custom text color (overrides team color)
  opacity?: number; // Element opacity 0-1 (default: 1)
  isGoalkeeper?: boolean; // Uses team's goalkeeperColor instead of primaryColor (takes precedence over number-based detection)
  radius?: number; // Custom player size (default: 18 from PlayerNode)
  color?: string; // Per-player fill color override (if undefined, uses team color)
  orientation?: number; // Player body orientation in degrees (0-359, 0 = north/top). undefined = feature OFF for this player
  /**
   * Per-player vision override.
   * - undefined: inherit global (show if playerOrientationSettings.showVision === true)
   * - false:     explicitly hidden for this player (overrides global ON)
   * - true:      explicitly shown (but still requires global to be ON)
   * ALWAYS check via `=== false` (not !== true) to preserve global inheritance.
   */
  showVision?: boolean;
}

/** Ball element on the board */
export interface BallElement extends BoardElementBase {
  type: 'ball';
  /** Fill color (default: #ffffff) */
  color?: string;
  /** Stroke color (default: #1a1a1a) */
  strokeColor?: string;
  /** Stroke width in pixels (default: 2) */
  strokeWidth?: number;
  /**
   * Ball variant:
   * - 'single' (default): a single ball
   * - 'cluster': a pile/group of balls that drags as one element
   */
  variant?: 'single' | 'cluster';
}

/** Arrow types for tactical movements */
export type ArrowType = 'pass' | 'run' | 'shoot' | 'dribble';

/** Arrow head types */
export type ArrowHead = 'arrow' | 'none' | 'bar' | 'dot';

/** Arrow element (pass/run lines) */
export interface ArrowElement {
  id: ElementId;
  type: 'arrow';
  locked?: boolean;
  arrowType: ArrowType;
  startPoint: Position;
  endPoint: Position;
  curveControl?: Position; // Optional bezier control point
  color?: string;
  strokeWidth?: number;
  zIndex?: number; // PR-UX-2
  /** Optional sequence number for tactical arrow labeling */
  number?: number;
  /** Whether to display the sequence number on the arrow */
  showNumber?: boolean;
  /** Arrow head at the start end (default: 'none') */
  startHead?: ArrowHead;
  /** Arrow head at the end tip (default: 'arrow') */
  endHead?: ArrowHead;
}

/** Zone shape types */
export type ZoneShape = 'rect' | 'ellipse' | 'polygon';

/** Zone element (highlighted areas) */
export interface ZoneElement {
  id: ElementId;
  type: 'zone';
  locked?: boolean;
  position: Position; // Top-left corner (bounding-box top-left)
  width: number;
  height: number;
  shape: ZoneShape;
  fillColor: string;
  opacity: number;
  borderStyle?: 'solid' | 'dashed' | 'none';
  borderColor?: string;
  borderWidth?: number; // Default: 3
  showCorners?: boolean; // Corner markers on/off, default: false
  zIndex?: number; // PR-UX-2
  /**
   * Polygon vertices as a flat array [x1, y1, x2, y2, ...] in coordinates
   * RELATIVE to `position`. Only used when `shape === 'polygon'`.
   */
  points?: number[];
}

/** Text element for labels/annotations */
export interface TextElement extends BoardElementBase {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  backgroundColor?: string; // Optional background for better visibility
}

/** Drawing types for coach tools */
export type DrawingType = 'freehand' | 'highlighter';

/** Equipment types for training */
export type EquipmentType = 'goal' | 'mannequin' | 'cone' | 'ladder' | 'hoop' | 'hurdle' | 'pole';

/** Equipment variants */
export type EquipmentVariant = 'standard' | 'mini' | 'tall' | 'flat' | 'wall_3';

/** Drawing element for freehand/highlight strokes */
export interface DrawingElement {
  id: ElementId;
  type: 'drawing';
  locked?: boolean;
  drawingType: DrawingType;
  points: number[]; // Flat array [x1, y1, x2, y2, ...]
  color: string;
  strokeWidth: number;
  opacity: number;
  zIndex?: number; // PR-UX-2
}

/** Equipment element for training props */
export interface EquipmentElement extends BoardElementBase {
  type: 'equipment';
  equipmentType: EquipmentType;
  variant: EquipmentVariant;
  rotation: number;     // 0-360 degrees
  color: string;        // Main color
  scale: number;        // Size multiplier (0.5 - 2.0)
}

/** Union type for all board elements */
export type BoardElement = PlayerElement | BallElement | ArrowElement | ZoneElement | TextElement | DrawingElement | EquipmentElement;

/** Pitch dimensions configuration */
export interface PitchConfig {
  width: number;
  height: number;
  padding: number;
  gridSize: number;
}

/** Default pitch configuration (based on standard proportions) */
export const DEFAULT_PITCH_CONFIG: PitchConfig = {
  width: 1050, // Standard pitch ratio (105m x 68m scaled)
  height: 680,
  padding: 40,
  gridSize: 10,
};

export const HALF_BOARD_DEPTH_M = 64;
export const PENALTY_BOARD_DEPTH_M = 43;

/** Team settings for customization */
export interface TeamSetting {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  goalkeeperColor?: string; // Optional GK jersey color (default: #fbbf24 yellow)
}

/** Team settings (home/away required; team3/team4 optional for back-compat) */
export interface TeamSettings {
  home: TeamSetting;
  away: TeamSetting;
  team3?: TeamSetting;
  team4?: TeamSetting;
}

/** Default team settings */
export const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  // Goalkeeper colors are deliberately distinct from every team's outfield
  // color (and from each other) so the GK always stands out on the pitch.
  home: { name: 'Team 1', primaryColor: '#ef4444', secondaryColor: '#ffffff', goalkeeperColor: '#fbbf24' }, // red outfield → amber/yellow GK
  away: { name: 'Team 2', primaryColor: '#3b82f6', secondaryColor: '#ffffff', goalkeeperColor: '#f97316' }, // blue outfield → orange GK
  team3: { name: 'Team 3', primaryColor: '#22c55e', secondaryColor: '#ffffff', goalkeeperColor: '#ec4899' }, // green outfield → pink GK
  team4: { name: 'Team 4', primaryColor: '#f97316', secondaryColor: '#ffffff', goalkeeperColor: '#06b6d4' }, // orange outfield → cyan GK
};

/** Pitch theme presets */
export type PitchTheme = 'grass' | 'indoor' | 'chalk' | 'futsal' | 'custom';

/** Pitch visual settings */
export type PitchOrientation = 'landscape' | 'portrait';

/** Pitch view options (which part of the pitch to show) */
export type PitchView = 
  | 'full'           // Całe boisko
  | 'half'           // Połowa boiska (z bramką), orientacja decyduje pion/poziom
  | 'half-left'      // Lewa połowa (z bramką)
  | 'half-right'     // Prawa połowa (z bramką)
  | 'center'         // Środek boiska (bez pól karnych)
  | 'attacking-third' // Tercja ataku
  | 'defensive-third' // Tercja obrony
  | 'penalty-area'   // Tylko pole karne
  | 'plain';         // Bez linii - czysta trawa

/** Get pitch dimensions based on orientation and cropped board view. */
export function getPitchDimensions(
  orientation: PitchOrientation,
  view: PitchView = 'full',
): PitchConfig {
  const metresToPx = DEFAULT_PITCH_CONFIG.width / 105;
  const fullWidthPx = DEFAULT_PITCH_CONFIG.height;
  const halfLengthPx = HALF_BOARD_DEPTH_M * metresToPx;
  const penaltyDepthPx = PENALTY_BOARD_DEPTH_M * metresToPx;

  if (view === 'half') {
    return orientation === 'portrait'
      ? {
          width: fullWidthPx,
          height: halfLengthPx,
          padding: DEFAULT_PITCH_CONFIG.padding,
          gridSize: DEFAULT_PITCH_CONFIG.gridSize,
        }
      : {
          width: halfLengthPx,
          height: fullWidthPx,
          padding: DEFAULT_PITCH_CONFIG.padding,
          gridSize: DEFAULT_PITCH_CONFIG.gridSize,
        };
  }

  if (view === 'penalty-area') {
    return orientation === 'portrait'
      ? {
          width: fullWidthPx,
          height: penaltyDepthPx,
          padding: DEFAULT_PITCH_CONFIG.padding,
          gridSize: DEFAULT_PITCH_CONFIG.gridSize,
        }
      : {
          width: penaltyDepthPx,
          height: fullWidthPx,
          padding: DEFAULT_PITCH_CONFIG.padding,
          gridSize: DEFAULT_PITCH_CONFIG.gridSize,
        };
  }

  if (orientation === 'portrait') {
    return {
      width: DEFAULT_PITCH_CONFIG.height, // Swap width and height
      height: DEFAULT_PITCH_CONFIG.width,
      padding: DEFAULT_PITCH_CONFIG.padding,
      gridSize: DEFAULT_PITCH_CONFIG.gridSize,
    };
  }
  return DEFAULT_PITCH_CONFIG;
}

/** Pitch projection / rendering style */
export type PitchProjection =
  | 'flat'          // Klasyczny widok 2D z góry
  | 'perspective';  // Widok 3D / skos

/** Line visibility settings */
export interface PitchLineSettings {
  showOutline: boolean;      // Obwód boiska
  showCenterLine: boolean;   // Linia środkowa
  showCenterCircle: boolean; // Koło środkowe
  showPenaltyAreas: boolean; // Pola karne (duże)
  showGoalAreas: boolean;    // Pola bramkowe (małe)
  showCornerArcs: boolean;   // Łuki rożne
  showPenaltySpots: boolean; // Punkty karne
  showGoals: boolean;        // Bramki (overlay)
}

/** Default line settings - all visible */
export const DEFAULT_LINE_SETTINGS: PitchLineSettings = {
  showOutline: true,
  showCenterLine: true,
  showCenterCircle: true,
  showPenaltyAreas: true,
  showGoalAreas: true,
  showCornerArcs: true,
  showPenaltySpots: true,
  showGoals: true,
};

export interface PitchSettings {
  theme: PitchTheme;
  primaryColor: string;
  stripeColor: string;
  lineColor: string;
  showStripes: boolean;
  orientation: PitchOrientation;
  view: PitchView;
  /** Rendering style of the board (default 'flat' for back-compat). */
  projection?: PitchProjection;
  lines: PitchLineSettings;
}

/** Pitch theme definitions */
export const PITCH_THEMES: Record<PitchTheme, Omit<PitchSettings, 'theme'>> = {
  grass: {
    primaryColor: '#2d8a3e',
    stripeColor: '#268735',
    lineColor: 'rgba(255, 255, 255, 0.85)',
    showStripes: true,
    orientation: 'landscape',
    view: 'full',
    lines: DEFAULT_LINE_SETTINGS,
  },
  indoor: {
    primaryColor: '#c4a35a',
    stripeColor: '#b8974d',
    lineColor: 'rgba(255, 255, 255, 0.9)',
    showStripes: false,
    orientation: 'landscape',
    view: 'full',
    lines: DEFAULT_LINE_SETTINGS,
  },
  chalk: {
    primaryColor: '#3b5249',
    stripeColor: '#334944',
    lineColor: 'rgba(255, 255, 255, 0.95)',
    showStripes: true,
    orientation: 'landscape',
    view: 'full',
    lines: DEFAULT_LINE_SETTINGS,
  },
  futsal: {
    primaryColor: '#2563eb',
    stripeColor: '#1d4ed8',
    lineColor: 'rgba(255, 255, 255, 0.9)',
    showStripes: false,
    orientation: 'landscape',
    view: 'full',
    lines: DEFAULT_LINE_SETTINGS,
  },
  custom: {
    primaryColor: '#2d8a3e',
    stripeColor: '#268735',
    lineColor: 'rgba(255, 255, 255, 0.85)',
    showStripes: true,
    orientation: 'landscape',
    view: 'full',
    lines: DEFAULT_LINE_SETTINGS,
  },
};

/** Default pitch settings */
export const DEFAULT_PITCH_SETTINGS: PitchSettings = {
  theme: 'grass',
  ...PITCH_THEMES.grass,
};

/** Plain pitch preset (no lines) */
export const PLAIN_PITCH_LINES: PitchLineSettings = {
  showOutline: false,
  showCenterLine: false,
  showCenterCircle: false,
  showPenaltyAreas: false,
  showGoalAreas: false,
  showCornerArcs: false,
  showPenaltySpots: false,
  showGoals: false,
};

/** Identifier for a selectable board preset (pitch + view + projection). */
export type PitchBoardId = 'full' | 'half-2d' | 'penalty-2d';

/** A selectable board preset shown in the pitch view picker. */
export interface PitchBoardPreset {
  id: PitchBoardId;
  /** i18n label key. */
  labelKey: string;
  view: PitchView;
  orientation: PitchOrientation;
  projection: PitchProjection;
}

/**
 * The 3 selectable boards.
 * 'full' is the default. Region boards are flat tactical crops; 3D/skos
 * variants were removed because they distorted the coaching view.
 */
export const PITCH_BOARDS: readonly PitchBoardPreset[] = [
  { id: 'full',       labelKey: 'pitchPanel.boardFull',      view: 'full',         orientation: 'landscape', projection: 'flat' },
  { id: 'half-2d',    labelKey: 'pitchPanel.boardHalf2d',    view: 'half',         orientation: 'portrait',  projection: 'flat' },
  { id: 'penalty-2d', labelKey: 'pitchPanel.boardPenalty2d', view: 'penalty-area', orientation: 'portrait',  projection: 'flat' },
] as const;

/** The default board id. */
export const DEFAULT_PITCH_BOARD_ID: PitchBoardId = 'full';

/** Resolve the active board id from pitch settings (falls back to 'full'). */
export function getPitchBoardId(
  settings: Pick<PitchSettings, 'view' | 'projection'>,
): PitchBoardId {
  if (settings.view === 'half') return 'half-2d';
  if (settings.view === 'penalty-area') return 'penalty-2d';
  return 'full';
}

/** Player orientation feature settings (Pro feature) */
export interface PlayerOrientationSettings {
  enabled: boolean;        // Master toggle for whole document
  showArms: boolean;      // V1: cosmetic arms (listening=false)
  showVision: boolean;    // Show vision cone behind player
  zoomThreshold: number;  // Min zoom % to show orientation (default 40)
}

/** Default player orientation settings */
export const DEFAULT_PLAYER_ORIENTATION_SETTINGS: PlayerOrientationSettings = {
  enabled: false,
  showArms: false,
  showVision: false,
  zoomThreshold: 40,
};

/** Board state containing all elements */
export interface BoardState {
  elements: BoardElement[];
  selectedIds: ElementId[];
  pitchConfig: PitchConfig;
}

/** A single step in the animation */
export interface Step {
  id: string;
  name: string;
  elements: BoardElement[];
  duration: number; // milliseconds
}

/** Default player creation preferences (per-document) */
export interface PlayerDefaults {
  /** If true, new players get auto-numbered (uses getNextPlayerNumber). If false, no number assigned. */
  autoNumber: boolean;
  /** Starting number offset (0 = start from 1, 50 = start from 51). Only applies when autoNumber=true. */
  numberOffset: number;
  /** Default shape for new home players (undefined = team-based fallback: triangle for home) */
  homeShape?: PlayerShape;
  /** Default shape for new away players (undefined = team-based fallback: circle for away) */
  awayShape?: PlayerShape;
  /** Default fill color override for new home players (undefined = team primaryColor) */
  homeColor?: string;
  /** Default fill color override for new away players (undefined = team primaryColor) */
  awayColor?: string;
}

/** User-level default style for newly created arrows. */
export interface ArrowDefaults {
  /** Default line thickness per arrow type. */
  strokeWidth: { pass: number; run: number; shoot: number; dribble: number };
  /** Default start-cap for new arrows. */
  startHead: ArrowHead;
  /** Default end-cap for new arrows. */
  endHead: ArrowHead;
}

/** Built-in arrow defaults (match createArrow per-type strokes). */
export const DEFAULT_ARROW_DEFAULTS: ArrowDefaults = {
  strokeWidth: { pass: 4, run: 3, shoot: 5, dribble: 4 },
  startHead: 'none',
  endHead: 'arrow',
};

/** User-level default style for newly created zones. */
export interface ZoneDefaults {
  borderStyle: 'solid' | 'dashed' | 'none';
  borderWidth: number;
  /** undefined = derive a darker shade of the fill color at render time. */
  borderColor?: string;
  showCorners: boolean;
  fillColor: string;
  opacity: number;
}

/** Built-in zone defaults (match createZone). */
export const DEFAULT_ZONE_DEFAULTS: ZoneDefaults = {
  borderStyle: 'none',
  borderWidth: 3,
  showCorners: false,
  fillColor: '#ef4444',
  opacity: 0.25,
};

/** A predefined player in the squad bench (Pro feature) */
export interface SquadPlayer {
  id: string;
  name: string;
  number: number;
  team: Team;
}

/** Default squad bench — empty (user defines their own) */
export const DEFAULT_SQUAD: SquadPlayer[] = [];

/** Default player defaults */
export const DEFAULT_PLAYER_DEFAULTS: PlayerDefaults = {
  autoNumber: false,
  numberOffset: 0,
};

/** Complete board document for save/load */
export interface BoardDocument {
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentStepIndex: number;
  steps: Step[];
  pitchConfig: PitchConfig;
  teamSettings?: TeamSettings; // Optional for backward compatibility
  pitchSettings?: PitchSettings; // Optional for backward compatibility
  playerOrientationSettings?: PlayerOrientationSettings; // Optional for backward compatibility
  playerDefaults?: PlayerDefaults; // Optional for backward compatibility
  /** Squad bench — predefined players (Pro feature) */
  squad?: SquadPlayer[];
  /** Whether squad bench UI is visible */
  squadVisible?: boolean;
}

/** History entry for undo/redo */
export interface HistoryEntry {
  elements: BoardElement[];
  selectedIds: ElementId[];
  groups?: {
    id: string;
    name: string;
    memberIds: ElementId[];
    locked: boolean;
    visible: boolean;
  }[];
  timestamp: number;
}

/** Type guards */
export function isPlayerElement(element: BoardElement): element is PlayerElement {
  return element.type === 'player';
}

export function isBallElement(element: BoardElement): element is BallElement {
  return element.type === 'ball';
}

export function isArrowElement(element: BoardElement): element is ArrowElement {
  return element.type === 'arrow';
}

export function isZoneElement(element: BoardElement): element is ZoneElement {
  return element.type === 'zone';
}

export function isTextElement(element: BoardElement): element is TextElement {
  return element.type === 'text';
}

export function isDrawingElement(element: BoardElement): element is DrawingElement {
  return element.type === 'drawing';
}

export function isEquipmentElement(element: BoardElement): element is EquipmentElement {
  return element.type === 'equipment';
}

/** Check if element has a single position (player, ball, zone, text, equipment) */
export function hasPosition(element: BoardElement): element is PlayerElement | BallElement | ZoneElement | TextElement {
  return 'position' in element;
}

/** PR-UX-2: Default z-indexes by element type */
export const DEFAULT_Z_INDEXES: Record<string, number> = {
  zone: 10,
  arrow: 20,
  drawing: 30,
  player: 40,
  ball: 50,
  equipment: 60,
  text: 70,
};

/** PR-UX-2: Get element's effective z-index (uses zIndex property or default by type) */
export function getElementZIndex(element: BoardElement): number {
  return element.zIndex ?? DEFAULT_Z_INDEXES[element.type] ?? 0;
}
