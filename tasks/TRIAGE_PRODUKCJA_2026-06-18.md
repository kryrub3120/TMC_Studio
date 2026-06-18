# Triage testów produkcyjnych + plan integracyjny — 2026-06-18 (18:03)

**Źródło:** `TESTY - PRODUKCJA 18.06 -GODZ. 18.03.pdf` (15 zgłoszeń: PROBLEM 0–14, testy bezpośrednio na stronie).
**Weryfikacja:** względem kodu w working tree (`develop`, wersja `package.json` = **0.6.1**).
**Integracja z:** `tasks/SPRINT_EDITOR_PROPERTIES_2026-06-18.md`, `docs/CURRENT_SPRINT_PLAN.md`,
`tasks/COMMIT_PLAN_AND_BACKLOG_2026-06-18.md`, `docs/HELP_SYSTEM_OVERHAUL_PLAN.md`, `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md`.

---

## 🔴 USTALENIE NADRZĘDNE — produkcja jest za kodem (deploy gap)

Najważniejszy wynik weryfikacji: **duża część zgłoszeń to nie są nowe błędy, tylko skutek tego, że produkcja działa na starszym buildzie niż kod.**

Dowody:

1. **Wersja.** Screenshot „O aplikacji" pokazuje **0.5.0**, a `package.json` to **0.6.1**.
   Dodatkowo string wersji był zahardkodowany w tłumaczeniach
   (`packages/ui/src/locales/{pl,en,es}.ts → aboutVersion: 'Wersja 0.5.0 — …'`). W working tree
   poprawione: `SettingsModal` dostaje `appVersion` z `package.json` przez `AppShell`/`ModalOrchestrator`,
   a `aboutVersion` używa parametru `{{version}}`.
