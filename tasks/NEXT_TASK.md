# Sprint 5 — Quality & UX (Next Session)

## Goal
Improve performance, add mobile support, and enhance UX with step thumbnails.

## Priority Order

### 1. S5.1 Performance Optimization (High Priority)
Code splitting and lazy loading to reduce initial bundle size.

**Tasks:**
- [ ] Lazy load jsPDF (`const { jsPDF } = await import('jspdf')`)
- [ ] Lazy load gifenc for GIF export
- [ ] Split export utils into dynamic import
- [ ] Audit bundle size with `vite-plugin-visualizer`
- [ ] Add loading states for async exports

**Files to Edit:**
- `apps/web/src/utils/exportUtils.ts` - Dynamic imports
- `apps/web/vite.config.ts` - Add bundle visualizer
- `apps/web/src/App.tsx` - Loading states

### 2. S5.3 Step Thumbnails (Medium Priority)
Visual previews for each step in the timeline.

**Tasks:**
- [ ] Generate thumbnail on step change
- [ ] Store as data URL in step data
- [ ] Display in BottomStepsBar
- [ ] Add loading skeleton
- [ ] Cache thumbnails in memory

**Files to Edit:**
- `packages/core/src/step.ts` - Add thumbnail field
- `packages/ui/src/BottomStepsBar.tsx` - Display thumbnails
- `apps/web/src/store/useBoardStore.ts` - Generate thumbnails

### 3. S5.2 Touch Support (Medium Priority)
Basic mobile/touch support.

**Tasks:**
- [ ] Pinch-to-zoom gesture
- [ ] Touch pan/drag
- [ ] Responsive Inspector panel
- [ ] Larger touch targets

**Files to Edit:**
- `apps/web/src/App.tsx` - Touch event handlers
- `packages/ui/src/RightInspector.tsx` - Mobile layout

---

## Quick Wins for Next Session

1. **Bundle Visualizer** - See what's large
2. **Lazy jsPDF** - Only load when exporting PDF
3. **Lazy gifenc** - Only load when exporting GIF
4. **Step thumbnail POC** - Basic implementation

---

## Session Summary (2026-01-04)

### Completed Today:
✅ **Sprint 4 — Export & Customization** fully completed!

- Fixed GIF export (gif.js → gifenc)
- Added keyboard shortcuts: ⇧⌘G (GIF), ⇧⌘P (PDF)
- Updated CheatSheetOverlay with all shortcuts
- Updated README with full documentation
- Updated ROADMAP with Sprint 5 plan
- Build: 5/5 ✅

### Commits Today:
1. `63cb4d3` - fix(S4.4): Replace gif.js with gifenc for working GIF export

### Shortcuts Reference:
```
Export PNG:       ⌘E
Export All PNGs:  ⇧⌘E
Export GIF:       ⇧⌘G
Export PDF:       ⇧⌘P
Export SVG:       via Command Palette (⌘K)
```

---

## Commands
```bash
# Start dev
pnpm dev

# Build
pnpm build

# Analyze bundle (after adding visualizer)
pnpm build --analyze
```
