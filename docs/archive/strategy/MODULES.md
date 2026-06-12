# Modules

This document provides an overview of all modules in TMC Studio, their responsibilities, and their relationships.

## Module Structure

TMC Studio is organized as a monorepo with clear separation of concerns:

```
TMC Studio/
├── packages/          # Reusable packages
│   ├── board/        # Canvas rendering components
│   ├── core/         # Core types and logic
│   ├── presets/      # Formations and templates
│   └── ui/           # React UI components
│
├── apps/web/         # Main application
│   ├── commands/     # Command pattern orchestration
│   ├── components/   # App-specific components
│   ├── hooks/        # React hooks
│   ├── lib/          # Business logic libraries
│   ├── services/     # Cross-cutting services
│   └── store/        # Zustand state management
│
└── netlify/          # Serverless functions
    └── functions/    # Stripe & payment handlers
```

---

## Package Modules

### 📦 packages/board

**Purpose:** Konva-based canvas rendering components

**Exports:**
- `PlayerNode` - Renders player on canvas
- `BallNode` - Renders ball element
- `ArrowNode` - Renders pass/run arrows
- `ZoneNode` - Renders tactical zones
- `DrawingNode` - Renders freehand drawings
- `TextNode` - Renders text labels
- `EquipmentNode` - Renders cones, flags, etc.
- `Pitch` - Renders football pitch background
- `SelectionBox` - Renders selection rectangle
- `DrawingPreview` - Shows drawing in progress

**Dependencies:**
- `react`
- `react-konva`
- `konva`
- `@tmc/core` (for types)

**Key Characteristics:**
- Pure rendering components
- Receive data via props (no store access)
- Use React.memo for performance
- Konva-specific implementation details

**Used By:**
- Canvas layers in `apps/web/src/components/Canvas/layers/`

---

### 📦 packages/core

**Purpose:** Core types, interfaces, and shared business logic

**Exports:**

**Types:**
- `BoardElement` - Union of all element types
- `Player`, `Ball`, `Arrow`, `Zone`, `Drawing`, `Text`
- `Step` - Animation step data structure
- `TeamSettings` - Team customization
- `PitchSettings` - Pitch configuration

**Functions:**
- `createStep()` - Factory for creating steps
- `cloneStep()` - Deep clone step data
- `serializeBoard()` - Serialize to JSON
- `deserializeBoard()` - Parse from JSON

**Dependencies:**
- None (pure TypeScript)

**Key Characteristics:**
- Zero runtime dependencies
- Type-safe interfaces
- Serialization/deserialization logic
- Shared across all packages

**Used By:**
- All other packages and app code

---

### 📦 packages/presets

**Purpose:** Pre-configured formations and templates

**Exports:**
- `formations` - Array of football formations
  - `4-3-3`, `4-4-2`, `4-4-2♦`, `4-2-3-1`, `3-5-2`, `5-3-2`
- `Formation` type
- `applyFormation()` - Helper to apply formation

**Dependencies:**
- `@tmc/core` (for types)

**Key Characteristics:**
- Static data structures
- Easy to extend with new formations
- Position data for home/away teams

**Used By:**
- `apps/web/src/App.tsx` (formation shortcuts)
- Command palette

---

### 📦 packages/ui

**Purpose:** Reusable React UI components

**Exports:**

**Modals:**
- `AuthModal` - Login/register
- `PricingModal` - Plan comparison
- `LimitReachedModal` - Limit explanation
- `UpgradeSuccessModal` - Upgrade confirmation
- `SettingsModal` - App settings
- `CommandPaletteModal` - Cmd+K palette
- `CreateFolderModal`, `FolderOptionsModal`

**Panels & Toolbars:**
- `TopBar` - Top navigation
- `Toolbar` - Left tools panel
- `RightInspector` - Right inspector panel
- `RightPanel` - Right panel container
- `BottomStepsBar` - Steps timeline
- `SelectionToolbar` - Quick edit toolbar
- `UserMenu` - User dropdown

**Specialized:**
- `PitchPanel` - Pitch customization
- `TeamsPanel` - Team settings
- `ProjectsDrawer` - Cloud projects
- `EmptyStateOverlay` - Empty state
- `CheatSheetOverlay` - Keyboard shortcuts
- `ZoomWidget` - Zoom controls
- `Footer` - App footer

