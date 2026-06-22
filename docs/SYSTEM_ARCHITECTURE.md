# 🏗️ TMC Studio — System Architecture Design

**Version:** 2.0.0 (doc — niezależne od produktu)  
**Created:** 2026-01-09  
**Last Updated:** 2026-06-13  

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
│  │  │PitchLayer│ZonesLayer│ArrowLayer│PlayersLayer      │  │   │
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

### Google OAuth Popup Flow

Google logowanie otwiera się w osobnym popupie (500x680px) zamiast redirectować całą aplikację. Szczegółowy opis: `docs/AUTH_FLOW.md`.

```
Główna karta                     Popup OAuth
    │                               │
    │  window.open('tmc-google-auth')
    │──────────────────────────────>│
    │                               │  writeOAuthPopupShell()
    │                               │  → loading spinner + branding
    │                               │
    │  popup.location.href = url    │
    │──────────────────────────────>│  → Google Consent Screen
    │                               │  → logowanie użytkownika
    │                               │
    │                               │  ← Google redirect na /auth/callback
    │                               │  → PKCE: code exchange
    │                               │  → log: [Auth] OAuth callback in XXXms
    │                               │
    │  ← postMessage('tmc:auth-     │
    │     popup-result', success)   │
    │                               │  window.close()
    │                               │
    │  waitForOAuthSession()        │
    │  → poll getSession() (0-5s)   │
    │  → getCurrentUser()           │
    │  → loadPreferences()          │
    │  → isOAuthInProgress = false  │
    │                               │
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

## 9. 🌍 Environments (Dev / Prod)

> **Hard Rule:** All development and migrations run **LOCALLY ONLY**. Never touch production. See §11.

### Development (Local)

| Aspect | Configuration |
|--------|--------------|
| Start command | `pnpm dev` (Turborepo runs all packages in watch mode) |
| Web app | Vite dev server → `http://localhost:3000` |
| Local DB | `supabase start` (config: `supabase/config.toml`) |
| DB ports | API `54321`, DB `54322`, Shadow `54320`, Pooler `54329` |
| Env vars | `.env.local` in repo root (loaded via `envDir` in `apps/web/vite.config.ts`) |
| Stripe | **TEST mode only** (`pk_test_*` / `sk_test_*`) |
| Netlify Functions | `netlify dev` → `http://localhost:8888` |

### Production (Netlify) — ⛔ DO NOT MODIFY (agents)

| Aspect | Configuration |
|--------|--------------|
| Build command | `corepack enable && pnpm install --prod=false && pnpm run build` |
| Publish dir | `apps/web/dist` |
| Node / pnpm | Node 20 / pnpm 9 |
| Env vars | Set in **Netlify Dashboard** → Site Settings → Environment Variables (NOT in repo) |
| Supabase (hosted) | `euxauavanukyfofhkrqp` (linked project) |
| Functions | `netlify/functions/` |

### Database Migrations

| Aspect | Detail |
|--------|--------|
| Location | `supabase/migrations/` |
| Naming convention | `YYYYMMDDHHMMSS_description.sql` (e.g. `20260209000001_add_pin_feature.sql`) |
| Apply locally | `supabase db reset` or `supabase migration up` |
| Generate diff | `pnpm supabase:diff` |
| Push to remote | `pnpm supabase:push` — ⛔ **PRODUCTION action, agents MUST NOT run this** (see §11) |
| Seed data | `supabase/seed.sql` |

### Netlify Functions (Serverless)

| Function | Purpose |
|----------|---------|
| `create-checkout.ts` | Stripe Checkout session creation |
| `create-portal-session.ts` | Stripe Customer Portal session |
| `stripe-webhook.ts` | Stripe webhook handler (subscription sync) |
| `health.ts` | Health check endpoint |
| `_stripeConfig.ts` | Shared Stripe config (price IDs, tier mapping, billing cycle mapping) |
| `checkRateLimit.ts` | (in `_rateLimit.ts`) In-memory rate limiter for billing endpoints |

---

