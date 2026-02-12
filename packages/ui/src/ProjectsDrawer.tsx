/**
 * Projects Drawer - Cloud project management
 * Slide-out panel for listing, creating, and managing projects
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

export interface ProjectItem {
  id: string;
  name: string;
  updatedAt: string;
  thumbnailUrl?: string;
  isCloud: boolean;
  isFavorite?: boolean;
  isPinned?: boolean;
  tags?: string[];
  folderId?: string | null;
}

export interface FolderItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  isPinned?: boolean;
  parentId?: string | null;
  sortOrder?: number;
  projectCount?: number;
  children?: FolderItem[];
}

/**
 * Build a tree structure from flat folder list.
 * Root folders have parentId === null/undefined.
 * Orphaned folders (parent not found) are treated as root.
 * Circular references are ignored (folder treated as root).
 */
function buildFolderTree(folders: FolderItem[]): FolderItem[] {
  const map = new Map<string, FolderItem>();
  const roots: FolderItem[] = [];

  // First pass: create nodes with empty children arrays
  for (const folder of folders) {
    map.set(folder.id, { ...folder, children: [] });
  }

  // Second pass: attach children to parents
  for (const folder of folders) {
    const node = map.get(folder.id)!;
    const parentId = folder.parentId;

    if (parentId && map.has(parentId) && parentId !== folder.id) {
      // Guard against circular: walk up ancestors to check
      let ancestor = map.get(parentId);
      let isCircular = false;
      const visited = new Set<string>([folder.id]);
      while (ancestor) {
        if (visited.has(ancestor.id)) {
          isCircular = true;
          break;
        }
        visited.add(ancestor.id);
        ancestor = ancestor.parentId ? map.get(ancestor.parentId) : undefined;
      }

      if (!isCircular) {
        map.get(parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  // Sort: pinned first, then sortOrder, then name fallback
  const sortFolders = (list: FolderItem[]) => {
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });
    for (const node of list) {
      if (node.children && node.children.length > 0) sortFolders(node.children);
    }
  };

  sortFolders(roots);
  return roots;
}

/**
 * Check if candidateAncestorId is an ancestor of folderId in the tree.
 * Used to prevent dropping a folder into its own subtree.
 */
function isDescendantOf(folders: FolderItem[], folderId: string, candidateAncestorId: string): boolean {
  const map = new Map<string, FolderItem>();
  for (const f of folders) map.set(f.id, f);
  
  let current = map.get(folderId);
  const visited = new Set<string>();
  while (current) {
    if (current.id === candidateAncestorId) return true;
    if (visited.has(current.id)) return false; // circular guard
    visited.add(current.id);
    current = current.parentId ? map.get(current.parentId) : undefined;
  }
  return false;
}

/**
 * Compute a new sortOrder for inserting between two siblings.
 */
function computeSortOrder(siblings: FolderItem[], insertIndex: number): number {
  if (siblings.length === 0) return 1000;
  if (insertIndex <= 0) return (siblings[0].sortOrder ?? 0) - 1000;
  if (insertIndex >= siblings.length) return (siblings[siblings.length - 1].sortOrder ?? 0) + 1000;
  const before = siblings[insertIndex - 1].sortOrder ?? 0;
  const after = siblings[insertIndex].sortOrder ?? 0;
  return (before + after) / 2;
}

type SortOption = 'recent' | 'name-asc' | 'name-desc' | 'favorites' | 'last-opened';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'favorites', label: 'Favorites first' },
  { value: 'last-opened', label: 'Last opened' },
];

