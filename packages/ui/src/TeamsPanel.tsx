/**
 * TeamsPanel - Team color customization panel
 */

import { useState } from 'react';
import type { TeamSettings, TeamSetting, Team } from '@tmc/core';
import { DEFAULT_TEAM_SETTINGS } from '@tmc/core';
import { SHARED_COLORS, TEAM_KIT_PRESETS } from './colors';
import { useTranslation } from './i18n.js';

export interface TeamsPanelProps {
  teamSettings: TeamSettings;
  onUpdateTeam: (team: Team, settings: Partial<TeamSetting>) => void;
}

function ColorField({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  testId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="w-9 h-9 rounded border border-border shadow-inner cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ backgroundColor: value }}
          aria-label={`${label}: ${value}`}
          aria-expanded={isOpen}
          data-testid={`${testId}-toggle`}
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(event) => {
            if (/^#[0-9A-Fa-f]{6}$/.test(event.target.value)) onChange(event.target.value);
          }}
          className="min-w-0 flex-1 px-2 py-2 text-xs font-mono bg-surface2 border border-border rounded text-text focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label={`${label} HEX`}
        />
        <label className="relative w-9 h-9 rounded border border-border bg-surface2 cursor-pointer overflow-hidden" title={label}>
          <span className="absolute inset-0 flex items-center justify-center text-sm text-muted">+</span>
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={`${label} picker`}
          />
        </label>
      </div>

      {isOpen && (
        <div className="mt-2 grid grid-cols-8 gap-1.5 p-2 bg-surface2 border border-border rounded" data-testid={`${testId}-palette`}>
          {SHARED_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onChange(color);
                setIsOpen(false);
              }}
              className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
                value.toLowerCase() === color.toLowerCase()
                  ? 'border-accent ring-1 ring-accent'
                  : 'border-white/20'
              }`}
              style={{ backgroundColor: color }}
              title={color}
              aria-label={`${label} ${color}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Team color section component */
function TeamSection({
  teamKey,
  team,
  settings,
  onUpdate,
}: {
  teamKey: Team;
  team: string;
  settings: TeamSetting;
  onUpdate: (settings: Partial<TeamSetting>) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      {/* Team header with color preview */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-full border-2 border-white/20"
          style={{ backgroundColor: settings.primaryColor }}
        />
        <span className="text-sm font-medium text-text">{t('teamsPanel.teamSuffix', { team })}</span>
      </div>

      {/* Kit presets */}
      <div>
        <label className="block text-xs text-muted mb-1">{t('teamsPanel.kitPresets')}</label>
        <div className="flex flex-wrap gap-2">
          {TEAM_KIT_PRESETS.map((kit) => (
            <button
              key={kit.id}
              type="button"
              onClick={() =>
                onUpdate({
                  primaryColor: kit.primaryColor,
                  secondaryColor: kit.secondaryColor,
                  goalkeeperColor: kit.goalkeeperColor,
                })
              }
              title={t(kit.labelKey)}
              className="flex rounded overflow-hidden border border-white/20 hover:scale-110 transition-transform"
            >
              <span className="w-3 h-5" style={{ backgroundColor: kit.primaryColor }} />
              <span className="w-3 h-5" style={{ backgroundColor: kit.secondaryColor }} />
              <span className="w-3 h-5" style={{ backgroundColor: kit.goalkeeperColor }} />
            </button>
          ))}
        </div>
      </div>

      {/* Name input */}
      <div>
        <label className="block text-xs text-muted mb-1">{t('teamsPanel.name')}</label>
        <input
          type="text"
          value={settings.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full px-2 py-1.5 text-sm bg-surface2 border border-border rounded text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder={team}
          data-testid={`team-${teamKey}-name`}
        />
      </div>

      <ColorField
        label={t('teamsPanel.primaryColor')}
        value={settings.primaryColor}
        onChange={(primaryColor) => onUpdate({ primaryColor })}
        testId={`team-${teamKey}-primary`}
      />
      <ColorField
        label={t('teamsPanel.secondaryColor')}
        value={settings.secondaryColor ?? '#ffffff'}
        onChange={(secondaryColor) => onUpdate({ secondaryColor })}
        testId={`team-${teamKey}-secondary`}
      />
      <ColorField
        label={t('teamsPanel.goalkeeperColor')}
        value={settings.goalkeeperColor ?? '#fbbf24'}
        onChange={(goalkeeperColor) => onUpdate({ goalkeeperColor })}
        testId={`team-${teamKey}-goalkeeper`}
      />
    </div>
  );
}

/** Teams shown in the panel (home/away kept for back-compat = Team 1/Team 2) */
const TEAM_ORDER: Array<{ key: Team; label: string }> = [
  { key: 'home', label: 'teamsPanel.team1' },
  { key: 'away', label: 'teamsPanel.team2' },
  { key: 'team3', label: 'teamsPanel.team3' },
  { key: 'team4', label: 'teamsPanel.team4' },
];

/** Main TeamsPanel component */
export function TeamsPanel({ teamSettings, onUpdateTeam }: TeamsPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 sm:p-4">
      <div className="text-xs text-muted uppercase tracking-wider">
        {t('teamsPanel.title')}
      </div>

      {TEAM_ORDER.map(({ key, label }, idx) => {
        const settings = teamSettings[key] ?? DEFAULT_TEAM_SETTINGS[key] ?? DEFAULT_TEAM_SETTINGS.home;
        return (
          <div key={key} className="space-y-6">
            {idx > 0 && <div className="border-t border-border" />}
            <TeamSection
              teamKey={key}
              team={t(label)}
              settings={settings}
              onUpdate={(patch) => onUpdateTeam(key, patch)}
            />
          </div>
        );
      })}

      {/* Help text */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted">
          {t('teamsPanel.help')}
        </p>
      </div>
    </div>
  );
}
