/**
 * ZoomWidget - Floating zoom controls in bottom-right corner
 */

import React from 'react';

export interface ZoomWidgetProps {
  /** Current zoom level (0.25 - 2) */
  zoom: number;
  /** Callbacks */
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
}

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

/** ZoomWidget Component */
export const ZoomWidget: React.FC<ZoomWidgetProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
}) => {
  const zoomPercent = Math.round(zoom * 100);
  const isAtMin = zoom <= 0.25;
  const isAtMax = zoom >= 2;
  const isAtFit = Math.abs(zoom - 1) < 0.01;

  return (
    <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 px-1 py-1 bg-surface/95 backdrop-blur-md border border-border rounded-lg shadow-md">
      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={isAtMin}
        title="Zoom Out (Cmd -)"
        className={`p-1.5 rounded-md transition-colors ${
          isAtMin
            ? 'text-muted/50 cursor-not-allowed'
            : 'text-muted hover:text-text hover:bg-surface2'
        }`}
      >
        <MinusIcon className="w-3.5 h-3.5" />
      </button>

      {/* Zoom percentage */}
      <span 
        className="min-w-[48px] text-center text-xs font-medium text-text tabular-nums"
        title={`Zoom: ${zoomPercent}%`}
      >
        {zoomPercent}%
      </span>

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        disabled={isAtMax}
        title="Zoom In (Cmd +)"
        className={`p-1.5 rounded-md transition-colors ${
          isAtMax
            ? 'text-muted/50 cursor-not-allowed'
            : 'text-muted hover:text-text hover:bg-surface2'
        }`}
      >
        <PlusIcon className="w-3.5 h-3.5" />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-border mx-0.5" />

      {/* Fit button */}
      <button
        onClick={onZoomFit}
        title="Fit to View (Shift+1)"
        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
          isAtFit
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
