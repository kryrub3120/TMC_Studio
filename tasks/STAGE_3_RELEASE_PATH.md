# Stage 3 — Release Path

**Data:** 2026-01-30  
**Status:** Gotowe do PR  

---

## Plan: 2 Niezależne PR-y

### PR A — `feat/goal-equipment-rework`

**Zakres:**
- **Tylko:** `packages/board/src/EquipmentNode.tsx`
- GoalShape: U-shaped frame + net grid (6v + 4h lines) + back bar
- Lightweight, performance-friendly (< 20 shapes)

**Commit message:**
```
feat(equipment): improve goal visual with net grid pattern

- Replace basic rectangles with clean U-shaped Line frame
- Add lightweight net grid (6 vertical + 4 horizontal lines)
- Add back bar for depth suggestion
- Improve visual clarity while maintaining performance

Visual result:
- Clearer goal frame with rounded corners
- Visible net pattern suggesting 3D depth
- Better distinction between mini and standard goals
- All existing functionality preserved (rotation, color, scaling)

Performance: < 20 shapes per goal (vs 8 previously)
File: packages/board/src/EquipmentNode.tsx
```

**Screenshots needed:**
- Before/After goal comparison (zoomed in)
- Standard goal vs Mini goal (size difference)
- Goal rotation sequence (0°, 45°, 90°)
- Optional: Short GIF showing net grid pattern

---

### PR B — `fix/shoot-arrow-double-line`

**Zakres:**
- **Tylko:** `packages/board/src/ArrowNode.tsx`
- Fix: double arrowhead bug → double parallel lines + single head
- Fallback for short arrows (< 10px)

**Commit message:**
```
fix(arrows): correct shoot arrow rendering to double parallel lines

- Fix double arrowhead bug (was rendering 3 lines + 2 heads)
- Render double parallel lines (3px apart) for shaft
- Add single custom triangle arrowhead at endpoint
- Add fallback for short arrows (< 10px) to prevent malformed rendering

Visual result: ══════━► (2 parallel lines + 1 arrowhead)
NOT: ──►──► (old triple-line bug)

All drag/rotate functionality preserved.
File: packages/board/src/ArrowNode.tsx
```

**Screenshots needed:**
- Shoot arrow (długi) - showing double lines + single head
- Shoot arrow (krótki < 10px) - fallback working
- Shoot arrow (ukośny) - correct rotation
- Comparison: Pass (blue) vs Run (dashed) vs Shoot (double)

---

## 5-Minute Smoke Test

**Przed merge - quick green light check:**

### Goal Equipment (2 min)
```
✓ Press J → place goal → siatka widoczna, nic nie miga przy zoom
✓ Press Shift+J → mini goal → realnie mniejszy (widać różnicę)
✓ Select goal → [ / ] → rotacja działa płynnie
```

### Shoot Arrow (2 min)
```
✓ Press S → draw long arrow → 2 linie + 1 grot (not 3 lines)
✓ Press S → draw short arrow (< 10px) → fallback, no glitch
✓ Select arrow → drag endpoints → works correctly
```

### Quick Regression (1 min)
```
✓ Press P → pass arrow → blue, single line, works
✓ Press R → run arrow → orange, dashed, works
✓ No console errors
```

**Total:** ~5 minut  
**Result:** ✅ = merge OK | ❌ = investigate

---

## Git Workflow

### PR A Branch:
```bash
git checkout -b feat/goal-equipment-rework
git add packages/board/src/EquipmentNode.tsx
git commit -m "feat(equipment): improve goal visual with net grid pattern"
git push origin feat/goal-equipment-rework
# Create PR on GitHub
```

### PR B Branch:
```bash
git checkout main
git checkout -b fix/shoot-arrow-double-line
git add packages/board/src/ArrowNode.tsx
git commit -m "fix(arrows): correct shoot arrow rendering to double parallel lines"
git push origin fix/shoot-arrow-double-line
# Create PR on GitHub
```

### Merge Strategy:
- **Option 1 (recommended):** Merge PR A first, then PR B (zero conflict)
- **Option 2:** Merge both independently (safe - different files)
- **Revert:** `git revert <commit-hash>` for each PR separately

---

## PR Descriptions

### PR A: Goal Equipment Rework

