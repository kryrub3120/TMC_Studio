# Plan poprawek UI / UX - TMC Studio (wersja scalona i zweryfikowana)

> Status: **ZATWIERDZONY - decyzje 1-8 zaakceptowane 2026-06-17.** Gotowy do uruchomienia MasterAutopilot.
> Data: 2026-06-17 (wersja 2 - po weryfikacji w kodzie).
> Zakres: tablica, skroty klawiaturowe, workflow LPM/PPM, grupy, blokady, menu kontekstowe, inspector, tutorial, landing, pricing, brand.

Ten dokument scala plan bazowy (`Plan poprawek UI / UX - TMC Studio`, sekcje A-C) z rozszerzeniem (sekcja D). Wszystkie twierdzenia techniczne zostaly zweryfikowane w kodzie repo (14/14 PRAWDA - patrz `thoughts/2026-06-17/1930_master-autopilot_ui-ux-plan-verification.md`).

**Zasady nadrzedne (Hard Rules):**
- i18n w 3 jezykach (en/pl/es) dla kazdego nowego user-facing tekstu - zero hardcoded stringow.
- `locked` na `BoardElement` jest opcjonalne (`?`) - backward compat ze starymi dokumentami. Brak migracji SQL (JSONB przyjmie nowe pole).
- Kazda akcja zmieniajaca stan elementu (lock/unlock/group/ungroup) musi wywolywac `pushHistory()` dla undo/redo.
- Nie dotykamy produkcji, `.env.production` ani migracji DB.

---

## Sekcja A - Quick wins (inspector, pomoc, tutorial)

### A1. Kotwice tutoriala po zmianach UI
**Objaw:** Coach Tour (Sprint F) uzywa `data-tour` na TopBar/RightInspector. Zmiany w D5/D6 moga przesunac lub usunac te kotwice.
**Zakres:** po S2 (D5/D6) zweryfikowac i naprawic `data-tour` na: `shortcuts`, `inspector`, `export`, `premium`. Dodac kotwice dla nowego PPM i locka jesli tutorial ma je pokazywac.
**i18n:** teksty krokow tutoriala juz sa w `tutorial.*` - aktualizowac jesli dodaja sie nowe kroki.
**Akceptacja QA:** tutorial przechodzi bez "nie znaleziono elementu", spotlight trafia w realne elementy.
**Ryzyko:** niskie. **Effort:** S.

### A2. Kontrast lawki (SquadBench)
**Objaw:** po redesignie SquadBench (2026-06-13) mozliwy niski kontrast w dark mode.
**Zakres:** audyt kontrastu WGAG AA (4.5:1) dla tekstu na lawce w light/dark. Korekta tokenami, nie hardcoded kolorami.
**i18n:** brak nowych tekstow.
**Akceptacja QA:** axe/lighthouse kontrast >= 4.5:1 na wszystkich stanach lawki.
**Ryzyko:** niskie. **Effort:** S.

### A3. Limity planow - ujednolicenie
**Objaw:** limity Free/Pro/Team rozsiane po komponentach.
**Zakres:** po decyzji biznesowej (B2) ujednolicic limity w jednym zrodle (`lib/entitlements.ts`) i wyprowadzic do UI.
**i18n:** teksty `limits.*` juz istnieja - aktualizowac przy zmianach.
**Akceptacja QA:** wszystkie komponenty czytaja limity z jednego miejsca.
**Ryzyko:** srednie (wymaga decyzji biznesowej). **Effort:** M.

### A4. Usuniecie emoji w pomocy
**Objaw:** Help Sidebar / CheatSheet moga zawierac emoji.
**Zakres:** zastapic emoji ikonami SVG/lucide w HelpSidebar, CheatSheetOverlay, ShortcutsHint.
**i18n:** brak nowych tekstow.
**Akceptacja QA:** zero emoji w komponentach pomocy.
**Ryzyko:** niskie. **Effort:** S.

### A5. Tlumaczenie typow w inspectorze
**Objaw:** niektore nazwy typow elementow/sprzetu mog byc hardcoded EN.
**Zakres:** audyt `RightInspector` - wszystkie nazwy typow przez `inspector.*` i18n klucze.
**i18n:** dodac brakujace klucze w en/pl/es.
**Akceptacja QA:** zmiana jezyka zmienia wszystkie etykiety w inspectorze.
**Ryzyko:** niskie. **Effort:** S.

---

## Sekcja B - Landing / pricing

