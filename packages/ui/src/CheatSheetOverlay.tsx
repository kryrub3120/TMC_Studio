/**
 * CheatSheetOverlay - Floating compact shortcuts modal
 * Always shows a small "?" trigger button in bottom-right corner.
 * On click/tap, expands to the full keyboard shortcuts panel.
 * On mobile (<768px), expands as a bottom sheet.
 * Toggleable with "?" key or command palette.
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from './i18n.js';

export interface CheatSheetOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  /** When false, the Steps & Playback section is hidden (animation feature flag off). Defaults to true. */
  showAnimationShortcuts?: boolean;
}

/** Shortcut item */
interface ShortcutItem {
  id: string;
  key: string;
  description: string;
}

/** All shortcut sections. The animation section is filtered out at render time
 *  when `showAnimationShortcuts` is false, keeping this list as the single
 *  source of truth regardless of feature flags. */
const shortcuts: { title: string; items: ShortcutItem[]; isAnimation?: boolean }[] = [
  {
    title: 'Elements',
    items: [
      { id: 'add-home-player', key: 'P', description: 'Add Home Player' },
      { id: 'add-away-player', key: 'Shift+P', description: 'Add Away Player' },
      { id: 'add-team3-player', key: 'Alt+P', description: 'Add Team 3 Player' },
      { id: 'add-team4-player', key: 'Alt+Shift+P', description: 'Add Team 4 Player' },
      { id: 'add-ball', key: 'B', description: 'Add Ball' },
      { id: 'pass-arrow', key: 'A', description: 'Pass Arrow' },
      { id: 'run-arrow', key: 'R', description: 'Run Arrow' },
      { id: 'shot-arrow', key: 'S', description: 'Shot Arrow' },
      { id: 'dribble-arrow', key: 'D', description: 'Dribble Arrow' },
      { id: 'rect-zone', key: 'Z', description: 'Rect Zone' },
      { id: 'ellipse-zone', key: 'Shift+Z', description: 'Ellipse Zone' },
      { id: 'text-label', key: 'T', description: 'Text Label' },
      { id: 'freehand-draw', key: 'Shift+D', description: 'Freehand Draw' },
      { id: 'highlighter', key: 'H', description: 'Highlighter' },
      { id: 'clear-drawings', key: 'C', description: 'Clear Drawings' },
      { id: 'goal', key: 'J', description: 'Goal (Shift Mini)' },
      { id: 'mannequin', key: 'M', description: 'Mannequin (Shift Flat)' },
      { id: 'cone', key: 'K', description: 'Cone (Shift Pole)' },
      { id: 'ladder', key: 'Y', description: 'Ladder' },
      { id: 'hoop', key: 'Q', description: 'Hoop' },
      { id: 'hurdle', key: 'U', description: 'Hurdle' },
      { id: 'rotate-minus', key: '[', description: 'Rotate -15°' },
      { id: 'rotate-plus', key: ']', description: 'Rotate +15°' },
      { id: 'rotate-minus-90', key: '{', description: 'Rotate -90°' },
      { id: 'rotate-plus-90', key: '}', description: 'Rotate +90°' },
    ],
  },
  {
    title: 'Edit',
    items: [
      { id: 'copy', key: '⌘C', description: 'Copy Selection' },
      { id: 'paste', key: '⌘V', description: 'Paste' },
      { id: 'duplicate', key: '⌘D', description: 'Duplicate' },
      { id: 'delete', key: 'Del', description: 'Delete' },
      { id: 'undo', key: '⌘Z', description: 'Undo' },
      { id: 'redo', key: 'Shift+⌘Z', description: 'Redo' },
      { id: 'select-all', key: '⌘A', description: 'Select All' },
      { id: 'deselect', key: 'Esc', description: 'Clear Selection' },
      { id: 'quick-edit-number', key: 'DblClick', description: 'Quick Edit Number' },
      { id: 'cycle-player-shape', key: 'Shift+S', description: 'Cycle Player Shape' },
      { id: 'cycle-zone-shape', key: 'E', description: 'Cycle Zone Shape' },
      { id: 'group-selection', key: 'Cmd+G', description: 'Group Selection' },
      { id: 'ungroup-selection', key: 'Alt+G', description: 'Ungroup Selection' },
      { id: 'lock-unlock', key: 'Shift+L', description: 'Lock / Unlock Selection' },
      { id: 'cycle-color', key: '⌥↑↓', description: 'Cycle Color' },
      { id: 'stroke-width', key: '⌥←→', description: 'Stroke Width (text: Alignment)' },
      { id: 'resize-selected', key: 'Shift+±', description: 'Resize Selected' },
      { id: 'text-bold-italic', key: 'Ctrl+B / Ctrl+I', description: 'Bold / Italic (text)' },
    ],
  },
  {
    title: 'View & Pitch',
    items: [
      { id: 'command-palette', key: '⌘K', description: 'Command Palette' },
      { id: 'focus-mode', key: 'F', description: 'Focus Mode' },
      { id: 'toggle-inspector', key: 'I', description: 'Toggle Inspector' },
      { id: 'toggle-orientation', key: 'O', description: 'Toggle Orientation' },
      { id: 'toggle-orientation-mode', key: 'Shift+O', description: 'Toggle Player Orientation Mode' },
      { id: 'open-projects', key: '⌘P', description: 'Open Projects' },
      { id: 'print-mode', key: 'W', description: 'Print Friendly Mode' },
      { id: 'cycle-pitch-view', key: 'V', description: 'Cycle Pitch View' },
      { id: 'zoom-in', key: '+', description: 'Zoom In' },
      { id: 'zoom-out', key: '-', description: 'Zoom Out' },
      { id: 'toggle-shortcuts', key: '?', description: 'Toggle Shortcuts' },
    ],
  },
  {
    title: 'Steps & Playback',
    isAnimation: true,
    items: [
      { id: 'prev-next-step', key: '←/→', description: 'Prev/Next Step' },
      { id: 'add-step', key: 'N', description: 'Add Step' },
      { id: 'delete-step', key: 'X', description: 'Delete Step' },
      { id: 'toggle-loop', key: 'L', description: 'Toggle Loop' },
    ],
  },
  {
    title: 'Export',
    items: [
      { id: 'export-png', key: '⌘E', description: 'Export PNG' },
      { id: 'export-all-png', key: 'Shift+⌘E', description: 'Export All PNGs' },
      { id: 'export-gif', key: 'Shift+⌘G', description: 'Export GIF' },
      { id: 'export-pdf', key: 'Shift+⌘P', description: 'Export PDF' },
    ],
  },
  {
    title: 'Formations',
    items: [
      { id: 'home-formation', key: '1-6', description: 'Apply Home Formation' },
      { id: 'away-formation', key: 'Shift+1-6', description: 'Apply Away Formation' },
      { id: 'set-gk', key: 'Shift+G', description: 'Set GK / cycle GK color' },
    ],
  },
  {
    title: 'Arrow Numbering',
    items: [
      { id: 'pass-num', key: 'Shift+A', description: 'Pass + Num' },
      { id: 'run-num', key: 'Shift+R', description: 'Run + Num' },
      { id: 'toggle-auto-num', key: 'Shift+N', description: 'Toggle Auto-Num' },
      { id: 'toggle-number', key: '→', description: 'Toggle Number' },
    ],
  },
];

