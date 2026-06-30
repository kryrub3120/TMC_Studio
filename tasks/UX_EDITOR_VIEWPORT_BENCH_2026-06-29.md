# Sprint UX-C — Editor Viewport, Pan i Squad Bench

**Data:** 2026-06-29  
**Status:** READY FOR AGENT — UPDATED AFTER EXTERNAL AGENT PASS  
**Priorytet:** P0  
**Typ:** UX/editor hotfix + preference persistence  
**Zasada nadrzedna:** tablica jest glownym narzedziem pracy. Na laptopie ma byc duza, czytelna i latwa do przesuwania od pierwszego wejscia.

---

## Kontekst

Zgloszenie z testu UI 2026-06-29:

1. Tablica zajmuje zbyt mala czesc ekranu. Uzytkownicy beda pracowac glownie na laptopach Mac / MacBook Pro i nie moga szukac funkcji ani mruzyc oczu.
2. Po powiekszeniu nie da sie naturalnie przesuwac obszaru roboczego przez klik/przytrzymanie tablicy.
3. Elementy overlay UI nachodza na siebie, szczegolnie w dolnym obszarze przy zoom widget / squad bench / bottom bar.
4. Squad Bench ma byc ukryty przy pierwszym uruchomieniu. Uzytkownik moze wlaczyc go oczkiem, a preferencja ma sie zapamietywac po zalogowaniu.

Zakres tego sprintu NIE obejmuje Postmarka, mailingu ani landing page. To osobny strumien.

---

## Aktualizacja po rownoleglym agencie — 2026-06-29

Drugi agent w miedzyczasie wprowadzil zmiany w innym strumieniu. Nie zamykaja one zakresu UX-C, ale trzeba je uszanowac.

Zrobione poza UX-C:

- `netlify.toml` — CSP dla Google Fonts / Plausible.
- `apps/web/src/store/useAuthStore.ts` — ograniczenie AbortError/race po sign-in i prefetch projects/folders.
- `apps/web/src/pages/PublicPageShell.tsx` — powrot z legal pages do appki/historii.
- `packages/ui/src/TopBar.tsx` + `apps/web/src/index.css` — responsywnosc top bara i ukryty scrollbar.
- `apps/web/src/hooks/useCanvasEventsController.ts` — `handleStageMouseMove` zapisuje `cursorPosition` przez `useBoardStore.getState().setCursorPosition(pos)`, zeby dodawanie elementow z top bara trafialo pod aktualny kursor.

Status wzgledem UX-C:

| ID | Status | Uwagi |
|---|---|---|
| C1 | TODO | Domyslny rozmiar tablicy / fit viewport nie zostal zrobiony. |
| C2 | TODO | Naturalny pan przez drag pustej tablicy nie zostal zrobiony. Przy implementacji zachowac nowy zapis `cursorPosition` w `handleStageMouseMove`. |
| C3 | TODO | Overlay safe areas nie zostaly zrobione. TopBar responsive jest osobnym fixem, nie rozwiazuje zoom/help/squad/bottom bar overlap. |
| C4 | TODO | Squad Bench default hidden nie zostal zrobiony. |
| C5 | TODO | Squad Bench visibility jako user preference nie zostalo zrobione. |
| C6 | TODO | Manual QA viewport matrix nie zostala wykonana dla UX-C. |

Wazne dla kolejnego agenta:

- Nie cofaj zmian drugiego agenta.
- Traktuj wymienione pliki jako potencjalnie dirty/user-owned.
- Jesli musisz edytowac `useCanvasEventsController.ts`, najpierw przeczytaj aktualny diff i zachowaj `setCursorPosition(pos)`.
- TopBar responsive jest juz ruszony; nie rozszerzaj tego watku, chyba ze realnie koliduje z overlay safe areas.

---

## Diagnoza techniczna

### Viewport / zoom

Glowne pliki:

- `apps/web/src/app/board/BoardCanvasSection.tsx`
- `apps/web/src/app/board/BoardPage.tsx`
- `apps/web/src/store/useUIStore.ts`
- `apps/web/src/utils/viewportUtils.ts`
- `packages/ui/src/ZoomWidget.tsx`

Stan obecny:

- `BoardCanvasSection` ma model `zoom * fitZoom = effectiveZoom`.
- `zoomFit()` w `useUIStore` resetuje tylko `zoom` do `1`.
- `fitZoom` liczy dopasowanie do kontenera, ale kontener jest pomniejszany przez right inspector, squad bench i bottom bar.
- W praktyce boisko moze wygladac jak miniatura, mimo ze formalnie jest "fit".

