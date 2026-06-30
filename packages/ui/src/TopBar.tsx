/**
 * TopBar - Minimal top navigation bar
 * Contains: Logo, project name, saved status, Export, Focus, Theme toggle, Help, Cmd+K hint
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ArrowType, EquipmentType, EquipmentVariant, ZoneShape, Team, PitchBoardPreset } from '@tmc/core';
import { DEFAULT_TEAM_SETTINGS, PITCH_BOARDS } from '@tmc/core';
import { useTranslation } from './i18n.js';
import { LanguageSwitcher } from './LanguageSwitcher.js';

export type PlanType = 'guest' | 'free' | 'pro';
export type ExportFormat = 'png' | 'png-all' | 'jpg' | 'pdf' | 'gif';

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
  /** Tutorial-driven: id of the toolbar dropdown to force open ('players'|'arrows'|'equipment'|'export'), or null. */
  tutorialMenu?: string | null;
  /** Online/offline status (PR-L5-MINI) */
  isOnline?: boolean;
  /** Export with format selection — replaces single onExport */
  onExport?: (format: ExportFormat) => void;
  onToggleFocus: () => void;
  onToggleTheme: () => void;
  onOpenPalette: () => void;
  onOpenHelp: () => void;
  /** Select an arrow drawing tool from top bar dropdown */
  onSelectArrowTool?: (type: ArrowType) => void;
  /** Select a zone drawing tool from top bar dropdown */
  onSelectZoneTool?: (shape: ZoneShape) => void;
  /** Add equipment from top bar dropdown */
  onAddEquipment?: (type: EquipmentType, variant?: EquipmentVariant) => void;
  /** Add a ball (single) or ball cluster from top bar dropdown */
  onAddBall?: (variant: 'single' | 'cluster') => void;
  /** Select a board preset from the TopBar 'Boiska' dropdown. */
  onSelectBoard?: (board: PitchBoardPreset) => void;
  /** Currently active board id (for highlighting in the dropdown). */
  activeBoardId?: string;
  /** Add a player of the given team from top bar dropdown */
  onAddPlayer?: (team: Team) => void;
  /** Open squad settings (Squad Bench management) */
  onOpenSquadSettings?: () => void;
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
  onOpenSettings?: () => void;
  onOpenSquadSettingsFromAccount?: () => void;
  /** DEV-ONLY: quickly switch the mock test session's plan, or end it.
   *  Only pass this in when import.meta.env.DEV is true. Safe to remove
   *  later along with the matching block in useAuthStore. */
  onDevLogin?: (tier: 'guest' | 'free' | 'pro' | 'team') => void;
  /** DEV-ONLY: see onDevLogin / useAuthStore.devClearData */
  onClearDevData?: () => void;
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

const EquipmentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19h16" />
    <path d="M7 19l2-12h6l2 12" />
    <path d="M8.2 12h7.6" />
    <path d="M9 7l6 12" />
    <path d="M15 7L9 19" />
  </svg>
);

const ArrowsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12h13" />
    <path d="M13 6l6 6-6 6" />
    <path d="M5 18c4-5 7-5 11-1" />
  </svg>
);

const ZonesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M8 9h8M8 13h5" />
  </svg>
);

const MiniArrowGlyph: React.FC<{ type: ArrowType }> = ({ type }) => {
  if (type === 'run') {
    return (
      <svg viewBox="0 0 44 28" className="h-7 w-11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 14h26" strokeDasharray="5 4" />
        <path d="M27 7l10 7-10 7" />
      </svg>
    );
  }
  if (type === 'shoot') {
    return (
      <svg viewBox="0 0 44 28" className="h-7 w-11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 11h25" />
        <path d="M5 17h25" />
        <path d="M29 6l10 8-10 8" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (type === 'dribble') {
    return (
      <svg viewBox="0 0 44 28" className="h-7 w-11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 19c5-13 9 13 14 0s9 13 14-1" />
        <path d="M29 10l10 7-10 7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 44 28" className="h-7 w-11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 14h27" />
      <path d="M28 7l10 7-10 7" />
    </svg>
  );
};

const MiniZoneGlyph: React.FC<{ shape: ZoneShape }> = ({ shape }) => {
  if (shape === 'ellipse') {
    return <span className="h-6 w-8 rounded-full border-2 border-current bg-current/10" />;
  }
  if (shape === 'polygon') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-8" fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <polygon points="12,3 21,9 17,20 7,20 3,9" />
      </svg>
    );
  }
  return <span className="h-6 w-8 rounded-md border-2 border-current bg-current/10" />;
};

/** Mini ball glyph (single classic football) */
const MiniBallGlyph: React.FC = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6">
    <circle cx="12" cy="12" r="9.5" fill="#fff" stroke="#1a1a1a" strokeWidth="1.5" />
    <polygon points="12,7 15.2,9.4 14,13.2 10,13.2 8.8,9.4" fill="#1a1a1a" />
  </svg>
);

