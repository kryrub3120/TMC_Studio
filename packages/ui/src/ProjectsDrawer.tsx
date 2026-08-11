/**
 * Projects Drawer - Cloud project management
 * Slide-out panel for listing, creating, and managing projects
 */

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { ContextMenu, ContextMenuItem } from "./ContextMenu";
import { ConfirmModal } from "./ConfirmModal";
import { useTranslation } from "./i18n.js";
import {
  DEFAULT_EXERCISE_DETAILS,
  DEFAULT_SESSION_PLAN_DETAILS,
  type ExerciseDetails,
  type ProjectType,
  type SessionPlanDetails,
  type BoardDocument,
} from "@tmc/core";

export interface ProjectItem {
  id: string;
  name: string;
  updatedAt: string;
  thumbnailUrl?: string;
  document?: BoardDocument;
  isCloud: boolean;
  isFavorite?: boolean;
  isPinned?: boolean;
  projectType?: ProjectType;
  description?: string;
  lastOpenedAt?: string;
  exerciseDetails?: ExerciseDetails;
  sessionPlanDetails?: SessionPlanDetails;
  tags?: string[];
  folderId?: string | null;
  /** Save status: 'saved' | 'saving' | 'unsaved' | 'error' | undefined */
  saveStatus?: "saved" | "saving" | "unsaved" | "error";
}