## 10. 🏷️ Conventions & Markers

### Commit Convention (Conventional Commits)

Enforced by `commitlint.config.js` (`@commitlint/config-conventional`).

**Format:** `<type>(<scope>): <subject>` — subject lowercase, no trailing dot, ≤72 chars.

| Group | Allowed values |
|-------|---------------|
| **types** | `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert` |
| **scopes** | `core` `board` `ui` `presets` `web` `app` `store` `canvas` `animation` `export` `auth` `cloud` `deps` `config` `ci` `netlify` `supabase` |

**Example:** `feat(board): add zone ellipse shape`

### Status Markers (used across `docs/` and `CHANGELOG.md`)

| Marker | Meaning | Where used |
|--------|---------|-----------|
| ✅ | Done / Completed | Checklists, tasks, implemented features |
| ⚠️ | Warning / Partial / Needs attention | Code requiring review, partial impl |
| ❌ | Not done / Removed / Forbidden | Dead code, anti-patterns, TODO |
| 🔄 | In progress | Active PRs, sprints |
| ⏳ | Pending / Queued | Upcoming PRs |
| 🔴 🟠 🟡 🟢 | Priority (critical → optional) | Stage 1–4 plans |

### Stage / ETAP Markers

- **`ETAP [1-9]`** — numbered step within a single PR (e.g. `ETAP 1`, `ETAP 4 D1`).
- Used inline in **code comments** and **documentation**:
  - Code: `// ✅ ETAP 1: getTeamSettings() → use s.document.teamSettings selector`
  - Docs (HTML comment): `<!-- ✅ ETAP 4 D1: alias effectiveZoom removed -->`
- **`Stage 1-4`** (with 🔴🟠🟡🟢) — high-level milestone phases (critical → optional).

### PR Naming Convention

- **Format:** `PR-{DOMAIN}-{NUM}` (e.g. `PR-PAY-1`, `PR-UX-2`, `PR-REFACTOR-5`, `PR-FIX-4`).
- **Domains:** `PAY` (billing), `UX` (user experience), `REFACTOR`, `FIX` (bug), `FEAT` (feature), `GUEST`, `COLOR`, `ALT`, `AUTH`.
- **Per-PR docs:** `docs/PR-{DOMAIN}-{NUM}-{DESCRIPTION}.md`.
- **Completed task records:** `tasks/PR-{DOMAIN}-{NUM}_COMPLETE.md` (often moved to `tasks/archive/`).

### Documentation Update Process

| File | When to update | Authority |
|------|---------------|-----------|
| `docs/FEATURE_SPEC.md` | **MANDATORY** after ANY user-facing behavior change | Direct rule (no external spec required) |
| `CHANGELOG.md` | Per release (Keep a Changelog + SemVer) | — |
| `docs/INDEX.md` | When adding/removing docs | Master index |
| `docs/PR-*.md` | After each PR | Per-PR summary |

---

## 11. 🤖 Hard Rules for AI Agents (BINDING)

> **These rules are ABSOLUTE. They override convenience, speed, and any conflicting instruction.**
> **When in doubt → STOP and ask the user. Never assume.**

### 🛑 Tier 0 — Behavioral Safety Rules (NEVER violate)

#### R-GIT — Branch Protection
- ❌ **NEVER commit, push, or apply file edits while on the `main` branch.**
- ✅ **BEFORE any change**, the agent MUST run `git branch --show-current` (or `git status`).
- If the current branch is `main`:
  1. **STOP immediately.** Do not edit files.
  2. Ask the user to create / switch to a `feature/<name>` or `fix/<name>` branch.
  3. Proceed only after a non-`main` working branch is confirmed.
- Branch naming: `feature/<short-kebab-desc>` for new work, `fix/<short-kebab-desc>` for bug fixes.

