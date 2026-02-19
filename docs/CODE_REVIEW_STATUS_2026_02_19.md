# TMC Studio — Dogłębny Code Review & Status

> **Data:** 2026-02-19  
> **Autor:** Code Review AI (Cline)  
> **Zakres:** Pełna analiza — git history, dokumentacja, kod, architektura, testy  
> **Stan repo:** czyste (brak uncommitted changes), branch `main`

---

## Spis treści

1. [Metryki projektu](#1-metryki-projektu)
2. [Co jest SKOŃCZONE](#2-co-jest-skończone)
3. [Co NIE JEST skończone](#3-co-nie-jest-skończone)
4. [Dług techniczny i problemy jakościowe](#4-dług-techniczny-i-problemy-jakościowe)
5. [Naruszenia architektury](#5-naruszenia-architektury)
6. [Priorytetyzowane TODO](#6-priorytetyzowane-todo)

---

## 1. Metryki projektu

| Metryka | Wartość |
|---------|---------|
| Łącznie LOC (kod TS/TSX) | **26,282** |
| Pliki kodu (.ts / .tsx) | **199** |
| Pliki dokumentacji (docs/*.md) | **67** |
| Pliki testowe | **2** (34 testy łącznie) |
| TypeScript errors (`tsc --noEmit`) | **0 ✅** |
| Working tree (uncommitted changes) | **Czyste ✅** |
| Aktywne branche | **1 (tylko `main`)** |
| TODOs w kodzie | **10** |
| console.log / console.warn / console.error | **101** |

### Największe pliki (kandydaci do podziału)

| Plik | LOC |
|------|-----|
| `packages/ui/src/ProjectsDrawer.tsx` | **1141** |
| `apps/web/src/hooks/useKeyboardShortcuts.ts` | **884** |
| `packages/ui/src/RightInspector.tsx` | **847** |
| `apps/web/src/lib/supabase.ts` | **826** |
| `apps/web/src/store/slices/elementsSlice.ts` | **766** |
| `packages/board/src/Pitch.tsx` | **732** |
| `packages/ui/src/SettingsModal.tsx` | **645** |
| `apps/web/src/store/slices/documentSlice.ts` | **544** |
| `apps/web/src/app/board/useBoardPageHandlers.ts` | **532** |
| `apps/web/src/app/routes/useBoardPageState.ts` | **516** |

---

## 2. Co jest SKOŃCZONE

### 2.1 Core product — V1 Complete ✅

Sprinti 1–6 w pełni zaimplementowane i zablokowane jako stable baseline:

| Sprint | Zakres | Status |
|--------|--------|--------|
| S1 | MVP Core (canvas, gracze, strzałki, strefy, grupy) | ✅ Done |
| S2 | System animacji (kroki, interpolacja easing, playback) | ✅ Done |
| S3 | Pro features (tekst, kształty, formacje) | ✅ Done |
| S4 | Export & customizacja (PNG, GIF, PDF, SVG, pitch themes) | ✅ Done |
| S5 | Quality & UX polish (code splitting, format shortcuts) | ✅ Done (częściowo) |
| S6 | Cloud & monetyzacja (Supabase, Stripe, entitlements) | ✅ Done |

### 2.2 Security & Pre-launch (blockers + must-haves) ✅

| ID | Problem | Status |
|----|---------|--------|
| B1 | Post-logout data leak (localStorage nie czyszczone) | ✅ Naprawiony |
| B2 | RLS wyłączone na `project_shares` | ✅ Re-enabled (migration 20260209000000) |
| B3 | RLS verification na `profiles` + `project_folders` | ✅ Zweryfikowany |
| H1 | Player number validation (0 → reset zamiast clear) | ✅ Naprawiony |
| H2 | ENTER key → edit player number | ✅ Zaimplementowany |
| H3 | `window.confirm()` → custom ConfirmModal | ✅ 0 pozostałych wywołań |
| H4 | OAuth redirect preserves unsaved work | ✅ Force-save przed redirect |
| L5 | Offline detection + save UX indicator | ✅ PR-L5-MINI (2026-02-09) |

### 2.3 Canvas stabilizacja i bugfixes ✅

| PR | Problem | Status |
|----|---------|--------|
| PR-FIX-4 | Pitch clipping/zoom (CSS→Konva refactor) | ✅ Complete (2026-02-12) |
| PR-FIX-5 | Orientation transform gaps (drawing points, player.orientation) | ✅ Complete (2026-02-12) |
| PR-FIX-2 | Vision visibility (opacity 0.14→0.28, stroke, scaling) | ✅ Complete |
| Canvas | Viewport stability (zoom-to-cursor, pan, mobile touch) | ✅ Verified |

### 2.4 Equipment system ✅

Modularny system sprzętu (`packages/board/src/equipment/`):
- `goal.tsx` — bramka z siatką
- `mannequin.tsx` — manekin PTU-style (żółty domyślnie, wariant `wall_3`)
- `cone.tsx`, `hoop.tsx`, `pole.tsx`, `ladder.tsx`, `hurdle.tsx`
- `hitBounds.ts` — logika trafień
- `types.ts` — central type registry

### 2.5 Architektura Command Registry ✅ (częściowo)

`CommandRegistry` (`cmd.intent.*` + `cmd.effect.*`) istnieje i działa:
- `intent.*`: moveStart, moveDelta, resizeStart, arrowEndpointDelta (brak side-effects)
- `effect.*`: moveEnd, deleteSelected, addElement, undo, redo (history commit + autosave)
- `AutosaveService` z 1.5s debounce + `markDirty()`
- `services/` warstwa: `AutosaveService`, `ExportService`, `KeyboardService`

### 2.6 Monorepo + tooling ✅

- pnpm + Turborepo: `apps/web` + 4 pakiety
- TypeScript strict mode: zero błędów typecheck
- Netlify Functions: Stripe checkout, webhook, portal session
- 2 pliki testowe z 34 testami (viewport utils + orientation transform)

### 2.7 Projects & Folders (UI) ✅

- `ProjectsDrawer` — lista projektów z folderami (flat display)
- Pin/unpin projektów i folderów (`is_pinned` w DB)
- Inline rename projektów i folderów
- Drag & drop projektów między folderami
- Favorite toggle

---

## 3. Co NIE JEST skończone

### 3.1 PR-FIX-1: Skróty V / Shift+V — ⏳ CZEKA

**Problem:** V (toggle showVision) i Shift+V (toggle orientation) działają niestabilnie.

**Przyczyny (zdiagnozowane):**
- Podwójne przechwytywanie klawisza 'v' w `useKeyboardShortcuts.ts` (switch + osobny blok)
- Brak guard `orientationEnabled` — V działa nawet gdy orientation jest wyłączone
- Focus na inspector input "zjada" skrót

**Plik do naprawienia:** `apps/web/src/hooks/useKeyboardShortcuts.ts`  
**Effort szacowany:** 1-2h

---

### 3.2 PR-FIX-3: Inspector `showVision` toggle — ⏳ CZEKA

**Problem:** `showVision` istnieje w typie `PlayerOrientationSettings` ale brak:
1. Pola `showVision` w props `RightInspector`
2. Toggle UI dla `showVision` w inspectorze
3. Guard w `PlayerNode` żeby arms/vision renderowały się tylko gdy `enabled = true`

**Pliki do naprawienia:**
- `packages/ui/src/RightInspector.tsx`
- `packages/board/src/PlayerNode.tsx`

**Effort szacowany:** 2-3h

---

### 3.3 PR-FIX-6: Subfolders UI — ⏳ CZEKA

**Problem:** `parent_id` istnieje w DB (`project_folders` table) i w TypeScript interface, ale UI wyświetla flat list.

**Brakuje:**
- `parentId` w `FolderItem` interface (`packages/ui`)
- Mapper w `useProjectsController.ts` przekazujący `parent_id`
- Tree structure builder w `ProjectsDrawer`
- Nested display z indent/collapse

**Effort szacowany:** 1-2 dni

---

### 3.4 Stage 3 — nie zmergowane do main ⏳

Zaplanowane w `tasks/STAGE_3_RELEASE_PATH.md` (2026-01-30), nie wykonane:

**PR A — `feat/goal-equipment-rework`:**
- Bramka ze siatką w EquipmentNode (U-shape + net grid + back bar)
- Branch nie stworzony, PR nie wysłany

**PR B — `fix/shoot-arrow-double-line`:**
- Naprawa renderowania shoot arrow (2 linie = ══════━► zamiast ─►─►)
- Branch nie stworzony, PR nie wysłany

Note: W docs istnieje też `tasks/PR-FIX-GOAL-V4-UX.md` sugerujący goal UX refactor — może być duplikacja/nakładanie z PR A.

---

### 3.5 Beta Testing — nie uruchomiony ⏳

Według `tasks/NEXT_TASK.md` i `docs/ROADMAP.md (S7)`:

- ❌ Beta invites **nie wysłane** (cel: 10-20 testerów)
- ❌ Formularz feedbacku **nie przygotowany**
- ❌ Monitoring UX/konwersji **nie ustawiony**
- ❌ Go-Live preparation **nie rustzone**:
  - LIVE products w Stripe nie stworzone
  - LIVE Price IDs nie zaktualizowane
  - Netlify nie przełączony na LIVE keys
  - Terms/Privacy + polityka zwrotów nie zaktualizowana

---

### 3.6 Post-Launch improvements (V1.1 — intentionally deferred)

Świadomie odroczone, ale warto wiedzieć:

| ID | Funkcja | Effort |
|----|---------|--------|
| L1 | Pin to top + archive actions (zaimplementowane częściowo) | 2-3h |
| L2 | Subfolders UI | 1-2 dni |
| L3 | Folder inline rename + animacje | 1 dzień |
| L4 | Multi-tab conflict detection (BroadcastChannel) | 1 dzień |
| L6 | Mobile/touch optimization | 2-3 dni |
| L7 | 30-day "remember me" session | 15 min (config) |

---

## 4. Dług techniczny i problemy jakościowe

### 4.1 Ekstremalnie niskie pokrycie testami 🔴

```
199 plików kodu
  2 pliki testowe
 34 testy łącznie
```

**Brak testów dla kluczowych obszarów:**
- Entitlements system (`can()` function)
- Auth flow (signup, OAuth, logout)
- CommandRegistry (cmd.intent.*, cmd.effect.*)
- Keyboard shortcuts
- Export logic (PDF, GIF, PNG)
- Project CRUD operations
- Store slices: elements, history, groups, steps

**Ryzyko:** Regresje przechodzą niezauważone. Kod jest trudny do bezpiecznego refactorowania.

---

### 4.2 101 console.log statements w produkcyjnym kodzie 🟡

W `apps/web/src` znajduje się 101 wywołań `console.log/warn/error`. Wiele z nich to debug logi z okresu developmentu:

```
[Auth] Board state saved...
[Autosave] Triggered...
[Projects] Loading...
```

**Problem:** Wypełniają konsolę użytkownika/produkcyjną. Powinny zostać usunięte lub zamienione na strukturalny logger (z poziomami: debug/info/warn/error i feature flagą).

---

### 4.3 Stałe kody TODOs w commands/ (scaffolding nigdy nie wdrożony) 🟡

```
apps/web/src/commands/board/effect.ts:
  - TODO: Handle start/end positions properly
  - TODO: Handle width/height parameters  
  - TODO: Handle content parameter
  - TODO: Implement grouping in later PRs
  - TODO: Implement ungrouping in later PRs

apps/web/src/commands/types.ts + registry.ts:
  - Animation Commands (TODO: PR1+)
  - Edit Commands (TODO: PR1+)
```

Te placeholdery z PR0 scaffolding nigdy nie zostały uzupełnione. `cmd.effect.groupSelected` i `cmd.effect.ungroupSelected` w `CommandRegistry.ts` mają jednak implementację — są niespójności między dwoma plikami.

---

### 4.4 Duże pliki — głęboka hierarchia i trudność utrzymania 🟡

`ProjectsDrawer.tsx` (1141 LOC) zawiera:
- Renderowanie listy projektów
- Renderowanie folderów  
- Drag & drop handlers
- Context menu logic
- Folder creation flow
- Pin/rename/favorite handlers

Powinno być rozdzielone na ~5 komponentów.

`useKeyboardShortcuts.ts` (884 LOC) obsługuje **wszystkie** skróty — add elements, edit, navigation, formation, export, zoom, orientation, vision. Zły single-concern. Powinno być rozbite na domenowe hooki.

---

### 4.5 Nadmiarowość dokumentacji 🟢

67 plików w `docs/` — ratio 1:3 do plików kodu. Wiele z nich jest:
- Superseded przez nowsze dokumenty (np. `PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md` superseded przez `CANVAS_STABILIZATION_COMPLETE.md`)
- Plany które zostały wdrożone i nie zostały zaktualizowane do statusu DONE
- Zduplikowane informacje (np. equipment plan w 3 miejscach)

Wskazane: archiwizacja `docs/archive/` dla skończonych planów.

---

## 5. Naruszenia architektury

Projekt ma zdefiniowane reguły architektoniczne (`.clinerules/`) — sprawdzam ich przestrzeganie:

### 5.1 UI bezpośrednio wywołuje store actions — NARUSZENIE 🔴

**Reguła:** *"UI mutations MAY ONLY go through `CommandRegistry (cmd.*)`"*

**Rzeczywistość:** `useBoardPageState.ts` (główny hub stanu BoardPage) zawiera ~60+ bezpośrednich subskrypcji do store actions:
```ts
const addPlayerAtCursor = useBoardStore((s) => s.addPlayerAtCursor);
const deleteSelected = useBoardStore((s) => s.deleteSelected);
const duplicateSelected = useBoardStore((s) => s.duplicateSelected);
const undo = useBoardStore((s) => s.undo);
// ... i ~50 więcej
```

`useKeyboardShortcuts.ts` ma podobnie ~35 bezpośrednich bindowań do store.

**CommandRegistry (`cmd.*`) jest używany tylko w 3 hookach:** `useCanvasInteraction.ts`, `useKeyboardShortcuts.ts` (częściowo), `useCanvasEventsController.ts`.

**Migracja PR0→PR1 NIE JEST DOKOŃCZONA.** Architektura "cmd.*" jest napisana ale nie podłączona do głównych ścieżek mutacji.

---

### 5.2 `useCommandRegistry` jako React hook — NARUSZENIE 🟠

**Reguła:** *"CommandRegistry is NOT a React hook. Created once at composition root."*

**Rzeczywistość:** Istnieje `hooks/useCommandRegistry.ts` który jest importowany w hookach renderujących. To łamie reguły — CommandRegistry powinien być singleton (lub przekazywany przez context).

---

### 5.3 `AppShell.tsx` — jedno naruszenie `getState()` 🟢

```tsx
currentProjectId={useBoardStore.getState().cloudProjectId}
```

Jedno wywołanie `getState()` bezpośrednio w JSX — powinno być `useBoardStore((s) => s.cloudProjectId)` lub facades.

---

### 5.4 Zustand store slices — OK ✅

Slices nie wywołują się nawzajem. Orchestracja przez CommandRegistry. Strukturalnie prawidłowe.

---

### 5.5 Canvas layers — OK ✅

Konva components (`PlayerNode`, `Pitch`, itp.) nie importują store bezpośrednio — otrzymują dane przez props. To jest zgodne z regułami.

---

## 6. Priorytetyzowane TODO

> Posortowane wg: [Blokuje / Ważność] × [Effort]

### 🔴 PRIORYTET 1 — Produkcja-ready

| # | Akcja | Effort | Plik(i) |
|---|-------|--------|---------|
| P1.1 | Usuń lub zasilentuj 101 console.log | 1-2h | Cały `apps/web/src` |
| P1.2 | Wyślij beta invites (10-20 testerów) | 1h | — |

### 🟠 PRIORYTET 2 — UX bugfixes (zdiagnozowane, do implementacji)

| # | Akcja | Effort | Plik(i) |
|---|-------|--------|---------|
| P2.1 | PR-FIX-1: V / Shift+V shortcuts stabilizacja | 1-2h | `useKeyboardShortcuts.ts` |
| P2.2 | PR-FIX-3: showVision toggle w inspectorze | 2-3h | `RightInspector.tsx`, `PlayerNode.tsx` |
| P2.3 | Stage 3 PR A: goal net grid | 1h | `EquipmentNode.tsx` → `equipment/goal.tsx` |
| P2.4 | Stage 3 PR B: shoot arrow fix | 1h | `ArrowNode.tsx` |

### 🟡 PRIORYTET 3 — Jakość kodu

| # | Akcja | Effort | Plik(i) |
|---|-------|--------|---------|
| P3.1 | Testy: entitlements system | 2-3h | Nowy plik `entitlements.test.ts` |
| P3.2 | Testy: auth flow (login, logout, OAuth) | 3-4h | — |
| P3.3 | Rozbij `ProjectsDrawer.tsx` (1141 LOC) | 3-4h | components/ProjectsList, FolderTree, etc. |
| P3.4 | Rozbij `useKeyboardShortcuts.ts` (884 LOC) | 3-4h | `useCanvasShortcuts`, `useEditShortcuts`, etc. |
| P3.5 | Usuń/archiwizuj stare docs w `docs/archive/` | 1-2h | ~20 plansów które są DONE |

### 🟢 PRIORYTET 4 — Architektura (długoterminowo)

| # | Akcja | Effort | Plik(i) |
|---|-------|--------|---------|
| P4.1 | PR-FIX-6: Subfolders UI | 1-2 dni | `ProjectsDrawer.tsx`, `useProjectsController.ts` |
| P4.2 | Migracja UI → `cmd.*` (PR1) | 2-3 dni | `useBoardPageState.ts`, `useKeyboardShortcuts.ts` |
| P4.3 | CommandRegistry singleton (nie hook) | 1 dzień | `hooks/useCommandRegistry.ts` → context |
| P4.4 | Uzupełnij TODOs w `commands/board/effect.ts` | 2-3h | `commands/board/effect.ts` |
| P4.5 | Ujednolić `commands/registry.ts` z `CommandRegistry.ts` | 1h | Oba pliki |

### 🔵 PRIORYTET 5 — Go-Live (Sprint 7 finisz)

| # | Akcja | Effort |
|---|-------|--------|
| P5.1 | Stwórz LIVE products w Stripe Dashboard | 1h |
| P5.2 | Zaktualizuj LIVE Price IDs w kodzie | 30 min |
| P5.3 | Przełącz Netlify na LIVE Stripe keys | 15 min |
| P5.4 | Zaktualizuj Terms/Privacy + polityka zwrotów | 2-3h |
| P5.5 | Final production test z prawdziwą kartą | 30 min |

---

## Podsumowanie

TMC Studio jest **technicznie gotowe dla beta** — V1 feature-complete, zero TypeScript errors, security zaklepany, viewport stabilny, 34 testy przechodzące.

Główne ryzyka przed produkcją (LIVE):

1. **Niska pokrywalność testami** (1% file coverage) — każda zmiana może wprowadzić regresję niezauważoną
2. **Architektura cmd.* w połowie migrowina** — dług techniczny który będzie rósł
3. **Beta nie uruchomiona** — zamiast testerów projekt jest w "prawie gotowe" limbo od tygodni
4. **101 console.log** — niezprofesjonalne dla LIVE produktu

**Rekomendacja natychmiastowa:** Wyślij beta invites → zbierz feedback → iteruj. Nie refactoruj architektury przed zebraniem sygnałów od użytkowników.

---

*Dokument wygenerowany: 2026-02-19 | Aktualny hash HEAD: `863da0f`*
