# PR-FIX-6: Subfolders (Nested Folders) in Projects UI

**Status:** ✅ Complete  
**Date:** 2026-02-12

## What Changed

Enabled true folder hierarchy (nested folders) in the Projects drawer.
The backend `project_folders` table already had `parent_id` support — this PR wires
it through to the UI with tree rendering, collapse/expand, and subfolder creation.

### Key Decisions

- **Delete parent → cascade delete children** (enforced by DB constraint `ON DELETE CASCADE`).
  Projects inside deleted folders are NOT deleted — they become unassigned (`folder_id` set to NULL via `ON DELETE SET NULL`).
- **Circular parent references** are detected and ignored in `buildFolderTree()` — such folders render as root.
- **Orphaned folders** (parent_id references a non-existent folder) are treated as root folders.
- **No drag-and-drop reordering** of folders in tree yet (future work).

## Files Modified

| File | Change |
|------|--------|
| `packages/ui/src/ProjectsDrawer.tsx` | Added `parentId`, `children` to `FolderItem` interface. Added `buildFolderTree()` helper. Replaced flat folder rendering with recursive `renderFolder(folder, level)`. Added collapse/expand state (`collapsedFolderIds`). "New Folder" button passes `selectedFolderId` as parentId when a folder is selected. |
| `packages/ui/src/index.ts` | Exported `FolderItem` type. |
| `apps/web/src/hooks/useProjectsController.ts` | `createFolder` now accepts optional `parentId` parameter. Updated delete folder confirm message to mention subfolders. |
| `apps/web/src/app/AppShell.tsx` | Added `createFolderParentId` state. Passes `parentId: f.parent_id` in folder mapping. Wires parentId through create folder flow. |
| `apps/web/src/app/orchestrators/ModalOrchestrator.tsx` | Updated `projectsFolders` type to `FolderItem[]`. Updated `onOpenCreateFolderModal` to accept `parentFolderId`. |

## How It Works

### Data Flow

1. `getFolders()` returns flat list with `parent_id` from Supabase
2. `AppShell` maps `parent_id` → `parentId` for each folder
3. `ProjectsDrawer.buildFolderTree()` converts flat list → tree
4. `renderFolder(folder, level)` recursively renders with indentation

### UI Behavior

- **Click folder label** → selects folder (shows its projects)
- **Click arrow icon** → expands/collapses children (no selection change)
- **Indentation**: 12px per nesting level (base 16px)
- **Arrow icon** rotates 90° when expanded
- **"New Folder" button** creates subfolder if a folder is selected, otherwise root folder
- **Pinned folders** render in their own section (only root-level pins)

### Subfolder Creation

1. Select a folder in the drawer
2. Click "New Subfolder" button (label changes when a folder is selected)
3. CreateFolderModal opens, folder is created with `parent_id` = selected folder's ID
4. After refresh, nested hierarchy is preserved

## How to Test

1. **Create root folder**: Open Projects drawer → click "New Folder"
2. **Create subfolder**: Select a folder → click "New Subfolder" → verify it appears nested
3. **Collapse/expand**: Click arrow icon on a folder with children → children toggle
4. **Delete parent**: Delete a folder with subfolders → verify subfolders also deleted, projects remain
5. **Reload**: Refresh page → open drawer → verify hierarchy persisted
6. **Circular protection**: (DB constraint prevents self-reference; UI ignores any remaining circulars)

## Extensions

- **PR-FIX-6B** (`docs/PR-FIX-6B-FOLDER-DND.md`): Adds drag & drop for folder reorder/reparent with persistent sortOrder and cycle prevention.

## Limitations

- Maximum nesting depth is not enforced in UI (practical limit ~4-5 levels due to drawer width)
