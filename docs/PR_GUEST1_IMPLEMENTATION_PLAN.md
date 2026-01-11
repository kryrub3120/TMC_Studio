# PR-GUEST1 Implementation Plan
## Guest Mode First — Remove Marketing Barrier

**Status:** Planning  
**Created:** 2026-01-11  
**Goal:** Remove WelcomeOverlay and enable direct app access for unauthenticated users

---

## 🎯 Objectives

### Primary
- **Remove** WelcomeOverlay completely from the codebase
- **Enable** guest users to land directly in the app
- **Ensure** EmptyStateOverlay is the first-time guidance

### Secondary
- Enable ShortcutsHint for guest users
- Clean up unused localStorage logic
- Maintain all existing logged-in behavior

---

## 📋 Current State Analysis

### Files to Modify/Delete

1. **DELETE:** `packages/ui/src/WelcomeOverlay.tsx` (entire file)
2. **MODIFY:** `apps/web/src/App.tsx` (remove WelcomeOverlay usage)
3. **MODIFY:** `packages/ui/src/index.ts` (remove export)
4. **VERIFY:** ShortcutsHint condition in App.tsx

### Current WelcomeOverlay Logic

```tsx
// App.tsx (lines ~105-110)
const [welcomeVisible, setWelcomeVisible] = useState(() => {
  const hasVisited = localStorage.getItem('tmc-visited');
  return !hasVisited;
});

// Later in render (lines ~1470-1480)
<WelcomeOverlay
  isVisible={welcomeVisible && !authIsAuthenticated}
  onGetStarted={() => {
    localStorage.setItem('tmc-visited', 'true');
    setWelcomeVisible(false);
    setAuthModalOpen(true);
  }}
  onSignIn={() => {
    localStorage.setItem('tmc-visited', 'true');
    setWelcomeVisible(false);
    setAuthModalOpen(true);
  }}
  onDismiss={() => {
    localStorage.setItem('tmc-visited', 'true');
    setWelcomeVisible(false);
  }}
/>
```

### Current ShortcutsHint Logic

```tsx
// App.tsx (lines ~1320-1330)
{!focusMode && authIsAuthenticated && (
  <ShortcutsHint
    isVisible={!hasSeenShortcutsHint && !cheatSheetVisible}
    onDismiss={() => setHasSeenShortcutsHint(true)}
    onClick={() => {
      setCheatSheetVisible(true);
      setHasSeenShortcutsHint(true);
    }}
  />
)}
```

**Problem:** `authIsAuthenticated` condition blocks guests from seeing the hint.

---

## 🔧 Implementation Steps

### Step 1: Delete WelcomeOverlay Component
**File:** `packages/ui/src/WelcomeOverlay.tsx`

**Action:** Delete entire file (167 lines)

**Rationale:** No need to maintain unused marketing overlay.

---

### Step 2: Update UI Package Exports
**File:** `packages/ui/src/index.ts`

**Change:**
```diff
- export { WelcomeOverlay } from './WelcomeOverlay';
```

**Search for:** `export.*WelcomeOverlay`  
**Expected:** 1 match in index.ts  
**Action:** Remove the export line

---

### Step 3: Clean Up App.tsx
**File:** `apps/web/src/App.tsx`

#### 3a. Remove Import
```diff
  import {
    TopBar,
    RightInspector,
    // ... other imports
-   WelcomeOverlay,
    ProjectsDrawer,
    // ... other imports
  } from '@tmc/ui';
```

#### 3b. Remove State
```diff
- const [welcomeVisible, setWelcomeVisible] = useState(() => {
-   // Show welcome only for first-time visitors
-   const hasVisited = localStorage.getItem('tmc-visited');
-   return !hasVisited;
- });
```

**Location:** Around line 105-109

#### 3c. Remove Handlers (in onGetStarted, onSignIn, onDismiss callbacks)
```diff
- onGetStarted={() => {
-   localStorage.setItem('tmc-visited', 'true');
-   setWelcomeVisible(false);
-   setAuthModalOpen(true);
- }}
- onSignIn={() => {
-   localStorage.setItem('tmc-visited', 'true');
-   setWelcomeVisible(false);
-   setAuthModalOpen(true);
- }}
- onDismiss={() => {
-   localStorage.setItem('tmc-visited', 'true');
-   setWelcomeVisible(false);
- }}
```

#### 3d. Remove JSX Rendering
```diff
- {/* Welcome Overlay - first time visitors */}
- <WelcomeOverlay
-   isVisible={welcomeVisible && !authIsAuthenticated}
-   onGetStarted={() => {
-     localStorage.setItem('tmc-visited', 'true');
-     setWelcomeVisible(false);
-     setAuthModalOpen(true);
-   }}
-   onSignIn={() => {
-     localStorage.setItem('tmc-visited', 'true');
-     setWelcomeVisible(false);
-     setAuthModalOpen(true);
-   }}
-   onDismiss={() => {
-     localStorage.setItem('tmc-visited', 'true');
-     setWelcomeVisible(false);
-   }}
- />
```

**Location:** Around lines 1470-1490

---

### Step 4: Enable ShortcutsHint for Guests
**File:** `apps/web/src/App.tsx`

**Change:**
```diff
- {!focusMode && authIsAuthenticated && (
+ {!focusMode && (
    <ShortcutsHint
      isVisible={!hasSeenShortcutsHint && !cheatSheetVisible}
      onDismiss={() => setHasSeenShortcutsHint(true)}
      onClick={() => {
        setCheatSheetVisible(true);
        setHasSeenShortcutsHint(true);
      }}
    />
  )}
```