2. **CHANGELOG.** Cała praca z edytora (groty, grubość, obrys stref, **domyślne style użytkownika**,
   „Ustaw jako domyślne") siedzi w sekcji **`[Unreleased]`**. Jest tam nawet wpis Fixed:
   *„PR-4/PR-5: opcje widoczne w inspektorze, ale bez efektu (2026-06-18)"* — czyli **dokładnie**
   to, co zgłaszasz w PROBLEM 1 i 3, zostało już naprawione w kodzie, ale nie wydane.
3. **Kod ma już te funkcje.** `elementsSlice.addArrowAtCursor/addZoneAtCursor` aplikują
   `arrowDefaults`/`zoneDefaults` przy tworzeniu; inspektor ma sekcje strzałki/strefy; defaulty są
   persystowane w `useUIStore`.

**Wniosek:** PRIORYTET 0 to **wydać release i potwierdzić deploy**, a potem **przetestować ponownie
na świeżej produkcji**. Bez tego część poniższych „błędów" zniknie sama, a część zostanie — i dopiero
te realne pójdą do naprawy.

---

## Legenda statusów

| Status | Znaczenie |
|---|---|
| ✅ FIXED-UNDEPLOYED | naprawione w kodzie, czeka tylko na release/deploy |
| ✅ VERIFIED-CONFIG | zweryfikowane w konfiguracji/CLI/runtime bez zmiany kodu |
| 🟡 PARTIAL | częściowo jest, brakuje fragmentu |
| 🔴 MISSING | funkcji/poprawki nie ma — trzeba dopisać |
| ❓ VERIFY | wymaga potwierdzenia na żywej prod / w runtime (nie da się rozstrzygnąć z samego kodu) |

---

## Tabela triage

| # | Zgłoszenie (skrót) | Status | Główna przyczyna / lokalizacja |
|---|---|---|---|
| 0 | Logowanie Google auth zawodne; czy baza prod podpięta | ✅ VERIFIED-CONFIG | Netlify production `VITE_SUPABASE_URL` i `SUPABASE_URL` wskazują `pgacjczecyfnwsaadyvj`; Supabase CLI linked project = `pgacjczecyfnwsaadyvj`; OAuth authorize dla `https://tmcstudio.app/app` zwraca `302` do `accounts.google.com`. |
| 1 | Ustawienia strefy nie zapisują się jako domyślne | ✅ FIXED-UNDEPLOYED | `elementsSlice.addZoneAtCursor` aplikuje `zoneDefaults`; „Ustaw jako domyślne" wpięte. Deploy gap. |
| 2a | Drużyna nazwana „Śląsk Wrocław II" pokazuje „Gospodarze" | ✅ FIXED-UNDEPLOYED | `SquadBench` i edytor składu używają teraz `teamSettings.name`, nie stałych etykiet roli. |
| 2b | Zielony kolor drużyny nie aplikuje się + brak auto-bramkarza | ✅ FIXED-UNDEPLOYED | `SquadBench` używa `teamSettings.primaryColor`; zawodnik #1 automatycznie dostaje GK, a checkbox GK wymusza bramkarza dla dowolnego numeru. |
| 3 | Po zapisie do domyślnych następna strzałka inna | ✅ FIXED-UNDEPLOYED | `addArrowAtCursor` aplikuje `strokeWidth`, groty i teraz też `ArrowDefaults.color` per typ strzałki. |
| 4 | Brak w inspektorze zmiany koloru strzałek różnego typu | ✅ FIXED-UNDEPLOYED | Dodano kontrolkę koloru w inspektorze strzałki, `onUpdateElement.color`, `ArrowDefaults.color` i kolor w preferencjach. Wymaga deployu. |
| 5 | Brzydkie tło z „znakami wodnymi" przy „Zacznij planszę" | ✅ FIXED-UNDEPLOYED | Usunięto animowany podgląd formacji z numerami z `EmptyStateOverlay`; pusty stan pokazuje tylko kartę akcji. |
| 6 | Nieprzetłumaczone klucze językowe (`pitchPanel.boardFull` itd.) | ✅ FIXED-UNDEPLOYED | Dopisano `pitchPanel.boardFull/boardHalf2d/boardPenalty2d` w pl/en/es. Guard i18n w CI nadal zostaje jako osobne zabezpieczenie. |
| 7 | Skróty w ustawieniach niepogrupowane; brak edycji skrótów (Pro/Club Pro) + reset | ✅ FIXED-UNDEPLOYED | Skróty są pogrupowane, Pro/Club Pro może nagrać własne kombinacje dla akcji z sekcji ustawień, a reset przywraca układ fabryczny. |
| 8 | „O aplikacji": wersja ma się aktualizować automatycznie + CTA social + kontakt + prawne | ✅ FIXED-UNDEPLOYED | Wersja bierze `appVersion`; dodano social CTA, feedback/bug CTA, kontakt Krystian Rubajczyk + X, `by Sportpredictor` i linki prawne. |
| 9 | Brak sekcji FAQ w ustawieniach | ✅ FIXED-UNDEPLOYED | Dodano zakładkę FAQ w modalu Ustawień z wyszukiwarką, kategoriami zależnymi od planu i CTA do pricing/billing/club/data. |
| 10 | Brak zgłaszania błędów / feedbacku | ✅ FIXED-UNDEPLOYED | Dodano CTA `Zgłoś błąd` i `Wyślij feedback` w Ustawieniach → O aplikacji jako działające linki mailto. |
| 11 | Sekcja dodawania zawodnika: czarny tekst w dark mode + placeholder „Imię" → „Zawodnik" | ✅ FIXED-UNDEPLOYED | Placeholder zmieniony na `Zawodnik` / `Player` / `Jugador`; input używa tokenów `bg-surface text-text placeholder-muted`, typecheck czysty. |
| 12a | Przy dodawaniu zawodnika brak ptaszka „GK" + osobny kolor GK | ✅ FIXED-UNDEPLOYED | Dodano checkbox GK w szybkim dodawaniu i w Ustawieniach → Skład; drag/drop tworzy `PlayerElement.isGoalkeeper`, który renderuje `goalkeeperColor`. |
| 12b | `V` = od razu wizja dla zaznaczonych; `Shift+V` = rączki body-orientation; per-zawodnik | ✅ FIXED-UNDEPLOYED | `V` włącza wizję dla zaznaczonych zawodników i automatycznie aktywuje globalną wizję; `Shift+V` przełącza rączki/orientację. |
| 13 | Rotowanie zawodnika z wizją mało czułe | ✅ FIXED-UNDEPLOYED | Podbito czułość drag-rotacji wizji (`ORIENTATION_DRAG_SENSITIVITY = 1.35`) przy zachowaniu snapu 1°/15°. |
| 14 | Brak ładnego znaku wodnego „TMC Studio" (free/niezalogowany) | ✅ FIXED-UNDEPLOYED | Dodano subtelny overlay `TMC STUDIO` na canvasie dla free/guest; ukryty w trybie print. |

**Podsumowanie po aktualizacji planu i hotfixach w kodzie:** 16× ✅ FIXED-UNDEPLOYED (1, 2a, 2b, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12a, 12b, 13, 14), 1× ✅ VERIFIED-CONFIG (0), 0× 🟡 PARTIAL, 0× 🔴 MISSING, 0× ❓ VERIFY.

---

## Co testować po najbliższym deployu

Te punkty są **gotowe w kodzie** i po deployu powinny być testowane jako pierwsze:

| Problem | Status testu | Scenariusz testowy |
|---|---|---|
| 1 | DO TESTU PO DEPLOYU | Ustaw styl strefy → „Ustaw jako domyślne" → dodaj nową strefę. Nowa strefa ma przejąć styl. |
| 2a | DO TESTU PO DEPLOYU | Ustaw nazwę drużyny np. „Śląsk Wrocław II" → sprawdź pasek składu i Ustawienia → Skład. Ma pokazywać custom nazwę, nie „Gospodarze". |
| 2b | DO TESTU PO DEPLOYU | Ustaw zielony kolor drużyny → sprawdź kropkę drużyny, zawodnika w ławce i zawodnika przeciągniętego na boisko. Wszystko ma używać custom koloru. |
| 3 | DO TESTU PO DEPLOYU | Ustaw kolor/grubość/groty strzałki → „Ustaw jako domyślne" → dodaj kolejną strzałkę tego typu. Ma przejąć pełny styl. |
| 4 | DO TESTU PO DEPLOYU | Zaznacz strzałkę → Inspektor → Linia → zmień kolor. Kolor ma zmienić się natychmiast i zapisać w dokumencie. |
| 5 | DO TESTU PO DEPLOYU | Otwórz pustą planszę / „Zacznij planszę". W tle nie może być animowanych numerów zawodników ani brudnych watermarków. |
| 6 | DO TESTU PO DEPLOYU | Otwórz wybór planszy/boiska. Nie może być surowych kluczy `pitchPanel.boardFull`, `pitchPanel.boardHalf2d`, `pitchPanel.boardPenalty2d`. |
| 7 | DO TESTU PO DEPLOYU | Ustawienia → Skróty. Skróty mają być pogrupowane; Pro/Club Pro ma móc kliknąć skrót, nagrać nową kombinację, użyć jej w edytorze i zresetować do fabrycznych. |
| 8 | DO TESTU PO DEPLOYU | Ustawienia → O aplikacji. Wersja ma pokazywać aktualne `package.json`/build, a sekcja ma mieć CTA Instagram/X/TikTok/LinkedIn, bug/feedback, kontakt Krystian Rubajczyk + X i linki prawne. |
| 9 | DO TESTU PO DEPLOYU | Ustawienia → FAQ. Ma być widoczna zakładka FAQ, działać wyszukiwarka i rozwijanie pytań; CTA mają prowadzić do właściwych sekcji/pricingu. |
| 10 | DO TESTU PO DEPLOYU | Ustawienia → O aplikacji → kliknij `Zgłoś błąd` i `Wyślij feedback`. Powinien otworzyć się klient mailowy z właściwym tematem. |
| 11 | DO TESTU PO DEPLOYU | Ławka składu → szybkie dodawanie. Placeholder ma brzmieć „Zawodnik"; tekst w dark mode ma być czytelny. |
| 12a | DO TESTU PO DEPLOYU | Dodaj zawodnika #1 albo zaznacz checkbox GK → przeciągnij na boisko. Zawodnik ma używać koloru bramkarza drużyny. |
| 12b | DO TESTU PO DEPLOYU | Zaznacz jednego/kilku zawodników → naciśnij `V`. Tylko zaznaczeni mają dostać wizję; `Shift+V` ma przełączać rączki/orientację, nie wizję wszystkim. |
| 13 | DO TESTU PO DEPLOYU | Zaznacz zawodnika z wizją → złap stożek wizji i obróć. Reakcja ma być wyraźnie szybsza; `Shift` podczas dragowania ma nadal snapować do 15°. |
| 14 | DO TESTU PO DEPLOYU | Jako free/guest otwórz edytor. W prawym dolnym rogu canvasu ma być subtelny napis `TMC STUDIO`; w trybie wydruku nie ma się pojawiać. |

Nie testować jeszcze jako „naprawione":

| Problem | Dlaczego |
|---|---|
| — | Brak. Wszystkie problemy 0–14 są zweryfikowane konfiguracyjnie albo gotowe do retestu po deployu. |

---

## Instrukcja przeklikania po deployu

Testuj w tej kolejności. Jeśli coś padnie wcześniej, zapisz numer problemu i screenshot — nie trzeba wtedy blokować pozostałych sekcji, o ile aplikacja dalej działa.

### A. Smoke / wersja / warningi

1. Otwórz produkcję w trybie incognito jako niezalogowany użytkownik.
2. Wejdź do edytora i sprawdź, czy aplikacja ładuje się bez błędu.
3. Otwórz Ustawienia → O aplikacji.
4. Potwierdź: wersja nie jest stałym `0.5.0`, tylko aktualną wersją builda (`0.6.1` dla tego hotfixa, jeśli nie bumpujesz release).
5. Potwierdź: w sekcji są linki Instagram, X, TikTok, LinkedIn, `Zgłoś błąd`, `Wyślij feedback`, kontakt Krystian Rubajczyk + X oraz linki prawne.
6. Kliknij `Zgłoś błąd` i `Wyślij feedback`; oba mają otworzyć klienta mailowego z ustawionym tematem.

### B. Pusty stan i watermark

1. Na nowej/pustej planszy sprawdź ekran „Zacznij planszę”.
2. Potwierdź: w tle nie ma animowanych numerów zawodników ani brudnego znaku wodnego.
3. Jako free/guest sprawdź prawy dolny róg canvasu.
4. Potwierdź: jest subtelny napis `TMC STUDIO`.
5. Włącz tryb wydruku i potwierdź, że watermark znika.

### C. Drużyny, skład i GK

1. Ustawienia → Drużyny: nazwij gospodarzy np. `Śląsk Wrocław II`.
2. Ustaw im zielony kolor podstawowy i osobny kolor GK.
3. Otwórz Ustawienia → Skład oraz ławkę składu pod boiskiem.
4. Potwierdź: etykiety pokazują `Śląsk Wrocław II`, nie `Gospodarze`.
5. W szybkim dodawaniu zawodnika sprawdź placeholder: ma być `Zawodnik`, a tekst ma być czytelny w dark mode.
6. Dodaj zawodnika z numerem `1`; przeciągnij go na boisko.
7. Potwierdź: zawodnik automatycznie używa koloru GK.
8. Dodaj zawodnika z innym numerem i zaznacz checkbox `GK`; przeciągnij go na boisko.
9. Potwierdź: też używa koloru GK.

### D. Strzałki i strefy

1. Dodaj strefę, zmień jej styl w inspektorze i kliknij `Ustaw jako domyślne`.
2. Dodaj kolejną strefę.
3. Potwierdź: nowa strefa przejęła domyślny styl.
4. Dodaj strzałkę, zmień kolor, grubość i groty w inspektorze.
5. Kliknij `Ustaw jako domyślne`.
6. Dodaj kolejną strzałkę tego samego typu.
7. Potwierdź: nowa strzałka przejęła kolor, grubość i groty.
8. Zaznacz istniejącą strzałkę i zmień kolor w Inspektorze → Linia.
9. Potwierdź: kolor zmienia się natychmiast i zapisuje w dokumencie.

### E. Wizja, orientacja i rotacja

1. Dodaj minimum dwóch zawodników na boisko.
2. Zaznacz jednego zawodnika i naciśnij `V`.
3. Potwierdź: wizję dostaje tylko zaznaczony zawodnik.
4. Zaznacz dwóch zawodników i naciśnij `V`.
5. Potwierdź: wizję dostają tylko zaznaczeni.
6. Naciśnij `Shift+V`.
7. Potwierdź: przełączają się rączki/orientacja, a nie wizja wszystkim zawodnikom.
8. Zaznacz zawodnika z wizją, złap stożek wizji i obróć.
9. Potwierdź: reakcja jest wyraźnie czulsza niż wcześniej.
10. Podczas obracania przytrzymaj `Shift`.
11. Potwierdź: rotacja snapuje do większych kroków (15°).

### F. Ustawienia: FAQ, skróty, plansze

1. Ustawienia → FAQ.
2. Potwierdź: jest zakładka FAQ, działa wyszukiwarka i rozwijanie pytań.
3. Kliknij CTA w FAQ i potwierdź, że prowadzą do właściwych miejsc: pricing/billing/club/data.
4. Ustawienia → Skróty.
5. Potwierdź: skróty są pogrupowane w sekcje.
6. Jako Free kliknij dowolny skrót i potwierdź komunikat, że edycja jest dla Pro/Club Pro.
7. Jako Pro/Club Pro kliknij skrót `Dodaj piłkę`, naciśnij nową kombinację, np. `Alt+B`.
8. Zamknij ustawienia i naciśnij nową kombinację na planszy.
9. Potwierdź: nowy skrót dodaje piłkę, a stary `B` nie wykonuje już tej akcji.
10. Wróć do Ustawienia → Skróty i kliknij `Reset do fabrycznych`.
11. Potwierdź: pojawia się komunikat o przywróceniu układu fabrycznego, `B` znowu dodaje piłkę.
12. Otwórz wybór planszy/boiska.
13. Potwierdź: nie ma surowych kluczy `pitchPanel.boardFull`, `pitchPanel.boardHalf2d`, `pitchPanel.boardPenalty2d`.

### G. Auth / baza produkcyjna

1. Zrób test Google login na produkcji.
2. Potwierdź: po logowaniu wracasz do `https://tmcstudio.app/app`, sesja jest aktywna i projekty zapisują się w chmurze.
3. Jeśli logowanie nie wraca poprawnie, porównaj z potwierdzoną konfiguracją: Netlify production `VITE_SUPABASE_URL` i `SUPABASE_URL` wskazują `https://pgacjczecyfnwsaadyvj.supabase.co`.
4. Jeśli Google pokaże błąd redirectu, popraw allowlistę OAuth w dashboardzie Google/Supabase dla `https://tmcstudio.app/app`.

---

## Plan — wpięcie w istniejące sprinty

Nie tworzymy osobnego nurtu. Wpinamy w istniejącą kolejność z `CURRENT_SPRINT_PLAN.md`
(Sprint 1 ✅, Sprint 2 🟢 aktywny). Dodajemy **Sprint 0.5 (hotfix release)** przed kontynuacją.

### 🚀 Sprint 0.5 — Release & Deploy Verification (P0, NOWY, przed wszystkim)
Cel: zamknąć deploy gap, żeby testy mówiły prawdę.

1. Wydać release z `[Unreleased]` (bump CHANGELOG → wersja, tag).
2. ✅ **Wersja z jednego źródła** — `aboutVersion` bierze `appVersion` z `package.json`/build, nie z hardkodu w locales (rdzeń PROBLEM 8).
3. Potwierdzić deploy na Netlify (commit hash na prod = HEAD).
4. **Re-test produkcji** wg tego pliku → odhaczyć 1, 3 i sprawdzić, co realnie zostaje.
5. ✅ PROBLEM 0: Netlify production env wskazuje `pgacjczecyfnwsaadyvj`, Supabase CLI jest zlinkowany do `pgacjczecyfnwsaadyvj`, a OAuth authorize dla `https://tmcstudio.app/app` startuje poprawnie (`302` do `accounts.google.com`). Po deployu zostaje tylko smoke-login użytkownika.

> **Wątpliwości do potwierdzenia z Twojej strony:** czy chcesz numer wersji typu `0.6.1` czy semantyczny bump (`0.6.2`/`0.7.0`)? Czy deploy idzie automatycznie z `develop`/`main`, czy ręcznie?

### Sprint 2 (aktywny, Quality Gate) — dorzucić jako część bramki
- ✅ PROBLEM 6: brakujące klucze `pitchPanel.boardFull/boardHalf2d/boardPenalty2d` (pl/en/es) dopisane.
- 🟡 Guard i18n w CI nadal do zrobienia (backlog P2 #4 z COMMIT_PLAN) — ma wykrywać surowe klucze zanim trafią na prod.

### Sprint „Editor Polish v2" (kontynuacja `SPRINT_EDITOR_PROPERTIES`, który jest ✅)
Realne braki edytora po deployu:
- ✅ PROBLEM 4: kontrolka **koloru strzałki** w inspektorze (`ArrowElement.color` + `onUpdateElement.color` + render w `ArrowNode`) dodana.
- ✅ PROBLEM 3 (domknięcie): dodano `color` do `ArrowDefaults`; „Ustaw jako domyślne" zapisuje kolor per typ strzałki.
- ✅ PROBLEM 2b + 12a: **kolor drużyny** aplikowany + **auto-GK / checkbox GK** przy dodawaniu.
- ✅ PROBLEM 2a: nazwa custom drużyny w pasku składu (label = nazwa, nie rola).
- ✅ PROBLEM 11: placeholder „Imię"→„Zawodnik" i kontrast inputu w dark mode zweryfikowany tokenami.
- ✅ PROBLEM 12b: `V` włącza wizję zaznaczonym zawodnikom, `Shift+V` przełącza rączki/orientację.
- ✅ PROBLEM 13: czułość rotacji uchwytu wizji podbita.
- ✅ PROBLEM 14: subtelny watermark `TMC STUDIO` dla free/guest dodany i ukryty w print mode.
- ✅ PROBLEM 5: animowany podgląd formacji z numerami usunięty z pustego stanu.

### Wpięcie w `HELP_SYSTEM_OVERHAUL_PLAN.md` (system pomocy)
- ✅ PROBLEM 9: osadzono istniejące komponenty FAQ w modalu Ustawień (sekcja FAQ).
- ✅ PROBLEM 10: feedback / zgłaszanie błędów dodane jako CTA mailto w Ustawieniach → O aplikacji.
- ✅ PROBLEM 7: grupowanie skrótów, edycja kombinacji dla Pro/Club Pro i reset fabryczny zrobione.
- ✅ PROBLEM 8 (treść): CTA social (IG/X/TikTok/LinkedIn), kontakt (Krystian Rubajczyk + link X), „by Sportpredictor", treści prawne dodane.

---

## Kolejność rekomendowana

1. **Sprint 0.5** (release + deploy + wersja z package.json + re-test + auth/baza) — **P0, teraz.**
2. **Re-test prod** → aktualizacja tej tabeli (skreślenie 1, 3 i tego, co zniknęło).
3. Quick wins i18n/UX: wykonane dla 2a, 6, 11.
4. Editor Polish v2: do retestu po deployu; 2b, 3, 4, 5, 12a, 12b, 13, 14 wykonane.
5. System pomocy / treści: 7, 8, 9, 10 wykonane.

## Definicja ukończenia (cały triage)
- Release wydany, prod = HEAD, wersja w „O aplikacji" zgodna z buildem.
- Każdy punkt funkcjonalny 1–14 ma DoD i instrukcję retestu po deployu.
- Smoke-login Google na żywej prod potwierdza powrót do `/app` i zapis projektu w chmurze.
- Guard i18n w CI łapie brakujące klucze (zapobiega nawrotom PROBLEM 6).
