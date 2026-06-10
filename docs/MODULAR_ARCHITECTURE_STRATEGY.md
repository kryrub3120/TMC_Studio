# Modular Architecture Strategy (TMC Studio)

## Cel
Zredukować liczbę punktów integracji w aplikacji i umożliwić równoległą pracę nad funkcjami bez dotykania `App.tsx`.
Priorytet: **kontrakty i granice modułów** > "mniej linii w App".

## Dlaczego teraz
- `App.tsx` stał się "integratorem wszystkiego" (UI, store, canvas, animacje, edycja inline, projekty, billing).
- Rośnie koszt zmian i konflikty PR.
- Nowa architektura canvas (BoardCanvas) wymaga czystych kontraktów, żeby nie duplikować logiki.

---

## Zasady architektoniczne (Hard Rules)

### R1. Mniej punktów integracji > mniej linii
Refaktor uznajemy za udany, jeśli:
- nowy feature da się dodać w module bez edycji `App.tsx` (albo z minimalną zmianą "wiring"),
- logika interakcji/animacji/edycji ma jedno źródło prawdy.

### R2. Kontrakty przed komponentami
Zanim wyciągniemy JSX do `CanvasElements`, najpierw definiujemy:
- `vm` (view-model) — dane do renderu,
- `cmd` (commands) — akcje użytkownika.

Komponenty nie "znają" store ani routera, biorą `vm/cmd`.

### R3. Hooki nie zależą od UI
Hooki domenowe (board/animation/edit) nie importują:
- toastów,
- modali,
- komponentów UI.

Zamiast tego dostają callbacki typu `onNotify`, `onRequestUpgrade`, `onOpenModal`.

### R4. Registry modularny > monolityczny config
Command palette / skróty / akcje: struktura "registry per module".
Nie tworzymy jednego `commandActions.ts`, który stanie się nowym App.

### R5. App jako shell
`App.tsx` docelowo:
- routuje,
- składa "orchestratory" (BoardPage, ModalOrchestrator),
- nie zawiera logiki domenowej board/animacji/edycji.

### R6. Sub-commands > monolityczny cmd
Commands dzielimy na sub-domains (canvas, selection, history), nie jeden worek 30 funkcji.

```typescript
// ❌ BAD - Monolityczny cmd
interface BoardCommands {
  addPlayer: () => void;
  selectElement: () => void;
  undo: () => void;
  // ... 27 more functions
}

// ✅ GOOD - Sub-commands
interface BoardCommands {
  canvas: CanvasCommands;      // 5-7 funkcji
  selection: SelectionCommands; // 4-5 funkcji
  history: HistoryCommands;     // 3 funkcje
}
```

**Korzyści:**
- Łatwiejsze memoization (mniejsze grupy)
- Jasne granice odpowiedzialności
- Lepszy DX (intellisense grupuje logicznie)

---

## Docelowa struktura folderów

Proponowany układ (przykład):

```
src/
  app/
    AppShell.tsx                # Main composition root
    routes.tsx                  # Routing configuration
    providers/
      StoreProvider.tsx
      AuthProvider.tsx
    orchestrators/
      ModalOrchestrator.tsx     # Centralized modal management
      
  features/
    board/
      BoardPage.tsx             # Main board page composition
      canvas/
        CanvasAdapter.tsx       # Contract adapter for canvas
        CanvasElements.tsx      # Pure canvas rendering
      contracts/
        boardVm.ts              # Board view-model type
        boardCmd.ts             # Board commands interface
      hooks/
        useBoardFacade.ts       # Public API for board module
      commands/
        boardCommands.ts        # Board-specific command palette actions
        
    animation/
      hooks/
        useAnimationPlayback.ts     # Animation orchestration
        useAnimationInterpolation.ts # Position/zone interpolation
      contracts/
        animationVm.ts          # Animation view-model
        
    edit/
      hooks/
        useTextEditController.ts    # Inline text editing
      contracts/
        editVm.ts               # Edit view-model (overlay positioning)
        
    projects/
      hooks/
        useProjectsController.ts    # (Already exists)
      contracts/
        projectsVm.ts
        
    billing/
      hooks/
        useBillingController.ts     # (Already exists)
      contracts/
        billingVm.ts
        
    account/
      hooks/
        useSettingsController.ts    # (Already exists)
      contracts/
        accountVm.ts
        
    ui/
      commands/
        viewCommands.ts         # View/UI command palette actions
        exportCommands.ts       # Export command palette actions
```

