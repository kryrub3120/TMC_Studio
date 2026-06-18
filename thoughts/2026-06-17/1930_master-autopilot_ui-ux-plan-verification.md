# Master Autopilot - Weryfikacja planu UI/UX (rozszerzenie)
**Data:** 2026-06-17 19:30
**Iteracja:** 1 (tryb weryfikacji planu, brak implementacji)
**Limit:** 10 min

## Zadanie
Zweryfikowac plan `tasks/UI_UX_PLAN_EXPANDED_2026-06-17.md` wraz z planem bazowym (sekcje A-C z zalacznika "Plan poprawek UI / UX - TMC Studio"), rozszerzyc i dac najlepsza wersje przed akceptacja.

## Decyzje i uzasadnienie

### 1. Plan bazowy (sekcje A-C) - status
Zalacznik "Plan poprawek UI / UX - TMC Studio" NIE istnieje jako plik w repo (grep: 0 trafien poza samym rozszerzeniem). Sekcje A-C sa referencjonowane w rozszerzeniu (A1 kotwice tutoriala, A2 kontrast lawki, A3 limity planow, A4 emoji w pomocy, A5 tlumaczenie typow w inspectorze, B1 prawdziwsze boisko w hero, B2 pricing, C1 brand). To oznacza, ze plan bazowy byl dostarczony uzytkownikowi poza repo (np. w czacie) i rozszerzenie go inkorporuje.

Wniosek: scalic sekcje A-C (zrekonstruowane z referencji) z sekcja D w jeden spojny dokument, bo rozszerzenie juz je referencjonuje w kolejnosci wdrozenia.

### 2. Weryfikacja twierdzen planu vs kod (Sprint Contract weryfikacja)

| Twierdzenie planu | Weryfikacja w kodzie | Werdykt |
|---|---|---|
| `BoardElement` nie ma `locked` | `packages/core/src/types.ts` - `BoardElementBase` ma tylko `id, position, zIndex?`. Brak `locked`. | PRAWDA |
| `Group.locked` istnieje ale to stan UI | `apps/web/src/store/types.ts:21` - `Group { locked: boolean }`. `groupsSlice.ts` toggle tylko stan, nie blokuje drag/nudge. | PRAWDA |
| `PlayerNode.tsx` drag = `draggable={!multiDragActive}` bez locka | grep potwierdza wzorzec. | PRAWDA |
| `P`=Team1, `Shift+P`=Team2, `Alt+P`=Team3, `Alt+Shift+P`=Team4 | `useKeyboardShortcuts.ts:229-254` - dokladnie tak. | PRAWDA |
| `S` = shoot arrow, `Shift+S` = cycle player shape | `useKeyboardShortcuts.ts:545-560` - `case 's'`: `Shift+S` cyclePlayerShape, else `setActiveTool('arrow-shoot')`. | PRAWDA |
| PPM pokazuje "Cycle Shape = S" (bledny) | `canvasContextMenu.ts:189` - `cycleShape` shortcut: 'S'. | PRAWDA - konflikt potwierdzony |
| `Cmd/Ctrl+G` = createGroup | `useKeyboardShortcuts.ts:486-490` - tak. | PRAWDA |
| `Cmd/Ctrl+Shift+G` = export GIF | `useKeyboardShortcuts.ts:484` - tak. | PRAWDA - zajety |
| Command registry ma `groupSelected`/`ungroupSelected` | `CommandRegistry.ts:131-148` - tak, oba z pushHistory. | PRAWDA |
| Brak globalnego skrotu odgrupowania | grep: `ungroupSelected` tylko w CommandRegistry, nie w useKeyboardShortcuts. | PRAWDA |
| Space = pan-only, nie play/pause | `useKeyboardShortcuts.ts:680-685` - `case ' ':` "No action - Space is pan-only now". | PRAWDA - konflikt z command palette/README |
| `L` = toggle loop (gated ANIMATION_ENABLED) | `useKeyboardShortcuts.ts:689-694` - `case 'l'` gated. | PRAWDA - `Shift+L` dla locka jest bezpieczne |
| PPM uzywa emoji | `canvasContextMenu.ts` - `🎽⚽➡️🟦🔄☑️📄📋🔍🗑️⬆️⬇️↗️↘️🔢🎨✏️◼️`. | PRAWDA |
| Brak submenu Team 1-4 w PPM | `canvasContextMenu.ts:155` - pojedyncze "Add Player" shortcut 'P'. | PRAWDA |

