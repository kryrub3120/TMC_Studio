# Delivery — Plan implementacji 3 sprintów
**Data:** 2026-06-10 10:30
**Iteracja:** 1

## Zadanie
Stworzyć szczegółowy plan implementacji na 3 sprinty (Sprint 1-3) z pętlą samooceny 3×, na podstawie `docs/AUDIT_COMPREHENSIVE_2026_06_10.md` i rzeczywistego kodu źródłowego.

## Proces myślenia
1. **Najpierw audyt** — przeczytałem cały `AUDIT_COMPREHENSIVE_2026_06_10.md` (762 linie), który identyfikuje 9 Issues z priorytetami, plikami i strategiami naprawy.
2. **Rzeczywisty kod** — zamiast polegać tylko na audycie, przeczytałem rzeczywiste pliki źródłowe:
   - `CanvasElements.tsx` — potwierdzenie braku Transformer, struktura props, Layer
   - `BoardCanvasSection.tsx` — ResizeObserver, wheel zoom, panowanie
   - `useUIStore.ts` — pełen stan UI, zweryfikowałem brak `userHasManuallyZoomed`
   - `elementsSlice.ts` — deleteSelected, toggleArrowNumber, getHighestArrowNumber
   - `documentSlice.ts` — isAutoNumbering istnieje i działa
   - `PlayerNode.tsx` — font rendering, zoom prop, ALT+drag rotation
   - `ArrowNode.tsx` — endpoint handles (Circle na start/end)
   - `ZoneNode.tsx` — istniejący 8-punktowy resize system
   - `AutosaveService.ts` — singleton, configure, executeSave, brak thumbnail
   - `useKeyboardShortcuts.ts` — undo ma showToast, redo NIE MA
   - `ZoomWidget.tsx` — brak aria-label na ZoomIn/ZoomOut/ZoomFit
   - `BoardPage.tsx` — kompozycja, ZoomWidget, RightInspector, CanvasSection
   - `CanvasAdapter.tsx` — True Virtual Canvas invariants
   - `Design System` — z-index tokens, kolory, komponenty
   - `AGENTS_CHECKLIST.md` — reguły UI/DB
3. **Planowanie sprintów** — dopasowałem Issues do sprintów według:
   - Zależności technicznych (Sprint 1 = fundament, Sprint 2 = polish, Sprint 3 = dodatki)
   - Priorytetów z audytu (P0→P2)
   - Realistycznego czasu (min 7h, max 17h na sprint)
4. **Pętla samooceny 3×** — każda pętla sprawdzała inny aspekt:
   - Loop 1: zgodność z architekturą (True Virtual Canvas, jednokierunkowy przepływ)
   - Loop 2: zależności między sprintami i ryzyka techniczne
   - Loop 3: devil's advocate — regresje, szacunki, pominięcia, MVP

## Co zrobiłem
1. Przeczytałem `docs/AUDIT_COMPREHENSIVE_2026_06_10.md` w całości (762 linie)
2. Przeczytałem ~20 rzeczywistych plików źródłowych (łącznie ~2000 linii)
3. Zidentyfikowałem konkrety:
   - Brak Transformer w CanvasElements.tsx — potwierdzony
   - `isAutoNumbering` już istnieje w documentSlice.ts — nie trzeba tworzyć od nowa
   - ArrowNode ma endpoint handles — nie dublować Transformer
   - Zoom jest przekazywany jako prop do PlayerNode (procentowo)
   - Brak `userHasManuallyZoomed` w useUIStore — trzeba dodać
   - Brak `showToast` przy redo — trzeba dodać
   - `uploadThumbnail` istnieje w supabase.ts — tylko podłączyć
4. Stworzyłem `docs/IMPLEMENTATION_PLAN_SPRINTS.md` (pełny plan, ~450 linii)
5. Wykonałem 3 pętle samooceny z korektami

## Napotkane problemy
1. **Transformer w PlayerNode** — nie jest jasne czy Transformer ma zastąpić czy uzupełnić ALT+drag rotation. Decyzja: PlayerNode NIE dostaje Transformer, zostaje przy ALT+drag. Transformer dla ZoneNode (z zachowaniem istniejącego resize) i TextNode.
2. **Ref callback a React.memo** — komponenty w packages/board/ używają React.memo. Aby Transformer działał, trzeba dodać forwardRef + useImperativeHandle do PlayerNode, ZoneNode, TextNode, BallNode. To zwiększa czas Sprint 1.
3. **AutosaveService to singleton** — stageRef musi być przekazany przez configure(), ale configure() jest wołany raz. Trzeba zaktualizować configure() lub dodać setStageRef().
4. **Tutorial highlight** — data-atrybuty muszą być dodane w 5 istniejących komponentach. To oznacza modyfikacje w BoardTopBarSection, BoardCanvasSection, ZoomWidget, ShortcutsHint.

## Wynik
- Plik: `docs/IMPLEMENTATION_PLAN_SPRINTS.md`
- 3 sprinty, 9 zadań, ~43h łącznie (z buforem 20%)
- Ocena końcowa: 7.5/10
- Największe ryzyko: Transformer (regresja drag & drop)
- Najprostsze zadanie: 2B (font scaling, 2-3h)

## Status DoD
- [x] Przeczytany cały AUDIT_COMPREHENSIVE_2026_06_10.md
- [x] Przeczytane rzeczywiste pliki źródłowe
- [x] Plan zawiera 3 sprinty z tabelami zadań
- [x] Każde zadanie ma plik, linię, czas, ryzyko
- [x] Każde zadanie ma pseudokod/diff dla najtrudniejszego fragmentu
- [x] Każde zadanie ma DoD
- [x] Każdy sprint ma podsumowanie z MVP
- [x] Wykonane 3 pętle samooceny (Loop 1-3)
- [x] Ocena końcowa w skali 1-10
- [x] Plik thoughts zapisany

## Dla następnej iteracji / następnego agenta
- Sprint 1 (zadanie 1B) może być wykonane jako pierwsze — najmniejsze ryzyko, buduje kontekst
- Przed Sprint 1A: przygotuj forwardRef w PlayerNode, ZoneNode, TextNode — to jest warunek wstępny
- Pamiętaj o `--no-cache` flag w Turborepo przy zmianach w packages/board/
- Nie modyfikuj `.env.production` — wszystkie zmiany tylko Dev
- Każda zmiana wymaga pliku thoughts w `thoughts/2026-06-10/`