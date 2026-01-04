# Sprint D Completion + Remaining P0 Features

## Goal
Complete Sprint D: Zoom integration, Smart Numbering, Account Menu, Locked Presets upsell, Duplicate offset.

## Inputs
- `apps/web/src/store/useUIStore.ts` - has zoom state ready (zoom, zoomIn, zoomOut, zoomFit, setZoom)
- `packages/ui/src/ZoomWidget.tsx` - ZoomWidget component ready
- `apps/web/src/App.tsx` - needs zoom integration + keyboard shortcuts
- `apps/web/src/store/useBoardStore.ts` - needs smart numbering + duplicate offset

## Current State (completed)
- [x] D1: Ball Vector - professional pentagon pattern ball 
- [x] D2: Zoom store in useUIStore (zoom, zoomIn, zoomOut, zoomFit)
- [x] D2: ZoomWidget component exported from @tmc/ui
- [ ] D2: Integrate ZoomWidget in App.tsx
- [ ] D2: Add zoom keyboard shortcuts (Cmd+/-, Shift+1)
- [ ] D2: Apply scale to Stage
- [ ] D3: Smart Numbering (next free number)
- [ ] D4: Account Menu + Plan Badge in TopBar
- [ ] D5: Locked Presets in Command Palette
- [ ] D6: Duplicate with offset (+12px)

## Deliverables
- [ ] `apps/web/src/App.tsx` - ZoomWidget integrated, Stage scaled, zoom shortcuts
- [ ] `apps/web/src/store/useBoardStore.ts` - getNextFreeNumber(), duplicateSelected with offset
- [ ] `packages/ui/src/TopBar.tsx` - Account menu dropdown
- [ ] `packages/ui/src/CommandPaletteModal.tsx` - Locked preset actions with 🔒

## Step-by-step Plan

### D2 Complete: Zoom Integration (~15min)
1. Import ZoomWidget in App.tsx
2. Add zoom state from useUIStore
3. Render ZoomWidget in canvas area
4. Apply scale transform to Stage
5. Add keyboard shortcuts: Cmd+Plus, Cmd+Minus, Shift+1

### D3: Smart Numbering (~10min)
1. Add getNextFreeNumber(team) to useBoardStore
2. Use in addPlayerAtCursor() to auto-increment

### D4: Account Menu (~20min)
1. Add AccountMenu component to TopBar
2. Avatar (initials circle) + "Free" badge
3. Dropdown: Account, Billing, Upgrade, ----, Logout

### D5: Locked Presets (~15min)
1. Add locked preset commands to commandActions
2. Show 🔒 icon and "Pro" label
3. On click: show upgrade modal/toast

### D6: Duplicate Offset (~5min)
1. Modify duplicateSelected() to offset by +12px X and Y

## Commands
```bash
# dev
pnpm dev

# build
pnpm build

# test zoom
# Press Cmd++ / Cmd+- / Shift+1
# Use widget in bottom-right corner
```

## Files to edit/create
- `apps/web/src/App.tsx` — ZoomWidget + zoom shortcuts + Stage scale
- `apps/web/src/store/useBoardStore.ts` — smart numbering + duplicate offset
- `packages/ui/src/TopBar.tsx` — account menu dropdown
- `packages/ui/src/CommandPaletteModal.tsx` — locked presets
- `packages/ui/src/AccountMenu.tsx` — new component (optional, can inline)