/** Close icon */
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** Keyboard icon (for trigger button) */
const KeyboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h12" />
  </svg>
);

/** CheatSheet Overlay Component — floating compact modal with paginated tabs */
export const CheatSheetOverlay: React.FC<CheatSheetOverlayProps> = ({
  isVisible,
  onClose,
  showAnimationShortcuts = true,
}) => {
  const { t } = useTranslation();
  // isVisible from parent (e.g. "?" key toggles between trigger-only and expanded)
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Elements');

  // Sync expanded state bidirectionally with parent's isVisible
  React.useEffect(() => {
    setExpanded(isVisible);
  }, [isVisible]);

  const handleToggle = useCallback(() => {
    if (expanded) {
      setExpanded(false);
      onClose();
    } else {
      setExpanded(true);
    }
  }, [expanded, onClose]);

  const handleClose = useCallback(() => {
    setExpanded(false);
    onClose();
  }, [onClose]);

  // ─── Build tabs from the shortcuts data (single source of truth) ──
  const tabDefs = React.useMemo(() => {
    const all = showAnimationShortcuts
      ? shortcuts
      : shortcuts.filter((s) => !s.isAnimation);

    // Group into tabs: Elements, Edit, View, More
    const groups: { id: string; label: string; sections: typeof all }[] = [];

    const elementsSections = all.filter(s =>
      ['Elements'].includes(s.title)
    );
    const editSections = all.filter(s =>
      ['Edit'].includes(s.title)
    );
    const viewSections = all.filter(s =>
      ['View & Pitch'].includes(s.title)
    );
    const moreSections = all.filter(s =>
      !['Elements', 'Edit', 'View & Pitch'].includes(s.title)
    );

    if (elementsSections.length > 0) groups.push({ id: 'Elements', label: 'Elements', sections: elementsSections });
    if (editSections.length > 0) groups.push({ id: 'Edit', label: 'Edit', sections: editSections });
    if (viewSections.length > 0) groups.push({ id: 'View', label: 'View', sections: viewSections });
    if (moreSections.length > 0) groups.push({ id: 'More', label: 'More', sections: moreSections });

    return groups;
  }, [showAnimationShortcuts]);

  // Reset active tab if current one is no longer available
  React.useEffect(() => {
    if (!tabDefs.find(t => t.id === activeTab)) {
      setActiveTab(tabDefs[0]?.id ?? 'Elements');
    }
  }, [tabDefs, activeTab]);

  const activeGroup = tabDefs.find(t => t.id === activeTab);

  return (
    <div className="absolute bottom-4 right-4 z-cheatsheet flex flex-col items-end pointer-events-none">
      {/* Expanded Shortcuts Panel */}
      {expanded && (
        <>
          {/* Backdrop (mobile) */}
          <div
            className="max-sm:fixed max-sm:inset-0 max-sm:bg-black/40 max-sm:z-modal"
            onClick={handleClose}
          />

          {/* Panel */}
          <div
            className="pointer-events-auto bg-surface/95 backdrop-blur-sm rounded-xl shadow-lg border border-border p-4 w-[320px] animate-slide-up max-sm:fixed max-sm:bottom-4 max-sm:left-4 max-sm:right-4 max-sm:w-auto max-sm:max-w-sm max-sm:rounded-xl max-sm:z-cheatsheet"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <KeyboardIcon className="w-4 h-4 text-accent" />
                {t('cheatsheet.title')}
              </h3>
              <button
                onClick={handleClose}
                className="p-1 rounded hover:bg-surface2 text-muted hover:text-text transition-colors duration-fast"
                title={t('cheatsheet.close')}
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Bar — click only, no keyboard hijack */}
            {tabDefs.length > 1 && (
              <div
                className="flex gap-1 mb-3 overflow-x-auto scrollbar-none"
                role="tablist"
                aria-label={t('cheatsheet.categories')}
              >
                {tabDefs.map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-fast whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      activeTab === tab.id
                        ? 'bg-accent text-white'
                        : 'bg-surface2 text-muted hover:text-text hover:bg-surface2/80'
                    }`}
                  >
                    {t(`cheatsheet.tabs.${tab.id}`)}
                  </button>
                ))}
              </div>
            )}

            {/* Active tab content — flex-grow to fill available height */}
            <div className="flex flex-col min-h-0 max-h-[55vh]">
              <div className="flex-1 overflow-y-auto space-y-3">
                {activeGroup?.sections.map((section) => (
                <div key={section.title}>
                  <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                    {t(`cheatsheet.sections.${section.title}`)}
                  </h4>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {section.items.map((item) => (
                      <div key={item.key} className="flex items-center justify-between text-xs">
                        <span className="text-text truncate">{t(`shortcuts.${item.id}`)}</span>
                        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-surface2 border border-border text-text font-mono text-[10px] whitespace-nowrap">
                          {item.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted text-center">
                {t('cheatsheet.press')} <kbd className="px-1 py-0.5 rounded bg-surface2 border border-border font-mono text-[10px]">?</kbd> {t('cheatsheet.toToggle')}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Floating Trigger Button - always visible */}
      <button
        onClick={handleToggle}
        className="pointer-events-auto z-cheatsheet p-2 rounded-full bg-surface/95 backdrop-blur-md border border-border shadow-md hover:bg-surface2 hover:border-accent/50 transition-all duration-fast active:scale-95"
        title={expanded ? t('cheatsheet.closeShortcuts') : t('cheatsheet.keyboardShortcuts')}
        aria-label={expanded ? t('cheatsheet.closeAria') : t('cheatsheet.showAria')}
      >
        <KeyboardIcon className="w-5 h-5 text-accent" />
      </button>
    </div>
  );
};

export default CheatSheetOverlay;
