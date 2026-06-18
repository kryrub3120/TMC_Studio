/**
 * TutorialOverlay - guided first-run Coach Tour.
 * Uses a spotlight, directional arrow, keycaps and small product demos.
 * Role-aware: adapts content per plan (guest/free/pro/team).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getStepsForPlan, type TutorialStep, type Plan } from './tutorialSteps';
import { useTranslation } from './i18n.js';

export interface TutorialOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
  onComplete: () => void;
  /** User's plan for role-aware content. Defaults to 'guest'. */
  plan?: Plan;
  /**
   * Called whenever the active step changes (and on first show), so the host
   * app can REVEAL the real element the step describes — e.g. open the
   * Inspector, expand the Squad Bench, or grow the bottom animation bar.
   * The overlay then re-measures the target once the panel has opened.
   */
  onStepShow?: (step: TutorialStep, index: number) => void;
}

interface TourRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourPoint {
  x: number;
  y: number;
}

const SPOTLIGHT_PAD = 10;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

const getCenter = (rect: TourRect): TourPoint => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});

const getPath = (from: TourPoint, to: TourPoint) => {
  const dx = to.x - from.x;
  const c1 = { x: from.x + dx * 0.45, y: from.y };
  const c2 = { x: to.x - dx * 0.25, y: to.y };
  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
};

const KeycapRail: React.FC<{ keycaps?: string[] }> = ({ keycaps }) => {
  if (!keycaps?.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {keycaps.map((key, index) => (
        <span
          key={`${key}-${index}`}
          className="tour-keycap inline-flex min-w-[28px] items-center justify-center rounded-md border border-border bg-surface2 px-2 py-1 text-[11px] font-semibold text-text shadow-sm"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          {key}
        </span>
      ))}
    </div>
  );
};

const DemoHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="mb-2 flex items-center justify-between">
    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</span>
    <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)]" />
  </div>
);

// ─── Step 1: Shortcuts / Players Demo ──────────────────────────────
const ShortcutDemo = () => {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-bg/60 p-3">
      <DemoHeader label={t('tutorial.demos.fastInput')} />
      <div className="space-y-1.5">
        {[
          ['P', t('tutorial.demos.homePlayer')],
          ['Shift+P', t('tutorial.demos.awayPlayer')],
          ['1-6', t('tutorial.demos.formation')],
        ].map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 rounded-md bg-surface/80 px-2 py-1.5">
            <span className="w-16 rounded border border-border bg-surface2 py-0.5 text-center text-[11px] font-bold text-accent">
              {key}
            </span>
            <span className="text-[11px] text-text">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Step 2: Arrows Demo ───────────────────────────────────────────
const ArrowsDemo = () => {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-bg/60 p-3">
      <DemoHeader label={t('tutorial.demos.arrows')} />
      <div className="space-y-2">
        {[
          { key: 'A', color: 'bg-[#1a1a1a]', label: t('tutorial.demos.passArrow') },
          { key: 'R', color: 'bg-orange-500', label: t('tutorial.demos.runArrow') },
          { key: 'S', color: 'bg-red-500', label: t('tutorial.demos.shootArrow') },
        ].map(({ key, color, label }) => (
          <div key={key} className="flex items-center gap-2 rounded-md bg-surface/80 px-2 py-1.5">
            <span className="w-7 rounded border border-border bg-surface2 py-0.5 text-center text-[11px] font-bold text-accent">
              {key}
            </span>
            <div className={`h-0.5 w-8 rounded ${color}`} />
            <span className="text-[11px] text-text">{label}</span>
          </div>
        ))}
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
          <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono">Shift+N</span>
          <span>{t('tutorial.demos.autoNumber')}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Step 3: Orientation + Vision Demo ─────────────────────────────
const OrientationDemo = () => (
  <div className="relative h-28 overflow-hidden rounded-lg border border-border bg-[linear-gradient(90deg,rgba(46,230,166,.12)_1px,transparent_1px),linear-gradient(0deg,rgba(46,230,166,.12)_1px,transparent_1px)] bg-[size:18px_18px]">
    <div className="absolute inset-x-5 top-1/2 h-px bg-pitch-lines/50" />
    <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-pitch-lines/50" />
    <div className="tour-orient absolute left-[46%] top-[38%]">
      <div className="absolute -left-7 -top-7 h-14 w-14 rounded-full bg-accent/10 [clip-path:polygon(50%_50%,100%_20%,100%_80%)]" />
      <div className="relative h-8 w-8 rounded-full border-2 border-white bg-team-home shadow-lg">
        <div className="absolute left-1/2 top-0 h-3 w-1 -translate-x-1/2 rounded bg-white" />
      </div>
    </div>
    {/* Second player showing vision off */}
    <div className="absolute right-[18%] top-[55%] opacity-50">
      <div className="h-6 w-6 rounded-full border border-white/40 bg-team-away" />
    </div>
  </div>
);

// ─── Step 4: Equipment + Zones Demo ────────────────────────────────
const EquipmentDemo = () => (
  <div className="relative h-28 rounded-lg border border-border bg-pitch/30 p-3">
    {/* Goal */}
    <div className="absolute left-4 top-5 h-10 w-14 rounded-sm border-2 border-white/80" />
    {/* Cones */}
    <div className="absolute bottom-5 left-20 flex gap-1.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className="h-0 w-0 border-x-[6px] border-b-[14px] border-x-transparent border-b-orange-400" />
      ))}
    </div>
    {/* Ladder */}
    <div className="absolute right-14 top-6 grid grid-cols-3 gap-0.5">
      {Array.from({ length: 6 }).map((_, index) => (
        <span key={index} className="h-3 w-4 rounded-sm border border-white/60" />
      ))}
    </div>
    {/* Zone */}
    <div className="absolute bottom-4 right-4 h-8 w-16 rounded-md border-2 border-dashed border-red-400/60 bg-red-400/10" />
    {/* Hurdle */}
    <div className="absolute bottom-4 left-4 h-5 w-10 rounded-t-lg border-2 border-muted" />
  </div>
);

