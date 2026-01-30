# Stages 1-3 — Comprehensive Test Scenario

**Data:** 2026-01-30  
**Wersja:** 1.0  
**Czas:** ~30 minut (pełny scenariusz)

---

## Quick Reference

**5-Minute Smoke Test:** Zobacz `STAGE_3_RELEASE_PATH.md`  
**Full Test:** Ten dokument (30 min, wszystkie stage'y)

---

## STAGE 1: HOTFIXES (15 min)

### B1 — Rename UI Wiring ⚙️

**Cel:** Weryfikacja, że rename działa po zalogowaniu

**Setup:**
1. Otwórz localhost:3000
2. Zaloguj się (jeśli jeszcze nie)
3. Otwórz/stwórz projekt

**Test Steps:**
```
1. Click project name in TopBar
   → Pole edycji się pojawia ✓

2. Type new name "Test Drill Alpha"
   → Tekst wpisuje się normalnie ✓

3. Press Enter
   → TopBar pokazuje nową nazwę "Test Drill Alpha" ✓
   → Pole edycji jest nadal dostępne (nie znika) ✓

4. Open Network tab (F12)
5. Rename again to "Test Drill Beta"
   → Autosave trigger ~1.5s później ✓
   → markDirty() wywołane ✓

6. Refresh page
   → Nazwa "Test Drill Beta" się zachowuje ✓
```

**Expected:**
- ✅ Rename działa natychmiast
- ✅ TopBar pokazuje nową nazwę
- ✅ Autosave triggeruje po 1.5s
- ✅ Single source of truth (document.name)

**Red Flags:**
- ❌ Rename nie działa
- ❌ TopBar nie aktualizuje się
- ❌ TypeError w console

---

### B2 — Resize Render Layer + Hit Area ⚙️

**Cel:** Weryfikacja, że resize gracza działa wizualnie i interaktywnie

**Test Steps:**
```
1. Add player (P key) → place on pitch
   → Default size (radius ~18px) ✓

2. Select player → Option+Cmd + (3 times)
   → Player grows visibly ✓
   → Hit area matches visual size ✓

3. Click slightly outside old bounds
   → Player still selects (hit area expanded) ✓

4. Option+Cmd - (5 times) → resize to ~40%
   → Player shrinks ✓

5. Click old bounds (outside new size)
   → Player does NOT select (hit area correct) ✓

6. Test all shapes:
   - Circle (default)
   - Square (Q key)
   - Triangle (W key)
   - Diamond (E key)
   → All shapes resize correctly ✓
   → Hit areas match visual size ✓

7. Cmd+Z (undo resize)
   → Player returns to previous size ✓
```

**Expected:**
- ✅ Visual size matches `radius` property
- ✅ Hit area matches visual size
- ✅ All 4 shapes work correctly
- ✅ Undo/redo works

**Red Flags:**
- ❌ Player doesn't resize visually
- ❌ Hit area mismatch (clicking off but selects)
- ❌ Shapes render at wrong size

---

### U1 — Diamond Shape Offset ⚙️

**Cel:** Diamond shape renderuje się centered

**Test Steps:**
```
1. Add player (P) → select
2. Change to diamond (E key)
   → Diamond centered on position ✓
   → NOT offset diagonally ✓

3. Move diamond around pitch
   → Cursor aligns with center ✓

4. Rotate diamond (R key or bracket keys)
   → Rotates around center point ✓
   → No wobbling or offset ✓

5. Resize diamond
   → Grows/shrinks from center ✓
```

**Expected:**
- ✅ Diamond centered on player position
- ✅ No diagonal offset
- ✅ Rotation smooth

**Red Flags:**
- ❌ Diamond offset from cursor
- ❌ Rotation wobbles
- ❌ Grows from corner

---

### B4 — Clear (C) Feedback ⚙️

**Cel:** Toast pokazuje faktyczny stan (ile drawings cleared)

**Test Steps:**
```
1. Empty pitch → Press C
   → Toast: "No drawings to clear" ✓
   → No history entry ✓

2. Press D (drawing mode) → draw 3 freehand lines
   → 3 drawings on pitch ✓

3. Press C
   → Toast: "3 drawings cleared • Undo: Cmd+Z" ✓
   → All drawings znikają ✓

4. Press Cmd+Z
   → 3 drawings wracają ✓

5. Draw 1 more drawing (total 4)
6. Press C
   → Toast: "4 drawings cleared • Undo: Cmd+Z" ✓

7. Draw 1 drawing → Press C
   → Toast: "1 drawing cleared • Undo: Cmd+Z" ✓
   → (singular form) ✓
```

**Expected:**
- ✅ Count correct (0, 1, 2+)
- ✅ Singular/plural grammar
- ✅ Undo works

**Red Flags:**
- ❌ Shows "cleared" when nothing to clear
- ❌ Wrong count
- ❌ Undo doesn't restore

---

### B5 — PPM Resize Slider ⚙️

**Cel:** Right-click menu ma "Resize..." z live preview slider

**Test Steps:**
```
1. Add player (P) → place
2. Right-click on player
   → Context menu shows "Resize..." ✓
   → Shortcut hint: "Opt+Cmd +/-" ✓

3. Click "Resize..."
   → Popover/modal opens ✓
   → Slider range: 40%–250% ✓
   → Current: 100% (default) ✓

4. Drag slider to 200%
   → Live preview (player grows instantly) ✓
   → No history spam (no undo entries yet) ✓

5. Drag slider to 50%
   → Live preview (player shrinks instantly) ✓

6. Drag slider to 150% → Release/Close popover
   → Single history entry created ✓
   → Player stays at 150% ✓

7. Cmd+Z
   → Player returns to 100% (entire resize = 1 undo) ✓

8. Select 3 players with SAME radius (all 100%)
9. Right-click → Resize → Slider shows 100%
   → NOT "Mixed" ✓

10. Select 3 players with DIFFERENT radii (100%, 150%, 200%)
11. Right-click → Resize
    → Slider shows "Mixed" indicator ✓
    → Slider positioned at average (~150%) ✓

12. Drag to 200% → Close
    → All 3 players become 200% (absolute, not relative) ✓

13. Click "Reset to 100%" button
    → All selected players → 100% ✓
```

**Expected:**
- ✅ Context menu item present
- ✅ Live preview works
- ✅ Single undo entry
- ✅ Mixed state shows correctly
- ✅ Absolute scaling (not relative)

**Red Flags:**
- ❌ No "Resize..." in context menu
- ❌ Multiple undo entries per slider drag
- ❌ Mixed state calculates wrong

---

## STAGE 2: PITCH OVERLAY GOALS (5 min)

### Pitch Goals Rendering ⚙️

**Cel:** Goals widoczne na pitch overlay (non-interactive)

**Test Steps:**
```
1. Full pitch view (default)
   → 2 goals visible (left + right ends) ✓
   → U-shaped posts + crossbar ✓
   → 2 diagonal net depth lines (subtle, opacity 0.3) ✓

2. Press O (portrait orientation)
   → Goals rotate correctly (top + bottom) ✓
   → Still 2 goals ✓

3. Press V (cycle pitch view) until 'plain'
   → Goals HIDDEN (plain view = no decorations) ✓

4. Press V back to 'full'
   → Goals reappear ✓

5. Zoom in/out (Cmd +/-)
   → Goals scale correctly with pitch ✓
   → No flickering or misalignment ✓

6. Half-pitch view (if available)
   → Only 1 goal shows (defending end) ✓

7. Click on goal post
   → Click passes through (no selection) ✓
   → Can select player underneath ✓

8. Settings → Pitch → Theme (change to 'indoor', 'chalk', etc.)
   → Goals visible in all themes ✓
```

**Expected:**
- ✅ 2 goals (full) or 1 goal (half) or 0 goals (plain)
- ✅ Non-interactive (listening={false})
- ✅ Scales with pitch
- ✅ Visible in all themes

**Red Flags:**
- ❌ Goals not visible
- ❌ Goals selectable (captures clicks)
- ❌ Goals don't scale with zoom
- ❌ Performance drop (check FPS)

---

## STAGE 3: DRILLS & POLISH (10 min)

### 3.1 — Goal Equipment Visual ⚙️

**Cel:** Goal equipment ma net grid pattern

**Test Steps:**
```
1. Press J → place goal
   → U-shaped frame visible ✓
   → Net grid visible (6 vertical + 4 horizontal lines) ✓
   → Back bar visible (depth suggestion) ✓
   → Professional appearance ✓

2. Press Shift+J → place mini goal
   → Smaller than standard goal ✓
   → Net grid proportionally smaller ✓

3. Zoom in (Cmd +) → inspect net grid
   → Lines crisp, no aliasing ✓
   → Grid pattern clear ✓

4. Select goal → [ (rotate)
   → Net grid rotates with frame ✓
   → No visual glitches ✓

5. Select goal → Alt+Up (change color)
   → Net grid changes color ✓
   → Opacity maintained (0.3–0.5) ✓

6. Zoom out → zoom in (stress test)
   → No flickering or performance drop ✓
```

**Expected:**
- ✅ Net grid visible and clear
- ✅ Mini goal smaller
- ✅ Rotation/color work
- ✅ Performance good

**Red Flags:**
- ❌ Net grid not visible
- ❌ Mini goal same size as standard
- ❌ Flickering at different zoom levels

---

### 3.2 — Shoot Arrow Visual ⚙️

**Cel:** Shoot arrow = 2 parallel lines + 1 arrowhead

**Test Steps:**
```
1. Press S → draw long shoot arrow (~200px)
   → 2 parallel orange lines visible ✓
   → 1 arrowhead at end ✓
   → NOT 3 lines or 2 arrowheads ✓

2. Visual check: ══════━►
   → Correct appearance ✓

3. Draw short shoot arrow (< 10px)
   → Fallback: single center line + arrowhead ✓
   → No malformed rendering ✓

4. Draw diagonal shoot arrow (45°)
   → 2 parallel lines maintain spacing ✓
   → Arrowhead oriented correctly ✓

5. Select shoot arrow → drag start endpoint
   → Lines follow correctly ✓
   → Parallel spacing maintained ✓

6. Select shoot arrow → drag end endpoint
   → Arrowhead moves ✓
   → Lines update ✓

7. Compare with other arrows:
   - P (pass): blue, single line, arrowhead ✓
   - R (run): orange, dashed line, arrowhead ✓
   - S (shoot): orange, double line, arrowhead ✓

8. Delete shoot arrow → Cmd+Z
   → Arrow restores correctly ✓
```

**Expected:**
- ✅ Double parallel lines (not triple)
- ✅ Single arrowhead
- ✅ Short arrow fallback works
- ✅ Drag/rotate works

**Red Flags:**
- ❌ Triple lines (old bug)
- ❌ Double arrowheads
- ❌ Short arrows malformed
- ❌ Endpoint drag broken

---

## REGRESSION TESTS (General) (5 min)

### Core Functionality

```
✓ Undo/Redo (Cmd+Z / Cmd+Shift+Z) works across all operations
✓ Autosave triggers after operations (~1.5s debounce)
✓ Copy/Paste (Cmd+C / Cmd+V) works
✓ Delete (Backspace) works
✓ Multi-select (Shift+Click) works
✓ Marquee select (M key + drag) works
✓ Group/Ungroup (Cmd+G / Cmd+Shift+G) works
✓ Bring to front/back works
✓ Color picker works
✓ No console errors
✓ No performance regression (FPS stable)
```

---

## TEST MATRIX

| Feature | Stage | Priority | Time | Status |
|---------|-------|----------|------|--------|
| B1 Rename | 1 | HIGH | 2 min | [ ] |
| B2 Resize | 1 | HIGH | 3 min | [ ] |
| U1 Diamond | 1 | MEDIUM | 2 min | [ ] |
| B4 Clear | 1 | MEDIUM | 2 min | [ ] |
| B5 PPM Resize | 1 | HIGH | 6 min | [ ] |
| Pitch Goals | 2 | HIGH | 5 min | [ ] |
| Goal Equipment | 3 | MEDIUM | 5 min | [ ] |
| Shoot Arrow | 3 | MEDIUM | 5 min | [ ] |
| Regression | - | HIGH | 5 min | [ ] |

**Total:** ~35 minut (z marginesem)

---

## SMOKE TEST vs FULL TEST

### 5-Minute Smoke Test (Green Light)
- Goal equipment: J → net visible
- Shoot arrow: S → double lines
- Quick regression: P, R work
- **Purpose:** Quick sanity check przed merge

### 30-Minute Full Test (Comprehensive)
- All Stage 1 features (B1, B2, U1, B4, B5)
- All Stage 2 features (pitch goals)
- All Stage 3 features (goal equipment, shoot arrow)
- Regression tests
- **Purpose:** Pre-release validation

---

## WHEN TO RUN

**Smoke Test (5 min):**
- Before każdego PR merge
- After każdej hotfix
- Quick developer verification

**Full Test (30 min):**
- Before major release
- After completing full stage
- Weekly regression check
- Before showing to users/coaches

---

## BUG REPORTING TEMPLATE

Jeśli znajdziesz bug:

```markdown
## Bug Report

**Feature:** [B1 Rename / B2 Resize / etc.]
**Stage:** [1 / 2 / 3]
**Severity:** [CRITICAL / HIGH / MEDIUM / LOW]

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected:**
...

**Actual:**
...

**Screenshot/Video:**
[attach if possible]

**Console Errors:**
[paste from F12 Console]

**Environment:**
- Browser: Chrome/Safari/Firefox
- OS: macOS/Windows/Linux
- Localhost: yes/no
```

---

## SUCCESS CRITERIA

### Stage 1 ✅ gdy:
- [ ] All 5 hotfixes work (B1, B2, U1, B4, B5)
- [ ] No console errors
- [ ] No regressions
- [ ] Undo/redo works

### Stage 2 ✅ gdy:
- [ ] Pitch goals visible
- [ ] Non-interactive (click-through)
- [ ] Scales correctly
- [ ] No performance impact

### Stage 3 ✅ gdy:
- [ ] Goal equipment has net grid
- [ ] Shoot arrow = double lines
- [ ] All interactions work
- [ ] No visual glitches

### Overall ✅ gdy:
- [ ] All stages pass
- [ ] No regressions
- [ ] Performance maintained
- [ ] User feedback positive

---

**Status:** Ready for testing
**Next:** Run smoke test → then full test → then release