**Location:** Around lines 1320-1330

**Rationale:** ShortcutsHint uses `useUIStore` persistence, so it respects user preference (one-time show). No auth needed.

---

## ✅ Verification Checklist

### Code Quality
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] All imports removed correctly
- [ ] No dead code left (search for `WelcomeOverlay`, `welcomeVisible`, `tmc-visited`)

### Functional Testing (Guest User)

#### First Visit
- [ ] Open app in incognito/private mode
- [ ] **VERIFY:** No WelcomeOverlay appears
- [ ] **VERIFY:** Canvas is visible immediately
- [ ] **VERIFY:** EmptyStateOverlay shows (if no elements)
- [ ] **VERIFY:** ShortcutsHint appears (bottom-right, 3s auto-dismiss at first load)
- [ ] **VERIFY:** Can click EmptyState buttons to add elements
- [ ] **VERIFY:** All keyboard shortcuts work (P, B, A, etc.)

#### Guest Interactions
- [ ] Can add players, ball, arrows
- [ ] Can drag elements
- [ ] Can use Cmd+K for command palette
- [ ] Can export PNG/GIF/PDF
- [ ] Can save locally (localStorage)
- [ ] TopBar shows "?" for user avatar
- [ ] Clicking account button opens AuthModal

#### Repeat Visit (Guest)
- [ ] Reload page (still logged out)
- [ ] **VERIFY:** No WelcomeOverlay
- [ ] **VERIFY:** No ShortcutsHint (already seen)
- [ ] **VERIFY:** EmptyState still shows if canvas empty

### Functional Testing (Authenticated User)

#### Logged-In Behavior (NO REGRESSION)
- [ ] Sign in via AuthModal
- [ ] **VERIFY:** No WelcomeOverlay (never shows)
- [ ] **VERIFY:** ShortcutsHint appears (first time only)
- [ ] **VERIFY:** EmptyStateOverlay shows when empty
- [ ] **VERIFY:** CheatSheet never auto-opens (PR-UX1)
- [ ] **VERIFY:** Inspector behaves correctly (PR-UX3)
- [ ] **VERIFY:** Cloud sync works
- [ ] **VERIFY:** Projects drawer works

---

## 🔍 Search Patterns for Cleanup

After implementation, search codebase for:

1. **`WelcomeOverlay`** — Should find 0 results
2. **`welcomeVisible`** — Should find 0 results
3. **`tmc-visited`** — Should find 0 results (not used elsewhere)
4. **`authIsAuthenticated &&`** — Verify ShortcutsHint change applied

---

## 📦 Files Changed Summary

### Deleted (1 file)
- `packages/ui/src/WelcomeOverlay.tsx` (167 lines)

### Modified (2 files)
- `packages/ui/src/index.ts` (1 line removed)
- `apps/web/src/App.tsx` (~30 lines removed, 1 condition change)

### Total Impact
- **~200 lines deleted**
- **0 lines added**
- **Net change:** -200 LOC

---

## 🚨 Risk Analysis

### High Risk
- ❌ None (removal only, no behavior changes)

### Medium Risk
- ⚠️ ShortcutsHint now shows to guests
  - **Mitigation:** Already has localStorage persistence, tested in PR-UX1

### Low Risk
- ℹ️ Guest users immediately see full app
  - **Impact:** Positive — shorter time to value
  - **Fallback:** EmptyStateOverlay guides them

---

## 🎯 Success Criteria

### Must Have
✅ WelcomeOverlay completely removed from codebase  
✅ Guest users land directly in app (no overlay)  
✅ EmptyStateOverlay shows on empty canvas  
✅ ShortcutsHint works for guests  
✅ No TypeScript/ESLint errors  
✅ No regressions for authenticated users  

### Nice to Have
✅ Faster perceived load time  
✅ Cleaner codebase (200 fewer lines)  

---

## 📝 Commit Message Template

```
feat(guest): PR-GUEST1 - Remove WelcomeOverlay, enable Guest Mode First

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
- Guest first visit → EmptyState + ShortcutsHint
- Guest can use full app (except cloud sync)
- Logged-in behavior unchanged
- PR-UX1/UX2/UX3 regressions: NONE
```

---

## 🏁 Next Steps

1. **Review this plan** with team/stakeholder
2. **Get approval** for Guest Mode First strategy
3. **Toggle to ACT MODE** and implement changes
4. **Run manual QA** using checklist above
5. **Commit** with descriptive message
6. **Deploy** and monitor user behavior

---

## 📚 Related PRs

- **PR-UX1:** CheatSheet OFF + ShortcutsHint ✅ DONE (fa1d5a0)
- **PR-UX2:** EmptyStateOverlay + CanvasShell ✅ DONE (57298e7)
- **PR-UX3:** Responsive Inspector (xl drawer) ✅ DONE (9d51ae1)
- **PR-GUEST1:** Remove WelcomeOverlay ⏳ THIS PR

---

## 🤝 Approval Required

**Reviewer:** Please confirm:
- [ ] Agree with Guest Mode First strategy (no marketing wall)
- [ ] Approve removal of WelcomeOverlay entirely
- [ ] Approve ShortcutsHint for guests
- [ ] Ready to proceed with implementation

**Once approved, implementation will take <15 minutes.**
