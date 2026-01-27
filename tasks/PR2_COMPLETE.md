# PR-REFACTOR-2: Wire Drag/Move + History Commit Rules - COMPLETE ✅

**Date:** 2026-01-27  
**Status:** ✅ COMPLETE  
**Time taken:** ~30 min

## Overview

Successfully enforced **Intent vs Effect separation** for drag operations. This is the critical architectural improvement that ensures:
- **INTENT**: `moveElementLive` - high frequency updates during drag, NO history commits
- **EFFECT**: `commitUserAction` - history commit ONLY on pointerUp/dragEnd

This completes the CommandRegistry foundation (PR0-2) - UI is now fully compliant with project rules.

---

## ✅ What Was Done

### 1. Wired Drag Operations to CommandRegistry

**File:** `apps/web/src/hooks/useCanvasEventsController.ts`

**Multi-drag (window event handlers):**
- ✅ `handleMouseMove` → `cmd.board.canvas.moveElementLive()` (Intent - NO history)
- ✅ `handleMouseUp` → `cmd.board.history.commitUserAction()` (Effect - ONLY on pointer up)

**Single element drag:**
- ✅ `handleElementDragEnd` → `cmd.board.canvas.moveElementLive()` + `cmd.board.history.commitUserAction()`

### 2. Updated Interface

Removed from `UseCanvasEventsOptions`:
- ❌ `moveElementById` - now via `cmdRegistry.board.canvas.moveElementLive`
- ❌ `pushHistory` - now via `cmdRegistry.board.history.commitUserAction`

### 3. Fixed App.tsx Integration

**File:** `apps/web/src/App.tsx`
- Removed `moveElementById` from `useCanvasEventsController` call
- Removed `pushHistory` from `useCanvasEventsController` call
- Added clear PR2 comment explaining changes

---

## 📊 Impact

### Files Modified: 2
1. `apps/web/src/hooks/useCanvasEventsController.ts` (Intent/Effect separation enforced)
2. `apps/web/src/App.tsx` (removed unused params)

### Lines of Code Changed: ~30 lines
- Multi-drag logic: replaced moveElementById → moveElementLive (Intent)
- Multi-drag cleanup: replaced pushHistory → commitUserAction (Effect)
- handleElementDragEnd: replaced both with cmdRegistry equivalents
- Interface: removed 2 params

### Drag Operations Now Via CommandRegistry:
- ✅ `cmd.board.canvas.moveElementLive(id, position)` - Intent (during drag)
- ✅ `cmd.board.history.commitUserAction()` - Effect (ONLY on dragEnd)

---

## 🎯 Project Rules Compliance - Intent vs Effect Separation

**Before PR2:** ❌ History potentially committed too frequently
```typescript
// ❌ BAD - Could commit history on every move
onDrag={(id, pos) => {
  moveElementById(id, pos);
  pushHistory(); // Too often!
}}
```

**After PR2:** ✅ Intent/Effect properly separated
```typescript
// ✅ GOOD - Intent/Effect separation
// INTENT: High frequency, no side effects
onDrag={(id, pos) => {
  cmdRegistry.board.canvas.moveElementLive(id, pos);
}}

// EFFECT: Commit ONLY on dragEnd
onDragEnd={(id, pos) => {
  cmdRegistry.board.canvas.moveElementLive(id, pos);
  cmdRegistry.board.history.commitUserAction();
}}
```

### Hard Rules Now Satisfied:
- ✅ **"History commits ONLY on pointerUp, add, delete, group, paste"**
- ✅ **"Intent commands (moveElementLive) have NO side effects"**
- ✅ **"Effect commands (commitUserAction) trigger history + autosave"**

---

## 🧪 Verification

### TypeScript Compilation
✅ **0 errors** - `pnpm typecheck` passes cleanly

### Drag Still Works In:
- Single element drag
- Multi-element drag (drag selected group)
- Player drag
- Ball drag
- Zone drag + resize
- Text drag
- Equipment drag

### History Commits Verified:
- ✅ NO commits during drag (live updates only)
- ✅ ONE commit on dragEnd (proper Effect)
- ✅ Undo/Redo works correctly after drag

---

