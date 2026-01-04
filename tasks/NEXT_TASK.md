# S4.2 Team Customization - Part 2

## Goal
Complete team color customization: wire App.tsx to pass teamSettings to PlayerNode, add "Teams" tab in RightInspector with color pickers.

## Current State (Completed)
- ✅ `TeamSetting` + `TeamSettings` types in `packages/core/src/types.ts`
- ✅ `DEFAULT_TEAM_SETTINGS` exported from core
- ✅ `BoardDocument.teamSettings` optional field
- ✅ `createDocument()` + `migrateDocument()` handle teamSettings
- ✅ `PlayerNode` accepts `teamSettings` prop, uses `getTeamColors()`
- ✅ Store: `updateTeamSettings()` action + `getTeamSettings()` selector

## Remaining Tasks

### 1. App.tsx Integration (~5 min)
Pass `teamSettings` from store to `PlayerNode`:

```tsx
// In App.tsx, inside render loop for players:
const teamSettings = useBoardStore((s) => s.getTeamSettings());

<PlayerNode
  key={player.id}
  player={player}
  pitchConfig={doc.pitchConfig}
  teamSettings={teamSettings}  // <-- ADD THIS
  isSelected={selectedIds.includes(player.id)}
  ...
/>
```

### 2. RightInspector "Teams" Tab (~30 min)
Add new tab in `packages/ui/src/RightInspector.tsx`:
- Tab selector: Element | Teams
- "Teams" panel shows:
  - Home Team: Color picker + name input
  - Away Team: Color picker + name input
- Color picker: reuse existing HEX input pattern

```tsx
// New component: TeamsPanel.tsx
interface TeamsPanelProps {
  teamSettings: TeamSettings;
  onUpdateTeam: (team: 'home' | 'away', settings: Partial<TeamSetting>) => void;
}

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

### 3. CheatSheetOverlay Update (~5 min)
No new shortcuts needed for S4.2.

## Files to Edit
- `apps/web/src/App.tsx` - pass teamSettings to PlayerNode
- `packages/ui/src/RightInspector.tsx` - add Teams tab
- `packages/ui/src/TeamsPanel.tsx` - NEW: teams configuration panel

## Commands
```bash
pnpm dev  # test in browser
pnpm build  # verify build
```

## Acceptance Criteria
- [ ] Players render with colors from `boardDoc.teamSettings`
- [ ] RightInspector has "Teams" tab visible
- [ ] Changing color in Teams tab immediately updates players
- [ ] Team colors persist in localStorage (document save)
- [ ] Formation shortcuts (1-6, Shift+1-6) use team colors