### B1. Prawdziwsze boisko w hero
**Objaw:** hero landinga moze uzywac placeholdera zamiast realnego boiska z produktu.
**Zakres:** wdrozyc realny render boiska (static PNG/SVG z produktu) w hero `/`.
**i18n:** alt text w 3 jezykach.
**Akceptacja QA:** hero pokazuje rozpoznawalne boisko TMC Studio.
**Ryzyko:** niskie. **Effort:** S-M.

### B2. Pricing - decyzja biznesowa + roczny toggle
**Objaw:** `/pricing` reklamuje plan roczny ($90/$290), ale `PricingModal` checkoutuje tylko miesieczny (hardcoded `STRIPE_PRICES.*.monthly` - patrz `LAUNCH_NEXT_STEPS.md` §2).
**Zakres:** ALBO dodac przełącznik roczny do modalu + przekazac cykl z `/pricing`, ALBO zdjac roczny toggle z publicznej strony do czasu wdrozenia.
**i18n:** teksty `pricing.*` juz istnieja.
**Akceptacja QA:** user wybierajacy "Yearly" placi rocznie (albo toggle nie istnieje).
**Ryzyko:** srednie (Stripe + decyzja biznesowa). **Effort:** M.

---

## Sekcja C - Brand

### C1. Wdrozenie brandu
**Objaw:** brand v1.1 istnieje (`brand/`) ale nie w pelni wdrozony na landing/public site.
**Zakres:** zastosowac kolory, typografie, logo z `brand/` na wszystkich stronach publicznych.
**i18n:** brak nowych tekstow.
**Akceptacja QA:** spojnosc z `brand/brand-guide.html`.
**Ryzyko:** niskie. **Effort:** M.

---

## Sekcja D - Tablica: blokady, grupy, skroty, PPM

### Szybka weryfikacja nowych uwag

| Uwaga | Status w kodzie | Wniosek |
|---|---|---|
| Blokowanie elementu, zeby sie nie przesuwal | Jest tylko blokada viewportu oraz `locked` dla grup. Nie ma realnej blokady pojedynczego elementu. | Trzeba dodac model danych i blokady w drag/nudge/delete/resize. |
| Grupowanie i odgrupowanie | Grupy juz istnieja w store i inspectorze. Grupowanie ma skrot `Cmd/Ctrl+G`. | Brakuje dobrego PPM, odgrupowania w UI/skrotach i egzekwowania locka grupy. |
| Dodawanie zawodnika Team 3 i Team 4 | Juz dziala: `Alt+P` dodaje Team 3, `Alt+Shift+P` dodaje Team 4. | Trzeba tylko uwidocznic w UI, PPM, cheatsheet i command palette. |
| Konflikty skrotow po LPM na elemencie | Potwierdzony konflikt komunikacyjny: PPM pokazuje `Cycle Shape = S`, ale realnie `S` wybiera strzalke strzalu, a ksztalt zawodnika to `Shift+S`. | Potrzebny kompleksowy audyt i jedno zrodlo prawdy dla skrotow. |
| Menu PPM | Menu istnieje, ale uzywa emoji jako ikon, ma niepelne akcje i niespojne skroty. | Trzeba przebudowac UX/UI i dane menu. |

---

## Sekcja D - Tablica: blokady, grupy, skroty, PPM

### D1. Blokowanie elementu, zeby nie dalo sie go przypadkiem przesunac

**Objaw:** trener moze przypadkowo przesunac zawodnika, strefe, tekst, sprzet lub strzalke podczas pracy na zatloczonej tablicy. Brakuje per-element locka.

**Przyczyna zweryfikowana:** `BoardElement` nie ma pola `locked` (`packages/core/src/types.ts:21-28` - `BoardElementBase` ma tylko `id, position, zIndex?`). W repo wystepuje `viewportLocked` dla zoom/pan oraz `Group.locked` (`apps/web/src/store/types.ts:21`), ale lock grupy jest obecnie stanem UI/store (`groupsSlice.ts:73` - tylko toggle stanu), nie pelnym mechanizmem blokujacym ruch. Drag zawodnika dalej opiera sie na `draggable={!multiDragActive}` w `packages/board/src/PlayerNode.tsx`, bez sprawdzania locka elementu. Multi-drag i nudge tez nie filtruje zablokowanych elementow.

**Wazne (migracja DB):** `BoardElement` jest serializowany do `document JSONB` w Supabase (`docs/DATA_MODEL.md:454`, `initial_schema.sql:57`). Dodanie opcjonalnego pola `locked?: boolean` do TypeScript **NIE wymaga migracji SQL** - JSONB przyjmie nowe pole. Pole MUSI byc opcjonalne (`?`) dla backward compat ze starymi dokumentami bez `locked`. Serialization (`packages/core/src/serialization.ts`) musi zachowywac `locked` przy zapisie/odczycie.

