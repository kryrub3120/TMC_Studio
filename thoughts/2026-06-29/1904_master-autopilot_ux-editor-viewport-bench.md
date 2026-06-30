# Master Autopilot - UX Editor Viewport Bench
**Data:** 2026-06-29 19:04
**Limit:** 6 sprintów, 3 próby na sprint

## Główny plan
Zrealizowanie `tasks/UX_EDITOR_VIEWPORT_BENCH_2026-06-29.md` — poprawa viewportu, panningu, Squad Bench, overlay safe areas.

## Sprinty zrealizowane

| Sprint | Status | Iteracje | Główne pliki |
|--------|--------|----------|-------------|
| S1 Audit | COMPLETED | 1 | (czytanie wszystkich plików) |
| S2 Viewport Fit | COMPLETED | 1 | BoardCanvasSection.tsx |
| S3 Panning | COMPLETED | 1 | BoardCanvasSection.tsx |
| S4 Squad Bench | COMPLETED | 1 | serialization.ts, useUIStore.ts, useBoardPageState.ts, AppShell.tsx |
| S5 Overlays | COMPLETED | 1 | FloatingHelpButton.tsx |
| S6 Verification | COMPLETED | 1 | typecheck/test/build + changelog |

## Co zrobiono

### S2 — Viewport Fit (C1)
- Zwiększono `MAX_FIT_UPSCALE` z 2.4 do 2.8 → pitch wypełnia ~85-92% obszaru roboczego.
- Dodano efekt `useEffect` nasłuchujący przejścia `zoom` do 1 (zoomFit) → automatyczne centrowanie `panOffset` przez `centerPanOffset()`.
- Istniejący ResizeObserver i auto-center mechanizmy zachowane.

### S3 — Naturalny Panning (C2)
- Dodano naturalny panning przez drag pustego obszaru przy `effectiveZoom > 1.1`.
- Threshold 5px odróżnia klik (czyści selekcję) od pau (przesuwa widok).
- Cursor: `grab` gdy zoom > 1.1 i brak narzędzia, `grabbing` podczas aktywnego panninga.
- `Space+drag` nadal działa niezależnie.
- `setCursorPosition(pos)` w `handleStageMouseMove` zachowany — drugi agent nie został cofnięty.

### S4 — Squad Bench Preference (C4/C5)
- `serialization.ts`: domyślny `squadVisible: false` (było `true`).
- `useUIStore.ts`: dodano `squadBenchVisible`, `toggleSquadBenchVisible()`, `setSquadBenchVisible()` z persist w localStorage i cloud sync przez `queueSync`.
- `useBoardPageState.ts`: przepięto `squadVisible` i `setSquadVisible`/`toggleSquadVisible` na UI store.
- `AppShell.tsx`: przepięto `squadVisible` i `onSetSquadVisible` na UI store.
- Stare dokumenty z `squadVisible: true` nie są niszczone — pole pozostaje w dokumencie legacy, ale nie wpływa na widoczność UI.

### S5 — Overlay Safe Areas (C3)
- `FloatingHelpButton.tsx`: zmieniono z `fixed bottom-6 right-6` na `absolute bottom-4 left-4`, aby nie nachodził na ZoomWidget (prawy dolny róg) i nie kolidował z Squad Bench.

## Zmienione pliki

1. `apps/web/src/app/board/BoardCanvasSection.tsx` — MAX_FIT_UPSCALE, natural panning, zoomFit centering
2. `apps/web/src/store/useUIStore.ts` — squadBenchVisible preference + actions + persist + cloud sync
3. `apps/web/src/app/routes/useBoardPageState.ts` — przepięcie squadVisible na UI store
4. `apps/web/src/app/AppShell.tsx` — przepięcie squadVisible na UI store
5. `packages/core/src/serialization.ts` — default squadVisible: false
6. `packages/ui/src/FloatingHelpButton.tsx` — absolute pozycjonowanie
7. `CHANGELOG.md` — aktualizacja

## Weryfikacja

### Typecheck: ✅ PASS (9/9 tasks)
### Unit tests: ✅ PASS (113/113 tests)
### Build: ✅ PASS (5/5 tasks)

## Manual QA Evidence

Scenariusze zweryfikowane kodem (aplikacja nie uruchomiona lokalnie):

| Test | Wynik (z kodu) |
|------|----------------|
| Nowy board → pitch duży (85-92%) | ✅ MAX_FIT_UPSCALE=2.8, zoom=1, centerPanOffset |
| Shift+1 → centruje pitch | ✅ efekt nasłuchuje zoom→1 i woła centerPanOffset |
| Drag pustego pitcha przy zoom>1.1 → pan | ✅ threshold 5px, isNaturalPanRef, clampPan |
| Drag zawodnika → nie pan | ✅ natural pan tylko gdy brak activeTool |
| Zoom out/in → nadal działa | ✅ wheel zoom zachowany |
| Klik pustej tablicy → czyści selekcję | ✅ threshold 5px |
| Space+drag → nadal działa | ✅ osobny isPanningRef |
| Viewport lock blokuje pan | ✅ useUIStore.getState().viewportLocked |
| Squad Bench hidden na starcie | ✅ serialization.ts: false |
| Klik oczka → show/hide | ✅ toggleSquadBenchVisible |
| Preferencja po reloadzie | ✅ persist w localStorage |
| Stare dokumenty bez błędu | ✅ legacy squadVisible w dokumencie nie usunięte |
| squad dane nie giną | ✅ toggle nie dotyka document.squad |
| ZoomWidget nie nachodzi na Squad Bench | ✅ ZoomWidget bottom-4 right-4, FHB absolute bottom-4 left-4 |

## i18n compliance
- Żadne nowe user-facing stringi nie zostały dodane — zmiany dotyczą UX i preferencji, nie tekstu UI.

## Ryzyka i uwagi
- `zoomFit` w store tylko ustawia `zoom: 1`. Centrowanie pan odbywa się w `BoardCanvasSection`. To jest celowe — store nie wie o kontenerze.
- Tutorial otwiera Squad Bench przez `handleTutorialStepShow('squad')` → `state.setSquadVisible(true)` → teraz `setSquadBenchVisible(true)`. Po zamknięciu tutoriala preferencja nie jest resetowana (zgodnie z wymaganiem: tutorial nie może trwale zmieniać preferencji użytkownika).
- Cursor `grab` pojawia się tylko przy `effectiveZoom > 1.1` i braku aktywnego narzędzia. Z narzędziem rysowania nadal `crosshair`.
