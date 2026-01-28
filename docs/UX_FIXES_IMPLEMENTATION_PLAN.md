# TMC Studio - UX Fixes Implementation Plan

**Author:** Principal Product Engineer + UX Architect  
**Date:** 28.01.2026  
**Status:** Ready for Execution  

---

## Principles

### Product Philosophy (Non-Negotiable)

1. **Keyboard-First Experience**
   - Every action must have a keyboard shortcut
   - Mouse/touch is optional, never required
   - Shortcuts must be discoverable (cheat sheet, tooltips, PPM hints)

2. **Zero Dark Patterns**
   - Confirms only for destructive, irreversible actions
   - No artificial friction for PLG funnel
   - Actions are undoable by default (history stack)

3. **Coach-Grade Tool Standards**
   - Predictable behavior (no surprises)
   - Professional defaults (e.g., team-specific shapes)
   - Forgiving input (optional fields, graceful fallbacks)

4. **Architectural Integrity**
   - UI components are pure presenters
   - Domain logic lives in slices/services/commands
   - App.tsx is composition-only
   - No breaking changes without migration path

### Core Behaviors (Must Preserve)

- **Undo/Redo:** All state mutations go through history
- **Autosave:** Triggered by `markDirty()` → 1.5s debounce
- **Inspector/PPM/Shortcuts Parity:** Same actions available everywhere
- **Team Settings Primacy:** Team colors control player appearance (not individual overrides)

---

## Priorities

### 🔴 CRITICAL (Blocks Trust)

1. **[BUG-7] Player Number Optional** - Runtime type violations, goalkeeper detection breaks
2. **[BUG-5] Rename Project Sync** - Data loss perception when name reverts after reload

### 🟡 HIGH (UX Blockers)

3. **[FEAT-1] Default Shape by Team** - Immediate visual confusion for new users
4. **[FEAT-4] Multiline Text** - Requested by coaches for longer annotations
5. **[FEAT-5] Scale Selection** - Essential for layout adjustments, group resizing

### 🟢 MEDIUM (Quality of Life)

6. **[FEAT-3] Shoot Arrow** - Tactical completeness
7. **[FEAT-6] Clear All + Confirm** - Requested safety net for "start over" scenarios

---

## Implementation Plan

### [BUG-7] Player Number Optional (CRITICAL)

**User Goal:** Players can exist without numbers (tactics icons, demo purposes)

**Problem:**
- `PlayerElement.number` is `number` (required in types)
- Inspector allows setting `undefined` via empty string
- `updateSelectedElement()` spreads updates without validation
- Runtime can have `number: undefined`, violating type contract
- Coaches need numberless players for tactical diagrams

**Solution:**
- Change type to `number?: number | null`
- Empty input in Inspector/quick-edit → `null`
- Validation: accept `null`, `1-99`, reject other values
- Rendering: `number == null` → no number displayed (shape only)
- Goalkeeper detection updated: `isGoalkeeper && number === 1`

**Scope:**
- **Core Types:** `packages/core/src/types.ts` - change `number: number` to `number?: number | null`
- **Core Factory:** `packages/core/src/board.ts` - createPlayer assigns number, but allow override
- **Slice:** `apps/web/src/store/slices/elementsSlice.ts` - validation in `updateSelectedElement()`
- **UI:** `packages/ui/src/RightInspector.tsx` - handle empty input → null
- **Controller:** `apps/web/src/hooks/useTextEditController.ts` - quick-edit validation
- **Rendering:** `packages/board/src/PlayerNode.tsx` - conditional number display

**Data Model Impact & Backward Compatibility:**
- **Breaking Change:** Type signature changes from `number` to `number | null | undefined`
- **Runtime Tolerance:** Existing players have valid numbers, continue working
- **Migration:** NOT NEEDED - existing data is valid subset of new type
- **New Behavior:** Empty number input persisted as `null`, not `0`
- **Goalkeeper Logic:** Update to `el.isGoalkeeper || el.number === 1` (both possible)

**Risk:** MEDIUM - type change affects many files, but backward compatible at runtime

**Why This Way:**
- Optional type is semantically correct (number can be absent)
- `null` is standard TypeScript pattern for "intentionally empty"
- No data migration needed
- Rendering is simple conditional (standard React pattern)

