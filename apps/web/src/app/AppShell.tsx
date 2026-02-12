/**
 * AppShell - Global app orchestration
 * Handles auth, billing, projects, settings, and global modals
 * Pure composition - no board/canvas logic
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, type ProjectItem } from '@tmc/ui';
import { type ProjectFolder } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useBoardStore } from '../store';
import { useBillingController, useProjectsController, useSettingsController, usePaymentReturn } from '../hooks';
import { BoardPage } from './board/BoardPage';
import { ModalOrchestrator } from './orchestrators/ModalOrchestrator';

/** Global app shell - orchestrates auth, billing, projects, settings */
export function AppShell() {
  const navigate = useNavigate();
  
  // Auth state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [limitReachedModalOpen, setLimitReachedModalOpen] = useState(false);
  const [limitReachedType, setLimitReachedType] = useState<'guest-step' | 'guest-project' | 'free-step' | 'free-project'>('guest-step');
  const [limitCountCurrent, setLimitCountCurrent] = useState(0);
  const [limitCountMax, setLimitCountMax] = useState(0);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [projectsDrawerOpen, setProjectsDrawerOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [folderOptionsModalOpen, setFolderOptionsModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null);
  
  // Auth store
  const authUser = useAuthStore((s) => s.user);
  const authIsAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authIsPro = useAuthStore((s) => s.isPro);
  const authIsLoading = useAuthStore((s) => s.isLoading);
  const authError = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const clearAuthError = useAuthStore((s) => s.clearError);
  
  // UI store actions
  const showToast = useUIStore((s) => s.showToast);
  const footerVisible = useUIStore((s) => s.footerVisible);
  const toggleFooter = useUIStore((s) => s.toggleFooter);
  
  // Board store - minimal global state
  const cloudProjects = useBoardStore((s) => s.cloudProjects);
  
  // Controllers
  const billingController = useBillingController();
  
  const projectsController = useProjectsController({
    isDrawerOpen: projectsDrawerOpen,
    onOpenLimitModal: (type, current, max) => {
      setLimitReachedType(type);
      setLimitCountCurrent(current);
      setLimitCountMax(max);
      setLimitReachedModalOpen(true);
    },
    onCloseDrawer: () => setProjectsDrawerOpen(false),
  });
  
  const settingsController = useSettingsController({
    onCloseModal: () => setSettingsModalOpen(false),
    showToast,
  });
  
  // Payment return flow
  usePaymentReturn({
    onActivateStart: () => {
      billingController.setSubscriptionActivating(true);
      billingController.openUpgradeSuccessModal("pro", true);
    },
    onActivateSuccess: (tier) => {
      billingController.setSubscriptionActivating(false);
      billingController.openUpgradeSuccessModal(tier, true);
      showToast('🎉 Upgrade successful!');
    },
    onActivateDelayed: () => {
      billingController.setSubscriptionActivating(false);
      billingController.closeUpgradeSuccessModal();
      showToast('Your subscription is being activated. Refresh in a moment.');
    },
    onPortalReturn: (tierChanged, newTier) => {
      if (tierChanged && newTier) {
        if (newTier === 'free') {
          showToast('Subscription updated — you are now on Free.');
        } else if (newTier === 'pro') {
          showToast('Subscription updated — Pro is active.');
        } else {
          showToast('Subscription updated — Team is active.');
        }
      } else {
        showToast('Billing updated.');
      }
    },
    onCancelled: () => {
      showToast('Checkout cancelled');
    },
  });
  
  // Projects drawer handlers
  const handleOpenProjectsDrawer = useCallback(() => {
    setProjectsDrawerOpen(true);
  }, []);
  
  const handleSelectProject = projectsController.selectProject;
  const handleCreateProject = projectsController.createProject;
  const handleDeleteProject = projectsController.deleteProject;
  const handleDuplicateProject = projectsController.duplicateProject;
  const handleRenameProject = projectsController.renameProject;
  const handleCreateFolder = projectsController.createFolder;
  const handleToggleFavorite = projectsController.toggleFavorite;
  const handleMoveToFolder = projectsController.moveToFolder;
  const handleDeleteFolder = projectsController.deleteFolder;
  
  const handleEditFolder = useCallback(async (folderId: string) => {
    const folder = projectsController.folders.find(f => f.id === folderId);
    if (folder) {
      setEditingFolder(folder);
      setFolderOptionsModalOpen(true);
    }
  }, [projectsController.folders]);
  
  const handleUpdateFolder = useCallback(async (name: string, color: string) => {
    if (!editingFolder) return;
    await projectsController.updateFolder(editingFolder.id, name, color);
    setFolderOptionsModalOpen(false);
    setEditingFolder(null);
  }, [editingFolder, projectsController]);
  
  // L1 Pin/Unpin handlers
  const handleTogglePinProject = projectsController.togglePinProject;
  const handleTogglePinFolder = projectsController.togglePinFolder;
  
  // L1 Inline rename handlers
  const handleRenameProjectById = projectsController.renameProjectById;
  const handleRenameFolderById = projectsController.renameFolderById;
  
  // PR-L5-MINI: Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      useUIStore.getState().setOnline(true);
    };
    
    const handleOffline = () => {
      useUIStore.getState().setOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Convert cloud projects to ProjectItem format
  const projectItems: ProjectItem[] = cloudProjects.map((p) => ({
    id: p.id,
    name: p.name,
    updatedAt: p.updated_at,
    thumbnailUrl: p.thumbnail_url ?? undefined,
    isCloud: true,
    folderId: p.folder_id ?? undefined,
    tags: p.tags ?? undefined,
    isFavorite: p.is_favorite ?? false,
    isPinned: p.is_pinned ?? false,
  }));
  
  return (
    <>
      {/* Main board page */}
      <BoardPage
        onOpenProjectsDrawer={handleOpenProjectsDrawer}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenSettingsModal={() => setSettingsModalOpen(true)}
        onOpenPricingModal={() => billingController.openPricingModal()}
        onOpenLimitModal={(type, current, max) => {
          setLimitReachedType(type);
          setLimitCountCurrent(current);
          setLimitCountMax(max);
          setLimitReachedModalOpen(true);
        }}
        onRenameProject={handleRenameProject}
      />
      
      {/* Global Modals */}
      <ModalOrchestrator
        // Auth Modal
        authModalOpen={authModalOpen}
        onCloseAuthModal={() => {
          setAuthModalOpen(false);
          clearAuthError();
        }}
        onSignIn={async (email, password) => {
          await signIn(email, password);
          setAuthModalOpen(false);
          showToast('Welcome back!');
        }}
        onSignUp={signUp}
        onSignInWithGoogle={signInWithGoogle}
        authError={authError}
        authIsLoading={authIsLoading}
        
        // Pricing Modal
        pricingModalOpen={billingController.pricingModalOpen}
        onClosePricingModal={() => billingController.closePricingModal()}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        authIsPro={authIsPro}
        authIsAuthenticated={authIsAuthenticated}
        authUser={authUser}
        
        // Limit Reached Modal
        limitReachedModalOpen={limitReachedModalOpen}
        limitReachedType={limitReachedType}
        limitCountCurrent={limitCountCurrent}
        limitCountMax={limitCountMax}
        onCloseLimitReachedModal={() => setLimitReachedModalOpen(false)}
        onOpenPricingModal={() => billingController.openPricingModal()}
        
        // Projects Drawer
        projectsDrawerOpen={projectsDrawerOpen}
        onCloseProjectsDrawer={() => setProjectsDrawerOpen(false)}
        projectItems={projectItems}
        projectsFolders={projectsController.folders.map(f => ({
          id: f.id,
          name: f.name,
          color: f.color,
          icon: f.icon,
          isPinned: f.is_pinned ?? false,
          parentId: f.parent_id ?? null,
          sortOrder: f.position ?? 0,
        }))}
        currentProjectId={useBoardStore.getState().cloudProjectId}
        projectsIsLoading={projectsController.isLoading}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        onToggleFavorite={handleToggleFavorite}
        onTogglePinProject={handleTogglePinProject}
        onTogglePinFolder={handleTogglePinFolder}
        onMoveToFolder={handleMoveToFolder}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        onRenameProject={handleRenameProjectById}
        onRenameFolder={handleRenameFolderById}
        onMoveFolderToParent={projectsController.moveFolderToParent}
        onRefreshProjects={projectsController.refreshProjects}
        onOpenCreateFolderModal={(parentId?: string | null) => {
          setCreateFolderParentId(parentId ?? null);
          setCreateFolderModalOpen(true);
        }}
        
        // Create Folder Modal
        createFolderModalOpen={createFolderModalOpen}
        onCloseCreateFolderModal={() => {
          setCreateFolderModalOpen(false);
          setCreateFolderParentId(null);
        }}
        onCreateFolder={(name: string, color: string) => handleCreateFolder(name, color, createFolderParentId)}
        
        // Folder Options Modal
        folderOptionsModalOpen={folderOptionsModalOpen}
        editingFolder={editingFolder}
        onCloseFolderOptionsModal={() => {
          setFolderOptionsModalOpen(false);
          setEditingFolder(null);
        }}
        onUpdateFolder={handleUpdateFolder}
        
        // Settings Modal
        settingsModalOpen={settingsModalOpen}
        onCloseSettingsModal={() => setSettingsModalOpen(false)}
        onUpdateProfile={settingsController.updateProfile}
        onUploadAvatar={settingsController.uploadAvatar}
        onChangePassword={settingsController.changePassword}
        onDeleteAccount={settingsController.deleteAccount}
        onManageBilling={billingController.manageBilling}
        onUpgradeFromSettings={() => {
          setSettingsModalOpen(false);
          billingController.openPricingModal();
        }}
        theme={useUIStore.getState().theme}
        gridVisible={useUIStore.getState().gridVisible}
        snapEnabled={useUIStore.getState().snapEnabled}
        onToggleTheme={useUIStore.getState().toggleTheme}
        onToggleGrid={() => {
          useUIStore.getState().toggleGrid();
          showToast(useUIStore.getState().gridVisible ? 'Grid hidden' : 'Grid visible');
        }}
        onToggleSnap={() => {
          useUIStore.getState().toggleSnap();
          showToast(useUIStore.getState().snapEnabled ? 'Snap enabled' : 'Snap disabled');
        }}
        
        // Upgrade Success Modal
        upgradeSuccessModalOpen={billingController.upgradeSuccessModalOpen}
        onCloseUpgradeSuccessModal={() => billingController.closeUpgradeSuccessModal()}
        upgradedTier={billingController.upgradedTier}
        subscriptionActivating={billingController.subscriptionActivating}
      />
      
      {/* Footer */}
      <Footer 
        onNavigate={(path) => navigate(path)} 
        isVisible={footerVisible}
        onToggle={toggleFooter}
      />
    </>
  );
}
