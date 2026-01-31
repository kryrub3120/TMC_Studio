# PR-FEAT-3: Shoot Arrow Type - COMPLETE ✅

**Status:** COMPLETE  
**Date:** 2026-01-28  
**Time:** ~15 minutes  
**Priority:** MEDIUM  

## Summary

Added 'shoot' arrow type with **S** keyboard shortcut. Shoot arrows are orange and thicker (4px) to represent shots at goal.

## Changes Made

### 1. Core Types (`packages/core/src/types.ts`)
- Added `'shoot'` to `ArrowType` union type
- **Impact:** Type-safe shoot arrows throughout codebase

### 2. Arrow Factory (`packages/core/src/board.ts`)
- Updated `createArrow()` to handle 'shoot' type
- Defaults: `color: '#f97316'` (orange), `strokeWidth: 4`
- **Impact:** Shoot arrows visually distinct from pass/run

### 3. Keyboard Shortcuts (`apps/web/src/hooks/useKeyboardShortcuts.ts`)
- **S** = Shoot Arrow (primary)
- **Shift+S** = Cycle player shape (when player selected)
- **Logic:** Checks for selected player first, then defaults to shoot arrow
- **Impact:** Intuitive keyboard-first workflow

### 4. UI Store (`apps/web/src/store/useUIStore.ts`)
- Added `'arrow-shoot'` to `ActiveTool` type
- Added tool name mapping: `'arrow-shoot': 'Shoot Arrow'`
- **Impact:** Toast notifications and tool state management

### 5. Drawing Controller (`apps/web/src/hooks/useDrawingController.ts`)
- Added `'arrow-shoot'` to `isDrawingTool()` check
- Added handler in `handleDrawingMouseDown()` for shoot arrows
- Added `finishArrowDrawing('shoot')` in `handleDrawingMouseUp()`
- **Impact:** Full drawing support for shoot arrows

### 6. Arrow Rendering (`packages/board/src/ArrowNode.tsx`)
- Added `shoot: '#f97316'` to `ARROW_COLORS` constant
- **Impact:** Renders shoot arrows with correct color

## Files Modified (7)
1. `packages/core/src/types.ts` - Type definition
2. `packages/core/src/board.ts` - Factory function
3. `apps/web/src/hooks/useKeyboardShortcuts.ts` - S key logic
4. `apps/web/src/store/useUIStore.ts` - Active tool + toast
5. `apps/web/src/hooks/useDrawingController.ts` - Drawing handlers
6. `packages/board/src/ArrowNode.tsx` - Color rendering

## UX Flow

1. **Press S** → Activates shoot arrow tool
2. **Click & drag** → Draws orange arrow preview
3. **Release** → Creates shoot arrow with thick orange style
4. **Toast:** "Shoot Arrow tool active — click to place • Esc to exit"

## Testing Scenarios

✅ Press **S** → Shoot arrow tool activates  
✅ Draw arrow → Orange, thick (4px)  
✅ Press **Shift+S** with player selected → Cycles shape  
✅ Press **Shift+S** without selection → Shoot arrow (fallback)  
✅ TypeCheck passes  

## Design Decisions

- **Color:** Orange (#f97316) matches run arrows but thickness differentiates
- **Stroke:** 4px (thicker than pass 3px, run 2px) for visual emphasis
- **S key priority:** Player shape cycle has precedence when player selected
- **Future:** Could add double chevron (>>) rendering for shoot arrows

## Backward Compatibility

✅ Fully backward compatible  
✅ Existing arrows unchanged  
✅ No migration needed  
✅ Old documents load correctly  

## Product Impact

**Coaches can now:**
- Mark shots at goal with dedicated arrow type
- Distinguish shooting actions from passing/running
- Use keyboard-first workflow (S key)
- Create clearer tactical diagrams

**Coach-grade UX:** Zero dark patterns, keyboard-first, visually clear  

---

**Status:** PRODUCTION READY ✅
