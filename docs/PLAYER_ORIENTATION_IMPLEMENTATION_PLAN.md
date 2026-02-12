# Player Body Orientation + Arms — Implementation Plan

**Feature:** Player body orientation indicator + arms visualization (Pro)  
**Status:** Planning  
**Author:** Senior Frontend Architect  
**Date:** 2026-02-10

---

## Overview

This document provides a concrete, regression-safe implementation plan for adding player body orientation and arms to TMC Studio. The feature is designed for Pro users, with Free users able to view but not edit.

### Non-Negotiable Constraints

- ✅ Zero regressions on keyboard shortcuts, hitboxes, selection, drag, exports, animation
- ✅ Jersey number MUST remain upright (never rotated)
- ✅ No visual element may escape player bounds (diamond bug MUST be solved first)
- ✅ No performance degradation when feature is OFF
- ✅ Coach-first UX: <1 second to adjust orientation
- ✅ Default: orientation OFF, arms OFF
- ✅ Free users: VIEW only, upgrade CTA on edit attempt

---

## 1. Pre-Flight Fixes

### 1.1 Diamond Shape Bounds Bug (BLOCKING)

**Problem:**  
Diamond shape uses `Rect` with `rotation`, which can cause the visual to escape the player's selection circle bounds.

**Fix Location:**  
`packages/board/src/PlayerNode.tsx`

**Current Implementation (broken):**
```tsx
// Diamond using rotated Rect
<Rect
  width={size * 0.5}
  height={size * 0.5}
  rotation={45}
  offsetX={size * 0.25}
  offsetY={size * 0.25}
/>
```

**Required Fix:**
Replace rotated `Rect` with explicit `Line` path defining diamond vertices:

```tsx
// Diamond using Line (always bounded)
<Line
  points={[
    0, -radius * 0.5,        // top
    radius * 0.5, 0,         // right
    0, radius * 0.5,         // bottom
    -radius * 0.5, 0,        // left
  ]}
  closed
  fill={color}
  stroke={outline}
  strokeWidth={outlineWidth}
/>
```

**Why This Must Be Done First:**
- Establishes the discipline of bounds-safe rendering
- Proves the pattern for orientation wedge (which also must be bounded)
- Prevents introducing the same bug twice

**Validation Checklist:**
- [ ] Select diamond player at zoom 100%, 80%, 40%, 20%
- [ ] Verify diamond corners do NOT exceed selection ring at any zoom
- [ ] Export to PNG/PDF: diamond fully within player bounds
- [ ] Drag diamond player: no visual artifacts
- [ ] Animate diamond player: bounds maintained throughout

**PR Title:** `fix: diamond player shape bounds discipline`

---

## 2. Data & State Changes

### 2.1 Core Type Updates

**File:** `packages/core/src/types.ts`

**Changes:**
```typescript
export interface Player extends BoardElement {
  type: 'player';
  // ... existing fields ...
  
  // NEW: orientation in degrees (0 = top, 90 = right, 180 = bottom, 270 = left)
  orientation?: number;  // undefined = feature OFF for this player
}
```

**Rationale:**
- `orientation` is optional: `undefined` = feature OFF (saves bytes in JSON)
- Stored in degrees (0-359) for simplicity
- 0° = top (north) aligns with coach mental model

### 2.2 Global Feature Toggles

**File:** `apps/web/src/store/slices/documentSlice.ts`

**Changes:**
```typescript
export interface DocumentSettings {
  // ... existing fields ...
  
  // NEW: Pro feature flags (persisted in document)
  playerOrientation?: {
    enabled: boolean;        // Master toggle for whole document
    showArms: boolean;      // V1: cosmetic arms (listening=false)
    zoomThreshold: number;  // Min zoom % to show orientation (default 40)
  };
}
```

**Default Values:**
```typescript
const defaultSettings: DocumentSettings = {
  // ...
  playerOrientation: {
    enabled: false,
    showArms: false,
    zoomThreshold: 40,
  },
};
```

**Persistence:**
- Stored in `document.settings.playerOrientation`
- Saved to Supabase `projects.document` JSON column
- Backward compatible: old documents get defaults on load

### 2.3 Backward Compatibility

**Migration Strategy:**
- Old documents: `player.orientation` is `undefined` → feature OFF
- Old documents: `documentSlice` adds missing `playerOrientation` on load
- No schema migration needed (JSON is flexible)
- Export formats (PNG/PDF): orientation renders IF present, ignored otherwise

