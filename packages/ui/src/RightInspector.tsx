/**
 * RightInspector - Collapsible side panel with Props/Layers/Objects tabs
 * Shows element properties, layer visibility toggles, and element navigation
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { Team } from '@tmc/core';
import { BottomSheet } from './BottomSheet.js';
import { Toggle, Section, SettingRow, Slider, Field, SegmentedControl, ColorSwatchRow, inputClass } from './primitives.js';
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
  locked?: boolean;
  isGoalkeeper?: boolean;
  x: number;
  y: number;
  // Arrow-specific
  showNumber?: boolean;
  arrowNumber?: number;
  arrowType?: 'pass' | 'run' | 'shoot' | 'dribble';
  color?: string;
  strokeWidth?: number;
  startHead?: 'arrow' | 'none' | 'bar' | 'dot';
  endHead?: 'arrow' | 'none' | 'bar' | 'dot';
  // Zone-specific
  borderStyle?: 'solid' | 'dashed' | 'none';
  borderColor?: string;
  borderWidth?: number;
  showCorners?: boolean;
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
  onUpdateElement?: (updates: { number?: number; label?: string; showLabel?: boolean; fontSize?: number; textColor?: string; opacity?: number; isGoalkeeper?: boolean; showNumber?: boolean; arrowNumber?: number; color?: string; strokeWidth?: number; borderStyle?: 'solid' | 'dashed' | 'none'; borderColor?: string; borderWidth?: number; showCorners?: boolean; startHead?: 'arrow' | 'none' | 'bar' | 'dot'; endHead?: 'arrow' | 'none' | 'bar' | 'dot' }) => void;
  /** Save the selected arrow's current style as the user default. */
  onSetArrowDefault?: () => void;
  /** Save the selected zone's current style as the user default. */
  onSetZoneDefault?: () => void;
  onToggleSelectedLock?: () => void;
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
  /** Resizable width (px) of the desktop sidebar. Drag handle on the left edge adjusts this. */
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  /** Called with the new width while/after dragging. */
  onWidthChange?: (width: number) => void;
  /** A8: controlled active tab. When not provided, uses local state. */
  activeTab?: 'props' | 'layers';
  onActiveTabChange?: (tab: 'props' | 'layers') => void;
}

type TabType = 'props' | 'layers';

const DEFAULT_INSPECTOR_WIDTH = 340;
const MIN_INSPECTOR_WIDTH = 220;
const MAX_INSPECTOR_WIDTH = 480;

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

/* ── Arrow head glyphs (line + marker on the right) ──────────────────── */
const HeadNoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);
const HeadArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="19" y2="12" />
    <polyline points="14 7 20 12 14 17" />
  </svg>
);
const HeadBarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="12" x2="19" y2="12" />
    <line x1="19" y1="6" x2="19" y2="18" />
  </svg>
);
const HeadDotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="12" x2="16" y2="12" />
    <circle cx="19" cy="12" r="3" fill="currentColor" stroke="none" />
  </svg>
);

