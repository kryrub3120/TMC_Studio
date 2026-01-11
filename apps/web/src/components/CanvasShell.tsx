/**
 * CanvasShell - Wrapper component for canvas area
 * Holds BoardCanvas (Konva) + absolute overlays (EmptyState, etc.)
 * Keeps App.tsx clean and BoardCanvas pure
 */

import React from 'react';

export interface CanvasShellProps {
  children: React.ReactNode;
  /** Empty state overlay (conditionally rendered) */
  emptyStateOverlay?: React.ReactNode;
}

/**
 * Canvas shell component
 * Architecture: App.tsx → CanvasShell → BoardCanvas + Overlays
 */
export const CanvasShell: React.FC<CanvasShellProps> = ({
  children,
  emptyStateOverlay,
}) => {
  return (
    <div className="relative">
      {/* BoardCanvas (Konva) */}
      {children}
      
 {/* Empty State Overlay (absolute, center) */}
      {emptyStateOverlay}
    </div>
  );
};

export default CanvasShell;
