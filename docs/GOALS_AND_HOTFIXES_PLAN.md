# TMC Studio - Goals & Hotfixes Implementation Plan

**Version:** 2.1  
**Date:** 2026-01-29  
**Status:** Ready for Implementation  
**Changelog:** Clarified PPM resize slider semantics (radius-based percent, Mixed state strategy), verified file paths, added listening={false} requirement, shoot arrow triple-line prevention

---

## Executive Summary

This document defines a 4-stage implementation plan for critical UX bugs and football pitch goals system. Each stage is atomic, incrementally testable, and preserves existing functionality.

**Two Distinct Goal Systems:**
1. **Pitch overlay goals** — Non-selectable decoration on pitch background (MUST-HAVE)
2. **Goal equipment** — Draggable/rotatable training equipment items (exists, needs visual polish)

**Key Principles:**
- No App.tsx refactoring
- Preserve undo/redo history
- Preserve autosave flow  
- Keyboard-first UX
- Minimal visual noise on pitch overlay
- Single undo entry per user action

---

## 🔴 STAGE 1: HOTFIXES (CRITICAL)

**Objective:** Fix 4 confirmed bugs that create misleading UX  
**Risk:** LOW  
**Estimated Effort:** 2 hours  
**Priority:** CRITICAL - Must ship first

### Bugs to Fix

#### B1 – Rename UI Wiring
**Root Cause:** Type mismatch in callback signature + need to verify single source of truth  
**Files:**
- `apps/web/src/app/board/BoardPage.tsx:55` (callback wiring)
- `packages/ui/src/TopBar.tsx` (rename input field)
- `apps/web/src/hooks/useProjectsController.ts` (renameProject handler)

**Current (broken):**
```tsx
// BoardPage.tsx
onRenameProject={(newName) => onRenameProject(cloudProjectId ?? '', newName)}
```

**Fix:**
```tsx
// BoardPage.tsx
onRenameProject={(newName) => handleRenameProject(newName)}
```

**Why:** `useProjectsController.renameProject` expects `(newName: string)`, not `(id, name)`.

**Verification Required:**
1. Confirm `TopBar.tsx` reads `projectName` prop (single source of truth)
2. Confirm `useProjectsController.renameProject` updates `document.name` via `setState`
3. Confirm `markDirty()` is called to trigger autosave
4. Verify rename UI remains editable after login (not disabled/hidden)

---

#### B2 – Resize Render Layer + Hit Area Correctness
**Root Cause:** PlayerNode ignores stored `radius` property + hit areas don't match visual size  
**File:** `packages/board/src/PlayerNode.tsx:67`

**Current (broken):**
```tsx
const PLAYER_RADIUS = 18; // hardcoded constant
// ... later:
<Circle radius={PLAYER_RADIUS} />
```

**Fix:**
```tsx
const PLAYER_RADIUS = 18; // default only
const effectiveRadius = player.radius ?? PLAYER_RADIUS;
// ... later:
<Circle radius={effectiveRadius} />
```

**IMPORTANT:** `radius?: number` already exists in `PlayerElement` type. This is ONLY a render-layer fix.

**Affected code locations (ALL shapes must use effectiveRadius):**
- Line 67: constant definition
- Line 142: Circle render → `radius={effectiveRadius}`
- Line 149: Selection ring → `radius={effectiveRadius + 4}`
- Line 173: Square render → `width={effectiveRadius * 2}, height={effectiveRadius * 2}`
- Line 185: Triangle render → `radius={effectiveRadius + 2}`
- Line 197: Diamond render → `width={effectiveRadius * 2}, height={effectiveRadius * 2}`

**Critical: Hit Area Correctness**
After resize, the click/selection area MUST match the visual size. Test by:
1. Resize player to 250% → click slightly outside old bounds → should still select
2. Resize player to 40% → click old bounds but outside new size → should NOT select

---

#### U1 – Diamond Shape Offset
**Root Cause:** Incorrect transform origin for rotated Rect  
**File:** `packages/board/src/PlayerNode.tsx:192-203`

**Current (broken):**
```tsx
<Rect
  x={-PLAYER_RADIUS}
  y={-PLAYER_RADIUS}
  width={PLAYER_RADIUS * 2}
  height={PLAYER_RADIUS * 2}
  rotation={45}
  offsetX={-PLAYER_RADIUS}  // ❌ WRONG
  offsetY={-PLAYER_RADIUS}  // ❌ WRONG
/>
```

