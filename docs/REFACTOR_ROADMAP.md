# Refactoring Roadmap - Implementation Plan

Szczegółowy plan refaktoryzacji App.tsx na moduły z kontraktami. Każdy PR ma jasno określony zakres, cel i kryteria sukcesu.

---

## Status obecny (2026-01-27)

**App.tsx:** 1661 linii  
**Cel końcowy:** < 600 linii (App jako shell, nie integrator)

### ✅ Zakończone PR-y
- **PR-REFACTOR-0**: CommandRegistry Scaffolding ✅ (Foundation - ~600 linii kodu, 0 redukcji)
- **PR-REFACTOR-1**: Selection → cmd.board.selection ✅ (6 plików, ~50 linii zmian)
- **PR-REFACTOR-2**: Drag/Move + History Commit Rules ✅ (2 pliki, ~30 linii zmian)
- **PR-REFACTOR-5**: useSettingsController (~45 linii)
- **PR-REFACTOR-6**: useDrawingController (~60 linii)
- **PR-REFACTOR-7**: useCanvasEventsController (~64 linii)
- **PR-REFACTOR-11.5**: AppShell + BoardPage ✅ (App.tsx: 1300→28 linii = -1272 linii!) 🎉

**Łącznie zredukowano:** ~1440 linii (-87%!) 🎉
**Architecture wins:** CommandRegistry foundation established, Hard Rules compliant ✅

---

## Sprint 0: CommandRegistry Foundation (PRZED hookami!)

### ⚠️ KLUCZOWE: Dlaczego CommandRegistry najpierw?

**Project Rules są jasne:**
- ✅ UI MAY ONLY call `CommandRegistry (cmd.*)`
- ❌ UI MUST NOT call Zustand store actions directly

**Obecny problem:**
App.tsx i Canvas wywołują `useBoardStore().addPlayer()`, `selectElement()` etc. bezpośrednio → **łamie Hard Rules**.

**Rozwiązanie:**
Przepnij UI na `cmd.board.canvas.addPlayer()`, `cmd.board.selection.select()` etc.

---

### PR-REFACTOR-0: CommandRegistry Scaffolding 🔑 START HERE

**Cel:** Przygotować strukturę CommandRegistry + kontrakty **bez zmian runtime**

**Zakres:** Typy, struktura, kontrakty - ZERO przepięcia UI (pure scaffolding)

**Pliki do utworzenia:**
```
apps/web/src/commands/
  ├── registry.ts              # Main registry (currently pass-through)
  ├── types.ts                 # Cmd interfaces (sub-commands)
  ├── board/
  │   ├── intent.ts            # High-frequency, no side effects
  │   ├── effect.ts            # User actions with history/autosave
  │   └── index.ts
  ├── animation/
  │   ├── intent.ts
  │   ├── effect.ts
  │   └── index.ts
  └── edit/
      ├── intent.ts
      ├── effect.ts
      └── index.ts
```

**Kontrakt (zgodny z R6 sub-commands + intent/effect):**
```typescript
// commands/types.ts
export interface CommandRegistry {
  board: BoardCommands;
  animation: AnimationCommands;
  edit: EditCommands;
}

// Sub-commands per domain (R6)
export interface BoardCommands {
  canvas: CanvasCommands;
  selection: SelectionCommands;
  history: HistoryCommands;
}

// Intent vs Effect (project rules)
export interface CanvasCommands {
  // Intent - high frequency, no side effects
  moveElementLive: (id: string, position: Position) => void;
  resizeZoneLive: (id: string, width: number, height: number) => void;
  
  // Effect - commits history, triggers autosave
  addPlayer: (team: 'home' | 'away', position?: Position) => void;
  addBall: (position?: Position) => void;
  deleteElement: (id: string) => void;
}

export interface SelectionCommands {
  // Intent - no history
  select: (id: string, addToSelection: boolean) => void;
  clear: () => void;
  selectAll: () => void;
  selectInRect: (start: Position, end: Position) => void;
  
  // Effect - with history (copy/paste/delete)
  copySelected: () => void;
  pasteClipboard: () => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
}

export interface HistoryCommands {
  commitUserAction: () => void;  // Called ONLY on pointerUp, add, delete, paste
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}
```

**Implementacja (PR0 - pass-through, niepodłączone):**
```typescript
// commands/registry.ts
import { useBoardStore } from '../store';

export function createCommandRegistry(): CommandRegistry {
  // ⚠️ PR0 ONLY
  // Direct store access allowed ONLY for scaffolding.
  // MUST be removed when UI is wired to cmd.* (PR1+).
  const store = useBoardStore.getState();
  
  return {
    board: {
      canvas: {
        // Pass-through do store (na razie)
        moveElementLive: (id, pos) => store.moveElementById(id, pos),
        addPlayer: (team, pos) => {
          store.addPlayerAtCursor(team);
          store.pushHistory();  // Effect!
        },
        // ... więcej
      },
      selection: {
        select: (id, add) => store.selectElement(id, add),
        clear: () => store.clearSelection(),
        // ... więcej
      },
      history: {
        commit: () => store.pushHistory(),
        undo: () => store.undo(),
        redo: () => store.redo(),
        canUndo: () => store.canUndo(),
        canRedo: () => store.canRedo(),
      },
    },
    // animation i edit TODO w kolejnych PR-ach
  };
}
```

