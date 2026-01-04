# S4.4 Performance & Polish

## Goal
Optimize bundle size and improve mobile/touch support for production-ready app.

## Current State
- Sprint 4 core features complete (Export, Teams, Pitch)
- Bundle size: 542KB (warning at 500KB)
- No touch/mobile support yet
- No accessibility improvements

## Deliverables
- [ ] Code splitting for smaller bundles
  - [ ] Lazy load CommandPaletteModal
  - [ ] Lazy load CheatSheetOverlay
  - [ ] Split vendor chunks (react, konva, zustand)
- [ ] Touch/mobile support
  - [ ] Pinch-zoom gesture
  - [ ] Pan gesture
  - [ ] Touch drag elements
- [ ] Accessibility improvements
  - [ ] Keyboard navigation focus indicators
  - [ ] ARIA labels for buttons
  - [ ] Screen reader announcements

## Step-by-step Plan

1. **Code Splitting**
   ```typescript
   // Lazy load modals
   const CommandPaletteModal = lazy(() => import('./CommandPaletteModal'));
   const CheatSheetOverlay = lazy(() => import('./CheatSheetOverlay'));
   ```

2. **Vendor Chunks (vite.config.ts)**
   ```typescript
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'vendor-react': ['react', 'react-dom'],
           'vendor-konva': ['konva', 'react-konva'],
           'vendor-zustand': ['zustand'],
         }
       }
     }
   }
   ```

3. **Touch Events**
   - Add touch event handlers to Stage
   - Implement pinch-zoom with gesture recognition
   - Pan canvas on two-finger drag

## Files to edit
- `apps/web/vite.config.ts` - manual chunks
- `apps/web/src/App.tsx` - lazy imports, touch handlers
- `packages/ui/src/index.ts` - export lazy-loadable components

## Commands
```bash
pnpm build  # Check bundle sizes
pnpm dev    # Test locally
```
