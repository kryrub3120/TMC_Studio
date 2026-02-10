/**
 * BoardTopBarSection - TopBar wiring for BoardPage
 */

import { TopBar } from '@tmc/ui';

export interface BoardTopBarSectionProps {
  // Document
  projectName: string;
  isSaved: boolean;
  isSyncing: boolean;
  stepInfo?: string;
  
  // Auth
  authIsPro: boolean;
  authIsAuthenticated: boolean;
  userInitials: string;
  
  // UI state
  focusMode: boolean;
  theme: 'light' | 'dark';
  isOnline?: boolean; // PR-L5-MINI
  
  // Handlers
  onExport: () => void;
  onToggleFocus: () => void;
  onToggleTheme: () => void;
  onOpenPalette: () => void;
  onOpenHelp: () => void;
  onOpenProjects: () => void;
  onRenameProject: (newName: string) => void;
  onToggleInspector: () => void;
  onOpenAccount: () => void;
  onUpgrade: () => void;
  onLogout?: () => void;
}

export function BoardTopBarSection(props: BoardTopBarSectionProps) {
  const {
    projectName,
    isSaved,
    isSyncing,
    stepInfo,
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
    onOpenProjects,
    onRenameProject,
    onToggleInspector,
    onOpenAccount,
    onUpgrade,
    onLogout,
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
      isOnline={isOnline}
      onExport={onExport}
      onToggleFocus={onToggleFocus}
      onToggleTheme={onToggleTheme}
      onOpenPalette={onOpenPalette}
      onOpenHelp={onOpenHelp}
      onOpenProjects={onOpenProjects}
      onRename={onRenameProject}
      onToggleInspector={onToggleInspector}
      onOpenAccount={onOpenAccount}
      onUpgrade={onUpgrade}
      onLogout={onLogout}
    />
  );
}
