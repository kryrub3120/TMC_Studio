# PR-FIX-6B: Folder Drag & Drop with Persistent Ordering

**Status:** ✅ Complete  
**Date:** 2026-02-12  
**Depends on:** PR-FIX-6 (Subfolders)

## What Changed

Added drag & drop for folders in the Projects drawer with:
- Drag folder onto another folder → becomes child (reparent)
- Persistent ordering via existing `position` column in DB
- Cycle prevention (cannot drop into own subtree)
- Context menu "Move to Root" for nested folders
- Grip handle visible on hover for drag initiation
- Sort by: pinned first → sortOrder → name fallback

### No Migration Required

The `position` column already existed on `project_folders` (from `20260109000002_add_project_organization.sql`). The existing index `idx_project_folders_position(user_id, position)` is sufficient.

## Files Modified

| File | Change |
|------|--------|
| `packages/ui/src/ProjectsDrawer.tsx` | Added `sortOrder` to `FolderItem`. `buildFolderTree()` now sorts by pinned→sortOrder→name. Added `isDescendantOf()` for cycle check, `computeSortOrder()` for fractional insert. Added `draggedFolderId` state with drag start/end/over/drop handlers. Grip handle icon on folder rows (visible on hover). "Move to Root" in folder context menu. Drop onto folder = reparent. |
| `apps/web/src/lib/supabase.ts` | Added `updateFolderPosition(folderId, parentId, position)` API function. |
| `apps/web/src/hooks/useProjectsController.ts` | Added `moveFolderToParent(folderId, parentId, position)` controller method. |
| `apps/web/src/app/AppShell.tsx` | Maps `f.position` → `sortOrder` in folder data. Passes `onMoveFolderToParent` to ModalOrchestrator. |
| `apps/web/src/app/orchestrators/ModalOrchestrator.tsx` | Added `onMoveFolderToParent` prop, passes through to ProjectsDrawer. |

## Key Implementation Details

### Cycle Prevention (`isDescendantOf`)
Walks up the ancestor chain from the target folder. If dragged folder is found as ancestor, the drop is blocked. Also handles circular guard with visited set.

### Sort Order Computation (`computeSortOrder`)
Uses fractional indexing:
- Between two siblings: `(before.sortOrder + after.sortOrder) / 2`
- At start: `first.sortOrder - 1000`
- At end: `last.sortOrder + 1000`
- Empty list: `1000`

### Drop Behavior
- **Drop folder onto folder row** → `onMoveFolderToParent(draggedId, targetId, positionAtEnd)`
- **Drop folder onto "All Projects"** → `onMoveFolderToParent(draggedId, null, positionAtEnd)` (move to root)
- **Drop into self/descendant** → silently ignored (no error toast)

### Visual Indicators
- **Grip handle** (6-dot icon): appears on hover, initiates drag
- **Drop target highlight**: `bg-accent/20 ring-2 ring-accent` + "Drop here" label
- **Dragged folder**: `opacity-50`

## How to Test

### Desktop
1. **Drag grip handle** on a folder → drag to another folder → verify it becomes a child
2. **Drag to "All Projects"** → verify folder moves to root level
3. **Try self-drop** → verify nothing happens (no crash)
4. **Try dropping into subtree** → verify nothing happens (cycle prevented)
5. **Refresh page** → verify order and hierarchy persisted
6. **Right-click nested folder** → "Move to Root" → verify it moves to root

### Mobile
1. **Long-press / right-click folder** → "Move to Root" context menu works
2. **No scroll blocking** during drag operations

## Limitations

- No between-folder reorder line indicator (only "drop into folder" highlight)
- No drag preview ghost (uses browser's default drag image)
- No autoscroll when dragging near drawer edges
- Fractional sortOrder could get very dense; normalization not yet implemented
- No "Move to folder..." modal selector (only drag or "Move to Root")