**RULE:**  
`isGoalkeeper` flag always takes precedence over number-based detection.

---

### [BUG-5] Rename Project Cloud Sync

**User Goal:** Changed project name persists after reload

**Problem:**
- `renameProject()` only updates store state
- Does NOT call `markDirty()`
- Autosave never triggers
- Supabase keeps old name → reverts on reload

**Solution:**
- Call `markDirty()` after setState in `renameProject()`
- Autosave will trigger → `saveToCloud()` → Supabase update
- Optional: Show "saving..." indicator during autosave

**Scope:**
- **Hook:** `apps/web/src/hooks/useProjectsController.ts` - add `markDirty()` call
- **Store:** Ensure `documentSlice.markDirty()` → `scheduleAutoSave()` → `performAutoSave()`

**Risk:** VERY LOW - one-line fix

**Why This Way:**
- Leverages existing autosave infrastructure
- Consistent with other document mutations
- No new sync logic needed

---

### [FEAT-1] Default Shape by Team

**User Goal:** Instantly distinguish home/away players by shape (pro standard)

**Current:** Both teams default to circle

**Desired:**
- Home team → Triangle (▲)
- Away team → Circle (●)
- User can override via Inspector/shortcuts

**Solution:**
- Modify `createPlayer()` in core to set `shape` based on `team`
- Default: `team === 'home' ? 'triangle' : 'circle'`
- Existing players unchanged (backward compatible)

**Scope:**
- **Core:** `packages/core/src/board.ts` - conditional shape in `createPlayer()`
- **Presets:** `packages/presets/src/formations.ts` - verify formations respect shape

**Risk:** LOW - only affects new player creation

**Why This Way:**
- Single source of truth (factory function)
- Zero UI changes needed
- Existing shape cycling behavior unchanged

---

### [FEAT-4] Multiline Text (Shift+Enter)

**User Goal:** Add multi-line annotations (tactics descriptions, notes)

**Current:** `<input type="text">` single-line, Enter always saves

**Desired:**
- `<textarea>` for editing
- Enter → save (as before)
- Shift+Enter → new line
- Content stores `\n` characters
- Konva Text renders multiline automatically

**Solution:**
1. Replace `<input>` with `<textarea>` in BoardEditOverlays
2. Update `handleTextKeyDown` to differentiate Enter vs Shift+Enter
3. Style textarea to match existing input (font, size)
4. Konva `<Text>` already supports `\n` - no changes needed

**Scope:**
- **UI:** `apps/web/src/app/board/BoardEditOverlays.tsx` - swap input → textarea
- **Controller:** `apps/web/src/hooks/useTextEditController.ts` - check `e.shiftKey` in handler
- **Rendering:** `packages/board/src/TextNode.tsx` - already supports multiline (no change)

**Risk:** LOW - Konva handles multiline natively

**Why This Way:**
- Minimal change (HTML element swap)
- Native behavior (Shift+Enter = newline)
- No breaking change to data model (string with `\n`)

---

### [FEAT-5] Scale / Resize Selection

**User Goal:** Resize players, groups, equipment for layout adjustments

**Current:** No scaling capability (size is fixed)

**Desired:**
- Scale single element or multi-selection
- Keyboard shortcuts for precise control
- PPM slider for mouse-based scaling
- Scale from centroid (selection center)
- Undo/redo support

**Solution:**

**Architecture:**
- Add `scale?: number` property to scalable element types (Player, Equipment, Zone)
- Default scale = 1.0 (100%), range 0.4 - 2.5 (40%-250%)
- Command-level operation via CommandRegistry
- Intent (live preview) vs Effect (history commit) pattern

**Keyboard:**
- `Option + Cmd + →` → +5% scale
- `Option + Cmd + ←` → -5% scale
- `Option + Cmd + Shift + →` → +10% scale
- `Option + Cmd + Shift + ←` → -10% scale
- No conflict with canvas zoom (canvas uses Cmd+/- without Option)

**PPM (Context Menu):**
- Slider widget "Scale: [====|====] 100%"
- Range: 40% - 250%
- Mixed state: If selection has different scales, show "Mixed"
- Changing slider applies same scale to all selected elements