**Fix Option A (simplest):**
```tsx
<Rect
  x={-PLAYER_RADIUS}
  y={-PLAYER_RADIUS}
  width={PLAYER_RADIUS * 2}
  height={PLAYER_RADIUS * 2}
  rotation={45}
  offsetX={0}  // ✅ Rotate around element center
  offsetY={0}
/>
```

**Fix Option B (cleaner - recommended):**
```tsx
<RegularPolygon
  x={0}
  y={0}
  sides={4}
  radius={PLAYER_RADIUS * 1.2}
  rotation={45}
/>
```

---

#### B4 – Clear (C) Feedback
**Root Cause:** Toast shows "Drawings cleared" even when no drawings exist  
**File:** `apps/web/src/hooks/useKeyboardShortcuts.ts:177`

**Current (misleading):**
```tsx
case 'c':
  if (isCmd) {
    copySelection();
  } else {
    clearAllDrawings();
    showToast('Drawings cleared • Undo: Cmd+Z');
  }
```

**Fix:**
```tsx
case 'c':
  if (isCmd) {
    copySelection();
  } else {
    const drawingsCount = elements.filter(el => el.type === 'drawing').length;
    if (drawingsCount === 0) {
      showToast('No drawings to clear');
    } else {
      clearAllDrawings();
      showToast(`${drawingsCount} drawing${drawingsCount > 1 ? 's' : ''} cleared • Undo: Cmd+Z`);
    }
  }
```

---

#### B5 – PPM Resize Slider (NEW REQUIREMENT)
**Root Cause:** Missing precise resize UI — keyboard only scales in 10% increments  
**Files:**
- `apps/web/src/utils/canvasContextMenu.ts` (PRIMARY: add "Resize…" to PPM context menu)
- Popover/slider UI component (wherever existing popover pattern lives)
- `apps/web/src/store/slices/elementsSlice.ts` (resize logic already exists)

**Scope (v2.1):**
- **Resize slider applies to `PlayerElement` only**
- Selection must contain only players (homogeneous)
- If selection contains non-players (zones, text, equipment): menu item hidden/disabled
- Future: extend to other element types with per-type baseline

**Feature Requirements:**
1. **Right-click selection → "Resize…"** opens popover with slider (PPM context menu item)
2. **Slider range:** 40%–250% with live preview
3. **Single undo entry:** History commit only on popover close/release
4. **Multi-select support:** Show "Mixed" state if selected elements have different radius values
5. **Reset button:** "Reset to 100%" button in popover

**Source of Truth for Percentage:**
```tsx
const PLAYER_RADIUS = 18; // default from PlayerNode
const percent = Math.round(((player.radius ?? PLAYER_RADIUS) / PLAYER_RADIUS) * 100);
// Example: radius=36 → 200%, radius=9 → 50%

// Reset to 100%:
player.radius = undefined; // ✅ ALWAYS undefined (default comes from render layer)
// Why undefined (not PLAYER_RADIUS):
// - Smaller payload in document
// - Consistent with "default-only in PlayerNode"
// - Future-proof if default changes
```

**Implementation Notes:**
```tsx
// canvasContextMenu.ts (PPM menu)
{
  label: 'Resize…',
  action: () => openResizePopover(selectedIds),
  shortcut: 'Opt+Cmd +/-'
}

// ResizePopover component (new)
<Popover>
  <div>
    <label>Scale: {isMixed ? 'Mixed' : `${percent}%`}</label>
    <input 
      type="range" 
      min={40} 
      max={250} 
      value={percent}
      onChange={(e) => {
        const newPercent = Number(e.target.value);
        const newRadius = (PLAYER_RADIUS * newPercent) / 100;
        setRadiusPreview(newRadius); // Live preview (intent)
      }}
      onMouseUp={() => commitResize()} // History commit here (effect)
    />
    <button onClick={() => resetToDefault()}>Reset to 100%</button>
  </div>
</Popover>
```

**History Behavior (Preview vs Commit API):**

To avoid history spam during live preview, implement two-path approach:

1. **Preview path (while dragging):**
   ```tsx
   // Option A: Temporary state update without history
   updateElementsPreview(selectedIds, { radius: newRadius }); // No pushHistory()
   
   // Option B: If separate preview API doesn't exist
   elementsSlice.resizeSelected({ percent: newPercent, commit: false });
   ```