/** Mini ball-cluster glyph (pile of balls) */
const MiniBallClusterGlyph: React.FC = () => (
  <svg viewBox="0 0 28 24" className="h-6 w-7">
    {[
      { cx: 8, cy: 14, r: 6 },
      { cx: 19, cy: 14, r: 6 },
      { cx: 13.5, cy: 8, r: 6.4 },
    ].map((b, i) => (
      <g key={i}>
        <circle cx={b.cx} cy={b.cy} r={b.r} fill="#fff" stroke="#1a1a1a" strokeWidth="1.3" />
        <polygon
          points={`${b.cx},${b.cy - b.r * 0.55} ${b.cx + b.r * 0.5},${b.cy - b.r * 0.1} ${b.cx + b.r * 0.32},${b.cy + b.r * 0.45} ${b.cx - b.r * 0.32},${b.cy + b.r * 0.45} ${b.cx - b.r * 0.5},${b.cy - b.r * 0.1}`}
          fill="#1a1a1a"
        />
      </g>
    ))}
  </svg>
);

const MiniEquipmentGlyph: React.FC<{ type: EquipmentType; variant?: EquipmentVariant }> = ({ type, variant }) => {
  if (type === 'goal') {
    return <span className="h-5 w-7 rounded-t-md border-2 border-current border-b-0" />;
  }
  if (type === 'mannequin') {
    return (
      <span className="relative h-7 w-5">
        <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-current" />
        <span className="absolute bottom-0 left-1/2 h-[18px] w-3.5 -translate-x-1/2 rounded-t-full border-2 border-current" />
      </span>
    );
  }
  if (type === 'cone') {
    if (variant === 'flat') {
      // low disc / marker dome
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-7" fill="currentColor">
          <path d="M4 15c0-5.5 16-5.5 16 0z" />
          <ellipse cx="12" cy="15.5" rx="9" ry="2" fillOpacity="0.55" />
        </svg>
      );
    }
    if (variant === 'tall') {
      // taller, narrower cone on a base plate
      return (
        <svg viewBox="0 0 24 24" className="h-7 w-5" fill="currentColor">
          <polygon points="12,2 16,18 8,18" />
          <rect x="4" y="18.5" width="16" height="2.6" rx="1.2" />
        </svg>
      );
    }
    // standard cone on a base plate
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-6" fill="currentColor">
        <polygon points="12,4 17,18 7,18" />
        <rect x="3" y="18.5" width="18" height="2.6" rx="1.2" />
      </svg>
    );
  }
  if (type === 'ladder') {
    return (
      <span className="grid h-7 w-7 grid-rows-4 gap-0.5">
        {[0, 1, 2, 3].map((item) => (
          <span key={item} className="rounded-sm border border-current" />
        ))}
      </span>
    );
  }
  if (type === 'hoop') {
    return <span className="h-6 w-6 rounded-full border-2 border-current" />;
  }
  if (type === 'hurdle') {
    return (
      <span className="relative h-6 w-7">
        <span className="absolute left-1 top-1 h-4 w-px bg-current" />
        <span className="absolute right-1 top-1 h-4 w-px bg-current" />
        <span className="absolute left-1 right-1 top-1 h-0.5 bg-current" />
      </span>
    );
  }
  return <span className="h-7 w-1.5 rounded-full bg-current" />;
};