**Propozycja:**
1. Dodac `locked?: boolean` do `BoardElementBase` w `packages/core/src/types.ts` (dzięki temu wszystkie typy elementow dziedzicza).
2. Dodac akcje store w `elementsSlice`:
   - `toggleSelectedLock()` - toggle lock dla wszystkich zaznaczonych
   - `lockSelected()` / `unlockSelected()`
   - helper `isElementLocked(id)` - sprawdza `element.locked === true` LUB czy element nalezy do zablokowanej grupy
   - helper `isElementBlockedByLockedGroup(id)` - sprawdza `groups.some(g => g.locked && g.memberIds.includes(id))`
3. Zablokowac interakcje (filtruj przez `isElementLocked`):
   - drag pojedynczego elementu (`PlayerNode.tsx`, `BallNode.tsx`, itd. - `draggable={!multiDragActive && !isLocked}`)
   - multi-drag (ignoruj zablokowane przy przesuwaniu)
   - nudge strzalkami (ignoruj zablokowane)
   - resize, rotate
   - zmiane pozycji endpointow strzalek
   - delete: **od razu, bez potwierdzenia** (decyzja uzytkownika 2026-06-17 - zablokowany element usuwany normalnie jak kazdy inny)
4. **Undo/redo:** `toggleSelectedLock` MUSI wywolywac `pushHistory()` (wzor: `CommandRegistry.groupSelected`).
5. Dodac widoczny stan:
   - mala ikonka klodki (lucide `Lock`) przy zaznaczonym zablokowanym elemencie,
   - po najechaniu tooltip "Zablokowany",
   - w inspectorze toggle "Zablokuj element" (prymityw, nie hardcoded).
6. Dodac PPM:
   - "Zablokuj element" / "Odblokuj element",
   - dla multi-select: "Zablokuj zaznaczone" / "Odblokuj zaznaczone".

**i18n (obowiazkowe):** dodac klucze w `en.ts`/`pl.ts`/`es.ts`:
- `contextMenu.lockElement`, `contextMenu.unlockElement`, `contextMenu.lockSelected`, `contextMenu.unlockSelected`
- `inspector.locked`, `inspector.lockToggle`
- `tooltips.locked`

**Skrot proponowany:** `Shift+L` = toggle lock zaznaczenia. Weryfikacja: `L` jest gated `ANIMATION_ENABLED` (`useKeyboardShortcuts.ts:689`, domyslnie false w MVP), wiec `L` jest wolny w MVP, ale `Shift+L` jest bezpieczniejszy (nie zalezy od flagi). `Shift+L` nie koliduje z zadnym istniejacym skrotem.

**Akceptacja QA:**
1. Zablokowany zawodnik nie przesuwa sie dragiem, strzalkami ani multi-dragiem.
2. Odblokowanie przywraca normalne zachowanie.
3. Zablokowany element da sie zaznaczyc i edytowac w inspectorze tylko w bezpiecznym zakresie, bez zmiany pozycji.
4. Undo/redo dziala po lock/unlock (`pushHistory` wywolane).
5. Stare dokumenty (bez `locked`) laduja sie bez bledu (`locked` undefined = niezablokowany).
6. Element w zablokowanej grupie tez nie przesuwa sie.

**Testy:** jednostkowe `elementsSlice` - `toggleSelectedLock` zmienia `locked`, `pushHistory` wywolane, `isElementLocked` uwzglednia grupe. Manual: drag/nudge/delete na zablokowanym.

**Ryzyko:** srednie, bo dotyka wszystkich typow elementow. **Effort:** M-L.

---

### D2. Grupowanie i odgrupowanie elementow jako pelny workflow

**Objaw:** grupowanie istnieje technicznie, ale workflow nie jest kompletny: uzytkownik nie dostaje jasnego PPM, odgrupowania, stanu grupy na canvasie i skrotow w cheatsheet.

**Przyczyna zweryfikowana:**
- `groupsSlice.ts` ma `createGroup`, `ungroupSelection`, `selectGroup`, `toggleGroupLock`, `toggleGroupVisibility`, `renameGroup`.
- `useKeyboardShortcuts.ts:486-490` ma `Cmd/Ctrl+G` = `createGroup()`.
- `CommandRegistry.ts:131-148` ma `groupSelected` i `ungroupSelected` (oba z `pushHistory()`), ale `ungroupSelected` NIE ma globalnego skrotu w `useKeyboardShortcuts` (grep potwierdzil).
- `Group.locked` istnieje (`store/types.ts:21`), ale `toggleGroupLock` (`groupsSlice.ts:73`) tylko zmienia stan - nie blokuje drag/nudge. Trzeba dopiac egzekwowanie blokady (zalezy od D1: `isElementBlockedByLockedGroup`).