**Low-Level:**
- `Button` - Base button component
- `ContextMenu` - Right-click menu
- `ToastHint` - Toast notifications
- `ShortcutsHint` - Keyboard hint overlay
- `QuickEditOverlay` - Inline editing
- `FolderColorPicker` - Color picker

**Dependencies:**
- `react`
- No Zustand (receives state via props)
- Tailwind CSS for styling

**Key Characteristics:**
- Stateless where possible
- Accept callbacks via props
- No business logic
- Reusable across projects

**Used By:**
- `apps/web/src/App.tsx` (composition)

---

## App Modules

### 🔧 apps/web/commands

**Purpose:** Command pattern orchestration

**Exports:**
- `CommandRegistry` - Map of all commands
- Command types: `IntentCommand`, `EffectCommand`

**Commands:**

**Intent (no side effects):**
- `move`, `drag`, `resize`, `hover`

**Effect (with history + autosave):**
- `addPlayer`, `addBall`, `addArrow`, `addZone`, `addText`
- `deleteElements`, `duplicateElements`, `pasteElements`
- `groupElements`, `ungroupElements`
- `addStep`, `deleteStep`, `renameStep`

**Dependencies:**
- `apps/web/store` (calls store actions)

**Key Characteristics:**
- Orchestrates multiple store actions
- Separates intent from effect
- Entry point for complex operations

**Used By:**
- `apps/web/src/App.tsx`
- Canvas layers (for user interactions)
- Keyboard shortcuts

---

### 🧩 apps/web/components

**Purpose:** App-specific components

**Structure:**
```
components/
├── CanvasShell.tsx        # Canvas wrapper
└── Canvas/
    ├── BoardCanvas.tsx    # Main canvas component
    └── layers/
        ├── PitchLayer.tsx     # Pitch rendering
        ├── ZonesLayer.tsx     # Zones rendering
        ├── ArrowsLayer.tsx    # Arrows rendering
        ├── PlayersLayer.tsx   # Players rendering
        ├── DrawingLayer.tsx   # Drawings rendering
        └── OverlayLayer.tsx   # Input handling
```

**Key Characteristics:**
- Layers are pure renderers
- Only OverlayLayer handles input
- Receive data via props (no store imports)
- Use React.memo

**Used By:**
- `apps/web/src/App.tsx`

---

### 🪝 apps/web/hooks

**Purpose:** Custom React hooks

**Exports:**
- `useAnimationPlayback` - Animation playback logic
- `useCanvasInteraction` - Canvas input handling
- `useEntitlements` - Plan & permissions
- `useInterpolation` - Step interpolation
- `useKeyboardShortcuts` - Keyboard handling

**Dependencies:**
- `react`
- `apps/web/store` (reads state)
- `apps/web/lib` (business logic)

**Key Characteristics:**
- Encapsulate React patterns
- Subscribe to Zustand store
- Return derived state

**Used By:**
- `apps/web/src/App.tsx`
- Canvas components

---

### 📚 apps/web/lib

**Purpose:** Business logic libraries (no React)

**Exports:**

**entitlements.ts:**
- `Plan` type (`guest`/`free`/`pro`/`team`)
- `can()` - Permission checker
- `derivePlan()` - Plan derivation
- `ENTITLEMENTS_BY_PLAN` - Entitlements matrix

**supabase.ts:**
- `supabase` - Supabase client
- Database helpers
- Auth helpers

**Dependencies:**
- `@supabase/supabase-js`

**Key Characteristics:**
- Pure functions where possible
- No React dependencies
- Testable business logic

**Used By:**
- `apps/web/hooks/useEntitlements`
- `apps/web/src/App.tsx`
- Services

---

### ⚙️ apps/web/services

**Purpose:** Cross-cutting concerns and side effects

**Exports:**

**AutosaveService:**
- `init()` - Setup autosave
- `trigger()` - Trigger save
- `cancel()` - Cancel pending save
- Debounced cloud sync (1.5s)

**ExportService:**
- `exportPNG()` - Export single PNG
- `exportAllPNGs()` - Export all steps
- `exportGIF()` - Export animated GIF
- `exportPDF()` - Export multi-page PDF
- `exportSVG()` - Export SVG

**KeyboardService:**
- `registerShortcut()` - Register keyboard shortcut
- `unregisterShortcut()` - Remove shortcut
- `handleKeyPress()` - Global key handler