const EQUIPMENT_ITEMS: Array<{
  type: EquipmentType;
  variant?: EquipmentVariant;
  labelKey: string;
  shortcut: string;
}> = [
  { type: 'goal', labelKey: 'commands.toast.goal', shortcut: 'J' },
  { type: 'goal', variant: 'mini', labelKey: 'commands.toast.miniGoal', shortcut: 'Shift+J' },
  { type: 'mannequin', labelKey: 'commands.toast.mannequin', shortcut: 'M' },
  { type: 'cone', variant: 'flat', labelKey: 'commands.toast.discMarker', shortcut: 'Alt+K' },
  { type: 'cone', labelKey: 'commands.toast.cone', shortcut: 'K' },
  { type: 'cone', variant: 'tall', labelKey: 'topbar.tallCone', shortcut: '' },
  { type: 'pole', labelKey: 'commands.toast.pole', shortcut: 'Shift+K' },
  { type: 'ladder', labelKey: 'commands.toast.ladder', shortcut: 'Y' },
  { type: 'hoop', labelKey: 'commands.toast.hoop', shortcut: 'Q' },
  { type: 'hurdle', labelKey: 'commands.toast.hurdle', shortcut: 'U' },
];

const ARROW_ITEMS: Array<{ type: ArrowType; labelKey: string; shortcut: string }> = [
  { type: 'pass', labelKey: 'commands.add-pass-arrow', shortcut: 'A' },
  { type: 'run', labelKey: 'commands.add-run-arrow', shortcut: 'R' },
  { type: 'shoot', labelKey: 'commands.add-shoot-arrow', shortcut: 'S' },
  { type: 'dribble', labelKey: 'commands.add-dribble-arrow', shortcut: 'D' },
];

const ZONE_ITEMS: Array<{ shape: ZoneShape; labelKey: string; shortcut: string }> = [
  { shape: 'rect', labelKey: 'topbar.rectangleZone', shortcut: 'Z' },
  { shape: 'ellipse', labelKey: 'commands.add-ellipse-zone', shortcut: 'Shift+Z' },
  { shape: 'polygon', labelKey: 'topbar.polygonZone', shortcut: 'Alt+Z' },
];

const PitchBoardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="1" />
    <line x1="12" y1="5" x2="12" y2="19" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

const ToolMenuButton: React.FC<{
  dataTour?: string;
  title: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  onClick: () => void;
}> = ({ dataTour, title, icon, label, isOpen, onClick }) => (
  <button
    data-tour={dataTour}
    onClick={onClick}
    className={`
      flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-all duration-fast active:scale-95
      ${isOpen ? 'border-accent/80 bg-accent/10 text-text shadow-[0_0_0_1px_rgba(46,230,166,.25)]' : 'border-border bg-surface2 text-muted hover:border-accent/50 hover:text-text'}
    `}
    title={title}
  >
    {icon}
    <span className="hidden lg:inline">{label}</span>
  </button>
);

const MenuBackdrop: React.FC<{ onClose: () => void; interactive?: boolean }> = ({ onClose, interactive = true }) => (
  <div
    className={`fixed inset-0 z-40 ${interactive ? '' : 'pointer-events-none'}`}
    onClick={interactive ? onClose : undefined}
  />
);

const ToolMenuPanel: React.FC<{ widthClass?: string; dataTour?: string; children: React.ReactNode }> = ({ widthClass = 'w-[320px]', dataTour, children }) => (
  <div data-tour={dataTour} className={`absolute right-0 top-full z-50 mt-2 rounded-lg border border-border bg-surface p-2 shadow-lg ${widthClass}`}>
    {children}
  </div>
);

const ToolShortcut: React.FC<{ shortcut: string }> = ({ shortcut }) => (
  <span className="mt-0.5 inline-flex rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] font-semibold text-muted">
    {shortcut}
  </span>
);

const PlayersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M15.5 19a4.5 4.5 0 0 1 5.5-4.4" />
  </svg>
);

const TEAM_GLYPH_SHAPE: Record<Team, 'triangle' | 'circle' | 'square' | 'diamond'> = {
  home: 'triangle',
  away: 'circle',
  team3: 'square',
  team4: 'diamond',
};

const MiniPlayerGlyph: React.FC<{ team: Team }> = ({ team }) => {
  const color = (DEFAULT_TEAM_SETTINGS[team] ?? DEFAULT_TEAM_SETTINGS.home).primaryColor;
  const shape = TEAM_GLYPH_SHAPE[team];
  if (shape === 'circle') {
    return <svg viewBox="0 0 24 24" className="h-5 w-5"><circle cx="12" cy="12" r="9" fill={color} /></svg>;
  }
  if (shape === 'square') {
    return <svg viewBox="0 0 24 24" className="h-5 w-5"><rect x="3" y="3" width="18" height="18" rx="3" fill={color} /></svg>;
  }
  if (shape === 'diamond') {
    return <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M12 2l10 10-10 10L2 12z" fill={color} /></svg>;
  }
  return <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M12 3l9 17H3z" fill={color} /></svg>;
};

