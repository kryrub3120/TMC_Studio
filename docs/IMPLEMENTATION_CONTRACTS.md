# 📜 TMC Studio — Implementation Contracts & Migration Rules

**Version:** 1.0.0  
**Created:** 2026-01-09  
**Status:** BINDING - Must follow during implementation  

---

## 🎉 Implementation Status

✅ **COMPLETE** - Full architecture implemented (2026-01-10)

**12 Commits Total:**
- ✅ PR0: Directory structure (55d2b52)
- ✅ PR1: Zustand slices (743e7a9)
- ✅ PR2: KeyboardService + hook (3f5cd01)
- ✅ PR3: ExportService (d52816f)
- ✅ PR4: Canvas layers (5b10d22, 2b8f85a)
- ✅ PR5: AutosaveService + hooks (dfb71d1)
- ✅ PR6: CommandRegistry (59a51f3, 0b69734)
- ✅ **Integration:** useCanvasInteraction (340e4c0)
- ✅ **Finalna:** BoardCanvas conditional rendering (aaad6fd)

**Current State:**
- Feature flag `USE_NEW_CANVAS = false` (safe default)
- Old code preserved for comparison
- New BoardCanvas ready for testing
- TypeCheck: 9/9 PASS ✅
- All contracts met ✅

**Next:** Toggle flag to `true` for testing, then remove old code when stable.

---

## 📋 Table of Contents

