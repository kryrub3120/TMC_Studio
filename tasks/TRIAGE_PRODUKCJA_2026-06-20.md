# Triage testów produkcyjnych + plan 2 sprintów — 2026-06-20

**Źródło:** `TESTY - PRODUKCJA 18.06 -GODZ. 18.03.pdf` (11 zgłoszeń, testy na żywej produkcji, ścieżka niezalogowanego gościa + logowanie Google).
**Weryfikacja:** względem working tree (`package.json` = **0.7.1**).
**Zasada nadrzędna:** **„Po pierwsze nie wkurwiać."** Każda zmiana ma usuwać tarcie, nie dodawać. Modale i wymuszone decyzje są domyślnie złe.
**Integracja z:** `docs/CURRENT_SPRINT_PLAN.md`, `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md`, `docs/AUTH_FLOW.md`, `docs/UX_PATTERNS.md`, `docs/DESIGN_SYSTEM.md`, `docs/ENTITLEMENTS.md`.

---

## Cel dokumentu

Zamknąć 11 zgłoszeń z testów w **dwóch sprintach**:

- **Sprint UX-A — „Po pierwsze nie wkurwiać" (Flow & Bug Hardening).** Szybkie, wysokoodczuwalne poprawki flow gościa, logowania, menu i bugów edytora. P0.
- **Sprint UX-B — Preferencje: Cloud Sync + UX/UI.** Cięższy backendowy temat (synchronizacja preferencji w chmurze) + redesign panelu preferencji. P1, osobny sprint, bo inne tempo i ryzyko.

---

## Legenda statusów

| Status | Znaczenie |
|---|---|
| 🔴 BUG | funkcja udaje, że działa, albo zachowuje się błędnie — naprawić |
| 🟠 FLOW | poprawne technicznie, ale wkurza/tarcie w UX — przeprojektować |
| 🟡 REFACTOR | zła nazwa/struktura/IA — przebudować |
| 🟢 FEATURE | brakująca funkcja do dopisania |

---

## Tabela triage (11 zgłoszeń)

| # PDF | Zgłoszenie (skrót) | Klasyfikacja | Sprint | ID |
|---|---|---|---|---|
| 1 | Gość widzi „zapisywanie", a nic się nie zapisuje — ma być CTA „Zaloguj się, zapisuj projekty za darmo" + Google + Stwórz konto | 🟠 FLOW | UX-A | A1 |
| 2 | Niezalogowany użytkownik widzi „Wyloguj" | 🔴 BUG | UX-A | A2 |
| 3 | „Konto i płatności" — zła nazwa; rozbić na podzakładki w ustawieniach (ustawienia tablicy / zawodników) | 🟡 REFACTOR | UX-A | A3 |
| 6 | „Konto i płatności" — zły zestaw opcji; ma pokazywać: opcje edytora / ustawienia boiska / ustawienia drużyny / twój profil / wyloguj | 🟡 REFACTOR | UX-A | A3 |
| 4 | Całe menu PPM (prawy przycisk) nieprzetłumaczone — widać surowe klucze i18n | 🔴 BUG | UX-A | A4 |
| 5 | Po logowaniu Google trzeba ręcznie odświeżyć; wyskakuje modal „zapisać pracę?" — usunąć modal i wymóg odświeżania | 🟠 FLOW | UX-A | A5 |
| 7 | „Ustaw jako domyślne" dalej nie działa — nawet po odświeżeniu | 🔴 BUG | UX-A | A6 |
| 8 | Elementy w menu pomocy są „na ciemno" (kontrast/czytelność) | 🔴 BUG | UX-A | A7 |
| 9 | Dwuklik na obiekt (przy otwartej zakładce Warstwy) nie przełącza na zakładkę Właściwości | 🔴 BUG | UX-A | A8 |
| 10 | Preferencje tylko lokalne (localStorage) — chcemy synchronizację chmurową już teraz | 🟢 FEATURE | UX-B | B1 |
| 11 | UX/UI preferencji stylów nieczytelny, za dużo scrollowania — prostszy, ładniejszy układ | 🟠 FLOW | UX-B | B2 |

**Podsumowanie:** 9 pozycji → Sprint UX-A (zgłoszenia 1–9, gdzie 3+6 to jedno zadanie A3), 2 pozycje → Sprint UX-B (10, 11).

