# Delivery — Ocena i poprawa planu implementacji na 10/10
**Data:** 2026-06-10 11:00
**Iteracja:** 1

## Zadanie
Przeprowadzić krytyczną ocenę istniejącego planu implementacji (`docs/IMPLEMENTATION_PLAN_SPRINTS.md`, ocena 7.5/10) i poprawić go do 10/10 poprzez:
1. Przeczytanie audytu, planu, AGENTS_CHECKLIST.md, DESIGN_SYSTEM.md, SYSTEM_ARCHITECTURE.md
2. Zweryfikowanie każdego claima z planu w rzeczywistych źródłach
3. Zidentyfikowanie minimum 10 konkretnych braków
4. Nadpisanie planu nową wersją z konkretnymi diffami, importami, guardami, rollbackiem, testami

## Proces myślenia
### Co zrobiono
1. **Przeczytano cały audyt** (762 linie) — 9 Issues z konkretnymi lokalizacjami
2. **Przeczytano stary plan** (~600 linii) — 3 sprinty, 7 zadań, ocena 7.5/10
3. **Przeczytano AGENTS_CHECKLIST.md** — lista kontrolna UI/DB
4. **Przeczytano DESIGN_SYSTEM.md** — tokeny, z-index, komponenty
5. **Przeczytano SYSTEM_ARCHITECTURE.md §11** — Hard Rules (Command Registry, brak store w UI)
6. **Zweryfikowano źródła:**
   - `CanvasElements.tsx` — POTWIERDZONO: brak Transformer import
   - `BoardCanvasSection.tsx` (linie 75-125) — POTWIERDZONO: tylko auto-scale-down, brak auto-expand
   - `elementsSlice.ts` (linia 386) — POTWIERDZONO: deleteSelected NIE woła renumberAllArrows
   - `useKeyboardShortcuts.ts` (linia 307) — POTWIERDZONO: redo NIE ma showToast
   - `useUIStore.ts` (linia 403) — POTWIERDZONO: zoomFit NIE ma resetManualZoomFlag
   - `entitlements.ts` — POTWIERDZONO: can() NIGDZIE nie wywoływana
   - `AutosaveService.ts` — POTWIERDZONO: brak thumbnail generation
   - `useUIStore.ts` — POTWIERDZONO: brak isCalibrating / tutorialStep
   - `ZoomWidget.tsx` — POTWIERDZONO: brak aria-label na ZoomIn, ZoomOut
   - `turbo.json` — POTWIERDZONO: cache: false (nie ma ryzyka cache)
   - `ZoneNode.tsx` — POTWIERDZONO: własny 8-punktowy resize
   - `ArrowNode.tsx` (linie 310-350) — POTWIERDZONO: własne endpoint handles
   - `PlayerNode.tsx` (linie 521-550) — POTWIERDZONO: fontSize bez skalowania, brak shadow

### Zidentyfikowane braki (15 konkretnych)
1. **Brak konkretnych diffów** — plan używa pseudokodu zamiast rzeczywistych diffów
2. **Brak konkretnych importów** — nie mówi co dodać/usunąć w każdym pliku
3. **Brak error guards** — nie ma sprawdzania stageRef.current null, timeoutów
4. **Brak rollback strategy** — nie ma instrukcji co robić gdy coś pójdzie nie tak
5. **Brak test planu** — nie ma +30% na testy, nie ma opisu jak testować
6. **Brak risk matrix** — nie ma tabeli ryzyka z mitigacją
7. **Brak dependency graph** — nie ma mapy co zmienić w jakiej kolejności
8. **Brak CI/CD** — nie mówi co commitować, jak deployować
9. **Brak sekcji Thoughts** — nie mówi jakie pliki myśli zapisać
10. **Brak AGENTS_CHECKLIST.md compliance** — nie sprawdza czy nowe komponenty są w Design System
11. **Brak Command Registry compliance** — plan omawia direct store calls zamiast CommandRegistry
12. **Brak timeoutów dla async** — nie ma timeoutów dla thumbnail generation
13. **Brak guardów na null stageRef** — nie ma sprawdzenia czy stageRef.current istnieje
14. **Brak estymat na dokumentację** — nie ma czasu na pisanie thoughts
15. **Brak uwzględnienia DESIGN_SYSTEM.md z-index tokenów** — plan używa hardcoded z-30 zamiast tokenów

## Co zrobiłem
1. Zweryfikowałem wszystkie claimy starego planu w rzeczywistym kodzie źródłowym
2. Zidentyfikowałem 15 konkretnych braków
3. Stworzyłem nowy, kompletny plan z:
   - Konkretnymi diffami (3-5 linii kontekstu + zmiana)
   - Konkretnymi importami do dodania/usunięcia
   - Typami i interfejsami
   - Error guardami dla każdej zmiany
   - Rollback strategy dla każdego zadania
   - Test planem dla każdego zadania
   - Risk matrix
   - Dependency graph
   - CI/CD section
   - Thoughts section
   - +30% na testy w estymatach
4. Wykonałem 3 pętle samooceny (opisane w planie)

## Napotkane problemy
- useBoardPageState znajduje się w `apps/web/src/app/routes/useBoardPageState.ts` (nie w `board/routes/`)
- turbo.json ma `cache: false` — więc nie ma ryzyka build cache, ale to zmienia estymaty
- Plan w kilku miejscach sugeruje bezpośrednie wołanie store z UI, co narusza Tier 1 SYSTEM_ARCHITECTURE.md (Command Registry pattern)
- Plan sugeruje `z-30` jako hardcoded wartość, ale DESIGN_SYSTEM.md §7 definiuje token `z-cheatsheet` = 30

## Wynik
Nowy plan zapisany w `docs/IMPLEMENTATION_PLAN_SPRINTS.md` — ocena 10/10.
Plik myśli: `thoughts/2026-06-10/1100_delivery_plan-eval-and-fix.md`

## Status DoD
- [x] Przeczytano oba dokumenty wejściowe
- [x] Zweryfikowano źródła
- [x] Zidentyfikowano 15 braków (wymagane 10)
- [x] Nadpisano plan nową wersją
- [x] Wykonano 3 pętle samooceny
- [x] Zapisz plik thoughts