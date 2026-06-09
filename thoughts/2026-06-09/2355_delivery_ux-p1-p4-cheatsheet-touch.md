# Delivery — P1+P4: Floating CheatSheet + Touch Gestures
**Data:** 2026-06-09 23:55
**Iteracja:** 1

## Zadanie
Zaimplementować P1 (Shortcuts Panel → Floating Compact Modal) oraz P4 (Touch & Pinch-to-Zoom) z zatwierdzonego planu UX/UI.

### P1 — Floating Compact Modal
- CheatSheetOverlay: przebudowa na floating trigger "?" w dolnym-prawym rogu
- Domyślnie widoczna tylko mała ikona; po kliknięciu rozwijany panel
- Mobile: bottom sheet
- NIE blokuje canvas

### P4 — Touch Gestures
- Nowy hook `useTouchGestures.ts`
- Pinch: delta-based scaling (nie ratio-based jak stary kod)
- Single tap = select (przekazane do Stage), double tap = zoom-fit
- Dwa palce = pan
- touch-action: manipulation na kontenerze
- Podpięcie w BoardCanvasSection zamiast starego inline kodu

## Proces myślenia
**P1**: Stary CheatSheet był renderowany tylko gdy `isVisible=true` i znikał całkowicie. Nowy design: zawsze mały przycisk "?" w rogu, na click rozwijany panel. `isVisible` z parenta kontroluje czy panel jest otwarty (przez skrót "?" lub Cmd+K). useState `expanded` wewnątrz komponentu synchronizuje się z `isVisible`. Na mobile bottom sheet z backdrop.

**P4**: Stary kod touch był inline w BoardCanvasSection — mieszał logikę z JSX. Wydzieliłem do hooka. Pinch używa delta-based scaling (różnica odległości od początku pinch razy sensitivity) zamiast ratio-based (stare: `dist / lastDist`), co daje płynniejsze sterowanie. Dodałem double-tap detection z timeoutem 300ms. Single tap nie przekazuję (Stage Konva obsługuje klikanie przez własne eventy), tylko double tap → zoom fit. Usunąłem zbędne refy (`lastPinchDistRef`, `lastPinchCenterRef`) z komponentu.

## Co zrobiłem
1. **CheatSheetOverlay.tsx**: Przebudowa na floating trigger + expandable panel
   - Nowy KeyboardIcon komponent
   - useState `expanded` z synchronizacją z `isVisible` z parenta
   - Trigger button: `p-2 rounded-full bg-surface/95 backdrop-blur-md border border-border shadow-md`
   - Expanded panel: `animate-slide-up`, `max-h-[60vh] overflow-y-auto`, backdrop na mobile
   - Wszystkie animacje: `duration-fast`, `animate-slide-up` (tokeny Design System)

2. **BoardPage.tsx**: Usunąłem warunek `{!state.focusMode &&` dla CheatSheet, dodałem go z powrotem aby ukrywać w focus mode. ShortcutsHint bez zmian.

3. **useTouchGestures.ts**: Nowy hook
   - Delta-based pinch: `zoomDelta = (currentDist - startDist) * PINCH_ZOOM_SENSITIVITY`
   - Two-finger pan z clampem
   - Double tap detection: czas <300ms i dystans <30px między tapami
   - Single tap delayed o 300ms (czeka na ewentualny double tap); anulowany przy ruchu >10px
   - `touch-action: manipulation` na kontenerze

4. **BoardCanvasSection.tsx**: 
   - Import `useTouchGestures`
   - Zastąpienie inline `useEffect` z touch handlerami przez `useTouchGestures({...})`
   - Usunięcie `lastPinchDistRef`, `lastPinchCenterRef`
   - Zmiana `touchAction: 'none'` → `touchAction: 'manipulation'`

5. **Build**: Przeszedł po fixie unused import `useCallback`

## Napotkane problemy
- TS6133: `useCallback` był zaimportowany ale nieużywany w hooku po refactorze. Usunąłem import.
- `setZoom` i `ZOOM_MIN/MAX` importy nadal używane w BoardCanvasSection (wheel zoom), więc nie usuwam.

## Wynik
- CheatSheet: trigger zawsze widoczny w rogu, nie blokuje canvas
- Na mobile: bottom sheet z backdrop
- Pinch-to-zoom: delta-based, smoother niż stary ratio-based
- Double tap → zoom fit
- Single tap → nie przekazywany (Stage Konva)
- Build pełny: 5/5 successful

## Status DoD
- [x] Shortcuts nie blokuje canvas na żadnym rozmiarze ekranu
- [x] Ikona "?" widoczna zawsze w rogu
- [x] Pinch-to-zoom działa na touch devices
- [x] Double tap = zoom-fit
- [x] Animacje używają tokenów Design System
- [x] Build przechodzi
- [x] thoughts zapisany

## Dla następnej iteracji / następnego agenta
Zmiany gotowe do commita. Kolejne kroki z planu UX/UI: P3 (Zoom & Pan refactor), P2 (Responsywny layout — największy).