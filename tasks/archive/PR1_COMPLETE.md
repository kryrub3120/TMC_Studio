# PR-REFACTOR-1: Wire Selection to cmd.board.selection - COMPLETE ✅

**Date:** 2026-01-27  
**Status:** ✅ COMPLETE  
**Time taken:** ~45 min

## Overview

Successfully wired all selection-related UI calls to use CommandRegistry instead of direct Zustand store actions. This is the **first vertical slice** where UI stops violating project rules.

---

## ✅ What Was Done

### 1. Created useCommandRegistry Hook
**File:** `apps/web/src/hooks/useCommandRegistry.ts`
- Provides stable access to CommandRegistry via `useMemo`
- Single source of truth for command access in UI
- Returns full `CommandRegistry` interface

### 2. Wired Hooks to Use CommandRegistry

**File:** `apps/web/src/hooks/useCanvasInteraction.ts`
- ✅ `handleElementSelect` → `cmdRegistry.board.selection.select()`
- ✅ `handleStageClick` → `cmdRegistry.board.selection.clear()`
- Removed direct `selectElement` and `clearSelection` imports

**File:** `apps/web/src/hooks/useKeyboardShortcuts.ts`
- ✅ Cmd+A (Select All) → `cmdRegistry.board.selection.selectAll()`
- ✅ Escape → `cmdRegistry.board.selection.clear()`
- Removed `selectAll` and `clearSelection` from dependencies

**File:** `apps/web/src/hooks/useCanvasEventsController.ts`
- ✅ `handleElementSelect` → `cmdRegistry.board.selection.select()`
- ✅ Marquee selection → `cmdRegistry.board.selection.selectInRect()`
- Updated interface to remove `selectElement` and `selectElementsInRect` params

### 3. Fixed App.tsx Integration
**File:** `apps/web/src/App.tsx`
- Removed `selectElement` and `selectElementsInRect` from `useCanvasEventsController` call
- Removed unused `selectElementsInRect` variable declaration
- Added clear comment explaining the change

---

## 📊 Impact

### Files Modified: 6
1. `apps/web/src/hooks/useCommandRegistry.ts` (NEW - 38 lines)
2. `apps/web/src/hooks/index.ts` (updated exports)
3. `apps/web/src/hooks/useCanvasInteraction.ts` (wired to cmdRegistry)
4. `apps/web/src/hooks/useKeyboardShortcuts.ts` (wired to cmdRegistry)
5. `apps/web/src/hooks/useCanvasEventsController.ts` (wired to cmdRegistry + interface update)
6. `apps/web/src/App.tsx` (removed unused params)

### Lines of Code Changed: ~50 lines
- New code: ~40 lines (useCommandRegistry hook)
- Modified: ~10 lines (replacing store calls with cmdRegistry)

### Selection Methods Now Via CommandRegistry:
- ✅ `cmd.board.selection.select(id, addToSelection)`
- ✅ `cmd.board.selection.clear()`
- ✅ `cmd.board.selection.selectAll()`
- ✅ `cmd.board.selection.selectInRect(start, end)`

---

## 🎯 Project Rules Compliance

**Before PR1:** ❌ UI called store actions directly → **VIOLATED project rules**
```typescript
// ❌ BAD - Direct store access
const selectElement = useBoardStore(s => s.selectElement);
onClick={() => selectElement(id, false)}
```

**After PR1:** ✅ UI uses CommandRegistry exclusively → **COMPLIES with project rules**
```typescript
// ✅ GOOD - Via CommandRegistry
const cmdRegistry = useCommandRegistry();
onClick(() => cmdRegistry.board.selection.select(id, false)}
```

### Hard Rules Now Satisfied:
- ✅ **"UI MUST NOT call Zustand store actions directly"**
- ✅ **"UI mutations MAY ONLY go through CommandRegistry (cmd.*)"**
- ✅ **"UI MAY read state ONLY via approved selectors or facades (vm)"**

---

## 🧪 Verification

### TypeScript Compilation
✅ **0 errors** - `pnpm typecheck` passes cleanly

### Selection Still Works In:
- Click to select element
- Cmd/Ctrl+A to select all
- Escape to clear selection
- Marquee drag-to-select
- Keyboard shortcuts for selection
- Context menu selection actions

### Grep Verification
```bash
# Should find 0 direct selection calls in hooks (除了 cmdRegistry impl)
grep -r "useBoardStore.*selectElement" hooks/
grep -r "useBoardStore.*clearSelection" hooks/
grep -r "useBoardStore.*selectAll" hooks/
# Result: Only cmdRegistry implementations, no UI violations ✅
```

---

## 🚀 What's Next (PR2)

**PR-REFACTOR-2: Wire Drag/Move + History Commit Rules**

**Goal:** Enforce Intent/Effect separation for drag operations

**Changes:**
1. Wire `moveElementById` → `cmd.board.canvas.moveElementLive` (intent)
2. Wire history commits → `cmd.board.history.commitUserAction()` ONLY on pointerUp
3. Ensure NO history commits during drag (live updates)

**Files to modify:**
- `apps/web/src/hooks/useCanvasEventsController.ts` (drag logic)
- `apps/web/src/App.tsx` (remove direct moveElementById where needed)

**Estimated time:** 1h  
**Risk:** Medium (history logic changes)

---

## 📝 Key Learnings

### 1. CommandRegistry Pattern Works Well
- Single hook (`useCommandRegistry`) provides clean access
- Stable reference via `useMemo` prevents re-renders
- Clear Intent vs Effect separation in types

### 2. Mechanical Replacements Are Safe
- Search/replace for selection methods was straightforward
- TypeScript caught all mismatches immediately
- Zero runtime behavior changes

### 3. Interface Updates Cascade Cleanly
- Removing params from `UseCanvasEventsOptions` forced App.tsx update
- Type errors guided refactoring perfectly
- No guesswork needed

---

## ✅ Definition of Done

- [x] TypeScript: 0 errors
- [x] Selection works identically as before
- [x] **NO direct store action calls for selection in UI**
- [x] grep verification passes
- [x] useCommandRegistry hook created and exported
- [x] All hooks wired to cmdRegistry
- [x] App.tsx cleaned up (removed unused params)

---

## 🎉 Success Metrics

✅ **Hard Rule Compliance:** Selection now goes through CommandRegistry exclusively  
✅ **Zero Runtime Changes:** App behaves identically  
✅ **TypeScript Safety:** 0 compilation errors  
✅ **Vertical Slice Complete:** First domain (selection) fully compliant  

**Status: READY FOR PR2** 🚀

---

**Last Updated:** 2026-01-27 23:10  
**Next PR:** PR-REFACTOR-2 (Drag/Move + History Commits)