**Rendering:**
- PlayerNode/EquipmentNode: Apply transform scale to Group
- ZoneNode: Multiply width/height by scale factor
- Scale affects both visual size and interaction bounds

**Scope:**
- **Core Types:** `packages/core/src/types.ts` - add `scale?: number` to PlayerElement, EquipmentElement, ZoneElement
- **Commands:** `apps/web/src/commands/board/intent.ts` - scaleSelection (live)
- **Commands:** `apps/web/src/commands/board/effect.ts` - commitScale (history)
- **Slice:** `apps/web/src/store/slices/elementsSlice.ts` - scaleSelected action
- **Shortcuts:** `apps/web/src/hooks/useKeyboardShortcuts.ts` - Option+Cmd+arrows
- **PPM:** `apps/web/src/utils/canvasContextMenu.ts` - add scale item with slider
- **Rendering:** `packages/board/src/PlayerNode.tsx`, `EquipmentNode.tsx`, `ZoneNode.tsx`

**Edge Cases:**
- Scale < 0.4 → Clamp to 0.4 (prevent invisible elements)
- Scale > 2.5 → Clamp to 2.5 (prevent canvas overflow)
- Multi-select with different scales → Slider shows "Mixed", setting applies to all
- Grouped elements → Scale applies to each member individually (not group transform)

**Risk:** MEDIUM - new property affects rendering, requires careful bounds handling

**Why This Way:**
- Scale as property (not transform) persists in document
- Centroid scaling is intuitive (WYSIWYG)
- Keyboard increments allow precision
- PPM slider for mouse users
- Single undo entry per scale operation

**NOTE:**  
Scale is a visual multiplier applied at render time.  
It does not replace base size properties (radius, fontSize, strokeWidth).  
Scale is applied uniformly and stored as part of element state.

---

### [FEAT-3] Shoot Arrow Type

**User Goal:** Show shooting actions (distinct from passing/running)

**Current:** `ArrowType = 'pass' | 'run'`

**Desired:** Add `'shoot'` type with distinct appearance

**Arrow Visual Standards:**
- **Pass:** Red, solid, standard arrowhead
- **Run:** Blue, solid, standard arrowhead  
- **Shoot:** Orange, thicker stroke, double chevron arrowhead

**Keyboard Shortcut Change (CRITICAL):**
- **S key** = Shoot Arrow (new)
- **Shift+S** = Cycle Shape (moved from S)
- Rationale: Shoot is tactical primary action, shape cycle is secondary formatting

**Solution:**
1. Extend `ArrowType` union to include `'shoot'`
2. Update `createArrow()` to handle shoot defaults (color, stroke, arrowhead)
3. Modify `ArrowNode.tsx` to render double chevron for shoot type
4. Add keyboard shortcut `S` for shoot arrow
5. Move cycle shape to `Shift+S`
6. Update Toolbar, PPM, Command Palette

**Scope:**
- **Core Types:** `packages/core/src/types.ts` - extend `ArrowType`
- **Core Factory:** `packages/core/src/board.ts` - add shoot case in `createArrow()`
- **Canvas:** `packages/board/src/ArrowNode.tsx` - render logic for double chevron
- **Shortcuts:** `apps/web/src/hooks/useKeyboardShortcuts.ts` - S=shoot, Shift+S=cycleShape
- **UI:** Add to Toolbar, update PPM, Command Palette actions

**Risk:** LOW - additive change, shortcut conflict resolved

**Why This Way:**
- Extends discriminated union cleanly
- Visual distinction clear (coaches recognize double chevron = shot)
- S key is mnemonic for Shoot (primary action)
- Shift+S preserves shape cycling (secondary action)
- Fits existing arrow infrastructure

---

### [FEAT-6] Clear All Elements + Confirm

**User Goal:** Quick "start over" without deleting project

**Current:** `C` key clears only drawings, no clear all

**Desired:**
- New action: "Clear All Elements" (removes everything from current step)
- Keyboard: `Shift+C` with confirmation
- Confirm dialog: "Clear entire board? (Undo available)" [Cancel] [Clear]
- Pushes to history (undoable)

**Solution:**
1. Add `clearAllElements()` to elementsSlice
   - Sets `elements: []`
   - Calls `pushHistory()` first