2. **Commit path (on release/close):**
   ```tsx
   // Single history commit
   elementsSlice.resizeSelected({ percent: finalPercent, commit: true });
   // OR
   pushHistory({ type: 'resize', elements: selectedIds, newRadius });
   ```

**Result:** User sees instant live preview, can undo entire resize as one action (not 50+ undo entries for slider drag)

**Multi-select "Mixed" State Strategy (Option A - RECOMMENDED):**

When selected elements have different `radius` values (e.g., [18, 36, 27]):

1. **Display "Mixed" indicator** on slider label
2. **Slider positioned at:** average of all selected radii converted to percent
3. **On slider change:** Apply ABSOLUTE radius to all selected elements
   ```tsx
   // When user sets slider to X%:
   const newRadius = (PLAYER_RADIUS * sliderPercent) / 100;
   
   // Apply same absolute radius to ALL selected:
   selectedElements.forEach(el => {
     el.radius = newRadius;
   });
   ```

**Why absolute (not relative):**
- Simpler mental model: "I want all selected to be 150%"
- Deterministic result: all elements end up same size
- Avoids compounding errors on repeated adjustments
- Consistent with "Reset to 100%" behavior (all → default)

**Alternative (NOT RECOMMENDED):**
- Option B (relative): `newRadius = currentRadius * (sliderPercent / currentPercent)` 
- Issues: compounds errors, unpredictable final sizes, complex undo

**Implementation:**
```tsx
const selectedRadii = selectedElements.map(el => el.radius ?? PLAYER_RADIUS);
const isMixed = new Set(selectedRadii).size > 1;
const avgRadius = selectedRadii.reduce((a, b) => a + b, 0) / selectedRadii.length;
const displayPercent = Math.round((avgRadius / PLAYER_RADIUS) * 100);
```

---

### Definition of Done (Stage 1)

- [ ] **B1 Rename:** User can rename project after login; TopBar shows new name immediately
- [ ] **B2 Resize:** `Option+Cmd +/-` visually resizes players (confirm with screenshots)
- [ ] **B2 Resize:** Hit areas match visual size after resize (no "clicking off")
- [ ] **U1 Diamond:** Diamond shape renders centered on player position (not offset)
- [ ] **B4 Clear:** Pressing `C` with no drawings shows "No drawings to clear"
- [ ] **B4 Clear:** Pressing `C` with 3 drawings shows "3 drawings cleared • Undo: Cmd+Z"
- [ ] **B5 PPM Resize:** Right-click selection → "Resize…" opens slider popover
- [ ] **B5 PPM Resize:** Slider shows live preview while dragging
- [ ] **B5 PPM Resize:** Single undo entry after release (not per-tick)
- [ ] **B5 PPM Resize:** Multi-select shows "Mixed" state correctly
- [ ] All fixes pass `pnpm typecheck`
- [ ] Manual test: resize → undo → resize again (history works)
- [ ] Manual test: rename → autosave triggers (check network tab)
- [ ] No console errors in browser
- [ ] Existing documents load without issues

**Test Checklist:**
```
✓ Open project after login
✓ Click project name → rename → press Enter → verify TopBar updates
✓ Select player → Option+Cmd + (3 times) → verify player grows
✓ Option+Cmd - (2 times) → verify player shrinks
✓ Select diamond player → verify centered rendering
✓ Add 2 freehand drawings → press C → verify toast shows count
✓ Press C again → verify "No drawings" message
✓ Press Cmd+Z → verify drawings restored
```

---

## 🟠 STAGE 2: PITCH OVERLAY GOALS (MUST-HAVE)

**Objective:** Add minimal goal visualization to football pitch  
**Risk:** LOW-MEDIUM  
**Estimated Effort:** 3 hours  
**Priority:** HIGH - Core football representation

### Why This Matters

A football pitch without goals is like a chess board without kings. This is not optional — it's a fundamental domain requirement.

### Design Principles

1. **Minimal visual noise** — goals are background decoration, not interactive elements
2. **Performance first** — Pitch.tsx renders on every zoom/pan
3. **Symbolic representation** — suggest depth, don't replicate reality
4. **Clear semantics** — goals ≠ goal areas (6-yard boxes)

---

### Implementation

#### 1. Add Setting to Core Types
**File:** `packages/core/src/types.ts`