export function ProjectPreview({ project, projects = [], className = "" }: { project: ProjectItem; projects?: ProjectItem[]; className?: string }) {
  const sourceProject = project.projectType === "exercise" && project.exerciseDetails?.sourceGraphicProjectId
    ? projects.find((item) => item.id === project.exerciseDetails?.sourceGraphicProjectId)
    : undefined;
  const previewProject = sourceProject ?? project;

  if (previewProject.thumbnailUrl) {
    return <img src={previewProject.thumbnailUrl} alt="" className={`h-full w-full object-cover ${className}`} />;
  }

  if (project.projectType === "session") {
    const sessionSources = (project.sessionPlanDetails?.exercises ?? [])
      .map((item) => projects.find((candidate) => candidate.id === item.projectId))
      .filter((item): item is ProjectItem => Boolean(item))
      .slice(0, 4);
    if (sessionSources.length === 0) {
      const sessionItems = project.sessionPlanDetails?.exercises ?? [];
      return (
        <div className={`flex h-full w-full flex-col bg-surface2 p-4 ${className}`}>
          <span className="text-[10px] font-semibold uppercase text-accent">{project.name}</span>
          <span className="mt-3 h-px bg-border" />
          <div className="mt-3 flex flex-1 flex-col gap-2">
            {(sessionItems.length ? sessionItems.slice(0, 4) : [null, null, null]).map((item, index) => (
              <span key={item?.id ?? index} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent/15 text-[9px] font-semibold text-accent">{index + 1}</span>
                <span className="h-1.5 min-w-0 flex-1 rounded bg-muted/25" />
                {item && <span className="text-[9px] text-muted">{item.durationMinutes} min</span>}
              </span>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className={`grid h-full w-full grid-cols-2 gap-px bg-border ${className}`}>
        {(sessionSources.length ? sessionSources : [project]).map((item, index) => (
          <div key={`${item.id}-${index}`} className="min-h-0 overflow-hidden bg-surface2">
            {item === project ? (
              <div className="flex h-full flex-col justify-center gap-2 px-4">
                <span className="h-1.5 w-3/4 rounded bg-muted/30" />
                <span className="h-1.5 w-full rounded bg-muted/20" />
                <span className="h-1.5 w-2/3 rounded bg-muted/20" />
              </div>
            ) : <ProjectPreview project={item} projects={projects} />}
          </div>
        ))}
      </div>
    );
  }

  const document = previewProject.document;
  const elements = document?.steps?.[0]?.elements ?? [];
  const width = document?.pitchConfig?.width ?? 1050;
  const height = document?.pitchConfig?.height ?? 680;

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#218b45] ${className}`} aria-hidden="true">
      <div className="absolute inset-[7%] border border-white/75" />
      <div className="absolute bottom-[7%] left-1/2 top-[7%] w-px bg-white/70" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[15%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70" />
      <div className="absolute bottom-[24%] left-[7%] top-[24%] w-[15%] border border-l-0 border-white/70" />
      <div className="absolute bottom-[24%] right-[7%] top-[24%] w-[15%] border border-r-0 border-white/70" />
      {elements.slice(0, 36).map((element) => {
        const item = element as typeof element & { position?: { x: number; y: number }; startPoint?: { x: number; y: number }; team?: string; fill?: string; color?: string };
        const position = item.position ?? item.startPoint;
        if (!position) return null;
        const isBall = item.type === "ball";
        const color = isBall ? "#f8fafc" : item.team === "away" ? "#2f70ef" : item.team === "team3" ? "#f4c542" : item.fill ?? item.color ?? "#ef4444";
        return (
          <span
            key={item.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/30 shadow-sm"
            style={{ left: `${Math.max(2, Math.min(98, (position.x / width) * 100))}%`, top: `${Math.max(2, Math.min(98, (position.y / height) * 100))}%`, width: isBall ? 5 : 7, height: isBall ? 5 : 7, backgroundColor: color }}
          />
        );
      })}
    </div>
  );

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
function isDescendantOf(
  folders: FolderItem[],
  folderId: string,
  candidateAncestorId: string,
): boolean {
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
  if (insertIndex >= siblings.length)
    return (siblings[siblings.length - 1].sortOrder ?? 0) + 1000;
  const before = siblings[insertIndex - 1].sortOrder ?? 0;
  const after = siblings[insertIndex].sortOrder ?? 0;
  return (before + after) / 2;
}

type SortOption =
  | "recent"
  | "name-asc"
  | "name-desc"
  | "favorites"
  | "last-opened";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "favorites", label: "Favorites first" },
  { value: "last-opened", label: "Last opened" },
];

function sortProjects(list: ProjectItem[], sort: SortOption): ProjectItem[] {
  return [...list].sort((a, b) => {
    switch (sort) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "favorites": {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      case "last-opened":
        return (
          new Date(b.lastOpenedAt ?? 0).getTime() -
          new Date(a.lastOpenedAt ?? 0).getTime()
        );
      case "recent":
      default:
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
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
  onCreateProject: (
    type?: ProjectType,
    sourceGraphicProjectId?: string,
  ) => void;
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
  onMoveFolderToParent?: (
    folderId: string,
    parentId: string | null,
    position: number,
  ) => void;
  onSignIn: () => void;
  onRefresh?: () => void;
  onUpdateCurrentProjectMetadata?: (updates: {
    projectType?: ProjectType;
    description?: string;
    exerciseDetails?: ExerciseDetails;
    sessionPlanDetails?: SessionPlanDetails;
  }) => void;
  onAttachGraphicToExercise?: (sourceGraphicProjectId: string) => void;
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
  onUpdateCurrentProjectMetadata,
  onAttachGraphicToExercise,
}: ProjectsDrawerProps) {
  const { t } = useTranslation();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [typeFilter, setTypeFilter] = useState<"all" | ProjectType>("all");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [selectedGraphicId, setSelectedGraphicId] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [creatingType, setCreatingType] = useState<ProjectType | null>(null);
  const [libraryTutorialStep, setLibraryTutorialStep] = useState<number | null>(
    null,
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  // Inline rename states (activated from L1 — double-click to rename)
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(
    null,
  );
  const [_renamingFolderId, _setRenamingFolderId] = useState<string | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");

  // Collapse/expand state for folder tree
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(
    new Set(),
  );

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
    position: "above" | "below" | "inside";
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
  const scheduleAutoExpand = useCallback(
    (folderId: string) => {
      // Don't restart if already scheduled for the same folder
      if (autoExpandTargetRef.current === folderId) return;
      cancelAutoExpand();
      autoExpandTargetRef.current = folderId;
      autoExpandTimerRef.current = setTimeout(() => {
        setCollapsedFolderIds((prev) => {
          if (!prev.has(folderId)) return prev;
          const next = new Set(prev);
          next.delete(folderId);
          return next;
        });
        autoExpandTargetRef.current = null;
        autoExpandTimerRef.current = null;
      }, 600);
    },
    [cancelAutoExpand],
  );

  // Cleanup auto-expand timer on unmount
  useEffect(() => cancelAutoExpand, [cancelAutoExpand]);

  // Search-filtered projects
  const searchFilteredProjects = useMemo(() => {
    const typeFiltered =
      typeFilter === "all"
        ? projects
        : projects.filter(
            (project) => (project.projectType ?? "graphic") === typeFilter,
          );
    if (!searchQuery.trim()) return typeFiltered;
    const query = searchQuery.toLowerCase();
    return typeFiltered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags?.some((t) => t.toLowerCase().includes(query)),
    );
  }, [projects, searchQuery, typeFilter]);

  const currentProject = useMemo(
    () => projects.find((project) => project.id === currentProjectId),
    [currentProjectId, projects],
  );
  // Exercise and session editing now live in dedicated workspaces.
  const showLegacyComposer = false;

  useEffect(() => {
    setDescriptionDraft(currentProject?.description ?? "");
  }, [currentProject?.description, currentProjectId]);

  const graphicProjects = useMemo(
    () =>
      projects.filter(
        (project) => (project.projectType ?? "graphic") === "graphic",
      ),
    [projects],
  );
  const exerciseProjects = useMemo(
    () => projects.filter((project) => project.projectType === "exercise"),
    [projects],
  );
  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => {
          const aTime = new Date(a.lastOpenedAt ?? a.updatedAt).getTime();
          const bTime = new Date(b.lastOpenedAt ?? b.updatedAt).getTime();
          return bTime - aTime;
        })
        .slice(0, 6),
    [projects],
  );

  const createLibraryProject = async (
    type: ProjectType,
    sourceGraphicProjectId?: string,
  ) => {
    if (creatingType) return;
    setCreatingType(type);
    try {
      await onCreateProject(type, sourceGraphicProjectId);
    } finally {
      setCreatingType(null);
    }
  };

  useEffect(() => {
    setSelectedGraphicId(
      currentProject?.exerciseDetails?.sourceGraphicProjectId ??
        graphicProjects[0]?.id ??
        "",
    );
  }, [
    currentProjectId,
    currentProject?.exerciseDetails?.sourceGraphicProjectId,
    graphicProjects,
  ]);

  useEffect(() => {
    setSelectedExerciseId(exerciseProjects[0]?.id ?? "");
  }, [currentProjectId, exerciseProjects]);

  const updateExercise = (patch: Partial<ExerciseDetails>) => {
    if (!currentProject || !onUpdateCurrentProjectMetadata) return;
    onUpdateCurrentProjectMetadata({
      exerciseDetails: {
        ...DEFAULT_EXERCISE_DETAILS,
        ...currentProject.exerciseDetails,
        ...patch,
      },
    });
  };

  const updateSession = (patch: Partial<SessionPlanDetails>) => {
    onUpdateCurrentProjectMetadata?.({
      sessionPlanDetails: {
        ...DEFAULT_SESSION_PLAN_DETAILS,
        ...currentProject?.sessionPlanDetails,
        ...patch,
      },
    });
  };

  const addExerciseToSession = () => {
    if (!currentProject || !selectedExerciseId) return;
    const exercise = exerciseProjects.find(
      (project) => project.id === selectedExerciseId,
    );
    if (!exercise) return;
    const current =
      currentProject.sessionPlanDetails ?? DEFAULT_SESSION_PLAN_DETAILS;
    if (current.exercises.some((item) => item.projectId === exercise.id))
      return;
    updateSession({
      exercises: [
        ...current.exercises,
        {
          id: globalThis.crypto?.randomUUID?.() ?? `session-item-${Date.now()}`,
          projectId: exercise.id,
          name: exercise.name,
          durationMinutes: exercise.exerciseDetails?.durationMinutes ?? 15,
          notes: "",
        },
      ],
    });
  };

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
    return folders.map((f) => ({
      ...f,
      projectCount: projects.filter((p) => p.folderId === f.id).length,
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
    if (searchFilteredProjects.some((p) => !p.folderId)) {
      ancestors.add("__all_projects__");
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
      setCollapsedFolderIds((prev) => {
        if (searchAncestorFolderIds.size === 0) return prev;
        const next = new Set(prev);
        for (const id of searchAncestorFolderIds) {
          next.delete(id);
        }
        // Also expand '__all_projects__' when root projects match
        if (searchAncestorFolderIds.has("__all_projects__")) {
          next.delete("__all_projects__");
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
  const folderTree = useMemo(
    () => buildFolderTree(foldersWithCount),
    [foldersWithCount],
  );
  const pinnedFolders = folderTree.filter((f) => f.isPinned);
  const unpinnedFolders = folderTree.filter((f) => !f.isPinned);

  // Whether we're in search mode (tree always shows, but some chrome is hidden)
  const isSearching = searchQuery.trim().length > 0;

  // Toggle collapse/expand for a folder
  const toggleFolderCollapse = (folderId: string) => {
    setCollapsedFolderIds((prev) => {
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
  const handleProjectContextMenu = (
    e: React.MouseEvent,
    project: ProjectItem,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const items: ContextMenuItem[] = [
      {
        label: project.isPinned ? t("projects.unpin") : t("projects.pinTop"),
        icon: "📌",
        onClick: () => onTogglePinProject?.(project.id),
      },
      {
        label: project.isFavorite
          ? t("projects.removeFavorite")
          : t("projects.addFavorite"),
        icon: "⭐",
        onClick: () => onToggleFavorite?.(project.id),
      },
      {
        label: t("projects.duplicate"),
        icon: "📋",
        onClick: () => onDuplicateProject(project.id),
      },
      {
        label: t("projects.delete"),
        icon: "🗑️",
        onClick: () => setDeleteConfirmId(project.id),
        variant: "danger" as const,
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
        label: folder.isPinned ? t("projects.unpin") : t("projects.pinTop"),
        icon: "📌",
        onClick: () => onTogglePinFolder?.(folder.id),
      },
      {
        label: t("projects.editFolder"),
        icon: "✏️",
        onClick: () => _onEditFolder?.(folder.id),
      },
    ];

    // "Move to root" for nested folders
    if (folder.parentId && onMoveFolderToParent) {
      items.push({
        label: t("projects.moveRoot"),
        icon: "⬆️",
        onClick: () => {
          const rootSiblings = foldersWithCount.filter((f) => !f.parentId);
          const newPosition = computeSortOrder(
            rootSiblings,
            rootSiblings.length,
          );
          onMoveFolderToParent(folder.id, null, newPosition);
        },
      });
    }

    items.push({
      label: t("projects.deleteFolder"),
      icon: "🗑️",
      onClick: () => _onDeleteFolder?.(folder.id),
      variant: "danger" as const,
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
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", projectId);
  };

  const handleProjectDragEnd = () => {
    resetDndState();
  };

  // Folder drag start (from grip handle)
  const handleFolderDragStart = (e: React.DragEvent, folderId: string) => {
    e.stopPropagation();
    setDraggedFolderId(folderId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-folder-id", folderId);
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
  ): "above" | "below" | "inside" => {
    // Projects always drop "inside" a folder
    if (draggedProjectId) return "inside";

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const ratio = y / rect.height;

    if (ratio < 0.25) return "above";
    if (ratio > 0.75) return "below";
    return "inside";
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
    e.dataTransfer.dropEffect = "move";

    const position = computeDropPosition(e, folderId);
    setDropIndicator({ targetId: folderId, position });

    // Auto-expand collapsed folder when hovering "inside" zone
    if (position === "inside" && collapsedFolderIds.has(folderId)) {
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
    e.dataTransfer.dropEffect = "move";
    setDropIndicator({ targetId: "__all_projects__", position: "inside" });
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
      if (
        folderId &&
        isDescendantOf(foldersWithCount, folderId, draggedFolderId)
      ) {
        resetDndState();
        return;
      }

      // If dropping "inside" a folder, reparent as child
      // If dropping "above" or "below", reparent as sibling of target
      if (
        indicator &&
        folderId &&
        (indicator.position === "above" || indicator.position === "below")
      ) {
        // Find the target folder's parent
        const targetFolder = foldersWithCount.find((f) => f.id === folderId);
        const parentId = targetFolder?.parentId ?? null;
        const siblings = foldersWithCount.filter((f) =>
          parentId ? f.parentId === parentId : !f.parentId,
        );
        const targetIndex = siblings.findIndex((f) => f.id === folderId);
        const insertIndex =
          indicator.position === "above" ? targetIndex : targetIndex + 1;
        const newPosition = computeSortOrder(siblings, insertIndex);
        onMoveFolderToParent(draggedFolderId, parentId, newPosition);
      } else {
        // "inside" — reparent as child of folderId (or root if null)
        const targetChildren = foldersWithCount.filter((f) =>
          folderId ? f.parentId === folderId : !f.parentId,
        );
        const newPosition = computeSortOrder(
          targetChildren,
          targetChildren.length,
        );
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

    if (diffMins < 1) return t("projects.time.justNow");
    if (diffMins < 60)
      return t("projects.time.minutesAgo", { count: diffMins });
    if (diffHours < 24)
      return t("projects.time.hoursAgo", { count: diffHours });
    if (diffDays < 7) return t("projects.time.daysAgo", { count: diffDays });
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
  const renderInlineProject = (
    project: ProjectItem,
    level: number,
  ): React.ReactNode => {
    const padLeft = 16 + level * 12;
    const isCurrent = currentProjectId === project.id;
    const isHovered = hoveredId === project.id;
    const isDragged = draggedProjectId === project.id;
    const isRenaming = renamingProjectId === project.id;

    const handleDoubleClick = () => {
      setRenameValue(project.name);
      setRenamingProjectId(project.id);
    };

    const handleRenameSubmit = () => {
      const trimmed = renameValue.trim();
      if (trimmed && trimmed !== project.name && _onRenameProject) {
        _onRenameProject(project.id, trimmed);
      }
      setRenamingProjectId(null);
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleRenameSubmit();
      } else if (e.key === "Escape") {
        setRenamingProjectId(null);
      }
    };

    return (
      <div
        key={project.id}
        draggable={onMoveToFolder !== undefined}
        onDragStart={(e) => handleProjectDragStart(e, project.id)}
        onDragEnd={handleProjectDragEnd}
        className={`group/proj flex items-center gap-2 py-1.5 pr-3 cursor-pointer transition-colors ${
          isCurrent ? "bg-accent/15 text-accent" : "hover:bg-surface2 text-text"
        } ${isDragged ? "opacity-50" : ""}`}
        style={{ paddingLeft: padLeft }}
        onClick={() => !isRenaming && onSelectProject(project.id)}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => handleProjectContextMenu(e, project)}
        onMouseEnter={() => setHoveredId(project.id)}
        onMouseLeave={() => {
          setHoveredId(null);
        }}
      >
        {/* Thumbnail */}
        <div className="w-7 h-7 rounded bg-surface2 flex-shrink-0 overflow-hidden">
          {project.thumbnailUrl ? (
            <img
              src={project.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm">
              ⚽
            </div>
          )}
        </div>
        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              autoFocus
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-xs font-medium bg-surface2 border border-accent rounded px-1.5 py-0.5 text-text outline-none"
              placeholder={t("projects.projectName")}
            />
          ) : (
            <div className="flex items-center gap-1">
              {project.isFavorite && <span className="text-[10px]">⭐</span>}
              {project.isPinned && <span className="text-[10px]">📌</span>}
              <span className="text-xs font-medium truncate">
                {project.name}
              </span>
              <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-[9px] font-medium uppercase text-muted">
                {t(`projects.type.${project.projectType ?? "graphic"}`)}
              </span>
              {/* Save status indicator */}
              {project.saveStatus === "saving" && (
                <span
                  className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse flex-shrink-0"
                  title={t("projects.saving")}
                />
              )}
              {project.saveStatus === "unsaved" && (
                <span
                  className="w-2 h-2 rounded-full bg-yellow-600 flex-shrink-0"
                  title={t("projects.unsaved")}
                />
              )}
              {project.saveStatus === "error" && (
                <span
                  className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
                  title={t("projects.saveError")}
                />
              )}
              {project.saveStatus === "saved" && (
                <span
                  className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
                  title={t("projects.saved")}
                />
              )}
            </div>
          )}
          {project.description && (
            <p className="truncate text-[10px] text-muted">
              {project.description}
            </p>
          )}
          <span className="text-[10px] text-muted">
            {formatDate(project.updatedAt)}
          </span>
        </div>
        {/* Current badge */}
        {isCurrent && (
          <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
            {t("projects.current")}
          </span>
        )}
        {/* Hover actions */}
        {isHovered && !isCurrent && !isRenaming && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateProject(project.id);
              }}
              className="p-1 hover:bg-surface rounded transition-colors"
              title={t("projects.duplicate")}
            >
              <svg
                className="w-3.5 h-3.5 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(project.id);
              }}
              className="p-1 hover:bg-red-500/20 rounded transition-colors"
              title={t("projects.delete")}
            >
              <svg
                className="w-3.5 h-3.5 text-muted hover:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
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
    const isDropInside =
      dropIndicator?.targetId === folder.id &&
      dropIndicator.position === "inside";
    const isDropAbove =
      dropIndicator?.targetId === folder.id &&
      dropIndicator.position === "above";
    const isDropBelow =
      dropIndicator?.targetId === folder.id &&
      dropIndicator.position === "below";

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
              ? "bg-accent/10 text-accent"
              : "hover:bg-surface2 text-muted"
          } ${isDropInside ? "bg-accent/20 ring-2 ring-accent ring-inset" : ""} ${isDragged ? "opacity-50" : ""}`}
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
                title={t("projects.dragReorder")}
              >
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="9" cy="5" r="1.5" />
                  <circle cx="15" cy="5" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="19" r="1.5" />
                  <circle cx="15" cy="19" r="1.5" />
                </svg>
              </span>
            )}
            {/* Expand/collapse arrow — always show if folder has content or projects */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderCollapse(folder.id);
              }}
              className={`p-0.5 hover:bg-surface2 rounded transition-transform flex-shrink-0 ${!hasContent ? "invisible" : ""}`}
              title={
                isCollapsed ? t("projects.expand") : t("projects.collapse")
              }
            >
              <svg
                className={`w-3 h-3 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: folder.color }}
            />
            <span className="text-sm font-medium truncate max-w-[140px]">
              {folder.name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {folder.projectCount! > 0 && (
              <span className="text-xs bg-surface2 px-2 py-0.5 rounded-full">
                {folder.projectCount}
              </span>
            )}
            {isDropInside && (
              <span className="text-xs text-accent">
                {t("projects.dropInside")}
              </span>
            )}
            {isDropAbove && (
              <span className="text-xs text-accent">
                {t("projects.dropAbove")}
              </span>
            )}
            {isDropBelow && (
              <span className="text-xs text-accent">
                {t("projects.dropBelow")}
              </span>
            )}
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
            {hasSubfolders &&
              folder.children!.map((child) => renderFolder(child, level + 1))}
            {folderProjects.map((p) => renderInlineProject(p, level + 1))}
            {!hasSubfolders && folderProjects.length === 0 && (
              <div
                className="py-2 text-center"
                style={{ paddingLeft: paddingLeft + 12 }}
              >
                <p className="text-xs text-muted/70">
                  {t("projects.noProjectsYet")}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Create project inside this folder
                    void createLibraryProject("graphic");
                    // Move to this folder after creation would need backend support;
                    // for now user can drag it in
                  }}
                  className="mt-1 text-xs text-accent hover:underline"
                >
                  + {t("projects.createProject")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (showLegacyComposer) return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        data-tour="projects-panel"
        className="relative h-full w-[min(960px,100vw)] bg-surface border-r border-border shadow-2xl flex flex-col animate-slide-in-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-text">
              {t("projects.title")}
            </h2>
            <button
              type="button"
              onClick={() => setLibraryTutorialStep(0)}
              className="px-2 py-1 rounded-md text-xs font-medium text-accent hover:bg-accent/10"
              title={t("projects.tutorial.open")}
              data-testid="library-tutorial-open"
            >
              {t("projects.tutorial.help")}
            </button>
            {isAuthenticated && onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1.5 hover:bg-surface2 rounded-lg transition-colors disabled:opacity-50"
                title={t("projects.refresh")}
              >
                <svg
                  className={`w-4 h-4 text-muted ${isLoading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface2 rounded-lg transition-colors"
            title={t("projects.close")}
          >
            <svg
              className="w-5 h-5 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="grid grid-cols-3 gap-2 p-4 border-b border-border">
            {(["graphic", "exercise", "session"] as ProjectType[]).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    void createLibraryProject(
                      type,
                      type === "exercise" &&
                        (currentProject?.projectType ?? "graphic") === "graphic"
                        ? currentProject?.id
                        : undefined,
                    )
                  }
                  disabled={creatingType !== null}
                  aria-busy={creatingType === type}
                  data-testid={`create-${type}-project`}
                  className={`min-w-0 px-2 py-2.5 bg-surface2 border text-text text-xs font-medium rounded-md hover:border-accent hover:text-accent transition-colors disabled:cursor-wait disabled:opacity-50 ${libraryTutorialStep === (type === "graphic" ? 0 : type === "exercise" ? 1 : 2) ? "border-accent ring-2 ring-accent/40" : "border-border"}`}
                >
                  <span
                    className="block text-base leading-none mb-1"
                    aria-hidden="true"
                  >
                    {type === "graphic" ? "▧" : type === "exercise" ? "△" : "≡"}
                  </span>
                  {t(`projects.type.${type}`)}
                </button>
              ),
            )}
          </div>

          {libraryTutorialStep !== null && (
            <div
              className="mx-4 mt-3 p-3 border border-accent/50 bg-accent/10 rounded-md"
              data-testid="library-tutorial"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-accent">
                    {t("projects.tutorial.step", {
                      current: libraryTutorialStep + 1,
                    })}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {t(`projects.tutorial.items.${libraryTutorialStep}.title`)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {t(`projects.tutorial.items.${libraryTutorialStep}.body`)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLibraryTutorialStep(null)}
                  className="text-muted hover:text-text"
                  aria-label={t("projects.tutorial.close")}
                >
                  ×
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  disabled={libraryTutorialStep === 0}
                  onClick={() =>
                    setLibraryTutorialStep((step) =>
                      Math.max(0, (step ?? 0) - 1),
                    )
                  }
                  className="text-xs text-muted disabled:opacity-30"
                >
                  {t("projects.tutorial.back")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    libraryTutorialStep === 2
                      ? setLibraryTutorialStep(null)
                      : setLibraryTutorialStep(libraryTutorialStep + 1)
                  }
                  className="px-3 py-1.5 rounded-md bg-accent text-white text-xs font-semibold"
                >
                  {libraryTutorialStep === 2
                    ? t("projects.tutorial.done")
                    : t("projects.tutorial.next")}
                </button>
              </div>
            </div>
          )}

          {isAuthenticated && recentProjects.length > 0 && (
            <section
              className="border-b border-border p-4"
              data-testid="recent-projects"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-text">
                    {t("projects.recentProjects")}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">
                    {t("projects.recentHint")}
                  </p>
                </div>
                <span className="text-xs text-muted">
                  {recentProjects.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {recentProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onSelectProject(project.id)}
                    className={`min-w-0 overflow-hidden rounded-md border bg-bg text-left transition-colors hover:border-accent ${currentProjectId === project.id ? "border-accent ring-1 ring-accent" : "border-border"}`}
                  >
                    <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-surface2 text-xl text-muted">
                      {project.thumbnailUrl ? (
                        <img
                          src={project.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : project.projectType === "session" ? (
                        "≡"
                      ) : project.projectType === "exercise" ? (
                        "△"
                      ) : (
                        "▧"
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs font-semibold text-text">
                        {project.name}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-muted">
                        <span className="truncate">
                          {t(
                            `projects.type.${project.projectType ?? "graphic"}`,
                          )}
                        </span>
                        <span className="shrink-0">
                          {formatDate(project.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {showLegacyComposer &&
            currentProject &&
            onUpdateCurrentProjectMetadata && (
              <div className="hidden" data-testid="project-composer">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="project-type"
                    className="text-xs font-medium text-muted"
                  >
                    {t("projects.kind")}
                  </label>
                  <select
                    id="project-type"
                    value={currentProject.projectType ?? "graphic"}
                    onChange={(event) =>
                      onUpdateCurrentProjectMetadata({
                        projectType: event.target.value as ProjectType,
                      })
                    }
                    className="ml-auto bg-surface2 border border-border rounded-md px-2 py-1 text-xs text-text"
                  >
                    {(["graphic", "exercise", "session"] as ProjectType[]).map(
                      (type) => (
                        <option key={type} value={type}>
                          {t(`projects.type.${type}`)}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <textarea
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  onBlur={() => {
                    if (descriptionDraft !== (currentProject.description ?? ""))
                      onUpdateCurrentProjectMetadata({
                        description: descriptionDraft.trim(),
                      });
                  }}
                  rows={3}
                  maxLength={1000}
                  placeholder={t("projects.descriptionPlaceholder")}
                  className="w-full resize-none bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                  data-testid="project-description"
                />

                {(currentProject.projectType ?? "graphic") === "graphic" && (
                  <button
                    type="button"
                    onClick={() =>
                      onCreateProject("exercise", currentProject.id)
                    }
                    className="w-full px-3 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent/90"
                    data-testid="create-exercise-from-graphic"
                  >
                    {t("projects.exercise.createFromThisGraphic")}
                  </button>
                )}

                {currentProject.projectType === "exercise" &&
                  (() => {
                    const details = {
                      ...DEFAULT_EXERCISE_DETAILS,
                      ...currentProject.exerciseDetails,
                    };
                    return (
                      <div
                        className="space-y-3 pt-1"
                        data-testid="exercise-editor"
                      >
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted">
                            {t("projects.exercise.graphic")}
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={selectedGraphicId}
                              onChange={(event) =>
                                setSelectedGraphicId(event.target.value)
                              }
                              className="min-w-0 flex-1 bg-surface2 border border-border rounded-md px-2 py-2 text-xs text-text"
                              data-testid="exercise-graphic-select"
                            >
                              {graphicProjects.length === 0 && (
                                <option value="">
                                  {t("projects.exercise.noGraphics")}
                                </option>
                              )}
                              {graphicProjects.map((project) => (
                                <option key={project.id} value={project.id}>
                                  {project.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={
                                !selectedGraphicId || !onAttachGraphicToExercise
                              }
                              onClick={() =>
                                onAttachGraphicToExercise?.(selectedGraphicId)
                              }
                              className="px-3 py-2 rounded-md bg-surface2 border border-border text-xs font-semibold text-text hover:border-accent disabled:opacity-40"
                              data-testid="attach-graphic"
                            >
                              {details.sourceGraphicProjectId ===
                              selectedGraphicId
                                ? t("projects.exercise.refreshGraphic")
                                : t("projects.exercise.useGraphic")}
                            </button>
                          </div>
                          {details.sourceGraphicName && (
                            <p className="text-[11px] text-accent">
                              {t("projects.exercise.usingGraphic", {
                                name: details.sourceGraphicName,
                              })}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="text-xs text-muted">
                            {t("projects.exercise.duration")}
                            <input
                              type="number"
                              min={1}
                              max={240}
                              value={details.durationMinutes}
                              onChange={(event) =>
                                updateExercise({
                                  durationMinutes: Math.max(
                                    1,
                                    Number(event.target.value) || 1,
                                  ),
                                })
                              }
                              className="mt-1 w-full bg-surface2 border border-border rounded-md px-2 py-2 text-sm text-text"
                              data-testid="exercise-duration"
                            />
                          </label>
                          <label className="text-xs text-muted">
                            {t("projects.exercise.players")}
                            <input
                              type="text"
                              value={details.players}
                              onChange={(event) =>
                                updateExercise({ players: event.target.value })
                              }
                              placeholder={t(
                                "projects.exercise.playersPlaceholder",
                              )}
                              className="mt-1 w-full bg-surface2 border border-border rounded-md px-2 py-2 text-sm text-text"
                              data-testid="exercise-players"
                            />
                          </label>
                        </div>
                        <label className="block text-xs text-muted">
                          {t("projects.exercise.organization")}
                          <textarea
                            value={details.organization}
                            onChange={(event) =>
                              updateExercise({
                                organization: event.target.value,
                              })
                            }
                            rows={2}
                            className="mt-1 w-full resize-none bg-surface2 border border-border rounded-md px-2 py-2 text-sm text-text"
                            data-testid="exercise-organization"
                          />
                        </label>
                        <label className="block text-xs text-muted">
                          {t("projects.exercise.coachingPoints")}
                          <textarea
                            value={details.coachingPoints}
                            onChange={(event) =>
                              updateExercise({
                                coachingPoints: event.target.value,
                              })
                            }
                            rows={2}
                            className="mt-1 w-full resize-none bg-surface2 border border-border rounded-md px-2 py-2 text-sm text-text"
                            data-testid="exercise-coaching-points"
                          />
                        </label>
                      </div>
                    );
                  })()}

                {currentProject.projectType === "session" &&
                  (() => {
                    const details =
                      currentProject.sessionPlanDetails ??
                      DEFAULT_SESSION_PLAN_DETAILS;
                    const totalDuration = details.exercises.reduce(
                      (sum, item) => sum + item.durationMinutes,
                      0,
                    );
                    const updateItem = (
                      id: string,
                      patch: Partial<SessionPlanDetails["exercises"][number]>,
                    ) =>
                      updateSession({
                        exercises: details.exercises.map((item) =>
                          item.id === id ? { ...item, ...patch } : item,
                        ),
                      });
                    const moveItem = (index: number, direction: -1 | 1) => {
                      const target = index + direction;
                      if (target < 0 || target >= details.exercises.length)
                        return;
                      const next = [...details.exercises];
                      [next[index], next[target]] = [next[target], next[index]];
                      updateSession({ exercises: next });
                    };
                    return (
                      <div
                        className="space-y-3 pt-1"
                        data-testid="session-editor"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-text">
                            {t("projects.session.agenda")}
                          </p>
                          <span className="text-xs text-accent">
                            {t("projects.session.total", {
                              minutes: totalDuration,
                            })}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={selectedExerciseId}
                            onChange={(event) =>
                              setSelectedExerciseId(event.target.value)
                            }
                            className="min-w-0 flex-1 bg-surface2 border border-border rounded-md px-2 py-2 text-xs text-text"
                            data-testid="session-exercise-select"
                          >
                            {exerciseProjects.length === 0 && (
                              <option value="">
                                {t("projects.session.noExercises")}
                              </option>
                            )}
                            {exerciseProjects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={!selectedExerciseId}
                            onClick={addExerciseToSession}
                            className="px-3 py-2 rounded-md bg-accent text-white text-xs font-semibold disabled:opacity-40"
                            data-testid="add-exercise-to-session"
                          >
                            {t("projects.session.add")}
                          </button>
                        </div>
                        {details.exercises.length === 0 && (
                          <p className="py-3 text-center text-xs text-muted">
                            {t("projects.session.empty")}
                          </p>
                        )}
                        <div className="space-y-2">
                          {details.exercises.map((item, index) => (
                            <div
                              key={item.id}
                              className="p-2.5 bg-surface2 border border-border rounded-md space-y-2"
                              data-testid="session-exercise-item"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 shrink-0 rounded bg-accent/15 text-accent text-[11px] font-bold flex items-center justify-center">
                                  {index + 1}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-text">
                                  {item.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => moveItem(index, -1)}
                                  disabled={index === 0}
                                  className="text-muted disabled:opacity-25"
                                  title={t("projects.session.moveUp")}
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveItem(index, 1)}
                                  disabled={
                                    index === details.exercises.length - 1
                                  }
                                  className="text-muted disabled:opacity-25"
                                  title={t("projects.session.moveDown")}
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSession({
                                      exercises: details.exercises.filter(
                                        (entry) => entry.id !== item.id,
                                      ),
                                    })
                                  }
                                  className="text-danger"
                                  title={t("projects.session.remove")}
                                >
                                  ×
                                </button>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={240}
                                  value={item.durationMinutes}
                                  onChange={(event) =>
                                    updateItem(item.id, {
                                      durationMinutes: Math.max(
                                        1,
                                        Number(event.target.value) || 1,
                                      ),
                                    })
                                  }
                                  aria-label={t(
                                    "projects.session.itemDuration",
                                  )}
                                  className="w-20 bg-surface border border-border rounded px-2 py-1.5 text-xs text-text"
                                />
                                <input
                                  type="text"
                                  value={item.notes}
                                  onChange={(event) =>
                                    updateItem(item.id, {
                                      notes: event.target.value,
                                    })
                                  }
                                  placeholder={t("projects.session.notes")}
                                  className="min-w-0 flex-1 bg-surface border border-border rounded px-2 py-1.5 text-xs text-text"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}

          {/* Search and Sort */}
          {isAuthenticated && projects.length > 0 && (
            <div className="p-4 border-b border-border space-y-3">
              <div
                className="grid grid-cols-4 gap-1"
                role="tablist"
                aria-label={t("projects.filterByType")}
              >
                {(["all", "graphic", "exercise", "session"] as const).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTypeFilter(type)}
                      className={`px-1.5 py-1.5 rounded-md text-[11px] font-medium ${typeFilter === type ? "bg-accent text-white" : "bg-surface2 text-muted hover:text-text"}`}
                    >
                      {type === "all"
                        ? t("projects.type.all")
                        : t(`projects.type.${type}`)}
                    </button>
                  ),
                )}
              </div>
              {/* Search */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("projects.search")}
                  className="w-full pl-9 pr-3 py-2 bg-surface2 border border-border/50 rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-surface rounded transition-colors"
                    title={t("projects.clearSearch")}
                  >
                    <svg
                      className="w-3 h-3 text-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-xs text-muted">
                  {t("projects.sortBy")}
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-xs bg-surface2 border border-border/50 rounded-md px-2 py-1 text-text focus:outline-none focus:ring-1 focus:ring-accent/50"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {t(
                        `projects.sort.${opt.value === "name-asc" ? "nameAsc" : opt.value === "name-desc" ? "nameDesc" : opt.value === "last-opened" ? "lastOpened" : opt.value}`,
                      )}
                    </option>
                  ))}
                </select>
              </div>

              {/* Results count */}
              {searchQuery && (
                <div className="text-xs text-muted">
                  {t("projects.results", {
                    count: searchFilteredProjects.length,
                  })}
                </div>
              )}
            </div>
          )}

          <div>
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
                            <span>{t("projects.pinned")}</span>
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
                            {t("projects.folders")}
                          </div>
                        )}
                        {!isSearching &&
                          !pinnedFolders.length &&
                          foldersWithCount.length > 0 && (
                            <div className="px-4 py-1 text-xs font-semibold text-muted uppercase tracking-wider">
                              {t("projects.folders")}
                            </div>
                          )}
                        {unpinnedFolders.map((folder) =>
                          renderFolder(folder, 0),
                        )}
                      </>
                    )}

                    {/* New Folder button — hidden during search */}
                    {!isSearching && (
                      <button
                        onClick={() => onCreateFolder(selectedFolderId)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-text hover:bg-surface2 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span className="font-medium">
                          {selectedFolderId
                            ? t("projects.newSubfolder")
                            : t("projects.newFolder")}
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
                        ? "bg-accent/10 text-accent"
                        : "hover:bg-surface2 text-muted"
                    } ${dropIndicator?.targetId === "__all_projects__" ? "bg-accent/20 ring-2 ring-accent ring-inset" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Expand/collapse arrow for All Projects */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFolderCollapse("__all_projects__");
                        }}
                        className={`p-0.5 hover:bg-surface2 rounded transition-transform flex-shrink-0 ${rootProjects.length === 0 ? "invisible" : ""}`}
                        title={
                          collapsedFolderIds.has("__all_projects__")
                            ? t("projects.expand")
                            : t("projects.collapse")
                        }
                      >
                        <svg
                          className={`w-3 h-3 transition-transform ${collapsedFolderIds.has("__all_projects__") ? "" : "rotate-90"}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                      <span className="text-sm">📋</span>
                      <span className="text-sm font-medium">
                        {t("projects.allProjects")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-surface2 px-2 py-0.5 rounded-full">
                        {rootProjects.length}
                      </span>
                      {dropIndicator?.targetId === "__all_projects__" && (
                        <span className="text-xs text-accent">
                          {t("projects.moveToRoot")}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Inline root projects when expanded */}
                  {!collapsedFolderIds.has("__all_projects__") &&
                    rootProjects.length > 0 && (
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
                <svg
                  className="w-6 h-6 animate-spin text-accent"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            )}
            {!isLoading && !isAuthenticated && (
              <div className="p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface2 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </svg>
                </div>
                <p className="text-muted text-sm">{t("projects.signInSync")}</p>
                <p className="text-muted/70 text-xs mt-1">
                  {t("projects.authRequired")}
                </p>
                <button
                  onClick={onSignIn}
                  className="mt-4 px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {t("projects.signIn")}
                </button>
              </div>
            )}
            {!isLoading && isAuthenticated && projects.length === 0 && (
              <div className="p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface2 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-muted text-sm">
                  {t("projects.noProjectsYet")}
                </p>
                <p className="text-muted/70 text-xs mt-1">
                  {t("projects.createFirst")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Cloud sync status */}
        <div className="shrink-0 p-4 border-t border-border">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 text-xs text-muted">
              <svg
                className="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{t("projects.cloudSync")}</span>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface2 hover:bg-surface text-text text-sm rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
              {t("projects.signInCloud")}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId &&
        (() => {
          const projectToDelete = projects.find(
            (p) => p.id === deleteConfirmId,
          );
          return (
            <ConfirmModal
              isOpen={true}
              title={t("projects.deleteTitle")}
              description={
                projectToDelete
                  ? t("projects.deleteDescription", {
                      name: projectToDelete.name,
                    })
                  : t("projects.deleteFallback")
              }
              confirmLabel={t("projects.delete")}
              cancelLabel={t("confirm.cancel")}
              danger={true}
              onConfirm={() => {
                onDeleteProject(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
              onCancel={() => setDeleteConfirmId(null)}
            />
          );
        })()}

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

  const activeCreateType: ProjectType =
    typeFilter === "all" ? "graphic" : typeFilter;
  const visibleProjects = selectedFolderId
    ? projectsByFolder.get(selectedFolderId) ?? []
    : sortProjects(searchFilteredProjects, sortBy);
  const visibleRecentProjects = recentProjects.filter((project) =>
    typeFilter === "all"
      ? true
      : (project.projectType ?? "graphic") === typeFilter,
  );

  const renderProjectCard = (project: ProjectItem, compact = false) => {
    const type = project.projectType ?? "graphic";
    const duration =
      type === "exercise"
        ? project.exerciseDetails?.durationMinutes
        : type === "session"
          ? project.sessionPlanDetails?.exercises.reduce(
              (sum, item) => sum + item.durationMinutes,
              0,
            )
          : undefined;

    return (
      <article
        key={`${compact ? "recent" : "library"}-${project.id}`}
        draggable={onMoveToFolder !== undefined}
        onDragStart={(event) => handleProjectDragStart(event, project.id)}
        onDragEnd={handleProjectDragEnd}
        onContextMenu={(event) => handleProjectContextMenu(event, project)}
        className={`group relative min-w-0 overflow-hidden rounded-md border bg-surface transition-colors hover:border-accent ${compact ? "w-[240px] shrink-0 sm:w-auto" : ""} ${currentProjectId === project.id ? "border-accent" : "border-border"}`}
      >
        <button
          type="button"
          onClick={() => onSelectProject(project.id)}
          className="block w-full text-left"
        >
          <span className={`block overflow-hidden border-b border-border bg-bg ${compact ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
            <ProjectPreview project={project} projects={projects} />
          </span>
          <span className="block px-3 py-2.5">
            <span className="block truncate pr-7 text-sm font-semibold text-text">
              {project.name}
            </span>
            <span className="mt-1 flex items-center gap-2 text-[11px] text-muted">
              <span className="font-semibold uppercase text-accent">
                {t(`projects.type.${type}`)}
              </span>
              {duration ? <span>{duration} min</span> : null}
              <span className="ml-auto truncate">
                {formatDate(project.lastOpenedAt ?? project.updatedAt)}
              </span>
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={(event) => handleProjectContextMenu(event, project)}
          className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded text-lg text-muted hover:bg-surface2 hover:text-text"
          aria-label={t("projects.projectActions", { name: project.name })}
        >
          ···
        </button>
      </article>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-3">
      <div
        data-tour="projects-panel"
        className="relative flex h-full w-full min-w-0 flex-col overflow-hidden border-border bg-bg shadow-2xl sm:h-[calc(100dvh-24px)] sm:max-w-[1280px] sm:rounded-md sm:border"
      >
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:px-5">
          <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-text sm:text-lg">
            {t("projects.title")}
          </h2>
          <button
            type="button"
            onClick={() => setLibraryTutorialStep(0)}
            className="hidden h-9 px-2 text-sm font-medium text-accent hover:text-text sm:block"
            data-testid="library-tutorial-open"
          >
            {t("projects.tutorial.help")}
          </button>
          {isAuthenticated && onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-lg text-muted hover:border-accent hover:text-text"
              title={t("projects.refresh")}
              aria-label={t("projects.refresh")}
            >
              ↻
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center text-2xl text-muted hover:text-text"
            aria-label={t("projects.close")}
          >
            ×
          </button>
        </header>

        <div className="shrink-0 border-b border-border bg-surface px-3 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 flex-1 overflow-x-auto rounded-md border border-border bg-bg p-1" aria-label={t("projects.filterByType")}>
              {(["all", "graphic", "exercise", "session"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  data-testid={`library-type-${type}`}
                  onClick={() => {
                    setTypeFilter(type);
                    setSelectedFolderId(null);
                  }}
                  className={`h-8 shrink-0 rounded px-3 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${typeFilter === type ? "bg-surface2 text-text" : "text-muted hover:text-text"}`}
                >
                  {t(`projects.type.${type}`)}
                </button>
              ))}
            </div>
            <button
              type="button"
              data-testid={`create-${activeCreateType}-project`}
              onClick={() => void createLibraryProject(
                activeCreateType,
                activeCreateType === "exercise" && (currentProject?.projectType ?? "graphic") === "graphic"
                  ? currentProject?.id
                  : undefined,
              )}
              disabled={Boolean(creatingType)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-lg font-semibold text-bg disabled:opacity-50 sm:w-auto sm:px-5 sm:text-sm"
              aria-label={t("projects.newProject")}
            >
              <span aria-hidden="true">+</span>
              <span className="hidden sm:inline">&nbsp;{creatingType ? t("projects.saving") : t("projects.newProject")}</span>
            </button>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_190px]">
            <label className="relative block min-w-0">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">⌕</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("projects.search")}
                className="h-10 w-full rounded-md border border-border bg-bg pl-9 pr-3 text-sm text-text outline-none placeholder:text-muted focus:border-accent"
              />
            </label>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-10 rounded-md border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
              aria-label={t("projects.sortBy")}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`projects.sort.${option.value === "name-asc" ? "nameAsc" : option.value === "name-desc" ? "nameDesc" : option.value === "last-opened" ? "lastOpened" : option.value}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[210px_minmax(0,1fr)]">
          <aside className="hidden min-h-0 border-r border-border bg-surface md:flex md:flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                onDragOver={handleAllProjectsDragOver}
                onDrop={(event) => handleFolderDrop(event, null)}
                className={`flex h-10 w-full items-center justify-between rounded-md px-3 text-left text-sm ${selectedFolderId === null ? "bg-accent/15 font-semibold text-accent" : "text-text hover:bg-surface2"}`}
              >
                <span>{t("projects.allProjects")}</span>
                <span className="text-xs text-muted">{searchFilteredProjects.length}</span>
              </button>
              <div className="my-3 flex items-center justify-between px-3">
                <span className="text-[11px] font-semibold uppercase text-muted">{t("projects.folders")}</span>
                {onCreateFolder && (
                  <button type="button" onClick={() => onCreateFolder(null)} className="h-7 w-7 text-lg text-muted hover:text-accent" title={t("projects.newFolder")} aria-label={t("projects.newFolder")}>+</button>
                )}
              </div>
              <div className="space-y-1">
                {foldersWithCount
                  .slice()
                  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
                  .map((folder) => {
                    const isSelected = selectedFolderId === folder.id;
                    const isDropTarget = dropIndicator?.targetId === folder.id;
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => setSelectedFolderId(folder.id)}
                        onContextMenu={(event) => handleFolderContextMenu(event, folder)}
                        onDragOver={(event) => handleFolderDragOver(event, folder.id)}
                        onDragLeave={handleFolderDragLeave}
                        onDrop={(event) => handleFolderDrop(event, folder.id)}
                        className={`flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm ${isSelected ? "bg-surface2 text-text" : "text-muted hover:bg-surface2 hover:text-text"} ${isDropTarget ? "ring-1 ring-accent" : ""}`}
                        style={{ paddingLeft: folder.parentId ? 28 : 12 }}
                      >
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: folder.color }} />
                        <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                        <span className="text-[11px]">{folder.projectCount}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
            <div className="border-t border-border px-4 py-3 text-xs text-muted">
              {isAuthenticated ? t("projects.cloudSync") : <button type="button" onClick={onSignIn} className="font-medium text-accent">{t("projects.signIn")}</button>}
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="aspect-[16/12] animate-pulse rounded-md bg-surface" />)}
              </div>
            ) : !isAuthenticated ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <p className="text-sm text-muted">{t("projects.signInSync")}</p>
                <button type="button" onClick={onSignIn} className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg">{t("projects.signIn")}</button>
              </div>
            ) : (
              <>
                {!selectedFolderId && !searchQuery && visibleRecentProjects.length > 0 && (
                  <section className="mb-7" data-testid="recent-projects">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-text">{t("projects.recentProjects")}</h3>
                      <span className="text-xs text-muted">{visibleRecentProjects.length}</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4">
                      {visibleRecentProjects.slice(0, 4).map((project) => renderProjectCard(project, true))}
                    </div>
                  </section>
                )}
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="truncate text-sm font-semibold text-text">
                      {selectedFolderId ? foldersWithCount.find((folder) => folder.id === selectedFolderId)?.name : t(`projects.type.${typeFilter}`)}
                    </h3>
                    <span className="shrink-0 text-xs text-muted">{t("projects.results", { count: visibleProjects.length })}</span>
                  </div>
                  {visibleProjects.length ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {visibleProjects.map((project) => renderProjectCard(project))}
                    </div>
                  ) : (
                    <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-dashed border-border px-5 text-center">
                      <p className="text-sm font-medium text-text">{t("projects.noProjectsYet")}</p>
                      <button type="button" onClick={() => void createLibraryProject(activeCreateType)} className="mt-3 text-sm font-semibold text-accent">+ {t("projects.createProject")}</button>
                    </div>
                  )}
                </section>
              </>
            )}
          </main>
        </div>

        {libraryTutorialStep !== null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/65 p-4" data-testid="library-tutorial">
            <div className="w-full max-w-md rounded-md border border-border bg-surface shadow-2xl">
              <div className="border-b border-border p-5">
                <p className="text-xs font-semibold uppercase text-accent">{t("projects.tutorial.step", { current: libraryTutorialStep + 1 })}</p>
                <h3 className="mt-2 text-xl font-semibold text-text">{t(`projects.tutorial.items.${libraryTutorialStep}.title`)}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{t(`projects.tutorial.items.${libraryTutorialStep}.body`)}</p>
              </div>
              <div className="flex justify-between p-4">
                <button type="button" onClick={() => setLibraryTutorialStep(null)} className="px-3 py-2 text-sm text-muted">{t("projects.tutorial.close")}</button>
                <div className="flex gap-2">
                  {libraryTutorialStep > 0 && <button type="button" onClick={() => setLibraryTutorialStep((step) => Math.max(0, (step ?? 0) - 1))} className="rounded-md border border-border px-3 py-2 text-sm text-text">{t("projects.tutorial.back")}</button>}
                  <button type="button" onClick={() => libraryTutorialStep === 2 ? setLibraryTutorialStep(null) : setLibraryTutorialStep((step) => Math.min(2, (step ?? 0) + 1))} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg">{libraryTutorialStep === 2 ? t("projects.tutorial.done") : t("projects.tutorial.next")}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />}
      {deleteConfirmId && (
        <ConfirmModal
          isOpen
          title={t("projects.deleteTitle")}
          description={t("projects.deleteDescription", { name: projects.find((project) => project.id === deleteConfirmId)?.name ?? "" })}
          confirmLabel={t("projects.delete")}
          cancelLabel={t("confirm.cancel")}
          danger
          onConfirm={() => { onDeleteProject(deleteConfirmId); setDeleteConfirmId(null); }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}