**Integracja (PR0 - TYLKO stworzenie, bez użycia):**
```typescript
// App.tsx - TYLKO dodaj, nie używaj (yet)
const cmd = useMemo(() => createCommandRegistry(), []);

// Existing code continues to use store directly
// (przepięcie dopiero w PR1)
```

**Kryteria sukcesu PR0:**
- [x] TypeScript 0 błędów ✅
- [x] Struktura commands/ utworzona ✅
- [x] Kontrakty zdefiniowane (intent/effect separation) ✅
- [x] createCommandRegistry implementowany (pass-through) ✅
- [x] **ZERO zmian runtime** - App działa identycznie ✅
- [x] CI passes (typecheck + lint) ✅

**Szacowany czas:** 1-1.5h  
**Redukcja linii:** 0 (scaffolding only)  
**Risk:** Minimal (zero behavioral changes)  
**Status:** ✅ **ZAKOŃCZONE** (2026-01-27)

---

### PR-REFACTOR-1: Selection → cmd.board.selection 🔄 NEXT AFTER PR0

**Cel:** Pierwszy pionowy slice - przepięcie selection na CommandRegistry

**Zakres:** Tylko selection (select, clear, selectAll, selectInRect)

**Kod do przepięcia:**
- App.tsx: wszystkie wywołania `selectElement()`, `clearSelection()`, `selectAll()`
- Canvas layers: `onSelect` handlers

**Zmiana:**
```typescript
// ❌ BEFORE (łamie rules)
const selectElement = useBoardStore(s => s.selectElement);
const clearSelection = useBoardStore(s => s.clearSelection);

onClick={() => selectElement(id, false)}

// ✅ AFTER (zgodne z rules)
const cmd = useCommandRegistry();

onClick={() => cmd.board.selection.select(id, false)}
onClick={() => cmd.board.selection.clear()}
```

**Kryteria sukcesu PR1:**
- [x] TypeScript 0 błędów ✅
- [x] Selection działa identycznie ✅
- [x] **ZERO bezpośrednich wywołań store actions dla selection w UI** ✅
- [x] grep "selectElement\|clearSelection" w App/Canvas → 0 wyników (除了 cmd impl) ✅
- [x] CI passes ✅

**Szacowany czas:** 1h  
**Redukcja:** 0 linii (refactor only)  
**Risk:** Low (mechaniczny replace)  
**Status:** ✅ **ZAKOŃCZONE** (2026-01-27)

---

### PR-REFACTOR-2: Drag/Move + History Commit Rules 🔄

**Cel:** Przepięcie drag/move + enforcement history commit ONLY on pointerUp

**Zakres:**
1. `moveElement` → `cmd.board.canvas.moveElementLive` (intent, no history)
2. History commit → `cmd.board.history.commit()` ONLY on dragEnd/pointerUp

**Zmiana:**
```typescript
// ❌ BEFORE (potencjalnie commituje za często)
const moveElementById = useBoardStore(s => s.moveElementById);

onDrag={(id, pos) => {
  moveElementById(id, pos);
  pushHistory(); // ❌ Zbyt często!
}}

// ✅ AFTER (intent + effect separation)
const cmd = useCommandRegistry();

// Intent - frequent, no side effects
onDrag={(id, pos) => {
  cmd.board.canvas.moveElementLive(id, pos);
}}

// Effect - ONLY on dragEnd
onDragEnd={(id, pos) => {
  cmd.board.canvas.moveElementLive(id, pos);
  cmd.board.history.commitUserAction();  // ✅ Jedno commitowanie (semantyczna nazwa!)
}}
```

**Kryteria sukcesu PR2:**
- [x] TypeScript 0 błędów ✅
- [x] Drag działa identycznie ✅
- [x] History commits TYLKO na pointerUp/dragEnd (używaj commitUserAction, nie commit) ✅
- [x] Autosave NOT triggered during drag (disabled) ✅
- [x] **Intent/effect separation poprawnie zaimplementowana** ✅

**Szacowany czas:** 1.5h  
**Redukcja:** 0 linii (architecture fix)  
**Risk:** Medium (history logic changes)  
**Status:** ✅ **ZAKOŃCZONE** (2026-01-27)

---

## Sprint 1: Fundament (kontrakty i hooki domenowe) - PO commandRegistry!

### PR-REFACTOR-8: Animation Module ✅ (PARTIAL - 8B DONE)

**Status:** PR-REFACTOR-8B (Interpolation) ✅ ZAKOŃCZONE (2026-01-28)

**Cel:** Wydzielić logikę animacji do 2 niezależnych hooków z kontraktami

