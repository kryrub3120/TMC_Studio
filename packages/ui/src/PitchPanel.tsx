/**
 * PitchPanel - Pitch appearance customization
 */

import type { PitchSettings, PitchTheme, PitchView, PitchLineSettings } from '@tmc/core';
import { PITCH_THEMES, DEFAULT_LINE_SETTINGS, PLAIN_PITCH_LINES } from '@tmc/core';

export interface PitchPanelProps {
  pitchSettings: PitchSettings;
  onUpdatePitch: (settings: Partial<PitchSettings>) => void;
}

/** View options with labels */
const VIEW_OPTIONS: { value: PitchView; label: string; desc: string }[] = [
  { value: 'full', label: 'Full Pitch', desc: 'Całe boisko' },
  { value: 'half-left', label: 'Half (Left)', desc: 'Lewa połowa' },
  { value: 'half-right', label: 'Half (Right)', desc: 'Prawa połowa' },
  { value: 'center', label: 'Center', desc: 'Środek boiska' },
  { value: 'attacking-third', label: 'Attack Third', desc: 'Tercja ataku' },
  { value: 'defensive-third', label: 'Defense Third', desc: 'Tercja obrony' },
  { value: 'penalty-area', label: 'Penalty Area', desc: 'Pole karne' },
  { value: 'plain', label: 'Plain Grass', desc: 'Tylko trawa' },
];

/** Line toggle options */
const LINE_OPTIONS: { key: keyof PitchLineSettings; label: string }[] = [
  { key: 'showOutline', label: 'Obwód' },
  { key: 'showCenterLine', label: 'Linia środkowa' },
  { key: 'showCenterCircle', label: 'Koło środkowe' },
  { key: 'showPenaltyAreas', label: 'Pola karne' },
  { key: 'showGoalAreas', label: 'Pola bramkowe' },
  { key: 'showCornerArcs', label: 'Łuki rożne' },
  { key: 'showPenaltySpots', label: 'Punkty karne' },
];

