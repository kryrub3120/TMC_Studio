/**
 * Elements Slice - CRUD operations for board elements
 */

import type { StateCreator } from 'zustand';
import type {
  BoardElement,
  Position,
  Team,
  ElementId,
  PlayerElement,
  ArrowType,
  ZoneShape,
  EquipmentType,
  EquipmentVariant,
  PlayerDefaults,
  PlayerShape,
  ArrowElement,
  ZoneElement,
} from '@tmc/core';
import {
  DEFAULT_PITCH_CONFIG,
  DEFAULT_PLAYER_DEFAULTS,
  DEFAULT_TEAM_SETTINGS,
  getPitchDimensions,
  createPlayer,
  createBall,
  createArrow,
  createZone,
  createText,
  createEquipment,
  createDrawing,
  moveElement,
  snapToGrid,
  duplicateElements,
  removeElementsByIds,
  filterElementsByIds,
  isPlayerElement,
  isArrowElement,
  isTextElement,
} from '@tmc/core';
import type { AppState } from '../types';
import { getFormationById, getAbsolutePositions } from '@tmc/presets';
import { SHARED_COLORS } from '@tmc/ui';
import { useUIStore } from '../useUIStore';
import { track, EVENTS } from '../../lib/analytics';

const getGridSize = () => useUIStore.getState().gridSize ?? DEFAULT_PITCH_CONFIG.gridSize;
const getSnapEnabled = () => useUIStore.getState().snapEnabled !== false;

const getBoardCenter = (
  document: AppState['document'],
  offset: Position = { x: 0, y: 0 },
): Position => {
  const settings = document.pitchSettings;
  const pitch = getPitchDimensions(settings?.orientation ?? 'landscape', settings?.view ?? 'full');
  return {
    x: pitch.padding + pitch.width / 2 + offset.x,
    y: pitch.padding + pitch.height / 2 + offset.y,
  };
};

/**
 * Goalkeeper jersey palette used by the cycleGoalkeeperColor shortcut (Shift+G).
 * Colors are chosen to contrast with the usual outfield colors.
 */
const GOALKEEPER_PALETTE = [
  '#fbbf24', // amber / yellow
  '#f97316', // orange
  '#22c55e', // green
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#84cc16', // lime
  '#111111', // black
];

/** Get next available player number, with optional offset */
function getNextPlayerNumber(elements: BoardElement[], team: Team, offset: number = 0): number {
  const teamPlayers = elements.filter(
    (el) => isPlayerElement(el) && el.team === team
  ) as PlayerElement[];
  // Filter out null/undefined numbers before checking
  const numbers = teamPlayers.map((p) => p.number).filter((n): n is number => n != null);
  let next = 1 + offset;
  while (numbers.includes(next)) {
    next++;
  }
  return next;
}

/** Resolve player creation defaults from document settings */
function resolvePlayerDefaults(
  team: Team,
  defaults: PlayerDefaults
): { number?: number | null; shape?: PlayerShape; color?: string } {
  const result: { number?: number | null; shape?: PlayerShape; color?: string } = {};
  
  if (defaults.autoNumber) {
    // number resolved at call site (needs elements array)
    result.number = undefined; // signal "will be resolved later"
  } else {
    result.number = null;
  }
  
  result.shape = team === 'home' ? defaults.homeShape : team === 'away' ? defaults.awayShape : undefined;
  result.color = team === 'home' ? defaults.homeColor : team === 'away' ? defaults.awayColor : undefined;
  
  return result;
}

/** PR-ARROW-NUMBER: Get highest arrow number across all arrows (0 if none) */
function getHighestArrowNumber(elements: BoardElement[]): number {
  const numbers = elements
    .filter(isArrowElement)
    .map((a) => a.number)
    .filter((n): n is number => n != null);
  return numbers.length > 0 ? Math.max(...numbers) : 0;
}

/** Get highest arrow number among VISIBLE arrows (showNumber=true). Returns 0 if none */
function getHighestVisibleArrowNumber(elements: BoardElement[]): number {
  const numbers = elements
    .filter(isArrowElement)
    .filter((a) => a.showNumber === true)
    .map((a) => a.number)
    .filter((n): n is number => n != null);
  return numbers.length > 0 ? Math.max(...numbers) : 0;
}

/** Get set of numbers used by visible arrows */
function getVisibleArrowNumbers(elements: BoardElement[]): Set<number> {
  const numbers = elements
    .filter(isArrowElement)
    .filter((a) => a.showNumber === true)
    .map((a) => a.number)
    .filter((n): n is number => n != null);
  return new Set(numbers);
}

export interface ElementsSlice {
  // State
  elements: BoardElement[];
  
  // Core CRUD
  setElements: (elements: BoardElement[]) => void;
  addElement: (element: BoardElement) => void;
  
