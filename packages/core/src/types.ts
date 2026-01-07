/**
 * Core types for TMC Studio tactical board
 */

/** 2D position on the board */
export interface Position {
  x: number;
  y: number;
}

/** Team identifier */
export type Team = 'home' | 'away';

/** Player shape types */
export type PlayerShape = 'circle' | 'square' | 'triangle' | 'diamond';

/** Unique identifier for board elements */
export type ElementId = string;

/** Base properties for all board elements */
export interface BoardElementBase {
  id: ElementId;
  position: Position;
}

/** Player element on the board */
export interface PlayerElement extends BoardElementBase {
  type: 'player';
  team: Team;
  number: number;
  label?: string;
  shape?: PlayerShape; // Default: 'circle'
  showLabel?: boolean; // Show label instead of number
  fontSize?: number; // Custom font size (default: 12)
  textColor?: string; // Custom text color (overrides team color)
  opacity?: number; // Element opacity 0-1 (default: 1)
  isGoalkeeper?: boolean; // Uses team's goalkeeperColor instead of primaryColor
}

/** Ball element on the board */
export interface BallElement extends BoardElementBase {
  type: 'ball';
}

/** Arrow types for tactical movements */
export type ArrowType = 'pass' | 'run';

/** Arrow element (pass/run lines) */
export interface ArrowElement {
  id: ElementId;
  type: 'arrow';
  arrowType: ArrowType;
  startPoint: Position;
  endPoint: Position;
  curveControl?: Position; // Optional bezier control point
  color?: string;
  strokeWidth?: number;
}

/** Zone shape types */
export type ZoneShape = 'rect' | 'ellipse';

/** Zone element (highlighted areas) */
export interface ZoneElement {
  id: ElementId;
  type: 'zone';
  position: Position; // Top-left corner
  width: number;
  height: number;
  shape: ZoneShape;
  fillColor: string;
  opacity: number;
  borderStyle?: 'solid' | 'dashed' | 'none';
  borderColor?: string;
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
export type EquipmentVariant = 'standard' | 'mini' | 'tall' | 'flat';

/** Drawing element for freehand/highlight strokes */
export interface DrawingElement {
  id: ElementId;
  type: 'drawing';
  drawingType: DrawingType;
  points: number[]; // Flat array [x1, y1, x2, y2, ...]
  color: string;
  strokeWidth: number;
  opacity: number;
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

/** Get pitch dimensions based on orientation */
export function getPitchDimensions(orientation: PitchOrientation): PitchConfig {
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

/** Team settings for customization */
export interface TeamSetting {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  goalkeeperColor?: string; // Optional GK jersey color (default: #fbbf24 yellow)
}

/** Team settings for both teams */
export interface TeamSettings {
  home: TeamSetting;
  away: TeamSetting;
}

/** Default team settings */
export const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  home: { name: 'Home', primaryColor: '#ef4444', secondaryColor: '#ffffff' },
  away: { name: 'Away', primaryColor: '#3b82f6', secondaryColor: '#ffffff' },
};

/** Pitch theme presets */
export type PitchTheme = 'grass' | 'indoor' | 'chalk' | 'futsal' | 'custom';

/** Pitch visual settings */
export type PitchOrientation = 'landscape' | 'portrait';

/** Pitch view options (which part of the pitch to show) */
export type PitchView = 
  | 'full'           // Całe boisko
  | 'half-left'      // Lewa połowa (z bramką)
  | 'half-right'     // Prawa połowa (z bramką)
  | 'center'         // Środek boiska (bez pól karnych)
  | 'attacking-third' // Tercja ataku
  | 'defensive-third' // Tercja obrony
  | 'penalty-area'   // Tylko pole karne
  | 'plain';         // Bez linii - czysta trawa

/** Line visibility settings */
export interface PitchLineSettings {
  showOutline: boolean;      // Obwód boiska
  showCenterLine: boolean;   // Linia środkowa
  showCenterCircle: boolean; // Koło środkowe
  showPenaltyAreas: boolean; // Pola karne (duże)
  showGoalAreas: boolean;    // Pola bramkowe (małe)
  showCornerArcs: boolean;   // Łuki rożne
  showPenaltySpots: boolean; // Punkty karne
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
};

export interface PitchSettings {
  theme: PitchTheme;
  primaryColor: string;
  stripeColor: string;
  lineColor: string;
  showStripes: boolean;
  orientation: PitchOrientation;
  view: PitchView;
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
}

/** History entry for undo/redo */
export interface HistoryEntry {
  elements: BoardElement[];
  selectedIds: ElementId[];
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
