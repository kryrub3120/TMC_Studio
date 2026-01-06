# Drawing Tools Enhancement

## Goal
Enhance freehand drawing tools with color picker, eraser, and stroke width options.

## Current State
- ✅ D = Freehand drawing (red pen)
- ✅ H = Highlighter (yellow)
- ✅ C = Clear all drawings
- ⏳ No color picker for drawings
- ⏳ No eraser (click to delete individual drawings)
- ⏳ No stroke width adjustment

## Deliverables

### 1. Drawing Color Picker in RightInspector
- [ ] Add "Drawing" section in Props tab when drawing selected
- [ ] Color picker for stroke color
- [ ] Apply to selected drawing element

Files:
- `packages/ui/src/RightInspector.tsx` - add Drawing panel
- `apps/web/src/store/useBoardStore.ts` - add updateDrawingProperties action

### 2. Eraser Tool (X key)
- [ ] Press X to enter eraser mode
- [ ] Click drawing element to delete it (not whole line eraser)
- [ ] Visual cursor change
- [ ] Toast "Eraser mode"

Files:
- `apps/web/src/App.tsx` - add eraser mode handling
- `apps/web/src/store/useUIStore.ts` - add 'eraser' to Tool type

### 3. Stroke Width Options  
- [ ] Alt+Left/Right to adjust drawing stroke width
- [ ] Show current width in RightInspector
- [ ] Range: 1-30px

Files:
- `apps/web/src/App.tsx` - extend adjustSelectedStrokeWidth for drawings
- `apps/web/src/store/useBoardStore.ts` - update for drawing elements

## Pattern Reference
Use `isDrawingElement()` from `@tmc/core` for type checking.
Drawing element structure:
```typescript
interface DrawingElement {
  id: string;
  type: 'drawing';
  drawingType: 'freehand' | 'highlighter';
  points: number[];
  color: string;       // <- editable via picker
  strokeWidth: number; // <- editable via Alt+Left/Right
  opacity: number;
}
```

## Commands
```bash
pnpm dev --filter @tmc/web
pnpm build
```

## Priority
1. Eraser (X key) - fastest UX improvement
2. Stroke width (Alt+Left/Right)
3. Color picker - most complex

## Commits from this session
- `fc27f74` - feat: Add Clear Drawings shortcut (C)
- `5a28ddb` - docs: Update ROADMAP  
- `e4b7535` - perf: manualChunks vendor splitting
