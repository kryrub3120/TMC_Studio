# Module Boundaries & Contracts

Definicje granic modułów, publicznych API i zależności. Każdy moduł jest niezależną jednostką funkcjonalności z wyraźnie zdefiniowanym kontraktem.

---

## BoardModule (canvas, elements, selection)

**Lokalizacja docelowa:** `src/features/board/`

### Publiczne API

```typescript
// hooks/useBoardFacade.ts
export function useBoardFacade(): {
  vm: BoardViewModel;
  cmd: BoardCommands;
}

interface BoardViewModel {
  elements: BoardElement[];
  selectedIds: string[];
  hiddenByGroup: Set<string>;
  layerVisibility: LayerVisibility;
  groups: Group[];
  pitchSettings: PitchSettings;
  teamSettings: TeamSettings;
}

// ⚠️ IMPORTANT: Sub-commands pattern, NIE monolityczny cmd!
interface BoardCommands {
  canvas: CanvasCommands;      // 5-7 funkcji - dodawanie elementów
  selection: SelectionCommands; // 4-5 funkcji - selekcja
  history: HistoryCommands;     // 3 funkcje - undo/redo
}

interface CanvasCommands {
  addPlayer: (team: 'home' | 'away', position?: Position) => void;
  addBall: (position?: Position) => void;
  addArrow: (type: 'pass' | 'run', start?: Position) => void;
  addZone: (shape: 'rect' | 'ellipse', position?: Position) => void;
  moveElement: (id: string, position: Position) => void;
  resizeZone: (id: string, width: number, height: number) => void;
  updateElement: (id: string, updates: Partial<BoardElement>) => void;
}

interface SelectionCommands {
  select: (id: string, addToSelection: boolean) => void;
  clear: () => void;
  selectAll: () => void;
  selectInRect: (start: Position, end: Position) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copy: () => void;
  paste: () => void;
}

interface HistoryCommands {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}
```

**Dlaczego sub-commands?**
- ❌ Monolityczny cmd z 30 funkcjami → props hell, zarządzanie zależnościami
- ✅ Sub-commands → jasne granice, łatwiejsze memoization, lepszy DX

### Zależności
- ✅ **Może importować:** `@tmc/core` (types), `store` (Zustand)
- ❌ **Nie może importować:** `AnimationModule`, `ProjectsModule`, UI components
- ⚠️ **Callback dependency:** `onNotify` dla user feedback

### Wewnętrzne moduły
- `canvas/` - CanvasAdapter, CanvasElements (rendering)
- `hooks/` - useBoardFacade, useBoard

Selection, useBoardDrawing
- `commands/` - Board command palette actions
- `contracts/` - TypeScript interfaces

---

## AnimationModule (playback, interpolation, steps)

**Lokalizacja docelowa:** `src/features/animation/`

### Publiczne API

```typescript
// hooks/useAnimationFacade.ts
export function useAnimationFacade(): {
  playback: AnimationPlayback;
  interpolation: AnimationInterpolation;
}

interface AnimationPlayback {
  vm: {
    isPlaying: boolean;
    isLooping: boolean;
    progress: number;
    currentStepIndex: number;
    totalSteps: number;
    stepDuration: number;
  };
  cmd: {
    play: () => void;
    pause: () => void;
    toggleLoop: () => void;
    setDuration: (seconds: number) => void;
    goToStep: (index: number) => void;
    nextStep: () => void;
    prevStep: () => void;
  };
}

interface AnimationInterpolation {
  nextStepElements: BoardElement[] | null;
  getInterpolatedPosition: (id: string, current: Position) => Position;
  getInterpolatedZone: (id: string, pos: Position, w: number, h: number) => ZoneData;
  getInterpolatedArrow: (id: string, start: Position, end: Position) => ArrowData;
}
```

### Zależności
- ✅ **Może importować:** `@tmc/core` (types), `store/slices` (steps, UI)
- ❌ **Nie może importować:** `BoardModule`, `ProjectsModule`
- ⚠️ **Callback dependency:** `onAnimationComplete`, `onNotify`

### Wewnętrzne moduły
- `hooks/useAnimationPlayback.ts` - Playback orchestration (RAF loop)
- `hooks/useAnimationInterpolation.ts` - Position/zone/arrow interpolation
- `contracts/animationVm.ts` - View-model interfaces

---

## EditModule (inline editing)

**Lokalizacja docelowa:** `src/features/edit/`

### Publiczne API

