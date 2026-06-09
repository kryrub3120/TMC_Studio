# Delivery — UX-3 Virtual Canvas (resize + zoom shortcuts + DOM fix)
**Data:** 2026-06-09
**Iteracja:** 1 (final)

## Zadanie
Uruchomić ResizeObserver auto-scale, dodać +/− zoom shortcuts, naprawić DOM flex containment, commit i merge do develop.

## Proces myślenia
1. **ResizeObserver:** poprzednia logika `curZoom * newFitZoom > 1` była błędna — mnożyła dwa zoomy. Wystarczy proste `curZoom > newFitZoom` (jeśli aktualny zoom jest większy niż fitZoom dla nowego okna).
2. **Zoom shortcuts:** `+`/`=` i `-` już istniały w `useKeyboardShortcuts.ts` ale tylko z Cmd. Wystarczyło dodać `else if (!isCmd)` fallback.
3. **DOM layout:** ResizeObserver nie działał bo CSS flexbox nie pozwalał kontenerowi się kurczyć. `aspect-[4/3]` w CanvasShell wymuszał proporcje, `overflow-auto` dawał scroll zamiast skalowania, brak `min-w-0` w flex wrapperze blokował kurczenie. Rozwiązanie: absolute container + min-w-0/min-h-0.
4. **Escaped quotes bug:** poprzedni multi_replace wstawił `\"` zamiast `"` co zepsuło składnię JSX.

## Co zrobiłem
- **Commit 1:** `fix(canvas): raw resize observer logic and add zoom shortcuts` — uproszczona logika ResizeObserver, dodane plain +/- do zoomIn/Out, CheatSheet aktualizacja
- **Commit 2:** `fix(canvas): apply absolute DOM structure to allow canvas shrinking` — min-w-0, absolute inset-0, usunięcie aspect-[4/3]
- **Hotfix:** naprawa escaped quotes w BoardPage.tsx
- **Dokumentacja:** FEATURE_SPEC.md (sekcja 3.1, shortcut reference), CHANGELOG.md, PR-UX-3 plan (status → completed, dodane actual commits)

## Napotkane problemy
- Multi_replace wstawił `\"` zamiast `"` — trzeba ręcznie poprawić
- 3 iteracje zanim ResizeObserver faktycznie zadziałał: (1) błędna formuła → (2) zła formuła + brak shortcutów → (3) DOM nie pozwalał shrinkować → (4) fix

## Wynik
- ResizeObserver działa: zmniejszanie okna skaluje boisko w dół i centruje
- `+` i `-` (bez Cmd) zoomują
- Struktura DOM pozwala na faktyczne kurczenie flex kontenera
- Wszystkie commity na `feature/ux-3-virtual-canvas`, gotowe do merge

## Status DoD
- [x] ResizeObserver poprawnie skaluje przy resize
- [x] + i - skróty działają i respektują viewportLocked
- [x] CheatSheet pokazuje nowe skróty
- [x] FEATURE_SPEC.md, CHANGELOG.md, PR-UX-3 plan zaktualizowane
- [x] Plik thoughts zapisany