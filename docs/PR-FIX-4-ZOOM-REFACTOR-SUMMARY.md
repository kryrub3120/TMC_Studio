# PR-FIX-4: Zoom Refactor - Remove CSS Transform, Use Konva Stage Scaling

## Summary

Fixed pitch clipping issue on window resize by removing CSS `transform: scale()` zoom and implementing proper fit-to-container logic with Konva Stage-level scaling.

## Problem

- **Issue**: `BoardCanvasSection` used CSS `transform: scale(zoom)` with `transformOrigin: center`, causing pitch to clip and become inaccessible when window is smaller than pitch dimensions
- **Root Cause**: CSS transform scales the wrapper element, pushing content outside viewport bounds with no scroll access
- **Impact**: On small windows or portrait orientation, users couldn't see or interact with the full pitch

## Solution

### 1. Removed CSS Transform Scaling
**File**: `apps/web/src/app/board/BoardCanvasSection.tsx`

- ✅ Removed `style={{ transform: scale(${zoom}), transformOrigin: 'center' }}`
- ✅ Removed `overflow-hidden` class that prevented scrolling
- ✅ Added container ref with `ResizeObserver` to measure available space

### 2. Implemented Fit-to-Container Logic
**File**: `apps/web/src/app/board/BoardCanvasSection.tsx`

```typescript
// Compute fitZoom: scale pitch to fit in container with padding
const CONTAINER_PADDING = 48; // padding around canvas in container
const fitZoom = containerSize.width > 0 && containerSize.height > 0
  ? Math.min(
      (containerSize.width - CONTAINER_PADDING) / canvasWidth,
      (containerSize.height - CONTAINER_PADDING) / canvasHeight,
      1 // never scale up beyond 100%
    )
  : 1;

// Effective zoom: userZoom * fitZoom
const effectiveZoom = zoom * fitZoom;
```

**Key Logic**:
- `fitZoom` = minimum of horizontal/vertical fit ratios, capped at 1.0
- `effectiveZoom` = user's zoom preference × automatic fit scaling
- Container size measured via `ResizeObserver` (reactive to window resize)
- 48px padding ensures pitch doesn't touch container edges

### 3. Applied Zoom at Stage Level
**File**: `apps/web/src/app/board/canvas/CanvasAdapter.tsx`

```typescript
<Stage
  ref={stageRef}
  width={canvasWidth * stageScale}
  height={canvasHeight * stageScale}
  scaleX={stageScale}
  scaleY={stageScale}
  ...
>
```

**Changes**:
- Added `stageScale` prop to `CanvasAdapterProps` (defaults to 1)
- Stage dimensions multiplied by `stageScale`
- Stage `scaleX` and `scaleY` set to `stageScale`
- All Konva rendering respects this scale (no coordinate translation needed)

### 4. Updated Zoom Model
**File**: `apps/web/src/store/useUIStore.ts`

```typescript
zoomFit: () => {
  set({ zoom: 1 });
  get().showToast('Zoom: Fit', 800);
},
```

- `zoom` = user zoom preference (0.25 - 2.0)
- "Fit" button sets `zoom = 1`, which triggers auto-fit via `fitZoom` multiplier
- Zoom toast updated to say "Zoom: Fit" (not "100%") since effective zoom varies

## Modified Files

1. **apps/web/src/app/board/BoardCanvasSection.tsx**
   - Removed CSS transform scaling
   - Added ResizeObserver for container measurement
   - Implemented fitZoom calculation
   - Applied effectiveZoom to Stage

2. **apps/web/src/app/board/canvas/CanvasAdapter.tsx**
   - Added `stageScale` prop
   - Applied scale to Stage width/height and scaleX/scaleY

3. **apps/web/src/store/useUIStore.ts**
   - Updated `zoomFit()` toast message

## Key Code Snippets

### computeFitZoom (BoardCanvasSection.tsx)
```typescript
const CONTAINER_PADDING = 48;
const fitZoom = containerSize.width > 0 && containerSize.height > 0
  ? Math.min(
      (containerSize.width - CONTAINER_PADDING) / canvasWidth,
      (containerSize.height - CONTAINER_PADDING) / canvasHeight,
      1 // never scale up beyond 100%
    )
  : 1;

const effectiveZoom = zoom * fitZoom;
```

### Stage Scaling (CanvasAdapter.tsx)
```typescript
<Stage
  ref={stageRef}
  width={canvasWidth * stageScale}
  height={canvasHeight * stageScale}
  scaleX={stageScale}
  scaleY={stageScale}
  ...
/>
```

## Testing Checklist

### Manual Tests Required
- [ ] Resize window smaller than pitch → pitch scales down, stays fully visible
- [ ] Resize window larger than pitch → pitch stays at 100% (no upscaling)
- [ ] Toggle portrait/landscape orientation → fit recomputes correctly
- [ ] Click "Fit" button → pitch fits perfectly in viewport
- [ ] Zoom in/out with +/− buttons → zoom still works
- [ ] Drag elements → hit detection and dragging still accurate
- [ ] Click elements → selection still works
- [ ] Resize window during drag → no glitches
- [ ] Verify no clipping on small windows (e.g., 800×600)
- [ ] Verify rounded corners and shadow still visible
- [ ] Check that scroll is accessible if needed (though shouldn't be with fit logic)

### Expected Behavior
- ✅ Pitch always visible (no clipping)
- ✅ Window resize → pitch automatically scales to fit
- ✅ "Fit" button → pitch fits viewport perfectly
- ✅ User zoom controls still work (multiplied by fitZoom)
- ✅ Interactions (drag, click, resize zones, arrows) still accurate
- ✅ Visual polish preserved (rounded corners, shadows, padding)

## Architecture Notes

- **Separation of Concerns**: fitZoom (automatic) vs. zoom (user preference)
- **No Breaking Changes**: All interactions remain the same, only zoom implementation changed
- **Future-Proof**: Works with both legacy canvas (CanvasAdapter) and new canvas (BoardCanvas)
- **Performance**: ResizeObserver is efficient, only triggers on actual size changes

## Deployment

- No database migrations required
- No environment variables changed
- Client-side only change
- Zero downtime deployment safe
