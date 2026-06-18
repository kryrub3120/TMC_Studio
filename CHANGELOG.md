# Changelog

All notable changes to TMC Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-06-18

### Fixed
- **Triage produkcyjny PROBLEMY 0–14 — 16 poprawek przed release** (2026-06-18)
  - **#0**: Netlify production env wskazuje `pgacjczecyfnwsaadyvj`, Supabase CLI zlinkowany, OAuth authorize działa.
  - **#1/#3**: Ustawienia strefy/strzałki jako domyślne — `addZoneAtCursor`/`addArrowAtCursor` aplikują `zoneDefaults`/`arrowDefaults`.
  - **#2a/2b**: Nazwa drużyny z `teamSettings.name`, kolor z `teamSettings.primaryColor`, auto-GK dla #1.
  - **#4**: Kontrolka koloru strzałki w inspektorze + `ArrowDefaults.color`.
  - **#5**: Usunięto animowany podgląd formacji z `EmptyStateOverlay`.
  - **#6**: Brakujące klucze i18n `pitchPanel.*` w pl/en/es.
  - **#7**: Grupowanie skrótów w Ustawieniach, edycja dla Pro/Club Pro, reset do fabrycznych, runtime override.
  - **#8**: Wersja z `package.json` przez `appVersion`, social CTA, feedback, kontakt, linki prawne w "O aplikacji".
  - **#9**: Zakładka FAQ w Ustawieniach z wyszukiwarką i kategoriami.
  - **#10**: CTA "Zgłoś błąd" i "Wyślij feedback" jako linki mailto.
  - **#11**: Placeholder "Zawodnik" w szybkim dodawaniu + dark mode fix.
  - **#12a/12b**: Checkbox GK w szybkim dodawaniu + Ustawienia → Skład; `V` tylko dla zaznaczonych, `Shift+V` = orientacja.
  - **#13**: Czułość rotacji wizji zwiększona (`ORIENTATION_DRAG_SENSITIVITY = 1.35`).
  - **#14**: Watermark "TMC STUDIO" na canvasie dla free/guest, ukryty w trybie print.
  - Pliki: 23 pliki zmodyfikowane (apps/web, packages/ui, packages/board, packages/core).

### Added
- **Edytor: groty strzałek, grubość linii, obrys stref + domyślne style użytkownika** (2026-06-18)
  - Strzałki: wybór grota początkowego/końcowego (strzałka / brak / kreska / punkt), skróty „Podwójny grot" / „Ukryj groty", suwak grubości linii (1–12 px), żywy podgląd. Model: `ArrowElement.startHead?/endHead?`; render w `ArrowNode` — groty jako osobne kształty zorientowane wg stycznej, działają też na krzywych.
  - Strefy: sekcja w inspektorze — styl linii granicznej (ciągła/przerywana/brak), grubość (1–8 px), kolor obrysu (próbki + własny), markery narożne. Model: `ZoneElement.borderWidth?/showCorners?`.
  - Domyślne style użytkownika: `ArrowDefaults` (grubość per typ pass/run/shoot/dribble + groty) i `ZoneDefaults` (obrys/wypełnienie/krycie) w `@tmc/core`; trzymane i persystowane w `useUIStore`. Nowe strzałki/strefy startują z tymi wartościami.
  - „Ustaw jako domyślne" w inspektorze (strzałka i strefa) zapisuje bieżący wygląd jako domyślny; pełny edytor + „Przywróć domyślne" w Ustawienia → Preferencje.
  - i18n: pl/en/es.
  - Pliki: `packages/core/src/types.ts`, `packages/board/src/{ArrowNode,ZoneNode}.tsx`, `packages/ui/src/{RightInspector,SettingsModal,primitives}.tsx`, `apps/web/src/store/{useUIStore,slices/elementsSlice}.ts`, `apps/web/src/app/board/{BoardPage,useBoardPageHandlers}.tsx`, `routes/useBoardPageState.ts`, `orchestrators/ModalOrchestrator.tsx`, `AppShell.tsx`, `locales/{en,pl,es}.ts`.

### Changed
- **Inspektor + dolny pasek + ławka składu — układ i kondensacja** (2026-06-18)
  - Sekcja strzałki skondensowana: grubość + groty start/koniec obok siebie (2 kolumny) + akcje w jednym rzędzie (set-default jako ikona).
  - Domyślna szerokość inspektora 280 → 340 px (`DEFAULT_INSPECTOR_WIDTH` w `RightInspector` i `useUIStore`).
  - Ławka składu: jeden poziomy pasek — przełącznik składu po lewej (większy/wyraźniejszy), zawodnicy w poziomym scrollu, ikony po prawej; ~2× niższa.
  - Ławka i pasek animacji przeniesione do normalnego flow (pełna szerokość); obszar roboczy sam się dokleja, bez rezerwowanej pustej przestrzeni. Pasek animacji można ukryć (zwijanie podpięte do `bottomBarCollapsed` + `onToggleCollapsed`).
  - Pliki: `packages/ui/src/{RightInspector,SquadBench,SmartBottomBar}.tsx`, `apps/web/src/app/board/BoardPage.tsx`, `apps/web/src/store/useUIStore.ts`.