**Zakres:**
1. `useAnimationPlayback` (playback orchestration) - ⏳ W TOKU (już istnieje)
2. `useAnimationInterpolation` (position/zone/arrow interpolation) - ✅ ZAKOŃCZONE

**Pliki utworzone:**
```
apps/web/src/hooks/
  ├── useAnimationPlayback.ts      (już istniał - używany)
  └── useAnimationInterpolation.ts ✅ (nowy - 150 linii)
```

**Kod wyekstrahowany:**
- Z `useBoardPageEffects.ts`: useInterpolation (70 linii) → `useAnimationInterpolation.ts`
- `BoardPage.tsx`: Zaktualizowane do nowego API

**Kontrakt (poprawiony - getters pattern):**
```typescript
// useAnimationPlayback - używa getters żeby uniknąć closure bugs w RAF
// ✅ ETAP 2: getCurrentStepIndex/getStepsCount owinięte w useCallback([]) w useBoardPageEffects.ts
// ✅ ETAP 3: Twardy guard ANIMATION_ENABLED — pętla nie startuje przy fladze off
interface AnimationPlaybackOptions {
  isPlaying: boolean;
  isLooping: boolean;
  stepDuration: number;
  // ⚠️ WAŻNE: Getters zamiast wartości - zapobiega stale closures w RAF
  getCurrentStepIndex: () => number;
  getStepsCount: () => number;
  onGoToStep: (index: number) => void;
  onNextStep: () => void;
  onPause: () => void;
  onSetProgress: (progress: number) => void;
}

interface AnimationPlaybackResult {
  // Cleanup handled internally, no return needed
  // Progress managed via onSetProgress callback
}

// useAnimationInterpolation - nie potrzebuje elements, tylko steps
interface AnimationInterpolationOptions {
  isPlaying: boolean;
  progress: number;          // 0..1 (renamed from animationProgress)
  currentStepIndex: number;
  steps: Step[];             // Source of truth - zawiera elements
}

interface AnimationInterpolationResult {
  nextStepElements: Step['elements'] | null;
  // Zgrupowane interpolatory (stabilna referencja)
  interp: {
    position: (id: string, current: Position) => Position;
    zone: (id: string, current: { position: Position; width: number; height: number }) => { position: Position; width: number; height: number };
    arrow: (id: string, current: { start: Position; end: Position }) => { start: Position; end: Position };
  };
}
```

**Integracja w App.tsx:**
```typescript
// Before:
useEffect(() => { /* 60 linii RAF logic */ }, [isPlaying, ...]);
const get

InterpolatedPosition = useCallback(...);
const getInterpolatedZone = useCallback(...);
const getInterpolatedArrow = useCallback(...);

// After:
useAnimationPlayback({
  isPlaying, isLooping, stepDuration,
  stepsCount: stepsData.length,
  currentStepIndex,
  onNextStep: nextStep,
  onGoToStep: goToStep,
  onPause: pause,
  onSetProgress: setAnimationProgress,
});

const { 
  nextStepElements,
  getInterpolatedPosition,
  getInterpolatedZone,
  getInterpolatedArrow,
} = useAnimationInterpolation({
  isPlaying, animationProgress, currentStepIndex,
  steps: boardDoc.steps,
  elements,
});
```

**Kryteria sukcesu PR-REFACTOR-8B (Interpolation):**
- [x] TypeScript 0 błędów ✅
- [x] Animacja interpolacja działa identycznie ✅
- [x] Hook NIE importuje UI ✅
- [x] Używa predicates z @tmc/core (hasPosition, isZoneElement, isArrowElement) ✅
- [x] useBoardPageEffects.ts uproszczone (re-export only) ✅
- [x] BoardPage.tsx używa nowego API ✅

**Faktyczny czas (8B):** ~1h  
**Redukcja (8B):** ~70 linii (z useBoardPageEffects.ts)  
**Pliki dotknięte:** 3 (1 nowy + 2 zmodyfikowane)

**Implementacja kontraktu:**
```typescript
// Finalne API (zgodne ze specyfikacją)
interface UseAnimationInterpolationOptions<TStepElements> {
  isPlaying: boolean;
  progress01: number; // 0..1
  currentStepIndex: number;
  steps: Array<{ elements: TStepElements }>;
}

interface UseAnimationInterpolationResult {
  nextStepElements: any[] | null;
  getInterpolatedPosition: (id, pos) => Position;
  getInterpolatedZone: (id, pos, w, h) => ZoneData;
  getInterpolatedArrowEndpoints: (id, start, end) => ArrowData;
}
```

**Pozostało do PR-REFACTOR-8 (FULL):**
- useAnimationPlayback już istnieje i jest używany ✅
- Potencjalne dalsze uproszczenia w orchestracji

**Szacowany czas (pozostało):** 0h (playback już zrobiony wcześniej)  
**Całkowita redukcja PR-8:** ~70 linii

---

### PR-REFACTOR-9: Edit Controller ✅ ZAKOŃCZONE

