# 📋 TMC Studio — Product Roadmap

**Created:** 2025-01-04  
**Status:** Active development  
**Version:** 0.2.0 (Sprint D complete)

---

## 🏗️ CURRENT STATE (v0.2.0)

### ✅ Implemented Features

| Category | Feature | Status |
|----------|---------|--------|
| **Canvas** | Full pitch rendering | ✅ |
| | Players (Home/Away) draggable | ✅ |
| | Ball (vector with pentagon) | ✅ |
| | Zoom 25%-200% | ✅ |
| **Selection** | Single click select | ✅ |
| | Multi-select (Shift+click) | ✅ |
| | Duplicate (Cmd+D) +12px offset | ✅ |
| **History** | Undo/Redo (50 steps) | ✅ |
| **UI** | Command Palette (Cmd+K) | ✅ |
| | Dark/Light theme | ✅ |
| | Focus Mode (F) | ✅ |
| | Right Inspector (4 tabs) | ✅ |
| | Cheat Sheet (?) | ✅ |
| | Toast notifications | ✅ |
| | TopBar + Account Menu | ✅ |
| | Bottom Steps Bar (placeholder) | ⚠️ |
| **Export** | PNG current step | ✅ |
| **Storage** | localStorage auto-save | ✅ |
| **Layers** | UI toggles (not filtering canvas) | ⚠️ |

### ⚠️ Partially Implemented
- **Steps:** UI exists, but only 1 step works
- **Layers:** Toggles exist, but don't filter canvas rendering

---

## 🎯 SPRINT 1: "Analyst-Ready MVP" (P0)

**Goal:** Analyst can create tactical board with arrows + zones and export.  
**Timeline:** 1-2 weeks

### 1.1 Arrows (Pass/Run)
**Files to create/modify:**
```
packages/core/src/types.ts         → ArrowElement type
packages/board/src/ArrowNode.tsx   → Konva Line + Arrow head
apps/web/src/store/useBoardStore.ts → addArrowAtCursor(), moveArrowEndpoint()
apps/web/src/App.tsx               → Render ArrowNode, handle A/R keys
```

**Spec:**
- **A** = Add Pass arrow (solid line, arrow head)
- **R** = Add Run arrow (dashed line, arrow head)
- Arrow has: `startPoint`, `endPoint`, `curveControl` (optional)
- Drag endpoints separately
- Default: straight line
- P1: Control point for curve

**ArrowElement type:**
```typescript
interface ArrowElement extends BaseElement {
  type: 'arrow';
  arrowType: 'pass' | 'run';
  startPoint: Position;
  endPoint: Position;
  curveControl?: Position; // P1
  color?: string;
  strokeWidth?: number;
}
```

### 1.2 Zones (Rect/Ellipse)
**Files to create/modify:**
```
packages/core/src/types.ts         → ZoneElement type
packages/board/src/ZoneNode.tsx    → Konva Rect/Ellipse + resize handles
apps/web/src/store/useBoardStore.ts → addZoneAtCursor()
apps/web/src/App.tsx               → Render ZoneNode, handle Z key
```

**Spec:**
- **Z** = Add Zone (rectangle default)
- Toggle shape: rect / ellipse (in Inspector)
- 8-point resize handles
- Opacity slider (0.1 - 0.5)
- Color presets: green, red, yellow, blue, purple
- **Render order:** Zone (background) → Ball → Player → Arrow (front)

**ZoneElement type:**
```typescript
interface ZoneElement extends BaseElement {
  type: 'zone';
  shape: 'rect' | 'ellipse';
  width: number;
  height: number;
  fillColor: string;
  opacity: number;
  borderStyle?: 'solid' | 'dashed' | 'none';
}
```

### 1.3 Layers Filtering (Canvas)
**Files to modify:**
```
apps/web/src/App.tsx → filter elements before rendering based on layerVisibility
```

**Spec:**
- `layerVisibility` from `useUIStore` already has: `home`, `away`, `ball`, `arrows`, `zones`, `labels`
- In App.tsx render: filter elements where layer is visible
- Hidden elements in Objects tab: dim + crossed-eye icon
- Labels = player numbers (future: toggle off)

### 1.4 Marquee Selection
**Files to create/modify:**
```
packages/board/src/SelectionBox.tsx → Already exists, needs activation
apps/web/src/App.tsx               → Mouse drag creates selection rectangle
apps/web/src/store/useBoardStore.ts → selectElementsInRect()
```

**Spec:**
- Click + drag on empty canvas = draw selection rect
- Release = select all elements within rect
- Add to existing selection if Shift held

### 1.5 Arrow Key Nudge
**Files to modify:**
```
apps/web/src/App.tsx → handleKeyDown for arrow keys
apps/web/src/store/useBoardStore.ts → nudgeSelected(dx, dy)
```

**Spec:**
- ↑↓←→ = move selection by 5px
- Shift + arrow = move by 1px (precision)