// ─── Step 5: Squad Bench Demo ──────────────────────────────────────
const SquadDemo = () => {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-bg/60 p-3">
      <DemoHeader label={t('tutorial.demos.squad')} />
      <div className="flex items-center gap-2">
        {[
          { name: 'Smith', num: 9, color: 'bg-team-home' },
          { name: 'Jones', num: 10, color: 'bg-team-home' },
          { name: 'Lee', num: 7, color: 'bg-team-away' },
        ].map((player) => (
          <div
            key={player.num}
            className="tour-float flex flex-col items-center gap-1 rounded-md border border-border bg-surface px-2 py-1.5"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${player.color} text-[10px] font-bold text-white`}>
              {player.num}
            </div>
            <span className="truncate text-[9px] text-text">{player.name}</span>
          </div>
        ))}
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-muted text-muted">
          +
        </div>
      </div>
    </div>
  );
};

// ─── Step 6: Steps & Animation Demo ────────────────────────────────
const StepsDemo = () => {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-bg/60 p-3">
      <DemoHeader label={t('tutorial.demos.steps')} />
      {/* Timeline */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3].map((step, index) => (
          <div key={step} className="flex items-center gap-1.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-md border text-[11px] font-bold ${
              index === 0 ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-surface2 text-muted'
            }`}>
              {step}
            </div>
            {index < 2 && <div className="h-px w-3 bg-border" />}
          </div>
        ))}
      </div>
      {/* Playback controls */}
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
        <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono">Space</span>
        <span>{t('tutorial.demos.play')}</span>
        <span className="text-border">|</span>
        <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono">N</span>
        <span>{t('tutorial.demos.newStep')}</span>
        <span className="text-border">|</span>
        <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono">L</span>
        <span>{t('tutorial.demos.loop')}</span>
      </div>
    </div>
  );
};

