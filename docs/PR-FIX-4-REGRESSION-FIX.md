# PR-FIX-4 Regression Fix: Double Scaling Bug

## Problem

After initial PR-FIX-4 implementation, pitch appeared **micro-sized** on load due to double scaling bug.

### Root Cause: Stage Props Applied Scaling TWICE

**Before (BROKEN)**:
```typescript
<Stage
  ref={stageRef}
  width={canvasWidth * stageScale}    // ❌ First scaling
  height={canvasHeight * stageScale}  // ❌ First scaling
  scaleX={stageScale}                 // ❌ Second scaling
  scaleY={stageScale}                 // ❌ Second scaling
  ...
/>
```

**Result**: `effectiveScale = stageScale²` (squared!)
- If `stageScale = 0.5`, effective scale became `0.25` → pitch shrunk to 25%
- If `stageScale = 0.3`, effective scale became `0.09` → pitch shrunk to 9% (micro!)

## Solution

Apply scaling in **ONLY ONE WAY**: use Konva's built-in `scaleX/scaleY` transform, keep width/height at base dimensions.

### Fixed Stage Props

**After (CORRECT)**:
```typescript
<Stage
  ref={stageRef}
  width={canvasWidth}      // ✅ Base dimensions
  height={canvasHeight}    // ✅ Base dimensions
  scaleX={stageScale}      // ✅ Scale transform only
  scaleY={stageScale}      // ✅ Scale transform only
  ...
/>
```

**Result**: `effectiveScale = stageScale` (correct!)
- Konva applies transform matrix internally
- No coordinate translation needed
- Hit detection and interactions remain accurate

## Additional Fix: Container Size Guard

Added guard against initial zero-size or tiny container measurements that could cause glitches.

**Before**:
```typescript
const fitZoom = containerSize.width > 0 && containerSize.height > 0
  ? Math.min(...)
  : 1;
```

**After**:
```typescript
const MIN_CONTAINER_SIZE = 200; // guard against initial zero-size or tiny containers

const fitZoom = containerSize.width > MIN_CONTAINER_SIZE && containerSize.height > MIN_CONTAINER_SIZE
  ? Math.min(
      (containerSize.width - CONTAINER_PADDING) / canvasWidth,
      (containerSize.height - CONTAINER_PADDING) / canvasHeight,
      1
    )
  : 1;
```

**Benefits**:
- Prevents fitZoom from computing invalid values during initial ResizeObserver glitches
- Falls back to `fitZoom = 1` (no auto-scaling) until container is properly sized
- Avoids micro-pitch on first render

## Modified Files

### 1. apps/web/src/app/board/canvas/CanvasAdapter.tsx
```diff
  <Stage
    ref={stageRef}
-   width={canvasWidth * stageScale}
-   height={canvasHeight * stageScale}
+   width={canvasWidth}
+   height={canvasHeight}
    scaleX={stageScale}
    scaleY={stageScale}
```

### 2. apps/web/src/app/board/BoardCanvasSection.tsx
```diff
  const CONTAINER_PADDING = 48;
+ const MIN_CONTAINER_SIZE = 200; // guard against initial zero-size

- const fitZoom = containerSize.width > 0 && containerSize.height > 0
+ const fitZoom = containerSize.width > MIN_CONTAINER_SIZE && containerSize.height > MIN_CONTAINER_SIZE
    ? Math.min(...)
    : 1;
```

Also removed explicit container sizing:
```diff
  <div 
    ref={containerRef}
    className="shadow-canvas rounded-[20px] border border-border/50 p-3 bg-surface/50 backdrop-blur-sm"
-   style={{ 
-     width: canvasWidth * effectiveZoom + 24,
-     height: canvasHeight * effectiveZoom + 24,
-     maxWidth: '100%',
-     maxHeight: '100%',
-   }}
  >
```

Container now auto-sizes based on parent flex layout and canvas natural size.

## Before/After Comparison

### Stage Props Before (BROKEN)
```typescript
{
  width: 820 * 0.5,    // = 410
  height: 620 * 0.5,   // = 310
  scaleX: 0.5,         // Another 0.5x scaling
  scaleY: 0.5,         // Another 0.5x scaling
}
// Effective: 820 * 0.5 * 0.5 = 205px wide (MICRO!)
```

### Stage Props After (CORRECT)
```typescript
{
  width: 820,          // Base dimension
  height: 620,         // Base dimension
  scaleX: 0.5,         // Single 0.5x scaling
  scaleY: 0.5,         // Single 0.5x scaling
}
// Effective: 820 * 0.5 = 410px wide (CORRECT!)
```

## Why This Approach Works

**Konva Stage Scale Transform**:
- `scaleX/scaleY` applies a transform matrix to all Stage children
- All coordinates remain in "world space" (unscaled)
- Mouse events automatically translated by Konva
- Drag handlers receive correct world coordinates
- No manual coordinate conversion needed

**Alternative (NOT used)**:
Could have multiplied width/height and kept scale=1, but this requires:
- Manual coordinate translation for all mouse events
- More complex hit detection logic
- Potential for coordinate system bugs

## Verification

The fix ensures:
- ✅ Pitch displays at correct size on initial load
- ✅ Window resize triggers correct auto-fit scaling
- ✅ User zoom controls work (0.25x - 2.0x range)
- ✅ Drag interactions use correct coordinates
- ✅ Click/selection hit detection accurate
- ✅ No micro-pitch or double-scaling artifacts

## Lesson Learned

When using Konva Stage scaling:
- ❌ **DON'T** scale both dimensions AND transform properties
- ✅ **DO** use transform properties (scaleX/scaleY) for dynamic scaling
- ✅ **DO** keep width/height at base dimensions for proper coordinate system
