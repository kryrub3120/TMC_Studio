# PR: Color Palette & Print Mode - Implementation Status

**Date:** 31.01.2026 00:05  
**Status:** 50% Complete - Core Infrastructure Done

---

## ✅ COMPLETED (6/12 tasks)

### 1. Planning Document ✅
- Created `docs/PR-COLOR-PRINT-PLAYER-PLAN.md`
- Architecture decisions documented
- Manual test checklist prepared

### 2. Shared Color Palette Module ✅
- **File:** `packages/ui/src/colors.ts`
- Exports: `SHARED_COLORS`, `getColorsForMode()`, `sanitizeColorForPrint()`
- Black (#000000) added to palette
- Print mode filtering (removes white)
- Render-time sanitization helper

### 3. UI Package Exports ✅
- **File:** `packages/ui/src/index.ts`
- Color utilities exported from `@tmc/ui`

### 4. Print Mode State (UI-only) ✅
- **File:** `apps/web/src/store/useUIStore.ts`
- Added `isPrintMode: boolean` (default: false, NOT persisted)
- Added `togglePrintMode()` action
- No document mutation, no history push

### 5. Core Types Updated ✅
- **File:** `packages/core/src/types.ts`
- Added `color?: string` to `PlayerElement` (per-player fill override)

### 6. PlayerNode Updated ✅
- **File:** `packages/board/src/PlayerNode.tsx`
- Added `isPrintMode?: boolean` prop
- Added inline `sanitizeForPrint()` helper (avoids cross-package import)
- Updated `getTeamColors()` to support:
  - `player.color` override (priority: player > GK > team)
  - Print mode sanitization (white → black)
- Updated memo comparison (includes `player.color` and `isPrintMode`)

---

## 🚧 REMAINING WORK (6/12 tasks)

### 7. TextNode Updates
**File:** `packages/board/src/TextNode.tsx`
**Changes needed:**
- Add `isPrintMode?: boolean` prop
- Inline sanitization for white → black
- Default text color to black in print mode
- Update memo comparison

### 8. Elements Slice Updates
**File:** `apps/web/src/store/slices/elementsSlice.ts`
**Changes needed:**
- Import `SHARED_COLORS` from `@tmc/ui`
- Replace `COLORS` array with `SHARED_COLORS` in `cycleSelectedColor()`
- Update `addPlayerAtCursor()` for first player logic:
  ```ts
  const teamPlayers = elements.filter(el => isPlayerElement(el) && el.team === team);
  const isFirstPlayer = teamPlayers.length === 0;
  const number = isFirstPlayer ? undefined : getNextPlayerNumber(elements, team);
  ```
- Add new action:
  ```ts
  updatePlayerColor: (id: ElementId, color: string | undefined) => void
  ```

### 9. Canvas Context Menu
**File:** `apps/web/src/utils/canvasContextMenu.ts`
**Changes needed:**
- Add handlers: `onChangePlayerColor?: () => void`, `onChangeTextColor?: () => void`
- Add to player menu: `{ label: 'Change Color…', icon: '🎨', onClick: handlers.onChangePlayerColor! }`
- Add to text menu: `{ label: 'Change Color…', icon: '🎨', onClick: handlers.onChangeTextColor! }`

### 10. TeamsPanel Updates
**File:** `packages/ui/src/TeamsPanel.tsx`
**Changes needed:**
- Import `SHARED_COLORS` from `'./colors'`
- Replace `COLOR_PRESETS` with `SHARED_COLORS`

### 11. Keyboard Shortcuts
**File:** `apps/web/src/hooks/useKeyboardShortcuts.ts`
**Changes needed:**
- Import `togglePrintMode` from `useUIStore`
- Update W key handler:
  ```ts
  case 'w':
    if (!isCmd) {
      e.preventDefault();
      togglePrintMode();
      const newState = useUIStore.getState().isPrintMode;
      
      // Visual feedback: update pitch colors
      if (newState) {
        updatePitchSettings({ 
          primaryColor: '#ffffff', 
          stripeColor: '#ffffff', 
          lineColor: '#000000', 
          showStripes: false 
        });
        showToast('Print Friendly mode');
      } else {
        updatePitchSettings({ 
          primaryColor: '#4ade80', 
          stripeColor: '#22c55e', 
          lineColor: '#ffffff', 
          showStripes: true 
        });
        showToast('Normal colors');
      }
    }
    break;
  ```
- Replace `BG_COLORS` with `SHARED_COLORS`

### 12. Wire isPrintMode to Renders
**File:** `packages/board/src/Pitch.tsx` (or wherever PlayerNode/TextNode are rendered)
**Changes needed:**
- Import `isPrintMode` from `useUIStore`
- Pass `isPrintMode` prop to all `<PlayerNode>` and `<TextNode>` components

---

## CRITICAL RULES TO MAINTAIN

1. **No Document Mutation:** Print mode toggle must NOT push history or trigger autosave
2. **Render-Time Only:** Sanitization happens at render, never mutates element data
3. **No Cross-Package Imports:** `packages/board` cannot import from `packages/ui` or `apps/web`
4. **History Semantics:** Only actual data changes push history (color changes YES, print toggle NO)

---

## NEXT STEPS

1. Update TextNode (similar pattern to PlayerNode)
2. Update elementsSlice (shared colors + first player + updatePlayerColor)
3. Update context menu (add PPM handlers)
4. Update TeamsPanel (use shared colors)
5. Update keyboard shortcuts (W key + BG colors)
6. Wire isPrintMode from store to component renders
7. Manual testing per checklist in planning doc

---

## FILES MODIFIED SO FAR

| File | Status | Changes |
|------|--------|---------|
| `packages/ui/src/colors.ts` | ✅ NEW | Shared palette + sanitization |
| `packages/ui/src/index.ts` | ✅ Modified | Export colors |
| `apps/web/src/store/useUIStore.ts` | ✅ Modified | Add isPrintMode state |
| `packages/core/src/types.ts` | ✅ Modified | Add color to PlayerElement |
| `packages/board/src/PlayerNode.tsx` | ✅ Modified | isPrintMode + player.color support |

---

## ESTIMATED COMPLETION

- **Current:** 50% complete
- **Remaining:** ~6 files to modify
- **Complexity:** Low-Medium (mostly copy previous patterns)
- **Time:** ~30-45 minutes for remaining work

Continue implementation? (Yes/No)