**Add to `PitchLineSettings` interface (around line 300):**
```typescript
export interface PitchLineSettings {
  showOutline: boolean;
  showCenterLine: boolean;
  showCenterCircle: boolean;
  showPenaltyAreas: boolean;
  showGoalAreas: boolean;
  showCornerArcs: boolean;
  showPenaltySpots: boolean;
  showGoals: boolean;  // ✅ NEW - default: true
}
```

**Update `DEFAULT_LINE_SETTINGS` (around line 320):**
```typescript
export const DEFAULT_LINE_SETTINGS: PitchLineSettings = {
  showOutline: true,
  showCenterLine: true,
  showCenterCircle: true,
  showPenaltyAreas: true,
  showGoalAreas: true,
  showCornerArcs: true,
  showPenaltySpots: true,
  showGoals: true,  // ✅ NEW
};
```

---

#### 2. Render Goals in Pitch Component
**File:** `packages/board/src/Pitch.tsx`

**IMPORTANT:** Goals must use `goalMouthWidth` derived from pitch dimensions, NOT `goalAreaWidth` (6-yard box).

**View Logic (2/1/0 goals):**
- **Full pitch:** Render 2 goals (both ends)
- **Half pitch:** Render 1 goal (defending end only)
- **Plain view:** Render 0 goals (showGoals ignored)

**Add constants (after existing dimension calculations):**
```tsx
// Goal mouth width (standard ~7.32m scaled to pitch)
const goalMouthWidth = shortDim * 0.12; // Approx 12% of pitch width for standard goal

// Half-pitch detection: REUSE existing pitch view signal from Pitch.tsx
// DO NOT invent new values - find existing 'half pitch' check already used for penalty areas
// Possible signals: settings.view === 'half' | 'halfPitch' | 'attackingHalf' 
// OR check how penalty areas detect half-pitch mode and reuse that logic
const isHalfPitch = /* TODO: Find existing half-pitch signal in Pitch.tsx */;
const shouldRenderLeftGoal = !isPlainView && lines.showGoals && (!isHalfPitch || isPortrait);
const shouldRenderRightGoal = !isPlainView && lines.showGoals && !isHalfPitch;
```

**Add goal rendering AFTER goal areas rendering (around line 200 for landscape, line 250 for portrait):**

```tsx
{/* === LANDSCAPE MODE: Goals at LEFT and RIGHT === */}
{!isPlainView && lines.showGoals && !isPortrait && (
  <>
    {/* LEFT goal (home) - BELT + SUSPENDERS: listening={false} on Group AND each Line */}
    <Group x={0} y={height / 2} listening={false}>
      {/* Goal frame - U shape */}
      <Line
        points={[
          -8, goalMouthWidth / 2,      // Bottom post
          -8, -goalMouthWidth / 2,     // Top post
          0, -goalMouthWidth / 2,       // Crossbar
          0, goalMouthWidth / 2,        // Go back down
        ]}
        stroke={lineColor}
        strokeWidth={3}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
      
      {/* Net depth suggestion - 2 diagonal lines */}
      <Line
        points={[-8, goalMouthWidth / 2, -18, goalMouthWidth / 2 - 8]}
        stroke={lineColor}
        strokeWidth={1}
        opacity={0.3}
        listening={false}
      />
      <Line
        points={[-8, -goalMouthWidth / 2, -18, -goalMouthWidth / 2 + 8]}
        stroke={lineColor}
        strokeWidth={1}
        opacity={0.3}
        listening={false}
      />
    </Group>
    
    {/* RIGHT goal (away) - BELT + SUSPENDERS: listening={false} on Group AND each Line */}
    <Group x={width} y={height / 2} listening={false}>
      {/* Goal frame - mirrored U shape */}
      <Line
        points={[
          8, goalMouthWidth / 2,
          8, -goalMouthWidth / 2,
          0, -goalMouthWidth / 2,
          0, goalMouthWidth / 2,
        ]}
        stroke={lineColor}
        strokeWidth={3}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
      
      {/* Net depth suggestion */}
      <Line
        points={[8, goalMouthWidth / 2, 18, goalMouthWidth / 2 - 8]}
        stroke={lineColor}
        strokeWidth={1}
        opacity={0.3}
        listening={false}
      />
      <Line
        points={[8, -goalMouthWidth / 2, 18, -goalMouthWidth / 2 + 8]}
        stroke={lineColor}
        strokeWidth={1}
        opacity={0.3}
        listening={false}
      />
    </Group>
  </>
)}

{/* === PORTRAIT MODE: Goals at TOP and BOTTOM === */}
{!isPlainView && lines.showGoals && isPortrait && (
  <>
    {/* TOP goal */}
    <Group x={width / 2} y={0}>
      <Line
        points={[
          -goalMouthWidth / 2, -8,
          goalMouthWidth / 2, -8,
          goalMouthWidth / 2, 0,
          -goalMouthWidth / 2, 0,
        ]}
        stroke={lineColor}
        strokeWidth={3}
        lineCap="round"
        lineJoin="round"
      />
      <Line points={[-goalMouthWidth / 2, -8, -goalMouthWidth / 2 + 8, -18]} stroke={lineColor} strokeWidth={1} opacity={0.3} />
      <Line points={[goalMouthWidth / 2, -8, goalMouthWidth / 2 - 8, -18]} stroke={lineColor} strokeWidth={1} opacity={0.3} />
    </Group>
    
    {/* BOTTOM goal - mirrored */}
    <Group x={width / 2} y={height}>
      <Line
        points={[
          -goalMouthWidth / 2, 8,
          goalMouthWidth / 2, 8,
          goalMouthWidth / 2, 0,
          -goalMouthWidth / 2, 0,
        ]}
        stroke={lineColor}
        strokeWidth={3}
        lineCap="round"
        lineJoin="round"
      />
      <Line points={[-goalMouthWidth / 2, 8, -goalMouthWidth / 2 + 8, 18]} stroke={lineColor} strokeWidth={1} opacity={0.3} />
      <Line points={[goalMouthWidth / 2, 8, goalMouthWidth / 2 - 8, 18]} stroke={lineColor} strokeWidth={1} opacity={0.3} />
    </Group>
  </>
)}
```

