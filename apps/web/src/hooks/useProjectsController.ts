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

import { useCallback, useState, useEffect } from 'react';
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
  toggleFolderPinned,
  moveProjectToFolder,
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
  createFolder: (name: string, color: string) => Promise<void>;
  updateFolder: (folderId: string, name: string, color: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  renameFolderById: (folderId: string, newName: string) => Promise<void>;
  
  // Organization
  toggleFavorite: (projectId: string) => Promise<void>;
  togglePinProject: (projectId: string) => Promise<void>;
  togglePinFolder: (folderId: string) => Promise<void>;
  moveToFolder: (projectId: string, folderId: string | null) => Promise<void>;
}

/**
 * Hook that provides project and folder management
 */
export function useProjectsController(params: UseProjectsControllerParams): ProjectsController {
  const { isDrawerOpen, onOpenLimitModal, onCloseDrawer } = params;
  
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
      console.error('Error fetching folders:', error);
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
      showToast('Project loaded ☁️');
    } else {
      showToast('Failed to load project');
    }
  }, [loadFromCloud, onCloseDrawer, showToast]);
  
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
      showToast(`You have ${cloudProjects.length + 1}/3 projects. Upgrade to Pro for unlimited!`);
    }

    // Create the project
    newDocument();
    onCloseDrawer();
    showToast('New project created');
    
    // Auto-save to cloud if authenticated
    if (authIsAuthenticated) {
      try {
        const success = await saveToCloud();
        if (success) {
          await fetchCloudProjects();
          showToast('Project saved to cloud ☁️');
        } else {
          showToast('Failed to save to cloud ❌');
        }
      } catch (error) {
        console.error('Cloud save error:', error);
        showToast('Cloud save error - check console ❌');
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
  ]);
  
  /**
   * Delete a project
   */
  const deleteProject = useCallback(async (id: string) => {
    const success = await deleteProjectApi(id);
    if (success) {
      await fetchCloudProjects();
      showToast('Project deleted');
    } else {
      showToast('Failed to delete project');
    }
  }, [fetchCloudProjects, showToast]);
  
  /**
   * Duplicate a project
   */
  const duplicateProject = useCallback(async (id: string) => {
    // Load the project first, then save as new (cloudProjectId will be cleared)
    const success = await loadFromCloud(id);
    if (success) {
      // Reset cloud ID so save creates new project
      useBoardStore.setState({ cloudProjectId: null });
      await saveToCloud();
      await fetchCloudProjects();
      showToast('Project duplicated ☁️');
    }
  }, [loadFromCloud, saveToCloud, fetchCloudProjects, showToast]);
  
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
    showToast('Project renamed');
  }, [markDirty, showToast]);
  
  /**
   * Refresh projects list
   */
  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    await fetchCloudProjects();
    setIsLoading(false);
    showToast('Projects refreshed');
  }, [fetchCloudProjects, showToast]);
  
  /**
   * Create a new folder
   */
  const createFolderHandler = useCallback(async (name: string, color: string) => {
    try {
      await createFolder({ name, color, icon: 'folder' });
      await fetchFoldersData();
      await fetchCloudProjects(); // Refresh projects to get updated folder assignments
      showToast(`Folder "${name}" created 📁`);
    } catch (error) {
      console.error('Error creating folder:', error);
      showToast('Failed to create folder ❌');
    }
  }, [fetchFoldersData, fetchCloudProjects, showToast]);
  
  /**
   * Update folder properties
   */
  const updateFolderHandler = useCallback(async (folderId: string, name: string, color: string) => {
    try {
      await updateFolder(folderId, { name, color });
      await fetchFoldersData();
      await fetchCloudProjects();
      showToast(`Folder "${name}" updated 📁`);
    } catch (error) {
      console.error('Error updating folder:', error);
      showToast('Failed to update folder ❌');
    }
  }, [fetchFoldersData, fetchCloudProjects, showToast]);
  
  /**
   * Delete a folder (projects remain)
   */
  const deleteFolderHandler = useCallback(async (folderId: string) => {
    useUIStore.getState().showConfirmModal({
      title: 'Delete Folder?',
      description: 'This will delete the folder, but your projects will not be deleted. They will remain in your workspace.',
      confirmLabel: 'Delete Folder',
      cancelLabel: 'Cancel',
      danger: true,
      onConfirm: async () => {
        try {
          const success = await deleteFolder(folderId);
          if (success) {
            await fetchFoldersData();
            await fetchCloudProjects();
            showToast('Folder deleted 🗑️');
          } else {
            showToast('Failed to delete folder ❌');
          }
        } catch (error) {
          console.error('Error deleting folder:', error);
          showToast('Failed to delete folder ❌');
        }
        useUIStore.getState().closeConfirmModal();
      },
    });
  }, [fetchFoldersData, fetchCloudProjects, showToast]);
  
  /**
   * Toggle project favorite status
   */
  const toggleFavorite = useCallback(async (projectId: string) => {
    try {
      const project = cloudProjects.find(p => p.id === projectId);
      const newValue = project ? !(project.is_favorite ?? false) : true;
      await toggleProjectFavorite(projectId, newValue);
      await fetchCloudProjects(); // Refresh projects
      showToast(newValue ? 'Added to favorites ⭐' : 'Removed from favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Failed to update favorite ❌');
    }
  }, [cloudProjects, fetchCloudProjects, showToast]);
  
  /**
   * Move project to folder
   */
  const moveToFolderHandler = useCallback(async (projectId: string, folderId: string | null) => {
    try {
      await moveProjectToFolder(projectId, folderId);
      await fetchCloudProjects(); // Refresh projects
      showToast(folderId ? 'Project moved to folder 📁' : 'Project removed from folder');
    } catch (error) {
      console.error('Error moving project:', error);
      showToast('Failed to move project ❌');
    }
  }, [fetchCloudProjects, showToast]);
  
  /**
   * Toggle project pin status
   */
  const togglePinProject = useCallback(async (projectId: string) => {
    try {
      const project = cloudProjects.find(p => p.id === projectId);
      const newValue = project ? !(project.is_pinned ?? false) : true;
      await toggleProjectPinned(projectId, newValue);
      await fetchCloudProjects(); // Refresh projects
      showToast(newValue ? 'Project pinned 📌' : 'Project unpinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
      showToast('Failed to update pin ❌');
    }
  }, [cloudProjects, fetchCloudProjects, showToast]);
  
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
      showToast(newValue ? 'Folder pinned 📌' : 'Folder unpinned');
    } catch (error) {
      console.error('Error toggling folder pin:', error);
      showToast('Failed to update folder pin ❌');
    }
  }, [folders, fetchFoldersData, fetchCloudProjects, showToast]);
  
  /**
   * Rename project by ID (for drawer inline rename)
   */
  const renameProjectById = useCallback(async (projectId: string, newName: string) => {
    try {
      await renameProjectApi(projectId, newName);
      await fetchCloudProjects(); // Refresh projects
      showToast('Project renamed ✏️');
    } catch (error) {
      console.error('Error renaming project:', error);
      showToast('Failed to rename project ❌');
    }
  }, [fetchCloudProjects, showToast]);
  
  /**
   * Rename folder by ID (for drawer inline rename)
   */
  const renameFolderById = useCallback(async (folderId: string, newName: string) => {
    try {
      await renameFolderApi(folderId, newName);
      await fetchFoldersData(); // Refresh folders
      await fetchCloudProjects(); // Also refresh projects
      showToast('Folder renamed ✏️');
    } catch (error) {
      console.error('Error renaming folder:', error);
      showToast('Failed to rename folder ❌');
    }
  }, [fetchFoldersData, fetchCloudProjects, showToast]);
  
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
  };
}
