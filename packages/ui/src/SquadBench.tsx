/**
 * SquadBench - Predefined player roster below the pitch
 * Pro/Club Premium feature — shows players with name + number + shape
 * Drag onto pitch to place, gear icon opens settings for editing
 *
 * Free: max 5 players total (rest locked)
 * Premium: max 35 per team
 *
 * Sprint 1 — Unifikacja typów, realne kolory z DEFAULT_TEAM_SETTINGS,
 * animacje, badge count per team, hover glow.
 */

import React, { useRef, useState } from 'react';
import type { Team, SquadPlayer, TeamSettings, LineupPreset } from '@tmc/core';
import { DEFAULT_TEAM_SETTINGS, FREE_SQUAD_LIMIT, PREMIUM_SQUAD_PER_TEAM_LIMIT } from '@tmc/core';
import { useTranslation } from './i18n.js';
import { scrollHorizontalStrip } from './horizontalWheel.js';
import { formatOptionShortcut } from './keyboardPlatform.js';

export type { SquadPlayer } from '@tmc/core';

export interface SquadBenchProps {
  squad: SquadPlayer[];
  visible: boolean;
  canAccess: boolean;
  /** Total squad limit for free tier */
  freeLimit?: number;
  /** Per-team limit for premium */
  premiumPerTeamLimit?: number;
  onToggle: () => void;
  onOpenSettings: () => void;
  onDragStart: (player: SquadPlayer) => void;
  teamSettings?: TeamSettings;
  /** Quick-add a player to squad without opening Settings */
  onQuickAddPlayer?: (name: string, number: number, team: Team, isGoalkeeper?: boolean) => void;
  /** Remove a player from squad */
  onRemovePlayer?: (id: string) => void;
  lineupPresets?: Array<LineupPreset | null>;
  onApplyLineupPreset?: (slot: number) => void;
  onEditLineupPreset?: (slot: number) => void;
}

const TEAM_LABEL_KEYS: Record<Team, string> = {
  home: 'squadBench.home',
  away: 'squadBench.away',
  team3: 'squadBench.team3',
  team4: 'squadBench.team4',
};

/** Mini player circle — matches canvas player visualization (circle + number + team color) */
const PlayerCircleGlyph: React.FC<{
  team: Team;
  number: number;
  color: string;
  locked?: boolean;
}> = ({ number, color, locked }) => {
  const size = 28;
  const numSize = number > 99 ? 9 : 11;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`shrink-0 ${locked ? 'opacity-40' : ''}`}
    >
      {/* Circle body — jak na boisku */}
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill={color} />
      {/* Numer — biały, wyśrodkowany */}
      <text
        x={size / 2}
        y={size / 2 + numSize / 3}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={numSize}
        fontWeight="bold"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {number}
      </text>
    </svg>
  );
};

/** Empty slot placeholder with + icon */
const EmptySlot: React.FC<{ onClick: () => void; delay?: number }> = ({ onClick, delay = 0 }) => {
  const { t } = useTranslation();
  return (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md border border-dashed border-border 
               hover:border-accent/50 hover:bg-surface2/50 transition-all duration-fast min-w-0 shrink-0
               animate-fade-in"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    title={t('squadBench.addPlayer')}
    aria-label={t('squadBench.addSquadPlayer')}
  >
    <svg className="w-5 h-5 text-muted/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
    <span className="text-[8px] text-muted">{t('squadBench.empty')}</span>
  </button>
  );
};

/** Locked player slot */
const LockedSlot: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const { t } = useTranslation();
  return (
  <div
    className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md border border-border/50 bg-surface2/30 opacity-50 min-w-0 shrink-0 cursor-not-allowed animate-fade-in"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    title={t('squadBench.upgradeSlots')}
  >
    <svg className="w-4 h-4 text-yellow-500/60" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  </div>
  );
};