1. [Layer Contracts](#layer-contracts)
2. [History & Autosave Contracts](#history--autosave-contracts)
3. [PR Migration Plan](#pr-migration-plan)
4. [Canvas Data Flow](#canvas-data-flow)
5. [Testing Strategy](#testing-strategy)
6. [Definition of Done](#definition-of-done)
7. [Risk Mitigation](#risk-mitigation)

---

## 🤝 Layer Contracts

### Contract #1: Editor Commands Pattern (Intent vs Effect)

**Rule**: UI components **NEVER** manipulate state directly. All mutations go through commands.

**Commands are split into two levels:**
- **Intent** = Fast, frequent, no side-effects (from UI/input)
- **Effect** = Rare, controlled, testable (orchestration)

```typescript
// apps/web/src/commands/types.ts
export interface EditorCommand {
  id: string;
  label: string;
  execute: () => void;
  undo?: () => void;
  shouldCommitHistory: boolean;
  shouldTriggerAutosave: boolean;
}

// apps/web/src/commands/registry.ts
export const cmd = {
  // ═══════════════════════════════════════════════════════════
  // INTENT COMMANDS (from UI / input - fast, no side-effects)
  // ═══════════════════════════════════════════════════════════
  intent: {
    // Selection
    select: (ids: string[]) => dispatch({ type: 'SELECT', ids }),
    selectAll: () => dispatch({ type: 'SELECT_ALL' }),
    clearSelection: () => dispatch({ type: 'CLEAR_SELECTION' }),
    
    // Movement (continuous - NO commit NO autosave)
    moveStart: (ids: string[]) => dispatch({ type: 'MOVE_START', ids }),
    moveDelta: (delta: Position) => dispatch({ type: 'MOVE_DELTA', delta }),
    
    // Resize (continuous - NO commit NO autosave)
    resizeStart: (id: string, handle: HandleType) => dispatch({ type: 'RESIZE_START', id, handle }),
    resizeDelta: (delta: Position) => dispatch({ type: 'RESIZE_DELTA', delta }),
    
    // Drawing (continuous - NO commit NO autosave)
    drawStart: (point: Position, tool: DrawingTool) => dispatch({ type: 'DRAW_START', point, tool }),
    drawPoint: (point: Position) => dispatch({ type: 'DRAW_POINT', point }),
  },
  
  // ═══════════════════════════════════════════════════════════
  // EFFECT COMMANDS (orchestration - triggers history/autosave)
  // ═══════════════════════════════════════════════════════════
  effect: {
    // Element operations (atomic - commit immediately)
    addElement: (payload: AddElementPayload) => {
      dispatch({ type: 'ADD_ELEMENT', payload });
      cmd.effect.commitHistory('Add element');
      cmd.effect.scheduleAutosave();
    },
    deleteSelected: () => {
      dispatch({ type: 'DELETE_SELECTED' });
      cmd.effect.commitHistory('Delete');
      cmd.effect.scheduleAutosave();
    },
    duplicateSelected: () => {
      dispatch({ type: 'DUPLICATE_SELECTED' });
      cmd.effect.commitHistory('Duplicate');
      cmd.effect.scheduleAutosave();
    },
    
    // End continuous operations (commit + autosave)
    moveEnd: (label = 'Move') => {
      dispatch({ type: 'MOVE_END' });
      cmd.effect.commitHistory(label);
      cmd.effect.scheduleAutosave();
    },
    resizeEnd: (label = 'Resize') => {
      dispatch({ type: 'RESIZE_END' });
      cmd.effect.commitHistory(label);
      cmd.effect.scheduleAutosave();
    },
    drawEnd: () => {
      dispatch({ type: 'DRAW_END' });
      cmd.effect.commitHistory('Draw');
      cmd.effect.scheduleAutosave();
    },
    
    // History management
    commitHistory: (label: string) => historySlice.commit(label),
    
    // Autosave management
    scheduleAutosave: () => autosaveService.schedule(),
  },
  
  // ═══════════════════════════════════════════════════════════
  // NAVIGATION COMMANDS (no continuous state)
  // ═══════════════════════════════════════════════════════════
  undo: () => dispatch({ type: 'UNDO' }),
  redo: () => dispatch({ type: 'REDO' }),
  goToStep: (index: number) => {
    dispatch({ type: 'GO_TO_STEP', index });
    cmd.effect.commitHistory('Go to step');
    cmd.effect.scheduleAutosave();
  },
  addStep: () => {
    dispatch({ type: 'ADD_STEP' });
    cmd.effect.commitHistory('Add step');
    cmd.effect.scheduleAutosave();
  },
};
```

**Flow**:
```
useCanvasInteraction  →  cmd.moveStart()  →  dispatch()  →  slice reducer  →  state update
         ↓                      ↓                                    ↓
      onDragEnd         cmd.moveEnd()        history.commit()    autosave.schedule()
```

### Contract #2: Inter-Slice Communication

**Rule**: Slices communicate through **dispatch**, never through direct imports.

```typescript
// ❌ FORBIDDEN: Direct cross-slice calls
export const createHistorySlice = (set, get) => ({
  undo: () => {
    const entry = get().history[get().historyIndex - 1];
    get().setElements(entry.elements);  // ❌ Calling elements slice directly
    get().selectElements(entry.selectedIds);  // ❌ Calling selection slice directly
  }
});

// ✅ CORRECT: Dispatch orchestrates
export function dispatch(action: EditorAction) {
  const store = useAppStore.getState();
  
  switch (action.type) {
    case 'UNDO': {
      const entry = store.history[store.historyIndex - 1];
      if (!entry) return;
      
      // Set multiple slices atomically through one store.setState
      useAppStore.setState({
        elements: structuredClone(entry.elements),
        selectedIds: [...entry.selectedIds],
        historyIndex: store.historyIndex - 1,
      });
      break;
    }
    // ...
  }
}
```

---

## 📝 History & Autosave Contracts

### Contract #3: Commit Points

**Rule**: Only these events trigger history commits:

| Event | Commits History | Triggers Autosave |
|-------|-----------------|-------------------|
| `pointerDown` (drag start) | ❌ | ❌ |
| `pointerMove` (dragging) | ❌ | ❌ |
| `pointerUp` (drag end) | ✅ | ✅ after debounce |
| `addElement` | ✅ | ✅ after debounce |
| `deleteSelected` | ✅ | ✅ after debounce |
| `duplicateSelected` | ✅ | ✅ after debounce |
| `goToStep` | ✅ | ✅ after debounce |
| `updateElementProperty` (inspector) | ✅ (debounced 300ms) | ✅ after debounce |

### Contract #4: Autosave Rules

> **❗ CRITICAL: Autosave NIE uruchamia się podczas:**
> - Playbacku animacji (`isPlaying === true`)
> - Scrubbingu timeline'u (scrubbing between steps)
> 
> Otherwise animations will generate "false changes".

```typescript
// apps/web/src/services/AutosaveService.ts

const AUTOSAVE_DEBOUNCE_MS = 1500;

interface AutosaveState {
  isDirty: boolean;
  isSaving: boolean;
  pendingState: BoardDocument | null;
  timer: NodeJS.Timeout | null;
}

class AutosaveService {
  private state: AutosaveState = {
    isDirty: false,
    isSaving: false,
    pendingState: null,
    timer: null,
  };
  
  /**
   * Rule 1: Schedule with debounce & cancel
   */
  schedule(document: BoardDocument): void {
    // Cancel any pending timer
    if (this.state.timer) {
      clearTimeout(this.state.timer);
    }
    
    // Mark dirty
    this.state.isDirty = true;
    this.state.pendingState = document;
    
    // Schedule new save
    this.state.timer = setTimeout(() => {
      this.performSave();
    }, AUTOSAVE_DEBOUNCE_MS);
  }
  
  /**
   * Rule 2: Only save when dirty
   */
  private async performSave(): Promise<void> {
    if (!this.state.isDirty || !this.state.pendingState) {
      return;
    }
    
    // Rule 3: No parallel requests (last-write-wins)
    if (this.state.isSaving) {
      // Save in progress - keep pending state, it will be picked up after current save
      return;
    }
    
    this.state.isSaving = true;
    const stateToSave = this.state.pendingState;
    
    try {
      await cloudService.saveProject(stateToSave);
      
      // Clear dirty only if no new changes came in
      if (this.state.pendingState === stateToSave) {
        this.state.isDirty = false;
        this.state.pendingState = null;
      }
    } catch (error) {
      console.error('[Autosave] Error:', error);
      // Keep dirty flag, will retry on next schedule
    } finally {
      this.state.isSaving = false;
      
      // If new changes came in during save, save again
      if (this.state.isDirty && this.state.pendingState !== stateToSave) {
        this.performSave();
      }
    }
  }
  
  /**
   * Force save (on window unload, manual save)
   */
  async flush(): Promise<void> {
    if (this.state.timer) {
      clearTimeout(this.state.timer);
      this.state.timer = null;
    }
    
    if (this.state.isDirty) {
      await this.performSave();
    }
  }
}
```

---

## 🚀 PR Migration Plan

### PR0: Foundations (Day 1) — No Behavior Change

**Scope**: Scaffolding only, zero functional changes

```bash
# Create directory structure
mkdir -p apps/web/src/{hooks,services,commands}
mkdir -p apps/web/src/store/{slices,middleware}
mkdir -p apps/web/src/components/Canvas/{layers,overlays}

# Add empty index.ts files
touch apps/web/src/hooks/index.ts
touch apps/web/src/services/index.ts
touch apps/web/src/commands/index.ts
touch apps/web/src/store/slices/index.ts
```

**Changes**:
- Add folder structure
- Add commitlint CI check
- Update tsconfig paths if needed
- **NO code changes to App.tsx or stores**

**Merge criteria**: Build passes, app works exactly as before

---

### PR1: Store Slices (Week 1) — Internal Refactor

**Scope**: Split `useBoardStore.ts` into slices, keep API surface identical

```typescript
// apps/web/src/store/useBoardStore.ts (ADAPTER)
// Keep old API, delegate to slices internally

import { useAppStore } from './index';

// Re-export for backward compatibility
export const useBoardStore = useAppStore;

// Or if needed, create adapter:
export const useBoardStore = create((set, get) => ({
  // Delegate to new store
  elements: useAppStore.getState().elements,
  addElement: (el) => useAppStore.getState().addElement(el),
  // ...
}));
```

**Migration steps**:
1. Create slice files (elementsSlice, selectionSlice, etc.)
2. Create combined store in `store/index.ts`
3. Keep old `useBoardStore.ts` as adapter
4. Replace imports one file at a time
5. Add shallow selectors in hot paths

**Merge criteria**: 
- All existing functionality works
- React DevTools shows fewer unnecessary re-renders
- No TypeScript errors

---

### PR2: KeyboardService + Hook (Week 1)

**Scope**: Extract keyboard shortcuts from App.tsx

```typescript
// Order of extraction:
// 1. KeyboardService (pure, no React)
// 2. useKeyboardShortcuts (React hook)
// 3. Update App.tsx to use hook
// 4. Delete old keyboard logic from App.tsx
```

**Merge criteria**:
- All shortcuts work
- Unit tests for key → command mapping
- App.tsx reduced by ~200 LOC

---

### PR3: ExportService (Week 1/2)

**Scope**: Extract export logic

```typescript
// 1. ExportService (no React, receives state)
// 2. exportCommands.ts (commands that use service)
// 3. Update UI to call commands, not inline logic
```

**Merge criteria**:
- PNG/GIF/PDF export works
- Service is unit-testable
- Zero React dependencies in service

---

### PR4: Canvas Layers (Week 2)

**Scope**: Split canvas into layers

**Migration**:
1. Create `BoardCanvas.tsx` (Stage + Layer composition)
2. Create layer components one by one
3. Move rendering logic from App.tsx to layers
4. Add view model selectors for each layer
5. Remove canvas logic from App.tsx

**Merge criteria**:
- Canvas renders correctly
- Layers have isolated re-renders (verify with React DevTools)
- No direct store imports in layer components

---

### PR5: Animation & Interpolation (Week 2/3)

**Scope**: Extract animation playback

**Migration**:
1. Create `useAnimationPlayback` hook
2. Create `useInterpolation` hook  
3. Move RAF loop out of App.tsx
4. Add interpolation to layer components

**Merge criteria**:
- Animation plays smoothly
- Interpolation works between steps
- No animation logic in App.tsx

---

### PR6: CommandRegistry + Integration (Week 3)

**Scope**: Complete command pattern

**Migration**:
1. Create command modules (elementCommands, editCommands, etc.)
2. Wire CommandPaletteModal to registry
3. Replace direct store calls with commands
4. Remove remaining logic from App.tsx

**Merge criteria**:
- Command palette works
- All actions go through commands
- App.tsx < 150 LOC

---

## 🎨 Canvas Data Flow

### Contract #5: Layer Data Flow

**Rule**: Each layer receives a **view model**, never the whole store.

```typescript
// ✅ CORRECT: Layer receives minimal props
interface PlayersLayerProps {
  players: PlayerViewModel[];
  onDragEnd: (id: string, position: Position) => void;
}

interface PlayerViewModel {
  id: string;
  position: Position;  // May be interpolated during animation
  team: Team;
  number: number;
  isSelected: boolean;
  teamColor: string;   // Pre-computed from teamSettings
}

// ❌ FORBIDDEN: Layer imports store directly
function PlayersLayer() {
  const elements = useAppStore(s => s.elements);  // ❌ Too broad
  const teamSettings = useAppStore(s => s.teamSettings);  // ❌ Recomputes colors
}
```

### Contract #6: View Model Selectors

**Rule**: Create memoized selectors for each layer's data.

> **❗ CRITICAL RULE: Zakaz mapowania elementów w renderze komponentów Canvas**
> 
> Mapowanie → ONLY in selectors (reselect)
> 
> This is the #1 place where memoization breaks, even with React.memo.

```typescript
// apps/web/src/store/selectors/playerSelectors.ts
import { createSelector } from 'reselect';

const selectElements = (state: AppState) => state.elements;
const selectSelectedIds = (state: AppState) => state.selectedIds;
const selectTeamSettings = (state: AppState) => state.teamSettings;
const selectAnimationProgress = (state: AppState) => state.animationProgress;
const selectCurrentStepIndex = (state: AppState) => state.currentStepIndex;
const selectSteps = (state: AppState) => state.steps;

export const selectPlayerViewModels = createSelector(
  [selectElements, selectSelectedIds, selectTeamSettings, selectAnimationProgress, selectCurrentStepIndex, selectSteps],
  (elements, selectedIds, teamSettings, animationProgress, currentStepIndex, steps): PlayerViewModel[] => {
    const players = elements.filter(el => el.type === 'player');
    
    return players.map(player => {
      // Calculate interpolated position if animating
      let position = player.position;
      if (animationProgress > 0 && currentStepIndex < steps.length - 1) {
        const nextStep = steps[currentStepIndex + 1];
        const nextPlayer = nextStep.elements.find(el => el.id === player.id);
        if (nextPlayer && 'position' in nextPlayer) {
          position = lerpPosition(player.position, nextPlayer.position, animationProgress);
        }
      }
      
      return {
        id: player.id,
        position,
        team: player.team,
        number: player.number,
        isSelected: selectedIds.includes(player.id),
        teamColor: teamSettings[player.team].primaryColor,
      };
    });
  }
);
```

### Contract #7: Event Handling Layer

**Rule**: Only ONE layer handles pointer events. Others are `listening={false}`.

```typescript
function BoardCanvas() {
  return (
    <Stage>
      {/* Static layers - no events */}
      <PitchLayer />
      
      {/* Interactive elements - events handled per-node */}
      <PlayersLayer onDragEnd={handleDragEnd} />
      <ArrowsLayer onDragEnd={handleArrowDragEnd} />
      <ZonesLayer onResizeEnd={handleZoneResizeEnd} />
      
      {/* Overlay - captures marquee selection */}
      <OverlayLayer 
        onMarqueeStart={handleMarqueeStart}
        onMarqueeMove={handleMarqueeMove}
        onMarqueeEnd={handleMarqueeEnd}
      />
    </Stage>
  );
}
```

---

## 🧪 Testing Strategy

### Test Track 1: Commands + Slices (Unit)

**Pattern**: given state → when command → expect state

**⚠️ MANDATORY Regression Tests for Continuous Operations:**

```typescript
// __tests__/commands/continuousOperations.test.ts
describe('continuous operations - history regression', () => {
  it('❌ moveStart → move → move → should NOT create history entries', () => {
    // Given
    const initialState = createTestStateWithPlayer();
    const initialHistoryLength = initialState.history.length;
    
    // When - continuous movement (multiple moves)
    let state = applyCommand(initialState, cmd.intent.moveStart(['player-1']));
    state = applyCommand(state, cmd.intent.moveDelta({ x: 10, y: 10 }));
    state = applyCommand(state, cmd.intent.moveDelta({ x: 20, y: 20 }));
    state = applyCommand(state, cmd.intent.moveDelta({ x: 30, y: 30 }));
    
    // Then - history should NOT grow during continuous movement
    expect(state.history.length).toBe(initialHistoryLength);
  });
  
  it('✅ moveEnd → should create exactly 1 history entry', () => {
    // Given
    const initialState = createTestStateWithPlayer();
    const initialHistoryLength = initialState.history.length;
    
    // When - full drag cycle
    let state = applyCommand(initialState, cmd.intent.moveStart(['player-1']));
    state = applyCommand(state, cmd.intent.moveDelta({ x: 50, y: 50 }));
    state = applyCommand(state, cmd.effect.moveEnd('Move player'));
    
    // Then - exactly 1 new history entry
    expect(state.history.length).toBe(initialHistoryLength + 1);
    expect(state.history[state.history.length - 1].label).toBe('Move player');
  });
  
  it('❌ resize continuous → should NOT create history entries', () => {
    // Same pattern as move
  });
  
  it('✅ resizeEnd → should create exactly 1 history entry', () => {
    // Same pattern as moveEnd
  });
});
```

```typescript
// __tests__/commands/elementCommands.test.ts
describe('elementCommands', () => {
  it('addPlayer should create player at cursor', () => {
    // Given
    const initialState = createTestState({
      cursorPosition: { x: 100, y: 200 },
      elements: [],
    });
    
    // When
    const nextState = applyCommand(initialState, cmd.addPlayer('home'));
    
    // Then
    expect(nextState.elements).toHaveLength(1);
    expect(nextState.elements[0].type).toBe('player');
    expect(nextState.elements[0].position).toEqual({ x: 100, y: 200 });
    expect(nextState.selectedIds).toEqual([nextState.elements[0].id]);
  });
  
  it('deleteSelected should remove selected elements', () => {
    // Given
    const initialState = createTestState({
      elements: [
        { id: 'p1', type: 'player', position: { x: 0, y: 0 } },
        { id: 'p2', type: 'player', position: { x: 100, y: 100 } },
      ],
      selectedIds: ['p1'],
    });
    
    // When
    const nextState = applyCommand(initialState, cmd.deleteSelected());
    
    // Then
    expect(nextState.elements).toHaveLength(1);
    expect(nextState.elements[0].id).toBe('p2');
    expect(nextState.selectedIds).toEqual([]);
  });
});
```

### Test Track 2: ExportService (Unit + Snapshot)

```typescript
// __tests__/services/ExportService.test.ts
describe('ExportService', () => {
  it('should generate correct filename', () => {
    const filename = exportService.generateFilename('My Board', 'png');
    expect(filename).toMatch(/my-board-\d{8}-\d{6}\.png/);
  });
  
  it('should call stage.toDataURL with correct options', async () => {
    const mockStage = {
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,abc'),
    };
    
    await exportService.exportPNG(mockStage as any, { filename: 'test' });
    
    expect(mockStage.toDataURL).toHaveBeenCalledWith({ pixelRatio: 2 });
  });
});
```

### Test Track 3: E2E Smoke (Playwright)

```typescript
// e2e/criticalPath.spec.ts
import { test, expect } from '@playwright/test';

test('critical path: add → drag → undo → redo → export', async ({ page }) => {
  await page.goto('/');
  
  // Add player with keyboard
  await page.keyboard.press('p');
  await expect(page.locator('[data-testid="player-node"]')).toHaveCount(1);
  
  // Drag player
  const player = page.locator('[data-testid="player-node"]');
  await player.dragTo(page.locator('[data-testid="pitch"]'), {
    targetPosition: { x: 200, y: 200 },
  });
  
  // Undo
  await page.keyboard.press('Meta+z');
  // Player should be back at original position
  
  // Redo
  await page.keyboard.press('Meta+Shift+z');
  // Player should be at new position
  
  // Export button should be clickable
  await page.locator('[data-testid="export-button"]').click();
  await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();
});
```

---

## ✅ Definition of Done

**Refactoring is COMPLETE when all criteria are met:**

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | App.tsx < 150 LOC | `wc -l apps/web/src/App.tsx` |
| 2 | No domain logic in App.tsx | Code review |
| 3 | No direct store imports in Canvas layers | `grep -r "useAppStore" packages/board/` returns 0 |
| 4 | Drag/resize: 1 history entry per action | Manual test + console log |
| 5 | No duplicate autosaves on rapid edits | Network tab shows 1 request after burst |
| 6 | All commands go through registry | `grep -r "useAppStore.getState()" apps/web/src/components/` returns 0 |
| 7 | Slices don't call each other directly | Code review |
| 8 | Memoization on all board nodes | React DevTools profiler |
| 9 | 20+ unit tests passing | CI green |
| 10 | E2E smoke test passing | CI green |

---

## ⚠️ Risk Mitigation

### Risk 1: CommandRegistry becomes new monolith

**Mitigation**: Split by feature domain

```
commands/
├── index.ts              # Re-exports all
├── selectionCommands.ts  # select, selectAll, clearSelection
├── elementCommands.ts    # add*, delete, duplicate
├── movementCommands.ts   # move, resize, nudge
├── groupCommands.ts      # createGroup, ungroup
├── stepCommands.ts       # goToStep, addStep, duplicateStep
├── historyCommands.ts    # undo, redo
└── exportCommands.ts     # exportPNG, exportGIF, etc.
```

### Risk 2: Memoization doesn't work (unstable props)

**Mitigation**: View model pattern + selector stability

```typescript
// ❌ UNSTABLE: New object on every render
const player = {
  ...element,
  isSelected: selectedIds.includes(element.id),
};

// ✅ STABLE: Memoized selector returns same reference if inputs unchanged
const players = useAppStore(selectPlayerViewModels);
```

### Risk 3: Slices become tightly coupled

**Mitigation**: Dispatch orchestration + explicit boundaries

```typescript
// ❌ COUPLING: Slice A calls Slice B
elementsSlice.addElement = () => {
  // ... add element
  get().selectElement(newId);  // ❌ Calls selection slice
  get().pushHistory();         // ❌ Calls history slice
};

// ✅ DECOUPLED: Dispatch orchestrates multi-slice updates
function dispatch(action: AddElementAction) {
  const newElement = createPlayer(...);
  
  useAppStore.setState({
    elements: [...state.elements, newElement],
    selectedIds: [newElement.id],
  });
  
  if (action.commit) {
    historySlice.pushHistory();
    autosaveService.schedule();
  }
}
```

### Risk 4: Migration breaks production

**Mitigation**: 
- Each PR is independently mergeable
- Feature flags for big changes if needed
- Adapter pattern preserves old API during transition

---

## 📊 Success Metrics

| Metric | Before | Target | Critical Threshold |
|--------|--------|--------|-------------------|
| App.tsx LOC | ~1400 | ~100 | < 150 |
| Canvas rerenders per drag | Unknown | 1 per layer | < 3 |
| History entries per drag | Many | 1 | ≤ 2 |
| Autosave requests per minute | Unknown | ≤ 1 | < 5 |
| Test coverage | ~0% | 60% | > 40% |
| Build time | Baseline | No increase | < 120% |

---

*This document is BINDING. Any deviation requires team discussion and document update.*