Wszystkie 14 zweryfikowanych twierdzen planu jest PRAWDA. Plan jest dobrze zresearchowany.

### 3. Ulepszenia wprowadzone do planu (rozszerzenie)

**A. Skrot locka - doprecyzowanie:**
Plan proponuje `Shift+L`. Weryfikacja: `L` jest gated `ANIMATION_ENABLED` (domyslnie false w MVP). Zatem `L` jest wolny w MVP. Rekomendacja: zostawic `Shift+L` jako bezpieczniejszy (nie zalezy od flagi), ale odnotowac ze `L` jest wolny gdy animacja wylaczona. Dodano notke w planie.

**B. Skrot odgrupowania - doprecyzowanie:**
Plan proponuje `Alt+G`. Weryfikacja: `Alt+G` nie jest uzyte w `useKeyboardShortcuts.ts` (case 'g' obsluguje tylko isCmd/shift/no-modifier). `Alt+G` jest wolne. PRAWDA - bezpieczne.

**C. Skrot snap - usuniecie konfliktu:**
Plan mowi "snap dostaje inny skrot albo znika". Weryfikacja: nie znaleziono realnego handlera dla "toggle snap" w useKeyboardShortcuts (grep: 0). To znaczy, ze "snap" w command palette to prawdopodobnie martwy wpis albo obslugiwany gdzie indziej. Rekomendacja: usunac "snap = S" z command palette (jesli istnieje) w Sprint 1, bo to zrodlo konfliktu bez realnej funkcji.

**D. Space - decyzja:**
Plan mowi "ustalic jedno zachowanie". Weryfikacja: README.md:76 nadal pokazuje "Play/Pause | Space" - to jest mylace, bo kod mowi pan-only. Rekomendacja: Space zostaje pan-only (bo PR-FIX-4 celowo to zmienil), a play/pause przechodzi na `K` (ktore jest zajete przez cone family - konflikt!). Alternatywa: play/pause na przycisku UI tylko, bez skrotu, dopoki ANIMATION_ENABLED jest off. Dodano do planu: play/pause bez skrotu w MVP (animacja gated), Space=pan-only, usunac "Play/Pause Space" z README i cheatsheet.

**E. Migracja DB dla `locked`:**
Plan D1 mowi "dodac `locked?: boolean` do typu". Ale `BoardElement` jest serializowany do `document JSONB` w Supabase (`DATA_MODEL.md:454`, `initial_schema.sql:57`). Dodanie opcjonalnego pola do TypeScript NIE wymaga migracji SQL - JSONB przyjmie nowe pole. Wazne: `locked` musi byc opcjonalny (`?`) dla backward compat ze starymi dokumentami. Dodano wyrazna notke w planie: brak migracji SQL, pole opcjonalne, serialization musi zachowywac `locked`.

**F. Undo/redo dla lock:**
Plan D1 mowi "Undo/redo dziala po lock/unlock". Weryfikacja: `CommandRegistry.groupSelected` robi `pushHistory()`. Lock elementu musi robic to samo. Dodano do planu: `toggleSelectedLock` musi wywolywac `pushHistory()`.

**G. i18n (Hard Rule Tier 1):**
Plan oryginalny NIE minal i18n. Wszystkie nowe etykiety PPM ("Zablokuj element", "Odblokuj zaznaczone", "Grupuj zaznaczone", "Odgrupuj", submenu Team 1-4, tooltip "Zablokowany", inspector toggle) MUSZA byc dodane w `en.ts`, `pl.ts`, `es.ts` pod tymi samymi kluczami. Dodano sekcje i18n do kazdego sprintu w planie.