**Propozycja:**
1. PPM przy multi-select:
   - "Grupuj zaznaczone" (`Cmd/Ctrl+G`),
   - "Odgrupuj" (`Alt+G`),
   - "Zablokuj grupe" / "Odblokuj grupe",
   - "Ukryj grupe" / "Pokaz grupe".
2. Klikniecie elementu nalezacego do grupy:
   - pierwszy LPM zaznacza element,
   - `Cmd/Ctrl+LPM` dodaje do zaznaczenia,
   - PPM pokazuje sekcje "Grupa" z akcja zaznaczenia calej grupy.
3. Inspector:
   - pokazac liczbe elementow w grupie,
   - stan lock/visible,
   - rename inline zostaje.
4. Canvas:
   - subtelna ramka/outline wokol zaznaczonej grupy,
   - opcjonalnie label nazwy grupy tylko przy zaznaczeniu.
5. **Undo/redo:** group/ungroup/lock group/rename juz ida przez `pushHistory` (wzor z `CommandRegistry`). Zostawic.
6. **Egzekwowanie locka grupy:** uzyc `isElementBlockedByLockedGroup(id)` z D1 w drag/nudge - zablokowanie grupy blokuje wszystkie jej elementy.

**i18n (obowiazkowe):** dodac klucze w en/pl/es:
- `contextMenu.groupSelected`, `contextMenu.ungroup`, `contextMenu.lockGroup`, `contextMenu.unlockGroup`, `contextMenu.hideGroup`, `contextMenu.showGroup`, `contextMenu.selectGroup`, `contextMenu.groupSection`
- `inspector.groupMembers`, `inspector.groupLocked`, `inspector.groupVisible`

**Skroty proponowane:**
- `Cmd/Ctrl+G` = grupuj (istnieje, zostaje).
- `Alt+G` = odgrupuj. Weryfikacja: `Alt+G` nie jest uzyte w `useKeyboardShortcuts.ts` (case 'g' obsluguje tylko isCmd/shift/no-modifier). Bezpieczne. `Cmd/Ctrl+Shift+G` jest zajete przez export GIF (`useKeyboardShortcuts.ts:484`).
- `Shift+L` = lock/unlock zaznaczenia (z D1); jesli zaznaczenie pokrywa sie z cala grupa, toggle lock grupy.

**Akceptacja QA:**
1. Zaznaczam 2+ elementy -> `Cmd/Ctrl+G` tworzy grupe.
2. Zaznaczam element w grupie -> `Alt+G` odgrupowuje.
3. Lock grupy blokuje przesuwanie wszystkich jej elementow (drag + nudge).
4. Ukryta grupa nie bierze udzialu w eksporcie i nie przeszkadza w klikaniu.

**Testy:** jednostkowe `groupsSlice` - createGroup/ungroupSelection/toggleGroupLock. Manual: workflow grupa->lock->drag->odblokuj.

**Ryzyko:** srednie. **Effort:** M.

---

### D3. Dodawanie zawodnikow Team 3 i Team 4 - ujawnic i ujednolicic workflow

**Objaw:** funkcja juz istnieje, ale nie jest wystarczajaco widoczna. Uzytkownik nie wie, ze moze szybko dodac Team 3/4 z klawiatury.

**Przyczyna zweryfikowana:** w `useKeyboardShortcuts.ts:229-254`:
- `P` dodaje Team 1 (home),
- `Shift+P` dodaje Team 2 (away),
- `Alt+P` dodaje Team 3,
- `Alt+Shift+P` dodaje Team 4.

**Propozycja:**
1. Zostawic obecne skroty (dzialaja, sa spójne z modyfikatorami):
   - `P` = Team 1, `Shift+P` = Team 2, `Alt+P` = Team 3, `Alt+Shift+P` = Team 4.
2. Dodac te skroty do:
   - cheatsheet (`CheatSheetOverlay.tsx`),
   - command palette (`createCommandActions.ts`),
   - menu PPM na pustym boisku (submenu "Dodaj zawodnika"),
   - tooltipow w TopBar.
3. PPM na pustym boisku - submenu/sekcja "Dodaj zawodnika":
   - Team 1 (`P`), Team 2 (`Shift+P`), Team 3 (`Alt+P`), Team 4 (`Alt+Shift+P`).
