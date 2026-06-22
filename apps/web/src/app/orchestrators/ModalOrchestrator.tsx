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
  ConfirmModal,
  type ProjectItem,
  type FolderItem,
  type OrganizationPanelProps,
  type SettingsTab,
} from '@tmc/ui';
import { type ProjectFolder, type User } from '../../lib/supabase';
import type { ArrowType, ArrowDefaults, ZoneDefaults, TeamSettings, TeamSetting, PitchSettings, Team, PitchBoardPreset, SquadPlayer } from '@tmc/core';
import { useUIStore } from '../../store/useUIStore';

interface ModalOrchestratorProps {
  // Auth Modal
  authModalOpen: boolean;
  onCloseAuthModal: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  onSendResetLink: (email: string) => Promise<void>;
  onResendConfirmation: (email: string) => Promise<void>;
  authError: string | null;
  authIsLoading: boolean;
  /** DEV-ONLY: see useAuthStore.devLogin */
  onDevLogin?: (tier: 'free' | 'pro' | 'team') => void;
  
  // Pricing Modal
  pricingModalOpen: boolean;
  onClosePricingModal: () => void;
  onOpenAuthModal: () => void;
  authIsPro: boolean;
  authIsAuthenticated: boolean;
  authUser: User | null;
  authAccessToken: string | null;
  pricingInitialCycle?: 'monthly' | 'yearly';
  
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
  projectsFolders: FolderItem[];
  currentProjectId: string | null;
  projectsIsLoading: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onToggleFavorite: (projectId: string) => void;
  onTogglePinProject?: (projectId: string) => void;
  onTogglePinFolder?: (folderId: string) => void;
  onMoveToFolder: (projectId: string, folderId: string | null) => void;
  onEditFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameProject?: (projectId: string, newName: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onMoveFolderToParent?: (folderId: string, parentId: string | null, position: number) => void;
  onRefreshProjects: () => void;
  onOpenCreateFolderModal: (parentFolderId?: string | null) => void;
  
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
  settingsInitialTab?: SettingsTab;
  appVersion?: string;
  onCloseSettingsModal: () => void;
  onUpdateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string | null>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onDeleteAccount: (password: string) => Promise<void>;
  onManageBilling: () => Promise<void>;
  onUpgradeFromSettings: () => void;
  organizationPanelProps?: OrganizationPanelProps;
  theme: 'light' | 'dark';
  gridVisible: boolean;
  snapEnabled: boolean;
  gridSize: number;
  defaultArrowType: ArrowType;
  stepDuration: number;
  onToggleTheme: () => void;
  themeMode?: 'light' | 'dark' | 'system';
  onSetThemeMode?: (mode: 'light' | 'dark' | 'system') => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onSetGridSize: (size: number) => void;
  onSetDefaultArrowType: (type: ArrowType) => void;
  onSetStepDuration: (duration: number) => void;
  arrowDefaults?: ArrowDefaults;
  zoneDefaults?: ZoneDefaults;
  onSetArrowDefaults?: (patch: Partial<ArrowDefaults>) => void;
  onSetZoneDefaults?: (patch: Partial<ZoneDefaults>) => void;
  onResetElementDefaults?: () => void;
  shortcutOverrides?: Record<string, string>;
  onSetShortcutOverride?: (id: string, shortcut: string) => void;
  onResetShortcutOverrides?: () => void;
  
  // Squad Bench (from board store)
  squad?: SquadPlayer[];
  squadVisible?: boolean;
  isPro?: boolean;
  onAddSquadPlayer?: (name: string, number: number, team: Team, isGoalkeeper?: boolean) => void;
  onRemoveSquadPlayer?: (id: string) => void;
  onSetSquadVisible?: (visible: boolean) => void;
  // Board settings (Teams / Pitch — moved from the inspector)
  teamSettings?: TeamSettings;
  onUpdateTeam?: (team: Team, settings: Partial<TeamSetting>) => void;
  pitchSettings?: PitchSettings;
  onUpdatePitch?: (settings: Partial<PitchSettings>) => void;
  onSelectBoard?: (board: PitchBoardPreset) => void;
  isPrintMode?: boolean;
  onTogglePrintMode?: () => void;
  onExportBoard?: () => void;
  onImportBoard?: (file: File) => Promise<boolean>;
  
  // Upgrade Success Modal
  upgradeSuccessModalOpen: boolean;
  onCloseUpgradeSuccessModal: () => void;
  upgradedTier: 'pro' | 'team';
  subscriptionActivating: boolean;
}

export function ModalOrchestrator(props: ModalOrchestratorProps) {
  // Get confirm modal state from UI store
  const confirmModal = useUIStore((s) => s.confirmModal);
  const closeConfirmModal = useUIStore((s) => s.closeConfirmModal);
  
  return (
    <>
      {/* Auth Modal */}
      <AuthModal
        isOpen={props.authModalOpen}
        onClose={props.onCloseAuthModal}
        onSignIn={props.onSignIn}
        onSignUp={props.onSignUp}
        onSignInWithGoogle={props.onSignInWithGoogle}
        onSendResetLink={props.onSendResetLink}
        onResendConfirmation={props.onResendConfirmation}
        onDevLogin={props.onDevLogin}
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
        accessToken={props.authAccessToken}
        initialCycle={props.pricingInitialCycle}
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
        onTogglePinProject={props.onTogglePinProject}
        onTogglePinFolder={props.onTogglePinFolder}
        onMoveToFolder={props.onMoveToFolder}
        onEditFolder={props.onEditFolder}
        onDeleteFolder={props.onDeleteFolder}
        onRenameProject={props.onRenameProject}
        onRenameFolder={props.onRenameFolder}
        onMoveFolderToParent={props.onMoveFolderToParent}
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
        initialTab={props.settingsInitialTab}
        appVersion={props.appVersion}
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
        gridSize={props.gridSize}
        defaultArrowType={props.defaultArrowType}
        stepDuration={props.stepDuration}
        onToggleTheme={props.onToggleTheme}
        themeMode={props.themeMode}
        onSetThemeMode={props.onSetThemeMode}
        onToggleGrid={props.onToggleGrid}
        onToggleSnap={props.onToggleSnap}
        onSetGridSize={props.onSetGridSize}
        onSetDefaultArrowType={props.onSetDefaultArrowType}
        onSetStepDuration={props.onSetStepDuration}
        arrowDefaults={props.arrowDefaults}
        zoneDefaults={props.zoneDefaults}
        onSetArrowDefaults={props.onSetArrowDefaults}
        onSetZoneDefaults={props.onSetZoneDefaults}
        onResetElementDefaults={props.onResetElementDefaults}
        shortcutOverrides={props.shortcutOverrides}
        onSetShortcutOverride={props.onSetShortcutOverride}
        onResetShortcutOverrides={props.onResetShortcutOverrides}
        squad={props.squad}
        squadVisible={props.squadVisible}
        isPro={props.isPro}
        onAddSquadPlayer={props.onAddSquadPlayer}
        onRemoveSquadPlayer={props.onRemoveSquadPlayer}
        onSetSquadVisible={props.onSetSquadVisible}
        teamSettings={props.teamSettings}
        onUpdateTeam={props.onUpdateTeam}
        pitchSettings={props.pitchSettings}
        onUpdatePitch={props.onUpdatePitch}
        onSelectBoard={props.onSelectBoard}
        isPrintMode={props.isPrintMode}
        onTogglePrintMode={props.onTogglePrintMode}
        onExportBoard={props.onExportBoard}
        onImportBoard={props.onImportBoard}
        organizationPanelProps={props.organizationPanelProps}
      />
      
      {/* Upgrade Success Modal */}
      <UpgradeSuccessModal
        isOpen={props.upgradeSuccessModalOpen}
        onClose={props.onCloseUpgradeSuccessModal}
        plan={props.upgradedTier}
        mode={props.subscriptionActivating ? 'activating' : 'success'}
      />
      
      {/* Confirm Modal (replaces window.confirm) */}
      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          cancelLabel={confirmModal.cancelLabel}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => {
            confirmModal.onCancel?.();
            closeConfirmModal();
          }}
        />
      )}
    </>
  );
}
