/**
 * RightInspector - Collapsible side panel with Props/Layers/Objects tabs
 * Shows element properties, layer visibility toggles, and element navigation
 */

import React, { useState, useMemo } from 'react';

export interface InspectorElement {
  id: string;
  type: 'player' | 'ball' | 'arrow' | 'zone' | 'text';
  team?: 'home' | 'away';
  number?: number;
  label?: string;
  x: number;
  y: number;
}

export interface ElementInList {
  id: string;
  type: string;
  team?: 'home' | 'away';
  label: string;
}

export interface LayerVisibility {
  homePlayers: boolean;
  awayPlayers: boolean;
  ball: boolean;
  arrows: boolean;
  zones: boolean;
  labels: boolean;
}

export type LayerType = 'homePlayers' | 'awayPlayers' | 'ball' | 'arrows' | 'zones' | 'labels';

export interface GroupData {
  id: string;
  name: string;
  memberIds: string[];
  locked: boolean;
  visible: boolean;
}

export interface RightInspectorProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedCount: number;
  selectedElement?: InspectorElement;
  elements: ElementInList[];
  layerVisibility: LayerVisibility;
  groups?: GroupData[];
  onUpdateElement?: (updates: { number?: number; label?: string }) => void;
  onSelectElement?: (id: string) => void;
  onToggleLayerVisibility?: (layer: LayerType) => void;
  onSelectGroup?: (groupId: string) => void;
  onToggleGroupLock?: (groupId: string) => void;
  onToggleGroupVisibility?: (groupId: string) => void;
  onRenameGroup?: (groupId: string, name: string) => void;
  onQuickAction?: (action: string) => void;
}

type TabType = 'props' | 'layers' | 'objects';