4. Ujednolicic nazwy: Team 1/2/3/4 (zgodne z `teamsPanel.team1-4` w i18n), bez mieszania Home/Away w tym samym widoku.

**i18n (obowiazkowe):** dodac klucze w en/pl/es:
- `contextMenu.addPlayerTeam1` ... `contextMenu.addPlayerTeam4`
- `cheatsheet.players.team3`, `cheatsheet.players.team4`
- `palette.addPlayerTeam3`, `palette.addPlayerTeam4`

**Akceptacja QA:**
1. `Alt+P` dodaje zawodnika Team 3 na cursor/centrum.
2. `Alt+Shift+P` dodaje zawodnika Team 4.
3. PPM pokazuje submenu z 4 druzynami i skrotami zgodnymi z realnym handlerem.

**Testy:** manual - 4 skroty + PPM submenu. Jednostkowy: `addPlayerAtCursor('team3')`/`('team4')` tworzy element z wlasciwym team.

**Ryzyko:** niskie. **Effort:** S.

---

### D4. Kompleksowy audyt konfliktow skrotow i workflow po LPM

**Objaw:** uzytkownik widzi w menu lub cheatsheet skrot, ale po nacisnieciu dzieje sie cos innego. Przyklad zweryfikowany: PPM pokazuje zawodnikowi "Cycle Shape - S", a realny `S` wybiera narzedzie strzalki strzalu. Zmiana ksztaltu zawodnika dziala jako `Shift+S`.

**Przyczyna zweryfikowana:**
- `apps/web/src/utils/canvasContextMenu.ts` hardcoduje skroty w menu (np. `cycleShape` shortcut: 'S' - BLEDNE).
- `apps/web/src/hooks/useKeyboardShortcuts.ts` ma realna logike (`S` = shoot arrow, `Shift+S` = cycle player shape - linia 545-560).
- `apps/web/src/commands/commandPalette/createCommandActions.ts` ma kolejna liste.
- `packages/ui/src/CheatSheetOverlay.tsx` buduje widok z jeszcze innego zestawu danych.
- `README.md:76` pokazuje "Play/Pause | Space" - mylace, bo kod (`useKeyboardShortcuts.ts:680-685`) mowi "Space is pan-only now".

**Najwazniejsze konflikty do naprawy (zweryfikowane w kodzie):**
1. `S`:
   - realnie (`useKeyboardShortcuts.ts:555`): shoot arrow,
   - menu PPM (`canvasContextMenu.ts:189`): cycle player shape (BLEDNE),
   - command palette: "toggle snap = S" (grep: brak realnego handlera dla toggle snap w useKeyboardShortcuts - martwy wpis).
   - Rekomendacja: `S` zostaje shoot arrow, player shape = `Shift+S` (juz dziala w kodzie), **usunac "snap = S" z command palette** (brak handlera).
2. `Space`:
   - command palette/README pokazuje play/pause,
   - realny kod (`useKeyboardShortcuts.ts:680`): "Space is pan-only now" (PR-FIX-4 celowo zmienil).
   - Rekomendacja: **Space zostaje pan-only** (PR-FIX-4 celowo to zmienil). Play/pause: w MVP (ANIMATION_ENABLED=false) **bez skrotu** - tylko przycisk UI. Usunac "Play/Pause Space" z README i cheatsheet. Gdy animacja bedzie wlaczona, rozważyć `K` (UWAGA: `K` = cone family - konflikt) albo `Shift+Space`.
3. `Cmd/Ctrl+Shift+G`:
   - export GIF (`useKeyboardShortcuts.ts:484`),
   - naturalny kandydat na ungroup, ale zajety.
   - Rekomendacja: ungroup = `Alt+G` (z D2).
4. Strzalki:
   - bez zaznaczenia moga zmieniac step,
   - z zaznaczeniem przesuwaja element,
   - przy strzalce `ArrowRight` toggluje numerowanie.
   - Rekomendacja: opisac kontekstowo w cheatsheet i PPM.

**Propozycja techniczna:**
1. Utworzyc jedno zrodlo prawdy: `apps/web/src/shortcuts/shortcutMap.ts` (mapa `shortcutId -> { keys, context, action, i18nLabel }`).
2. Z tego mapowania generowac:
   - `useKeyboardShortcuts` (handler czyta z mapy),
   - command palette,
   - cheatsheet,
   - PPM shortcut labels.