**Key design decisions:**
- **Posts + crossbar only** — U-shaped line with rounded corners
- **2 diagonal depth lines** — subtle suggestion of net depth
- **`opacity: 0.3`** — net lines barely visible (background element)
- **Non-interactive** — no event listeners, no selection
- **`listening={false}`** — Konva shapes must NOT capture pointer events
- **Scales with pitch** — inside pitch Group, inherits transformations

**CRITICAL:** All goal overlay shapes must have `listening={false}` prop to prevent capturing click events. Without this, clicking on goal may not select elements behind it.

---

### Definition of Done (Stage 2)

- [ ] Full pitch (landscape) shows goals at left and right ends
- [ ] Portrait pitch shows goals at top and bottom
- [ ] Goals are NOT selectable (clicking passes through to pitch)
- [ ] Goal overlay shapes have `listening={false}` so they never capture pointer events
- [ ] Click on goal post → selects element underneath (e.g., player standing in goal)
- [ ] Goals scale correctly with zoom in/out
- [ ] Goals respect `showGoals` setting
- [ ] Plain view (`view: 'plain'`) hides goals
- [ ] Goal posts are visible in all theme colors (grass, indoor, chalk, futsal)
- [ ] Existing documents load without errors (backwards compatible)
- [ ] `pnpm typecheck` passes
- [ ] No performance regression (Pitch render < 16ms on zoom)

**Visual Test Checklist:**
```
✓ Load full pitch → verify goals at both ends
✓ Switch to portrait (O key) → verify goals rotate correctly
✓ Switch to plain view (V key until 'plain') → verify goals hidden
✓ Zoom in/out → verify goals scale with pitch
✓ Switch pitch theme (Settings → Pitch → Theme) → verify goals visible
✓ Half-pitch view → verify only relevant goal shows
✓ Click on goal → verify click passes through (no selection)
```

---

## 🟡 STAGE 3: DRILLS & POLISH

**Objective:** Improve movable goal equipment + shoot arrow semantics  
**Risk:** LOW  
**Estimated Effort:** 3 hours  
**Priority:** MEDIUM - UX polish

### 3.1: Goal Equipment Visual Rework

**File:** `packages/board/src/EquipmentNode.tsx:24-43`

**Current:** Basic rectangles + 4 diagonal lines  
**Target:** Clearer frame + lightweight net grid