  // Convenience creators
  addPlayerAtCursor: (team: Team) => void;
  addPlayerFromSquad: (team: Team, name: string, number: number, position?: Position, isGoalkeeper?: boolean) => void;
  addBallAtCursor: () => void;
  addBallGroupAtCursor: () => void;
  addArrowAtCursor: (arrowType: ArrowType) => void;
  addZoneAtCursor: (shape?: ZoneShape) => void;
  addTextAtCursor: () => void;
  addEquipmentAtCursor: (equipmentType: EquipmentType, variant?: EquipmentVariant) => void;

  // Locking
  toggleSelectedLock: () => void;
  lockSelected: () => void;
  unlockSelected: () => void;
  isElementLocked: (id: ElementId) => boolean;
  isElementBlockedByLockedGroup: (id: ElementId) => boolean;
  
  // Element updates
  updateTextContent: (id: ElementId, content: string) => void;
  updateTextProperties: (id: ElementId, updates: { fontSize?: number; bold?: boolean; italic?: boolean; fontFamily?: string; backgroundColor?: string }) => void;
  updatePlayerColor: (ids: ElementId[], color: string) => void;
  updateTextColor: (ids: ElementId[], color: string) => void;
  moveElementById: (id: ElementId, position: Position) => void;
  resizeZone: (id: ElementId, position: Position, width: number, height: number) => void;
  /** Replace polygon-zone vertices (flat array relative to zone.position) and push history. */
  updateZonePoints: (id: ElementId, points: number[]) => void;
  /** Set equipment scale absolutely (drag-resize handles). Clamped 0.25..3. */
  setEquipmentScale: (id: ElementId, scale: number) => void;
  updateArrowEndpoint: (id: ElementId, endpoint: 'start' | 'end' | 'control', position: Position) => void;
  /**
   * Goalkeeper shortcut (Shift+G): if a single outfield player is selected,
   * promote it to goalkeeper; otherwise cycle the relevant team's
   * goalkeeperColor through GOALKEEPER_PALETTE. Returns what happened so the
   * caller can show a toast.
   */
  cycleGoalkeeperColor: () => { team: Team; color: string; promoted: boolean };
  
  // Arrow numbering (PR-ARROW-NUMBER)
  toggleArrowNumber: (id: ElementId) => void;
  setArrowNumber: (id: ElementId, number: number | undefined) => void;
  renumberAllArrows: () => void;
  renumberAllArrowsWithHistory: () => void;
  /** Patch arrow style props (heads / color / strokeWidth) for a single arrow + push history. */
  updateArrowStyle: (id: ElementId, patch: Partial<Pick<ArrowElement, 'startHead' | 'endHead' | 'color' | 'strokeWidth'>>) => void;
  /** Patch zone style props (border / corners / fill) for a single zone + push history. */
  updateZoneStyle: (id: ElementId, patch: Partial<Pick<ZoneElement, 'borderStyle' | 'borderColor' | 'borderWidth' | 'showCorners' | 'fillColor' | 'opacity'>>) => void;
  
  // Batch operations on selected
  deleteSelected: () => void;
  duplicateSelected: () => void;
  updateSelectedElement: (updates: Partial<PlayerElement>) => void;
  /** Batch-apply updates to ALL selected player elements (multi-select editing). */
  updateSelectedElements: (updates: Partial<PlayerElement>) => void;
  nudgeSelected: (dx: number, dy: number) => void;
  
  // Property adjustments
  adjustSelectedStrokeWidth: (delta: number) => void;
  cycleSelectedColor: (direction: number) => void;
  cyclePlayerShape: () => void;
  cycleZoneShape: () => void;
  rotateSelected: (degrees: number) => void;
  resizeSelected: (scaleFactor: number) => void;
  scaleSelectedEquipmentBy: (factor: number) => void;
  
  // Freehand drawing
  finishFreehandDrawing: () => void;
  cancelFreehandDrawing: () => void;
  clearAllDrawings: () => void;
  
  // Formation
  applyFormation: (formationId: string, team: Team) => void;
  
  // B5: Resize popover (players only) - preview/commit separation
  previewSetPlayersRadius: (ids: ElementId[], radius: number) => void;
  commitSetPlayersRadius: (ids: ElementId[], radius: number) => void;
  previewResetPlayersRadius: (ids: ElementId[]) => void;
  commitResetPlayersRadius: (ids: ElementId[]) => void;
  
  // Player orientation (PR1)
  setPlayerOrientation: (ids: ElementId[], delta: number) => void;
  resetPlayerOrientation: (ids: ElementId[]) => void;
  
  // Per-player vision toggle
  togglePlayerVision: (ids: ElementId[]) => void;
  setPlayerVision: (ids: ElementId[], value: boolean) => void;
  
  // ALT+Drag rotation (preview/commit pattern)
  previewPlayerOrientationAbsolute: (id: ElementId, orientation: number) => void;
  commitPlayerOrientationAbsolute: (id: ElementId, orientation: number) => void;
}

