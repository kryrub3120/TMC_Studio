# [Delivery] — Arrow/Inspector Fixes — Double pushHistory + Report Drift
**Data:** 2026-06-10 21:59
**Iteracja:** 1

## Zadanie
Naprawić 2 problemy wykryte po sprintach A/B/C:
1. Arrow number input powoduje podwójne `pushHistory()` przez przypadkowy toggle `showNumber`
2. Raport `1826_delivery_inspector-ux-fix.md` nie zgadza się z aktualnym kodem (pisze o "FAB+BottomSheet dla <xl" a kod robi tylko dla `sm`)

## Decyzje i uzasadnienie

### Problem 1 — Arrow number input → double pushHistory

**Źródło:** Number input w `RightInspector.tsx` wysyłał dwie properties jednocześnie:
```ts
onUpdateElement?.({ arrowNumber: undefined, showNumber: false });  // empty
onUpdateElement?.({ arrowNumber: num, showNumber: true });         // with value
```

Handler w `useBoardPageHandlers.ts` widział `'showNumber' in updates` i wołał `toggleArrowNumber()` (który robi smart-sequencing + pushHistory), a potem `setArrowNumber()` (który też robi pushHistory). Efekt: 2 snapshoty historii przy jednej edycji + potencjalnie niespójny stan (toggle mógł zmienić numer na next-in-sequence, a zaraz potem setArrowNumber nadpisał go właściwym).

**Rozwiązanie:**
- `RightInspector.tsx`: number input wysyła **tylko** `arrowNumber` — bez `showNumber`
- `useBoardPageHandlers.ts`: `arrowNumber` ma priorytet przed `showNumber`. Jeśli jest `'arrowNumber' in updates` → tylko `setArrowNumber()` (który sam ustawia `showNumber` wewnętrznie). `showNumber` jest obsługiwane tylko gdy `arrowNumber` nie występuje.
- Show number toggle w UI nadal wysyła `{ showNumber: !selectedElement.showNumber }` → trafia do `toggleArrowNumber()` (tylko 1 pushHistory).

### Problem 2 — Report drift

**Źródło:** Raport mówił "wszystkie breakpointy poniżej xl używają FAB + BottomSheet", ale kod robi:
```ts
const isBottomSheetLayout = breakpoint === 'sm';
```

Czyli tylko `sm` (<768px) używa BottomSheet. `md+` używa sidebara.

**Rozwiązanie:** Zaktualizowano raport `1826_delivery_inspector-ux-fix.md` — teraz opisuje rzeczywiste zachowanie: sm → BottomSheet, md+ → sidebar. Bez zmiany kodu (kod jest poprawny).

## Co zrobiłem

### Zmienione pliki

1. **`packages/ui/src/RightInspector.tsx`** (linia ~510)
   - Number input: usunięto `showNumber: false` / `showNumber: true` z payloadu — input wysyła tylko `arrowNumber`

2. **`apps/web/src/app/board/useBoardPageHandlers.ts`** (w `handleUpdateElement`)
   - Zmieniono kolejność: `if ('arrowNumber' in updates)` ma priorytet → woła tylko `setArrowNumber()` (który ustawia i number i showNumber)
   - `else if ('showNumber' in updates)` → `toggleArrowNumber()` (tylko gdy arrowNumber nie było w updates)
   - Eliminuje podwójne `pushHistory()`

3. **`thoughts/2026-06-10/1826_delivery_inspector-ux-fix.md`**
   - Zakres B: poprawiono opis — "tylko sm używa BottomSheet, md+ używa sidebara"
   - Poprawiono checklistę: "lg breakpoint używa sidebara — BottomSheet tylko dla sm"

## Evidence

### typecheck
```
cd packages/ui && npx tsc --noEmit      → exit 0
cd apps/web && npx tsc --noEmit         → exit 0
cd packages/board && npx tsc --noEmit   → exit 0
```

### test
```
Test Files  5 passed (5)
     Tests  94 passed (94)
```

### Manual reasoning check
- Wpisanie `5` w input: `onUpdateElement({ arrowNumber: 5 })` → handler widzi `'arrowNumber' in updates` → `setArrowNumber(id, 5)` → ustawia `number: 5, showNumber: true` → 1x pushHistory
- Puste pole: `onUpdateElement({ arrowNumber: undefined })` → `setArrowNumber(id, undefined)` → ustawia `number: undefined, showNumber: false` → 1x pushHistory
- Kliknięcie toggle Show number: `onUpdateElement({ showNumber: !selectedElement.showNumber })` → handler widzi tylko `'showNumber' in updates` → `toggleArrowNumber(id)` → 1x pushHistory
- Brak podwójnego pushHistory w żadnym scenariuszu

## Wynik
Oba problemy naprawione. Kod zachowuje istniejące API store (`toggleArrowNumber`, `setArrowNumber`). Brak zmian w logice Sprint C. Raport zgodny z kodem.

## Status DoD
- [x] Naprawiony handler arrow number/showNumber — brak przypadkowego toggle
- [x] Brak podwójnego `pushHistory()` dla jednej edycji numeru
- [x] Raport `1826_delivery_inspector-ux-fix.md` zgodny z rzeczywistym kodem
- [x] Testy @tmc/web przechodzą (94/94)
- [x] Typecheck @tmc/web, @tmc/board, @tmc/ui — exit 0
- [x] Raport zapisany

## Dla następnej iteracji / następnego agenta
Brak — zadanie wykonane w 1 iteracji.