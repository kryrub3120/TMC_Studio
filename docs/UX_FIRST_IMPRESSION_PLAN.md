# 🎯 UX First Impression Improvement Plan

**Status:** Ready for execution  
**Target:** Fix "bad first impression" after login  
**Strategy:** Small incremental PRs, no big-bang changes  

---

## 🔒 Hard Rules (Prevent Regression)

### Rule A: CheatSheet — Never Auto-Open

**Contract:**
- ❌ `cheatSheetVisible: true` in default state
- ❌ Auto-open on login/mount
- ❌ `cheatSheetVisible` is **NOT** persisted (always starts closed)
- ✅ Only open via:
  - Click "?" button in TopBar
  - Keyboard shortcut `?` or `Cmd+?`

**Rationale:** Overlay blocks 50% of canvas → terrible first impression. Persisting would cause "always open" regression.

### Rule B: Inspector — Responsive Default

**Contract:**
- `lg` (≥1280px): `inspectorOpen = true` (default)
- `<lg`: `inspectorOpen = false` (default)
- User preference **is** persisted in localStorage
- On desktop, respect user's last choice
- One-time post-mount correction if no preference exists

**Rationale:** Eliminates "desktop-only" feeling from day 1

### Rule C: No Overlays on First Paint

**Contract:**
- After login/board entry, canvas must be fully visible
- Only allowed: subtle non-blocking UI (hint 3s, empty state card)
- No modals, no blocking overlays, no "tutorial walls"

**Rationale:** User needs to see the product immediately

---

## 📦 Sprint 1: First Impression Fix (1-2 days)

**Goal:** User sees clean canvas + knows what to do next

### Task 1: CheatSheet OFF + Persist Strategy

**Changes:**
- `useUIStore.ts`: `cheatSheetVisible: false` (default, **NOT persisted**)
- Add to persisted state: `hasSeenShortcutsHint: boolean` (this is persisted)
- `inspectorOpen`: persist user preference (default based on breakpoint)
- Post-mount correction in root component (one-time breakpoint check)

**Files:**
- `apps/web/src/store/useUIStore.ts`
- `apps/web/src/App.tsx` (post-mount useEffect for inspector default)

**Acceptance Criteria:**
- [ ] CheatSheet always starts closed (not persisted)
- [ ] `hasSeenShortcutsHint` persisted correctly
- [ ] Inspector default respects breakpoint on first visit
- [ ] Inspector preference persisted on subsequent visits
- [ ] No SSR hydration flash

---

### Task 2: Floating Shortcuts Hint (3s auto-dismiss)

**Spec:**
- Show hint ONLY IF:
  - User authenticated
  - CheatSheet closed
  - `hasSeenShortcutsHint === false`
- Content: `"Press ? for shortcuts • ⌘K for commands"`
- Behavior:
  - Auto-dismiss after 3s
  - Click hint → open CheatSheet + set `hasSeenShortcutsHint = true`
  - Position: Top-right corner (non-intrusive)

**Component:** `packages/ui/src/ShortcutsHint.tsx` (NEW)

**Integration:** `apps/web/src/App.tsx` (render conditionally)

**Files:**
- NEW: `packages/ui/src/ShortcutsHint.tsx`
- `apps/web/src/store/useUIStore.ts` (add `hasSeenShortcutsHint` state)
- `apps/web/src/App.tsx` (render hint)
- `packages/ui/src/index.ts` (export)

**Acceptance Criteria:**
- [ ] Hint shows once per user (persisted)
- [ ] Auto-dismisses after 3s
- [ ] Click opens CheatSheet
- [ ] Doesn't show if CheatSheet already opened

---

### Task 3: Empty State Overlay (elements.length === 0)

