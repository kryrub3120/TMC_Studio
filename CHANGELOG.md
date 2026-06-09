# Changelog

All notable changes to TMC Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed (User-Facing)
- **Aktualizacja domyślnych stylów wizualnych elementów** (2026-06-09)
  - **Text:** fontSize zmienione z 18 → 22, dodany domyślny backgroundColor `#ef4444` (czerwony)
  - **Arrow:** pass → `#1a1a1a` (ciemnoszary), run → `#f97316` (pomarańczowy), shoot → `#ef4444` (bez zmian, poprawiono dokumentację)
  - **Equipment:** ladder → `#eab308` (żółty), hurdle → `#4a4a4a` (ciemnoszary), goal → `#ffffff` (bez zmian)
  - Zmodyfikowane pliki: `packages/core/src/board.ts`, `packages/board/src/ArrowNode.tsx`, `packages/board/src/EquipmentNode.tsx` (komentarz), `docs/FEATURE_SPEC.md`
- **Refaktor Ball: SSOT kolorów piłki** (2026-06-09)
  - Rozszerzono typ `BallElement` o pola `color`, `strokeColor`, `strokeWidth`
  - Fabryka `createBall()` ustawia teraz domyślne wartości wizualne (`#ffffff`, `#1a1a1a`, `2`)
  - `BallNode.tsx` czyta kolory z elementu zamiast hardcoded w JSX — pełna personalizacja przez Inspector
  - Zmodyfikowane pliki: `packages/core/src/types.ts`, `packages/core/src/board.ts`, `packages/board/src/BallNode.tsx`
- **Refaktor Drawing: fabryka `createDrawing()`** (2026-06-09)
  - Utworzono `createDrawing(type, points)` w `packages/core/src/board.ts` — spójna fabryka z `DRAWING_DEFAULTS`
  - Zastąpiono inline'ową konstrukcję w `elementsSlice.ts` wywołaniem fabryki
  - Zmodyfikowane pliki: `packages/core/src/board.ts`, `apps/web/src/store/slices/elementsSlice.ts`
- **Print Friendly (W): full B/W sanitization** (2026-06-09)
  - **ArrowNode.tsx**: dodano `isPrintMode` do propsów. W trybie druku wszystkie strzałki renderują się na czarno (`#000000`), shoot ma 1.5× grubszą linię dla rozróżnienia
  - **TextNode.tsx**: `sanitizeTextColor()` zamienia TERAZ wszystkie kolory na czarny (nie tylko white). `backgroundColor` i shadow są wyłączone w print mode
  - **EquipmentNode.tsx**: `sanitizeForPrint()` zamienia WSZYSTKIE kolory na czarny (nie tylko white/yellow) — czysty B/W output
  - Propagacja `isPrintMode` → `ArrowNode` przez `CanvasElements.tsx` i `ArrowsLayer.tsx`
  - Zmodyfikowane pliki: `packages/board/src/ArrowNode.tsx`, `packages/board/src/TextNode.tsx`, `packages/board/src/EquipmentNode.tsx`, `apps/web/src/app/board/canvas/CanvasElements.tsx`, `apps/web/src/components/Canvas/layers/ArrowsLayer.tsx`

### Changed (Internal)
- **Audyt wydajności `useBoardPageState`** (2026-06-09)
  - **Etap 1 — Reaktywność stanu pochodnego:** `selectedElement`, `canUndo`/`canRedo`, `stepsData` przepisane na reaktywne selektory + `useMemo` zamiast wywoływania getterów w renderze. `playerOrientationSettings` stabilnie zmemoizowane z surowego `document.playerOrientationSettings`.
  - **Etap 2 — Stabilizacja pętli animacji:** `getCurrentStepIndex`/`getStepsCount` owinięte w `useCallback([])` w `useBoardPageEffects.ts`, eliminując restart RAF przy każdym renderze.
  - **Etap 3 — Twardy guard `ANIMATION_ENABLED`:** `useAnimationPlayback` nie startuje pętli ani nie wywołuje `setAnimationProgress`, gdy flaga `VITE_ANIMATION_ENABLED` jest wyłączona.
  - **Etap 4 — Higiena:** `exhaustive-deps` w efekcie post-mount inspector; mechanizm abort w `exportAllSteps`; usunięte 8 martwych handlerów z `useBoardPageState` (duplikatów z `useBoardPageHandlers`); usunięty alias `effectiveZoom`; poprawione rzutowanie typu `InspectorElement` dla arrow.
  - Zmodyfikowane pliki: `useBoardPageState.ts`, `useBoardPageEffects.ts`, `useAnimationPlayback.ts`, `useExportController.ts`, `useBoardPageHandlers.ts`.

### Added
- **ALT+Drag Player Rotation** (2026-02-21)
  - Rotate players by holding ALT and dragging with mouse
  - Works from both player body and vision cone area
  - Default snap: 5° (coarse adjustments), SHIFT+ALT: 1° (fine precision)
  - **Multi-selection support**: When multiple players selected, ALT+drag rotates all by same delta
  - Single history entry per gesture for clean undo/redo
  - Crosshair cursor for visual feedback
  - Works with all player shapes (circle/triangle/square/diamond)
  - Maintains relative orientations between players during group rotation

## [0.2.2] - 2026-02-20

### Fixed
- **Player Vision System** - Vision now correctly defaults to OFF via normalization (`undefined` → `false` opt-in). Global and per-player vision settings work deterministically. Vision is not zoom-gated (always visible when enabled).
- **Shift+V Keyboard Shortcut** - Deterministic all-players toggle: if ANY player has vision OFF → turn all ON, otherwise turn all OFF. Toast shows player count.
- **Player Orientation** - Fixed portrait flip transform bug: players now default to `orientation: 0` (north), preventing NaN issues. Orientation transforms correctly on landscape/portrait rotation.
- **Player Arms Rendering** - Arms now render ABOVE body (not behind), making them visible on all player shapes including circles (previously hidden by circle fill).
- **Player Number Rotation** - Numbers always stay readable with 180° flip when player is upside-down.
- **Arrow Colors** - Pass/Run arrows now white (#ffffff), Shoot arrows red (#ef4444).
- **Shot Arrow Rendering** - Professional arrowhead with proper unit vector geometry, fill-only rendering (no stroke), shafts stop cleanly at base, larger dimensions (18×12px), smooth caps and consistent hitbox.
- **Zone Default Color** - Changed from green (#22c55e) to red (#ef4444).

### Added
- Comprehensive unit tests for vision toggle logic and orientation transforms
- Release documentation: `docs/releases/0.2.2-vision-orientation-arrows.md`

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