### Panning

Glowne pliki:

- `apps/web/src/app/board/BoardCanvasSection.tsx`
- `apps/web/src/app/board/useBoardPageEffects.ts`
- `apps/web/src/hooks/useCanvasEventsController.ts`

Stan obecny:

- Desktop panning dziala tylko jako `Space + drag`.
- Zwykle klikniecie/przytrzymanie pustej tablicy trafia do selekcji/marquee/drawing flow.
- Oczekiwane zachowanie: po powiekszeniu mozna zlapac puste tlo/pitch i przesunac obszar roboczy bez trzymania spacji.

### Squad Bench

Glowne pliki:

- `packages/core/src/serialization.ts`
- `apps/web/src/app/routes/useBoardPageState.ts`
- `apps/web/src/app/AppShell.tsx`
- `apps/web/src/app/board/BoardPage.tsx`
- `packages/ui/src/SquadBench.tsx`
- `apps/web/src/store/slices/documentSlice.ts`
- `apps/web/src/store/useUIStore.ts`
- `apps/web/src/store/useAuthStore.ts`
- `apps/web/src/lib/supabase.ts`

Stan obecny:

- `createDocument()` ustawia `squadVisible: true`.
- `useBoardPageState` fallbackuje `boardDoc.squadVisible ?? false`.
- `AppShell` fallbackuje `document.squadVisible ?? true`.
- Widocznosc lawki jest czescia dokumentu, a powinna byc preferencja UI uzytkownika.
- Collapsed squad bench nadal rezerwuje dolny pasek i zmniejsza obszar roboczy.

---

## Cel sprintu

Po sprincie nowy uzytkownik na laptopie:

1. Widzi duza tablice jako centrum aplikacji.
2. Uzywa `Dopasuj do widoku` i dostaje praktyczny, duzy, wycentrowany widok.
3. Moze przesuwac powiekszony obszar roboczy przez drag pustej tablicy.
4. Nie widzi Squad Bench na starcie.
5. Moze wlaczyc Squad Bench oczkiem, a aplikacja zapamietuje preferencje.
6. Nie ma nachodzacych na siebie elementow overlay UI.

---

## Zakres prac

### C1 — Domyslny rozmiar tablicy i fit viewport

**Cel:** tablica ma zajmowac wiekszosc dostepnego obszaru roboczego na laptopach.

Zadania:

1. Przejrzec `BoardCanvasSection.tsx` i uporzadkowac semantyke:
   - `userZoom` = zoom sterowany przez uzytkownika,
   - `fitZoom` = automatyczna baza dopasowania,
   - `effectiveZoom` = realny zoom canvasu.
2. Ustawic domyslne dopasowanie tak, aby pitch wypelnial ok. 85-92% dostepnego obszaru roboczego, bez przycinania.
3. `zoomFit()` / Shift+1 ma:
   - ustawic user zoom do wartosci bazowej,
   - wycentrowac pitch,
   - wyzerowac pan tam, gdzie pitch miesci sie w viewportcie.
4. Upewnic sie, ze resize okna nie zostawia pitcha poza ekranem.
5. Zweryfikowac, czy `MAX_FIT_UPSCALE`, padding i clamp pan nie walcza ze soba.

Pliki prawdopodobne:

- `apps/web/src/app/board/BoardCanvasSection.tsx`
- `apps/web/src/store/useUIStore.ts`
- `apps/web/src/utils/viewportUtils.ts`
- `apps/web/src/utils/__tests__/viewportUtils.test.ts`

Uwagi:

- Nie wprowadzac globalnego CSS scale na caly shell. Transformacja ma zostac w modelu canvas viewport.
- Nie psuc eksportu PNG/PDF/GIF. Stage/canvas dimensions musza zostac stabilne dla export flow.

### C2 — Naturalny pan przez drag pustej tablicy

**Cel:** uzytkownik moze przesunac powiekszona tablice przez klik/przytrzymanie pustego obszaru roboczego.

Zadania:

1. Dodac panning dla pointer drag na pustym pitch/background.
2. Zachowac `Space + drag` jako szybki tryb panningu.
3. Nie uruchamiac panningu, gdy:
   - aktywne jest narzedzie rysowania/strzalki/strefy/tekst,
   - klikniety zostal zawodnik, pilka, strzalka, strefa, sprzet albo tekst,
   - trwa drag elementu,
   - viewport jest zablokowany.
4. Ustalic prog ruchu, np. 3-5 px, zeby zwykly klik pustej tablicy nadal mogl czyscic selekcje.
5. Cursor:
   - pusty obszar przy mozliwym panie: `grab`,
   - aktywny pan: `grabbing`,
   - narzedzia rysowania zachowuja swoje cursory.
