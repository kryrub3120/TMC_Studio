# PR-REFACTOR: Production-Ready Architecture Plan

**Status:** 🟡 In Progress  
**Priority:** 🔴 Critical (Pre-Launch Requirement)  
**Owner:** Dev Team  
**Created:** 2026-01-27  

---

## Executive Summary

App.tsx has grown to **3000+ lines** and is a maintenance nightmare. To launch commercially, we need:
- **Testable** architecture
- **Scalable** codebase structure
- **Performance** optimization (especially canvas)
- **Maintainable** code for team growth

This refactor will NOT change user-facing functionality - it's pure architecture improvement following the **Strangler Fig Pattern** (incremental migration, zero risk).

---

## Current Problems (Critical)

### 1. App.tsx is a "God Component" ❌
```
- 80+ useState/useEffect/useMemo/useCallback
- 2000+ lines of event handlers
- Keyboard shortcuts mixed with business logic
- Canvas rendering + auth + billing + projects all in one file
- Impossible to test individual features
- Every change risks breaking 10 other things
```

### 2. Performance Issues ❌
```
- Multi-drag updates store on every mousemove (20-60 FPS drop)
- elements.find() called repeatedly in render/context menu
- No memoization between canvas and UI layers
- handleKeyDown is recreated frequently due to huge deps array
```

### 3. Duplication & Drift ❌
```
- Keyboard shortcuts defined 3x (palette, keys, context menu)
- Export logic scattered (GIF/PDF gates duplicated)
- Context menu logic doesn't match palette
```

### 4. Commercial Launch Blockers ❌
```
- NO schema versioning (user documents will break on updates)
- NO entitlements unit tests (paywall bugs = revenue loss)
- Canvas architecture locked behind feature flag (can't ship)
- No E2E tests for critical flows (signup → upgrade)
```

---

## Solution: 7-Phase Refactor + Must-Haves

### Phase 1: Extract Controllers (Week 1)
**Goal:** Remove 60% of App.tsx logic into testable hooks

#### PR-REFACTOR-1: Keyboard Shortcuts ✅ IN PROGRESS
- [x] Enhance KeyboardService for e.code support (formations)
- [ ] Create comprehensive useKeyboardShortcuts hook
- [ ] Wire up in App.tsx with proper guards
- [ ] Delete 800-line handleKeyDown from App
- [ ] Document all shortcuts
- [ ] Manual QA: test every shortcut

**Files:**
- `apps/web/src/services/KeyboardService.ts` ✅ Enhanced
- `apps/web/src/hooks/useKeyboardShortcuts.ts` (create)

#### PR-REFACTOR-2: Export Controller
- [ ] Create `hooks/useExportController.ts`
- [ ] Move PNG/GIF/PDF/SVG logic
- [ ] Centralize entitlement gates
- [ ] Wire up in App
- [ ] Delete export handlers from App

**Benefits:**
- Single source of truth for export entitlements
- Testable export flows
- ~400 lines removed from App

#### PR-REFACTOR-3: Projects Controller
- [ ] Create `hooks/useProjectsController.ts`
- [ ] Move load/save/duplicate/delete logic
- [ ] Move folders CRUD
- [ ] Wire up ProjectsDrawer
- [ ] Delete from App

**Benefits:**
- Projects management isolated
- ~500 lines removed from App

#### PR-REFACTOR-4: Billing Controller
- [ ] Create `hooks/useBillingController.ts`
- [ ] Move pricing/limit/upgrade/portal logic
- [ ] Centralize payment return handling
- [ ] Wire up modals
- [ ] Delete from App

**Benefits:**
- Payment flows testable
- ~300 lines removed from App

**Phase 1 Result:** App.tsx shrinks from 3000 → ~1800 lines

---

### Phase 2: Canvas Isolation (Week 2)
**Goal:** Canvas re-renders independently from UI changes

#### PR-REFACTOR-5: CanvasSurface Component
- [ ] Create `components/Canvas/CanvasSurface.tsx`
- [ ] Create `hooks/useCanvasController.ts`
- [ ] Extract all canvas logic:
  - Multi-drag with draft state (performance fix!)
  - Marquee selection
  - Freehand drawing
  - Text/player editing overlays
- [ ] Memoize CanvasSurface (stable props)
- [ ] Wire up in App
- [ ] Delete canvas logic from App

**Performance Win:**
```typescript
// BEFORE: mousemove updates store → re-render App → re-render Canvas
// AFTER: mousemove updates ref → requestAnimationFrame → commit on mouseup
```

**Benefits:**
- 10-20x FPS improvement on multi-drag
- Canvas isolated from modal state changes
- ~600 lines removed from App

---

### Phase 3: Command Registry (Week 2)
**Goal:** Single source of truth for all actions

#### PR-REFACTOR-6: CommandRegistry
- [ ] Create `commands/CommandRegistry.ts`
- [ ] Register all commands with:
  - id, label, shortcuts, entitlements, execute()
- [ ] Update CommandPalette to use registry
- [ ] Update useKeyboardShortcuts to use registry
- [ ] Update context menu to use registry
- [ ] Delete duplicate definitions

**Benefits:**
- Keyboard/palette/menu always in sync
- Easy to audit paywall coverage
- ~200 lines removed from duplication

---

### Phase 4: Enable BoardCanvas (Week 3)
**Goal:** Ship new canvas architecture

#### PR-REFACTOR-7: Remove USE_NEW_CANVAS Flag
- [ ] Test BoardCanvas with all features
- [ ] Fix any regressions
- [ ] Remove Stage/Layer code from App
- [ ] Delete feature flag
- [ ] Update docs

**Benefits:**
- Cleaner architecture
- Better performance baseline
- ~400 lines removed from App

