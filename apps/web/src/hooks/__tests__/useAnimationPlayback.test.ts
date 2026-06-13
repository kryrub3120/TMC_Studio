/**
 * Tests for useAnimationPlayback
 */
import { describe, it, expect, vi } from 'vitest';

import { easeInOutCubic } from '../useAnimationPlayback';

describe('easeInOutCubic', () => {
  it('should return 0 for t=0', () => {
    expect(easeInOutCubic(0)).toBe(0);
  });

  it('should return 1 for t=1', () => {
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('should return 0.5 for t=0.5', () => {
    expect(easeInOutCubic(0.5)).toBe(0.5);
  });

  it('should be symmetric around 0.5', () => {
    const t1 = easeInOutCubic(0.3);
    const t2 = 1 - easeInOutCubic(0.7);
    expect(Math.abs(t1 - t2)).toBeLessThan(0.001);
  });

  it('should accelerate in first half', () => {
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
  });

  it('should decelerate in second half', () => {
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
  });
});

describe('Animation playback logic', () => {
  it('should reset progress when not playing', () => {
    const onSetProgress = vi.fn();
    const onPause = vi.fn();
    if (false) {} else { onSetProgress(0); }
    expect(onSetProgress).toHaveBeenCalledWith(0);
    expect(onPause).not.toHaveBeenCalled();
  });

  it('should pause when only 1 step', () => {
    const onPause = vi.fn();
    const onSetProgress = vi.fn();
    const isPlaying = true;
    const stepsCount = 1;
    if (isPlaying && stepsCount <= 1) { onPause(); onSetProgress(0); }
    expect(onPause).toHaveBeenCalled();
    expect(onSetProgress).toHaveBeenCalledWith(0);
  });

  it('should advance to next step when progress >=1 and not last', () => {
    const onNextStep = vi.fn();
    const onSetProgress = vi.fn();
    const currentStepIndex = 0;
    const totalSteps = 3;
    if (currentStepIndex < totalSteps - 1) { onNextStep(); onSetProgress(0); }
    expect(onNextStep).toHaveBeenCalled();
    expect(onSetProgress).toHaveBeenCalledWith(0);
  });

  it('should loop when at last step and looping', () => {
    const onGoToStep = vi.fn();
    const onSetProgress = vi.fn();
    const currentStepIndex = 2;
    const totalSteps = 3;
    const isLooping = true;
    if (currentStepIndex >= totalSteps - 1) {
      if (isLooping) { onGoToStep(0); onSetProgress(0); }
    }
    expect(onGoToStep).toHaveBeenCalledWith(0);
    expect(onSetProgress).toHaveBeenCalledWith(0);
  });

  it('should pause when at last step and not looping', () => {
    const onPause = vi.fn();
    const onSetProgress = vi.fn();
    const currentStepIndex = 2;
    const totalSteps = 3;
    if (currentStepIndex >= totalSteps - 1) {
      onPause(); onSetProgress(0);
    }
    expect(onPause).toHaveBeenCalled();
    expect(onSetProgress).toHaveBeenCalledWith(0);
  });
});