---

# SPRINT UX-A — „Po pierwsze nie wkurwiać" (Flow & Bug Hardening)

**Priorytet:** P0
**Wersja po sprincie:** PATCH/MINOR — głównie bugfixy + drobne flow; jeśli A3 zostanie potraktowane jako nowa IA menu → **MINOR** (`0.7.1` → `0.8.0`). Domyślnie **PATCH** (`0.7.1` → `0.7.2`).
**Skille:** `ui-delivery`, `design-system-review`, `regression-testing`, `docs-update`. (`security-privacy-review` tylko jeśli A5 dotyka sesji/auth store.)

## Cel

Usunąć całe tarcie ze ścieżki gościa i logowania oraz domknąć cztery bugi edytora, które „udają, że działają". Po sprincie nowy użytkownik wchodzi, próbuje, loguje się i pracuje bez ani jednego zbędnego modala, bez ręcznego odświeżania i bez surowych kluczy i18n.

## Zakres (zadania)

### A1 — CTA zapisu dla gościa zamiast „zapisywania" 🟠
- Gdy użytkownik **niezalogowany** próbuje zapisać/eksportować, zamiast komunikatu „zapisywanie" pokaż wezwanie: **„Zaloguj się — zapisuj projekty za darmo"** z dwoma akcjami: przycisk **Google** oraz **Stwórz konto** (opcja wyboru, nie wymuszenie jednej drogi).
- Login podsuwany **w momencie wartości** (przy próbie zapisu), nie z góry.
- **Pliki:** `packages/ui/src/AuthModal.tsx`, `packages/ui/src/UserMenu.tsx`, `apps/web/src/app/AppShell.tsx`, `apps/web/src/store/slices/documentSlice.ts`, locale `packages/ui/src/locales/{pl,en,es}.ts`.

### A2 — Gość nie może widzieć „Wyloguj" 🔴
- Dla `user === null` menu konta pokazuje wyłącznie „Zaloguj się"; żadnego „Wyloguj".
- **Pliki:** `packages/ui/src/UserMenu.tsx`, `packages/ui/src/TopBar.tsx` (`AccountMenu`).

### A3 — Przebudowa menu „Konto i płatności" (zgłoszenia 3 + 6) 🟡
- Zmień nazwę i zawartość menu konta. Pozycje najwyższego poziomu:
  1. Opcje edytora
  2. Ustawienia boiska
  3. Ustawienia drużyny
  4. Twój profil
  5. — (separator)
  6. Wyloguj
