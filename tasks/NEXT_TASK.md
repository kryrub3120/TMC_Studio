# S4.2 Team Customization - Part 3: Teams Panel

## Goal
Add "Teams" tab in RightInspector with color pickers to customize team colors.

## Current State (Completed)
- ✅ `TeamSetting` + `TeamSettings` types in `packages/core/src/types.ts`
- ✅ `DEFAULT_TEAM_SETTINGS` exported from core
- ✅ `BoardDocument.teamSettings` optional field
- ✅ `createDocument()` + `migrateDocument()` handle teamSettings  
- ✅ `PlayerNode` accepts `teamSettings` prop, uses `getTeamColors()`
- ✅ Store: `updateTeamSettings()` action + `getTeamSettings()` selector
- ✅ App.tsx passes `teamSettings` to `PlayerNode`

## Remaining Tasks

### 1. Create TeamsPanel Component (~20 min)
**File:** `packages/ui/src/TeamsPanel.tsx`

```tsx
interface TeamsPanelProps {
  teamSettings: TeamSettings;
  onUpdateTeam: (team: 'home' | 'away', settings: Partial<TeamSetting>) => void;
}

// Features:
// - Home Team section: name input + primaryColor picker
// - Away Team section: name input + primaryColor picker
// - Color presets grid (9 colors)
// - HEX input for custom colors
```

### 2. Add Teams Tab to RightInspector (~15 min)
**File:** `packages/ui/src/RightInspector.tsx`

- Add "Teams" tab button next to existing tabs
- Pass teamSettings + onUpdateTeam props
- Render TeamsPanel when Teams tab active

### 3. Wire Up in App.tsx (~5 min)
- Get `updateTeamSettings` action from store
- Pass to RightInspector

### 4. Export TeamsPanel (~2 min)
**File:** `packages/ui/src/index.ts`

## Color Presets
```typescript
const COLOR_PRESETS = [
  '#ef4444', // red
  '#f97316', // orange  
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ffffff', // white
  '#000000', // black
];
```

## Files to Edit/Create
- `packages/ui/src/TeamsPanel.tsx` - NEW: teams configuration panel
- `packages/ui/src/RightInspector.tsx` - add Teams tab
- `packages/ui/src/index.ts` - export TeamsPanel
- `apps/web/src/App.tsx` - pass updateTeamSettings to RightInspector

## Commands
```bash
pnpm dev  # test in browser
pnpm build  # verify build
```

## Acceptance Criteria
- [ ] RightInspector has "Teams" tab visible
- [ ] TeamsPanel shows Home/Away sections with color pickers
- [ ] Changing color immediately updates players on canvas
- [ ] Team colors persist in localStorage after save
