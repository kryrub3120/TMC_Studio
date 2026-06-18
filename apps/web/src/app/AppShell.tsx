/**
 * AppShell - Global app orchestration
 * Handles auth, billing, projects, settings, and global modals
 * Pure composition - no board/canvas logic
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, type ProjectItem, type SettingsTab, ClubWelcomeModal } from '@tmc/ui';
import { DEFAULT_TEAM_SETTINGS, DEFAULT_PITCH_SETTINGS } from '@tmc/core';
import type { PitchBoardPreset } from '@tmc/core';
import { type ProjectFolder } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import appPkg from '../../package.json';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useBoardStore } from '../store';
import { startBoardSession, track, EVENTS } from '../lib/analytics';
import { useBillingController, useProjectsController, useSettingsController, usePaymentReturn, useOrganization } from '../hooks';
import { createOrganization as createOrganizationApi } from '../lib/organizations';
import { BoardPage } from './board/BoardPage';
import { ModalOrchestrator } from './orchestrators/ModalOrchestrator';

/** Global app shell - orchestrates auth, billing, projects, settings */
export function AppShell() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Auth state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [limitReachedModalOpen, setLimitReachedModalOpen] = useState(false);
  const [limitReachedType, setLimitReachedType] = useState<'guest-step' | 'guest-project' | 'free-step' | 'free-project'>('guest-step');
  const [limitCountCurrent, setLimitCountCurrent] = useState(0);
  const [limitCountMax, setLimitCountMax] = useState(0);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab | undefined>(undefined);
  const [projectsDrawerOpen, setProjectsDrawerOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [folderOptionsModalOpen, setFolderOptionsModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null);
  const [clubWelcomeModalOpen, setClubWelcomeModalOpen] = useState(false);

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
  // DEV-ONLY: see useAuthStore.devLogin
  const devLogin = useAuthStore((s) => s.devLogin);
  const teamId = useAuthStore((s) => s.teamId);

  // Track Supabase access token for billing API calls
  const [authAccessToken, setAuthAccessToken] = useState<string | null>(null);

  // Subscribe to auth state changes to keep access token in sync
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthAccessToken(session?.access_token ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthAccessToken(session?.access_token ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // UI store actions
  const showToast = useUIStore((s) => s.showToast);
  const clubWelcomeSeen = useUIStore((s) => s.clubWelcomeSeen);
  const setClubWelcomeSeen = useUIStore((s) => s.setClubWelcomeSeen);

  // Board store - minimal global state
  const cloudProjects = useBoardStore((s) => s.cloudProjects);
  const cloudProjectId = useBoardStore((s) => s.cloudProjectId);
  const document = useBoardStore((s) => s.document);
  const addSquadPlayer = useBoardStore((s) => s.addSquadPlayer);
  const removeSquadPlayer = useBoardStore((s) => s.removeSquadPlayer);
  const setSquadVisible = useBoardStore((s) => s.setSquadVisible);
  const updateTeamSettings = useBoardStore((s) => s.updateTeamSettings);
  const updatePitchSettings = useBoardStore((s) => s.updatePitchSettings);
  const applyPitchBoard = useBoardStore((s) => s.applyPitchBoard);
  const showConfirmModal = useUIStore((s) => s.showConfirmModal);

  // Switch board preset. If the drawing has elements, confirm a reset first.
  const handleSelectBoard = useCallback((board: PitchBoardPreset) => {
    const hasElements = useBoardStore.getState().elements.length > 0;
    if (hasElements) {
      showConfirmModal({
        title: t('pitchPanel.boardResetTitle'),
        description: t('pitchPanel.boardResetDesc'),
        confirmLabel: t('pitchPanel.boardResetConfirm'),
        danger: true,
        onConfirm: () => {
          applyPitchBoard({ view: board.view, projection: board.projection });
          useUIStore.getState().closeConfirmModal();
        },
      });
    } else {
      applyPitchBoard({ view: board.view, projection: board.projection });
    }
  }, [showConfirmModal, applyPitchBoard, t]);
  const isPrintMode = useUIStore((s) => s.isPrintMode);
  const togglePrintMode = useUIStore((s) => s.togglePrintMode);
  const exportBoardToFile = useBoardStore((s) => s.exportBoardToFile);
  const importBoardFromFile = useBoardStore((s) => s.importBoardFromFile);
  const themeMode = useUIStore((s) => s.themeMode);
  const setThemeMode = useUIStore((s) => s.setThemeMode);
  const gridSize = useUIStore((s) => s.gridSize);
  const setGridSize = useUIStore((s) => s.setGridSize);
  const defaultArrowType = useUIStore((s) => s.defaultArrowType);
  const setDefaultArrowType = useUIStore((s) => s.setDefaultArrowType);
  const stepDuration = useUIStore((s) => s.stepDuration);
  const setStepDuration = useUIStore((s) => s.setStepDuration);
  const arrowDefaults = useUIStore((s) => s.arrowDefaults);
  const zoneDefaults = useUIStore((s) => s.zoneDefaults);
  const setArrowDefaults = useUIStore((s) => s.setArrowDefaults);
  const setZoneDefaults = useUIStore((s) => s.setZoneDefaults);
  const resetElementDefaults = useUIStore((s) => s.resetElementDefaults);
  const shortcutOverrides = useUIStore((s) => s.shortcutOverrides);
  const setShortcutOverride = useUIStore((s) => s.setShortcutOverride);
  const resetShortcutOverrides = useUIStore((s) => s.resetShortcutOverrides);
  const projectSaveStatus = useUIStore((s) => s.projectSaveStatus);

  // Controllers
  const billingController = useBillingController();

  // S6: editor mount — start time-to-first-export timer + funnel event.
  useEffect(() => {
    startBoardSession();
    track(EVENTS.OPEN_BOARD);
  }, []);

  const projectsController = useProjectsController({
    isDrawerOpen: projectsDrawerOpen,
    onOpenLimitModal: (type, current, max) => {
      track(EVENTS.LIMIT_HIT, { type, current, max });
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

  const organizationPanelProps = useOrganization();

  // Payment return flow
  usePaymentReturn({
    onActivateStart: () => {
      billingController.setSubscriptionActivating(true);
      billingController.openUpgradeSuccessModal("pro", true);
    },
    onActivateSuccess: (tier) => {
      track(EVENTS.UPGRADE, { tier });
      billingController.setSubscriptionActivating(false);
      billingController.openUpgradeSuccessModal(tier, true);
      showToast(t('appToast.upgradeSuccessful'));
    },
    onActivateDelayed: () => {
      billingController.setSubscriptionActivating(false);
      billingController.closeUpgradeSuccessModal();
      showToast(t('appToast.subscriptionActivating'));
    },
    onPortalReturn: (tierChanged, newTier) => {
      if (tierChanged && newTier) {
        if (newTier === 'free') {
          showToast(t('appToast.subscriptionFree'));
        } else if (newTier === 'pro') {
          showToast(t('appToast.subscriptionPro'));
        } else {
          showToast(t('appToast.subscriptionTeam'));
        }
      } else {
        showToast(t('appToast.billingUpdated'));
      }
    },
    onCancelled: () => {
      showToast(t('appToast.checkoutCancelled'));
    },
  });

  // Purchase intent from the public /pricing page. `/app?upgrade=pro|team&cycle=yearly`
  // opens the pricing modal directly so visitors land on checkout, not a
  // blank board. Runs once on mount, then strips the param from the URL.
  const [pricingUpgradeCycle, setPricingUpgradeCycle] = useState<'monthly' | 'yearly'>('monthly');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgrade = params.get('upgrade');
    const cycle = params.get('cycle');
    if (upgrade === 'pro' || upgrade === 'team') {
      setPricingUpgradeCycle(cycle === 'yearly' ? 'yearly' : 'monthly');
      billingController.openPricingModal();
      params.delete('upgrade');
      params.delete('cycle');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    saveStatus: cloudProjectId === p.id ? projectSaveStatus : undefined,
    folderId: p.folder_id ?? undefined,
    tags: p.tags ?? undefined,
    isFavorite: p.is_favorite ?? false,
    isPinned: p.is_pinned ?? false,
  }));

  // Club Welcome Modal trigger: show once for first-time Club Premium admins
  // that haven't seen the welcome flow yet AND have a team
  useEffect(() => {
    // Club Premium welcome is disabled — every plan now gets the same unified
    // in-app tutorial (its final step covers Settings/club management).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void teamId; void clubWelcomeSeen;
  }, [teamId, clubWelcomeSeen]);

  const handleClubWelcomeComplete = useCallback(() => {
    setClubWelcomeSeen(true);
    setClubWelcomeModalOpen(false);
  }, [setClubWelcomeSeen]);

  const handleClubWelcomeSkip = useCallback(() => {
    setClubWelcomeSeen(true);
    setClubWelcomeModalOpen(false);
  }, [setClubWelcomeSeen]);

  const handleSaveTeamName = useCallback(async (name: string) => {
    try {
      await createOrganizationApi(name);
      showToast(t('appToast.clubCreated'));
    } catch {
      showToast(t('club.errors.createFailed'));
      throw new Error('Failed to create club');
    }
  }, [showToast, t]);

  return (
    <>
      {/* Main board page */}
      <BoardPage
        onOpenProjectsDrawer={handleOpenProjectsDrawer}
        onCloseProjectsDrawer={() => setProjectsDrawerOpen(false)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenSettingsModal={(tab) => {
          setSettingsInitialTab(tab);
          setSettingsModalOpen(true);
        }}
        onCloseSettingsModal={() => setSettingsModalOpen(false)}
        onOpenPricingModal={() => billingController.openPricingModal()}
        onOpenLimitModal={(type, current, max) => {
          track(EVENTS.LIMIT_HIT, { type, current, max });
          setLimitReachedType(type);
          setLimitCountCurrent(current);
          setLimitCountMax(max);
          setLimitReachedModalOpen(true);
        }}
        onRenameProject={handleRenameProject}

        // Footer (merged into bottom bar) — version from package.json (source of truth, see VERSIONING.md)
        appVersion={appPkg.version}
        onNavigateFooter={(path: string) => navigate(path)}
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
          showToast(t('appToast.welcomeBack'));
        }}
        onSignUp={signUp}
        onSignInWithGoogle={signInWithGoogle}
        // DEV-ONLY: "Test login" buttons in the auth modal. Remove this
        // prop (and useAuthStore.devLogin) once done testing.
        onDevLogin={import.meta.env.DEV ? (tier) => {
          devLogin(tier);
          setAuthModalOpen(false);
          showToast(t('appToast.devLogin', { tier }));
        } : undefined}
        authError={authError}
        authIsLoading={authIsLoading}

        // Pricing Modal
        pricingModalOpen={billingController.pricingModalOpen}
        onClosePricingModal={() => billingController.closePricingModal()}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        authIsPro={authIsPro}
        authIsAuthenticated={authIsAuthenticated}
        authUser={authUser}
        authAccessToken={authAccessToken}
        pricingInitialCycle={pricingUpgradeCycle}

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
        settingsInitialTab={settingsInitialTab}
        appVersion={appPkg.version}
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
        organizationPanelProps={organizationPanelProps}
        theme={useUIStore.getState().theme}
        gridVisible={useUIStore.getState().gridVisible}
        snapEnabled={useUIStore.getState().snapEnabled}
        gridSize={gridSize}
        defaultArrowType={defaultArrowType}
        stepDuration={stepDuration}
        onToggleTheme={useUIStore.getState().toggleTheme}
        themeMode={themeMode}
        onSetThemeMode={setThemeMode}
        onToggleGrid={() => {
          useUIStore.getState().toggleGrid();
          showToast(useUIStore.getState().gridVisible ? t('commands.toast.gridVisible') : t('commands.toast.gridHidden'));
        }}
        onToggleSnap={() => {
          useUIStore.getState().toggleSnap();
          showToast(useUIStore.getState().snapEnabled ? t('commands.toast.snapEnabled') : t('commands.toast.snapDisabled'));
        }}
        onSetGridSize={setGridSize}
        onSetDefaultArrowType={setDefaultArrowType}
        onSetStepDuration={setStepDuration}
        arrowDefaults={arrowDefaults}
        zoneDefaults={zoneDefaults}
        onSetArrowDefaults={setArrowDefaults}
        onSetZoneDefaults={setZoneDefaults}
        onResetElementDefaults={resetElementDefaults}
        shortcutOverrides={shortcutOverrides}
        onSetShortcutOverride={setShortcutOverride}
        onResetShortcutOverrides={resetShortcutOverrides}

        // Squad Bench
        squad={document.squad ?? []}
        squadVisible={document.squadVisible ?? true}
        isPro={authIsPro}
        onAddSquadPlayer={(name, number, team, isGoalkeeper) => addSquadPlayer(name, number, team as any, isGoalkeeper)}
        onRemoveSquadPlayer={(id) => removeSquadPlayer(id)}
        onSetSquadVisible={(visible) => setSquadVisible(visible)}
        // Board settings (Teams / Pitch — moved from inspector)
        teamSettings={document.teamSettings ?? DEFAULT_TEAM_SETTINGS}
        onUpdateTeam={updateTeamSettings}
        pitchSettings={document.pitchSettings ?? DEFAULT_PITCH_SETTINGS}
        onUpdatePitch={updatePitchSettings}
        onSelectBoard={handleSelectBoard}
        isPrintMode={isPrintMode}
        onTogglePrintMode={togglePrintMode}
        onExportBoard={exportBoardToFile}
        onImportBoard={importBoardFromFile}

        // Upgrade Success Modal
        upgradeSuccessModalOpen={billingController.upgradeSuccessModalOpen}
        onCloseUpgradeSuccessModal={() => billingController.closeUpgradeSuccessModal()}
        upgradedTier={billingController.upgradedTier}
        subscriptionActivating={billingController.subscriptionActivating}
      />

      {/* Club Premium Welcome Modal (Sprint H3) */}
      <ClubWelcomeModal
        isOpen={clubWelcomeModalOpen}
        onClose={handleClubWelcomeSkip}
        onComplete={handleClubWelcomeComplete}
        onSaveTeamName={handleSaveTeamName}
        onOpenTeamPanel={() => {
          setClubWelcomeModalOpen(false);
          setSettingsModalOpen(true);
          setSettingsInitialTab('club');
        }}
        currentTeamName={document.name}
      />
    </>
  );
}