/* ── Border-style glyphs ─────────────────────────────────────────────── */
const LineSolidIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);
const LineDashedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 4">
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);
const LineNoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="19" x2="19" y2="5" />
    <line x1="5" y1="5" x2="19" y2="19" opacity="0.35" />
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
  onUpdateElement?: (updates: { number?: number; label?: string; showLabel?: boolean; fontSize?: number; textColor?: string; opacity?: number; isGoalkeeper?: boolean; showNumber?: boolean; arrowNumber?: number; color?: string; strokeWidth?: number; borderStyle?: 'solid' | 'dashed' | 'none'; borderColor?: string; borderWidth?: number; showCorners?: boolean; startHead?: 'arrow' | 'none' | 'bar' | 'dot'; endHead?: 'arrow' | 'none' | 'bar' | 'dot' }) => void;
  /** Save the selected arrow's current style as the user default. */
  onSetArrowDefault?: () => void;
  /** Save the selected zone's current style as the user default. */
  onSetZoneDefault?: () => void;
  onToggleSelectedLock?: () => void;
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
}> = ({ selectedCount, selectedElement, onUpdateElement, onToggleSelectedLock, onQuickAction, playerOrientationSettings, onUpdatePlayerOrientation, onToggleAutoNumbering, isAutoNumbering, onRenumberArrows, onUpdateSelectedElements, labelInputRef, onSetArrowDefault, onSetZoneDefault }) => {
  const [multiOpacity, setMultiOpacity] = useState(100);
  const [showCoordinates, setShowCoordinates] = useState(() => {
    try { return localStorage.getItem('inspector_showCoordinates') !== 'false'; } catch { return true; }
  });
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
    <div className="h-full overflow-y-auto pb-6">
      {/* Element header — type, team chip, live position (read-only) */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
        <span
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: teamColor, border: el.type === 'ball' ? '1px solid #888' : 'none' }}
        >
          {el.type === 'player' ? (el.number ?? '–') : el.type[0].toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text leading-tight">
            {t(`inspector.elementType.${el.type}`)}{el.team ? ` · ${t(`inspector.team.${el.team}`)}` : ''}
          </p>
          {showCoordinates && (
            <p className="text-[11px] text-muted tabular-nums">x {Math.round(el.x)}, y {Math.round(el.y)}</p>
          )}
        </div>
        <button
          onClick={() => {
            const next = !showCoordinates;
            setShowCoordinates(next);
            try { localStorage.setItem('inspector_showCoordinates', String(next)); } catch {}
          }}
          className="p-1 rounded hover:bg-surface2 transition-colors text-muted hover:text-text"
          title={t('inspector.showCoordinates')}
          aria-label={t('inspector.showCoordinates')}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      <div className="px-4">
        <Section title={t('inspector.locked')} collapsible={false}>
          <SettingRow
            label={t('inspector.lockToggle')}
            description={t('inspector.lockHint')}
            control={<Toggle checked={!!el.locked} onChange={() => onToggleSelectedLock?.()} ariaLabel={t('inspector.lockToggle')} />}
          />
        </Section>

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
              <Section title={t('inspector.advanced')} defaultOpen={true}>
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
                    description={t('inspector.visionConeHint')}
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

            {/* ── Arrow line & heads (condensed) ── */}
            <Section title={t('inspector.arrow.line')} collapsible={false}>
              {/* Preview of both ends */}
              <div className="flex items-center justify-center h-8 mb-2 rounded-md bg-surface2 border border-border">
                {(() => {
                  const start = el.startHead ?? 'none';
                  const end = el.endHead ?? 'arrow';
                  const marker = (type: string, x: number, d: number, key: string) => {
                    if (type === 'arrow') return <polyline key={key} points={`${x - 7 * d},6 ${x},11 ${x - 7 * d},16`} fill="none" />;
                    if (type === 'bar') return <line key={key} x1={x} y1={5} x2={x} y2={17} />;
                    if (type === 'dot') return <circle key={key} cx={x} cy={11} r={3} fill="currentColor" stroke="none" />;
                    return null;
                  };
                  return (
                    <svg width="120" height="22" viewBox="0 0 120 22" className="text-text" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="13" y1="11" x2="107" y2="11" />
                      {marker(start, 13, -1, 's')}
                      {marker(end, 107, 1, 'e')}
                    </svg>
                  );
                })()}
              </div>

              <Slider
                label={t('inspector.arrow.thickness')}
                value={el.strokeWidth ?? 4}
                min={1}
                max={12}
                format={(v) => `${v}px`}
                onChange={(v) => onUpdateElement?.({ strokeWidth: v })}
              />

              <Field label={t('inspector.arrow.color')} className="mt-3">
                <div className="flex items-center gap-2">
                  <ColorSwatchRow
                    colors={['#1a1a1a', '#f97316', '#ef4444', '#1d4ed8', '#22c55e', '#a855f7']}
                    value={el.color || '#1a1a1a'}
                    onChange={(c) => onUpdateElement?.({ color: c })}
                    size={22}
                  />
                  <label
                    className="relative w-[22px] h-[22px] rounded-md border border-border overflow-hidden cursor-pointer shrink-0"
                    title={t('inspector.arrow.color')}
                    style={{ background: el.color || '#1a1a1a' }}
                  >
                    <input
                      type="color"
                      value={el.color || '#1a1a1a'}
                      onChange={(e) => onUpdateElement?.({ color: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      aria-label={t('inspector.arrow.color')}
                    />
                  </label>
                </div>
              </Field>

              {/* Heads — start & end side by side */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">{t('inspector.arrow.startHead')}</label>
                  <SegmentedControl
                    ariaLabel={t('inspector.arrow.startHead')}
                    value={el.startHead ?? 'none'}
                    onChange={(v) => onUpdateElement?.({ startHead: v as 'arrow' | 'none' | 'bar' | 'dot' })}
                    options={[
                      { value: 'none', label: <span title={t('inspector.arrow.headNone')}><HeadNoneIcon className="w-3.5 h-3.5" /></span> },
                      { value: 'arrow', label: <span title={t('inspector.arrow.headArrow')} className="inline-block scale-x-[-1]"><HeadArrowIcon className="w-3.5 h-3.5" /></span> },
                      { value: 'bar', label: <span title={t('inspector.arrow.headBar')} className="inline-block scale-x-[-1]"><HeadBarIcon className="w-3.5 h-3.5" /></span> },
                      { value: 'dot', label: <span title={t('inspector.arrow.headDot')} className="inline-block scale-x-[-1]"><HeadDotIcon className="w-3.5 h-3.5" /></span> },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">{t('inspector.arrow.endHead')}</label>
                  <SegmentedControl
                    ariaLabel={t('inspector.arrow.endHead')}
                    value={el.endHead ?? 'arrow'}
                    onChange={(v) => onUpdateElement?.({ endHead: v as 'arrow' | 'none' | 'bar' | 'dot' })}
                    options={[
                      { value: 'none', label: <span title={t('inspector.arrow.headNone')}><HeadNoneIcon className="w-3.5 h-3.5" /></span> },
                      { value: 'arrow', label: <span title={t('inspector.arrow.headArrow')}><HeadArrowIcon className="w-3.5 h-3.5" /></span> },
                      { value: 'bar', label: <span title={t('inspector.arrow.headBar')}><HeadBarIcon className="w-3.5 h-3.5" /></span> },
                      { value: 'dot', label: <span title={t('inspector.arrow.headDot')}><HeadDotIcon className="w-3.5 h-3.5" /></span> },
                    ]}
                  />
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-1.5 mt-2.5">
                <button
                  onClick={() => onUpdateElement?.({ startHead: 'arrow', endHead: 'arrow' })}
                  className="flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md bg-surface2 border border-border text-text hover:border-accent hover:text-accent transition-colors"
                >
                  {t('inspector.arrow.doubleHead')}
                </button>
                <button
                  onClick={() => onUpdateElement?.({ startHead: 'none', endHead: 'none' })}
                  className="flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md bg-surface2 border border-border text-text hover:border-accent hover:text-accent transition-colors"
                >
                  {t('inspector.arrow.hideHeads')}
                </button>
                {onSetArrowDefault && (
                  <button
                    onClick={onSetArrowDefault}
                    className="shrink-0 px-2 py-1.5 rounded-md border border-dashed border-border text-muted hover:text-accent hover:border-accent transition-colors"
                    title={t('inspector.setAsDefaultHint')}
                    aria-label={t('inspector.setAsDefault')}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  </button>
                )}
              </div>
            </Section>
          </>
        )}

        {/* ── Zone ── */}
        {el.type === 'zone' && (
          <Section title={t('inspector.zone.border')} collapsible={false}>
            <Field label={t('inspector.zone.borderStyle')} className="mb-3">
              <SegmentedControl
                ariaLabel={t('inspector.zone.borderStyle')}
                value={el.borderStyle ?? 'solid'}
                onChange={(v) => onUpdateElement?.({ borderStyle: v as 'solid' | 'dashed' | 'none' })}
                options={[
                  { value: 'solid', label: <span className="flex items-center gap-1.5"><LineSolidIcon className="w-4 h-4" />{t('inspector.zone.solid')}</span> },
                  { value: 'dashed', label: <span className="flex items-center gap-1.5"><LineDashedIcon className="w-4 h-4" />{t('inspector.zone.dashed')}</span> },
                  { value: 'none', label: <span className="flex items-center gap-1.5"><LineNoneIcon className="w-4 h-4" />{t('inspector.zone.none')}</span> },
                ]}
              />
            </Field>

            <div className={(el.borderStyle ?? 'solid') === 'none' ? 'opacity-50 pointer-events-none' : ''}>
              <Slider
                label={t('inspector.zone.borderWidth')}
                value={el.borderWidth ?? 3}
                min={1}
                max={8}
                disabled={(el.borderStyle ?? 'solid') === 'none'}
                format={(v) => `${v}px`}
                onChange={(v) => onUpdateElement?.({ borderWidth: v })}
              />

              <Field label={t('inspector.zone.borderColor')} className="mt-3">
                <div className="flex items-center gap-2">
                  <ColorSwatchRow
                    colors={['#22c55e', '#ef4444', '#eab308', '#3b82f6', '#a855f7', '#f97316']}
                    value={el.borderColor || '#22c55e'}
                    onChange={(c) => onUpdateElement?.({ borderColor: c })}
                    size={22}
                  />
                  <label className="relative w-[22px] h-[22px] rounded-md border border-border overflow-hidden cursor-pointer shrink-0" title={t('inspector.zone.borderColor')} style={{ background: el.borderColor || '#22c55e' }}>
                    <input
                      type="color"
                      value={el.borderColor || '#22c55e'}
                      onChange={(e) => onUpdateElement?.({ borderColor: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      aria-label={t('inspector.zone.borderColor')}
                    />
                  </label>
                </div>
              </Field>
            </div>

            <SettingRow
              className="mt-1"
              label={t('inspector.zone.corners')}
              control={<Toggle checked={!!el.showCorners} onChange={() => onUpdateElement?.({ showCorners: !el.showCorners })} ariaLabel={t('inspector.zone.corners')} />}
            />
            {onSetZoneDefault && (
              <button
                onClick={onSetZoneDefault}
                className="mt-2 w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs font-medium rounded-md border border-dashed border-border text-muted hover:text-accent hover:border-accent transition-colors"
                title={t('inspector.setAsDefaultHint')}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                {t('inspector.setAsDefault')}
              </button>
            )}
          </Section>
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
  
  const layers: { key: LayerType; color: string }[] = [
    { key: 'homePlayers', color: '#e63946' },
    { key: 'awayPlayers', color: '#457b9d' },
    { key: 'ball', color: '#ffffff' },
    { key: 'arrows', color: '#888888' },
    { key: 'zones', color: '#888888' },
    { key: 'labels', color: '#888888' },
    { key: 'equipment', color: '#888888' },
    { key: 'drawings', color: '#888888' },
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
  onToggleSelectedLock,
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
  onSetArrowDefault,
  onSetZoneDefault,
  width = DEFAULT_INSPECTOR_WIDTH,
  minWidth = MIN_INSPECTOR_WIDTH,
  maxWidth = MAX_INSPECTOR_WIDTH,
  onWidthChange,
  activeTab: controlledActiveTab,
  onActiveTabChange,
}) => {
  const { t } = useTranslation();
  const [localActiveTab, setLocalActiveTab] = useState<TabType>('props');
  // A8: use controlled tab if provided, otherwise local state
  const activeTab = controlledActiveTab ?? localActiveTab;
  const setActiveTab = useCallback((tab: TabType) => {
    setLocalActiveTab(tab);
    onActiveTabChange?.(tab);
  }, [onActiveTabChange]);
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

  // ─── Drag handle: resize sidebar width by dragging its left edge ───
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    const drag = dragStateRef.current;
    if (!drag || !onWidthChange) return;
    // Sidebar is anchored to the right edge, so dragging the left edge LEFT
    // (negative delta) should INCREASE the width.
    const delta = drag.startX - e.clientX;
    const next = Math.max(minWidth, Math.min(maxWidth, drag.startWidth + delta));
    onWidthChange(next);
  }, [onWidthChange, minWidth, maxWidth]);

  const handleResizeMouseUp = useCallback(() => {
    dragStateRef.current = null;
    window.removeEventListener('mousemove', handleResizeMouseMove);
    window.removeEventListener('mouseup', handleResizeMouseUp);
  }, [handleResizeMouseMove]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (!onWidthChange) return;
    e.preventDefault();
    dragStateRef.current = { startX: e.clientX, startWidth: width };
    window.addEventListener('mousemove', handleResizeMouseMove);
    window.addEventListener('mouseup', handleResizeMouseUp);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [handleResizeMouseMove, handleResizeMouseUp]);

  // ─── Shared tab content renderer ─────────────────────────────────────
  const renderTabContent = () => {
    return activeTab === 'props' ? (
      <PropsTab
        selectedCount={selectedCount}
        selectedElement={selectedElement}
        onUpdateElement={onUpdateElement}
        onToggleSelectedLock={onToggleSelectedLock}
        onQuickAction={onQuickAction}
        playerOrientationSettings={playerOrientationSettings}
        onUpdatePlayerOrientation={onUpdatePlayerOrientation}
        labelInputRef={labelInputRef}
        onToggleAutoNumbering={onToggleAutoNumbering}
        isAutoNumbering={isAutoNumbering}
        onRenumberArrows={onRenumberArrows}
        onUpdateSelectedElements={onUpdateSelectedElements}
        onSetArrowDefault={onSetArrowDefault}
        onSetZoneDefault={onSetZoneDefault}
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

        <div
          className={`flex flex-col h-full relative ${isOpen ? 'overflow-hidden' : 'w-0 overflow-hidden'}`}
          style={isOpen ? { width } : undefined}
        >
          {/* RESIZE HANDLE — left edge, drag to resize the sidebar's width */}
          {isOpen && onWidthChange && (
            <div
              onMouseDown={handleResizeMouseDown}
              className="absolute top-0 left-0 bottom-0 w-2 -translate-x-1/2 cursor-col-resize group flex items-center justify-center z-10"
              title={t('inspector.resize')}
            >
              <div className="w-1 h-10 rounded-full bg-border group-hover:bg-accent transition-colors" />
            </div>
          )}
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