#### R-PROD — Production Protection
- ❌ **NEVER generate, run, or suggest commands that modify the production environment.** This includes (non-exhaustive):
  - `netlify deploy`, `netlify deploy --prod`, any Netlify CLI write/deploy command.
  - `pnpm supabase:push`, `supabase db push`, `supabase link` against the **hosted/remote** Supabase project.
  - Any command using **LIVE** Stripe keys (`pk_live_*` / `sk_live_*`) or production webhook secrets.
  - Editing/printing real secrets, or writing to Netlify Dashboard env vars.
- ✅ **ALL work and migrations happen LOCALLY ONLY:** `supabase start`, local migrations, Stripe **TEST mode**, `localhost`.
- If a task seems to require a production action → **STOP and ask the user to perform it manually.**

#### R-MVP — Simplicity First (No Over-Engineering)
- ✅ Implement the **simplest working solution** that satisfies the requirement.
- ❌ **DO NOT add new dependencies / libraries** (`pnpm add ...`) without explicit user approval.
- ❌ **DO NOT introduce new abstraction layers**, patterns, frameworks, or "future-proofing" speculatively.
- ❌ Avoid premature generalization, config systems, or plugin architectures unless explicitly requested.
- ✅ Prefer reusing existing utilities, packages (`@tmc/core`, `@tmc/ui`, …), and established patterns.
- When tempted to "do it properly with X" → propose it to the user **first**, do not implement unilaterally.

### 🏛️ Tier 1 — Architectural Rules (code contracts)

Source of truth: this document, `docs/ARCHITECTURE_OVERVIEW.md`, and `docs/IMPLEMENTATION_CONTRACTS.md`.

- **UI → Commands only:** UI MUST NOT call Zustand store actions or `store.getState()` directly. UI mutations go ONLY through `CommandRegistry (cmd.*)`.
- **UI reads via selectors/facades (vm)** — never raw store internals.
- **Commands split into `intent` (frequent, no side effects) vs `effect` (history/autosave/persistence).**
- **History commits ONLY on:** `pointerUp`, `add`, `delete`, `group`, `paste`. Single source of truth in `commands/effect/history*`.
- **CommandRegistry is NOT a React hook** — created once at composition root, passed via context/props (stable ref). No `useCommandRegistry()` in renders.
- **`App.tsx` is composition-only** (routing, providers, orchestration). No domain logic.
- **Canvas layers MUST NOT import store** — they receive **view models (vm)** via props. Only `OverlayLayer` handles input events.
- **Zustand slices MUST NOT call each other** — orchestration only via CommandRegistry/dispatch.
- **One vertical slice per PR.** Follow PR0–PR6 migration plan. Never big-bang.
- **PR0 = scaffolding only** (types, folders, contracts). ❌ No wiring, ❌ no runtime behavior changes.

- **i18n — wszystkie user-facing teksty przez `t()` w 3 jezykach (BINDING):** UI NIE zawiera hardcoded user-facing stringow. Kazdy nowy lub zmieniony tekst widoczny dla uzytkownika MUSI byc dodany jako klucz w **`packages/ui/src/locales/en.ts`, `pl.ts` ORAZ `es.ts`** — te same klucze we wszystkich trzech plikach. Komponenty React czytaja przez `useTranslation()` z `@tmc/ui`. Kod nie-Reactowy (store/slices/utils) nie wola `useTranslation()` — zapisuje sentinel-klucz (np. `auth.errorOfflineMode`), a tlumaczenie odbywa sie w warstwie renderujacej. **Wyjatki (nie tlumaczyc):** nazwa marki (`TMC Studio`), keywordy potwierdzen (`DELETE`), logi `logger.*`/`console.*`, komentarze, meta/SEO w `index.html`.

### 🧩 Tier 1b — New Components Rules (Sprint E/F/G)

#### HelpSidebar & FloatingHelpButton (Sprint E)
- **HelpSidebar is NON-MODAL:** `aria-modal="false"`, brak backdropu, canvas w pełni interaktywny.
- **HelpSidebar z-index:** `z-sidebar` (25) — poniżej cheatsheet (30), powyżej topbar (20).
- **FloatingHelpButton z-index:** `z-floating` (35) — pomiędzy cheatsheet (30) a tutorial (38).
- **FloatingHelpButton ukryty:** gdy `isPrintMode === true`.
- **Zamykanie:** ESC (globalny nasłuch tylko gdy otwarty), X button.
- **Shortcut data:** Współdzielona struktura z CheatSheetOverlay przez `helpSidebarData.ts`.