const PLAYER_ITEMS: Array<{ team: Team; labelKey: string; shortcut: string }> = [
  { team: 'home', labelKey: 'teamsPanel.team1', shortcut: 'P' },
  { team: 'away', labelKey: 'teamsPanel.team2', shortcut: 'Shift+P' },
  { team: 'team3', labelKey: 'teamsPanel.team3', shortcut: 'Alt+P' },
  { team: 'team4', labelKey: 'teamsPanel.team4', shortcut: 'Alt+Shift+P' },
];

const PlayersMenu: React.FC<{
  onAddPlayer?: (team: Team) => void;
  onOpenSquadSettings?: () => void;
  /** When set by the tutorial, force this dropdown open ('players') or closed. */
  tutorialMenu?: string | null;
}> = ({ onAddPlayer, onOpenSquadSettings, tutorialMenu }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  React.useEffect(() => { setIsOpen(tutorialMenu === 'players'); }, [tutorialMenu]);
  const { t } = useTranslation();
  const isTutorialOpen = tutorialMenu === 'players';

  if (!onAddPlayer) return null;

  return (
    <div className="relative">
      <ToolMenuButton
        dataTour="players"
        title={t('topbar.addPlayers')}
        icon={<PlayersIcon className="h-4 w-4" />}
        label={t('topbar.players')}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <>
          <MenuBackdrop onClose={() => setIsOpen(false)} interactive={!isTutorialOpen} />
          <ToolMenuPanel widthClass="w-[300px]" dataTour="players-menu">
            <div className="grid grid-cols-2 gap-1.5">
              {PLAYER_ITEMS.map((item) => (
                <button
                  key={item.team}
                  onClick={() => {
                    onAddPlayer(item.team);
                    setIsOpen(false);
                  }}
                  className="group flex min-h-[54px] items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface2"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface2 group-hover:bg-surface">
                    <MiniPlayerGlyph team={item.team} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-text">{t(item.labelKey)}</span>
                    <ToolShortcut shortcut={item.shortcut} />
                  </span>
                </button>
              ))}
            </div>

            {/* Squad bench CTA */}
            <div className="mt-2 pt-2 border-t border-border">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSquadSettings?.();
                }}
                className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent/10"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent group-hover:bg-accent/15">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="8" r="3" />
                    <path d="M3 20a6 6 0 0 1 12 0" />
                    <path d="M16 6a3 3 0 0 1 0 6" />
                    <path d="M20 20a6 6 0 0 0-4-5.6" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-accent">{t('topbar.presetSquad')}</span>
                  <span className="block text-[10px] text-muted">{t('topbar.squadHint')}</span>
                </span>
              </button>
            </div>
          </ToolMenuPanel>
        </>
      )}
    </div>
  );
};

const BoardGlyph: React.FC<{ id: string; className?: string }> = ({ id, className }) => {
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  switch (id) {
    case 'half-2d':
      return (
        <svg viewBox="0 0 36 28" className={className}>
          <rect x="3" y="2" width="30" height="24" rx="2" {...c} />
          <rect x="12" y="2" width="12" height="6" {...c} />
          <path d="M3 26 h30" {...c} />
          <path d="M12 26 a6 6 0 0 1 12 0" {...c} />
        </svg>
      );
    case 'penalty-2d':
      return (
        <svg viewBox="0 0 36 28" className={className}>
          <rect x="3" y="2" width="30" height="24" rx="2" {...c} />
          <rect x="7" y="2" width="22" height="14" {...c} />
          <rect x="13" y="2" width="10" height="6" {...c} />
          <path d="M15 16 a4 4 0 0 0 6 0" {...c} />
        </svg>
      );
    case 'full':
    default:
      return (
        <svg viewBox="0 0 36 28" className={className}>
          <rect x="2" y="3" width="32" height="22" rx="2" {...c} />
          <path d="M18 3 V25" {...c} />
          <circle cx="18" cy="14" r="4" {...c} />
          <rect x="2" y="8" width="5" height="12" {...c} />
          <rect x="29" y="8" width="5" height="12" {...c} />
        </svg>
      );
  }
};

