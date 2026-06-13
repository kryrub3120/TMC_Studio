/**
 * useProjectsController Hook
 * 
 * Handles all project and folder operations:
 * - Project CRUD (create, load, delete, duplicate, rename)
 * - Folder CRUD (create, update, delete)
 * - Project organization (favorites, move to folder)
 * - Entitlement checks for project limits
 * 
 * Part of PR-REFACTOR-3: Extract project logic from App.tsx
 */

import { logger } from '../lib/logger';
import { useCallback, useState, useEffect } from 'react';
import { useTranslation } from '@tmc/ui';
import { useBoardStore } from '../store';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useEntitlements } from './useEntitlements';
import {
  deleteProject as deleteProjectApi,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  toggleProjectFavorite,
  toggleProjectPinned,
  updateProjectTags,
  toggleFolderPinned,
  moveProjectToFolder,
  updateFolderPosition,
  renameProject as renameProjectApi,
  renameFolder as renameFolderApi,
  type ProjectFolder,
} from '../lib/supabase';

export interface UseProjectsControllerParams {
  isDrawerOpen: boolean;
  onOpenLimitModal: (type: 'guest-project' | 'free-project', current: number, max: number) => void;
  onCloseDrawer: () => void;
}

export interface ProjectsController {
  // State
  folders: ProjectFolder[];
  isLoading: boolean;
  
