/**
 * TopBar - Minimal top navigation bar
 * Contains: Logo, project name, saved status, Export, Focus, Theme toggle, Help, Cmd+K hint
 */

import React from 'react';

export type PlanType = 'free' | 'pro';

export interface TopBarProps {
  projectName: string;
  isSaved: boolean;
  focusMode: boolean;
  theme: 'light' | 'dark';
  /** User plan for account badge */
  plan?: PlanType;
  /** User initials for avatar */
  userInitials?: string;
  onExport: () => void;
  onToggleFocus: () => void;
  onToggleTheme: () => void;
  onOpenPalette: () => void;
  onOpenHelp: () => void;
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
  onExport,
  onToggleFocus,
  onToggleTheme,
  onOpenPalette,
  onOpenHelp,
  onOpenAccount,
  onUpgrade,
  onLogout,
}) => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
  const cmdKey = isMac ? '⌘' : 'Ctrl';

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
        <div className="flex items-center gap-2">
          <span className="text-text text-sm font-medium truncate max-w-[200px]">
            {projectName}
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              isSaved
                ? 'bg-accent/10 text-accent'
                : 'bg-orange-500/10 text-orange-500'
            }`}
          >
            {isSaved ? 'Saved' : 'Unsaved'}
          </span>
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
