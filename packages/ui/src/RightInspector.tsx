/**
 * RightInspector - Collapsible side panel with Props/Layers/Objects tabs
 * Shows element properties, layer visibility toggles, and element navigation
 */

import React, { useState, useMemo } from 'react';
import type { Team } from '@tmc/core';
import { BottomSheet } from './BottomSheet.js';
import { Toggle, Section, SettingRow, Slider, Field, inputClass } from './primitives.js';
import { useTranslation } from './i18n.js';

export interface InspectorElement {
  id: string;
  type: 'player' | 'ball' | 'arrow' | 'zone' | 'text';
  team?: Team;
  number?: number | null; // Can be null for players without numbers
  label?: string;
  showLabel?: boolean;
  fontSize?: number;
  textColor?: string;
  opacity?: number;
  isGoalkeeper?: boolean;
  x: number;
  y: number;
  // Arrow-specific
  showNumber?: boolean;
  arrowNumber?: number;
}

export interface ElementInList {
  id: string;
  type: string;
  team?: Team;
  label: string;
}

export interface LayerVisibility {
  homePlayers: boolean;
  awayPlayers: boolean;
  ball: boolean;
  arrows: boolean;
  zones: boolean;
  labels: boolean;
  equipment: boolean;
  drawings: boolean;
}

export type LayerType = 'homePlayers' | 'awayPlayers' | 'ball' | 'arrows' | 'zones' | 'labels' | 'equipment' | 'drawings';

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
  onUpdateElement?: (updates: { number?: number; label?: string; showLabel?: boolean; fontSize?: number; textColor?: string; opacity?: number; isGoalkeeper?: boolean; showNumber?: boolean; arrowNumber?: number }) => void;
  /** Ref forwarded to the player label input for Enter→focus from keyboard */
  labelInputRef?: React.RefObject<HTMLInputElement>;
  onSelectElement?: (id: string) => void;
  onToggleLayerVisibility?: (layer: LayerType) => void;
  onSelectGroup?: (groupId: string) => void;
  onToggleGroupLock?: (groupId: string) => void;
  onToggleGroupVisibility?: (groupId: string) => void;
  onRenameGroup?: (groupId: string, name: string) => void;
  onQuickAction?: (action: string) => void;
  playerOrientationSettings?: { enabled: boolean; showArms: boolean; showVision: boolean; zoomThreshold: number };
  onUpdatePlayerOrientation?: (settings: { enabled?: boolean; showArms?: boolean; showVision?: boolean; zoomThreshold?: number }) => void;
  /** Viewport breakpoint for responsive layout */
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
  /** Arrow-specific callbacks */
  onToggleAutoNumbering?: () => void;
  isAutoNumbering?: boolean;
  onRenumberArrows?: () => void;
  /** Batch update for multi-select editing (opacity / show label). */
  onUpdateSelectedElements?: (updates: { opacity?: number; showLabel?: boolean }) => void;
}

