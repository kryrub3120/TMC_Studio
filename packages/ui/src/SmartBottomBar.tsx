/**
 * SmartBottomBar - Contextual bottom bar with 3 modes
 * 
 * Modes:
 * 1. Empty canvas: quick actions + onboarding hints
 * 2. Editing: undo/redo + element info
 * 3. Animation: playback controls + step timeline (inline, no nesting)
 * 
 * Never shows github/external links. Pure utility.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { StepInfo, Duration } from './BottomStepsBar.js';
import { useTranslation } from './i18n.js';

export type { StepInfo, Duration };

// ─── Icons ────────────────────────────────────────────────────

const UndoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const RedoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const PlayerAddIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <line x1="17" y1="9" x2="21" y2="9" />
    <line x1="19" y1="7" x2="19" y2="11" />
  </svg>
);

const BallAddIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" fill="currentColor" />
  </svg>
);

const ArrowAddIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M18.5 14.5L19 16l1.5.5-1.5.5-.5 1.5-.5-1.5L16 16.5l1.5-.5.5-1.5z" />
    <path d="M8 16l.5 1.5L10 18l-1.5.5-.5 1.5-.5-1.5L6 18l1.5-.5L8 16z" />
  </svg>
);

const LayersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 22 8.5 12 15 2 8.5" />
    <polyline points="2 15.5 12 22 22 15.5" />
    <polyline points="2 11.5 12 18 22 11.5" />
  </svg>
);

// Animation icons (inline, no BottomStepsBar dependency)
const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const SkipBackIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="19 20 9 12 19 4 19 20" fill="currentColor" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);

const SkipForwardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

const LoopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────

export interface SmartBottomBarProps {
  /** Elements count on canvas (0 = empty mode) */
  elementCount: number;
  
  /** Undo/Redo */
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  
  /** Quick actions (shown in empty mode) */
  onAddPlayer?: () => void;
  onAddBall?: () => void;
  onAddArrow?: () => void;
  onOpenPalette?: () => void;
  
  /** Animation mode — when steps > 1, shows playback inline */
  animationEnabled: boolean;
  steps?: StepInfo[];
  currentStepIndex?: number;
  isPlaying?: boolean;
  isLooping?: boolean;
  duration?: number;
  onStepSelect?: (index: number) => void;
  onAddStep?: () => void;
  onDeleteStep?: (index: number) => void;
  onRenameStep?: (index: number, newName: string) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onPrevStep?: () => void;
  onNextStep?: () => void;
  onToggleLoop?: () => void;
  onDurationChange?: (duration: number) => void;
  
  /** Step counter for editing mode */
  stepInfo?: string;
  
  /** Animation progress 0-1 (for progress bar) */
  animationProgress?: number;

  /** Resizable height (px). Drag handle on top edge adjusts this. */
  height?: number;
  /** Min/max height for the drag handle (px) */
  minHeight?: number;
  maxHeight?: number;
  /** Called with the new height while/after dragging */
  onHeightChange?: (height: number) => void;
  /** Collapsed = thin strip, content hidden, click to expand */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;

  /** App version shown in the compact footer-links row (e.g. '0.5.0') */
  version?: string;
  /** Called when a footer legal link is clicked (privacy/terms/cookies) */
  onNavigate?: (path: string) => void;
}

const DEFAULT_HEIGHT = 64;
const DEFAULT_MIN_HEIGHT = 56;
const DEFAULT_MAX_HEIGHT = 200;
const COLLAPSED_HEIGHT = 10;
/** Height of the slim footer-links row appended below the main controls row */
const FOOTER_ROW_HEIGHT = 22;

// ─── Duration options ─────────────────────────────────────────

const DURATION_OPTIONS: { value: Duration; label: string }[] = [
  { value: 0.6, label: '0.6s' },
  { value: 0.8, label: '0.8s' },
  { value: 1.2, label: '1.2s' },
];

// ─── Quick Action Button ──────────────────────────────────────

const QuickActionBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  accent?: boolean;
}> = ({ icon, label, shortcut, onClick, accent }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
      transition-all duration-fast active:scale-95
      ${accent
        ? 'bg-accent text-white hover:bg-accent-hover shadow-sm shadow-accent/20'
        : 'bg-surface2 text-muted hover:text-text hover:bg-border border border-border'
      }
    `}
  >
    <span className="w-4 h-4 shrink-0">{icon}</span>
    <span className="hidden sm:inline">{label}</span>
    {shortcut && (
      <span className="hidden md:inline ml-1 text-[10px] text-muted/60 font-mono">
        {shortcut}
      </span>
    )}
  </button>
);

// ─── Component ────────────────────────────────────────────────

export const SmartBottomBar: React.FC<SmartBottomBarProps> = ({
  elementCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddPlayer,
  onAddBall,
  onAddArrow,
  onOpenPalette,
  animationEnabled,
  steps = [],
  currentStepIndex = 0,
  isPlaying = false,
  isLooping = false,
  duration = 0.8,
  onStepSelect,
  onAddStep,
  onDeleteStep,
  onRenameStep,
  onPlay,
  onPause,
  onPrevStep,
  onNextStep,
  onToggleLoop,
  onDurationChange,
  stepInfo,
  animationProgress = 0,
  height = DEFAULT_HEIGHT,
  minHeight = DEFAULT_MIN_HEIGHT,
  maxHeight = DEFAULT_MAX_HEIGHT,
  onHeightChange,
  collapsed = false,
  onToggleCollapsed,
  version,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const isEmpty = elementCount === 0;
  const hasAnimation = animationEnabled && steps.length >= 1;
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleDoubleClick = (index: number, currentLabel: string) => {
    if (!onRenameStep) return;
    setEditingIndex(index);
    setEditValue(currentLabel || t('bottomSteps.defaultName', { number: index + 1 }));
  };

  const finishEditing = () => {
    if (editingIndex !== null && onRenameStep && editValue.trim()) {
      onRenameStep(editingIndex, editValue.trim());
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') finishEditing();
    else if (e.key === 'Escape') { setEditingIndex(null); setEditValue(''); }
  };

  // ─── Drag handle: resize bar height by dragging its top edge ───
  const dragStateRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    const drag = dragStateRef.current;
    if (!drag || !onHeightChange) return;
    // Bar is anchored to the bottom of the viewport, so dragging the top
    // edge UP (negative delta) should INCREASE the height.
    const delta = drag.startY - e.clientY;
    const next = Math.max(minHeight, Math.min(maxHeight, drag.startHeight + delta));
    onHeightChange(next);
  }, [onHeightChange, minHeight, maxHeight]);

  const handleResizeMouseUp = useCallback(() => {
    dragStateRef.current = null;
    window.removeEventListener('mousemove', handleResizeMouseMove);
    window.removeEventListener('mouseup', handleResizeMouseUp);
  }, [handleResizeMouseMove]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (!onHeightChange || collapsed) return;
    e.preventDefault();
    dragStateRef.current = { startY: e.clientY, startHeight: height };
    window.addEventListener('mousemove', handleResizeMouseMove);
    window.addEventListener('mouseup', handleResizeMouseUp);
  };

  // Cleanup any leftover listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [handleResizeMouseMove, handleResizeMouseUp]);

  const barHeight = collapsed ? COLLAPSED_HEIGHT : height;

  return (
    <footer
      data-tour="timeline"
      className="w-full shrink-0 flex flex-col relative bg-surface border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.12)] z-bottombar overflow-hidden"
      style={{ height: barHeight, transition: dragStateRef.current ? 'none' : 'height 0.15s ease-out' }}
    >
      {/* DRAG HANDLE — top edge, drag to resize the bar's height */}
      {onHeightChange && !collapsed && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute top-0 left-0 right-0 h-2 -translate-y-1/2 cursor-row-resize group flex items-center justify-center z-10"
          title={t('smartBottom.resize')}
        >
          <div className="w-10 h-1 rounded-full bg-border group-hover:bg-accent transition-colors" />
        </div>
      )}

      {/* COLLAPSE/EXPAND toggle — small tab centered on the top edge */}
      {onToggleCollapsed && (
        <button
          onClick={onToggleCollapsed}
          className="absolute top-0 right-3 -translate-y-full px-2 py-0.5 rounded-t-md bg-surface border border-border border-b-0 text-muted hover:text-text transition-colors text-[10px] z-10"
          title={collapsed ? t('smartBottom.expand') : t('smartBottom.collapse')}
        >
          {collapsed ? '▲' : '▼'}
        </button>
      )}

      {collapsed ? null : (<>
      <div className="flex-1 min-h-0 flex items-center justify-between gap-2 px-2 overflow-hidden">
      {/* LEFT: Undo/Redo (always visible) */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={t('smartBottom.undo')}
        >
          <UndoIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={t('smartBottom.redo')}
        >
          <RedoIcon className="w-4 h-4" />
        </button>
      </div>

      {/* CENTER: Contextual content */}
      <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto min-w-0 px-2">
        {isEmpty ? (
          /* ─── MODE 1: Empty canvas — quick actions ─── */
          <div className="flex items-center gap-2 animate-fade-in">
            <QuickActionBtn
              icon={<PlayerAddIcon className="w-4 h-4" />}
              label={t('smartBottom.addPlayer')}
              shortcut="P"
              onClick={onAddPlayer}
              accent
            />
            <QuickActionBtn
              icon={<BallAddIcon className="w-4 h-4" />}
              label={t('smartBottom.addBall')}
              shortcut="B"
              onClick={onAddBall}
            />
            <QuickActionBtn
              icon={<ArrowAddIcon className="w-4 h-4" />}
              label={t('smartBottom.drawArrow')}
              shortcut="A"
              onClick={onAddArrow}
            />
            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
            <button
              onClick={onOpenPalette}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted hover:text-text hover:bg-surface2 transition-colors"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('smartBottom.allCommands')}</span>
            </button>
          </div>
        ) : hasAnimation ? (
          /* ─── MODE 2: Animation (playback + step chips) ─── */
          <div data-tour="steps" className="flex items-center gap-1 w-full justify-center animate-fade-in">
            {/* Playback controls */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={onPrevStep} disabled={currentStepIndex === 0}
                className="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title={t('bottomSteps.previous')}>
                <SkipBackIcon className="w-3.5 h-3.5" />
              </button>
              <button onClick={isPlaying ? onPause : onPlay}
                className="p-1.5 rounded-md bg-accent text-white hover:bg-accent-hover transition-colors"
                title={isPlaying ? t('bottomSteps.pause') : t('bottomSteps.play')}>
                {isPlaying ? <PauseIcon className="w-3.5 h-3.5" /> : <PlayIcon className="w-3.5 h-3.5" />}
              </button>
              <button onClick={onNextStep} disabled={currentStepIndex === steps.length - 1}
                className="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title={t('bottomSteps.next')}>
                <SkipForwardIcon className="w-3.5 h-3.5" />
              </button>
              <button onClick={onToggleLoop}
                className={`p-1.5 rounded-md transition-colors ${isLooping ? 'text-accent bg-accent/10' : 'text-muted hover:text-text hover:bg-surface2'}`}
                title={t('bottomSteps.loop')}>
                <LoopIcon className="w-3.5 h-3.5" />
              </button>
              {/* Duration */}
              <div className="relative ml-1">
                <button onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                  className="px-1.5 py-1 rounded-md text-[11px] text-muted hover:text-text hover:bg-surface2 border border-border transition-colors">
                  {duration}s
                </button>
                {showDurationDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDurationDropdown(false)} />
                    <div className="absolute bottom-full left-0 mb-1 py-1 bg-surface rounded-md shadow-lg border border-border z-20 min-w-[60px]">
                      {DURATION_OPTIONS.map((opt) => (
                        <button key={opt.value}
                          onClick={() => { onDurationChange?.(opt.value); setShowDurationDropdown(false); }}
                          className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${duration === opt.value ? 'text-accent bg-accent/10' : 'text-muted hover:text-text hover:bg-surface2'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-border mx-1 shrink-0" />

            {/* Step chips (scrollable) */}
            <div className="flex items-center gap-1.5 overflow-x-auto flex-1 justify-center min-w-0">
              {steps.map((step, index) => (
                <div key={step.id} className="group relative flex-shrink-0">
                  {editingIndex === index ? (
                    <input type="text" value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={finishEditing} onKeyDown={handleEditKeyDown}
                      autoFocus
                      className="px-2 py-1 rounded-full text-[11px] font-medium bg-surface border border-accent outline-none text-text min-w-[50px] max-w-[100px]" />
                  ) : (
                    <button onClick={() => onStepSelect?.(index)}
                      onDoubleClick={() => handleDoubleClick(index, step.label)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-fast
                        ${index === currentStepIndex ? 'bg-accent text-white shadow-sm' : 'bg-surface2 text-muted hover:text-text hover:bg-border'}
                        ${onRenameStep ? 'pr-6 group-hover:pr-7' : ''}`}>
                      {step.label || t('bottomSteps.defaultName', { number: index + 1 })}
                    </button>
                  )}
                  {steps.length > 1 && editingIndex !== index && (
                    <button onClick={(e) => { e.stopPropagation(); onDeleteStep?.(index); }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-fast
                        text-muted hover:text-red-400 hover:bg-red-500/10">
                      <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  )}
                </div>
              ))}
              {/* Add step */}
              <button onClick={onAddStep}
                className="shrink-0 w-6 h-6 rounded-full border-2 border-dashed border-border text-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center"
                title={t('bottomSteps.add')}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
            </div>
          </div>
        ) : (
          /* ─── MODE 3: Editing without animation ─── */
          <div className="flex items-center gap-3 text-xs text-muted animate-fade-in">
            <LayersIcon className="w-3.5 h-3.5 text-accent" />
            <span className="tabular-nums">{t('smartBottom.elements', { count: elementCount })}</span>
            <span className="w-px h-4 bg-border" />
            <span>{stepInfo || t('smartBottom.editing')}</span>
          </div>
        )}
      </div>

      {/* RIGHT: Step counter (animation mode) */}
      {hasAnimation && (
        <div className="flex items-center gap-3 text-[11px] text-muted tabular-nums shrink-0">
          {/* Mini progress bar */}
          <div className="w-16 h-1.5 bg-surface2 rounded-full overflow-hidden hidden md:block">
            <div
              className="h-full bg-accent rounded-full transition-[width] duration-75"
              style={{ width: `${(currentStepIndex + animationProgress) / steps.length * 100}%` }}
            />
          </div>
          <span className="hidden sm:block">{currentStepIndex + 1}/{steps.length}</span>
        </div>
      )}
      </div>

      {/* Compact footer-links row (merged from app Footer) */}
      <div
        className="shrink-0 flex items-center justify-center gap-3 px-3 text-[10px] text-muted border-t border-border/50 overflow-hidden"
        style={{ height: FOOTER_ROW_HEIGHT }}
      >
        <div className="flex items-center gap-1.5 truncate shrink-0">
          <span className="font-semibold text-text">TMC Studio</span>
          {version && <span className="opacity-70">v{version}</span>}
        </div>
        <span className="hidden sm:inline w-px h-3 bg-border shrink-0" />
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <a href="/privacy" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('/privacy'); } }} className="hover:text-text transition-colors cursor-pointer">
            {t('footer.privacy')}
          </a>
          <a href="/terms" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('/terms'); } }} className="hover:text-text transition-colors cursor-pointer">
            {t('footer.terms')}
          </a>
          <a href="/cookies" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('/cookies'); } }} className="hover:text-text transition-colors cursor-pointer">
            {t('footer.cookies')}
          </a>
          <a href="mailto:support@tacticsmadeclear.store" className="hover:text-text transition-colors">
            {t('footer.contact')}
          </a>
          <a href="https://x.com/tmcstudio" target="_blank" rel="noopener noreferrer" className="hover:text-text transition-colors" aria-label={t('footer.social.x')}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a href="https://www.linkedin.com/company/tmcstudio" target="_blank" rel="noopener noreferrer" className="hover:text-text transition-colors" aria-label={t('footer.social.linkedin')}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>
      </div>
      </>)}
    </footer>
  );
};

export default SmartBottomBar;