6. Panning ma dzialac dobrze przy `zoom > 1`, ale nie moze przeszkadzac przy normalnym fit.

Pliki prawdopodobne:

- `apps/web/src/app/board/BoardCanvasSection.tsx`
- `apps/web/src/app/board/useBoardPageEffects.ts`
- `apps/web/src/hooks/useCanvasEventsController.ts`
- `apps/web/src/utils/viewportUtils.ts`

Uwaga po external agent pass:

- `useCanvasEventsController.ts` ma juz dodatkowa odpowiedzialnosc: zapis aktualnej pozycji kursora dla `addPlayerAtCursor` / podobnych akcji z top bara.
- Implementacja panningu nie moze usunac ani opoznic tego zapisu w zwyklym ruchu kursora po canvasie.

### C3 — Overlay safe areas i brak nachodzenia UI

**Cel:** zoom widget, help button, squad bench, bottom bar i inspector nie zaslaniaja sobie nawzajem funkcji.

Zadania:

1. Zmapowac stale overlaye w `BoardPage.tsx`:
   - `ZoomWidget`,
   - `FloatingHelpButton`,
   - watermark Free,
   - `SquadBench`,
   - `SmartBottomBar`,
   - `RightInspector`.
2. Dodac responsywne safe-area offsety dla dolnego prawego rogu.
3. `ZoomWidget` nie moze nachodzic na Squad Bench ani bottom bar.
4. Help button nie moze zaslaniac zoom widgetu ani dolnego panelu.
5. Przy inspector open canvas/overlaye nadal maja czytelne polozenie.
6. Sprawdzic collapsed/expanded bottom bar i collapsed/expanded squad bench.

Pliki prawdopodobne:

- `apps/web/src/app/board/BoardPage.tsx`
- `packages/ui/src/ZoomWidget.tsx`
- `packages/ui/src/FloatingHelpButton.tsx`
- `packages/ui/src/SquadBench.tsx`
- `packages/ui/src/SmartBottomBar.tsx`

Zasady:

- Uzywac tokenow design systemu (`bg-surface`, `text-text`, `border-border`).
- Nie hardcodowac przypadkowych hexow.
- Nie dodawac dekoracyjnych kart/orbow/marketingowego UI do edytora.

### C4 — Squad Bench default hidden

**Cel:** pierwsze uruchomienie nie pokazuje lawki skladowej.

Zadania:

1. Zmienic default w `createDocument()` z `squadVisible: true` na default hidden albo usunac zapis pola z dokumentu, jesli widocznosc przechodzi do UI preferences.
2. Ujednolicic fallbacki:
   - `useBoardPageState` nie moze mowic `false`, gdy `AppShell` mowi `true`.
   - domysl wszedzie = `false`.
3. Zachowac istniejacy sklad zawodnikow (`squad`) bez usuwania danych.
4. Tutorial moze tymczasowo otwierac Squad Bench na swoim kroku, ale nie moze trwale zmieniac preferencji uzytkownika bez intencji.

Pliki prawdopodobne:

- `packages/core/src/serialization.ts`
- `apps/web/src/app/routes/useBoardPageState.ts`
- `apps/web/src/app/AppShell.tsx`
- `apps/web/src/app/board/BoardPage.tsx`
- `apps/web/src/store/slices/documentSlice.ts`

### C5 — Squad Bench visibility jako preferencja uzytkownika

**Cel:** po kliknieciu oczka preferencja wraca po reloadzie i po zalogowaniu.

Zadania:

1. Dodac preferencje UI, np. `squadBenchVisible`, do `useUIStore`.
2. Dodac akcje:
   - `toggleSquadBenchVisible`,
   - `setSquadBenchVisible`.
3. Dodac pole do `partialize` localStorage.
4. Dodac cloud sync preferencji dla zalogowanego uzytkownika:
   - rozszerzyc typ `UserPreferences`,
   - zapis przez istniejacy mechanizm `queueSync` / `updatePreferences`,
   - merge przy loginie w `useAuthStore`.
5. Przepiac `BoardPage`/`SquadBench`, aby widocznosc UI brala z `useUIStore`, a nie z `boardDoc.squadVisible`.
6. Zostawic kompatybilnosc ze starymi dokumentami:
   - jezeli stary dokument ma `squadVisible`, nie powinien wymuszac otwarcia lawki w nowym modelu,
   - nie usuwac danych dokumentu przy imporcie.
