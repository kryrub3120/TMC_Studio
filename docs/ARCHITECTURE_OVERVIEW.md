# Architecture Overview

This document provides a high-level overview of TMC Studio's architecture. It's designed for onboarding new developers and understanding how the system fits together.

## System Architecture

TMC Studio is a monorepo built with:
- **Frontend:** React + TypeScript + Vite
- **Canvas:** Konva.js for tactical board rendering
- **State:** Zustand for state management
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Payments:** Stripe for subscriptions
- **Deploy:** Netlify with serverless functions

## Monorepo Structure

```
TMC Studio/
├── apps/
│   └── web/                    # Main application
│       ├── src/
│       │   ├── App.tsx         # Root composition
│       │   ├── commands/       # Command registry
│       │   ├── components/     # React components
│       │   │   └── Canvas/     # Board canvas layers
│       │   ├── hooks/          # React hooks
│       │   ├── lib/            # Business logic libraries
│       │   │   ├── entitlements.ts  # Plan logic
│       │   │   └── supabase.ts      # Supabase client
│       │   ├── services/       # Services layer
│       │   ├── store/          # Zustand store
│       │   │   └── slices/     # State slices
│       │   └── types/          # TypeScript types
│       └── vite.config.ts
│
├── packages/
│   ├── board/                  # Canvas node components
│   ├── core/                   # Core types & logic
│   ├── presets/                # Formations & templates
│   └── ui/                     # Reusable UI components
│
├── netlify/
│   └── functions/              # Serverless functions
│       ├── stripe-webhook.ts
│       ├── create-checkout.ts
│       └── create-portal-session.ts
│
├── supabase/
│   ├── migrations/             # Database schema
│   └── seed.sql
│
└── docs/                       # Documentation (you are here)
```

## Key Architectural Decisions

### 1. App.tsx Is Composition-Only

**Location:** `apps/web/src/App.tsx`

**Responsibility:** Wire together the application, but contain NO business logic.

**What App.tsx Does:**
- ✅ Render UI components
- ✅ Manage modal state (open/closed)
- ✅ Call hooks to get state
- ✅ Pass callbacks as props
- ✅ Compose providers

**What App.tsx Does NOT Do:**
- ❌ Contain domain logic
- ❌ Calculate entitlements
- ❌ Enforce business rules
- ❌ Manipulate state directly
- ❌ Make API calls (use services)

**Example Pattern:**
```typescript
// ✅ GOOD - App.tsx calls hooks and passes to UI
function App() {
  const { can } = useEntitlements();
  const handleExportGIF = () => {
    if (can('exportGIF') !== true) {
      setPricingModalOpen(true);
      return;
    }
    exportGIF();
  };
  
  return <Toolbar onExportGIF={handleExportGIF} />;
}

// ❌ BAD - App.tsx contains business logic
function App() {
  const handleExportGIF = () => {
    if (user?.subscription_tier === 'pro' || user?.subscription_tier === 'team') {
      exportGIF(); // Business logic shouldn't be here
    }
  };
}
```

---

### 2. Entitlements System

**Location:** `apps/web/src/lib/entitlements.ts`

**Purpose:** Centralized permission checking based on user's plan.

**How It Works:**
1. **Plan Derivation:** Authentication state → Plan type (`guest`/`free`/`pro`/`team`)
2. **Entitlements Lookup:** Plan type → Entitlements object
3. **Permission Check:** `can(action, context)` → `true` | `'soft-prompt'` | `'hard-block'`

**Integration Points:**
- `useEntitlements()` hook provides React access
- App.tsx uses it to gate actions
- UI components use it to show/hide features

**See:** `docs/ENTITLEMENTS.md` for details

---

### 3. State Management (Zustand)

**Location:** `apps/web/src/store/`

TMC Studio uses Zustand for state management, organized into slices:

#### Store Architecture

```typescript
useBoardStore = {
  // Slices (each is independent)
  ...documentSlice,    // Project metadata
  ...elementsSlice,    // Players, arrows, zones
  ...stepsSlice,       // Animation steps
  ...historySlice,     // Undo/redo
  ...selectionSlice,   // Selected elements
  ...groupsSlice,      // Element grouping
  ...drawingSlice,     // Drawing tool state
}

useAuthStore = {
  // Auth state
  user, isAuthenticated, signIn, signOut, etc.
}

useUIStore = {
  // UI-only state
  theme, focusMode, tooltips, etc.
}
```