// ─── Step 7: Save & Projects Demo ──────────────────────────────────
const SaveDemo = () => {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-bg/60 p-3">
      <DemoHeader label={t('tutorial.demos.save')} />
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-surface2 px-1.5 py-0.5 text-[10px] font-mono font-bold text-accent">⌘S</span>
          <span className="text-[11px] text-text">{t('tutorial.demos.saveShortcut')}</span>
          <span className="ml-auto h-2 w-2 rounded-full bg-green-500" />
        </div>
        <div className="flex items-center gap-2 rounded-md bg-surface/80 px-2 py-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10 text-[10px] text-accent">📁</span>
          <div className="flex-1">
            <div className="text-[11px] font-medium text-text">{t('tutorial.demos.myProject')}</div>
            <div className="text-[9px] text-muted">{t('tutorial.demos.justNow')}</div>
          </div>
          <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[9px] text-green-500">{t('tutorial.demos.saved')}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Step 8: Export Demo ───────────────────────────────────────────
const ExportDemo = () => {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-bg/60 p-3">
      <DemoHeader label={t('tutorial.demos.output')} />
      <div className="flex items-center gap-2">
        {['PNG', 'PDF', 'GIF'].map((format, index) => (
          <span
            key={format}
            className="tour-pop rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {format}
          </span>
        ))}
        <span className="h-px flex-1 bg-border" />
        <span className="rounded-md bg-surface2 px-2 py-1 text-[11px] text-text">{t('tutorial.demos.share')}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
        <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono">?</span>
        <span>{t('tutorial.demos.shortcutSheet')}</span>
      </div>
    </div>
  );
};