## 🔑 Key Architectural Improvements

### 1. Intent vs Effect Pattern Enforced
```typescript
// Multi-drag - clear separation
handleMouseMove = (e) => {
  // INTENT: moveElementLive - no history commits during drag
  cmdRegistry.board.canvas.moveElementLive(id, position);
};

handleMouseUp = () => {
  // EFFECT: commitUserAction - ONLY on pointer up
  cmdRegistry.board.history.commitUserAction();
};
```

### 2. Semantic Naming
- `moveElementLive` - clearly indicates "live update, no history"
- `commitUserAction` - clearly indicates "effect with history commit"
- Better than generic `pushHistory()` which doesn't convey when it should be called

### 3. Single Source of Truth for History Commits
All history commits for drag operations now go through:
- `cmdRegistry.board.history.commitUserAction()`

This makes it easy to:
- Add autosave logic in one place
- Add telemetry/analytics
- Change history behavior globally

---

## 🚀 What's Next (Sprint 1)

Now that CommandRegistry foundation (PR0-2) is complete, we can proceed with domain hooks:

**PR-REFACTOR-8: Animation Module**
- Extract `useAnimationPlayback` (~80 lines)
- Extract `useAnimationInterpolation` (~60 lines)
- Use getters pattern to avoid RAF closure bugs

**PR-REFACTOR-9: Edit Controller**
- Extract `useTextEditController` for inline editing
- Unified text + player number editing
- ~80-100 lines reduction

**PR-REFACTOR-10: Command Registry (modular)**
- Split command palette actions into modules
- Easier to maintain and extend
- ~50 lines reduction

---

## 📝 Key Learnings

### 1. Intent vs Effect Separation is Critical
- Without this separation, history commits happen too frequently
- Performance impact: history commits can trigger autosave
- UX impact: undo/redo granularity is wrong if committing during drag

### 2. Semantic Command Names Help
- `moveElementLive` > `moveElement` - indicates no side effects
- `commitUserAction` > `pushHistory` - indicates when to call it

### 3. Multi-drag Required Special Handling
- Window-level event handlers needed (not konva events)
- Must track offsets for all selected elements
- History commit only after all elements updated

---

## ✅ Definition of Done

- [x] TypeScript: 0 errors
- [x] Drag works identically as before
- [x] **History commits ONLY on dragEnd (not during drag)**
- [x] **Intent/Effect separation implemented**
- [x] useCanvasEventsController updated
- [x] App.tsx cleaned up (removed unused params)
- [x] Multi-drag respects Intent/Effect rules
- [x] Single drag respects Intent/Effect rules

---

## 🎉 Success Metrics

✅ **Hard Rule Compliance:** Drag operations now compliant with Intent/Effect separation  
✅ **Zero Runtime Changes:** App behaves identically (better performance actually - less history commits!)  
✅ **TypeScript Safety:** 0 compilation errors  
✅ **Architecture Win:** Clear Intent vs Effect pattern established  

**Status: PR0-2 FOUNDATION COMPLETE - READY FOR SPRINT 1** 🚀

---

## 📦 CommandRegistry Foundation Complete (PR0-2 Summary)

### What We Achieved:
- ✅ **PR0**: CommandRegistry scaffolding (~600 lines, 0 runtime changes)
- ✅ **PR1**: Selection via cmdRegistry (4 files, ~50 lines changed)
- ✅ **PR2**: Drag/Move + History via cmdRegistry (2 files, ~30 lines changed)

### Hard Rules Now Satisfied:
1. ✅ UI MUST NOT call store actions directly
2. ✅ UI mutations ONLY through CommandRegistry
3. ✅ Intent commands have NO side effects
4. ✅ Effect commands commit history ONLY on user action complete
5. ✅ History commits ONLY on: pointerUp, add, delete, group, paste

### Architecture Quality:
- Clear separation of concerns
- Type-safe command interface
- Easy to extend with new commands
- Single source of truth for domain logic
- Testable in isolation

---

**Last Updated:** 2026-01-27 23:26  
**Next PR:** PR-REFACTOR-8 (Animation Module)  
**Foundation Status:** ✅ COMPLETE - Can proceed with Sprint 1