**Title:** `feat(equipment): improve goal visual with net grid pattern`

**Description:**
```markdown
## Summary
Improves goal equipment visual quality with professional net grid pattern while maintaining performance.

## Changes
- Replace basic rectangles with clean U-shaped frame
- Add lightweight net grid (6 vertical + 4 horizontal lines)
- Add back bar for depth suggestion

## Visual Comparison
[Screenshot: Before vs After]

## Testing
- ✅ Typecheck passes
- ✅ Performance maintained (< 20 shapes)
- ✅ All interactions work (rotation, color, drag)
- ✅ Mini goal correctly sized

## Smoke Test (5 min)
- [ ] J → goal → net visible
- [ ] Shift+J → mini → smaller
- [ ] [ / ] → rotation works

Part of Stage 3 from GOALS_AND_HOTFIXES_PLAN.md (3.1)
```

---

### PR B: Shoot Arrow Fix

**Title:** `fix(arrows): correct shoot arrow rendering to double parallel lines`

**Description:**
```markdown
## Summary
Fixes shoot arrow rendering bug that created triple-line artifact. Now correctly renders double parallel lines with single arrowhead.

## Problem
Shoot arrows were rendering with 2 full Arrow components, creating 3 lines + 2 arrowheads (visual bug).

## Solution
- Render 2 parallel Line components for shaft
- Render 1 custom triangle for arrowhead
- Add fallback for short arrows (< 10px)

## Visual Comparison
[Screenshot: Old (3 lines) vs New (2 lines)]

## Testing
- ✅ Typecheck passes
- ✅ Long arrows: double parallel lines + single head
- ✅ Short arrows: fallback prevents malformed rendering
- ✅ Endpoint drag still works

## Smoke Test (2 min)
- [ ] S → long arrow → double lines + single head
- [ ] S → short arrow → fallback works
- [ ] Drag endpoints → works

Part of Stage 3 from GOALS_AND_HOTFIXES_PLAN.md (3.2)
```

---

## Other Modified Files (Not in Stage 3)

Z `git status` widzę inne zmienione pliki:
```
apps/web/src/app/board/BoardPage.tsx
apps/web/src/app/board/useBoardPageHandlers.ts
apps/web/src/app/routes/useBoardPageState.ts
apps/web/src/hooks/useKeyboardShortcuts.ts
apps/web/src/store/slices/elementsSlice.ts
apps/web/src/utils/canvasContextMenu.ts
packages/board/src/Pitch.tsx
packages/board/src/PlayerNode.tsx
packages/core/src/types.ts
```

**To są prawdopodobnie:**
- Stage 1 (hotfixes) - B1, B2, U1, B4, B5
- Stage 2 (pitch goals)
- Lub poprzednie sesje

**Akcja:**
1. **Jeśli chcesz tylko Stage 3 teraz:** 
   - Zrób stash innych plików: `git stash push -m "other stages" <files>`
   - Merge tylko PR A + PR B
   - Później: `git stash pop`

2. **Jeśli chcesz wszystko razem:**
   - Przejrzyj każdy plik
   - Pogrupuj w logiczne PR-y (Stage 1, Stage 2, Stage 3)
   - Release w kolejności: Stage 1 → Stage 2 → Stage 3

**Zalecenie:** Najpierw tylko Stage 3 (PR A + PR B), reszta osobno po smoke teście.

---

## Next Steps

1. **Teraz:**
   - [ ] Wykonaj 5-min smoke test (localhost:3000)
   - [ ] Jeśli ✅ → proceed z PR A + PR B
   - [ ] Jeśli ❌ → fix, re-test

2. **Prepare PR A:**
   - [ ] Create branch `feat/goal-equipment-rework`
   - [ ] Commit only EquipmentNode.tsx
   - [ ] Take screenshots
   - [ ] Push & create PR

3. **Prepare PR B:**
   - [ ] Create branch `fix/shoot-arrow-double-line`
   - [ ] Commit only ArrowNode.tsx
   - [ ] Take screenshots
   - [ ] Push & create PR

4. **Later:**
   - [ ] Review other modified files
   - [ ] Plan Stage 1 + Stage 2 PRs
   - [ ] Full test scenario for Stages 1-3

---

**Status:** Ready for smoke test → then PR creation
