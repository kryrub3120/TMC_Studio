/**
 * EmptyStateOverlay - Shows when board has no elements
 * Provides quick CTAs to get started
 */

import React from 'react';

export interface EmptyStateOverlayProps {
  isVisible: boolean;
  onAddPlayer: () => void;
  onAddBall: () => void;
  onAddArrow: () => void;
  onOpenPalette: () => void;
}

/**
 * Empty state card with quick actions
 * Shows when elements.length === 0
 */
export const EmptyStateOverlay: React.FC<EmptyStateOverlayProps> = ({
  isVisible,
  onAddPlayer,
  onAddBall,
  onAddArrow,
  onOpenPalette,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="bg-surface/90 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl p-8 max-w-md pointer-events-auto">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-text mb-2">
            Start your board
          </h2>
          <p className="text-sm text-muted">
            Add elements to begin creating your tactical board
          </p>
        </div>

        {/* Quick CTAs */}
        <div className="space-y-3 mb-4">
          <button
            onClick={onAddPlayer}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg bg-surface2 border border-border hover:border-accent hover:bg-accent/10 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors">
              <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="7" r="4" />
                <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-text">Add Player</div>
              <div className="text-xs text-muted">Place a player on the pitch</div>
            </div>
            <kbd className="px-2 py-1 rounded bg-surface border border-border text-xs text-accent font-mono">
              P
            </kbd>
          </button>

          <button
            onClick={onAddBall}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg bg-surface2 border border-border hover:border-accent hover:bg-accent/10 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors">
              <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-text">Add Ball</div>
              <div className="text-xs text-muted">Place the ball on the pitch</div>
            </div>
            <kbd className="px-2 py-1 rounded bg-surface border border-border text-xs text-accent font-mono">
              B
            </kbd>
          </button>

          <button
            onClick={onAddArrow}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg bg-surface2 border border-border hover:border-accent hover:bg-accent/10 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors">
              <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-text">Add Arrow</div>
              <div className="text-xs text-muted">Draw a pass or run</div>
            </div>
            <kbd className="px-2 py-1 rounded bg-surface border border-border text-xs text-accent font-mono">
              A
            </kbd>
          </button>
        </div>

        {/* Secondary CTA */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={onOpenPalette}
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border hover:border-accent hover:bg-accent/5 transition-all text-sm text-text flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8m-4-4h8" />
            </svg>
            <span>Command Palette</span>
            <kbd className="ml-2 px-1.5 py-0.5 rounded bg-surface2 border border-border text-xs text-muted font-mono">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmptyStateOverlay;