**Spec:**
- Trigger: `elements.length === 0`
- Location: Canvas center (overlay, doesn't block interaction)
- Content:
  - Title: "Start your board"
  - Quick CTAs:
    - **Add Player (P)** → adds at **center-of-pitch** (not cursor-dependent)
    - **Add Ball (B)** → adds at **center-of-pitch**
    - **Add Arrow (A)** → adds at **center-of-pitch** with default endpoint
  - Secondary: **Command Palette (⌘K)** → opens command palette
- Styling: Subtle card with glassmorphism, centered

**Component:** `packages/ui/src/EmptyStateOverlay.tsx` (NEW)

**Integration Point:** 
- **CanvasShell.tsx** (NEW wrapper component in `apps/web/src/components/`)
- CanvasShell wraps BoardCanvas + holds absolute overlays (EmptyState, Hint anchor)
- App.tsx stays clean (composition-only)
- BoardCanvas stays pure (Konva-only)

**Files:**
- NEW: `packages/ui/src/EmptyStateOverlay.tsx`
- NEW: `apps/web/src/components/CanvasShell.tsx`
- `apps/web/src/App.tsx` (render CanvasShell instead of bare canvas)
- `packages/ui/src/index.ts` (export)

**Critical:** CTAs must add elements at **fixed center position**, not dependent on cursor state

**Acceptance Criteria:**
- [ ] Shows when board is empty
- [ ] Hides when first element added
- [ ] CTA buttons work **without cursor movement** (center-of-pitch placement)
- [ ] Doesn't interfere with canvas interaction
- [ ] Responsive (scales on smaller screens)
- [ ] Works on all screen sizes (mobile, tablet, desktop)

---

### Task 4: Quick Actions Integration

**Decision:** Quick Actions are PART of Empty State, not hidden in Inspector

**Rationale:** 
- Inspector may be closed on mobile
- User needs immediate "what to do" without hunting

**Implementation:**
- Quick Actions embedded in `EmptyStateOverlay` (Task 3)
- Inspector's `QuickActionsPanel` remains for non-empty states
- No duplication needed

**Acceptance Criteria:**
- [ ] Empty state shows quick actions
- [ ] Quick actions work same as keyboard shortcuts
- [ ] Inspector quick actions still available when inspector open + nothing selected

---

## 📦 Sprint 2A: Responsive — MD Drawer (2-3 days)

**Breakpoint:** `md` (900-1279px)

**Changes:**
- `RightInspector.tsx`:
  - Convert to `position: fixed` overlay drawer
  - Add backdrop (semi-transparent, click-outside closes)
  - Slide-in animation from right
  - Default `inspectorOpen: false` for `md` breakpoint

- `TopBar.tsx`:
  - Add "Inspector" toggle button (visible on `<lg`)
  - Icon: panel/sidebar icon

**Files:**
- `packages/ui/src/RightInspector.tsx`
- `packages/ui/src/TopBar.tsx`
- `apps/web/src/store/useUIStore.ts` (responsive default logic)

**Acceptance Criteria:**
- [ ] On `md` screens, inspector is overlay drawer
- [ ] Click-outside closes drawer
- [ ] TopBar has inspector toggle button
- [ ] Canvas uses full width when inspector closed
- [ ] Smooth slide-in/out animation

---

## 📦 Sprint 2B: Responsive — SM Bottom Sheet (2-3 days)

**Breakpoint:** `sm` (<900px)

**Options:**
1. **Minimum:** Full-screen modal with tabs (Props/Layers/Objects/Teams/Pitch)
2. **Polished:** Bottom sheet with handle (drag to dismiss)

**Recommendation:** Start with Option 1 (faster, less risk)

**Changes:**
- `RightInspector.tsx`:
  - On `sm`, render as full-screen modal
  - Tab navigation at top
  - Close button (X)
  - Optional: Bottom sheet with drag handle (later iteration)

**Files:**
- `packages/ui/src/RightInspector.tsx`
- Possibly: NEW `packages/ui/src/BottomSheet.tsx` (if bottom-sheet approach)

**Acceptance Criteria:**
- [ ] On `sm` screens, inspector is bottom sheet/modal
- [ ] Swipe/click to dismiss
- [ ] Tabs accessible
- [ ] Canvas maximized when closed

---

## 🔀 PR Breakdown

### PR-UX1: CheatSheet Default OFF + Hint
**Scope:** Sprint 1, Tasks 1-2  

**Changes:**
1. `useUIStore.ts`:
   - `cheatSheetVisible: false` (default)
   - **NOT** persisted (removed from `partialize`)
   - `hasSeenShortcutsHint: boolean` persisted
   - Post-mount correction for `inspectorOpen` (useEffect in App.tsx)

2. `ShortcutsHint.tsx` (NEW):
   - Renders top-right corner
   - Auto-dismiss 3s
   - Click → open CheatSheet + set `hasSeenShortcutsHint = true`

3. TopBar:
   - Ensure "?" button exists (or add if missing)

**Files:**
- `apps/web/src/store/useUIStore.ts`
- NEW: `packages/ui/src/ShortcutsHint.tsx`
- `apps/web/src/App.tsx` (render hint, post-mount inspector correction)
- `packages/ui/src/TopBar.tsx` (ensure ? button)
- `packages/ui/src/index.ts` (export)

**Risk:** Low  
**Rollback:** Easy (revert commit)

**Critical:** `cheatSheetVisible` must NOT be in `partialize` array

---

### PR-UX2: Empty State Overlay + Quick Actions
**Scope:** Sprint 1, Tasks 3-4  

**Changes:**
1. `EmptyStateOverlay.tsx` (NEW):
   - Shows when `elements.length === 0`
   - CTAs add elements at **center-of-pitch** (fixed position)
   - "Command Palette" button always works

2. `CanvasShell.tsx` (NEW):
   - Wraps `BoardCanvas`
   - Holds absolute overlays (EmptyState, later ShortcutsHint anchor)
   - Keeps App.tsx clean

3. Board store:
   - Add `addPlayerAtCenter(team)`, `addBallAtCenter()`, `addArrowAtCenter(type)` helpers
   - OR: modify existing `addPlayerAtCursor` to accept optional position override

**Files:**
- NEW: `packages/ui/src/EmptyStateOverlay.tsx`
- NEW: `apps/web/src/components/CanvasShell.tsx`
- `apps/web/src/App.tsx` (render CanvasShell instead of bare canvas)
- `apps/web/src/store/useBoardStore.ts` (center-position helpers)
- `packages/ui/src/index.ts` (export)

**Risk:** Low-Medium (new UI component + layout change)  
**Rollback:** Easy (remove components, revert App.tsx)

**Critical:** CTAs must work without cursor dependency

---

### PR-UX3: Responsive Inspector — MD Drawer
**Scope:** Sprint 2A  
**Files:**
- `packages/ui/src/RightInspector.tsx`
- `packages/ui/src/TopBar.tsx`
- `apps/web/src/store/useUIStore.ts`

**Risk:** Medium (layout change)  
**Rollback:** Moderate (revert + test)

---

### PR-UX4: Responsive Inspector — SM Bottom Sheet
**Scope:** Sprint 2B  
**Files:**
- `packages/ui/src/RightInspector.tsx`
- Optional: NEW `packages/ui/src/BottomSheet.tsx`

**Risk:** Medium (new component/pattern)  
**Rollback:** Moderate

---

## ✅ QA Checklists

### Sprint 1 QA

**CheatSheet & Hint:**
- [ ] CheatSheet closed on first visit
- [ ] Hint appears once, auto-dismisses after 3s
- [ ] Click hint → opens CheatSheet
- [ ] `?` toggle works
- [ ] Preference persisted across sessions

**Empty State:**
- [ ] Empty state shows on board load (no elements)
- [ ] Click "Add Player" → player added
- [ ] Click "Add Ball" → ball added
- [ ] Click "Add Arrow" → arrow drawing starts
- [ ] Click "Command Palette" → palette opens
- [ ] Empty state hides when first element added
- [ ] Quick actions match keyboard shortcuts

---

### Sprint 2A QA (MD Breakpoint)

**Responsive Inspector:**
- [ ] On screens <1280px, inspector closed by default
- [ ] TopBar shows "Inspector" toggle button
- [ ] Click button → drawer slides in from right
- [ ] Click backdrop → drawer closes
- [ ] Canvas uses full width when drawer closed
- [ ] Smooth animations (no janky transitions)
- [ ] User preference persisted (localStorage)

---

### Sprint 2B QA (SM Breakpoint)

**Bottom Sheet/Modal:**
- [ ] On screens <900px, inspector is bottom sheet/modal
- [ ] Swipe/click to dismiss works
- [ ] All tabs accessible (Props/Layers/Objects/Teams/Pitch)
- [ ] Canvas maximized when closed
- [ ] No layout overflow/scroll issues

---

## 🎨 Design Decisions

### Empty State Position
**Decision:** Render in `CanvasShell.tsx` wrapper component

**Why:**
- Keep `App.tsx` clean (composition-only, NO overlays)
- Keep `BoardCanvas` pure (Konva-only, NO React overlays)
- CanvasShell is the "container + UI layer" between App and Canvas
- Easier to position/center relative to canvas
- No Konva dependency for UI overlays

**Architecture:**
```
App.tsx
  └─ CanvasShell.tsx (NEW)
      ├─ BoardCanvas (Konva)
      ├─ EmptyStateOverlay (absolute, center)
      └─ ShortcutsHint anchor (absolute, top-right)
```

**Final choice:** `CanvasShell.tsx` as intermediate component

---

### Hint vs Toast
**Decision:** Custom `ShortcutsHint` component, NOT toast

**Why:**
- Toast is for ephemeral actions ("Saved!", "Copied!")
- Hint is educational, one-time onboarding
- Different visual treatment (less intrusive)

### Persist Strategy
**Decision:** Split "user preferences" from "ephemeral UI state"

**Persisted (localStorage):**
- `hasSeenShortcutsHint: boolean` — one-time hint tracking
- `inspectorOpen: boolean` — user's panel preference

**NOT Persisted (always reset):**
- `cheatSheetVisible: boolean` — always starts `false`
- `commandPaletteOpen: boolean` — always starts `false`
- Any modal/overlay state

**Why:**
- Prevents "sticky modals" regression
- User can't accidentally leave app in "always help mode"
- Clear separation: preferences vs UI state

---

### Inspector Responsive Logic
**Decision:** Breakpoint-based default + post-mount correction

**Implementation:**
```typescript
// useUIStore.ts - Initial state
const getInitialInspectorState = () => {
  if (typeof window === 'undefined') return true; // SSR safe
  return window.innerWidth >= 1280; // lg breakpoint
};

// State
inspectorOpen: getInitialInspectorState(),
```

**Post-mount correction (in App.tsx or root):**
```typescript
useEffect(() => {
  // Only on first visit (no user preference)
  const hasPreference = localStorage.getItem('tmc-ui-settings')?.includes('inspectorOpen');
  if (!hasPreference) {
    const shouldBeOpen = window.innerWidth >= 1280;
    useUIStore.getState().setInspectorOpen(shouldBeOpen);
  }
}, []); // Run once on mount
```

**Why:**
- Simple, no complex resize listeners
- Works on SSR (defaults to `true` server-side, no flash)
- User preference overrides on subsequent visits
- One-time correction ensures correct default

---

## 📏 Success Metrics

### Qualitative
- [ ] User knows what to do on empty board
- [ ] Canvas is visible (not blocked by overlays)
- [ ] Works on mobile/tablet (responsive)

### Quantitative (if analytics available)
- Time to first action (add player/ball/arrow)
- CheatSheet discovery rate (click `?`)
- Command Palette usage (⌘K)

---

## 🚀 Execution Order

1. ✅ **PR-UX1** → DONE (commit: fa1d5a0) — Fixes biggest issue (blocked canvas)
2. **PR-UX2** → IN PROGRESS — Adds guidance (empty state)
3. **PR-UX3** → Responsive (md drawer)
4. **PR-UX4** → Responsive (sm bottom sheet) — *optional*

**Total time estimate:** 3-5 days for PR-UX1 + PR-UX2 + PR-UX3

**Hard Rules Status:**
- ✅ Rule A: CheatSheet never auto-open (enforced in fa1d5a0)
- ✅ Rule B: Inspector responsive default (enforced in fa1d5a0)
- ✅ Rule C: No overlays on first paint (enforced in fa1d5a0)

---

## 📝 Notes

- Keep `App.tsx` clean — only composition, no logic/state
- Use `CommandRegistry` pattern for all quick actions
- Persist user preferences via localStorage (not cloud on MVP)
- Follow existing UI patterns (colors, spacing, animations)
- **Never persist modal/overlay state** (`cheatSheetVisible`, `commandPaletteOpen`)
- CTAs in empty state must work **without cursor position**

---

## ✅ Definition of Done (Whole Package)

After completing all PRs, verify:

- [ ] **Post-login: zero canvas覆盖** — No overlays blocking the pitch
- [ ] **Empty board: 1-click add** — User can add element without hunting
- [ ] **13" laptop: canvas priority** — Inspector doesn't eat screen space
- [ ] **Mobile: usable** — Inspector opens as modal/drawer, canvas maximized
- [ ] **No regression: CheatSheet** — Never auto-opens, not persisted
- [ ] **No regression: Inspector** — Responsive default works correctly
- [ ] **Hint shows once** — `hasSeenShortcutsHint` prevents spam
- [ ] **Empty state CTAs work** — Add player/ball/arrow without cursor

---

*Last Updated: 2026-01-11*  
*Author: TMC Studio Team*
