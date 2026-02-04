# Changelog

All notable changes to TMC Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
