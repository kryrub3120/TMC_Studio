/**
 * SquadBench - Predefined player roster below the pitch
 * Pro/Club Premium feature — shows players with name + number + shape
 * Drag onto pitch to place, gear icon opens settings for editing
 *
 * Free: max 5 players total (rest locked)
 * Premium: max 25 per team
 *
 * Sprint 1 — Unifikacja typów, realne kolory z DEFAULT_TEAM_SETTINGS,
 * animacje, badge count per team, hover glow.
 */

import React, { useState } from 'react';
import type { Team, SquadPlayer, TeamSettings } from '@tmc/core';
import { DEFAULT_TEAM_SETTINGS } from '@tmc/core';
import { useTranslation } from './i18n.js';

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
  freeLimit = 5,
  premiumPerTeamLimit = 25,
  onToggle,
  onOpenSettings,
  onDragStart,
  teamSettings,
  onQuickAddPlayer,
  onRemovePlayer,
}) => {
  const { t } = useTranslation();
  const teams: Team[] = ['home', 'away', 'team3', 'team4'];
  const [activeTeam, setActiveTeam] = useState<Team>('home');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addNum, setAddNum] = useState('');
  const [addIsGoalkeeper, setAddIsGoalkeeper] = useState(false);
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
  const isEmpty = squad.length === 0;
  const maxPerTeam = canAccess ? premiumPerTeamLimit : freeLimit;
  const teamLimit = maxPerTeam;
  const visibleCount = teamPlayers.length;
  const remainingSlots = teamLimit - visibleCount;

  const cycleTeam = () => {
    const idx = teams.indexOf(activeTeam);
    setActiveTeam(teams[(idx + 1) % teams.length]);
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
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={cycleTeam}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface2 hover:bg-border text-text font-semibold transition-colors"
              title={t('squadBench.switchCurrent', { team: getTeamLabel(activeTeam) })}
              aria-label={t('squadBench.currentTeam', { team: getTeamLabel(activeTeam) })}
            >
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: getTeamColor(activeTeam) }} />
              <span className="text-sm">{getTeamLabel(activeTeam)}</span>
              <span className="text-[11px] text-muted font-mono">{visibleCount}/{teamLimit}{!canAccess ? ' ⭐' : ''}</span>
              <svg className="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {/* Team dots (vertical to keep the bar narrow) */}
            <div className="flex flex-col gap-1">
              {teams.map((team) => {
                const count = getTeamTotal(team);
                return (
                  <button
                    key={team}
                    onClick={() => setActiveTeam(team)}
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
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0 py-0.5">
            {teamPlayers.map((player, idx) => {
              const globalIdx = squad.indexOf(player);
              const isLocked = isPlayerLocked(globalIdx);
              return renderPlayer(player, isLocked, idx * 30);
            })}

            {isEmpty && teamPlayers.length === 0 && activeTeam === 'home' && (
              <>
                {onQuickAddPlayer ? (
                  <button
                    onClick={() => setShowAddForm(true)}
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
                    onClick={() => setShowAddForm(true)}
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
            className="p-1 rounded hover:bg-surface2 text-muted hover:text-text transition-colors"
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
          <p className="text-[11px] text-muted italic flex items-center gap-1">
            <span className="font-semibold not-italic uppercase tracking-wider text-[10px] text-muted">{t('squadBench.title')}</span>
            {isEmpty ? t('squadBench.collapsedSetup') : t('squadBench.collapsedCount', { count: squad.length })}
          </p>
          <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenSettings}
            className="p-1 rounded hover:bg-surface2 text-muted hover:text-text transition-colors"
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
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder={t('squadBench.namePlaceholder')}
              className="flex-1 px-2 py-1.5 text-xs bg-surface border border-border rounded-md text-text placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent"
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
