# Audyt Mechanizmu Dodawania Zawodników i Drużyn

> **Data audytu:** 2026-06-09  
> **Data refaktora:** 2026-06-09  
> **Zakres:** Fabryki, logika numeracji, system preferencji użytkownika  
> **Metodologia:** Analiza kodu źródłowego — `packages/core/src/board.ts`, `packages/core/src/types.ts`, `apps/web/src/store/slices/elementsSlice.ts`, `packages/presets/src/formations.ts`, `apps/web/src/hooks/useSettingsController.ts`, `apps/web/src/store/slices/documentSlice.ts`  
> **Status:** ✅ Po refaktorze — zmiany wdrożone

---

## 1. Fabryki — `createPlayer` (Stan po refaktorze)

### 1.1 Obecna sygnatura `createPlayer` — `packages/core/src/board.ts:46-88`

```typescript
export interface CreatePlayerOptions {
  position: Position;
  team: Team;
  number?: number | null;    // undefined/null = brak numeru
  isGoalkeeper?: boolean;    // false = domyślnie zawodnik z pola
  shape?: PlayerShape;       // undefined = fallback (home→triangle, away→circle)
  color?: string;            // undefined = kolor drużyny
  orientation?: number | null;
  radius?: number;
  label?: string;
  showLabel?: boolean;
  gridSize?: number;
}

export function createPlayer(options: CreatePlayerOptions): PlayerElement {
  const {
    position,
    team,
    number: number ?? undefined,        // brak numeru → undefined
    isGoalkeeper: isGoalkeeper ?? false, // domyślnie false
    orientation: orientation ?? 0,       // 0 = północ (wymagane do flipa)
  } = options;

  return {
    id: generateId(),
    type: 'player',
    position: snapToGrid(position, options.gridSize),
    team,
    number,
    shape: options.shape ?? (team === 'home' ? 'triangle' : 'circle'),
    isGoalkeeper: isGoalkeeper ?? false,
    orientation,
  };
}
```

### 1.2 Co się zmieniło

| Problem (z audytu) | Stan przed | Stan po |
|-|-|-|
| **P-1** | `number: number` (wymagane) | `number?: number \| null` → `?? undefined` — **opcjonalne** |
| **P-2** | `isGoalkeeper: number === 1` (pochodna) | `isGoalkeeper: isGoalkeeper ?? false` — **jawnie false**, backward-compat w renderze |
| **P-3** | `shape: team === 'home' ? 'triangle' : 'circle'` | `shape: shape ?? (team-based fallback)` — **można nadpisać** |
| **P-5** | brak `color`, `radius` itp. | Wszystkie opcjonalne — ustawiane tylko gdy podane |

### 1.3 Backward-compat GK — `PlayerNode.tsx`

```typescript
function resolveIsGoalkeeper(
  playerIsGoalkeeper: boolean | undefined,
  playerNumber: number | null | undefined
): boolean {
  return playerIsGoalkeeper !== undefined ? playerIsGoalkeeper : playerNumber === 1;
}
```

- **Stare projekty** (bez flagi): nadal `number === 1` → GK
- **Nowe projekty** (flaga jawna): `isGoalkeeper` decyduje

### 1.4 `getNextPlayerNumber` — `elementsSlice.ts:39-47`

```typescript
function getNextPlayerNumber(elements, team, offset: number = 0): number {
  // Szuka pierwszego wolnego numeru STARTUJĄC OD 1 + offset
  let next = 1 + offset;
  while (elements.includes(next)) {
    next++;
  }
  return next;
}
```

- Używany **tylko gdy `playerDefaults.autoNumber === true`**
- Domyślnie `autoNumber: false` → **pojedynczy zawodnik (P) nie dostaje numeru**

---

## 2. System Preferencji — Stan po refaktorze

### 2.1 `PlayerDefaults` — `packages/core/src/types.ts`

```typescript
export interface PlayerDefaults {
  autoNumber: boolean;         // false = domyślnie bez numeru
  numberOffset: number;        // offset tylko gdy autoNumber=true
  homeShape?: PlayerShape;
  awayShape?: PlayerShape;
  homeColor?: string;
  awayColor?: string;
}

export const DEFAULT_PLAYER_DEFAULTS: PlayerDefaults = {
  autoNumber: false,   // 🔥 kluczowa zmiana — 'P' nie nadaje numeru
  numberOffset: 0,
};
```

### 2.2 `documentSlice` — nowe akcje

- `updatePlayerDefaults(updates)` — aktualizacja preferencji
- `getPlayerDefaults()` — odczyt

---

## 3. Masowe Dodawanie Drużyn — Formacje

### 3.1 `applyFormation` — `elementsSlice.ts:666-683`

```typescript
const newPlayers = positions.map((pos) => {
  // Formacje ZAWSZE nadają numery z definicji formacji
  return createPlayer({
    position: { x: pos.x, y: pos.y },
    team,
    number: pos.number,          // jawnie z formacji (1-11)
    shape: prefs.shape,
    color: prefs.color,
  });
});
```

**Zasada:** Formacje zawsze nadają numery (1-11) niezależnie od `autoNumber`.  
**Pojedynczy dodawanie (P):** szanuje `autoNumber` — domyślnie brak numeru.

### 3.2 `createTeamLineup` / `createInitialBoard` — `board.ts`

```typescript
createTeamLineup(team, pitchConfig) {
  // Startowy układ (przy tworzeniu nowego dokumentu)
  // Nadaje numery: index + 1 (1-11)
  createPlayer({ position: pos, team, number: index + 1, ... })
}
```

---

## 4. Renderowanie Pustego Numeru — `PlayerNode.tsx:509`

```typescript
{((player.showLabel && player.label) || player.number != null) && (
  // Wyświetla numer tylko gdy !== null i !== undefined
)}
```

- `player.number = undefined` → **nie renderuje numeru** ✅
- `player.number = null` → **nie renderuje numeru** ✅

---

## 5. Podsumowanie — ścieżki tworzenia zawodników

| Ścieżka | Ma numer? | Skąd numer? |
|---------|-----------|-------------|
| **Skrót P** (pojedynczy) | ❌ Nie | `autoNumber=false` → brak |
| **Formacja** (applyFormation) | ✅ Tak (1-11) | Z definicji formacji (`pos.number`) |
| **Nowy dokument** (createInitialBoard) | ✅ Tak (1-11) | `index + 1` w `createTeamLineup` |
| **Duplikacja** | ✅ Kopiuje | Zachowuje numer źródła |

### Pliki zmodyfikowane podczas refaktora

| Plik | Zmiana |
|------|--------|
| `packages/core/src/board.ts` | `createPlayer` → options-based, `number: undefined`, `isGoalkeeper: false` |
| `packages/core/src/types.ts` | `PlayerDefaults`, `DEFAULT_PLAYER_DEFAULTS { autoNumber: false }`, pole w `BoardDocument` |
| `packages/core/src/serialization.ts` | `createDocument()` zapisuje `playerDefaults` |
| `packages/board/src/PlayerNode.tsx` | `resolveIsGoalkeeper()` z backward-compat |
| `apps/web/src/store/slices/documentSlice.ts` | `updatePlayerDefaults()`, `getPlayerDefaults()` |
| `apps/web/src/store/slices/elementsSlice.ts` | `getNextPlayerNumber(offset)`, `resolvePlayerDefaults()`, `addPlayerAtCursor` + `applyFormation` |
| `apps/web/src/store/slices/__tests__/vision.logic.test.ts` | Nowe testy dla `isGoalkeeper`, `undefined` number |