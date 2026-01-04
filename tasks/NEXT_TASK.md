# Sprint 4 Progress

## ✅ Ukończone:
1. **S4.1 Export All Steps as PNGs** ✅
   - `handleExportAllSteps()` - iteruje przez wszystkie stepy
   - Eksportuje każdy jako osobny PNG (step-1.png, step-2.png, etc.)
   - Command palette: `Shift+Cmd+E` = Export All Steps
   - Wraca do oryginalnego stepu po eksporcie

## 📋 Pozostałe w Sprint 4:

### S4.2 Team Customization
```typescript
// Nowy state w document:
teamSettings: {
  home: { name: 'Home', primaryColor: '#ef4444', secondaryColor: '#ffffff' },
  away: { name: 'Away', primaryColor: '#3b82f6', secondaryColor: '#ffffff' }
}

// Inspector "Teams" tab z edycją
```

### S4.3 Advanced Elements
- Arrow curves (bezier with control point)
- Grid overlay toggle (G key currently shows toast)
- Snap to element edges

### S4.4 Export GIF/Video
- Use `gif.js` or `canvas-record` for GIF export
- Use `media-recorder` for video (WebM)

## Commands:
```bash
cd "/Users/krystianrubajczyk/Documents/PROGRAMOWANIE/TMC Studio "
pnpm dev
pnpm build
```

## ⚠️ UWAGA: Clear localStorage po S3!
```javascript
localStorage.removeItem('tmc-board');
location.reload();
```

## Git Status: ✅ PUSHED
- S3 complete: 3a64d54
- S4.1 Export Steps: 1e8250d
