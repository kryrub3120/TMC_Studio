# Sprint Plan — Editor Polish: Etykiety, Strzałki, Strefy, i18n Inspektora

_Utworzono: 2026-06-18 · Tryb: równoległy sprint (niezależny od głównego nurtu Security/Billing)_

> **Status (2026-06-18): ZAKOŃCZONE ✅** — zrealizowano wszystkie 5 PR-ów (etykieta zawodnika, i18n helpera, groty strzałek, kontrolki stref, i18n inspektora). Dodatkowo poza pierwotnym zakresem: grubość strzałek, domyślne style użytkownika (`ArrowDefaults`/`ZoneDefaults` + edytor w Preferencjach + „Ustaw jako domyślne"), kondensacja inspektora, przebudowa ławki składu i dolnego paska (in-flow, ukrywanie animacji), uzupełnienie brakujących kluczy i18n. Szczegóły w `CHANGELOG.md` (sekcja Unreleased, 2026-06-18). Typecheck `core`/`board`/`ui`/`web` czysty.

Cel: domknąć pięć zgłoszonych braków w warstwie edytora — wszystkie żyją w paczkach
`core` / `board` / `ui`, nie dotykają logiki canvas/store ani billingu, więc ryzyko
konfliktu z głównym nurtem jest niskie. Zakres: **5 PR-ów w jednym sprincie.**

> Dokumenty bazowe (Source of Truth): `packages/core/src/types.ts`,
> `packages/board/src/{PlayerNode,ArrowNode,ZoneNode}.tsx`,
> `packages/ui/src/{RightInspector,HelpSidebar,CheatSheetOverlay,helpSidebarData}.tsx`,
> `packages/ui/src/locales/{pl,en,es}.ts`.

---

## Zasady przekrojowe (obowiązują we wszystkich PR)

1. **Wsteczna kompatybilność modelu.** Każde nowe pole w `ArrowElement` / `ZoneElement` /
   `PlayerElement` jest opcjonalne, z bezpiecznym fallbackiem przy renderze. Stare zapisane
   plansze (bez nowych pól) muszą wyglądać identycznie jak dziś. Trzymamy istniejący wzorzec
   fallbacków (np. `borderStyle ?? 'none'`, `zone.points ?? []`).
2. **Zero stringów na twardo w UI.** Każdy nowy tekst widoczny dla użytkownika przechodzi przez
   `t()` i ma klucze w **pl + en + es** (PL i EN kompletne, ES = castellano).
3. **Kolory tylko z tokenów.** Brak nowych hex-ów na tekst; używamy `text-text` / `text-muted` /
   `--color-*`. Print mode (`isPrintMode`) musi dalej działać.
4. **Testy + ręczna weryfikacja.** Każdy PR ma DoD; PR-y dotykające modelu mają test
   round-trip serializacji (zapis → odczyt starego i nowego dokumentu).

---

## Kolejność i szacunki

| PR | Temat | Paczki | Złożoność | Szac. | Ryzyko |
|---|---|---|---|---|---|
| **PR-1** | Fix ucinania etykiety zawodnika | `board` | S | 2–4 h | niskie |
| **PR-2** | i18n nagłówka inspektora + warstw + ukrycie współrzędnych | `ui`, `core?` | S | 3–5 h | niskie |
| **PR-3** | i18n skrótów w helperze + kontrast dark mode | `ui` | S | 3–5 h | niskie |
| **PR-4** | Kontrolki linii granicznej strefy | `core`, `board`, `ui` | M | 6–10 h | średnie |
| **PR-5** | Opcje grota strzałki (ukrycie / podwójny / typ) | `core`, `board`, `ui` | L | 10–16 h | średnie |

Rekomendowana kolejność wykonania: **PR-1 → PR-2 → PR-3 → PR-4 → PR-5**
(najpierw szybkie wygrane i czyszczenie i18n, na końcu najcięższy model strzałek).

---

## PR-1 — Fix: ucinanie ostatniej litery w podpisie zawodnika

**Problem.** Pigułka podpisu (`PlayerNode.tsx`, blok `player.label && player.showLabel === true`)
liczy szerokość heurystycznie: `approxCharW = LBL_FONT_SIZE * 0.62`, `textW = label.length * approxCharW`.
Dla Inter **bold** realna szerokość znaków bywa większa, więc `pillW` / `textInnerW` są zaniżone,
a `<Text width={textInnerW} height={14}>` przycina tekst (zawinięcie + clip wysokości) → znika
ostatnia litera. To błąd pomiaru tekstu, nie i18n.

**Pliki.** `packages/board/src/PlayerNode.tsx`.

**Zakres.**
1. Zastąpić heurystykę realnym pomiarem szerokości tekstu — preferowane:
   `Konva.Text.prototype.measureSize` lub współdzielony canvas `measureText` z dokładnym fontem
   (`bold 11px Inter`). Funkcja pomiaru memoizowana (cache po `label`), żeby nie liczyć co render.
2. Z `pillW` policzyć od zmierzonej szerokości + `LBL_PAD_X * 2`; `textInnerW` = zmierzona szerokość
   (z małym marginesem bezpieczeństwa, np. +2 px).
3. Zdjąć sztywne ograniczenie wysokości powodujące clip albo upewnić się, że `<Text>` nie zawija
   (`wrap="none"`).
4. Sanity cap dla bardzo długich nazwisk (max szerokość pigułki, np. 160 px, z `ellipsis`).

**DoD.**
- Etykiety „Lewandowski", „M", „Szczęsny", „van Dijk" renderują się w całości (zero ucięć) przy
  rozmiarach fontu 8–20 px.
- Brak regresji wydajności (pomiar cache'owany, nie liczony co klatkę przy dragu).
- Print mode i istniejące kolory bez zmian.

---

## PR-2 — i18n nagłówka inspektora + etykiet warstw + ukrycie współrzędnych

**Problem.**
- `RightInspector.tsx` (~linia 301) renderuje surowo `{el.type}{el.team ? ` · ${el.team}` : ''}` —
  stąd „Player · Home" zamiast „Zawodnik · Gospodarze" (`capitalize` zmienia tylko pierwszą literę).
- `LayersTab` (~linie 457–465) ma etykiety warstw na twardo po angielsku
  (`'Home Players'`, `'Away Players'`, `'Ball'`, `'Arrows'`, `'Zones'`, `'Text & Labels'`,
  `'Equipment'`, `'Drawings'`).
- Współrzędne (`x …, y …`, ~linia 303) są zawsze widoczne, bez opcji ukrycia.

**Pliki.** `packages/ui/src/RightInspector.tsx`, `packages/ui/src/locales/{pl,en,es}.ts`,
opcjonalnie miejsce trzymające ustawienia UI (toggle współrzędnych).

**Zakres.**
1. Dodać klucze i18n:
   - `inspector.elementType.{player,ball,arrow,zone,text}`,
   - `inspector.team.{home,away,team3,team4}`,
   - `inspector.layers.{homePlayers,awayPlayers,ball,arrows,zones,labels,equipment,drawings}`.
2. Nagłówek: złożyć z `t('inspector.elementType.'+el.type)` + (dla zawodnika) `· t('inspector.team.'+el.team)`.
3. `LayersTab`: tablica `layers` mapuje `key → t('inspector.layers.'+key)` (usunąć stringi na twardo).
4. Współrzędne: dodać toggle „Pokaż współrzędne" (domyślnie **wł.** dla zgodności), trzymany w
   ustawieniach UI / localStorage. Gdy wył. — ukryć linijkę `x …, y …`.

**DoD.**
- W PL/EN/ES nagłówek i wszystkie etykiety warstw są przetłumaczone, brak surowego `player`/`home`.
- Toggle współrzędnych działa i pamięta stan między sesjami.
- Brak regresji w layoutcie panelu (chip, capitalize itd.).

---

## PR-3 — i18n skrótów w helperze + poprawa kontrastu (dark mode)

**Problem.**
- Opisy skrótów renderują się surowo po angielsku: `HelpSidebar.tsx` (~linia 240,
  `{item.description}`) oraz `CheatSheetOverlay.tsx` (~linia 285, `{item.description}`).
  Tytuły sekcji już idą przez `t('cheatsheet.sections.…')`, ale opisy pochodzą z twardych
  angielskich stringów w `helpSidebarData.ts` (`'Add Home Player'`, `'Pass Arrow'`, …).
- Kontrast: opisy w cheatsheet używają `text-muted` — w dark mode nisko-kontrastowy szary,
  stąd wrażenie „czarne / nie widać".

**Pliki.** `packages/ui/src/helpSidebarData.ts`, `packages/ui/src/HelpSidebar.tsx`,
`packages/ui/src/CheatSheetOverlay.tsx`, `packages/ui/src/locales/{pl,en,es}.ts`.

**Zakres.**
1. Nadać każdej pozycji skrótu stabilny `id` w `helpSidebarData.ts` (np. `add-home-player`).
2. Wprowadzić klucze i18n `shortcuts.<id>` (pl + en + es) dla wszystkich opisów
   z `SHORTCUT_SECTIONS` i `TOOL_ACTIONS`.
3. W obu komponentach renderować `t('shortcuts.'+item.id)` zamiast `item.description`.
   (Opcja: trzymać `descriptionKey` zamiast `description` w danych — czystsze.)
4. Kontrast: opisy skrótów w `CheatSheetOverlay` zmienić z `text-muted` na `text-text`
   (lub podbić token `--color-muted` w motywie dark, jeśli to systemowy problem). W `HelpSidebar`
   opisy już są `text-text` — zweryfikować spójność.

**DoD.**
- W PL/EN/ES wszystkie opisy skrótów (panel pomocy + cheatsheet) są przetłumaczone.
- Wszystkie nazwy/podtytuły w helperze czytelne w dark **i** light mode (kontrast ≥ WCAG AA).
- Brak osieroconych kluczy i18n (lint/skrypt sprawdzający klucze, jeśli istnieje).

---

## PR-4 — Strefy: kontrolki linii granicznej w inspektorze

**Problem.** Model `ZoneElement` ma już `borderStyle: 'solid'|'dashed'|'none'` i `borderColor`,
ale: (a) **inspektor w ogóle nie ma sekcji dla strefy** (`el.type === 'zone'` nie istnieje w
`RightInspector.tsx`), więc nie da się tym sterować; (b) w `ZoneNode.tsx` grubość jest zaszyta
(`strokeWidth: 3`), dash zaszyty (`[6,3]`), brak markerów narożnych.

**Pliki.** `packages/core/src/types.ts`, `packages/core/src/board.ts` (domyślne wartości),
`packages/board/src/ZoneNode.tsx`, `packages/ui/src/RightInspector.tsx`,
`packages/ui/src/locales/{pl,en,es}.ts`.

**Zakres modelu (`ZoneElement`).**
- `borderWidth?: number` (domyślnie 3),
- `showCorners?: boolean` (domyślnie `false` — markery narożne wł./wył.).
- (`borderStyle`, `borderColor` — już istnieją.)

**Zakres renderu (`ZoneNode.tsx`).**
1. `strokeWidth` brać z `zone.borderWidth ?? 3`.
2. Dash skalować względem grubości (np. `[borderWidth*2, borderWidth]`) zamiast `[6,3]` na twardo.
3. Markery narożne: gdy `showCorners === true`, rysować małe kropki/kwadraty w narożnikach
   (rect/ellipse → 4 narożniki bboxa; polygon → w wierzchołkach). Niezależne od trybu selekcji,
   `listening={false}`.

**Zakres UI (`RightInspector.tsx`).**
4. Dodać blok `{el.type === 'zone' && (…)}` z sekcjami:
   - **Linia graniczna**: wybór stylu (segmented: ciągła / przerywana / brak) → `borderStyle`.
   - **Grubość**: slider `borderWidth` (1–8 px), disabled gdy `borderStyle === 'none'`.
   - **Kolor obrysu**: color input → `borderColor`.
   - **Narożniki**: toggle `showCorners`.
5. Rozszerzyć `onUpdateElement` (i typ `SelectedElement`) o `borderStyle / borderWidth / borderColor / showCorners`.
6. Klucze i18n: `inspector.zone.{border,borderStyle,solid,dashed,none,borderWidth,borderColor,corners}`.

**DoD.**
- Zaznaczenie strefy pokazuje sekcję „Strefa" z działającymi: styl linii, grubość, kolor, narożniki.
- Zmiany widoczne natychmiast na canvasie i zapisywane w dokumencie.
- Stare strefy (bez nowych pól) renderują się jak dotąd (border 3 px, brak narożników).
- Sekcja w pełni przetłumaczona (pl/en/es).

---

## PR-5 — Strzałki: opcje grota (ukrycie / podwójny / typ)

**Problem.** `ArrowElement` nie ma żadnych pól dotyczących grota; w `ArrowNode.tsx` grot jest
zaszyty (`<Arrow pointerLength pointerWidth>`, a `shoot` ma własny trójkąt). Inspektor dla strzałki
pokazuje tylko numerację — zero kontrolek wyglądu grota. To najcięższy punkt (model + render + UI + i18n).

**Pliki.** `packages/core/src/types.ts`, `packages/core/src/board.ts`,
`packages/board/src/ArrowNode.tsx`, `packages/ui/src/RightInspector.tsx`,
`packages/ui/src/locales/{pl,en,es}.ts`.

**Decyzje projektowe.**
- Definiujemy typ grota: `type ArrowHead = 'arrow' | 'none' | 'bar' | 'dot'`
  (`arrow` = klasyczna strzałka, `bar` = płaska kreska poprzeczna, `dot` = punkt/kropka).
- Sterujemy oboma końcami niezależnie, co naturalnie obsługuje też podwójny grot:
  - `endHead?: ArrowHead` (domyślnie `'arrow'` — zachowanie dzisiejsze),
  - `startHead?: ArrowHead` (domyślnie `'none'`).
  - „Podwójny grot" = ustawienie obu na `'arrow'` (UI może mieć skrót-toggle, ale model zostaje
    rozdzielony na dwa końce — bardziej elastyczny).

**Zakres modelu (`ArrowElement`).**
- `startHead?: ArrowHead`, `endHead?: ArrowHead`.
- Fallback przy renderze: `endHead ?? 'arrow'`, `startHead ?? 'none'`.

**Zakres renderu (`ArrowNode.tsx`).**
1. Wydzielić render grotów z `<Arrow>` na własne komponenty rysujące grot w danym punkcie końcowym,
   zorientowany wg stycznej krzywej (mamy już `pointAt` / styczne dla shoot/dribble — wykorzystać).
2. Zaimplementować 4 typy grota w obu końcach:
   - `arrow`: trójkąt (jak dziś),
   - `none`: brak,
   - `bar`: krótka kreska prostopadła do stycznej,
   - `dot`: wypełnione kółko.
3. `pass`/`run`/`dribble`: użyć linii bez wbudowanego grota Konvy + nasze groty z punktu (1),
   żeby start/end były spójne. `shoot`: zachować podwójną linię, ale groty z nowej logiki.
4. Skalowanie grota względem `strokeWidth`; print mode bez zmian.

**Zakres UI (`RightInspector.tsx`).**
5. W bloku `el.type === 'arrow'` dodać sekcję **„Grot"**:
   - select grota początkowego (`startHead`),
   - select grota końcowego (`endHead`),
   - skrót „Podwójny grot" (ustawia oba na `'arrow'`) i „Ukryj groty" (oba `'none'`).
6. Rozszerzyć `onUpdateElement` i typ `SelectedElement` o `startHead / endHead`.
7. Klucze i18n: `inspector.arrow.{head,startHead,endHead,headArrow,headNone,headBar,headDot,doubleHead,hideHeads}`.

**DoD.**
- Dla każdej strzałki (pass/run/shoot/dribble) działa: ukrycie grota, podwójny grot, wybór typu
  (strzałka / kreska / punkt) niezależnie na obu końcach.
- Groty poprawnie zorientowane także na krzywych (bezier) i przy dragu endpointów.
- Stare strzałki renderują się jak dziś (grot tylko na końcu).
- Sekcja w pełni przetłumaczona (pl/en/es); test round-trip serializacji.

---

## Definicja ukończenia sprintu (Sprint DoD)

- Wszystkie 5 PR-ów scalone, każdy ze swoim DoD spełnionym.
- `pnpm build` + `pnpm lint` + testy przechodzą; brak nowych ostrzeżeń TS.
- Ręczny smoke test w PL i EN, w dark **i** light mode:
  1. podpis zawodnika (długie/krótkie nazwisko) bez ucięć,
  2. nagłówek inspektora + warstwy + helper w pełni po polsku,
  3. strefa: styl/grubość/kolor/narożniki działają,
  4. strzałka: ukrycie/podwójny/typ grota na obu końcach, także na krzywej.
- Wsteczna kompatybilność potwierdzona na realnym starym dokumencie (zero wizualnych regresji).

## Immediate Prompt

```text
Wykonaj Sprint Editor Polish z tasks/SPRINT_EDITOR_PROPERTIES_2026-06-18.md.
Kolejność: PR-1 → PR-2 → PR-3 → PR-4 → PR-5.
Trzymaj wsteczną kompatybilność modelu (nowe pola opcjonalne + fallback przy renderze).
Każdy nowy string przez t() z kluczami pl+en+es. Kolory tylko z tokenów.
Nie ruszaj store, billingu ani logiki canvas poza wymienionymi plikami.
```
