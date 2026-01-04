# S4.4 Export Options - Debug & Shortcuts

## Goal
Fix GIF export (gif.js worker issues) and add keyboard shortcuts for exports.

## Current State
- ✅ PNG export - works (Cmd+E)
- ✅ PDF export - works (via Command Palette)
- ✅ SVG export - works (via Command Palette)
- ❌ GIF export - fails (gif.js worker issue)

## Problem
gif.js requires a Web Worker which may not load correctly in Vite bundled builds. Options:
1. Use inline worker blob
2. Bundle worker separately
3. Use alternative library (modern-gif, gifenc)

## Suggested Fix
Replace gif.js with `modern-gif` or canvas-based approach without web workers.

## Keyboard Shortcuts to Add
```
Cmd+Shift+G = Export GIF
Cmd+Shift+P = Export PDF
```

## Files to Edit
- `apps/web/src/utils/exportUtils.ts` - Fix GIF implementation
- `apps/web/src/App.tsx` - Add keyboard shortcuts in handleKeyDown

## Commands
```bash
cd "/Users/krystianrubajczyk/Documents/PROGRAMOWANIE/TMC Studio"
pnpm dev
# Test exports in browser console if needed
```

## Commits from Previous Session (S4.3 + S4.4)
- `2cb8f4e` - fix: orientation transformation drift
- `8919a32` - fix: Print Friendly + Portrait zoom
- `8a3bd32` - feat: Add export options - GIF, PDF, SVG
- `ceddcc6` - fix: GIF export worker dependency

## Build Status
5/5 ✅ (but GIF runtime error)
