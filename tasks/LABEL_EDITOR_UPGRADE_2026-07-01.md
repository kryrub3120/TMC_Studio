# Label Editor Upgrade — Wariant B, Multiline, Auto-fit, Wyrównanie, Jeden Model Skrótów

**Data:** 2026-07-01
**Status:** READY FOR AGENT
**Priorytet:** P1
**Typ:** UX/editor feature (canvas text element)
**Zasada nadrzedna:** etykiety na tablicy maja wygladac premium (spojne z reszta UI), edycja ma byc naturalna (Enter = nowa linia, autosize), a skroty klawiszowe maja byc jeden spojny model dla calej apki, nie per-typ-elementu wyjatki.

---

## Kontekst

Zgloszenie uzytkownika (2026-07-01), w trzech krokach:

1. Wizualnie etykiety tekstowe na boisku (`TextNode`) wygladaja "srednio" — plaski prostokat, brak ramki, opacity 0.85, cien tylko na tekscie. Wybrany kierunek: **Wariant B — mocny flat chip** (nasycony kolor wypelnienia + 2px kontrastowa ramka, radius 8, cien elewacji), spojny wizualnie z czerwonymi trojkatami zawodnikow juz uzywanymi w diagramach. Wariant musi dzialac tez w print mode (dzis `isPrintMode` czysci tlo i wymusza czarny tekst — to zostaje, ramka ma przetrwac druk).
2. Edycja tekstu ma dostac: auto-fit rozmiaru (juz czesciowo istnieje przez fontSize), **Enter = nowa linia** (dzis Enter zapisuje i zamyka — zmiana zachowania), oraz **wyrownanie tekstu** (do lewej / do prawej / do srodka / obustronnie).
3. Skrot `T` **zostaje bez zmian** — dodawanie tekstu w miejscu kursora, jak dzis.
4. Dodatkowo: audit pokazal, ze **rozmiar i kolor** maja dzis 3 rozne, niespojne mechanizmy w zaleznosci od typu elementu (patrz Diagnoza). Ustalamy **jeden model skrotowy** dla calej aplikacji, nie tylko dla tekstu.

---

## Diagnoza techniczna (stan na 2026-07-01)

### Wyglad etykiety — `packages/board/src/TextNode.tsx`

- Tlo: `Rect` z `fill={effectiveBgColor}`, `opacity={0.85}`, `cornerRadius={4}`, bez `stroke`.
- Cien jest tylko na `<Text>` (`shadowColor rgba(0,0,0,0.5)`, blur 2, offset 1,1), nie na tle.
- Print mode: lokalna funkcja `sanitizeTextColor()` (w tym samym pliku) wymusza **caly** kolor na czarny w print mode i usuwa tlo calkowicie (`effectiveBgColor = isPrintMode ? undefined : ...`). To jest INNA logika niz wspolny `sanitizeColorForPrint()` w `packages/ui/src/colors.ts`, ktory tylko zamienia bialy na czarny. Nalezy to zostawic jako swiadomy wyjatek dla czytelnosci tekstu na wydruku, ale nowe pole `borderColor` musi przejsc przez analogiczna sanityzacje (patrz TXT1/TXT3).
- Model danych `TextElement` (`packages/core/src/types.ts:126-135`) ma dzis: `content, fontSize, fontFamily, color, bold, italic, backgroundColor?`. Brak `borderColor`, `borderWidth`, `textAlign`.

### Edycja inline — `useTextEditController.ts` + `BoardEditOverlays.tsx`

- `handleTextKeyDown()`: **Enter bez Shift = zapisz i zamknij**, **Shift+Enter = nowa linia**, **Escape = anuluj (odrzuc zmiany)**.
- Textarea w `BoardEditOverlays.tsx`: `rows={1}`, `resize-none overflow-hidden`, brak logiki auto-grow wysokosci/szerokosci — nie sledzi tresci wielolinijkowej wizualnie.
- `onBlur` juz dzis wywoluje `save()` (klik poza polem zapisuje) — to zostaje glownym "cichym" sposobem konczenia edycji.

### Skroty rozmiaru — 3 rozne mechanizmy dzis (`useKeyboardShortcuts.ts`, `elementsSlice.ts`)