**Status:** ✅ **ZAKOŃCZONE** (2026-01-28)

**Cel:** Wydzielić inline editing (text + player number) do dedykowanego hooka z overlay positioning

**Zakres:**
`useTextEditController` + `BoardEditOverlays` - Unified controller + presentational overlay component

**Pliki utworzone:**
```
apps/web/src/hooks/
  └── useTextEditController.ts (~220 linii - z overlay positioning)
apps/web/src/app/board/
  └── BoardEditOverlays.tsx (~75 linii - presentational)
```

**Pliki zmodyfikowane:**
- `apps/web/src/app/routes/useBoardPageState.ts` (hook wiring)
- `apps/web/src/app/board/BoardPage.tsx` (overlay rendering)

**Pliki usunięte (cleanup):**
- `apps/web/src/app/board/useEditOverlayController.ts` (obsolete, replaced by useTextEditController)

<!-- ✅ ETAP 4 I5: handleTextDoubleClick, handleTextEditSave, handlePlayerQuickEdit, handlePlayerNumberSave — usunięte z useBoardPageState (martwy kod). Edycja tekstu przez useTextEditController. -->

**Kontrakt:**
```typescript
interface UseTextEditControllerOptions {
  elements: BoardElement[];
  onUpdateText: (id: string, content: string) => void;
  onUpdatePlayer: (id: string, number: number) => void;
  onSelectElement: (id: string) => void;
  onNotify?: (message: string) => void;
}

interface TextEditController {
  text: {
    isEditing: boolean;
    editingId: string | null;
    value: string;
    element: TextElement | null;
    startEdit: (id: string) => void;
    updateValue: (value: string) => void;
    save: () => void;
    cancel: () => void;
    handleKeyDown: (e: KeyboardEvent) => void;
  };
  player: {
    isEditing: boolean;
    editingId: string | null;
    numberValue: string;
    element: PlayerElement | null;
    startEdit: (id: string, currentNumber: number) => void;
    updateNumber: (value: string) => void;
    save: () => void;
    cancel: () => void;
    handleKeyDown: (e: KeyboardEvent) => void;
  };
}
```

**Integracja w App.tsx:**
```typescript
// Before:
const [editingTextId, setEditingTextId] = useState<string | null>(null);
const [editingTextValue, setEditingTextValue] = useState<string>('');
const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
const [editingPlayerNumber, setEditingPlayerNumber] = useState<string>('');
const handleTextDoubleClick = useCallback(...);
const handleTextEditSave = useCallback(...);
// ... 8 więcej handlerów

// After:
const editController = useTextEditController({
  elements,
  onUpdateText: updateTextContent,
  onUpdatePlayer: (id, number) => {
    selectElement(id, false);
    updateSelectedElement({ number });
  },
  onSelectElement: selectElement,
  onNotify: showToast,
});
```

**Kryteria sukcesu:**
- [ ] TypeScript 0 błędów
- [ ] Editing działa identycznie
- [ ] Hook NIE importuje UI components
- [ ] App.tsx -80 linii (state + handlers)
- [ ] Overlay components przeniesione do /components/

**Szacowany czas:** 1h  
**Redukcja:** ~80 linii

---

### PR-REFACTOR-10: Command Registry (modularny) 🔄

**Cel:** Podzielić monolityczny commandActions na registry modularne

**Zakres:**
Rozdział command palette actions na moduły tematyczne

**Pliki do utworzenia:**
```
apps/web/src/commands/
  ├── registry.ts              # Main registry assembler
  ├── boardCommands.ts         # Board-specific (add, select, etc.)
  ├── editCommands.ts          # Edit commands (undo, redo, copy, paste)
  ├── viewCommands.ts          # UI commands (inspector, focus, theme)
  ├── animationCommands.ts     # Steps commands (play, pause, add step)
  └── exportCommands.ts        # Export commands (PNG, GIF, PDF)
```

**Kod do ekstrakcji z App.tsx:**
- Lines 339-396: `commandActions` useMemo (~60 linii)

**Kontrakt:**
```typescript
// commands/registry.ts
interface CommandDeps {
  // Board
  addPlayerAtCursor: (team: 'home' | 'away') => void;
  addBallAtCursor: () => void;
  addArrowAtCursor: (type: 'pass' | 'run') => void;
  // ... więcej deps
}

export function createCommandRegistry(deps: CommandDeps): CommandAction[] {
  return [
    ...createBoardCommands(deps),
    ...createEditCommands(deps),
    ...createViewCommands(deps),
    ...createAnimationCommands(deps),
    ...createExportCommands(deps),
  ];
}
```

**Integracja w App.tsx:**
```typescript
// Before:
const commandActions: CommandAction[] = useMemo(() => {
  const isMac = ...;
  const cmd = ...;
  return [ /* 50+ lines of actions */ ];
}, [/* 15 deps */]);

// After:
const commandActions = useMemo(() => 
  createCommandRegistry({
    // Board
    addPlayerAtCursor,
    addBallAtCursor,
    // ... minimal deps
  }),
[/* 5-7 deps */]);
```

