# 🎬 Sprint 2: Animation Module - Complete Plan

**Goal:** World-class tactical animation system with top UX/UI

---

## ✅ COMPLETED

### S2.1 Steps Data Model
- [x] `currentStepIndex` in state
- [x] Step CRUD: `addStep`, `removeStep`, `duplicateStep`
- [x] Navigation: `goToStep`, `nextStep`, `prevStep`
- [x] Deep cloning (JSON) to avoid data sharing

### S2.2 BottomStepsBar UI
- [x] Step chips with active highlight (blue pill)
- [x] Click step → navigate
- [x] '+' button to add step
- [x] Prev/Next navigation buttons
- [x] Play/Pause button

### S2.6 Smooth Tweening
- [x] requestAnimationFrame animation
- [x] `animationProgress` state (0→1)
- [x] Linear interpolation (`lerp`) of positions
- [x] Ease-in-out cubic easing
- [x] Loop mode
- [x] Duration selector (0.6s / 0.8s / 1.2s)

---

## 🚧 REMAINING TASKS

### S2.3 Step Editing UX [Priority: HIGH]
- [ ] **Onion skin** - ghost of previous step (30% opacity) during editing
- [ ] **Step rename** - double-click chip to rename
- [ ] **Delete step** - X button on hover or context menu
- [ ] **Duplicate step** - right-click menu or button
- [ ] **Save step changes** - auto-save on element move

### S2.4 Keyboard Shortcuts [Priority: HIGH]
- [ ] `←` / `→` - Previous/Next step
- [ ] `Space` - Play/Pause toggle
- [ ] `L` - Toggle loop
- [ ] `N` - Add new step
- [ ] `⌘⌫` - Delete current step (with confirmation)

### S2.5 Advanced Playback Controls [Priority: MEDIUM]
- [ ] **Progress scrubber** - drag to seek within step transition
- [ ] **Speed controls** - 0.5x, 1x, 2x playback speed
- [ ] **Step progress indicator** - visual progress bar under chips
- [ ] **Auto-pause on manual edit** - stop playback when user interacts

### S2.7 Visual Feedback [Priority: HIGH]
- [ ] **Transition trails** - fading path showing movement trajectory
- [ ] **Step indicator glow** - pulsing animation on current step chip
- [ ] **Playing state UI** - dim editing controls during playback
- [ ] **Step count badge** - show total steps in TopBar

### S2.8 Step Reordering [Priority: MEDIUM]
- [ ] **Drag & drop chips** - reorder steps by dragging
- [ ] **Visual drag handle** - grip icon on hover
- [ ] **Drop indicator** - line showing drop position

### S2.9 Context Menu [Priority: MEDIUM]
- [ ] Right-click on step chip → context menu
  - "Rename"
  - "Duplicate"
  - "Delete"
  - "Insert Before"
  - "Insert After"
  - "Copy positions from..."

### S2.10 Arrows Animation [Priority: HIGH]
- [ ] Interpolate arrow endpoints between steps
- [ ] Animate arrow appearance (fade-in/grow)
- [ ] Running dash animation for "run" arrows

### S2.11 Zones Animation [Priority: MEDIUM]
- [ ] Interpolate zone position/size between steps
- [ ] Fade in/out zones that appear/disappear

### S2.12 Export Enhancements [Priority: LOW]
- [ ] Export current step as PNG
- [ ] Export all steps as PNG sequence
- [ ] Export as animated GIF (defer to Sprint 3)
- [ ] Export as MP4 (defer to Sprint 3)

---

## 📋 IMPLEMENTATION ORDER

### Phase 1: Core UX (Today)
1. **S2.4 Keyboard shortcuts** - ←→ Space L N
2. **S2.3 Step rename/delete** - X button, double-click rename
3. **S2.7 Play state UI** - disable editing during playback

### Phase 2: Visual Polish
4. **S2.3 Onion skin** - ghost of previous step
5. **S2.10 Arrows animation** - interpolate arrow endpoints
6. **S2.7 Transition trails** - optional movement paths

### Phase 3: Advanced Features
7. **S2.8 Step reordering** - drag & drop
8. **S2.9 Context menu** - right-click actions
9. **S2.5 Progress scrubber** - seek control

---

## 🎨 UX POLISH CHECKLIST

### Micro-interactions
- [ ] Step chip hover scale (1.02x)
- [ ] Add button pulse on empty board
- [ ] Play button icon morph (▶️ ↔ ⏸️)
- [ ] Smooth chip width transition on rename
- [ ] Delete confirmation with undo toast

### Visual Design
- [ ] Accent color gradient on active step
- [ ] Step number badge in chip
- [ ] Playback progress bar (thin line)
- [ ] Disabled state styling during playback
- [ ] Dark mode support (already done ✅)

### Accessibility
- [ ] Keyboard navigation through steps
- [ ] Screen reader announcements
- [ ] Focus indicators on all controls
- [ ] ARIA labels for buttons

---

## 🏁 DEFINITION OF DONE

Animation module is complete when:
1. ✅ User can create, edit, delete, reorder steps
2. ✅ Smooth 60fps playback with easing
3. ✅ Full keyboard control (←→ Space L N)
4. ✅ Visual feedback (onion skin, trails)
5. ✅ All elements animate (players, ball, arrows, zones)
6. ✅ Export current step as PNG
7. ✅ Professional UX polish

---

## 📊 EFFORT ESTIMATES

| Task | Effort | Priority |
|------|--------|----------|
| Keyboard shortcuts (S2.4) | 20 min | 🔴 HIGH |
| Delete/rename step (S2.3) | 30 min | 🔴 HIGH |
| Play state UI (S2.7) | 15 min | 🔴 HIGH |
| Onion skin (S2.3) | 45 min | 🟡 MEDIUM |
| Arrows animation (S2.10) | 30 min | 🔴 HIGH |
| Step reordering (S2.8) | 60 min | 🟡 MEDIUM |
| Progress scrubber (S2.5) | 45 min | 🟢 LOW |
| Context menu (S2.9) | 30 min | 🟢 LOW |
| Zones animation (S2.11) | 20 min | 🟡 MEDIUM |

**Total remaining:** ~5-6 hours

---

*Created: 2025-01-04*
*Last Updated: 2025-01-04*
