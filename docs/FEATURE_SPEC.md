# TMC Studio — Feature Specification

> **Single source of truth for all application behavior**
> 
> This document describes every user-facing interaction, default value, keyboard shortcut, and behavioral rule in TMC Studio. It serves as the canonical reference for product features, tutorials, marketing, and development.

## Meta

- **Version:** 0.3.1
- **Last Updated:** 2026-02-21
- **Status:** Living document — updated with every feature change

## Documentation Integrity Rules

1. **Single Source of Truth for Defaults**
   - All default values MUST match source code constants
   - Check: types.ts, board.ts, colors.ts, PlayerNode.tsx
   
2. **Consistency Between Sections**
   - Detailed section defaults MUST match Appendix A
   - Tables MUST match code blocks in same section
   
3. **Unknown/Unverified Values**
   - If source truth is unclear, mark as [NEEDS VERIFICATION]
   - Point to likely source file for future verification
   
4. **Update Process**
   - When code default changes, update ALL occurrences:
     - Detailed section
     - Appendix A
     - Any tables showing the value

---

## Table of Contents

1. [Board Elements](#1-board-elements)
2. [Selection & Interaction](#2-selection--interaction)
3. [Canvas & Viewport](#3-canvas--viewport)
4. [Pitch Configuration](#4-pitch-configuration)
5. [Teams & Colors](#5-teams--colors)
6. [Formations](#6-formations)
7. [Steps & Animation](#7-steps--animation)
8. [History (Undo/Redo)](#8-history-undoredo)
9. [Inspector Panel](#9-inspector-panel)
10. [Keyboard Shortcuts Reference](#10-keyboard-shortcuts-reference)
11. [Z-Order & Rendering](#11-z-order--rendering)
12. [Export](#12-export)
13. [Save & Persistence](#13-save--persistence)
14. [Appendices](#appendices)

---

## 1. Board Elements

### 1.1 Players

#### 1.1.1 Creation & Placement

| Trigger | Behavior |
|---------|----------|
| `P` | Add home team player at cursor position |
| `Shift+P` | Add away team player at cursor position |
| Context Menu → Add Home/Away Player | Add player at menu location |
| Formations (keys `1-6`) | Replace all home team players with formation |
| Formations (`Shift+1-6`) | Replace all away team players with formation |

**Initial position:** Center of cursor / menu click location

#### 1.1.2 Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier |
| `position` | {x, y} | Canvas coordinates (pixels) |
| `team` | 'home' \| 'away' | Team assignment |
| `number` | number \| undefined | Jersey number (1-99, or undefined for no number) |
| `label` | string \| undefined | Optional text label below player |
| `showLabel` | boolean | Whether to display label (default: false) |
| `shape` | string | Visual shape (see §1.1.3) |
| `color` | string | Override team color (hex, e.g., #ff0000) |
| `radius` | number | Size of player circle (pixels, default: 18) |
| `fontSize` | number | Number font size (default: 14) |
| `textColor` | string | Number text color (default: #ffffff) |
| `opacity` | number | Transparency (0-1, default: 1.0) |
| `isGoalkeeper` | boolean | Goalkeeper flag (uses goalkeeperColor, default: false) |
| `orientation` | number \| undefined | Facing direction in degrees (0 = north, default: 0) |
| `showVision` | boolean \| undefined | Per-player vision override (undefined = inherit global) |

#### 1.1.3 Shapes

Available shapes (cycle with `Shift+S` when player selected):

| Shape | Visual | Description |
|-------|--------|-------------|
| `circle` | ● | Default circular player |
| `square` | ■ | Square player marker |
| `triangle` | ▲ | Triangular player marker |
| `diamond` | ◆ | Diamond player marker |

**Shape cycling order:** circle → square → triangle → diamond → circle

#### 1.1.4 Goalkeeper Mode

- Set via `isGoalkeeper` property or Inspector Props panel
- Goalkeeper players use team's `goalkeeperColor` instead of primary color
- Default GK color: `#fbbf24` (yellow/gold)
- Goalkeeper flag overrides number-based detection

#### 1.1.5 Number Editing

**Triggers:**
- Double-click player
- Select player + press `Enter`
- Context Menu → "Change Number"

**Inline overlay editor:**
- Positioned above player
- Input range: 1-99
- Empty input → removes number (sets to `undefined`)
- Invalid input → cancels edit, keeps original value
- `Enter` → saves, `Escape` → cancels

#### 1.1.6 Resize

**Methods:**
| Trigger | Behavior |
|---------|----------|
| `Cmd+Alt+=` | Increase radius by 10% |
| `Cmd+Alt+-` (minus) | Decrease radius by 10% |
| Context Menu → Resize | Opens radius slider popover (8-40px range) |

**Preview mode:** Slider shows live preview, commits on blur/Enter

#### 1.1.7 Interactions

| Trigger | Behavior |
|---------|----------|
| Click | Select player (deselect others) |
| `Shift/Cmd+Click` | Add to multi-selection |
| Drag | Move player (multi-drag if multiple selected) |
| Arrow keys | Nudge ±5px (Shift = ±1px) |
| `Shift+S` | Cycle shape |
| `Alt+↑/↓` | Cycle fill color through shared palette |
| `Delete` / `Backspace` | Delete selected |
| `Cmd+C` / `Cmd+V` | Copy / Paste (offset +12px) |
| `Cmd+D` | Duplicate (offset +12px) |

For orientation/vision interactions → see §1.2

#### 1.1.8 Default Values

```
shape: 'circle'
radius: 18
number: auto-incremented (1-99 per team)
orientation: 0 (north)
showVision: undefined (inherits global setting)
fontSize: 14
textColor: '#ffffff'
opacity: 1.0
isGoalkeeper: false
showLabel: false
```

### 1.2 Orientation & Vision

#### 1.2.1 Master Orientation Toggle

Located in Inspector → Props panel (when player selected) → Orientation Settings

**Document-level settings:**
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | false | Master orientation feature toggle |
| `showArms` | boolean | false | Global arms visibility |
| `showVision` | boolean | false | Global vision cone visibility |
| `zoomThreshold` | number | 40 | Minimum zoom % for arms/number rotation (%) |

**When orientation is disabled (enabled: false):**
- No arms rendering
- No number rotation
- No vision cones
- ALT+drag rotation still works (but visual features hidden)

#### 1.2.2 Rotation Methods

| Trigger | Snap Angle | Behavior |
|---------|------------|----------|
| `[` | 15° | Rotate counter-clockwise |
| `]` | 15° | Rotate clockwise |
| `Shift+[` | 5° | Rotate counter-clockwise (fine) |
| `Shift+]` | 5° | Rotate clockwise (fine) |
| `Alt+0` | — | Reset orientation to 0° (north) |
| `ALT+drag` | 5° | Interactive rotation (drag on player body or vision cone) |
| `Shift+ALT+drag` | 1° | Interactive rotation (fine control) |
| `ALT+scroll wheel` | 15° | Rotate with mouse wheel (debounced history 300ms) |

**All rotations:**
- Apply to selected players
- Multi-selection: all selected players rotate by same delta
- Wrap at 360° (e.g., 370° becomes 10°)
- Preview during drag, commit to history on mouseUp

**Interactive rotation (ALT+drag):**
- Click on player body OR vision cone area
- Hold ALT, drag mouse to rotate
- Cursor shows rotation angle live
- Snaps to 5° increments (1° with Shift held)
- Single history entry on mouseUp

#### 1.2.3 Vision Cone

**Global toggle:** Inspector → Props → Orientation Settings → Show Vision

**Per-player override:**
| Property Value | Rendering |
|----------------|-----------|
| `undefined` | Inherit global `showVision` setting |
| `true` | Force vision ON (even if global OFF) |
| `false` | Force vision OFF (even if global ON) |

**Keyboard shortcuts:**
| Key | Behavior |
|-----|----------|
| `V` | Toggle vision for selected player(s) (cycles: undefined → true → false) |
| `Shift+V` | Deterministic toggle for ALL players (if any OFF → all ON, if all ON → all OFF) |

**Vision cone rendering:**
- **Shape:** 60° wedge (30° each side of orientation)
- **Radius:** player radius × 6
- **Fill:** player color at 28% opacity
- **Stroke:** same color as fill, 1px
- **Z-order:** Rendered below player body (see §11)
- **Zoom gating:** NOT gated (always visible when enabled)
- **Hit area:** Vision cone IS part of click/drag hit area (for ALT+drag rotation)

**Vision calculation:**
- Center point: player position
- Start angle: orientation - 30°
- End angle: orientation + 30°
- Arc direction: follows orientation vector

#### 1.2.4 Arms Rendering

**Requirements:**
1. Master orientation toggle (`enabled: true`)
2. Global `showArms: true`
3. Zoom level ≥ `zoomThreshold` (default 40%)

**Visual style:**
- **Core stroke:** rgba(0, 0, 0, 0.70), 6px width
- **Highlight stroke:** rgba(255, 255, 255, 0.18), 3px width
- **Shoulder positions:**
  - Forward shoulder: radius × 0.22 from center
  - Side offset: radius × 0.52
- **Arm length:** radius × 0.30
- **Angle:** Extends from shoulders in orientation direction
- **listening:** false (no hit area - arms are visual only)

**Z-order:** Rendered ABOVE body, BELOW number (see §11)

#### 1.2.5 Number Rotation & Flip Logic

**Requirements:**
1. Master orientation toggle (`enabled: true`)
2. Zoom level ≥ `zoomThreshold`
3. Player has a number

**Rotation rule:**
- Number rotates to match `orientation` angle
- **180° flip zone:** When orientation is between 90° and 270° (facing downward), number rotates an additional 180° for readability
- Example: orientation 180° (south) → number rotated 180° + 180° = 0° (upright)

**When zoom < threshold:**
- Number renders at 0° (upright, no rotation)

#### 1.2.6 Zoom Threshold Gating

Features gated by zoom threshold (default 40%):

| Feature | Gated | Notes |
|---------|-----|-------|
| Arms | ✅ Yes | Hidden below threshold |
| Number rotation | ✅ Yes | Number stays upright below threshold |
| Vision cone | ❌ No | Always visible when enabled |
| ALT+drag rotation | ❌ No | Always works |

**Threshold configuration:** Inspector → Props → Orientation Settings → Zoom Threshold slider (0-100%)

#### 1.2.7 Orientation Transform on Pitch Rotation

When pitch orientation changes (landscape ↔ portrait, via `O` key):

**Rotation deltas:**
- Landscape → Portrait: -90° (CCW)
- Portrait → Landscape: +90° (CW)

**All players transformed:**
- Position coordinates rotated 90°
- Orientation angle adjusted by rotation delta
- Applied to ALL players across ALL steps
- Single history commit for entire operation

**Example:**
- Player with orientation 0° (north) in landscape
- After switch to portrait: orientation becomes 270° (still facing "north" relative to rotated pitch)

#### 1.2.8 Z-Order (Player Internal Rendering)

Bottom to top:

→ see §11 for full Z-order specification

### 1.3 Ball

#### Creation & Properties

| Trigger | Behavior |
|---------|----------|
| `B` | Add ball at cursor position |
| Context Menu → Add Ball | Add ball at menu location |

**Properties:**
- `position`: {x, y} canvas coordinates
- `radius`: fixed at 8px
- Visual: Orange circle (#ff8c42) with black stroke

**Interactions:** Standard (select, drag, nudge, copy, delete) — no special behaviors

---

### 1.4 Arrows

#### 1.4.1 Arrow Types

| Type | Visual | Default Color | Default Stroke |
|------|--------|---------------|----------------|
| `pass` | Solid line + arrowhead | #ffffff (white) | 4px |
| `run` | Dashed line + arrowhead | #ffffff (white) | 3px |
| `shoot` | Double parallel lines + filled triangle | #ff0000 (red) | 5px |

#### 1.4.2 Creation & Tool Activation

| Trigger | Arrow Type |
|---------|------------|
| `A` | Activate pass arrow tool |
| `R` | Activate run arrow tool |
| `S` | Activate shoot arrow tool |
| Context Menu → Add Arrow | Sub-menu with all 3 types |

**Drawing flow:**
1. Press tool shortcut (A/R/S)
2. Click start point on canvas
3. Drag to end point
4. Release mouse — arrow created
5. Tool remains active for next arrow (press `Escape` to exit tool mode)

#### 1.4.3 Endpoint Editing

**Trigger:** Click on arrow body → endpoint handles appear

**Handles:**
- Start point: draggable circle
- End point: draggable circle
- Drag handle → updates arrow path in real-time
- Preview during drag, commit to history on mouseUp

#### 1.4.4 Properties & Styling

| Trigger | Behavior |
|---------|----------|
| `Alt+↑/↓` (arrow selected) | Cycle color through shared palette |
| `Alt+←` | Decrease stroke width -1 (min: 1) |
| `Alt+→` | Increase stroke width +1 (max: 10) |

**Shoot arrow specifics:**
- Two parallel lines offset by 3px
- Filled triangle arrowhead (18px long, 12px wide)

**Run arrow dash pattern:** [8, 4] (8px dash, 4px gap)

#### 1.4.5 Default Values

```
pass:  { color: '#ffffff', strokeWidth: 4, dash: [] }
run:   { color: '#ffffff', strokeWidth: 3, dash: [8, 4] }
shoot: { color: '#ff0000', strokeWidth: 5, dash: [] }
```

---

### 1.5 Zones

#### 1.5.1 Zone Shapes

| Shape | Visual | Creation Shortcut |
|-------|--------|-------------------|
| `rect` | Rectangle | `Z` |
| `ellipse` | Oval/Circle | `Shift+Z` |

#### 1.5.2 Creation & Resize

**Creation:**
1. Press `Z` or `Shift+Z`
2. Click-drag on canvas
3. Release to create zone

**Default size:** 100×100px (rectangular), centered at cursor

**Resize:**
- Click zone → 8 resize handles appear (corners + midpoints)
- Drag handle to resize
- Maintains top-left anchor (bottom-right moves)

#### 1.5.3 Properties & Styling

| Property | Type | Default |
|----------|------|---------|
| `shape` | 'rect' \| 'ellipse' | 'rect' |
| `fillColor` | string | '#ef4444' |
| `opacity` | number | 0.25 |
| `borderStyle` | 'solid' \| 'dashed' \| 'none' | 'none' |
| `borderColor` | string | '#ef4444' |
| `borderWidth` | number | 2 |

**Interactions:**
| Trigger | Behavior |
|---------|----------|
| `E` (zone selected) | Cycle shape (rect ↔ ellipse) |
| `Alt+↑/↓` | Cycle fill color |
| `Alt+←/→` | Adjust border width ±1 |

---

### 1.6 Text Labels

#### 1.6.1 Creation & Editing

| Trigger | Behavior |
|---------|----------|
| `T` | Add text at cursor ("Text") |
| Double-click text | Start editing content |
| `Enter` (text selected) | Start editing content |
| Context Menu → Edit Text | Start editing |

**Inline editor:**
- Positioned at text location
- Multiline support
- `Enter` to save (or click away)
- `Escape` to cancel

#### 1.6.2 Typography Controls

| Trigger | Behavior |
|---------|----------|
| `↑` (text selected) | Increase font size +2 (max: 72) |
| `↓` (text selected) | Decrease font size -2 (min: 8) |
| `←` (text selected) | Toggle bold |
| `→` (text selected) | Toggle italic |
| `Shift+↑` (text selected) | Cycle background color |
| `Shift+↓` (text selected) | Remove background |
| `Alt+↑/↓` | Cycle text color |

**Background colors:** #000000, #ffffff, #ff0000, #00ff00, #3b82f6, #1f2937

#### 1.6.3 Default Values

```
content: 'Text'
fontSize: 18
fontFamily: 'Inter, system-ui, sans-serif'
color: '#ffffff'
bold: false
italic: false
backgroundColor: undefined
```

---

### 1.7 Drawings

#### 1.7.1 Freehand Tool (`D`)

**Activation:** Press `D` key

**Drawing:**
1. Click-drag on canvas
2. Path follows cursor
3. Release to complete stroke
4. Minimum 4 points required
5. Tool stays active (press `Escape` to exit)

**Defaults:**
- Color: #ff0000 (red)
- Stroke width: 3px
- Opacity: 1.0

#### 1.7.2 Highlighter Tool (`H`)

Same as freehand, with different defaults:
- Color: #ffff00 (yellow)
- Stroke width: 20px
- Opacity: 0.4

**Use case:** Semi-transparent marking (like physical highlighter pen)

#### 1.7.3 Clear Drawings

| Trigger | Behavior |
|---------|----------|
| `C` | Clear all drawing elements (undoable, single history commit) |
| `Shift+C` | Clear ALL elements (shows confirmation modal) |

**Points storage:** Flat array format `[x1, y1, x2, y2, ...]`

---

### 1.8 Equipment

#### 1.8.1 Equipment Types & Variants

| Type | Variants | Shortcut | Shift Variant |
|------|----------|----------|---------------|
| `goal` | standard, mini | `J` | `Shift+J` (mini) |
| `mannequin` | standard, flat | `M` | `Shift+M` (flat) |
| `cone` | standard | `K` | — |
| `pole` | standard | `Shift+K` | — |
| `ladder` | standard | `Y` | — |
| `hoop` | standard | `Q` | — |
| `hurdle` | standard | `U` | — |

**Note:** Cone and Pole share the `K` key (Shift toggles between them)

#### 1.8.2 Properties

| Property | Type | Range | Default |
|----------|------|-------|---------|
| `equipmentType` | string | (see types above) | — |
| `variant` | string | (type-specific) | 'standard' |
| `rotation` | number | 0-360° | 0 |
| `scale` | number | 0.25-3.0 | 1.0 |
| `color` | string | hex | '#ff6b00' |

#### 1.8.3 Interactions

| Trigger | Behavior |
|---------|----------|
| `[` / `]` | Rotate ±15° |
| `Shift+[` / `Shift+]` (or `{` / `}`) | Rotate ±90° (quick 90° turns) |
| `+` (no Cmd) | Increase scale +15% |
| `-` (no Cmd) | Decrease scale -15% |
| `Alt+↑/↓` | Cycle color |

#### 1.8.4 Rendering Architecture

**Contract:** Equipment shapes are PURE VISUAL components
- All rendering in `{type}.tsx` files (e.g., `goal.tsx`, `cone.tsx`)
- `listening={false}` on all internal shapes
- Interaction handled by external hitRect in `EquipmentNode.tsx`
- Hit bounds defined in `hitBounds.ts` per equipment type
- Color prop passed through to all shapes

**To add new equipment:**
1. Create `{type}.tsx` with shape component
2. Add to `EQUIPMENT_RENDERERS` map
3. Add hit bounds to `getEquipmentHitBounds()`
4. No changes to `EquipmentNode.tsx` needed (extensible design)

---

## 2. Selection & Interaction

### 2.1 Selection Modes

| Trigger | Behavior |
|---------|----------|
| Click element | Select single element (deselect others) |
| `Shift/Cmd+Click` element | Toggle element in multi-selection |
| `Cmd+A` | Select all elements |
| `Escape` | Clear selection |
| Marquee drag (empty space) | Box-select all elements within rectangle |

**Marquee selection:**
1. Click empty canvas area (not on element)
2. Drag to create selection rectangle
3. Release — all elements touching rectangle are selected
4. Does NOT work when tool is active (drawing, arrow, zone tools)
5. Does NOT work during Space+drag pan

### 2.2 Drag & Move

**Single element drag:**
- Click element, drag to new position
- Preview during drag, commit to history on drop

**Multi-drag:**
- Select multiple elements
- Drag any selected element → all move together maintaining relative positions
- Preview during drag, commit to history on drop

**Nudge (keyboard):**
| Trigger | Distance |
|---------|----------|
| Arrow keys | ±5px (default) |
| `Shift+Arrow` | ±1px (fine control) |

**Grid snap:** None (free positioning)

### 2.3 Context Menu

**Trigger:** Right-click on canvas or element

**Menu variants:**

**Empty space:**
- Paste
- Select All
- Add Player (Home / Away)
- Add Ball
- Add Arrow (Pass / Run / Shoot)
- Add Zone (Rect / Ellipse)

**Player:**
- Change Number
- Switch Team
- Cycle Shape
- Change Color (submenu)
- Resize
- Bring Forward / Send Backward
- Copy / Duplicate / Delete

**Zone:**
- Cycle Shape
- Change Color
- Bring Forward / Send Backward
- Copy / Duplicate / Delete

**Text:**
- Edit Text
- Change Color
- Bring Forward / Send Backward
- Copy / Duplicate / Delete

**Arrow / Ball / Equipment:**
- Change Color
- Bring Forward / Send Backward
- Copy / Duplicate / Delete

**Multi-selection (2+ elements):**
- "X elements selected" header
- Resize (players only)
- Copy / Duplicate
- Delete
- Bring Forward / Send Backward

### 2.4 Clipboard Operations

| Trigger | Behavior |
|---------|----------|
| `Cmd+C` | Copy selected elements to clipboard |
| `Cmd+V` | Paste from clipboard (+12px offset from original) |
| `Cmd+D` | Duplicate selected (+12px offset) |

**Paste/Duplicate offset:** Both X and Y coordinates increased by 12px to avoid exact overlap

---

## 3. Canvas & Viewport

### 3.1 Zoom

**Range:** 25% — 200% (ZOOM_MIN: 0.25, ZOOM_MAX: 2.0)

**Controls:**
| Trigger | Behavior |
|---------|----------|
| `Cmd+=` (plus) | Zoom in +25% |
| `Cmd+-` (minus) | Zoom out -25% |
| `Ctrl+Scroll wheel` | Zoom to cursor position |
| `0` (zero key) | Fit view (reset zoom + pan) |
| Zoom Widget buttons | +/- 25% or Fit |

**Effective zoom calculation:**
```
effectiveZoom = userZoom × fitZoom
```

Where `fitZoom` is auto-computed to fit pitch in container

**Zoom-dependent features:**
- Arms rendering (gated at < zoomThreshold, default 40%)
- Number rotation (gated at < zoomThreshold)

### 3.2 Pan

**Desktop:**
| Trigger | Behavior |
|---------|----------|
| `Space+Drag` | Pan canvas |

**Mobile:**
| Trigger | Behavior |
|---------|----------|
| Two-finger drag | Pan canvas |
| Pinch | Zoom in/out |

**Pan clamping:**
- 80px margin beyond pitch edges
- Pan reset when zoom ≤ 1.0 (pitch fits in view)

**CSS:** `touch-action: none` on canvas container (prevents native gestures)

### 3.3 Mobile Touch

- Pinch zoom: adjusts user zoom level
- Two-finger pan: moves viewport
- Single-finger drag: element interaction (if not on Space)
- Double-tap: activates text/number editing (if on player/text)

---

## 4. Pitch Configuration

### 4.1 Themes

Available pitch themes (Inspector → Pitch tab):

| Theme | Background | Line Color | Description |
|-------|------------|------------|-------------|
| `grass` | Green gradient | White | Default grass field |
| `indoor` | Brown/tan | White | Indoor court |
| `chalk` | Dark green | White/chalk | Traditional chalk lines |
| `futsal` | Wood/tan | Dark | Futsal court |
| `custom` | User-defined | User-defined | Custom colors |

**Access:** Inspector → Pitch tab → Theme dropdown

### 4.2 Orientation

| Value | Description | Shortcut |
|-------|-------------|----------|
| `landscape` | Horizontal pitch (goals left/right) | Default |
| `portrait` | Vertical pitch (goals top/bottom) | `O` to toggle |

**When orientation changes:**
1. All element positions rotated 90°
2. All element orientations adjusted by ±90°
3. Zones: width ↔ height swapped
4. Arrows: endpoints rotated
5. Drawings: all points rotated
6. Applied to ALL steps in document
7. Single history commit

**Auto-zoom on switch:**
- To portrait: zoom set to 75%
- To landscape: zoom set to 100%

→ See §1.2.7 for player orientation transform details

### 4.3 Pitch Views

Pitch view modes (Inspector → Pitch → View):

| View | Visible Area | Use Case |
|------|--------------|----------|
| `full` | Entire pitch | Default full field view |
| `half-left` | Left half only | Attacking drills (home team) |
| `half-right` | Right half only | Attacking drills (away team) |
| `center` | Center third | Midfield focus |

**Implementation:** Visual crop only (elements outside view still selectable)

### 4.4 Line Visibility

Toggleable line sets (Inspector → Pitch → Lines):
- Center circle
- Penalty boxes
- Goal boxes
- Corner arcs

### 4.5 Print-Friendly Mode

**Trigger:** `W` key or Inspector → Pitch → Print Mode toggle

**Changes when enabled:**
1. Pitch background → white
2. Pitch lines → black
3. White color (#ffffff) → black (#000000) for all elements (render-time only, does NOT mutate document)
4. White filtered from color pickers

**Use case:** Optimized for black & white printing (saves ink)

→ See §5.5 for color sanitization rules

---

## 5. Teams & Colors

### 5.1 Team Settings

Located in Inspector → Teams tab

| Setting | Home Default | Away Default |
|---------|--------------|--------------|
| Name | "Home" | "Away" |
| Primary Color | #ef4444 (red) | #3b82f6 (blue) |
| Secondary Color | #ffffff (white) | #ffffff (white) |
| Goalkeeper Color | #fbbf24 (yellow) | #fbbf24 (yellow) |

**Editing:** Click team card to access color pickers

### 5.2 Shared Color Palette

**SHARED_COLORS array** (used by all color pickers):

```
#000000  (black)
#ff0000  (red)
#ff6b6b  (light red)
#00ff00  (green)
#3b82f6  (blue)
#eab308  (yellow)
#f97316  (orange)
#ffffff  (white)
```

**Usage:**
- Player color cycling (`Alt+↑/↓`)
- Zone fill color
- Arrow color
- Equipment color
- Text color

### 5.3 Per-Player Color Override

Players can override team color via:
- Context Menu → Change Color
- Inspector → Props → Color picker (when player selected)

**Rendering priority:**
1. If `isGoalkeeper: true` → use team's `goalkeeperColor`
2. If `color` property set → use player's custom color
3. Otherwise → use team's `primaryColor`

### 5.4 Color Cycling

**Trigger:** `Alt+↑` / `Alt+↓` (when element selected)

**Behavior:**
- Cycles through SHARED_COLORS array
- `Alt+↑` = next color
- `Alt+↓` = previous color
- Wraps at array ends

**Applies to:** Players, zones, arrows, equipment, text

### 5.5 Print Mode Color Sanitization

**Rule:** White (#ffffff) → Black (#000000) render-time substitution

**Sanitization function:**
```javascript
sanitizeColorForPrint(color, isPrintMode)
  - If isPrintMode && color === '#ffffff' → return '#000000'
  - Otherwise → return color unchanged
```

**Applies to:**
- Player fills
- Arrow strokes
- Zone fills
- Text color
- Pitch lines

**Does NOT mutate documents** — rendering transformation only

---

## 6. Formations

### 6.1 Available Formations

| ID | Name | Shortcut (Home) | Shortcut (Away) |
|----|------|-----------------|-----------------|
| `4-3-3` | 4-3-3 Classic | `1` | `Shift+1` |
| `4-4-2` | 4-4-2 Flat | `2` | `Shift+2` |
| `4-4-2-diamond` | 4-4-2 Diamond | `3` | `Shift+3` |
| `4-2-3-1` | 4-2-3-1 | `4` | `Shift+4` |
| `3-5-2` | 3-5-2 | `5` | `Shift+5` |
| `5-3-2` | 5-3-2 | `6` | `Shift+6` |

### 6.2 Formation Coordinate System

**Percentage-based positioning:**
- X-axis: 0 = left goal, 50 = center, 100 = right goal
- Y-axis: 0 = top touchline, 50 = center, 100 = bottom touchline

**All formations defined for HOME team:**
- GK positioned at low X (left side)
- Attack toward center (X ~45%)

### 6.3 Application Rules

**When formation applied:**
1. **Deletes ALL existing players of that team**
2. Creates 11 new players at formation positions
3. Auto-assigns jersey numbers (1-11, role-based)
4. Uses team's current colors
5. Single history commit

**No undo warning** — formation application is undoable via Cmd+Z

### 6.4 Away Team Mirroring

**Coordinate transform:** `newX = 100 - originalX`

**Example:**
- Home GK at X=4% → Away GK at X=96%
- Home striker at X=46% → Away striker at X=54%

**Y-coordinates unchanged** (horizontal mirroring only)

### 6.5 Portrait Orientation Rotation

When pitch is in portrait mode:
1. Formation coordinates rotated 90°
2. X% in landscape → Y% in portrait
3. Y% in landscape → (100-X)% in portrait
4. GK moves from left → top

**Result:** Formations work correctly in both orientations

---

## 7. Steps & Animation

### 7.1 Step Management

**Steps = animation frames/slides** — each step captures element state

| Trigger | Behavior |
|---------|----------|
| `N` | Add new blank step (duplicates current elements as starting point) |
| `X` | Delete current step (requires 2+ steps, cannot delete last step) |
| `←` / `→` (no element selected) | Navigate to prev/next step |
| BottomStepsBar click | Jump to specific step |
| BottomStepsBar rename | Click step name to edit (inline) |

**Step structure:**
- Each step has: `id`, `name`, `duration`, `elements[]`
- Default name: "Step 1", "Step 2", etc.
- Default duration: 2 seconds
- Current step index tracked globally

### 7.2 Animation Playback

**Controls** (BottomStepsBar):
| Control | Trigger | Behavior |
|---------|---------|----------|
| Play | Play button | Start animation from current step |
| Pause | Pause button | Stop animation, stay at current frame |
| Loop | `L` or Loop toggle | When ON, animation restarts at end |
| Prev Step | `←` | Jump to previous step |
| Next Step | `→` | Jump to next step |
| Duration slider | Drag | Adjust step duration (0.1s - 5s) |

**Playback behavior:**
- Progress bar shows current position within step (0-100%)
- Animation pauses automatically at last step (unless Loop ON)
- Clicking step thumbnail while playing jumps to that step

**Note:** `Space` key does NOT play/pause (it's reserved for pan)

### 7.3 Interpolation

**During playback between steps N and N+1:**

**Interpolated properties:**
| Element Type | Interpolated |
|--------------|--------------|
| Players, Ball, Equipment | `position` (linear) |
| Zones | `position`, `width`, `height` |
| Arrows | `startPoint`, `endPoint` |
| Text, Drawings | No interpolation (instant transition) |

**Interpolation formula:**
```
interpolatedValue = current + (next - current) × progress
```

Where `progress` = 0.0 (step start) to 1.0 (step end)

**Element matching:** Elements matched by `id` across steps
- If element exists in step N but not N+1 → fades out
- If element exists in N+1 but not N → fades in
- Otherwise → interpolates

---

## 8. History (Undo/Redo)

### 8.1 Commands

| Trigger | Behavior |
|---------|----------|
| `Cmd+Z` | Undo (step back in history) |
| `Shift+Cmd+Z` | Redo (step forward in history) |

**History limit:** 50 entries (oldest discarded when exceeded)

### 8.2 Operations That Push History

**Element operations:**
- Add element (any type)
- Delete element
- Duplicate / Paste
- Move (on mouseUp / nudge)
- Resize (on commit)
- Property changes (color, shape, stroke, etc.)

**Document operations:**
- Formation apply
- Pitch orientation change
- Clear drawings (`C` key)
- Step add/delete/reorder

**Orientation/vision:**
- Player orientation change (on mouseUp for ALT+drag, immediate for keyboard)
- Vision toggle
- ALT+wheel rotation (debounced 300ms)

### 8.3 Preview vs. Commit Pattern

**Preview (NO history):**
- Drag during movement
- Resize during drag
- Arrow endpoint drag (during)
- Player orientation during ALT+drag
- Radius slider movement

**Commit (history push):**
- MouseUp after drag
- Blur/Enter after text edit
- MouseUp after arrow endpoint drag
- MouseUp after ALT+drag rotation
- Zone resize handle release

### 8.4 Debounced History

**ALT+scroll wheel rotation:**
- 300ms debounce
- Multiple rapid scrolls → single history entry
- Prevents history spam during continuous rotation

---

## 9. Inspector Panel

### 9.1 Tabs

Located in right sidebar (toggle with `I` key):

1. **Props** — Selected element properties
2. **Layers** — Element type visibility + Groups
3. **Objects** — Searchable element list
4. **Teams** — Team colors and names
5. **Pitch** — Pitch theme, orientation, view, print mode

### 9.2 Props Tab

**Nothing selected:**
- Shows "Quick Actions" panel with common shortcuts

**Single element selected:**
- Element type + position displayed
- Type-specific property editors:
  - **Player:** Number, Label, ShowLabel, FontSize, Opacity, Goalkeeper toggle, Orientation settings
  - **Text:** (read-only type display)
  - **Zone:** (read-only type display)
  - **Other:** (read-only type display)

**Multi-selection (2+):**
- Displays: "{N} elements selected"
- Shows "Coming soon" message (multi-edit not yet implemented)

### 9.3 Layers Tab

**Element type visibility toggles:**
- Home Players
- Away Players
- Ball
- Arrows
- Zones
- Labels (text elements)

**Groups section:**
- Create custom groups
- Lock/unlock group
- Hide/show group
- Rename group
- Select all elements in group

### 9.4 Objects Tab

**Features:**
- Searchable list of all elements
- Filter by type (All / Home / Away / Ball)
- Click element → selects on canvas
- Shows element type icon + label

### 9.5 Teams Tab

**Per team (Home / Away):**
- Team name input
- Primary color picker
- Secondary color picker
- Goalkeeper color picker

**Color pickers use SHARED_COLORS palette**

### 9.6 Pitch Tab

**Theme dropdown:** grass, indoor, chalk, futsal, custom

**Orientation toggle:** Landscape / Portrait

**View dropdown:** full, half-left, half-right, center

**Line visibility toggles:**
- Center circle
- Penalty boxes
- Goal boxes
- Corner arcs

**Print Mode toggle:** ON/OFF

---

## 10. Keyboard Shortcuts Reference

### Complete Shortcut List (~85 total)

#### Element Creation (11)
- `P` — Add home player
- `Shift+P` — Add away player
- `B` — Add ball
- `T` — Add text
- `J` — Add goal (standard)
- `Shift+J` — Add goal (mini)
- `M` — Add mannequin
- `Shift+M` — Add mannequin (flat)
- `K` — Add cone
- `Shift+K` — Add pole
- `Y` — Add ladder
- `Q` — Add hoop
- `U` — Add hurdle

#### Tools (7)
- `A` — Activate pass arrow tool
- `R` — Activate run arrow tool
- `S` — Activate shoot arrow tool
- `D` — Activate freehand drawing tool
- `H` — Activate highlighter tool
- `Z` — Activate zone (rect) tool
- `Shift+Z` — Activate zone (ellipse) tool

#### Editing (11)
- `Cmd+Z` — Undo
- `Shift+Cmd+Z` — Redo
- `Cmd+C` — Copy
- `Cmd+V` — Paste
- `Cmd+D` — Duplicate
- `Cmd+A` — Select all
- `Delete` / `Backspace` — Delete selected
- `Escape` — Clear selection / Exit tool mode
- `Enter` — Edit selected (player number or text content)
- `C` — Clear all drawings
- `Shift+C` — Clear ALL elements (with confirmation)

#### View & Display (11)
- `I` — Toggle inspector panel
- `F` — Toggle focus mode
- `?` — Toggle cheat sheet (help overlay)
- `O` — Toggle pitch orientation (landscape/portrait)
- `W` — Toggle print-friendly mode
- `G` — Toggle grid visibility
- `0` (zero) — Fit view (reset zoom + pan)
- `Cmd+=` — Zoom in
- `Cmd+-` — Zoom out
- `Ctrl+Scroll` — Zoom to cursor
- `Space+Drag` — Pan canvas

#### Steps & Playback (4)
- `N` — Add new step
- `X` — Delete current step
- `←` / `→` (no selection) — Prev/Next step
- `L` — Toggle loop

#### Export (4)
- `Cmd+E` — Export PNG (current step)
- `Shift+Cmd+E` — Export all steps PNG
- `Shift+Cmd+G` — Export GIF
- `Shift+Cmd+P` — Export PDF

#### Formations (12)
- `1` — Apply 4-3-3 (home)
- `2` — Apply 4-4-2 (home)
- `3` — Apply 4-4-2 Diamond (home)
- `4` — Apply 4-2-3-1 (home)
- `5` — Apply 3-5-2 (home)
- `6` — Apply 5-3-2 (home)
- `Shift+1` through `Shift+6` — Apply formation to away team

#### Player Orientation & Vision (8)
- `[` — Rotate -15°
- `]` — Rotate +15°
- `Shift+[` — Rotate -5° (fine)
- `Shift+]` — Rotate +5° (fine)
- `Alt+0` — Reset orientation to 0°
- `V` — Toggle vision (selected)
- `Shift+V` — Toggle vision (all players, deterministic)
- `ALT+drag` — Interactive rotation (5° snap, Shift for 1°)
- `ALT+scroll` — Rotate ±15° (debounced)

#### Equipment (5)
- `[` / `]` — Rotate ±15°
- `{` / `}` (Shift+[ / ]) — Rotate ±90°
- `+` — Scale +15%
- `-` — Scale -15%
- `Alt+↑/↓` — Cycle color

#### Context-Dependent (Player Selected) (3)
- `Shift+S` — Cycle shape
- `Alt+↑/↓` — Cycle color
- `Cmd+Alt+=` / `Cmd+Alt+-` — Resize radius ±10%

#### Context-Dependent (Text Selected) (6)
- `↑` — Increase font size
- `↓` — Decrease font size
- `←` — Toggle bold
- `→` — Toggle italic
- `Shift+↑` — Cycle background color
- `Shift+↓` — Remove background

#### Context-Dependent (Zone Selected) (3)
- `E` — Cycle shape (rect ↔ ellipse)
- `Alt+↑/↓` — Cycle color
- `Alt+←/→` — Adjust border width

#### Context-Dependent (Arrow Selected) (3)
- `Alt+↑/↓` — Cycle color
- `Alt+←` — Decrease stroke width
- `Alt+→` — Increase stroke width

---

## 11. Z-Order & Rendering

### 11.1 Default Z-Indexes by Element Type

Rendering order (bottom to top):

```
zone:      10
arrow:     20
drawing:   30
player:    40
ball:      50
equipment: 60
text:      70
```

**Collision priority:** Higher z-index = higher click priority

### 11.2 Player Internal Z-Order

Within a single player element (bottom to top):

```
1. Vision cone (if enabled)
2. Player body (circle/square/triangle/diamond)
3. Arms (if orientation enabled and zoom ≥ threshold)
4. Number text (if has number)
5. Rotation hit zone (transparent, listening for ALT+drag)
```

**Vision cone:**
- Z-index: BELOW body
- Ensures body always visible on top of cone
- Hit area: Part of rotation interaction zone

**Arms:**
- Z-index: ABOVE body, BELOW number
- Fixed in v0.2.2 (previously rendered behind body)
- Now visible on all player shapes

**Number rotation:**
- Auto-flips 180° when orientation 90-270° (for readability)
- Always rendered on top of all player visuals

### 11.3 Layer Control (Content Coming Soon)

Context menu items exist for:
- Bring to Front
- Bring Forward
- Send Backward
- Send to Back

**Current status:** Shows "Coming soon" toast (not yet implemented)

---

## 12. Export

### 12.1 PNG Export (Single Step)

**Trigger:** `Cmd+E` or TopBar → Export button

**Output:**
- Format: PNG
- Resolution: Canvas dimensions at current zoom
- Transparency: Solid background (pitch theme)
- Filename: `{project-name}-step-{N}.png`

### 12.2 PNG Export (All Steps)

**Trigger:** `Shift+Cmd+E`

**Output:**
- One PNG per step
- Filenames: `{project-name}-step-1.png`, `{project-name}-step-2.png`, ...
- ZIP archive if multiple steps
- Same resolution as single export

### 12.3 GIF Export

**Trigger:** `Shift+Cmd+G`

**Output:**
- Animated GIF
- Frame duration: Each step's configured duration
- Loop: Infinite
- Resolution: Scaled to reasonable size for GIF format
- Filename: `{project-name}.gif`

### 12.4 PDF Export

**Trigger:** `Shift+Cmd+P`

**Output:**
- Multi-page PDF (one page per step)
- Vector graphics where possible
- Page size: A4 or Letter (configurable)
- Filename: `{project-name}.pdf`

**Note:** Recommended to enable Print Mode (`W`) before PDF export for optimal printing

### 12.5 SVG Export (Experimental)

**Output:**
- Vector format
- Scalable without quality loss
- Experimental feature

---

## 13. Save & Persistence

### 13.1 Local Storage

**Auto-save triggers:**
- Any document edit (debounced 2000ms)
- Manual save: `Cmd+S`

**Storage key:** `tmc-studio-document`

**Stored data:**
- Complete BoardDocument object
- All steps
- Team settings
- Pitch settings
- Orientation settings

### 13.2 Cloud Sync (Supabase)

**Requires:** User authentication

**Auto-save behavior:**
- Triggers on same events as local save
- Only when online
- Debounce: 2000ms
- Rate-limited save failure toasts (5s cooldown)

**Project structure:**
- Each project has: `id`, `name`, `document`, `folder_id`, `user_id`, `created_at`, `updated_at`
- Projects can be organized in folders
- Folders have: `id`, `name`, `color`, `user_id`

### 13.3 Autosave Rules

**Autosave triggered by:**
1. Element additions/deletions
2. Element property changes
3. Step operations
4. Document setting changes

**Autosave disabled during:**
- Continuous interactions (drag, resize, marquee, drawing in progress)
- Animation playback

**isDirty flag:**
- Set to `true` when document changes
- Set to `false` after successful save
- Controls whether autosave runs

### 13.4 Offline Behavior

**When offline:**
- Cloud save attempts skipped
- Local storage continues to work
- OfflineBanner shown at bottom of screen
- User can continue working normally
- Changes sync automatically when back online

**Offline detection:** Browser `navigator.onLine` API + connection testing

---

## Appendices

### Appendix A: Default Values Reference

**Player:**
```
shape: 'circle'
radius: 18
number: auto-incremented (1-99)
orientation: 0
showVision: undefined
fontSize: 14
textColor: '#ffffff'
opacity: 1.0
isGoalkeeper: false
showLabel: false
```

**Ball:**
```
radius: 8 (fixed)
color: '#ff8c42'
```

**Arrow (pass):**
```
color: '#ffffff'
strokeWidth: 4
dash: []
```

**Arrow (run):**
```
color: '#ffffff'
strokeWidth: 3
dash: [8, 4]
```

**Arrow (shoot):**
```
color: '#ff0000'
strokeWidth: 5
dash: []
```

**Zone:**
```
shape: 'rect'
fillColor: '#ef4444'
opacity: 0.25
borderStyle: 'none'
borderColor: '#ef4444'
borderWidth: 2
```

**Text:**
```
content: 'Text'
fontSize: 18
fontFamily: 'Inter, system-ui, sans-serif'
color: '#ffffff'
bold: false
italic: false
backgroundColor: undefined
```

**Drawing (freehand):**
```
color: '#ff0000'
strokeWidth: 3
opacity: 1.0
```

**Drawing (highlighter):**
```
color: '#ffff00'
strokeWidth: 20
opacity: 0.4
```

**Equipment:**
```
rotation: 0
scale: 1.0
color: varies by type:
  - goal: '#ffffff' (white)
  - mannequin: '#fbbf24' (yellow)
  - cone: '#f97316' (orange)
  - ladder: '#fbbf24' (yellow)
  - hoop: '#ef4444' (red)
  - hurdle: '#22c55e' (green)
  - pole: '#f97316' (orange)
```

**Teams:**
```
home:
  name: 'Home'
  primaryColor: '#ef4444'
  secondaryColor: '#ffffff'
  goalkeeperColor: '#fbbf24'

away:
  name: 'Away'
  primaryColor: '#3b82f6'
  secondaryColor: '#ffffff'
  goalkeeperColor: '#fbbf24'
```

**Orientation Settings:**
```
enabled: false
showArms: false
showVision: false
zoomThreshold: 40 (%)
```

### Appendix B: Color Palette

**SHARED_COLORS** (used by all color pickers and cycling):

```
#000000  (black)
#ff0000  (red)
#ff6b6b  (light red)
#00ff00  (green)
#3b82f6  (blue)
#eab308  (yellow)
#f97316  (orange)
#ffffff  (white)
```

**Text background colors:**
```
#000000  (black)
#ffffff  (white)
#ff0000  (red)
#00ff00  (green)
#3b82f6  (blue)
#1f2937  (dark gray)
```

**Print mode substitution:**
- `#ffffff` → `#000000` (render-time only)

### Appendix C: Tool Modes

**Available tools:**

| Tool | Activation | Exit | Behavior |
|------|------------|------|----------|
| Pass Arrow | `A` | `Escape` | Click-drag to draw solid arrow |
| Run Arrow | `R` | `Escape` | Click-drag to draw dashed arrow |
| Shoot Arrow | `S` | `Escape` | Click-drag to draw shoot arrow (double lines) |
| Freehand Drawing | `D` | `Escape` | Click-drag to draw red line |
| Highlighter | `H` | `Escape` | Click-drag to draw yellow highlighter |
| Zone (Rect) | `Z` | `Escape` or single use | Click-drag to create rectangle |
| Zone (Ellipse) | `Shift+Z` | `Escape` or single use | Click-drag to create ellipse |

**Tool behavior:**
- Arrow tools stay active until `Escape` (allows drawing multiple arrows)
- Zone tools may exit after single use (depending on implementation)
- Selection mode = default (no tool active)
- Only one tool active at a time

---

## Document Maintenance

This document must be updated whenever user-facing behavior changes. See `.clinerules` for automatic update requirements.
