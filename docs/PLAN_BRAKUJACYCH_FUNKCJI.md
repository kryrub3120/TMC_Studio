# TMC Studio — Plan brakujących funkcji po aktualnych sprintach (v2)

**Data:** 2026-06-10
**Status:** Plan po korekcie — czeka na zatwierdzenie (APPROVE PLAN / CHANGE PLAN / STOP)
**Bazowany na:** `docs/IMPLEMENTATION_PLAN_SPRINTS.md`, `docs/AUDIT_COMPREHENSIVE_2026_06_10.md`, `docs/FEATURE_STATUS.md`, `docs/SYSTEM_ARCHITECTURE.md`

---

## Executive Summary

Po wdrożeniu aktualnych sprintów (A–D3) i poniższych zmian użytkownik zyska:

1. **Security foundation** — blokery B1–B3 załatane (post-logout data leak, RLS na `project_shares`, RLS na `profiles`).
2. **Usprawniony panel zapisu** — lista projektów z sortowaniem, stanami saving/saved/error/offline, tworzeniem/zmianą nazwy/usuwaniem z potwierdzeniem, autozapis z throttled thumbnailem.
3. **Prawy sidebar z pomocą** — duży, pływający przycisk otwiera nieblokujący panel ze skrótami, wskazówkami i statusem zapisu.
4. **Tutorial strzałkowy 5 kroków w 20s** — szybkie wprowadzenie dla nowych użytkowników.
5. **Premium Club** (oddzielny epik) — Club Premium z zarządzaniem dostępami przez admina.

Łączny szacowany czas core: **14–21h** (Sprint 0 + A verification + G + E + F).
Premium Club to osobny epik z własnym harmonogramem, poprzedzony Stripe QA.

---

## Założenia i ograniczenia

### Dev vs Prod
- Wszystkie zmiany tylko na Dev (localhost). Produkcja (Netlify + hosted Supabase) — NIETKNIĘTA.
- Migracje DB testowane lokalnie przez `supabase db reset`. Produkcyjne migracje wykonuje tylko użytkownik po zatwierdzeniu.

### MVP
- Każda funkcja w minimalnej wersji działającej. Zero over-engineeringu.
- Preferowane wykorzystanie istniejących komponentów (`packages/ui/`), hooków i store'ów.
- Zero nowych bibliotek/dependency bez zgody użytkownika.