const PitchMenu: React.FC<{
  onSelectBoard?: (board: PitchBoardPreset) => void;
  activeBoardId?: string;
  tutorialMenu?: string | null;
}> = ({ onSelectBoard, activeBoardId, tutorialMenu }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  React.useEffect(() => { setIsOpen(tutorialMenu === 'pitch'); }, [tutorialMenu]);
  const { t } = useTranslation();
  const isTutorialOpen = tutorialMenu === 'pitch';

  if (!onSelectBoard) return null;

  return (
    <div className="relative">
      <ToolMenuButton
        dataTour="pitch"
        title={t('topbar.pitchTitle')}
        icon={<PitchBoardIcon className="h-4 w-4" />}
        label={t('topbar.pitch')}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <>
          <MenuBackdrop onClose={() => setIsOpen(false)} interactive={!isTutorialOpen} />
          <ToolMenuPanel widthClass="w-[320px]" dataTour="pitch-menu">
            <div className="grid grid-cols-3 gap-1.5">
              {PITCH_BOARDS.map((board) => {
                const active = activeBoardId === board.id;
                return (
                  <button
                    key={board.id}
                    onClick={() => { onSelectBoard(board); setIsOpen(false); }}
                    className={`group relative flex flex-col items-center gap-1 rounded-md px-1.5 py-2 transition-colors ${
                      active ? 'bg-accent/15 ring-1 ring-accent text-text' : 'hover:bg-surface2 text-muted'
                    }`}
                  >
                    <span className="flex h-10 w-full items-center justify-center text-text/80">
                      <BoardGlyph id={board.id} className="h-7 w-9" />
                    </span>
                    <span className="block w-full truncate text-center text-[10px] font-medium text-text">{t(board.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </ToolMenuPanel>
        </>
      )}
    </div>
  );
};

const ArrowsMenu: React.FC<{
  onSelectArrowTool?: (type: ArrowType) => void;
  tutorialMenu?: string | null;
}> = ({ onSelectArrowTool, tutorialMenu }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  React.useEffect(() => { setIsOpen(tutorialMenu === 'arrows'); }, [tutorialMenu]);
  const { t } = useTranslation();
  const isTutorialOpen = tutorialMenu === 'arrows';

  if (!onSelectArrowTool) return null;

  return (
    <div className="relative">
      <ToolMenuButton
        dataTour="arrows"
        title={t('topbar.showArrows')}
        icon={<ArrowsIcon className="h-4 w-4" />}
        label={t('topbar.arrows')}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <>
          <MenuBackdrop onClose={() => setIsOpen(false)} interactive={!isTutorialOpen} />
          <ToolMenuPanel widthClass="w-[300px]" dataTour="arrows-menu">
            <div className="grid grid-cols-1 gap-1.5">
              {ARROW_ITEMS.map((item) => (
                <button
                  key={item.type}
                  onClick={() => {
                    onSelectArrowTool(item.type);
                    setIsOpen(false);
                  }}
                  className="group flex min-h-[58px] items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface2"
                >
                  <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent group-hover:bg-accent/15">
                    <MiniArrowGlyph type={item.type} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-text">{t(item.labelKey)}</span>
                    <ToolShortcut shortcut={item.shortcut} />
                  </span>
                </button>
              ))}
            </div>
          </ToolMenuPanel>
        </>
      )}
    </div>
  );
};

const ZonesMenu: React.FC<{
  onSelectZoneTool?: (shape: ZoneShape) => void;
}> = ({ onSelectZoneTool }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { t } = useTranslation();

  if (!onSelectZoneTool) return null;

  return (
    <div className="relative">
      <ToolMenuButton
        dataTour="zones"
        title={t('topbar.showZones')}
        icon={<ZonesIcon className="h-4 w-4" />}
        label={t('topbar.zones')}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <>
          <MenuBackdrop onClose={() => setIsOpen(false)} />
          <ToolMenuPanel widthClass="w-[280px]">
            <div className="grid grid-cols-1 gap-1.5">
              {ZONE_ITEMS.map((item) => (
                <button
                  key={item.shape}
                  onClick={() => {
                    onSelectZoneTool(item.shape);
                    setIsOpen(false);
                  }}
                  className="group flex min-h-[56px] items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface2"
                >
                  <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent group-hover:bg-accent/15">
                    <MiniZoneGlyph shape={item.shape} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-text">{t(item.labelKey)}</span>
                    <ToolShortcut shortcut={item.shortcut} />
                  </span>
                </button>
              ))}
            </div>
          </ToolMenuPanel>
        </>
      )}
    </div>
  );
};