// ─── Step 9: Team / Club Admin Demo ────────────────────────────────
const TeamDemo = () => {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-bg/60 p-3">
      <DemoHeader label={t('tutorial.demos.team')} />
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-md bg-surface/80 px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
            AK
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-medium text-text">Alex K.</div>
            <div className="text-[9px] text-accent font-medium">{t('tutorial.demos.admin')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-surface/80 px-2 py-1.5 opacity-70">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-team-away/30 text-[10px] font-bold text-team-away">
            SJ
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-medium text-text">Sam J.</div>
            <div className="text-[9px] text-muted">{t('tutorial.demos.member')}</div>
          </div>
          <span className="rounded bg-surface2 px-1.5 py-0.5 text-[9px] text-muted">{t('tutorial.demos.active')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-accent">
          <span className="rounded-md border border-accent/30 px-2 py-1 font-medium">{t('tutorial.demos.inviteMember')}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * TourHand — animated hand/cursor that physically points at the spotlighted target.
 * `tap` = pulse/tap motion (default). `drag` = drag-and-drop motion (squad step).
 */
const TourHand: React.FC<{ rect: TourRect; variant: 'tap' | 'drag' }> = ({ rect, variant }) => {
  const x = rect.left + rect.width * 0.5;
  const y = rect.top + rect.height * 0.6;
  return (
    <div
      className="pointer-events-none absolute"
      style={{ top: y, left: x, zIndex: 1 }}
      aria-hidden="true"
    >
      {/* click ripple */}
      <span className="tour-hand-ripple absolute -left-4 -top-4 block h-12 w-12 rounded-full border-2 border-accent/70" />
      {/* hand cursor */}
      <div className={variant === 'drag' ? 'tour-hand-drag' : 'tour-hand-tap'}>
        <svg width="38" height="38" viewBox="0 0 32 32" className="drop-shadow-[0_3px_8px_rgba(0,0,0,0.5)]">
          <path
            d="M14 3.6a2 2 0 0 1 4 0V14h1.4V8.6a2 2 0 0 1 4 0V16h1.4v-2.6a2 2 0 0 1 4 0v7.8c0 5-3.4 8.2-8.4 8.2h-2c-3 0-4.9-1.3-6.5-3.5l-4.1-5.7a2 2 0 0 1 3.2-2.4L14 17.2V3.6Z"
            fill="#FFFFFF"
            stroke="#0B1220"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

const StepDemo: React.FC<{ step: TutorialStep }> = ({ step }) => {
  switch (step.demo) {
    case 'shortcuts':
      return <ShortcutDemo />;
    case 'arrows':
      return <ArrowsDemo />;
    case 'orientation':
      return <OrientationDemo />;
    case 'equipment':
      return <EquipmentDemo />;
    case 'squad':
      return <SquadDemo />;
    case 'steps':
      return <StepsDemo />;
    case 'save':
      return <SaveDemo />;
    case 'export':
      return <ExportDemo />;
    case 'team':
      return <TeamDemo />;
    default:
      return <ShortcutDemo />;
  }
};

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isVisible,
  onDismiss,
  onComplete,
  plan = 'guest',
  onStepShow,
}) => {
  const { t } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipSize, setTooltipSize] = useState({ width: 360, height: 300 });
  const [targetRect, setTargetRect] = useState<TourRect | null>(null);
  const settleTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const steps = React.useMemo(() => getStepsForPlan(plan), [plan]);
  const currentStep: TutorialStep | undefined = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  const clearSettle = useCallback(() => {
    settleTimers.current.forEach(clearTimeout);
    settleTimers.current = [];
  }, []);

  const repositionTooltip = useCallback(() => {
    if (!currentStep) return;

    const targetEl = currentStep.targetSelector
      ? document.querySelector(currentStep.targetSelector)
      : null;
    const rect = targetEl?.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const compact = vw < 520;
    const tooltipW = Math.min(compact ? 320 : 380, vw - 24);
    const tooltipH = tooltipRef.current?.offsetHeight ?? 300;

    setTooltipSize({ width: tooltipW, height: tooltipH });

    if (!rect) {
      setTargetRect(null);
      setTooltipPosition({
        top: clamp(vh / 2 - tooltipH / 2, 12, Math.max(12, vh - tooltipH - 12)),
        left: clamp(vw / 2 - tooltipW / 2, 12, Math.max(12, vw - tooltipW - 12)),
      });
      return;
    }

    const nextRect = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
    setTargetRect(nextRect);

    let top = rect.top + rect.height / 2 - tooltipH / 2;
    let left = rect.left - tooltipW - 28;

    switch (currentStep.position) {
      case 'top':
        top = rect.top - tooltipH - 28;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case 'bottom':
        top = rect.bottom + 28;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.right + 28;
        break;
      case 'left':
      default:
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left - tooltipW - 28;
        break;
    }

    if (left < 12 && currentStep.position === 'left') {
      left = rect.right + 28;
    }
    if (left + tooltipW > vw - 12 && currentStep.position === 'right') {
      left = rect.left - tooltipW - 28;
    }
    if (top < 12 && currentStep.position === 'top') {
      top = rect.bottom + 28;
    }
    if (top + tooltipH > vh - 12 && currentStep.position === 'bottom') {
      top = rect.top - tooltipH - 28;
    }

    setTooltipPosition({
      top: clamp(top, 12, Math.max(12, vh - tooltipH - 12)),
      left: clamp(left, 12, Math.max(12, vw - tooltipW - 12)),
    });
  }, [currentStep]);

  useEffect(() => {
    if (!isVisible) return;

    const frame = requestAnimationFrame(repositionTooltip);
    window.addEventListener('resize', repositionTooltip);
    window.addEventListener('scroll', repositionTooltip, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', repositionTooltip);
      window.removeEventListener('scroll', repositionTooltip, true);
    };
  }, [isVisible, repositionTooltip]);

  // Keep latest callbacks in refs so the reveal effect can depend ONLY on the
  // step index — otherwise a parent re-render (new onStepShow identity) would
  // re-run it, re-fire the panel setters and spin a render loop.
  const onStepShowRef = useRef(onStepShow);
  onStepShowRef.current = onStepShow;
  const repositionRef = useRef(repositionTooltip);
  repositionRef.current = repositionTooltip;

  // Reveal the real element this step describes (open Inspector, expand Squad
  // Bench, grow the animation bar…) then re-measure as the panel animates open.
  // No auto-advance: the coach drives the tour at their own pace (Next / →).
  useEffect(() => {
    if (!isVisible) return;
    const step = steps[currentStepIndex];
    if (!step) return;
    onStepShowRef.current?.(step, currentStepIndex);
    clearSettle();
    [0, 80, 200, 360, 520].forEach((delay) => {
      settleTimers.current.push(setTimeout(() => repositionRef.current(), delay));
    });
    return clearSettle;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, currentStepIndex, steps]);

  useEffect(() => {
    if (isVisible) {
      setCurrentStepIndex(0);
    } else {
      clearSettle();
    }
  }, [clearSettle, isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const frame = requestAnimationFrame(repositionTooltip);
    return () => cancelAnimationFrame(frame);
  }, [currentStepIndex, isVisible, repositionTooltip]);

  const handleSkip = useCallback(() => {
    clearSettle();
    onDismiss();
  }, [clearSettle, onDismiss]);

  const handleNext = useCallback(() => {
    clearSettle();
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [clearSettle, isLastStep, onComplete]);

  const handlePrev = useCallback(() => {
    clearSettle();
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, [clearSettle]);

  // Keyboard navigation: →/Enter advance, ← back, Esc skip.
  useEffect(() => {
    if (!isVisible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); handleNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
      else if (e.key === 'Escape') { e.preventDefault(); handleSkip(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isVisible, handleNext, handlePrev, handleSkip]);

  if (!isVisible || !currentStep) return null;

  const spotlightStyle = targetRect
    ? {
        top: targetRect.top - SPOTLIGHT_PAD,
        left: targetRect.left - SPOTLIGHT_PAD,
        width: targetRect.width + SPOTLIGHT_PAD * 2,
        height: targetRect.height + SPOTLIGHT_PAD * 2,
      }
    : undefined;

  const cardCenter = {
    x: tooltipPosition.left + tooltipSize.width / 2,
    y: tooltipPosition.top + tooltipSize.height / 2,
  };
  const targetCenter = targetRect ? getCenter(targetRect) : null;
  const arrowPath = targetCenter ? getPath(cardCenter, targetCenter) : null;
  const stepKey = `tutorial.steps.${currentStep.id}`;
  const stepTitle = t(`${stepKey}.title`);

  return (
    <div className="fixed inset-0 z-tutorial pointer-events-none">
      {targetRect ? (
        <>
          {/* Scrim with a punched-out highlight + glowing accent ring */}
          <div
            className="tour-spotlight absolute rounded-xl border-2 border-accent bg-transparent shadow-[0_0_0_9999px_rgba(5,10,22,0.72),0_0_30px_rgba(46,230,166,0.5)] transition-all duration-300 ease-out"
            style={spotlightStyle}
          />
          {/* Animated pulse ring drawing the eye to the revealed element */}
          <div
            className="tour-spotlight-pulse pointer-events-none absolute rounded-xl border-2 border-accent/60 transition-all duration-300 ease-out"
            style={spotlightStyle}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-[#050A16]/72 backdrop-blur-[1px]" />
      )}

      {targetRect && currentStep.targetLabel && (
        <div
          className="absolute rounded-full border border-accent/40 bg-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent shadow-lg"
          style={{
            top: Math.max(8, targetRect.top - 34),
            left: clamp(targetRect.left, 8, window.innerWidth - 160),
          }}
        >
          {t(`${stepKey}.target`)}
        </div>
      )}

      {targetRect && (
        <TourHand rect={targetRect} variant={currentStep.demo === 'squad' ? 'drag' : 'tap'} />
      )}

      {arrowPath && (
        <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <marker id="tour-arrowhead" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L8,3 z" fill="var(--color-accent)" />
            </marker>
          </defs>
          <path
            d={arrowPath}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="8 8"
            markerEnd="url(#tour-arrowhead)"
            className="tour-arrow"
          />
        </svg>
      )}

      <div
        ref={tooltipRef}
        className="pointer-events-auto absolute"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: tooltipSize.width,
        }}
        role="dialog"
        aria-label={t('tutorial.ariaStep', { id: currentStep.id, title: stepTitle })}
      >
        <div className="tour-card overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
          <div className="border-b border-border bg-bg/45 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                  {t(`${stepKey}.eyebrow`)}
                </div>
                <div className="mt-1 text-[11px] font-medium text-muted">
                  {t('tutorial.step', { current: currentStep.id, total: steps.length })}
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface2 hover:text-text"
                aria-label={t('tutorial.skip')}
              >
                {t('tutorial.skip')}
              </button>
            </div>
            <div className="flex gap-1">
              {steps.map((s, idx) => (
                <div
                  key={s.id}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    idx <= currentStepIndex ? 'bg-accent' : 'bg-surface2'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div>
              <h3 className="text-lg font-semibold leading-tight text-text">{stepTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(`${stepKey}.description`)}</p>
            </div>

            <KeycapRail keycaps={currentStep.keycaps} />
            {/* Only show the mock demo as a fallback when no real element is
                spotlighted — otherwise the revealed UI itself is the visual. */}
            {!targetRect && <StepDemo step={currentStep} />}

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="rounded-md px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface2 hover:text-text disabled:pointer-events-none disabled:opacity-35"
              >
                {t('tutorial.back')}
              </button>
              <button
                onClick={handleNext}
                className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-[#062016] shadow-lg shadow-accent/20 transition-transform hover:scale-[1.02] hover:bg-accent-hover"
              >
                {isLastStep ? t('tutorial.finish') : (t(`${stepKey}.cta`) || t('tutorial.next'))}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .tour-card {
          animation: tour-card-enter 220ms ease-out;
        }

        .tour-spotlight-pulse {
          animation: tour-spotlight-pulse 1800ms ease-out infinite;
        }

        @keyframes tour-spotlight-pulse {
          0% { opacity: 0.7; transform: scale(1); }
          70% { opacity: 0; transform: scale(1.06); }
          100% { opacity: 0; transform: scale(1.06); }
        }

        .tour-keycap {
          animation: tour-keycap-pop 520ms ease both;
        }

        .tour-arrow {
          animation: tour-arrow-draw 1300ms ease-in-out infinite;
        }

        .tour-float {
          animation: tour-float 1800ms ease-in-out infinite;
        }

        .tour-orient {
          animation: tour-orient 4200ms ease-in-out infinite;
          transform-origin: 16px 16px;
        }

        .tour-pop {
          animation: tour-keycap-pop 520ms ease both;
        }

        @keyframes tour-card-enter {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes tour-keycap-pop {
          from { opacity: 0; transform: translateY(6px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes tour-arrow-draw {
          0% { stroke-dashoffset: 28; opacity: 0.35; }
          45% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.35; }
        }

        @keyframes tour-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes tour-orient {
          0%, 100% { transform: rotate(-24deg); }
          50% { transform: rotate(42deg); }
        }

        .tour-hand-tap { animation: tour-hand-tap 1500ms ease-in-out infinite; transform-origin: 8px 8px; }
        .tour-hand-drag { animation: tour-hand-drag 2600ms ease-in-out infinite; transform-origin: 8px 8px; }
        .tour-hand-ripple { animation: tour-hand-ripple 1500ms ease-out infinite; }

        @keyframes tour-hand-tap {
          0%, 100% { transform: translate(0, 0) scale(1); }
          45% { transform: translate(-3px, -6px) scale(0.9); }
          60% { transform: translate(-3px, -6px) scale(0.9); }
        }

        @keyframes tour-hand-drag {
          0% { transform: translate(0, 0) scale(0.92); }
          15% { transform: translate(0, 0) scale(0.82); }
          70% { transform: translate(-60px, 90px) scale(0.82); }
          85% { transform: translate(-60px, 90px) scale(0.92); }
          100% { transform: translate(0, 0) scale(0.92); }
        }

        @keyframes tour-hand-ripple {
          0% { transform: scale(0.4); opacity: 0; }
          40% { opacity: 0.9; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .tour-hand-tap, .tour-hand-drag, .tour-hand-ripple, .tour-arrow, .tour-float, .tour-orient, .tour-spotlight-pulse { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default TutorialOverlay;
