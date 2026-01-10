PROJECT RULES (BINDING)

- Follow PR migration plan PR0–PR6. Never do big-bang changes.
- In PR0: NO runtime behavior changes. Scaffolding only.

ARCHITECTURE
- UI (React components & hooks) MUST NOT call Zustand store actions directly.
- UI may ONLY call CommandRegistry (cmd.*).
- All domain logic lives in commands/, services/, or store/slices/.
- App.tsx is composition-only (no domain logic).

COMMANDS
- Split commands into intent vs effect.
- intent = frequent, no side effects (drag/move/resize live).
- effect = history commit, autosave, persistence.
- History commits ONLY on pointerUp, add, delete, group, paste.

STATE & STORE
- Zustand slices must not call each other.
- Orchestration only via CommandRegistry/dispatch.
- No new global state outside Zustand slices.

CANVAS
- Canvas layers must NOT import store directly.
- Layers receive view models via props.
- Only OverlayLayer handles input events.
- No mapping or data transforms in render; selectors only.

PERFORMANCE
- All board nodes must use React.memo.
- Prefer stable props via selectors over custom equality.
- No inline objects/functions that break memoization.

AUTOSAVE
- Autosave only after history commit and when document.isDirty === true.
- Debounce 1.5s, no parallel requests (last-write-wins).
- Autosave disabled during continuous interactions and animation playback.

QUALITY
- If modifying commands/history/autosave → add unit tests.
- Every PR must pass lint and typecheck.