const EquipmentMenu: React.FC<{
  onAddEquipment?: (type: EquipmentType, variant?: EquipmentVariant) => void;
  onAddBall?: (variant: 'single' | 'cluster') => void;
  tutorialMenu?: string | null;
}> = ({ onAddEquipment, onAddBall, tutorialMenu }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  React.useEffect(() => { setIsOpen(tutorialMenu === 'equipment'); }, [tutorialMenu]);
  const { t } = useTranslation();
  const isTutorialOpen = tutorialMenu === 'equipment';

  if (!onAddEquipment) return null;

  return (
    <div className="relative">
      <ToolMenuButton
        data-tour="equipment"
        title={t('topbar.showEquipment')}
        icon={<EquipmentIcon className="h-4 w-4" />}
        label={t('topbar.equipment')}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />

      {isOpen && (
        <>
          <MenuBackdrop onClose={() => setIsOpen(false)} interactive={!isTutorialOpen} />
          <ToolMenuPanel widthClass="w-[320px]" dataTour="equipment-menu">
            <div className="grid grid-cols-2 gap-1.5">
              {onAddBall && (
                <>
                  <button
                    key="ball-single"
                    onClick={() => {
                      onAddBall('single');
                      setIsOpen(false);
                    }}
                    className="group flex min-h-[54px] items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface2"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 group-hover:bg-accent/15">
                      <MiniBallGlyph />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-semibold text-text">{t('commands.toast.ball')}</span>
                      <ToolShortcut shortcut="B" />
                    </span>
                  </button>
                  <button
                    key="ball-cluster"
                    onClick={() => {
                      onAddBall('cluster');
                      setIsOpen(false);
                    }}
                    className="group flex min-h-[54px] items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface2"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 group-hover:bg-accent/15">
                      <MiniBallClusterGlyph />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-semibold text-text">{t('topbar.ballCluster')}</span>
                      <ToolShortcut shortcut="Shift+B" />
                    </span>
                  </button>
                </>
              )}
              {EQUIPMENT_ITEMS.map((item) => (
                <button
                  key={`${item.type}-${item.variant ?? 'standard'}`}
                  onClick={() => {
                    onAddEquipment(item.type, item.variant);
                    setIsOpen(false);
                  }}
                  className="group flex min-h-[54px] items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface2"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent group-hover:bg-accent/15">
                    <MiniEquipmentGlyph type={item.type} variant={item.variant} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-text">{t(item.labelKey)}</span>
                    {item.shortcut ? <ToolShortcut shortcut={item.shortcut} /> : null}
                  </span>
                </button>
              ))}
            </div>
          </ToolMenuPanel>
        </>
      )}
    </div>
  );
};

/** Pro feature star icon */
const ProStarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

