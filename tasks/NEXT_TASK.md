# S4.3 Pitch Variants (Optional Polish)

## Goal
Add support for different pitch appearances and customization options.

## S4.2 Completed ✅
- TeamSettings types in core (name, primaryColor, secondaryColor)
- DEFAULT_TEAM_SETTINGS: red (#ef4444) + blue (#3b82f6)
- PlayerNode uses teamSettings prop with getTeamColors()
- Store: updateTeamSettings() + getTeamSettings()
- TeamsPanel component with color pickers + presets
- RightInspector "Teams" tab integration
- Full wiring in App.tsx

## Next Sprint Options

### Option A: S4.3 Pitch Variants (~2h)
- Add pitch theme selector (grass, indoor, futsal)
- Line color customization
- Pitch size presets (11v11, 7v7, 5v5)

### Option B: S5 Selection & Multi-edit (~3h)
- Improve multi-select experience
- Bulk property editing in Props tab
- Selection info display

### Option C: S6 Import/Export Enhancements (~2h)
- Export to SVG format
- Import formations from JSON
- Template saving/loading

### Option D: S7 Undo/Redo Improvements (~1h)
- Show undo/redo history
- Named history steps
- History navigation

## Commands
```bash
pnpm dev  # test in browser
pnpm build  # verify build
```

## Files Modified in S4.2
- `packages/core/src/types.ts` - TeamSetting, TeamSettings
- `packages/core/src/board.ts` - DEFAULT_TEAM_SETTINGS, createDocument, migrateDocument
- `packages/core/src/index.ts` - exports
- `packages/board/src/PlayerNode.tsx` - teamSettings prop, getTeamColors()
- `packages/ui/src/TeamsPanel.tsx` - NEW
- `packages/ui/src/RightInspector.tsx` - Teams tab
- `packages/ui/src/index.ts` - export TeamsPanel
- `packages/ui/package.json` - @tmc/core dependency
- `apps/web/src/store/useBoardStore.ts` - updateTeamSettings, getTeamSettings
- `apps/web/src/App.tsx` - Pass teamSettings + onUpdateTeam