---

## Metryki sukcesu

- **App.tsx**: < 400–600 linii (w dłuższym horyzoncie), w krótkim: App "stabilny", rzadko dotykany.
- **80% zmian feature'owych** nie wymaga edycji App.
- **Canvas legacy i BoardCanvas** korzystają z tych samych controllerów (interakcje/animacje/edycja).
- **PR-y mniejsze**, mniej konfliktów.

---

## Strategia migracji (bez "big bang")

### Faza 1: Fundament (kontrakty i hooki)
1. **Ekstrakcje o wysokim ROI**: animation/edit/commands (kontrakty).
2. Każdy hook zwraca **vm + cmd**, nie pojedyncze wartości.
3. Hooki są **niezależne od UI** (callbacks zamiast toast/modal).

### Faza 2: Orchestratory
4. Wydzielenie `BoardPage` i `ModalOrchestrator`.
5. App.tsx przestaje być "integratorem wszystkiego".

### Faza 3: Canvas
6. `CanvasAdapter` (vm/cmd → props).
7. `CanvasElements` (czyste JSX, bez logiki).

### Faza 4: Migracja na BoardCanvas
8. Stopniowe przełączanie na BoardCanvas (feature flag).
9. Sharing controllers między legacy a nowym canvasem.
10. Usunięcie legacy canvas.

---

## Anti-patterny (czego unikamy)

### ❌ Props Hell
```typescript
// BAD - 30 propsów bez kontraktu
<CanvasElements
  elements={elements}
  selectedIds={selectedIds}
  isPlaying={isPlaying}
  zoom={zoom}
  theme={theme}
  onSelect={onSelect}
  onDrag={onDrag}
  onResize={onResize}
  // ... 22 more props
/>
```

**Rozwiązanie:** Kontrakt vm/cmd
```typescript
// GOOD - 2-3 stabilne kontrakty
<CanvasElements
  vm={boardVm}        // view-model (dane)
  cmd={boardCmd}      // commands (akcje)
  config={canvasConfig}
/>
```

### ❌ Mega-selector hook
```typescript
// BAD - Zwraca wielki obiekt, ryzyko rerenderów
function useBoardSelectors() {
  return {
    elements: useBoardStore(s => s.elements),
    selectedIds: useBoardStore(s => s.selectedIds),
    zoom: useUIStore(s => s.zoom),
    // ... 30 more selectors
  };
}
```

**Rozwiązanie:** Małe, skupione selektory
```typescript
// GOOD - Grupowane tematycznie
function useBoardElements() { ... }
function useBoardSelection() { ... }
function useBoardGroups() { ... }
```

### ❌ Hook z side effects UI
```typescript
// BAD - Hook wyświetla toast bezpośrednio
function useAnimationPlayback() {
  const play = () => {
    if (steps.length < 2) {
      showToast('Need at least 2 steps'); // ❌
      return;
    }
    // ...
  };
}
```

**Rozwiązanie:** Callbacks
```typescript
// GOOD - Hook dostaje callback
function useAnimationPlayback({ onNotify }) {
  const play = () => {
    if (steps.length < 2) {
      onNotify('Need at least 2 steps'); // ✅
      return;
    }
    // ...
  };
}
```

### ❌ Centralny monolityczny registry
```typescript
// BAD - Jeden plik na wszystko
// commands/allCommands.ts (1000+ linii)
export const ALL_COMMANDS = [
  ...boardCommands,
  ...exportCommands,
  ...viewCommands,
  ...editCommands,
  // ... becomes unmanageable
];
```

**Rozwiązanie:** Registry per module
```typescript
// GOOD - Modułowe
// features/board/commands/boardCommands.ts
// features/export/commands/exportCommands.ts
// features/view/commands/viewCommands.ts

// App.tsx tylko składa:
const commands = [
  ...createBoardCommands(deps),
  ...createExportCommands(deps),
  ...createViewCommands(deps),
];
```

---

## Przykłady dobrych kontraktów

