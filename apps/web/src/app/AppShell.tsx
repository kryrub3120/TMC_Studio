/**
 * AppShell - Global app orchestration
 * Handles auth, billing, projects, settings, and global modals
 * Pure composition - no board/canvas logic
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AuthModal,
  PricingModal,
  ProjectsDrawer,
  SettingsModal,
  UpgradeSuccessModal,
  LimitReachedModal,
  Footer,
  CreateFolderModal,
  FolderOptionsModal,
  type ProjectItem,
} from '@tmc/ui';
import { type ProjectFolder } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useBoardStore } from '../store';
import { useBillingController, useProjectsController, useSettingsController, usePaymentReturn } from '../hooks';
import { BoardPage } from './board/BoardPage';

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
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
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
        error={authError}
        isLoading={authIsLoading}
      />
      
      {/* Pricing Modal */}
      <PricingModal
        isOpen={billingController.pricingModalOpen}
        onClose={() => billingController.closePricingModal()}
        currentPlan={authIsPro ? 'pro' : 'free'}
        isAuthenticated={authIsAuthenticated}
        onSignUp={() => {
          billingController.closePricingModal();
          setAuthModalOpen(true);
        }}
        user={authUser ? {
          id: authUser.id,
          email: authUser.email,
          stripe_customer_id: authUser.stripe_customer_id,
        } : null}
      />
      
      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={limitReachedModalOpen}
        type={limitReachedType}
        currentCount={limitCountCurrent}
        maxCount={limitCountMax}
        onSignup={() => {
          setLimitReachedModalOpen(false);
          setAuthModalOpen(true);
        }}
        onUpgrade={() => {
          setLimitReachedModalOpen(false);
          billingController.openPricingModal();
        }}
        onClose={() => setLimitReachedModalOpen(false)}
        onSeePlans={() => {
          setLimitReachedModalOpen(false);
          billingController.openPricingModal();
        }}
      />
      
      {/* Projects Drawer */}
      <ProjectsDrawer
        isOpen={projectsDrawerOpen}
        onClose={() => setProjectsDrawerOpen(false)}
        projects={projectItems}
        folders={projectsController.folders.map(f => ({
          id: f.id,
          name: f.name,
          color: f.color,
          icon: f.icon,
        }))}
        currentProjectId={useBoardStore.getState().cloudProjectId}
        isAuthenticated={authIsAuthenticated}
        isLoading={projectsController.isLoading}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        onCreateFolder={() => setCreateFolderModalOpen(true)}
        onToggleFavorite={handleToggleFavorite}
        onMoveToFolder={handleMoveToFolder}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        onSignIn={() => {
          setProjectsDrawerOpen(false);
          setAuthModalOpen(true);
        }}
        onRefresh={projectsController.refreshProjects}
      />
      
      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        onCreate={handleCreateFolder}
      />
      
      {/* Folder Options Modal */}
      {editingFolder && (
        <FolderOptionsModal
          isOpen={folderOptionsModalOpen}
          folderName={editingFolder.name}
          folderColor={editingFolder.color}
          onClose={() => {
            setFolderOptionsModalOpen(false);
            setEditingFolder(null);
          }}
          onSave={handleUpdateFolder}
        />
      )}
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        user={authUser ?? null}
        onUpdateProfile={settingsController.updateProfile}
        onUploadAvatar={settingsController.uploadAvatar}
        onChangePassword={settingsController.changePassword}
        onDeleteAccount={settingsController.deleteAccount}
        onManageBilling={billingController.manageBilling}
        onUpgrade={() => {
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
      />
      
      {/* Upgrade Success Modal */}
      <UpgradeSuccessModal
        isOpen={billingController.upgradeSuccessModalOpen}
        onClose={() => billingController.closeUpgradeSuccessModal()}
        plan={billingController.upgradedTier}
        mode={billingController.subscriptionActivating ? 'activating' : 'success'}
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