```typescript
// hooks/useEditController.ts
export function useEditController(): {
  text: TextEditController;
  player: PlayerEditController;
}

interface TextEditController {
  vm: {
    editingTextId: string | null;
    editingTextValue: string;
    editingTextElement: TextElement | null;
    overlayStyle: CSSProperties;
  };
  cmd: {
    startEdit: (id: string, content: string) => void;
    updateValue: (value: string) => void;
    save: () => void;
    cancel: () => void;
    handleKeyDown: (e: KeyboardEvent) => void;
  };
}

interface PlayerEditController {
  vm: {
    editingPlayerId: string | null;
    editingPlayerNumber: string;
    editingPlayerElement: PlayerElement | null;
    overlayStyle: CSSProperties;
  };
  cmd: {
    startEdit: (id: string, currentNumber: number) => void;
    updateNumber: (value: string) => void;
    save: () => void;
    cancel: () => void;
    handleKeyDown: (e: KeyboardEvent) => void;
  };
}
```

### Zależności
- ✅ **Może importować:** `@tmc/core` (types), `store/slices` (elements)
- ❌ **Nie może importować:** `AnimationModule`, `BoardModule` (tylko types)
- ⚠️ **Callback dependency:** `onSave`, `onNotify`

### Wewnętrzne moduły
- `hooks/useTextEditController.ts`
- `hooks/usePlayerEditController.ts`
- `contracts/editVm.ts`
- `utils/overlayPositioning.ts`

---

## ProjectsModule (CRUD, folders, cloud sync)

**Lokalizacja:** `src/hooks/useProjectsController.ts` (już istnieje)

### Publiczne API

```typescript
// Istniejące - do przeniesienia do src/features/projects/
export function useProjectsController(options): ProjectsController {
  // ... existing implementation
}
```

### Zależności
- ✅ **Może importować:** `lib/supabase`, `store` (cloud projects)
- ❌ **Nie może importować:** `BoardModule`, `AnimationModule`
- ⚠️ **Callback dependency:** `onOpenLimitModal`, `onCloseDrawer`, `onNotify`

---

## BillingModule (subscriptions, payments)

**Lokalizacja:** `src/hooks/useBillingController.ts` (już istnieje)

### Publiczne API

```typescript
// Istniejące - do przeniesienia do src/features/billing/
export function useBillingController(): BillingController {
  // ... existing implementation
}
```

### Zależności
- ✅ **Może importować:** `lib/supabase`, `config/stripe`
- ❌ **Nie może importować:** `BoardModule`, `ProjectsModule`
- ⚠️ **Callback dependency:** Zarządza własnymi modalami (pricing, success)

---

## AccountModule (auth, settings, profile)

**Lokalizacja:** `src/hooks/useSettingsController.ts` (już istnieje)

### Publiczne API

```typescript
// Istniejące - do przeniesienia do src/features/account/
export function useSettingsController(options): SettingsController {
  // ... existing implementation
}
```

### Zależności
- ✅ **Może importować:** `lib/supabase`, `store/useAuthStore`
- ❌ **Nie może importować:** Inne feature modules
- ⚠️ **Callback dependency:** `onCloseModal`, `showToast`

---

## UIModule (commands, view state)

**Lokalizacja docelowa:** `src/features/ui/`

### Publiczne API

```typescript
// commands/createCommandRegistry.ts
export function createCommandRegistry(deps: CommandDeps): CommandAction[] {
  return [
    ...createBoardCommands(deps),
    ...createAnimationCommands(deps),
    ...createExportCommands(deps),
    ...createViewCommands(deps),
  ];
}

// Modułowe registry
interface CommandDeps {
  board: BoardCommands;
  animation: AnimationCommands;
  export: ExportController;
  ui: UIActions;
}
```

### Zależności
- ✅ **Może importować:** Wszystkie feature modules (orchestrator role)
- ⚠️ **Odpowiedzialność:** Składanie command palette, nie logika domenowa

---

## AppShell (PR-REFACTOR-11.5) ✅ NEW

**Lokalizacja:** `src/app/AppShell.tsx`

### Odpowiedzialności
- ✅ Global app orchestration (auth, billing, projects, settings)
- ✅ Global modals (AuthModal, PricingModal, SettingsModal, etc.)
- ✅ Projects drawer
- ✅ Footer
- ✅ Payment return flow (usePaymentReturn)
- ✅ Controller wiring (BillingController, ProjectsController, SettingsController)
- ✅ Routing (renders BoardPage as main route)

### NIE zawiera
- ❌ Canvas logic
- ❌ Board rendering
- ❌ Animation logic
- ❌ Element manipulation

### Struktura

```
src/app/
├── AppShell.tsx           (~290 linii)
│   ├── Auth state management
│   ├── Billing controller
│   ├── Projects controller  
│   ├── Settings controller
│   ├── Payment return handling
│   ├── Global modals
│   └── Footer
└── board/                 (BoardPage module)
```

---

## BoardPage (PR-REFACTOR-11.5) ✅ NEW

**Lokalizacja:** `src/app/board/BoardPage.tsx`

