# 🏗️ TMC Studio — System Architecture Design

**Version:** 1.0.0  
**Created:** 2026-01-09  
**Status:** Living Document  

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [High-Level Architecture](#high-level-architecture)
3. [Package Structure](#package-structure)
4. [Data Flow](#data-flow)
5. [State Management](#state-management)
6. [Service Layer](#service-layer)
7. [Canvas Architecture](#canvas-architecture)
8. [Integration Points](#integration-points)

---

## 🎯 Executive Summary

TMC Studio is a tactical board application built as a **Turborepo monorepo** with focus on:

- **Modularity**: Separated concerns in distinct packages
- **Scalability**: Architecture designed for 10k+ LOC growth
- **Performance**: Optimized Canvas rendering with layer separation
- **Testability**: Pure functions in `packages/core`, isolated from UI

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite |
| State | Zustand (sliced stores) |
| Canvas | React-Konva |
| Backend | Supabase (Postgres + Auth + Realtime) |
| Payments | Stripe |
| Hosting | Netlify (Functions + CDN) |
| Monorepo | Turborepo + pnpm |

---

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   TopBar    │  │  Inspector  │  │  StepsBar   │  (packages/ui)
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    BoardCanvas                           │   │
│  │  ┌──────────┬──────────┬──────────┬──────────────────┐  │   │
│  │  │PitchLayer│ZonesLayer│ArrowLayer│PlayersLayer      │  │   │ (packages/board)
│  │  └──────────┴──────────┴──────────┴──────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                        STATE LAYER                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     useAppStore                          │   │
│  │  ┌────────────┬────────────┬────────────┬────────────┐  │   │
│  │  │ elements   │ selection  │  history   │   steps    │  │   │
│  │  │   Slice    │   Slice    │   Slice    │   Slice    │  │   │
│  │  └────────────┴────────────┴────────────┴────────────┘  │   │
│  │  ┌────────────┬────────────┬────────────────────────┐   │   │
│  │  │  groups    │   cloud    │   document settings    │   │   │
│  │  │   Slice    │   Slice    │        Slice           │   │   │
│  │  └────────────┴────────────┴────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │ useUIStore │  │useAuthStore│  │(middleware)│               │
│  └────────────┘  └────────────┘  └────────────┘               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                        SERVICE LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Keyboard    │  │ Animation   │  │ Export      │  (apps/web/services)
│  │ Service     │  │ Service     │  │ Service     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ CloudSync   │  │ Autosave    │  │ Canvas      │             │
│  │ Service     │  │ Service     │  │ Interaction │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                        CORE LAYER (Pure)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   types     │  │   board     │  │    step     │  (packages/core)
│  │ (domain)    │  │ (operations)│  │(transitions)│             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │serialization│  │   presets   │  (packages/presets)          │
│  │  (IO)       │  │(formations) │                              │
│  └─────────────┘  └─────────────┘                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Supabase   │  │   Stripe    │  │  Netlify    │             │
│  │ (DB/Auth)   │  │ (Payments)  │  │ (Functions) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Package Structure

### Current Structure (After Refactoring)

```
tmc-studio/
├── apps/
│   └── web/                          # Main React application
│       ├── src/
│       │   ├── App.tsx               # ~100 LOC - composition only
│       │   ├── components/
│       │   │   └── Canvas/           # Canvas-specific components
│       │   │       ├── BoardCanvas.tsx
│       │   │       └── layers/       # Konva layers
│       │   ├── hooks/                # Application hooks
│       │   │   ├── useKeyboardShortcuts.ts
│       │   │   ├── useAnimationPlayback.ts
│       │   │   ├── useCanvasInteraction.ts
│       │   │   └── useCloudSync.ts
│       │   ├── services/             # Business logic services
│       │   │   ├── KeyboardService.ts
│       │   │   ├── AnimationService.ts
│       │   │   ├── ExportService.ts
│       │   │   └── AutosaveService.ts
│       │   ├── store/                # Zustand state management
│       │   │   ├── index.ts          # Store composition
│       │   │   ├── slices/           # Individual state slices
│       │   │   └── middleware/       # Zustand middleware
│       │   ├── lib/                  # External library integrations
│       │   └── utils/                # Utility functions
│       └── index.html
│
├── packages/
│   ├── core/                         # Pure domain logic
│   │   └── src/
│   │       ├── types.ts              # Discriminated unions, interfaces
│   │       ├── board.ts              # Element operations
│   │       ├── step.ts               # Animation step logic
│   │       ├── serialization.ts      # Save/load logic
│   │       └── index.ts
│   │
│   ├── board/                        # React-Konva components
│   │   └── src/
│   │       ├── PlayerNode.tsx
│   │       ├── BallNode.tsx
│   │       ├── ArrowNode.tsx
│   │       ├── ZoneNode.tsx
│   │       ├── Pitch.tsx
│   │       └── index.ts
│   │
│   ├── ui/                           # Shared UI components
│   │   └── src/
│   │       ├── TopBar.tsx
│   │       ├── RightInspector.tsx
│   │       ├── BottomStepsBar.tsx
│   │       └── index.ts
│   │
│   └── presets/                      # Static data (formations)
│       └── src/
│           ├── formations.ts
│           └── index.ts
│
├── supabase/                         # Database & migrations
│   ├── migrations/
│   └── seed.sql
│
├── netlify/                          # Serverless functions
│   └── functions/
│
└── docs/                             # Documentation
```

### Package Responsibilities

| Package | Responsibility | Dependencies |
|---------|---------------|--------------|
| `@tmc/core` | Domain types, pure operations, serialization | None |
| `@tmc/board` | React-Konva canvas components | `@tmc/core`, `react-konva` |
| `@tmc/ui` | Shared UI components (panels, modals) | `@tmc/core`, `react` |
| `@tmc/presets` | Static data (formations, themes) | `@tmc/core` |
| `apps/web` | Application composition, state, services | All packages |

---

## 🔄 Data Flow

### Unidirectional Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      USER ACTION                             │
│  (click, keyboard, drag)                                    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   EVENT HANDLER                              │
│  (useKeyboardShortcuts, useCanvasInteraction)               │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   STATE UPDATE                               │
│  useAppStore.getState().action()                            │
│  - Slice updates                                             │
│  - Middleware (undo, autosave) triggered                    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   UI RE-RENDER                               │
│  - Only subscribed components re-render                      │
│  - Canvas layers selectively update                          │
└─────────────────────────────────────────────────────────────┘
```

### State Update Sequence (Example: Add Player)

```typescript
// 1. User presses 'P' key
useKeyboardShortcuts() → keyHandler('p')

// 2. Handler calls store action
useAppStore.getState().addPlayer({
  team: 'home',
  position: cursorPosition
})

// 3. Elements slice updates
elementsSlice.addElement(newPlayer)

// 4. History middleware captures snapshot
undoMiddleware.pushSnapshot(prevState)

// 5. Autosave middleware schedules save
autosaveMiddleware.scheduleAutoSave()

// 6. React re-renders
PlayersLayer → receives new `elements` → renders new PlayerNode
```

---

## 🗃️ State Management

### Zustand Store Architecture

```typescript
// apps/web/src/store/index.ts
export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector(
      undoMiddleware(
        autosaveMiddleware(
          (...a) => ({
            ...createElementsSlice(...a),
            ...createSelectionSlice(...a),
            ...createHistorySlice(...a),
            ...createStepsSlice(...a),
            ...createGroupsSlice(...a),
            ...createCloudSlice(...a),
            ...createDocumentSlice(...a),
          })
        )
      )
    ),
    { name: 'TMC-Board' }
  )
);
```

### Slice Responsibilities

| Slice | State | Actions |
|-------|-------|---------|
| `ElementsSlice` | `elements: BoardElement[]` | CRUD operations, move, resize |
| `SelectionSlice` | `selectedIds: string[]` | select, multi-select, clear |
| `HistorySlice` | `history: Snapshot[]`, `pointer: number` | undo, redo, push |
| `StepsSlice` | `steps: Step[]`, `currentIndex: number` | navigation, add/remove |
| `GroupsSlice` | `groups: Group[]` | create, ungroup, toggle |
| `CloudSlice` | `projectId`, `isSaving`, `projects` | sync, fetch, save |
| `DocumentSlice` | `name`, `settings`, `team/pitch config` | update meta |

### Separate Stores

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `useAppStore` | Board state | Per-project (cloud/local) |
| `useUIStore` | UI state (theme, panels) | `localStorage` |
| `useAuthStore` | Auth state | Session-based |

---

## 🎨 Canvas Architecture

### Layer Separation Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ Stage (React-Konva)                                         │
│                                                             │
│  Layer 1: PitchLayer (STATIC)                              │
│  ├─ Grass background                                        │
│  ├─ Stripes                                                 │
│  └─ Pitch lines                                             │
│  → Re-renders: Only on orientation/theme change             │
│                                                             │
│  Layer 2: ZonesLayer (SEMI-STATIC)                         │
│  └─ Zone shapes                                             │
│  → Re-renders: On zone add/remove/resize                    │
│                                                             │
│  Layer 3: ArrowsLayer (DYNAMIC)                            │
│  └─ Arrow paths                                             │
│  → Re-renders: On arrow change + animation                  │
│                                                             │
│  Layer 4: PlayersLayer (DYNAMIC)                           │
│  ├─ Player nodes                                            │
│  └─ Ball node                                               │
│  → Re-renders: On drag + animation                          │
│                                                             │
│  Layer 5: DrawingLayer (INTERACTIVE)                       │
│  └─ Freehand strokes                                        │
│  → Re-renders: During drawing                               │
│                                                             │
│  Layer 6: OverlayLayer (TRANSIENT)                         │
│  ├─ Selection box                                           │
│  ├─ Drawing preview                                         │
│  └─ Resize handles                                          │
│  → Re-renders: Mouse interaction only                       │
└─────────────────────────────────────────────────────────────┘
```

### Component Memoization Strategy

```typescript
// packages/board/src/PlayerNode.tsx
export const PlayerNode = React.memo(
  function PlayerNode({ player, isSelected, teamSettings, onDragEnd }) {
    // Use interpolation hook inside component
    const position = useInterpolatedPosition(player.id, player.position);
    
    return (
      <Group x={position.x} y={position.y}>
        {/* ... */}
      </Group>
    );
  },
  // Custom equality check
  (prev, next) => {
    return (
      prev.player.id === next.player.id &&
      prev.player.position.x === next.player.position.x &&
      prev.player.position.y === next.player.position.y &&
      prev.player.team === next.player.team &&
      prev.player.number === next.player.number &&
      prev.isSelected === next.isSelected &&
      prev.teamSettings === next.teamSettings
    );
  }
);
```

---

## 🔌 Integration Points

### Supabase Integration

```typescript
// apps/web/src/lib/supabase.ts
interface SupabaseIntegration {
  // Auth
  auth: {
    signIn: (email, password) => Promise<User>
    signUp: (email, password) => Promise<User>
    signInWithGoogle: () => Promise<User>
    signOut: () => Promise<void>
    onAuthStateChange: (callback) => Subscription
  }
  
  // Database
  projects: {
    get: (id: string) => Promise<Project>
    list: () => Promise<Project[]>
    create: (data: CreateProjectDTO) => Promise<Project>
    update: (id: string, data: UpdateProjectDTO) => Promise<Project>
    delete: (id: string) => Promise<void>
  }
  
  // Realtime (Future)
  realtime: {
    subscribeToProject: (id: string, onChange: Callback) => Subscription
    broadcastChange: (change: BoardChange) => void
  }
}
```

### Stripe Integration

```typescript
// netlify/functions/create-checkout.ts
// - Creates Stripe Checkout session
// - Handles subscription upgrade flow

// netlify/functions/stripe-webhook.ts
// - Processes payment events
// - Updates user subscription status in Supabase
```

---

## 🧭 Migration Path

> 📋 **Binding contracts & PR plan**: See [`IMPLEMENTATION_CONTRACTS.md`](./IMPLEMENTATION_CONTRACTS.md) for commit points, autosave rules, and Definition of Done.

### Phase 1: Foundation (Current)
- [x] Define architecture documentation
- [ ] Set up Zustand slices structure
- [ ] Establish Conventional Commits

### Phase 2: Service Extraction
- [ ] Extract `KeyboardService`
- [ ] Extract `AnimationService`
- [ ] Extract `CanvasInteractionService`

### Phase 3: Store Refactoring
- [ ] Implement slice pattern
- [ ] Add undo middleware
- [ ] Add autosave middleware

### Phase 4: Canvas Optimization
- [ ] Implement layer separation
- [ ] Add React.memo to board components
- [ ] Move interpolation to hooks

### Phase 5: Testing & Docs
- [ ] Unit tests for `packages/core`
- [ ] Integration tests for services
- [ ] E2E tests for critical flows

---

*Next Document: [DATA_MODEL.md](./DATA_MODEL.md)*
