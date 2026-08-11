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
import { ExerciseWorkspace, SessionWorkspace } from './coaching/CoachingWorkspace';
import { ModalOrchestrator } from './orchestrators/ModalOrchestrator';
import { getFormationIds } from '@tmc/presets';

const PENDING_UPGRADE_KEY = 'tmc-pending-upgrade';

type PendingUpgrade = {
  plan: 'pro' | 'team';
  cycle: 'monthly' | 'yearly';
};

function savePendingUpgrade(pending: PendingUpgrade): void {
  sessionStorage.setItem(PENDING_UPGRADE_KEY, JSON.stringify(pending));
}

function takePendingUpgrade(): PendingUpgrade | null {
  const raw = sessionStorage.getItem(PENDING_UPGRADE_KEY);
  if (!raw) return null;

  sessionStorage.removeItem(PENDING_UPGRADE_KEY);
  try {
    const parsed = JSON.parse(raw) as Partial<PendingUpgrade>;
    if (
      (parsed.plan === 'pro' || parsed.plan === 'team') &&
      (parsed.cycle === 'monthly' || parsed.cycle === 'yearly')
    ) {
      return parsed as PendingUpgrade;
    }
  } catch {
    // Ignore stale or malformed session data.
  }
  return null;
}

function clearPendingUpgrade(): void {
  sessionStorage.removeItem(PENDING_UPGRADE_KEY);
}