export const createElementsSlice: StateCreator<
  AppState,
  [],
  [],
  ElementsSlice
> = (set, get) => ({
  elements: [],
  
  setElements: (elements) => {
    set({ elements });
    get().pushHistory();
  },
  
  addElement: (element) => {
    const prevLength = get().elements.length;
    set((state) => ({
      elements: [...state.elements, element],
      selectedIds: [element.id],
    }));
    get().pushHistory();
    // Track first element added (once per session)
    if (prevLength === 0) {
      track(EVENTS.FIRST_ELEMENT_ADDED, { type: element.type });
    }
  },
  
  addPlayerAtCursor: (team) => {
    const { cursorPosition, elements, document } = get();
    const position = cursorPosition ?? getBoardCenter(document);
    const defaults = document.playerDefaults ?? DEFAULT_PLAYER_DEFAULTS;
    const prefs = resolvePlayerDefaults(team, defaults);
    const number = prefs.number === undefined
      ? getNextPlayerNumber(elements, team, defaults.numberOffset)
      : prefs.number;
    const player = createPlayer({
      position,
      team,
      number,
      shape: prefs.shape,
      color: prefs.color,
      gridSize: getGridSize(),
    });
    get().addElement(player);
  },
  
  addPlayerFromSquad: (team, name, number, dropPosition, isGoalkeeper) => {
    const { cursorPosition, document } = get();
    const position = dropPosition ?? cursorPosition ?? getBoardCenter(document);
    const player = createPlayer({
      position,
      team,
      number,
      label: name,
      showLabel: true,
      isGoalkeeper: isGoalkeeper ?? number === 1,
      gridSize: getGridSize(),
    });
    get().addElement(player);
  },
  
  addBallAtCursor: () => {
    const { cursorPosition, document } = get();
    const position = cursorPosition ?? getBoardCenter(document);
    const ball = createBall(position, getGridSize());
    get().addElement(ball);
  },
  
  addBallGroupAtCursor: () => {
    const { cursorPosition, document } = get();
    const position = cursorPosition ?? getBoardCenter(document);
    const ball = createBall(position, getGridSize(), 'cluster');
    get().addElement(ball);
  },
  
  addArrowAtCursor: (arrowType) => {
    const { cursorPosition, elements, isAutoNumbering, document } = get();
    const position = cursorPosition ?? getBoardCenter(document);
    const arrow = createArrow(position, arrowType, getGridSize());
    // Apply user-level arrow defaults (thickness per type + heads).
    const aDefaults = useUIStore.getState().arrowDefaults;
    if (aDefaults) {
      arrow.strokeWidth = aDefaults.strokeWidth[arrowType] ?? arrow.strokeWidth;
      arrow.color = aDefaults.color?.[arrowType] ?? arrow.color;
      arrow.startHead = aDefaults.startHead;
      arrow.endHead = aDefaults.endHead;
    }
    if (isAutoNumbering) {
      const nextNum = getHighestArrowNumber(elements) + 1;
      arrow.number = nextNum;
      arrow.showNumber = true;
    }
    get().addElement(arrow);
  },
  
  addZoneAtCursor: (shape = 'rect') => {
    const { cursorPosition, document } = get();
    const position = cursorPosition ?? getBoardCenter(document, { x: -60, y: -40 });
    const zone = createZone(position, shape, getGridSize());
    // Apply user-level zone defaults (border + fill + opacity).
    const zDefaults = useUIStore.getState().zoneDefaults;
    if (zDefaults) {
      zone.borderStyle = zDefaults.borderStyle;
      zone.borderWidth = zDefaults.borderWidth;
      if (zDefaults.borderColor) zone.borderColor = zDefaults.borderColor;
      zone.showCorners = zDefaults.showCorners;
      zone.fillColor = zDefaults.fillColor;
      zone.opacity = zDefaults.opacity;
    }
    get().addElement(zone);
  },
  
  addTextAtCursor: () => {
    const { cursorPosition, document } = get();
    const position = cursorPosition ?? getBoardCenter(document);
    const text = createText(snapToGrid(position, getGridSize()), 'Text');
    get().addElement(text);
  },
  
  addEquipmentAtCursor: (equipmentType, variant = 'standard') => {
    const { cursorPosition, document } = get();
    const position = cursorPosition ?? getBoardCenter(document);
    const equipment = createEquipment(position, equipmentType, variant, getGridSize());
    get().addElement(equipment);
  },

  isElementBlockedByLockedGroup: (id) => {
    const { groups } = get();
    return groups.some((group) => group.locked && group.memberIds.includes(id));
  },

  isElementLocked: (id) => {
    const { elements } = get();
    const element = elements.find((el) => el.id === id);
    return element?.locked === true || get().isElementBlockedByLockedGroup(id);
  },

  lockSelected: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    const selected = new Set(selectedIds);
    set((state) => ({
      elements: state.elements.map((el) =>
        selected.has(el.id) ? { ...el, locked: true } : el
      ),
    }));
    get().pushHistory();
  },

  unlockSelected: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    const selected = new Set(selectedIds);
    set((state) => ({
      elements: state.elements.map((el) =>
        selected.has(el.id) ? { ...el, locked: false } : el
      ),
    }));
    get().pushHistory();
  },

  toggleSelectedLock: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.length === 0) return;
    const selected = new Set(selectedIds);
    const anyUnlocked = elements.some((el) =>
      selected.has(el.id) && el.locked !== true
    );
    set((state) => ({
      elements: state.elements.map((el) =>
        selected.has(el.id) ? { ...el, locked: anyUnlocked } : el
      ),
    }));
    get().pushHistory();
  },
  
  updateTextContent: (id, content) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (el.id === id && isTextElement(el)) {
          return { ...el, content };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  updateTextProperties: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (el.id === id && isTextElement(el)) {
          return { ...el, ...updates };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  updatePlayerColor: (ids, color) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (ids.includes(el.id) && isPlayerElement(el)) {
          return { ...el, color };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  updateTextColor: (ids, color) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (ids.includes(el.id) && isTextElement(el)) {
          return { ...el, color };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  moveElementById: (id, position) => {
    if (get().isElementLocked(id)) return;
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? moveElement(el, position, getGridSize(), getSnapEnabled()) : el
      ),
    }));
    // ⚠️ Don't push history on every move - only on drag end via endContinuous
  },
  
  resizeZone: (id, position, width, height) => {
    if (get().isElementLocked(id)) return;
    set((state) => ({
      elements: state.elements.map((el) => {
        if (el.id === id && el.type === 'zone') {
          return { ...el, position, width, height };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },

  updateZonePoints: (id, points) => {
    if (get().isElementLocked(id)) return;
    set((state) => ({
      elements: state.elements.map((el) => {
        if (el.id === id && el.type === 'zone') {
          // Recompute bounding box (width/height) from new points; keep position.
          let maxX = 0;
          let maxY = 0;
          for (let i = 0; i < points.length; i += 2) {
            if (points[i] > maxX) maxX = points[i];
            if (points[i + 1] > maxY) maxY = points[i + 1];
          }
          return { ...el, points, width: Math.max(1, maxX), height: Math.max(1, maxY) };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },

  setEquipmentScale: (id, scale) => {
    if (get().isElementLocked(id)) return;
    const clamped = Math.max(0.25, Math.min(3, scale));
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id && el.type === 'equipment' ? { ...el, scale: clamped } : el
      ),
    }));
    get().pushHistory();
  },
  
  updateArrowEndpoint: (id, endpoint, position) => {
    if (get().isElementLocked(id)) return;
    set((state) => ({
      elements: state.elements.map((el) => {
        if (el.id === id && isArrowElement(el)) {
          if (endpoint === 'start') {
            return { ...el, startPoint: position };
          } else if (endpoint === 'end') {
            return { ...el, endPoint: position };
          } else {
            // 'control' — bend the arrow into an arc. If the control point is
            // dragged back near the straight midpoint, snap the arrow straight
            // again by removing curveControl.
            const midX = (el.startPoint.x + el.endPoint.x) / 2;
            const midY = (el.startPoint.y + el.endPoint.y) / 2;
            const dist = Math.hypot(position.x - midX, position.y - midY);
            if (dist < 6) {
              const { curveControl: _drop, ...rest } = el;
              return rest;
            }
            return { ...el, curveControl: position };
          }
        }
        return el;
      }),
    }));
    // ⚠️ Don't push history during drag - only on drag end
  },

  cycleGoalkeeperColor: () => {
    const { selectedIds, elements } = get();
    const selectedPlayers = elements.filter(
      (el) => selectedIds.includes(el.id) && isPlayerElement(el)
    ) as PlayerElement[];

    // Case 1: a single outfield player is selected -> make it the goalkeeper.
    if (selectedPlayers.length === 1 && !selectedPlayers[0].isGoalkeeper) {
      const target = selectedPlayers[0];
      set({
        elements: elements.map((el) =>
          el.id === target.id && isPlayerElement(el)
            ? { ...el, isGoalkeeper: true }
            : el
        ),
      });
      get().pushHistory();
      const settings = get().getTeamSettings() ?? DEFAULT_TEAM_SETTINGS;
      const color =
        settings[target.team]?.goalkeeperColor ??
        DEFAULT_TEAM_SETTINGS[target.team]?.goalkeeperColor ??
        GOALKEEPER_PALETTE[0];
      return { team: target.team, color, promoted: true };
    }

    // Case 2: cycle the goalkeeperColor of the relevant team. Prefer the team of
    // a selected goalkeeper, then the first selected player, else 'home'.
    const gkPlayer = selectedPlayers.find((p) => p.isGoalkeeper);
    const team: Team = gkPlayer?.team ?? selectedPlayers[0]?.team ?? 'home';
    const settings = get().getTeamSettings() ?? DEFAULT_TEAM_SETTINGS;
    const current =
      settings[team]?.goalkeeperColor ??
      DEFAULT_TEAM_SETTINGS[team]?.goalkeeperColor ??
      GOALKEEPER_PALETTE[0];
    const idx = GOALKEEPER_PALETTE.findIndex(
      (c) => c.toLowerCase() === current.toLowerCase()
    );
    const next = GOALKEEPER_PALETTE[(idx + 1) % GOALKEEPER_PALETTE.length];
    get().updateTeamSettings(team, { goalkeeperColor: next });
    get().pushHistory();
    return { team, color: next, promoted: false };
  },
  
  toggleArrowNumber: (id) => {
    const { elements } = get();
    const arrow = elements.find((el) => el.id === id);
    if (!arrow || !isArrowElement(arrow)) return;

    const currentlyShown = arrow.showNumber === true && arrow.number !== undefined;

    if (currentlyShown) {
      // Toggle OFF — keep the number but hide it (remembered for later restore)
      set((state) => ({
        elements: state.elements.map((el) => {
          if (el.id === id && isArrowElement(el)) {
            return { ...el, showNumber: false };
          }
          return el;
        }),
      }));
    } else {
      // Toggle ON — restore or assign next free number
      const visibleNumbers = getVisibleArrowNumbers(elements);
      const storedNumber = arrow.number;

      if (storedNumber !== undefined && !visibleNumbers.has(storedNumber)) {
        // Restore remembered number (not used by any visible arrow)
        set((state) => ({
          elements: state.elements.map((el) => {
            if (el.id === id && isArrowElement(el)) {
              return { ...el, showNumber: true };
            }
            return el;
          }),
        }));
      } else {
        // Number is empty or already taken — assign next free after max visible
        const nextNumber = getHighestVisibleArrowNumber(elements) + 1;
        set((state) => ({
          elements: state.elements.map((el) => {
            if (el.id === id && isArrowElement(el)) {
              return { ...el, showNumber: true, number: nextNumber };
            }
            return el;
          }),
        }));
      }
    }
    get().pushHistory();
  },
  
  setArrowNumber: (id, number) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (el.id === id && isArrowElement(el)) {
          return {
            ...el,
            number: number,
            showNumber: number !== undefined,
          };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },

  updateArrowStyle: (id, patch) => {
    if (get().isElementLocked(id)) return;
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id && isArrowElement(el) ? { ...el, ...patch } : el
      ),
    }));
    get().pushHistory();
  },

  updateZoneStyle: (id, patch) => {
    if (get().isElementLocked(id)) return;
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id && el.type === 'zone' ? { ...el, ...patch } : el
      ),
    }));
    get().pushHistory();
  },
  
  renumberAllArrows: () => {
    const { elements } = get();

    // Assign sequential numbers 1..N in insertion order (array order)
    const numberMap = new Map<string, number>();
    elements.forEach((el) => {
      if (isArrowElement(el) && el.showNumber) {
        numberMap.set(el.id, numberMap.size + 1);
      }
    });
    if (numberMap.size === 0) return;

    set((state) => ({
      elements: state.elements.map((el) => {
        const newNum = numberMap.get(el.id);
        if (newNum !== undefined && isArrowElement(el)) {
          return { ...el, number: newNum };
        }
        return el;
      }),
    }));
    // UWAGA: NIE wołamy pushHistory() tutaj — wołamy go w deleteSelected
  },

  renumberAllArrowsWithHistory: () => {
    const hadNumberedArrows = get().elements.some(
      (el) => isArrowElement(el) && el.showNumber
    );
    if (!hadNumberedArrows) return;
    get().renumberAllArrows();
    get().pushHistory();
  },

  deleteSelected: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.length === 0) return;
    
    // Sprawdź czy usuwamy jakieś numerowane strzałki
    const hadNumberedArrows = selectedIds.some((id) => {
      const el = elements.find((e) => e.id === id);
      return el && isArrowElement(el) && el.showNumber;
    });
    
    set((state) => ({
      elements: removeElementsByIds(state.elements, selectedIds),
      selectedIds: [],
    }));
    
    // Renumeruj DOPIERO PO usunięciu — to NIE woła pushHistory
    if (hadNumberedArrows) {
      get().renumberAllArrows();
    }
    
    // JEDEN pushHistory na całą operację
    get().pushHistory();
  },
  
  duplicateSelected: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.length === 0) return;
    
    const selectedElements = filterElementsByIds(elements, selectedIds);
    const duplicated = duplicateElements(selectedElements, { x: 12, y: 12 });
    
    set((state) => ({
      elements: [...state.elements, ...duplicated],
      selectedIds: duplicated.map((el) => el.id),
    }));
    get().pushHistory();
  },
  
  updateSelectedElement: (updates) => {
    const { selectedIds, elements } = get();
    if (selectedIds.length !== 1) return;
    
    const id = selectedIds[0];
    set({
      elements: elements.map((el) => {
        if (el.id === id && isPlayerElement(el)) {
          return { ...el, ...updates };
        }
        return el;
      }),
    });
    get().pushHistory();
  },

  updateSelectedElements: (updates) => {
    const { selectedIds, elements } = get();
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    set({
      elements: elements.map((el) =>
        idSet.has(el.id) && isPlayerElement(el) ? { ...el, ...updates } : el
      ),
    });
    get().pushHistory();
  },
  
  nudgeSelected: (dx, dy) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    const movableIds = selectedIds.filter((id) => !get().isElementLocked(id));
    if (movableIds.length === 0) return;
    const movable = new Set(movableIds);
    
    set((state) => ({
      elements: state.elements.map((el) => {
        if (movable.has(el.id)) {
          if ('position' in el) {
            return {
              ...el,
              position: {
                x: (el.position as Position).x + dx,
                y: (el.position as Position).y + dy,
              },
            };
          }
          if (isArrowElement(el)) {
            return {
              ...el,
              startPoint: { x: el.startPoint.x + dx, y: el.startPoint.y + dy },
              endPoint: { x: el.endPoint.x + dx, y: el.endPoint.y + dy },
            };
          }
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  adjustSelectedStrokeWidth: (delta) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    
    set((state) => ({
      elements: state.elements.map((el) => {
        if (selectedIds.includes(el.id)) {
          if (isArrowElement(el)) {
            const current = el.strokeWidth ?? 3;
            const newWidth = Math.max(1, Math.min(10, current + delta));
            return { ...el, strokeWidth: newWidth };
          }
          if (el.type === 'zone') {
            const zone = el as { borderWidth?: number };
            const current = zone.borderWidth ?? 2;
            const newWidth = Math.max(0, Math.min(8, current + delta));
            return { ...el, borderWidth: newWidth };
          }
          if (el.type === 'drawing') {
            const drawing = el as { strokeWidth?: number };
            const current = drawing.strokeWidth ?? 3;
            const newWidth = Math.max(1, Math.min(30, current + delta * 2));
            return { ...el, strokeWidth: newWidth };
          }
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  cycleSelectedColor: (direction) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    
    set((state) => ({
      elements: state.elements.map((el) => {
        if (selectedIds.includes(el.id)) {
          // Arrows
          if (isArrowElement(el)) {
            const current = el.color ?? '#ffffff';
            const currentIndex = SHARED_COLORS.indexOf(current);
            const newIndex = currentIndex === -1 
              ? 0 
              : (currentIndex + direction + SHARED_COLORS.length) % SHARED_COLORS.length;
            return { ...el, color: SHARED_COLORS[newIndex] };
          }
          // Zones
          if (el.type === 'zone') {
            const zone = el as { fillColor?: string };
            const current = zone.fillColor ?? '#22c55e';
            const currentIndex = SHARED_COLORS.indexOf(current);
            const newIndex = currentIndex === -1 
              ? 0 
              : (currentIndex + direction + SHARED_COLORS.length) % SHARED_COLORS.length;
            return { ...el, fillColor: SHARED_COLORS[newIndex] };
          }
          // Drawings
          if (el.type === 'drawing') {
            const drawing = el as { color?: string };
            const current = drawing.color ?? '#ff0000';
            const currentIndex = SHARED_COLORS.indexOf(current);
            const newIndex = currentIndex === -1 
              ? 0 
              : (currentIndex + direction + SHARED_COLORS.length) % SHARED_COLORS.length;
            return { ...el, color: SHARED_COLORS[newIndex] };
          }
          // Players - cycle through player fill color (player.color)
          if (isPlayerElement(el)) {
            // Get current color (defaults handled in PlayerNode)
            const current = el.color ?? (el.team === 'home' ? '#3b82f6' : '#ef4444');
            const currentIndex = SHARED_COLORS.indexOf(current);
            const newIndex = currentIndex === -1 
              ? 0 
              : (currentIndex + direction + SHARED_COLORS.length) % SHARED_COLORS.length;
            return { ...el, color: SHARED_COLORS[newIndex] };
          }
          // Text - cycle text color
          if (isTextElement(el)) {
            const current = el.color ?? '#ffffff';
            const currentIndex = SHARED_COLORS.indexOf(current);
            const newIndex = currentIndex === -1 
              ? 0 
              : (currentIndex + direction + SHARED_COLORS.length) % SHARED_COLORS.length;
            return { ...el, color: SHARED_COLORS[newIndex] };
          }
          // Equipment - add color property if it has one
          if (el.type === 'equipment') {
            const equipment = el as { color?: string };
            const current = equipment.color ?? '#ffffff';
            const currentIndex = SHARED_COLORS.indexOf(current);
            const newIndex = currentIndex === -1 
              ? 0 
              : (currentIndex + direction + SHARED_COLORS.length) % SHARED_COLORS.length;
            return { ...el, color: SHARED_COLORS[newIndex] };
          }
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  cyclePlayerShape: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    
    const SHAPES: Array<'circle' | 'square' | 'triangle' | 'diamond'> = ['circle', 'square', 'triangle', 'diamond'];
    
    set((state) => ({
      elements: state.elements.map((el) => {
        if (selectedIds.includes(el.id) && isPlayerElement(el)) {
          const currentShape = el.shape || 'circle';
          const currentIndex = SHAPES.indexOf(currentShape);
          const newIndex = (currentIndex + 1) % SHAPES.length;
          return { ...el, shape: SHAPES[newIndex] };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  cycleZoneShape: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    
    const ZONE_SHAPES: Array<'rect' | 'ellipse'> = ['rect', 'ellipse'];
    
    set((state) => ({
      elements: state.elements.map((el) => {
        if (selectedIds.includes(el.id) && el.type === 'zone') {
          const zone = el as { shape?: 'rect' | 'ellipse' };
          const currentShape = zone.shape || 'rect';
          const currentIndex = ZONE_SHAPES.indexOf(currentShape);
          const newIndex = (currentIndex + 1) % ZONE_SHAPES.length;
          return { ...el, shape: ZONE_SHAPES[newIndex] };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  rotateSelected: (degrees) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    const movable = new Set(selectedIds.filter((id) => !get().isElementLocked(id)));
    if (movable.size === 0) return;
    
    set((state) => ({
      elements: state.elements.map((el) => {
        if (movable.has(el.id) && el.type === 'equipment') {
          const equipment = el as { rotation?: number };
          const currentRotation = equipment.rotation ?? 0;
          const newRotation = ((currentRotation + degrees) % 360 + 360) % 360;
          return { ...el, rotation: newRotation };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  resizeSelected: (scaleFactor) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    const resizable = new Set(selectedIds.filter((id) => !get().isElementLocked(id)));
    if (resizable.size === 0) return;
    
    // Clamp scale between 0.4 and 2.5 (40% to 250%)
    const clampedScale = Math.max(0.4, Math.min(2.5, scaleFactor));
    
    set((state) => ({
      elements: state.elements.map((el) => {
        if (resizable.has(el.id)) {
          // Players and Ball - scale radius
          if (isPlayerElement(el) || el.type === 'ball') {
            const element = el as { radius?: number };
            const defaultRadius = el.type === 'ball' ? 8 : 18; // B5: Fixed to match PlayerNode PLAYER_RADIUS
            const currentRadius = element.radius ?? defaultRadius;
            return { ...el, radius: currentRadius * clampedScale };
          }
          // Equipment - scale multiplicatively (consistent with players/zones/text)
          if (el.type === 'equipment') {
            const equipment = el as { scale?: number };
            return { ...el, scale: (equipment.scale ?? 1) * clampedScale };
          }
          // Zones - scale dimensions
          if (el.type === 'zone') {
            const zone = el as { width?: number; height?: number };
            return {
              ...el,
              width: (zone.width ?? 120) * clampedScale,
              height: (zone.height ?? 80) * clampedScale,
            };
          }
          // Text - scale font size
          if (isTextElement(el)) {
            const currentSize = el.fontSize ?? 18;
            return { ...el, fontSize: Math.round(currentSize * clampedScale) };
          }
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  scaleSelectedEquipmentBy: (factor) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    const resizable = new Set(selectedIds.filter((id) => !get().isElementLocked(id)));
    if (resizable.size === 0) return;
    
    set((state) => ({
      elements: state.elements.map((el) => {
        if (resizable.has(el.id) && el.type === 'equipment') {
          const equipment = el as { scale?: number };
          const currentScale = equipment.scale ?? 1;
          const newScale = Math.max(0.25, Math.min(3, currentScale * factor));
          return { ...el, scale: newScale };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  finishFreehandDrawing: () => {
    const { freehandPoints, freehandType } = get();
    if (!freehandPoints || freehandPoints.length < 4 || !freehandType) {
      set({ freehandPoints: null, freehandType: null });
      return;
    }
    
    const drawing = createDrawing(freehandType, freehandPoints);
    
    set((state) => ({
      elements: [...state.elements, drawing],
      selectedIds: [drawing.id],
      freehandPoints: null,
      freehandType: null,
    }));
    get().pushHistory();
  },
  
  cancelFreehandDrawing: () => {
    set({ freehandPoints: null, freehandType: null });
  },
  
  clearAllDrawings: () => {
    set((state) => ({
      elements: state.elements.filter((el) => el.type !== 'drawing'),
      selectedIds: state.selectedIds.filter((id) => 
        !state.elements.find((el) => el.id === id && el.type === 'drawing')
      ),
    }));
    get().pushHistory();
  },
  
  applyFormation: (formationId, team) => {
    const formation = getFormationById(formationId);
    if (!formation) return;
    
    const { elements, document } = get();
    
    // Get current pitch orientation from document settings
    const orientation = document.pitchSettings?.orientation ?? 'landscape';
    const pitch = getPitchDimensions(orientation, document.pitchSettings?.view ?? 'full');
    const pitchWidth = pitch.width;
    const pitchHeight = pitch.height;
    
    const positions = getAbsolutePositions(
      formation,
      pitchWidth,
      pitchHeight,
      DEFAULT_PITCH_CONFIG.padding,
      team === 'away',
      orientation
    );
    
    const filteredElements = elements.filter(
      (el) => !isPlayerElement(el) || el.team !== team
    );
    
    const newPlayers = positions.map((pos: { x: number; y: number; role: string; number: number }) => {
      const prefs = resolvePlayerDefaults(team, document.playerDefaults ?? DEFAULT_PLAYER_DEFAULTS);
      // Formations always assign numbers from formation definition (autoNumber-independent).
      // Flag the goalkeeper so it renders in the team's distinct goalkeeperColor
      // instead of the outfield color.
      const isGoalkeeper = pos.role === 'GK';
      return createPlayer({
        position: { x: pos.x, y: pos.y },
        team,
        number: pos.number,
        shape: prefs.shape,
        color: prefs.color,
        isGoalkeeper,
      });
    });
    
    set({
      elements: [...filteredElements, ...newPlayers],
      selectedIds: newPlayers.map((p: BoardElement) => p.id),
    });
    
    get().pushHistory();
  },
  
  // B5: Resize popover implementations (preview = no history, commit = with history)
  previewSetPlayersRadius: (ids, radius) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (ids.includes(el.id) && isPlayerElement(el)) {
          return { ...el, radius };
        }
        return el;
      }),
    }));
    // NO pushHistory, NO markDirty
  },
  
  commitSetPlayersRadius: (ids, radius) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (ids.includes(el.id) && isPlayerElement(el)) {
          return { ...el, radius };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  previewResetPlayersRadius: (ids) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (ids.includes(el.id) && isPlayerElement(el)) {
          const { radius: _removed, ...rest } = el as any;
          return { ...rest, radius: undefined };
        }
        return el;
      }),
    }));
    // NO pushHistory
  },
  
  commitResetPlayersRadius: (ids) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (ids.includes(el.id) && isPlayerElement(el)) {
          const { radius: _removed, ...rest } = el as any;
          return { ...rest, radius: undefined };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  // PR1: Player orientation manipulation (delta mode - adds to current)
  setPlayerOrientation: (ids, delta) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (ids.includes(el.id) && isPlayerElement(el)) {
          const current = el.orientation ?? 0;
          const newOrientation = ((current + delta) % 360 + 360) % 360;
          return { ...el, orientation: newOrientation };
        }
        return el;
      }),
    }));
    // NOTE: pushHistory removed - caller decides (keyboard already calls it, wheel debounces)
  },
  
  resetPlayerOrientation: (ids) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (ids.includes(el.id) && isPlayerElement(el)) {
          return { ...el, orientation: 0 };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  // Per-player vision toggle — deterministic "any-off → all-on, all-on → all-off"
  // Avoids "random" appearance when players have mixed showVision states.
  togglePlayerVision: (ids) => {
    if (ids.length === 0) return;

    const { elements } = get();

    // Check if ANY targeted player has vision explicitly OFF (showVision === false)
    // undefined is treated as "follow global" (not explicitly off), so it counts as ON here
    const anyExplicitlyOff = elements.some(
      (el) => ids.includes(el.id) && isPlayerElement(el) && el.showVision === false
    );

    // Deterministic rule: if any is off → turn all on; if all on → turn all off
    const newValue = anyExplicitlyOff; // true = turn on; false = turn off

    set((state) => ({
      elements: state.elements.map((el) => {
        if (ids.includes(el.id) && isPlayerElement(el)) {
          return { ...el, showVision: newValue };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  setPlayerVision: (ids, value) => {
    if (ids.length === 0) return;
    
    set((state) => ({
      elements: state.elements.map((el) => {
        if (ids.includes(el.id) && isPlayerElement(el)) {
          return { ...el, showVision: value };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
  
  // ALT+Drag rotation — preview/commit pattern
  previewPlayerOrientationAbsolute: (id, orientation) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (el.id === id && isPlayerElement(el)) {
          return { ...el, orientation };
        }
        return el;
      }),
    }));
    // NO pushHistory, NO markDirty
  },
  
  commitPlayerOrientationAbsolute: (id, orientation) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (el.id === id && isPlayerElement(el)) {
          return { ...el, orientation };
        }
        return el;
      }),
    }));
    get().pushHistory();
  },
});