2. Add keyboard handler for `Shift+C`
   - Shows native `confirm()` dialog (lightweight, no modal overhead)
   - If confirmed → call clearAllElements
3. Add to Command Palette (search: "clear all")
4. Optional: Add to Toolbar under "Edit" dropdown

**Scope:**
- **Slice:** `apps/web/src/store/slices/elementsSlice.ts` - new action
- **Shortcuts:** `apps/web/src/hooks/useKeyboardShortcuts.ts` - Shift+C handler
- **Command Palette:** `apps/web/src/commands/commandPalette/createCommandActions.ts`

**Risk:** LOW - uses history stack (undoable)

**Why This Way:**
- Native `confirm()` is zero-friction (no modal fatigue)
- Fits PLG philosophy (one dialog, undoable)
- Keyboard-first (Shift+C)

**SCOPE CLARIFICATION:**  
Clear All affects only elements in the current step.  
Document settings, teams, pitch, and animation steps are untouched.

---

## UX / UI Details

### Player Number Handling

**Behavior:**
- `number: null` or `number: undefined` → No number displayed (shape only)
- `number: 1-99` → Displayed inside player shape
- `number < 1` or `number > 99` → Blocked by validation (reverts to previous)
- Empty input in Inspector/quick-edit → Saves as `null`

**Keyboard:**
- Double-tap player → Quick edit (existing)
- Backspace/Delete all digits → Empty input → Saves as null
- ESC → Cancel edit

**Edge Cases:**
- Goalkeeper detection: `el.isGoalkeeper || el.number === 1` (both conditions)
- Formations: Auto-assign incremental numbers (1-11)
- Numberless players allowed (for tactical diagrams)
- Duplicate numbers: Allowed (coaches often use duplicate numbers)

**Inspector:**
- Empty `<input>` when `number == null`
- Placeholder: "No number" (gray text)
- Typing number 1-99 → Saves immediately on blur/Enter
- Clearing input → Saves as null

---

### Multiline Text Editing

**Behavior:**
- Double-click text → Opens editor with textarea
- **Enter alone** → Save and exit (backward compatible)
- **Shift+Enter** → New line (stays in editor)
- ESC → Cancel (discard changes)
- Click outside → Save (existing behavior)

**Keyboard:**
- All standard textarea navigation (arrows, Home/End, Ctrl+A)
- No conflicts with board shortcuts (editor has focus)

**Rendering:**
- Konva Text wraps automatically (no manual linebreak rendering needed)
- Background rectangle expands with content height

**Edge Cases:**
- Empty text → Displays placeholder rect (existing)
- Very long text → Konva handles (may exceed canvas bounds - document as known limitation)

---

### Scale Selection UX

**Keyboard:**
- **Option + Cmd + →** → Increase scale by 5%
- **Option + Cmd + ←** → Decrease scale by 5%
- **Option + Cmd + Shift + →** → Increase scale by 10%
- **Option + Cmd + Shift + ←** → Decrease scale by 10%
- Toast feedback: "Scaled to 115%"

**PPM (Context Menu):**
- Item: "Scale" with inline slider
- Slider range: 40% - 250%
- Current value display: "100%"
- Mixed selection: Shows "Mixed" instead of value
- Real-time preview as slider moves
- Commits on slider release (single undo)

**Rendering:**
- Scale applied via Konva transform for Players/Equipment
- Scale multiplies width/height for Zones
- Selection bounds update to match scaled size
- Handles remain standard size (easier to grab)

**Edge Cases:**
- Scale 40% → Minimum (still visible, usable)
- Scale 250% → Maximum (prevents overflow)
- Multi-selection → All elements scaled by same factor
- Grouped elements → Each scales individually
- Undo restores previous scale values

---

### Shoot Arrow UX

**Creation:**
- Keyboard: `S` → Creates shoot arrow at cursor
- Toolbar: Click "Shoot Arrow" icon (🎯)
- PPM on empty space: "Add Shoot Arrow"

**Appearance:**
- Color: `#f97316` (orange)
- Stroke: `5px` (thicker than pass/run)
- Arrowhead: Double chevron `>>` instead of single `>`