function GoogleAuthStatus({ title, description }: { title: string; description: string }) {
  return (
    <div className="fixed top-16 right-4 z-toast pointer-events-none max-w-[min(360px,calc(100vw-32px))]">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-surface/95 px-4 py-3 shadow-lg backdrop-blur-sm">
        <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">{title}</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p>
        </div>
      </div>
    </div>
  );
}

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
  const [boardEditorOverride, setBoardEditorOverride] = useState(false);

  // Auth store
  const authUser = useAuthStore((s) => s.user);
  const authIsAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authIsPro = useAuthStore((s) => s.isPro);
  const authIsLoading = useAuthStore((s) => s.isLoading);
  const authOAuthInProgress = useAuthStore((s) => s.isOAuthInProgress);
  const authFlow = useAuthStore((s) => s.authFlow);
  const authError = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const sendResetLink = useAuthStore((s) => s.sendResetLink);
  const resendConfirmation = useAuthStore((s) => s.resendConfirmation);
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

  useEffect(() => {
    if (!supabase || !authIsAuthenticated) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthAccessToken(session?.access_token ?? null);
    });
  }, [authIsAuthenticated]);

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
  const squadBenchVisible = useUIStore((s) => s.squadBenchVisible);
  const setSquadBenchVisible = useUIStore((s) => s.setSquadBenchVisible);
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
  const theme = useUIStore((s) => s.theme);
  const gridVisible = useUIStore((s) => s.gridVisible);
  const snapEnabled = useUIStore((s) => s.snapEnabled);
  const manualSave = useBoardStore((s) => s.manualSave);

  // Controllers
  const billingController = useBillingController();
  const { openPricingModal } = billingController;

  useEffect(() => {
    if (!authIsAuthenticated) return;

    const pending = takePendingUpgrade();
    if (!pending) return;

    openPricingModal(pending.cycle);
    track(EVENTS.PLAN_SELECTED, {
      plan: pending.plan,
      cycle: pending.cycle,
      isAuthenticated: true,
      resumedAfterAuth: true,
    });
  }, [authIsAuthenticated, openPricingModal]);

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
      billingController.openUpgradeActivationModal();
    },
    onActivateSuccess: (tier) => {
      track(EVENTS.UPGRADE, { tier });
      billingController.openUpgradeSuccessModal(tier);
      showToast(t('appToast.upgradeSuccessful'));
    },
    onActivateDelayed: () => {
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
      track(EVENTS.CHECKOUT_CANCELLED);
      showToast(t('appToast.checkoutCancelled'));
    },
  });

  // Purchase intent from the public /pricing page. `/board?upgrade=pro|team&cycle=yearly`
  // opens the pricing modal directly so visitors land on checkout, not a
  // blank board. Runs once on mount, then strips the param from the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgrade = params.get('upgrade');
    const cycle = params.get('cycle');
    const source = params.get('source');
    const formation = params.get('formation');

    if (source) {
      if (formation && getFormationIds().includes(formation)) {
        useBoardStore.getState().applyFormation(formation, 'home');
      }
      track(EVENTS.CONTENT_OPEN_BOARD, {
        source,
        formation: formation && getFormationIds().includes(formation) ? formation : undefined,
      });
      params.delete('source');
      params.delete('formation');
    }

    if (upgrade === 'pro' || upgrade === 'team') {
      billingController.openPricingModal(cycle === 'yearly' ? 'yearly' : 'monthly');
      params.delete('upgrade');
      params.delete('cycle');
    }

    if (source || upgrade === 'pro' || upgrade === 'team') {
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Projects drawer handlers
  const handleOpenProjectsDrawer = useCallback(() => {
    setProjectsDrawerOpen(true);
  }, []);

  const selectProject = projectsController.selectProject;
  const createProject = projectsController.createProject;
  const handleSelectProject = useCallback(async (id: string) => {
    setBoardEditorOverride(false);
    await selectProject(id);
  }, [selectProject]);
  const handleCreateProject = useCallback(async (type?: 'graphic' | 'exercise' | 'session', sourceGraphicProjectId?: string) => {
    setBoardEditorOverride(false);
    await createProject(type, sourceGraphicProjectId);
  }, [createProject]);
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
  const projectItems: ProjectItem[] = cloudProjects.map((p) => {
    const projectDocument = cloudProjectId === p.id ? document : p.document;
    return ({
    id: p.id,
    name: p.name,
    updatedAt: projectDocument.updatedAt ?? p.updated_at,
    thumbnailUrl: p.thumbnail_url ?? undefined,
    isCloud: true,
    saveStatus: cloudProjectId === p.id ? projectSaveStatus : undefined,
    folderId: p.folder_id ?? undefined,
    tags: p.tags ?? undefined,
    isFavorite: p.is_favorite ?? false,
    isPinned: p.is_pinned ?? false,
    projectType: projectDocument.projectType ?? 'graphic',
    description: projectDocument.description ?? p.description ?? undefined,
    lastOpenedAt: projectDocument.lastOpenedAt,
    exerciseDetails: projectDocument.exerciseDetails,
    sessionPlanDetails: projectDocument.sessionPlanDetails,
  });
  });

  const activeCloudProject = cloudProjects.find((project) => project.id === cloudProjectId);
  const activeProject: ProjectItem = {
    id: cloudProjectId ?? 'local-current-project',
    name: document.name,
    updatedAt: document.updatedAt,
    thumbnailUrl: activeCloudProject?.thumbnail_url ?? undefined,
    isCloud: Boolean(cloudProjectId),
    saveStatus: projectSaveStatus,
    folderId: activeCloudProject?.folder_id ?? undefined,
    tags: activeCloudProject?.tags ?? undefined,
    isFavorite: activeCloudProject?.is_favorite ?? false,
    isPinned: activeCloudProject?.is_pinned ?? false,
    projectType: document.projectType ?? 'graphic',
    description: document.description,
    lastOpenedAt: document.lastOpenedAt,
    exerciseDetails: document.exerciseDetails,
    sessionPlanDetails: document.sessionPlanDetails,
  };

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
      {(document.projectType ?? 'graphic') === 'exercise' && !boardEditorOverride ? (
        <ExerciseWorkspace
          project={activeProject}
          projects={projectItems}
          saveStatus={projectSaveStatus}
          onOpenProjects={handleOpenProjectsDrawer}
          onRename={handleRenameProject}
          onUpdate={(exerciseDetails, description) => {
            void projectsController.updateCurrentProjectMetadata({ exerciseDetails, description });
          }}
          onAttachGraphic={(projectId) => {
            void projectsController.attachGraphicToExercise(projectId);
          }}
          onEditBoard={() => setBoardEditorOverride(true)}
        />
      ) : document.projectType === 'session' && !boardEditorOverride ? (
        <SessionWorkspace
          project={activeProject}
          projects={projectItems}
          saveStatus={projectSaveStatus}
          onOpenProjects={handleOpenProjectsDrawer}
          onRename={handleRenameProject}
          onUpdate={(sessionPlanDetails, description) => {
            void projectsController.updateCurrentProjectMetadata({ sessionPlanDetails, description });
          }}
        />
      ) : (
      <>
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
        {document.projectType === 'exercise' && boardEditorOverride && (
          <button
            type="button"
            onClick={() => setBoardEditorOverride(false)}
            className="fixed left-1/2 top-14 z-40 -translate-x-1/2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-text shadow-lg hover:border-accent"
          >
            {t('coaching.exercise.backToExercise')}
          </button>
        )}
      </>
      )}

      {/* Global Modals */}
      <ModalOrchestrator
        // Auth Modal
        authModalOpen={authModalOpen}
        onCloseAuthModal={() => {
          setAuthModalOpen(false);
          clearPendingUpgrade();
          clearAuthError();
        }}
        onSignIn={async (email, password) => {
          await signIn(email, password);
          setAuthModalOpen(false);
          showToast(t('appToast.welcomeBack'));
        }}
        onSignUp={signUp}
        onSignInWithGoogle={async () => {
          showToast(t('appToast.googleLoginStarted'), 3500);
          try {
            await signInWithGoogle();
            setAuthModalOpen(false);
            showToast(t('appToast.welcomeBack'));
          } catch (error) {
            showToast(t('appToast.googleLoginFailed'), 3500);
            throw error;
          }
        }}
        onSendResetLink={sendResetLink}
        onResendConfirmation={resendConfirmation}
        // DEV-ONLY: "Test login" buttons in the auth modal. Remove this
        // prop (and useAuthStore.devLogin) once done testing.
        onDevLogin={import.meta.env.DEV ? (tier) => {
          devLogin(tier);
          setAuthModalOpen(false);
          showToast(t('appToast.devLogin', { tier }));
        } : undefined}
        authError={authError}
        authIsLoading={authIsLoading || authOAuthInProgress}
        authOAuthStatus={authFlow.status}

        // Pricing Modal
        pricingModalOpen={billingController.pricingModalOpen}
        onClosePricingModal={() => billingController.closePricingModal()}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onAuthRequiredForPlan={(plan, cycle) => {
          if (plan === 'pro' || plan === 'team') {
            savePendingUpgrade({ plan, cycle });
          } else {
            clearPendingUpgrade();
          }
          setAuthModalOpen(true);
        }}
        authIsPro={authIsPro}
        authIsAuthenticated={authIsAuthenticated}
        authUser={authUser}
        authAccessToken={authAccessToken}
        pricingInitialCycle={billingController.pricingCycle}
        onPlanSelected={(plan, cycle, isAuthenticated) => {
          track(EVENTS.PLAN_SELECTED, { plan, cycle, isAuthenticated });
        }}
        onCheckoutStarted={(plan, cycle) => {
          track(EVENTS.CHECKOUT_STARTED, { plan, cycle });
        }}
        onCheckoutFailed={(plan, cycle) => {
          track(EVENTS.CHECKOUT_FAILED, { plan, cycle });
        }}

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
        currentProjectId={cloudProjectId}
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
        onUpdateCurrentProjectMetadata={projectsController.updateCurrentProjectMetadata}
        onAttachGraphicToExercise={projectsController.attachGraphicToExercise}
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
        theme={theme}
        gridVisible={gridVisible}
        snapEnabled={snapEnabled}
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
        squadVisible={squadBenchVisible} // UX-C: use UI preference
        isPro={authIsPro}
        onAddSquadPlayer={(name, number, team, isGoalkeeper) => addSquadPlayer(name, number, team, isGoalkeeper)}
        onAddSquadPlayers={(players) => useBoardStore.getState().addSquadPlayers(players)}
        onRemoveSquadPlayer={(id) => removeSquadPlayer(id)}
        onUpdateSquadPlayer={(id, updates) => useBoardStore.getState().updateSquadPlayer(id, updates)}
        onSetSquadVisible={(visible) => setSquadBenchVisible(visible)} // UX-C: redirect to UI preference
        lineupPresets={document.lineupPresets}
        onSaveLineupPreset={(slot, team) => {
          const saved = useBoardStore.getState().saveLineupPreset(slot, team);
          showToast(saved ? t('settings.lineupSaved', { slot: slot + 1 }) : t('settings.lineupNeedsPlayers'));
        }}
        onApplyLineupPreset={(slot) => {
          const applied = useBoardStore.getState().applyLineupPreset(slot);
          showToast(applied ? t('settings.lineupApplied', { slot: slot + 1 }) : t('settings.lineupEmpty'));
        }}
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
        onManualSave={manualSave}

        // Upgrade Success Modal
        upgradeSuccessModalOpen={billingController.upgradeSuccessModalOpen}
        onCloseUpgradeSuccessModal={() => billingController.closeUpgradeSuccessModal()}
        upgradedTier={billingController.upgradedTier}
        subscriptionActivating={billingController.subscriptionActivating}
      />

      {authOAuthInProgress && !authModalOpen && (
        <GoogleAuthStatus
          title={t('auth.googlePopupTitle')}
          description={t('auth.googlePopupDescription')}
        />
      )}

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
