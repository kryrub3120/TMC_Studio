/**
 * Serialization utilities for TMC Studio board documents
 */

import {
  BoardDocument,
  BoardElement,
  PitchConfig,
  DEFAULT_PITCH_CONFIG,
  TeamSettings,
  DEFAULT_TEAM_SETTINGS,
} from './types.js';
import { createInitialBoard } from './board.js';
import { createStep } from './step.js';

/** Current document version */
export const DOCUMENT_VERSION = '1.0.0';

/** LocalStorage key for board data */
export const STORAGE_KEY = 'tmc-studio-board';

/** Create a new empty document */
export function createDocument(
  name: string = 'Untitled Board',
  pitchConfig: PitchConfig = DEFAULT_PITCH_CONFIG,
  teamSettings: TeamSettings = DEFAULT_TEAM_SETTINGS
): BoardDocument {
  const now = new Date().toISOString();
  const initialElements = createInitialBoard(pitchConfig);
  const initialStep = createStep(initialElements, 'Initial Setup');

  return {
    version: DOCUMENT_VERSION,
    name,
    createdAt: now,
    updatedAt: now,
    currentStepIndex: 0,
    steps: [initialStep],
    pitchConfig,
    teamSettings,
  };
}

/** Serialize document to JSON string */
export function serializeDocument(document: BoardDocument): string {
  return JSON.stringify(document, null, 2);
}

/** Deserialize document from JSON string */
export function deserializeDocument(json: string): BoardDocument | null {
  try {
    const parsed = JSON.parse(json);
    
    // Validate required fields
    if (
      !parsed.version ||
      !parsed.steps ||
      !Array.isArray(parsed.steps) ||
      !parsed.pitchConfig
    ) {
      console.error('Invalid document format');
      return null;
    }

    // Migrate if needed (future versions)
    return migrateDocument(parsed);
  } catch (error) {
    console.error('Failed to parse document:', error);
    return null;
  }
}

/** Migrate document to current version (for future use) */
function migrateDocument(doc: BoardDocument): BoardDocument {
  // Add teamSettings if missing (backward compatibility)
  const teamSettings = doc.teamSettings ?? DEFAULT_TEAM_SETTINGS;
  
  return {
    ...doc,
    version: DOCUMENT_VERSION,
    updatedAt: new Date().toISOString(),
    teamSettings,
  };
}

/** Save document to localStorage */
export function saveToLocalStorage(document: BoardDocument): boolean {
  try {
    const json = serializeDocument({
      ...document,
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
}

/** Load document from localStorage */
export function loadFromLocalStorage(): BoardDocument | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return deserializeDocument(json);
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

/** Clear document from localStorage */
export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Check if document exists in localStorage */
export function hasLocalStorageDocument(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/** Export document as downloadable file */
export function exportDocument(boardDoc: BoardDocument, filename?: string): void {
  const json = serializeDocument(boardDoc);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = globalThis.document.createElement('a') as HTMLAnchorElement;
  link.href = url;
  link.download = filename ?? `${boardDoc.name.replace(/\s+/g, '-')}.tmc.json`;
  globalThis.document.body.appendChild(link);
  link.click();
  globalThis.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Import document from file */
export function importDocument(file: File): Promise<BoardDocument | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        resolve(deserializeDocument(content));
      } else {
        resolve(null);
      }
    };
    
    reader.onerror = () => {
      console.error('Failed to read file');
      resolve(null);
    };
    
    reader.readAsText(file);
  });
}

/** Create document snapshot for history */
export function createSnapshot(
  elements: BoardElement[],
  selectedIds: string[]
): { elements: BoardElement[]; selectedIds: string[]; timestamp: number } {
  return {
    elements: structuredClone(elements),
    selectedIds: [...selectedIds],
    timestamp: Date.now(),
  };
}