| Typ elementu | Dzisiejszy skrot | Funkcja |
|---|---|---|
| Sprzet (equipment) | `+` / `-` (equipment zaznaczony) | `scaleSelectedEquipmentBy(1.15 / 0.85)` |
| Gracz / Pilka / Strefa / Tekst | `Cmd+Alt+=` / `Cmd+Alt+-` | `resizeSelected(1.1 / 0.9)`, clamp 0.4–2.5x |
| Tekst (dodatkowo, osobny mechanizm) | `↑` / `↓` (tekst zaznaczony) | bezposrednio `fontSize ± 2`, clamp 8–72 |
| Nic nie zaznaczone / dowolny inny typ | `+` / `-` | `zoomIn()` / `zoomOut()` |

Efekt: zaznaczony pachołek + `+` = zoom (bo equipment nie jest zaznaczony), zaznaczona strefa + `+` = tez zoom (bo strefa nie ma specjalnego przypadku jak equipment). Niespojne z perspektywy uzytkownika.

### Skroty koloru — 2 rozne mechanizmy dzis, plus martwy kod

- Gracz / Pilka / Strzalka / Strefa / Rysunek / Sprzet: `Alt+↑` / `Alt+↓` → `cycleSelectedColor(direction)`, cykluje przez `SHARED_COLORS` (`packages/ui/src/colors.ts`).
- Tekst: `Shift+↑` cykluje `backgroundColor` (osobna, stala tablica 6 kolorow w kodzie), `Shift+↓` czysci tlo.
- **Bug znaleziony w audycie:** `docs/COMMANDS_MAP.md:186` juz dzis dokumentuje `Alt+↑/↓ to cycle text color` jako oczekiwane zachowanie dla tekstu — ale w `useKeyboardShortcuts.ts` galaz `if (textEl)` w case'ach `arrowup`/`arrowdown` jest sprawdzana PRZED `altKey`, wiec `Alt+↑/↓` na zaznaczonym tekscie dzis robi dokladnie to samo co samo `↑/↓` (zmienia fontSize), ignorujac `Alt`. Kod `cycleSelectedColor()` w `elementsSlice.ts:876-883` ma juz gotowa galaz `isTextElement(el)`, ktora cykluje `el.color` — jest nieosiagalna z klawiatury. To nie jest nowa decyzja projektowa, to naprawa udokumentowanego, ale niezaimplementowanego zachowania.
- `Alt+←/→` (`adjustSelectedStrokeWidth`) dziala dla strzalek/stref/rysunkow (grubosc linii/obrysu), dla tekstu dzis nic nie robi (galaz `if (textEl)` w `arrowleft`/`arrowright` tez ignoruje `altKey` i zawsze toggle'uje bold/italic).

### Klawisze alfabetu — zero wolnych liter

Wszystkie 26 liter A–Z sa juz zwiazane globalnie (dodawanie elementow / narzedzia / widoki — potwierdzone przegladem wszystkich `case '<litera>'` w `useKeyboardShortcuts.ts`). Kazda nowa funkcja musi wejsc przez modyfikator (`Shift`/`Alt`/`Cmd`) na istniejacej literze/strzalce, nie przez nowa litere. `T` = `addTextAtCursor` zostaje calkowicie nietkniety — globalny handler i tak pomija wszystkie skroty, gdy fokus jest w polu edycji tekstu (`target.tagName === 'TEXTAREA'` guard, `useKeyboardShortcuts.ts:162-166`), wiec zero ryzyka kolizji miedzy trybem "dodaj tekst" a trybem "edytuj tekst".

---

## Cel

Po wdrozeniu:

1. Etykiety na boisku wygladaja jak Wariant B (mocny flat chip) — na ekranie i w print mode.
2. Uzytkownik moze pisac wieloliniowy tekst: Enter przechodzi do nowej linii, pole edycji rosnie/wraca do rozmiaru z trescia.
3. Uzytkownik moze ustawic wyrownanie tekstu (lewo/srodek/prawo/justuj) myszka (toolbar) i klawiatura (power user).
4. Jeden spojny model skrotow dla ROZMIARU (`Shift+"+"/"-"`) i KOLORU (`Alt+↑/↓`) dziala tak samo dla kazdego typu elementu na tablicy, tekst wlacznie.
5. `T` dziala dokladnie tak jak dzis.
6. Zero regresji w exporcie PNG/PDF/GIF i w istniejacych skrotach (bold/italic/fontSize/tlo/nudge/undo itd.).

---

## Zakres prac

### TXT1 — Model danych + wyglad chipa (Wariant B)

**Cel:** `TextElement` obsluguje ramke i wyrownanie; `TextNode` renderuje Wariant B.

Zadania:
1. `packages/core/src/types.ts` — rozszerzyc `TextElement`:
   ```ts
   interface TextElement extends BoardElementBase {
     // ...istniejace pola bez zmian
     borderColor?: string;   // domyslnie: ciemniejszy odcien backgroundColor, patrz TXT1.3
     borderWidth?: number;   // domyslnie 2
     textAlign?: 'left' | 'center' | 'right' | 'justify'; // domyslnie 'left'
   }
   ```
2. `packages/board/src/TextNode.tsx`:
   - Tlo: `opacity={0.85}` → pelne krycie (Wariant B jest solid), `cornerRadius={4}` → `8`, dodac `stroke={effectiveBorderColor}` `strokeWidth={text.borderWidth ?? 2}`.
   - Jesli `borderColor` nie ustawiony, wyliczyc domyslny (np. przyciemniona wersja `backgroundColor` o ~30%, helper w `@tmc/core` lub `@tmc/ui`).
   - Padding chipa: zwiekszyc z `x:-4,y:-2,w+8,h+4` do wygodniejszego dla "chip" (np. `x:-8,y:-5,w+16,h+10`) — do dopracowania wizualnie wzgledem mockupu zaakceptowanego w rozmowie.
3. Print mode: rozszerzyc lokalna sanityzacje w `TextNode.tsx` o `borderColor` → wymusic czarny w print mode (ramka MA przetrwac druk, to jest sedno Wariantu B — dziala tak samo dobrze na ekranie i wydruku).

Pliki: `packages/core/src/types.ts`, `packages/board/src/TextNode.tsx`.

---

### TXT2 — Multiline editing (Enter = nowa linia)

**Cel:** Enter dodaje linie, nie zapisuje. Zapis: Ctrl/Cmd+Enter lub klik poza polem (blur, bez zmian).

Zadania:
1. `useTextEditController.ts` → `handleTextKeyDown()`:
   - Enter bez modyfikatora: **usunac** `preventDefault()+save()`, pozwolic na domyslne zachowanie textarea (nowa linia).
   - Dodac: `(e.metaKey || e.ctrlKey) && e.key === 'Enter'` → `preventDefault()` + `save()` (nowy skrot "zapisz i zamknij").
   - Escape: bez zmian (anuluj/odrzuc).
   - Usunac galaz Shift+Enter jako specjalny przypadek (staje sie zbedna — zwykly Enter juz robi nowa linie; Shift+Enter dalej bedzie dzialac identycznie przez natywne zachowanie textarea, nie trzeba tego osobno obslugiwac).
2. `BoardEditOverlays.tsx` — textarea:
   - Zmienic `rows={1}` na auto-grow: nowy mały hook `useAutosizeTextarea(ref, value)` w `apps/web/src/hooks/`, ktory po kazdej zmianie ustawia `el.style.height = 'auto'` a potem `el.style.height = el.scrollHeight + 'px'`.
   - Szerokosc: dopasowac do najdluzszej linii (mirror-span technique albo `ch`-based min/max width), zeby WYSIWYG odpowiadalo finalnemu renderowi w Konva.
   - Dodac drobny hint pod polem przy pierwszych uzyciach (np. tekst 11px, `text-muted`): "Enter = nowa linia • kliknij poza = zapisz" — jednorazowy, chowany po pierwszym uzyciu (localStorage flag), zeby zaadresowac ryzyko zmiany przyzwyczajenia (dawniej Enter zapisywal).
3. `saveTextEdit()` — upewnic sie, ze `.trim()` dziala na calym bloku (trim tylko krawedzi, nie kazdej linii z osobna) — juz tak dziala, tylko zweryfikowac testem.

Pliki: `apps/web/src/hooks/useTextEditController.ts`, `apps/web/src/app/board/BoardEditOverlays.tsx`, nowy `apps/web/src/hooks/useAutosizeTextarea.ts`.

**Decyzja (nie do zmiany bez osobnej rozmowy):** Escape zostaje "anuluj/odrzuc", NIE zmieniamy na "zapisz". Ryzyko utraty danych przy zmianie znaczenia Escape jest wieksze niz zysk z jednego dodatkowego skrotu zapisu — mamy juz blur + Ctrl/Cmd+Enter.

---

### TXT3 — Renderowanie: auto-fit + wyrownanie w Konva

**Cel:** `align` w Konva `<Text>` dziala wizualnie (wymaga jawnego `width`), multiline dziala z nowym chipem.

Zadania:
1. `TextNode.tsx` — Konva `<Text>` dostaje `align={text.textAlign ?? 'left'}` oraz jawny `width={textSize.width}` (Konva stosuje `align` tylko gdy `width` jest ustawiony — bez tego wszystkie linie i tak ladowalyby sie do lewej krawedzi niezaleznie od `align`).
2. Dwuprzebiegowy pomiar: istniejacy `useEffect` juz mierzy `textRef.current.width()/height()` po renderze (bez wymuszonego `width`) — zachowac ten pierwszy pomiar "naturalny", a `width` na `<Text>` ustawiac z `textSize.width` w KOLEJNYM renderze (jedna klatka opoznienia, niezauwazalna, standardowa technika przy auto-sizujacym tekscie z wyrownaniem).
3. Dodac `lineHeight={1.2}` dla czytelnosci multiline w chipie.
4. Rect tla i selection indicator uzywaja tego samego `textSize` — bez zmian w logice, tylko nowe wymiary/padding z TXT1.

Pliki: `packages/board/src/TextNode.tsx`.

---

### TXT4 — Wyrownanie tekstu: UI + skroty

**Cel:** 4 opcje wyrownania dostepne i myszka, i klawiatura, bez kolizji z istniejacymi skrotami.

Zadania:
1. **Tryb "zaznaczony, nie edytowany"** (pojedynczy klik na tekst, focus na canvasie — dokladnie tak jak dzis dziala `↑/↓` = fontSize, `←/→` = bold/italic):
   - `Alt+←` = poprzednie wyrownanie w cyklu (left → justify → right → center → left...), `Alt+→` = nastepne (left → center → right → justify → left...).
   - Zero kolizji: `Alt+←/→` na zaznaczonym tekscie dzis nic nie robi (patrz Diagnoza — galaz `if (textEl)` ignoruje `altKey`, wiec dzis to po prostu bold/italic toggle bez wzgledu na Alt; trzeba dodac explicit check na `altKey` PRZED bold/italic, analogicznie do naprawy w TXT5 dla `Alt+↑/↓`).
2. **Tryb edycji (dwuklik, kursor w textarea):** strzalki musza zostac do poruszania kursora w tekscie — wyrownanie TYLKO myszka/toolbar w tym trybie, bez skrotu klawiszowego.
3. **UI:** rozszerzyc `packages/ui/src/SelectionToolbar.tsx` o 4 przyciski (align-left/center/right/justify, ikony w istniejacej konwencji `stroke="currentColor"` SVG), widoczne tylko gdy zaznaczenie to dokladnie jeden `TextElement`. To rozwiazuje odkrywalnosc — dzis bold/italic/fontSize/tlo nie maja w ogole przyciskow (tylko skroty), co dla 4 opcji wyrownania bylo za malo intuicyjne.
4. Nowa akcja w store: `updateTextProperties(id, { textAlign })` — funkcja `updateTextProperties` juz istnieje (uzywana dla `fontSize`/`backgroundColor`), wystarczy przekazac nowe pole.

Pliki: `apps/web/src/hooks/useKeyboardShortcuts.ts` (case `arrowleft`/`arrowright`), `packages/ui/src/SelectionToolbar.tsx`, `apps/web/src/store/slices/elementsSlice.ts` (jesli `updateTextProperties` wymaga typowania nowego pola).

---

### TXT5 — Jeden model skrotow: rozmiar (`Shift+"+"/"-"`) i kolor (`Alt+↑/↓`)

**Cel:** jeden mechanizm rozmiaru i jeden mechanizm koloru dla WSZYSTKICH typow elementow, nie tylko tekstu.

Zadania — rozmiar:
1. `useKeyboardShortcuts.ts`, case `'='`/`'+'` i `'-'`: dodac galaz `e.shiftKey && !isCmd` → wywolac uniwersalny resize (patrz p.2), NIEZALEZNIE od typu zaznaczonego elementu.
2. Nowa funkcja w store `resizeSelectedUniversal(factor)` (albo rozszerzyc istniejacy `resizeSelected`), ktora w jednym miejscu obsluguje wszystkie typy:
   - Gracz/Pilka/Strefa/Tekst → dokladnie to, co dzis robi `resizeSelected` (radius/width-height/fontSize, clamp 0.4–2.5x).
   - Sprzet → to, co dzis `scaleSelectedEquipmentBy` (clamp 0.25–3x).
   - Strzalka/Rysunek (nie maja "skali", tylko grubosc) → alias do `adjustSelectedStrokeWidth(+1/-1)`, zeby `Shift+"+/-"` na strzalce tez cos sensownie robilo zamiast byc no-opem.
3. **Wycofac** stary equipment-only `+`/`-` (case `'!isCmd && hasSelectedEquipment()'`) i `Cmd+Alt+=`/`Cmd+Alt+-` (`resizeSelected` pod tym skrotem) — zastapione przez `Shift+"+/-"`. Sam `+`/`-` (bez Shift) = zawsze zoom, bez wyjatkow.
4. Tekst zachowuje DODATKOWO `↑/↓` = fontSize ±2 jako szybka sciezka (nic nie zmieniamy, to bonus, nie kolizja).

Zadania — kolor:
5. `useKeyboardShortcuts.ts`, case `arrowup`/`arrowdown`: w galezi `if (textEl)` dodac `altKey` PRZED sprawdzeniem `shiftKey`/fontSize — `Alt+↑/↓` na zaznaczonym tekscie ma wywolywac `cycleSelectedColor(kierunek)` (galaz `isTextElement` w `cycleSelectedColor` juz istnieje w `elementsSlice.ts:876-883`, jest tylko nieosiagalna). To naprawia dokumentowany (`docs/COMMANDS_MAP.md:186`), ale niezaimplementowany fragment zachowania — nie nowa decyzja.
6. Weryfikacja: `Shift+↑/↓` (cykl/czyszczenie tla tekstu) i `↑/↓` bez modyfikatora (fontSize) zostaja BEZ ZMIAN — zmienia sie tylko `Alt+↑/↓`.

Finalna tabela (po TXT4+TXT5), dla zaznaczonego, nieedytowanego tekstu:

| Skrot | Efekt |
|---|---|
| `↑` / `↓` | fontSize ± 2 (8–72) — bonus dla tekstu |
| `←` / `→` | toggle bold / italic |
| `Shift+↑` | cykl koloru tla |
| `Shift+↓` | usun tlo |
| `Alt+↑` / `Alt+↓` | cykl koloru tekstu (NAPRAWIONE, bylo martwe) |
| `Alt+←` / `Alt+→` | cykl wyrownania (NOWE) |
| `Shift+"+"` / `Shift+"-"` | rozmiar (fontSize x-skala, NOWE, uniwersalne z innymi typami) |

Dla kazdego innego typu (gracz/pilka/strzalka/strefa/sprzet/rysunek): `Alt+↑/↓` = kolor (bez zmian), `Shift+"+/-"` = rozmiar/grubosc (NOWE, ujednolicone), `Alt+←/→` = drugi atrybut kontekstowy — grubosc linii dla strzalki/strefy/rysunku (bez zmian).

Pliki: `apps/web/src/hooks/useKeyboardShortcuts.ts`, `apps/web/src/store/slices/elementsSlice.ts`.

---

### TXT6 — Dokumentacja i QA

**Cel:** dokumentacja projektu odzwierciedla nowy stan, zgodnie z polityka (kazda zmiana kontraktu/skrotow aktualizuje `docs/`).

Zadania:
1. `docs/COMMANDS_MAP.md`:
   - Quick Reference Table: zaktualizowac `resizeRadiusUp/Down` (Cmd+Alt+= wycofane → `Shift+"+/-"`), `equipScaleUp/Down` (wycofane → `Shift+"+/-"`), dodac `textCycleColor` (Alt+↑/↓, NAPRAWIONE), `textAlign` (Alt+←/→, NOWE), `resizeUniversal` (Shift+"+/-", NOWE).
   - Sekcja "Add Text": zaktualizowac liste edycji o nowe zachowanie Enter/Ctrl+Enter/wyrownanie.
2. `docs/DATA_MODEL.md`: dopisac `borderColor?`, `borderWidth?`, `textAlign?` do interfejsu `TextElement`.
3. `CHANGELOG.md`, sekcja `[Unreleased]`: wpis w `### Added` (nowy wyglad chipa, multiline, wyrownanie, ujednolicone skroty) i `### Changed` (Enter juz nie zapisuje, equipment `+/-` i `Cmd+Alt+=/-` wycofane).
4. `packages/ui/src/CheatSheetOverlay.tsx` / `packages/ui/src/helpSidebarData.ts`: dopisac nowe skroty (alignment, resize).
5. `packages/ui/src/locales/{en,pl,es}.ts`: nowe klucze toastow (np. `alignLeft`, `alignCenter`, `alignRight`, `alignJustify`, `resizedUp`/`resizedDown` juz istnieja — zweryfikowac czy pasuja do uniwersalnego resize).

Pliki: `docs/COMMANDS_MAP.md`, `docs/DATA_MODEL.md`, `CHANGELOG.md`, `packages/ui/src/CheatSheetOverlay.tsx`, `packages/ui/src/helpSidebarData.ts`, `packages/ui/src/locales/en.ts`, `packages/ui/src/locales/pl.ts`, `packages/ui/src/locales/es.ts`.

---

## Poza zakresem

- Zmiana zachowania Escape (zostaje "anuluj").
- Nudge tekstu strzalkami (dzis tekst nie da sie przesuwac klawiatura — pozostaje tylko drag myszka; nie jest to czesc tego sprintu).
- Ink-color per-znak / rich text (bold tylko na calym elemencie, bez zmian).
- Zmiana modelu `SHARED_COLORS` / dodawanie nowych kolorow do palety.
- Realtime collaboration, refactor calego systemu skrotow poza opisanym zakresem.

---

## Kryteria akceptacji / DoD

### Produktowe
- [ ] Etykieta na boisku renderuje sie jako Wariant B (solid fill, 2px kontrastowa ramka, radius 8, cien elewacji) — na ekranie.
- [ ] W print mode etykieta traci wypelnienie, tekst i ramka sa czarne, cien znika — spojnie z reszta print mode.
- [ ] Enter w edytowanym tekscie dodaje nowa linie, nie zamyka edycji.
- [ ] Ctrl/Cmd+Enter zapisuje i zamyka edycje.
- [ ] Klik poza polem (blur) nadal zapisuje.
- [ ] Escape nadal odrzuca zmiany.
- [ ] Textarea w edycji rosnie/maleje z trescia (wysokosc i szerokosc), przyblizone WYSIWYG do finalnego renderu.
- [ ] Wyrownanie tekstu (lewo/srodek/prawo/justuj) dziala wizualnie w Konva (wymaga `width` na `<Text>` — zweryfikowac renderem multiline z roznymi dlugosciami linii).
- [ ] Przyciski wyrownania w `SelectionToolbar` dzialaja i pokazuja sie tylko dla pojedynczego zaznaczonego tekstu.
- [ ] `Alt+←/→` na zaznaczonym (nieedytowanym) tekscie cyklem zmienia wyrownanie.
- [ ] `Alt+↑/↓` na zaznaczonym (nieedytowanym) tekscie cyklem zmienia kolor tekstu (wczesniej martwe, teraz dziala).
- [ ] `Shift+"+"` / `Shift+"-"` zmienia rozmiar/skale dla gracza, pilki, sprzetu, strefy, tekstu; dla strzalki/rysunku zmienia grubosc linii.
- [ ] Sam `+`/`-` (bez Shift) zawsze zoomuje boisko, niezaleznie od zaznaczenia (rowniez gdy zaznaczony jest sprzet).
- [ ] `T` dziala dokladnie jak dzis — dodaje tekst w miejscu kursora, zero zmian.
- [ ] Wszystkie inne dzisiejsze skroty tekstu (`↑/↓` fontSize, `←/→` bold/italic, `Shift+↑/↓` tlo) dzialaja bez zmian.

### Techniczne
- [ ] Brak regresji w eksporcie PNG/PDF/GIF (nowy padding/border chipa nie ucina sie na krawedziach eksportu).
- [ ] `Cmd+Alt+=/-` i equipment-only `+/-` usuniete z kodu (nie zostawiac martwych galezi).
- [ ] Typecheck przechodzi (`pnpm typecheck`).
- [ ] Testy jednostkowe przechodza; nowe testy dla `cycleSelectedColor` (tekst), `resizeSelectedUniversal`, `useAutosizeTextarea`.
- [ ] Build web/ui/board przechodzi.
- [ ] Brak nowych hardcoded hexow poza juz istniejacymi paletami (`SHARED_COLORS`, `TEAM_KIT_PRESETS`).

### Dokumentacja
- [ ] `docs/COMMANDS_MAP.md` zaktualizowany (Quick Reference Table + sekcja Add Text).
- [ ] `docs/DATA_MODEL.md` zaktualizowany (`TextElement`).
- [ ] `CHANGELOG.md` zaktualizowany (`[Unreleased]`, Added + Changed).
- [ ] Cheat sheet / help sidebar zaktualizowane o nowe skroty.
- [ ] `tasks/NEXT_TASK.md` zaktualizowany po zakonczeniu (przeniesienie do "Zakonczone / kontekst").

---

## Minimalny plan implementacji dla agenta

1. **TXT1** — model danych (`types.ts`) + wyglad chipa w `TextNode.tsx` (bez zmiany zachowania edycji). Weryfikacja wizualna (zrzuty ekranu ekran + print mode).
2. **TXT3** — wiring `align`/`width`/`lineHeight` w Konva, zanim dodamy realny multi-line content (latwiej testowac na sztywnym `\n` w devtools/store przed podpieciem UI).
3. **TXT2** — multiline editing w textarea (Enter/Ctrl+Enter, autosize hook).
4. **TXT4** — wyrownanie: pole danych + skroty + toolbar.
5. **TXT5** — ujednolicenie rozmiaru i koloru dla wszystkich typow, wycofanie starych skrotow.
6. **TXT6** — dokumentacja, changelog, cheat sheet, NEXT_TASK.md.
7. **Weryfikacja koncowa** — typecheck/test/build, manualny przeglad wszystkich skrotow z tabeli w Kryteriach akceptacji, zrzuty ekranu (ekran + print) do evidence.

---

## Sugerowane testy automatyczne

1. `elementsSlice.test.ts` (lub odpowiednik):
   - `cycleSelectedColor` na `TextElement` zmienia `color` zgodnie z `SHARED_COLORS` (regresja na naprawiony bug).
   - Uniwersalny resize: gracz/pilka → `radius`, strefa → `width/height`, tekst → `fontSize`, sprzet → `scale`, strzalka/rysunek → `strokeWidth`.
   - Retencja clampow (0.4–2.5x ogolnie, 0.25–3x sprzet, 8–72 fontSize, 1–10/1–30 strokeWidth).
2. `useAutosizeTextarea.test.ts`: wysokosc/szerokosc rosnie z dodawana trescia, maleje po usunieciu linii.
3. `TextNode` (react-konva) — jesli istnieje juz konwencja testowania renderu Konva w projekcie: `align` + `width` faktycznie trafiaja do `<Text>` propsow.
4. Regresja skrotow: `t` nadal wywoluje `addTextAtCursor` niezaleznie od zmian w `arrowup/down/left/right` i `+/-`.

---

## Manual QA matrix

| Scenariusz | Oczekiwany wynik | Status |
|---|---|---|
| Nowa etykieta (`T`), wpisanie tekstu, Enter, kolejna linia, Ctrl+Enter | Dwie linie w jednym chipie Wariant B, edycja zamknieta | TODO |
| Ta sama etykieta w print mode | Ramka czarna, tlo brak, tekst czarny, brak cienia | TODO |
| Zaznaczony tekst (bez edycji): `Alt+→` x4 | Cykl left→center→right→justify→left, widoczna zmiana ulozenia wielu linii | TODO |
| Zaznaczony tekst: `Alt+↑` x3 | Kolor tekstu zmienia sie zgodnie z `SHARED_COLORS` | TODO |
| Zaznaczony tekst: `Shift+"+"` x3 | fontSize rosnie, chip auto-fit | TODO |
| Zaznaczony pachołek: `Shift+"+"` | Pachołek rosnie | TODO |
| Zaznaczony pachołek: `+` (bez Shift) | Boisko zoomuje, pachołek NIE rosnie | TODO |
| Zaznaczona strefa: `Shift+"+"` | Strefa rosnie (width/height) | TODO |
| Zaznaczona strzalka: `Shift+"+"` | Grubosc linii rosnie | TODO |
| Klik `T` z fokusem w innym polu tekstowym (np. nazwa projektu) | Skrot NIE odpala (guard na INPUT/TEXTAREA), litera "t" wpisuje sie normalnie | TODO |
| Toolbar: klik 4 przyciskow wyrownania na zaznaczonym tekscie | Wizualna zmiana, zgodna ze skrotem klawiszowym | TODO |
| Export PNG/PDF ze star± etykieta (Wariant B, wieloliniowa, wyjustowana) | Brak ciecia krawedzi, ramka widoczna | TODO |

---

## Ryzyka i uwagi

- **Najwieksze ryzyko:** zmiana znaczenia Enter to zmiana przyzwyczajenia. Mitygacja: hint pod polem (TXT2.2) + Ctrl/Cmd+Enter jako jawny "zapisz". Nie zmieniac Escape.
- **Alt+↑/↓ dla tekstu** — to NAPRAWA udokumentowanego zachowania (`docs/COMMANDS_MAP.md:186`), nie nowa funkcja — ale trzeba dwa razy sprawdzic, ze nie psuje `Shift+↑/↓` (inny modyfikator, inna galaz) i nie psuje samego `↑/↓` bez modyfikatora (fontSize, tez inna galaz — musi zostac pierwsza w kolejnosci sprawdzania warunkow).
- **Konva `align` bez `width`** — latwo o regresje "wyrownanie nic nie robi", jesli ktos w przyszlosci usunie przekazywanie `width` przy refaktorze `TextNode`. Warto zostawic komentarz w kodzie tlumaczacy, dlaczego `width` jest wymagane.
- **Wycofanie `Cmd+Alt+=/-` i equipment-only `+/-`** — to zmiana zachowania dla obecnych uzytkownikow (jesli ktos juz zdazyl sie nauczyc starych skrotow w becie). Do rozwazenia: zostawic stare skroty jako ciche aliasy przez jeden release z komentarzem `// LEGACY, remove after 2026-08`, zamiast twardo usuwac — decyzja do potwierdzenia z produktem, plan zaklada twarde usuniecie dla czystosci modelu.
- **Zone/Arrow + `Shift+"+/-"` → alias do stroke width** — upewnic sie, ze to nie koliduje z ewentualnym przyszlym "resize ksztaltu strefy" (dzis `resizeSelected` juz skaluje `width/height` strefy pod `Shift+"+/-"` — stroke width zostaje WYLACZNIE pod `Alt+←/→`, `Shift+"+/-"` na strefie NIE dotyka `borderWidth`, tylko wymiarow).

---

## Komenda startowa dla agenta

```text
Zrealizuj `tasks/LABEL_EDITOR_UPGRADE_2026-07-01.md`.
Najpierw przeczytaj caly brief oraz docs/COMMANDS_MAP.md i docs/DATA_MODEL.md.
Kolejnosc: TXT1 -> TXT3 -> TXT2 -> TXT4 -> TXT5 -> TXT6.
Nie zmieniaj skrotu "T" (addTextAtCursor) i nie zmieniaj semantyki Escape (anuluj).
Po kazdym TXT-bloku uruchom typecheck. Po calosci uruchom typecheck/test/build,
zaktualizuj CHANGELOG.md, docs/COMMANDS_MAP.md, docs/DATA_MODEL.md i tasks/NEXT_TASK.md.
```
