# PR-UX-DRAWER-TREE-REFACTOR: Unified Tree Drawer

**Status:** ✅ Complete  
**Date:** 2026-02-12  
**Depends on:** PR-FIX-6 (Subfolders), PR-FIX-6B (Folder DnD)

## What Changed

Replaced the two-section "folders sidebar + projects list" model with a unified hierarchy-driven tree drawer.

### Key Changes

1. **Removed `ViewMode`** — no more `all | favorites | folder` toggle. The tree IS the view.
2. **Removed pill-style sort buttons** — replaced with a `<select>` dropdown.
3. **New sort options**: Recent, Name (A-Z), Name (Z-A), Favorites first, Last opened.
4. **Sorting applies per folder context** — each folder's projects are sorted independently via `projectsByFolder` Map.
5. **"All Projects" is a virtual root node** showing root-level projects count.
6. **`selectedFolderId`** controls folder highlight only (no filtering).
7. **Projects grouped by `folderId`** using `projectsByFolder` useMemo (O(n) build).
8. **Pinned projects** section shows cross-folder pinned items at top.
9. **Root projects** (no `folderId`) render inline under "All Projects".

### Removed Dead Code

- `ViewMode` type
- `viewMode` / `setViewMode` state
- `filteredAndSortedProjects` memo (replaced by `projectsByFolder`)
- `unpinnedProjects` (replaced by `rootProjects.filter(not pinned)`)
- `favoritesCount` (favorites section removed — use sort dropdown instead)
- Old pill sort buttons (`updated`, `name`, `favorite` values)

## Files Modified

| File | Change |
|------|--------|
| `packages/ui/src/ProjectsDrawer.tsx` | Removed `ViewMode`. Replaced sort pills with dropdown. Added `sortProjects()` helper + `SORT_OPTIONS` constant. Added `searchFilteredProjects`, `projectsByFolder`, `rootProjects` memos. Inline projects rendered via `renderInlineProject` inside `renderFolder`. "All Projects" virtual root renders `rootProjects` inline. |

## UX Model

```
┌─────────────────────────────┐
│ Projects           [↻] [✕]  │
├─────────────────────────────┤
│ [+ New Project]              │
├─────────────────────────────┤
│ 🔍 Search...                 │
│ Sort by: [Recent ▼]         │
├─────────────────────────────┤
│ 📌 PINNED                   │
│   📌 Folder A (pinned)      │
│     ⚽ Project inside A      │
│ FOLDERS                      │
│   ▼ Folder B           (3)  │
│     ⚽ Project X   (3h ago)  │
│     ⚽ Project Y   (1d ago)  │
│     ⚽ Project Z   (2d ago)  │
│   ▶ Folder C           (0)  │
│     No projects yet          │
│   [+ New Folder]             │
│ ▼ 📋 All Projects      (2)  │
│     ⚽ Root Project 1        │
│     ⚽ Root Project 2        │
├─────────────────────────────┤
│ ✓ Cloud sync enabled        │
└─────────────────────────────┘
```

## Sorting Rules

| Option | Behavior |
|--------|----------|
| Recent | `updatedAt` descending |
| Name (A-Z) | `name.localeCompare` ascending |
| Name (Z-A) | `name.localeCompare` descending |
| Favorites first | Favorites first, then by recent |
| Last opened | Same as Recent (no separate `lastOpenedAt` field yet) |

- Sorting is **stable** (native `Array.sort` is stable in V8).
- Sorting is **deterministic** — same input always same output.
- Sorting does **not** affect folder tree order (folders use `sortOrder`/`name`).

## Folder Count Badge

- **Folder count = direct projects only** (`projects.filter(p => p.folderId === f.id).length`).
- Subfolder projects are **not** included in the parent badge.
- Rationale: direct count is faster to compute and mentally simpler for users ("what's directly in this folder").

## DnD Rules

### Supported Operations