### Odpowiedzialności
- ✅ Board UI composition (TopBar, Canvas, Inspector, StepsBar)
- ✅ Command palette
- ✅ Canvas overlays (text edit, number edit, context menu)
- ✅ Board-related keyboard shortcuts
- ✅ Uses existing controllers/hooks (no new logic)

### NIE zawiera
- ❌ Global modals (auth, pricing, settings)
- ❌ Projects drawer
- ❌ Footer
- ❌ Payment flows

### Struktura modułu

```
src/app/board/
├── BoardPage.tsx              (~280 linii - composition only)
├── BoardTopBarSection.tsx     (~90 linii)
├── BoardCanvasSection.tsx     (~300 linii - canvas rendering)
├── BoardOverlays.tsx          (~170 linii - text/number edit, context menu)
├── useBoardPageHandlers.ts    (~270 linii - callbacks/handlers)
└── useBoardPageEffects.ts     (~280 linii - animation, interpolation, events)

src/app/routes/
└── useBoardPageState.ts       (~450 linii - all state and store access)
```

### Boundary: AppShell ↔ BoardPage

```typescript
// BoardPage receives these props from AppShell:
interface BoardPageProps {
  onOpenProjectsDrawer: () => void;
  onOpenAuthModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenPricingModal: () => void;
  onOpenLimitModal: (type, current, max) => void;
  onRenameProject: (id: string, name: string) => void;
}
```

**Key insight:** BoardPage only calls back to AppShell for global actions. All board-specific state and logic stays within the board module.

---

## Reguły zależności (Dependency Rules)

### Hierarchia modułów (Updated PR-11.5)

```
┌─────────────────────────────────────────────────────────┐
│   App.tsx (28 linii - PURE shell)                      │
│   └── <AppShell />                                      │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│   AppShell.tsx (~290 linii)                             │
│   ├── Global modals (Auth, Pricing, Settings, etc.)    │
│   ├── Projects drawer                                   │
│   ├── Controllers (Billing, Projects, Settings)        │
│   ├── Payment return flow                               │
│   ├── Footer                                            │
│   └── <BoardPage {...props} />                         │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│   BoardPage.tsx (~280 linii - composition only)         │
│   ├── TopBar                                            │
│   ├── CanvasSection (Stage, layers, overlays)          │
│   ├── RightInspector                                   │
│   ├── BottomStepsBar                                   │
│   ├── CommandPaletteModal                              │
│   └── Keyboard shortcuts                                │
└───────────────────────────┬─────────────────────────────┘
                            │
    ┌───────────────────────▼────────────────────────┐
    │  Feature Modules (niezależne)                   │
    │  - Board commands (cmd.board.*)                 │
    │  - Animation effects (useBoardPageEffects)     │
    │  - Handlers (useBoardPageHandlers)             │
    │  - State (useBoardPageState)                   │
    └─────────────────────────────────────────────────┘
```

### Zasady importów

1. **Feature modules NIE mogą importować innych feature modules**
   - ✅ `AnimationModule` może importować `@tmc/core` (types)
   - ❌ `AnimationModule` NIE może importować `BoardModule`

2. **Komunikacja przez callbacks**
   ```typescript
   // ✅ GOOD
   function useAnimation({ onNotify }) {
     if (error) onNotify('Error message');
   }
   
   // ❌ BAD
   function useAnimation() {
     if (error) showToast('Error message'); // Direct UI dependency
   }
   ```

3. **Shared code przez `@tmc/core`**
   - Types, utilities, helpers → `packages/core/`
   - UI components → `packages/ui/`
   - Canvas nodes → `packages/board/`

### ⚠️ Anti-pattern: useBoardSelectors (unikaj!)

```typescript
// ❌ BAD - "God selector" hook
function useBoardSelectors() {
  return {
    elements: useBoardStore(s => s.elements),
    selectedIds: useBoardStore(s => s.selectedIds),
    zoom: useUIStore(s => s.zoom),
    theme: useUIStore(s => s.theme),
    // ... 30 more selectors
  };
}
// Problemy:
// 1. Rerender przy każdej zmianie (nowa referencja obiektu)
// 2. Ukrywa zależności (trudny debug)
// 3. Niemożliwe do testowania w izolacji

// ✅ GOOD - Małe, skupione selektory
function useBoardElements() {
  return useBoardStore(s => s.elements);
}

function useBoardSelection() {
  return useBoardStore(s => s.selectedIds);
}

// LUB: useShallow z Zustand
import { useShallow } from 'zustand/react/shallow';

function MyComponent() {
  const { elements, selectedIds } = useBoardStore(
    useShallow(s => ({ 
      elements: s.elements, 
      selectedIds: s.selectedIds 
    }))
  );
}
```