**Improved GoalShape:**
```tsx
const GoalShape: React.FC<{ color: string; scale: number; variant: string }> = ({ color, scale, variant }) => {
  const width = variant === 'mini' ? 40 : 70;
  const height = variant === 'mini' ? 25 : 45;
  const depth = 12 * scale;
  const netGridSize = 10;
  
  return (
    <Group>
      {/* Goal frame - clean U shape */}
      <Line
        points={[
          -width/2, height/2,
          -width/2, -height/2,
          width/2, -height/2,
          width/2, height/2,
        ]}
        stroke={color}
        strokeWidth={3 * scale}
        lineCap="round"
        lineJoin="round"
      />
      
      {/* Net grid - vertical lines */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Line
          key={`v${i}`}
          points={[
            -width/2 + (width / 5) * i, -height/2,
            -width/2 + (width / 5) * i - depth * 0.2, -height/2 + depth * 0.5,
          ]}
          stroke={color}
          strokeWidth={0.5}
          opacity={0.4}
        />
      ))}
      
      {/* Net grid - horizontal lines */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Line
          key={`h${i}`}
          points={[
            -width/2, -height/2 + (height / 3) * i,
            -width/2 - depth * 0.2, -height/2 + (height / 3) * i + depth * 0.15,
          ]}
          stroke={color}
          strokeWidth={0.5}
          opacity={0.3}
        />
      ))}
      
      {/* Back bar (depth suggestion) */}
      <Line
        points={[-width/2 - depth, -height/2 + depth, width/2 - depth, -height/2 + depth]}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.5}
      />
    </Group>
  );
};
```

**Changes:**
- Cleaner frame rendering
- Lightweight grid (6 vertical + 4 horizontal lines)
- Better depth illusion with back bar
- Still performant (< 20 shapes)

---

### 3.2: Shoot Arrow Visual Fix

**File:** `packages/board/src/ArrowNode.tsx:98-114`

**Current:** Double arrowhead (two `<Arrow>` components)  
**Target:** Double parallel lines + single arrowhead

**CRITICAL:** Main `<Arrow>` must render ONLY the arrowhead, NOT the shaft. The 2 parallel `<Line>` elements provide the double-line shaft.

**Fix:**
```tsx
{/* Shoot arrow - double line + single head */}
{arrow.arrowType === 'shoot' && (() => {
  const dx = endRelX - startRelX;
  const dy = endRelY - startRelY;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length < 10) return null;
  
  // Calculate perpendicular offset (3px each side)
  const perpX = -dy / length * 3;
  const perpY = dx / length * 3;
  
  return (
    <>
      {/* First parallel line (shaft) */}
      <Line
        points={[
          startRelX + perpX, startRelY + perpY,
          endRelX + perpX, endRelY + perpY
        ]}
        stroke={color}
        strokeWidth={strokeWidth}
        lineCap="round"
      />
      
      {/* Second parallel line (shaft) */}
      <Line
        points={[
          startRelX - perpX, startRelY - perpY,
          endRelX - perpX, endRelY - perpY
        ]}
        stroke={color}
        strokeWidth={strokeWidth}
        lineCap="round"
      />
      
      {/* Main Arrow renders ONLY arrowhead (no shaft) */}
      {/* Options: 
          A) Render main Arrow with pointerLength/pointerWidth only
          B) Render main Arrow with shaft opacity={0}, head visible
          C) Render custom arrowhead shape at endPoint
      */}
    </>
  );
})()}
```

**Recommended Implementation Strategy:**

**Strategy A (Custom Arrowhead Polygon) - RECOMMENDED:**
```tsx
{/* Shoot arrow - double parallel lines + custom arrowhead */}
{arrow.arrowType === 'shoot' && (() => {
  const dx = endRelX - startRelX;
  const dy = endRelY - startRelY;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length < 10) return null; // Fallback for short arrows
  
  // Perpendicular offset for double lines
  const perpX = -dy / length * 3;
  const perpY = dx / length * 3;
  
  // Arrowhead dimensions
  const headLength = 12;
  const headWidth = 8;
  
  return (
    <>
      {/* First parallel line */}
      <Line points={[...]} stroke={color} strokeWidth={strokeWidth} />
      
      {/* Second parallel line */}
      <Line points={[...]} stroke={color} strokeWidth={strokeWidth} />
      
      {/* Custom arrowhead (triangle polygon at endpoint) */}
      <Line
        points={[
          endRelX, endRelY,
          endRelX - headLength * (dx/length) + headWidth * (perpX/3), endRelY - headLength * (dy/length) + headWidth * (perpY/3),
          endRelX - headLength * (dx/length) - headWidth * (perpX/3), endRelY - headLength * (dy/length) - headWidth * (perpY/3),
          endRelX, endRelY,
        ]}
        fill={color}
        closed={true}
      />
    </>
  );
})()}
```