| Drag source | Drop target | Result |
|-------------|-------------|--------|
| Project | Folder | Moves project into folder (`onMoveToFolder`) |
| Project | All Projects | Removes project from folder (`folderId → null`) |
| Folder | Folder (inside) | Reparents folder as child (`onMoveFolderToParent`) |
| Folder | Folder (above/below) | Reorders as sibling at target's parent level (reparents if needed) |
| Folder | All Projects | Moves folder to root (`parentId → null`) |

### Drop Position Detection

The cursor's Y position within the target element determines the drop zone:

| Y ratio | Zone | Visual feedback |
|---------|------|-----------------|
| 0–25% | `above` | Blue indicator line with dot above target |
| 25–75% | `inside` | Accent ring highlight + "Drop inside" label |
| 75–100% | `below` | Blue indicator line with dot below target |

- **Projects** always resolve to `inside` (no reorder between folders).
- **Folders** get the full above / inside / below detection.

### Drop Indicator Line

- 2px accent-colored line with a small circle at the left end.
- Indented to match the target folder's tree depth (`paddingLeft`).
- Uses CSS class `.dnd-indicator-line` with `position: absolute`.

### Auto-Expand on Drag Hover

- When dragging over a **collapsed** folder in the `inside` zone, a 600ms timer starts.
- After 600ms the folder auto-expands (removed from `collapsedFolderIds`).
- Timer is **cancelled** on:
  - Drag leave (cursor exits the element bounds)
  - Drop (any drop completes)
  - Drag end (drag operation cancelled)
  - Cursor moves to `above` or `below` zone of the same folder
- Only one auto-expand timer runs at a time (new target replaces old).

### Invalid Drop Prevention

| Rule | Guard |
|------|-------|
| Folder → itself | `draggedFolderId === folderId` early return |
| Folder → own descendant | `isDescendantOf(folders, targetId, draggedFolderId)` walk |
| Circular nesting | `buildFolderTree` ancestor walk during tree construction |

- Invalid targets do **not** call `e.preventDefault()`, so the browser shows "not allowed" cursor.
- No drop indicator is shown for invalid targets.

### Grip Handle

- Visible on folder row hover (opacity transition).
- `draggable` attribute on the grip `<span>`, not the entire row.
- Prevents click propagation to avoid selecting folder on drag start.

### Above / Below Reorder Semantics

When a folder is dropped **above** or **below** another folder:
- The dragged folder's `parentId` is set to the **target's parent** (i.e., it becomes a sibling).
- Its `sortOrder` is computed between the two adjacent siblings at that level.
- This means dropping folder A "above" a nested folder B (child of C) will reparent A under C, not move it to root.
- To move a folder to root, drop it on "All Projects" or use the "Move to Root" context menu.

### Search Auto-Expand

- When `searchQuery` is non-empty, all folders on the **ancestor path** of matching projects are auto-expanded.
- The user's manual collapse state is **snapshotted** before search begins and **restored** when search is cleared.
- Ancestor resolution uses a pre-built `parentIdMap` (O(n) build, O(depth) per project walk).

### State Management

- `dropIndicator: { targetId, position }` replaces the old `dropTargetFolderId`.
- `resetDndState()` clears all DnD state + cancels auto-expand timer.
- Called on: `dragEnd`, `drop` (after processing).

## Edge Cases

- **Circular parent_id**: detected in `buildFolderTree`, treated as root
- **Orphaned folder**: parent not found → treated as root
- **Delete parent folder**: DB `ON DELETE CASCADE` deletes children; projects set to `null`
- **Empty search**: shows all projects
- **No folders**: "All Projects" shows total count

## Remaining Limitations

- No drag preview ghost customization (browser default ghost)
- `last-opened` sort identical to `recent` (no separate timestamp)

## Completed (Phase 2)

The following were implemented in a follow-up pass:
- ✅ Projects rendered inline inside folders in the tree (`renderInlineProject`)
- ✅ "All Projects" is an expandable virtual root with inline root projects
- ✅ Empty folder state: "No projects yet" + "+ Create Project" button
- ✅ Bottom projects list removed entirely
- ✅ Compact inline project rows (7×7 thumbnail, condensed layout)