**Kryteria sukcesu:**
- [ ] TypeScript 0 błędów
- [ ] Command palette działa identycznie
- [ ] Commands zgrupowane tematycznie
- [ ] App.tsx -50 linii
- [ ] Łatwo dodać nowy command w module

**Szacowany czas:** 1-1.5h  
**Redukcja:** ~50 linii

---

## Sprint 2: Orchestratory (odblokowanie równoległej pracy)

### PR-REFACTOR-11: ModalOrchestrator ⏳

**Cel:** Scentralizować zarządzanie modalami poza App.tsx

**Zakres:**
Wydzielić state i logikę modali do orchestratora

**Plik do utworzenia:**
```
apps/web/src/app/orchestrators/
  └── ModalOrchestrator.tsx (~150 linii)
```

**Kod do ekstrakcji z App.tsx:**
- Lines 61-69: Modal state (8 state hooks)
- Lines 1530-1660: Modal JSX (~130 linii)

**Kontrakt:**
```typescript
interface ModalOrchestratorProps {
  // Auth
  authUser: User | null;
  authError: string | null;
  authIsLoading: boolean;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  
  // Billing
  billingController: BillingController;
  
  // Settings
  settingsController: SettingsController;
  
  // Projects
  projectsController: ProjectsController;
  
  // UI
  theme: Theme;
  gridVisible: boolean;
  snapEnabled: boolean;
  onToggleTheme: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  showToast: (msg: string) => void;
}
```

**Integracja w App.tsx:**
```typescript
// Before:
const [authModalOpen, setAuthModalOpen] = useState(false);
const [pricingModalOpen, setPricingModalOpen] = useState(false);
// ... 6 więcej modal states
// ... 130 linii JSX na końcu

// After:
<ModalOrchestrator
  authUser={authUser}
  authError={authError}
  billingController={billingController}
  settingsController={settingsController}
  projectsController={projectsController}
  theme={theme}
  onToggleTheme={toggleTheme}
  showToast={showToast}
/>
```

**Kryteria sukcesu:**
- [ ] TypeScript 0 błędów
- [ ] Modals działają identycznie
- [ ] Modal state wewnątrz orchestratora
- [ ] App.tsx -150 linii
- [ ] Team account może pracować nad modalami bez dotykania App

**Szacowany czas:** 2h  
**Redukcja:** ~150 linii

---

### PR-REFACTOR-11.5: AppShell + BoardPage ✅ ZAKOŃCZONE

**Cel:** Przekształcić App.tsx w prawdziwy shell - routing i composition ONLY

**Osiągnięte rezultaty (2026-01-28):**
- App.tsx: **1300 → 28 linii** (redukcja -1272 linii = -98%!) 🎉
- Utworzono nową strukturę modułową:

```
apps/web/src/app/
  ├── AppShell.tsx           (~290 linii - global orchestration)
  ├── routes/
  │   └── useBoardPageState.ts (~450 linii - board state hook)
  └── board/
      ├── BoardPage.tsx      (~280 linii - composition only)
      ├── BoardTopBarSection.tsx (~90 linii)
      ├── BoardCanvasSection.tsx (~300 linii)
      ├── BoardOverlays.tsx  (~170 linii)
      ├── useBoardPageHandlers.ts (~270 linii)
      └── useBoardPageEffects.ts (~280 linii)
```

**App.tsx po PR-11.5:**
```typescript
// App.tsx (28 linii - PURE composition shell!)
import { AppShell } from './app/AppShell';

export default function App() {
  return <AppShell />;
}
```

**Kryteria sukcesu:**
- [x] TypeScript 0 błędów ✅
- [x] Runtime behavior identical ✅
- [x] App.tsx < 200 linii (achieved: 28!) ✅
- [x] BoardPage contains all board integration ✅
- [x] Feature teams can work in parallel ✅
- [x] No dead code, no unused imports ✅

**Faktyczny czas:** ~2.5h  
**Redukcja:** **~1272 linii** ⭐⭐⭐ MASSIVE WIN!

---

### PR-REFACTOR-12: BoardPage Component ⏳

**Cel:** Wydzielić canvas + inspector + overlays do BoardPage

**Zakres:**
Przenieść główny UI board do osobnego komponentu

**Plik do utworzenia:**
```
apps/web/src/pages/
  └── BoardPage.tsx (~400 linii)
```

**Kod do ekstrakcji z App.tsx:**
- Lines 1171-1458: Canvas area + overlays (~300 linii)
- Lines 1460-1480: Inspector (~20 linii)

**Kontrakt:**
```typescript
interface BoardPageProps {
  // View models
  boardVm: BoardViewModel;
  animationVm: AnimationViewModel;
  editVm: EditViewModel;
  
  // Commands
  boardCmd: BoardCommands;
  animationCmd: AnimationCommands;
  editCmd: EditCommands;
  
  // Canvas config
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  theme: Theme;
  focusMode: boolean;
  
  // Callbacks
  onQuickAction: (action: string) => void;
  onContextMenu: (x: number, y: number, elementId: string | null) => void;
}
```

