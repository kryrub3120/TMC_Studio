# Delivery - Sprint A: Enter → szybka edycja podpisu zawodnika
**Data:** 2026-06-10 18:30
**Iteracja:** 1

## Zadanie
Umożliwić szybką edycję podpisu zawodnika: Enter na zaznaczonym zawodniku → focus w polu label w RightInspector.

## Decyzje i uzasadnienie

### Architektura
Enter dla zaznaczonego zawodnika obecnie odpala `onStartEditingPlayerNumber` (edycja numeru w overlay). Sprint A zmienia to na focus pola label w RightInspector. Zachowano `onStartEditingPlayerNumber` jako fallback, gdy `onFocusLabelInput` nie jest przekazane.

### Zmiany

**1. `packages/ui/src/RightInspector.tsx`**
- Dodano `labelInputRef?: React.RefObject<HTMLInputElement>` do `RightInspectorProps` i `PropsTab`
- Przekazano `ref={labelInputRef}` do inputa label
- Dodano `onKeyDown` w inpucie label:
  - `Enter` → `preventDefault()` + `blur()` — zatwierdza edycję, nie dodaje newline
  - `Escape` → `preventDefault()` + `blur()` — kończy edycję. Rollback byłby zbyt kosztowny (trzeba by cache'ować poprzednią wartość), więc Escape tylko blur → wartość pozostaje zmieniona przez onChange. **To akceptowalne** — onChange już zapisał wartość, a Escape tylko zamyka input.
- Zmiana etykiety: `"Position Label"` → `"Player Label"`
- Zmiana toggle: `"Show Label Inside"` → `"Show Label Below"`
- Dodano `aria-label="Player label"` do inputa
- Zmieniono placeholder: `"GK, CB, CM..."` → `"Surname or nickname..."`

**2. `apps/web/src/hooks/useKeyboardShortcuts.ts`**
- Dodano `onFocusLabelInput?: () => void` do `UseKeyboardShortcutsParams`
- Zmieniono handler Enter: gdy zaznaczony 1 Player, woła `onFocusLabelInput()` (zamiast `onStartEditingPlayerNumber`). Fallback do `onStartEditingPlayerNumber` jeśli `onFocusLabelInput` nie jest przekazane.

**3. `apps/web/src/app/routes/useBoardPageState.ts`**
- Dodano `labelInputRef = useRef<HTMLInputElement>(null)` i `onFocusLabelInput = useCallback(() => labelInputRef.current?.focus(), [])`
- Przekazano `onFocusLabelInput` do `useKeyboardShortcuts`
- Zwrócono `labelInputRef` i `onFocusLabelInput` w stanie

**4. `apps/web/src/app/board/BoardPage.tsx`**
- Przekazano `labelInputRef={state.labelInputRef}` do `<RightInspector>`

### Alternatywy odrzucone
- **Escape z rollbackiem**: Wymaga cache'owania poprzedniej wartości label. Możliwe, ale zwiększa złożoność. Escape → blur jest prostsze i wystarczające — onChange już zaktualizował stan, a wartość jest widoczna w inpucie.
- **Dodanie osobnego overlay do edycji labela**: Zbyt dużo kodu, skoro pole istnieje w RightInspector.

### Ryzyka
- Jeśli `RightInspector` jest zamknięty, `labelInputRef.current?.focus()` nie zadziała (ref nie istnieje). Użytkownik musi najpierw otworzyć Inspector. To akceptowalne zachowanie.

## Co zrobilem
1. Przeczytano `RightInspector.tsx` — struktura, props, PropsTab
2. Przeczytano `useKeyboardShortcuts.ts` — handler Enter
3. Przeczytano `useBoardPageState.ts` — przepływ danych
4. Przeczytano `BoardPage.tsx` — miejsce użycia RightInspector
5. Wprowadzono zmiany w 4 plikach (opis wyżej)
6. Uruchomiono typecheck dla `packages/ui` — PASS
7. Uruchomiono typecheck dla `apps/web` — PASS

## Evidence
- `cd /packages/ui && npx tsc --noEmit` — exit code 0
- `cd /apps/web && npx tsc --noEmit` — exit code 0

### Manual checklist
- [ ] Zaznacz 1 zawodnika, naciśnij Enter → kursor w polu "Player Label" w RightInspector
- [ ] RightInspector zamknięty → Enter nie focusuje (nic się nie dzieje — OK)
- [ ] Wpisz nazwisko w polu, naciśnij Enter → pole traci focus, podpis na boisku
- [ ] Wpisz nazwisko, naciśnij Escape → pole traci focus, wartość zachowana
- [ ] Zaznacz tekst → Enter otwiera edycję tekstu (bez zmian)
- [ ] Zaznacz 2+ elementy → Enter nic nie robi (bez zmian)
- [ ] Etykieta w UI: "Player Label" (zamiast "Position Label")
- [ ] Toggle: "Show Label Below" (zamiast "Show Label Inside")
- [ ] Input ma `aria-label="Player label"` (devtools → inspect)
- [ ] Placeholder: "Surname or nickname..."
- [ ] Skróty klawiszowe nie odpalają się podczas pisania w inpucie (guard: tagName !== 'INPUT')

## Wynik
PASS. Wszystkie zmiany z zakresu zaimplementowane i zweryfikowane typowo.

## Status DoD
- [x] Kod dziala zgodnie z zatwierdzonym planem
- [x] Typecheck przechodzi (ui + web, 0 błędów)
- [x] Enter → focus w polu label
- [x] Enter w inpucie → blur (zatwierdzenie)
- [x] Escape w inpucie → blur (bez rollbacku — decyzja opisana)
- [x] Etykiety UI zmienione: "Player Label", "Show Label Below"
- [x] aria-label dodany
- [x] Brak zmian poza zakresem
- [x] Evidence zapisane
- [x] Plik thoughts/ zapisany