### 1.6 Export Steps ZIP
**Files to modify:**
```
apps/web/src/App.tsx → handleExportAllSteps()
```

**Spec:**
- Export current step PNG: ✅ (already works)
- Export all steps: generate PNG for each step → ZIP download
- Library: JSZip for ZIP creation

---

## 🎯 SPRINT 2: "Pitch Views + Polish" (P0/P1)

**Goal:** Different pitch views, orientations, alignment tools.  
**Timeline:** 1-2 weeks

### 2.1 Pitch Views
**Files to modify:**
```
packages/core/src/types.ts    → PitchView type
packages/core/src/pitch.ts    → pitchConfigs for each view
packages/board/src/Pitch.tsx  → Render based on view
apps/web/src/store/useUIStore.ts → pitchView state
```

**Views:**
- `full` - Full pitch (default)
- `half-attacking` - Attacking half
- `half-defending` - Defending half  
- `final-third` - Final third highlighted
- `blank` - No lines, white/grass background

### 2.2 Orientation
**Files to modify:**
```
apps/web/src/store/useUIStore.ts → orientation: 'landscape' | 'portrait'
apps/web/src/App.tsx             → Rotate canvas container
packages/board/src/Pitch.tsx     → Swap width/height
```

**Spec:**
- Landscape (default): 1050x680
- Portrait: 680x1050 (rotated 90°)
- UI adapts, pitch "fits" container

### 2.3 Pitch Style
**Files to modify:**
```
apps/web/src/store/useUIStore.ts → pitchStyle: { lines: boolean, grass: boolean }
packages/board/src/Pitch.tsx     → Conditional rendering
```

**Options:**
- Lines on/off
- Grass texture on/off (white board mode)

### 2.4 Align/Distribute
**Files to create:**
```
apps/web/src/store/useBoardStore.ts → alignSelected(), distributeSelected()
packages/ui/src/AlignToolbar.tsx    → Align buttons
```

**Commands:**
- Align: Left, Right, Top, Bottom, Center H, Center V
- Distribute: Horizontal, Vertical
- Available in Command Palette + Inspector toolbar (when multi-select)

### 2.5 Lock Element
**Files to modify:**
```
packages/core/src/types.ts          → BaseElement.locked?: boolean
apps/web/src/store/useBoardStore.ts → toggleLock()
apps/web/src/App.tsx                → if locked: no drag
packages/ui/src/RightInspector.tsx  → Lock toggle in Properties
```

**Spec:**
- Locked element can be selected but not moved
- Visual: lock icon overlay
- Useful for zones/lines that shouldn't move

---

## 🎯 SPRINT 3: "Animation Workflow" (P0)

**Goal:** Full step-based animation with playback and export.  
**Timeline:** 1-2 weeks

### 3.1 Steps System (Full)
**Files to modify:**
```
apps/web/src/store/useBoardStore.ts → steps[], currentStepIndex, addStep(), deleteStep()
packages/ui/src/BottomStepsBar.tsx  → Full step management
```

**Spec:**
- Add step = snapshot current elements
- Delete step
- Rename step (double-click)
- Reorder steps (drag)
- Duration per step (0.5s - 3s slider)
- Navigation: ← → arrows, click thumbnail

### 3.2 Playback
**Files to modify:**
```
apps/web/src/store/useBoardStore.ts → play(), pause(), setPlaying(), isPlaying
packages/ui/src/BottomStepsBar.tsx  → Play/Pause button, progress
apps/web/src/App.tsx                → useEffect for auto-advance
```

**Spec:**
- Space = Play/Pause
- Loop toggle (L)
- Visual progress bar
- Auto-advance to next step after duration

### 3.3 Export Batch
**Spec:**
- Export current PNG ✅
- Export all steps → ZIP (step-1.png, step-2.png, ...)
- P2: GIF export (using gif.js)
- Desktop (Tauri): MP4 export

---

## 🎯 SPRINT 4: "Team Styles + Recent Boards" (P1)

**Goal:** Team colors and local board library.  
**Timeline:** 1 week

### 4.1 Team Styles
**Files to create/modify:**
```
packages/core/src/types.ts          → TeamStyle type
apps/web/src/store/useBoardStore.ts → homeStyle, awayStyle
packages/board/src/PlayerNode.tsx   → Use team style colors
packages/ui/src/TeamStylePicker.tsx → Color picker component
```

**TeamStyle:**
```typescript
interface TeamStyle {
  fill: string;      // Player fill color
  stroke: string;    // Player stroke
  text: string;      // Number color
}
```

**Presets:**
- Classic (Red vs Blue)
- Mono (Black vs White)
- Club1, Club2 (future: custom)

**UX:**
- Command Palette: "Set Home Color → Red"
- Inspector: Team dropdown + color override

### 4.2 Board Metadata
**Files to modify:**
```
packages/core/src/types.ts → BoardDocument.tags?, lastEdited
apps/web/src/store/useBoardStore.ts → addTag(), removeTag()
packages/ui/src/TopBar.tsx → Tag dropdown
```

