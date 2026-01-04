/**
 * CommandPaletteModal - Searchable command palette (Cmd/Ctrl + K)
 * VS Code-style command launcher with action search and keyboard shortcuts
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/** Command category types */
export type CommandCategory = 'elements' | 'edit' | 'view' | 'steps' | 'export' | 'presets';

/** Command action definition */
export interface CommandAction {
  id: string;
  label: string;
  shortcut?: string;
  category: CommandCategory;
  icon?: React.ReactNode;
  onExecute: () => void;
  disabled?: boolean;
  /** Pro feature - show lock icon */
  locked?: boolean;
}

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

/** Category display names */
const categoryNames: Record<CommandCategory, string> = {
  elements: 'Elements',
  edit: 'Edit',
  view: 'View',
  steps: 'Steps',
  export: 'Export',
  presets: 'Presets',
};

/** Category icons */
const CategoryIcon: React.FC<{ category: CommandCategory; className?: string }> = ({ 
  category, 
  className = 'w-4 h-4' 
}) => {
  switch (category) {
    case 'elements':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      );
    case 'edit':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case 'view':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'steps':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      );
    case 'export':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    case 'presets':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
        </svg>
      );
    default:
      return null;
  }
};

/** Highlight matching text */
const HighlightMatch: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-accent/20 text-accent rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

/** Command Palette Modal Component */
export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  actions,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter actions based on query
  const filteredActions = useMemo(() => {
    if (!query) return actions.filter(a => !a.disabled);
    
    const lowerQuery = query.toLowerCase();
    return actions
      .filter(a => !a.disabled)
      .filter(
        a =>
          a.label.toLowerCase().includes(lowerQuery) ||
          a.category.toLowerCase().includes(lowerQuery) ||
          a.shortcut?.toLowerCase().includes(lowerQuery)
      );
  }, [actions, query]);

  // Group by category
  const groupedActions = useMemo(() => {
    const groups: Record<CommandCategory, CommandAction[]> = {
      elements: [],
      edit: [],
      view: [],
      steps: [],
      export: [],
      presets: [],
    };
    
    filteredActions.forEach(action => {
      groups[action.category].push(action);
    });
    
    return groups;
  }, [filteredActions]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => {
    const order: CommandCategory[] = ['elements', 'edit', 'view', 'steps', 'export', 'presets'];
    return order.flatMap(cat => groupedActions[cat]);
  }, [groupedActions]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = listRef.current?.querySelector('[data-selected="true"]');
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, flatList.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatList[selectedIndex]) {
            flatList[selectedIndex].onExecute();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [flatList, selectedIndex, onClose]
  );

  // Execute action on click
  const handleActionClick = useCallback(
    (action: CommandAction) => {
      action.onExecute();
      onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-palette animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-[15%] max-w-xl mx-auto z-palette animate-slide-down">
        <div className="bg-surface rounded-xl shadow-lg border border-border overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="
                w-full px-3 py-2 rounded-lg
                bg-surface2 border border-border
                text-text placeholder-muted
                text-sm
                focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
                transition-all duration-fast
              "
            />
          </div>

          {/* Actions List */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
            {flatList.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted text-sm">
                No commands found
              </div>
            ) : (
              Object.entries(groupedActions).map(([category, categoryActions]) => {
                if (categoryActions.length === 0) return null;
                
                return (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="px-4 py-1.5 flex items-center gap-2 text-xs text-muted uppercase tracking-wide">
                      <CategoryIcon category={category as CommandCategory} className="w-3 h-3" />
                      {categoryNames[category as CommandCategory]}
                    </div>
                    
                    {/* Category Actions */}
                    {categoryActions.map(action => {
                      const globalIndex = flatList.indexOf(action);
                      const isSelected = globalIndex === selectedIndex;
                      
                      return (
                        <button
                          key={action.id}
                          data-selected={isSelected}
                          onClick={() => handleActionClick(action)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`
                            w-full px-4 py-2 flex items-center justify-between
                            text-left text-sm
                            transition-colors duration-fast
                            ${isSelected ? 'bg-accent/10 text-text' : 'text-text/80 hover:bg-surface2'}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            {action.icon && (
                              <span className="text-muted">{action.icon}</span>
                            )}
                            <span>
                              <HighlightMatch text={action.label} query={query} />
                            </span>
                            {action.locked && (
                              <span className="ml-1 text-[10px] text-muted/70 flex items-center gap-0.5">
                                🔒 <span className="text-accent">Pro</span>
                              </span>
                            )}
                          </div>
                          
                          {action.shortcut && (
                            <kbd className="
                              px-1.5 py-0.5 rounded
                              bg-surface2 border border-border
                              text-xs text-muted font-mono
                            ">
                              {action.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-border bg-surface2/50 text-xs text-muted flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-surface border border-border text-xs">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-surface border border-border text-xs">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-surface border border-border text-xs">esc</kbd>
              close
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandPaletteModal;