type TabType = 'props' | 'layers';

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
  const { t } = useTranslation();
  const actions = [
    { key: 'P', label: t('commands.add-home-player'), action: 'add-home-player', color: '#e63946' },
    { key: 'Shift+P', label: t('commands.add-away-player'), action: 'add-away-player', color: '#457b9d' },
    { key: 'B', label: t('commands.add-ball'), action: 'add-ball', color: '#ffffff' },
    { key: 'A', label: t('commands.add-pass-arrow'), action: 'add-pass-arrow', color: 'currentColor' },
    { key: 'R', label: t('commands.add-run-arrow'), action: 'add-run-arrow', color: 'currentColor' },
    { key: 'S', label: t('commands.add-shoot-arrow'), action: 'add-shoot-arrow', color: '#ef4444' },
    { key: 'D', label: t('commands.add-dribble-arrow'), action: 'add-dribble-arrow', color: '#1d4ed8' },
    { key: 'Z', label: t('commands.add-zone'), action: 'add-zone', color: 'currentColor' },
    { key: 'Shift+Z', label: t('commands.add-ellipse-zone'), action: 'add-ellipse-zone', color: 'currentColor' },
    { key: 'Shift+D', label: t('commands.add-freehand-draw'), action: 'add-freehand-draw', color: 'currentColor' },
    { key: 'T', label: t('commands.add-text'), action: 'add-text', color: 'currentColor' },
  ];

  return (
    <div className="p-4">
      <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
        {t('inspector.quickActions')}
      </h3>
      <div className="space-y-1">
        {actions.map((item) => (
          <button
            key={item.action}
            data-tool={item.action}
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
          <span className="text-sm text-text">{t('inspector.commandPalette')}</span>
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
  onUpdateElement?: (updates: { number?: number; label?: string; showLabel?: boolean; fontSize?: number; textColor?: string; opacity?: number; isGoalkeeper?: boolean; showNumber?: boolean; arrowNumber?: number }) => void;
  onQuickAction?: (action: string) => void;
  playerOrientationSettings?: { enabled: boolean; showArms: boolean; showVision: boolean; zoomThreshold: number };
  onUpdatePlayerOrientation?: (settings: { enabled?: boolean; showArms?: boolean; showVision?: boolean; zoomThreshold?: number }) => void;
  /** Arrow-specific callbacks */
  onToggleAutoNumbering?: () => void;
  isAutoNumbering?: boolean;
  onRenumberArrows?: () => void;
  /** Batch update for multi-select (opacity / show label). */
  onUpdateSelectedElements?: (updates: { opacity?: number; showLabel?: boolean }) => void;
  /** Ref for label input (Sprint A — Enter→focus) */
  labelInputRef?: React.RefObject<HTMLInputElement>;
}> = ({ selectedCount, selectedElement, onUpdateElement, onQuickAction, playerOrientationSettings, onUpdatePlayerOrientation, onToggleAutoNumbering, isAutoNumbering, onRenumberArrows, onUpdateSelectedElements, labelInputRef }) => {
  const [multiOpacity, setMultiOpacity] = useState(100);
  const { t } = useTranslation();
  if (selectedCount === 0) {
    return <QuickActionsPanel onAction={onQuickAction} />;
  }

  if (selectedCount > 1) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="w-7 h-7 rounded-md bg-surface2 flex items-center justify-center text-xs font-bold text-text shrink-0">{selectedCount}</span>
          <p className="text-sm font-medium text-text">{t('inspector.selected', { count: selectedCount })}</p>
        </div>
        <Section title={t('inspector.appearance')} collapsible={false}>
          <Slider
            label={t('inspector.opacityAll')}
            value={multiOpacity}
            min={10}
            max={100}
            format={(v) => `${v}%`}
            onChange={(v) => { setMultiOpacity(v); onUpdateSelectedElements?.({ opacity: v / 100 }); }}
          />
        </Section>
        <Section title={t('inspector.labels')} collapsible={false}>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateSelectedElements?.({ showLabel: true })}
              className="flex-1 px-3 py-2 rounded-md bg-surface2 border border-border text-sm text-text hover:border-accent hover:text-accent transition-colors"
            >
              {t('inspector.showLabels')}
            </button>
            <button
              onClick={() => onUpdateSelectedElements?.({ showLabel: false })}
              className="flex-1 px-3 py-2 rounded-md bg-surface2 border border-border text-sm text-text hover:border-accent hover:text-accent transition-colors"
            >
              {t('inspector.hideLabels')}
            </button>
          </div>
        </Section>
        <p className="text-xs text-muted mt-3">{t('inspector.multiHint')}</p>
      </div>
    );
  }

  if (!selectedElement) return null;

  const el = selectedElement;
  const teamColor = el.team === 'home' ? '#e63946' : el.team === 'away' ? '#457b9d' : '#888888';

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
      {/* Element header — type, team chip, live position (read-only) */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
        <span
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: teamColor, border: el.type === 'ball' ? '1px solid #888' : 'none' }}
        >
          {el.type === 'player' ? (el.number ?? '–') : el.type[0].toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text capitalize leading-tight">
            {el.type}{el.team ? ` · ${el.team}` : ''}
          </p>
          <p className="text-[11px] text-muted tabular-nums">x {Math.round(el.x)}, y {Math.round(el.y)}</p>
        </div>
      </div>

      <div className="px-4">
        {/* ── Player ── */}
        {el.type === 'player' && (
          <>
            <Section title={t('inspector.identity')} collapsible={false}>
              <div className="flex gap-2.5">
                <Field label={t('inspector.number')} className="w-20">
                  <input
                    type="number" min={1} max={99}
                    value={el.number ?? ''}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (v === '') { onUpdateElement?.({ number: undefined }); return; }
                      const n = parseInt(v); if (!isNaN(n) && n >= 1 && n <= 99) onUpdateElement?.({ number: n });
                    }}
                    placeholder="—" className={inputClass}
                  />
                </Field>
                <Field label={t('inspector.label')} className="flex-1">
                  <input
                    ref={labelInputRef} type="text"
                    value={el.label ?? ''}
                    onChange={(e) => onUpdateElement?.({ label: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                    placeholder={t('inspector.playerLabelPlaceholder')} aria-label={t('inspector.playerLabelAria')} className={inputClass}
                  />
                </Field>
              </div>
              <SettingRow
                label={t('inspector.showLabelBelow')}
                control={<Toggle checked={!!el.showLabel} onChange={() => onUpdateElement?.({ showLabel: !el.showLabel })} ariaLabel={t('inspector.showLabelBelowAria')} />}
              />
            </Section>

            <Section title={t('inspector.appearance')} collapsible={false}>
              <Slider label={t('inspector.labelSize')} value={el.fontSize ?? 14} min={8} max={20} format={(v) => `${v}px`} onChange={(v) => onUpdateElement?.({ fontSize: v })} />
              <div className="mt-3">
                <Slider label={t('inspector.opacity')} value={Math.round((el.opacity ?? 1) * 100)} min={10} max={100} format={(v) => `${v}%`} onChange={(v) => onUpdateElement?.({ opacity: v / 100 })} />
              </div>
            </Section>

            <Section title={t('inspector.role')} collapsible={false}>
              <SettingRow
                label={t('inspector.goalkeeper')}
                description={t('inspector.gkHint')}
                control={<Toggle checked={!!el.isGoalkeeper} onChange={() => onUpdateElement?.({ isGoalkeeper: !el.isGoalkeeper })} ariaLabel={t('inspector.goalkeeperAria')} />}
              />
            </Section>

            {playerOrientationSettings && onUpdatePlayerOrientation && (
              <Section title={t('inspector.advanced')} defaultOpen={false}>
                <div data-tour="orientation-panel">
                  <SettingRow
                    label={t('inspector.showOrientation')}
                    control={<Toggle checked={playerOrientationSettings.enabled} onChange={() => onUpdatePlayerOrientation({ enabled: !playerOrientationSettings.enabled })} ariaLabel={t('inspector.showOrientationAria')} />}
                  />
                  <SettingRow
                    label={t('inspector.showArms')}
                    disabled={!playerOrientationSettings.enabled}
                    control={<Toggle checked={playerOrientationSettings.showArms} disabled={!playerOrientationSettings.enabled} onChange={() => onUpdatePlayerOrientation({ showArms: !playerOrientationSettings.showArms })} ariaLabel={t('inspector.showArmsAria')} />}
                  />
                  <SettingRow
                    label={t('inspector.visionCone')}
                    description="V / Shift+V"
                    disabled={!playerOrientationSettings.enabled}
                    control={<Toggle checked={playerOrientationSettings.showVision === true} disabled={!playerOrientationSettings.enabled} onChange={() => onUpdatePlayerOrientation({ showVision: !(playerOrientationSettings.showVision === true) })} ariaLabel={t('inspector.visionConeAria')} />}
                  />
                  <div className="mt-2">
                    <Slider label={t('inspector.zoomThreshold')} value={playerOrientationSettings.zoomThreshold ?? 40} min={40} max={100} step={10} disabled={!playerOrientationSettings.enabled} format={(v) => `${v}%`} onChange={(v) => onUpdatePlayerOrientation({ zoomThreshold: v })} />
                  </div>
                </div>
              </Section>
            )}
          </>
        )}

        {/* ── Arrow ── */}
        {el.type === 'arrow' && (
          <>
            <Section title={t('inspector.numbering')} collapsible={false}>
              <SettingRow
                label={t('inspector.showNumber')}
                control={<Toggle checked={!!el.showNumber} onChange={() => onUpdateElement?.({ showNumber: !el.showNumber })} ariaLabel={t('inspector.showNumberAria')} />}
              />
              <Field label={t('inspector.number')}>
                <input
                  type="number" min={1} max={999}
                  value={el.arrowNumber ?? ''}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (v === '') { onUpdateElement?.({ arrowNumber: undefined }); return; }
                    const n = parseInt(v); if (!isNaN(n) && n >= 1) onUpdateElement?.({ arrowNumber: n });
                  }}
                  placeholder={t('inspector.arrowNumberPlaceholder')} aria-label={t('inspector.arrowNumberAria')} className={inputClass}
                />
              </Field>
            </Section>

            {(onToggleAutoNumbering !== undefined || onRenumberArrows) && (
              <Section title={t('inspector.sequence')} collapsible={false}>
                {onToggleAutoNumbering !== undefined && (
                  <SettingRow
                    label={t('inspector.autoNumber')}
                    control={<Toggle checked={!!isAutoNumbering} onChange={onToggleAutoNumbering} ariaLabel={t('inspector.autoNumberAria')} />}
                  />
                )}
                {onRenumberArrows && (
                  <button
                    onClick={onRenumberArrows}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-surface2 border border-border text-sm text-text hover:border-accent hover:text-accent transition-colors"
                    aria-label={t('inspector.renumberAria')}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                    {t('inspector.renumber')}
                  </button>
                )}
              </Section>
            )}
          </>
        )}
      </div>
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
  const { t } = useTranslation();
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  const layers: { key: LayerType; label: string; color: string }[] = [
    { key: 'homePlayers', label: 'Home Players', color: '#e63946' },
    { key: 'awayPlayers', label: 'Away Players', color: '#457b9d' },
    { key: 'ball', label: 'Ball', color: '#ffffff' },
    { key: 'arrows', label: 'Arrows', color: '#888888' },
    { key: 'zones', label: 'Zones', color: '#888888' },
    { key: 'labels', label: 'Text & Labels', color: '#888888' },
    { key: 'equipment', label: 'Equipment', color: '#888888' },
    { key: 'drawings', label: 'Drawings', color: '#888888' },
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
            {t('inspector.groups')}
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
                    title={t('inspector.doubleClickRename')}
                  >
                    {group.name}
                  </span>
                )}
                <span className="text-xs text-muted">{group.memberIds.length}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleGroupLock?.(group.id); }}
                  className="p-1 hover:bg-surface rounded transition-colors"
                  title={group.locked ? t('inspector.unlockGroup') : t('inspector.lockGroup')}
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
                  title={group.visible ? t('inspector.hideGroup') : t('inspector.showGroup')}
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
          {t('inspector.layers')}
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
            <span className={`text-sm ${isVisible ? 'text-text' : 'text-muted'}`}>{t(`inspector.layerNames.${layer.key}`)}</span>
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
  const { t } = useTranslation();
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
            placeholder={t('inspector.searchPlaceholder')}
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
              {t(`inspector.filters.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Element List */}
      <div className="flex-1 overflow-y-auto py-1">
        {filteredElements.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted">{t('inspector.noElements')}</div>
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
  playerOrientationSettings,
  onUpdatePlayerOrientation,
  labelInputRef,
  breakpoint,
  onToggleAutoNumbering,
  isAutoNumbering,
  onRenumberArrows,
  onUpdateSelectedElements,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('props');
  const isBottomSheetLayout = breakpoint === 'sm';
  // isSheetOpen syncs with isOpen prop only on phone layout (TopBar toggle → open BottomSheet)
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Sync sheet open state with isOpen prop only when the sheet can actually render.
  React.useEffect(() => {
    setIsSheetOpen(isBottomSheetLayout && isOpen);
  }, [isBottomSheetLayout, isOpen]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'props', label: 'Props' },
    { id: 'layers', label: 'Layers' },
  ];

  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onToggle]);

  // ─── Shared tab content renderer ─────────────────────────────────────
  const renderTabContent = () => {
    return activeTab === 'props' ? (
      <PropsTab
        selectedCount={selectedCount}
        selectedElement={selectedElement}
        onUpdateElement={onUpdateElement}
        onQuickAction={onQuickAction}
        playerOrientationSettings={playerOrientationSettings}
        onUpdatePlayerOrientation={onUpdatePlayerOrientation}
        labelInputRef={labelInputRef}
        onToggleAutoNumbering={onToggleAutoNumbering}
        isAutoNumbering={isAutoNumbering}
        onRenumberArrows={onRenumberArrows}
        onUpdateSelectedElements={onUpdateSelectedElements}
      />
    ) : activeTab === 'layers' ? (
      <div className="flex flex-col h-full">
        {/* Groups + layer visibility (capped, scrolls if tall) */}
        <div className="flex-shrink-0 max-h-[45%] overflow-y-auto border-b border-border">
          <LayersTab
            layerVisibility={layerVisibility}
            groups={groups}
            onToggle={onToggleLayerVisibility}
            onSelectGroup={onSelectGroup}
            onToggleGroupLock={onToggleGroupLock}
            onToggleGroupVisibility={onToggleGroupVisibility}
            onRenameGroup={onRenameGroup}
          />
        </div>
        {/* Searchable object list */}
        <div className="flex-1 min-h-0">
          <ObjectsTab
            elements={elements}
            selectedElement={selectedElement}
            layerVisibility={layerVisibility}
            onSelectElement={onSelectElement}
          />
        </div>
      </div>
    ) : null;
  };

  // ─── Tab navigation row ──────────────────────────────────────────────
  const renderTabs = () => (
    <div className="flex gap-0.5 p-2 border-b border-border flex-shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 px-1 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
            activeTab === tab.id
              ? 'bg-accent/10 text-accent'
              : 'text-muted hover:text-text hover:bg-surface2'
          }`}
        >
          {t(`inspector.${tab.id}`)}
        </button>
      ))}
    </div>
  );

  // ─── Sheet content ──────────────────────────────────────────────────
  const SheetContent = () => (
    <>
      {renderTabs()}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>
    </>
  );

  return (
    <>
      {/* ── DESKTOP/TABLET md+ (≥768px): full sidebar ── */}
      <div data-tour="inspector" className="hidden md:flex flex-col bg-surface border-l border-border z-inspector relative transition-all duration-normal">
        {/* Collapse Toggle Button — zawsze widoczny */}
        {isOpen && (
          <button
            onClick={onToggle}
            className="hidden md:block absolute -left-8 top-3 z-canvas w-6 h-12 rounded-l-md bg-surface border border-r-0 border-border text-muted hover:text-text transition-colors"
            title={t('inspector.closeInspector')}
            aria-label={t('inspector.closeInspectorAria')}
          >
            <CollapseIcon className="w-4 h-4" collapsed={false} />
          </button>
        )}

        <div className={`flex flex-col h-full ${isOpen ? 'w-[280px]' : 'w-0 overflow-hidden'}`}>
          {isOpen && (
            <>
              {/* Tab Headers */}
              <div className="flex gap-0.5 p-2 border-b border-border">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-1 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-accent/10 text-accent'
                        : 'text-muted hover:text-text hover:bg-surface2'
                    }`}
                  >
                    {t(`inspector.${tab.id}`)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {renderTabContent()}
              </div>
            </>
          )}
          {/* Collapse toggle when closed */}
          {!isOpen && (
            <button
              onClick={onToggle}
              className="h-full w-6 flex items-center justify-center text-muted hover:text-text transition-colors"
              title={t('inspector.openInspector')}
              aria-label={t('inspector.openInspectorAria')}
            >
              <CollapseIcon className="w-4 h-4" collapsed={true} />
            </button>
          )}
        </div>
        {/* Floating open button — widoczny gdy sidebar zamknięty */}
        {!isOpen && (
          <button
            onClick={onToggle}
            className="absolute -left-12 top-3 z-canvas w-10 h-10 rounded-l-md bg-accent shadow-lg flex items-center justify-center text-white hover:bg-accent-hover transition-colors"
            title={t('inspector.openInspector')}
            aria-label={t('inspector.openInspectorPanelAria')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
        )}
      </div>

      {/* ── PHONE sm (<768px): FAB + BottomSheet ── */}
      <div className="md:hidden">
        {!isOpen && (
          <button
            onClick={() => setIsSheetOpen(true)}
            className="fixed bottom-20 right-4 z-30 w-10 h-10 rounded-full bg-accent shadow-lg flex items-center justify-center text-white hover:bg-accent-hover active:scale-95 transition-all duration-fast"
            aria-label={t('inspector.openInspectorPanelAria')}
            title={t('inspector.inspectorTitle')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
        )}
        <BottomSheet isOpen={isBottomSheetLayout && isSheetOpen} onClose={() => setIsSheetOpen(false)} maxHeight="sm">
          <SheetContent />
        </BottomSheet>
      </div>
    </>
  );
};

export default RightInspector;