function sortProjects(list: ProjectItem[], sort: SortOption): ProjectItem[] {
  return [...list].sort((a, b) => {
    switch (sort) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'favorites': {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      case 'last-opened':
      case 'recent':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });
}

interface ProjectsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectItem[];
  folders?: FolderItem[];
  currentProjectId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onCreateFolder?: (parentFolderId?: string | null) => void;
  onToggleFavorite?: (projectId: string) => void;
  onTogglePinProject?: (projectId: string) => void;
  onTogglePinFolder?: (folderId: string) => void;
  onMoveToFolder?: (projectId: string, folderId: string | null) => void;
  onEditFolder?: (folderId: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onRenameProject?: (projectId: string, newName: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onMoveFolderToParent?: (folderId: string, parentId: string | null, position: number) => void;
  onSignIn: () => void;
  onRefresh?: () => void;
}

export function ProjectsDrawer({
  isOpen,
  onClose,
  projects,
  folders = [],
  currentProjectId,
  isAuthenticated,
  isLoading,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onDuplicateProject,
  onCreateFolder,
  onToggleFavorite,
  onTogglePinProject,
  onTogglePinFolder,
  onMoveToFolder,
  onEditFolder: _onEditFolder,
  onDeleteFolder: _onDeleteFolder,
  onRenameProject: _onRenameProject,
  onRenameFolder: _onRenameFolder,
  onMoveFolderToParent,
  onSignIn,
  onRefresh,
}: ProjectsDrawerProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  
  // Inline rename states (TODO: implement inline renaming)
  const [_renamingProjectId, _setRenamingProjectId] = useState<string | null>(null);
  const [_renamingFolderId, _setRenamingFolderId] = useState<string | null>(null);
  const [_renameValue, _setRenameValue] = useState('');
  
  // Collapse/expand state for folder tree
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());
  
  // Search auto-expand: snapshot of user's collapse state before search
  const preSearchCollapsedRef = useRef<Set<string> | null>(null);
  
  // Drag & drop states
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  
  // Drop indicator: position-aware (above / below / inside)
  const [dropIndicator, setDropIndicator] = useState<{
    /** Target folder id, or '__all_projects__' for root zone */
    targetId: string;
    /** 'above' | 'below' = sibling reorder line; 'inside' = nest into folder */
    position: 'above' | 'below' | 'inside';
  } | null>(null);

  // Auto-expand collapsed folders on sustained drag hover (600ms)
  const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoExpandTargetRef = useRef<string | null>(null);

  /** Cancel any pending auto-expand timer */
  const cancelAutoExpand = useCallback(() => {
    if (autoExpandTimerRef.current) {
      clearTimeout(autoExpandTimerRef.current);
      autoExpandTimerRef.current = null;
    }
    autoExpandTargetRef.current = null;
  }, []);

  /** Start auto-expand timer for a collapsed folder */
  const scheduleAutoExpand = useCallback((folderId: string) => {
    // Don't restart if already scheduled for the same folder
    if (autoExpandTargetRef.current === folderId) return;
    cancelAutoExpand();
    autoExpandTargetRef.current = folderId;
    autoExpandTimerRef.current = setTimeout(() => {
      setCollapsedFolderIds(prev => {
        if (!prev.has(folderId)) return prev;
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
      autoExpandTargetRef.current = null;
      autoExpandTimerRef.current = null;
    }, 600);
  }, [cancelAutoExpand]);

  // Cleanup auto-expand timer on unmount
  useEffect(() => cancelAutoExpand, [cancelAutoExpand]);

  // Search-filtered projects
  const searchFilteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.tags?.some(t => t.toLowerCase().includes(query))
    );
  }, [projects, searchQuery]);

  // Projects grouped by folder (direct children only)
  const projectsByFolder = useMemo(() => {
    const map = new Map<string | null, ProjectItem[]>();
    for (const p of searchFilteredProjects) {
      const key = p.folderId ?? null;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    // Sort each group
    for (const [key, list] of map.entries()) {
      map.set(key, sortProjects(list, sortBy));
    }
    return map;
  }, [searchFilteredProjects, sortBy]);

  // Root projects (no folder)
  const rootProjects = projectsByFolder.get(null) ?? [];
  
  // Folders with project count
  const foldersWithCount = useMemo(() => {
    return folders.map(f => ({
      ...f,
      projectCount: projects.filter(p => p.folderId === f.id).length,
    }));
  }, [folders, projects]);
  
  // Parent ID map for O(1) ancestor lookups — built once per folder list change
  const parentIdMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const f of folders) {
      map.set(f.id, f.parentId ?? null);
    }
    return map;
  }, [folders]);

  // Compute set of folder IDs on ancestor paths of search-matching projects.
  // Only non-empty when searchQuery is active.
  const searchAncestorFolderIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const ancestors = new Set<string>();
    for (const p of searchFilteredProjects) {
      let fId = p.folderId ?? null;
      const visited = new Set<string>();
      while (fId && !visited.has(fId)) {
        ancestors.add(fId);
        visited.add(fId);
        fId = parentIdMap.get(fId) ?? null;
      }
    }
    // Also expand '__all_projects__' if there are root matches
    if (searchFilteredProjects.some(p => !p.folderId)) {
      ancestors.add('__all_projects__');
    }
    return ancestors;
  }, [searchQuery, searchFilteredProjects, parentIdMap]);

  // Search auto-expand effect: snapshot → expand → restore
  useEffect(() => {
    const isSearching = searchQuery.trim().length > 0;
    
    if (isSearching) {
      // Snapshot current collapse state (only on first search keystroke)
      if (preSearchCollapsedRef.current === null) {
        preSearchCollapsedRef.current = new Set(collapsedFolderIds);
      }
      // Expand all ancestor folders (remove them from collapsed set)
      setCollapsedFolderIds(prev => {
        if (searchAncestorFolderIds.size === 0) return prev;
        const next = new Set(prev);
        for (const id of searchAncestorFolderIds) {
          next.delete(id);
        }
        // Also expand '__all_projects__' when root projects match
        if (searchAncestorFolderIds.has('__all_projects__')) {
          next.delete('__all_projects__');
        }
        return next;
      });
    } else {
      // Restore previous collapse state when search is cleared
      if (preSearchCollapsedRef.current !== null) {
        setCollapsedFolderIds(preSearchCollapsedRef.current);
        preSearchCollapsedRef.current = null;
      }
    }
  }, [searchQuery, searchAncestorFolderIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Separate pinned and unpinned folders (from tree roots only)
  const folderTree = useMemo(() => buildFolderTree(foldersWithCount), [foldersWithCount]);
  const pinnedFolders = folderTree.filter(f => f.isPinned);
  const unpinnedFolders = folderTree.filter(f => !f.isPinned);
  
  // Whether we're in search mode (tree always shows, but some chrome is hidden)
  const isSearching = searchQuery.trim().length > 0;

  // Toggle collapse/expand for a folder
  const toggleFolderCollapse = (folderId: string) => {
    setCollapsedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Context menu handlers
  const handleProjectContextMenu = (e: React.MouseEvent, project: ProjectItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    const items: ContextMenuItem[] = [
      {
        label: project.isPinned ? 'Unpin' : 'Pin to Top',
        icon: '📌',
        onClick: () => onTogglePinProject?.(project.id),
      },
      {
        label: project.isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
        icon: '⭐',
        onClick: () => onToggleFavorite?.(project.id),
      },
      {
        label: 'Duplicate',
        icon: '📋',
        onClick: () => onDuplicateProject(project.id),
      },
      {
        label: 'Delete',
        icon: '🗑️',
        onClick: () => onDeleteProject(project.id),
        variant: 'danger' as const,
        divider: true,
      },
    ];
    
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: FolderItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    const items: ContextMenuItem[] = [
      {
        label: folder.isPinned ? 'Unpin' : 'Pin to Top',
        icon: '📌',
        onClick: () => onTogglePinFolder?.(folder.id),
      },
      {
        label: 'Edit Folder',
        icon: '✏️',
        onClick: () => _onEditFolder?.(folder.id),
      },
    ];
    
    // "Move to root" for nested folders
    if (folder.parentId && onMoveFolderToParent) {
      items.push({
        label: 'Move to Root',
        icon: '⬆️',
        onClick: () => {
          const rootSiblings = foldersWithCount.filter(f => !f.parentId);
          const newPosition = computeSortOrder(rootSiblings, rootSiblings.length);
          onMoveFolderToParent(folder.id, null, newPosition);
        },
      });
    }
    
    items.push({
      label: 'Delete Folder',
      icon: '🗑️',
      onClick: () => _onDeleteFolder?.(folder.id),
      variant: 'danger' as const,
      divider: true,
    });
    
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  /** Reset all DnD state */
  const resetDndState = useCallback(() => {
    setDraggedProjectId(null);
    setDraggedFolderId(null);
    setDropIndicator(null);
    cancelAutoExpand();
  }, [cancelAutoExpand]);

  // Drag & drop handlers
  const handleProjectDragStart = (e: React.DragEvent, projectId: string) => {
    e.stopPropagation();
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', projectId);
  };

  const handleProjectDragEnd = () => {
    resetDndState();
  };

  // Folder drag start (from grip handle)
  const handleFolderDragStart = (e: React.DragEvent, folderId: string) => {
    e.stopPropagation();
    setDraggedFolderId(folderId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-folder-id', folderId);
  };

  const handleFolderDragEnd = () => {
    resetDndState();
  };

  /**
   * Compute drop position from cursor Y within the element.
   * Top 25% = above, bottom 25% = below, middle 50% = inside.
   * For projects being dragged, only 'inside' makes sense (move to folder).
   */
  const computeDropPosition = (
    e: React.DragEvent,
    _targetId: string,
  ): 'above' | 'below' | 'inside' => {
    // Projects always drop "inside" a folder
    if (draggedProjectId) return 'inside';
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const ratio = y / rect.height;
    
    if (ratio < 0.25) return 'above';
    if (ratio > 0.75) return 'below';
    return 'inside';
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    if (!draggedProjectId && !draggedFolderId) return;
    
    // Prevent dropping folder into itself or its own subtree
    if (draggedFolderId) {
      if (draggedFolderId === folderId) return;
      if (isDescendantOf(foldersWithCount, folderId, draggedFolderId)) return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    const position = computeDropPosition(e, folderId);
    setDropIndicator({ targetId: folderId, position });
    
    // Auto-expand collapsed folder when hovering "inside" zone
    if (position === 'inside' && collapsedFolderIds.has(folderId)) {
      scheduleAutoExpand(folderId);
    } else {
      cancelAutoExpand();
    }
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // Only clear if actually leaving the element
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDropIndicator(null);
      cancelAutoExpand();
    }
  };

  /** "All Projects" zone drag over */
  const handleAllProjectsDragOver = (e: React.DragEvent) => {
    if (!draggedProjectId && !draggedFolderId) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropIndicator({ targetId: '__all_projects__', position: 'inside' });
    cancelAutoExpand();
  };

  const handleFolderDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    const indicator = dropIndicator;
    
    // Folder-to-folder drop
    if (draggedFolderId && onMoveFolderToParent) {
      if (draggedFolderId === folderId) {
        resetDndState();
        return;
      }
      // Cycle check
      if (folderId && isDescendantOf(foldersWithCount, folderId, draggedFolderId)) {
        resetDndState();
        return;
      }
      
      // If dropping "inside" a folder, reparent as child
      // If dropping "above" or "below", reparent as sibling of target
      if (indicator && folderId && (indicator.position === 'above' || indicator.position === 'below')) {
        // Find the target folder's parent
        const targetFolder = foldersWithCount.find(f => f.id === folderId);
        const parentId = targetFolder?.parentId ?? null;
        const siblings = foldersWithCount.filter(f =>
          parentId ? f.parentId === parentId : !f.parentId
        );
        const targetIndex = siblings.findIndex(f => f.id === folderId);
        const insertIndex = indicator.position === 'above' ? targetIndex : targetIndex + 1;
        const newPosition = computeSortOrder(siblings, insertIndex);
        onMoveFolderToParent(draggedFolderId, parentId, newPosition);
      } else {
        // "inside" — reparent as child of folderId (or root if null)
        const targetChildren = foldersWithCount.filter(f => 
          folderId ? f.parentId === folderId : !f.parentId
        );
        const newPosition = computeSortOrder(targetChildren, targetChildren.length);
        onMoveFolderToParent(draggedFolderId, folderId, newPosition);
      }
      resetDndState();
      return;
    }
    
    // Project-to-folder drop
    if (draggedProjectId) {
      onMoveToFolder?.(draggedProjectId, folderId);
      resetDndState();
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  /**
   * Recursive folder renderer with indentation and collapse/expand.
   * - Click arrow = toggle collapse (no selection change)
   * - Click label = select folder
   */
  /**
   * Render a compact inline project row inside the tree.
   */
  const renderInlineProject = (project: ProjectItem, level: number): React.ReactNode => {
    const padLeft = 16 + level * 12;
    const isCurrent = currentProjectId === project.id;
    const isHovered = hoveredId === project.id;
    const isDragged = draggedProjectId === project.id;

    return (
      <div
        key={project.id}
        draggable={onMoveToFolder !== undefined}
        onDragStart={(e) => handleProjectDragStart(e, project.id)}
        onDragEnd={handleProjectDragEnd}
        className={`group/proj flex items-center gap-2 py-1.5 pr-3 cursor-pointer transition-colors ${
          isCurrent ? 'bg-accent/15 text-accent' : 'hover:bg-surface2 text-text'
        } ${isDragged ? 'opacity-50' : ''}`}
        style={{ paddingLeft: padLeft }}
        onClick={() => onSelectProject(project.id)}
        onContextMenu={(e) => handleProjectContextMenu(e, project)}
        onMouseEnter={() => setHoveredId(project.id)}
        onMouseLeave={() => {
          setHoveredId(null);
          if (deleteConfirmId === project.id) setDeleteConfirmId(null);
        }}
      >
        {/* Thumbnail */}
        <div className="w-7 h-7 rounded bg-surface2 flex-shrink-0 overflow-hidden">
          {project.thumbnailUrl ? (
            <img src={project.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm">⚽</div>
          )}
        </div>
        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {project.isFavorite && <span className="text-[10px]">⭐</span>}
            {project.isPinned && <span className="text-[10px]">📌</span>}
            <span className="text-xs font-medium truncate">{project.name}</span>
          </div>
          <span className="text-[10px] text-muted">{formatDate(project.updatedAt)}</span>
        </div>
        {/* Current badge */}
        {isCurrent && (
          <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-full flex-shrink-0">Current</span>
        )}
        {/* Hover actions */}
        {isHovered && !isCurrent && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicateProject(project.id); }}
              className="p-1 hover:bg-surface rounded transition-colors"
              title="Duplicate"
            >
              <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
              className="p-1 hover:bg-red-500/20 rounded transition-colors"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5 text-muted hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderFolder = (folder: FolderItem, level: number): React.ReactNode => {
    const hasSubfolders = folder.children && folder.children.length > 0;
    const folderProjects = projectsByFolder.get(folder.id) ?? [];
    const hasContent = hasSubfolders || folderProjects.length > 0;
    const isCollapsed = collapsedFolderIds.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isDragged = draggedFolderId === folder.id;
    const paddingLeft = 16 + level * 12;
    
    // Drop indicator state for this folder
    const isDropInside = dropIndicator?.targetId === folder.id && dropIndicator.position === 'inside';
    const isDropAbove = dropIndicator?.targetId === folder.id && dropIndicator.position === 'above';
    const isDropBelow = dropIndicator?.targetId === folder.id && dropIndicator.position === 'below';

    return (
      <div key={folder.id} className="relative">
        {/* Drop indicator line — above */}
        {isDropAbove && (
          <div
            className="dnd-indicator-line"
            style={{ left: paddingLeft, right: 16 }}
          />
        )}
        <div
          className={`group/folder w-full flex items-center justify-between py-2 pr-4 transition-colors cursor-pointer ${
            isSelected
              ? 'bg-accent/10 text-accent'
              : 'hover:bg-surface2 text-muted'
          } ${isDropInside ? 'bg-accent/20 ring-2 ring-accent ring-inset' : ''} ${isDragged ? 'opacity-50' : ''}`}
          style={{ paddingLeft }}
          onContextMenu={(e) => handleFolderContextMenu(e, folder)}
          onDragOver={(e) => handleFolderDragOver(e, folder.id)}
          onDragLeave={handleFolderDragLeave}
          onDrop={(e) => handleFolderDrop(e, folder.id)}
          onClick={() => setSelectedFolderId(folder.id)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Drag handle */}
            {onMoveFolderToParent && (
              <span
                draggable
                onDragStart={(e) => handleFolderDragStart(e, folder.id)}
                onDragEnd={handleFolderDragEnd}
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover/folder:opacity-100 cursor-grab active:cursor-grabbing flex-shrink-0 p-0.5 hover:bg-surface2 rounded transition-opacity"
                title="Drag to reorder"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
                </svg>
              </span>
            )}
            {/* Expand/collapse arrow — always show if folder has content or projects */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderCollapse(folder.id);
              }}
              className={`p-0.5 hover:bg-surface2 rounded transition-transform flex-shrink-0 ${!hasContent ? 'invisible' : ''}`}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <svg
                className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: folder.color }} />
            <span className="text-sm font-medium truncate max-w-[140px]">{folder.name}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {folder.projectCount! > 0 && (
              <span className="text-xs bg-surface2 px-2 py-0.5 rounded-full">{folder.projectCount}</span>
            )}
            {isDropInside && <span className="text-xs text-accent">Drop inside</span>}
            {isDropAbove && <span className="text-xs text-accent">Drop above</span>}
            {isDropBelow && <span className="text-xs text-accent">Drop below</span>}
          </div>
        </div>
        {/* Drop indicator line — below */}
        {isDropBelow && (
          <div
            className="dnd-indicator-line"
            style={{ left: paddingLeft, right: 16 }}
          />
        )}
        {/* Expanded content: subfolders + inline projects + empty state */}
        {!isCollapsed && (
          <div>
            {hasSubfolders && folder.children!.map((child) => renderFolder(child, level + 1))}
            {folderProjects.map((p) => renderInlineProject(p, level + 1))}
            {!hasSubfolders && folderProjects.length === 0 && (
              <div className="py-2 text-center" style={{ paddingLeft: paddingLeft + 12 }}>
                <p className="text-xs text-muted/70">No projects yet</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Create project inside this folder
                    onCreateProject();
                    // Move to this folder after creation would need backend support;
                    // for now user can drag it in
                  }}
                  className="mt-1 text-xs text-accent hover:underline"
                >
                  + Create Project
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-80 max-w-[90vw] h-full bg-surface border-r border-border shadow-2xl flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-text">Projects</h2>
            {isAuthenticated && onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1.5 hover:bg-surface2 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh projects"
              >
                <svg className={`w-4 h-4 text-muted ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface2 rounded-lg transition-colors"
            title="Close drawer"
          >
            <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Project Button */}
        <div className="p-4 border-b border-border">
          <button
            onClick={onCreateProject}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {/* Search and Sort */}
        {isAuthenticated && projects.length > 0 && (
          <div className="p-4 border-b border-border space-y-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-9 pr-3 py-2 bg-surface2 border border-border/50 rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-surface rounded transition-colors"
                  title="Clear search"
                >
                  <svg className="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs text-muted">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs bg-surface2 border border-border/50 rounded-md px-2 py-1 text-text focus:outline-none focus:ring-1 focus:ring-accent/50"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Results count */}
            {searchQuery && (
              <div className="text-xs text-muted">
                {searchFilteredProjects.length} result{searchFilteredProjects.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Folders Tree Section — always visible (search auto-expands matching paths) */}
        {isAuthenticated && (
          <div className="border-b border-border">
            {/* Folders Section — recursive tree */}
            {onCreateFolder && (
              <div className="py-2">
                {/* Pinned Folders */}
                {pinnedFolders.length > 0 && (
                  <>
                    {!isSearching && (
                      <div className="px-4 py-1 text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                        <span>📌</span>
                        <span>Pinned</span>
                      </div>
                    )}
                    {pinnedFolders.map((folder) => renderFolder(folder, 0))}
                  </>
                )}
                
                {/* Regular Folders */}
                {unpinnedFolders.length > 0 && (
                  <>
                    {!isSearching && pinnedFolders.length > 0 && (
                      <div className="px-4 py-1 text-xs font-semibold text-muted uppercase tracking-wider mt-2">
                        Folders
                      </div>
                    )}
                    {!isSearching && !pinnedFolders.length && foldersWithCount.length > 0 && (
                      <div className="px-4 py-1 text-xs font-semibold text-muted uppercase tracking-wider">
                        Folders
                      </div>
                    )}
                    {unpinnedFolders.map((folder) => renderFolder(folder, 0))}
                  </>
                )}
                
                {/* New Folder button — hidden during search */}
                {!isSearching && (
                  <button
                    onClick={() => onCreateFolder(selectedFolderId)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-text hover:bg-surface2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-medium">
                      {selectedFolderId ? 'New Subfolder' : 'New Folder'}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* All Projects — expandable virtual root for unassigned projects + drop zone */}
            <div>
              <div
                onClick={() => setSelectedFolderId(null)}
                onDragOver={handleAllProjectsDragOver}
                onDragLeave={handleFolderDragLeave}
                onDrop={(e) => handleFolderDrop(e, null)}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer ${
                  !selectedFolderId
                    ? 'bg-accent/10 text-accent'
                    : 'hover:bg-surface2 text-muted'
                } ${dropIndicator?.targetId === '__all_projects__' ? 'bg-accent/20 ring-2 ring-accent ring-inset' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {/* Expand/collapse arrow for All Projects */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolderCollapse('__all_projects__');
                    }}
                    className={`p-0.5 hover:bg-surface2 rounded transition-transform flex-shrink-0 ${rootProjects.length === 0 ? 'invisible' : ''}`}
                    title={collapsedFolderIds.has('__all_projects__') ? 'Expand' : 'Collapse'}
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${collapsedFolderIds.has('__all_projects__') ? '' : 'rotate-90'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <span className="text-sm">📋</span>
                  <span className="text-sm font-medium">All Projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-surface2 px-2 py-0.5 rounded-full">{rootProjects.length}</span>
                  {dropIndicator?.targetId === '__all_projects__' && (
                    <span className="text-xs text-accent">Move to root</span>
                  )}
                </div>
              </div>
              {/* Inline root projects when expanded */}
              {!collapsedFolderIds.has('__all_projects__') && rootProjects.length > 0 && (
                <div>
                  {rootProjects.map((p) => renderInlineProject(p, 1))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty / Loading / Unauth states */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <svg className="w-6 h-6 animate-spin text-accent" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        {!isLoading && !isAuthenticated && (
          <div className="p-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface2 flex items-center justify-center">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <p className="text-muted text-sm">Sign in to sync projects</p>
            <p className="text-muted/70 text-xs mt-1">Cloud projects require authentication</p>
            <button
              onClick={onSignIn}
              className="mt-4 px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
        {!isLoading && isAuthenticated && projects.length === 0 && (
          <div className="p-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface2 flex items-center justify-center">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-muted text-sm">No projects yet</p>
            <p className="text-muted/70 text-xs mt-1">Create your first project to get started</p>
          </div>
        )}

        {/* Spacer to push footer down when tree is short */}
        <div className="flex-1" />

        {/* Footer - Cloud sync status */}
        <div className="p-4 border-t border-border">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 text-xs text-muted">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Cloud sync enabled</span>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface2 hover:bg-surface text-text text-sm rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              Sign in to sync to cloud
            </button>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Animation + DnD indicator styles */}
      <style>{`
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.2s ease-out;
        }
        .dnd-indicator-line {
          position: absolute;
          height: 2px;
          background: var(--color-accent, #3b82f6);
          border-radius: 1px;
          pointer-events: none;
          z-index: 10;
          box-shadow: 0 0 4px var(--color-accent, #3b82f6);
        }
        .dnd-indicator-line::before {
          content: '';
          position: absolute;
          left: -3px;
          top: -3px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-accent, #3b82f6);
        }
      `}</style>
    </div>
  );
}