**Why Strategy A:**
- Zero `<Arrow>` component = zero risk of triple-line bug
- Full control over arrowhead size/shape
- Cleaner separation of concerns

**Alternative Strategies (if needed):**
- **Strategy B:** Arrow with `opacity={0}` shaft (harder to debug)
- **Strategy C:** Arrow head-only via minimal points (Konva API dependent)

**Fallback for Short Arrows:**
- If `length < headLength * 1.5`: render single center line + head (avoid malformed double lines on tiny arrows)

**Result:** `══════━►` (2 parallel lines + 1 arrowhead), NOT `───►──` (3 lines + head)

---

### Definition of Done (Stage 3)

**Goal Equipment:**
- [ ] Goal equipment has visible net grid pattern
- [ ] Mini goal renders smaller than standard goal
- [ ] Rotation via `[` / `]` keys still works correctly
- [ ] Color cycling via `Alt+Up/Down` still works
- [ ] Drag/drop/resize still work
- [ ] No performance regression

**Shoot Arrow:**
- [ ] Shoot arrow shows double parallel lines + single arrowhead
- [ ] Visual: `══════━►` (not `──►──►`)
- [ ] Short arrows (< 10px) don't render malformed
- [ ] Arrow rotation/drag still work
- [ ] Endpoint handles still work

**Test Checklist:**
```
✓ Press J → drag goal → verify clear frame + net
✓ Press Shift+J → verify mini goal is smaller
✓ Select goal → press [ several times → verify rotation
✓ Select goal → Alt+Up → verify color changes
✓ Press S (shoot arrow) → draw arrow → verify double line + single head
✓ Rotate shoot arrow → verify double line rotates correctly
```

---

## 🟢 STAGE 4: UX / PRODUCT (OPTIONAL)

**Objective:** Product enhancements and additional features  
**Risk:** MEDIUM  
**Estimated Effort:** 6+ hours  
**Priority:** LOW - Nice-to-have

### 4.1: Text Alignment Support

**Files:**
- `packages/core/src/types.ts` — add `align?: 'left' | 'center' | 'right'` to TextElement
- `packages/board/src/TextNode.tsx` — apply align prop to Konva Text
- `packages/ui/src/RightInspector.tsx` — add alignment buttons in Props tab
- `apps/web/src/store/slices/elementsSlice.ts` — updateTextProperties supports align

**DoD:**
- [ ] Text elements support left/center/right alignment
- [ ] Inspector shows alignment buttons when text selected
- [ ] Default alignment: left (backwards compatible)
- [ ] Multiline text respects alignment

---

### 4.2: Toolbar Tooltips

**File:** `packages/ui/src/Toolbar.tsx`

**Changes:**
- Add `title` attributes to all toolbar buttons
- Include keyboard shortcut in tooltip text
- Example: `title="Add Player (P)"`

**DoD:**
- [ ] Hovering toolbar buttons shows tooltip with keyboard shortcut
- [ ] Desktop only (no mobile tooltips)
- [ ] Tooltips don't interfere with clicks

---

### 4.3: Equipment Expansion

**New equipment types:**
- `rebounder` — Training rebound wall
- `marker_disc` — Ground marker (flat)
- `agility_ring` — Large agility ring
- `training_zone` — Marked training area

**Files to modify:**
- `packages/core/src/types.ts` — extend EquipmentType
- `packages/board/src/EquipmentNode.tsx` — add render functions
- `packages/core/src/board.ts` — add default colors
- `apps/web/src/hooks/useKeyboardShortcuts.ts` — add shortcuts (if keys available)

**DoD:**
- [ ] All new equipment types render correctly
- [ ] Keyboard shortcuts assigned (if available)
- [ ] Equipment can be rotated/resized
- [ ] Equipment shows in command palette

---

## Architecture Constraints (BINDING)

These rules apply to ALL stages:

1. ✅ **DO NOT refactor App.tsx** — already stable
2. ✅ **DO NOT introduce new Zustand slices** — use elementsSlice
3. ✅ **History commits only on effect boundaries** — preserve existing undo/redo
4. ✅ **No autosave during continuous interactions** — preserve existing debounce
5. ✅ **No new dependencies** — use existing Konva, React, Zustand
6. ✅ **Preserve keyboard-first UX** — all actions must have shortcuts
7. ✅ **No heavy modals** — inline editing only
8. ✅ **Performance first** — Pitch.tsx must render < 16ms

