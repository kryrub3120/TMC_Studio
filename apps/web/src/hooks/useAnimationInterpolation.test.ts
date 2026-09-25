import { describe, expect, it } from 'vitest';
import {
  interpolateArrowEndpoints,
  interpolatePosition,
  interpolateZone,
} from './useAnimationInterpolation';

const next = [
  { id: 'player', type: 'player', position: { x: 200, y: 100 } },
  { id: 'ball', type: 'ball', position: { x: 50, y: 50 } },
  { id: 'arrow', type: 'arrow', startPoint: { x: 10, y: 10 }, endPoint: { x: 110, y: 30 } },
  { id: 'zone', type: 'zone', position: { x: 100, y: 100 }, width: 200, height: 80 },
  { id: 'changed', type: 'arrow', startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
];

describe('animation interpolation between steps', () => {
  it('moves players and the ball linearly towards the next step', () => {
    expect(interpolatePosition(next, 'player', { x: 0, y: 0 }, 0.5)).toEqual({ x: 100, y: 50 });
    expect(interpolatePosition(next, 'ball', { x: 150, y: 50 }, 0.25)).toEqual({ x: 125, y: 50 });
  });

  it('starts at the current step and ends exactly at the next one', () => {
    expect(interpolatePosition(next, 'player', { x: 0, y: 0 }, 0)).toEqual({ x: 0, y: 0 });
    expect(interpolatePosition(next, 'player', { x: 0, y: 0 }, 1)).toEqual({ x: 200, y: 100 });
  });

  it('moves both arrow endpoints', () => {
    expect(interpolateArrowEndpoints(next, 'arrow', { x: 10, y: 10 }, { x: 10, y: 30 }, 0.5)).toEqual({
      start: { x: 10, y: 10 },
      end: { x: 60, y: 30 },
    });
  });

  it('moves and resizes zones', () => {
    expect(interpolateZone(next, 'zone', { x: 0, y: 100 }, 100, 40, 0.5)).toEqual({
      position: { x: 50, y: 100 },
      width: 150,
      height: 60,
    });
  });

  it('keeps an element that disappears in the next step in place until the step changes', () => {
    const here = { x: 30, y: 40 };
    expect(interpolatePosition(next, 'gone', here, 0.7)).toBe(here);
    expect(interpolateArrowEndpoints(next, 'gone', here, here, 0.7)).toEqual({ start: here, end: here });
    expect(interpolateZone(next, 'gone', here, 10, 10, 0.7)).toEqual({ position: here, width: 10, height: 10 });
  });

  it('does not morph an element whose id now belongs to another element type', () => {
    const here = { x: 5, y: 5 };
    expect(interpolateZone(next, 'changed', here, 10, 10, 0.5)).toEqual({ position: here, width: 10, height: 10 });
    expect(interpolatePosition(next, 'changed', here, 0.5)).toBe(here);
  });

  it('does nothing on the last step', () => {
    const here = { x: 1, y: 2 };
    expect(interpolatePosition(null, 'player', here, 0.5)).toBe(here);
  });
});