  // Project operations
  openDrawer: () => void;
  selectProject: (id: string) => Promise<void>;
  createProject: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  renameProject: (newName: string) => void;
  renameProjectById: (projectId: string, newName: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  
  // Folder operations
  createFolder: (name: string, color: string, parentId?: string | null) => Promise<void>;
  updateFolder: (folderId: string, name: string, color: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  renameFolderById: (folderId: string, newName: string) => Promise<void>;
  
  // Organization
  toggleFavorite: (projectId: string) => Promise<void>;
  togglePinProject: (projectId: string) => Promise<void>;
  togglePinFolder: (folderId: string) => Promise<void>;
  moveToFolder: (projectId: string, folderId: string | null) => Promise<void>;
  moveFolderToParent: (folderId: string, parentId: string | null, position: number) => Promise<void>;
}

/**
 * Hook that provides project and folder management
 */
export function useProjectsController(params: UseProjectsControllerParams): ProjectsController {
  const { isDrawerOpen, onOpenLimitModal, onCloseDrawer } = params;
  const { t } = useTranslation();
  
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Store selectors
  const authIsAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authIsPro = useAuthStore((s) => s.isPro);
  const cloudProjects = useBoardStore((s) => s.cloudProjects);
  const cloudProjectId = useBoardStore((s) => s.cloudProjectId);
  const elements = useBoardStore((s) => s.elements);
  const boardDoc = useBoardStore((s) => s.document);
  const loadFromCloud = useBoardStore((s) => s.loadFromCloud);
  const saveToCloud = useBoardStore((s) => s.saveToCloud);
  const fetchCloudProjects = useBoardStore((s) => s.fetchCloudProjects);
  const newDocument = useBoardStore((s) => s.newDocument);
  const markDirty = useBoardStore((s) => s.markDirty);
  const showToast = useUIStore((s) => s.showToast);
  
  // Entitlements
  const { can } = useEntitlements();
  
  /**
   * Fetch folders from database
   */
  const fetchFoldersData = useCallback(async () => {
    if (!authIsAuthenticated) return;
    try {
      const data = await getFolders();
      setFolders(data);
    } catch (error) {
      logger.error('Error fetching folders:', error);
    }
  }, [authIsAuthenticated]);
  
  /**
   * Fetch projects when drawer opens
   */
  useEffect(() => {
    if (isDrawerOpen && authIsAuthenticated) {
      setIsLoading(true);
      Promise.all([
        fetchCloudProjects(),
        fetchFoldersData(),
      ]).finally(() => setIsLoading(false));
    }
  }, [isDrawerOpen, authIsAuthenticated, fetchCloudProjects, fetchFoldersData]);
  
  /**
   * Open projects drawer
   */
  const openDrawer = useCallback(() => {
    // This is handled by parent component state
    // Kept for interface consistency
  }, []);
  
  /**
   * Load a project from cloud
   */
  const selectProject = useCallback(async (id: string) => {
    const success = await loadFromCloud(id);
    if (success) {
      onCloseDrawer();
      showToast(t('projectToast.loaded'));
    } else {
      showToast(t('projectToast.loadFailed'));
    }
  }, [loadFromCloud, onCloseDrawer, showToast, t]);
  
  /**
   * Create a new project with entitlement checks
   */
  const createProject = useCallback(async () => {
    // Calculate current project count
    let projectCount = 0;
    
    if (authIsAuthenticated) {
      // For authenticated users: count cloud projects
      projectCount = cloudProjects.length;
      // If current project is unsaved (no cloudProjectId), it counts as a project
      if (!cloudProjectId) {
        projectCount += 1;
      }
    } else {
      // For guest users: count local projects (1 if we have content, 0 otherwise)
      projectCount = elements.length > 0 || boardDoc.steps.length > 1 ? 1 : 0;
    }

    // Check entitlements
    const canCreate = can('createProject', { projectCount });
    
    // Guest: soft-block at limit (prompt to sign up)
    if (!authIsAuthenticated && canCreate !== true) {
      onCloseDrawer();
      onOpenLimitModal('guest-project', projectCount, 1);
      return;
    }
    
    // Free: hard-block at limit (show pricing modal)
    if (authIsAuthenticated && !authIsPro && canCreate === 'hard-block') {
      onCloseDrawer();
      onOpenLimitModal('free-project', projectCount, 3);
      return;
    }
    
    // Free: soft-prompt at approaching limit
    if (authIsAuthenticated && !authIsPro && canCreate === 'soft-prompt') {
      showToast(t('projectToast.limitFree', { count: cloudProjects.length + 1 }));
    }

    // Create the project
    newDocument();
    onCloseDrawer();
    showToast(t('projectToast.created'));
    
    // Auto-save to cloud if authenticated
    if (authIsAuthenticated) {
      try {
        const success = await saveToCloud();
        if (success) {
          await fetchCloudProjects();
          showToast(t('projectToast.savedCloud'));
        } else {
          showToast(t('projectToast.saveCloudFailed'));
        }
      } catch (error) {
        logger.error('Cloud save error:', error);
        showToast(t('projectToast.cloudSaveError'));
      }
    }
  }, [
    can,
    authIsAuthenticated,
    authIsPro,
    cloudProjects,
    cloudProjectId,
    elements.length,
    boardDoc.steps.length,
    newDocument,
    showToast,
    saveToCloud,
    fetchCloudProjects,
    onCloseDrawer,
    onOpenLimitModal,
    t,
  ]);
  
  /**
   * Delete a project
   */
  const deleteProject = useCallback(async (id: string) => {
    const success = await deleteProjectApi(id);
    if (success) {
      await fetchCloudProjects();
      showToast(t('projectToast.deleted'));
    } else {
      showToast(t('projectToast.deleteFailed'));
    }
  }, [fetchCloudProjects, showToast, t]);
  
  /**
   * Duplicate a project
   */
  const duplicateProject = useCallback(async (id: string) => {
    // Capture source metadata before we clear the cloud id (createProject only
    // persists name + document, so folder/tags/favorite/pinned must be re-applied).
    const source = cloudProjects.find((p) => p.id === id) ?? null;

    // Load the project first, then save as new (cloudProjectId will be cleared)
    const success = await loadFromCloud(id);
    if (success) {
      // Reset cloud ID so save creates new project
      useBoardStore.setState({ cloudProjectId: null });
      await saveToCloud();

      // Re-apply the source project's metadata to the freshly created duplicate.
      const newId = useBoardStore.getState().cloudProjectId;
      if (newId && source) {
        try {
          if (source.folder_id) await moveProjectToFolder(newId, source.folder_id);
          if (source.tags && source.tags.length > 0) await updateProjectTags(newId, source.tags);
          if (source.is_favorite) await toggleProjectFavorite(newId, true);
          if (source.is_pinned) await toggleProjectPinned(newId, true);
        } catch (err) {
          logger.error('Failed to copy metadata to duplicated project:', err);
        }
      }

      await fetchCloudProjects();
      showToast(t('projectToast.duplicated'));
    }
  }, [cloudProjects, loadFromCloud, saveToCloud, fetchCloudProjects, showToast, t]);
  
  /**
   * Rename current project
   */
  const renameProject = useCallback((newName: string) => {
    useBoardStore.setState((state) => ({
      document: {
        ...state.document,
        name: newName,
        updatedAt: new Date().toISOString(),
      },
    }));
    markDirty(); // Trigger autosave to persist rename to cloud
    showToast(t('projectToast.renamed'));
  }, [markDirty, showToast, t]);
  
  /**
   * Refresh projects list
   */
  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    await fetchCloudProjects();
    setIsLoading(false);
    showToast(t('projectToast.refreshed'));
  }, [fetchCloudProjects, showToast, t]);
  
