/**
 * TutorialOverlay - guided first-run Coach Tour.
 * Uses a spotlight, directional arrow, keycaps and small product demos.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TUTORIAL_STEPS, type TutorialStep } from './tutorialSteps';

export interface TutorialOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
  onComplete: () => void;
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

const ShortcutDemo = () => (
  <div className="rounded-lg border border-border bg-bg/60 p-3">
    <DemoHeader label="Fast input" />
    <div className="space-y-1.5">
      {[
        ['P', 'Home player'],
        ['A', 'Pass arrow'],
        ['?', 'Shortcut sheet'],
      ].map(([key, label]) => (
        <div key={key} className="flex items-center gap-2 rounded-md bg-surface/80 px-2 py-1.5">
          <span className="w-7 rounded border border-border bg-surface2 py-0.5 text-center text-[11px] font-bold text-accent">
            {key}
          </span>
          <span className="text-[11px] text-text">{label}</span>
        </div>
      ))}
    </div>
  </div>
);

const InspectorDemo = () => (
  <div className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-border bg-bg/60 p-3">
    <div>
      <DemoHeader label="Inspector" />
      <div className="space-y-1.5">
        <div className="h-2 rounded bg-accent/70" />
        <div className="h-2 w-3/4 rounded bg-surface2" />
        <div className="h-2 w-1/2 rounded bg-surface2" />
      </div>
    </div>
    <div className="tour-float rounded-md border border-border bg-surface px-2 py-1.5 shadow-lg">
      <div className="mb-1 h-1.5 w-12 rounded bg-accent/70" />
      <div className="mb-1 h-1.5 w-10 rounded bg-surface2" />
      <div className="h-1.5 w-8 rounded bg-red-400/60" />
    </div>
  </div>
);

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
  </div>
);

const EquipmentDemo = () => (
  <div className="relative h-28 rounded-lg border border-border bg-pitch/30 p-3">
    <div className="absolute left-4 top-5 h-10 w-14 rounded-sm border-2 border-white/80" />
    <div className="absolute bottom-5 left-24 grid grid-cols-4 gap-1">
      {Array.from({ length: 8 }).map((_, index) => (
        <span key={index} className="h-1.5 w-4 rounded-full bg-yellow-300/90" />
      ))}
    </div>
    <div className="absolute right-14 top-7 flex gap-2">
      {[0, 1, 2].map((item) => (
        <span
          key={item}
          className="tour-pop h-0 w-0 border-x-[7px] border-b-[18px] border-x-transparent border-b-orange-400"
          style={{ animationDelay: `${item * 120}ms` }}
        />
      ))}
    </div>
    <div className="absolute bottom-5 right-5 h-5 w-12 rounded-t-lg border-2 border-muted" />
  </div>
);

const ExportDemo = () => (
  <div className="rounded-lg border border-border bg-bg/60 p-3">
    <DemoHeader label="Output" />
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
      <span className="rounded-md bg-surface2 px-2 py-1 text-[11px] text-text">Share</span>
    </div>
  </div>
);

const PremiumDemo = () => (
  <div className="grid grid-cols-3 gap-2">
    {['Projects', 'Cloud', 'Pro'].map((item, index) => (
      <div
        key={item}
        className="tour-pop rounded-lg border border-border bg-bg/60 p-2 text-center"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="mx-auto mb-2 h-6 w-6 rounded-full bg-accent/15 ring-1 ring-accent/30" />
        <div className="text-[10px] font-semibold text-text">{item}</div>
      </div>
    ))}
  </div>
);

const StepDemo: React.FC<{ step: TutorialStep }> = ({ step }) => {
  switch (step.demo) {
    case 'shortcuts':
      return <ShortcutDemo />;
    case 'inspector':
      return <InspectorDemo />;
    case 'orientation':
      return <OrientationDemo />;
    case 'equipment':
      return <EquipmentDemo />;
    case 'export':
      return <ExportDemo />;
    case 'premium':
      return <PremiumDemo />;
    default:
      return null;
  }
};

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isVisible,
  onDismiss,
  onComplete,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipSize, setTooltipSize] = useState({ width: 360, height: 300 });
  const [targetRect, setTargetRect] = useState<TourRect | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep: TutorialStep | undefined = TUTORIAL_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
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

  useEffect(() => {
    if (!isVisible || !currentStep) return;

    clearTimer();
    timerRef.current = setTimeout(() => {
      if (isLastStep) {
        onComplete();
      } else {
        setCurrentStepIndex((prev) => prev + 1);
      }
    }, currentStep.durationMs);

    return clearTimer;
  }, [clearTimer, currentStep, isLastStep, isVisible, onComplete]);

  useEffect(() => {
    if (isVisible) {
      setCurrentStepIndex(0);
    } else {
      clearTimer();
    }
  }, [clearTimer, isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const frame = requestAnimationFrame(repositionTooltip);
    return () => cancelAnimationFrame(frame);
  }, [currentStepIndex, isVisible, repositionTooltip]);

  const handleSkip = useCallback(() => {
    clearTimer();
    onDismiss();
  }, [clearTimer, onDismiss]);

  const handleNext = useCallback(() => {
    clearTimer();
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [clearTimer, isLastStep, onComplete]);

  const handlePrev = useCallback(() => {
    clearTimer();
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, [clearTimer]);

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

  return (
    <div className="fixed inset-0 z-tutorial pointer-events-none">
      {targetRect ? (
        <div
          className="absolute rounded-xl border border-accent/80 bg-transparent shadow-[0_0_0_9999px_rgba(5,10,22,0.68),0_0_28px_rgba(46,230,166,0.45)] transition-all duration-300"
          style={spotlightStyle}
        />
      ) : (
        <div className="absolute inset-0 bg-[#050A16]/70 backdrop-blur-[1px]" />
      )}

      {targetRect && (
        <div
          className="absolute rounded-xl border border-white/20 bg-accent/10 transition-all duration-300"
          style={spotlightStyle}
        />
      )}

      {targetRect && currentStep.targetLabel && (
        <div
          className="absolute rounded-full border border-accent/40 bg-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent shadow-lg"
          style={{
            top: Math.max(8, targetRect.top - 34),
            left: clamp(targetRect.left, 8, window.innerWidth - 160),
          }}
        >
          {currentStep.targetLabel}
        </div>
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
        aria-label={`Tutorial step ${currentStep.id}: ${currentStep.title}`}
      >
        <div className="tour-card overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
          <div className="border-b border-border bg-bg/45 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                  {currentStep.eyebrow}
                </div>
                <div className="mt-1 text-[11px] font-medium text-muted">
                  Step {currentStep.id} of {TUTORIAL_STEPS.length}
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface2 hover:text-text"
                aria-label="Skip tutorial"
              >
                Skip
              </button>
            </div>
            <div className="flex gap-1">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    idx <= currentStepIndex ? 'bg-accent' : 'bg-surface2'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div>
              <h3 className="text-lg font-semibold leading-tight text-text">{currentStep.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{currentStep.description}</p>
            </div>

            <KeycapRail keycaps={currentStep.keycaps} />
            <StepDemo step={currentStep} />

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="rounded-md px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface2 hover:text-text disabled:pointer-events-none disabled:opacity-35"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-[#062016] shadow-lg shadow-accent/20 transition-transform hover:scale-[1.02] hover:bg-accent-hover"
              >
                {isLastStep ? currentStep.cta ?? 'Start building' : currentStep.cta ?? 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .tour-card {
          animation: tour-card-enter 220ms ease-out;
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
      `}</style>
    </div>
  );
};

export default TutorialOverlay;