---

## 3. Interaction & Input

### 3.1 Keyboard & Mouse Shortcuts

**Conflict Avoidance:**
- Equipment rotation uses `[` and `]` (unmodified)
- Player orientation uses **Alt modifier** to avoid conflict

**New Shortcuts:**

| Action | Shortcut | Behavior |
|--------|----------|----------|
| Rotate player CW | `Alt + ]` | Rotate +15° (snap to 15° increments) |
| Rotate player CCW | `Alt + [` | Rotate -15° |
| Fine rotate CW | `Alt + Shift + ]` | Rotate +5° (fine control) |
| Fine rotate CCW | `Alt + Shift + [` | Rotate -5° |
| Reset orientation | `Alt + 0` | Reset to 0° (north) |
| Alt + scroll | `Alt + wheel` | Rotate continuously (±15° per scroll tick) |
| Alt + drag | `Alt + drag player` | Rotate via drag offset angle (future) |

**Implementation Location:**  
`apps/web/src/hooks/useKeyboardShortcuts.ts`

**Entitlement Check:**
```typescript
// On Alt+] press
const selectedPlayers = getSelectedElements().filter(e => e.type === 'player');
if (selectedPlayers.length === 0) return;

// Check Pro entitlement
if (!isPro) {
  showToast('Player orientation is a Pro feature. Upgrade to edit.');
  showPricingModal({ source: 'player-orientation-blocked' });
  return;
}

// Proceed with rotation
cmd.rotatePlayerOrientation({
  playerIds: selectedPlayers.map(p => p.id),
  delta: 15,
});
```

### 3.2 Multi-Select Behavior

**Rule:** All selected players rotate by the same delta.

```typescript
// Example: Alt+] with 3 players selected
// Player A: 30° → 45°
// Player B: 0° → 15°
// Player C: undefined → 15° (feature auto-enabled on first rotate)
```

### 3.3 Undo/Redo Rules

**History Commit Rule:**
- Single `Alt+]` press = **ONE history commit** (instant)
- Continuous scroll: debounced commit every 300ms (similar to resize)
- Multi-select: single commit for all players

**Command Split:**
- **Intent:** `cmd.rotatePlayerOrientationIntent()` (no history)
- **Effect:** `cmd.rotatePlayerOrientationEffect()` (commits to history)

**File:** `apps/web/src/commands/effect/historyOrientationCommit.ts` (new)

---

## 4. Rendering Strategy

### 4.1 PlayerNode Internal Layering

**File:** `packages/board/src/PlayerNode.tsx`

**Z-Order (bottom to top):**
```tsx
<Group>
  {/* 1. Base shape (circle/square/diamond) */}
  <BaseShape />
  
  {/* 2. Orientation wedge (IF zoom >= threshold && orientation !== undefined) */}
  {shouldShowOrientation && <OrientationWedge rotation={orientation} />}
  
  {/* 3. Arms (IF zoom >= 80% && showArms && orientation !== undefined) */}
  {shouldShowArms && <PlayerArms rotation={orientation} />}
  
  {/* 4. Jersey number (NEVER rotated, always upright) */}
  <Text
    text={jerseyNumber}
    rotation={0}  // CRITICAL: always 0, never inherits parent rotation
    // ...
  />
  
  {/* 5. Equipment (rotates independently via [ and ]) */}
  {equipment && <EquipmentOverlay rotation={equipment.rotation} />}
</Group>
```

### 4.2 Orientation Wedge Specification

**Visual:** Small triangle "notch" pointing in orientation direction.

**Bounds-Safe Implementation:**
```tsx
function OrientationWedge({ rotation, color, radius }: Props) {
  // Wedge size: 20% of player radius, INSIDE the circle
  const wedgeDepth = radius * 0.2;
  const wedgeWidth = radius * 0.3;
  
  return (
    <Line
      points={[
        0, -radius,                    // tip at edge
        -wedgeWidth / 2, -radius + wedgeDepth,  // left base
        wedgeWidth / 2, -radius + wedgeDepth,   // right base
      ]}
      closed
      fill={color}
      opacity={0.8}
      rotation={rotation}
      listening={false}  // Cosmetic only, no hit testing
    />
  );
}
```

**Validation:**
- Wedge MUST fit inside player circle at all zoom levels
- No part of wedge extends beyond selection ring

### 4.3 Arms Specification (V1)

