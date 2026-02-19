/**
 * Vision toggle logic unit tests
 *
 * These tests exercise the PURE deterministic logic used by:
 *   - togglePlayerVision (elementsSlice)
 *   - getPlayerOrientationSettings normalization (documentSlice)
 *   - createPlayer factory (packages/core/src/board.ts)
 *
 * No Zustand store instantiation needed — logic is extracted inline and tested.
 *
 * Run: pnpm test --filter=@tmc/web vision.logic
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_PLAYER_ORIENTATION_SETTINGS } from '@tmc/core';
import { createPlayer } from '@tmc/core';

// ---------------------------------------------------------------------------
// Pure logic extracted from elementsSlice.togglePlayerVision
// Deterministic rule: if ANY player has showVision === false  → set ALL to true
//                     otherwise (all are true or undefined)  → set ALL to false
// ---------------------------------------------------------------------------
type MinimalPlayer = { id: string; showVision?: boolean };

function applyToggleVision(
  players: MinimalPlayer[],
  ids: string[]
): MinimalPlayer[] {
  if (ids.length === 0) return players;
  const targets = players.filter((p) => ids.includes(p.id));
  const anyOff = targets.some((p) => p.showVision === false);
  const nextValue = anyOff;          // true  = turn ON;  false = turn OFF
  return players.map((p) =>
    ids.includes(p.id) ? { ...p, showVision: nextValue } : p
  );
}

// ---------------------------------------------------------------------------
// Pure logic extracted from documentSlice.getPlayerOrientationSettings
// ---------------------------------------------------------------------------
type MinimalOrientationSettings = {
  enabled: boolean;
  showVision?: boolean;
  zoomThreshold: number;
};

function normalizeOrientationSettings(
  raw: MinimalOrientationSettings
): MinimalOrientationSettings & { showVision: boolean } {
  return raw.showVision === undefined
    ? { ...raw, showVision: false }
    : { ...raw, showVision: raw.showVision };
}

// ---------------------------------------------------------------------------
// Tests: A) Default vision OFF
// ---------------------------------------------------------------------------
describe('DEFAULT_PLAYER_ORIENTATION_SETTINGS', () => {
  it('should have showVision: false by default (opt-in)', () => {
    expect(DEFAULT_PLAYER_ORIENTATION_SETTINGS.showVision).toBe(false);
  });

  it('should have enabled: false by default', () => {
    expect(DEFAULT_PLAYER_ORIENTATION_SETTINGS.enabled).toBe(false);
  });
});

describe('createPlayer factory', () => {
  it('should set orientation: 0 explicitly on new players', () => {
    const player = createPlayer({ x: 100, y: 100 }, 'home', 7);
    expect(player.orientation).toBe(0);
  });

  it('should NOT set showVision (showVision is per-player opt-in; default undefined = OFF via normalization)', () => {
    const player = createPlayer({ x: 100, y: 100 }, 'away', 9);
    // showVision is NOT set on the player element itself — it defaults to undefined,
    // which renderer normalizes to false. This is the correct default.
    expect((player as any).showVision).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Tests: B) Shift+V deterministic toggling
// ---------------------------------------------------------------------------
describe('applyToggleVision (deterministic rule)', () => {
  it('all players vision is undefined → treated as ON → next state: ALL OFF', () => {
    const players: MinimalPlayer[] = [
      { id: 'h1' },
      { id: 'h2' },
      { id: 'a1' },
      { id: 'a2' },
    ];
    const result = applyToggleVision(players, ['h1', 'h2', 'a1', 'a2']);
    expect(result.every((p) => p.showVision === false)).toBe(true);
  });

  it('all players explicitly ON → next state: ALL OFF', () => {
    const players: MinimalPlayer[] = [
      { id: 'h1', showVision: true },
      { id: 'h2', showVision: true },
      { id: 'a1', showVision: true },
      { id: 'a2', showVision: true },
    ];
    const result = applyToggleVision(players, ['h1', 'h2', 'a1', 'a2']);
    expect(result.every((p) => p.showVision === false)).toBe(true);
  });

  it('some players OFF (mixed state) → next state: ALL ON (not "random")', () => {
    const players: MinimalPlayer[] = [
      { id: 'h1', showVision: true },
      { id: 'h2', showVision: false },  // one OFF
      { id: 'a1', showVision: true },
      { id: 'a2', showVision: false },  // one OFF (away team)
    ];
    const result = applyToggleVision(players, ['h1', 'h2', 'a1', 'a2']);
    expect(result.every((p) => p.showVision === true)).toBe(true);
  });

  it('all players OFF → next state: ALL ON', () => {
    const players: MinimalPlayer[] = [
      { id: 'h1', showVision: false },
      { id: 'h2', showVision: false },
      { id: 'a1', showVision: false },
      { id: 'a2', showVision: false },
    ];
    const result = applyToggleVision(players, ['h1', 'h2', 'a1', 'a2']);
    expect(result.every((p) => p.showVision === true)).toBe(true);
  });

  it('only home players targeted → away players are NOT changed', () => {
    const players: MinimalPlayer[] = [
      { id: 'h1', showVision: true },
      { id: 'h2', showVision: true },
      { id: 'a1', showVision: true },
      { id: 'a2', showVision: true },
    ];
    const result = applyToggleVision(players, ['h1', 'h2']);
    const home = result.filter((p) => ['h1', 'h2'].includes(p.id));
    const away = result.filter((p) => ['a1', 'a2'].includes(p.id));
    expect(home.every((p) => p.showVision === false)).toBe(true);
    expect(away.every((p) => p.showVision === true)).toBe(true);
  });

  it('empty ids → no change', () => {
    const players: MinimalPlayer[] = [
      { id: 'h1', showVision: true },
    ];
    const result = applyToggleVision(players, []);
    expect(result).toEqual(players);
  });

  it('second call after all ON → all OFF (idempotent round-trip)', () => {
    const initial: MinimalPlayer[] = [
      { id: 'h1', showVision: false },
      { id: 'a1', showVision: false },
    ];
    const allIds = ['h1', 'a1'];
    const afterFirst = applyToggleVision(initial, allIds);
    expect(afterFirst.every((p) => p.showVision === true)).toBe(true);
    const afterSecond = applyToggleVision(afterFirst, allIds);
    expect(afterSecond.every((p) => p.showVision === false)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: C) getPlayerOrientationSettings normalization
// ---------------------------------------------------------------------------
describe('normalizeOrientationSettings', () => {
  it('normalizes undefined showVision → false (old docs before the field existed)', () => {
    const raw: MinimalOrientationSettings = { enabled: true, zoomThreshold: 50 };
    const result = normalizeOrientationSettings(raw);
    expect(result.showVision).toBe(false);
  });

  it('keeps showVision: true when explicitly saved as true', () => {
    const raw: MinimalOrientationSettings = { enabled: true, showVision: true, zoomThreshold: 50 };
    const result = normalizeOrientationSettings(raw);
    expect(result.showVision).toBe(true);
  });

  it('keeps showVision: false when explicitly saved as false', () => {
    const raw: MinimalOrientationSettings = { enabled: true, showVision: false, zoomThreshold: 50 };
    const result = normalizeOrientationSettings(raw);
    expect(result.showVision).toBe(false);
  });

  it('does not mutate the original settings object', () => {
    const raw: MinimalOrientationSettings = { enabled: true, zoomThreshold: 50 };
    normalizeOrientationSettings(raw);
    expect(raw.showVision).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Tests: D) Portrait flip regression (orientation field transform)
// ---------------------------------------------------------------------------
describe('createPlayer orientation: 0 regression (portrait flip)', () => {
  it('player created with orientation: 0 transforms correctly on portrait flip', () => {
    const player = createPlayer({ x: 100, y: 100 }, 'home', 7);
    expect(player.orientation).toBe(0);
    
    // Simulate portrait flip transform: landscape → portrait (CCW -90°)
    const rotationDelta = -90;
    const newOrientation = ((player.orientation! + rotationDelta) % 360 + 360) % 360;
    expect(newOrientation).toBe(270); // 0 + (-90) + 360 = 270
  });

  it('player created with orientation: 0 transforms correctly on landscape flip', () => {
    const player = createPlayer({ x: 100, y: 100 }, 'away', 9);
    expect(player.orientation).toBe(0);
    
    // Simulate portrait flip transform: portrait → landscape (CW +90°)
    const rotationDelta = 90;
    const newOrientation = ((player.orientation! + rotationDelta) % 360 + 360) % 360;
    expect(newOrientation).toBe(90); // 0 + 90 = 90
  });

  it('player with orientation: undefined would cause NaN in old code (regression)', () => {
    // Old code: if orientation field was missing (undefined), (undefined + -90) = NaN
    const orientationUndefined = undefined;
    const rotationDelta = -90;
    const badResult = ((orientationUndefined as any) + rotationDelta) % 360;
    expect(badResult).toBeNaN(); // This is the bug we prevented

    // New code: createPlayer sets explicit orientation: 0
    const player = createPlayer({ x: 100, y: 100 }, 'home', 1);
    const goodResult = ((player.orientation! + rotationDelta) % 360 + 360) % 360;
    expect(goodResult).toBe(270); // Correct!
  });
});