7. Rozwazyc migracje/cleanup w pozniejszym sprincie: `document.squadVisible` moze zostac legacy polem.

Pliki prawdopodobne:

- `apps/web/src/store/useUIStore.ts`
- `apps/web/src/store/useAuthStore.ts`
- `apps/web/src/lib/supabase.ts`
- `apps/web/src/app/routes/useBoardPageState.ts`
- `apps/web/src/app/board/BoardPage.tsx`
- `packages/ui/src/SquadBench.tsx`

### C6 — Manual QA na laptopowych viewportach

**Cel:** potwierdzic realne zachowanie, nie tylko typecheck.

Zadania:

1. Uruchomic aplikacje lokalnie.
2. Sprawdzic scenariusze w przegladarce / Playwright na viewportach:
   - 1440x900 (MacBook Air / Pro 13),
   - 1512x982 (MacBook Pro 14 logical),
   - 1728x1117 (MacBook Pro 16 logical),
   - 1280x800 (niski laptop),
   - 1024x768 (minimalny tablet/desktop).
3. Zrobic screenshoty albo opisac evidence w raporcie.
4. Sprawdzic dark i light mode, jesli zmieniane byly overlaye.

---

## Poza zakresem

- Postmark, mailing, auth email templates.
- Landing page redesign.
- Zmiana modelu danych squad roster.
- Realtime collaboration.
- Refactor calego canvas systemu.
- Zmiany export pipeline poza naprawami koniecznymi po viewport changes.

---

## Kryteria akceptacji / DoD

### Produktowe

- [ ] Na 1440x900 po otwarciu appki pitch zajmuje wiekszosc obszaru roboczego i jest wygodny do pracy.
- [ ] Shift+1 / `Dopasuj do widoku` ustawia duzy, wycentrowany, nieprzyciety pitch.
- [ ] Zoom in/out dziala plynnie i nie rozjezdza pan/center.
- [ ] Po powiekszeniu uzytkownik moze zlapac pusty obszar tablicy i przesunac widok.
- [ ] `Space + drag` nadal dziala.
- [ ] Drag zawodnikow, pilki, strzalek, stref, sprzetu i tekstu nadal dziala.
- [ ] Klik pustego obszaru nadal czysci selekcje, jezeli uzytkownik nie wykonal drag-panu.
- [ ] Viewport lock blokuje pan/zoom zgodnie z intencja.
- [ ] Squad Bench jest ukryty przy pierwszym uruchomieniu.
- [ ] Klik oczka pokazuje/ukrywa Squad Bench.
- [ ] Preferencja Squad Bench przezywa reload.
- [ ] Preferencja Squad Bench synchronizuje sie po zalogowaniu, zgodnie z istniejacym flow preferencji.
- [ ] Zoom widget, help button, squad bench, bottom bar i inspector nie nachodza na siebie w testowanych viewportach.

### Techniczne

- [ ] Brak regresji w export PNG/PDF/GIF wynikajacej ze zmian viewportu.
- [ ] Brak hardcoded kolorow poza dopuszczonymi przypadkami team/drawing palette.
- [ ] Brak nowego globalnego scale na app shell.
- [ ] Stare dokumenty z `squadVisible` laduja sie bez bledu.
- [ ] `document.squad` nie jest tracony przy toggle widocznosci lawki.
- [ ] Preferencja UI nie jest zapisywana do historii undo/redo board document.
- [ ] Typecheck przechodzi.
- [ ] Unit tests przechodza.
- [ ] Build web/ui przechodzi.
- [ ] E2E smoke `tactical-board.spec.ts` przechodzi albo agent opisuje dokladnie, dlaczego nie mogl go uruchomic.

### Dokumentacja

- [ ] `CHANGELOG.md` zaktualizowany.
- [ ] Jezeli zmieni sie kontrakt preferencji, zaktualizowac `docs/DATA_MODEL.md` albo `docs/FEATURE_SPEC.md`.
- [ ] Agent dopisuje evidence manual QA: viewport, wynik, ewentualny screenshot path/report.

---

## Minimalny plan implementacji dla agenta

1. **Audit bez zmian**
   - Potwierdzic aktualny model `zoom`, `fitZoom`, `effectiveZoom`.
   - Potwierdzic, gdzie `SquadBench` bierze `visible`.
   - Potwierdzic, czy `ZoomWidget` ma stale pozycjonowanie i jak liczy bottom/right.
   - Przejrzec dirty diff po external agent pass i nie nadpisywac zmian w auth/CSP/topbar/legal/cursor placement.

