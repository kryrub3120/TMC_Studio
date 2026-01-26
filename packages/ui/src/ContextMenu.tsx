/**
 * Context Menu - Right-click menu for projects and folders
 */

import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  divider?: boolean;
  shortcut?: string; // PR-UX-5: Keyboard shortcut hint
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  header?: string; // PR-UX-5: Contextual header
}

export function ContextMenu({ x, y, items, onClose, header }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Add small delay to prevent immediate close from the right-click event
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[240px] bg-surface border border-border rounded-lg shadow-2xl py-1"
      style={{ left: x, top: y }}
    >
      {/* PR-UX-5: Contextual Header */}
      {header && (
        <>
          <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider border-b border-border/50">
            {header}
          </div>
        </>
      )}
      
      {items.map((item, index) => (
        <div key={index}>
          {item.divider && <div className="h-px bg-border my-1" />}
          <button
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
              item.variant === 'danger'
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-text hover:bg-surface2'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </div>
            {/* PR-UX-5: Keyboard shortcut hint */}
            {item.shortcut && (
              <span className="text-xs text-muted font-mono">{item.shortcut}</span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
