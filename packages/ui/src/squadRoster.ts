import type { SquadPlayer, Team } from '@tmc/core';

export interface ParsedSquadRoster {
  players: Array<Omit<SquadPlayer, 'id'>>;
  invalidLines: string[];
}

const cleanName = (value: string) => value.replace(/^[-,;:\s]+|[-,;:\s]+$/g, '').trim();

/** Parse one-player-per-line roster text, assigning the first free number when omitted. */
export function parseSquadRoster(
  value: string,
  team: Team,
  existingPlayers: SquadPlayer[] = [],
): ParsedSquadRoster {
  const usedNumbers = new Set(
    existingPlayers.filter((player) => player.team === team).map((player) => player.number),
  );
  const players: Array<Omit<SquadPlayer, 'id'>> = [];
  const invalidLines: string[] = [];

  const nextFreeNumber = () => {
    for (let number = 1; number <= 99; number += 1) {
      if (!usedNumbers.has(number)) return number;
    }
    return null;
  };

  value.split(/\r?\n/).forEach((rawLine) => {
    const original = rawLine.trim();
    if (!original) return;

    const isGoalkeeper = /(^|\s)(gk|br)(\s|$)/i.test(original);
    const line = original.replace(/(^|\s)(gk|br)(?=\s|$)/gi, ' ').replace(/\s+/g, ' ').trim();
    const leadingNumber = line.match(/^(\d{1,2})(?:\s*[-,;:]\s*|\s+)(.+)$/);
    const trailingNumber = line.match(/^(.+?)(?:\s*[-,;:]\s*)(\d{1,2})$/);

    let number: number | null = null;
    let name = line;
    if (leadingNumber) {
      number = Number(leadingNumber[1]);
      name = leadingNumber[2];
    } else if (trailingNumber) {
      name = trailingNumber[1];
      number = Number(trailingNumber[2]);
    }

    name = cleanName(name);
    number ??= nextFreeNumber();
    if (!name || number === null || number < 1 || number > 99 || usedNumbers.has(number)) {
      invalidLines.push(original);
      return;
    }

    usedNumbers.add(number);
    players.push({ name, number, team, isGoalkeeper: isGoalkeeper || number === 1 });
  });

  return { players, invalidLines };
}
