# PR-REFACTOR-14: OverlayLayer Experiment - REVERTED

**Status:** ❌ REVERTED  
**Date:** 2026-01-28  
**Time invested:** ~1h (implementation + diagnosis + revert)  
**Outcome:** Critical lesson learned about Konva event model

---

## Original Intent

Create a dedicated `OverlayLayer` to serve as the single input handler for Konva canvas, following the "single place for input handling" principle.

---

## What Was Implemented

Created `OverlayLayer.tsx` with:
- Transparent `<Rect>` covering entire canvas
- All input event handlers (onClick, onMouseDown, onMouseMove, etc.)
- Rendered as top-most layer (after CanvasElements)

```typescript
<Stage ref={stageRef} width={w} height={h}>
  <CanvasElements ... />
  <OverlayLayer ... />  ← Top-most, intercepts all events
</Stage>
```

---

## What Broke

**ALL element interactions stopped working:**
- ✗ Clicking elements doesn't select them
- ✗ Multi-select with Cmd/Ctrl+click broken
- ✗ Multi-drag of selected elements broken
- ✗ Right-click context menu cannot detect clicked element
- ✓ Keyboard shortcuts still work (different event model)

---

## Root Cause Analysis

### Konva Event Propagation Model

**Critical Discovery:**
> **Konva events do NOT bubble across sibling Layers**

**Event flow in Konva:**
1. Hit-testing starts from TOP layer (last rendered)
2. First shape that passes hit-test CAPTURES the event
3. Event bubbles UP: Shape → Group → Layer → Stage
4. Event does NOT cross to sibling layers

**Why OverlayLayer Broke Everything:**

```typescript
<Stage>
  <Layer>                       ← CanvasElements
    <PlayerNode                 ← Has onClick handler
      id="player-1" 
      onClick={selectElement}   ❌ NEVER CALLED
    />
  </Layer>
  
  <Layer>                       ← OverlayLayer (rendered after = top-most)
    <Rect                       ← Transparent rect
      width={canvasWidth}
      height={canvasHeight}
      fill="transparent"
      onClick={onStageClick}    ✓ CAPTURES ALL CLICKS
    />
  </Layer>
</Stage>
```

**Hit-testing sequence:**
1. Mouse click at (100, 100)
2. Konva checks top layer first (OverlayLayer)
3. Transparent Rect at (100, 100)? YES → Event captured
4. Event bubbles: Rect → OverlayLayer → Stage
5. **PlayerNode never checked** - event already handled

**Why context menu couldn't detect elements:**
```typescript
// useContextMenuHandler walks e.target chain to find element ID
let node = e.target;
while (node && node !== stage) {
  const nodeId = node.id?.();
  if (nodeId) break;  // Found it!
  node = node.parent;
}

// Problem: e.target = Rect (no ID)
// → walk up: Rect → Layer → Stage
// → Never finds PlayerNode (in different layer)
```

---

## The Fix (REVERT)

**Reverted to Stage-level handlers** - Konva's intended pattern:

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

**Why this works:**
- Stage receives events via bubbling from ALL layers below
- `e.target` = actual clicked element (PlayerNode, BallNode, etc.)
- Context menu can walk e.target chain to find element ID
- Selection handlers on individual elements work correctly

---

## Files Changed

### Reverted Changes
1. **apps/web/src/app/board/canvas/CanvasAdapter.tsx**
   - Removed OverlayLayer import and usage
   - Moved handlers back to `<Stage>`

2. **apps/web/src/app/board/canvas/OverlayLayer.tsx**
   - **DELETED** (no longer needed)

### Verification
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 new warnings (only pre-existing)
- ✅ Runtime: All interactions restored
- ✅ Selection works
- ✅ Multi-select works
- ✅ Multi-drag works
- ✅ Context menu detects elements

---

## Lessons Learned

### 1. Framework Fundamentals Matter

**Don't fight the framework:**
- Konva's event model is designed for Stage-level handlers
- Attempting to override with custom layers breaks core functionality
- "Single place for input" in Konva = Stage, NOT a separate layer

### 2. Event Model Understanding

**Critical differences:**
- React/DOM: Events bubble through component tree
- Konva: Events bubble within layer hierarchy, NOT across layers
- Layer siblings are isolated for event purposes

### 3. Diagnosis Speed Matters

**Fast revert saved hours:**
- Immediate manual testing revealed broken interactions
- Quick diagnosis (< 30 min) identified root cause
- Clean revert prevented technical debt
- Better to fail fast than ship broken code

---

## Architecture Principles (Updated)

### ✅ DO

1. **Use Stage-level handlers in Konva**
   - Stage receives events from all layers below
   - Natural event delegation pattern
   - Konva's intended architecture

2. **Respect framework event models**
   - Understand how events propagate
   - Test against framework documentation
   - Don't assume React behavior applies to canvas libraries

3. **Test thoroughly before commit**
   - Manual testing of critical paths
   - Context menu, selection, drag interactions
   - All modifier key combinations

### ❌ DON'T

1. **Don't create input-intercepting layers**
   - Transparent overlays break hit-testing
   - Event isolation causes handler shadowing
   - Violates Konva's event model

2. **Don't assume "single handler" means "single layer"**
   - "Single place" = Stage component
   - NOT a dedicated overlay component
   - Abstraction must respect framework constraints

3. **Don't optimize prematurely**
   - Stage handlers are performant
   - Event delegation works well
   - No need for custom event routing

---

## Impact Assessment

### Time Cost
- Implementation: ~30 min
- Diagnosis: ~30 min
- Revert: ~10 min
- Documentation: ~20 min
- **Total: ~1.5h**

### Knowledge Gain
- ✅ Deep understanding of Konva event model
- ✅ Event propagation between layers
- ✅ Hit-testing sequence
- ✅ When to fight vs follow framework patterns

### Code Quality
- ✅ Codebase unchanged (clean revert)
- ✅ No technical debt introduced
- ✅ Runtime behavior preserved
- ✅ Documentation updated with lessons

---

## Conclusion

While PR-REFACTOR-14 was reverted, it provided valuable insights into Konva's architecture. The experiment confirmed that:

1. **Stage IS the correct place for input handlers** in Konva
2. **Layer-based event isolation is a core Konva feature**, not a bug
3. **Fast diagnosis and clean reverts** are better than shipping broken code

The "single place for input handling" principle is satisfied by Stage-level handlers, not by introducing artificial abstraction layers that break framework fundamentals.

---

**Status:** CLOSED (Reverted)  
**Documentation Updated:** ✅  
**Roadmap Updated:** ✅  
**Lessons Captured:** ✅