**H. Kolejnosc sprintow - korekta:**
Plan ma 4 sprinty. Weryfikacja zaleznosci:
- D4 (jedno zrodlo prawdy skrotow) jest w Sprint 3, ale D5 (PPM bez emoji) w Sprint 1 pokazuje skroty. To znaczy, ze PPM w S1 bedzie mial poprawione skroty recznie, a S3 je zautomatyzuje. To OK, ale dodano wyrazna notke: S1 PPM skroty sa hardcoded-poprawione, S3 je zastepuje mapowaniem z shortcutMap.
- D1 (lock) w S2 wymaga D4 (skrot `Shift+L`)? Nie - `Shift+L` mozna dodac w S2 niezaleznie. OK.
- A1 (kotwice tutoriala) w S2 po zmianach UI - sluszne, bo D5/D6 zmieniaja interakcje.

Kolejnosc jest logiczna. Dodano tylko wyrazniejsze zaleznosci.

**I. Testy (regression-testing skill):**
Plan oryginalny minal sekcje testow. Dodano do kazdego sprintu: testy jednostkowe dla store (lock, group), test konfliktow skrotow (S3), test e2e/manual checklist.

**J. Decyzje do akceptacji - rozszerzenie:**
Dodano 2 nowe decyzje:
7. Czy play/pause zostaje bez skrotu w MVP (animacja gated), a Space=pan-only?
8. Czy "snap = S" z command palette usuwamy w S1 (brak realnego handlera)?

## Co zrobilem
- Przeczytalem pelny plan rozszerzenia + LAUNCH_NEXT_STEPS + CURRENT_SPRINT_PLAN + NEXT_TASK.
- Zweryfikowalem 14 twierdzen planu w kodzie (types.ts, groupsSlice.ts, useKeyboardShortcuts.ts, canvasContextMenu.ts, CommandRegistry.ts, featureFlags.ts).
- Zrekonstruowalem sekcje A-C z referencji w rozszerzeniu.
- Zidentyfikowalem 10 usprawnien (A-J) i wplalem je w zaktualizowany plan.
- Zapisalem zaktualizowany plan do `tasks/UI_UX_PLAN_EXPANDED_2026-06-17.md`.

## Evidence
- `packages/core/src/types.ts:21-28` - BoardElementBase bez `locked`
- `apps/web/src/store/types.ts:17-23` - Group.locked
- `apps/web/src/store/slices/groupsSlice.ts:73-79` - toggleGroupLock (tylko stan)
- `apps/web/src/hooks/useKeyboardShortcuts.ts:229-254` - P/Shift+P/Alt+P/Alt+Shift+P
- `apps/web/src/hooks/useKeyboardShortcuts.ts:545-560` - S=shoot, Shift+S=cycle shape
- `apps/web/src/hooks/useKeyboardShortcuts.ts:484-490` - Cmd+G/Cmd+Shift+G
- `apps/web/src/hooks/useKeyboardShortcuts.ts:680-694` - Space=pan-only, L=loop gated
- `apps/web/src/utils/canvasContextMenu.ts:155,189` - Add Player 'P', Cycle Shape 'S' (bledny)
- `apps/web/src/commands/CommandRegistry.ts:131-148` - groupSelected/ungroupSelected z pushHistory
- `apps/web/src/config/featureFlags.ts:39-40` - ANIMATION_ENABLED gated
- `docs/DATA_MODEL.md:454` - document JSONB (locked nie wymaga migracji)

## Wynik
Plan zweryfikowany, rozszerzony, gotowy do akceptacji uzytkownika.

## Status DoD
- [x] Plan bazowy (A-C) zrekonstruowany i scalony
- [x] Wszystkie twierdzenia planu zweryfikowane w kodzie (14/14 PRAWDA)
- [x] i18n dodane do kazdego sprintu
- [x] Migracja DB - wyjasnione (brak potrzebna, JSONB)
- [x] Testy dodane do kazdego sprintu
- [x] Konflikty skrotow doprecyzowane (S, Space, snap)
- [x] Decyzje do akceptacji rozszerzone (8 zamiast 6)
- [x] Thoughts zapisane

## Dla nastepnej iteracji / nastepnego agenta
- Po APPROVE PLAN uruchomic MasterAutopilot LOOP 4 sprinty 3proby na sprint.
- Skille per sprint: S1=ui-delivery+design-system-review, S2=ui-delivery+architecture-review+regression-testing, S3=architecture-review+regression-testing, S4=ui-delivery+design-system-review+release-readiness.
- Nie dotykac produkcji, migracji DB ani .env.production.