### Poza zakresem tego planu
- Blokery B1–B3 (Post-logout data leak, RLS na project_shares, RLS na profiles/folders) — **osobny Sprint 0**, zrobiony PRZED tymi sprintami. Plan: `PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md`.
- Pełna kalibracja touch (Issue #4 w audycji) — tylko placeholder w Sprint D4 planu bazowego.
- Animacje S2 (onion skin, step thumbnails, drag reorder steps) — osobny plan w `ROADMAP.md`.
- Migracja do CommandRegistry (cmd.*) dla wszystkich akcji — osobny refaktor.
- E2E tests — osobny temat po betcie.
- **Premium Team Setup** — osobny Epik H, realizowany po betcie i po Stripe QA.

### Wymaga potwierdzenia w kodzie
- Czy `packages/ui/src/ProjectsDrawer.tsx` ma już wszystkie props do inline rename i pinned section (L1). Są oznaczone jako `// TODO`.
- Czy `packages/ui/src/RightInspector.tsx` ma responsywny drawer (Sprint 2A UX planu). Stan niepotwierdzony.
- Czy istniejący `ShortcutsHint.tsx` da się rozszerzyć o przycisk "pokazujący skróty", czy trzeba osobny komponent.
- Dokładna struktura tabel Supabase dla `profiles` — czy jest pole `subscription_tier` i `team_id`.

---

## Zależności od aktualnych sprintów

### Sprint A — Quick Wins + podpisy zawodników
- **Zawiera:** cursor states, aria-label, toast dla redo, font-size labeli, **podpisy zawodników** (domyślnie wyłączone, tło pod spodem, skalowanie z zoomem).
- **Status:** Podpisy zawodników są już w zakresie Sprint A. **Nie planuję ich ponownie.**
- **Regresje do sprawdzenia w nowych sprintach:**
  - **Save/load (Sprint G):** zapis i odczyt projektu nie może gubić ustawienia `showLabel` per-player. Test: zapisz projekt z włączonym label na wybranych zawodnikach → odczytaj → label wciąż widoczny na tych samych zawodnikach.
  - **Sidebar (Sprint E):** HelpSidebar (po prawej) nie może nachodzić na podpisy zawodników (które są poniżej zawodników na canvasie). Ponieważ sidebar jest fixed po prawej, a canvas scrolluje/zoomuje, ryzyko jest niskie — ale testować.
  - **Tutorial (Sprint F):** tooltipy tutoriala nie mogą zasłaniać podpisów. Tooltipy są pozycjonowane względem targetów (np. toolbar, BottomStepsBar), nie względem zawodników — ryzyko minimalne.
  - **Premium (Epik H):** w przyszłości Club Premium może mieć domyślne label presets (np. "pokaż nazwiska dla wszystkich"). Nie jest to część Sprint A ani obecnego planu — notatka na przyszłość.
- **Co można robić równolegle:** Nowe sprinty (E–H) są niezależne od kodu Sprint A, ale uwzględniają powyższe regresje.

### Sprint B — Rączki/Transformer POC ✅ ZROBIONE (2026-06-10)
- **Zawiera:** Transformer dla TextNode (POC). Tylko TextNode — zgodnie z zakresem.
- **Status:** ✅ Zakończony. Działa przez `stage.findOne('#id')` w `CanvasElements.tsx`.
- **Poza zakresem (celowo):** ZoneNode (ma własny resize), PlayerNode (ma ALT+drag), ArrowNode (ma endpoint handles).
- **Zależność dla nowych sprintów:** Brak. Transformer nie koliduje z sidebar/tutorial/panel zapisu/premium.
- **Co można robić równolegle:** Wszystko. Sprint B modyfikuje `CanvasElements.tsx` — nowe sprinty go nie dotykają.

### Sprint C — Numeracja strzałek + undo ✅ ZROBIONE (2026-06-10)
- **Zawiera:** `renumberAllArrows()`, `deleteSelected` z undo, `toggleAutoNumbering`.
- **Status:** ✅ Zakończony. 25 testów (14 jednostkowych + 11 integracyjnych).
- **Zależność dla nowych sprintów:** Brak. Numeracja strzałek to osobna domena.
- **Co można robić równolegle:** Wszystko. Sprint C modyfikuje `elementsSlice.ts` i `ArrowNode.tsx` — nowe sprinty ich nie dotykają.

### Sprint D3 — Auto-expand canvasa
- **Zawiera:** `userHasManuallyZoomed`, auto-expand w ResizeObserver.
- **Zależność dla nowych sprintów:** Tutorial (Sprint F) musi uwzględniać że canvas może się auto-expandować — tooltipy nie mogą "uciekać" z pozycją.
- **Co można robić równolegle:** Sprint F musi być po D3 lub uwzględniać to w implementacji. Reszta bez zależności.

### Matryca potencjalnych konfliktów plików

Poniższa tabela pokazuje które pliki są współdzielone między sprintami E, G, F, oraz z istniejącym Sprintem A.

| Plik | Sprint A | Sprint E | Sprint G | Sprint F | Uwagi |
|------|----------|----------|----------|----------|-------|
| `useUIStore.ts` | ✅ dodaje stany | ✅ dodaje `helpSidebarOpen` | ✅ dodaje `projectSaveStatus` | ✅ dodaje `tutorialCompleted` | **KONFLIKT** — wszystkie sprinty modyfikują. Rób sekwencyjnie lub scalaj ręcznie. |
| `CanvasShell.tsx` / `BoardPage.tsx` | — | ✅ render FloatingButton + HelpSidebar | — | ✅ render TutorialOverlay | **KONFLIKT** — E i F dodają overlay. Rób E → F (oba w CanvasShell). |
| `TopBar.tsx` | — | — | ✅ przycisk "Moje projekty" | — | E i G mogą kolidować jeśli oba dodają przyciski w TopBar. |
| `ProjectsDrawer.tsx` | — | — | ✅ główny zakres zmian | — | Tylko G. |
| `AutosaveService.ts` | — | — | ✅ thumbnail + throttling | — | Tylko G. |
| `RightInspector.tsx` | — | ⚠️ potencjalny konflikt z-index | — | — | HelpSidebar i RightInspector są po prawej stronie — konflikt z-index i układu. |
| `packages/board/src/*.tsx` | ✅ cursor, podpisy | — | — | — | Tylko A. |
| `PlayerNode.tsx` | ✅ podpisy | — | — | — | Tylko A. |
| `elementsSlice.ts` | — | — | — | — | Nietknięty przez E–H. |
| `ArrowNode.tsx` | — | — | — | — | Nietknięty przez E–H. |

**Wniosek:** Sprint G (Save Panel) i Sprint E (Sidebar) NIE są w pełni niezależne — oba modyfikują `useUIStore.ts` i potencjalnie `TopBar.tsx`. Zalecana kolejność: G → E, z ręcznym scaleniem `useUIStore.ts`.

---

## Proponowana kolejność

| Sprint/Epik | Nazwa | Priorytet | Zależności | Ryzyko | Szacowany czas |
|-------------|-------|-----------|------------|--------|---------------|
| **0** | Security blockers B1–B3 | 🔴 BLOCKER | Brak | 🟢 NISKIE | 2h |
| **A** | Sprint A verification/domknięcie | 🔴 BLOCKER | S0 | 🟢 NISKIE | 1h (verification) |
| **G** | Save Files Sidebar UX/UI + Logic | 🔴 BLOCKER przed launch | S0 + A | 🟠 ŚREDNIE | 6–8h |
| **E** | Right Sidebar + Floating Help Button | 🟡 HIGH | S0 + A | 🟠 ŚREDNIE | 4–6h |
| **F** | 5-step Tutorial | 🟠 MEDIUM | D3 (auto-expand), E (opcjonalnie) | 🟠 ŚREDNIE | 3–5h |
| **EPIK H** | Premium Team Setup | 🔵 NISKI (po betcie) | Entitlements (gotowe) + Stripe QA | 🔴 WYSOKIE | **Osobny epik** — patrz sekcja Epik H |

**Rekomendowana kolejność:** S0 → A (verification) → G → E → F → (po betcie) EPIK H

- **S0 najpierw:** bezpieczeństwo. Blokery B1–B3 przed jakimkolwiek publicznym dostępem.
- **A verification:** potwierdź że Sprint A (podpisy, quick wins) jest domknięty, zweryfikuj Q1–Q6.
- **G przed publicznym launch:** panel zapisu to core UX, błędy w zapisywaniu to user blocker.
- **E po G:** oba modyfikują współdzielone pliki — robienie ich równolegle grozi konfliktami.
- **F po D3:** tutorial wymaga stabilnego auto-expand. Można zacząć tooltipy przed D3, ale finalne pozycjonowanie po.
- **EPIK H po betcie:** wymaga Stripe QA, migracji DB, zarządzania dostępami. Rób po StripeTester agencie.

---

## Sprint E — Right Sidebar + Floating Help Button

### Cel
Dodanie wyskakującego prawego sidebara z pomocą/skrótami/wskazówkami/statusem, otwieranego przez duży pływający przycisk. Sidebar nie może zasłaniać canvasa w sposób blokujący.

### Zakres

#### E1 — Floating Help Button
- **Lokalizacja:** Prawy dolny róg ekranu (fixed, `bottom-6 right-6`).
- **Wygląd:** Duży, okrągły przycisk (`w-14 h-14`), kolor akcentu (`bg-accent`), ikona `?` lub `⌘` (inline SVG).
- **Cień:** `shadow-lg` z projektem `z-floating` z design systemu.
- **Mobile:** Taka sama pozycja, ale mniejszy (`w-12 h-12`) — nie koliduje z gestami.
- **Zachowanie:**
  - Kliknięcie → otwiera prawy sidebar.
  - Ponowne kliknięcie → zamyka sidebar.
  - Przycisk widoczny zawsze (niezależnie od stanu sidebara).
  - Animacja: `scale(1)` → `scale(1.1)` na hover (duration-fast 150ms).
  - `aria-label="Pomoc i skróty"`.
- **Warunek:** Nie wyświetla się gdy `printMode` jest active (oszczędność miejsca w eksporcie).

#### E2 — Right Sidebar (slide-in panel)
- **Pozycja:** Fixed, prawa strona, `top-0 right-0 h-full w-80`, z-index warstwy `z-sidebar` (z design systemu).
- **Tło:** `bg-surface` z `shadow-2xl`, border lewy: `border-l border-border`.
- **Nagłówek:** "Pomoc i skróty" + przycisk X (zamknij).
- **Sekcje (przewijane):**
  1. **Skróty klawiszowe** — lista najważniejszych skrótów (P = player, A = pass arrow, B = ball, Space = play, ? = cheat sheet, itd.). Pogrupowane tematycznie.
  2. **Narzędzia** — szybkie linki do Zoom Fit, Focus Mode, Print Mode, Export.
  3. **Wskazówki** — kontekstowe: "Zaznacz zawodnika i naciśnij → aby dodać numer strzałki", itp.
  4. **Status zapisu** — "Zapisano" / "Zapisywanie..." / "Błąd zapisu" + przycisk "Zapisz ręcznie".
- **Zamykanie:**
  - Kliknięcie X w nagłówku.
  - `Escape` — globalny nasłuch (tylko gdy sidebar otwarty). Po ESC focus wraca do Floating Help Button.
  - Kliknięcie poza sidebar (na canvas) — **Decyzja:** Sidebar NIE ma backdropu. Canvas jest w pełni interaktywny poza obszarem zajętym przez sidebar. Użytkownik może klikać w canvas, dodawać elementy, rysować — sidebar pozostaje otwarty.
- **Brak focus-trap** — sidebar jest non-modal. Użytkownik może TABem przejść z sidebara do innych elementów UI i z powrotem. Focus managed przez `aria-modal="false"` i ręczny `focus()` na przycisku po ESC.
- **Aria:** `role="dialog"`, `aria-label="Panel pomocy i skrótów"`, `aria-modal="false"`.

#### E3 — Integracja z istniejącym kodem
- **Nowy komponent:** `packages/ui/src/FloatingHelpButton.tsx` — przycisk.
- **Nowy komponent:** `packages/ui/src/HelpSidebar.tsx` — panel sidebara.
- **Stan:** `useUIStore.ts` — dodaj `helpSidebarOpen: boolean`, `toggleHelpSidebar()`.
- **Render:** W `CanvasShell.tsx` lub `BoardPage.tsx` (gdzie istnieją inne overlay komponenty).
- **Shortcuts data:** Wyciągnij z istniejącego `CheatSheetOverlay.tsx` lub stwórz dedykowaną strukturę danych w `packages/ui/src/helpSidebarData.ts`.

### Poza zakresem
- Edytowalne skróty klawiszowe przez użytkownika (re-mapping) — to duży feature, nie MVP.
- Konfiguracja which sections show/hide.
- Sidebar nie zastępuje istniejącego `RightInspector` — to osobny panel.

### Pliki do sprawdzenia przed implementacją
- `packages/ui/src/CheatSheetOverlay.tsx` — struktura danych skrótów.
- `packages/ui/src/RightInspector.tsx` — wzór slide-in drawer (jeśli zaimplementowany w UX Sprint 2A).
- `apps/web/src/store/useUIStore.ts` — istniejące stany UI.
- `apps/web/src/components/CanvasShell.tsx` — miejsce renderu (jeśli istnieje).
- `apps/web/src/App.tsx` / `apps/web/src/app/board/BoardPage.tsx` — composition root.
- `docs/DESIGN_SYSTEM.md` §7 (Z-Index Layers) — sprawdź czy `z-sidebar` istnieje, jeśli nie → dodaj.

### Kroki implementacji

1. **Przygotowanie:** Przeczytaj `CheatSheetOverlay.tsx` — wyciągnij strukturę shortcutów do osobnego pliku `helpSidebarData.ts` w `packages/ui/src/`.
2. **FloatingHelpButton:** Stwórz komponent przycisku z ikoną, pozycjonowaniem fixed, animacją hover, aria-label.
3. **useUIStore:** Dodaj `helpSidebarOpen`, `toggleHelpSidebar`, `setHelpSidebar`.
4. **HelpSidebar:** Stwórz komponent panelu z sekcjami, przewijaniem, zamykaniem przez ESC i X.
5. **Refaktoryzacja CheatSheet:** Opcjonalnie — jeśli `CheatSheetOverlay` używa tej samej struktury shortcutów → użyj współdzielonego pliku.
6. **Integracja:** Dodaj oba komponenty w `CanvasShell.tsx` lub `BoardPage.tsx`.
7. **Sprawdź podpisy:** Upewnij się że sidebar nie nachodzi na podpisy zawodników (test: otwórz sidebar, dodaj player z label, sprawdź czy label nie jest pod spodem).
8. **Export w `packages/ui/src/index.ts`.**

### Kryteria akceptacji
- [ ] Floating button widoczny w prawym dolnym rogu na desktop i mobile.
- [ ] Kliknięcie otwiera HelpSidebar.
- [ ] Sidebar ma 4 sekcje: skróty, narzędzia, wskazówki, status zapisu.
- [ ] ESC zamyka sidebar.
- [ ] Kliknięcie X zamyka sidebar.
- [ ] Canvas jest w pełni interaktywny gdy sidebar otwarty (brak backdropu, brak blokady).
- [ ] Cursor nie zmienia się na `text` nad canvasem przy otwartym sidebarze.
- [ ] `aria-label` na przycisku i panelu.
- [ ] Skróty w sidebarze są poprawne (zgadzają się z `useKeyboardShortcuts.ts`).
- [ ] Status zapisu pokazuje aktualny stan (Saving/Saved/Unsaved/Error/Offline).
- [ ] Przycisk znika w print mode.
- [ ] Przycisk nie koliduje z ZoomWidget (prawy dolny róg — sprawdź czy ZoomWidget jest gdzie indziej).
- [ ] Podpisy zawodników (`showLabel`) widoczne i niezasłonięte.

### Testy
1. Manual: Otwórz sidebar → sprawdź czy canvas daje się klikać w obszarze poza sidebar (dodaj playera P).
2. Manual: ESC → sidebar zamknięty, focus wraca do FloatingHelpButton.
3. Manual: Porównaj skróty w sidebar z `?` CheatSheet — zgodność.
4. Manual: Zmień stan zapisu (edytuj coś) → sidebar pokazuje "Unsaved".
5. Manual: Mobile viewport (responsive) — przycisk mniejszy, sidebar węższy lub full-width.
6. Manual: Otwórz sidebar i RightInspector jednocześnie — nie kolidują, HelpSidebar ma wyższy z-index.

### Ryzyka
- 🟠 ŚREDNIE: Floating button może kolidować z istniejącym ZoomWidget (sprawdź gdzie jest ZoomWidget — w Toolbar czy osobno). Mitigacja: sprawdź layout przed implementacją.
- 🟠 ŚREDNIE: HelpSidebar i RightInspector są po tej samej (prawej) stronie — konflikt z-index i układu. Mitigacja: HelpSidebar ma wyższy z-index niż RightInspector.
- 🟢 NISKIE: Sidebar może zasłonić podpisy zawodników — ryzyko minimalne, bo sidebar jest fixed po prawej a canvas scrolluje. Testować.
- 🟢 NISKIE: user może nie zauważyć floating buttona. Mitigacja: duży rozmiar (w-14), kolor akcentu, cień.

---

## Sprint F — 5-step Tutorial

### Cel
Szybki onboarding strzałkowy (5 kroków, max 20 sekund) prowadzący użytkownika po kluczowych funkcjach. Pokazuje się raz dla nowych użytkowników. Można pominąć.

### Zakres

#### F1 — Struktura tutoriala (5 kroków)

| Krok | Treść tooltipa | Cel (strzałka wskazuje na) | Czas (s) |
|------|---------------|---------------------------|----------|
| 1 | "**Dodaj zawodnika** — naciśnij `P` lub kliknij tutaj" | Pusta tablica / środek canvasa (lub przycisk dodawania jeśli istnieje) | 4 |
| 2 | "**Dodaj strzałkę** — naciśnij `A` i przeciągnij od zawodnika" | Toolbar lub canvas (wizualizacja narzędzia strzałki) | 4 |
| 3 | "**Przeciągnij zawodnika** — przesuń go w dowolne miejsce" | Canvas z przykładowym zawodnikiem | 4 |
| 4 | "**Animuj** — naciśnij `Space` aby zobaczyć taktykę w ruchu" | BottomStepsBar (przycisk Play) | 4 |
| 5 | "**Gotowe!** — naciśnij `?` aby zobaczyć wszystkie skróty" | Floating button (Sprint E) lub ikona `?` w TopBar | 4 |

**Razem:** 20 sekund (5 × 4s).

#### F2 — Zachowanie
- **Auto-advance:** Każdy krok trwa 4s, potem automatycznie przechodzi do następnego.
- **Skip:** Użytkownik może kliknąć "Skip" (mały przycisk w tooltipie) → kończy tutorial, ustawia `tutorialCompleted: true`.
- **Kliknięcie w tooltip:** Nie robi nic (tylko pausuje auto-advance? **Decyzja:** Nie pausuje — tutorial jest tak krótki że pauza nie ma sensu).
- **Interakcja z canvasem:** Dozwolona podczas tutoriala (użytkownik może kliknąć w canvas, tooltip nie blokuje).
- **Animacja:** Tooltip wjeżdża z góry/dołu/boku z `opacity 0→1` (200ms, `duration-normal`). Strzałka wskazująca cel — prosty trójkąt lub linia SVG.
- **Po ostatnim kroku:** Tooltip znika, `tutorialCompleted: true`, żaden toast ani gratulacje (ciche zakończenie).

#### F3 — Stan tutoriala
- **Gdzie zapisać:** `useUIStore.ts` lub `useAuthStore.ts`.
  - **Decyzja:** `useUIStore.ts` — `tutorialCompleted: boolean`, `showTutorial: boolean`. Persystowane w `localStorage` (przez istniejący mechanizm persist `useUIStore`).
  - Dla zalogowanych: opcjonalnie zapisz w `user_preferences` w Supabase (sync na future, nie teraz).
- **Warunek pokazania:**
  - `tutorialCompleted === false`
  - `elements.length === 0` (pusta tablica) — tutorial pokazuje się tylko przy pierwszym wejściu na pustą tablicę.
  - Jeśli użytkownik wczytał istniejący projekt → tutorial nie pokazuje się (nawet jeśli `tutorialCompleted === false`).
- **Kiedy NIE pokazywać:**
  - Guest mode powracający — jeśli tablica nie jest pusta.
  - Po załadowaniu projektu z chmury.
  - W print mode.
  - Gdy CheatSheet jest otwarty.

#### F4 — Pozycjonowanie tooltipów
- Każdy krok ma target element (np. `.toolbar-add-player`, `.bottom-steps-bar`).
- Jeśli target nie istnieje (przycisk nie wyrenderowany) → tooltip pokazuje się na środku canvasa.
- Tooltip nie może wyjść poza viewport. Jeśli target jest blisko krawędzi → tooltip po przeciwnej stronie.
- **Auto-expand (Sprint D3):** Tooltip musi reagować na zmianę zoom/scroll. Jeśli canvas zmieni pozycję podczas tutoriala, tooltip śledzi target lub resetuje pozycję.

#### F5 — Mobile
- Tooltipy są większe (łatwiejsze do tapnięcia "Skip").
- Strzałki są opcjonalne — na mobile wystarczy tooltip z tekstem.
- Ta sama sekwencja, ale targety mogą być inne (np. toolbar na mobile jest w innym miejscu).

#### F6 — Implementacja
- **Nowy komponent:** `packages/ui/src/TutorialOverlay.tsx` — główny komponent tutoriala.
- **Nowy plik danych:** `packages/ui/src/tutorialSteps.ts` — tablica 5 kroków z targetami i treścią.
- **Stan:** `useUIStore.ts` — `tutorialCompleted`, `showTutorial`.
- **Timer:** `useEffect` z `setTimeout` 4s na krok. Reset przy unmount.
- **Render:** W `CanvasShell.tsx` (albo nad canvasem).
- **Strzałki:** Inline SVG, obliczana pozycja względem targetu (getBoundingClientRect).

### Poza zakresem
- Interaktywny tutorial (gdzie użytkownik musi wykonać akcję przed przejściem dalej) — to skomplikowane, nie MVP.
- Tutorial dla zalogowanych funkcji premium (cloud sync, export).
- Analytics (który krok user skipnął) — można dodać później.

### Pliki do sprawdzenia przed implementacją
- `apps/web/src/store/useUIStore.ts` — obecnie persistowane stany.
- `packages/ui/src/ShortcutsHint.tsx` — istniejący hint, wzór do naśladowania.
- `packages/ui/src/EmptyStateOverlay.tsx` — istniejący empty state, w którym może być tutorial trigger.
- `apps/web/src/components/CanvasShell.tsx` — miejsce renderu.
- `docs/DESIGN_SYSTEM.md` §7 (z-index) — warstwa tooltipa.

### Kroki implementacji

1. **Stwórz `tutorialSteps.ts`:** Zdefiniuj 5 kroków (target CSS selector, title, description, position hint).
2. **Stwórz `TutorialOverlay.tsx`:**
   - Renderuje tooltip + strzałkę na aktualnym kroku.
   - Timer 4s na krok.
   - Auto-advance i opcja Skip.
   - Pozycjonowanie względem targetu z korektą viewport.
3. **useUIStore:** Dodaj `tutorialCompleted`, `showTutorial`, `setTutorialCompleted`, `dismissTutorial`.
4. **Integracja:** W `CanvasShell.tsx` — sprawdź przy montowaniu czy pokazać tutorial (pusta tablica i `!tutorialCompleted`).
5. **EmptyState integracja:** Jeśli EmptyStateOverlay jest wyświetlone, tutorial może być nad nim.
6. **CSS:** Tooltip z `z-tutorial` (wyższy niż canvas, niższy niż modal).
7. **Export w `packages/ui/src/index.ts`.**

### Kryteria akceptacji
- [ ] Tutorial pokazuje się tylko na pustej tablicy, pierwszy raz.
- [ ] 5 kroków, każdy ~4s → łącznie ~20s.
- [ ] Auto-advance działa (tooltip zmienia się co 4s).
- [ ] Skip kończy tutorial natychmiast.
- [ ] Po ostatnim kroku tutorial znika.
- [ ] `tutorialCompleted` persistuje w localStorage.
- [ ] Po dodaniu elementu i odświeżeniu → tutorial NIE pokazuje się (bo elements.length > 0).
- [ ] Po załadowaniu zapisanego projektu → tutorial NIE pokazuje się.
- [ ] Tooltip nie wychodzi poza viewport.
- [ ] Mobile: tooltip czytelny, Skip tapialny.
- [ ] `aria-label` na tooltipie i przycisku Skip.
- [ ] Auto-expand (D3) nie powoduje "uciekania" tooltipa.

### Testy
1. Manual: Fresh state → tutorial pokazuje się.
2. Manual: Skip → znika, nie wraca po odświeżeniu.
3. Manual: Poczekaj 20s → tutorial kończy się sam.
4. Manual: Dodaj playera przed tutorialem → nie pokazuje się.
5. Manual: Mobile viewport → tooltip nie ucięty.

### Ryzyka
- 🟠 ŚREDNIE: Pozycjonowanie tooltipa gdy target zmienia pozycję (auto-expand, animacja). Mitigacja: tooltip z `position: fixed` i korekcją na resize.
- 🟢 NISKIE: Timer może być zbyt szybki/wolny dla różnych użytkowników. Mitigacja: 4s to minimum, user może skipnąć w każdej chwili.

---

## Sprint G — Save Files Sidebar UX/UI + Logic

### Cel
Usprawnienie panelu plików/projektów: lepsze UX (stany, thumbnail, sortowanie, potwierdzenia) i logika zapisu (autosave z thumbnailem, manual save, obsługa błędów).

### Zakres

#### G1 — ProjectsDrawer UX overhaul
- **Lista projektów:**
  - Sortowanie: ostatnio edytowane na górze (`updatedAt DESC`).
  - Sekcja "Przypięte" (📌 Pinned) — projekty/foldery z `isPinned = true` (L1 feature — backend gotowy, UI nie).
  - Każdy projekt: nazwa, data ostatniej edycji, status (Saving/Saved/Unsaved/Error).
  - Folder color chip (L1 — backend gotowy, UI nie).
- **Tworzenie nowego projektu:**
  - Przycisk "+ Nowy projekt" na górze.
  - Modal lub inline: nazwa projektu → Enter → tworzy.
- **Zmiana nazwy:**
  - Double-click na nazwie projektu → inline edit (L1 — kawałek gotowy, UI nie).
  - Enter zatwierdza, Escape anuluje.
- **Otwieranie projektu:**
  - Single-click → ładuje projekt z chmury (lub z cache).
  - Wskazanie aktywnego projektu (highlight, podkreślenie).
- **Usuwanie projektu:**
  - Przycisk kosza (hover) → ConfirmModal "Czy na pewno usunąć projekt X?".
  - Usuwa z bazy i z localStorage.
- **Puste stany:**
  - "Brak projektów. Stwórz pierwszy!" + przycisk "+ Nowy projekt".
  - Dla guest: "Zaloguj się aby zapisywać projekty w chmurze" + przycisk "Zaloguj się".
- **Offline:**
  - Projekty w localStorage są dostępne offline.
  - Przy próbie operacji chmurowych offline → toast "Brak połączenia. Zmiany zostaną zapisane lokalnie."
  - Po powrocie online → nadpisz localStorage tym co jest w chmurze (last-write-wins. **To NIE jest conflict resolution** — w MVP przyjmujemy że user pracuje głównie online. Pełny conflict resolution (merge, wersjonowanie) to osobny temat po betcie.)
  - Test offline/online: manualny — wyłącz wifi, edytuj, włącz wifi, sprawdź czy dane się zsynchronizowały.

#### G2 — Thumbnail (throttled, nie przy każdym autosave)
- **Strategia throttlingu:**
  - **Manual save (Cmd+S):** zawsze generuje thumbnail.
  - **Autosave:** generuje thumbnail max raz na 30–60 sekund (timer, nie debounce). Licznik `lastThumbnailGeneration` w `AutosaveService.ts`.
  - Przy pierwszym zapisie projektu (po utworzeniu): thumbnail generowany niezależnie od timera.
- **Technicznie:**
  - Użyj `stage.toDataURL({ mimeType: 'image/png', pixelRatio: 0.25 })` lub `stage.toBlob()` (do sprawdzenia w S0.8).
  - Zapisz w Supabase Storage (`project_thumbnails/{projectId}.png`).
  - Jeśli storage bucket nie istnieje → migracja/stworzenie bucketu (osobny krok).
- **Wyświetlanie thumbnaila:** W liście projektów — miniaturka obok nazwy (64×48px lub 96×72px).
  - Jeśli brak thumbnaila → domyślna ikona (grid).
  - Ładowanie: placeholder shimmer.
- **Manual save:** Przycisk "Zapisz" (Cmd+S) — ten sam mechanizm, thumbnail zawsze generowany.

#### G3 — Status projektu
- `useCloudSlice.ts` (lub osobny stan) śledzi:
  - `projectSaveStatus`: `'unsaved' | 'saving' | 'saved' | 'error'`
  - `isOffline`: `boolean`
- Status widoczny:
  - W liście projektów obok nazwy (ikona: • zielony = saved, żółty = saving, czerwony = error, szary = offline).
  - W TopBar (istniejący mechanizm — sprawdź OfflineBanner).
- Po błędzie zapisu: toast + ikona błędu → kliknięcie = ponowna próba.

#### G4 — Lokalizacja panelu
- **Gdzie:** Lewa strona? Prawa? Obok istniejącego UI?
  - **Decyzja:** ProjectsDrawer jest już po lewej stronie (lub jako overlay). Zostawiamy go tam, gdzie jest. Jeśli jest modalem/drawerem — zostawiamy jako drawer, ale z ulepszonym UX.
  - **Względem RightInspector:** ProjectsDrawer po lewej, RightInspector po prawej. Nie kolidują.
- **Trigger:** Przycisk w TopBar (folder icon / "Moje projekty").
- **Zamykanie:** Kliknięcie poza drawerem, ESC, kliknięcie X.

### Poza zakresem
- Drag & drop reorder projektów — nie MVP.
- Wiele zaznaczeń (batch delete, batch move folder).
- Udostępnianie projektów (shared project library) — to część Team Plan (Sprint H).
- Wersjonowanie dokumentów (schema versioning) — osobny temat.

### Pliki do sprawdzenia przed implementacją
- `packages/ui/src/ProjectsDrawer.tsx` — istniejący panel (TODO: inline rename, pinned section, folder color).
- `apps/web/src/services/AutosaveService.ts` — istniejący autosave, ścieżki importu.
- `apps/web/src/store/slices/cloudSlice.ts` — stan chmury (isSaving, projectId, projects).
- `packages/ui/src/ConfirmModal.tsx` — istniejący modal do potwierdzenia usunięcia.
- `apps/web/src/lib/supabase.ts` — `uploadThumbnail`, `getProjectThumbnail`.
- `apps/web/src/hooks/useProjectsController.ts` — istniejący kontroler (L1).
- `apps/web/src/store/useUIStore.ts` — `projectsDrawerOpen`.
- `supabase/migrations/` — sprawdź czy storage bucket `project_thumbnails` istnieje.
- `packages/core/src/board.ts` — localStorage key dla `saveToLocalStorage`.
- `apps/web/src/components/OfflineBanner.tsx` — istniejący offline detection.

### Kroki implementacji

1. **Audyt ProjectsDrawer:** Przeczytaj aktualny kod. Sprawdź TODO.
2. **Inline rename (L1):** Zaimplementuj brakujące UI w ProjectsDrawer (double-click → input → Enter/ESC).
3. **Pinned section (L1):** Dodaj sekcję "📌 Przypięte" na górze listy.
4. **Folder color chip (L1):** Dodaj kolorowy wskaźnik obok folderów.
5. **ConfirmModal na delete:** Podłącz istniejący ConfirmModal zamiast window.confirm.
6. **Sortowanie i puste stany:** Sortuj po `updatedAt DESC`, dodaj empty states dla guest/authenticated.
7. **Status projektu:** Dodaj `projectSaveStatus` w UI (ikona obok nazwy).
8. **Thumbnail w Autosave:** Rozszerz AutosaveService o generowanie i upload thumbnaila.
9. **Thumbnail w liście:** Wyświetl miniaturkę z loading shimmer i fallback ikoną.
10. **Offline sync:** Ulepsz detection i automatyczną synchronizację po powrocie online.
11. **Export w `packages/ui/src/index.ts`.**

### Kryteria akceptacji
- [ ] Projekty sortowane: ostatnio edytowane na górze.
- [ ] Przypięte projekty na samej górze (L1).
- [ ] Double-click na nazwie → inline edit (Enter/ESC).
- [ ] Delete → ConfirmModal → dopiero usuwa.
- [ ] Empty state dla guest: "Zaloguj się aby zapisywać".
- [ ] Empty state dla zalogowanych: "Brak projektów. Stwórz pierwszy!".
- [ ] Status projektu widoczny (saving/saved/unsaved/error) w liście i TopBar.
- [ ] Thumbnail generowany przy autosave.
- [ ] Thumbnail wyświetlany w liście (lub fallback ikona).
- [ ] Offline: projekty dostępne z localStorage, operacje chmurowe blokowane z toastem.
- [ ] Online: automatyczna synchronizacja po powrocie.
- [ ] `showLabel` per-player nie gubi się przy zapisie/odczycie (test: zapisz projekt z włączonym label, odczytaj → label wciąż widoczny).
- [ ] Podpisy zawodników (Sprint A) nie są gubione przez żadną operację zapisu/odczytu.

### Testy
1. Manual: Stwórz projekt → zapisz → odśwież → projekt na liście.
2. Manual: Usuń projekt → ConfirmModal → potwierdź → znika z listy.
3. Manual: Zmień nazwę double-click → Enter → nazwa zapisana.
4. Manual: Edytuj elementy → status "Unsaved" → autosave → "Saved".
5. Manual: Wyłącz internet → edytuj → status "Offline" → włącz → synchronizacja.
6. Test regresji: Zapisz projekt z `showLabel=true` na playerze → wczytaj → label wciąż widoczny.
7. Test regresji: Zapisz projekt z numeracją strzałek (Sprint C) → wczytaj → numery zachowane.
8. Test regresji: Zapisz projekt z orientation/vision (Sprint B) → wczytaj → ustawienia zachowane.

### Ryzyka
- 🟠 ŚREDNIE: Thumbnail generation może być kosztowne na słabych urządzeniach. Mitigacja: `pixelRatio: 0.25` (mały rozmiar), debounce 1.5s, osobny requestAnimationFrame.
- 🟠 ŚREDNIE: Offline sync może powodować konflikty (user edytuje offline, potem online z nowszą wersją z chmury). Mitigacja: MVP overwrite strategy (lokalna wersja wygrywa). Pełna strategia merge to osobny temat.
- 🟢 NISKIE: Inline rename (L1) ma już backend i controller, brakuje tylko UI — ryzyko niskie.

---

## Epik H — Premium Team Setup (osobny epik)

**Status:** Osobny epik — NIE sprint. Do realizacji po betcie, po Stripe QA przez `@StripeTester`.
**Cel:** Wdrożenie Club Premium z zarządzaniem dostępami. Admin drużyny nadaje i usuwa członkom dostęp do funkcji premium. Najprostsza możliwa wersja MVP.

**Szacowany czas:** 16–24h (podzielone na 3 sprinty). Nie 7–13h — to obejmuje migracje DB, Stripe konfigurację, webhooki, UI panelu, testy i Stripe QA.

### Zależność: Stripe QA przed implementacją
Przed rozpoczęciem Epiku H należy uruchomić `@StripeTester` aby:
1. Zweryfikować istniejącą integrację Stripe (checkout, webhook, customer portal).
2. Potwierdzić że price ID w `_stripeConfig.ts` są poprawne.
3. Przetestować webhook flow: checkout → webhook → update `profiles.subscription_tier`.
4. Sprawdzić czy istniejące subskrypcje (Premium Solo) działają bez regresji.
5. Dopiero po zielonym Stripe QA → rozpocząć Epik H.

### Podział na sprinty w Epiku H

| Sprint | Nazwa | Czas | Zależności |
|--------|-------|------|------------|
| **H1** | DB + Backend (migracje, RLS, Stripe webhook) | 5–7h | Stripe QA ✅ |
| **H2** | Entitlements + UI panel Team | 6–8h | H1 |
| **H3** | PricingModal, gating, testy + Stripe QA | 5–9h | H2 |

### Model planów

| Plan | Cena | Kto | Max członków | Funkcje |
|------|------|-----|-------------|---------|
| **Premium** (Solo) | $9/mo | Pojedynczy użytkownik | 1 | Unlimited projekty, GIF/PDF export, unlimited kroki |
| **Club Premium** | $29/mo | Drużyna (admin + members) | 5 (w cenie) | Wszystko co Premium + zarządzanie dostępami |
| **Free** | $0 | Authenticated user | 0 | 3 projekty, 10 kroków, PNG export |

### Role

| Rola | Opis | Uprawnienia |
|------|------|-------------|
| **Club Admin** | Właściciel/kupujący Club Premium | Nadaje/usuwa dostęp, widzi wszystkich członków, zarządza billingiem (przez Stripe Customer Portal) |
| **Member** | Zaproszony członek drużyny | Korzysta z funkcji Club Premium, nie widzi innych członków, nie zarządza billingiem |
| **User** | Zwykły użytkownik (Free lub Solo Premium) | Brak dostępu do team features |

### Zarządzanie dostępami (Club Admin)
- **UI:** Nowy panel "Team" w RightInspector (jako osobna zakładka) lub osobny modal.
- **Lista członków:** Nazwa / email, rola (Admin / Member), status (Active / Pending).
- **Dodawanie członka — model zaproszeń (POPRAWIONY):**
  - Admin wpisuje email → tworzy rekord w `team_invites` z `status: 'pending'`.
  - `team_members.user_id` NIE może być NOT NULL dla pending invite — dlatego potrzebna jest osobna tabela `team_invites` LUB nullable `user_id` w `team_members`.
  - **Decyzja:** Osobna tabela `team_invites` (czystszy model).
  - Gdy invited user loguje się i po raz pierwszy otwiera panel Team → akceptuje zaproszenie → `team_invites` → `team_members` z `user_id`.
  - Wysyłanie emaila z zaproszeniem — **opcjonalne w MVP**. Można zrobić: admin dodaje email → member po zalogowaniu widzi "Masz zaproszenie do drużyny X" w panelu Team.
- **Usuwanie członka:** Przycisk kosza → ConfirmModal "Usunąć członka X?" → usuwa `team_members`.
- **Limity:** Pokazuje "3/5 członków wykorzystanych".
- **Tylko dla Club Admin:** Przycisk "Zarządzaj billingiem" → Stripe Customer Portal.

### Ograniczenie funkcji premium w UI
- **Gating:** Istniejący `entitlements.ts` ma `can('inviteMember')` — zwraca `'hard-block'` dla Free/Pro/Guest.
- **UI:** Przycisk "Dodaj członka" disabled dla non-Club. Tooltip: "Dostępne w Club Premium".
- **Backend:** RLS na `team_members` — tylko club admin może insert/delete. Członkowie mogą tylko SELECT (zobaczyć że są w teamie).
- **Entitlements update:** Gdy user jest członkiem Club Premium → `derivePlan()` sprawdza czy ma `team_id != null` → zwraca `'team'`.

### Backend/DB

**Nowe tabele:**

```sql
-- Tabela team
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  max_members INTEGER NOT NULL DEFAULT 5,
  stripe_customer_id TEXT,           -- dla idempotentności webhooka
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela team_members (aktywni członkowie)
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela team_invites (zaproszenia oczekujące)
CREATE TABLE public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

-- Unikalność: user może być tylko raz w teamie
CREATE UNIQUE INDEX idx_team_members_team_user ON public.team_members(team_id, user_id);
CREATE INDEX idx_team_invites_email ON public.team_invites(invited_email);
```

**Modyfikacje istniejących tabel:**
- `profiles`: Dodaj `team_id UUID REFERENCES public.teams(id)` — opcjonalnie, można też pobierać z `team_members`.

**RLS:**
- `teams`: owner_id = auth.uid() może DELETE/UPDATE. Każdy członek może SELECT.
- `team_members`: tylko admin może INSERT/DELETE. Każdy członek może SELECT swoje.
- `team_invites`: admin może INSERT/DELETE/SELECT. Invited user może SELECT swoje (po emailu).

**Entitlements update:**
```typescript
function derivePlan(isAuthenticated: boolean, subscriptionTier?: string, teamId?: string): Plan {
  if (!isAuthenticated) return 'guest';
  if (teamId) return 'team';  // członek Club Premium
  return subscriptionTier ?? 'free';
}
```

### Stripe integration + idempotentność webhooków

- Club Premium = nowy produkt w Stripe ($29/mo).
- Price ID dodany do `_stripeConfig.ts`.
- **Idempotentność webhooka:**
  - Webhook zdarzenia `checkout.session.completed` przechowuje `stripe_customer_id` w tabeli `teams`.
  - Przed utworzeniem teamu: `SELECT id FROM public.teams WHERE stripe_customer_id = $1`.
  - Jeśli rekord istnieje → NIE twórz nowego (to re-play webhooka).
  - Jeśli nie istnieje → stwórz `teams` i `team_members` (admin).
- Webhook: subscription cancelled → deaktywuj team (ustaw `teams.active = false`).
- **MVP:** Grace period = 0. Cancel → użytkownicy tracą dostęp do Club Premium. Można poprawić po betcie.

### Poza zakresem MVP
- Shared project library (współdzielone projekty między członkami) — Team v2.
- Wysyłanie email invitations przez Netlify Function — MVP: admin dodaje email ręcznie.
- Branding drużyny (logo, kolory).
- Analityka użycia teamu.
- Multiple teams per user.
- Przenoszenie projektów do teamu.
- Extra seats poza 5.

### Pliki do sprawdzenia przed implementacją
- `apps/web/src/lib/entitlements.ts` — istniejący system, `derivePlan`, `can()`.
- `apps/web/src/hooks/useEntitlements.ts` — React hook.
- `supabase/migrations/` — istniejące migracje, schemat `profiles`.
- `netlify/functions/stripe-webhook.ts` — webhook handler.
- `netlify/functions/create-checkout.ts` — checkout session.
- `netlify/functions/_stripeConfig.ts` — price IDs.
- `packages/ui/src/PricingModal.tsx` — istniejący pricing modal.
- `packages/ui/src/RightInspector.tsx` — zakładki, miejsce na panel Team.
- `apps/web/src/store/useAuthStore.ts` — stan auth.

### Kroki implementacji (H1 — DB + Backend)

1. **Migracja DB:** `YYYYMMDDHHMMSS_add_team_tables.sql` — stwórz `teams`, `team_members`, `team_invites`.
2. **RLS:** Dodaj polityki dla wszystkich trzech tabel.
3. **Entitlements update:** Rozszerz `derivePlan()` o `teamId`.
4. **Stripe setup:** Dodaj produkt Club Premium ($29/mo) w Stripe Dashboard. Dodaj price ID do `_stripeConfig.ts`.
5. **Webhook update:** W `stripe-webhook.ts` — dodaj idempotentne tworzenie teamu po checkout `team`.

### Kroki implementacji (H2 — UI)

6. **UI Team panel:** Nowy komponent `packages/ui/src/TeamPanel.tsx` — lista członków, dodawanie, usuwanie, limit, zaproszenia.
7. **Integracja z RightInspector:** Dodaj zakładkę "Team" (widoczną tylko dla Club Admin / Team members).
8. **PricingModal:** Dodaj Club Premium do modala (jeśli brak).
9. **Gating UI:** Użyj `can('inviteMember')` do disable przycisku dla non-Club.
10. **Test:** Sprawdź czy członek teamu ma entitlements Pro (unlimited projekty, kroki, export).
11. **Stripe QA:** Uruchom `@StripeTester` po H1 i po H3.

### Kryteria akceptacji
- [ ] Club Admin widzi panel Team z listą członków.
- [ ] Club Admin może dodać członka (email → rekord w `team_invites`).
- [ ] Club Admin może usunąć członka (ConfirmModal → delete z `team_members`).
- [ ] Zaproszony user po zalogowaniu widzi "Masz zaproszenie do drużyny X".
- [ ] Członek teamu ma entitlements = Pro (unlimited).
- [ ] Członek teamu NIE widzi panelu zarządzania (tylko "Jesteś członkiem").
- [ ] Non-Club użytkownik widzi "Dostępne w Club Premium" tooltip.
- [ ] Idempotentność webhooka: replay checkout.session.completed nie tworzy duplikatu teamu.
- [ ] Po anulowaniu subskrypcji Club Premium → członkowie tracą dostęp (grace period: 0 w MVP).
- [ ] Stripe QA przechodzi po H1 i po H3.
- [ ] Brak regresji w istniejących planach (Guest, Free, Pro).
- [ ] RLS: tylko admin może zarządzać, członkowie tylko czytają.
- [ ] Podpisy zawodników (Sprint A) nie są gubione przez żadną operację team management.

---

## Inne UX usprawnienia (low-risk quick wins)

Zebrane z audytu kodu (`AUDIT_COMPREHENSIVE_2026_06_10.md`) i listy bugów. Niezależne od sprintów E–H.

### Quick wins (status po Sprint A)

| # | Usprawnienie | Status | Uwagi |
|---|-------------|--------|-------|
| Q1 | **Toast na redo** — `showToast('Przywrócono')` przy Cmd+Shift+Z | ✅ W Sprint A (A1) | Weryfikacja: sprawdź czy toast faktycznie działa w `useKeyboardShortcuts.ts`. |
| Q2 | **Clear (C) feedback** — toast tylko gdy są drawingi, nie zawsze | ✅ W Sprint A (A1) | Weryfikacja: sprawdź warunek w `useKeyboardShortcuts.ts`. |
| Q3 | **Cursor:pointer na elementach** | ✅ W Sprint A (A2) | Weryfikacja: sprawdź `PlayerNode.tsx`, `ZoneNode.tsx` itd. |
| Q4 | **Aria-label na ZoomWidget** | ✅ W Sprint A (A1) | Weryfikacja: sprawdź `ZoomWidget.tsx`. |
| Q5 | **Aria-label na Toolbar przyciskach** | 🟡 Do zrobienia (nie w Sprint A) | `packages/ui/src/Toolbar.tsx` — 15min. |
| Q6 | **Focus ring na przyciskach** | 🟡 Do zrobienia | Wiele komponentów — 20min. |
| Q7 | **Player number delete-to-0 fix (H1)** | 🟡 Do zrobienia | `useBoardPageHandlers.ts`, `QuickEditOverlay.tsx` — 30min. |
| Q8 | **ENTER na selekcji playera (H2)** | 🟡 Do zrobienia | `useKeyboardShortcuts.ts` — 20min. |
| Q9 | **Diamond shape offset fix (U1)** | 🟡 Do zrobienia | `PlayerNode.tsx` — 10min. |

### Większe zmiany (poza quick wins, ale niskie ryzyko)

| # | Usprawnienie | Wartość | Ryzyko | Czas |
|---|-------------|---------|--------|------|
| Q10 | **Logger replacement** — zastąp 101 console.log globalnym loggerem z flagą DEV | Produkcja-ready, bezpieczeństwo | 🟢 NISKIE | 2h (PR-2 z BETA_READY_SPRINT) |
| Q11 | **Guest Login Sync (PR-UX-1)** — autozapis guest work po zalogowaniu | Nie tracisz danych przy rejestracji | 🟠 ŚREDNIE | 2–3h |
| Q12 | **Settings Modal full integration** — podpięcie handlery (updateProfile, changePassword, deleteAccount) | Użytkownik może zarządzać kontem | 🟠 ŚREDNIE | 1–2h |
| Q13 | **Folder limits enforcement** — `can('createFolder')` w UI (Free: 3) | Spójność monetyzacji | 🟢 NISKIE | 30min |

### Co odłożyć na później (po betcie)
- **Layer Order Control** (Bring to Front / Send to Back UI) — zIndex istnieje w typach, brak UI.
- **Grid snap** — jawnie wyłączone w MVP (FEATURE_SPEC.md §2.2).
- **Step thumbnails** — osobny temat w S5.3.
- **Onion skin** — osobny temat w S5.5.
- **Drag reorder steps** — osobny temat w S5.4.

---

## Open Questions

Pytania, które wymagają decyzji użytkownika przed rozpoczęciem implementacji.

### Sprint E — Sidebar
1. **Czy Floating Help Button ma zastąpić istniejący przycisk `?` w TopBar, czy być dodatkowym?** Obecnie `?` otwiera CheatSheetOverlay. Sugeruję: niech oba istnieją — `?` w TopBar otwiera CheatSheet (jak teraz), Floating button otwiera HelpSidebar.
2. **Czy HelpSidebar ma sekcję "Status zapisu", czy to już istnieje w TopBar?** Jeśli TopBar już pokazuje status (OfflineBanner), to sekcja może być redundantna. Ale w sidebarze jest bardziej dostępna.
3. **Czy sidebar na mobile ma być full-width czy drawer?** Sugeruję: `< md` → full-width, `≥ md` → drawer 320px.

### Sprint F — Tutorial
4. **Czy tutorial ma się pokazywać również w guest mode?** Jeśli guest mode ma localStorage, to stan `tutorialCompleted` będzie persistowany. Sugeruję: tak, dla wszystkich.
5. **Czy po skipnięciu tutoriala można go ręcznie uruchomić ponownie?** Sugeruję: tak, przez HelpSidebar → przycisk "Pokaż tutorial ponownie".
6. **Jaki język tutoriala?** Sugeruję: angielski (spójny z resztą UI), ale to zależy od grupy docelowej.

### Sprint G — Save Panel
7. **Czy thumbnail ma być generowany dla wszystkich zapisów, czy tylko manual save?** Decyzja w planie: manual save zawsze, autosave max raz na 30-60s. Do potwierdzenia: 30s czy 60s?
8. **Czy projekty mają mieć możliwość eksportu jako template?** Sugeruję: nie w MVP — to osobny feature (Templates API istnieje w backendzie, ale UI nie).

### Epik H — Premium Club
9. **Czy Club Premium ma wysyłać email z zaproszeniem?** Sugeruję: MVP → tylko dodanie do tabeli `team_invites`, bez emaila. User widzi zaproszenie po zalogowaniu w panelu Team. Email można dodać później.
10. **Czy członek teamu ma dostęp do projektów admina?** Sugeruję: nie w MVP. Każdy ma własne projekty, ale z entitlements Club Premium. Współdzielenie projektów to Team v2.
11. **Czy Club Premium ma mieć grace period po anulowaniu?** Sugeruję: 0 dni w MVP (natychmiastowa utrata dostępu). Można dodać po betcie.

### Ogólne
12. **Czy Sprint A jest faktycznie domknięty? Wymaga weryfikacji.** Należy sprawdzić czy Q1–Q4 są zaimplementowane (toast na redo, clear feedback, cursor:pointer, aria-label ZoomWidget).
13. **Czy blokery B1–B3 mają być zrobione PRZED nowymi sprintami?** Sugeruję: TAK — to security blokery przed publicznym dostępem. Sprint 0 przed E–G.

---

## Final Recommendation

### Co robić najpierw

1. **Sprint 0 (Blokery B1–B3)** — 2h. Security fix przed jakimkolwiek publicznym dostępem. Bez tego nie ma sensu robić panelu zapisu ani premium.
2. **Sprint A verification** — 1h. Potwierdź że Sprint A (podpisy + quick wins) jest domknięty.
3. **Sprint G (Save Panel)** — 6–8h. Core UX przed beta launch. Projekty muszą się zapisywać i ładować poprawnie.
4. **Sprint E (Help Sidebar)** — 4–6h. Po G (współdzielone pliki: `useUIStore.ts`, potencjalnie `TopBar.tsx`).

### Co robić równolegle

- **Sprint 0 + Sprint A verification** — Sprint 0 to backend/DB, A verification to frontend. Mogą być równoległe (osobne branche).
- **Quick wins Q5–Q9** — można wrzucić między sprintami jako małe commity. Nie wymagają osobnego sprintu.
- **Sprint F (Tutorial)** można zacząć research (struktura kroków, targety) przed D3, ale finalne pozycjonowanie po D3.

### Czego nie robić teraz

- **Epik H (Premium Club)** — odłóż po bettę, po Stripe QA przez `@StripeTester`. To nie jest sprint — to osobny epik 16–24h z własnym harmonogramem.
- **Sprint F (Tutorial)** — zacznij dopiero po D3 (auto-expand) lub przynajmniej uwzględnij w implementacji.
- **Q10–Q13** — przydatne, ale nie krytyczne przed betą. Rób po głównych sprintach.

### Kolejność wykonania (rekomendowana)

```
Sprint 0 (B1-B3) [2h]
    ↓
Sprint A verification (domknięcie) [1h]
    ↓
Sprint G — Save Panel [7h] ← priorytet przed publicznym launch
    ↓
Sprint E — Help Sidebar [5h] ← po G (współdzielone pliki)
    ↓
Sprint F — Tutorial [4h] ← po D3
    ↓
[po betcie] EPIK H — Premium Club [16-24h] ← po Stripe QA przez @StripeTester
```

### Rekomendowane prompty do @Delivery LOOP

Po zatwierdzeniu planu, użyj tych promptów:

---

**Prompt 1 — Sprint 0 (Blokery):**
```
@Delivery LOOP 3proby: Zaimplementuj Sprint 0 z IMPLEMENTATION_PLAN_SPRINTS.md — fix blokerów B1-B3 z PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md:
1. B1: Post-logout data leak — w useAuthStore.ts signOut() dodaj newDocument(), clear localStorage, clear autosave timer
2. B2: RLS na project_shares — nowa migracja z ENABLE ROW LEVEL SECURITY i politykami
3. B3: Sprawdź RLS na profiles i project_folders — jeśli brak, dodaj migrację
Testuj lokalnie przez supabase db reset. Zapisz thoughts w thoughts/YYYY-MM-DD/.
```

**Prompt 2 — Sprint G (Save Panel):**
```
@Delivery LOOP 4proby 30min: Zaimplementuj Sprint G z PLAN_BRAKUJACYCH_FUNKCJI.md:
1. ProjectsDrawer: dodaj inline rename (L1), pinned section (L1), folder color chip
2. Podłącz ConfirmModal do delete projektu
3. Dodaj sortowanie po updatedAt DESC
4. Rozszerz AutosaveService o thumbnail z throttlingiem (max raz na 30s, manual save zawsze)
5. Dodaj status projektu (saving/saved/error) w liście i TopBar
6. Dodaj empty states: guest vs authenticated
Zasady: thumbnail nie przy każdym autosave, offline sync = last-write-wins (nie conflict resolution).
Przeczytaj najpierw istniejący kod ProjectsDrawer.tsx i AutosaveService.ts. Zapisz thoughts.
```

**Prompt 3 — Sprint E (Sidebar):**
```
@Delivery LOOP 4proby: Zaimplementuj Sprint E z PLAN_BRAKUJACYCH_FUNKCJI.md:
1. Stwórz FloatingHelpButton.tsx w packages/ui/src/ — duży przycisk w prawym dolnym rogu, ikona ?, aria-label, animacja hover
2. Stwórz HelpSidebar.tsx w packages/ui/src/ — slide-in panel z sekcjami: skróty (dane z CheatSheetOverlay), narzędzia, wskazówki, status zapisu
3. Dodaj helpSidebarOpen do useUIStore.ts
4. Zintegruj w CanvasShell.tsx
5. Sidebar jest non-modal (brak backdrop, brak focus-trap, aria-modal=false, canvas interaktywny).
6. ESC zamyka sidebar, focus wraca do przycisku.
Sprawdź że nie koliduje z RightInspector i podpisami zawodników. Zapisz thoughts.
```

**Prompt 4 — Sprint F (Tutorial):**
```
@Delivery LOOP 3proby 20min: Zaimplementuj Sprint F z PLAN_BRAKUJACYCH_FUNKCJI.md:
1. Stwórz tutorialSteps.ts w packages/ui/src/ — 5 kroków z targetami i treścią
2. Stwórz TutorialOverlay.tsx — tooltip + strzałka, timer 4s/krok, auto-advance, Skip
3. Dodaj tutorialCompleted do useUIStore.ts (persisted localStorage)
4. Zintegruj w CanvasShell.tsx — pokaż tylko gdy elements.length===0 && !tutorialCompleted
5. Tooltip pozycjonowany względem targetu (getBoundingClientRect), fixed pozycja, korekcja viewport
6. Uwzględnij auto-expand (D3) — tooltip nie ucieka gdy canvas zmienia rozmiar
Sprawdź na mobile. Zapisz thoughts.
```

**Prompt 5 — Stripe + Premium Planning (NIE implementacja):**
```
@StripeTester: Przeprowadź Stripe QA na obecnej integracji TMC Studio:
1. Sprawdź istniejące price IDs w _stripeConfig.ts
2. Przetestuj checkout flow (create-checkout)
3. Przetestuj webhook flow (stripe-webhook) — checkout.session.completed
4. Przetestuj customer portal (create-portal-session)
5. Sprawdź czy subskrypcje poprawnie updateują profiles.subscription_tier
6. Raport: co działa, co wymaga fixa, jakie są luki przed implementacją Club Premium
Zapisz wyniki w docs/STRIPE_QA_REPORT.md.
```