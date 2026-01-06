# Next Task: Sprint 5 Continue

## Completed Features

### S4.8 Freehand Drawing ✓
- D = Freehand drawing (red pen 3px)
- H = Highlighter (yellow 20px, 40% opacity)
- C = Clear all drawings
- Alt+Up/Down = Cycle drawing color
- Alt+Left/Right = Adjust stroke width (1-30px)

### S5.1 Performance Optimization ✓
- Main bundle: 560 kB → 122 kB (78% reduction!)
- Code splitting with manualChunks
- Lazy loading for jsPDF/gifenc

## Next Up (Sprint 5 remaining)

### S5.2 Mobile & Touch Support
- [ ] Touch viewport support
- [ ] Pinch-to-zoom
- [ ] Touch pan/drag
- [ ] Responsive Inspector

### S5.3 Step Thumbnails
- [ ] Generate mini previews
- [ ] Show in BottomStepsBar

### S5.4 Drag Reorder Steps
- [ ] Drag steps to reorder

---

## Quick Commands

```bash
pnpm dev --filter @tmc/web
pnpm build
```

## Latest Commits
- `642635f` - feat: Drawing color + stroke width
- `fc27f74` - feat: Clear Drawings (C key)
- `e4b7535` - perf: manualChunks vendor splitting