### Board View-Model
```typescript
// features/board/contracts/boardVm.ts
export interface BoardViewModel {
  // Elements
  elements: BoardElement[];
  selectedIds: string[];
  hiddenByGroup: Set<string>;
  
  // Animation state
  isPlaying: boolean;
  animationProgress: number;
  
  // View state
  layerVisibility: LayerVisibility;
  zoom: number;
  
  // Interpolators (if animating)
  getInterpolatedPosition?: (id: string, pos: Position) => Position;
  getInterpolatedZone?: (id: string, pos: Position, w: number, h: number) => ZoneInterpolated;
  getInterpolatedArrow?: (id: string, start: Position, end: Position) => ArrowInterpolated;
}
```

### Board Commands
```typescript
// features/board/contracts/boardCmd.ts
export interface BoardCommands {
  // Selection
  selectElement: (id: string, addToSelection: boolean) => void;
  clearSelection: () => void;
  
  // Manipulation
  moveElement: (id: string, position: Position) => void;
  resizeZone: (id: string, width: number, height: number) => void;
  
  // History
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}
```

### Animation View-Model
```typescript
// features/animation/contracts/animationVm.ts
export interface AnimationViewModel {
  isPlaying: boolean;
  isLooping: boolean;
  progress: number;
  currentStepIndex: number;
  totalSteps: number;
  stepDuration: number;
}

export interface AnimationCommands {
  play: () => void;
  pause: () => void;
  toggleLoop: () => void;
  setDuration: (seconds: number) => void;
  goToStep: (index: number) => void;
}
```

---

## Harmonogram refaktoryzacji

Zobacz: `docs/REFACTOR_ROADMAP.md` dla szczegółowego planu implementacji.

**Priorytety:**
1. ✅ **PR-REFACTOR-5,6,7**: Settings, Drawing, Canvas Events (DONE)
2. 🔄 **PR-REFACTOR-8**: Animation (playback + interpolation)
3. 🔄 **PR-REFACTOR-9**: Text/Player Edit Controller
4. 🔄 **PR-REFACTOR-10**: Command Registry (modularny)
5. ⏳ **PR-REFACTOR-11**: BoardPage + ModalOrchestrator
6. ⏳ **PR-REFACTOR-12**: CanvasAdapter + CanvasElements

---

## Performance (kluczowe zasady)

### P1. Stabilne props dla memo components

Canvas layers używają `React.memo` - każda niestabilna prop powoduje rerender.

```typescript
// ❌ BAD - Inline object (nowa referencja przy każdym render)
<CanvasElements
  interpolators={{
    position: getInterpolatedPosition,
    zone: getInterpolatedZone,
    arrow: getInterpolatedArrow,
  }}
/>

// ✅ GOOD - useMemo dla obiektów
const interpolators = useMemo(() => ({
  position: getInterpolatedPosition,
  zone: getInterpolatedZone,
  arrow: getInterpolatedArrow,
}), [getInterpolatedPosition, getInterpolatedZone, getInterpolatedArrow]);

<CanvasElements interpolators={interpolators} />
```

### P2. RAF closure gotchas (bardzo ważne!)

RequestAnimationFrame tworzy closures - wartości w deps mogą być stale.

```typescript
// ❌ BAD - Stale values w RAF loop
useEffect(() => {
  let animId: number;
  const animate = () => {
    // currentStepIndex i totalSteps są STALE (z czasu utworzenia closure)!
    if (currentStepIndex >= totalSteps) {
      pause();
      return;
    }
    animId = requestAnimationFrame(animate);
  };
  animId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animId);
}, [isPlaying]); // deps NIE zawierają currentStepIndex/totalSteps

// ✅ GOOD - Getters dla fresh values
useEffect(() => {
  let animId: number;
  const animate = () => {
    // getCurrentStepIndex() i getStepsCount() zwracają AKTUALNE wartości
    if (getCurrentStepIndex() >= getStepsCount()) {
      pause();
      return;
    }
    animId = requestAnimationFrame(animate);
  };
  animId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animId);
}, [getCurrentStepIndex, getStepsCount, isPlaying]); // getters w deps
```

### P3. Nie tworzymy handlers inline w mapach

```typescript
// ❌ BAD - Nowa funkcja dla KAŻDEGO elementu przy każdym render
{elements.map(el => (
  <PlayerNode
    key={el.id}
    onSelect={() => selectElement(el.id, false)}  // NOWA funkcja każdy render!
  />
))}

// ✅ GOOD - Stable handler
const handleSelect = useCallback((id: string) => {
  selectElement(id, false);
}, [selectElement]);

{elements.map(el => (
  <PlayerNode
    key={el.id}
    onSelect={handleSelect}  // Ta sama referencja
  />
))}
```

