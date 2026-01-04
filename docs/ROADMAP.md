# TMC Studio Roadmap

## 🎯 Vision
Ultra-fast football tactics board with step-based animation for analysts, coaches, and content creators.

---

## ✅ Sprint 1 — MVP Core (COMPLETED)

### S1.1 Foundation ✓
- [x] Monorepo setup (pnpm + Turborepo)
- [x] React + Vite web app
- [x] Konva canvas with pitch rendering
- [x] TypeScript strict mode
- [x] Tailwind CSS styling

### S1.2 Basic Elements ✓
- [x] Players (Home red, Away blue)
- [x] Ball element
- [x] Jersey numbers display
- [x] Drag and drop on pitch

### S1.3 UI Shell ✓
- [x] VS Code-like command palette (Cmd+K)
- [x] TopBar with project name
- [x] RightInspector with tabs (Props, Layers, Objects)
- [x] BottomStepsBar (placeholder)
- [x] Focus mode (F key)
- [x] Dark/Light theme toggle
- [x] Cheat sheet overlay (?)

### S1.4 Arrows & Zones ✓
- [x] Pass arrows (dashed, white)
- [x] Run arrows (solid, blue)
- [x] Click-drag drawing mode
- [x] Rectangular zones
- [x] Color and stroke customization

### S1.5 Selection & Edit ✓
- [x] Single selection
- [x] Multi-select with Shift+Click
- [x] Marquee selection (drag on empty)
- [x] Nudge with arrow keys (5px / 1px)
- [x] Delete, Duplicate, Undo/Redo
- [x] Color cycling (Alt+Up/Down)
- [x] Stroke width (Alt+Left/Right)

### S1.6 Multi-Selection Drag ✓
- [x] Drag multiple selected elements together
- [x] Works for players + ball
- [x] Single undo entry on release

### S1.7 Groups Core ✓
- [x] Create group (Ctrl+G)
- [x] Ungroup selection (Ctrl+Shift+G)
- [x] Groups stored in state
- [x] Select all group members on click

### S1.8 Groups UI ✓
- [x] Groups section in Layers tab
- [x] Toggle group visibility (hide/show all members)
- [x] Toggle group lock (UI ready)
- [x] Editable group names (double-click)
- [x] Member count display

### S1.9 Polish ✓
- [x] Zoom widget (in/out/fit)
- [x] Export PNG (Cmd+E)
- [x] Save to localStorage (Cmd+S)
- [x] Quick actions in Props tab
- [x] Layer visibility toggles
- [x] Toast notifications

---

## ✅ Sprint 2 — Animation System (COMPLETED)

### S2.1 Steps Timeline ✓
- [x] Multiple steps (animation frames)
- [x] Add/delete steps (N / X keys)
- [x] Step rename (double-click)
- [ ] Step thumbnails (future)
- [ ] Reorder steps drag (future)

### S2.2 Keyframe System ✓
- [x] Each step stores element positions
- [x] Deep clone between steps (no reference sharing)
- [x] Sync elements to document on each change
- [ ] Onion skin preview (future)

### S2.3 Playback ✓
- [x] Play/Pause button (Space)
- [x] Step duration dropdown (0.6s/0.8s/1.2s)
- [x] Auto-advance with requestAnimationFrame
- [x] Loop toggle (L key)

### S2.4 Interpolation ✓
- [x] Cubic easing between steps
- [x] Smooth player/ball movement
- [x] Arrow endpoints animation
- [x] Zone position+size animation

---

## ✅ Sprint 3 — Pro Features (COMPLETED)

### S3.1 Advanced Elements ✓
- [x] Text labels (T key, Enter to edit, ↑/↓ font size, ←/→ bold/italic, Shift+↑ background color)
- [x] Custom player shapes (S key: circle → square → triangle → diamond)
- [x] Ellipse zones (Shift+Z = ellipse, E = cycle shape)
- [x] Zone drawing preview for both rect and ellipse

### S3.2 Formations & Presets ✓
- [x] Formation templates (4-3-3, 4-4-2, 4-4-2♦, 4-2-3-1, 3-5-2, 5-3-2)
- [x] Quick apply formation (keys 1-6, Shift+1-6 for away)
- [x] Horizontal pitch orientation (Home left, Away right)

### S3.3 Arrow Improvements ✓
- [x] Pass arrows: bright red (#ff0000), 4px stroke
- [x] Run arrows: blue (#3b82f6), 3px stroke
- [x] Easy visibility and distinction

### S3.4 UI Polish ✓
- [x] CheatSheet updated with all new shortcuts
- [x] Default player shape = circle (explicit)

---

## 🚧 Sprint 4 — Export & Customization (IN PROGRESS)

### S4.1 Export Features
- [ ] Export all steps as PNGs (Shift+Cmd+E)
- [ ] Export GIF animation
- [ ] Export video (MP4/WebM)

### S4.2 Team Customization
- [ ] Team name/color customization
- [ ] PlayerNode uses teamSettings colors
- [ ] Inspector "Teams" tab

### S4.3 Advanced Elements
- [ ] Arrow curves (bezier with control point)
- [ ] Grid overlay toggle (G key)
- [ ] Configurable grid size
- [ ] Snap to element edges

### S4.4 Performance & Polish
- [ ] Code splitting for smaller bundles
- [ ] Touch/mobile support (pinch-zoom, pan)
- [ ] Accessibility improvements

---

## 🔮 Sprint 5 — Desktop & Cloud (FUTURE)

### S5.1 Tauri Desktop App
- [ ] Lightweight native app
- [ ] Native file save/open
- [ ] Offline-first

### S5.2 Cloud Sync
- [ ] User accounts
- [ ] Project sync
- [ ] Team collaboration

### S5.3 Advanced Analysis
- [ ] Heat maps
- [ ] Pass networks
- [ ] Statistical overlays

---

## 📊 Technical Debt Queue

- [ ] Performance optimization for large boards
- [ ] Code splitting for smaller bundles
- [ ] Unit tests for core logic
- [ ] E2E tests with Playwright
- [ ] Accessibility audit (a11y)
- [ ] Mobile viewport support

---

## 🏁 Release Milestones

| Version | Features | Target |
|---------|----------|--------|
| **0.1** | MVP Core (Sprint 1) | ✅ Done |
| **0.2** | Animation System (Sprint 2) | ✅ Done |
| **0.3** | Pro Features (Sprint 3) | ✅ Done |
| **0.4** | Export & Customization (Sprint 4) | In Progress |
| **1.0** | Public Release | TBD |

---

*Last updated: 2026-01-04*