**Constraints:**
- Arms are **cosmetic only** (`listening={false}`)
- Arms do NOT extend outside selection ring
- Arms use simple "V" shape

**Implementation:**
```tsx
function PlayerArms({ rotation, color, radius }: Props) {
  const armLength = radius * 0.4;  // 40% of radius, stays inside
  const armAngle = 35;  // degrees from center
  
  return (
    <Group rotation={rotation} listening={false}>
      {/* Left arm */}
      <Line
        points={[0, 0, -Math.sin(armAngle * Math.PI / 180) * armLength, -Math.cos(armAngle * Math.PI / 180) * armLength]}
        stroke={color}
        strokeWidth={2}
        lineCap="round"
      />
      {/* Right arm */}
      <Line
        points={[0, 0, Math.sin(armAngle * Math.PI / 180) * armLength, -Math.cos(armAngle * Math.PI / 180) * armLength]}
        stroke={color}
        strokeWidth={2}
        lineCap="round"
      />
    </Group>
  );
}
```

### 4.4 Counter-Rotating Jersey Number

**Critical Rule:** Jersey number NEVER rotates with player orientation.

**Implementation Strategy:**
```tsx
// Option A: Always rotation={0}
<Text
  text={jerseyNumber}
  rotation={0}
  // ...
/>

// Option B: Counter-rotate if parent Group is rotated
// (Only needed if we mistakenly add rotation to parent Group)
<Text
  text={jerseyNumber}
  rotation={-parentRotation}  // Cancel parent rotation
  // ...
/>
```

**Recommendation:** Use Option A. Never apply rotation to parent `<Group>`. Apply rotation only to individual sub-elements (wedge, arms).

### 4.5 Zoom-Adaptive Rendering

**Rules:**
- Zoom > 80%: show wedge + arms (if enabled)
- Zoom 40-80%: show wedge only
- Zoom < 40%: hide all orientation visuals

**Implementation:**
```tsx
// In PlayerNode
const zoom = useZoom(); // from context or props

const shouldShowWedge = 
  orientation !== undefined && 
  zoom >= (settings.playerOrientation?.zoomThreshold ?? 40);

const shouldShowArms = 
  shouldShowWedge && 
  settings.playerOrientation?.showArms === true &&
  zoom >= 80;
```

---

## 5. Feature Gating (PLG)

### 5.1 View vs. Edit Permissions

**Free Users:**
- ✅ CAN view orientation on documents shared by Pro users
- ❌ CANNOT enable orientation toggle
- ❌ CANNOT rotate players
- ❌ CANNOT enable arms toggle

**Pro Users:**
- ✅ Full access to all orientation features

### 5.2 Entitlement Check Locations

**File:** `apps/web/src/hooks/useKeyboardShortcuts.ts`

```typescript
// Alt+] pressed
const isPro = useAuthStore(state => state.subscription?.tier === 'pro');

if (!isPro) {
  showToast('Player orientation is a Pro feature. Upgrade to unlock.');
  showPricingModal({ source: 'keyboard-orientation-blocked' });
  return;
}
```

**File:** `packages/ui/src/RightInspector.tsx` (orientation toggle)

```tsx
<Toggle
  label="Show Orientation"
  checked={settings.playerOrientation?.enabled}
  onChange={(checked) => {
    if (!isPro) {
      showToast('Player orientation is a Pro feature.');
      showPricingModal({ source: 'inspector-orientation-blocked' });
      return;
    }
    cmd.updateDocumentSettings({ playerOrientation: { enabled: checked } });
  }}
  disabled={!isPro}
  tooltip={!isPro ? 'Pro feature' : undefined}
/>
```

### 5.3 UX Messages & Pricing Entry Points

**Toast Messages:**
- `"Player orientation is a Pro feature. Upgrade to unlock."`
- Action: Auto-open PricingModal after 800ms

**Pricing Modal Context:**
```typescript
showPricingModal({ 
  source: 'player-orientation-blocked',
  highlightFeature: 'orientation' 
});
```

**Analytics Events:**
```typescript
trackEvent('feature_blocked', {
  feature: 'player-orientation',
  trigger: 'keyboard-shortcut' | 'inspector-toggle' | 'context-menu',
  timestamp: Date.now(),
});
```

---

## 6. Performance Guards

### 6.1 Zero Overhead When Feature OFF

**Rule:** If `orientation === undefined`, render NOTHING extra.