/** Icons */
const CollapseIcon: React.FC<{ className?: string; collapsed?: boolean }> = ({ className, collapsed }) => (
  <svg className={`${className} transition-transform ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlayerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
  </svg>
);

const BallIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UnlockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

/** Quick Actions Panel - when nothing selected */
const QuickActionsPanel: React.FC<{ onAction?: (action: string) => void }> = ({ onAction }) => {
  const actions = [
    { key: 'P', label: 'Add Home Player', action: 'add-home-player', color: '#e63946' },
    { key: '⇧P', label: 'Add Away Player', action: 'add-away-player', color: '#457b9d' },
    { key: 'B', label: 'Add Ball', action: 'add-ball', color: '#ffffff' },
    { key: 'A', label: 'Pass Arrow', action: 'add-pass-arrow', color: 'currentColor' },
    { key: 'Z', label: 'Zone', action: 'add-zone', color: 'currentColor' },
  ];

  return (
    <div className="p-4">
      <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
        Quick Actions
      </h3>
      <div className="space-y-1">
        {actions.map((item) => (
          <button
            key={item.action}
            onClick={() => onAction?.(item.action)}
            className="w-full px-3 py-2 flex items-center justify-between rounded-lg text-left hover:bg-surface2 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color, border: item.color === '#ffffff' ? '1px solid #666' : 'none' }}
              />
              <span className="text-sm text-text">{item.label}</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-surface2 border border-border text-xs text-muted font-mono group-hover:border-accent group-hover:text-accent transition-colors">
              {item.key}
            </kbd>
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <button
          onClick={() => onAction?.('open-palette')}
          className="w-full px-3 py-2 flex items-center justify-between rounded-lg bg-surface2 border border-border hover:border-accent transition-colors"
        >
          <span className="text-sm text-text">Command Palette</span>
          <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-xs text-muted font-mono">
            ⌘K
          </kbd>
        </button>
      </div>
    </div>
  );
};

/** Props Tab Content */
const PropsTab: React.FC<{
  selectedCount: number;
  selectedElement?: InspectorElement;
  onUpdateElement?: (updates: { number?: number; label?: string }) => void;
  onQuickAction?: (action: string) => void;
}> = ({ selectedCount, selectedElement, onUpdateElement, onQuickAction }) => {
  if (selectedCount === 0) {
    return <QuickActionsPanel onAction={onQuickAction} />;
  }

  if (selectedCount > 1) {
    return (
      <div className="p-4 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface2 flex items-center justify-center">
          <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        <p className="text-sm text-text font-medium">{selectedCount} elements selected</p>
        <p className="text-xs text-muted mt-1">Multi-select edit coming soon</p>
      </div>
    );
  }

  if (!selectedElement) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Element Type */}
      <div>
        <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">Type</label>
        <p className="text-sm text-text capitalize">
          {selectedElement.type}
          {selectedElement.team && ` (${selectedElement.team})`}
        </p>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">X</label>
          <input type="number" value={Math.round(selectedElement.x)} readOnly className="w-full px-2 py-1.5 rounded-md bg-surface2 border border-border text-sm text-text" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">Y</label>
          <input type="number" value={Math.round(selectedElement.y)} readOnly className="w-full px-2 py-1.5 rounded-md bg-surface2 border border-border text-sm text-text" />
        </div>
      </div>

      {/* Player-specific fields */}
      {selectedElement.type === 'player' && (
        <>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">Number</label>
            <input
              type="number"
              min={1}
              max={99}
              value={selectedElement.number ?? ''}
              onChange={(e) => onUpdateElement?.({ number: parseInt(e.target.value) || undefined })}
              className="w-full px-2 py-1.5 rounded-md bg-surface2 border border-border text-sm text-text focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">Label</label>
            <input
              type="text"
              value={selectedElement.label ?? ''}
              onChange={(e) => onUpdateElement?.({ label: e.target.value })}
              placeholder="Player name..."
              className="w-full px-2 py-1.5 rounded-md bg-surface2 border border-border text-sm text-text placeholder-muted focus:outline-none focus:border-accent"
            />
          </div>
        </>
      )}
    </div>
  );
};

/** Layers Tab Content - Category visibility toggles + Groups */
const LayersTab: React.FC<{
  layerVisibility: LayerVisibility;
  groups?: GroupData[];
  onToggle?: (layer: LayerType) => void;
  onSelectGroup?: (groupId: string) => void;
  onToggleGroupLock?: (groupId: string) => void;
  onToggleGroupVisibility?: (groupId: string) => void;
  onRenameGroup?: (groupId: string, name: string) => void;
}> = ({ layerVisibility, groups, onToggle, onSelectGroup, onToggleGroupLock, onToggleGroupVisibility, onRenameGroup }) => {
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  const layers: { key: LayerType; label: string; color: string }[] = [
    { key: 'homePlayers', label: 'Home Players', color: '#e63946' },
    { key: 'awayPlayers', label: 'Away Players', color: '#457b9d' },
    { key: 'ball', label: 'Ball', color: '#ffffff' },
    { key: 'arrows', label: 'Arrows', color: '#888888' },
    { key: 'zones', label: 'Zones', color: '#888888' },
    { key: 'labels', label: 'Labels', color: '#888888' },
  ];
  
  const handleStartEdit = (group: GroupData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroupId(group.id);
    setEditingName(group.name);
  };
  
  const handleFinishEdit = () => {
    if (editingGroupId && editingName.trim()) {
      onRenameGroup?.(editingGroupId, editingName.trim());
    }
    setEditingGroupId(null);
    setEditingName('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setEditingGroupId(null);
      setEditingName('');
    }
  };

  return (
    <div className="py-2">
      {/* Groups Section */}
      {groups && groups.length > 0 && (
        <div className="px-4 pb-2 mb-2 border-b border-border">
          <div className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
            Groups
          </div>
          <div className="space-y-1">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface2 cursor-pointer transition-colors"
                onClick={() => onSelectGroup?.(group.id)}
              >
                <FolderIcon className="h-4 w-4 text-accent flex-shrink-0" />
                {editingGroupId === group.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleFinishEdit}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="flex-1 text-sm text-text bg-surface2 border border-accent rounded px-1 py-0.5 focus:outline-none"
                  />
                ) : (
                  <span 
                    className="flex-1 text-sm text-text truncate"
                    onDoubleClick={(e) => handleStartEdit(group, e)}
                    title="Double-click to rename"
                  >
                    {group.name}
                  </span>
                )}
                <span className="text-xs text-muted">{group.memberIds.length}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleGroupLock?.(group.id); }}
                  className="p-1 hover:bg-surface rounded transition-colors"
                  title={group.locked ? 'Unlock group' : 'Lock group'}
                >
                  {group.locked ? (
                    <LockIcon className="h-3 w-3 text-accent" />
                  ) : (
                    <UnlockIcon className="h-3 w-3 text-muted" />
                  )}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleGroupVisibility?.(group.id); }}
                  className="p-1 hover:bg-surface rounded transition-colors"
                  title={group.visible ? 'Hide group' : 'Show group'}
                >
                  {group.visible ? (
                    <EyeIcon className="h-3 w-3 text-accent" />
                  ) : (
                    <EyeOffIcon className="h-3 w-3 text-muted" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Layers Section */}
      <div className="px-4 pb-2">
        <div className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
          Layers
        </div>
      </div>
      {layers.map((layer) => {
        const isVisible = layerVisibility[layer.key];
        return (
          <button
            key={layer.key}
            onClick={() => onToggle?.(layer.key)}
            className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors hover:bg-surface2 ${!isVisible ? 'opacity-50' : ''}`}
          >
            <span className={`${isVisible ? 'text-accent' : 'text-muted'}`}>
              {isVisible ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
            </span>
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: layer.color, border: layer.color === '#ffffff' ? '1px solid #666' : 'none' }}
            />
            <span className={`text-sm ${isVisible ? 'text-text' : 'text-muted'}`}>{layer.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/** Objects Tab Content - Searchable element list */
const ObjectsTab: React.FC<{
  elements: ElementInList[];
  selectedElement?: InspectorElement;
  layerVisibility: LayerVisibility;
  onSelectElement?: (id: string) => void;
}> = ({ elements, selectedElement, layerVisibility, onSelectElement }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'home' | 'away' | 'ball'>('all');

  const filteredElements = useMemo(() => {
    return elements.filter((el) => {
      // Text search
      if (searchQuery && !el.label.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Type filter
      if (filter === 'home' && (el.type !== 'player' || el.team !== 'home')) return false;
      if (filter === 'away' && (el.type !== 'player' || el.team !== 'away')) return false;
      if (filter === 'ball' && el.type !== 'ball') return false;
      return true;
    });
  }, [elements, searchQuery, filter]);

  // Check if element is hidden by layer visibility
  const isElementHidden = (el: ElementInList) => {
    if (el.type === 'player' && el.team === 'home' && !layerVisibility.homePlayers) return true;
    if (el.type === 'player' && el.team === 'away' && !layerVisibility.awayPlayers) return true;
    if (el.type === 'ball' && !layerVisibility.ball) return true;
    return false;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search elements..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-surface2 border border-border text-sm text-text placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-1 mt-2">
          {(['all', 'home', 'away', 'ball'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded text-xs capitalize transition-colors ${
                filter === f ? 'bg-accent/10 text-accent' : 'text-muted hover:text-text hover:bg-surface2'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Element List */}
      <div className="flex-1 overflow-y-auto py-1">
        {filteredElements.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted">No elements found</div>
        ) : (
          filteredElements.map((el) => {
            const isHidden = isElementHidden(el);
            const isSelected = selectedElement?.id === el.id;
            
            return (
              <button
                key={el.id}
                onClick={() => onSelectElement?.(el.id)}
                className={`w-full px-4 py-2 flex items-center gap-3 text-left transition-colors ${
                  isSelected ? 'bg-accent/10' : 'hover:bg-surface2'
                } ${isHidden ? 'opacity-40' : ''}`}
              >
                <span className="flex-shrink-0 text-muted">
                  {el.type === 'player' ? <PlayerIcon className="w-4 h-4" /> : <BallIcon className="w-4 h-4" />}
                </span>
                <span className={`text-sm truncate ${isSelected ? 'text-accent' : 'text-text'}`}>{el.label}</span>
                {isHidden && <EyeOffIcon className="w-3 h-3 text-muted ml-auto flex-shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

/** Right Inspector Component */
export const RightInspector: React.FC<RightInspectorProps> = ({
  isOpen,
  onToggle,
  selectedCount,
  selectedElement,
  elements,
  layerVisibility,
  groups,
  onUpdateElement,
  onSelectElement,
  onToggleLayerVisibility,
  onSelectGroup,
  onToggleGroupLock,
  onToggleGroupVisibility,
  onRenameGroup,
  onQuickAction,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('props');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'props', label: 'Props' },
    { id: 'layers', label: 'Layers' },
    { id: 'objects', label: 'Objects' },
  ];

  return (
    <div className={`relative flex flex-col bg-surface border-l border-border transition-all duration-200 z-10 ${isOpen ? 'w-[280px]' : 'w-0'}`}>
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -left-8 top-3 z-10 w-6 h-12 rounded-l-md bg-surface border border-r-0 border-border flex items-center justify-center text-muted hover:text-text transition-colors"
        title={isOpen ? 'Close Inspector (I)' : 'Open Inspector (I)'}
      >
        <CollapseIcon className="w-4 h-4" collapsed={!isOpen} />
      </button>

      {/* Content */}
      {isOpen && (
        <>
          {/* Tab Headers - Pills Style */}
          <div className="flex gap-1 p-2 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:text-text hover:bg-surface2'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'props' && (
              <PropsTab
                selectedCount={selectedCount}
                selectedElement={selectedElement}
                onUpdateElement={onUpdateElement}
                onQuickAction={onQuickAction}
              />
            )}
            {activeTab === 'layers' && (
              <LayersTab
                layerVisibility={layerVisibility}
                groups={groups}
                onToggle={onToggleLayerVisibility}
                onSelectGroup={onSelectGroup}
                onToggleGroupLock={onToggleGroupLock}
                onToggleGroupVisibility={onToggleGroupVisibility}
                onRenameGroup={onRenameGroup}
              />
            )}
            {activeTab === 'objects' && (
              <ObjectsTab
                elements={elements}
                selectedElement={selectedElement}
                layerVisibility={layerVisibility}
                onSelectElement={onSelectElement}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RightInspector;