**Editing:**
- Drag start/end points (existing behavior)
- Alt+↑/↓ → Cycle color (existing)
- Selection shows both control points (existing)

**Shortcut Change:**
- **S** = Shoot Arrow (NEW - primary tactical action)
- **Shift+S** = Cycle Player Shape (MOVED from S)

---

### Clear All Confirmation

**Dialog Text:**
```
Clear entire board?

All elements on this step will be removed.
You can undo this action (Cmd+Z).

[Cancel]  [Clear Board]
```

**Behavior:**
- Native `confirm()` (not custom modal)
- Default focus: Cancel (safety)
- Keyboard: ESC → Cancel, Enter → Confirm
- After clear: Toast "Board cleared (Cmd+Z to undo)"

**Scope:**
- Only affects current step (not other animation steps)
- History stack preserves previous state

---

### Player Color in PPM

**Design Decision:**
- **Player body color** is controlled by Team Settings (home/away primaryColor)
- Individual players do NOT have custom body colors (maintains team identity)

**PPM Options for Player:**
- ✅ "Change Number Color" (cycles `textColor` property)
- ❌ "Change Body Color" (not available - use Team Settings panel)
- ✅ Quick access hint: "Change team color in Settings → Teams"

**Rationale:**
- Team cohesion: All players of same team have same jersey color
- Reduces cognitive load (predictable appearance)
- Professional standard (coaches expect team-based coloring)
- Advanced users can access Team Settings via Inspector → Teams tab

---

## PR Roadmap (Safe Order)

### PR-FIX-1: Player Number Optional (CRITICAL)
**Goal:** Allow players without numbers  
**Files:**
- `packages/core/src/types.ts`
- `packages/core/src/board.ts`
- `apps/web/src/store/slices/elementsSlice.ts`
- `packages/ui/src/RightInspector.tsx`
- `apps/web/src/hooks/useTextEditController.ts`
- `packages/board/src/PlayerNode.tsx`

**DoD:**
- [ ] PlayerElement.number type is `number | null | undefined`
- [ ] Inspector allows empty input → saves as null
- [ ] Quick-edit allows clearing number
- [ ] PlayerNode renders no number when null
- [ ] updateSelectedElement() validates 1-99 or null
- [ ] Existing players unaffected
- [ ] Goalkeeper detection updated
- [ ] Manual test: Empty number input → no number shown

**UX Acceptance:**
- Can create player with no number
- Empty input in Inspector saves as null (not 0)
- No number appears when number is null
- No console errors on player render

---

### PR-FIX-2: Rename Project Cloud Sync
**Goal:** Project name persists in Supabase  
**Files:**
- `apps/web/src/hooks/useProjectsController.ts`

**DoD:**
- [ ] renameProject() calls markDirty()
- [ ] Autosave triggers after rename
- [ ] Manual test: Rename → wait 2s → refresh → name persists

**UX Acceptance:**
- Name changes immediately in UI
- No loading spinner needed (autosave is background)
- Works for both authenticated and guest users (local save)

---

### PR-FEAT-1: Default Shape by Team
**Goal:** Home=triangle, Away=circle on creation  
**Files:**
- `packages/core/src/board.ts`

**DoD:**
- [ ] createPlayer() sets shape based on team
- [ ] Home players default to triangle
- [ ] Away players default to circle
- [ ] Existing players unchanged
- [ ] Shape cycling still works

**UX Acceptance:**
- Add home player (P) → triangle
- Add away player (Shift+P) → circle
- Inspector shape selector works
- Shift+S key cycles shape

---

### PR-FEAT-2: Multiline Text (Shift+Enter)
**Goal:** Multi-line annotations support  
**Files:**
- `apps/web/src/app/board/BoardEditOverlays.tsx`
- `apps/web/src/hooks/useTextEditController.ts`

**DoD:**
- [ ] Editor uses textarea instead of input
- [ ] Enter → save (existing behavior)
- [ ] Shift+Enter → new line
- [ ] Konva renders multiline correctly
- [ ] Styling matches single-line

**UX Acceptance:**
- Double-click text → textarea appears
- Shift+Enter adds line break (stays in editor)
- Enter saves and closes
- Rendered text shows multiple lines

---

