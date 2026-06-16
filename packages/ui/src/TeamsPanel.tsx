/**
 * TeamsPanel - Team color customization panel
 */

import type { TeamSettings, TeamSetting, Team } from '@tmc/core';
import { DEFAULT_TEAM_SETTINGS } from '@tmc/core';
import { SHARED_COLORS, TEAM_KIT_PRESETS } from './colors';
import { useTranslation } from './i18n.js';

export interface TeamsPanelProps {
  teamSettings: TeamSettings;
  onUpdateTeam: (team: Team, settings: Partial<TeamSetting>) => void;
}

/** Team color section component */
function TeamSection({
  team,
  settings,
  onUpdate,
}: {
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
        />
      </div>

      {/* Primary Color picker */}
      <div>
        <label className="block text-xs text-muted mb-1">{t('teamsPanel.primaryColor')}</label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="color"
            value={settings.primaryColor}
            onChange={(e) => onUpdate({ primaryColor: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
          />
          <input
            type="text"
            value={settings.primaryColor.toUpperCase()}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                onUpdate({ primaryColor: val });
              }
            }}
            className="flex-1 px-2 py-1.5 text-xs font-mono bg-surface2 border border-border rounded text-text focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="#FFFFFF"
          />
        </div>

        {/* Color presets grid */}
        <div className="grid grid-cols-8 gap-1">
          {SHARED_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onUpdate({ primaryColor: color })}
              className={`w-5 h-5 rounded border-2 transition-transform hover:scale-110 ${
                settings.primaryColor.toLowerCase() === color.toLowerCase()
                  ? 'border-accent ring-1 ring-accent'
                  : 'border-white/20'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
      
      {/* Goalkeeper Color picker */}
      <div>
        <label className="block text-xs text-muted mb-1">{t('teamsPanel.goalkeeperColor')}</label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="color"
            value={settings.goalkeeperColor ?? '#fbbf24'}
            onChange={(e) => onUpdate({ goalkeeperColor: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
          />
          <input
            type="text"
            value={(settings.goalkeeperColor ?? '#fbbf24').toUpperCase()}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                onUpdate({ goalkeeperColor: val });
              }
            }}
            className="flex-1 px-2 py-1.5 text-xs font-mono bg-surface2 border border-border rounded text-text focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="#FBBF24"
          />
        </div>

        {/* GK Color presets grid */}
        <div className="grid grid-cols-8 gap-1">
          {SHARED_COLORS.map((color) => (
            <button
              key={`gk-${color}`}
              type="button"
              onClick={() => onUpdate({ goalkeeperColor: color })}
              className={`w-5 h-5 rounded border-2 transition-transform hover:scale-110 ${
                (settings.goalkeeperColor ?? '#fbbf24').toLowerCase() === color.toLowerCase()
                  ? 'border-accent ring-1 ring-accent'
                  : 'border-white/20'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
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
    <div className="p-4 space-y-6">
      <div className="text-xs text-muted uppercase tracking-wider">
        {t('teamsPanel.title')}
      </div>

      {TEAM_ORDER.map(({ key, label }, idx) => {
        const settings = teamSettings[key] ?? DEFAULT_TEAM_SETTINGS[key] ?? DEFAULT_TEAM_SETTINGS.home;
        return (
          <div key={key} className="space-y-6">
            {idx > 0 && <div className="border-t border-border" />}
            <TeamSection
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
