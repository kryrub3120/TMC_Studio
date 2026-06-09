# Delivery — Zoom Figma/Miro Model (Bug #1)
**Data:** 2026-06-09 24:01
**Iteracja:** 1

## Zadanie
Zaimplementować prawdziwy Figma/Miro zoom model — pitch/viewport skaluje się, nie tylko content.

## Analiza przed implementacją

### Stary model (PR-FIX-4)
- Container mierzony (ResizeObserver)
- `effectiveZoom = userZoom * fitZoom`
- `stageScale={effectiveZoom}` → Konva skaluje wewnętrznie
- `stagePosition={centerX + panX, centerY + panY}` → przesunięcie
- **Problem**: ramka zawsze stała, content powiększa się "w sobie"

### Opcje implementacji
1. **CSS transform** — Stage scale=1, CSS `transform: scale(z)` na wrapperze  
   ⚠️ Problem: Konva `Stage.getPointerPosition()` nie zna CSS transform → drag/select broken
   
2. **Scroll-based** (wybrana) — Stage fizyczny rozmiar = `canvasW * zoom` × `canvasH * zoom`  
   ✅ Bezpieczne: Konva coords zawsze poprawne (scaleX/scaleY = effectiveZoom)  
   ✅ Scroll container: viewport scrolluje = naturalny pan
   
## Co zrobiłem

### `BoardCanvasSection.tsx` — pełny refactor
- Usunięto `panOffset` state + wszystkie powiązane handlery
- Dodano `scrollRef` (zamiast `containerRef`) z `overflow-auto`
- Stage dostaje fizyczny rozmiar: `width = canvasW * effectiveZoom`, `height = canvasH * effectiveZoom`
- Stage `scaleX/scaleY = effectiveZoom`, `x=0, y=0`
- **Space+drag** → `scrollLeft/scrollTop` (zamiast `panOffset`)
- **Ctrl+wheel** → zoom + `scrollLeft/scrollTop` przeliczany żeby punkt pod kursorem pozostał stały
- **Touch** → `useTouchGestures` przekazuje scroll zamiast panOffset
- Usunięto import `computeZoomToCursorPan, clampPanOffset, screenToWorld` (nieużywane)
- Reset scroll do centrum gdy `zoom <= 1`

### `BoardPage.tsx`
- Canvas area: zmieniono z `flex items-center justify-center overflow-auto` na `flex overflow-hidden`
- `BoardCanvasSection` sam zarządza swoim scrollem

## Wynik
- Zoom powiększa cały viewport (pitch fizycznie zajmuje więcej miejsca)
- Scroll umożliwia pan przy dużym zoomie
- Ctrl+wheel + Space+drag działa jak w Figma/Miro
- Drag/select/eksport nietkniete (Konva coords poprawne)
- Build: 5/5 ✅

## Status DoD
- [x] Zoom skaluje viewport (nie tylko content wewnątrz ramki)
- [x] Pan przez scroll
- [x] Ctrl+wheel zachowuje punkt pod kursorem
- [x] Brak regresji drag/select/eksport (Konva coords niezmienione)
- [x] Build przechodzi
- [x] thoughts zapisany