### PR-FEAT-3: Shoot Arrow Type
**Goal:** Add shoot arrow with S shortcut  
**Files:**
- `packages/core/src/types.ts`
- `packages/core/src/board.ts`
- `packages/board/src/ArrowNode.tsx`
- `apps/web/src/hooks/useKeyboardShortcuts.ts`
- `apps/web/src/commands/commandPalette/createCommandActions.ts`

**DoD:**
- [ ] ArrowType includes 'shoot'
- [ ] createArrow() handles shoot defaults
- [ ] ArrowNode renders double chevron for shoot
- [ ] S key creates shoot arrow
- [ ] Shift+S cycles player shape (moved)
- [ ] Command Palette includes shoot arrow
- [ ] Toolbar icon added

**UX Acceptance:**
- Press S → shoot arrow appears (orange, thick, double chevron)
- Press Shift+S → selected player shape cycles
- Arrow behaves like pass/run (draggable, editable)
- Command Palette search works

---

### PR-FEAT-4: Scale Selection
**Goal:** Resize elements via keyboard and PPM  
**Files:**
- `packages/core/src/types.ts`
- `apps/web/src/commands/board/intent.ts`
- `apps/web/src/commands/board/effect.ts`
- `apps/web/src/store/slices/elementsSlice.ts`
- `apps/web/src/hooks/useKeyboardShortcuts.ts`
- `apps/web/src/utils/canvasContextMenu.ts`
- `packages/board/src/PlayerNode.tsx`
- `packages/board/src/EquipmentNode.tsx`
- `packages/board/src/ZoneNode.tsx`

**DoD:**
- [ ] scale property added to Player, Equipment, Zone types
- [ ] Option+Cmd+arrows scale selection
- [ ] PPM shows scale slider (40%-250%)
- [ ] Rendering applies scale transform
- [ ] Clamping prevents < 40% or > 250%
- [ ] Single undo per scale operation
- [ ] Mixed selection shows "Mixed" in slider

**UX Acceptance:**
- Option+Cmd+→ increases scale by 5%
- Option+Cmd+Shift+→ increases scale by 10%
- PPM slider adjusts scale in real-time
- Undo restores previous scale
- Multi-select scales all elements uniformly

---

### PR-FEAT-5: Clear All + Confirm
**Goal:** Safe board reset with undo  
**Files:**
- `apps/web/src/store/slices/elementsSlice.ts`
- `apps/web/src/hooks/useKeyboardShortcuts.ts`
- `apps/web/src/commands/commandPalette/createCommandActions.ts`

**DoD:**
- [ ] clearAllElements() action in slice
- [ ] Shift+C triggers confirm → clear
- [ ] History pushed before clear (undo works)
- [ ] Command Palette includes action
- [ ] Toast feedback after clear

**UX Acceptance:**
- Shift+C → native confirm dialog
- Click "Clear" → board empty
- Cmd+Z → elements restored
- Works on current step only

---

## Quality Checklist

### Manual Tests (Critical Paths)

**Player Management:**
- [ ] Add home player → triangle by default
- [ ] Add away player → circle by default
- [ ] Create player with no number → shape only shown
- [ ] Clear number in Inspector → saves as null
- [ ] Try to set player number to 100 → blocked
- [ ] Inspector: Empty number input → placeholder "No number"
- [ ] Quick edit (double-tap) → clearing works
- [ ] Goalkeeper with number=1 detected correctly
- [ ] Goalkeeper with isGoalkeeper flag works

**Text Editing:**
- [ ] Double-click text → textarea appears
- [ ] Shift+Enter → adds line, stays in editor
- [ ] Enter → saves and closes
- [ ] Multiline renders correctly on canvas
- [ ] Long text doesn't break layout

**Arrows:**
- [ ] Press A → pass arrow (red)
- [ ] Press R → run arrow (blue)
- [ ] Press S → shoot arrow (orange, double chevron)
- [ ] Shift+S → cycles player shape
- [ ] All arrow types draggable
- [ ] Alt+↑/↓ cycles colors

**Scaling:**
- [ ] Option+Cmd+→ scales up by 5%
- [ ] Option+Cmd+← scales down by 5%
- [ ] Option+Cmd+Shift+arrows scale by 10%
- [ ] PPM slider scales selection
- [ ] Multi-select scales uniformly
- [ ] Scale < 40% clamped
- [ ] Scale > 250% clamped
- [ ] Undo restores previous scale

