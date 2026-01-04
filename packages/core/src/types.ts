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

/** Union type for all board elements */
export type BoardElement = PlayerElement | BallElement | ArrowElement | ZoneElement | TextElement;

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

/** Team settings for customization */
export interface TeamSetting {
  name: string;
  primaryColor: string;
  secondaryColor: string;
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

export interface PitchSettings {
  theme: PitchTheme;
  primaryColor: string;
  stripeColor: string;
  lineColor: string;
  showStripes: boolean;
  orientation: PitchOrientation;
}

/** Pitch theme definitions */
export const PITCH_THEMES: Record<PitchTheme, Omit<PitchSettings, 'theme'>> = {
  grass: {
    primaryColor: '#2d8a3e',
    stripeColor: '#268735',
    lineColor: 'rgba(255, 255, 255, 0.85)',
    showStripes: true,
    orientation: 'landscape',
  },
  indoor: {
    primaryColor: '#c4a35a',
    stripeColor: '#b8974d',
    lineColor: 'rgba(255, 255, 255, 0.9)',
    showStripes: false,
    orientation: 'landscape',
  },
  chalk: {
    primaryColor: '#3b5249',
    stripeColor: '#334944',
    lineColor: 'rgba(255, 255, 255, 0.95)',
    showStripes: true,
    orientation: 'landscape',
  },
  futsal: {
    primaryColor: '#2563eb',
    stripeColor: '#1d4ed8',
    lineColor: 'rgba(255, 255, 255, 0.9)',
    showStripes: false,
    orientation: 'landscape',
  },
  custom: {
    primaryColor: '#2d8a3e',
    stripeColor: '#268735',
    lineColor: 'rgba(255, 255, 255, 0.85)',
    showStripes: true,
    orientation: 'landscape',
  },
};

/** Default pitch settings */
export const DEFAULT_PITCH_SETTINGS: PitchSettings = {
  theme: 'grass',
  ...PITCH_THEMES.grass,
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

/** Check if element has a single position (player, ball, zone, text) */
export function hasPosition(element: BoardElement): element is PlayerElement | BallElement | ZoneElement | TextElement {
  return 'position' in element;
}
