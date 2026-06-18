/**
 * Context Menu - Right-click menu for projects and folders
 */

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  divider?: boolean;
  shortcut?: string; // PR-UX-5: Keyboard shortcut hint
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  header?: string; // PR-UX-5: Contextual header
}

function MenuIcon({ name }: { name?: string }) {
  const common = {
    className: 'w-4 h-4',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'copy': return <svg {...common}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
    case 'paste': return <svg {...common}><path d="M8 4h8" /><path d="M9 2h6v4H9z" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>;
    case 'duplicate': return <svg {...common}><rect x="8" y="8" width="12" height="12" rx="2" /><rect x="4" y="4" width="12" height="12" rx="2" /></svg>;
    case 'trash': return <svg {...common}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>;
    case 'lock': return <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    case 'unlock': return <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></svg>;
    case 'group': return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case 'ungroup': return <svg {...common}><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M16 3h3a2 2 0 0 1 2 2v3" /><path d="M8 21H5a2 2 0 0 1-2-2v-3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>;
    case 'player': return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M6 21v-2a6 6 0 0 1 12 0v2" /></svg>;
    case 'ball': return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 3v18" /><path d="M3 12h18" /></svg>;
    case 'arrow': return <svg {...common}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>;
    case 'zone': return <svg {...common}><rect x="4" y="5" width="16" height="14" rx="2" /></svg>;
    case 'number': return <svg {...common}><path d="M4 9h16" /><path d="M4 15h16" /><path d="M10 3L8 21" /><path d="M16 3l-2 18" /></svg>;
    case 'palette': return <svg {...common}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 1.4-3.4 1.5 1.5 0 0 1 1.1-2.6H18a6 6 0 0 0 0-12z" /></svg>;
    case 'edit': return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>;
    case 'resize': return <svg {...common}><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>;
    case 'rotate': return <svg {...common}><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" /></svg>;
    case 'front': case 'up': return <svg {...common}><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></svg>;
    case 'back': case 'down': return <svg {...common}><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></svg>;
    case 'switch': return <svg {...common}><path d="M7 7h11l-3-3" /><path d="M17 17H6l3 3" /></svg>;
    case 'shape': return <svg {...common}><rect x="4" y="4" width="7" height="7" rx="1" /><circle cx="17" cy="17" r="4" /></svg>;
    case 'check': return <svg {...common}><path d="M20 6L9 17l-5-5" /></svg>;
    default:
      return name ? <span className="text-sm leading-none">{name}</span> : <span className="w-4 h-4" />;
  }
}

export function ContextMenu({ x, y, items, onClose, header }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const focusMenuItem = (direction: 'first' | 'last' | 'next' | 'prev') => {
    const buttons = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not(:disabled)') ?? []
    );
    if (buttons.length === 0) return;

    const activeIndex = buttons.findIndex((button) => button === document.activeElement);
    if (direction === 'first') {
      buttons[0].focus();
      return;
    }
    if (direction === 'last') {
      buttons[buttons.length - 1].focus();
      return;
    }

    const fallbackIndex = direction === 'next' ? -1 : 0;
    const currentIndex = activeIndex >= 0 ? activeIndex : fallbackIndex;
    const delta = direction === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + delta + buttons.length) % buttons.length;
    buttons[nextIndex].focus();
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusMenuItem('next');
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusMenuItem('prev');
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      focusMenuItem('first');
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      focusMenuItem('last');
    }
  };

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

  useEffect(() => {
    window.setTimeout(() => focusMenuItem('first'), 0);
  }, []);

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed z-[100] min-w-[260px] max-h-[min(70vh,520px)] overflow-y-auto bg-surface border border-border rounded-lg shadow-2xl py-1"
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
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              item.onClick();
              onClose();
            }}
            className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
              item.variant === 'danger'
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-text hover:bg-surface2'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-muted"><MenuIcon name={item.icon} /></span>
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