**Implementation:**
```tsx
// In PlayerNode.tsx
function PlayerNode({ player, ... }: Props) {
  // Early return for orientation rendering
  const shouldRenderOrientation = 
    player.orientation !== undefined && 
    settings.playerOrientation?.enabled === true &&
    zoom >= zoomThreshold;
  
  if (!shouldRenderOrientation) {
    // Render classic player (no wedge, no arms)
    return <ClassicPlayerRender />;
  }
  
  // Render player with orientation
  return (
    <>
      <ClassicPlayerRender />
      <OrientationWedge />
      {shouldShowArms && <PlayerArms />}
    </>
  );
}
```

### 6.2 Conditional Rendering Guards

**What is conditionally rendered:**
- `<OrientationWedge />` (only if `orientation !== undefined` && zoom >= threshold)
- `<PlayerArms />` (only if wedge shown && `showArms === true` && zoom >= 80%)

**What is ALWAYS rendered:**
- Base player shape
- Jersey number
- Equipment overlay

### 6.3 Memoization Strategy

**Updated Comparator:**

```typescript
// PlayerNode.tsx
export const PlayerNode = React.memo(
  PlayerNodeComponent,
  (prev, next) => {
    return (
      prev.player.id === next.player.id &&
      prev.player.x === next.player.x &&
      prev.player.y === next.player.y &&
      prev.player.color === next.player.color &&
      prev.player.jerseyNumber === next.player.jerseyNumber &&
      prev.player.shape === next.player.shape &&
      prev.player.orientation === next.player.orientation &&  // NEW
      prev.isSelected === next.isSelected &&
      prev.zoom === next.zoom
    );
  }
);
```

**Rationale:**
- Only re-render when `orientation` changes
- Drag performance unaffected (x/y changes trigger re-render anyway)
- Zoom changes trigger re-render (needed for adaptive rendering)

---

## 7. PR Breakdown

### PR0: Diamond Bounds Fix (BLOCKING)

**Scope:**
- Fix diamond shape using `Line` instead of rotated `Rect`
- Validate bounds at all zoom levels
- Export regression test (PNG/PDF)

**Files Changed:**
- `packages/board/src/PlayerNode.tsx` (diamond rendering logic)

**Manual Test Checklist:**
- [ ] Select diamond at zoom 100%, 80%, 40%, 20%
- [ ] Diamond corners inside selection ring at all zooms
- [ ] Export PNG: diamond bounded
- [ ] Export PDF: diamond bounded
- [ ] Drag diamond: no artifacts
- [ ] Animate diamond: bounds maintained

**Regression Risks:** Low (isolated to diamond shape)

**Merge Criteria:**
- All manual tests pass
- No existing player shapes regress
- Code reviewed + approved

---

### PR1: Core Data Types + Default State

**Scope:**
- Add `orientation?: number` to `Player` interface
- Add `playerOrientation` to `DocumentSettings`
- Default values (all OFF)
- Backward compatibility (no schema migration)

**Files Changed:**
- `packages/core/src/types.ts`
- `apps/web/src/store/slices/documentSlice.ts`

**Manual Test Checklist:**
- [ ] TypeScript compiles
- [ ] New document: `playerOrientation.enabled === false`
- [ ] Old document loaded: defaults applied
- [ ] Save/load cycle: settings persisted

**Regression Risks:** Low (data-only changes, no UI)

**Merge Criteria:**
- Type safety maintained
- No build errors
- Old documents load correctly

---

### PR2: Orientation Wedge Rendering (View-Only)

**Scope:**
- Render `<OrientationWedge />` in `PlayerNode` (bounds-safe)
- Zoom-adaptive rendering (threshold check)
- Wedge only shown if `orientation !== undefined`
- NO interaction yet (wedge is read-only)

**Files Changed:**
- `packages/board/src/PlayerNode.tsx`

**Manual Test Checklist:**
- [ ] Manually set `player.orientation = 45` in console → wedge renders
- [ ] Wedge rotates correctly (0° = north, 90° = east, etc.)
- [ ] Wedge inside player bounds at all zoom levels
- [ ] Zoom < 40%: wedge hidden
- [ ] Zoom >= 40%: wedge visible
- [ ] Jersey number NEVER rotated (always upright)
- [ ] Export PNG/PDF: wedge renders correctly

**Regression Risks:** Medium (modifies PlayerNode rendering)

**Merge Criteria:**
- All manual tests pass
- Wedge bounds validated
- Jersey number upright in all cases
- Performance: no frame drops when dragging players