2. **Viewport fit**
   - Naprawic/usprawnic `fitZoom` i `zoomFit`.
   - Dodac/uzupelnic testy helperow w `viewportUtils`.

3. **Panning**
   - Dodac panning pustego backgroundu z progiem ruchu.
   - Upewnic sie, ze element drag i drawing tools maja pierwszenstwo.

4. **Squad Bench preference**
   - Dodac `squadBenchVisible` do `useUIStore`.
   - Przepiac UI z dokumentu na preference.
   - Ujednolicic default hidden.
   - Dodac cloud sync pola.

5. **Overlay safe areas**
   - Poprawic pozycje `ZoomWidget` / `FloatingHelpButton` / watermark przy bottom panels.
   - Sprawdzic collapsed/expanded stany.

6. **Verification**
   - Typecheck/test/build.
   - Manual QA viewport matrix.
   - Zaktualizowac changelog/docs.

---

## Sugerowane testy automatyczne

Nie wszystko musi byc pokryte automatem, ale agent powinien dodac testy tam, gdzie sa tanie i stabilne.

1. `viewportUtils.test.ts`
   - `centerPanOffset` centruje pitch.
   - `clampPanOffset` nie pozwala wyjechac pitchowi calkowicie poza ekran.
   - zoom-to-cursor zachowuje punkt pod kursorem.

2. Store tests, jesli istnieje lokalny pattern:
   - default `squadBenchVisible === false`,
   - toggle zapisuje preference,
   - persisted state odtwarza preference.

3. E2E smoke, jesli stabilne:
   - nowy board ma hidden squad bench,
   - klik oczka pokazuje lawke,
   - reload zachowuje stan,
   - Shift+1 nie zmniejsza pitcha do miniatury.

---

## Manual QA matrix

Agent po implementacji ma wypelnic w raporcie:

| Viewport | Inspector | Squad Bench | Bottom Bar | Oczekiwany wynik | Status |
|---|---|---|---|---|---|
| 1440x900 | open | hidden | normal | pitch duzy, zoom/help bez kolizji | TODO |
| 1440x900 | open | visible | normal | pitch nadal uzywalny, overlaye bez kolizji | TODO |
| 1512x982 | open | hidden | normal | pitch duzy, fit poprawny | TODO |
| 1728x1117 | open | hidden | normal | pitch duzy, nie za maly w centrum | TODO |
| 1280x800 | closed | hidden | normal | pitch miesci sie, pan dziala | TODO |
| 1024x768 | closed | hidden | collapsed | brak overlapu krytycznych kontrolek | TODO |

Scenariusze:

1. Otworz nowy board.
2. Sprawdz default rozmiar pitcha.
3. Kliknij `+` zoom kilka razy.
4. Przeciagnij pusty pitch i potwierdz pan.
5. Przeciagnij zawodnika i potwierdz, ze nie odpala pan.
6. Wlacz aktywne narzedzie strzalki/strefy i potwierdz, ze drag nie odpala pan.
7. Kliknij Shift+1.
8. Toggle Squad Bench oczkiem.
9. Reload.
10. Sprawdz, czy preference zostala.

---

## Ryzyka i uwagi

- Najwieksze ryzyko: konflikt miedzy panningiem pustego backgroundu a marquee selection. Jesli oba sa potrzebne, agent ma zachowac marquee przez modifier lub doprecyzowac warunek startu.
- Drugie ryzyko: pomieszanie `zoom` i `fitZoom`. Agent ma nazwac zmienne jasno i nie dodawac kolejnego niejawnego scale.
- Trzecie ryzyko: `squadVisible` w dokumencie. Preferencja UI nie powinna brudzic historii dokumentu ani powodowac autosave przy samym pokazaniu/ukryciu lawki.
- Tutorial moze otwierac lawke demonstracyjnie, ale po zakonczeniu nie powinien nadpisywac preferencji uzytkownika bez intencji.

---

## Komenda startowa dla agenta

```text
Zrealizuj `tasks/UX_EDITOR_VIEWPORT_BENCH_2026-06-29.md`.
Najpierw przeczytaj caly brief oraz `docs/UX_PATTERNS.md`, `docs/DESIGN_SYSTEM.md`.
Uwzglednij sekcje "Aktualizacja po rownoleglym agencie — 2026-06-29".
Nie ruszaj Postmarka, mailingu ani landing page.
Nie cofaj zmian drugiego agenta; szczegolnie zachowaj cursor position tracking w `useCanvasEventsController.ts`.
Po implementacji uruchom typecheck/test/build i wypelnij evidence manual QA dla viewportow laptopowych.
```