**Project Sync:**
- [ ] Rename project → wait 2s
- [ ] Refresh page → name persists
- [ ] Works for cloud projects (authenticated)
- [ ] Works for local projects (guest)

**Clear All:**
- [ ] Shift+C → confirm dialog appears
- [ ] Cancel → no action
- [ ] Confirm → board clears
- [ ] Cmd+Z → elements restored
- [ ] History stack correct

### Regression Prevention (DO NOT BREAK)

**Core Workflows:**
- [ ] Undo/Redo works for all changes
- [ ] Autosave triggers after mutations (2s debounce)
- [ ] Keyboard shortcuts: P, B, A, R, Z, T, S, Shift+S
- [ ] Inspector updates reflect immediately
- [ ] PPM shows correct context actions
- [ ] Command Palette (Cmd+K) works

**Animation Module:**
- [ ] Steps playback unaffected
- [ ] Step thumbnails render
- [ ] Clear All only affects current step
- [ ] Interpolation between steps works

**Canvas Rendering:**
- [ ] Player nodes with null number render
- [ ] Multiline text doesn't overflow stage
- [ ] Shoot arrows render double chevron
- [ ] Scaled elements render correctly
- [ ] Selection handles work for all elements
- [ ] Zoom/pan doesn't break positioning

**Persistence:**
- [ ] Local save works (localStorage)
- [ ] Cloud save works (Supabase)
- [ ] Project list updates after changes
- [ ] Folders and favorites unaffected
- [ ] Optional number field serializes correctly

**Edge Cases:**
- [ ] Empty board state (no elements)
- [ ] Large boards (100+ elements)
- [ ] Rapid keyboard input (no race conditions)
- [ ] Offline mode (autosave fails gracefully)
- [ ] Guest vs authenticated user parity
- [ ] Players without numbers in formations
- [ ] Scale at extreme values (40%, 250%)

---

## Execution Notes

### Dependencies
- PR-FIX-1 and PR-FIX-2 are independent (can be parallel)
- PR-FEAT-1 should come after PR-FIX-1 (uses createPlayer)
- PR-FEAT-2 is independent
- PR-FEAT-3 is independent but needs keyboard conflict resolution
- PR-FEAT-4 is independent
- PR-FEAT-5 is independent
- **Recommended order:** Bugfixes first, then features in any order

### Testing Strategy
- Unit tests: Validation logic in elementsSlice
- Integration tests: Autosave flow for rename, scale with undo
- Manual tests: All items in Quality Checklist
- Browser tests: Chrome, Safari, Firefox
- Type checking: Ensure optional number doesn't break existing code

### Rollout Safety
- Feature flags not needed (all changes are additive or fixes)
- Backward compatible (no migration needed)
- Incremental deployment (PR-by-PR)
- Type changes are non-breaking at runtime

### Documentation Updates
- Update keyboard shortcuts cheat sheet (S → shoot, Shift+S → shape)
- Add shoot arrow to docs
- Document number=null behavior
- Document scale ranges and shortcuts
- Update PPM capabilities

---

## Final Validation

**Can this plan be executed without chaos?** ✅  
- Small, focused PRs
- Clear DoD for each
- No breaking changes at runtime
- Leverages existing infrastructure
- Keyboard shortcuts resolved (no conflicts)

**Will it cause regressions?** ❌  
- All changes are isolated
- Backward compatible (optional number works with existing data)
- History/undo preserved for all new actions
- Quality checklist comprehensive

**Does it betray product philosophy?** ❌  
- Keyboard-first maintained (all new features have shortcuts)
- No dark patterns (single confirm, undoable)
- Coach-grade standards (professional defaults, forgiving input)
- PLG-friendly (zero friction, optional fields)

**Is it ready to hand off to team?** ✅  
- Self-contained blueprint
- All files identified
- UX specs detailed
- Quality criteria defined
- Architectural decisions explained

---

**Status:** READY FOR EXECUTION  
**Estimated Effort:** 4-5 sprint days (all PRs)  
**Risk Level:** LOW-MEDIUM (type change in PR-FIX-1, otherwise low)