3. Dodac test jednostkowy (`shortcuts/shortcutMap.test.ts`):
   - wykrywa duplikaty bez jawnego `context`,
   - wykrywa menu item, ktory pokazuje skrot nieobslugiwany przez realny handler.
4. Dodac tryb "shortcut audit" w dev: loguje konflikt przy starcie aplikacji (`if (import.meta.env.DEV)`).

**i18n (obowiazkowe):** kazdy skrot w mapie musi miec `i18nLabel` w en/pl/es pod `shortcuts.*`.

**Akceptacja QA:**
1. Kazdy skrot pokazany w PPM dziala dokladnie tak samo z klawiatury.
2. CheatSheet i command palette nie pokazuja sprzecznych opisow.
3. Brak konfliktow globalnych poza swiadomie opisanymi konfliktami kontekstowymi.
4. Test `shortcutMap.test.ts` przechodzi (zero duplikatow, zero martwych skrotow).
5. README.md i cheatsheet nie pokazuja "Play/Pause Space".

**Testy:** jednostkowy `shortcutMap.test.ts` (duplikaty + martwe skroty). Manual: audyt wszystkich skrotow.

**Ryzyko:** srednie. **Effort:** M-L, ale to porzadkuje caly produkt.

---

### D5. PPM menu kontekstowe - lepszy UX/UI, bez emoji, z ikonami i sekcjami

**Objaw:** menu PPM wyglada nieprofesjonalnie: emoji jako ikonki, plaska lista, niepelne akcje, czasem mylace skroty.

**Przyczyna zweryfikowana:**
- `canvasContextMenu.ts` uzywa emoji w `icon` (`🎽⚽➡️🟦🔄☑️📄📋🔍🗑️⬆️⬇️↗️↘️🔢🎨✏️◼️`) i w headerach (`🎽 Player`, `⚽ Ball`).
- `ContextMenu.tsx` renderuje prosta liste `button` z tekstem, emoji i skrotem.
- Brakuje grupowania akcji wedlug priorytetu i brakuje submenu/sekcji dla wielu druzyn.

**Propozycja UX/UI:**
1. Zastapic emoji ikonami lucide (juz uzywane w projekcie) albo lokalnymi ikonami SVG:
   - Copy, Duplicate, Trash, Lock, Unlock, Group, Ungroup, BringToFront, SendToBack, Palette, UserPlus, CircleDot, ArrowRight, Square.
2. Zmienic strukture menu:
   - naglowek elementu: typ, numer/nazwa, druzyna (bez emoji),
   - sekcja glowna: najczestsze akcje,
   - sekcja element-specific,
   - sekcja warstw,
   - sekcja destructive na dole (oddzielona dividerem, `variant: 'danger'`).
3. Dla pustego boiska:
   - "Wklej",
   - "Dodaj zawodnika" (submenu Team 1-4 z D3),
   - "Dodaj pilke", "Dodaj strzalke", "Dodaj strefe",
   - "Auto-numbering".
4. Dla multi-select:
   - liczba elementow,
   - group/ungroup, lock/unlock, duplicate/copy/delete.
5. Stan disabled:
   - jesli akcja nie moze zadzialac, pokazac disabled z tooltipem, zamiast ukrywac albo robic pusty click.
6. Pozycjonowanie:
   - juz jest clamp do viewportu, ale dodac max-height i scroll dla niskich ekranow.
7. Dostepnosc (WGAG):
   - role `menu`, `menuitem`,
   - nawigacja strzalkami (gora/dol),
   - Enter aktywuje, Escape zamyka,
   - aria-labels dla ikon.

**i18n (obowiazkowe):** wszystkie etykiety przez `contextMenu.*` klucze (juz czesciowo istnieja - uzupelnic). Zero hardcoded stringow.

**Uwaga (zaleznosc z D4):** W S1 skroty w PPM sa poprawione recznie (hardcoded poprawne wartosci). W S3 D4 zastepuje je mapowaniem z `shortcutMap.ts`. To OK - S1 daje szybka naprawe, S3 automatyzuje.

**Akceptacja QA:**
1. Menu nie ma emoji (grep `🎽|⚽|➡️|🟦|🔄|☑️|📄|📋|🔍|🗑️|⬆️|⬇️|↗️|↘️|🔢|🎨|✏️|◼️` w `canvasContextMenu.ts` = 0).
2. Ikony sa spojne z reszta UI (lucide/SVG).
3. Menu na malym ekranie nie wychodzi poza viewport (max-height + scroll).
4. Skroty w menu sa zgodne z realnym handlerem.
5. PPM na pustym boisku, elemencie i multi-select ma inne, sensowne akcje.
6. Nawigacja klawiatura dziala (strzalki, Enter, Escape).