- Szczegółowe ustawienia (tablicy / zawodników) jako **podzakładki w Ustawieniach**, nie w menu konta.
- Nazwy mówią, co użytkownik dostanie — nie język wewnętrzny firmy („Konto i płatności").
- **Pliki:** `packages/ui/src/TopBar.tsx` (`AccountMenu`), `packages/ui/src/SettingsModal.tsx`, `apps/web/src/hooks/useSettingsController.ts`, locale `{pl,en,es}.ts` (`topbar.accountBilling` → nowe klucze).

### A4 — Tłumaczenie menu PPM (context menu) 🔴
- Menu kontekstowe canvasu pokazuje surowe klucze i18n zamiast tekstu. Uzupełnić brakujące klucze we wszystkich trzech językach + dodać guard w CI (jak przy poprzednim triage).
- **Pliki:** `apps/web/src/utils/canvasContextMenu.ts`, `apps/web/src/hooks/useCanvasContextMenu.ts`, `packages/ui/src/ContextMenu.tsx`, locale `{pl,en,es}.ts`.

### A5 — Bez modala i bez ręcznego odświeżania po loginie 🟠
- Po zalogowaniu przez Google stan ma przeładować się **sam** (bez ręcznego F5).
- **Usuń modal „zapisać pracę?".** Domyślny pusty stan to wyłącznie „Dodaj element, by rozpocząć" (`EmptyStateOverlay`) — użytkownik może zamiast tego otworzyć istniejący projekt. Żadnego blokującego popupu na starcie.
- Zasada: modal tylko dla akcji destrukcyjnych/nieodwracalnych. Reszta → nieblokujący toast.
- **Pliki:** `apps/web/src/app/AppShell.tsx`, `apps/web/src/app/orchestrators/ModalOrchestrator.tsx`, `apps/web/src/store/useAuthStore.ts`, `apps/web/src/store/slices/documentSlice.ts`, `packages/ui/src/EmptyStateOverlay.tsx`. Zgodność z `docs/AUTH_FLOW.md`.

### A6 — „Ustaw jako domyślne" musi działać i przetrwać odświeżenie 🔴
- Naprawić zapis i odczyt domyślnych stylów. Po „Ustaw jako domyślne" nowe elementy danego typu przejmują styl, a ustawienie przeżywa reload (persist w `useUIStore`).
- Sprawdzić ścieżkę: `RightInspector` → `setArrowDefaults`/`setZoneDefaults` → persist → `addArrowAtCursor`/`addZoneAtCursor`.
- **Pliki:** `packages/ui/src/RightInspector.tsx`, `packages/ui/src/SettingsModal.tsx`, `apps/web/src/store/useUIStore.ts`, `apps/web/src/app/board/useBoardPageHandlers.ts`.

### A7 — Kontrast menu pomocy 🔴
- „Elementy na ciemno" — naprawić tokeny kolorów tekstu/tła w menu/sidebarze pomocy (light i dark mode), użyć tokenów design systemu (`bg-surface text-text`).
- **Pliki:** `packages/ui/src/HelpSidebar.tsx`, `packages/ui/src/FloatingHelpButton.tsx`, `packages/ui/src/helpSidebarData.ts`. Zgodność z `docs/DESIGN_SYSTEM.md`.

### A8 — Dwuklik obiektu → automatyczna zakładka Właściwości 🔴
- Gdy inspektor jest otwarty na zakładce „Warstwy" i użytkownik dwukliknie obiekt na canvasie → inspektor automatycznie przełącza się na „Właściwości".
- **Pliki:** `packages/ui/src/RightInspector.tsx`, `apps/web/src/store/useUIStore.ts` (stan aktywnej zakładki inspektora), warstwy canvasu w `apps/web/src/components/Canvas/layers/`.

## Kryteria akceptacji (DoD)

- [ ] A1: niezalogowany przy próbie zapisu widzi CTA z Google + Stwórz konto; brak słowa „zapisywanie".
- [ ] A2: niezalogowany nigdzie nie widzi „Wyloguj".
- [ ] A3: menu konta ma nowe 6 pozycji; ustawienia tablicy/zawodników jako podzakładki; brak nazwy „Konto i płatności".
- [ ] A4: brak surowych kluczy i18n w menu PPM (pl/en/es); guard i18n w CI.
- [ ] A5: po loginie Google brak ręcznego odświeżania i brak modala „zapisać pracę?"; pusty stan = „Dodaj element".
- [ ] A6: „Ustaw jako domyślne" działa dla strzałek i stref i przeżywa reload.
- [ ] A7: menu pomocy czytelne w light i dark mode (kontrast WCAG AA).
- [ ] A8: dwuklik obiektu przełącza inspektor na Właściwości.
- [ ] `tsc --noEmit` + build (ui, web) zielone; testy core/web zielone; lint czysty.
- [ ] `CHANGELOG.md` zaktualizowany; wersja zbumpowana wg reguły powyżej; Footer pokazuje poprawną wersję.

## Zależności

- A5 zależy od mechanizmu auth z `docs/AUTH_FLOW.md` (popup + PKCE) — nie regresować popup flow.
- A3 i A1/A2 dotykają tych samych plików (`UserMenu.tsx`, `TopBar.tsx`) → realizować w jednej gałęzi, by uniknąć konfliktów.

## Scenariusze testowe (manual po deployu)

1. Wejdź jako gość → kliknij zapis/eksport → ma pojawić się CTA „Zaloguj się, zapisuj za darmo" z Google i Stwórz konto.
2. Jako gość przejrzyj menu konta → nie ma „Wyloguj".
3. Otwórz menu konta → 6 pozycji wg listy; wejdź w Ustawienia → są podzakładki tablicy i zawodników.
4. PPM na canvasie i na obiekcie → wszystkie pozycje przetłumaczone (przełącz pl/en/es).
5. Zaloguj się Google → aplikacja sama się przeładowuje, brak modala „zapisać pracę?", widać „Dodaj element".
6. Ustaw styl strzałki/strefy → „Ustaw jako domyślne" → odśwież → dodaj nowy element → ma przejąć styl.
7. Otwórz menu pomocy w light i dark mode → tekst czytelny.
8. Otwórz inspektor na „Warstwy" → dwuklik obiektu → przeskakuje na „Właściwości".

---

# SPRINT UX-B — Preferencje: Cloud Sync + UX/UI

**Priorytet:** P1 (osobny sprint po UX-A)
**Wersja po sprincie:** **MINOR** (`0.x.y` → `0.(x+1).0`) — nowa funkcja (cloud sync).
**Skille:** `db-migration`, `architecture-review`, `security-privacy-review`, `ui-delivery`, `design-system-review`, `regression-testing`, `docs-update`.

## Cel

Przenieść preferencje użytkownika z samego localStorage do chmury (Supabase) z synchronizacją między urządzeniami oraz przeprojektować panel preferencji stylów tak, by był czytelny i nie wymagał nadmiernego scrollowania. Komunikat „Preferencje zapisane lokalnie… synchronizacja w przyszłości" znika — bo funkcja jest.

## Zakres (zadania)

### B1 — Cloud sync preferencji (zgłoszenie 10) 🟢

> **Stan faktyczny (audyt kodu 2026-06-20):** sync NIE jest greenfieldem — jest częściowo zaimplementowany i niedokończony. To dlatego użytkownik widzi komunikat „w przyszłości”, mimo że szkielet już działa. Zadanie = **dokończyć i ujednolicić istniejący sync**, nie budować od zera.

**Co już istnieje (nie dotykać bez powodu):**
- Kolumna `profiles.preferences` JSONB + GIN index — migracja `supabase/migrations/20260110000000_add_user_preferences.sql`. **Nowa tabela/migracja NIE jest potrzebna.**
- RLS na `profiles` już poprawne: „Users can update own profile” (`auth.uid() = id`) — `20260108000000_initial_schema.sql`.
- Helpery `getPreferences()` / `updatePreferences()` — `apps/web/src/lib/supabase.ts` (l. 211, 218–234).
- `syncPreferencesToCloud()` — `apps/web/src/store/useUIStore.ts` (l. 329); wołany dla theme, gridVisible, snapEnabled, bottomBar, inspector width.
- Load + merge (cloud precedence) przy loginie/sesji/Google popup — `apps/web/src/store/useAuthStore.ts` (l. 313, 393, 456, 623).

**Luki do domknięcia (to jest realny zakres B1):**
- **Niepełne pokrycie pól.** `partialize` w `useUIStore` ma ~18 pól, a do chmury idzie tylko ~6. NIE synchronizują się m.in.: `arrowDefaults`, `zoneDefaults`, `defaultArrowType`, `gridSize`, `stepDuration`, `shortcutOverrides`, `viewportLocked`, `footerVisible`, `inspectorOpen`, `tutorialCompleted`, `clubWelcomeSeen`, `hasSeenShortcutsHint`. **Najważniejsze: `arrowDefaults`/`zoneDefaults` (czyli dane „Ustaw jako domyślne” z A6) nie są w chmurze.**
- **Load merguje jeszcze mniej pól niż zapis** — część zapisanych ustawień i tak nie wraca po zalogowaniu na innym urządzeniu.
- **Brak debounce** — `syncPreferencesToCloud` strzela przy każdym toggle.
- **Brak migracji local→cloud przy pierwszym loginie** (gdy chmura pusta, lokalne preferencje powinny zostać wypchnięte, nie nadpisane pustką).
- **Komunikat** `preferencesHint` „Preferencje zapisane lokalnie… synchronizacja w przyszłej aktualizacji” wciąż widoczny (locale pl/en/es) — usunąć.

**Zadania:**
- B1.1 — Jedno źródło prawdy listy pól sync (DRY): wspólna definicja używana przez `partialize`, zapis do chmury i odczyt/merge, żeby nie rozjeżdżały się.
- B1.2 — Rozszerzyć typ `UserPreferences` i `syncPreferencesToCloud` o wszystkie persystowane pola (priorytet: `arrowDefaults`/`zoneDefaults` — zależność od A6).
- B1.3 — Debounce upsert (~800 ms) + flush przy `beforeunload`.
- B1.4 — Rozszerzyć load/merge w `useAuthStore` o pełny zestaw pól.
- B1.5 — First-login migration: chmura pusta → push lokalnych; chmura niepusta → cloud precedence (last-write-wins po `updated_at`).
- B1.6 — Usunąć komunikat „w przyszłości” w `packages/ui/src/locales/{pl,en,es}.ts` (`preferencesHint`).
- B1.7 — Sprawdzić, czy `profiles` ma `updated_at` do rozstrzygania konfliktu; jeśli brak — dołożyć w migracji (jedyny ewentualny powód migracji).

**Pliki:** `apps/web/src/store/useUIStore.ts`, `apps/web/src/store/useAuthStore.ts`, `apps/web/src/lib/supabase.ts`, `packages/ui/src/locales/{pl,en,es}.ts`, ewentualnie nowa migracja tylko dla `updated_at`. Zgodność z `docs/DATA_MODEL.md`, `docs/DB_CONVENTIONS.md`, `docs/ENTITLEMENTS.md` (sync darmowy czy Pro?).

**Skille korekta:** `db-migration` tylko jeśli B1.7 wymaga migracji; w przeciwnym razie zakres jest frontendowy → `ui-delivery` + `architecture-review` + `security-privacy-review` + `regression-testing`.

### B2 — Redesign panelu preferencji stylów (zgłoszenie 11) 🟠
- Uprościć układ: mniej scrollowania, czytelna hierarchia, grupowanie powiązanych ustawień, podgląd na żywo. Zgodność z `docs/DESIGN_SYSTEM.md` i `docs/UX_PATTERNS.md`.
- **Pliki:** `packages/ui/src/SettingsModal.tsx` (sekcja preferencji/stylów), tokeny z `DESIGN_SYSTEM.md`.

## Kryteria akceptacji (DoD)

- [ ] B1: migracja `user_preferences` + RLS; preferencje zalogowanego synchronizują się między dwoma sesjami/urządzeniami; lokalne preferencje migrują przy pierwszym logowaniu; działa offline.
- [ ] B1: usunięty komunikat „zapisane lokalnie / w przyszłości".
- [ ] B1: `security-privacy-review` — RLS poprawne, brak wycieku preferencji między użytkownikami.
- [ ] B2: panel preferencji przeprojektowany; redukcja scrollowania potwierdzona; zgodny z design systemem.
- [ ] `tsc --noEmit` + build + testy zielone; migracja testowana lokalnie przed remote.
- [ ] `CHANGELOG.md` + bump MINOR; dokumentacja (`DATA_MODEL.md`, `FEATURE_SPEC.md`) zaktualizowana.

## Zależności

- **B1 zależy od ukończonego Sprintu UX-A** (stabilny auth flow i menu, do których podpina się sync).
- B1 wymaga decyzji produktowej: **czy cloud sync to funkcja darmowa czy Pro?** → patrz `docs/ENTITLEMENTS.md`. Jeśli niejasne → ASK USER przed implementacją gatingu.
- Migracja DB idzie przez `db-migration` + test lokalny przed remote (zgodnie z DB_CONVENTIONS).

## Scenariusze testowe

1. Zaloguj się na urządzeniu A → zmień preferencje → zaloguj na urządzeniu B → preferencje są te same.
2. Pracuj offline → zmiany trzymane lokalnie → po odzyskaniu sieci synchronizują się.
3. Gość z lokalnymi preferencjami → loguje się → lokalne preferencje migrują do chmury (bez utraty).
4. Dwóch użytkowników → żaden nie widzi preferencji drugiego (RLS).
5. Panel preferencji → wszystkie ustawienia osiągalne bez nadmiernego scrollowania; podgląd działa.

---

## Kolejność i zasada

1. **Sprint UX-A** (P0) — najpierw, bo szybkie quick-winy „antywkurzania".
2. **Sprint UX-B** (P1) — potem, jako osobny sprint backendowy.

Nie łączyć obu w jeden przebieg: różne ryzyko (UX-A = niskie, UX-B = migracja DB + RLS) i różne tempo. UX-A buduje flow, UX-B kładzie fundament.
