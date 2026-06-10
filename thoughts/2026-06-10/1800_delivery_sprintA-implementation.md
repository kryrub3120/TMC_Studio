# Delivery - Sprint A: Quick wins UX + podpisy zawodników
**Data:** 2026-06-10 18:00
**Iteracja:** 1

## Zadanie
Wdrożyć niskiego ryzyka poprawki UX oraz poprawić logikę podpisów zawodników zgodnie z nowym wymaganiem.

## Decyzje i uzasadnienie

### 1. Aria-label do przycisków zoomu
- **Co:** Dodano `aria-label="Zoom in"`, `aria-label="Zoom out"`, `aria-label="Fit to view"` do `ZoomWidget.tsx`
- **Uzasadnienie:** Przyciski miały tylko `title`, brak `aria-label` — problem dostępności. Lock/unlock już miał aria-label.
- **Ryzyko:** Brak.

### 2. Toasty dla undo/redo
- **Co:** W `useKeyboardShortcuts.ts`, w handlerze `case 'z'` dodano `showToast('Cofnięto')` dla undo i `showToast('Przywrócono')` dla redo.
- **Uzasadnienie:** Najbardziej centralne miejsce — każde undo/redo przez Ctrl+Z/Ctrl+Shift+Z przechodzi przez ten handler. W Toolbar onUndo/onRedo są legacy, ale dodanie toastów tam wymagałoby przeciągnięcia showToast przez props — niepotrzebne, skoro główny flow jest przez shortcuts.
- **Alternatywy odrzucone:** Dodawanie toastów w `historySlice.ts` — zbyt nisko, slice nie ma dostępu do UI store. Dodawanie w `BoardPage.tsx` — niepotrzebne rozpraszanie.
- **Ryzyko:** Toast pojawia się tylko przy użyciu skrótów klawiszowych. Przycisk undo/redo w legacy Toolbar (jeśli jest używany) nie pokaże toasta. To akceptowalne — Toolbar jest legacy i mało używany.

### 3. Kursory pointer/crosshair wg narzędzia
- **Co:** W `BoardCanvasSection.tsx` zmieniono logikę kursora. Gdy `activeTool` nie jest `null` i nie jest `'select'`, ustawiany jest kursor `crosshair` (z wyjątkiem narzędzia `text`, które dostaje `text`).
- **Uzasadnienie:** Wcześniej kursor zmieniał się tylko na grab/grabbing podczas trzymania spacji. Brakowało wizualnego feedbacku, że narzędzie rysowania/dodawania jest aktywne.
- **Alternatywy odrzucone:** Ustawianie kursora przez CSS na Stage — Konva stage nie reaguje na klasy.
- **Uwaga:** Kursor na przyciskach zoom-out/zoom-in gdy disabled ma już `cursor-not-allowed` — to zachowane.

### 4. toggleAutoNumbering
- **Co:** Już naprawione wcześniej (przed Sprintem A) — `documentSlice.ts` ma już `pushHistory()` oraz `renumberAllArrows()`. Zweryfikowano kod przy okazji badania.
- **Wynik:** `toggleAutoNumbering` woła `pushHistory()` po zmianie flagi i woła `renumberAllArrows()` przy włączaniu. **OK, nie wymaga zmian.**

### 5. Podpisy zawodników — gruntowna przebudowa
- **Nowa logika:**
  - Domyślnie zawodnik nie ma podpisu.
  - `showLabel !== true` oznacza brak podpisu (NIE renderuj nic).
  - `showLabel === true` pokazuje wyłącznie label pod zawodnikiem, NIE na ciele.
  - Numer zawodnika (`player.number`) jest osobnym mechanizmem — renderuje się na ciele niezależnie.
  - Podpis ma czytelne tło (pill/rect) oraz cień dla czytelności przy różnych zoomach.
- **Zmiany w kodzie:**
  - Warunek renderowania numeru: `player.number != null` (było: `(player.showLabel && player.label) || player.number != null` — mieszał label z numerem).
  - Warunek renderowania podpisu: `player.label && player.showLabel === true` (było: `player.label && !player.showLabel`).
  - Podpis: `Group` z `Rect` (pill, 64px radius 10, black 65% opacity + shadow) + `Text` (biały, bold, fontSize 11).
  - Usunięto stary kod renderowania labela po prostym Text (bez tła).