export const SquadBench: React.FC<SquadBenchProps> = ({
  squad,
  visible,
  canAccess,
  freeLimit = FREE_SQUAD_LIMIT,
  premiumPerTeamLimit = PREMIUM_SQUAD_PER_TEAM_LIMIT,
  onToggle,
  onOpenSettings,
  onDragStart,
  teamSettings,
  onQuickAddPlayer,
  onRemovePlayer,
  lineupPresets = [],
  onApplyLineupPreset,
  onEditLineupPreset,
}) => {
  const { t } = useTranslation();
  const teams: Team[] = ['home', 'away', 'team3', 'team4'];
  const [activeTeam, setActiveTeam] = useState<Team>('home');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addNum, setAddNum] = useState('');
  const [addIsGoalkeeper, setAddIsGoalkeeper] = useState(false);
  const [showTeamMenu, setShowTeamMenu] = useState(false);
  const [selectedLineupSlot, setSelectedLineupSlot] = useState<number | null>(null);
  const [showLineupActions, setShowLineupActions] = useState(false);
  const lastTeamWheelAt = useRef(0);
  React.useEffect(() => {
    if (!showTeamMenu) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowTeamMenu(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showTeamMenu]);
  const getTeamSetting = (team: Team) =>
    teamSettings?.[team] ?? DEFAULT_TEAM_SETTINGS[team] ?? DEFAULT_TEAM_SETTINGS.home;
  const getTeamLabel = (team: Team) => {
    const name = getTeamSetting(team).name?.trim();
    return name || t(TEAM_LABEL_KEYS[team]);
  };
  const getTeamColor = (team: Team) => getTeamSetting(team).primaryColor;
  const getPlayerColor = (player: SquadPlayer) =>
    player.isGoalkeeper
      ? getTeamSetting(player.team).goalkeeperColor ?? DEFAULT_TEAM_SETTINGS[player.team]?.goalkeeperColor ?? getTeamColor(player.team)
      : getTeamColor(player.team);
  
  const teamPlayers = squad.filter((p) => p.team === activeTeam);
  const activeTeamLineups = lineupPresets
    .map((preset, slot) => ({ preset, slot }))
    .filter((entry): entry is { preset: LineupPreset; slot: number } => entry.preset !== null && entry.preset.team === activeTeam);
  const selectedLineup = selectedLineupSlot === null ? null : lineupPresets[selectedLineupSlot] ?? null;
  const isEmpty = squad.length === 0;
  const maxPerTeam = canAccess ? premiumPerTeamLimit : freeLimit;
  const teamLimit = maxPerTeam;
  const visibleCount = teamPlayers.length;
  const remainingSlots = teamLimit - visibleCount;

  const cycleTeam = (direction = 1) => {
    const idx = teams.indexOf(activeTeam);
    setActiveTeam(teams[(idx + direction + teams.length) % teams.length]);
    setSelectedLineupSlot(null);
    setShowLineupActions(false);
  };

  const applyLineup = (slot: number) => {
    onApplyLineupPreset?.(slot);
    setSelectedLineupSlot(slot);
    setShowLineupActions(false);
  };

  const handleTeamWheel = (event: React.WheelEvent<HTMLElement>) => {
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (delta === 0) return;
    event.preventDefault();
    const now = Date.now();
    if (now - lastTeamWheelAt.current < 180) return;
    lastTeamWheelAt.current = now;
    cycleTeam(delta > 0 ? 1 : -1);
  };

  const handleQuickAdd = () => {
    const name = addName.trim();
    const num = parseInt(addNum, 10);
    if (name && num > 0 && onQuickAddPlayer) {
      onQuickAddPlayer(name, num, activeTeam, addIsGoalkeeper || num === 1);
      setAddName('');
      setAddNum('');
      setAddIsGoalkeeper(false);
      setShowAddForm(false);
    }
  };

  const openQuickAdd = () => {
    if (!visible) onToggle();
    setShowAddForm(true);
  };

  const getTeamTotal = (team: Team) => squad.filter((p) => p.team === team).length;

  /** Check if this player index (across all teams) falls within the free limit */
  const isPlayerLocked = (globalIndex: number): boolean => {
    if (canAccess) return false;
    return globalIndex >= freeLimit;
  };

  const renderPlayer = (player: SquadPlayer, isLocked: boolean, delay: number) => {
    const color = getPlayerColor(player);
    const teamLabel = getTeamLabel(player.team);
    return (
      <div
        key={player.id}
        className="group relative"
      >
        <button
          draggable={!isLocked}
          onDragStart={(e) => {
            if (isLocked) return;
            e.dataTransfer.setData('text/plain', JSON.stringify(player));
            onDragStart(player);
          }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md bg-surface2 border border-border 
                     transition-all duration-fast 
                     text-xs text-text min-w-0 shrink-0 animate-fade-in
                     ${isLocked
                       ? 'opacity-50 cursor-not-allowed'
                       : 'cursor-grab active:cursor-grabbing hover:border-accent hover:shadow-[0_0_10px_rgba(46,230,166,0.25)] active:scale-[0.97]'
                     }`}
          style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
          title={isLocked ? t('squadBench.unlockSlots') : t('squadBench.dragToPitch', { name: player.name, number: player.number })}
          aria-label={t('squadBench.playerAria', { name: player.name, number: player.number, team: teamLabel, locked: isLocked ? t('squadBench.locked') : '' })}
        >
          <div className="relative">
            <PlayerCircleGlyph team={player.team} number={player.number} color={color} locked={isLocked} />
            {player.isGoalkeeper && !isLocked && (
              <span className="absolute -bottom-0.5 -right-1 rounded bg-surface px-1 text-[7px] font-bold text-text border border-border">
                GK
              </span>
            )}
            {isLocked && (
              <svg className="absolute -top-0.5 -right-0.5 w-3 h-3 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </div>
          <span className="truncate max-w-[85px] text-[10px] leading-tight text-center">
            {player.name}
          </span>
        </button>
        {/* Delete button — visible on hover */}
        {!isLocked && onRemovePlayer && (
          <button
            onClick={() => onRemovePlayer(player.id)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white 
                       flex items-center justify-center opacity-0 group-hover:opacity-100 
                       transition-opacity duration-fast shadow-md hover:bg-red-600 z-10"
            title={t('squadBench.remove', { name: player.name })}
            aria-label={t('squadBench.removeAria', { name: player.name })}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="px-3 py-1.5 bg-surface" data-testid="squad-bench" data-tour="squad">
      {visible ? (
        <div className="flex items-stretch gap-3">
          {/* Team switcher — prominent, on the left of the players */}
          <div className="relative flex items-center gap-2 shrink-0" onWheel={handleTeamWheel} data-testid="squad-team-switcher">
            <div className="flex w-52 flex-col gap-1 rounded-md bg-surface2 p-1">
              <button
                onClick={() => setShowTeamMenu((open) => !open)}
                className="flex min-w-0 items-center gap-2 rounded px-2 py-1 text-text font-semibold transition-colors hover:bg-border"
                title={t('squadBench.switchCurrent', { team: getTeamLabel(activeTeam) })}
                aria-label={t('squadBench.currentTeam', { team: getTeamLabel(activeTeam) })}
              >
                <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: getTeamColor(activeTeam) }} />
                <span className="min-w-0 flex-1 truncate text-left text-sm">{getTeamLabel(activeTeam)}</span>
                <span className="shrink-0 font-mono text-[11px] text-muted">{visibleCount}/{teamLimit}{!canAccess ? ' ⭐' : ''}</span>
                <svg className="h-3.5 w-3.5 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div className="relative flex min-w-0 gap-1">
                <select
                  value={selectedLineupSlot ?? ''}
                  onChange={(event) => {
                    if (!event.target.value) return;
                    applyLineup(Number(event.target.value));
                  }}
                  onWheel={(event) => event.stopPropagation()}
                  disabled={activeTeamLineups.length === 0}
                  className="h-7 min-w-0 flex-1 rounded border border-border bg-surface px-2 text-[11px] text-text outline-none hover:border-accent/60 focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t('squadBench.chooseTacticalLineup')}
                  data-testid="squad-lineup-select"
                >
                  <option value="">{activeTeamLineups.length ? t('squadBench.chooseTacticalLineup') : t('squadBench.noTacticalLineups')}</option>
                  {activeTeamLineups.map(({ preset, slot }) => {
                    const shortcut = preset.shortcut === undefined && slot < 9 ? slot + 1 : preset.shortcut;
                    return <option key={`${slot}-${preset.name}`} value={slot}>{preset.name}{shortcut ? ` · ${formatOptionShortcut(shortcut)}` : ''}</option>;
                  })}
                </select>
                <button
                  type="button"
                  disabled={!selectedLineup}
                  onClick={() => setShowLineupActions((open) => !open)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-surface text-muted hover:border-accent/60 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                  title={t('squadBench.editSelectedLineup')}
                  aria-label={t('squadBench.editSelectedLineup')}
                  data-testid="squad-lineup-edit"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </button>
                {showLineupActions && selectedLineup && selectedLineupSlot !== null && (
                  <div className="absolute bottom-full left-0 z-40 mb-2 w-full min-w-0 rounded-md border border-border bg-surface p-2 shadow-xl" data-testid="squad-lineup-actions">
                    <div className="border-b border-border px-2 pb-2">
                      <p className="truncate text-sm font-semibold text-text">{selectedLineup.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted">{getTeamLabel(selectedLineup.team)}{selectedLineup.shortcut ? ` · ${formatOptionShortcut(selectedLineup.shortcut)}` : ''}</p>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                      <button type="button" onClick={() => applyLineup(selectedLineupSlot)} className="rounded border border-border px-2 py-2 text-xs font-medium text-text hover:border-accent">{t('squadBench.applySelectedLineup')}</button>
                      <button type="button" onClick={() => { setShowLineupActions(false); onEditLineupPreset?.(selectedLineupSlot); }} className="rounded bg-accent px-2 py-2 text-xs font-semibold text-[#062016] hover:bg-accent-hover">{t('squadBench.editOnPitch')}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {showTeamMenu && (
                <div className="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-md border border-border bg-surface p-2 shadow-xl" data-testid="squad-team-menu">
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase text-muted">{t('squadBench.teams')}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {teams.map((team) => (
                      <button key={team} type="button" onClick={() => { setActiveTeam(team); setSelectedLineupSlot(null); setShowLineupActions(false); setShowTeamMenu(false); }} className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs ${team === activeTeam ? 'bg-accent/10 text-accent' : 'text-text hover:bg-surface2'}`}>
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getTeamColor(team) }} />
                        <span className="truncate">{getTeamLabel(team)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="my-2 h-px bg-border" />
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase text-muted">{t('squadBench.tacticalLineups')}</p>
                  {activeTeamLineups.length ? activeTeamLineups.map(({ preset, slot }) => {
                    const shortcut = preset.shortcut === undefined && slot < 9 ? slot + 1 : preset.shortcut;
                    return (
                      <button key={`${slot}-${preset.name}`} type="button" onClick={() => { applyLineup(slot); setShowTeamMenu(false); }} className="flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-left text-xs text-text hover:bg-surface2">
                        <span className="truncate font-medium">{preset.name}</span>
                        {shortcut && <kbd className="shrink-0 rounded border border-border px-1 py-0.5 text-[9px] text-muted">{formatOptionShortcut(shortcut)}</kbd>}
                      </button>
                    );
                  }) : <p className="px-2 py-2 text-xs text-muted">{t('squadBench.noTacticalLineups')}</p>}
                </div>
            )}
            {/* Team dots (vertical to keep the bar narrow) */}
            <div className="flex flex-col gap-1">
              {teams.map((team) => {
                const count = getTeamTotal(team);
                return (
                  <button
                    key={team}
                    onClick={() => { setActiveTeam(team); setSelectedLineupSlot(null); setShowLineupActions(false); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      team === activeTeam ? 'ring-1 ring-accent scale-110' : 'opacity-40 hover:opacity-70'
                    }`}
                    style={{ backgroundColor: getTeamColor(team) }}
                    title={t('squadBench.teamCount', { team: getTeamLabel(team), count })}
                    aria-label={t('squadBench.switchToTeam', { team: getTeamLabel(team), count })}
                  />
                );
              })}
            </div>
          </div>

          {/* Players — single horizontal scrolling row */}
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0 py-0.5" onWheel={scrollHorizontalStrip} data-testid="squad-player-strip">
            {teamPlayers.map((player, idx) => {
              const globalIdx = squad.indexOf(player);
              const isLocked = isPlayerLocked(globalIdx);
              return renderPlayer(player, isLocked, idx * 30);
            })}

            {isEmpty && teamPlayers.length === 0 && activeTeam === 'home' && (
              <>
                {onQuickAddPlayer ? (
                  <button
                    onClick={openQuickAdd}
                    className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md border border-dashed border-accent/50 bg-accent/5 hover:bg-accent/10 hover:border-accent transition-all duration-fast min-w-0 shrink-0 animate-fade-in"
                    title={t('squadBench.addFirstPlayer')}
                    aria-label={t('squadBench.addFirstPlayer')}
                  >
                    <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="text-[8px] text-accent/80">{t('squadBench.add')}</span>
                  </button>
                ) : (
                  <EmptySlot onClick={onOpenSettings} />
                )}
              </>
            )}

            {!isEmpty && remainingSlots > 0 && Array.from({ length: Math.min(remainingSlots, 3) }).map((_, i) => {
              const absIdx = squad.length + i;
              const locked = isPlayerLocked(absIdx);
              if (locked) return <LockedSlot key={`locked-${i}`} delay={i * 30} />;
              if (onQuickAddPlayer) {
                return (
                  <button
                    key={`add-${i}`}
                    onClick={openQuickAdd}
                    className="flex items-center justify-center w-8 h-8 rounded-md border border-dashed border-border hover:border-accent/50 hover:bg-surface2/50 transition-all duration-fast shrink-0 animate-fade-in"
                    style={{ animationDelay: `${(teamPlayers.length + i) * 30}ms`, animationFillMode: 'backwards' }}
                    title={t('squadBench.addPlayer')}
                    aria-label={t('squadBench.addPlayer')}
                  >
                    <svg className="w-4 h-4 text-muted/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                );
              }
              return <EmptySlot key={`empty-${i}`} onClick={onOpenSettings} delay={(teamPlayers.length + i) * 30} />;
            })}
          </div>

          {/* Right cluster — title + actions */}
          <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenSettings}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface2 text-muted hover:border-accent/50 hover:text-text transition-colors"
            title={t('squadBench.editor')}
            aria-label={t('squadBench.editRoster')}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-surface2 text-muted hover:text-text transition-colors"
            title={visible ? t('squadBench.hide') : t('squadBench.show')}
            aria-label={visible ? t('squadBench.hide') : t('squadBench.show')}
          >
            {visible ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
          </div>
        </div>
      ) : (
        /* Collapsed — thin hint row + actions */
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted">
            <span className="font-semibold not-italic uppercase tracking-wider text-[10px] text-muted">{t('squadBench.title')}</span>
            <span className="truncate">{isEmpty ? t('squadBench.collapsedSetup') : t('squadBench.collapsedCount', { count: squad.length })}</span>
            {isEmpty && onQuickAddPlayer && (
              <button
                type="button"
                onClick={openQuickAdd}
                className="shrink-0 rounded-md bg-accent px-2.5 py-1.5 font-medium text-[#062016] hover:bg-accent-hover transition-colors"
              >
                {t('squadBench.addFirstPlayer')}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenSettings}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface2 text-muted hover:border-accent/50 hover:text-text transition-colors"
            title={t('squadBench.editor')}
            aria-label={t('squadBench.editRoster')}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-surface2 text-muted hover:text-text transition-colors"
            title={visible ? t('squadBench.hide') : t('squadBench.show')}
            aria-label={visible ? t('squadBench.hide') : t('squadBench.show')}
          >
            {visible ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
          </div>
        </div>
      )}

      {/* Quick-add form (shared) */}
      {visible && showAddForm && onQuickAddPlayer && (
        <div className="mt-2 p-2 rounded-lg border border-accent/30 bg-accent/5 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder={t('squadBench.namePlaceholder')}
              className="min-w-[140px] flex-1 px-2 py-1.5 text-xs bg-surface border border-border rounded-md text-text placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(); if (e.key === 'Escape') setShowAddForm(false); }}
            />
            <input
              type="number"
              value={addNum}
              onChange={(e) => setAddNum(e.target.value)}
              placeholder={t('squadBench.numberPlaceholder')}
              min={1}
              max={99}
              className="w-14 px-2 py-1.5 text-xs bg-surface border border-border rounded-md text-text placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent"
              onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(); if (e.key === 'Escape') setShowAddForm(false); }}
            />
            <label className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-border bg-surface2 text-xs text-text cursor-pointer">
              <input
                type="checkbox"
                checked={addIsGoalkeeper}
                onChange={(e) => setAddIsGoalkeeper(e.target.checked)}
                className="accent-current"
              />
              GK
            </label>
            <button
              onClick={handleQuickAdd}
              disabled={!addName.trim() || !addNum}
              className="px-2.5 py-1.5 text-xs font-medium bg-accent text-white rounded-md hover:bg-accent-hover disabled:opacity-40 transition-colors"
            >
              {t('squadBench.addPlayer')}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-2 py-1.5 text-xs text-muted hover:text-text transition-colors"
            >
              {t('squadBench.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SquadBench;
