import { describe, expect, it } from 'vitest';
import { parseSquadRoster } from '../../../../../packages/ui/src/squadRoster';

describe('parseSquadRoster', () => {
  it('accepts leading, trailing and omitted numbers', () => {
    const result = parseSquadRoster('1 Jan Kowalski\nPiotr Nowak, 7\nAdam Zielinski', 'home');
    expect(result.invalidLines).toEqual([]);
    expect(result.players).toEqual([
      { name: 'Jan Kowalski', number: 1, team: 'home', isGoalkeeper: true },
      { name: 'Piotr Nowak', number: 7, team: 'home', isGoalkeeper: false },
      { name: 'Adam Zielinski', number: 2, team: 'home', isGoalkeeper: false },
    ]);
  });

  it('preserves occupied and duplicate jersey numbers', () => {
    const result = parseSquadRoster(
      '7 New Seven\n8 Valid Player\n8 Duplicate Eight',
      'away',
      [{ id: 'existing', name: 'Existing', number: 7, team: 'away' }],
    );
    expect(result.players.map(({ name, number }) => ({ name, number }))).toEqual([
      { name: 'New Seven', number: 7 },
      { name: 'Valid Player', number: 8 },
      { name: 'Duplicate Eight', number: 8 },
    ]);
    expect(result.invalidLines).toEqual([]);
  });

  it('parses tab-separated pasted rows and assigns only missing numbers', () => {
    const result = parseSquadRoster(
      'GRACJAN KORYTKOWSKI\t12\nDOMINIK KLINT\t1\nHUBERT ŚLICZNIAK\t1\nMATEUSZ BOROWIEC\t',
      'home',
    );
    expect(result.players.map(({ name, number }) => ({ name, number }))).toEqual([
      { name: 'GRACJAN KORYTKOWSKI', number: 12 },
      { name: 'DOMINIK KLINT', number: 1 },
      { name: 'HUBERT ŚLICZNIAK', number: 1 },
      { name: 'MATEUSZ BOROWIEC', number: 2 },
    ]);
  });

  it('parses Unicode line separators pasted from rich text', () => {
    const result = parseSquadRoster(
      'KORYTKOWSKI, 12\u2028KLINT, 1\u2028ŚLICZNIAK, 1\u2028MUSZYŃSKI, 5\u2029WOŁOSOWSKI, 70',
      'home',
    );

    expect(result.invalidLines).toEqual([]);
    expect(result.players.map(({ name, number }) => ({ name, number }))).toEqual([
      { name: 'KORYTKOWSKI', number: 12 },
      { name: 'KLINT', number: 1 },
      { name: 'ŚLICZNIAK', number: 1 },
      { name: 'MUSZYŃSKI', number: 5 },
      { name: 'WOŁOSOWSKI', number: 70 },
    ]);
  });

  it('recognizes goalkeeper markers', () => {
    const result = parseSquadRoster('GK 12 Anna Keeper\nBR 22 Ola Bramkarz', 'team3');
    expect(result.players.map((player) => player.isGoalkeeper)).toEqual([true, true]);
    expect(result.players.map((player) => player.name)).toEqual(['Anna Keeper', 'Ola Bramkarz']);
  });
});