  /**
   * Create a new folder
   */
  const createFolderHandler = useCallback(async (name: string, color: string, parentId?: string | null) => {
    try {
      // No `icon` passed: the drawer renders a color swatch, not folder.icon,
      // so devCloud's '📁' default applies as harmless metadata.
      await createFolder({ name, color, parent_id: parentId ?? undefined });
      await fetchFoldersData();
      await fetchCloudProjects(); // Refresh projects to get updated folder assignments
      showToast(t('projectToast.folderCreated', { name }));
    } catch (error) {
      logger.error('Error creating folder:', error);
      showToast(t('projectToast.folderCreateFailed'));
    }
  }, [fetchFoldersData, fetchCloudProjects, showToast, t]);
  
  /**
   * Update folder properties
   */
  const updateFolderHandler = useCallback(async (folderId: string, name: string, color: string) => {
    try {
      await updateFolder(folderId, { name, color });
      await fetchFoldersData();
      await fetchCloudProjects();
      showToast(t('projectToast.folderUpdated', { name }));
    } catch (error) {
      logger.error('Error updating folder:', error);
      showToast(t('projectToast.folderUpdateFailed'));
    }
  }, [fetchFoldersData, fetchCloudProjects, showToast, t]);
  
  /**
   * Delete a folder (projects remain)
   */
  const deleteFolderHandler = useCallback(async (folderId: string) => {
    useUIStore.getState().showConfirmModal({
      title: t('projectToast.deleteFolderTitle'),
      description: t('projectToast.deleteFolderDescription'),
      confirmLabel: t('projectToast.deleteFolderConfirm'),
      cancelLabel: t('confirm.cancel'),
      danger: true,
      onConfirm: async () => {
        try {
          const success = await deleteFolder(folderId);
          if (success) {
            await fetchFoldersData();
            await fetchCloudProjects();
            showToast(t('projectToast.folderDeleted'));
          } else {
            showToast(t('projectToast.folderDeleteFailed'));
          }
        } catch (error) {
          logger.error('Error deleting folder:', error);
          showToast(t('projectToast.folderDeleteFailed'));
        }
        useUIStore.getState().closeConfirmModal();
      },
    });
  }, [fetchFoldersData, fetchCloudProjects, showToast, t]);
  
  /**
   * Toggle project favorite status
   */
  const toggleFavorite = useCallback(async (projectId: string) => {
    try {
      const project = cloudProjects.find(p => p.id === projectId);
      const newValue = project ? !(project.is_favorite ?? false) : true;
      await toggleProjectFavorite(projectId, newValue);
      await fetchCloudProjects(); // Refresh projects
      showToast(newValue ? t('projectToast.favoriteAdded') : t('projectToast.favoriteRemoved'));
    } catch (error) {
      logger.error('Error toggling favorite:', error);
      showToast(t('projectToast.favoriteFailed'));
    }
  }, [cloudProjects, fetchCloudProjects, showToast, t]);
  
