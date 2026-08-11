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

  it('rejects occupied and duplicate numbers without discarding valid rows', () => {
    const result = parseSquadRoster(
      '7 New Seven\n8 Valid Player\n8 Duplicate Eight',
      'away',
      [{ id: 'existing', name: 'Existing', number: 7, team: 'away' }],
    );
    expect(result.players).toEqual([
      { name: 'Valid Player', number: 8, team: 'away', isGoalkeeper: false },
    ]);
    expect(result.invalidLines).toEqual(['7 New Seven', '8 Duplicate Eight']);
  });

  it('recognizes goalkeeper markers', () => {
    const result = parseSquadRoster('GK 12 Anna Keeper\nBR 22 Ola Bramkarz', 'team3');
    expect(result.players.map((player) => player.isGoalkeeper)).toEqual([true, true]);
    expect(result.players.map((player) => player.name)).toEqual(['Anna Keeper', 'Ola Bramkarz']);
  });
});
