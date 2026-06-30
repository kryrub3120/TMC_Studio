# Sprint Contract - S2: Auth AbortError + Cursor Placement
**Data:** 2026-06-29 23:55

## Cel sprintu
Naprawa dwoch problemow: (1) AbortError przy logowaniu email/password i (2) elementy maja byc dodawane tam gdzie jest kursor na canvas, nie na srodku boiska.

## Zakres
### Problem 1: Auth AbortError
- `apps/web/src/lib/supabase.ts`: dodanie retry z backoffem dla `getCurrentUser`, `getPreferences` przy AbortError
- `apps/web/src/store/useAuthStore.ts`: dodanie retry logic dla prefetch projects/folders przy AbortError

### Problem 2: Cursor placement
- `apps/web/src/hooks/useCanvasEventsController.ts`: w `handleStageMouseMove` zapisywac `cursorPosition` do store'a (world coordinates)
- `apps/web/src/app/board/useBoardPageEffects.ts`: zapewnic `setCursorPosition` w input props

## Poza zakresem
- Zmiana architektury command pattern
- Zmiana mechanizmu drag-drop z squad bench (dziala juz przez dropPosition)

## Selected Skills
- architecture-review: element placement moze dotykac store/commands/canvas

## Kryteria akceptacji
- [ ] Po zalogowaniu email/password nie ma AbortError w konsoli
- [ ] Profile, preferencje, projekty, foldery lduja sie poprawnie
- [ ] Element dodany z TopBar pojawia sie tam gdzie byl kursor na boisku
- [ ] Elementy z squad bench (drag-drop) nadal dzialaja na pozycji dropu

## Definition of Done
- [ ] Kod zgodny z planem
- [ ] Testy przechodza
- [ ] Brak regresji w istniejacych funkcjach
- [ ] Zmiany minimalne

## Ryzyka
- Retry moze spowolnic ladowanie - backoff jest krotki (max ~1s)
- `cursorPosition` moze byc stale update'owane podczas mousemove - to ok, bo to tania operacja