**Spec:**
- Board name: editable in TopBar ✅
- Tags: "Pressing", "Build-up", "Set Pieces", etc.
- Last edited: timestamp in Info

### 4.3 Recent Boards (localStorage)
**Files to create:**
```
apps/web/src/store/useLibraryStore.ts → boards[], loadBoard(), deleteBoard()
packages/ui/src/BoardLibraryModal.tsx → Recent boards list
```

**Spec:**
- Store metadata in localStorage: { id, name, thumbnail, lastEdited }
- Limit: 10 boards (Free), unlimited (Pro)
- Actions: Open, Rename, Delete
- "New Board" button

---

## 🎯 SPRINT 5: "SaaS Foundation" (P0 for monetization)

**Goal:** Free vs Pro logic, cloud sync, payments.  
**Timeline:** 1-2 weeks

### 5.1 Free vs Pro Logic
**Files to create:**
```
apps/web/src/store/useUserStore.ts → user, plan: 'free' | 'pro'
```

**Free tier:**
- 5 local boards max
- PNG export
- Basic formations (4-4-2, 4-3-3)
- No cloud sync

**Pro tier ($9/mo):**
- Unlimited boards
- Cloud sync (Supabase)
- Premium formation packs
- Custom presets (save as)
- Export all steps / batch
- Priority support

### 5.2 Cloud Sync (Supabase)
**Tables:**
```sql
boards (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  name text,
  data jsonb,
  thumbnail text,
  created_at timestamptz,
  updated_at timestamptz
)
```

**Flow:**
- Auto-sync on save (debounced 2s)
- Conflict: server wins (with notification)
- Offline: queue changes, sync on reconnect

### 5.3 Stripe Integration
**Flow:**
1. User clicks "Upgrade to Pro"
2. Redirect to Stripe Checkout
3. Webhook: `checkout.session.completed` → update user.plan
4. Access granted immediately

**Plans:**
- Monthly: $9/mo
- Yearly: $79/yr (save 27%)

### 5.4 Premium Presets
**Packs (Pro only):**
- Formations: 4-4-2, 4-3-3, 3-5-2, 4-2-3-1, 5-3-2, 3-4-3
- Build-up patterns: GK distribution, wing overloads
- Pressing patterns: high press, mid-block, low block
- Set pieces: corners, free kicks, throw-ins

---

## 🎯 SPRINT 6+ (Future)

### Objects Pack (P1)
- Goal (full-size, SVG)
- Mini goal
- Cones / mannequins (training)
- Referee (optional)
- Ball rack

### Advanced Arrows (P2)
- Bezier curves (2 control points)
- Gradient color
- Animated dash (in playback)

### Set Pieces Mode (P2)
- Corner markers
- Free kick wall
- Offside line
- Distance markers

### Desktop App (Tauri) (P2)
- MP4 export (FFmpeg)
- Offline-first
- File system integration

### Project Folders (P2)
- Match analysis
- Training sessions
- Opponent scouting
- Set pieces library

---

## 📊 PRIORITY MATRIX

| Sprint | Focus | P-Level | Est. Time |
|--------|-------|---------|-----------|
| **S1** | Arrows + Zones + Layers | P0 | 1-2 weeks |
| **S2** | Pitch Views + Align | P0/P1 | 1-2 weeks |
| **S3** | Steps + Playback + Export | P0 | 1-2 weeks |
| **S4** | Team Styles + Library | P1 | 1 week |
| **S5** | SaaS (Free/Pro, Supabase, Stripe) | P0 | 1-2 weeks |
| S6+ | Objects, Advanced Features | P2 | Ongoing |

---

## 🚀 IMMEDIATE NEXT ACTIONS

### Sprint 1.1 - Arrows
1. Add `ArrowElement` type to `packages/core/src/types.ts`
2. Create `ArrowNode.tsx` with Konva Arrow component
3. Add `addArrowAtCursor()` to store
4. Handle `A` and `R` keyboard shortcuts
5. Implement endpoint dragging
6. Add to Command Palette

### Sprint 1.2 - Zones
1. Add `ZoneElement` type
2. Create `ZoneNode.tsx` with resize handles
3. Add `addZoneAtCursor()` to store
4. Handle `Z` keyboard shortcut
5. Implement opacity/color in Inspector

### Sprint 1.3 - Layers
1. Filter elements in App.tsx render based on `layerVisibility`
2. Update Objects tab to show dim/crossed-eye for hidden

---

## 📈 SUCCESS METRICS

### MVP Success (Sprint 1-3 complete)
- [ ] Analyst can create full tactical board in <2 min
- [ ] Export PNG/ZIP works flawlessly
- [ ] Playback smooth at 60fps
- [ ] No critical bugs in 48h dogfooding

### SaaS Success (Sprint 5 complete)
- [ ] First paying customer
- [ ] <5% churn month 1
- [ ] 100 registered users in first month

---

*Last updated: 2025-01-04*
