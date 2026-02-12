# PR-FIX-1 + PR-FIX-3: Shortcuts + Inspector Vision Consistency

**Status:** ✅ Complete  
**Date:** 2026-02-12  
**Scope:** Keyboard shortcuts, RightInspector vision toggle, PlayerNode rendering guards

---

## Summary

Ensures V/Shift+V keyboard shortcuts, inspector toggles, and canvas rendering are
fully consistent and decoupled. No toggle accidentally flips another.

## Changes

### A) `useKeyboardShortcuts.ts`
- `case 'v'` handles **Cmd+V = Paste** only.
- `e.code === 'KeyV'` block (after switch) handles:
  - **V** = toggle vision for selected player(s)
  - **Shift+V** = toggle vision for ALL players on board
- Input guard at top of handler: skips if `INPUT`, `TEXTAREA`, or `contentEditable`.
- If `orientationSettings.enabled === false`, shows toast and does NOT toggle.

### B) `RightInspector.tsx` (`@tmc/ui`)
- `playerOrientationSettings` prop extended: `{ enabled, showArms, showVision, zoomThreshold }`.
- `onUpdatePlayerOrientation` callback accepts `Partial` with `showVision`.
- New **"Show vision"** toggle added between "Show arms" and "Zoom threshold".
  - Disabled (grayed) when `enabled === false`.
  - Includes hint text `V / ⇧V shortcut`.
- Each toggle only updates its own field — no coupling.

### C) `PlayerNode.tsx` (`@tmc/board`)
- **Vision** renders only when ALL THREE are true:
  1. `orientationSettings.enabled === true` (master toggle)
  2. `orientationSettings.showVision === true` (global vision toggle)
  3. `player.showVision !== false` (per-player toggle, default true)
- **Arms** render only when:
  1. `orientationSettings.enabled === true`
  2. `orientationSettings.showArms === true`
- When `enabled === false`, neither arms nor vision can appear.

### D) Core types (`@tmc/core`)
- `PlayerOrientationSettings.showVision` already existed — no change needed.
- `DEFAULT_PLAYER_ORIENTATION_SETTINGS.showVision = false` — already correct.

## Acceptance Criteria

| Criterion | Status |
|-----------|--------|
| V works on selected player(s) | ✅ |
| Shift+V toggles ALL players | ✅ |
| Focus in inspector input → V does nothing | ✅ (input guard) |
| Orientation disabled → V shows toast, no toggle | ✅ |
| Inspector toggles behave independently | ✅ |
| Arms/vision never render when enabled=false | ✅ |
| Typecheck passes (core, board, ui) | ✅ |

## Files Modified

- `apps/web/src/hooks/useKeyboardShortcuts.ts` — comment clarification
- `packages/ui/src/RightInspector.tsx` — showVision in prop type + toggle UI
- `packages/board/src/PlayerNode.tsx` — vision guard adds `orientationSettings.showVision`