**Zasada:** Każdy komponent bierze TYLKO to, czego potrzebuje.

---

## Migration Checklist

Podczas przenoszenia kodu do modułów:

### ✅ Pre-migration
- [ ] Zidentyfikuj wszystkie zależności (imports)
- [ ] Zdefiniuj publiczne API (vm/cmd interfaces)
- [ ] Sprawdź czy kod jest pokryty testami
- [ ] Przygotuj plan rollback (git branch)

### ✅ During migration
- [ ] Utwórz folder modułu (`src/features/[module]/`)
- [ ] Przenieś hooki do `hooks/`
- [ ] Utwórz kontrakty w `contracts/`
- [ ] Zamień bezpośrednie importy na callbacks
- [ ] Zaktualizuj `index.ts` z eksportami

### ✅ Post-migration
- [ ] Uruchom typecheck (0 błędów)
- [ ] Uruchom testy (100% pass)
- [ ] Zaktualizuj dokumentację (MODULE_BOUNDARIES.md)
- [ ] Code review z zespołem
- [ ] Merge tylko po aprobacie

---

## Przykład migracji: useAnimationPlayback

### Przed (w App.tsx)
```typescript
// App.tsx - 60 linii logiki animacji
useEffect(() => {
  if (!isPlaying) return;
  let animationFrameId;
  const animate = (timestamp) => {
    // ... 40 linii logiki RAF
    showToast('Animation complete'); // ❌ Direct UI dependency
  };
  animationFrameId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationFrameId);
}, [isPlaying, /* 10 deps */]);
```

### Po (w AnimationModule)
```typescript
// features/animation/hooks/useAnimationPlayback.ts
export function useAnimationPlayback({ onComplete, onNotify }) {
  // ... clean RAF logic
  const complete = () => {
    onNotify?.('Animation complete'); // ✅ Callback
    onComplete?.();
  };
  
  return {
    vm: { isPlaying, progress, ... },
    cmd: { play, pause, ... },
  };
}

// App.tsx - tylko wiring
const animation = useAnimationPlayback({
  onNotify: showToast,
  onComplete: () => {/* ... */},
});
```

---

## Status implementacji

### CommandRegistry Foundation (PR0-2) ✅ COMPLETE

**Zakończone 2026-01-27:**
- ✅ **PR0**: CommandRegistry Scaffolding (~600 linii, typy + pass-through)
- ✅ **PR1**: Selection → `cmd.board.selection.*` (6 plików)
- ✅ **PR2**: Drag/Move + History → `cmd.board.canvas.*` + `cmd.board.history.*` 

**Hard Rules - Now Compliant:**
- ✅ UI MUST NOT call Zustand store actions directly
- ✅ UI mutations ONLY through CommandRegistry (cmd.*)
- ✅ Intent commands (moveElementLive) have NO side effects
- ✅ Effect commands (commitUserAction) commit history ONLY on user action complete
- ✅ History commits ONLY on: pointerUp, add, delete, group, paste

**Lokalizacja:**
- `apps/web/src/commands/` - Complete CommandRegistry structure
- `apps/web/src/commands/types.ts` - Full interface definitions
- `apps/web/src/commands/board/` - Board domain (intent + effect)
- `apps/web/src/hooks/useCommandRegistry.ts` - Stable hook access

### Feature Modules Status

| Moduł | Status | Lokalizacja | Kontrakty | CommandRegistry |
|-------|--------|-------------|-----------|-----------------|
| **Board** | ✅ Foundation | `commands/board/`, `hooks/useCommandRegistry` | ✅ cmd.board.* | ✅ Compliant |
| **Animation** | ❌ TODO | `App.tsx` (inline) | ❌ Needs extraction | ⏳ Stubs ready |
| **Edit** | ❌ TODO | `App.tsx` (inline) | ❌ Needs extraction | ⏳ Stubs ready |
| **Projects** | ✅ Done | `hooks/useProjectsController` | ✅ Has interface | N/A |
| **Billing** | ✅ Done | `hooks/useBillingController` | ✅ Has interface | N/A |
| **Account** | ✅ Done | `hooks/useSettingsController` | ✅ Has interface | N/A |
| **UI/Commands** | ⏳ Partial | `App.tsx` (commandActions) | ❌ Needs split | ✅ Registry exists |

---

## Related Documentation

- **Strategy**: `docs/MODULAR_ARCHITECTURE_STRATEGY.md` - Ogólna strategia
- **Roadmap**: `docs/REFACTOR_ROADMAP.md` - Plan implementacji
- **Architecture**: `docs/ARCHITECTURE_OVERVIEW.md` - System overview

---

**Last Updated**: 2026-01-27  
**Next Review**: Po każdym PR refaktoryzacyjnym