  /**
   * Move project to folder
   */
  const moveToFolderHandler = useCallback(async (projectId: string, folderId: string | null) => {
    try {
      await moveProjectToFolder(projectId, folderId);
      await fetchCloudProjects(); // Refresh projects
      showToast(folderId ? t('projectToast.movedToFolder') : t('projectToast.removedFromFolder'));
    } catch (error) {
      logger.error('Error moving project:', error);
      showToast(t('projectToast.moveProjectFailed'));
    }
  }, [fetchCloudProjects, showToast, t]);
  
  /**
   * Toggle project pin status
   */
  const togglePinProject = useCallback(async (projectId: string) => {
    try {
      const project = cloudProjects.find(p => p.id === projectId);
      const newValue = project ? !(project.is_pinned ?? false) : true;
      await toggleProjectPinned(projectId, newValue);
      await fetchCloudProjects(); // Refresh projects
      showToast(newValue ? t('projectToast.projectPinned') : t('projectToast.projectUnpinned'));
    } catch (error) {
      logger.error('Error toggling pin:', error);
      showToast(t('projectToast.pinProjectFailed'));
    }
  }, [cloudProjects, fetchCloudProjects, showToast, t]);
  
  /**
   * Toggle folder pin status
   */
  const togglePinFolder = useCallback(async (folderId: string) => {
    try {
      const folder = folders.find(f => f.id === folderId);
      const newValue = folder ? !(folder.is_pinned ?? false) : true;
      await toggleFolderPinned(folderId, newValue);
      await fetchFoldersData(); // Refresh folders
      await fetchCloudProjects(); // Also refresh projects
      showToast(newValue ? t('projectToast.folderPinned') : t('projectToast.folderUnpinned'));
    } catch (error) {
      logger.error('Error toggling folder pin:', error);
      showToast(t('projectToast.pinFolderFailed'));
    }
  }, [folders, fetchFoldersData, fetchCloudProjects, showToast, t]);
  
  /**
   * Rename project by ID (for drawer inline rename)
   */
  const renameProjectById = useCallback(async (projectId: string, newName: string) => {
    try {
      await renameProjectApi(projectId, newName);
      await fetchCloudProjects(); // Refresh projects
      showToast(t('projectToast.renamed'));
    } catch (error) {
      logger.error('Error renaming project:', error);
      showToast(t('projectToast.renameProjectFailed'));
    }
  }, [fetchCloudProjects, showToast, t]);
  
  /**
   * Move folder to a new parent with position (for drag & drop)
   */
  const moveFolderToParent = useCallback(async (folderId: string, parentId: string | null, position: number) => {
    try {
      const success = await updateFolderPosition(folderId, parentId, position);
      if (success) {
        await fetchFoldersData();
        showToast(t('projectToast.folderMoved'));
      } else {
        showToast(t('projectToast.folderMoveFailed'));
      }
    } catch (error) {
      logger.error('Error moving folder:', error);
      showToast(t('projectToast.folderMoveFailed'));
    }
  }, [fetchFoldersData, showToast, t]);

  /**
   * Rename folder by ID (for drawer inline rename)
   */
  const renameFolderById = useCallback(async (folderId: string, newName: string) => {
    try {
      await renameFolderApi(folderId, newName);
      await fetchFoldersData(); // Refresh folders
      await fetchCloudProjects(); // Also refresh projects
      showToast(t('projectToast.folderRenamed'));
    } catch (error) {
      logger.error('Error renaming folder:', error);
      showToast(t('projectToast.renameFolderFailed'));
    }
  }, [fetchFoldersData, fetchCloudProjects, showToast, t]);
  
  return {
    // State
    folders,
    isLoading,
    
    // Project operations
    openDrawer,
    selectProject,
    createProject,
    deleteProject,
    duplicateProject,
    renameProject,
    renameProjectById,
    refreshProjects,
    
    // Folder operations
    createFolder: createFolderHandler,
    updateFolder: updateFolderHandler,
    deleteFolder: deleteFolderHandler,
    renameFolderById,
    
    // Organization
    toggleFavorite,
    togglePinProject,
    togglePinFolder,
    moveToFolder: moveToFolderHandler,
    moveFolderToParent,
  };
}
