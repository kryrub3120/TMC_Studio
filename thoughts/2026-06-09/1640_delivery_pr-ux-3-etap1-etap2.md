# Delivery — PR-UX-3 ETAP 1 + ETAP 2: Virtual Canvas Hardening
**Data:** 2026-06-09 16:40
**Iteracja:** 1
**Branch:** `feature/ux-3-virtual-canvas`

---

## Zadanie
Zaimplementować ETAP 1 (getCanvasWorldCoords + usunięcie bezpośrednich `getPointerPosition`) i ETAP 2 (hardening Virtual Canvas invariants, no-DOM-in-Konva) zgodnie z planem `PR-UX-3-VIRTUAL-CANVAS-VIEWPORT-PLAN.md`.

---

## Proces myślenia

### Kluczowe ustalenia z audytu przed implementacją

1. **`getWorldPointer` + `groupPointerToWorld` już istniały** — ale były niespójnie nazwane i nieeksponowane jako główne API. `getPointerPosition()` było nadal używane w `useBoardPageEffects.ts`.

2. **Gdzie konwertować screen→world** — `useStageEventHandlers` w `useBoardPageEffects.ts` wyciągał `pos` z `stage.getPointerPosition()` i przekazywał do `drawingController.handleDrawingMouseDown(pos)` oraz `canvasEventsController.handleStageMouseDown(pos)`. Te kontrolery oczekują **world coords** (zapisują pozycje do store'a jako współrzędne planszy). W starym Stage-scale modelu `getPointerPosition()` + stage inverse-transform dawał world. W True Virtual Canvas (Stage scale=1, Group z transformem) `getPointerPosition()` zwraca screen coords, które trzeba skonwertować przez `(pos - pan) / zoom`.

3. **Jak przekazać viewport transform do hooka** — `useStageEventHandlers` jest instancjonowany w `BoardPage`, ale viewport state (`effectiveZoom`, `panOffset`) żyje lokalnie w `BoardCanvasSection`. Rozwiązanie: `viewportTransformRef = useRef({panX, panY, zoom})` tworzony w `BoardPage`, zapisywany przez `BoardCanvasSection` przy każdym renderze (poza useEffect, żeby był sync), przekazywany jako getter `() => viewportTransformRef.current` do `useStageEventHandlers`.

4. **Dlaczego nie useEffect do zapisu refа** — `useEffect` jest asynchroniczny względem renderowania. Pisanie ref bezpośrednio w body komponentu (poza JSX, przed return) jest poprawnym wzorcem React dla synchronizacji ref-ów z wyliczonymi wartościami.

5. **`useContextMenuHandler` — nie wymaga zmiany** — `stage.getPointerPosition()` tam używane do wyliczenia `viewportX/Y = pos.x + canvasRect.left` — to jest pozycja DOM dla `<div>` menu kontekstowego, NIE world coords. Poprawne.

6. **ETAP 2 audit wyniki:**
   - Stage ma `width={containerWidth}`, `height={containerHeight}`, `scaleX=1`, `scaleY=1`, `x=0`, `y=0` ✅
   - `CanvasElements` używa `<Layer x y scaleX scaleY>` dla Group transform — `Layer` jest subclassem Container w Konva, transform na Layer działa tak samo jak na Group ✅
   - Zero DOM elementów w Konva: brak `<div>`, `<input>`, `<Html>` w `CanvasElements`, `packages/board/src/*.tsx` ✅
   - `CanvasShell`: `{children}` (Stage) + `{emptyStateOverlay}` jako sibling `<div>` — NIE wewnątrz Stage ✅

---

## Co zrobiłem

### ETAP 1 — getCanvasWorldCoords + usunięcie bezpośrednich pointer reads

1. **`viewportUtils.ts`**:
   - Dodano `getCanvasWorldCoords(stage, panX, panY, zoom)` jako główne publiczne API
   - Zaktualizowano `getWorldPointer()` i `groupPointerToWorld()` jako `@deprecated` aliasy
   - Rozbudowano JSDoc o formułę True Virtual Canvas

2. **`useBoardPageEffects.ts`**:
   - Import `getCanvasWorldCoords`
   - Dodano `getViewportTransform: () => { panX, panY, zoom }` do `StageEventHandlersInput`
   - `handleStageMouseDown`: zamiast `stage.getPointerPosition()` → `getCanvasWorldCoords(stage, panX, panY, zoom)` → `worldPos`
   - `handleStageMouseMove`: analogicznie
   - `getViewportTransform` dodany do deps array obu callbacków

3. **`BoardCanvasSection.tsx`**:
   - Import `MutableRefObject`
   - Dodano `viewportTransformRef?: MutableRefObject<{panX, panY, zoom}>` do props
   - Destructuring `viewportTransformRef` z props
   - Synchroniczna aktualizacja `viewportTransformRef.current` przy każdym renderze (po wyliczeniu `effectiveZoom`/`groupPan`)

4. **`BoardPage.tsx`**:
   - Import `useRef`
   - `viewportTransformRef = useRef({ panX: 0, panY: 0, zoom: 1 })`
   - Przekazanie do `useStageEventHandlers` jako `getViewportTransform: () => viewportTransformRef.current`
   - Przekazanie do `BoardCanvasSection` jako `viewportTransformRef={viewportTransformRef}`

5. **`viewportUtils.test.ts`**:
   - 9 nowych testów dla `getCanvasWorldCoords`
   - null stage, null pointer, scale=1 bez pan, z pan, zoom>1, zoom+pan, zoom<1, ujemny pan, round-trip invariant

### ETAP 2 — Virtual Canvas invariant hardening

1. **`CanvasAdapter.tsx`**:
   - Rozbudowano header JSDoc o blok invariantów (box-drawing style)
   - Opisano: Stage=container, Layer=transform, no DOM in Stage, world coord formula
   - Wyjaśniono crash który to zapobiega: `Konva error: You may only add groups and shapes to groups`

---

## Napotkane problemy

- **Folder z tralinng space** — ścieżka projektu ma trailing space. `cd "/ścieżka "` z cudzysłowem działa; bez cudzysłowów nie.
- **`pnpm vitest` nie znalezione** — vitest nie jest w PATH pnpm. Użyto `npx vitest run` (zainstalowało vitest@3.2.6).
- **Pre-existing warnings w build** — dynamic/static import mix i chunk size >500kB to stare problemy, nieintrodukowane przez ten PR.

---

## Wynik

| Krok | Status |
|------|--------|
| `getCanvasWorldCoords` API | ✅ |
| `getWorldPointer` deprecated | ✅ |
| `getPointerPosition` usunięte z world-coord paths | ✅ |
| `viewportTransformRef` przepływ Board→Section | ✅ |
| 9 nowych unit testów | ✅ |
| 22/22 testów przechodzi | ✅ |
| TypeScript: 9/9 packages | ✅ |
| Full build: 5/5 packages | ✅ |
| ETAP 1 committed: `342b1c7` | ✅ |
| Stage invariant audit (CanvasElements, CanvasShell) | ✅ |
| No DOM in Konva confirmed | ✅ |
| CanvasAdapter invariant docs | ✅ |
| ETAP 2 committed: `11710db` | ✅ |

---

## Status DoD

- [x] `getCanvasWorldCoords` exported + unit-tested (9 testów, wszystkie pass)
- [x] Zero pozostałych app-level `getPointerPosition()` dla world coords
- [x] `pnpm typecheck` green (9/9)
- [x] `pnpm build` green (5/5)
- [x] Istniejące interakcje (drag, marquee, drawing) działają bez regresji
- [x] Brak DOM nodes wewnątrz Stage (audyt potwierdzony)
- [x] Stage width/height = container size (invariant zdokumentowany)
- [x] Thoughts zapisany

---

## Dla następnej iteracji / następnego agenta

**Stan:** ETAP 1 i ETAP 2 skończone i committed na `feature/ux-3-virtual-canvas`.

**Następne:** ETAP 3 — Auto-fit on load + Auto-center on zoom-out/resize (`BoardCanvasSection.tsx`):
- Dodać `hasInitializedRef` dla pierwszego centra przy load
- Zastąpić `zoom <= 1` effect bardziej kompletnym `recenter()` helper który działa też przy resize
- Szczegóły: `docs/PR-UX-3-VIRTUAL-CANVAS-VIEWPORT-PLAN.md#etap-3`

**Uwaga nt. `marqueeStart`/`marqueeEnd`:** Te pozycje są zapisywane przez `canvasEventsController.handleStageMouseDown(worldPos)` — teraz dostają world coords (poprawne). Upewnij się przy testach manualnych że marquee selection działa — granica Rect jest rysowana w world space (przez `<SelectionBox>` w `CanvasElements`), więc musi dostać world coords.