**Dependencies:**
- `jspdf` (lazy loaded)
- `gifenc` (lazy loaded)
- Konva stage reference

**Key Characteristics:**
- Singleton or utility modules
- Manage side effects
- No UI rendering

**Used By:**
- `apps/web/src/App.tsx`

---

### 🗄️ apps/web/store

**Purpose:** Zustand state management

**Stores:**

**useBoardStore (main state):**
- `documentSlice` - Project metadata
- `elementsSlice` - Players, arrows, zones, etc.
- `stepsSlice` - Animation steps
- `historySlice` - Undo/redo
- `selectionSlice` - Selected elements
- `groupsSlice` - Element grouping
- `drawingSlice` - Drawing tool state

**useAuthStore:**
- `user` - Authenticated user
- `isAuthenticated` - Auth state
- `signIn()`, `signOut()`, `signUp()`

**useUIStore:**
- `theme` - Dark/light mode
- `focusMode` - Focus mode toggle
- Feature flags

**Dependencies:**
- `zustand`

**Key Characteristics:**
- Slices are independent
- No cross-slice calls
- Orchestration via commands
- Type-safe actions

**Used By:**
- Everywhere (via hooks)

---

## Serverless Modules

### ☁️ netlify/functions

**Purpose:** Serverless backend functions

**Functions:**

**create-checkout.ts:**
- Creates Stripe Checkout session
- Input: `priceId`, `userId`
- Output: Checkout URL

**create-portal-session.ts:**
- Creates Stripe Customer Portal session
- Input: `customerId`
- Output: Portal URL

**stripe-webhook.ts:**
- Handles Stripe webhook events
- Updates user subscription tier
- Events: `checkout.session.completed`, `customer.subscription.*`

**health.ts:**
- Health check endpoint
- Returns: `{ status: 'ok' }`

**Dependencies:**
- `stripe`
- `@supabase/supabase-js`

**Key Characteristics:**
- Serverless (auto-scale)
- Secure (API keys in env)
- Event-driven

**Used By:**
- Frontend (create checkout/portal)
- Stripe (webhooks)

---

## Module Dependency Graph

```
           ┌──────────┐
           │   core   │
           └────┬─────┘
                │
      ┌─────────┼─────────┐
      │         │         │
  ┌───▼───┐ ┌──▼───┐ ┌───▼────┐
  │ board │ │  ui  │ │presets │
  └───┬───┘ └──┬───┘ └───┬────┘
      │        │         │
      └────────┼─────────┘
               │
          ┌────▼────┐
          │apps/web │
          │         │
          │ ┌──────────┐
          │ │commands  │
          │ ├──────────┤
          │ │components│
          │ ├──────────┤
          │ │  hooks   │
          │ ├──────────┤
          │ │   lib    │
          │ ├──────────┤
          │ │ services │
          │ ├──────────┤
          │ │  store   │
          │ └──────────┘
          └────┬────┘
               │
        ┌──────▼───────┐
        │netlify/funcs │
        └──────────────┘
```

---

## Adding New Modules

### When to Create a New Module

**Create a new package when:**
- ✅ Logic is reusable across apps
- ✅ Has clear, single responsibility
- ✅ Can be tested in isolation
- ✅ Has stable API

**Keep in app/ when:**
- ❌ App-specific logic
- ❌ Tightly coupled to app structure
- ❌ Changes frequently
- ❌ Uses app-specific state

### Module Checklist

When creating a new module:

1. **Define responsibility** - One sentence description
2. **List exports** - What does it expose?
3. **Declare dependencies** - What does it import?
4. **Write README** - Usage examples
5. **Add to this doc** - Update MODULES.md

---

## Module Principles

### 1. Dependency Direction

```
Packages → Never import from apps/
Apps → Can import from packages/
```

### 2. No Circular Dependencies

If A imports B, B cannot import A.

### 3. Clear Boundaries

Each module has a single, well-defined responsibility.

### 4. Stable APIs

Public exports should change rarely. Internal implementation can evolve.

### 5. Minimal Dependencies

Each module should have the minimum dependencies needed.

---

## Related Documentation

- **Architecture:** `docs/ARCHITECTURE_OVERVIEW.md`
- **Commands:** `docs/COMMANDS_MAP.md`
- **State:** `docs/ZUSTAND_SLICES.md`

---

**Remember:** Modules exist to organize code by responsibility. When in doubt, follow the existing patterns.
