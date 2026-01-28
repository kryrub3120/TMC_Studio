/**
 * ModalOrchestrator - Renders all global modals and drawers
 * Dumb orchestrator: receives all state + callbacks from AppShell
 */

import {
  AuthModal,
  PricingModal,
  ProjectsDrawer,
  SettingsModal,
  UpgradeSuccessModal,
  LimitReachedModal,
  CreateFolderModal,
  FolderOptionsModal,
  type ProjectItem,
} from '@tmc/ui';
import { type ProjectFolder, type User } from '../../lib/supabase';

interface ModalOrchestratorProps {
  // Auth Modal
  authModalOpen: boolean;
  onCloseAuthModal: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  authError: string | null;
  authIsLoading: boolean;
  
  // Pricing Modal
  pricingModalOpen: boolean;
  onClosePricingModal: () => void;
  onOpenAuthModal: () => void;
  authIsPro: boolean;
  authIsAuthenticated: boolean;
  authUser: User | null;
  
  // Limit Reached Modal
  limitReachedModalOpen: boolean;
  limitReachedType: 'guest-step' | 'guest-project' | 'free-step' | 'free-project';
  limitCountCurrent: number;
  limitCountMax: number;
  onCloseLimitReachedModal: () => void;
  onOpenPricingModal: () => void;
  
  // Projects Drawer
  projectsDrawerOpen: boolean;
  onCloseProjectsDrawer: () => void;
  projectItems: ProjectItem[];
  projectsFolders: Array<{ id: string; name: string; color: string; icon: string }>;
  currentProjectId: string | null;
  projectsIsLoading: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onToggleFavorite: (projectId: string) => void;
  onMoveToFolder: (projectId: string, folderId: string | null) => void;
  onEditFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRefreshProjects: () => void;
  onOpenCreateFolderModal: () => void;
  
  // Create Folder Modal
  createFolderModalOpen: boolean;
  onCloseCreateFolderModal: () => void;
  onCreateFolder: (name: string, color: string, icon?: string) => void;
  
  // Folder Options Modal
  folderOptionsModalOpen: boolean;
  editingFolder: ProjectFolder | null;
  onCloseFolderOptionsModal: () => void;
  onUpdateFolder: (name: string, color: string) => void;
  
  // Settings Modal
  settingsModalOpen: boolean;
  onCloseSettingsModal: () => void;
  onUpdateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string | null>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onDeleteAccount: (password: string) => Promise<void>;
  onManageBilling: () => Promise<void>;
  onUpgradeFromSettings: () => void;
  theme: 'light' | 'dark';
  gridVisible: boolean;
  snapEnabled: boolean;
  onToggleTheme: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  
  // Upgrade Success Modal
  upgradeSuccessModalOpen: boolean;
  onCloseUpgradeSuccessModal: () => void;
  upgradedTier: 'pro' | 'team';
  subscriptionActivating: boolean;
}

export function ModalOrchestrator(props: ModalOrchestratorProps) {
  return (
    <>
      {/* Auth Modal */}
      <AuthModal
        isOpen={props.authModalOpen}
        onClose={props.onCloseAuthModal}
        onSignIn={props.onSignIn}
        onSignUp={props.onSignUp}
        onSignInWithGoogle={props.onSignInWithGoogle}
        error={props.authError}
        isLoading={props.authIsLoading}
      />
      
      {/* Pricing Modal */}
      <PricingModal
        isOpen={props.pricingModalOpen}
        onClose={props.onClosePricingModal}
        currentPlan={props.authIsPro ? 'pro' : 'free'}
        isAuthenticated={props.authIsAuthenticated}
        onSignUp={() => {
          props.onClosePricingModal();
          props.onOpenAuthModal();
        }}
        user={props.authUser ? {
          id: props.authUser.id,
          email: props.authUser.email,
          stripe_customer_id: props.authUser.stripe_customer_id,
        } : null}
      />
      
      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={props.limitReachedModalOpen}
        type={props.limitReachedType}
        currentCount={props.limitCountCurrent}
        maxCount={props.limitCountMax}
        onSignup={() => {
          props.onCloseLimitReachedModal();
          props.onOpenAuthModal();
        }}
        onUpgrade={() => {
          props.onCloseLimitReachedModal();
          props.onOpenPricingModal();
        }}
        onClose={props.onCloseLimitReachedModal}
        onSeePlans={() => {
          props.onCloseLimitReachedModal();
          props.onOpenPricingModal();
        }}
      />
      
      {/* Projects Drawer */}
      <ProjectsDrawer
        isOpen={props.projectsDrawerOpen}
        onClose={props.onCloseProjectsDrawer}
        projects={props.projectItems}
        folders={props.projectsFolders}
        currentProjectId={props.currentProjectId}
        isAuthenticated={props.authIsAuthenticated}
        isLoading={props.projectsIsLoading}
        onSelectProject={props.onSelectProject}
        onCreateProject={props.onCreateProject}
        onDeleteProject={props.onDeleteProject}
        onDuplicateProject={props.onDuplicateProject}
        onCreateFolder={props.onOpenCreateFolderModal}
        onToggleFavorite={props.onToggleFavorite}
        onMoveToFolder={props.onMoveToFolder}
        onEditFolder={props.onEditFolder}
        onDeleteFolder={props.onDeleteFolder}
        onSignIn={() => {
          props.onCloseProjectsDrawer();
          props.onOpenAuthModal();
        }}
        onRefresh={props.onRefreshProjects}
      />
      
      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={props.createFolderModalOpen}
        onClose={props.onCloseCreateFolderModal}
        onCreate={props.onCreateFolder}
      />
      
      {/* Folder Options Modal */}
      {props.editingFolder && (
        <FolderOptionsModal
          isOpen={props.folderOptionsModalOpen}
          folderName={props.editingFolder.name}
          folderColor={props.editingFolder.color}
          onClose={props.onCloseFolderOptionsModal}
          onSave={props.onUpdateFolder}
        />
      )}
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={props.settingsModalOpen}
        onClose={props.onCloseSettingsModal}
        user={props.authUser ?? null}
        onUpdateProfile={props.onUpdateProfile}
        onUploadAvatar={props.onUploadAvatar}
        onChangePassword={props.onChangePassword}
        onDeleteAccount={props.onDeleteAccount}
        onManageBilling={props.onManageBilling}
        onUpgrade={props.onUpgradeFromSettings}
        theme={props.theme}
        gridVisible={props.gridVisible}
        snapEnabled={props.snapEnabled}
        onToggleTheme={props.onToggleTheme}
        onToggleGrid={props.onToggleGrid}
        onToggleSnap={props.onToggleSnap}
      />
      
      {/* Upgrade Success Modal */}
      <UpgradeSuccessModal
        isOpen={props.upgradeSuccessModalOpen}
        onClose={props.onCloseUpgradeSuccessModal}
        plan={props.upgradedTier}
        mode={props.subscriptionActivating ? 'activating' : 'success'}
      />
    </>
  );
}
