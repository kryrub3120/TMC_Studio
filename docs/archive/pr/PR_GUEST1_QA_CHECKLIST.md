# PR-GUEST1 Manual QA Checklist
## Guest Mode First — WelcomeOverlay Removed

**PR Status:** ✅ IMPLEMENTED  
**Commit:** Pending  
**Date:** 2026-01-11

---

## ✅ Code Verification

### Search Results (Must be 0)
- [x] `WelcomeOverlay` → **0 results** (component deleted)
- [x] `welcomeVisible` → **0 results** (state removed)
- [x] `tmc-visited` → **0 results** (localStorage cleaned)

### TypeCheck Status
- [x] **PASS** — Only pre-existing errors in PitchPanel.tsx (unrelated)
- [x] No new TypeScript errors introduced

### Files Modified
- [x] `packages/ui/src/WelcomeOverlay.tsx` — **DELETED** (167 lines)
- [x] `packages/ui/src/index.ts` — Export removed
- [x] `apps/web/src/App.tsx` — Import, state, JSX removed; ShortcutsHint enabled

---

## 🧪 Manual Testing Required

### Test 1: Guest User — First Visit (Incognito)

**Setup:**
1. Open browser in incognito/private mode
2. Clear localStorage: `localStorage.clear()`
3. Navigate to app

**Expected Behavior:**
- [ ] ✅ **NO WelcomeOverlay appears**
- [ ] ✅ Canvas is visible immediately (no blocking overlay)
- [ ] ✅ EmptyStateOverlay shows (if canvas empty)
- [ ] ✅ ShortcutsHint appears (bottom-right, auto-dismiss after 3s)
- [ ] ✅ TopBar shows `?` for user avatar
- [ ] ✅ All UI elements rendered correctly

**Actions to Test:**
- [ ] ✅ Can click EmptyState "Add Player" → Player appears
- [ ] ✅ Can press `P` keyboard shortcut → Player appears
- [ ] ✅ Can press `B` → Ball appears
- [ ] ✅ Can press `Cmd+K` → Command Palette opens
- [ ] ✅ Can click account button → AuthModal opens

---

### Test 2: Guest User — Interactions

**Expected Behavior:**
- [ ] ✅ Can add elements via keyboard shortcuts (P, B, A, R, Z, T)
- [ ] ✅ Can drag elements
- [ ] ✅ Can select elements
- [ ] ✅ Can undo/redo (Cmd+Z / Shift+Cmd+Z)
- [ ] ✅ Can export PNG (Cmd+E)
- [ ] ✅ Can export GIF (if 2+ steps)
- [ ] ✅ Can export PDF
- [ ] ✅ Inspector works (toggle with `I`)
- [ ] ✅ CheatSheet opens (press `?`)
- [ ] ✅ Local save works (Cmd+S → "Saved locally" toast)

---

### Test 3: Guest User — Repeat Visit

**Setup:**
1. Close browser (still incognito)
2. Reopen to same URL

**Expected Behavior:**
- [ ] ✅ **NO WelcomeOverlay**
- [ ] ✅ **NO ShortcutsHint** (already seen, persisted)
- [ ] ✅ EmptyStateOverlay still shows (if canvas empty)
- [ ] ✅ Canvas visible immediately

---

### Test 4: Authenticated User — NO REGRESSION

**Setup:**
1. Sign in via AuthModal
2. Reload page

**Expected Behavior:**
- [ ] ✅ **NO WelcomeOverlay** (never shows for any user)
- [ ] ✅ ShortcutsHint appears (first time only after login)
- [ ] ✅ EmptyStateOverlay shows when canvas empty
- [ ] ✅ CheatSheet still defaults to closed (PR-UX1 ✓)
- [ ] ✅ Inspector behaves correctly (PR-UX3 ✓)
  - Desktop (xl): Sidebar pushes layout
  - <xl: Drawer overlay
- [ ] ✅ Cloud sync works (Cmd+S → "Saved to cloud ☁️")
- [ ] ✅ Projects drawer works
- [ ] ✅ All auth features work (settings, billing, etc.)

---

### Test 5: PR-UX Regression Check

**PR-UX1** (fa1d5a0):
- [ ] ✅ CheatSheet closed on load
- [ ] ✅ ShortcutsHint appears once (3s auto-dismiss)

**PR-UX2** (57298e7):
- [ ] ✅ EmptyStateOverlay shows when elements.length === 0
- [ ] ✅ No overlays block canvas clicks

**PR-UX3** (9d51ae1):
- [ ] ✅ Inspector drawer (xl sidebar, <xl overlay)
- [ ] ✅ Inspector toggle button in TopBar (<xl only)
- [ ] ✅ No layout regressions

---

## 📊 Expected Results Summary

### Guest Experience
✅ **BEFORE PR-GUEST1:**
- Full-screen WelcomeOverlay blocks app
- Must click "Try without account" to dismiss
- Marketing friction before value

✅ **AFTER PR-GUEST1:**
- Land directly in app (0s to value)
- EmptyStateOverlay guides first interaction
- ShortcutsHint (one-time, non-blocking)
- Immediate access to full tool

### Authenticated Experience
✅ **NO CHANGE:**
- Same behavior as before
- Cloud sync works
- All features available

---

## 🚨 Known Issues / Exclusions

**Out of Scope for PR-GUEST1:**
- ❌ Soft signup prompts (deferred)
- ❌ Guest feature limits (all features unlocked)
- ❌ Marketing content (deleted, not replaced)

**Pre-Existing Issues (Unrelated):**
- ⚠️ `PitchPanel.tsx` — Unused imports (technical debt)

---

## ✅ Sign-Off

**QA Tester:** _________________  
**Date:** _________________  
**Result:** ☐ PASS  ☐ FAIL  

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## 🎯 Commit Approval

Once QA passes, commit with:

```bash
git add .
git commit -m "feat(guest): PR-GUEST1 - Remove WelcomeOverlay (Guest Mode First)

BREAKING: Unauthenticated users now land directly in the app

Changes:
- DELETE WelcomeOverlay component (167 lines)
- REMOVE welcomeVisible state and tmc-visited localStorage
- ENABLE ShortcutsHint for guest users (remove auth gate)
- REMOVE all WelcomeOverlay imports and usages

Impact:
- Guest users see app immediately (0s time to value)
- EmptyStateOverlay is the first-time guidance
- No marketing walls or signup prompts before value
- Logged-in users: NO CHANGE (behavior preserved)

Tested:
- Guest first visit → EmptyState + ShortcutsHint ✓
- Guest can use full app (except cloud sync) ✓
- Logged-in behavior unchanged ✓
- PR-UX1/UX2/UX3 regressions: NONE ✓
"
```
