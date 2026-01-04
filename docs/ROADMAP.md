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

## 🚧 Sprint 2 — Animation System (NEXT)

### S2.1 Steps Timeline
- [ ] Multiple steps (animation frames)
- [ ] Add/delete steps
- [ ] Step thumbnails
- [ ] Reorder steps (drag)

### S2.2 Keyframe System
- [ ] Each step stores element positions
- [ ] Copy elements between steps
- [ ] Onion skin preview (ghost of prev/next step)

### S2.3 Playback
- [ ] Play/Pause button
- [ ] Step duration control
- [ ] Auto-advance animation
- [ ] Loop toggle

### S2.4 Interpolation
- [ ] Linear interpolation between steps
- [ ] Smooth element movement
- [ ] Easing functions (ease-in, ease-out)

---

## 📅 Sprint 3 — Pro Features

### S3.1 Advanced Elements
- [ ] Text labels
- [ ] Custom player shapes
- [ ] Arrow curves (bezier)
- [ ] Ellipse zones

### S3.2 Formations & Presets
- [ ] Formation templates (4-3-3, 4-4-2, etc.)
- [ ] Save custom presets
- [ ] Quick apply formation

### S3.3 Team Management
- [ ] Team name/color customization
- [ ] Player names/labels
- [ ] Team presets

### S3.4 Export & Share
- [ ] Export GIF/Video
- [ ] Export all steps as PNGs
- [ ] Share link generation
- [ ] Embed code

---

## 🔮 Sprint 4 — Desktop & Cloud

### S4.1 Tauri Desktop App
- [ ] Electron alternative (lighter)
- [ ] Native file save/open
- [ ] Offline-first

### S4.2 Cloud Sync
- [ ] User accounts
- [ ] Project sync
- [ ] Team collaboration

### S4.3 Advanced Analysis
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
| **0.2** | Animation System (Sprint 2) | Next |
| **0.3** | Pro Features (Sprint 3) | TBD |
| **1.0** | Public Release | TBD |

---

*Last updated: 2026-01-04*