### Fixed
- **i18n: brakujące klucze (surowe „topbar.pitch" itd.)** (2026-06-18)
  - Dodano 14 brakujących kluczy w pl/en/es: `topbar.pitch/pitchTitle`, `pitchPanel.boardView/boardResetTitle/boardResetDesc/boardResetConfirm`, `commands.toast.{groupUngrouped,selectionLockToggled,selectionLocked,selectionUnlocked}`, `common.close/saving`, `tutorial.finish`, `appToast.clubCreated`.
- **PR-4/PR-5: opcje widoczne w inspektorze, ale bez efektu** (2026-06-18)
  - Dowiązano logikę: nowe akcje `updateArrowStyle`/`updateZoneStyle` w store, routing w `handleUpdateElement`, mapowanie `startHead/endHead/border*` w `inspectorElement`.
- **Strefy: niewidoczny obrys / „nie działa" grubość** (2026-06-18)
  - `ZoneNode`: obrys renderowany jako osobny, w pełni kryjący kształt (wcześniej dziedziczył niskie krycie wypełnienia → był niewidoczny, a zmiana grubości pozornie nic nie robiła); domyślny kolor obrysu = przyciemnione wypełnienie. Dynamiczny `strokeWidth`/dash + markery narożne.
- **Inspektor: brak przewijania do końca (ucięty dół, „dziura")** (2026-06-18)
  - `PropsTab`: sztywne `max-h-[calc(100vh-180px)]` → `h-full overflow-y-auto pb-6` — dół sekcji (m.in. przycisk „Ustaw jako domyślne") jest teraz dostępny.
- **Zdublowany / przelewający się widok planszy** (2026-06-18)
  - Po przeniesieniu dolnego paska do normalnego flow wiersz główny dostał `min-h-0`, dzięki czemu kolumna `h-screen` znów mieści się w jednym ekranie (boisko poprawnie się kurczy).

### Added
- **Pricing: shared config + cycle propagation + Team calculator** (2026-06-18)
  - Utworzono `packages/ui/src/pricingConfig.ts` — jedno źródło prawdy dla display prices i Stripe Price IDs (DISPLAY_PRICES, STRIPE_PRICES, SAVE_PERCENT).
  - PricingModal przyjmuje `initialCycle` prop — cykl wybrany na `/pricing` (monthly/yearly) zachowuje się w checkout.
  - `/pricing` → `/app?upgrade=pro&cycle=yearly` → PricingModal otwiera się na yearly, używa yearly priceId.
  - "Save 17%" badge przy yearly toggle w PricingPage i PricingModal.
  - Team kalkulator na `/pricing`: 5×Pro ($45/mo) vs Team ($29/mo) — oszczędność $16/mo ($160/yr).
  - i18n: teamCalc sekcja w en/pl/es.
  - Trial: nie implementowany (decyzja: Free ma dość funkcji by pokazać wartość).

### Changed
- **Tutorial (Coach Tour) — przebudowa: ujawnianie realnych elementów** (2026-06-18)
  - Każdy krok teraz *otwiera i podświetla prawdziwy element UI* zamiast pokazywać atrapę w karcie:
    - Kroki 1/2/4/8 otwierają realne rozwijane menu paska (Zawodnicy / Strzałki / Sprzęt / Eksport) — przez nowy sterowany prop `tutorialMenu` przekazany do `PlayersMenu/ArrowsMenu/EquipmentMenu/ExportMenu`; spotlight celuje w panel menu (`data-tour` na panelach, nie na przyciskach).
    - Krok 3 (Kierunek) zaznacza zawodnika i otwiera Inspektor z sekcją „Zaawansowane" (orientacja / ramiona / stożek widzenia) — sekcja domyślnie rozwinięta.
    - Krok 5 rozwija Ławkę składu, krok 6 podnosi pasek animacji, krok 7 otwiera szufladę Projektów, krok 9 otwiera pływający modal Ustawień.
  - Mechanizm: nowy callback `onStepShow` w `TutorialOverlay` + reveal-actions w `BoardPage.handleTutorialStepShow`; pomiar celu po animacji otwarcia panelu (seria prób repozycjonowania 0–520 ms). Pełnoekranowe panele (szuflada Projektów, modal Ustawień) otwierane tylko na swoim kroku i zamykane przy przejściu/zamknięciu.
  - Usunięto auto-przewijanie kroków → nawigacja ręczna + klawiatura (←/→/Enter/Esc). Atrapa-demo w karcie pokazywana tylko jako fallback, gdy nie ma realnego celu. Dodano pulsujący spotlight; `--z-tutorial` podniesiony 38 → 55 (nad overlayami z-50).
  - Pliki: `packages/ui/src/TutorialOverlay.tsx`, `tutorialSteps.ts`, `TopBar.tsx`, `ProjectsDrawer.tsx`, `SettingsModal.tsx`, `RightInspector.tsx`, `theme/tokens.css`; `apps/web/src/app/board/BoardPage.tsx`, `BoardTopBarSection.tsx`, `routes/useBoardPageState.ts`, `AppShell.tsx`.
- **Jeden tutorial dla wszystkich planów; krok 9 = Ustawienia** (2026-06-18)
  - `getStepsForPlan` dołącza krok 9 dla *każdego* planu (wcześniej tylko `team`). Krok 9: „Zarządzaj swoimi ustawieniami" → otwiera modal Ustawień. `TEAM_STEP` przemianowany na `SETTINGS_STEP` (alias zachowany dla zgodności).
  - Finalny przycisk tutoriala zawsze „Stwórz swoją pierwszą grafikę" (nowy klucz i18n `tutorial.finish`, PL/EN/ES) zamiast „Zacznij trenować".
  - Wyłączono auto-otwieranie osobnego `ClubWelcomeModal` — eliminuje nieprzetłumaczony ekran `club.welcome.*`; club/team dostają to samo jedno przejście tutoriala.
  - Pliki: `packages/ui/src/tutorialSteps.ts`, `locales/{en,pl,es}.ts`, `apps/web/src/app/AppShell.tsx`.

### Added
- **Moduł animacji włączony (dev)** (2026-06-18)
  - `VITE_ANIMATION_ENABLED=true` w `.env.local` — widoczny dolny pasek animacji / oś kroków + skróty (N / L / X, ←/→, Space). Produkcja/Netlify: ustawić tę zmienną w dashboardzie hostingu.
  - Plik: `.env.local`.

### Fixed
- **Dark mode — kontrast „czarnych" napisów** (2026-06-18)
  - Ławka składu: chipy zawodników `bg-surface` → `bg-surface2` (kontrast względem tła ławki); etykiety / liczniki / podpowiedź „Przeciągnij…" `text-muted/60–80` → pełny `text-muted`.
  - Paleta poleceń: niezaznaczone pozycje `text-text/80` → `text-text`.
  - Pliki: `packages/ui/src/SquadBench.tsx`, `CommandPaletteModal.tsx`.
- **Tutorial — pętla aktualizacji Reacta** (2026-06-18)
  - Efekt „reveal" zależny wyłącznie od indeksu kroku (callbacki trzymane w refach) + zabezpieczone settery paneli — usuwa „Maximum update depth exceeded".
  - Plik: `packages/ui/src/TutorialOverlay.tsx`.

## [0.6.1] - 2026-06-17

### Security
- **Supabase DB migracje na produkcję (6 migracji)** (2026-06-17)
  - `20260615000000_add_organizations` — tabele organizacji i członkostwa
  - `20260615000001_org_ownership_transfer` — transfer własności organizacji
  - `20260615000002_simplify_org_roles` — uproszczenie ról (admin/coach → member)
  - `20260615000003_tighten_storage_policies` — uszczelnienie polityk storage (avatars, thumbnails); dodano `DROP POLICY IF EXISTS` dla idempotencji
  - `20260615000004_add_team_tables` — tabele teams/team_members
  - `20260615000005_fix_accept_invitation_ambiguous_column` — fix kolumny w accept_invitation

### Fixed
- **Idempotencja storage policies** (2026-06-17)
  - Dodano `DROP POLICY IF EXISTS` przed `CREATE POLICY` w `20260615000003_tighten_storage_policies.sql` — bezpieczne ponowne uruchomienie migracji.
  - Plik: `supabase/migrations/20260615000003_tighten_storage_policies.sql`

## [0.6.0] - 2026-06-13

### Added
- **Export 100% resolution** (2026-06-13)
  - Dynamiczny `pixelRatio` dla wszystkich formatów exportu: `Math.max(2, Math.ceil(canvasWidth / stageW))` — full canvas resolution niezależnie od zoom viewportu.
  - PNG, PNG-all, JPG, GIF, PDF — wszystkie exportują w pełnej rozdzielczości boiska.
  - Plik: `apps/web/src/hooks/useExportController.ts`.
- **Wyginanie strzałek (łuki) — bend handle** (2026-06-13)
  - Każdą strzałkę (pass / run / shoot / dribble) można wygiąć w gładki łuk. Po zaznaczeniu pojawia się niebieski uchwyt na środku — przeciągnięcie tworzy krzywą (kwadratowa Béziera), dwuklik prostuje.
  - Wykorzystane istniejące pole `ArrowElement.curveControl`; uchwyt reprezentuje wierzchołek łuku (wygodniejszy UX niż surowy punkt kontrolny).
  - Parametr `endpoint` rozszerzony o `'control'` w całym łańcuchu (ArrowNode → ArrowsLayer → BoardCanvas → store). `updateArrowEndpoint` ustawia/czyści `curveControl` (snap do prostej przy zbliżeniu do środka).
  - Pliki: `packages/board/src/ArrowNode.tsx`, `apps/web/src/store/slices/elementsSlice.ts`, sygnatury w `ArrowsLayer`, `BoardCanvas`, `CanvasElements`, `CanvasAdapter`, `BoardCanvasSection`, `useCanvasEventsController`, `useCanvasInteraction`, `CommandRegistry`.
- **Bramkarz — wyróżniony kolor + skrót** (2026-06-13)
  - `applyFormation` oznacza bramkarza formacji (`role === 'GK'`) jako `isGoalkeeper`, więc po Shift+1..6 / 1..6 GK renderuje się w kolorze bramkarskim drużyny.
  - Domyślne `goalkeeperColor` w `DEFAULT_TEAM_SETTINGS` są teraz odrębne i kontrastujące: Team 1 żółty `#fbbf24`, Team 2 pomarańczowy `#f97316`, Team 3 różowy, Team 4 cyan.
  - Nowy skrót **Shift+G**: zaznaczony zawodnik z pola → zostaje bramkarzem; zaznaczony bramkarz / brak zaznaczenia → cykl koloru bramkarza drużyny (`cycleGoalkeeperColor`). Wpis dodany do ściągawki skrótów.
  - Pliki: `packages/core/src/types.ts`, `apps/web/src/store/slices/elementsSlice.ts`, `apps/web/src/hooks/useKeyboardShortcuts.ts`, `packages/ui/src/CheatSheetOverlay.tsx`.

### Changed
- **UI redesign — Faza 1+2: wspólne prymitywy + przebudowa inspektora** (2026-06-13)
  - Nowy plik `packages/ui/src/primitives.tsx`: `Toggle`, `SettingRow`, `Section` (zwijana), `Field` + `inputClass`, `Slider`, `ColorSwatchRow`, `SegmentedControl`. Jedno źródło prawdy na tokenach semantycznych (patrz `docs/DESIGN_SYSTEM.md` §10.8).
  - `RightInspector` — `PropsTab` przebudowany: kontekstowy nagłówek (chip drużyny + numer + pozycja jako tekst, zamiast fałszywych edytowalnych pól X/Y), opcje pogrupowane w zwijane sekcje **Identity / Appearance / Role / Advanced** (Advanced domyślnie zwinięte), wszystkie toggle/slider/pola z prymitywów. Usunięto emoji 🔄 (ikona SVG). Pasek 5 zakładek nie zawija się już do 2 rzędów (flex zamiast grid-cols-3).
  - `SettingsModal` — 4 powielone inline toggle'e (motyw / siatka / snap / squad) zastąpione współdzielonym `Toggle`.
  - Pliki: `packages/ui/src/primitives.tsx`, `packages/ui/src/index.ts`, `packages/ui/src/RightInspector.tsx`, `packages/ui/src/SettingsModal.tsx`, `docs/DESIGN_SYSTEM.md`.
- **UI redesign — Faza 3: konsolidacja IA (inspektor odchudzony, ustawienia z lewą nawigacją)** (2026-06-13)
  - `SettingsModal` przebudowany na **lewy pasek nawigacji** pogrupowany w sekcje **Account** (Profile / Security / Billing), **Editor** (Preferences / Squad) i **Board** (Teams / Pitch). Emoji w zakładkach zastąpione ikonami SVG.
  - Zakładki **Teams** i **Pitch** przeniesione z inspektora do `SettingsModal` (sekcja Board) — renderują `TeamsPanel` / `PitchPanel`. Inspektor zszczuplony z **5 do 3 zakładek** (Props / Layers / Objects).
  - Ustawienia drużyn/boiska/print-mode przepięte przez `ModalOrchestrator` → `AppShell` bezpośrednio ze store'a (`document.teamSettings`, `document.pitchSettings`, `updateTeamSettings`, `updatePitchSettings`, `isPrintMode`, `togglePrintMode`).
  - Pliki: `packages/ui/src/SettingsModal.tsx`, `packages/ui/src/RightInspector.tsx`, `apps/web/src/app/board/BoardPage.tsx`, `apps/web/src/app/orchestrators/ModalOrchestrator.tsx`, `apps/web/src/app/AppShell.tsx`.
- **UI redesign — Faza 4: domknięcie planu** (2026-06-13)
  - **Inspektor 3 → 2 zakładki:** Layers i Objects scalone w jeden panel (widoczność warstw + grupy u góry, przeszukiwalna lista obiektów poniżej). Zostają: Props / Layers.
  - **Tryb motywu Light / Dark / System** — `useUIStore` dostał `themeMode` + `setThemeMode` z rozwiązywaniem `system` przez `matchMedia` i nasłuchem zmian OS. W `SettingsModal` → Preferences renderowany `SegmentedControl` zamiast przełącznika. Przepięte przez `ModalOrchestrator` → `AppShell`.
  - **Wizualny szlif `SettingsModal`** — zahardkodowane klasy (`text-gray-*`, `bg-white/5`, `bg-blue-600`, `bg-gray-700`, `border-white/*`) zamienione na tokeny semantyczne (`text-muted`, `bg-surface2`, `bg-accent`, `border-border`); przyciski na tłach kolorowych zachowują biały tekst. Preferences używają `SettingRow` + `SegmentedControl`.
  - **Multi-select w inspektorze** — zaznaczenie wielu elementów pokazuje wspólne właściwości: suwak krycia (batch) + Show/Hide labels. Nowa akcja store `updateSelectedElements`.
  - Pliki: `packages/ui/src/RightInspector.tsx`, `packages/ui/src/SettingsModal.tsx`, `packages/ui/src/primitives.tsx`, `apps/web/src/store/useUIStore.ts`, `apps/web/src/store/slices/elementsSlice.ts`, `apps/web/src/app/board/BoardPage.tsx`, `apps/web/src/app/orchestrators/ModalOrchestrator.tsx`, `apps/web/src/app/AppShell.tsx`.

- **Layers — kompletne show/hide + Footer social** (2026-06-13)
  - Panel warstw dostał brakujące przełączniki: **Equipment** i **Drawings** (wcześniej zahardkodowane na zawsze-widoczne), a „Labels" doprecyzowano na **Text & Labels**. `LayerVisibility`/`LayerType` rozszerzone w `useUIStore` i inspektorze; `BoardCanvasSection` realnie podpina `equipment`/`drawings` zamiast `true`.
  - **Footer**: dodane ikony **X** i **LinkedIn** + numer wersji obok copyrightu (`Footer` ma teraz prop `version`).
  - Naprawione blokery builda z równolegle edytowanego kodu (feature squad team3/team4): błąd składni JSX w liście squadu w `SettingsModal`, niespójny typ `onAddSquadPlayer` (ujednolicony na `Team` w `SettingsModal`/`ModalOrchestrator`), oraz brakujący w destrukturyzacji prop `onOpenSquadSettings` w `TopBar`.
  - Pliki: `apps/web/src/store/useUIStore.ts`, `packages/ui/src/RightInspector.tsx`, `apps/web/src/app/board/BoardCanvasSection.tsx`, `packages/ui/src/Footer.tsx`, `apps/web/src/app/AppShell.tsx`, `packages/ui/src/SettingsModal.tsx`, `packages/ui/src/TopBar.tsx`, `apps/web/src/app/orchestrators/ModalOrchestrator.tsx`.
  - **Pozostało z planu:** nowe sekcje Settings (Language, Keyboard shortcuts, Editor defaults, Data & privacy, About) oraz i18n PL/EN/ES z przełącznikiem flagi (react-i18next — wymaga instalacji zależności).
- **i18n PL/EN/ES + przełącznik flagi w top barze** (2026-06-13)
  - Zero-zależnościowa warstwa i18n w `@tmc/ui` (`i18n.tsx`) z API wzorowanym 1:1 na **react-i18next** (`useTranslation().t`, `i18n.changeLanguage`) — silnik można później podmienić na react-i18next (pod macOS/Android/desktop) bez ruszania komponentów.
  - Słowniki `packages/ui/src/locales/{en,pl,es}.ts` (kształt JSON, reużywalne między web / React Native / Electron). Wykrywanie języka z przeglądarki + zapamiętywanie w `localStorage`, fallback do EN.
  - `LanguageSwitcher` — dropdown z flagami **SVG** (nie emoji): Polski / English / Español, z aktywnym stanem i obsługą klawiatury. Wpięty w prawy klaster `TopBar`.
  - Przetłumaczone na start: `Footer` (Privacy/Terms/Cookies/Contact + pokaż/ukryj) oraz tytuły w `TopBar` (Focus/Theme/Help). Reszta stringów do uzupełnienia fazami (Settings, Inspector, toasty).
  - `LanguageProvider` owija aplikację w `main.tsx`.
  - Pliki: `packages/ui/src/i18n.tsx`, `packages/ui/src/LanguageSwitcher.tsx`, `packages/ui/src/locales/*.ts`, `packages/ui/src/index.ts`, `packages/ui/src/TopBar.tsx`, `packages/ui/src/Footer.tsx`, `apps/web/src/main.tsx`.
- **Settings — nowa grupa „General" (Language / Shortcuts / About)** (2026-06-13)
  - Lewa nawigacja `SettingsModal` dostała grupę **General**: **Language** (`SegmentedControl` PL/EN/ES spięty z i18n), **Shortcuts** (zwięzła ściągawka skrótów) i **About** (wersja + linki X/LinkedIn/GitHub/Contact). Ikony SVG w nawigacji.
  - Pozostałe propozycje (Editor defaults, Data & privacy import/eksport JSON) odłożone — wymagają nowego stanu w store i hooków serializacji.
  - Plik: `packages/ui/src/SettingsModal.tsx`.
- **Eksport/import planszy (JSON) + rozszerzenie tłumaczeń** (2026-06-13)
  - Store: `exportBoardToFile()` i `importBoardFromFile(file)` w `documentSlice` (na bazie `exportDocument`/`importDocument` z core). Import podmienia bieżącą planszę i resetuje historię. Wpięte przez `ModalOrchestrator` → `AppShell`; w `SettingsModal` sekcja **Data & privacy** (Export/Import).
  - i18n: nowe namespace'y `inspector.*` i `settings.*` w `locales/{en,pl,es}.ts`. Przetłumaczony **RightInspector** — zakładki (Props/Layers), tytuły sekcji (Identity/Appearance/Role/Advanced/Numbering/Sequence), etykiety pól, multi-select, nazwy warstw, wyszukiwarka obiektów — oraz grupy nawigacji w Settings (Account/Editor/Board/General).
  - Pliki: `apps/web/src/store/slices/documentSlice.ts`, `packages/ui/src/RightInspector.tsx`, `packages/ui/src/locales/*.ts`, `apps/web/src/app/orchestrators/ModalOrchestrator.tsx`, `apps/web/src/app/AppShell.tsx`.
- **Tłumaczenia — CheatSheet + Command Palette** (2026-06-13)
  - Namespace'y `cheatsheet.*` i `palette.*` w `locales/{en,pl,es}.ts`. `CheatSheetOverlay`: nagłówek, zakładki, tytuły sekcji i stopka po PL/EN/ES. `CommandPaletteModal`: placeholder wyszukiwania, „brak wyników" i nazwy kategorii.
  - Pliki: `packages/ui/src/CheatSheetOverlay.tsx`, `packages/ui/src/CommandPaletteModal.tsx`, `packages/ui/src/locales/*.ts`.
- **Tłumaczenia — etykiety komend + toasty skrótów** (2026-06-13)
  - `createCommandActions` przyjmuje opcjonalny `t`, więc etykiety akcji w Command Palette korzystają teraz z `commands.*` zamiast stałych angielskich stringów. Dotyczy elementów, edycji, widoku, kroków/playbacku i eksportu.
  - `useKeyboardShortcuts` używa `commands.toast.*` / `commands.confirm.*` dla toastów i potwierdzeń po skrótach klawiszowych: dodawanie elementów/sprzętu, undo/redo, copy/paste, vision/orientation, grid, zapis, print mode, animacja, edycja tekstu, resize/rotation, formacje i czyszczenie planszy.
  - Pliki: `apps/web/src/commands/commandPalette/createCommandActions.ts`, `apps/web/src/app/board/useBoardPageHandlers.ts`, `apps/web/src/hooks/useKeyboardShortcuts.ts`, `packages/ui/src/locales/*.ts`.
- **Tłumaczenia — główne modale i panele pomocy/projektów** (2026-06-13)
  - Dodane namespace'y `emptyState.*`, `auth.*`, `confirm.*`, `limits.*`, `folders.*`, `pricing.*`, `projects.*`, `help.*`, `tutorial.*` w `locales/{en,pl,es}.ts`.
  - Przetłumaczone: `EmptyStateOverlay`, `AuthModal`, `ConfirmModal`, `LimitReachedModal`, `CreateFolderModal`, `FolderOptionsModal`, `PricingModal`, najważniejszy chrome `ProjectsDrawer`, `HelpSidebar` oraz `TutorialOverlay` (teksty kroków, CTA, demo labels, aria-labels).
  - Pliki: `packages/ui/src/{EmptyStateOverlay,AuthModal,ConfirmModal,LimitReachedModal,CreateFolderModal,FolderOptionsModal,PricingModal,ProjectsDrawer,HelpSidebar,TutorialOverlay}.tsx`, `packages/ui/src/locales/*.ts`.
- **Tłumaczenia — dolny chrome, inspektor i panele narzędziowe** (2026-06-13)
  - Dodane namespace'y `bottomSteps.*`, `selection.*`, `teamsPanel.*`, `pitchPanel.*`, `zoom.*`, `offline.*`, `shortcutsHint.*`, `bottomSheet.*`, `smartBottom.*` oraz brakujące klucze `inspector.*`, `palette.*`, `cheatsheet.*`, `commands.add-freehand-draw`.
  - Przetłumaczone: `BottomStepsBar`, `FloatingHelpButton`, `SelectionToolbar`, `TeamsPanel`, `PitchPanel`, `ZoomWidget`, `OfflineBanner`, `ShortcutsHint`, `BottomSheet`, `SmartBottomBar`, `Footer`, `CheatSheetOverlay`, `CommandPaletteModal` i pozostałe widoczne etykiety/aria w `RightInspector`.
  - Pliki: `packages/ui/src/{BottomStepsBar,FloatingHelpButton,SelectionToolbar,TeamsPanel,PitchPanel,ZoomWidget,OfflineBanner,ShortcutsHint,BottomSheet,SmartBottomBar,Footer,CheatSheetOverlay,CommandPaletteModal,RightInspector}.tsx`, `packages/ui/src/locales/*.ts`.
- **Tłumaczenia — toasty aplikacji i store** (2026-06-13)
  - Dodane namespace'y `exportToast.*`, `billingToast.*`, `settingsToast.*`, `projectToast.*`, `appToast.*`, `storeToast.*` oraz nie-hookowy helper `translate()` dla Zustand store / usług poza Reactem.
  - Przetłumaczone toasty eksportu, billing portal, settings/account, projekty/foldery, payment return, login/dev login, limit kroków, menu kontekstowe planszy, zoom/online/offline/save retry oraz prompt zapisu pracy gościa do chmury.
  - Pliki: `apps/web/src/hooks/{useExportController,useBillingController,useSettingsController,useProjectsController}.ts`, `apps/web/src/app/AppShell.tsx`, `apps/web/src/app/routes/useBoardPageState.ts`, `apps/web/src/app/board/useBoardPageHandlers.ts`, `apps/web/src/store/{useUIStore,useAuthStore}.ts`, `packages/ui/src/i18n.tsx`, `packages/ui/src/locales/*.ts`.
- **Tłumaczenia — Settings, TopBar, Squad i legacy UI** (2026-06-13)
  - Rozszerzone namespace'y `topbar.*`, `settings.*`, `squadBench.*` i dodany `legacy.*`.
  - Przetłumaczone: `TopBar` (menu narzędzi, eksport, status zapisu, account menu), `SettingsModal` (profil, security, billing, preferences, squad, language/shortcuts/about/data), `SquadBench` (inline quick add, team switcher, aria/title/hinty) oraz legacy `Toolbar`/`RightPanel`.
  - Po audycie UI zostały tylko brandy/social aria, przykładowe placeholdery auth (`John Doe`, `you@example.com`) i literal `DELETE` w potwierdzeniu usunięcia konta.
  - Pliki: `packages/ui/src/{TopBar,SettingsModal,SquadBench,Toolbar,RightPanel}.tsx`, `packages/ui/src/locales/*.ts`.
- **Tłumaczenia — strony legal** (2026-06-14)
  - Dodany namespace `legal.*` w słownikach PL/EN/ES.
  - Przetłumaczone statyczne strony: Privacy Policy, Terms of Service i Cookie Policy wraz z listami, linkami, opisami usług oraz przyciskiem powrotu.
  - Pliki: `apps/web/src/pages/{PrivacyPolicy,TermsOfService,CookiePolicy}.tsx`, `packages/ui/src/locales/*.ts`.
- **Tłumaczenia — domknięcie audytu UI** (2026-06-14)
  - Placeholdery w `AuthModal` oraz aria-labels linków social w `Footer` przepięte na słowniki PL/EN/ES.
  - Po audycie hardcoded copy pozostały tylko brandy/nazwy usług i literal `DELETE` w potwierdzeniu usunięcia konta.
  - Pliki: `packages/ui/src/{AuthModal,Footer}.tsx`, `packages/ui/src/locales/*.ts`.
- **Settings — Editor defaults** (2026-06-14)
  - Preferences dostały sekcję **Editor defaults**: domyślny typ strzałki dla ogólnych akcji „Add Arrow" oraz domyślny czas kroku animacji.
  - Ustawienia są persistowane w `useUIStore`; domyślna strzałka działa w pustym stanie planszy, SmartBottomBar i menu kontekstowym.
  - Pliki: `apps/web/src/store/useUIStore.ts`, `apps/web/src/app/AppShell.tsx`, `apps/web/src/app/routes/useBoardPageState.ts`, `apps/web/src/app/board/{BoardPage,useBoardPageHandlers}.tsx`, `packages/ui/src/SettingsModal.tsx`, `packages/ui/src/locales/*.ts`.
- **Command Palette — Grid/Snap actions** (2026-06-14)
  - `toggle-grid` i `toggle-snap` w Command Palette wykonują teraz realne akcje zamiast pokazywać komunikat „coming soon".
  - Naprawiony odwrócony toast w Settings po przełączeniu widoczności siatki.
  - Pliki: `apps/web/src/commands/commandPalette/createCommandActions.ts`, `apps/web/src/app/board/useBoardPageHandlers.ts`, `apps/web/src/app/AppShell.tsx`, `packages/ui/src/locales/*.ts`.
- **Settings — Grid density** (2026-06-14)
  - Preferences dostały suwak gęstości siatki 5–40 px. Wartość jest persistowana w `useUIStore`, steruje renderem siatki boiska i snapowaniem nowych oraz przesuwanych elementów.
  - Pliki: `apps/web/src/store/useUIStore.ts`, `apps/web/src/app/routes/useBoardPageState.ts`, `apps/web/src/store/slices/elementsSlice.ts`, `apps/web/src/app/{AppShell,orchestrators/ModalOrchestrator}.tsx`, `packages/ui/src/SettingsModal.tsx`, `packages/ui/src/locales/*.ts`.
- **Command effects — add/update/group parity** (2026-06-14)
  - `board/effect.ts` obsługuje teraz parametry pozycji/rozmiaru/tekstu dla dodawania strzałek, stref, tekstu i sprzętu oraz realne `groupSelected`/`ungroupSelected` bez ostrzeżeń „not implemented".
  - Główne `createCommandRegistry()` podpina `animation.play/pause/stop` oraz `edit.cut/copy/paste` do istniejących store actions zamiast placeholderów.
  - Usunięty nieaktualny TODO Quick Edit z legacy hooka interakcji; inline edit numeru zawodnika pozostaje podpięty przez `BoardPage` i `BoardOverlays`.
  - Pliki: `apps/web/src/commands/{registry,types}.ts`, `apps/web/src/commands/board/effect.ts`, `apps/web/src/hooks/useCanvasInteraction.ts`.
- **Tłumaczenia — auth store error states** (2026-06-14)
  - Stałe angielskie komunikaty błędów w `useAuthStore` zamienione na sentinel-klucze (`auth.errorInitFailed`, `auth.errorOfflineMode`); `AuthModal` tłumaczy je przy renderze, dynamiczne błędy Supabase przechodzą bez zmian.
  - Pliki: `apps/web/src/store/useAuthStore.ts`, `packages/ui/src/AuthModal.tsx`, `packages/ui/src/locales/*.ts`.
- **Polityka i18n — agenci + docs** (2026-06-14)
  - Skodyfikowana reguła „każdy user-facing tekst w 3 językach (en/pl/es)" jako binding Hard Rule w `docs/SYSTEM_ARCHITECTURE.md` §11 Tier 1; operacyjna checklista + komendy w skillu `ui-delivery`.
  - Odwołania dodane w agentach MasterAutopilot (zasady nadrzędne, DoD, MasterVerifier), Implementer i Delivery oraz w skillu `docs-update`.
  - Pliki: `docs/SYSTEM_ARCHITECTURE.md`, `.github/skills/{ui-delivery,docs-update}/SKILL.md`, `.github/agents/{master-autopilot,implementer,delivery}.md`.
- **Squad Bench redesign — visual polish + 4 teams + quick-add + usuwanie** (2026-06-13)
  - **Export 100% resolution fix**: Dynamiczny `pixelRatio` dla wszystkich formatów (PNG, JPG, PDF, GIF) — `Math.max(2, Math.ceil(canvasWidth / stageW))`. Full board resolution niezależnie od zoomu.
  - **Squad Bench redesign**: Circle glyph zamiast team shapes (identycznie jak na boisku), `DEFAULT_TEAM_SETTINGS` jako SSOT kolorów, `animate-fade-in` z kaskadowym `animation-delay`, hover glow (`shadow-[0_0_10px_rgba(46,230,166,0.25)]`), badge count per team section, `max-w-[85px]` zamiast 60px (naprawione obcinanie imion).
  - **1 team visible + team switcher**: Zamiast 4 drużyn naraz — dropdown z kolorowym badge + nazwą + count, kropki do szybkiego skoku.
  - **Inline quick-add**: Kliknięcie pustego slota `+` otwiera formularz (name + number), Enter zatwierdza, Escape anuluje. Bez nawigacji do Settings.
  - **Usuwanie zawodnika**: Czerwony X w kółku na hover (top-right corner) w Squad Bench.
  - **4 teams**: Settings → Squad select z Team 1/2/3/4, kolorowe badge dla team3/team4.
  - **Free/Premium limity**: Free max 5 (reszta locked + kłódka), Premium 25/team.
  - **isDirty fix**: Wszystkie akcje squad wołają `get().markDirty()` zamiast ręcznego `set({ isDirty: true })` — autozapis (i localStorage persistence) działa poprawnie.
  - **TopBar CTA**: PlayersMenu → "Preset your squad — Easy drag & drop onto the pitch".
  - **Unifikacja typu**: `SquadPlayerItem` + `SquadPlayerSettings` → jeden `SquadPlayer` z `@tmc/core`.
  - Pliki: `packages/ui/src/SquadBench.tsx`, `packages/ui/src/SettingsModal.tsx`, `packages/ui/src/TopBar.tsx`, `packages/ui/src/index.ts`, `apps/web/src/app/board/BoardPage.tsx`, `apps/web/src/app/board/BoardTopBarSection.tsx`, `apps/web/src/hooks/useExportController.ts`, `apps/web/src/store/slices/documentSlice.ts`.
- **Docs update — Squad Bench w FEATURE_SPEC + DESIGN_SYSTEM** (2026-06-13)
  - `docs/FEATURE_SPEC.md` — nowa sekcja §1.9 Squad Bench + ToC update.
  - `docs/DESIGN_SYSTEM.md` — SquadBench w tabeli Navigation & Layout.
  - Pliki: `docs/FEATURE_SPEC.md`, `docs/DESIGN_SYSTEM.md`.

## [0.5.0] - 2026-06-13

### Added
- **Squad Bench — predefined player roster (Pro/Club Premium)** (2026-06-13)
  - Nowe typy `SquadPlayer`, `DEFAULT_SQUAD` w `packages/core/src/types.ts`
  - `createSquadPlayer()`, `generateSquadId()` w `packages/core/src/board.ts`
  - Pola `squad` i `squadVisible` w `BoardDocument` — serializacja/wczytywanie
  - Store: `addSquadPlayer`, `removeSquadPlayer`, `updateSquadPlayer`, `setSquad`, `setSquadVisible`, `toggleSquadVisible` w `documentSlice.ts`
  - `addPlayerFromSquad(team, name, number)` w `elementsSlice.ts` — tworzy zawodnika z label + numer
  - `SquadBench` — komponent pod boiskiem z zawodnikami home/away, przeciąganie na płytę, gear icon → settings, hide/show toggle
  - Settings → Squad — edytor rosteru: dodawanie (name, number, team), lista z usuwaniem, toggle "Show on board", blokada dla Free z CTA upgrade
  - Drag & drop z SquadBench na canvas — drop handler w BoardPage
  - Premium gating — squad widoczny tylko dla Pro/Club Premium
  - **Fix widoczności:** SquadBench zawsze renderowany, 3 stany: empty (CTA do Settings), lista zablokowana dla Free, lista aktywna dla Pro. Domyślnie `squadVisible: true`
  - Zmodyfikowane pliki: `packages/core/src/types.ts`, `packages/core/src/board.ts`, `packages/core/src/serialization.ts`, `apps/web/src/store/slices/documentSlice.ts`, `apps/web/src/store/slices/elementsSlice.ts`, `apps/web/src/app/routes/useBoardPageState.ts`, `apps/web/src/app/board/BoardPage.tsx`, `apps/web/src/app/AppShell.tsx`, `apps/web/src/app/orchestrators/ModalOrchestrator.tsx`, `packages/ui/src/SettingsModal.tsx`, `packages/ui/src/SquadBench.tsx`, `packages/ui/src/index.ts`
  - **Progress bar w SmartBottomBar** — mini pasek postępu nad step counterem, płynna animacja podczas playbacku
- **Testy useAnimationPlayback** — 11 testów dla easing + logiki playbacku (loop, pause, next step)
- **Cone family — 3 warianty** (Disc marker, Cone, Tall cone)
  - `cone.tsx`: flat (dome/marker), standard (classic cone), tall (slalom) — każdy z base plate, reflective stripes
  - `MiniEquipmentGlyph`: unikalne SVG glyphs dla każdego wariantu w TopBar
  - `EQUIPMENT_ITEMS` w TopBar: Disc marker (Alt+K), Cone (K), Tall cone
  - `useKeyboardShortcuts`: Alt+K → flat disc marker (wzór Z/Shift+Z/Alt+Z)
  - `hitBounds.ts`: per-variant bounds (flat: apex y=-14, standard: apex y=-44, tall: apex y=-62)
  - Skrót `ToolShortcut` ukryty gdy pusty (brak shortcut dla tall cone)
- **Export dropdown w TopBar** (2026-06-13)
  - Pojedynczy przycisk Export zastąpiony rozwijanym menu: PNG (⌘E), PNG all steps (⇧⌘E), JPG, PDF⭐ (⇧⌘P), GIF⭐ (⇧⌘G)
  - Export JPG: biała płachta, quality 0.92 (darmowy)
  - PDF i GIF oznaczone gwiazdką Pro, zablokowane dla Guest/Free → PricingModal
  - Nowy kontrakt `onExport(format)` zamiast `onExport()`
  - `exportJPG()` w exportUtils + ExportService + useExportController
- **SmartBottomBar** (2026-06-13)
  - Nowy kontekstualny bottom bar z 3 trybami: empty (quick actions), editing (undo/redo), animation (playback + step chips)
  - Undo/Redo zawsze widoczne w bottom barze
  - Bottom bar nie znika gdy animacja wyłączona
  - Zero zbędnych linków (github, stopka)
- **First Impression UX** (2026-06-13)
  - Animated Formation Preview w EmptyStateOverlay — animowana formacja 4-3-3 w tle
  - Celebration Confetti — subtelny efekt confetti przy pierwszym dodaniu elementu
  - `@keyframes confettiDrop` w index.css
- **Sprint F: Coach Tour onboarding + tutorial restart polish** (2026-06-12)
  - Prosty 5-step tooltip zastąpiony 6-krokowym **Coach Tour** dla first experience: shortcuts, Inspector/PPM, orientacja/vision, sprzęt treningowy, export, Pro/more options.
  - Tutorial ma spotlight na realnych elementach UI, animowaną strzałkę, target label, progress, keycaps, mini-demo dla każdego kroku oraz Back/Next/Skip.
  - `replayTutorial()` z Help Sidebar wymusza ponowne pokazanie tutoriala nawet na domyślnej tablicy z gotową formacją.
  - Usunięto warunek `elements.length === 0`; pierwszy onboarding działa dla nowego gościa na realnym startowym stanie boardu.
  - Dodano stabilne kotwice `data-tour` w TopBar i RightInspector (`shortcuts`, `inspector`, `export`, `premium`).
  - Zweryfikowano: `packages/ui` typecheck, `apps/web` typecheck, `apps/web` vitest (99/99), manual desktop + mobile viewport w przeglądarce.
- **Sprint A: Quick wins UX + podpisy zawodników + Enter→edit** (2026-06-10)
  - **aria-label** na przyciskach Zoom In, Zoom Out, Fit w `ZoomWidget.tsx`
  - **Toasty undo/redo**: "Cofnięto" (Ctrl+Z) i "Przywrócono" (Ctrl+Shift+Z)
  - **Kursory wg narzędzia**: crosshair dla draw tools, text dla text tool
  - **Podpisy zawodników**: domyślnie brak podpisu, `showLabel===true` = podpis pod zawodnikiem w pill z tłem i cieniem. Numer osobno na ciele. Dynamiczna szerokość pilla (długie nazwiska bez ucinania)
  - **Enter→focus label**: Enter na zaznaczonym zawodniku focusuje pole "Player Label" w RightInspector
  - **Enter/Escape w inpucie label**: Enter→blur (zatwierdzenie), Escape→blur
  - **Etykiety UI**: "Player Label" (zamiast "Position Label"), "Show Label Below" (zamiast "Show Label Inside"), `aria-label="Player label"` na inpucie
  - Zmodyfikowane pliki: `packages/ui/src/ZoomWidget.tsx`, `apps/web/src/hooks/useKeyboardShortcuts.ts`, `apps/web/src/app/board/BoardCanvasSection.tsx`, `packages/board/src/PlayerNode.tsx`, `packages/ui/src/RightInspector.tsx`, `apps/web/src/app/routes/useBoardPageState.ts`, `apps/web/src/app/board/BoardPage.tsx`
  - Raporty: `thoughts/2026-06-10/1800_delivery_sprintA-implementation.md`, `thoughts/2026-06-10/1815_delivery_sprintA-player-labels-polish.md`, `thoughts/2026-06-10/1830_delivery_sprintA-enter-edit-label.md`
- **Inspector UX: arrow controls + duplikacja fix + przycisk toggle** (2026-06-10)
  - **Arrow Numbering** w PropsTab: Show number toggle, Number input, Auto-number arrows toggle, Renumber arrows button
  - Kontrolki delegują do `toggleArrowNumber`, `setArrowNumber`, `toggleAutoNumbering`, `renumberAllArrows`
  - **Fix duplikacji**: breakpoint `lg` (1024-1280px) miał osobny floating overlay — teraz wszystkie breakpointy <xl używają FAB + BottomSheet
  - **Przycisk toggle**: floating akcentowy przycisk na xl gdy sidebar zamknięty (+ aria-label)
  - Zmodyfikowane pliki: `packages/ui/src/RightInspector.tsx`, `apps/web/src/app/routes/useBoardPageState.ts`, `apps/web/src/app/board/useBoardPageHandlers.ts`, `apps/web/src/app/board/BoardPage.tsx`
  - Pełna dokumentacja: `thoughts/2026-06-10/1826_delivery_inspector-ux-fix.md`
- **Sprint C: renumberAllArrows — numeracja strzałek bez dziur + undo** (2026-06-10)
  - `renumberAllArrows()` w elementsSlice — przypisuje numery 1..N w kolejności insertion, NIE woła pushHistory
  - `deleteSelected` — usuwa, renumber (jeśli usunięto numerowaną strzałkę), JEDEN pushHistory
  - `toggleAutoNumbering` — naprawiony: dodano pushHistory + warunek `if (wasOff) renumberAllArrows()`
  - Fix błędu #1 z planu: warunek `!current && !newVal` → `if (wasOff)`
  - Fix błędu #3 z planu: podwójny pushHistory — renumberAllArrows nie woła pushHistory
  - 25 testów (14 jednostkowych + 11 integracyjnych na realnym store) — wszystkie ✅
  - Zmodyfikowane pliki: `apps/web/src/store/slices/elementsSlice.ts`, `apps/web/src/store/slices/documentSlice.ts`, `apps/web/src/store/slices/__tests__/arrowRenumber.test.ts`, `apps/web/src/store/slices/__tests__/arrowRenumber.integration.test.ts`
  - Pełna dokumentacja: `thoughts/2026-06-10/1705_delivery_sprint-C-arrow-renumber-undo.md`, `thoughts/2026-06-10/1725_delivery_sprint-C-verification-fix.md`
- **Konfiguracja vitest + test setup** (2026-06-10)
  - `vitest` dodany do devDependencies web app
  - `vite.config.ts`: test config (environment: node, setupFiles)
  - `src/test-setup.ts`: mocki localStorage, logger, supabase
  - Skrypt `pnpm --filter @tmc/web test` działa
  - Zmodyfikowane pliki: `apps/web/vite.config.ts`, `apps/web/src/test-setup.ts`, `apps/web/package.json`
  - Plain `+`/`=` → zoomIn, plain `-` → zoomOut
  - Działają tylko gdy nie zaznaczono sprzętu (sprzęt ma priorytet scale)
  - Respektują `viewportLocked` — gdy zablokowane, skróty nie działają
  - CheatSheet zaktualizowany: Zoom In (+), Zoom Out (-) w zakładce View
- **Auto-scale-down na resize okna** (2026-06-09)
  - ResizeObserver z prostym porównaniem `curZoom > newFitZoom`
  - Przy overflow: setZoom do fitZoom + wycentrowanie pana
  - Działa nawet gdy viewportLocked (boiska nie może uciąć resize)
- **Poprawiona struktura DOM flex (min-w-0, absolute inset-0)** (2026-06-09)
  - `BoardPage.tsx`: canvas wrapper `min-w-0 min-h-0 overflow-hidden` — pozwala flex childowi faktycznie się kurczyć
  - `BoardCanvasSection.tsx`: containerRef `absolute inset-0 overflow-hidden` — odseparowuje Konvę od layoutu
  - `CanvasShell.tsx`: usunięto `aspect-[4/3]`, zastąpiono `w-full h-full`
- **System numeracji strzałek (PR-ARROW-NUMBER)** (2026-06-09)
  - Nowe opcjonalne pola `number` i `showNumber` w `ArrowElement` (`packages/core`)
  - Tryb **Auto-Numbering Mode** (`Shift+N`) — każda nowa strzałka przez drag dostaje kolejny numer
  - **One-shot auto-number** (`Shift+A` / `Shift+R`) — aktywuje narzędzie + flagę, numer nadawany post-draw
  - **Smart Sequencing** — `→` (ArrowRight) na zaznaczonej strzałce przełącza numer z auto-inkrementacją
  - **Discard threshold 20px** — krótkie kliknięcia nie marnują numeru sekwencji
  - Globalny stan `isAutoNumbering` w `documentSlice`, flaga `nextArrowShouldBeNumbered` w `drawingSlice`
  - Menu kontekstowe: przełącznik "Auto-numeracja: ON/OFF", "Dodaj/Edytuj numer" → Smart Sequencing
  - Renderowanie numerka na środku strzałki (okrąg + biały tekst, `ArrowNode.tsx`)
  - Skróty w `CheatSheetOverlay` + pełna dokumentacja w `FEATURE_SPEC.md` (sekcja 1.4.6)
  - Zmodyfikowane pliki: `packages/core/src/types.ts`, `packages/core/src/board.ts`, `packages/board/src/ArrowNode.tsx`, `packages/ui/src/CheatSheetOverlay.tsx`, `apps/web/src/store/slices/drawingSlice.ts`, `apps/web/src/store/slices/elementsSlice.ts`, `apps/web/src/store/slices/documentSlice.ts`, `apps/web/src/hooks/useKeyboardShortcuts.ts`, `apps/web/src/utils/canvasContextMenu.ts`, `apps/web/src/app/board/useBoardPageHandlers.ts`, `apps/web/src/app/board/BoardPage.tsx`, `apps/web/src/app/routes/useBoardPageState.ts`, `docs/FEATURE_SPEC.md`

### Changed
- **Fix outdated komentarz w entitlements.ts** — gating jest już zintegrowany (PR-MON-EXPORT, PROJECT-LIMITS, STEP-LIMITS)
- **SettingsModal → design tokeny** — `bg-surface`, `text-text`, `text-muted`, `bg-accent`, `border-border` zamiast hardcoded kolorów
- **Refaktor `createPlayer`** — options-based, brak numeru dla pojedynczego zawodnika (2026-06-09)
  - `createPlayer` zmienione na `options`-based (`CreatePlayerOptions`) — `number` stał się opcjonalny
  - Domyślnie `number: undefined` → zawodnik tworzony skrótem **P** nie ma numeru
  - `isGoalkeeper: false` domyślnie, z backward-compat w renderze (stare projekty → `number === 1`)
  - Nowa sekcja `playerDefaults` w `BoardDocument` z flagą `autoNumber` (domyślnie `false`)
  - **Formacje** (`applyFormation`) zawsze nadają numery 1-11 z definicji — niezależnie od `autoNumber`
  - Nowe akcje w `documentSlice`: `updatePlayerDefaults()`, `getPlayerDefaults()`
  - Priorytetowa detekcja GK w `PlayerNode.tsx`: `flag !== undefined ? flag : number === 1`
  - Zmodyfikowane pliki: `packages/core/src/board.ts`, `packages/core/src/types.ts`, `packages/core/src/serialization.ts`, `packages/board/src/PlayerNode.tsx`, `apps/web/src/store/slices/elementsSlice.ts`, `apps/web/src/store/slices/documentSlice.ts`, `apps/web/src/store/slices/__tests__/vision.logic.test.ts`, `docs/PLAYER_CREATION_AND_PREFS_AUDIT.md`
- **Aktualizacja domyślnych stylów wizualnych elementów** (2026-06-09)
  - **Text:** fontSize zmienione z 18 → 22, dodany domyślny backgroundColor `#ef4444` (czerwony)
  - **Arrow:** pass → `#1a1a1a` (ciemnoszary), run → `#f97316` (pomarańczowy), shoot → `#ef4444` (bez zmian, poprawiono dokumentację)
  - **Equipment:** ladder → `#eab308` (żółty), hurdle → `#4a4a4a` (ciemnoszary), goal → `#ffffff` (bez zmian)
  - Zmodyfikowane pliki: `packages/core/src/board.ts`, `packages/board/src/ArrowNode.tsx`, `packages/board/src/EquipmentNode.tsx` (komentarz), `docs/FEATURE_SPEC.md`
- **Refaktor Ball: SSOT kolorów piłki** (2026-06-09)
  - Rozszerzono typ `BallElement` o pola `color`, `strokeColor`, `strokeWidth`
  - Fabryka `createBall()` ustawia teraz domyślne wartości wizualne (`#ffffff`, `#1a1a1a`, `2`)
  - `BallNode.tsx` czyta kolory z elementu zamiast hardcoded w JSX — pełna personalizacja przez Inspector
  - Zmodyfikowane pliki: `packages/core/src/types.ts`, `packages/core/src/board.ts`, `packages/board/src/BallNode.tsx`
- **Refaktor Drawing: fabryka `createDrawing()`** (2026-06-09)
  - Utworzono `createDrawing(type, points)` w `packages/core/src/board.ts` — spójna fabryka z `DRAWING_DEFAULTS`
  - Zastąpiono inline'ową konstrukcję w `elementsSlice.ts` wywołaniem fabryki
  - Zmodyfikowane pliki: `packages/core/src/board.ts`, `apps/web/src/store/slices/elementsSlice.ts`
- **Print Friendly (W): full B/W sanitization** (2026-06-09)
  - **ArrowNode.tsx**: dodano `isPrintMode` do propsów. W trybie druku wszystkie strzałki renderują się na czarno (`#000000`), shoot ma 1.5× grubszą linię dla rozróżnienia
  - **TextNode.tsx**: `sanitizeTextColor()` zamienia TERAZ wszystkie kolory na czarny (nie tylko white). `backgroundColor` i shadow są wyłączone w print mode
  - **EquipmentNode.tsx**: `sanitizeForPrint()` zamienia WSZYSTKIE kolory na czarny (nie tylko white/yellow) — czysty B/W output
  - Propagacja `isPrintMode` → `ArrowNode` przez `CanvasElements.tsx` i `ArrowsLayer.tsx`
  - Zmodyfikowane pliki: `packages/board/src/ArrowNode.tsx`, `packages/board/src/TextNode.tsx`, `packages/board/src/EquipmentNode.tsx`, `apps/web/src/app/board/canvas/CanvasElements.tsx`, `apps/web/src/components/Canvas/layers/ArrowsLayer.tsx`

### Changed (Internal)
- **Audyt wydajności `useBoardPageState`** (2026-06-09)
  - **Etap 1 — Reaktywność stanu pochodnego:** `selectedElement`, `canUndo`/`canRedo`, `stepsData` przepisane na reaktywne selektory + `useMemo` zamiast wywoływania getterów w renderze. `playerOrientationSettings` stabilnie zmemoizowane z surowego `document.playerOrientationSettings`.
  - **Etap 2 — Stabilizacja pętli animacji:** `getCurrentStepIndex`/`getStepsCount` owinięte w `useCallback([])` w `useBoardPageEffects.ts`, eliminując restart RAF przy każdym renderze.
  - **Etap 3 — Twardy guard `ANIMATION_ENABLED`:** `useAnimationPlayback` nie startuje pętli ani nie wywołuje `setAnimationProgress`, gdy flaga `VITE_ANIMATION_ENABLED` jest wyłączona.
  - **Etap 4 — Higiena:** `exhaustive-deps` w efekcie post-mount inspector; mechanizm abort w `exportAllSteps`; usunięte 8 martwych handlerów z `useBoardPageState` (duplikatów z `useBoardPageHandlers`); usunięty alias `effectiveZoom`; poprawione rzutowanie typu `InspectorElement` dla arrow.
  - Zmodyfikowane pliki: `useBoardPageState.ts`, `useBoardPageEffects.ts`, `useAnimationPlayback.ts`, `useExportController.ts`, `useBoardPageHandlers.ts`.

### Added
- **ALT+Drag Player Rotation** (2026-02-21)
  - Rotate players by holding ALT and dragging with mouse
  - Works from both player body and vision cone area
  - Default snap: 5° (coarse adjustments), SHIFT+ALT: 1° (fine precision)
  - **Multi-selection support**: When multiple players selected, ALT+drag rotates all by same delta
  - Single history entry per gesture for clean undo/redo
  - Crosshair cursor for visual feedback
  - Works with all player shapes (circle/triangle/square/diamond)
  - Maintains relative orientations between players during group rotation

## [0.2.2] - 2026-02-20

### Fixed
- **Player Vision System** - Vision now correctly defaults to OFF via normalization (`undefined` → `false` opt-in). Global and per-player vision settings work deterministically. Vision is not zoom-gated (always visible when enabled).
- **Shift+V Keyboard Shortcut** - Deterministic all-players toggle: if ANY player has vision OFF → turn all ON, otherwise turn all OFF. Toast shows player count.
- **Player Orientation** - Fixed portrait flip transform bug: players now default to `orientation: 0` (north), preventing NaN issues. Orientation transforms correctly on landscape/portrait rotation.
- **Player Arms Rendering** - Arms now render ABOVE body (not behind), making them visible on all player shapes including circles (previously hidden by circle fill).
- **Player Number Rotation** - Numbers always stay readable with 180° flip when player is upside-down.
- **Arrow Colors** - Pass/Run arrows now white (#ffffff), Shoot arrows red (#ef4444).
- **Shot Arrow Rendering** - Professional arrowhead with proper unit vector geometry, fill-only rendering (no stroke), shafts stop cleanly at base, larger dimensions (18×12px), smooth caps and consistent hitbox.
- **Zone Default Color** - Changed from green (#22c55e) to red (#ef4444).

### Added
- Comprehensive unit tests for vision toggle logic and orientation transforms
- Release documentation: `docs/releases/0.2.2-vision-orientation-arrows.md`

### Added
- **PR-L5-MINI: Offline/Online UX** (2026-02-09)
  - Online/offline detection using window events
  - TopBar save status indicator showing: Offline (red) / Saving... (blue) / Saved (green) / Unsaved (orange)
  - Non-blocking offline banner at top of screen
  - Smart cloud save that skips attempts when offline
  - Rate-limited save failure toasts (max once per 5 seconds)

### Improved
- **H3: ConfirmModal Component** (2026-02-09)
  - Replaced all `window.confirm()` calls with custom modal component
  - Full keyboard navigation: ESC (cancel), ENTER (confirm), Tab (focus trap)
  - Smart focus management: danger actions focus Cancel by default (safer)
  - Double-click protection with loading states
  - Focus returns to previous element after close
  - Mobile-friendly and accessible
  - Concrete copy with specific consequences (no generic "Are you sure?")

## [0.2.1] - 2026-02-04

### Changed
- **Mannequin PTU-style redesign** - Training mannequin redesigned with "Pro Training Unit" aesthetics:
  - Trapezoidal torso with equipment-like feel
  - 4 thin leg rods instead of solid block
  - Elliptical head shape
  - Base plate at ground level (rotation pivot)
  - New variant: `wall_3` (3 mannequins in a row)
- **Mannequin default color** - Changed from blue (#1e40af) to yellow (#fbbf24)
- **Print mode color handling** - Yellow equipment (mannequin/ladder) auto-converts to black for better paper visibility. Custom colors are preserved in both modes.

### Added
- Equipment variant `wall_3` for mannequin (3 mannequins with shared base)

## [0.2.0] - 2026-01-31

### Fixed
- **Zone orientation rotation bug** - Fixed coordinate transformation during pitch orientation toggle. Zones and other elements now maintain correct positions when switching between landscape/portrait modes. The issue was caused by incorrectly subtracting padding twice from inner pitch dimensions.
- **Formation presets in portrait mode** - Formation presets (1-6 shortcuts) now correctly position players when pitch is in portrait orientation. Goals appear at top/bottom instead of incorrectly at left/right.

### Changed
- Updated `getAbsolutePositions()` in formations.ts to accept orientation parameter
- Updated `applyFormation()` in elementsSlice.ts to use current pitch orientation
- Improved coordinate transformation logic in documentSlice.ts

## [0.1.0] - 2026-01-27

### Added
- Initial release of TMC Studio tactical board
- Player, ball, arrow, zone, text, equipment elements
- Multi-step animation system with playback
- Formation presets (4-3-3, 4-4-2, 4-4-2 diamond, 4-2-3-1, 3-5-2, 5-3-2)
- Pitch orientation toggle (landscape/portrait)
- Pitch themes (grass, indoor, chalk, futsal, custom)
- Layer visibility controls
- Keyboard shortcuts for all actions
- Export to PNG, PDF, GIF
- Cloud sync with Supabase
- Free and Pro tiers with Stripe integration
- Dark/light theme support

[Unreleased]: https://github.com/kryrub3120/TMC_Studio/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/kryrub3120/TMC_Studio/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/kryrub3120/TMC_Studio/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/kryrub3120/TMC_Studio/releases/tag/v0.5.0
[0.2.2]: https://github.com/kryrub3120/TMC_Studio/releases/tag/v0.2.2
[0.2.1]: https://github.com/kryrub3120/TMC_Studio/releases/tag/v0.2.1
[0.2.0]: https://github.com/kryrub3120/TMC_Studio/releases/tag/v0.2.0
[0.1.0]: https://github.com/kryrub3120/TMC_Studio/releases/tag/v0.1.0
