/**
 * TeamsPanel - Team color customization panel
 */

import type { TeamSettings, TeamSetting } from '@tmc/core';

/** Color presets for quick selection */
const COLOR_PRESETS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ffffff', // white
  '#1f2937', // dark gray
];

export interface TeamsPanelProps {
  teamSettings: TeamSettings;
  onUpdateTeam: (team: 'home' | 'away', settings: Partial<TeamSetting>) => void;
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
  return (
    <div className="space-y-3">
      {/* Team header with color preview */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-full border-2 border-white/20"
          style={{ backgroundColor: settings.primaryColor }}
        />
        <span className="text-sm font-medium text-text">{team} Team</span>
      </div>

      {/* Name input */}
      <div>
        <label className="block text-xs text-muted mb-1">Name</label>
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
        <label className="block text-xs text-muted mb-1">Primary Color</label>
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
        <div className="grid grid-cols-9 gap-1">
          {COLOR_PRESETS.map((color) => (
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
        <label className="block text-xs text-muted mb-1">Goalkeeper Color</label>
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
        <div className="grid grid-cols-9 gap-1">
          {COLOR_PRESETS.map((color) => (
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

/** Main TeamsPanel component */
export function TeamsPanel({ teamSettings, onUpdateTeam }: TeamsPanelProps) {
  return (
    <div className="p-4 space-y-6">
      <div className="text-xs text-muted uppercase tracking-wider">
        Team Colors
      </div>

      {/* Home team section */}
      <TeamSection
        team="Home"
        settings={teamSettings.home}
        onUpdate={(settings) => onUpdateTeam('home', settings)}
      />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Away team section */}
      <TeamSection
        team="Away"
        settings={teamSettings.away}
        onUpdate={(settings) => onUpdateTeam('away', settings)}
      />

      {/* Help text */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted">
          Changes apply immediately to all players. Use Cmd+S to save.
        </p>
      </div>
    </div>
  );
}