**Integracja w App.tsx:**
```typescript
// Before:
return (
  <div...>
    {/* 300 linii canvas JSX */}
    {/* 100 linii overlays */}
    {/* 20 linii inspector */}
  </div>
);

// After:
return (
  <div...>
    <BoardPage
      boardVm={boardVm}
      animationVm={animationVm}
      boardCmd={boardCmd}
      canvasWidth={canvasWidth}
      zoom={zoom}
      {...config}
    />
  </div>
);
```

**Kryteria sukcesu:**
- [ ] TypeScript 0 błędów
- [ ] Canvas renderuje identycznie
- [ ] BoardPage otrzymuje kontrakty,nie store
- [ ] App.tsx -300 linii
- [ ] Team board może pracować nad canvas bez konfliktu

**Szacowany czas:** 3h  
**Redukcja:** ~300 linii

---

## Sprint 3: Canvas Architecture

### PR-REFACTOR-13: CanvasAdapter + CanvasElements ⏳

**Cel:** Przygotować canvas do pracy z BoardCanvas (nowa architektura)

**Zakres:**
1. `CanvasAdapter` - Konwersja vm/cmd → props
2. `CanvasElements` - Czyste JSX rendering

**Pliki do utworzenia:**
```
apps/web/src/components/Canvas/
  ├── CanvasAdapter.tsx     (~100 linii)
  └── CanvasElements.tsx    (~250 linii)
```

---

### PR-REFACTOR-14: OverlayLayer - Single Input Handler ❌ REVERTED

**Status:** ❌ **REVERTED** (2026-01-28 - zdiagnozowano i cofnięto tego samego dnia)

**Pierwotny cel:** Konsolidacja event handlerów w dedykowanym OverlayLayer

**Co poszło nie tak:**
OverlayLayer złamał fundamentalną zasadę Konva event propagation:
- **Konva NIE bubbluje eventów między sibling Layers**
- OverlayLayer (transparent Rect) przechwytywał WSZYSTKIE eventy
- Eventy nigdy nie docierały do elementów w CanvasElements Layer
- Rezultat: selection, multi-select, multi-drag, context menu - wszystko zepsute

**Diagnoza:**
```typescript
// ❌ NIE DZIAŁA - Event flow w Konva
<Stage>
  <Layer>                      ← CanvasElements (PlayerNode, BallNode, etc.)
    <PlayerNode onClick={...}> ❌ NIGDY NIE WYWOŁANE
  </Layer>
  <Layer>                      ← OverlayLayer (top-most)
    <Rect fill="transparent" onClick={...}> ✅ Przechwytuje event
  </Layer>
</Stage>

// Konva hit-testing:
// 1. Top layer (OverlayLayer) → Rect passes hit test → event captured
// 2. Event bubbles UP within layer: Rect → Layer → Stage
// 3. ❌ Event NEVER crosses to sibling layers
```

**Kluczowa lekcja:**
> **Konva events bubble UP (Shape → Layer → Stage), NOT ACROSS (Layer ↔ Layer)**

**Poprawka (REVERT):**
Przywrócono handlers na `<Stage>` - Konva's intended pattern:
```typescript
// ✅ DZIAŁA - Stage-level handlers
<Stage
  ref={stageRef}
  width={w}
  height={h}
  onClick={onStageClick}
  onTap={onStageClick}
  onMouseDown={onStageMouseDown}
  onTouchStart={onStageMouseDown}
  onMouseMove={onStageMouseMove}
  onTouchMove={onStageMouseMove}
  onMouseUp={onStageMouseUp}
  onTouchEnd={onStageMouseUp}
  onContextMenu={onContextMenu}
>
  <CanvasElements ... />
</Stage>
```

**Pliki zmienione (REVERT):**
```
apps/web/src/app/board/canvas/
  ├── CanvasAdapter.tsx     (handlers przywrócone na Stage)
  └── OverlayLayer.tsx      (DELETED)
```

**Czas zmarnowany:** ~1h (implementacja + diagnoza + revert)  
**Czas zaoszczędzony:** Wiele godzin (dzięki szybkiej diagnozie i revert)

**Architecture lesson learned:**
- ✅ Stage IS the single input handler in Konva architecture
- ✅ Stage receives events via bubbling from any layer below
- ✅ "Single place for input" = Stage, NOT separate Layer
- ❌ Separate input layer breaks Konva's event model

**Project Rules Compliance (po revert):**
- ✅ Preserve existing runtime behavior
- ✅ Minimal changes (revert to working state)
- ✅ NO new abstractions that break framework fundamentals

