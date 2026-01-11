/**
 * ShortcutsHint - Subtle one-time hint about keyboard shortcuts
 * Shows for 3 seconds on first visit, top-right corner
 */

import React, { useEffect, useState } from 'react';

export interface ShortcutsHintProps {
  isVisible: boolean;
  onDismiss: () => void;
  onClick: () => void;
}

/**
 * Floating hint that appears once to educate users about shortcuts
 * Auto-dismisses after 3 seconds
 */
export const ShortcutsHint: React.FC<ShortcutsHintProps> = ({
  isVisible,
  onDismiss,
  onClick,
}) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsAnimatingOut(true);
      setTimeout(onDismiss, 300); // Wait for fade-out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [isVisible, onDismiss]);

  const handleClick = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      onClick();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={handleClick}
      className={`fixed top-20 right-6 z-[100] cursor-pointer transition-all duration-300 ${
        isAnimatingOut ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="bg-accent/10 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-2.5 shadow-lg hover:bg-accent/15 hover:border-accent/50 transition-all">
        <div className="flex items-center gap-3">
          {/* Keyboard icon */}
          <svg
            className="w-5 h-5 text-accent flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h12" />
          </svg>

          {/* Text */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-text">Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface2 border border-border text-accent font-mono text-xs">
              ?
            </kbd>
            <span className="text-text">for shortcuts •</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface2 border border-border text-accent font-mono text-xs">
              ⌘K
            </kbd>
            <span className="text-text">for commands</span>
          </div>

          {/* Close hint (subtle) */}
          <svg
            className="w-4 h-4 text-muted opacity-50 hover:opacity-100 transition-opacity"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHint;
