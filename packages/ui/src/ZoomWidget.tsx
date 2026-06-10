/**
 * ZoomWidget - Floating zoom controls in bottom-right corner
 * Visual indicator bar shows zoom level relative to min/max range
 */

import React from 'react';

export interface ZoomWidgetProps {
  /** Current zoom level (0.25 - 2) */
  zoom: number;
  /** Viewport lock state (PR-UX-3 ETAP 4) */
  locked?: boolean;
  /** Callbacks */
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  /** Viewport lock toggle (PR-UX-3 ETAP 4) */
  onToggleLock?: () => void;
}

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2;

/** Minus icon */
const MinusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/** Plus icon */
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/** Lock icon (closed padlock) */
const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 1 1 8 0v4" />
  </svg>
);

/** Unlock icon (open padlock) */
const UnlockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 7.83-1" />
  </svg>
);

/** ZoomWidget Component */
export const ZoomWidget: React.FC<ZoomWidgetProps> = ({
  zoom,
  locked = false,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onToggleLock,
}) => {
  const zoomPercent = Math.round(zoom * 100);
  const isAtMin = zoom <= ZOOM_MIN;
  const isAtMax = zoom >= ZOOM_MAX;
  const isAtFit = Math.abs(zoom - 1) < 0.01;

  // Zoom level indicator progress (0-100% of min-max range)
  const zoomRange = ZOOM_MAX - ZOOM_MIN;
  const zoomProgress = ((zoom - ZOOM_MIN) / zoomRange) * 100;
  const clampedProgress = Math.max(0, Math.min(100, zoomProgress));

  // Color coding based on zoom level
  const indicatorColor = isAtFit
    ? 'bg-accent'
    : zoom < 1
    ? 'bg-blue-500'
    : 'bg-accent';

  return (
    <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 px-1 py-1 bg-surface/95 backdrop-blur-md border border-border rounded-lg shadow-md">
      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={locked || isAtMin}
        title="Zoom Out (Cmd -)"
        aria-label="Zoom out"
        className={`p-1.5 rounded-md transition-colors duration-fast ${
          locked || isAtMin
            ? 'text-muted/50 cursor-not-allowed'
            : 'text-muted hover:text-text hover:bg-surface2'
        }`}
      >
        <MinusIcon className="w-3.5 h-3.5" />
      </button>

      {/* Zoom percentage + visual bar */}
      <div className="flex flex-col items-center gap-0.5 min-w-[48px]">
        <span
          className="text-center text-xs font-medium text-text tabular-nums leading-tight"
          title={`Zoom: ${zoomPercent}%`}
        >
          {zoomPercent}%
        </span>
        {/* Visual indicator bar */}
        <div className="w-full h-1 rounded-full bg-surface2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-slow ${indicatorColor}`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        disabled={locked || isAtMax}
        title="Zoom In (Cmd +)"
        aria-label="Zoom in"
        className={`p-1.5 rounded-md transition-colors duration-fast ${
          locked || isAtMax
            ? 'text-muted/50 cursor-not-allowed'
            : 'text-muted hover:text-text hover:bg-surface2'
        }`}
      >
        <PlusIcon className="w-3.5 h-3.5" />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-border mx-0.5" />

      {/* Lock toggle button (PR-UX-3 ETAP 4) */}
      {onToggleLock && (
        <button
          onClick={onToggleLock}
          title={locked ? 'Unlock view (enable zoom/pan)' : 'Lock view (prevent zoom/pan)'}
          aria-label={locked ? 'Unlock viewport' : 'Lock viewport'}
          aria-pressed={locked}
          className={`p-1.5 rounded-md transition-colors duration-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            locked
              ? 'text-accent bg-accent/10'
              : 'text-muted hover:text-text hover:bg-surface2'
          }`}
        >
          {locked ? <LockIcon className="w-3.5 h-3.5" /> : <UnlockIcon className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Fit button */}
      <button
        onClick={onZoomFit}
        disabled={locked || isAtFit}
        title="Fit to View (Shift+1)"
        aria-label="Fit to view"
        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors duration-fast ${
          locked || isAtFit
            ? 'text-muted/50 cursor-not-allowed'
            : isAtFit
            ? 'text-accent bg-accent/10'
            : 'text-muted hover:text-text hover:bg-surface2'
        }`}
      >
        Fit
      </button>
    </div>
  );
};

export default ZoomWidget;
