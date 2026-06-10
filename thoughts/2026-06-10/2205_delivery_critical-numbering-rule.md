# [Delivery LOOP] — Critical Numbering Rule: toggleArrowNumber preserve/restore
**Data:** 2026-06-10 22:05
**Iteracja:** 1

## Zadanie
Naprawić `toggleArrowNumber`, żeby OFF/ON tej samej strzałki zachowywało numer zamiast przydzielać 1,2,3... przy każdym włączeniu.

## Decyzje i uzasadnienie

### Źródło błędu
`getHighestArrowNumber` liczył WSZYSTKIE strzałki (również ukryte `showNumber=false`), więc OFF/ON tej samej strzałki zawsze dawało `max+1`. Przykład: strzałka z `number=1` → OFF → ON → `getHighestArrowNumber` wciąż widzi 1 → daje 2 → OFF → ON → 3... Błąd.

### Rozwiązanie
Dodano 2 helpery:
- `getHighestVisibleArrowNumber(elements)` — liczy tylko `isArrowElement(el) && el.showNumber === true`
- `getVisibleArrowNumbers(elements)` — zwraca Set numerów widocznych strzałek

Nowa logika `toggleArrowNumber` przy ON:
1. Jeśli strzałka ma zapisany `number` (z poprzedniego OFF) i numer NIE jest zajęty przez widoczną strzałkę → przywraca ten numer (bez zmiany wartości)
2. Jeśli numer jest pusty lub zajęty → `getHighestVisibleArrowNumber + 1`

Toggle OFF bez zmian — tylko `showNumber=false`, numer zapamiętany.

### `addArrowAtCursor` (auto-numbering)
Nadal używa `getHighestArrowNumber` (all arrows) — to poprawne, bo nowa strzałka nie ma jeszcze swojego numeru, więc nie ma ryzyka "samoinkrementacji".

## Co zrobiłem

### Zmienione pliki
1. **`apps/web/src/store/slices/elementsSlice.ts`**
   - Dodano `getHighestVisibleArrowNumber()` — tylko visible arrows
   - Dodano `getVisibleArrowNumbers()` — Set numerów visible arrows
   - Przepisano ON-branch `toggleArrowNumber`: restore remembered number lub `maxVisible + 1`
   - OFF-branch bez zmian

2. **`apps/web/src/store/slices/__tests__/arrowRenumber.integration.test.ts`**
   - Dodano describe `toggleArrowNumber — real store` z 5 testami:
     - OFF/ON single arrow preserves 1
     - visible 1,2 + new ON → 3
     - hidden 3 restored as 3 if not taken
     - hidden 3 gets 5 if visible 1,2,3,4
     - exactly 1 history snapshot per toggle

### Raport `thoughts/`
- `2159_delivery_arrow-inspector-fixes.md` — już istnieje z poprzednich fixów
- `2205_delivery_critical-numbering-rule.md` — niniejszy plik

## Evidence

### typecheck
```
cd apps/web && npx tsc --noEmit → exit 0
```

### test
```
Test Files  5 passed (5)
     Tests  99 passed (99)   ← +5 nowych testów
```

### Manual reasoning check
| Scenariusz | Zachowanie |
|---|---|
| Strzałka showNumber=1, OFF→ON | number=1 showNumber=true (restore) |
| Visible 1,2, hidden new ON | number=3 (maxVisible+1) |
| Hidden with 3, visible don't use 3 | number=3 showNumber=true (restore) |
| Hidden with 3, visible 1,2,3,4 | number=5 (maxVisible+1) |
| Toggle OFF→ON→OFF→ON x10 | Zawsze ten sam number przy restore |

## Status DoD
- [x] `toggleArrowNumber` przywraca zapamiętany numer zamiast zawsze dawać max+1
- [x] Przywracanie tylko gdy numer nie jest zajęty przez widoczną strzałkę
- [x] Nowe testy (5) dla zachowania OFF/ON restore i konfliktów
- [x] Testy przechodzą (99/99)
- [x] Typecheck przechodzi
- [x] `addArrowAtCursor` (auto-numbering) nietknięte — dalej liczy wszystkie
- [x] Raport zapisany

## Dla następnej iteracji / następnego agenta
Brak — zadanie wykonane w 1 iteracji.