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
  const parsedLines: Array<{
    original: string;
    name: string;
    number: number | null;
    isGoalkeeper: boolean;
  }> = [];

  const nextFreeNumber = () => {
    for (let number = 1; number <= 99; number += 1) {
      if (!usedNumbers.has(number)) return number;
    }
    return null;
  };

  // Rich-text sources (Notes, Messages, Word) often paste U+2028/U+2029
  // instead of a regular newline. Treat every Unicode line boundary equally.
  value.split(/\r\n|[\n\r\u2028\u2029]/).forEach((rawLine) => {
    const original = rawLine.trim();
    if (!original) return;

    const isGoalkeeper = /(^|\s)(gk|br)(\s|$)/i.test(original);
    const line = original.replace(/(^|\s)(gk|br)(?=\s|$)/gi, ' ').replace(/\s+/g, ' ').trim();
    const leadingNumber = line.match(/^(\d{1,2})(?:\s*[-,;:]\s*|\s+)(.+)$/);
    const trailingNumber = line.match(/^(.+?)(?:\s*[-,;:]\s*|\s+)(\d{1,2})$/);

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
    if (!name || (number !== null && (number < 1 || number > 99))) {
      invalidLines.push(original);
      return;
    }

    parsedLines.push({ original, name, number, isGoalkeeper });
    if (number !== null) usedNumbers.add(number);
  });

  parsedLines.forEach(({ original, name, number: explicitNumber, isGoalkeeper }) => {
    const number = explicitNumber ?? nextFreeNumber();
    if (number === null) {
      invalidLines.push(original);
      return;
    }

    // Jersey numbers are not unique identifiers: real squads can reuse them.
    usedNumbers.add(number);
    players.push({ name, number, team, isGoalkeeper: isGoalkeeper || number === 1 });
  });

  return { players, invalidLines };
}