---

## Testing Strategy

### Unit Tests (Optional)
- `resizeSelected()` updates radius correctly
- `rotateSelected()` wraps 0-360°
- `clearAllDrawings()` only removes drawing elements

### Manual Tests (Required)
Each stage has explicit test checklist in DoD section above.

### Visual Regression
- Take screenshots before/after each stage
- Compare pitch rendering at different zoom levels
- Verify all themes (grass, indoor, chalk, futsal)

### Performance Tests
- Measure Pitch.tsx render time (Chrome DevTools Performance)
- Target: < 16ms per render
- Test with 50+ elements on board

---

## Rollout Plan

### Stage 1 (Hotfixes)
1. Create branch: `fix/stage1-hotfixes`
2. Implement all 5 fixes (B1, B2, U1, B4, B5)
3. Run `pnpm typecheck`
4. Manual test all DoD checkboxes
5. Create PR with screenshots
6. Merge to main

### Stage 2 (Pitch Goals)
1. Create branch: `feat/pitch-overlay-goals`
2. Add showGoals setting
3. Implement minimal goal rendering
4. Test on all pitch views/orientations
5. Performance test
6. Create PR
7. Merge to main

### Stage 3 (Drills & Polish)
1. Create branch: `feat/goal-equipment-rework`
2. Improve GoalShape
3. Fix shoot arrow rendering
4. Test rotation/scaling
5. Create PR
6. Merge to main

### Stage 4 (UX/Product)
1. Implement as separate PRs:
   - `feat/text-alignment`
   - `feat/toolbar-tooltips`
   - `feat/equipment-expansion`
2. Each PR independent and optional

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing documents | Test with old saves, ensure defaults work |
| Performance regression | Profile before/after, keep Pitch.tsx < 16ms |
| Undo/redo breaks | Test history after each operation |
| Autosave triggers incorrectly | Verify markDirty only on effect commands |
| Visual inconsistency across themes | Test all 5 pitch themes |
| Mobile/tablet rendering | Test responsive layouts |

---

## Success Metrics

### Stage 1
- **0 UX bugs** in reported issues list
- **100% rename success rate** after login
- **Visual resize confirmation** via screenshots

### Stage 2
- **100% pitch views** show goals
- **0 performance impact** (<1ms render time increase)
- **Positive user feedback** on "football-like" appearance

### Stage 3
- **Improved visual quality** rating from coaches
- **0 rotation/scale regressions**
- **Shoot arrow clarity** confirmed by users

### Stage 4
- **Text alignment usage** > 20% of text elements
- **Tooltip hover rate** measured via telemetry
- **Equipment expansion adoption** measured via usage stats

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-29 | Principal Engineer | Initial plan with corrected stages |
| 2.0 | 2026-01-29 | Principal Engineer | Added B5 PPM Resize Slider, fixed pitch goalMouthWidth dimensions, improved DoD with hit area testing, verified rename single source of truth |
| 2.1 | 2026-01-29 | Principal Engineer | Clarified B5 Mixed state strategy (absolute/deterministic), verified canvasContextMenu.ts path, explicit listening={false} requirement, shoot arrow triple-line prevention, radius-based percent formula |

---

## Appendix: Quick Reference

### Keyboard Shortcuts (Existing)
- `[` / `]` — Rotate equipment ±15°
- `{` / `}` — Rotate equipment ±90°
- `Option+Cmd +` — Resize +10%
- `Option+Cmd -` — Resize -10%
- `C` — Clear drawings
- `Shift+C` — Clear all elements (confirm)
- `J` — Add goal equipment
- `Shift+J` — Add mini goal
- `S` — Shoot arrow tool

### File Structure
```
packages/
  core/src/
    types.ts          — Core type definitions
    board.ts          — Element factories
  board/src/
    Pitch.tsx         — Pitch rendering
    PlayerNode.tsx    — Player rendering
    ArrowNode.tsx     — Arrow rendering
    EquipmentNode.tsx — Equipment rendering
  ui/src/
    RightInspector.tsx — Props panel

apps/web/src/
  store/slices/
    elementsSlice.ts  — Element CRUD
  hooks/
    useKeyboardShortcuts.ts — Keyboard handling
  app/board/
    BoardPage.tsx     — Main board page
```

---

**End of Document**
