# 🔧 TMC Studio — Service Module Breakdown

**Version:** 1.0.0  
**Created:** 2026-01-09  
**Status:** Implementation Plan  

---

## 📋 Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Target Module Structure](#target-module-structure)
3. [Service Definitions](#service-definitions)
4. [Hook Definitions](#hook-definitions)
5. [Implementation Priority](#implementation-priority)
6. [Migration Steps](#migration-steps)

---

## 📊 Current State Analysis

### App.tsx Breakdown (1400+ LOC)

| Responsibility | Lines (approx) | Target Module |
|---------------|----------------|---------------|
| State subscriptions | ~100 | Store slices |
| Keyboard shortcuts | ~300 | `useKeyboardShortcuts` |
| Animation playback | ~80 | `useAnimationPlayback` |
| Export handlers | ~120 | `ExportService` |
| Canvas event handlers | ~100 | `useCanvasInteraction` |
| Interpolation helpers | ~60 | `packages/core/step` |
| Multi-drag logic | ~80 | `useMultiDrag` |
| Command palette config | ~80 | `commands/index.ts` |
| Text/Player editing | ~60 | `useInlineEditing` |
| Cloud/Project handlers | ~60 | `useCloudSync` |
| JSX rendering | ~360 | `BoardCanvas`, layers |

### Problems to Solve

1. **Monolithic Component**: Single component handles 10+ concerns
2. **Coupled Logic**: Business logic mixed with rendering
3. **Untestable**: Pure functions trapped in React component
4. **Re-render Issues**: All logic re-evaluated on every render

---

## 🎯 Target Module Structure

```
apps/web/src/
├── App.tsx                       # ~100 LOC - composition only
│
├── components/
│   └── Canvas/
│       ├── BoardCanvas.tsx       # Stage + layers composition
│       ├── layers/
│       │   ├── PitchLayer.tsx    # Static pitch rendering
│       │   ├── ZonesLayer.tsx    # Zone elements
│       │   ├── ArrowsLayer.tsx   # Arrow elements
│       │   ├── PlayersLayer.tsx  # Players + Ball
│       │   ├── DrawingLayer.tsx  # Freehand strokes
│       │   └── OverlayLayer.tsx  # Selection, previews
│       └── overlays/
│           ├── TextEditOverlay.tsx
│           └── PlayerEditOverlay.tsx
│
├── hooks/
│   ├── useKeyboardShortcuts.ts   # Global keyboard handling
│   ├── useAnimationPlayback.ts   # Step animation with RAF
│   ├── useCanvasInteraction.ts   # Mouse/touch handlers
│   ├── useMultiDrag.ts           # Multi-selection drag
│   ├── useInlineEditing.ts       # Text/number editing
│   ├── useCloudSync.ts           # Realtime subscription
│   └── useInterpolation.ts       # Element position interpolation
│
├── services/
│   ├── KeyboardService.ts        # Shortcut registration
│   ├── ExportService.ts          # PNG/GIF/PDF/SVG export
│   ├── AutosaveService.ts        # Debounced save logic
│   └── CommandRegistry.ts        # Command palette registration
│
├── commands/
│   ├── index.ts                  # All commands registry
│   ├── elementCommands.ts        # Add player, ball, etc.
│   ├── editCommands.ts           # Undo, redo, delete
│   ├── viewCommands.ts           # Toggle panels, zoom
│   ├── stepCommands.ts           # Navigation, add step
│   └── exportCommands.ts         # Export actions
│
└── store/
    ├── index.ts                  # Combined store
    ├── slices/
    │   ├── elementsSlice.ts
    │   ├── selectionSlice.ts
    │   ├── historySlice.ts
    │   ├── stepsSlice.ts
    │   ├── groupsSlice.ts
    │   ├── cloudSlice.ts
    │   └── documentSlice.ts
    └── middleware/
        ├── undoMiddleware.ts
        └── autosaveMiddleware.ts
```

---

## 🛠️ Service Definitions

### 1. KeyboardService

**Responsibility**: Register and handle keyboard shortcuts

```typescript
// apps/web/src/services/KeyboardService.ts

export interface ShortcutDefinition {
  key: string;
  modifiers?: ('ctrl' | 'meta' | 'shift' | 'alt')[];
  action: () => void;
  description: string;
  category: string;
  when?: () => boolean;
}

class KeyboardService {
  private shortcuts: Map<string, ShortcutDefinition> = new Map();
  
  register(shortcut: ShortcutDefinition): () => void {
    const key = this.normalizeKey(shortcut);
    this.shortcuts.set(key, shortcut);
    return () => this.shortcuts.delete(key);
  }
  
  handleKeyDown(event: KeyboardEvent): boolean {
    const key = this.normalizeKey({
      key: event.key,
      modifiers: this.getModifiers(event)
    });
    
    const shortcut = this.shortcuts.get(key);
    if (shortcut && (!shortcut.when || shortcut.when())) {
      event.preventDefault();
      shortcut.action();
      return true;
    }
    return false;
  }
  
  getAll(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values());
  }
}

export const keyboardService = new KeyboardService();
```

### 2. ExportService

**Responsibility**: Handle all export operations

```typescript
// apps/web/src/services/ExportService.ts

import type Konva from 'konva';

export interface ExportOptions {
  filename: string;
  pixelRatio?: number;
  quality?: number;
}

export interface GIFOptions extends ExportOptions {
  stepDuration: number;
  loop?: boolean;
}

class ExportService {
  async exportPNG(
    stage: Konva.Stage,
    options: ExportOptions
  ): Promise<void> {
    const dataUrl = stage.toDataURL({ pixelRatio: options.pixelRatio ?? 2 });
    this.downloadDataUrl(dataUrl, `${options.filename}.png`);
  }
  
  async exportAllStepsPNG(
    stage: Konva.Stage,
    goToStep: (index: number) => void,
    totalSteps: number,
    options: ExportOptions
  ): Promise<void> {
    for (let i = 0; i < totalSteps; i++) {
      goToStep(i);
      await this.delay(150);
      const dataUrl = stage.toDataURL({ pixelRatio: options.pixelRatio ?? 2 });
      this.downloadDataUrl(dataUrl, `${options.filename}-step-${i + 1}.png`);
      await this.delay(100);
    }
  }
  
  async exportGIF(
    captureFrame: () => Promise<string>,
    goToStep: (index: number) => void,
    totalSteps: number,
    options: GIFOptions,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    // GIF encoding logic (using gifenc)
  }
  
  async exportPDF(
    captureFrame: () => Promise<string>,
    goToStep: (index: number) => void,
    totalSteps: number,
    options: ExportOptions
  ): Promise<void> {
    // PDF generation logic (using jspdf)
  }
  
  async exportSVG(
    stage: Konva.Stage,
    width: number,
    height: number,
    options: ExportOptions
  ): Promise<void> {
    // SVG serialization logic
  }
  
  private downloadDataUrl(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const exportService = new ExportService();
```

### 3. AutosaveService

**Responsibility**: Debounced autosave with conflict resolution

```typescript
// apps/web/src/services/AutosaveService.ts

export interface AutosaveConfig {
  debounceMs: number;
  onSave: () => Promise<void>;
  onError?: (error: Error) => void;
}

class AutosaveService {
  private timer: NodeJS.Timeout | null = null;
  private config: AutosaveConfig | null = null;
  private isDirty = false;
  
  configure(config: AutosaveConfig): void {
    this.config = config;
  }
  
  markDirty(): void {
    this.isDirty = true;
    this.scheduleSave();
  }
  
  private scheduleSave(): void {
    if (!this.config) return;
    
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    this.timer = setTimeout(async () => {
      if (!this.isDirty || !this.config) return;
      
      try {
        await this.config.onSave();
        this.isDirty = false;
      } catch (error) {
        this.config.onError?.(error as Error);
      }
    }, this.config.debounceMs);
  }
  
  flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.isDirty && this.config) {
      this.isDirty = false;
      return this.config.onSave();
    }
    
    return Promise.resolve();
  }
  
  dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const autosaveService = new AutosaveService();
```

### 4. CommandRegistry

**Responsibility**: Centralized command palette configuration

```typescript
// apps/web/src/services/CommandRegistry.ts

export interface CommandAction {
  id: string;
  label: string;
  shortcut?: string;
  category: 'elements' | 'edit' | 'view' | 'steps' | 'export';
  onExecute: () => void;
  disabled?: () => boolean;
  icon?: string;
}

class CommandRegistry {
  private commands: Map<string, CommandAction> = new Map();
  
  register(command: CommandAction): () => void {
    this.commands.set(command.id, command);
    return () => this.commands.delete(command.id);
  }
  
  registerMany(commands: CommandAction[]): () => void {
    commands.forEach(cmd => this.commands.set(cmd.id, cmd));
    return () => commands.forEach(cmd => this.commands.delete(cmd.id));
  }
  
  execute(id: string): boolean {
    const command = this.commands.get(id);
    if (command && (!command.disabled || !command.disabled())) {
      command.onExecute();
      return true;
    }
    return false;
  }
  
  getAll(): CommandAction[] {
    return Array.from(this.commands.values());
  }
  
  getByCategory(category: CommandAction['category']): CommandAction[] {
    return this.getAll().filter(cmd => cmd.category === category);
  }
  
  search(query: string): CommandAction[] {
    const lower = query.toLowerCase();
    return this.getAll().filter(
      cmd => cmd.label.toLowerCase().includes(lower) ||
             cmd.id.toLowerCase().includes(lower)
    );
  }
}

export const commandRegistry = new CommandRegistry();
```

---

## 🪝 Hook Definitions

### 1. useKeyboardShortcuts

**Responsibility**: Register all keyboard shortcuts

```typescript
// apps/web/src/hooks/useKeyboardShortcuts.ts

import { useEffect } from 'react';
import { useAppStore } from '../store';
import { useUIStore } from '../store/useUIStore';
import { keyboardService } from '../services/KeyboardService';

export function useKeyboardShortcuts(): void {
  // Get only needed actions (not state)
  const addPlayer = useAppStore((s) => s.addPlayerAtCursor);
  const addBall = useAppStore((s) => s.addBallAtCursor);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  // ... other actions
  
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  
  useEffect(() => {
    // Register shortcuts
    const unsubscribers = [
      keyboardService.register({
        key: 'p',
        action: () => addPlayer('home'),
        description: 'Add Home Player',
        category: 'elements',
        when: () => !commandPaletteOpen
      }),
      keyboardService.register({
        key: 'p',
        modifiers: ['shift'],
        action: () => addPlayer('away'),
        description: 'Add Away Player',
        category: 'elements',
        when: () => !commandPaletteOpen
      }),
      keyboardService.register({
        key: 'z',
        modifiers: ['meta'],
        action: undo,
        description: 'Undo',
        category: 'edit'
      }),
      keyboardService.register({
        key: 'z',
        modifiers: ['meta', 'shift'],
        action: redo,
        description: 'Redo',
        category: 'edit'
      }),
      // ... more shortcuts
    ];
    
    // Global listener
    const handler = (e: KeyboardEvent) => {
      keyboardService.handleKeyDown(e);
    };
    
    window.addEventListener('keydown', handler);
    
    return () => {
      window.removeEventListener('keydown', handler);
      unsubscribers.forEach(unsub => unsub());
    };
  }, [addPlayer, addBall, undo, redo, commandPaletteOpen]);
}
```

### 2. useAnimationPlayback

**Responsibility**: RAF-based animation with interpolation

```typescript
// apps/web/src/hooks/useAnimationPlayback.ts

import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store';
import { useUIStore } from '../store/useUIStore';
import { easeInOutCubic } from '../utils/easing';

export function useAnimationPlayback(): void {
  const isPlaying = useUIStore((s) => s.isPlaying);
  const isLooping = useUIStore((s) => s.isLooping);
  const stepDuration = useUIStore((s) => s.stepDuration);
  const setAnimationProgress = useUIStore((s) => s.setAnimationProgress);
  const pause = useUIStore((s) => s.pause);
  
  const currentStepIndex = useAppStore((s) => s.currentStepIndex);
  const totalSteps = useAppStore((s) => s.document.steps.length);
  const goToStep = useAppStore((s) => s.goToStep);
  const nextStep = useAppStore((s) => s.nextStep);
  
  useEffect(() => {
    if (!isPlaying || totalSteps <= 1) {
      setAnimationProgress(0);
      return;
    }
    
    let startTime: number | null = null;
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const elapsed = timestamp - startTime;
      const durationMs = stepDuration * 1000;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeInOutCubic(progress);
      
      setAnimationProgress(eased);
      
      if (progress >= 1) {
        if (currentStepIndex >= totalSteps - 1) {
          if (isLooping) {
            goToStep(0);
            startTime = null;
            setAnimationProgress(0);
            animationFrameId = requestAnimationFrame(animate);
          } else {
            pause();
            setAnimationProgress(0);
          }
        } else {
          nextStep();
          startTime = null;
          setAnimationProgress(0);
          animationFrameId = requestAnimationFrame(animate);
        }
      } else {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      setAnimationProgress(0);
    };
  }, [isPlaying, isLooping, stepDuration, totalSteps, currentStepIndex]);
}
```

### 3. useCanvasInteraction

**Responsibility**: Stage mouse/touch events

```typescript
// apps/web/src/hooks/useCanvasInteraction.ts

import { useCallback, useState } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Position } from '@tmc/core';
import { useAppStore } from '../store';
import { useUIStore } from '../store/useUIStore';

interface CanvasInteractionState {
  marqueeStart: Position | null;
  marqueeEnd: Position | null;
}

export function useCanvasInteraction() {
  const [state, setState] = useState<CanvasInteractionState>({
    marqueeStart: null,
    marqueeEnd: null
  });
  
  const activeTool = useUIStore((s) => s.activeTool);
  const clearActiveTool = useUIStore((s) => s.clearActiveTool);
  
  const startDrawing = useAppStore((s) => s.startDrawing);
  const updateDrawing = useAppStore((s) => s.updateDrawing);
  const finishArrowDrawing = useAppStore((s) => s.finishArrowDrawing);
  const finishZoneDrawing = useAppStore((s) => s.finishZoneDrawing);
  const selectElementsInRect = useAppStore((s) => s.selectElementsInRect);
  const clearSelection = useAppStore((s) => s.clearSelection);
  
  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;
    
    if (activeTool?.startsWith('arrow') || activeTool?.startsWith('zone')) {
      startDrawing(pos);
    } else if (!activeTool) {
      // Start marquee selection on empty space
      const target = e.target;
      if (target === stage || target.name()?.startsWith('pitch')) {
        setState({ marqueeStart: pos, marqueeEnd: pos });
      }
    }
  }, [activeTool, startDrawing]);
  
  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;
    
    if (state.marqueeStart) {
      setState(s => ({ ...s, marqueeEnd: pos }));
    }
    
    if (activeTool) {
      updateDrawing(pos);
    }
  }, [state.marqueeStart, activeTool, updateDrawing]);
  
  const handleMouseUp = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (state.marqueeStart && state.marqueeEnd) {
      selectElementsInRect(state.marqueeStart, state.marqueeEnd);
      setState({ marqueeStart: null, marqueeEnd: null });
    }
    
    if (activeTool === 'arrow-pass') {
      finishArrowDrawing('pass');
      clearActiveTool();
    } else if (activeTool === 'arrow-run') {
      finishArrowDrawing('run');
      clearActiveTool();
    } else if (activeTool === 'zone') {
      finishZoneDrawing('rect');
      clearActiveTool();
    }
  }, [state, activeTool, selectElementsInRect, finishArrowDrawing, finishZoneDrawing, clearActiveTool]);
  
  const handleClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const clickedOnEmpty = e.target === stage || e.target.name()?.startsWith('pitch');
    if (clickedOnEmpty && !activeTool) {
      clearSelection();
    }
  }, [activeTool, clearSelection]);
  
  return {
    marqueeStart: state.marqueeStart,
    marqueeEnd: state.marqueeEnd,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onClick: handleClick,
    }
  };
}
```

### 4. useInterpolation

**Responsibility**: Element position interpolation during animation

```typescript
// apps/web/src/hooks/useInterpolation.ts

import { useMemo } from 'react';
import type { Position, BoardElement, Step } from '@tmc/core';
import { hasPosition, isArrowElement, isZoneElement } from '@tmc/core';
import { useAppStore } from '../store';
import { useUIStore } from '../store/useUIStore';

export function useInterpolatedElements(): BoardElement[] {
  const elements = useAppStore((s) => s.elements);
  const currentStepIndex = useAppStore((s) => s.currentStepIndex);
  const steps = useAppStore((s) => s.document.steps);
  
  const isPlaying = useUIStore((s) => s.isPlaying);
  const animationProgress = useUIStore((s) => s.animationProgress);
  
  return useMemo(() => {
    if (!isPlaying || animationProgress === 0) {
      return elements;
    }
    
    const nextStep = steps[currentStepIndex + 1];
    if (!nextStep) {
      return elements;
    }
    
    return elements.map(el => {
      const nextEl = nextStep.elements.find(e => e.id === el.id);
      if (!nextEl) return el;
      
      return interpolateElement(el, nextEl, animationProgress);
    });
  }, [elements, steps, currentStepIndex, isPlaying, animationProgress]);
}

function interpolateElement(
  from: BoardElement,
  to: BoardElement,
  progress: number
): BoardElement {
  if (hasPosition(from) && hasPosition(to)) {
    return {
      ...to,
      position: lerpPosition(from.position, to.position, progress)
    };
  }
  
  if (isArrowElement(from) && isArrowElement(to)) {
    return {
      ...to,
      startPoint: lerpPosition(from.startPoint, to.startPoint, progress),
      endPoint: lerpPosition(from.endPoint, to.endPoint, progress)
    };
  }
  
  if (isZoneElement(from) && isZoneElement(to)) {
    return {
      ...to,
      position: lerpPosition(from.position, to.position, progress),
      width: lerp(from.width, to.width, progress),
      height: lerp(from.height, to.height, progress)
    };
  }
  
  return to;
}

function lerpPosition(a: Position, b: Position, t: number): Position {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
```

---

## 📊 Implementation Priority

> ⚠️ **Important**: See [`IMPLEMENTATION_CONTRACTS.md`](./IMPLEMENTATION_CONTRACTS.md) for binding contracts, PR migration plan, and Definition of Done.

### Phase 1: Foundation (Week 1)
| Task | Priority | Effort |
|------|----------|--------|
| Create store slices structure | P0 | 2d |
| Implement `useKeyboardShortcuts` | P0 | 1d |
| Extract `ExportService` | P1 | 1d |
| Create `CommandRegistry` | P1 | 0.5d |

### Phase 2: Canvas Optimization (Week 2)
| Task | Priority | Effort |
|------|----------|--------|
| Create `BoardCanvas` component | P0 | 1d |
| Implement layer components | P0 | 2d |
| Extract `useCanvasInteraction` | P0 | 1d |
| Extract `useMultiDrag` | P1 | 0.5d |

### Phase 3: Animation System (Week 3)
| Task | Priority | Effort |
|------|----------|--------|
| Extract `useAnimationPlayback` | P0 | 1d |
| Create `useInterpolation` hook | P0 | 1d |
| Move interpolation to `packages/core` | P1 | 1d |
| Add memoization to board nodes | P1 | 1d |

### Phase 4: Polish & Testing (Week 4)
| Task | Priority | Effort |
|------|----------|--------|
| Unit tests for services | P1 | 2d |
| Integration tests | P2 | 1d |
| Performance profiling | P1 | 1d |
| Documentation | P2 | 1d |

---

## 🔄 Migration Steps

### Step 1: Create Directory Structure

```bash
mkdir -p apps/web/src/hooks
mkdir -p apps/web/src/services
mkdir -p apps/web/src/commands
mkdir -p apps/web/src/components/Canvas/layers
mkdir -p apps/web/src/components/Canvas/overlays
mkdir -p apps/web/src/store/slices
mkdir -p apps/web/src/store/middleware
```

### Step 2: Extract Services (No React Dependencies)

1. Create `KeyboardService.ts`
2. Create `ExportService.ts`  
3. Create `AutosaveService.ts`
4. Create `CommandRegistry.ts`

### Step 3: Create Store Slices

1. Create `elementsSlice.ts`
2. Create `selectionSlice.ts`
3. Create `historySlice.ts`
4. Create `stepsSlice.ts`
5. Create index.ts combining slices

### Step 4: Extract Hooks

1. Create `useKeyboardShortcuts.ts`
2. Create `useAnimationPlayback.ts`
3. Create `useCanvasInteraction.ts`
4. Create `useInterpolation.ts`

### Step 5: Create Canvas Components

1. Create `BoardCanvas.tsx`
2. Create layer components
3. Add React.memo to board nodes

### Step 6: Simplify App.tsx

1. Import hooks
2. Import components
3. Remove extracted logic
4. Target: ~100 LOC

---

## ✅ Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| App.tsx LOC | ~1400 | ~100 |
| Largest file | 1400 | <300 |
| Testable services | 0 | 4 |
| Canvas layers | 1 | 6 |
| Memoized nodes | 0 | 7 |

---

*Previous: [DATA_MODEL.md](./DATA_MODEL.md)*  
*Next: [ZUSTAND_SLICES.md](./ZUSTAND_SLICES.md)*