/** ExportMenu - dropdown with all export format options */
const ExportMenu: React.FC<{
  onExport?: (format: ExportFormat) => void;
  plan?: PlanType;
  tutorialMenu?: string | null;
}> = ({ onExport, plan = 'free', tutorialMenu }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  React.useEffect(() => { setIsOpen(tutorialMenu === 'export'); }, [tutorialMenu]);
  const { t } = useTranslation();
  const isTutorialOpen = tutorialMenu === 'export';

  if (!onExport) return null;

  const isPro = plan === 'pro';

  const EXPPORT_ITEMS: Array<{
    format: ExportFormat;
    labelKey: string;
    shortcut: string;
    pro?: boolean;
  }> = [
    { format: 'png', labelKey: 'topbar.exportPngCurrent', shortcut: '⌘E' },
    { format: 'png-all', labelKey: 'topbar.exportPngAll', shortcut: '⇧⌘E' },
    { format: 'jpg', labelKey: 'topbar.exportJpgCurrent', shortcut: '' },
    { format: 'pdf', labelKey: 'topbar.exportPdfAll', shortcut: '⇧⌘P', pro: true },
    { format: 'gif', labelKey: 'topbar.exportGif', shortcut: '⇧⌘G', pro: true },
  ];

  return (
    <div className="relative">
      <ToolMenuButton
        dataTour="export"
        title={t('topbar.exportBoard')}
        icon={<ExportIcon className="h-4 w-4" />}
        label={t('topbar.export')}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <>
          <MenuBackdrop onClose={() => setIsOpen(false)} interactive={!isTutorialOpen} />
          <ToolMenuPanel widthClass="w-[280px]" dataTour="export-menu">
            <div className="grid grid-cols-1 gap-1.5">
              {EXPPORT_ITEMS.map((item) => {
                const isLocked = item.pro && !isPro;
                return (
                  <button
                    key={item.format}
                    onClick={() => {
                      if (!isLocked) {
                        onExport(item.format);
                        setIsOpen(false);
                      }
                    }}
                    disabled={isLocked}
                    className={`
                      group flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-left transition-colors
                      ${isLocked
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-surface2'
                      }
                    `}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent group-hover:bg-accent/15">
                      {item.format === 'png' || item.format === 'png-all' || item.format === 'jpg' ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      ) : item.format === 'pdf' ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="block truncate text-[12px] font-semibold text-text">{t(item.labelKey)}</span>
                        {item.pro && !isPro && (
                          <ProStarIcon className="h-3 w-3 text-accent shrink-0" />
                        )}
                      </span>
                      {item.shortcut && (
                        <ToolShortcut shortcut={item.shortcut} />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {!isPro && (
              <div className="mt-2 border-t border-border pt-2 px-1">
                <span className="text-[10px] text-muted block text-center">
                  {t('topbar.proMarked')}
                </span>
              </div>
            )}
          </ToolMenuPanel>
        </>
      )}
    </div>
  );
};

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
  dataTour?: string;
}> = ({ onClick, title, children, active, dataTour }) => (
  <button
    data-tour={dataTour}
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
  onOpenSettings?: () => void;
  onOpenSquadSettings?: () => void;
  onDevLogin?: (tier: 'guest' | 'free' | 'pro' | 'team') => void;
  /** DEV-ONLY: see onDevLogin / useAuthStore.devClearData */
  onClearDevData?: () => void;
}> = ({ initials, plan, onOpenAccount, onUpgrade, onLogout, onOpenSettings, onOpenSquadSettings, onDevLogin, onClearDevData }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { t } = useTranslation();

  // A2: Gość widzi tylko "Sign In", bez dropdownu z Wyloguj
  if (plan === 'guest') {
    return (
      <button
        onClick={onOpenAccount}
        className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {t('topbar.signIn')}
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        data-tour="premium"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-md hover:bg-surface2 transition-colors"
        title={t('topbar.account')}
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
          {plan === 'pro' ? t('topbar.planPro') : t('topbar.planFree')}
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
          <div className="absolute right-0 top-full mt-1 w-52 py-1 bg-surface border border-border rounded-lg shadow-lg z-50">
            {/* A3: Nowa struktura menu — 6 pozycji */}
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings?.();
              }}
              className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface2 transition-colors"
            >
              {t('topbar.accountEditorOptions')}
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAccount?.();
              }}
              className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface2 transition-colors"
            >
              {t('topbar.accountPitchSettings')}
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSquadSettings?.();
              }}
              className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface2 transition-colors"
            >
              {t('topbar.accountSquadSettings')}
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAccount?.();
              }}
              className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface2 transition-colors"
            >
              {t('topbar.accountYourProfile')}
            </button>

            {plan === 'free' && (
              <>
                <div className="h-px bg-border my-1" />
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onUpgrade?.();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-accent font-medium hover:bg-surface2 transition-colors flex items-center gap-2"
                >
                  <span>⭐</span> {t('topbar.upgradePro')}
                </button>
              </>
            )}
            
            {/* DEV-ONLY: quick plan switcher for testing */}
            {onDevLogin && (
              <>
                <div className="h-px bg-border my-1" />
                <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-yellow-500 font-semibold">
                  {t('topbar.devTestLogin')}
                </div>
                <div className="px-3 pb-1.5 flex gap-1.5">
                  {([
                    { tier: 'guest', label: t('topbar.devGuest') },
                    { tier: 'free', label: t('topbar.devFree') },
                    { tier: 'pro', label: t('topbar.devSolo') },
                    { tier: 'team', label: t('topbar.devTeam') },
                  ] as const).map(({ tier, label }) => (
                    <button
                      key={tier}
                      onClick={() => {
                        setIsOpen(false);
                        onDevLogin(tier);
                      }}
                      className={`flex-1 px-1 py-1 text-[10px] leading-tight rounded border transition-colors ${
                        (plan as string) === tier
                          ? 'border-accent text-accent'
                          : 'border-border text-muted hover:text-text hover:bg-surface2'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {onClearDevData && (
                  <div className="px-3 pb-1.5">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onClearDevData();
                      }}
                      className="w-full px-1 py-1 text-[10px] leading-tight rounded border border-dashed border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      {t('topbar.clearDevData')}
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="h-px bg-border my-1" />
            
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout?.();
              }}
              className="w-full px-3 py-2 text-left text-sm text-muted hover:text-text hover:bg-surface2 transition-colors"
            >
              {t('topbar.logOut')}
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
  tutorialMenu = null,
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
  onSelectBoard,
  activeBoardId,
  onOpenSquadSettings,
  onOpenProjects,
  onRename,
  onToggleInspector,
  onOpenAccount,
  onUpgrade,
  onLogout,
  onOpenSettings,
  onOpenSquadSettingsFromAccount,
  onDevLogin,
  onClearDevData,
}) => {
  const { t } = useTranslation();
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
    <header className="h-12 px-2 sm:px-4 flex items-center justify-between bg-surface border-b border-border z-topbar">
      {/* Left: Logo + Project */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0 max-w-[40%] sm:max-w-none">
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
        <div data-tour="projects" className="flex items-center gap-2 px-2 py-1 -mx-2">
          {/* Folder icon - click opens Projects drawer */}
          <button
            onClick={onOpenProjects}
            className="p-1 -m-1 rounded hover:bg-surface2 transition-colors group"
            title={t('topbar.openProjects')}
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
              placeholder={t('topbar.projectName')}
            />
          ) : (
            <button
              onClick={() => {
                setEditValue(projectName);
                setIsEditing(true);
              }}
              className="text-text text-sm font-medium truncate max-w-[200px] hover:text-accent transition-colors cursor-text"
              title={t('topbar.clickRename')}
            >
              {projectName}
            </button>
          )}
          
          {/* Save status indicator (PR-L5-MINI) */}
          {!isOnline ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
              {t('topbar.offline')}
            </span>
          ) : isSyncing ? (
            <div className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{t('topbar.saving')}</span>
            </div>
          ) : (
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                isSaved
                  ? 'bg-accent/10 text-accent'
                  : 'bg-orange-500/10 text-orange-500'
              }`}
            >
              {isSaved ? t('topbar.saved') : t('topbar.unsaved')}
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
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-auto overflow-visible">
        {/* Command Palette Trigger */}
        <button
          data-tour="shortcuts"
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

        <PlayersMenu onAddPlayer={onAddPlayer} onOpenSquadSettings={onOpenSquadSettings} tutorialMenu={tutorialMenu} />
        <ArrowsMenu onSelectArrowTool={onSelectArrowTool} tutorialMenu={tutorialMenu} />
        <ZonesMenu onSelectZoneTool={onSelectZoneTool} />
        <EquipmentMenu onAddEquipment={onAddEquipment} onAddBall={onAddBall} tutorialMenu={tutorialMenu} />
        <PitchMenu onSelectBoard={onSelectBoard} activeBoardId={activeBoardId} tutorialMenu={tutorialMenu} />

        {/* Export dropdown */}
        <ExportMenu onExport={onExport} plan={plan} tutorialMenu={tutorialMenu} />

        {/* Focus Mode */}
        <IconButton onClick={onToggleFocus} title={`${t('topbar.focusMode')} (F)`} active={focusMode}>
          <FocusIcon className="w-4 h-4" />
        </IconButton>

        {/* Theme Toggle */}
        <IconButton
          onClick={onToggleTheme}
          title={theme === 'light' ? t('topbar.themeToDark') : t('topbar.themeToLight')}
        >
          {theme === 'light' ? (
            <MoonIcon className="w-4 h-4" />
          ) : (
            <SunIcon className="w-4 h-4" />
          )}
        </IconButton>

        {/* Language */}
        <LanguageSwitcher />

        {/* Help */}
        <IconButton onClick={onOpenHelp} title={`${t('topbar.help')} (?)`} dataTour="help">
          <HelpIcon className="w-4 h-4" />
        </IconButton>

        {/* Inspector Toggle - only visible on <xl */}
        {onToggleInspector && (
          <button
            onClick={onToggleInspector}
            className="xl:hidden p-2 rounded-md transition-all duration-fast hover:bg-surface2 active:scale-95 text-muted hover:text-text"
            title={t('topbar.toggleInspector')}
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
          onOpenSettings={onOpenSettings}
          onOpenSquadSettings={onOpenSquadSettingsFromAccount}
          onDevLogin={onDevLogin}
          onClearDevData={onClearDevData}
        />
      </div>
    </header>
  );
};

export default TopBar;