**Testy:** manual - PPM na 3 kontekstach (puste, element, multi-select) + nawigacja klawiatura. Jednostkowy: `getCanvasContextMenuItems` zwraca poprawne ikony (nie emoji).

**Ryzyko:** niskie-srednie. **Effort:** M.

---

### D6. Workflow LPM na elemencie - doprecyzowac model interakcji

**Objaw:** LPM, multi-select, drag, quick edit i kontekstowe skroty moga byc dla uzytkownika niejasne, zwlaszcza gdy element jest w grupie albo jest zablokowany.

**Propozycja docelowego modelu:**
1. LPM na elemencie:
   - zaznacza element,
   - nie zmienia narzedzia,
   - nie odpala akcji typu cycle shape.
2. Podwojny LPM:
   - zawodnik: edycja numeru albo labelu wedlug obecnej decyzji produktu,
   - tekst: edycja tekstu,
   - strzalka: edycja numeru strzalki.
3. Drag:
   - przesuwa tylko niezablokowane elementy (filtruj przez `isElementLocked` z D1),
   - przy multi-select przesuwa tylko niezablokowana czesc zaznaczenia,
   - jesli wszystko zablokowane, pokazuje toast "Zaznaczenie jest zablokowane" (`tooltips.selectionLocked`).
4. `Cmd/Ctrl+LPM`:
   - dodaje/usuwa z zaznaczenia.
5. PPM:
   - zaznacza klikniety element i otwiera menu,
   - na multi-select nie niszczy zaznaczenia, jesli kliknieto element juz zaznaczony.

**i18n (obowiazkowe):** `tooltips.selectionLocked` w en/pl/es.

**Akceptacja QA:**
1. Nie ma sytuacji, w ktorej klikniecie w element zmienia narzedzie bez intencji.
2. Zablokowany element nadal mozna wybrac i odblokowac.
3. Multi-select + PPM zachowuje zaznaczenie.
4. Drag zablokowanego zaznaczenia pokazuje toast (nie cicha porazka).

**Testy:** manual - scenariusze LPM/drag/PPM na zablokowanych i grupach. Jednostkowy: helper `isElementLocked` w 3 przypadkach (element locked, grupa locked, niezablokowany).

**Ryzyko:** srednie. **Effort:** M.

---

## Zaktualizowana kolejnosc wdrozenia

> Skille per sprint (MasterAutopilot SkillSelectionPass):
> - S1: `ui-delivery`, `design-system-review`
> - S2: `ui-delivery`, `architecture-review`, `regression-testing`
> - S3: `architecture-review`, `regression-testing`
> - S4: `ui-delivery`, `design-system-review`, `release-readiness`

### Sprint 1 - szybkie i widoczne naprawy (quick wins + PPM + skroty)

**Zakres:**
1. A4 - usuniecie emoji w pomocy (HelpSidebar, CheatSheetOverlay, ShortcutsHint).
2. A5 - tlumaczenie typow w inspectorze (audyt RightInspector, brakujace klucze i18n).
3. D3 - ujawnienie Team 3/4 w cheatsheet, PPM submenu, command palette, tooltipy.
4. D4 (czesc) - naprawa oczywistych blednych etykiet skrotow: `Cycle Shape = Shift+S` (nie `S`), usuniecie "snap = S" z command palette (martwy wpis), usuniecie "Play/Pause Space" z README/cheatsheet.
5. D5 - pierwsza wersja PPM bez emoji, z ikonami lucide, sekcjami, submenu Team 1-4, a11y (role menu, nawigacja klawiatura).

**Poza zakresem S1:** jedno zrodlo prawdy skrotow (to S3), lock elementu (S2), pelne group workflow (S2).

**i18n:** wszystkie nowe etykiety PPM/cheatsheet/palette w en/pl/es.
**Testy:** manual PPM 3 konteksty + jednostkowy `getCanvasContextMenuItems` (brak emoji).

### Sprint 2 - workflow tablicy (lock + grupy + LPM/PPM)

**Zakres:**
1. D1 - lock pojedynczego elementu (`locked?: boolean` na `BoardElementBase`, store actions, egzekwowanie w drag/nudge/delete, ikona klodki, inspector toggle, `Shift+L`).
2. D2 - pelne group/ungroup + `Alt+G` skrot + PPM sekcja grupa + egzekwowanie locka grupy (zalezy od D1 `isElementBlockedByLockedGroup`).
3. D6 - dopracowanie LPM/PPM przy locku i grupach (toast przy drag zablokowanego, multi-select PPM zachowanie).
4. A1 - kotwice tutoriala (`data-tour`) po zmianach UI z S1/S2.

