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
}

/** Ball element on the board */
export interface BallElement extends BoardElementBase {
  type: 'ball';
}

/** Union type for all board elements */
export type BoardElement = PlayerElement | BallElement;

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
