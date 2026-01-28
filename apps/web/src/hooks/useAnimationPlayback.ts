/**
 * useAnimationPlayback - RAF-based animation playback
 * 
 * Handles step animation playback using requestAnimationFrame.
 * Uses getters pattern to avoid stale closures in RAF loop.
 * Pure hook with no store imports - caller provides all state and callbacks.
 */

import { useEffect } from 'react';

/**
 * Easing function for smooth animations
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export interface UseAnimationPlaybackOptions {
  isPlaying: boolean;
  isLooping: boolean;
  stepDurationSec: number;
  getCurrentStepIndex: () => number;
  getStepsCount: () => number;
  onSetProgress: (progress01: number) => void;
  onNextStep: () => void;
  onGoToStep: (index: number) => void;
  onPause: () => void;
}

export function useAnimationPlayback(opts: UseAnimationPlaybackOptions): void {
  const {
    isPlaying,
    isLooping,
    stepDurationSec,
    getCurrentStepIndex,
    getStepsCount,
    onSetProgress,
    onNextStep,
    onGoToStep,
    onPause,
  } = opts;

  useEffect(() => {
    // If not playing, reset progress and exit
    if (!isPlaying) {
      onSetProgress(0);
      return;
    }
    
    // If only 1 step or less, pause and exit
    const stepsCount = getStepsCount();
    if (stepsCount <= 1) {
      onPause();
      onSetProgress(0);
      return;
    }
    
    let startTime: number | null = null;
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const elapsed = timestamp - startTime;
      const durationMs = stepDurationSec * 1000;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Apply ease-in-out cubic easing
      const eased = easeInOutCubic(progress);
      onSetProgress(eased);
      
      if (progress >= 1) {
        // Animation step complete - use getters for latest state
        const currentStepIndex = getCurrentStepIndex();
        const totalSteps = getStepsCount();
        
        if (currentStepIndex >= totalSteps - 1) {
          // Reached last step
          if (isLooping) {
            onGoToStep(0);
            startTime = null;
            onSetProgress(0);
            animationFrameId = requestAnimationFrame(animate);
          } else {
            onPause();
            onSetProgress(0);
          }
        } else {
          // Move to next step
          onNextStep();
          startTime = null;
          onSetProgress(0);
          animationFrameId = requestAnimationFrame(animate);
        }
      } else {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      onSetProgress(0);
    };
  }, [
    isPlaying,
    isLooping,
    stepDurationSec,
    getCurrentStepIndex,
    getStepsCount,
    onSetProgress,
    onNextStep,
    onGoToStep,
    onPause,
  ]);
}