**Phase 4 Result:** App.tsx is now ~600 lines (pure shell)

---

### Phase 5: MUST-HAVE Pre-Launch Features

#### CRITICAL-1: Schema Versioning 🚨
**Why:** Without this, any model change breaks user documents

- [ ] Add `schemaVersion` to BoardDocument
- [ ] Create `core/migrations.ts`
- [ ] Implement migration chain (v1→v2→v3)
- [ ] Add validation on loadFromCloud/import
- [ ] Test migration with old/new docs
- [ ] Document migration process

**Risk if skipped:** Customer complaints, data loss, refunds

#### CRITICAL-2: Entitlements Unit Tests 🚨
**Why:** Paywall bugs = revenue loss

- [ ] Create `lib/entitlements.test.ts`
- [ ] Test all gates:
  - Guest: 5 steps, 1 project
  - Free: 10 steps, 3 projects
  - Pro: unlimited, GIF/PDF
  - Team: unlimited, collaboration
- [ ] Test soft-prompt thresholds
- [ ] Test hard-block behavior
- [ ] Run in CI

**Risk if skipped:** Users bypass paywall, lost revenue

#### CRITICAL-3: E2E Critical Flows 🚨
**Why:** Manual QA doesn't scale

- [ ] Install Playwright
- [ ] Test: Guest signup → Free → Pro upgrade
- [ ] Test: Create project → save → load
- [ ] Test: Export PNG/GIF/PDF (with/without Pro)
- [ ] Test: Paywall limits trigger correctly
- [ ] Run in CI

**Risk if skipped:** Broken signup = no customers

---

### Phase 6: Performance Optimizations

#### PERF-1: Element Mapping
- [ ] Create `useMemo` map: `id → element`
- [ ] Replace all `elements.find()` calls
- [ ] Measure performance improvement

#### PERF-2: Canvas Draft State
- [ ] Multi-drag uses `useRef` for positions
- [ ] Render from draft, commit on mouseup
- [ ] Measure FPS improvement (expect 2-5x)

#### PERF-3: Selector Stability
- [ ] Audit all store selectors
- [ ] Ensure stable references
- [ ] Add equality functions where needed

---

### Phase 7: Documentation

#### DOC-1: Architecture Overview
- [ ] Update ARCHITECTURE_OVERVIEW.md
- [ ] Document controller pattern
- [ ] Document command registry
- [ ] Add diagrams

#### DOC-2: Testing Guide
- [ ] Document test structure
- [ ] Add examples for unit/integration/E2E
- [ ] Document CI setup

#### DOC-3: Contribution Guide
- [ ] Update file structure explanation
- [ ] Add "where to put new features" guide
- [ ] Document PR process

---

## File Structure (Target State)

```
apps/web/src/
  app/
    AppShell.tsx              # Main shell (composition only)
    ErrorBoundary.tsx
    
  features/
    board/
      board.store.ts
      board.commands.ts       # Command registry
      board.migrations.ts     # Schema migrations ⚠️ CRITICAL
      
    canvas/
      CanvasSurface.tsx       # Isolated canvas
      useCanvasController.ts  # Canvas logic
      
    shortcuts/
      useKeyboardShortcuts.ts # All keyboard shortcuts
      
    export/
      useExportController.ts  # PNG/GIF/PDF/SVG
      export.service.ts
      
    projects/
      useProjectsController.ts # Load/save/folders
      projects.service.ts      # Supabase API
      
    billing/
      useBillingController.ts  # Pricing/limits/portal
      entitlements.ts
      entitlements.test.ts     # ⚠️ CRITICAL TESTS
      
  shared/
    ui/           # Reusable components
    utils/        # Helper functions
    hooks/        # Generic hooks
```

---

## Success Criteria

### Before Launch ✅
- [ ] App.tsx < 700 lines
- [ ] Schema versioning implemented
- [ ] Entitlements have 100% test coverage
- [ ] Critical E2E tests passing
- [ ] Multi-drag performs at 60 FPS
- [ ] No duplicate command definitions

### Post-Launch Goals
- [ ] Full unit test coverage (>80%)
- [ ] Performance monitoring in production
- [ ] Automated regression testing
- [ ] Team onboarding doc complete

---

## Risk Mitigation

### Strangler Fig Pattern ✅
- One controller at a time
- Old code stays working until new code is verified
- Easy rollback (just uncomment old code)

### Testing Strategy
- Manual QA after each PR
- Regression checklist for critical flows
- Beta testers validate before main launch

### Rollback Plan
- Git tags before each phase
- Feature flags for risky changes
- Ability to revert individual PRs

---

## Timeline

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1 | Controllers | 4 PRs merged, App < 1800 lines |
| 2 | Canvas + Registry | App < 1200 lines, FPS improved |
| 3 | BoardCanvas | App < 700 lines, flag removed |
| 4 | Critical Features | Schema + Tests + E2E |
| 5 | Performance | FPS @ 60, optimizations done |
| 6 | Documentation | Docs complete, ready for team |

**Go/No-Go for Launch:** End of Week 4 (critical features must pass)

---

## Next Steps (Immediate)

1. ✅ Review this plan with team
2. ✅ Approve timeline and priorities
3. 🟡 Complete PR-REFACTOR-1 (keyboard shortcuts)
4. [ ] Start PR-REFACTOR-2 (export controller)
5. [ ] Begin writing entitlements tests (can parallelize)

---

## Notes

- This is NOT a rewrite - it's incremental refactoring
- User-facing features unchanged (zero risk to users)
- Each PR is independently valuable
- Can pause/resume between phases
- Commercial launch depends on completing Week 4 items

---

**Document Owner:** Dev Team  
**Last Updated:** 2026-01-27  
**Next Review:** After PR-REFACTOR-1 completion
