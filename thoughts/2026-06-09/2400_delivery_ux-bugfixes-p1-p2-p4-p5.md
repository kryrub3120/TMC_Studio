# Delivery — UX Bugfixes: #3 #2 #4 #5
**Data:** 2026-06-09 24:00
**Iteracja:** 1

## Zadanie
Naprawić 4 bugów zidentyfikowanych po implementacji P1-P6:
- #3 `?` shortcut nie działa
- #2 Dwa bottom sheety naraz (mutex)
- #4 Toggle inspektora niewidoczny (rozłączenie TopBar ↔ BottomSheet)
- #5 CheatSheet na mobile blokuje canvas (full-width)

## Przyczyny (po weryfikacji kodu)

### Bug #3 (`?` nie działa)
`CheatSheetOverlay.tsx` — `useEffect` reagował **tylko** na `!isVisible` (zamykał panel).
Gdy `isVisible=true` (z klawiatury), `expanded` zostawał `false` → panel nie otwierał się.
**Fix:** `setExpanded(isVisible)` — sync obukierunkowy.

### Bug #2 (dwa bottom sheety)
`CheatSheetOverlay` i `RightInspector` mają niezależne stany lokalne.
**Fix:** W `BoardPage.tsx` owijka `onToggle` inspektora zamyka CheatSheet gdy inspector się otwiera, i `onOpenHelp` zamyka inspector gdy CheatSheet otwierany (tylko na sm/md).

### Bug #4 (TopBar toggle ↔ BottomSheet)
`RightInspector` na md/sm używał lokalnego `isSheetOpen`, niezwiązanego z `isOpen` prop.
Toggle w TopBar zmieniał `inspectorOpen` w store, ale BottomSheet otwierał się tylko przez FAB.
**Fix:** `useEffect(() => setIsSheetOpen(isOpen), [isOpen])` — sync z propa.
Eksport `setInspectorOpen` z `useBoardPageState`.

### Bug #5 (CheatSheet blokuje canvas na mobile)
Panel miał `max-sm:left-0 max-sm:right-0 max-sm:w-full` — pełna szerokość.
**Fix:** Zmiana na `max-sm:left-4 max-sm:right-4 max-sm:w-auto max-sm:max-w-sm max-sm:rounded-xl` — compact, nie full bottom sheet.

## Pliki zmienione
- `packages/ui/src/CheatSheetOverlay.tsx` — sync fix + mobile max-w
- `packages/ui/src/RightInspector.tsx` — isOpen → isSheetOpen sync
- `apps/web/src/app/board/BoardPage.tsx` — mutex callbacks
- `apps/web/src/app/routes/useBoardPageState.ts` — eksport setInspectorOpen

## Status DoD
- [x] `?` otwiera CheatSheet
- [x] Dwa bottom sheety nie nakładają się (mutex)
- [x] Toggle w TopBar otwiera BottomSheet na md/sm
- [x] CheatSheet na mobile nie blokuje całego canvas
- [x] Build przechodzi
- [x] thoughts zapisany

## Do zrobienia: Bug #1
Zoom model (Figma/Miro) — CSS transform scale na wrapperze — planowany osobno.
