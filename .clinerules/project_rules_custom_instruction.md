# PROJECT RULES (BINDING)

## PRIORITY
- Project Rules override Global Rules when they conflict.
- If a rule cannot yet be satisfied without big-bang changes,
  follow the PR0–PR6 migration plan and apply the smallest compliant step.

## DEFINITIONS
- **UI** = React components and UI hooks under:
  `src/app`, `src/pages`, `src/components`, `src/features/*/ui`
- **Store read** = selectors / facades (read-only) → allowed in UI
- **Store actions / mutations** = NOT allowed in UI
- **Domain logic** = any state mutation, history commit, autosave, persistence,
  billing, projects, or side effects

---

## MIGRATION RULES
- Follow PR migration plan PR0–PR6.
- Never do big-bang changes.
- Each PR migrates ONE vertical slice only.
- **PR0:** scaffolding only (types, folders, contracts).
  ❌ No wiring
  ❌ No runtime behavior changes

---

## ARCHITECTURE
- UI MUST NOT call Zustand store actions directly.
- UI MUST NOT call `store.getState()` directly.
- UI mutations MAY ONLY go through `CommandRegistry (cmd.*)`.
- UI MAY read state ONLY via approved selectors or facades (vm).
- All domain logic lives in:
  - `commands/`
  - `services/`
  - `store/slices/`
- `App.tsx` is composition-only (routing, providers, orchestration).

---

## COMMANDS
- Commands MUST be split into **intent** vs **effect**.
- **intent**
  - frequent
  - no side effects
  - no history commits
  - examples: drag, move, resize (live)
- **effect**
  - history commit
  - autosave trigger
  - persistence / backend calls
- History commits are allowed ONLY on:
  - pointerUp
  - add
  - delete
  - group
  - paste
- History commits MUST live in `commands/effect/history*`
  (single source of truth).
- **CommandRegistry is NOT a React hook.**
  - Created once at composition root (AppShell/BoardRoute)
  - Passed down via context or props (stable reference)
  - NO `useCommandRegistry()` in renders
- **In PR0 only:** CommandRegistry MAY temporarily call store directly.
  - This is STRICTLY FOR SCAFFOLDING
  - MUST be removed when UI is wired to cmd.* (PR1+)

---

## STATE & STORE
- Zustand slices MUST NOT call each other.
- Orchestration happens ONLY via CommandRegistry / dispatch.
- No new global state outside Zustand slices.

---

## CANVAS
- Canvas layers MUST NOT import store directly.
- Canvas layers receive **view models (vm)** via props.
- Only **OverlayLayer** may handle input events.
- Canvas layers are render-only ("dumb").

### Rendering rules
- Allowed in render:
  - simple `.map()` for rendering nodes
- NOT allowed in render (hot paths):
  - filtering
  - grouping
  - sorting
  - interpolation prep
- All data shaping MUST happen in:
  - selectors
  - facades
  - adapters
  - `useMemo` outside render paths

---

## PERFORMANCE
- All board nodes MUST use `React.memo`.
- Prefer stable props via selectors or facades.
- No inline objects or functions that break memoization.
- Commands (`cmd.*`) MUST be referentially stable (`useCallback` / `useMemo`).

---

## AUTOSAVE
- Autosave runs ONLY:
  - after a history commit
  - when `document.isDirty === true`
- Autosave debounce: **1.5s**
- No parallel autosave requests (last-write-wins).
- Autosave is DISABLED during:
  - continuous interactions (drag, resize, marquee, freehand)
  - animation playback
- `document.isDirty` MAY ONLY be set by **effect** commands.

---

## QUALITY
- If modifying commands, history, or autosave → add unit tests.
- Every PR MUST pass:
  - lint
  - typecheck
- No silent behavior changes.
