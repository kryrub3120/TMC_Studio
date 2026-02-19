# Changelog

All notable changes to TMC Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **H6: Player Vision Toggle Stability** (2026-02-19)
  - Fixed Shift+V deterministic behavior: now sets all players to same state (no more "random" toggling)
  - Fixed default vision state for old documents: `undefined` now correctly normalized to `false` (opt-in)
  - Fixed portrait flip transform bug: `createPlayer()` now sets explicit `orientation: 0` (prevents NaN)
  - Toast feedback now shows player count: "Vision: ON — N player(s)"
  - Added comprehensive unit tests for vision toggle logic and orientation transforms

### Added
- **PR-L5-MINI: Offline/Online UX** (2026-02-09)
  - Online/offline detection using window events
  - TopBar save status indicator showing: Offline (red) / Saving... (blue) / Saved (green) / Unsaved (orange)
  - Non-blocking offline banner at top of screen
  - Smart cloud save that skips attempts when offline
  - Rate-limited save failure toasts (max once per 5 seconds)

### Improved
- **H3: ConfirmModal Component** (2026-02-09)
  - Replaced all `window.confirm()` calls with custom modal component
  - Full keyboard navigation: ESC (cancel), ENTER (confirm), Tab (focus trap)
  - Smart focus management: danger actions focus Cancel by default (safer)
  - Double-click protection with loading states
  - Focus returns to previous element after close
  - Mobile-friendly and accessible
  - Concrete copy with specific consequences (no generic "Are you sure?")

## [0.2.1] - 2026-02-04

### Changed
- **Mannequin PTU-style redesign** - Training mannequin redesigned with "Pro Training Unit" aesthetics:
  - Trapezoidal torso with equipment-like feel
  - 4 thin leg rods instead of solid block
  - Elliptical head shape
  - Base plate at ground level (rotation pivot)
  - New variant: `wall_3` (3 mannequins in a row)
- **Mannequin default color** - Changed from blue (#1e40af) to yellow (#fbbf24)
- **Print mode color handling** - Yellow equipment (mannequin/ladder) auto-converts to black for better paper visibility. Custom colors are preserved in both modes.

### Added
- Equipment variant `wall_3` for mannequin (3 mannequins with shared base)

## [0.2.0] - 2026-01-31

### Fixed
- **Zone orientation rotation bug** - Fixed coordinate transformation during pitch orientation toggle. Zones and other elements now maintain correct positions when switching between landscape/portrait modes. The issue was caused by incorrectly subtracting padding twice from inner pitch dimensions.
- **Formation presets in portrait mode** - Formation presets (1-6 shortcuts) now correctly position players when pitch is in portrait orientation. Goals appear at top/bottom instead of incorrectly at left/right.

### Changed
- Updated `getAbsolutePositions()` in formations.ts to accept orientation parameter
- Updated `applyFormation()` in elementsSlice.ts to use current pitch orientation
- Improved coordinate transformation logic in documentSlice.ts

## [0.1.0] - 2026-01-27

### Added
- Initial release of TMC Studio tactical board
- Player, ball, arrow, zone, text, equipment elements
- Multi-step animation system with playback
- Formation presets (4-3-3, 4-4-2, 4-4-2 diamond, 4-2-3-1, 3-5-2, 5-3-2)
- Pitch orientation toggle (landscape/portrait)
- Pitch themes (grass, indoor, chalk, futsal, custom)
- Layer visibility controls
- Keyboard shortcuts for all actions
- Export to PNG, PDF, GIF
- Cloud sync with Supabase
- Free and Pro tiers with Stripe integration
- Dark/light theme support
