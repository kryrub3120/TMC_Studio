/**
 * CheatSheetOverlay - Small keyboard shortcuts card in canvas corner
 * Toggleable with "?" key or command palette
 */

import React from 'react';

export interface CheatSheetOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

/** Shortcut item */
interface ShortcutItem {
  key: string;
  description: string;
}

/** Shortcut sections */
const shortcuts: { title: string; items: ShortcutItem[] }[] = [
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
];

/** Close icon */
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** CheatSheet Overlay Component */
export const CheatSheetOverlay: React.FC<CheatSheetOverlayProps> = ({
  isVisible,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-4 left-4 z-cheatsheet animate-slide-up">
      <div className="bg-surface/95 backdrop-blur-sm rounded-xl shadow-lg border border-border p-4 w-[320px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h12" />
            </svg>
            Keyboard Shortcuts
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface2 text-muted hover:text-text transition-colors"
            title="Close (or press ?)"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts */}
        <div className="space-y-3">
          {shortcuts.map((section) => (
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
    </div>
  );
};

export default CheatSheetOverlay;
