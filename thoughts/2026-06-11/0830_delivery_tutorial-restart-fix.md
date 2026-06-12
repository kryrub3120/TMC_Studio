# Delivery - Tutorial fix + Restart button
**Data:** 2026-06-11

## Problemy
1. Tutorial nie startował po zalogowaniu w incognito — trigger `useEffect` w BoardPage sprawdza `elements.length === 0`, ale po logowaniu może być asynchroniczne ładowanie projektu
2. Brak przycisku do restartu tutoriala po skipnięciu

## Rozwiązania

### replayTutorial
- Dodano `replayTutorial()` w `useUIStore` — ustawia `tutorialCompleted = false` i `showTutorial = true`
- Wyeksportowano przez `useBoardPageState`

### Restart button w HelpSidebar
- Nowy prop: `onRestartTutorial`
- Sekcja "Tutorial" z przyciskiem "▶ Restart 5-step tutorial"
- BoardPage: `handleRestartTutorial = () => { replayTutorial(); setHelpSidebarOpen(false); }`

### newDocument resetuje tutorial
- `documentSlice.newDocument()`: po stworzeniu pustej tablicy ustawia `showTutorial = true` (jeśli elements.length === 0)

## Zmienione pliki
- `apps/web/src/store/useUIStore.ts` — `replayTutorial`
- `apps/web/src/store/slices/documentSlice.ts` — tutorial reset w newDocument
- `apps/web/src/app/routes/useBoardPageState.ts` — replayTutorial w return
- `apps/web/src/app/board/BoardPage.tsx` — handleRestartTutorial, onRestartTutorial prop
- `packages/ui/src/HelpSidebar.tsx` — onRestartTutorial prop + sekcja "Tutorial"

## Verification
- `pnpm typecheck` — 9/9 PASS
- `pnpm --filter @tmc/web test` — 99/99 PASS