**Kontrakt:**
```typescript
// CanvasAdapter
interface CanvasAdapterProps {
  vm: BoardViewModel & AnimationViewModel;
  cmd: BoardCommands;
  config: CanvasConfig;
}

// CanvasElements
interface CanvasElementsProps {
  elements: BoardElement[];
  selectedIds: string[];
  pitchConfig: PitchConfig;
  layerVisibility: LayerVisibility;
  isPlaying: boolean;
  interpolators: {
    position: (id: string, pos: Position) => Position;
    zone: (id: string, pos: Position, w: number, h: number) => ZoneData;
    arrow: (id: string, start: Position, end: Position) => ArrowData;
  };
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
  onResize: (id: string, width: number, height: number) => void;
}
```

**Kryteria sukcesu:**
- [ ] TypeScript 0 błędów
- [ ] Canvas działa identycznie
- [ ] CanvasElements NIE importuje store
- [ ] Shared logic: legacy canvas i BoardCanvas używają tych samych adapterów
- [ ] App.tsx/BoardPage -200 linii (przeniesione do CanvasElements)

**Szacowany czas:** 4h  
**Redukcja:** ~200 linii

---

## Podsumowanie postępu (zaktualizowane z PR0-2 + PR-11.5)

### Faza 0: CommandRegistry Foundation (PR-0, 1, 2) 🔑 KRYTYCZNE
**Cel:** UI przestaje łamać Hard Rules - przepięcie na cmd.*  
**Redukcja:** 0 linii (architecture fix)  
**Czas:** ~4h  
**App.tsx po fazie:** 1661 linii (no change, ale COMPLIANT z rules)

**Kluczowe osiągnięcie:**
- ✅ UI używa TYLKO `cmd.*`, NIE store actions
- ✅ Intent/effect separation zaimplementowana
- ✅ History commits TYLKO na pointerUp/dragEnd
- ✅ Fundamenty pod dalszą refaktoryzację

### Faza 1: Fundament (PR-8, 9, 10)
**Cel:** Hooki domenowe z kontraktami  
**Redukcja:** ~230 linii  
**Czas:** ~4h  
**App.tsx po fazie:** ~1430 linii

### Faza 2: Orchestratory (PR-11, 11.5, 12) ⭐ Z PR-11.5!
**Cel:** Odblokowanie równoległej pracy + App jako shell  
**Redukcja:** ~800 linii (150 + 350 + 300)  
**Czas:** ~7h  
**App.tsx po fazie:** ~630 linii

**Kluczowe PR-y:**
- PR-11: ModalOrchestrator (-150)
- **PR-11.5: AppShell + BoardRoute (-350)** 🔑 Biggest win
- PR-12: BoardPage Component (-300)

### Faza 3: Canvas (PR-13)
**Cel:** Przygotowanie do BoardCanvas  
**Redukcja:** ~200 linii  
**Czas:** ~4h  
**App.tsx po fazie:** ~430 linii ✅✅

### Całkowita redukcja (skorygowana)
**Start:** 1661 linii  
**Cel końcowy:** < 600 linii ✅  
**Osiągnięty rezultat:** ~430 linii  
**Redukcja:** ~1230 linii (-74%!) 🎉

**App.tsx staje się prawdziwym shellem!**

---

## Metryki sukcesu (końcowe)

Po wszystkich PR-ach:

### Code metrics
- [ ] App.tsx < 800 linii
- [ ] 0 błędów TypeScript
- [ ] 0 eslint warnings
- [ ] 80%+ test coverage dla hooków

### Development experience
- [ ] Nowy board feature: edycja tylko BoardPage
- [ ] Nowy export format: edycja tylko ExportCommands
- [ ] Nowy modal: edycja tylko ModalOrchestrator
- [ ] Canvas change: zmiana tylko CanvasElements

### Architecture
- [ ] Moduły niezależne (nie importują się nawzajem)
- [ ] Kontrakty stabilne (vm/cmd pattern)
- [ ] Hooki testowalne (bez UI dependencies)
- [ ] Dokumentacja aktualna (MODULE_BOUNDARIES.md)

---

## Ryzyka i mitygacja

### Ryzyko: Breaking changes w UI
**Mitygacja:**
- Każd

y PR testowany manualnie
- Feature flag dla większych zmian
- Rollback plan (git branch)

### Ryzyko: Performance regression
**Mitygacja:**
- React Profiler przed/po
- Stable props (useMemo)
- Benchmark critical paths

### Ryzyko: Konflikty w PR-ach
**Mitygacja:**
- Małe, skupione PR-y
- Clear communication (co kto robi)
- Daily sync (status update)

---

## Performance Guardrails (konkretne zasady)

### P1. CanvasElements MUSI być memo + stabilne props

```typescript
// ❌ BAD - Tworzy nowe interpolatory przy każdym render
<CanvasElements
  getInterpolatedPosition={getInterpolatedPosition}
  getInterpolatedZone={getInterpolatedZone}
  getInterpolatedArrow={getInterpolatedArrow}
/>

// ✅ GOOD - Stabilna referencja do obiektu interpolatorów
const interp = useMemo(() => ({
  position: getInterpolatedPosition,
  zone: getInterpolatedZone,
  arrow: getInterpolatedArrow,
}), [getInterpolatedPosition, getInterpolatedZone, getInterpolatedArrow]);

<CanvasElements interpolators={interp} />
```