---

### PR3: Keyboard Shortcuts + Commands (Pro-Gated)

**Scope:**
- Add `Alt + ]`, `Alt + [`, `Alt + 0` shortcuts
- Add `Alt + scroll` for continuous rotation
- Create `cmd.rotatePlayerOrientationIntent()` (intent)
- Create `cmd.rotatePlayerOrientationEffect()` (effect, history commit)
- Entitlement check: block Free users, show toast + pricing modal

**Files Changed:**
- `apps/web/src/hooks/useKeyboardShortcuts.ts`
- `apps/web/src/commands/intent/rotatePlayerOrientation.ts` (new)
- `apps/web/src/commands/effect/historyOrientationCommit.ts` (new)

**Manual Test Checklist:**
- [ ] Select player, press `Alt + ]`: rotates +15° (Pro only)
- [ ] Free user presses `Alt + ]`: toast + pricing modal shown
- [ ] Multi-select 3 players, press `Alt + ]`: all rotate +15°
- [ ] `Alt + 0`: resets orientation to 0°
- [ ] Undo: orientation reverts
- [ ] Redo: orientation re-applied
- [ ] Equipment rotation `]` still works (no conflict)

**Regression Risks:** Medium (new shortcuts, potential conflicts)

**Merge Criteria:**
- All shortcuts work as specified
- No conflict with equipment rotation
- Entitlement gating functional
- Undo/redo works correctly

---

### PR4: Inspector UI + Document Toggles

**Scope:**
- Add "Player Orientation" section to RightInspector
- Toggle: "Show Orientation" (Pro-gated)
- Toggle: "Show Arms" (Pro-gated, disabled if orientation OFF)
- Zoom threshold slider (40-100%, default 40%)

**Files Changed:**
- `packages/ui/src/RightInspector.tsx`
- `apps/web/src/commands/updateDocumentSettings.ts`

**Manual Test Checklist:**
- [ ] Toggle "Show Orientation": players show/hide wedge
- [ ] Free user clicks toggle: toast + pricing modal
- [ ] Pro user enables: wedge appears on players with `orientation !== undefined`
- [ ] Zoom threshold slider: wedge visibility updates at threshold
- [ ] "Show Arms" toggle disabled when orientation OFF

**Regression Risks:** Low (UI-only, no core logic changes)

**Merge Criteria:**
- Toggles work as specified
- Entitlement gating functional
- Pro users can enable/disable smoothly

---

### PR5: Arms Rendering (V1 Cosmetic)

**Scope:**
- Render `<PlayerArms />` (simple V shape)
- Only render if zoom >= 80% && `showArms === true`
- Arms inside player bounds (validation)
- Arms are `listening={false}` (cosmetic only)

**Files Changed:**
- `packages/board/src/PlayerNode.tsx`

**Manual Test Checklist:**
- [ ] Enable "Show Arms" → arms render on oriented players
- [ ] Arms inside selection ring at zoom 80%, 100%
- [ ] Zoom < 80%: arms hidden
- [ ] Arms rotate with orientation
- [ ] Clicking arms does NOT select player (listening=false correct)
- [ ] Export PNG/PDF: arms render correctly

**Regression Risks:** Low (isolated to arms rendering)

**Merge Criteria:**
- Arms render correctly
- Arms inside bounds
- No hit-testing interference

---

### PR6: Context Menu + Quick Actions

**Scope:**
- Add "Reset Orientation" to player context menu (Pro-gated)
- Add orientation preset buttons (0°, 90°, 180°, 270°)
- Show current orientation value in inspector

**Files Changed:**
- `apps/web/src/utils/canvasContextMenu.ts`
- `packages/ui/src/RightInspector.tsx`

**Manual Test Checklist:**
- [ ] Right-click player → "Reset Orientation" appears (Pro only)
- [ ] Free user clicks: toast + pricing modal
- [ ] Pro user clicks: orientation resets to 0°
- [ ] Preset buttons (0°/90°/180°/270°): set orientation instantly
- [ ] Current orientation value displayed in inspector

**Regression Risks:** Low (UI enhancements)

**Merge Criteria:**
- Context menu functional
- Presets work correctly
- Entitlement gating functional

---

## 8. Final Acceptance Checklist

### 8.1 Functionality