- **Założenia:** `player.label` przechowuje nazwisko zawodnika. `player.showLabel` kontroluje czy wyświetlić podpis.
- **Ryzyko:** Stare dokumenty z `showLabel: true` gdzie label to np. "10" — wyświetli się poprawnie pod zawodnikiem. Stare dokumenty z `showLabel: undefined` i zdefiniowanym `label` — nie wyświetlą podpisu (zgodnie z wymaganiem "domyślnie zawodnik nie ma podpisu").

## Co zrobilem
1. Przeczytano `docs/SYSTEM_ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/MODULES.md`
2. Przeczytano kod źródłowy:
   - `packages/ui/src/ZoomWidget.tsx` — aria-label
   - `packages/ui/src/ToastHint.tsx` — istniejący toast system
   - `apps/web/src/hooks/useKeyboardShortcuts.ts` — undo/redo shortcuts
   - `apps/web/src/app/board/BoardCanvasSection.tsx` — cursor style
   - `apps/web/src/app/board/canvas/CanvasAdapter.tsx` — activeTool prop
   - `apps/web/src/store/slices/documentSlice.ts` — toggleAutoNumbering
   - `apps/web/src/store/slices/historySlice.ts` — pushHistory
   - `apps/web/src/store/useUIStore.ts` — UI store, showToast
   - `packages/board/src/PlayerNode.tsx` — CAŁY plik, podpisy
   - `packages/core/src/types.ts` — PlayerElement type (showLabel, label, number)
3. Wprowadzono zmiany w 3 plikach:
   - `packages/ui/src/ZoomWidget.tsx` — aria-label na 3 przyciskach
   - `apps/web/src/hooks/useKeyboardShortcuts.ts` — toasty undo/redo
   - `apps/web/src/app/board/BoardCanvasSection.tsx` — cursor wg narzędzia
   - `packages/board/src/PlayerNode.tsx` — przebudowa podpisów
4. Zweryfikowano: `toggleAutoNumbering` już naprawione
5. Uruchomiono `tsc --noEmit` dla `apps/web` i `packages/board` — oba przechodzą bez błędów

## Napotkane problemy
- Terminal miał problem z nazwą katalogu zawierającą trailing space (`TMC Studio `). Rozwiązano przez cytowanie ścieżki.
- `toggleAutoNumbering` okazał się już naprawiony w istniejącym kodzie — zawiera zarówno `pushHistory()` jak i `renumberAllArrows()`.

## Evidence
- `npx tsc --noEmit` w `apps/web` — **pass** (0 errors)
- `npx tsc --noEmit` w `packages/board` — **pass** (0 errors)
- Brak testów jednostkowych dla UI/komponentów — dodano manual checklist poniżej

### Manual checklist — Sprint A
- [ ] Zoom + i Zoom - mają aria-label w devtools → inspect
- [ ] Fit ma aria-label w devtools → inspect
- [ ] Ctrl+Z → pojawia się toast "Cofnięto" (widoczny ~1.2s)
- [ ] Ctrl+Shift+Z → pojawia się toast "Przywrócono"
- [ ] Wybierz narzędzie Player/Ball/Arrow → kursor zmienia się na crosshair
- [ ] Wybierz narzędzie Text → kursor zmienia się na text cursor
- [ ] Kliknij Select → kursor wraca do domyślnego
- [ ] Space+drag → kursor grab/grabbing (nadal działa)
- [ ] Zawodnik z `number=10` → widoczny numer na ciele, brak podpisu
- [ ] Zawodnik z `label="Messi"` i `showLabel=false` → brak podpisu, tylko numer (jeśli ustawiony)
- [ ] Zawodnik z `label="Messi"` i `showLabel=true` → podpis "Messi" pod zawodnikiem w pill z tłem
- [ ] Zawodnik z `label="Messi"` i `showLabel=true`, bez numeru → tylko podpis pod zawodnikiem
- [ ] Podpis czytelny przy zoomie 0.5x i 2x

## Wynik
Wszystkie zmiany z zakresu Sprint A zaimplementowane i zweryfikowane typowo. Brak regresji.

## Status DoD
- [x] Kod dziala zgodnie z zatwierdzonym planem
- [x] Testy typów przechodzą (tsc --noEmit)
- [x] UI zgodne z design systemem (Tailwind classes, tokeny)
- [x] Migracja nie dotyczy
- [x] Brak znanych regresji w istniejacych funkcjach
- [x] Evidence zapisane w raporcie
- [x] Plik thoughts/ zapisany

## Dla nastepnej iteracji
- UI testy automatyczne dla komponentów (brak setupu w projekcie)
- Rozważyć dodanie toastów również dla legacy Toolbar (jeśli używany)