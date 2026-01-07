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

## ✅ Sprint 4 — Export & Customization (COMPLETED)

### S4.1 Export Features ✓
- [x] Export single PNG (Cmd+E)
- [x] Export all steps as PNGs (Shift+Cmd+E)
- [x] Export animated GIF (Shift+Cmd+G) - using gifenc
- [x] Export multi-page PDF (Shift+Cmd+P) - one step per page
- [x] Export SVG (via Command Palette)

### S4.2 Team Customization ✓
- [x] Team name/color customization
- [x] PlayerNode uses teamSettings colors
- [x] Inspector "Teams" tab

### S4.3 Pitch Variants ✓
- [x] Portrait/Landscape orientation (O key)
- [x] Print Friendly mode (W key) - white pitch, black lines
- [x] Custom pitch colors
- [x] Show/hide stripes toggle
- [x] Inspector "Pitch" tab

### S4.4 Performance & Polish ✓
- [x] Keyboard shortcuts for all exports
- [x] Updated CheatSheet with all shortcuts
- [x] Updated README documentation
- [x] gifenc library (no Web Worker issues)

### S4.8 Freehand Drawing ✓
- [x] D = Freehand drawing (red pen 3px)
- [x] H = Highlighter (yellow 20px, 40% opacity)
- [x] C = Clear all drawings
- [x] Alt+Up/Down = Cycle drawing color
- [x] Alt+Left/Right = Adjust stroke width (1-30px)
- [x] DrawingNode renders in Konva canvas

---

## 🚀 Sprint 5 — Quality & UX (IN PROGRESS)

### S5.1 Performance Optimization ✓
- [x] Code splitting for smaller bundles (manualChunks)
- [x] Lazy load heavy components (jsPDF, gifenc via dynamic import)
- [x] Main bundle reduced from 560kB to 122kB (78% reduction!)
- [ ] Virtual scrolling for large element lists (future)
- [ ] Memoization audit (future)

### S5.2 Mobile & Touch Support
- [ ] Touch/mobile viewport support
- [ ] Pinch-to-zoom
- [ ] Touch pan/drag
- [ ] Responsive Inspector panel

### S5.3 Step Thumbnails
- [ ] Generate mini previews for each step
- [ ] Show thumbnails in BottomStepsBar
- [ ] Thumbnail caching

### S5.4 Drag Reorder Steps
- [ ] Drag steps to reorder
- [ ] Visual feedback during drag

### S5.5 Onion Skin Preview
- [ ] Ghost overlay showing previous/next step
- [ ] Toggle on/off
- [ ] Opacity control

### S5.6 Player UX Improvements ✓
- [x] Goalkeeper auto-detection (player #1 = yellow color)
- [x] Toggle "Is Goalkeeper" in Inspector
- [x] Copy/Paste (Cmd+C / Cmd+V) with clipboard support
- [x] Quick edit number (Double-click on player = inline input)

---

## 🔮 Sprint 6 — Desktop & Cloud (FUTURE)

### S6.1 Tauri Desktop App
- [ ] Lightweight native app wrapper
- [ ] Native file save/open dialogs
- [ ] Offline-first architecture

### S6.2 Cloud Features
- [ ] User accounts (auth)
- [ ] Project cloud sync
- [ ] Team collaboration
- [ ] Share links

### S6.3 Advanced Analysis
- [ ] Heat maps overlay
- [ ] Pass networks visualization
- [ ] Statistical overlays
- [ ] xG data integration

### S6.4 Video Export
- [ ] Export MP4 video
- [ ] Export WebM video
- [ ] Custom framerate
- [ ] Audio support

---

## 📊 Technical Debt Queue

- [ ] Unit tests for core logic (Vitest)
- [ ] E2E tests with Playwright
- [ ] Accessibility audit (a11y)
- [ ] Performance profiling
- [ ] Bundle size optimization
- [ ] Error boundaries

---

## 🏁 Release Milestones

| Version | Features | Status |
|---------|----------|--------|
| **0.1** | MVP Core (Sprint 1) | ✅ Done |
| **0.2** | Animation System (Sprint 2) | ✅ Done |
| **0.3** | Pro Features (Sprint 3) | ✅ Done |
| **0.4** | Export & Customization (Sprint 4) | ✅ Done |
| **0.5** | Quality & UX (Sprint 5) | 🔄 Next |
| **1.0** | Public Release | TBD |

---

*Last updated: 2026-01-07*