- [ ] Players can be rotated via `Alt + ]` and `Alt + [` (Pro only)
- [ ] Orientation wedge renders inside player bounds at all zoom levels
- [ ] Arms render inside player bounds when enabled (zoom >= 80%)
- [ ] Jersey number NEVER rotates (always upright)
- [ ] Multi-select rotation works (all players rotate by same delta)
- [ ] Undo/redo works correctly for orientation changes
- [ ] `Alt + 0` resets orientation to 0°
- [ ] Free users can VIEW orientation but cannot EDIT
- [ ] Free users see toast + pricing modal on edit attempt

### 8.2 Performance

- [ ] Zero overhead when feature OFF (`orientation === undefined`)
- [ ] No frame drops when dragging oriented players
- [ ] Zoom-adaptive rendering works (wedge/arms show/hide at thresholds)
- [ ] PlayerNode memoization prevents unnecessary re-renders

### 8.3 Exports

- [ ] PNG export: orientation wedge + arms render correctly
- [ ] PDF export: orientation wedge + arms render correctly
- [ ] Shared documents: Free users see orientation (read-only)

### 8.4 Regression Testing

- [ ] Equipment rotation (`[` and `]`) still works (no conflict)
- [ ] Player selection still works (hitbox unchanged)
- [ ] Player drag still works (no interference)
- [ ] Animation playback works with oriented players
- [ ] Diamond shape stays inside bounds (pre-flight fix validated)
- [ ] All existing keyboard shortcuts functional

### 8.5 Entitlements

- [ ] Free users blocked from enabling orientation toggle
- [ ] Free users blocked from keyboard shortcuts (`Alt + ]`, etc.)
- [ ] Toast message shows on block
- [ ] Pricing modal opens on block (correct source tracking)
- [ ] Pro users have full access

### 8.6 Documentation

- [ ] Keyboard shortcuts documented in CheatSheet
- [ ] Feature added to CHANGELOG.md
- [ ] Migration guide for old documents (if needed)
- [ ] Analytics events tracked correctly

---

## 9. Known Risks & Mitigations

### Risk 1: Jersey Number Rotation

**Risk:** If rotation is applied to parent `<Group>`, jersey number will rotate.

**Mitigation:**
- NEVER apply rotation to parent PlayerNode `<Group>`
- Apply rotation only to wedge and arms via their own `rotation` prop
- Validate in every PR that jersey number is upright

**Validation:**
```tsx
// Test: rotate player to 90°, check number is upright
expect(jerseyNumberElement.rotation).toBe(0);
```

### Risk 2: Bounds Escape

**Risk:** Wedge or arms extend outside player selection ring.

**Mitigation:**
- Use explicit math for wedge/arms sizing (% of radius)
- Validate at zoom 100%, 80%, 40%
- Export test (PNG/PDF) to catch bounds issues

**Validation:**
- Visual inspection at multiple zoom levels
- Export regression tests

### Risk 3: Keyboard Shortcut Conflict

**Risk:** `Alt + ]` conflicts with equipment rotation `]`.

**Mitigation:**
- Use Alt modifier for player orientation
- Equipment rotation remains unmodified `]` and `[`
- Test both shortcuts together

**Validation:**
- Select player with equipment
- Press `]`: equipment rotates
- Press `Alt + ]`: player orientation rotates
- No interference

### Risk 4: Performance Degradation

**Risk:** Extra rendering for wedge/arms slows down drag.

**Mitigation:**
- Conditional rendering (early return if feature OFF)
- Memoization with `orientation` in comparator
- Zoom thresholds reduce render load at low zoom

**Validation:**
- Drag 20 oriented players: no frame drops
- Compare FPS with feature ON vs OFF

---

## 10. Future Enhancements (Out of Scope for V1)

- [ ] Mouse drag to rotate (Alt + drag player) — V2
- [ ] Animation keyframes for orientation changes — V2
- [ ] Arms with different poses (pointing, raised, etc.) — V3
- [ ] Orientation field in player import/export CSV — V2
- [ ] Bulk orientation preset (e.g., "all players face center") — V3

---

## Conclusion

This plan provides a concrete, step-by-step implementation path for Player Body Orientation + Arms. By following the PR breakdown and adhering to the non-negotiable constraints, we ensure a regression-safe rollout that delivers coach-first UX while maintaining TMC Studio's keyboard-first design philosophy.

**Next Steps:**
1. Review and approve this plan
2. Execute PR0 (diamond bounds fix)
3. Proceed sequentially through PR1-PR6
4. Run final acceptance checklist before merge to main

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-10  
**Status:** Ready for Review