**Zaleznosci:** D2 egzekwowanie locka grupy wymaga D1 `isElementBlockedByLockedGroup`. A1 na koncu S2 (po zmianach UI).
**i18n:** `contextMenu.lock*`, `contextMenu.group*`, `inspector.lock*`, `tooltips.locked`, `tooltips.selectionLocked`.
**Testy:** jednostkowe `elementsSlice` (toggleSelectedLock + pushHistory), `groupsSlice`, `isElementLocked`/`isElementBlockedByLockedGroup`. Manual: drag/nudge/delete na zablokowanym + grupa.

### Sprint 3 - porzadkowanie systemowe (jedno zrodlo prawdy skrotow)

**Zakres:**
1. D4 (pelne) - utworzenie `apps/web/src/shortcuts/shortcutMap.ts` jako jedno zrodlo prawdy.
2. Przepiecie `useKeyboardShortcuts`, command palette, cheatsheet, PPM shortcut labels na czytanie z `shortcutMap`.
3. Test `shortcutMap.test.ts` - wykrywanie duplikatow i martwych skrotow.
4. Tryb "shortcut audit" w dev (`import.meta.env.DEV`).
5. A2 - kontrast lawki (SquadBench) WGAG AA, jesli dalej widoczny po zmianach.

**Zaleznosci:** S1 poprawil skroty recznie, S3 je automatyzuje. Nie cofac recznych poprawek S1 - zastapic mapowaniem.
**i18n:** kazdy skrot w mapie musi miec `i18nLabel` w en/pl/es pod `shortcuts.*`.
**Testy:** jednostkowy `shortcutMap.test.ts`. Manual: audyt wszystkich skrotow po przepieciu.

### Sprint 4 - landing, pricing, brand

**Zakres:**
1. C1 - wdrozenie brandu (kolory, typografia, logo z `brand/` na stronach publicznych).
2. B1 - prawdziwsze boisko w hero `/` (static render z produktu).
3. A3/B2 - limity planow i pricing PO decyzji biznesowej (ujednolicenie w `lib/entitlements.ts` + roczny toggle w PricingModal ALBO zdjecie rocznego z `/pricing`).

**Zaleznosci:** A3/B2 wymaga decyzji biznesowej (pytanie uzytkownika). C1 i B1 mozna zaczac niezaleznie.
**i18n:** alt text hero w 3 jezykach, `pricing.*` aktualizacja.
**Testy:** manual landing + pricing. `release-readiness` skill na koncu S4.

---

## Decyzje do akceptacji (ZATWIERDZONE 2026-06-17)

1. ✅ `Shift+L` = skrot lock/unlock zaznaczenia. (`L` gated animacja, wolny w MVP, ale `Shift+L` bezpieczniejszy.)
2. ✅ `Alt+G` = skrot odgrupowania. (`Alt+G` wolne, `Cmd/Ctrl+Shift+G` zajete przez export GIF.)
3. ✅ Team 3/4 zostaja na `Alt+P` i `Alt+Shift+P`. (Juz dzialaja w kodzie.)
4. ✅ `S` = shoot arrow, player shape oficjalnie = `Shift+S`. (Juz dziala w kodzie - poprawic etykiety PPM/cheatsheet.)
5. ✅ PPM bez emoji, na ikonach lucide. (Zgodne z design systemem.)
6. ✅ Zablokowany element usuwany **od razu, bez potwierdzenia** (jak kazdy inny element).
7. ✅ Space=pan-only, play/pause **bez skrotu w MVP** (ANIMATION_ENABLED=false). Usunac "Play/Pause Space" z README/cheatsheet. (Decyzja UX: PR-FIX-4 celowo zmienil Space na pan-only - top UX, brak konfliktu z animacja.)
8. ✅ "snap = S" usuwamy z command palette w S1 (martwy wpis, brak handlera). `S` tylko jako strzałka.

---

## Po akceptacji

Uruchomic:
```text
@MasterAutopilot LOOP 4 sprinty 3proby na sprint:
[ten plan]
```

Skille per sprint: S1=ui-delivery+design-system-review, S2=ui-delivery+architecture-review+regression-testing, S3=architecture-review+regression-testing, S4=ui-delivery+design-system-review+release-readiness.

Nie dotykac produkcji, migracji DB ani `.env.production`. `locked` nie wymaga migracji SQL (JSONB).

