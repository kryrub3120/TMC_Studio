/**
 * BoardTopBarSection - TopBar wiring for BoardPage
 */

import { TopBar, type ExportFormat } from '@tmc/ui';
import type { ArrowType, EquipmentType, EquipmentVariant, ZoneShape, Team, PitchBoardPreset } from '@tmc/core';

export interface BoardTopBarSectionProps {
  // Document
  projectName: string;
  isSaved: boolean;
  isSyncing: boolean;
  stepInfo?: string;
  tutorialMenu?: string | null;
  
  // Auth
  authIsPro: boolean;
  authIsAuthenticated: boolean;
  userInitials: string;
  
  // UI state
  focusMode: boolean;
  theme: 'light' | 'dark';
  isOnline?: boolean; // PR-L5-MINI
  
  // Handlers
  onExport: (format: ExportFormat) => void;
  onToggleFocus: () => void;
  onToggleTheme: () => void;
  onOpenPalette: () => void;
  onOpenHelp: () => void;
  onSelectArrowTool?: (type: ArrowType) => void;
  onSelectZoneTool?: (shape: ZoneShape) => void;
  onAddEquipment?: (type: EquipmentType, variant?: EquipmentVariant) => void;
  onAddBall?: (variant: 'single' | 'cluster') => void;
  onAddPlayer?: (team: Team) => void;
  onOpenSquadSettings?: () => void;
  onSelectBoard?: (board: PitchBoardPreset) => void;
  activeBoardId?: string;
  onOpenProjects: () => void;
  onRenameProject: (newName: string) => void;
  onToggleInspector: () => void;
  onOpenAccount: () => void;
  onUpgrade: () => void;
  onLogout?: () => void;
  onOpenSettings: () => void;
  /** DEV-ONLY: see useAuthStore.devLogin */
  onDevLogin?: (tier: 'guest' | 'free' | 'pro' | 'team') => void;
  /** DEV-ONLY: see useAuthStore.devClearData */
  onClearDevData?: () => void;
}

export function BoardTopBarSection(props: BoardTopBarSectionProps) {
  const {
    projectName,
    isSaved,
    isSyncing,
    stepInfo,
    tutorialMenu,
    authIsPro,
    authIsAuthenticated,
    userInitials,
    focusMode,
    theme,
    isOnline = true,
    onExport,
    onToggleFocus,
    onToggleTheme,
    onOpenPalette,
    onOpenHelp,
    onSelectArrowTool,
    onSelectZoneTool,
    onAddEquipment,
    onAddBall,
    onAddPlayer,
    onOpenSquadSettings,
    onOpenProjects,
    onSelectBoard,
    activeBoardId,
    onRenameProject,
    onToggleInspector,
    onOpenAccount,
    onUpgrade,
    onLogout,
    onOpenSettings,
    onDevLogin,
    onClearDevData,
  } = props;

  if (focusMode) return null;

  return (
    <TopBar
      projectName={projectName}
      isSaved={isSaved}
      focusMode={focusMode}
      theme={theme}
      plan={authIsPro ? 'pro' : (authIsAuthenticated ? 'free' : 'guest')}
      userInitials={userInitials}
      isSyncing={isSyncing}
      stepInfo={stepInfo}
      tutorialMenu={tutorialMenu}
      isOnline={isOnline}
      onExport={onExport}
      onToggleFocus={onToggleFocus}
      onToggleTheme={onToggleTheme}
      onOpenPalette={onOpenPalette}
      onOpenHelp={onOpenHelp}
      onSelectArrowTool={onSelectArrowTool}
      onSelectZoneTool={onSelectZoneTool}
      onAddEquipment={onAddEquipment}
      onAddBall={onAddBall}
      onAddPlayer={onAddPlayer}
      onOpenSquadSettings={onOpenSquadSettings}
      onOpenProjects={onOpenProjects}
      onSelectBoard={onSelectBoard}
      activeBoardId={activeBoardId}
      onRename={onRenameProject}
      onToggleInspector={onToggleInspector}
      onOpenAccount={onOpenAccount}
      onUpgrade={onUpgrade}
      onLogout={onLogout}
      onOpenSettings={onOpenSettings}
      onOpenSquadSettingsFromAccount={onOpenSquadSettings}
      onDevLogin={onDevLogin}
      onClearDevData={onClearDevData}
    />
  );
}
