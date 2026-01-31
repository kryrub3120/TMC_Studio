/**
 * PitchPanel - Pitch appearance customization
 */

import type { PitchSettings, PitchTheme } from '@tmc/core';
import { PITCH_THEMES, DEFAULT_LINE_SETTINGS, PLAIN_PITCH_LINES } from '@tmc/core';

export interface PitchPanelProps {
  pitchSettings: PitchSettings;
  onUpdatePitch: (settings: Partial<PitchSettings>) => void;
  isPrintMode?: boolean;
  onTogglePrintMode?: () => void;
}

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
export function PitchPanel({ pitchSettings, onUpdatePitch, isPrintMode = false, onTogglePrintMode }: PitchPanelProps) {
  const handleThemeSelect = (theme: PitchTheme) => {
    const themeColors = PITCH_THEMES[theme];
    onUpdatePitch({
      theme,
      ...themeColors,
    });
  };

  // Check if all lines are hidden
  const lines = pitchSettings.lines ?? DEFAULT_LINE_SETTINGS;
  const allLinesHidden = Object.values(lines).every(value => value === false);

  const handleWithoutLinesToggle = () => {
    if (allLinesHidden) {
      // Turn lines ON
      onUpdatePitch({ lines: DEFAULT_LINE_SETTINGS, view: 'full' });
    } else {
      // Turn lines OFF
      onUpdatePitch({ lines: PLAIN_PITCH_LINES, view: 'full' });
    }
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

      {/* Without Lines toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text">Without Lines</span>
        <button
          type="button"
          onClick={handleWithoutLinesToggle}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            allLinesHidden ? 'bg-accent' : 'bg-surface2'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              allLinesHidden ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* Print Friendly Button */}
      <button
        type="button"
        onClick={() => {
          // Check if we're already in print-friendly mode (white background)
          const isPrintFriendly = pitchSettings.primaryColor === '#ffffff';
          if (isPrintFriendly) {
            // Toggle back to grass theme AND disable print mode
            handleThemeSelect('grass');
            if (isPrintMode && onTogglePrintMode) {
              onTogglePrintMode();
            }
          } else {
            // Set to print-friendly mode AND enable print mode
            onUpdatePitch({
              theme: 'custom',
              primaryColor: '#ffffff',
              stripeColor: '#f5f5f5',
              lineColor: '#000000',
              showStripes: false,
            });
            if (!isPrintMode && onTogglePrintMode) {
              onTogglePrintMode();
            }
          }
        }}
        className={`w-full px-3 py-2.5 mt-2 flex items-center justify-center gap-2 rounded-lg border transition-colors ${
          pitchSettings.primaryColor === '#ffffff'
            ? 'bg-green-500 text-white border-green-600 hover:bg-green-600'
            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-100'
        }`}
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
