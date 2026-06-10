# [Delivery] — Sprint C — Verification Fix: Real Tests + Evidence
**Data:** 2026-06-10 17:25
**Iteracja:** 1

## Zadanie
Naprawić uruchamianie testów i dostarczyć realne testy integracyjne, które potwierdzają zachowanie store/slice.

## Decyzje i uzasadnienie

### Instalacja vitest
Poprzednio `vitest` był dodany do `package.json` ale nie zainstalowany w node_modules. Użyto `pnpm --filter @tmc/web add -D vitest` co zainstalowało 34 pakiety i zaktualizowało lockfile.

### Konfiguracja vitest
Dodano blok `test` w `vite.config.ts`:
- `environment: 'node'` — zmieniono z 'jsdom' po review (jsdom nie był potrzebny, localStorage mockowany ręcznie)
- `setupFiles: ['./src/test-setup.ts']` — mocki dla logger i supabase

### Test setup (`src/test-setup.ts`)
- `localStorage` mock — potrzebny bo `createDocumentSlice` woła `loadFromLocalStorage`
- Mock `../lib/logger` — bo `logger` używa `import.meta.env` które nie istnieje w test environments bez Vite
- Mock `../lib/supabase` — bo używa `import.meta.env.VITE_SUPABASE_*` i tworzy klienta Supabase

### Realne testy integracyjne
Zamiast kopiować logikę do helperów, test buduje **prawdziwą instancję Zustand store** z wszystkimi slice'ami (document, elements, history, selection, steps, groups, drawing) — identycznie jak w `store/index.ts`.

To pozwala:
- sprawdzić że `renumberAllArrows` NIE woła `pushHistory` poprzez bezpośrednie sprawdzenie `history.length` przed i po
- sprawdzić że `deleteSelected` robi delete + renumber + JEDEN snapshot
- sprawdzić że `toggleAutoNumbering` robi toggle + renumber + JEDEN snapshot
- sprawdzić że toggle OFF nie wywołuje renumber (bo `wasOff === false`)

## Co zrobiłem

### 1. Instalacja vitest ✅
```bash
pnpm --filter @tmc/web add -D vitest
```

### 2. Konfiguracja vitest w `vite.config.ts`
- `test.environment = 'jsdom'`
- `test.setupFiles = ['./src/test-setup.ts']`

### 3. Nowy plik `src/test-setup.ts`
- Mock `localStorage` (global)
- Mock `../lib/logger`
- Mock `../lib/supabase`

### 4. Nowy plik `src/store/slices/__tests__/arrowRenumber.integration.test.ts` — 11 testów
**renumberAllArrows (2 testy):**
- przelicza 3 strzałki na 1,2,3
- NIE zwiększa `history.length` (potwierdza brak `pushHistory`)

**deleteSelected (4 testy):**
- usuwa + renumber
- JEDEN snapshot historii
- delete non-numbered nie triggeruje renumber
- empty selection nie zmienia nic

**toggleAutoNumbering (5 testów):**
- toggle włącza `isAutoNumbering`
- włączenie → renumber 5,3 → 1,2
- JEDEN snapshot przy włączeniu
- wyłączenie nie renumber (bo `wasOff === false`)
- dwa toggle'e → dwa snapshoty

## Evidence

### Testy
```
✓ src/store/slices/__tests__/arrowRenumber.test.ts (14 tests)
✓ src/store/slices/__tests__/arrowRenumber.integration.test.ts (11 tests)
✓ src/utils/__tests__/viewportUtils.test.ts (27 tests)
✓ src/store/slices/__tests__/vision.logic.test.ts (21 tests)
✓ src/store/slices/__tests__/documentSlice.orientationTransform.test.ts (21 tests)

Test Files  5 passed (5)
     Tests  94 passed (94)
```

### TypeScript
```
pnpm --filter @tmc/web typecheck → exit 0, no errors
```

## Zmienione pliki
- `apps/web/vite.config.ts` — dodano `test` config (environment: node, setupFiles)
- `apps/web/src/test-setup.ts` — NOWY: localStorage mock, logger mock, supabase mock
- `apps/web/src/store/slices/__tests__/arrowRenumber.integration.test.ts` — NOWY: 11 realnych testów integracyjnych

## Evidence (LOOP AGAIN #2 — final)

### `pnpm --filter @tmc/web test`
```
✓ src/store/slices/__tests__/arrowRenumber.test.ts (14 tests)
✓ src/utils/__tests__/viewportUtils.test.ts (27 tests)
✓ src/store/slices/__tests__/vision.logic.test.ts (21 tests)
✓ src/store/slices/__tests__/documentSlice.orientationTransform.test.ts (21 tests)
✓ src/store/slices/__tests__/arrowRenumber.integration.test.ts (11 tests)

Test Files  5 passed (5)
     Tests  94 passed (94)
```

### `pnpm --filter @tmc/web typecheck` → exit 0
### `pnpm --filter @tmc/board typecheck` → exit 0

## Status DoD
- [x] `pnpm --filter @tmc/web test` działa — 94/94 ✅
- [x] `pnpm --filter @tmc/web typecheck` działa — exit 0 ✅
- [x] Realne testy store/slice — 11 testów na realnej instancji Zustand store
- [x] Potwierdzono: `renumberAllArrows` NIE woła `pushHistory`
- [x] Potwierdzono: `deleteSelected` robi delete + renumber + JEDEN snapshot
- [x] Potwierdzono: `toggleAutoNumbering` robi toggle + renumber + JEDEN snapshot (ON), toggle OFF nie renumber
- [x] Plik `thoughts/` zapisany

## Wynik
✅ **PASS** — Sprint C zweryfikowany poprawnie. Wszystkie krytyczne aspekty potwierdzone realnymi testami na pełnej instancji store.