#### ⚠️ Critical Rule: NO Cross-Slice Calls

Zustand slices MUST NOT import or call each other.

```typescript
// ❌ BAD - Slice calling another slice
const elementsSlice = (set, get) => ({
  addPlayer: () => {
    get().addToHistory(); // WRONG - calling historySlice
  }
});

// ✅ GOOD - Orchestration via commands
// In CommandRegistry:
cmd.addPlayer = () => {
  store.addPlayer();      // elementsSlice
  store.commitHistory();  // historySlice (orchestrated externally)
};
```

**Orchestration** happens in:
- `commands/CommandRegistry` (for complex operations)
- `App.tsx` (for UI flows)
- Services (for cross-cutting concerns)

---

#### ⚠️ CRITICAL: Single Store Import Path (Lessons Learned)

**The Problem: Multiple Store Instances**

During PR-REFACTOR-1, we discovered a critical bug where keyboard shortcuts stopped working entirely. The root cause: **TWO different store instances existed simultaneously**.

```typescript
// ❌ WRONG - Creates SEPARATE store instance
import { useBoardStore } from './store/useBoardStore';

// ✅ CORRECT - Uses composed store from slices
import { useBoardStore } from './store';
```

**What happened:**
1. `store/useBoardStore.ts` = Old monolithic store (3000+ lines)
2. `store/index.ts` = New composed store from slices
3. App.tsx imported from `/useBoardStore` (Store #1)
4. Hooks imported from `/store` (Store #2)
5. Result: Actions updated Store #2, but UI rendered from Store #1 → **no updates visible**!

**The Fix: Unified Imports**

ALL files now import from the same source:

```typescript
// ✅ CORRECT - Single source of truth
import { useBoardStore } from '../store';        // From any /src subdirectory
import { useBoardStore } from './store';         // From App.tsx
```

**Enforcement Rule:**

> **NEVER import from `/store/useBoardStore.ts` directly**  
> **ALWAYS import from `/store/` (index.ts)**

This ensures:
- ✅ Single store instance across entire app
- ✅ Consistent state updates
- ✅ Predictable behavior
- ✅ Easy to refactor store internals

**Files to check when adding features:**
- `apps/web/src/store/index.ts` - Main store export (use this)
- `apps/web/src/store/useBoardStore.ts` - DEPRECATED, can be deleted
- All hooks in `apps/web/src/hooks/` - Should import from `../store`
- `apps/web/src/App.tsx` - Should import from `./store`

**Testing for this issue:**
```bash
# Search for wrong imports
grep -r "from './store/useBoardStore'" apps/web/src/
grep -r "from '../store/useBoardStore'" apps/web/src/

# Should return ZERO results!
```

---

### 4. Command Pattern

**Location:** `apps/web/src/commands/CommandRegistry.ts`

Complex operations are organized as commands that orchestrate multiple store actions.

**Types of Commands:**

#### Intent Commands (High-Frequency, No Side Effects)
- `drag`, `move`, `resize`, `hover`
- NO history commit
- NO autosave trigger
- Called during continuous interaction

#### Effect Commands (User Actions, With Side Effects)
- `add`, `delete`, `paste`, `group`, `duplicate`
- WITH history commit
- WITH autosave trigger
- Called on discrete user actions

**Example:**
```typescript
const CommandRegistry = {
  // Intent - no side effects
  move: (id, x, y) => {
    store.updateElementPosition(id, x, y);
    // No history, no autosave
  },
  
  // Effect - with side effects
  addPlayer: (x, y) => {
    store.addPlayer(x, y);
    store.commitHistory();     // Add to undo stack
    store.markDirty();         // Trigger autosave
  },
};
```

**See:** `.clinerules/project_rules_custom_instruction.md` for command rules

---

### 5. Canvas Architecture

**Location:** `apps/web/src/components/Canvas/`

The canvas is built with Konva.js and organized into layers:

```
BoardCanvas
  ├── PitchLayer          # Football pitch background
  ├── ZonesLayer          # Tactical zones
  ├── ArrowsLayer         # Movement arrows
  ├── PlayersLayer        # Player nodes
  ├── DrawingLayer        # Freehand drawings
  └── OverlayLayer        # Input handling + selection
```

#### Critical Rule: Layers Are Pure Renderers

Canvas layers MUST NOT:
- ❌ Import Zustand store directly
- ❌ Contain business logic
- ❌ Manipulate state
- ❌ Perform calculations

Canvas layers MUST:
- ✅ Receive data via props (view models)
- ✅ Render based on props
- ✅ Use React.memo for performance
- ✅ Emit events upward (not handle them)

**Example:**
```typescript
// ❌ BAD - Layer imports store
import { useBoardStore } from '../../store';
function PlayersLayer() {
  const players = useBoardStore(s => s.elements.filter(e => e.type === 'player'));
  return <>{players.map(renderPlayer)}</>;
}

// ✅ GOOD - Layer receives props
interface PlayersLayerProps {
  players: Player[];  // Pre-filtered, pre-transformed
}
function PlayersLayer({ players }: PlayersLayerProps) {
  return <>{players.map(renderPlayer)}</>;
}
```

**Input Handling:**
Only `OverlayLayer` handles pointer events. It:
1. Captures pointer events
2. Translates to high-level actions
3. Calls commands via CommandRegistry
4. Commands update store
5. Store updates trigger re-render

---

### 6. Modal System

**Location:** `packages/ui/src/`

TMC Studio uses React state to manage modals:

```typescript
// App.tsx manages modal state
const [authModalOpen, setAuthModalOpen] = useState(false);
const [pricingModalOpen, setPricingModalOpen] = useState(false);
const [limitReachedModalOpen, setLimitReachedModalOpen] = useState(false);

// Modals are rendered conditionally
<AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
<PricingModal isOpen={pricingModalOpen} onClose={() => setPricingModalOpen(false)} />
<LimitReachedModal isOpen={limitReachedModalOpen} onClose={() => setLimitReachedModalOpen(false)} />
```

**Modal Flow Rules:**
- ONE modal at a time (close current before opening next)
- Modals compose: LimitReached → Auth → Success
- Always provide context (why modal appeared)
- Always have a close option

**See:** `docs/UX_PATTERNS.md` for modal flows

---

### 7. Services Layer

**Location:** `apps/web/src/services/`

Services encapsulate cross-cutting concerns:

| Service | Responsibility |
|---------|---------------|
| **AutosaveService** | Debounced cloud save after edits |
| **ExportService** | PNG/GIF/PDF export logic |
| **KeyboardService** | Keyboard shortcut handling |

**Service Pattern:**
```typescript
// Service is a singleton or utility module
export const AutosaveService = {
  init: (saveCallback) => { /* setup debounce */ },
  trigger: () => { /* debounce and save */ },
  cancel: () => { /* cancel pending save */ },
};

// Used in App.tsx
useEffect(() => {
  AutosaveService.init(saveToCloud);
}, []);
```

**Services vs. Hooks:**
- **Services:** Stateless utilities, singletons
- **Hooks:** Stateful React patterns

---

## Data Flow

### Read Path (Display Data)

```
Supabase Database
  ↓
useAuthStore (user data)
  ↓
useEntitlements() (derive plan)
  ↓
App.tsx (read state via selectors)
  ↓
UI Components (render)
  ↓
Canvas Layers (render nodes)
```

### Write Path (User Action)

```
User Input (click, drag, keypress)
  ↓
OverlayLayer OR UI Component (capture event)
  ↓
CommandRegistry (orchestrate)
  ↓
Store Actions (update state)
  ↓
React Re-render (UI updates)
  ↓
AutosaveService (debounce → cloud save)
```

### Entitlement Check Path

```
User Action (export GIF, add step, etc.)
  ↓
App.tsx handler
  ↓
useEntitlements().can(action, context)
  ↓
  ├─ true: Proceed with action
  ├─ 'soft-prompt': Show toast, proceed
  └─ 'hard-block': Show modal, STOP
```

---

## Authentication & Subscription Flow

### Authentication

```
User clicks "Sign In"
  ↓
AuthModal opens
  ↓
User signs in with email/Google
  ↓
Supabase Auth
  ↓
useAuthStore.setUser(user)
  ↓
Plan changes (guest → free)
  ↓
UI updates based on new entitlements
```

### Subscription Upgrade

```
User clicks "Upgrade to Pro"
  ↓
PricingModal opens
  ↓
User clicks "Upgrade"
  ↓
Netlify function creates Stripe Checkout
  ↓
User completes payment
  ↓
Stripe webhook → Netlify function
  ↓
Update Supabase: user.subscription_tier = 'pro'
  ↓
Client refetches user data
  ↓
Plan changes (free → pro)
  ↓
UpgradeSuccessModal appears
```

---

## Performance Considerations

### Canvas Performance

1. **React.memo everywhere** - All canvas layers use `React.memo`
2. **Stable selectors** - Use memoized selectors to prevent re-renders
3. **Avoid inline objects** - Pass stable props to prevent memo cache misses

```typescript
// ❌ BAD - Creates new object on every render
<PlayersLayer players={players.map(p => ({ ...p, scaled: true }))} />

// ✅ GOOD - Use memoized selector
const scaledPlayers = useMemo(() => 
  players.map(p => ({ ...p, scaled: true }))
, [players]);
<PlayersLayer players={scaledPlayers} />
```

### Autosave Optimization

Autosave is debounced (1.5s) and disabled during:
- Continuous interactions (drag, resize)
- Animation playback

```typescript
// Autosave is triggered ONLY after:
- History commit (discrete action complete)
- Document.isDirty = true
- 1.5s debounce timer expires
```

---

## Where New Logic Should Go

### ✅ Add New Feature Logic Here:

| Type of Logic | Location |
|--------------|----------|
| **Entitlements** | `apps/web/src/lib/entitlements.ts` |
| **Commands** | `apps/web/src/commands/CommandRegistry.ts` |
| **State Management** | `apps/web/src/store/slices/` |
| **Services** | `apps/web/src/services/` |
| **UI Components** | `packages/ui/src/` |
| **Canvas Nodes** | `packages/board/src/` |
| **Business Logic** | `apps/web/src/lib/` or `services/` |

### ❌ Do NOT Add Logic Here:

| Location | Why Not |
|----------|---------|
| **App.tsx** | Composition-only, no business logic |
| **Canvas Layers** | Pure renderers, no state manipulation |
| **UI Components** | Should call commands, not contain logic |
| **Hooks (generally)** | Hooks are for React integration, not business logic |

---

## Adding a New Feature: Checklist

When adding a new feature, follow this pattern:

1. **Define types** (if needed)
   - Add to `apps/web/src/types/` or `packages/core/src/types.ts`

2. **Add state** (if needed)
   - Create new slice in `store/slices/` OR
   - Extend existing slice

3. **Add business logic**
   - Add to `services/` OR
   - Add to `lib/` OR
   - Add to `commands/`

4. **Wire to UI**
   - Update App.tsx to call new logic
   - Add UI components in `packages/ui/`
   - Add canvas nodes in `packages/board/` (if visual)

5. **Add entitlements** (if paywalled)
   - Update `entitlements.ts`
   - Add `can()` check in App.tsx

6. **Test flows**
   - Manual testing
   - Check guest/free/pro behavior

---

## Common Patterns

### Pattern: Adding a New Modal

1. Create component in `packages/ui/src/NewModal.tsx`
2. Export from `packages/ui/src/index.ts`
3. Add state to App.tsx:
   ```typescript
   const [newModalOpen, setNewModalOpen] = useState(false);
   ```
4. Add modal to render:
   ```typescript
   <NewModal isOpen={newModalOpen} onClose={() => setNewModalOpen(false)} />
   ```
5. Trigger from actions:
   ```typescript
   const handleAction = () => setNewModalOpen(true);
   ```

### Pattern: Adding a New Canvas Element Type

1. Define type in `packages/core/src/types.ts`
2. Create node component in `packages/board/src/NewNode.tsx`
3. Add to appropriate layer in `apps/web/src/components/Canvas/layers/`
4. Add slice actions in `store/slices/elementsSlice.ts`
5. Add commands in `commands/CommandRegistry.ts`
6. Wire to toolbar/UI

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **State** | Zustand |
| **Canvas** | Konva.js + react-konva |
| **Styling** | Tailwind CSS |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **Payments** | Stripe |
| **Functions** | Netlify Serverless |
| **Deploy** | Netlify |
| **Monorepo** | pnpm workspaces + Turborepo |

---

## Related Documentation

- **Product Philosophy:** `docs/PRODUCT_PHILOSOPHY.md` - Why we build this way
- **Entitlements:** `docs/ENTITLEMENTS.md` - How permissions work
- **UX Patterns:** `docs/UX_PATTERNS.md` - Modal and flow patterns
- **Project Rules:** `.clinerules/project_rules_custom_instruction.md` - Binding development rules

---

**Remember:** Architecture exists to make development predictable and maintainable. When in doubt, follow the patterns already established. Consistency > cleverness.
