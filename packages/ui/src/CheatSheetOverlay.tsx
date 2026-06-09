/**
 * CheatSheetOverlay - Floating compact shortcuts modal
 * Always shows a small "?" trigger button in bottom-right corner.
 * On click/tap, expands to the full keyboard shortcuts panel.
 * On mobile (<768px), expands as a bottom sheet.
 * Toggleable with "?" key or command palette.
 */

import React, { useState, useCallback } from 'react';

export interface CheatSheetOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  /** When false, the Steps & Playback section is hidden (animation feature flag off). Defaults to true. */
  showAnimationShortcuts?: boolean;
}

/** Shortcut item */
interface ShortcutItem {
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
      { key: 'P', description: 'Add Home Player' },
      { key: '⇧P', description: 'Add Away Player' },
      { key: 'B', description: 'Add Ball' },
      { key: 'A', description: 'Pass Arrow' },
      { key: 'R', description: 'Run Arrow' },
      { key: 'Z', description: 'Rect Zone' },
      { key: '⇧Z', description: 'Ellipse Zone' },
      { key: 'T', description: 'Text Label' },
      { key: 'D', description: 'Freehand Draw' },
      { key: 'H', description: 'Highlighter' },
      { key: 'C', description: 'Clear Drawings' },
      { key: 'J', description: 'Goal (⇧ Mini)' },
      { key: 'M', description: 'Mannequin (⇧ Flat)' },
      { key: 'K', description: 'Cone (⇧ Pole)' },
      { key: 'Y', description: 'Ladder' },
      { key: 'Q', description: 'Hoop' },
      { key: 'U', description: 'Hurdle' },
      { key: '[', description: 'Rotate -15°' },
      { key: ']', description: 'Rotate +15°' },
      { key: '{', description: 'Rotate -90°' },
      { key: '}', description: 'Rotate +90°' },
    ],
  },
  {
    title: 'Edit',
    items: [
      { key: '⌘C', description: 'Copy Selection' },
      { key: '⌘V', description: 'Paste' },
      { key: '⌘D', description: 'Duplicate' },
      { key: 'Del', description: 'Delete' },
      { key: '⌘Z', description: 'Undo' },
      { key: '⇧⌘Z', description: 'Redo' },
      { key: '⌘A', description: 'Select All' },
      { key: 'Esc', description: 'Clear Selection' },
      { key: 'DblClick', description: 'Quick Edit Number' },
      { key: 'S', description: 'Cycle Player Shape' },
      { key: 'E', description: 'Cycle Zone Shape' },
      { key: '⌥↑↓', description: 'Cycle Color' },
      { key: '⌥←→', description: 'Stroke Width' },
    ],
  },
  {
    title: 'View & Pitch',
    items: [
      { key: '⌘K', description: 'Command Palette' },
      { key: 'F', description: 'Focus Mode' },
      { key: 'I', description: 'Toggle Inspector' },
      { key: 'O', description: 'Toggle Orientation' },
      { key: 'W', description: 'Print Friendly Mode' },
      { key: 'V', description: 'Cycle Pitch View' },
      { key: '?', description: 'Toggle Shortcuts' },
    ],
  },
  {
    title: 'Steps & Playback',
    isAnimation: true,
    items: [
      { key: '←/→', description: 'Prev/Next Step' },
      { key: 'Space', description: 'Play/Pause' },
      { key: 'N', description: 'Add Step' },
      { key: 'X', description: 'Delete Step' },
      { key: 'L', description: 'Toggle Loop' },
    ],
  },
  {
    title: 'Export',
    items: [
      { key: '⌘E', description: 'Export PNG' },
      { key: '⇧⌘E', description: 'Export All PNGs' },
      { key: '⇧⌘G', description: 'Export GIF' },
      { key: '⇧⌘P', description: 'Export PDF' },
    ],
  },
  {
    title: 'Formations',
    items: [
      { key: '1-6', description: 'Apply Home Formation' },
      { key: '⇧1-6', description: 'Apply Away Formation' },
    ],
  },
  {
    title: 'Arrow Numbering',
    items: [
      { key: '⇧A', description: 'Pass + Num' },
      { key: '⇧R', description: 'Run + Num' },
      { key: '⇧N', description: 'Toggle Auto-Num' },
      { key: '→', description: 'Toggle Number' },
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

/** CheatSheet Overlay Component — floating compact modal */
export const CheatSheetOverlay: React.FC<CheatSheetOverlayProps> = ({
  isVisible,
  onClose,
  showAnimationShortcuts = true,
}) => {
  // isVisible from parent (e.g. "?" key toggles between trigger-only and expanded)
  const [expanded, setExpanded] = useState(false);

  // Sync expanded state with parent's isVisible
  // When parent says isVisible=false and we're expanded, collapse
  // When parent says isVisible=true, expand
  React.useEffect(() => {
    if (!isVisible) {
      setExpanded(false);
    }
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

  const visibleShortcuts = showAnimationShortcuts
    ? shortcuts
    : shortcuts.filter((s) => !s.isAnimation);

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
            className="pointer-events-auto bg-surface/95 backdrop-blur-sm rounded-xl shadow-lg border border-border p-4 w-[320px] animate-slide-up max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:rounded-b-none max-sm:rounded-t-xl max-sm:animate-slide-up max-sm:z-[51]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <KeyboardIcon className="w-4 h-4 text-accent" />
                Keyboard Shortcuts
              </h3>
              <button
                onClick={handleClose}
                className="p-1 rounded hover:bg-surface2 text-muted hover:text-text transition-colors duration-fast"
                title="Close (or press ?)"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Shortcuts */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {visibleShortcuts.map((section) => (
                <div key={section.title}>
                  <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                    {section.title}
                  </h4>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {section.items.map((item) => (
                      <div key={item.key} className="flex items-center justify-between text-xs">
                        <span className="text-muted truncate">{item.description}</span>
                        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-surface2 border border-border text-text font-mono text-[10px] whitespace-nowrap">
                          {item.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted text-center">
                Press <kbd className="px-1 py-0.5 rounded bg-surface2 border border-border font-mono text-[10px]">?</kbd> to toggle
              </p>
            </div>
          </div>
        </>
      )}

      {/* Floating Trigger Button - always visible */}
      <button
        onClick={handleToggle}
        className="pointer-events-auto z-cheatsheet p-2 rounded-full bg-surface/95 backdrop-blur-md border border-border shadow-md hover:bg-surface2 hover:border-accent/50 transition-all duration-fast active:scale-95"
        title={expanded ? "Close Shortcuts (?)" : "Keyboard Shortcuts (?)"}
        aria-label={expanded ? "Close keyboard shortcuts" : "Show keyboard shortcuts"}
      >
        <KeyboardIcon className="w-5 h-5 text-accent" />
      </button>
    </div>
  );
};

export default CheatSheetOverlay;
