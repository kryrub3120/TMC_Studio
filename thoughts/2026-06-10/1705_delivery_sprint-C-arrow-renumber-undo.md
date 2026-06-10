# [Delivery] — Sprint C — Numeracja strzałek bez dziur + jedno undo
**Data:** 2026-06-10 17:05
**Iteracja:** 1

## Zadanie
Implementacja Sprint C zgodnie z zatwierdzonym planem:
1. `renumberAllArrows()` w elementsSlice — bez `pushHistory`
2. `deleteSelected` — delete + renumber + JEDEN `pushHistory`
3. `toggleAutoNumbering` — warunek `if (wasOff)` + `pushHistory()` + `renumberAllArrows()`
4. Testy jednostkowe + raport

## Decyzje i uzasadnienie

### Kluczowa decyzja: brak `createdAt` w ArrowElement
Plan w `IMPLEMENTATION_PLAN_SPRINTS.md` zakładał sortowanie po `createdAt`, ale `ArrowElement` (ani `BoardElementBase`) nie ma pola `createdAt`. Zamiast tego używamy **kolejności w tablicy `elements`** (insertion order), co jest spójne z tym jak użytkownik widzi strzałki na tablicy.

### Cross-slice call w documentSlice
`toggleAutoNumbering` w `documentSlice.ts` musi wywołać `renumberAllArrows()` z `elementsSlice.ts`. Ponieważ wszystkie slice'y są komponowane w `AppState`, `get()` zwraca pełny stan — więc `get().renumberAllArrows()` działa bez żadnego importu.

### Early return guard
`renumberAllArrows` ma guard `if (numberMap.size === 0) return;` — jeśli nie ma numerowanych strzałek, nie ma `set()` i nie ma niepotrzebnego re-rendera.

## Co zrobiłem

### 1. `renumberAllArrows()` w elementsSlice.ts
- Dodano do interfejsu `ElementsSlice`
- Iteruje elementy w kolejności tablicy, znajduje strzałki z `showNumber=true`
- Przypisuje numery 1..N w kolejności insertion
- **NIE wywołuje `pushHistory()`** — zgodnie z planem

### 2. `deleteSelected` — poprawiony
- Przed usunięciem sprawdza `hadNumberedArrows` (czy któraś z usuwanych strzałek ma `showNumber=true`)
- Po usunięciu, jeśli `hadNumberedArrows` → woła `renumberAllArrows()`
- **Jeden `pushHistory()` na końcu** — jeden snapshot dla delete + renumber

### 3. `toggleAutoNumbering` — naprawiony
- Dodano `const wasOff = get().isAutoNumbering === false` przed toggle
- Po włączeniu (`wasOff === true`) → `get().renumberAllArrows()`
- **Jeden `pushHistory()`** dla całej operacji toggle + renumber

### 4. Testy (14 testów, wszystkie ✅)
W `apps/web/src/store/slices/__tests__/arrowRenumber.test.ts`:
- **5 testów** dla `renumberAllArrows`: sekwencja 1,2,3; ignorowanie `showNumber=false`; pusty array; brak strzałek; nie-arrow elementy nietknięte
- **9 testów** dla `deleteSelected + renumber`: delete jednej, środkowej, pierwszej, ostatniej, wielu; brak renumber gdy nie-arrow; brak renumber gdy arrow bez numeru; mixed delete; brak selekcji

### 5. Dodano vitest do devDependencies web app

## Evidence
- Wszystkie 14 nowych testów przeszło
- Wszystkie istniejące 69 testów nadal przechodzą (łącznie 83 testy)
- Brak błędów TypeScript w zmienionych plikach

## Zmienione pliki
- `apps/web/src/store/slices/elementsSlice.ts` — dodano `renumberAllArrows`, poprawiono `deleteSelected`
- `apps/web/src/store/slices/documentSlice.ts` — poprawiono `toggleAutoNumbering` (warunek + pushHistory + renumber)
- `apps/web/src/store/slices/__tests__/arrowRenumber.test.ts` — nowy plik z 14 testami
- `apps/web/package.json` — dodano vitest + test scripts

## Status DoD
- [x] Kod działa zgodnie z zatwierdzonym planem
- [x] Testy napisane — 14 testów, wszystkie przechodzą
- [x] `renumberAllArrows` nie woła `pushHistory` — POTWIERDZONE
- [x] `deleteSelected` wykonuje delete + renumber + jeden pushHistory
- [x] `toggleAutoNumbering` wykonuje renumber + jeden pushHistory po włączeniu
- [x] Brak znanych regresji — stare testy nadal przechodzą
- [x] Plik `thoughts/` zapisany

## Dla następnej iteracji / następnego agenta
- Brak — Sprint C zakończony sukcesem