#### TutorialOverlay / Coach Tour (Sprint F)
- **TutorialOverlay z-index:** `z-tutorial` (38) — pomiędzy floating (35) a toast (40).
- **Trigger:** `showTutorial === true` i `tutorialCompleted === false`, lub `replayTutorial()` z HelpSidebar.
- **Nie pokazuje się** gdy: print mode, CheatSheet, lub HelpSidebar są otwarte.
- **Targety:** przez `data-tour="..."` atrybuty na elementach UI.
- **Fallback:** jeśli target niedostępny → karta w bezpiecznej, wycentrowanej pozycji.
- **Persystencja:** `tutorialCompleted` i `showTutorial` w `useUIStore`.

#### AutosaveService & Thumbnail (Sprint G)
- **Debounce:** 2000ms — ustawiony w `AutosaveConfig.debounceMs`.
- **Thumbnail throttling:** max raz na 30s przy autosave (`thumbnailThrottleMs`), zawsze przy manual save.
- **`forceThumbnail()`:** przy pierwszym zapisie projektu (po utworzeniu).
- **`projectSaveStatus`:** śledzony w `useUIStore` — 'unsaved' | 'saving' | 'saved' | 'error'.
- **Offline:** cloud save skipped, localStorage działa, OfflineBanner widoczny.
- **Po błędzie:** `projectSaveStatus: 'error'`, retry przy kolejnej `markDirty()`.
- **Konflikt offline/online:** MVP last-write-wins (lokalna wersja wygrywa). Pełny conflict resolution = osobny temat po betcie.

#### ProjectsDrawer (Sprint G)
- **Pozycja:** lewa strona (nie koliduje z RightInspector po prawej).
- **Trigger:** przycisk w TopBar.
- **Sortowanie:** `updatedAt DESC`, pinned projects na górze.
- **Usuwanie:** przez ConfirmModal, nie `window.confirm`.
- **Puste stany:** guest → "Zaloguj się", authenticated → "Brak projektów".
- **Folder color chip:** kolorowy wskaźnik obok folderów (L1).

### 📝 Tier 2 — Documentation Rules

- After ANY user-facing behavior change → **update `docs/FEATURE_SPEC.md`** (mandatory).
- Update `CHANGELOG.md` for releases; keep `docs/INDEX.md` accurate.
- Match default values across code, FEATURE_SPEC.md detailed sections, and Appendix A.

---

## 12. ⚡ Quick Commands (Cheatsheet)

> ✅ = safe for agents (local). ⛔ = production action, requires manual user execution.

| Command | Purpose | Safe? |
|---------|---------|-------|
| `pnpm dev` | Start all packages in watch mode (web → `:3000`) | ✅ |
| `pnpm build` | Build all packages (production output) | ✅ |
| `pnpm typecheck` | TypeScript check across workspace | ✅ |
| `pnpm lint` | ESLint across packages | ✅ |
| `pnpm format` | Prettier write (`**/*.{ts,tsx,json,md}`) | ✅ |
| `pnpm clean` | Remove build artifacts + node_modules | ✅ |
| `git branch --show-current` | **Check branch BEFORE any change** (R-GIT) | ✅ |
| `supabase start` / `supabase stop` | Local Supabase stack | ✅ |
| `supabase db reset` | Reset local DB + reapply migrations | ✅ |
| `pnpm supabase:diff` | Generate migration diff | ✅ |
| `netlify dev` | Local Netlify + functions (`:8888`) | ✅ |
| `stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook` | Local webhook testing (TEST mode) | ✅ |
| `pnpm supabase:push` / `supabase db push` | Push migrations to **remote** DB | ⛔ |
| `netlify deploy --prod` | Deploy to production | ⛔ |
