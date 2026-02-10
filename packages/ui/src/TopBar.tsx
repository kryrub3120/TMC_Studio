/**
 * TopBar - Minimal top navigation bar
 * Contains: Logo, project name, saved status, Export, Focus, Theme toggle, Help, Cmd+K hint
 */

import React, { useState, useRef, useEffect } from 'react';

export type PlanType = 'guest' | 'free' | 'pro';

export interface TopBarProps {
  projectName: string;
  isSaved: boolean;
  focusMode: boolean;
  theme: 'light' | 'dark';
  /** User plan for account badge */
  plan?: PlanType;
  /** User initials for avatar */
  userInitials?: string;
  /** Is syncing to cloud */
  isSyncing?: boolean;
  /** Step info badge (e.g., "Step 2/5") */
  stepInfo?: string;
  /** Online/offline status (PR-L5-MINI) */
  isOnline?: boolean;
  onExport: () => void;
  onToggleFocus: () => void;
  onToggleTheme: () => void;
  onOpenPalette: () => void;
  onOpenHelp: () => void;
  /** Open projects drawer */
  onOpenProjects?: () => void;
  /** Rename project callback */
  onRename?: (newName: string) => void;
  /** Toggle inspector (responsive) */
  onToggleInspector?: () => void;
  /** Account menu callbacks */
  onOpenAccount?: () => void;
  onUpgrade?: () => void;
  onLogout?: () => void;
}

/** Sun icon for light mode */
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

/** Moon icon for dark mode */
const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/** Focus/Expand icon */
const FocusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

/** Download/Export icon */
const ExportIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/** Help/Question icon */
const HelpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/** Command/Keyboard icon */
const CommandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
  </svg>
);

/** Panel/Sidebar icon for Inspector toggle */
const PanelRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

/** Icon button component */
const IconButton: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}> = ({ onClick, title, children, active }) => (
  <button
    onClick={onClick}
    title={title}
    className={`
      p-2 rounded-md transition-all duration-fast
      hover:bg-surface2 active:scale-95
      ${active ? 'bg-surface2 text-accent' : 'text-muted hover:text-text'}
    `}
  >
    {children}
  </button>
);

/** Account Menu Component */
const AccountMenu: React.FC<{
  initials: string;
  plan: PlanType;
  onOpenAccount?: () => void;
  onUpgrade?: () => void;
  onLogout?: () => void;
}> = ({ initials, plan, onOpenAccount, onUpgrade, onLogout }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-md hover:bg-surface2 transition-colors"
        title="Account"
      >
        {/* Avatar circle */}
        <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium text-xs">
          {initials}
        </div>
        {/* Plan badge */}
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            plan === 'pro'
              ? 'bg-accent/20 text-accent'
              : 'bg-muted/20 text-muted'
          }`}
        >
          {plan === 'pro' ? 'Pro' : 'Free'}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-surface border border-border rounded-lg shadow-lg z-50">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAccount?.();
              }}
              className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface2 transition-colors"
            >
              Account & Billing
            </button>
            
            {plan === 'free' && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onUpgrade?.();
                }}
                className="w-full px-3 py-2 text-left text-sm text-accent font-medium hover:bg-surface2 transition-colors flex items-center gap-2"
              >
                <span>⭐</span> Upgrade to Pro
              </button>
            )}
            
            <div className="h-px bg-border my-1" />
            
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout?.();
              }}
              className="w-full px-3 py-2 text-left text-sm text-muted hover:text-text hover:bg-surface2 transition-colors"
            >
              Log Out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/** TopBar component */
export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  isSaved,
  focusMode,
  theme,
  plan = 'free',
  userInitials = 'U',
  isSyncing = false,
  stepInfo,
  isOnline = true,
  onExport,
  onToggleFocus,
  onToggleTheme,
  onOpenPalette,
  onOpenHelp,
  onOpenProjects,
  onRename,
  onToggleInspector,
  onOpenAccount,
  onUpgrade,
  onLogout,
}) => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
  const cmdKey = isMac ? '⌘' : 'Ctrl';
  
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // Handle save
  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== projectName && onRename) {
      onRename(trimmed);
    }
    setIsEditing(false);
  };
  
  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(projectName);
      setIsEditing(false);
    }
  };

  return (
    <header className="h-12 px-4 flex items-center justify-between bg-surface border-b border-border z-topbar">
      {/* Left: Logo + Project */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <span className="font-semibold text-text text-sm hidden sm:block">
            TMC Studio
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border hidden sm:block" />

        {/* Project name + saved status */}
        <div className="flex items-center gap-2 px-2 py-1 -mx-2">
          {/* Folder icon - click opens Projects drawer */}
          <button
            onClick={onOpenProjects}
            className="p-1 -m-1 rounded hover:bg-surface2 transition-colors group"
            title="Open Projects"
          >
            <svg className="w-4 h-4 text-muted group-hover:text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          
          {/* Project name - click to edit */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="text-text text-sm font-medium bg-surface2 border border-accent rounded px-2 py-0.5 w-[180px] outline-none"
              placeholder="Project name"
            />
          ) : (
            <button
              onClick={() => {
                setEditValue(projectName);
                setIsEditing(true);
              }}
              className="text-text text-sm font-medium truncate max-w-[200px] hover:text-accent transition-colors cursor-text"
              title="Click to rename"
            >
              {projectName}
            </button>
          )}
          
          {/* Save status indicator (PR-L5-MINI) */}
          {!isOnline ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
              Offline
            </span>
          ) : isSyncing ? (
            <div className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Saving...</span>
            </div>
          ) : (
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                isSaved
                  ? 'bg-accent/10 text-accent'
                  : 'bg-orange-500/10 text-orange-500'
              }`}
            >
              {isSaved ? 'Saved' : 'Unsaved'}
            </span>
          )}
          
          {/* Step info badge */}
          {stepInfo && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
              {stepInfo}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenPalette}
          className="
            flex items-center gap-2 px-3 py-1.5 rounded-md
            bg-surface2 border border-border
            text-muted text-sm
            hover:border-accent/50 hover:text-text
            transition-all duration-fast
          "
        >
          <CommandIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{cmdKey}+K</span>
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Export */}
        <IconButton onClick={onExport} title="Export PNG">
          <ExportIcon className="w-4 h-4" />
        </IconButton>

        {/* Focus Mode */}
        <IconButton onClick={onToggleFocus} title="Focus Mode (F)" active={focusMode}>
          <FocusIcon className="w-4 h-4" />
        </IconButton>

        {/* Theme Toggle */}
        <IconButton
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <MoonIcon className="w-4 h-4" />
          ) : (
            <SunIcon className="w-4 h-4" />
          )}
        </IconButton>

        {/* Help */}
        <IconButton onClick={onOpenHelp} title="Help & Shortcuts (?)">
          <HelpIcon className="w-4 h-4" />
        </IconButton>

        {/* Inspector Toggle - only visible on <xl */}
        {onToggleInspector && (
          <button
            onClick={onToggleInspector}
            className="xl:hidden p-2 rounded-md transition-all duration-fast hover:bg-surface2 active:scale-95 text-muted hover:text-text"
            title="Toggle Inspector"
          >
            <PanelRightIcon className="w-4 h-4" />
          </button>
        )}

        <div className="w-px h-5 bg-border mx-1" />

        {/* Account Menu */}
        <AccountMenu
          initials={userInitials}
          plan={plan}
          onOpenAccount={onOpenAccount}
          onUpgrade={onUpgrade}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
};

export default TopBar;