### P4. cmd obiekty powinny być stabilne

Facades zwracają cmd - muszą być memoized, inaczej każdy render = nowe cmd.

```typescript
// ❌ BAD - Nowy obiekt cmd przy każdym wywołaniu hooka
export function useBoardFacade() {
  const select = (id, add) => selectElement(id, add);
  const move = (id, pos) => moveElement(id, pos);
  
  return {
    vm: { elements, selectedIds },
    cmd: { select, move },  // ❌ Nowy obiekt!
  };
}

// ✅ GOOD - Stabilny cmd z useMemo + useCallback
export function useBoardFacade() {
  const select = useCallback((id, add) => selectElement(id, add), []);
  const move = useCallback((id, pos) => moveElement(id, pos), []);
  
  const cmd = useMemo(() => ({
    select,
    move,
  }), [select, move]);
  
  return { vm, cmd };
}
```

### P5. Narzędzia do debugowania performance

```bash
# React DevTools Profiler
1. Otwórz DevTools
2. Tab "Profiler"
3. Start recording
4. Wykonaj akcję (np. drag element)
5. Stop recording
6. Sprawdź "Ranked" view - które komponenty renderują najczęściej

# Szukaj:
- Komponenty renderujące >10 razy na jedną akcję
- Długie flamegraph bars (>16ms)
- Components bez memo przy częstych zmianach props
```

---

## Zasady code review

Podczas review PR-ów refaktoryzacyjnych sprawdzamy:

### ✅ Checklist refaktoryzacji
- [ ] Hook zwraca vm/cmd, nie 20 pojedynczych wartości?
- [ ] Hook NIE importuje komponentów UI (toast, modal)?
- [ ] Hook NIE zawiera logiki UI (pokazywanie modalów)?
- [ ] Kontrakt (vm/cmd) jest wyraźnie zdefiniowany?
- [ ] Komponenty otrzymują kontrakty, nie surowy store?
- [ ] Testy jednostkowe dla hooka (jeśli logika domenowa)?
- [ ] Dokumentacja zaktualizowana (MODULE_BOUNDARIES.md)?

### ❌ Red flags
- Hook z 15+ zależnościami w useCallback
- Komponent z 20+ propsami bez grupowania
- Bezpośrednie importy store w komponentach canvas
- Logika UI wewnątrz hooków domenowych
- "God hook" z 500+ liniami

---

## Narzędzia i praktyki

### TypeScript strict mode
Wszystkie moduły tworzone w strict mode:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`

### Linting
ESLint rules dla modułów:
- No default exports (named exports only)
- No circular dependencies
- Enforce import order

### Testing
Unit testy dla:
- Hooków domenowych (animation, edit, board logic)
- Kontraktów API (vm/cmd creators)
- Services

Integration testy dla:
- Orchestratorów (BoardPage, ModalOrchestrator)
- Flows (user journeys)

---

## Migracja istniejącego kodu

### Jak migrować stopniowo

1. **Najpierw wydziel hook** z czystą logiką
2. **Zdefiniuj kontrakt** (vm/cmd interfaces)
3. **Refactor App.tsx** do używania kontraktu
4. **Dodaj testy** do hooka
5. **Dokumentuj** w MODULE_BOUNDARIES.md

### Co NIE robić
- ❌ Nie rób "big bang" refaktoru całego App
- ❌ Nie przenoś tylko JSX bez zmiany struktury
- ❌ Nie twórz nowych hooków ze starymi antypat

ternami
- ❌ Nie łam istniejącego działającego kodu bez testów

---

## Relate Documentation

- **Module Boundaries**: `docs/MODULE_BOUNDARIES.md` - Konkretne granice i API modułów
- **Refactor Roadmap**: `docs/REFACTOR_ROADMAP.md` - Plan implementacji
- **Architecture Overview**: `docs/ARCHITECTURE_OVERVIEW.md` - Ogólna architektura
- **Project Rules**: `.github/copilot-instructions.md` - Hard rules PR0

---

**Last Updated**: 2026-01-27  
**Status**: Living document - aktualizuj podczas refaktoryzacji
