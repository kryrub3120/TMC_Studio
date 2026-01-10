# 🗂️ TMC Studio — Zustand Slices Architecture

**Version:** 1.0.0  
**Created:** 2026-01-09  
**Status:** Implementation Guide  

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Slice Pattern](#slice-pattern)
3. [Slice Definitions](#slice-definitions)
4. [Middleware](#middleware)
5. [Store Composition](#store-composition)
6. [Migration Guide](#migration-guide)

---

## 🎯 Overview

### Current Problem

The existing `useBoardStore.ts` is a **monolithic store** with 1000+ LOC containing:
- Element CRUD operations
- Selection management
- Undo/Redo history
- Step/Animation state
- Group management
- Cloud sync
- Autosave logic

### Solution: Slice Pattern

Split into focused slices with **single responsibility**:

```
store/
├── index.ts                  # Combined store export
├── types.ts                  # Shared store types
├── slices/
│   ├── elementsSlice.ts      # Element CRUD
│   ├── selectionSlice.ts     # Selection state
│   ├── historySlice.ts       # Undo/Redo
│   ├── stepsSlice.ts         # Animation steps
│   ├── groupsSlice.ts        # Element groups
│   ├── cloudSlice.ts         # Cloud sync
│   └── documentSlice.ts      # Document metadata
└── middleware/
    ├── undoMiddleware.ts     # History tracking
    └── autosaveMiddleware.ts # Debounced save
```

---

## 🧩 Slice Pattern

### TypeScript Pattern

```typescript
// Generic slice creator type
import type { StateCreator } from 'zustand';

// Each slice is a function that receives (set, get, api)
// and returns its state + actions
export type SliceCreator<T> = StateCreator<
  AppState,      // Full combined state
  [],            // No middleware at slice level
  [],            // No middleware at slice level
  T              // This slice's state
>;
```

### Slice Template

```typescript
// slices/exampleSlice.ts
import type { StateCreator } from 'zustand';
import type { AppState } from '../types';

export interface ExampleSlice {
  // State
  value: string;
  count: number;
  
  // Actions
  setValue: (value: string) => void;
  increment: () => void;
  reset: () => void;
}

export const createExampleSlice: StateCreator<
  AppState,
  [],
  [],
  ExampleSlice
> = (set, get) => ({
  // Initial state
  value: '',
  count: 0,
  
  // Actions
  setValue: (value) => set({ value }),
  
  increment: () => set((state) => ({ 
    count: state.count + 1 
  })),
  
  reset: () => set({ 
    value: '', 
    count: 0 
  }),
});
```

---

## 📦 Slice Definitions

### 1. ElementsSlice

**Responsibility**: CRUD operations for board elements

```typescript
// store/slices/elementsSlice.ts
import type { StateCreator } from 'zustand';
import type { BoardElement, Position, ElementId, Team, ArrowType, ZoneShape } from '@tmc/core';
import { createPlayer, createBall, createArrow, createZone, createText, createEquipment } from '@tmc/core';
import type { AppState } from '../types';

export interface ElementsSlice {
  // State
  elements: BoardElement[];
  
  // Element CRUD
  addElement: (element: BoardElement) => void;
  removeElements: (ids: ElementId[]) => void;
  updateElement: (id: ElementId, updates: Partial<BoardElement>) => void;
  setElements: (elements: BoardElement[]) => void;
  
  // Convenience creators
  addPlayerAtCursor: (team: Team) => void;
  addBallAtCursor: () => void;
  addArrowAtCursor: (type: ArrowType) => void;
  addZoneAtCursor: (shape?: ZoneShape) => void;
  addTextAtCursor: () => void;
  
  // Movement
  moveElementById: (id: ElementId, position: Position) => void;
  nudgeElements: (ids: ElementId[], dx: number, dy: number) => void;
}

export const createElementsSlice: StateCreator<
  AppState,
  [],
  [],
  ElementsSlice
> = (set, get) => ({
  elements: [],
  
  addElement: (element) => {
    set((state) => ({
      elements: [...state.elements, element],
    }));
  },
  
  removeElements: (ids) => {
    set((state) => ({
      elements: state.elements.filter((el) => !ids.includes(el.id)),
    }));
  },
  
  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  },
  
  setElements: (elements) => {
    set({ elements });
  },
  
  addPlayerAtCursor: (team) => {
    const position = get().cursorPosition ?? { x: 565, y: 380 };
    const elements = get().elements;
    const number = getNextPlayerNumber(elements, team);
    const player = createPlayer(position, team, number);
    get().addElement(player);
    get().selectElement(player.id, false);
  },
  
  addBallAtCursor: () => {
    const position = get().cursorPosition ?? { x: 565, y: 380 };
    const ball = createBall(position);
    get().addElement(ball);
    get().selectElement(ball.id, false);
  },
  
  addArrowAtCursor: (type) => {
    const position = get().cursorPosition ?? { x: 565, y: 380 };
    const arrow = createArrow(position, type);
    get().addElement(arrow);
    get().selectElement(arrow.id, false);
  },
  
  addZoneAtCursor: (shape = 'rect') => {
    const position = get().cursorPosition ?? { x: 505, y: 340 };
    const zone = createZone(position, shape);
    get().addElement(zone);
    get().selectElement(zone.id, false);
  },
  
  addTextAtCursor: () => {
    const position = get().cursorPosition ?? { x: 565, y: 380 };
    const text = createText(position, 'Text');
    get().addElement(text);
    get().selectElement(text.id, false);
  },
  
  moveElementById: (id, position) => {
    get().updateElement(id, { position });
  },
  
  nudgeElements: (ids, dx, dy) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (!ids.includes(el.id)) return el;
        if ('position' in el) {
          return {
            ...el,
            position: {
              x: el.position.x + dx,
              y: el.position.y + dy,
            },
          };
        }
        return el;
      }),
    }));
  },
});

function getNextPlayerNumber(elements: BoardElement[], team: Team): number {
  const teamPlayers = elements.filter(
    (el) => el.type === 'player' && el.team === team
  );
  const numbers = teamPlayers.map((p) => p.number);
  let next = 1;
  while (numbers.includes(next)) next++;
  return next;
}
```

### 2. SelectionSlice

**Responsibility**: Selection state management

```typescript
// store/slices/selectionSlice.ts
import type { StateCreator } from 'zustand';
import type { ElementId, Position } from '@tmc/core';
import type { AppState } from '../types';

export interface SelectionSlice {
  // State
  selectedIds: ElementId[];
  cursorPosition: Position | null;
  
  // Actions
  selectElement: (id: ElementId, addToSelection: boolean) => void;
  selectElements: (ids: ElementId[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectElementsInRect: (start: Position, end: Position) => void;
  setCursorPosition: (position: Position | null) => void;
  
  // Computed
  getSelectedElements: () => BoardElement[];
  getSelectedElement: () => BoardElement | undefined;
}

export const createSelectionSlice: StateCreator<
  AppState,
  [],
  [],
  SelectionSlice
> = (set, get) => ({
  selectedIds: [],
  cursorPosition: null,
  
  selectElement: (id, addToSelection) => {
    set((state) => {
      if (addToSelection) {
        const isSelected = state.selectedIds.includes(id);
        return {
          selectedIds: isSelected
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id],
        };
      }
      return { selectedIds: [id] };
    });
  },
  
  selectElements: (ids) => {
    set({ selectedIds: ids });
  },
  
  selectAll: () => {
    set((state) => ({
      selectedIds: state.elements.map((el) => el.id),
    }));
  },
  
  clearSelection: () => {
    set({ selectedIds: [] });
  },
  
  selectElementsInRect: (start, end) => {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    
    const elements = get().elements;
    const inRect = elements
      .filter((el) => {
        if ('position' in el) {
          const { x, y } = el.position;
          return x >= minX && x <= maxX && y >= minY && y <= maxY;
        }
        return false;
      })
      .map((el) => el.id);
    
    set({ selectedIds: inRect });
  },
  
  setCursorPosition: (position) => {
    set({ cursorPosition: position });
  },
  
  getSelectedElements: () => {
    const { elements, selectedIds } = get();
    return elements.filter((el) => selectedIds.includes(el.id));
  },
  
  getSelectedElement: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.length !== 1) return undefined;
    return elements.find((el) => el.id === selectedIds[0]);
  },
});
```

### 3. HistorySlice

**Responsibility**: Undo/Redo management with explicit continuous mode

```typescript
// store/slices/historySlice.ts
import type { StateCreator } from 'zustand';
import type { BoardElement, ElementId } from '@tmc/core';
import type { AppState } from '../types';

interface HistoryEntry {
  elements: BoardElement[];
  selectedIds: ElementId[];
  label: string;  // e.g., "Move players", "Add element"
}

export interface HistorySlice {
  // State
  history: HistoryEntry[];
  historyIndex: number;
  isContinuous: boolean;  // ⚠️ EXPLICIT FLAG - blocks history during drag/resize/draw
  
  // Actions
  beginContinuous: () => void;      // Call on pointerDown (drag start)
  endContinuous: (label: string) => void;  // Call on pointerUp (drag end) - commits history
  
  pushHistory: (label: string) => void;  // For atomic operations (add, delete)
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // Computed
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const MAX_HISTORY = 50;

export const createHistorySlice: StateCreator<
  AppState,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  history: [],
  historyIndex: -1,
  isContinuous: false,
  
  // ⚠️ Call on pointerDown (drag/resize/draw start)
  beginContinuous: () => {
    set({ isContinuous: true });
  },
  
  // ⚠️ Call on pointerUp (drag/resize/draw end) - commits history
  endContinuous: (label: string) => {
    const { isContinuous } = get();
    if (!isContinuous) return;
    
    set({ isContinuous: false });
    get().pushHistory(label);
  },
  
  pushHistory: (label: string) => {
    // ⚠️ Block during continuous operations
    if (get().isContinuous) return;
    
    set((state) => {
      // Truncate future history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      
      // Add current state
      newHistory.push({
        elements: structuredClone(state.elements),
        selectedIds: [...state.selectedIds],
      });
      
      // Limit size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },
  
  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;
    
    const entry = history[historyIndex - 1];
    set({
      elements: structuredClone(entry.elements),
      selectedIds: [...entry.selectedIds],
      historyIndex: historyIndex - 1,
    });
  },
  
  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;
    
    const entry = history[historyIndex + 1];
    set({
      elements: structuredClone(entry.elements),
      selectedIds: [...entry.selectedIds],
      historyIndex: historyIndex + 1,
    });
  },
  
  clearHistory: () => {
    set({ history: [], historyIndex: -1 });
  },
  
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
});
```

### 4. StepsSlice

**Responsibility**: Animation steps management

```typescript
// store/slices/stepsSlice.ts
import type { StateCreator } from 'zustand';
import type { Step, BoardElement } from '@tmc/core';
import type { AppState } from '../types';

export interface StepsSlice {
  // State
  steps: Step[];
  currentStepIndex: number;
  
  // Actions
  addStep: () => void;
  removeStep: (index: number) => void;
  duplicateStep: (index: number) => void;
  renameStep: (index: number, name: string) => void;
  goToStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Computed
  getCurrentStep: () => Step | undefined;
  getStepCount: () => number;
}

export const createStepsSlice: StateCreator<
  AppState,
  [],
  [],
  StepsSlice
> = (set, get) => ({
  steps: [{
    id: `step-${Date.now()}`,
    name: 'Step 1',
    elements: [],
    duration: 0.8,
  }],
  currentStepIndex: 0,
  
  addStep: () => {
    const { steps, currentStepIndex, elements } = get();
    
    // Save current elements to current step
    const updatedSteps = [...steps];
    updatedSteps[currentStepIndex] = {
      ...updatedSteps[currentStepIndex],
      elements: structuredClone(elements),
    };
    
    // Create new step with copy of elements
    const newStep: Step = {
      id: `step-${Date.now()}`,
      name: `Step ${steps.length + 1}`,
      elements: structuredClone(elements),
      duration: 0.8,
    };
    
    updatedSteps.splice(currentStepIndex + 1, 0, newStep);
    
    set({
      steps: updatedSteps,
      currentStepIndex: currentStepIndex + 1,
    });
    
    get().clearHistory();
    get().pushHistory();
  },
  
  removeStep: (index) => {
    const { steps } = get();
    if (steps.length <= 1) return;
    
    const newSteps = steps.filter((_, i) => i !== index);
    const newIndex = Math.min(index, newSteps.length - 1);
    
    set({
      steps: newSteps,
      currentStepIndex: newIndex,
      elements: structuredClone(newSteps[newIndex].elements),
    });
    
    get().clearHistory();
    get().pushHistory();
  },
  
  duplicateStep: (index) => {
    const { steps } = get();
    const step = steps[index];
    if (!step) return;
    
    const newStep: Step = {
      ...step,
      id: `step-${Date.now()}`,
      name: `${step.name} (copy)`,
      elements: structuredClone(step.elements),
    };
    
    const newSteps = [...steps];
    newSteps.splice(index + 1, 0, newStep);
    
    set({
      steps: newSteps,
      currentStepIndex: index + 1,
      elements: structuredClone(newStep.elements),
    });
    
    get().clearHistory();
    get().pushHistory();
  },
  
  renameStep: (index, name) => {
    set((state) => ({
      steps: state.steps.map((step, i) =>
        i === index ? { ...step, name } : step
      ),
    }));
  },
  
  goToStep: (index) => {
    const { steps, currentStepIndex, elements } = get();
    if (index < 0 || index >= steps.length) return;
    if (index === currentStepIndex) return;
    
    // Save current elements to current step
    const updatedSteps = [...steps];
    updatedSteps[currentStepIndex] = {
      ...updatedSteps[currentStepIndex],
      elements: structuredClone(elements),
    };
    
    set({
      steps: updatedSteps,
      currentStepIndex: index,
      elements: structuredClone(updatedSteps[index].elements),
      selectedIds: [],
    });
    
    get().clearHistory();
    get().pushHistory();
  },
  
  nextStep: () => {
    const { currentStepIndex, steps } = get();
    if (currentStepIndex < steps.length - 1) {
      get().goToStep(currentStepIndex + 1);
    }
  },
  
  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      get().goToStep(currentStepIndex - 1);
    }
  },
  
  getCurrentStep: () => {
    const { steps, currentStepIndex } = get();
    return steps[currentStepIndex];
  },
  
  getStepCount: () => get().steps.length,
});
```

---

## 🔌 Middleware

### Undo Middleware (Wrapper Pattern)

```typescript
// store/middleware/undoMiddleware.ts
import type { StateCreator, StoreApi, StoreMutatorIdentifier } from 'zustand';

type UndoMiddleware = <
  T extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  options?: { trackActions?: string[] }
) => StateCreator<T, Mps, Mcs>;

const undoMiddlewareImpl: UndoMiddleware = (f, options) => (set, get, api) => {
  const trackedActions = new Set(options?.trackActions ?? []);
  
  const wrappedSet: typeof set = (...args) => {
    // Call original set
    set(...args);
    
    // Auto-push history for tracked actions
    const state = get() as { pushHistory?: () => void };
    if (state.pushHistory) {
      state.pushHistory();
    }
  };
  
  return f(wrappedSet, get, api);
};

export const undoMiddleware = undoMiddlewareImpl as UndoMiddleware;
```

### Autosave Middleware

```typescript
// store/middleware/autosaveMiddleware.ts
import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

interface AutosaveOptions {
  debounceMs?: number;
  onSave?: (state: unknown) => Promise<void>;
}

type AutosaveMiddleware = <
  T extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  options?: AutosaveOptions
) => StateCreator<T, Mps, Mcs>;

const autosaveMiddlewareImpl: AutosaveMiddleware = (f, options) => (set, get, api) => {
  let timer: NodeJS.Timeout | null = null;
  const debounceMs = options?.debounceMs ?? 2000;
  
  const wrappedSet: typeof set = (...args) => {
    // Call original set
    set(...args);
    
    // Schedule autosave
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      if (options?.onSave) {
        try {
          await options.onSave(get());
        } catch (e) {
          console.error('[Autosave] Error:', e);
        }
      }
    }, debounceMs);
  };
  
  return f(wrappedSet, get, api);
};

export const autosaveMiddleware = autosaveMiddlewareImpl as AutosaveMiddleware;
```

---

## 🏗️ Store Composition

### Combined Store

```typescript
// store/index.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';

import { createElementsSlice, type ElementsSlice } from './slices/elementsSlice';
import { createSelectionSlice, type SelectionSlice } from './slices/selectionSlice';
import { createHistorySlice, type HistorySlice } from './slices/historySlice';
import { createStepsSlice, type StepsSlice } from './slices/stepsSlice';
import { createGroupsSlice, type GroupsSlice } from './slices/groupsSlice';
import { createCloudSlice, type CloudSlice } from './slices/cloudSlice';
import { createDocumentSlice, type DocumentSlice } from './slices/documentSlice';

// Combined state type
export type AppState = 
  & ElementsSlice
  & SelectionSlice
  & HistorySlice
  & StepsSlice
  & GroupsSlice
  & CloudSlice
  & DocumentSlice;

// Create combined store
export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (...a) => ({
          ...createElementsSlice(...a),
          ...createSelectionSlice(...a),
          ...createHistorySlice(...a),
          ...createStepsSlice(...a),
          ...createGroupsSlice(...a),
          ...createCloudSlice(...a),
          ...createDocumentSlice(...a),
        }),
        {
          name: 'tmc-board-storage',
          partialize: (state) => ({
            // Only persist document data
            steps: state.steps,
            currentStepIndex: state.currentStepIndex,
            documentName: state.documentName,
            teamSettings: state.teamSettings,
            pitchSettings: state.pitchSettings,
          }),
        }
      )
    ),
    { name: 'TMC-Board' }
  )
);

// Typed selector hooks for performance
export const useElements = () => useAppStore((s) => s.elements);
export const useSelectedIds = () => useAppStore((s) => s.selectedIds);
export const useCurrentStep = () => useAppStore((s) => s.currentStepIndex);
```

---

## 🔄 Migration Guide

### Step 1: Create Directory Structure

```bash
mkdir -p apps/web/src/store/slices
mkdir -p apps/web/src/store/middleware
```

### Step 2: Create Type Definitions

```typescript
// store/types.ts
import type { BoardElement, Step, TeamSettings, PitchSettings } from '@tmc/core';

export interface AppState {
  // From ElementsSlice
  elements: BoardElement[];
  
  // From SelectionSlice
  selectedIds: string[];
  cursorPosition: { x: number; y: number } | null;
  
  // From HistorySlice
  history: Array<{ elements: BoardElement[]; selectedIds: string[] }>;
  historyIndex: number;
  
  // From StepsSlice
  steps: Step[];
  currentStepIndex: number;
  
  // ... other slices
}
```

### Step 3: Create Slices One by One

Order of creation:
1. `elementsSlice.ts` (core element operations)
2. `selectionSlice.ts` (depends on elements)
3. `historySlice.ts` (depends on elements, selection)
4. `stepsSlice.ts` (depends on elements, history)
5. `groupsSlice.ts` (depends on selection)
6. `cloudSlice.ts` (independent)
7. `documentSlice.ts` (independent)

### Step 4: Update Imports in App

```typescript
// Before
import { useBoardStore } from './store/useBoardStore';

// After
import { useAppStore } from './store';
```

### Step 5: Verify Functionality

Test checklist:
- [ ] Add/remove elements
- [ ] Selection works
- [ ] Undo/Redo works
- [ ] Step navigation works
- [ ] Cloud save/load works
- [ ] Autosave triggers

---

## ✅ Benefits After Migration

| Aspect | Before | After |
|--------|--------|-------|
| File size | 1000+ LOC | ~150 LOC per slice |
| Testability | Hard (coupled) | Easy (isolated) |
| Re-renders | All on any change | Selective by slice |
| Maintainability | Low | High |
| Type safety | Partial | Full |

---

*Previous: [SERVICE_MODULE_BREAKDOWN.md](./SERVICE_MODULE_BREAKDOWN.md)*  
*Next: Implementation Phase*
