# 📦 PR0: Foundations Checklist

**Target:** Day 1 of Refactoring Sprint  
**Scope:** Scaffolding only, ZERO behavior changes  
**Contract:** [`docs/IMPLEMENTATION_CONTRACTS.md`](../docs/IMPLEMENTATION_CONTRACTS.md)

---

## 🎯 PR Description

```markdown
## PR0: Foundations - Directory Structure & CI Setup

### What
- Add folder structure for upcoming modular refactoring
- Enable commitlint in CI
- No code changes to App.tsx or stores

### Why
- Prepare codebase for PR1-PR6 (store slices, services, hooks, canvas layers)
- Each subsequent PR will have clean merge targets
- Validate documentation works before implementation starts

### Testing
- `pnpm build` ✅
- `pnpm typecheck` ✅
- App works exactly as before (manual verification)

### Docs
- Links to `docs/IMPLEMENTATION_CONTRACTS.md`
```

---

## ✅ Pre-Merge Checklist

### 📁 Folder Structure

- [ ] `apps/web/src/hooks/` created
- [ ] `apps/web/src/hooks/index.ts` exists (empty or re-export)
- [ ] `apps/web/src/services/` created
- [ ] `apps/web/src/services/index.ts` exists
- [ ] `apps/web/src/commands/` created
- [ ] `apps/web/src/commands/index.ts` exists
- [ ] `apps/web/src/store/slices/` created
- [ ] `apps/web/src/store/slices/index.ts` exists
- [ ] `apps/web/src/store/middleware/` created
- [ ] `apps/web/src/components/Canvas/` created (if not exists)
- [ ] `apps/web/src/components/Canvas/layers/` created
- [ ] `apps/web/src/components/Canvas/overlays/` created

### 📜 CI & Tooling

- [ ] `commitlint.config.js` exists in root (already done ✅)
- [ ] CI workflow includes commitlint check
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes

### 📚 Documentation Links

- [ ] `CONTRIBUTING.md` links to `docs/IMPLEMENTATION_CONTRACTS.md`
- [ ] `README.md` mentions architecture docs (optional)

### ⚠️ Zero Behavior Changes

- [ ] `apps/web/src/App.tsx` **NOT modified**
- [ ] `apps/web/src/store/useBoardStore.ts` **NOT modified**
- [ ] `apps/web/src/store/useUIStore.ts` **NOT modified**
- [ ] `apps/web/src/store/useAuthStore.ts` **NOT modified**
- [ ] All existing functionality works (manual smoke test)

---

## 🚀 Commands to Run

### Create directories

```bash
cd apps/web/src

# Hooks
mkdir -p hooks
echo "// Hooks index - will export custom hooks" > hooks/index.ts

# Services  
mkdir -p services
echo "// Services index - will export service singletons" > services/index.ts

# Commands
mkdir -p commands
echo "// Commands index - will export cmd registry" > commands/index.ts

# Store slices & middleware
mkdir -p store/slices
mkdir -p store/middleware
echo "// Slices index - will export slice creators" > store/slices/index.ts

# Canvas structure
mkdir -p components/Canvas/layers
mkdir -p components/Canvas/overlays
```

### Verify no breakage

```bash
# From root
pnpm typecheck
pnpm lint
pnpm build

# Manual test
pnpm dev
# Open browser, verify app works
```

---

## 🔍 Review Criteria

### PR0 is ready to merge when:

1. **Build passes** - No TypeScript errors, no lint errors
2. **App works** - Manual verification that nothing changed
3. **Structure exists** - All directories from checklist created
4. **No architecture discussions** - If reviewers don't question the structure, documentation worked

---

## 📊 Success Metric

> **If PR0 passes review without architecture discussions, the documentation is working.**

---

## 🔗 Related Documents

- **Binding contract:** [`IMPLEMENTATION_CONTRACTS.md`](../docs/IMPLEMENTATION_CONTRACTS.md)
- **Store structure:** [`ZUSTAND_SLICES.md`](../docs/ZUSTAND_SLICES.md)
- **Service breakdown:** [`SERVICE_MODULE_BREAKDOWN.md`](../docs/SERVICE_MODULE_BREAKDOWN.md)
- **System architecture:** [`SYSTEM_ARCHITECTURE.md`](../docs/SYSTEM_ARCHITECTURE.md)

---

## 📅 Next Steps (After PR0 Merge)

| PR | Focus | ETA |
|----|-------|-----|
| PR1 | Store slices (elementsSlice, selectionSlice, historySlice) | +2 days |
| PR2 | KeyboardService + useKeyboardShortcuts | +1 day |
| PR3 | ExportService | +1 day |
| PR4 | Canvas layers (PitchLayer, PlayersLayer, etc.) | +2 days |
| PR5 | Animation hooks (useAnimationPlayback, useInterpolation) | +2 days |
| PR6 | CommandRegistry + final integration | +2 days |

---

*Estimated total: 4 weeks to complete refactoring*