### P2. Nie przekazuj handlers inline w mapach

```typescript
// ❌ BAD - Tworzy nową funkcję dla każdego elementu
{elements.map(el => (
  <Node onSelect={() => selectElement(el.id, false)} />
))}

// ✅ GOOD - Handler ze stable identity
const handleSelect = useCallback((id: string) => {
  selectElement(id, false);
}, [selectElement]);

{elements.map(el => (
  <Node onSelect={handleSelect} />
))}
```

### P3. cmd obiekty powinny być stabilne (useCallback w facades)

```typescript
// Hook facade powinien zwracać stabilne cmd
export function useBoardFacade() {
  const cmd = useMemo(() => ({
    select: useCallback((id, add) => selectElement(id, add), []),
    move: useCallback((id, pos) => moveElement(id, pos), []),
    // ... all commands memoized
  }), []);
  
  return { vm, cmd };
}
```

### P4. RAF closure gotchas - ZAWSZE używaj getters

```typescript
// ❌ BAD - Stale closure w RAF loop
useEffect(() => {
  const animate = () => {
    if (currentStepIndex >= totalSteps) { // Stale values!
      pause();
    }
  };
  requestAnimationFrame(animate);
}, []);

// ✅ GOOD - Fresh values via getters
useEffect(() => {
  const animate = () => {
    if (getCurrentStepIndex() >= getStepsCount()) { // Always fresh!
      pause();
    }
  };
  requestAnimationFrame(animate);
}, [getCurrentStepIndex, getStepsCount]);
```

---

## Definition of Done (checklist per PR)

Każdy PR refaktoryzacyjny MUSI spełniać:

### ✅ Code Quality
- [ ] TypeScript: 0 błędów (`pnpm typecheck`)
- [ ] ESLint: 0 warnings (`pnpm lint`)
- [ ] Formatowanie: Prettier applied
- [ ] No console.log (除非 intentional debug logging)

### ✅ Functionality
- [ ] Feature działa identycznie jak przed refaktorem
- [ ] Manual testing: podstawowe user flows
- [ ] Performance: brak widocznego spowolnienia
- [ ] React DevTools Profiler: sprawdzone re-renders

### ✅ Architecture
- [ ] **NO new integration points** w App.tsx (除非 planned)
- [ ] **NO UI imports in hooks** (toast, modal, components)
- [ ] Kontrakty zdefiniowane (vm/cmd interfaces)
- [ ] Hooks testowalne w izolacji

### ✅ Documentation
- [ ] MODULE_BOUNDARIES.md zaktualizowane
- [ ] REFACTOR_ROADMAP.md: status PR zmieniony na ✅
- [ ] JSDoc dla publicznych API hooków
- [ ] Inline comments dla non-obvious logic

### ✅ Testing (sensowne minimum)
- [ ] Hook unit tests (jeśli zawiera logikę)
  - useAnimationInterpolation: lerp logic
  - useTextEditController: Enter/Esc/validation
- [ ] NO complex integration tests (manual testing wystarcza)
- [ ] Performance benchmark (jeśli critical path)

### ✅ Git & Review
- [ ] PR ma jasn

y title i description
- [ ] Commits atomic (jeden concern per commit)
- [ ] Code review: min. 1 approval
- [ ] No merge conflicts
- [ ] CI passes (typecheck + lint)

### 🚫 Red Flags (NIE merguj jeśli)
- Hook ma 15+ dependencies w useCallback
- Komponent ma 20+ props bez grupowania (vm/cmd)
- Direct store imports w canvas layers
- Logika UI (showToast) w hookach domenowych
- "God hook" z 500+ liniami

---

## Następne kroki

1. **Review tego planu** z zespołem
2. **⚠️ ZACZNIJ OD PR-REFACTOR-0** (CommandRegistry scaffolding) - KRITYCZNE!
   - To jest fundament - bez tego łamiemy Hard Rules
   - Scaffolding only - zero runtime changes, minimal risk
3. **PR-REFACTOR-1, 2** (przepięcie selection + drag/move)
   - UI przestaje łamać project rules
   - Intent/effect separation enforcement
4. **Dopiero potem PR-REFACTOR-8, 9, 10** (hooks z compliance)
5. **Każdy PR przejdzie przez DoD checklist**
6. **Update progress** w dokumentacji po merge
7. **Celebrate wins** 🎉

### 🔴 Czerwona flaga: NIE zaczynam od PR-8!
Zacznięcie od animation hooks (PR-8) BEZ CommandRegistry = kontynuacja łamania rules.
**Kolejność ma znaczenie:** PR0 → PR1 → PR2 → PR8

---

**Last Updated:** 2026-01-27 (CRITICAL CORRECTION: CommandRegistry first!)  
**Next Review:** Po PR-REFACTOR-2 (compliance baseline established)
