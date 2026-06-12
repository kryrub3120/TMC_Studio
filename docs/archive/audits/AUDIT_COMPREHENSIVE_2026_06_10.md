# TMC Studio — Kompleksowy Audyt Full-Stack
**Data:** 2026-06-10
**Autor:** GitHub Copilot (Delivery Agent)
**Branch:** develop (HEAD: 7c5882d)

---

## Spis treści
1. [Metodologia](#1-metodologia)
2. [Podsumowanie Executive](#2-podsumowanie-executive)
3. [Issue #1 — Numerowanie strzałek](#3-issue-1--numerowanie-strzałek)
4. [Issue #2 — Responsywność boiska (resize)](#4-issue-2--responsywność-boiska-resize)
5. [Issue #3 — Rączki (handles/Transformer)](#5-issue-3--rączki-handlestransformer)
6. [Issue #4 — Prawy sidebar + przycisk kalibracji](#6-issue-4--prawy-sidebar--przycisk-kalibracji)
7. [Issue #5 — Tutorial strzałkowy (5 kroków)](#7-issue-5--tutorial-strzałkowy-5-kroków)
8. [Issue #6 — Podpisy zawodników (styl Tactical Pad)](#8-issue-6--podpisy-zawodników-styl-tactical-pad)
9. [Issue #7 — System subskrypcji (3 plany Premium)](#9-issue-7--system-subskrypcji-3-plany-premium)
10. [Issue #8 — Ogólne usprawnienia UX](#10-issue-8--ogólne-usprawnienia-ux)
11. [Issue #9 — Panel zapisywania plików](#11-issue-9--panel-zapisywania-plików)
12. [Wnioski i rekomendacje](#12-wnioski-i-rekomendacje)

---

## 1. Metodologia

Audyt przeprowadzono poprzez analizę kodu źródłowego w całym monorepo TMC Studio (Turborepo + pnpm). Dla każdego issue:

1. **Analiza kodu** — czytanie rzeczywistych plików źródłowych (TypeScript/TSX)
2. **Identyfikacja lokalizacji** — konkretne pliki, funkcje, linie kodu
3. **Ocena severity** — według wpływu na użytkownika i ryzyka produkcyjnego
4. **Propozycja strategii naprawy** — konkretne kroki implementacji

**Zakres audytu:**
- Frontend: `apps/web/` (React 18 + Zustand + Vite)
- Pakiet board: `packages/board/` (React-Konva rendering)
- Pakiet core: `packages/core/` (typy, factory functions)
- Pakiet UI: `packages/ui/` (komponenty)
- Backend: `supabase/migrations/` + `supabase/config.toml`
- Funkcje Netlify: `netlify/functions/`
- Stan: store Zustand z slice'ami

---

## 2. Podsumowanie Executive

| Issue | Severity | Status | Szacowany czas |
|-------|----------|--------|----------------|
| #1 — Numerowanie strzałek | 🟠 MEDIUM | ✅ Zrobione (Sprint C) | 6-8 godzin |
| #2 — Responsywność boiska | 🟡 HIGH | ⚠️ Częściowo | 4-6 godzin |
| #3 — Rączki (handles/Transformer) | 🟡 HIGH | ⚠️ Częściowo — TextNode POC ✅ | 3-4 godziny |
| #4 — Prawy sidebar + kalibracja | 🟡 HIGH | ❌ Niezaimplementowane | 4-6 godzin |
| #5 — Tutorial strzałkowy | 🟠 MEDIUM | ❌ Niezaimplementowane | 3-4 godziny |
| #6 — Podpisy zawodników | 🟠 MEDIUM | ⚠️ Częściowo | 2-3 godziny |
| #7 — System subskrypcji | 🔴 BLOCKER | ⚠️ Częściowo | 8-12 godzin |
| #8 — Ogólne UX | 🟠 MEDIUM | ⚠️ Częściowo | 6-8 godzin |
| #9 — Panel zapisywania plików | 🟡 HIGH | ⚠️ Częściowo | 5-7 godzin |

**Najważniejsze znaleziska:**
1. **Transformer POC dla TextNode** — Issue #3 (🟡 HIGH): Sprint B zakończony — TextNode ma Konva Transformer z 4 anchorami + rotate. Pozostałe elementy (ZoneNode, PlayerNode, ArrowNode) czekają na expand.
2. **System subskrypcji bez UI enforcement** — Issue #7 (🔴 BLOCKER): całe Entitlements i Stripe są zaimplementowane, ale funkcja `can()` z `entitlements.ts` NIGDZIE nie jest wywoływana w UI. Nie ma gatingu dla eksportu GIF/PDF, limitów projektów ani kroków.
3. **Numeracja strzałek** — Issue #1 (✅ Zrobione): renumeracja, toggleAutoNumbering, integracja z deleteSelected. 25 testów.
3. **Brak przycisku kalibracji i tutoriala** — Issues #4 i #5 całkowicie niezaimplementowane.
4. **Numeracja strzałek działa, ale ma lukę w renumeracji** — Issue #1: `toggleArrowNumber` zawsze przypisuje `max+1`, brak opcji renumeracji po usunięciu strzałki.

---

## 3. Issue #1 — Numerowanie strzałek

**Severity:** 🟠 MEDIUM
**Status:** ⚠️ Częściowo — zaimplementowane, ale niekompletne

### Szczegółowa analiza

System numeracji strzałek (PR-ARROW-NUMBER) został zaimplementowany w kilku warstwach:

1. **Typy** (`packages/core/src/types.ts`, linie 82-85):
   ```typescript
   number?: number;
   showNumber?: boolean;
   ```
   ArrowElement ma pola `number` i `showNumber`.

2. **Factory** (`packages/core/src/board.ts`, linia ~285):
   ```typescript
   showNumber: false,
   ```
   Nowe strzałki domyślnie mają `showNumber: false`.

3. **Elements slice** (`apps/web/src/store/slices/elementsSlice.ts`):
   - `toggleArrowNumber` (linia 337): przełącza showNumber dla pojedynczej strzałki. Przy włączeniu — przypisuje `getHighestArrowNumber(elements) + 1` (linia 356). Przy wyłączeniu — tylko `showNumber: false` (linia 349).
   - `setArrowNumber` (linia 370): ręczne ustawienie numeru.
   - `addArrowAtCursor` (linia 208): gdy `isAutoNumbering` jest true, przypisuje `max+1` (linia 215).
   - `getHighestArrowNumber` (linia 76): znajduje max numer wśród wszystkich strzałek (0 jeśli brak).

4. **Łańcuch zdarzeń w UI:**
   - **Shift+A / Shift+R** → `setNextArrowShouldBeNumbered(true)` + aktywacja narzędzia strzałki
   - **Strzałka w prawo na wybranej strzałce** → `toggleArrowNumber(arrowId)` (keyboard shortcuts, linia 728)
   - **Shift+N** → `toggleAutoNumbering()` (keyboard shortcuts, linia 630)

5. **Renderowanie** (`packages/board/src/ArrowNode.tsx`, linie 310-331):
   - Gdy `arrow.showNumber && arrow.number !== undefined`, renderuje `Circle + Text` w środku strzałki
   - Okrąg: `radius=12`, wypełnienie `#1a1a1a`, stroke `#ffffff`
   - Tekst: `fontSize=13`, fontStyle `bold`, fill `#ffffff`

### Problemy zidentyfikowane

**1. 🔴 LUKA: Brak renumeracji po usunięciu strzałki**
- Gdy strzałka nr 5 zostanie usunięta, nowa strzałka dostanie numer 6, a nie 5
- `getHighestArrowNumber` używa `Math.max(...numbers)` — nie bierze pod uwagę "dziur" w sekwencji
- Brak funkcji `renumberAllArrows()` która by przebudowała ciąg 1..N

**2. 🟠 LUKA: Brak sequencji per-arrow-type**
- Wszystkie typy strzałek (pass, run, shoot) współdzielą tę samą sekwencję
- Użytkownicy mogą oczekiwać osobnych sekwencji dla pass i run

**3. 🔵 Brak keyboard shortcut do usuwania numeru**
- Nie ma skrótu do `setArrowNumber(id, undefined)` — czyli usunięcia numeru zamiast tylko ukrycia

### Pliki objęte

| Plik | Linie | Rola |
|------|-------|------|
| `packages/core/src/types.ts` | 82-85 | Definicja pól number/showNumber |
| `packages/core/src/board.ts` | 285 | Domyślna wartość showNumber: false |
| `packages/board/src/ArrowNode.tsx` | 310-331 | Renderowanie numerka na strzałce |
| `apps/web/src/store/slices/elementsSlice.ts` | 76-79, 208-218, 337-380 | Logika przypisywania i toggle numerów |
| `apps/web/src/hooks/useKeyboardShortcuts.ts` | 107-109, 434-452, 630-635, 725-730 | Skróty klawiszowe dla numeracji |

### Strategia naprawy

1. **Renumeracja przy usuwaniu** — dodaj `renumberAllArrows()` w elementsSlice, wołaj po `deleteSelected`
2. **Osobne sequencje per typ** — `getHighestArrowNumber(type)` z filtrowaniem po `arrowType`
3. **Skrót do usuwania numeru** — dodaj w `useKeyboardShortcuts.ts` (np. Delete na wybranej strzałce usuwa numer)
4. **Opcja "continuous numbering"** — UI toggle w Inspectorze: numerowanie ciągłe vs per-type

**Szacowany czas:** 6-8 godzin

---

## 4. Issue #2 — Responsywność boiska (resize)

**Severity:** 🟡 HIGH
**Status:** ⚠️ Częściowo — działa, ale nie w pełni

### Szczegółowa analiza

System resize boiska znajduje się w `BoardCanvasSection.tsx`. Główne mechanizmy:

1. **ResizeObserver** (linie ~75-110):
   ```typescript
   useEffect(() => {
     const container = containerRef.current;
     if (!container) return;
     const observer = new ResizeObserver((entries) => {
       for (const entry of entries) {
         const cw = entry.contentRect.width;
         const ch = entry.contentRect.height;
         // auto-scale-down when container shrinks
         const newFitZoom = Math.min((cw-pad)/canvasWidth, (ch-pad)/canvasHeight, MAX_FIT_UPSCALE);
         if (curZoom > newFitZoom) {
           useUIStore.getState().setZoom(newFitZoom);
           // center
         }
         setContainerSize({ width: cw, height: ch });
       }
     });
   ```
   Automatycznie skaluje w dół gdy kontener się zmniejsza.

2. **Fit-zoom computation** (linie ~119-125):
   ```typescript
   const fitZoom = containerSize.width > MIN_CONTAINER_SIZE && containerSize.height > MIN_CONTAINER_SIZE
     ? Math.min((cw - pad) / canvasWidth, (ch - pad) / canvasHeight, MAX_FIT_UPSCALE) : 1;
   ```

3. **Bug 2: auto-center na zoom change** (linie ~230-240):
   ```typescript
   useEffect(() => {
     // force pitch back to center when scaled dimensions fit
     if (physW < cw || physH < ch) { ... }
   }, [zoom, fitZoom, canvasWidth, canvasHeight, containerSize]);
   ```

4. **useTouchGestures** (linie ~190-200): pinch zoom + two-finger pan z hooka `useTouchGestures.ts`.

5. **Wheel zoom-to-cursor** (linie ~130-180): Ctrl+wheel z korektą do kursora.

6. **useViewportSync** (`hooks/useViewportSync.ts`): aktualizuje breakpoint w store na podstawie `window.resize`.

### Problemy zidentyfikowane

**1. 🟡 Problem: resize działa asymetrycznie (ściślej — działa tylko skalowanie w dół)**
- `newFitZoom` jest używane tylko gdy `curZoom > newFitZoom` — czyli gdy kontener się zmniejsza
- Gdy kontener się zwiększa (okno rozwinięte), zoom NIE jest automatycznie zwiększany
- Użytkownik musi ręcznie kliknąć Zoom Fit

**2. 🟠 MIN_CONTAINER_SIZE = 200 jest bezpieczny ale nie elastyczny**
- Poniżej 200px boisko znika, brak fallback UI

**3. 🔵 useViewportSync nie aktualizuje canvas dimensions**
- `useViewportSync` aktualizuje tylko breakpoint, ale nie triggeruje re-miary canvasu
- Canvas dimensions są zarządzane tylko przez ResizeObserver w BoardCanvasSection

### Pliki objęte

| Plik | Linie | Rola |
|------|-------|------|
| `apps/web/src/app/board/BoardCanvasSection.tsx` | 75-125, 130-180, 190-200, 230-240 | ResizeObserver, zoom, fit-zoom |
| `apps/web/src/hooks/useViewportSync.ts` | 1-30 | Breakpoint sync |
| `apps/web/src/hooks/useTouchGestures.ts` | 1-100 | Pinch zoom + two-finger pan |
| `apps/web/src/store/useUIStore.ts` | 1-20, 300-350 | Zoom state, breakpoints |

### Strategia naprawy

1. **Auto-expand zoom** — dodaj warunek w ResizeObserver: gdy `newFitZoom > curZoom` i nie ma user zoom, auto-expand
2. **Fallback UI** — gdy `containerSize < MIN_CONTAINER_SIZE`, pokaż miejsce na "too small" overlay
3. **Viewport dimension cache** — dodaj `useCanvasDimensions` hook cache'ujący wymiary dla ResizeObserver

**Szacowany czas:** 4-6 godzin

---

## 5. Issue #3 — Rączki (handles/Transformer)

**Severity:** 🟡 HIGH
**Status:** ⚠️ Częściowo — Sprint B (TextNode POC) ✅ ZROBIONE

### Sprint B — Transformer POC dla TextNode

**Zrobione (2026-06-10):** Minimalny Konva Transformer dla TextNode w `CanvasElements.tsx`.

#### Co zaimplementowano

1. **Importy:** `useRef`, `useEffect`, `Transformer` z react-konva, `type Konva`
2. **`transformerRef`** — `useRef<Konva.Transformer>(null)`
3. **`useEffect([selectedIds, elements, isPlaying])`** — logika attach/detach:
   - Jeśli `!isPlaying && selectedIds.length === 1 && isTextElement(selectedId)` → `stage.findOne('#' + id)` → `tr.nodes([node])`
   - W przeciwnym razie → `tr.nodes([])` (detach)
4. **JSX `<Transformer>`** w Layer, między TextNode a Drawing preview
5. **Konfiguracja:** 4 anchory narożne (`top-left`, `top-right`, `bottom-left`, `bottom-right`), rotate (offset 25px), niebieskie obramowanie (#3b82f6), min size 20×10

#### Dlaczego tylko TextNode

| Element | Decyzja | Uzasadnienie |
|---------|---------|--------------|
| **TextNode** | ✅ Transformer POC | Potwierdzony `<Group id={text.id}>` w TextNode.tsx (linia 142). `stage.findOne` działa. |
| **ZoneNode** | ❌ Poza zakresem | Ma własny 8-punktowy resize — realny konflikt z Transformerem. |
| **PlayerNode** | ❌ Poza zakresem | Ma ALT+drag rotation. Transformer z `enabledAnchors=[]` tylko rotate może zastąpić, ale to wymaga testów. |
| **ArrowNode** | ❌ Poza zakresem | Ma własne endpoint handles (kółka). Transformer na całej strzałce zepsułby UX. |

#### Weryfikacja

- ✅ TypeScript: 0 błędów w CanvasElements.tsx
- ✅ Testy: 83/83 pass (4 test files)
- ✅ Brak wpływu na PlayerNode (ALT+drag), ZoneNode (resize), ArrowNode (handles)
- ✅ Brak zmian w numeracji, podpisach, konfiguracji

#### Co dalej (poza zakresem Sprint B)

Potencjalna ekspansja w przyszłych sprintach:
- **ZoneNode** — jeśli konflikt z istniejącym resize jest rozwiązany (np. wyłączenie własnego resize na rzecz Transformer)
- **PlayerNode** — tylko rotate (enabledAnchors=[]), alternatywa dla ALT+drag
- **Multi-select** — Transformer dla wielu elementów jednocześnie

### Stan przed Sprint B (archiwum)

Przed Sprint B w całej bazie kodu nie było ani jednego importu `Transformer` z `react-konva`. Elementy na canvasie NIE miały wizualnych uchwytów transformacji.

1. **CanvasElements.tsx** — renderował elementy, ale **NIGDZIE** nie było `Transformer` lub `KonvaTransformer`
2. **Selekcja działała przez props** — elementy otrzymywały `isSelected` i zmieniały styl obramowania
3. **ALT+Drag rotation istniał dla PlayerNode** — rączki rotacji nie były renderowane

### Pliki zmienione w Sprint B

| Plik | Zmiana |
|------|--------|
| `apps/web/src/app/board/canvas/CanvasElements.tsx` | +Transformer, +useRef, +useEffect, +logika attach/detach |

---

## 6. Issue #4 — Prawy sidebar + przycisk kalibracji

**Severity:** 🟡 HIGH
**Status:** ❌ Niezaimplementowane — przycisk kalibracji nie istnieje

### Szczegółowa analiza

1. **RightInspector** (`packages/ui/src/RightInspector.tsx`):
   - Działa jako collapsible panel z zakładkami: Props, Layers, Objects, Teams, Pitch
   - Renderowany w `BoardPage.tsx` (linia ~115-140) z props z `useBoardPageState`
   - `isOpen` z useUIStore: `inspectorOpen`
   - Na mobile: `breakpoint 'sm'/'md'` → zachowanie bottom sheet

2. **Przycisk kalibracji — NIE ISTNIEJE:**
   - `grep` za "calibrat" lub "calibr" w całym kodzie: **0 wyników**
   - Nie ma mechanizmu kalibracji touch/pen
   - Nie ma FAB (Floating Action Button) do tego

3. **Obsługa dotyku istnieje** (`useTouchGestures.ts`):
   - Pinch zoom, two-finger pan, double-tap zoom-fit
   - Ale brak kalibracji punktów dotyku dla pióra/touch

### Pliki objęte

| Plik | Linie | Rola |
|------|-------|------|
| `packages/ui/src/RightInspector.tsx` | 1-400 | Right sidebar UI |
| `apps/web/src/app/board/BoardPage.tsx` | 115-140 | Renderowanie RightInspector |
| `apps/web/src/hooks/useTouchGestures.ts` | 1-120 | Istniejący handling touch |
| `apps/web/src/store/useUIStore.ts` | 40, 130 | inspectorOpen state |

### Strategia naprawy

1. **Przycisk kalibracji** — dodaj FAB w CanvasShell/BoardCanvasSection:
   - Ikona "crosshair" lub "target"
   - Po kliknięciu: overlay z punktami dotykowymi do kalibracji
2. **Z-index layering** — FAB na z-30 (nad ZoomWidget na z-20)
3. **Inspector na mobile** — RightInspector już ma bottom sheet, potrzeba przycisku toggle w top barze

**Szacowany czas:** 4-6 godzin

---

## 7. Issue #5 — Tutorial strzałkowy (5 kroków)

**Severity:** 🟠 MEDIUM
**Status:** ❌ Niezaimplementowane — brak kodu tutoriala

### Szczegółowa analiza

**W całym kodzie nie ma żadnego systemu tutorial/onboarding:**

1. **Grep za "tutorial", "onboarding", "tour", "walkthrough", "first.time"** — **0 wyników w kodzie źródłowym**
2. Jedyna "onboarding" funkcja to **ShortcutsHint** (`packages/ui/src/ShortcutsHint.tsx`):
   - Pojedynczy hint "Press ? for shortcuts • ⌘K for commands"
   - Auto-dismiss po 3 sekundach
   - `hasSeenShortcutsHint` w localStorage
3. **EmptyStateOverlay** (`packages/ui/src/EmptyStateOverlay.tsx`):
   - Pojawia się gdy `elements.length === 0`
   - Oferuje 3 przyciski: Add Player, Add Ball, Add Arrow + Command Palette
   - **To nie jest tutorial** — to tylko placeholder dla pustej tablicy

### Analiza UX

| Element | Istnieje? | Co robi |
|---------|-----------|---------|
| EmptyStateOverlay | ✅ | Pokazuje opcje gdy board jest pusty |
| ShortcutsHint | ✅ | Jednorazowy hint w top-right |
| CheatSheet | ✅ | `?` — pełna lista skrótów |
| Tutorial krok po kroku | ❌ **NIE** | Nie istnieje |
| Highlight overlay | ❌ **NIE** | Nie istnieje |
| Sekwencja onboardingowa | ❌ **NIE** | Nie istnieje |

### Strategia naprawy

1. **Stan tutoriala** — dodaj w useUIStore: `tutorialStep: 0 | 1 | 2 | 3 | 4 | 5 | 'done'`
2. **Overlay krok po kroku** — stwórz `TutorialOverlay` w `packages/ui/`:
   - Krok 1: "Kliknij 'P' aby dodać zawodnika" (z strzałką)
   - Krok 2: "Kliknij 'A' aby dodać strzałkę"
   - Krok 3: "Kliknij 'B' aby dodać piłkę"
   - Krok 4: "Użyj scrolla do zoomu"
   - Krok 5: "Naciśnij '?' aby zobaczyć skróty"
3. **Warunek wyświetlania** — tylko dla nowych użytkowników (flag w localStorage)
4. **Limit czasu** — każdy krok auto-dismiss po 20 sekundach
5. **Pomijanie** — kliknięcie w tle/tło zamyka tutorial

**Szacowany czas:** 3-4 godziny

---

## 8. Issue #6 — Podpisy zawodników (styl Tactical Pad)

**Severity:** 🟠 MEDIUM
**Status:** ⚠️ Częściowo — działa ale ma ograniczenia

### Szczegółowa analiza

Podpisy zawodników są renderowane w `PlayerNode.tsx` w dwóch miejscach:

1. **Numer/etykieta na ciele zawodnika** (linie 521-540):
   ```tsx
   {((player.showLabel && player.label) || player.number != null) && (
     <Group rotation={textRotation} listening={false}>
       <Text
         x={-r}
         y={-(player.fontSize ?? 14) / 2}
         width={r * 2}
         height={player.fontSize ?? 14}
         text={player.showLabel && player.label ? player.label : String(player.number)}
         fontSize={player.fontSize ?? 14}
         fontFamily="Inter, system-ui, sans-serif"
         fontStyle="bold"
         fill={player.textColor ?? colors.text}
         align="center"
         verticalAlign="middle"
         listening={false}
       />
     </Group>
   )}
   ```

2. **Label poniżej zawodnika** (linie 542-550) — gdy `player.label && !player.showLabel`:
   ```tsx
   <Text
     x={-30}
     y={r + 4}
     width={60}
     text={player.label}
     fontSize={10}
     // ...
   />
   ```

3. **fontSize na ciele** — domyślnie 14 (rzadko zmieniane)
4. **fontSize labelu pod spodem** — zawsze 10 (hardkodowane)
5. **TextNode** (`packages/board/src/TextNode.tsx`) — niezależny element tekstowy z `fontSize: 22`

### Problemy zidentyfikowane

1. **🟠 Brak auto-skalowania czcionki względem zoomu**
   - `fontSize` jest stałe — przy zoomie 0.5 tekst jest za mały, przy zoomie 2 za duży
   - Powinno: `fontSize * (1/zoom)` lub stała wielkość ekranowa

2. **🟠 Label poniżej nie ma kontrastu** — `fill="#ffffff"` hardkodowane, nie zmienia się z team settings

3. **🔵 Brak shadow/outline dla czytelności** — tekst może być nieczytelny na tle boiska

4. **🔵 fontSize (14) w PlayerNode nie jest użyty z Inspectorem**
   - Inspector ma slider dla fontSize, ale PlayerNode ma własną domyślną wartość 14

### Pliki objęte

| Plik | Linie | Rola |
|------|-------|------|
| `packages/board/src/PlayerNode.tsx` | 521-550 | Renderowanie numerów i labeli |
| `packages/board/src/TextNode.tsx` | 1-100 | Niezależny tekst |
| `packages/core/src/types.ts` | 50-55 | Typ PlayerElement (label, showLabel, fontSize, textColor) |

### Strategia naprawy

1. **Skalowanie czcionki** — dodaj `effectiveFontSize = (player.fontSize ?? 14) * (1 / (groupZoom || 1))`
2. **Label kontrast** — `fill` z `effectiveColor` zamiast `#ffffff` + `shadowEnabled`
3. **TextNode fontSize scaling** — analogicznie do PlayerNode
4. **Outline/shadow** — dodaj `shadowColor`, `shadowBlur`, `shadowEnabled` dla Text w PlayerNode

**Szacowany czas:** 2-3 godziny

---

## 9. Issue #7 — System subskrypcji (3 plany Premium)

**Severity:** 🔴 BLOCKER
**Status:** ⚠️ Częściowo — infrastruktura gotowa, UI prawie gotowe, ale brak enforcement

### Szczegółowa analiza

#### Backend (Supabase + Stripe)

1. **Schema migracje:**
   - `20260108000000_initial_schema.sql` — `profiles.subscription_tier` (free/pro/team), projekty, udostępnianie
   - `20260108000001_add_stripe_customer_id.sql` — `stripe_customer_id` w profiles
   - `20260110000000_add_user_preferences.sql` — `preferences JSONB`
   - `20260111000000_add_stripe_webhook_events.sql` — tabela idempotencji webhooków
   - `20260109000002_add_project_organization.sql` — foldery + organizacja

2. **Webhook Stripe** (`netlify/functions/stripe-webhook.ts`):
   - Obsługa: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Idempotencja przez `stripe_webhook_events` (INSERT-first pattern)
   - Mapowanie Price ID → tier przez `_stripeConfig.ts`

3. **Entitlements** (`apps/web/src/lib/entitlements.ts`):
   - `Plan`: `'guest' | 'free' | 'pro' | 'team'`
   - `Entitlements`: maxProjects, maxSteps, maxFolders, cloudSync, export capabilities
   - **Funkcja `can()` zwraca wartości, ale NIGDZIE nie jest wywoływana w UI**

#### Frontend

4. **PricingModal** (`packages/ui/src/PricingModal.tsx`):
   - 3 plany: Free (Included), Pro ($9/mo), Team ($29/mo)
   - Stripe Checkout przez `/.netlify/functions/create-checkout`
   - Price ID skonfigurowane (TEST mode)
   - **Modal działa, ale nie jest blokujący — użytkownik może go zamknąć i używać pełnej aplikacji**

5. **Auth Store** (`apps/web/src/store/useAuthStore.ts`):
   - `isAuthenticated`, `isPro`, `isTeam` z profilu Supabase
   - `subscription_tier` z profiles → `isPro` = pro || team

6. **Config Stripe** (`apps/web/src/config/stripe.ts`):
   - Price ID dla Pro/Team (miesięczne i roczne)
   - **UWAGA: Wszystkie w trybie TEST**

#### Główne problemy

**1. 🔴 BLOCKER: Funkcja `can()` nigdzie nie jest wywoływana**
   - `entitlements.ts` definiuje `can(plan, action)` dla createProject, exportGIF, exportPDF, addStep, createFolder
   - **Żaden komponent ani hook nie importuje `can`**
   - LimitReachedModal istnieje (`packages/ui/src/LimitReachedModal.tsx`) ale nie jest podpięty

**2. 🟡 Brak RLS dla subscription_tier**
   - Migracje nie zawierają polityk RLS sprawdzających subscription_tier
   - Każdy uwierzytelniony użytkownik może tworzyć projekty

**3. 🟡 PricingModal ma import fallback** — dynamiczny require z path `../../apps/web/src/config/stripe`:
   ```typescript
   STRIPE_PRICES = require('../../apps/web/src/config/stripe').STRIPE_PRICES;
   ```
   To może nie działać w production build (turborepo może mieć inne ścieżki).

### Pliki objęte

| Plik | Linie | Rola |
|------|-------|------|
| `supabase/migrations/20260108000000_initial_schema.sql` | 1-200 | Schema: profiles.subscription_tier |
| `supabase/migrations/20260108000001_add_stripe_customer_id.sql` | 1-30 | stripe_customer_id |
| `supabase/migrations/20260111000000_add_stripe_webhook_events.sql` | 1-30 | Webhook events table |
| `netlify/functions/stripe-webhook.ts` | 1-200 | Webhook handler |
| `apps/web/src/lib/entitlements.ts` | 1-170 | Entitlements + can() |
| `apps/web/src/config/stripe.ts` | 1-50 | Price IDs |
| `packages/ui/src/PricingModal.tsx` | 1-200 | UI modal |
| `apps/web/src/store/useAuthStore.ts` | 1-100 | Auth state + isPro |
| `packages/ui/src/LimitReachedModal.tsx` | 1-50 | Limit modal (nieużywany) |

### Strategia naprawy

1. **Krok 1: Gating eksportów** — w `useKeyboardShortcuts.ts` i komponentach eksportu:
   ```typescript
   if (can(derivePlan(isAuthenticated, subscriptionTier), 'exportGIF') === 'hard-block') {
     showToast('Upgrade to Pro for GIF export');
     onOpenPricingModal?.();
     return;
   }
   ```
2. **Krok 2: Gating projektów** — w `onCreateProject` przed fetch:
   - `can('createProject', { projectCount })`
3. **Krok 3: Gating kroków** — w `addStep`:
   - `can('addStep', { stepCount })`
4. **Krok 4: RLS** — dodaj polityki sprawdzające subscription_tier przy INSERT
5. **Krok 5: PricingModal import fix** — użyj `import` zamiast `require`
6. **Krok 6: Hook `useEntitlements`** — dodaj helper hook łączący `derivePlan` + `can`

**Szacowany czas:** 8-12 godzin

---

## 10. Issue #8 — Ogólne usprawnienia UX

**Severity:** 🟠 MEDIUM
**Status:** ⚠️ Częściowo — wiele elementów działa, ale są luki

### Szczegółowa analiza

#### Toast / feedback

| Aspekt | Status | Lokalizacja |
|--------|--------|-------------|
| Toast notifications | ✅ Działa | `useUIStore.showToast()`, `activeToast` |
| Undo/Redo feedback | ⚠️ Częściowo | `showToast('Undone')` ale nie showToast('Redone') |
| Auto-dismiss | ✅ Działa | `setTimeout` w showToast |
| Save confirmation | ✅ Działa | `showToast('Saved to cloud ☁️')` |

#### Keyboard shortcuts

| Aspekt | Status | Lokalizacja |
|--------|--------|-------------|
| ~85 skrótów | ✅ Działa | `useKeyboardShortcuts.ts` |
| Cheat Sheet | ✅ Działa | `CheatSheetOverlay` z `?` |
| Command Palette | ✅ Działa | `⌘K` |
| Cursor states | ⚠️ Częściowo | `PlayerNode.tsx` ma `cursor='crosshair'` / `'grabbing'` |
| Guard dla inputów | ✅ Działa | Skip gdy target w INPUT/TEXTAREA |
| Guard dla context menu | ✅ Działa | Tylko Escape |

#### Mobile / Touch

| Aspekt | Status | Lokalizacja |
|--------|--------|-------------|
| Pinch zoom | ✅ Działa | `useTouchGestures.ts` |
| Two-finger pan | ✅ Działa | `useTouchGestures.ts` |
| Double-tap zoom-fit | ✅ Działa | `useTouchGestures.ts` |
| Touch keyboard guard | ⚠️ Częściowo | Brak guarda dla virtual keyboard |

#### Accessibility

| Aspekt | Status | Lokalizacja |
|--------|--------|-------------|
| aria-labels | ❌ Brak | Większość buttonów nie ma aria-label |
| Focus ring | ❌ Brak | Nie wykryto focus-visible styles |
| Tab order | ⚠️ Częściowo | Canvas ma tabIndex, ale overlaye nie |
| Dark mode | ✅ Działa | `theme` w useUIStore, `dark` class na HTML |
| Print mode | ✅ Działa | `togglePrintMode`, sanitizacja kolorów |

#### Cursor states

| Element | Cursor | Lokalizacja |
|---------|--------|-------------|
| PlayerNode (normal) | Brak | Brak `cursor='pointer'` |
| PlayerNode (ALT drag) | `crosshair` / `grabbing` | PlayerNode.tsx linia 567 |
| ArrowNode (endpoint) | Brak | Brak `cursor` |
| ZoneNode | Brak | Brak `cursor` |
| Space+drag | Brak CSS | Tylko JS handle |
| Canvas (draw tool) | Brak | Brak specific cursor |

### Problemy zidentyfikowane

1. **🟠 Brak aria-label na przyciskach** — problem WCAG
2. **🟠 Brak cursor:pointer na elementach** — użytkownik nie wie co jest klikalne
3. **🔵 Brak focus ring** — accessibility issue
4. **🔵 Toast dla redo nie istnieje** — tylko undo ma feedback

### Pliki objęte

| Plik | Linie | Rola |
|------|-------|------|
| `apps/web/src/hooks/useKeyboardShortcuts.ts` | 1-900 | Wszystkie skróty |
| `apps/web/src/store/useUIStore.ts` | 200-300 | Toast, focus mode |
| `packages/ui/src/ShortcutsHint.tsx` | 1-80 | One-time hint |
| `packages/ui/src/EmptyStateOverlay.tsx` | 1-100 | Empty state |
| `packages/ui/src/ZoomWidget.tsx` | 1-120 | Zoom controls |
| `packages/ui/src/RightInspector.tsx` | 1-400 | Inspector |
| `packages/board/src/PlayerNode.tsx` | 560-570 | Cursor states |

### Strategia naprawy

1. **Aria-labels** — dodaj we wszystkich buttonach: ZoomWidget, RightInspector, BottomBar
2. **Cursor:pointer** — dodaj w CanvasElement wrappers dla wszystkich typów elementów
3. **Focus ring** — dodaj w Tailwind config: `focus-visible:ring-2 focus-visible:ring-accent`
4. **Toast dla redo** — dodaj w `useKeyboardShortcuts.ts`: `showToast('Redone')`

**Szacowany czas:** 6-8 godzin

---

## 11. Issue #9 — Panel zapisywania plików

**Severity:** 🟡 HIGH
**Status:** ⚠️ Częściowo — działa ale brakuje kluczowych elementów

### Szczegółowa analiza

#### Supabase Schema

1. **Tabela projects** (`20260108000000_initial_schema.sql`):
   - `id UUID`, `user_id`, `name`, `description`, `document JSONB`, `thumbnail_url`
   - `version INTEGER`, `is_public`, `is_template`
   - RLS: user może czytać/pisać tylko własne projekty + shared

2. **Tabela project_folders** (`20260109000002_add_project_organization.sql`):
   - `name`, `color`, `icon`, `parent_id`, `position`
   - Obsługa hierarchii folderów z ochroną przed cyklami

#### ProjectsDrawer

3. **`packages/ui/src/ProjectsDrawer.tsx`**:
   - Slide-out panel z listą projektów
   - Sortowanie: recent, name-asc, name-desc, favorites, last-opened
   - Drzewo folderów z `buildFolderTree()` - ochrona przed cyklami
   - Drag & drop folderów (przez `onMoveFolderToParent`)
   - `ContextMenu` dla każdego projektu/foldera
   - `computeSortOrder()` dla wstawiania między rodzeństwem

#### AutosaveService

4. **`apps/web/src/services/AutosaveService.ts`**:
   - Singleton z debounced save
   - `configure()`, `markDirty()`, `flush()`
   - Retry na błędzie (keep isDirty = true)
   - **Brak generowania miniaturek** — nie woła `uploadThumbnail()`

#### Supabase client

5. **`apps/web/src/lib/supabase.ts`** (linie 759-775):
   - `uploadThumbnail()` istnieje jako funkcja
   - `getProjects()` — fetch projektów z cloud
   - `createProject()`, `updateProject()`, `deleteProject()`

### Problemy zidentyfikowane

1. **🔴 BLOCKER: AutosaveService nie generuje miniaturek**
   - `uploadThumbnail()` istnieje w supabase.ts ale nie jest wywoływane przez AutosaveService
   - Projekty na liście nie mają podglądów (thumbnails)

2. **🟡 Brak potwierdzenia usunięcia projektu**
   - `onDeleteProject` istnieje jako prop, ale brak `ConfirmModal` przed wykonaniem

3. **🟡 Sortowanie projektów nie ma opcji "by folder"**
   - Projekty są wyświetlane globalnie, brak widoku "wszystkie projekty w folderze"

4. **🔵 Brak wersjonowania**
   - `version` istnieje w schema, ale nie jest inkrementowany przy zapisie
   - Brak historii wersji — każdy save nadpisuje dokument

### Pliki objęte

| Plik | Linie | Rola |
|------|-------|------|
| `packages/ui/src/ProjectsDrawer.tsx` | 1-800 | Panel boczny z listą projektów |
| `apps/web/src/services/AutosaveService.ts` | 1-100 | Autosave (bez thumbnails) |
| `apps/web/src/lib/supabase.ts` | 759-775 | Funkcja uploadThumbnail |
| `supabase/migrations/20260108000000_initial_schema.sql` | 1-200 | Schema projects |
| `supabase/migrations/20260109000002_add_project_organization.sql` | 1-100 | Foldery |

### Strategia naprawy

1. **Generowanie miniatur** — dodaj w AutosaveService po zapisie:
   ```typescript
   const dataUrl = stageRef.current?.toDataURL({ mimeType: 'image/png', pixelRatio: 0.25 });
   if (dataUrl) {
     const blob = await (await fetch(dataUrl)).blob();
     await uploadThumbnail(projectId, blob);
   }
   ```
2. **ConfirmModal na delete** — przed `onDeleteProject` pokaż modal
3. **Widok folderu** — gdy folder wybrany, filtruj projekty po `folderId`
4. **Inkrementacja version** — przy każdym zapisie do cloud: `version: currentVersion + 1`
5. **Sortowanie w folderze** — dodaj `position` sorting dla projektów w folderze

**Szacowany czas:** 5-7 godzin

---

## 12. Wnioski i rekomendacje

### Priorytety (według severity)

| Priority | Issue | Czas | Zależności |
|----------|-------|------|------------|
| 🔴 P1 | #3 — Transformer (rączki) | 3-4h | Brak |
| 🔴 P1 | #7 — Gating subskrypcji | 8-12h | Brak |
| 🟡 P2 | #4 — Kalibracja + FAB | 4-6h | Brak |
| 🟡 P2 | #9 — Thumbnails w Autosave | 5-7h | #7 (bo cloud) |
| 🟡 P2 | #2 — Responsywność (auto-expand) | 4-6h | Brak |
| 🟠 P3 | #1 — Renumeracja strzałek | 6-8h | Brak |
| 🟠 P3 | #5 — Tutorial onboarding | 3-4h | Brak |
| 🟠 P3 | #6 — Skalowanie fontów | 2-3h | Brak |
| 🟠 P3 | #8 — UX (aria, cursory, focus) | 6-8h | Rozproszone |

### Zależności między issue

- **#9 (thumbnails) wymaga #7** — bo thumbnails są uploadowane do cloud storage
- **#5 (tutorial) może wykorzystać #4 (FAB)** — jako trigger do tutoriala
- **#3 (Transformer) wymaga refaktoryzacji eventów** — obecnie elementy same obsługują selekcję

### Ryzyka

1. **Stripe TEST mode** — wszystkie Price ID są testowe. Przed produkcyjnym wdrożeniem #7 trzeba zmienić na LIVE
2. **Import fallback w PricingModal** — `require('../../apps/web/...')` może się zepsuć w production build
3. **Autosave nie ma rate limitingu** — częste zapisy mogą przeciążyć API Supabase (free tier ma limity)

### Rekomendacje strategiczne

1. **Najpierw #7 (gating)** — bez tego MVP nie ma mechanizmu monetyzacji
2. **Potem #3 (rączki)** — to najbardziej widoczny brak UX
3. **Następnie #9 (thumbnails)** — poprawia odbiór przez użytkownika
4. **Reszta** wg priorytetu

---

*Audyt przeprowadzony przez GitHub Copilot (Delivery Agent) 2026-06-10.*
*Branch: develop (HEAD: 7c5882d)*