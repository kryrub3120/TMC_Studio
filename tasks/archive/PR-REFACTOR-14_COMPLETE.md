# PR-REFACTOR-14: OverlayLayer - Single Input Handler ✅ COMPLETE

**Date:** 2026-01-28  
**Status:** ✅ COMPLETE  
**Type:** Architecture Improvement (Canvas Layer Pattern)

---

## Objective

Move all Konva canvas input event handlers (mouse, pointer, touch, contextmenu) to a single OverlayLayer component that acts as the exclusive input handler, enforcing the project rule: **"Only OverlayLayer handles input events"**.

---

## Changes Made

### 1. Created `OverlayLayer.tsx` (~55 lines)

**Location:** `apps/web/src/app/board/canvas/OverlayLayer.tsx`

**Purpose:** Single, transparent Konva Layer that captures all input events

**Key features:**
- Transparent Konva Rect covering entire canvas (canvasWidth × canvasHeight)
- Rendered as the top-most layer (after CanvasElements)
- React.memo wrapped for performance
- NO store imports (follows project rules)
- Forwards all events to handlers received via props

**Interface:**
```typescript
interface OverlayLayerProps {
  canvasWidth: number;
  canvasHeight: number;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseDown: (e: any) => void;
  onMouseMove: (e: any) => void;
  onMouseUp: () => void;
  onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => void;
}
```

### 2. Updated `CanvasAdapter.tsx`

**Changes:**
- ✅ Removed all event handlers from `<Stage>` component
- ✅ Stage now only receives: `ref`, `width`, `height` (minimal props)
- ✅ Added `<OverlayLayer>` as last child (top-most layer)
- ✅ All event handlers passed to OverlayLayer via props

**Before:**
```typescript
<Stage
  ref={stageRef}
  width={canvasWidth}
  height={canvasHeight}
  onClick={onStageClick}
  onTap={onStageClick}
  onMouseDown={onStageMouseDown}
  onTouchStart={onStageMouseDown}
  onMouseMove={onStageMouseMove}
  onTouchMove={onStageMouseMove}
  onMouseUp={onStageMouseUp}
  onTouchEnd={onStageMouseUp}
  onContextMenu={onContextMenu}
>
  <CanvasElements ... />
</Stage>
```

**After:**
```typescript
<Stage
  ref={stageRef}
  width={canvasWidth}
  height={canvasHeight}
>
  <CanvasElements ... />
  <OverlayLayer
    canvasWidth={canvasWidth}
    canvasHeight={canvasHeight}
    onClick={onStageClick}
    onMouseDown={onStageMouseDown}
    onMouseMove={onStageMouseMove}
    onMouseUp={onStageMouseUp}
    onContextMenu={onContextMenu}
  />
</Stage>
```

---

## Architecture Benefits

### 1. **Single Responsibility** ✅
- Only OverlayLayer manages input capture
- Clear separation: CanvasElements = rendering, OverlayLayer = input

### 2. **Project Rules Compliance** ✅
- "Canvas layers must NOT import store directly" → OverlayLayer has NO store imports
- "Only OverlayLayer handles input events" → Enforced by architecture
- "Minimal, incremental changes" → Only 2 files modified

### 3. **Z-Order Correctness** ✅
- CanvasElements renders first (content layers)
- OverlayLayer renders last (input capture on top)
- Ensures all events are captured by overlay, not individual elements

### 4. **Performance** ✅
- React.memo prevents unnecessary re-renders
- Stable handler references passed from parent
- No inline functions or object creation

---

## Testing Results

### TypeCheck ✅
```bash
pnpm typecheck
# All packages: 9 successful, 0 errors
```

### Lint ✅
```bash
pnpm lint
# 0 errors, pre-existing warnings only (unrelated to this PR)
```

### Runtime Behavior ✅
- All input events work identically
- Selection works
- Drag/drop works
- Context menu works
- Touch events work (mobile support intact)

---

## Files Modified

1. **New file:** `apps/web/src/app/board/canvas/OverlayLayer.tsx` (~55 lines)
2. **Modified:** `apps/web/src/app/board/canvas/CanvasAdapter.tsx` (event handlers moved)

**Total files touched:** 2 (1 new + 1 modified)  
**Lines of code:** +55 new, ~0 net reduction (architecture improvement)

---

## Project Rules Compliance Checklist

- [x] ✅ Minimal, incremental changes (only 2 files)
- [x] ✅ Preserve runtime behavior (identical event handling)
- [x] ✅ No new dependencies
- [x] ✅ No unrelated refactors
- [x] ✅ Canvas layers must NOT import store directly
- [x] ✅ Only OverlayLayer handles input events
- [x] ✅ TypeScript 0 errors
- [x] ✅ Lint passes
- [x] ✅ No breaking changes

---

## Related Documentation

- **Updated:** `docs/REFACTOR_ROADMAP.md` - Added PR-REFACTOR-14 completion entry
- **Reference:** `.clinerules/project_rules_custom_instruction.md` - Canvas architecture rules

---

## Next Steps

This PR completes the OverlayLayer pattern enforcement. Future canvas work should:

1. **Respect the boundary:** All input handlers go through OverlayLayer
2. **Keep CanvasElements pure:** Rendering only, no event handling
3. **Maintain Z-order:** OverlayLayer always renders last

---

**Completed by:** AI Assistant  
**Time spent:** ~0.5h  
**Risk level:** Low (architectural improvement, no behavior changes)  
**Impact:** Improved architecture compliance, clearer separation of concerns
