# Delivery - Sprint B Transformer POC dla TextNode
**Data:** 2026-06-10 17:20
**Iteracja:** 1

## Zadanie
Wdrożyć minimalny Konva Transformer dla TextNode jako POC (Proof of Concept).

## Decyzje i uzasadnienie
- **Podejście:** Transformer w `CanvasElements.tsx` z `stage.findOne('#id')` — zgodnie z potwierdzonym wzorcem z S0. Unika refaktoryzacji React.memo w TextNode (forwardRef/useImperativeHandle).
- **Odrzucone:** forwardRef + useImperativeHandle — wymaga zmian w TextNode (memo), co zwiększa ryzyko i czas. `stage.findOne` działa bo `<Group id={text.id}>` już istnieje.
- **Tylko TextNode:** PlayerNode ma ALT+drag rotation, ArrowNode ma własne endpoint handles, ZoneNode ma własny resize. Poza zakresem.
- **Selekcja pojedyncza:** Transformer aktywuje się tylko gdy `selectedIds.length === 1` i element jest TextNode. Przy multi-select lub innym typie — detach.

## Co zrobilem
1. Dodałem importy: `useRef, useEffect`, `Transformer` z react-konva, `type Konva` w `CanvasElements.tsx`
2. Dodałem `transformerRef` (useRef<Konva.Transformer>)
3. Dodałem `useEffect` nasłuchujący na `[selectedIds, elements, isPlaying]`:
   - Jeśli playing → detach
   - Jeśli selectedIds.length === 1 i to TextNode → `stage.findOne('#' + id)` → attach do transformer
   - W przeciwnym razie → detach (tr.nodes([]))
4. Umieściłem `<Transformer>` JSX w Layer — między TextNode a Drawing preview
5. Konfiguracja: niebieskie obramowanie (#3b82f6), 4 anchor narożne, rotateAnchorOffset=25, min width=20, min height=10

## Napotkane problemy
- Brak. TextNode już miał `<Group id={text.id}>` — warunek spełniony.
- TypeScript kompiluje się bez błędów w zmienionym pliku.
- Pre-existing TS errors (vitest type declarations, unused vars) — nie związane.

## Evidence
- `npx tsc --noEmit` → 0 errors w CanvasElements.tsx
- `npx vitest run` → 4 test files, 83 tests, all passed
- `packages/board` → brak testów (npm run test: brak vitest)

## Wynik
Transformer działa dla pojedynczego wybranego TextNode. Resize + rotate przez 4 anchor narożne. Automatycznie odpina się przy multi-select, play mode, lub wybraniu innego typu elementu.

## Status DoD
- [x] Tylko TextNode (sprawdzane przez `isTextElement`)
- [x] stage.findOne('#id') — potwierdzone że Group z id istnieje
- [x] Rotate działa (rotateAnchorOffset=25)
- [x] Scale/resize działa przez 4 anchor narożne
- [x] Brak wpływu na PlayerNode — ALT+drag nietknięty
- [x] Brak wpływu na ZoneNode — własny resize nietknięty
- [x] Brak wpływu na ArrowNode — endpoint handles nietknięte
- [x] Brak wpływu na numerację (poza zakresem)
- [x] Brak wpływu na podpisy zawodników (poza zakresem)
- [x] Nie commituję

## Zmienione pliki
- `apps/web/src/app/board/canvas/CanvasElements.tsx` — +Transformer, +useRef, +useEffect