/** Theme button with preview */
function ThemeButton({
  theme,
  label,
  isActive,
  onClick,
}: {
  theme: PitchTheme;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const colors = PITCH_THEMES[theme];
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
        isActive 
          ? 'bg-accent/20 ring-2 ring-accent' 
          : 'bg-surface2 hover:bg-surface2/80'
      }`}
    >
      {/* Mini pitch preview */}
      <div 
        className="w-12 h-8 rounded-sm border border-white/20 relative overflow-hidden"
        style={{ backgroundColor: colors.primaryColor }}
      >
        {/* Stripes preview */}
        {colors.showStripes && (
          <>
            <div 
              className="absolute inset-y-0 left-0 w-1/4"
              style={{ backgroundColor: colors.stripeColor }}
            />
            <div 
              className="absolute inset-y-0 left-1/2 w-1/4"
              style={{ backgroundColor: colors.stripeColor }}
            />
          </>
        )}
        {/* Center line */}
        <div 
          className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2"
          style={{ backgroundColor: colors.lineColor }}
        />
        {/* Center circle */}
        <div 
          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 border"
          style={{ borderColor: colors.lineColor }}
        />
      </div>
      <span className="text-xs text-text">{label}</span>
    </button>
  );
}

/** Main PitchPanel component */
export function PitchPanel({ pitchSettings, onUpdatePitch }: PitchPanelProps) {
  const handleThemeSelect = (theme: PitchTheme) => {
    const themeColors = PITCH_THEMES[theme];
    onUpdatePitch({
      theme,
      ...themeColors,
    });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-xs text-muted uppercase tracking-wider">
        Pitch Appearance
      </div>

      {/* Theme presets */}
      <div className="space-y-2">
        <label className="block text-xs text-muted">Theme</label>
        <div className="grid grid-cols-4 gap-2">
          <ThemeButton
            theme="grass"
            label="Grass"
            isActive={pitchSettings.theme === 'grass'}
            onClick={() => handleThemeSelect('grass')}
          />
          <ThemeButton
            theme="indoor"
            label="Indoor"
            isActive={pitchSettings.theme === 'indoor'}
            onClick={() => handleThemeSelect('indoor')}
          />
          <ThemeButton
            theme="chalk"
            label="Chalk"
            isActive={pitchSettings.theme === 'chalk'}
            onClick={() => handleThemeSelect('chalk')}
          />
          <ThemeButton
            theme="futsal"
            label="Futsal"
            isActive={pitchSettings.theme === 'futsal'}
            onClick={() => handleThemeSelect('futsal')}
          />
        </div>
      </div>

      {/* Pitch View Selector */}
      <div className="space-y-2 pt-3 border-t border-border">
        <div className="text-xs text-muted">View</div>
        <select
          value={pitchSettings.view ?? 'full'}
          onChange={(e) => {
            const newView = e.target.value as PitchView;
            if (newView === 'plain') {
              onUpdatePitch({ view: newView, lines: PLAIN_PITCH_LINES });
            } else {
              onUpdatePitch({ view: newView });
            }
          }}
          className="w-full px-3 py-2 text-sm bg-surface2 border border-border rounded-lg text-text focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {VIEW_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Line Visibility Controls */}
      <div className="space-y-2 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted">Pitch Lines</div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onUpdatePitch({ lines: DEFAULT_LINE_SETTINGS, view: 'full' })}
              className="px-2 py-1 text-xs bg-surface2 hover:bg-surface2/80 text-text rounded transition-colors"
              title="Show all lines"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => onUpdatePitch({ lines: PLAIN_PITCH_LINES, view: 'plain' })}
              className="px-2 py-1 text-xs bg-surface2 hover:bg-surface2/80 text-text rounded transition-colors"
              title="Hide all lines"
            >
              None
            </button>
          </div>
        </div>
        
        {/* Individual line toggles */}
        <div className="grid grid-cols-2 gap-2">
          {LINE_OPTIONS.map((opt) => {
            const lines = pitchSettings.lines ?? DEFAULT_LINE_SETTINGS;
            const isChecked = lines[opt.key];
            return (
              <label
                key={opt.key}
                className="flex items-center gap-2 cursor-pointer text-sm text-text hover:text-accent transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const newLines = { ...lines, [opt.key]: !isChecked };
                    onUpdatePitch({ lines: newLines, view: 'full' });
                  }}
                  className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-xs">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Show stripes toggle */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-sm text-text">Show Stripes</span>
        <button
          type="button"
          onClick={() => onUpdatePitch({ showStripes: !pitchSettings.showStripes })}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            pitchSettings.showStripes ? 'bg-accent' : 'bg-surface2'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              pitchSettings.showStripes ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* Print Friendly Button */}
      <button
        type="button"
        onClick={() => onUpdatePitch({
          theme: 'custom',
          primaryColor: '#ffffff',
          stripeColor: '#f5f5f5',
          lineColor: '#000000',
          showStripes: false,
        })}
        className="w-full px-3 py-2.5 mt-2 flex items-center justify-center gap-2 bg-white text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Print Friendly
      </button>

      {/* Custom colors section */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="text-xs text-muted">Custom Colors</div>
        
        {/* Primary color */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={pitchSettings.primaryColor}
            onChange={(e) => onUpdatePitch({ primaryColor: e.target.value, theme: 'custom' })}
            className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
          />
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1">Field Color</label>
            <input
              type="text"
              value={pitchSettings.primaryColor.toUpperCase()}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                  onUpdatePitch({ primaryColor: val, theme: 'custom' });
                }
              }}
              className="w-full px-2 py-1 text-xs font-mono bg-surface2 border border-border rounded text-text focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Line color */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={pitchSettings.lineColor.startsWith('rgba') ? '#ffffff' : pitchSettings.lineColor}
            onChange={(e) => onUpdatePitch({ lineColor: e.target.value, theme: 'custom' })}
            className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
          />
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1">Line Color</label>
            <input
              type="text"
              value={pitchSettings.lineColor.startsWith('rgba') ? 'white' : pitchSettings.lineColor.toUpperCase()}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                  onUpdatePitch({ lineColor: val, theme: 'custom' });
                }
              }}
              className="w-full px-2 py-1 text-xs font-mono bg-surface2 border border-border rounded text-text focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      </div>

      {/* Orientation toggle */}
      <div className="space-y-2 pt-3 border-t border-border">
        <div className="text-xs text-muted">Orientation</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onUpdatePitch({ orientation: 'landscape' })}
            className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
              pitchSettings.orientation === 'landscape'
                ? 'bg-accent text-white'
                : 'bg-surface2 text-text hover:bg-surface2/80'
            }`}
          >
            ↔ Landscape
          </button>
          <button
            type="button"
            onClick={() => onUpdatePitch({ orientation: 'portrait' })}
            className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
              pitchSettings.orientation === 'portrait'
                ? 'bg-accent text-white'
                : 'bg-surface2 text-text hover:bg-surface2/80'
            }`}
          >
            ↕ Portrait
          </button>
        </div>
      </div>

      {/* Help text */}
      <div className="text-xs text-muted pt-2 border-t border-border">
        Choose a preset theme or customize individual colors.
      </div>
    </div>
  );
}
