/**
 * TutorialOverlay - 5-step tutorial overlay for new users
 * Auto-advances every 4s, user can skip at any time.
 * Shows only on empty board, once per user.
 * Uses z-tutorial z-index (above canvas/overlays, below modals).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TUTORIAL_STEPS, type TutorialStep } from './tutorialSteps';

export interface TutorialOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
  onComplete: () => void;
  elementsCount: number;
}

/** Pointer arrow SVG pointing down */
const ArrowDown: React.FC = () => (
  <svg className="w-4 h-4 text-accent" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 12L3 7h10z" />
  </svg>
);

/** Pointer arrow SVG pointing up */
const ArrowUp: React.FC = () => (
  <svg className="w-4 h-4 text-accent" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 4L3 9h10z" />
  </svg>
);

/** Pointer arrow SVG pointing left */
const ArrowLeft: React.FC = () => (
  <svg className="w-4 h-4 text-accent" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 8L9 3v10z" />
  </svg>
);

/** Pointer arrow SVG pointing right */
const ArrowRight: React.FC = () => (
  <svg className="w-4 h-4 text-accent" viewBox="0 0 16 16" fill="currentColor">
    <path d="M12 8L7 3v10z" />
  </svg>
);

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isVisible,
  onDismiss,
  onComplete,
  elementsCount,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep: TutorialStep | undefined = TUTORIAL_STEPS[currentStepIndex];

  // Position tooltip relative to target or center
  const repositionTooltip = useCallback(() => {
    if (!currentStep) return;

    let targetEl: Element | null = null;
    if (currentStep.targetSelector) {
      targetEl = document.querySelector(currentStep.targetSelector);
    }

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const tooltipW = tooltipRef.current?.offsetWidth ?? 240;
      const tooltipH = tooltipRef.current?.offsetHeight ?? 80;

      let top = 0, left = 0;
      switch (currentStep.position) {
        case 'top':
          top = rect.top - tooltipH - 12;
          left = rect.left + rect.width / 2 - tooltipW / 2;
          break;
        case 'bottom':
          top = rect.bottom + 12;
          left = rect.left + rect.width / 2 - tooltipW / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipH / 2;
          left = rect.left - tooltipW - 12;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipH / 2;
          left = rect.right + 12;
          break;
      }

      // Clamp to viewport
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      left = Math.max(8, Math.min(left, vw - tooltipW - 8));
      top = Math.max(8, Math.min(top, vh - tooltipH - 8));

      setTooltipPosition({ top, left });
    } else {
      // Fallback: center of viewport
      setTooltipPosition({
        top: window.innerHeight / 2 - 40,
        left: window.innerWidth / 2 - 120,
      });
    }
  }, [currentStep]);

  // Reposition on resize/scroll
  useEffect(() => {
    if (!isVisible) return;
    repositionTooltip();
    window.addEventListener('resize', repositionTooltip);
    window.addEventListener('scroll', repositionTooltip, true);
    return () => {
      window.removeEventListener('resize', repositionTooltip);
      window.removeEventListener('scroll', repositionTooltip, true);
    };
  }, [isVisible, repositionTooltip]);

  // Auto-advance timer
  useEffect(() => {
    if (!isVisible) return;

    const step = TUTORIAL_STEPS[currentStepIndex];
    if (!step) {
      onComplete();
      return;
    }

    timerRef.current = setTimeout(() => {
      if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        onComplete();
      }
    }, step.durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, currentStepIndex, onComplete]);

  // Reset step when visibility changes
  useEffect(() => {
    if (isVisible) {
      setCurrentStepIndex(0);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [isVisible]);

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onDismiss();
  }, [onDismiss]);

  const handleClick = useCallback(() => {
    // Click on tooltip does nothing — tutorial is display-only
  }, []);

  if (!isVisible || !currentStep) return null;

  // Don't show tutorial if there are elements on the board
  // (user loaded an existing project or already added elements)
  if (elementsCount > 0) return null;

  const ArrowComponent = currentStep.position === 'top' ? ArrowDown
    : currentStep.position === 'bottom' ? ArrowUp
    : currentStep.position === 'left' ? ArrowRight
    : ArrowLeft;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Tutorial tooltip */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-auto"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
        onClick={handleClick}
        role="dialog"
        aria-label={`Tutorial step ${currentStep.id}: ${currentStep.title}`}
      >
        <div className="bg-surface border border-border rounded-xl shadow-2xl p-4 w-[260px] animate-fade-in">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
              Step {currentStep.id} of {TUTORIAL_STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-[10px] text-muted hover:text-text px-2 py-0.5 rounded hover:bg-surface2 transition-colors"
              aria-label="Skip tutorial"
            >
              Skip
            </button>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-text mb-1">{currentStep.title}</h3>

          {/* Description */}
          <p className="text-xs text-muted leading-relaxed">{currentStep.description}</p>

          {/* Progress dots */}
          <div className="flex items-center gap-1 mt-3">
            {TUTORIAL_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-fast ${
                  idx === currentStepIndex
                    ? 'w-5 bg-accent'
                    : idx < currentStepIndex
                    ? 'w-2 bg-accent/40'
                    : 'w-2 bg-surface2'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center mt-0">
          <ArrowComponent />
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TutorialOverlay;