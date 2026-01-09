/**
 * useAnimationPlayback - RAF-based animation with interpolation
 * 
 * Handles step animation playback using requestAnimationFrame.
 * Manages animation progress, looping, and step transitions.
 */

import { useEffect } from 'react';
import { useBoardStore } from '../store';
import { useUIStore } from '../store/useUIStore';

/**
 * Easing function for smooth animations
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useAnimationPlayback(): void {
  const isPlaying = useUIStore((s) => s.isPlaying);
  const isLooping = useUIStore((s) => s.isLooping);
  const stepDuration = useUIStore((s) => s.stepDuration);
  const setAnimationProgress = useUIStore((s) => s.setAnimationProgress);
  const pause = useUIStore((s) => s.pause);
  
  const currentStepIndex = useBoardStore((s) => s.currentStepIndex);
  const totalSteps = useBoardStore((s) => s.document.steps.length);
  const goToStep = useBoardStore((s) => s.goToStep);
  const nextStep = useBoardStore((s) => s.nextStep);
  
  useEffect(() => {
    if (!isPlaying || totalSteps <= 1) {
      setAnimationProgress(0);
      return;
    }
    
    let startTime: number | null = null;
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const elapsed = timestamp - startTime;
      const durationMs = stepDuration * 1000;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeInOutCubic(progress);
      
      setAnimationProgress(eased);
      
      if (progress >= 1) {
        // Animation step complete
        if (currentStepIndex >= totalSteps - 1) {
          // Reached last step
          if (isLooping) {
            goToStep(0);
            startTime = null;
            setAnimationProgress(0);
            animationFrameId = requestAnimationFrame(animate);
          } else {
            pause();
            setAnimationProgress(0);
          }
        } else {
          // Move to next step
          nextStep();
          startTime = null;
          setAnimationProgress(0);
          animationFrameId = requestAnimationFrame(animate);
        }
      } else {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      setAnimationProgress(0);
    };
  }, [
    isPlaying,
    isLooping,
    stepDuration,
    totalSteps,
    currentStepIndex,
    setAnimationProgress,
    pause,
    goToStep,
    nextStep,
  ]);
}
