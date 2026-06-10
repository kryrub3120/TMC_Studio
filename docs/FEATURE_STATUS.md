# TMC Studio — Feature Status Report (Inwentaryzacja Funkcji)

> **Data audytu:** 2026-06-10 (Sprint A — Quick wins UX + podpisy zawodników zakończony)  
> **Metodologia:** Krzyżowa analiza dokumentacji (`docs/`, `CHANGELOG.md`, `tasks/`) z faktycznym stanem kodu (`apps/web/src`, `packages/`)  
> **Źródła dokumentacji:** `FEATURE_SPEC.md`, `ROADMAP.md`, `REFACTOR_ROADMAP.md`, `CHANGELOG.md`, `S2_ANIMATION_MODULE_PLAN.md`, `MONETIZATION_PLAN.md`, `PAYMENT_FOUNDATION.md`, `EQUIPMENT_SYSTEM_PLAN.md`, `PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md`, `ARCHITECTURE_DIAGNOSIS_6_ISSUES.md`, `BETA_READY_SPRINT.md`, `GOALS_AND_HOTFIXES_PLAN.md`, `BETA_TESTING_PLAN.md`, `L1_PIN_RENAME_IMPLEMENTATION_STATUS.md`, `SETTINGS_INTEGRATION_PLAN.md`, `UX_IMPLEMENTATION_PLAN.md`, `MASTER_DEVELOPMENT_PLAN.md`, `SYSTEM_ARCHITECTURE.md`, `ZUSTAND_SLICES.md`

---

## 📌 Stan repozytorium na dziś

| Element | Stan |
|---------|------|
| **Aktualny branch** | `develop` (HEAD) |
| **Ostatni commit** | `7c5882d` — `chore(config): migracja na natywnego Copilota, usuniecie clinerules i update markerow` |
| **Autor** | kryrub3120 |
| **Data ostatniego commita** | 9 czerwca 2026, 02:03 CEST |
| **Sprint B — Transformer POC** | ✅ Zakończony 2026-06-10 |
| **Branch `main`** | `a5c58ee` — "Backup przed przeniesieniem z iCloud" (1 commit za developem) |
| **Różnica `develop` vs `main`** | 20 plików, +293 / −260 linii |
| **Liczba commitów** | 137 (wszystkie autorstwa kryrub3120) |
| **Pliki w ostatnim commicie** | Usunięto `.clinerules/` (2 pliki, 173 linie), dodano `.github/copilot-instructions.md`, zaktualizowano 16 plików (CHANGELOG, audyt `useBoardPageState`, ekspansja `SYSTEM_ARCHITECTURE.md` +181 linii, itd.) |

### 🔧 Zmiany w ostatnim commicie (develop only, jeszcze nie na main)

| Plik | Zmiana | Znaczenie |
|------|--------|-----------|
| `.clinerules/feature_spec_maintenance.md` | ❌ Usunięty | Migracja z Cline na natywnego Copilota |
| `.clinerules/project_rules_custom_instruction.md` | ❌ Usunięty | jw. |
| `.github/copilot-instructions.md` | ✅ Dodany | Nowy plik instrukcji dla GitHub Copilot |
| `docs/SYSTEM_ARCHITECTURE.md` | +181 linii | Rozbudowa sekcji Hard Rules |
| `docs/REFACTOR_ROADMAP.md` | +4 linie | Aktualizacja statusów |
| `apps/web/src/app/routes/useBoardPageState.ts` | −123 / +? linii | Audyt wydajności (Etapy 1-4 z CHANGELOG) |
| `apps/web/src/hooks/useAnimationPlayback.ts` | +6 linii | Hard guard `ANIMATION_ENABLED` |
| `apps/web/src/hooks/useExportController.ts` | +21 linii | Mechanizm abort w `exportAllSteps` |
| `docs/ZUSTAND_SLICES.md` | +3 linie | Nowy dokument architektury sliców |

---

## 1. ✅ ZREALIZOWANE (Gotowe w MVP)

Funkcje w pełni zaimplementowane w kodzie źródłowym i działające.

---

### 1.1. Fundament techniczny

| Funkcja | Dowód w kodzie |
|---------|---------------|
| Monorepo pnpm + Turborepo | `pnpm-workspace.yaml`, `turbo.json` |
| React + Vite + TypeScript | `apps/web/package.json` |
| Zustand store (slice-based) | `apps/web/src/store/index.ts` — 7 slice'ów (elements, selection, history, steps, groups, document, drawing) |
| Supabase backend (auth + db + storage) | `apps/web/src/lib/supabase.ts`, 9 migracji w `supabase/migrations/` |
| Netlify deployment + serverless functions | `netlify.toml`, `netlify/functions/` (5 funkcji) |
| Code splitting (manualChunks) | potwierdzone w `ROADMAP.md` S5.1, output w `apps/web/dist/` |

### 1.2. Canvas & Elementy tablicy

| Funkcja | Dowód w kodzie |
|---------|---------------|
| Konva canvas z warstwami (Pitch, Players, Arrows, Zones, Drawings, Overlay) | `packages/board/src/` (10 komponentów) + `apps/web/src/components/Canvas/layers/` (6 warstw) |
| **Players**: tworzenie (P / Shift+P), kształty (circle/square/triangle/diamond), numery 1-99, resize, goalkeeper, label | `packages/board/src/PlayerNode.tsx`, `useKeyboardShortcuts.ts` (case 'p') |
| **Ball**: tworzenie (B) | `packages/board/src/BallNode.tsx` |
| **Arrows**: pass (A), run (R), shoot (S) | `packages/board/src/ArrowNode.tsx` |
| **Zones**: rect (Z), ellipse (Shift+Z), cycle shape (E) | `packages/board/src/ZoneNode.tsx` |
| **Text**: tworzenie (T), inline editing, typography (↑↓←→ bold/italic/bg color) | `packages/board/src/TextNode.tsx`, `useTextEditController.ts` |
| **Drawings**: freehand (D), highlighter (H), clear (C) | `packages/board/src/DrawingNode.tsx`, `useDrawingController.ts` |
| **Equipment**: goal, mannequin (standard/flat/wall_3), cone, pole, ladder, hoop, hurdle (J / Shift+J, M / Shift+M, K / Shift+K, Y, Q, U) | `packages/board/src/equipment/` (9 komponentów) |
| ALT+Drag player rotation (5° snap, SHIFT+ALT=1°) | `CHANGELOG.md` [Unreleased], `useCanvasInteraction.ts` |
| Player orientation & vision (V / Shift+V) | `useKeyboardShortcuts.ts`, `PlayerNode.tsx` |
| Orientation settings (enabled / showArms / zoomThreshold) | `documentSlice.ts`, `RightInspector.tsx` |

### 1.3. Kroki i animacja

| Funkcja | Dowód w kodzie |
|---------|---------------|
| Multi-step system (N dodaj, X usuń) | `store/slices/stepsSlice.ts` |
| Play/Pause (Space), Loop (L), duration (0.6/0.8/1.2s) | `useAnimationPlayback.ts`, `useUIStore.ts` |
| Interpolacja pozycji (cubic easing) | `useAnimationInterpolation.ts`, `useInterpolation.ts` |
| BottomStepsBar z chipami kroków | `packages/ui/src/BottomStepsBar.tsx` |
| Feature flag `VITE_ANIMATION_ENABLED` z guardem | `config/featureFlags.ts`, `useAnimationPlayback.ts` |

### 1.4. Selekcja i interakcja

| Funkcja | Dowód w kodzie |
|---------|---------------|
| Single select, multi-select (Shift+Click), marquee | `store/slices/selectionSlice.ts`, `useCanvasInteraction.ts` |
| Drag & move (single + multi), nudge (↑↓←→ / Shift+Arrow) | `useCanvasEventsController.ts` |
| Copy/Paste (Cmd+C/V), Duplicate (Cmd+D) | `useKeyboardShortcuts.ts` |
| Undo/Redo (Cmd+Z / Cmd+Shift+Z) | `store/slices/historySlice.ts` |
| Context menu (right-click) z wariantami per typ elementu | `packages/ui/src/ContextMenu.tsx`, `useCanvasContextMenu.ts` |
| Groups (Ctrl+G create, Ctrl+Shift+G ungroup) | `store/slices/groupsSlice.ts` |

### 1.5. Boisko i widok

| Funkcja | Dowód w kodzie |
|---------|---------------|
| Pitch rendering z liniami | `packages/board/src/Pitch.tsx` |
| Landscape/Portrait toggle (O) | `useKeyboardShortcuts.ts`, `documentSlice.ts` |
| Pitch themes (grass, indoor, chalk, futsal, custom) | `PitchPanel.tsx`, `PITCH_THEMES` w `@tmc/core` |
| Print mode (W) | `useUIStore.ts`, `useKeyboardShortcuts.ts` |
| Zoom (Cmd+=/-, Ctrl+Scroll, 25%-200%) | `useUIStore.ts`, `ZoomWidget.tsx` |
| Fit view (0), pan (Space+drag) | `useKeyboardShortcuts.ts`, `BoardCanvasSection.tsx` |
| Pinch-to-zoom i two-finger pan (mobile) | `BoardCanvasSection.tsx` (linie 317-351) |
| Focus mode (F), Command Palette (Cmd+K) | `useUIStore.ts`, `CommandPaletteModal.tsx` |
| Dark/Light theme, CheatSheet (?), Grid toggle | `useUIStore.ts`, `theme/` |

### 1.6. Eksport

| Funkcja | Dowód w kodzie |
|---------|---------------|
| PNG export (Cmd+E), All Steps PNG (Shift+Cmd+E) | `useExportController.ts`, `ExportService.ts` |
| GIF export (Shift+Cmd+G) z gifenc | `useExportController.ts` |
| PDF export (Shift+Cmd+P) z jsPDF | `useExportController.ts` |
| SVG export (Command Palette) | `services/ExportService.ts` |

### 1.7. Formacje

| Funkcja | Dowód w kodzie |
|---------|---------------|
| 6 formacji (4-3-3, 4-4-2, 4-4-2♦, 4-2-3-1, 3-5-2, 5-3-2) | `packages/presets/src/formations.ts` |
| Szybkie aplikowanie (klawisze 1-6 = home, Shift+1-6 = away) | `useKeyboardShortcuts.ts` |

### 1.8. Autoryzacja i chmura

| Funkcja | Dowód w kodzie |
|---------|---------------|
| Google OAuth + email/password | `useAuthStore.ts`, `lib/supabase.ts` |
| Guest mode (bez logowania, dane w localStorage) | `useAuthStore.ts` (isAuthenticated = false) |
| Supabase: profiles, projects, project_folders, project_shares, templates, stripe_webhook_events, user_preferences | 9 migracji SQL |
| Cloud sync (save/load z Supabase) | `store/useAuthStore.ts`, `AutosaveService.ts` |
| Autosave (debounced 1.5s) | `AutosaveService.ts` |
| ProjectsDrawer z listą, wyszukiwaniem, folderami | `packages/ui/src/ProjectsDrawer.tsx` |
| RLS policies dla profiles, projects | migracje SQL (20260109000001) |
| Offline/Online detection + TopBar save status (Offline/Saving/Saved/Unsaved) | `OfflineBanner.tsx`, `CHANGELOG.md` |

### 1.9. Płatności i monetyzacja

| Funkcja | Dowód w kodzie |
|---------|---------------|
| Stripe checkout (Netlify function) | `netlify/functions/create-checkout.ts` |
| Stripe webhook (5 event types) | `netlify/functions/stripe-webhook.ts` |
| Customer portal | `netlify/functions/create-portal-session.ts` |
| Entitlements system (guest/free/pro/team) | `lib/entitlements.ts`, `useEntitlements.ts` |
| Plan limits enforcement (projects, steps, exports) | `lib/entitlements.ts` (hard-blok dla GIF/PDF, projektów, kroków) |
| PricingModal, LimitReachedModal, UpgradeSuccessModal | `packages/ui/src/PricingModal.tsx`, `LimitReachedModal.tsx`, `UpgradeSuccessModal.tsx` |
| PR-PAY-1 do PR-PAY-6 zakończone | `docs/PR-PAY-*.md`, `CHANGELOG.md` |
| Fail-safe subscription refresh (PR-PAY-6) | potwierdzone w dokumentacji |
| Konfiguracja Stripe | `config/stripe.ts`, `_stripeConfig.ts` |

### 1.10. UX i UI

| Funkcja | Dowód w kodzie |
|---------|---------------|
| TopBar, RightInspector (Props/Layers/Objects), BottomStepsBar | `packages/ui/src/` |
| Command Palette (Cmd+K) z akcjami | `CommandPaletteModal.tsx`, `commands/commandPalette/` |
| ZoomWidget, Toolbar | `packages/ui/src/ZoomWidget.tsx`, `packages/ui/src/Toolbar.tsx` |
| ConfirmModal (zastąpił window.confirm) | `packages/ui/src/ConfirmModal.tsx` |
| Toast notifications | `useUIStore.ts` (showToast) |
| CheatSheet overlay (?) | `packages/ui/src/CheatSheetOverlay.tsx` |
| Keyboard shortcuts (~85 skrótów) | `hooks/useKeyboardShortcuts.ts` |
| CommandRegistry (board domain: intent/effect) | `commands/registry.ts`, `commands/board/intent.ts`, `commands/board/effect.ts` |

### 1.12. Sprint C — Numeracja strzałek bez dziur + undo

| Funkcja | Dowód w kodzie |
|---------|---------------|
| `renumberAllArrows()` w elementsSlice — przelicza 1..N, NIE woła pushHistory | `apps/web/src/store/slices/elementsSlice.ts` |
| `deleteSelected` — delete + renumber + JEDEN pushHistory | `apps/web/src/store/slices/elementsSlice.ts` |
| `toggleAutoNumbering` — pushHistory + warunek `if (wasOff) renumberAllArrows()` | `apps/web/src/store/slices/documentSlice.ts` |
| 25 testów (14 jednostkowych + 11 integracyjnych na realnym store) | `apps/web/src/store/slices/__tests__/arrowRenumber.test.ts`, `arrowRenumber.integration.test.ts` |
| Konfiguracja vitest + test setup (localStorage/logger/supabase mock) | `apps/web/vite.config.ts`, `apps/web/src/test-setup.ts` |

### 1.13. Inspector UX Fix

| Funkcja | Dowód w kodzie |
|---------|---------------|
| Arrow controls w PropsTab (Show number, Number, Auto-number, Renumber) | `packages/ui/src/RightInspector.tsx` |
| Fix duplikacji — wszystkie breakpointy <xl używają FAB + BottomSheet | `packages/ui/src/RightInspector.tsx` |
| Floating toggle button dla zamkniętego sidebaru na xl | `packages/ui/src/RightInspector.tsx` |
| Arrow data (`showNumber`, `arrowNumber`) w InspectorElement | `apps/web/src/app/routes/useBoardPageState.ts`, `packages/ui/src/RightInspector.tsx` |
| `handleUpdateElement` obsługuje arrow (showNumber/arrowNumber) | `apps/web/src/app/board/useBoardPageHandlers.ts` |

### 1.14. Sprint B — Transformer POC dla TextNode

| Funkcja | Dowód w kodzie |
|---------|---------------|
| Konva Transformer dla pojedynczego TextNode | `apps/web/src/app/board/canvas/CanvasElements.tsx` |
| `stage.findOne('#id')` — lookup przez istniejące `Group id={text.id}` | `packages/board/src/TextNode.tsx` (linia 142) |
| Automatyczny attach/detach — tylko TextNode, single-select, nie w play mode | `CanvasElements.tsx` — `useEffect([selectedIds, elements, isPlaying])` |
| 4 anchor narożne + rotate (offset 25px) | `CanvasElements.tsx` — `<Transformer enabledAnchors={[...]} rotateAnchorOffset={25} />` |
| boundBoxFunc — min rozmiar 20×10px | `CanvasElements.tsx` — `boundBoxFunc` inline |
| Brak wpływu na PlayerNode (ALT+drag), ZoneNode (resize), ArrowNode (handles) | potwierdzone przez `isTextElement` guard w useEffect |

### 1.15. Sprint A — Quick wins UX + podpisy zawodników + Enter→edit label

| Funkcja | Dowód w kodzie |
|---------|---------------|
| **aria-label** na przyciskach Zoom In, Zoom Out, Fit | `packages/ui/src/ZoomWidget.tsx` — `aria-label` na 3 buttonach |
| **Toasty undo/redo**: "Cofnięto" i "Przywrócono" | `apps/web/src/hooks/useKeyboardShortcuts.ts` — `showToast` w case 'z' |
| **Kursory wg narzędzia**: crosshair dla draw tools, text dla text tool | `apps/web/src/app/board/BoardCanvasSection.tsx` — `toolCursor` + `cursorClass` |
| **Podpisy zawodników**: domyślnie brak, `showLabel===true` = podpis pod (pill+tło+cień), numer osobno | `packages/board/src/PlayerNode.tsx` — przebudowa renderowania label/number |
| **Dynamiczna szerokość pilla**: długie nazwiska bez ucinania | `packages/board/src/PlayerNode.tsx` — `approxCharW = fontSize * 0.62`, `pillW = max(30, textW + 28)` |
| **Enter→focus label**: Enter na zawodniku focusuje pole "Player Label" w RightInspector | `packages/ui/src/RightInspector.tsx` (+ `labelInputRef`), `useKeyboardShortcuts.ts` (+ `onFocusLabelInput`), `useBoardPageState.ts`, `BoardPage.tsx` |
| **Enter/Escape w inpucie label**: Enter→blur (zatwierdzenie), Escape→blur (bez rollbacku) | `packages/ui/src/RightInspector.tsx` — `onKeyDown` na input label |
| **Etykiety UI**: "Player Label" (zamiast "Position Label"), "Show Label Below" (zamiast "Show Label Inside") | `packages/ui/src/RightInspector.tsx` |
| **aria-label na inpucie label**: `aria-label="Player label"` | `packages/ui/src/RightInspector.tsx` |

| PR | Status | Dowód |
|----|--------|-------|
| PR-REFACTOR-0: CommandRegistry Scaffolding | ✅ | `commands/` structure |
| PR-REFACTOR-1: Selection → cmd.board.selection | ✅ | `REFACTOR_ROADMAP.md` |
| PR-REFACTOR-2: Drag/Move + History Commit Rules | ✅ | `REFACTOR_ROADMAP.md` |
| PR-REFACTOR-5: useSettingsController | ✅ | `hooks/useSettingsController.ts` |
| PR-REFACTOR-6: useDrawingController | ✅ | `hooks/useDrawingController.ts` |
| PR-REFACTOR-7: useCanvasEventsController | ✅ | `hooks/useCanvasEventsController.ts` |
| PR-REFACTOR-9: Edit Controller (useTextEditController) | ✅ | `hooks/useTextEditController.ts`, `BoardEditOverlays.tsx` |
| PR-REFACTOR-11.5: AppShell + BoardPage (App.tsx: 1661→28 linii) | ✅ | `AppShell.tsx`, `BoardPage.tsx` |
| Audyt useBoardPageState (Etapy 1-4) | ✅ | `CHANGELOG.md` [Unreleased] |
| Goal equipment rework (U-shaped frame + net grid) | ✅ | `STAGE_3_RELEASE_PATH.md`, `packages/board/src/equipment/goal.tsx` |
| Shoot arrow fix (double parallel lines) | ✅ | `STAGE_3_RELEASE_PATH.md`, `packages/board/src/ArrowNode.tsx` |

---

## 2. 🔄 W TOKU / CZĘŚCIOWE

Funkcje rozgrzebane — istnieje kod lub struktura, ale implementacja niekompletna, zawiera TODO, lub backend gotowy bez UI.

---

### 2.1. CommandRegistry — niekompletne domeny

| Problem | Lokalizacja | Szczegóły |
|---------|-------------|-----------|
| Animation Commands — placeholder | `commands/types.ts:38-39`, `commands/registry.ts:52` | Oznaczone `// TODO: PR1+`, brak implementacji |
| Edit Commands — placeholder | `commands/types.ts:40-41`, `commands/registry.ts:54` | Oznaczone `// TODO: PR1+`, brak implementacji |
| `cmd.board.effect.addArrow`: TODO start/end positions | `commands/board/effect.ts` | `// TODO: Handle start/end positions properly` |
| `cmd.board.effect.addZone`: TODO width/height | `commands/board/effect.ts` | `// TODO: Handle width/height parameters` |
| `cmd.board.effect.addText`: TODO content | `commands/board/effect.ts` | `// TODO: Handle content parameter` |
| `cmd.board.effect.groupElements`: TODO implement grouping | `commands/board/effect.ts` | `// TODO: Implement grouping in later PRs` |
| `cmd.board.effect.ungroupElements`: TODO implement ungrouping | `commands/board/effect.ts` | `// TODO: Implement ungrouping in later PRs` |

### 2.2. Automatyczny zapis i dirty flag

| Problem | Lokalizacja | Szczegóły |
|---------|-------------|-----------|
| Brak realnego mechanizmu autozapisu | `useBoardPageState.ts` | `// TODO: Podpiąć realny mechanizm autozapisu / dirty flag stanu` |

### 2.3. Quick Edit UI (Canvas)

| Problem | Lokalizacja | Szczegóły |
|---------|-------------|-----------|
| Quick edit UI nie zaimplementowane | `useCanvasInteraction.ts` | `// TODO: Implement quick edit UI` |

### 2.4. L1 — Pin/Rename (backend gotowy, UI nie)

| Problem | Lokalizacja | Szczegóły |
|---------|-------------|-----------|
| Migracja `is_pinned` wykonana | `supabase/migrations/20260209000001_add_pin_feature.sql` | Kolumny dodane do `projects` i `project_folders` ✅ |
| API pin/rename gotowe | `lib/supabase.ts` | `toggleProjectPinned`, `toggleFolderPinned`, `renameProject`, `renameFolder` ✅ |
| Controller gotowy | `useProjectsController.ts` | `togglePinProject`, `togglePinFolder`, `renameProjectById`, `renameFolderById` ✅ |
| UI ProjectsDrawer — props dodane | `packages/ui/src/ProjectsDrawer.tsx` | `onTogglePinProject`, `onTogglePinFolder`, `onRenameProject`, `onRenameFolder` ✅ |
| UI ProjectsDrawer — inline rename NIE zaimplementowane | `packages/ui/src/ProjectsDrawer.tsx` | `// Inline rename states (TODO: implement inline renaming)` ❌ |
| UI ProjectsDrawer — pinned section NIE zaimplementowane | `packages/ui/src/ProjectsDrawer.tsx` | Brak renderowania `📌 Pinned` sekcji ❌ |
| UI ProjectsDrawer — folder color chip NIE zaimplementowany | `packages/ui/src/ProjectsDrawer.tsx` | Brak wizualnego wskaźnika koloru folderu ❌ |

### 2.5. Animacja S2 — funkcje zaplanowane, niezrealizowane

| Funkcja | Status | Źródło |
|---------|--------|--------|
| Onion skin (ghost poprzedniego kroku) | ❌ Brak w kodzie (grep onion/onionSkin = pusto) | `S2_ANIMATION_MODULE_PLAN.md` §2.3 |
| Step rename (double-click chip) | ❌ Brak implementacji | `S2_ANIMATION_MODULE_PLAN.md` §2.3 |
| Delete step (X button / context menu) | ❌ Tylko przez klawisz X globalnie | `S2_ANIMATION_MODULE_PLAN.md` §2.3 |
| Duplicate step (right-click / button) | ❌ Brak | `S2_ANIMATION_MODULE_PLAN.md` §2.3 |
| Progress scrubber (drag do seek) | ❌ Brak | `S2_ANIMATION_MODULE_PLAN.md` §2.5 |
| Speed controls (0.5x/1x/2x) | ❌ Brak | `S2_ANIMATION_MODULE_PLAN.md` §2.5 |
| Step progress indicator (pasek pod chipami) | ❌ Brak | `S2_ANIMATION_MODULE_PLAN.md` §2.5 |
| Transition trails (fading path) | ❌ Brak | `S2_ANIMATION_MODULE_PLAN.md` §2.7 |
| Step indicator glow (pulsowanie) | ❌ Brak | `S2_ANIMATION_MODULE_PLAN.md` §2.7 |
| Drag reorder steps | ❌ Brak | `S2_ANIMATION_MODULE_PLAN.md` §2.8, `ROADMAP.md` S5.4 |
| Context menu na step chipach | ❌ Brak | `S2_ANIMATION_MODULE_PLAN.md` §2.9 |
| Arrows animation (interpolacja endpointów + fade-in) | ⚠️ Częściowo — interpolacja działa, ale brak fade-in i dash animation | `S2_ANIMATION_MODULE_PLAN.md` §2.10 |
| Zones animation (interpolacja position/size) | ⚠️ Częściowo — podstawowa interpolacja działa | `S2_ANIMATION_MODULE_PLAN.md` §2.11 |

### 2.6. Problemy architektoniczne i bugi (zdiagnozowane, niezafixowane)

| Problem | Severity | Źródło |
|---------|----------|--------|
| **B1 — Post-logout data leak**: Po wylogowaniu dane poprzedniego użytkownika widoczne w localStorage | 🔴 BLOCKER | `PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md` |
| **B2 — RLS disabled na `project_shares`**: Każdy zalogowany user może czytać/zapisywać wszystkie share records | 🔴 BLOCKER | `PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md`; migracja `20260209000000_reenable_rls_project_shares.sql` istnieje, status niepotwierdzony |
| **B3 — RLS na `profiles` i `project_folders`**: Niezweryfikowane | 🔴 BLOCKER | `PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md` |
| **H1 — Player number delete-to-0**: Kasowanie numeru ustawia 0 zamiast undefined | 🟡 HIGH | `PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md` |
| **H2 — ENTER na selekcji playera**: ✅ NAPRAWIONE — Sprint A: focusuje pole label w RightInspector | ✅ FIXED | `useKeyboardShortcuts.ts`, `RightInspector.tsx` |
| **Toggle "Show orientation" i "Show arms" wpływają na siebie** | Medium | `ARCHITECTURE_DIAGNOSIS_6_ISSUES.md` #1 |
| **Skróty V / Shift+V niestabilne** (double-trigger, brak guard na orientationEnabled) | High | `ARCHITECTURE_DIAGNOSIS_6_ISSUES.md` #2 |
| **Wizja zawodnika zbyt słabo widoczna** (opacity 0.14) | Medium | `ARCHITECTURE_DIAGNOSIS_6_ISSUES.md` #3 |
| **Podfoldery w Projects UI nie widoczne** | Medium | `ARCHITECTURE_DIAGNOSIS_6_ISSUES.md` #4 |
| **Przy zmniejszeniu okna boisko jest ucinane** | High (UX blocker) | `ARCHITECTURE_DIAGNOSIS_6_ISSUES.md` #5 |
| **Przy zmianie orientacji elementy nie transformują się spójnie** | High (data corruption) | `ARCHITECTURE_DIAGNOSIS_6_ISSUES.md` #6 |
| **showVision toggle brak w RightInspector** | Medium | `ARCHITECTURE_DIAGNOSIS_6_ISSUES.md`, `BETA_READY_SPRINT.md` PR-1B |
| **Resize render layer bug** — PlayerNode ignoruje stored `radius` | — | `GOALS_AND_HOTFIXES_PLAN.md` B2 |
| **Diamond shape offset** — niepoprawny transform origin | — | `GOALS_AND_HOTFIXES_PLAN.md` U1 |
| **Clear (C) feedback** — toast "Drawings cleared" nawet gdy brak drawingów | — | `GOALS_AND_HOTFIXES_PLAN.md` B4 |
| **Rename UI wiring** — type mismatch w callbacku TopBar | — | `GOALS_AND_HOTFIXES_PLAN.md` B1 |
| **Pitch overlay goals** (dekoracyjne bramki na boisku) Stage 1 | — | `GOALS_AND_HOTFIXES_PLAN.md` |

### 2.7. Monetyzacja — luki

| Problem | Szczegóły | Źródło |
|---------|----------|--------|
| **Folder limits nie egzekwowane** (Free: 3) | `entitlements.ts` wspiera, ale UI nie sprawdza | `MONETIZATION_PLAN.md` §3: "NEEDS ENFORCEMENT" |
| **Placeholder Price IDs w PricingModal** | Częściowo zaadresowane przez PR-PAY-1-5, ale `docs/PAYMENT_GAPS_ANALYSIS.md` flaguje | `PAYMENT_GAPS_ANALYSIS.md` #1 |
| **User email/customerId nie przekazywane do checkout** | `PAYMENT_GAPS_ANALYSIS.md` #2-3 |
| **Webhook Price ID mapping** — placeholder IDs | `PAYMENT_GAPS_ANALYSIS.md` #4 |

### 2.8. Settings Modal — częściowe podpięcie

| Problem | Szczegóły | Źródło |
|---------|----------|--------|
| SettingsModal UI istnieje (4 taby) | `packages/ui/src/SettingsModal.tsx` ✅ |
| Backend API gotowe (updateProfile, changePassword, deleteAccount) | `lib/supabase.ts` ✅ |
| Handlery zdefiniowane w planie | `SETTINGS_INTEGRATION_PLAN.md` — kod do dodania |
| **Niepotwierdzone pełne podpięcie** w AppShell/BoardPage | Wymaga weryfikacji |

### 2.9. Beta testing

| Problem | Status | Źródło |
|---------|--------|--------|
| Konfiguracja Netlify z TEST Stripe | ✅ | `DEPLOYMENT_CHECKLIST.md` |
| Dokumentacja beta | ✅ | `BETA_TESTING_PLAN.md` |
| Wysłanie zaproszeń (10-20 testerów) | ❌ Nie wykonano | `ROADMAP.md` S7.2 |
| Zbieranie feedbacku | ❌ Nie wykonano | `ROADMAP.md` S7.3 |
| Feedback form (Google Form / Typeform) | ❌ Nie utworzono | `BETA_TESTING_PLAN.md` |
| BETA_READY sprint (PR-1A, PR-1B, PR-2) | ❌ Nie wykonano | `tasks/BETA_READY_SPRINT.md` |

### 2.10. Templates API (częściowe)

| Element | Status | Lokalizacja |
|---------|--------|-------------|
| Typ `Template` zdefiniowany | ✅ | `lib/supabase.ts:699-705` |
| `getTemplates()` | ✅ | `lib/supabase.ts:714-733` |
| `getFeaturedTemplates()` | ✅ | `lib/supabase.ts:737+` |
| Tabela `templates` w bazie | ✅ | migracja `20260108000000_initial_schema.sql` |
| UI do przeglądania szablonów | ❌ Brak | — |
| Integracja z aplikacją | ❌ Brak | — |

### 2.11. zIndex / Layer Order

| Element | Status | Szczegóły |
|---------|--------|-----------|
| `zIndex?: number` w typach elementów | ✅ | `packages/core/src/types.ts` (PR-UX-2) |
| `getEffectiveZIndex()` helper | ✅ | `packages/core/src/types.ts:402-404` |
| **Bring to Front / Send to Back UI** | ❌ Brak | Grep `bringToFront\|sendToBack` = pusto |
| **Context menu opcje "Bring Forward / Send Backward"** | ❌ Brak | Wspomniane w `FEATURE_SPEC.md` §2.3, nie w kodzie |

### 2.12. useBoardPageHandlers — pozostałości do migracji

| Problem | Lokalizacja |
|---------|-------------|
| `// TODO I5: Docelowo zastąpić cmdRegistry.canvas.moveElementLive +` | `useBoardPageHandlers.ts` |

---

## 3. ⏳ ZAPLANOWANE (Nietknięte w kodzie)

Funkcje i wymagania opisane w specyfikacji/roadmapie, dla których **nie ma żadnego śladu implementacji** w kodzie źródłowym.

---

### 3.1. Sprint 5 — Quality & UX (z ROADMAP.md)

| Funkcja | Źródło | Uwagi |
|---------|--------|-------|
| **S5.2 Mobile & Touch — Responsive Inspector** | `ROADMAP.md` S5.2 | Pinch-to-zoom istnieje, ale Inspector nie ma responsywnego układu |
| **S5.3 Step Thumbnails** | `ROADMAP.md` S5.3 | Generowanie mini-podglądów kroków w BottomStepsBar — grep `thumbnail/stepThumb` nie wykrył implementacji |
| **S5.4 Drag Reorder Steps** | `ROADMAP.md` S5.4 | Przeciąganie chipów do zmiany kolejności kroków |
| **S5.5 Onion Skin Preview** | `ROADMAP.md` S5.5 | Ghost overlay pokazujący poprzedni/następny krok — grep onion/onionSkin = pusto |
| **S5.1 Virtual scrolling / Memoization audit** | `ROADMAP.md` S5.1 | Zaznaczone jako "future" |

### 3.2. Sprint 7 — Beta Testing (z ROADMAP.md)

| Funkcja | Źródło |
|---------|--------|
| **S7.2 Wysłanie beta invites** | `ROADMAP.md` — "Send beta invites (target: 10-20 testers)" |
| **S7.2 Monitorowanie user flows** | `ROADMAP.md` |
| **S7.2 Zbieranie UX/UI feedback** | `ROADMAP.md` |
| **S7.2 Track Stripe webhook success rate** | `ROADMAP.md` |
| **S7.3 Review feedback, prioritize bugs, iterate** | `ROADMAP.md` |

### 3.3. Team Plan (z MONETIZATION_PLAN.md)

| Funkcja | Szczegóły |
|---------|-----------|
| **Team owner + member management** | `MONETIZATION_PLAN.md` §8: "Team owner creates team, Email invitations, Member management" |
| **Centralized Stripe billing** dla team | `MONETIZATION_PLAN.md` §8 |
| **PR-MON-TEAM-MVP** | `MONETIZATION_PLAN.md` §7: risk=High, effort=2-3 days |
| **5 seats included** | `MONETIZATION_PLAN.md` §2 |

### 3.4. Sharing / Współdzielenie (z MASTER_DEVELOPMENT_PLAN.md)

| Funkcja | Szczegóły |
|---------|-----------|
| **Shared project library** | `MASTER_DEVELOPMENT_PLAN.md`: tabela `project_shares`, `MONETIZATION_PLAN.md` §8: "Team v2 — Shared project library" |
| **Transfer projects to team** | `MONETIZATION_PLAN.md` §8 |
| **Permission levels** (view/edit) | `MASTER_DEVELOPMENT_PLAN.md`: kolumna `permission` w `project_shares` |

### 3.5. Layer Order Control (z UX_ISSUES_ANALYSIS.md)

| Funkcja | Szczegóły |
|---------|-----------|
| **PR-UX-2: Bring to Front / Send to Back** | `UX_IMPLEMENTATION_PLAN.md` PR-UX-2; typ `zIndex` istnieje w core, ale brak UI/akcji |
| **Drag reorder w Layers panel** | Powiązane z warstwami |

### 3.6. Guest Login Sync (z UX_IMPLEMENTATION_PLAN.md)

| Funkcja | Szczegóły |
|---------|-----------|
| **PR-UX-1: Auto-save guest work after login** | `UX_IMPLEMENTATION_PLAN.md` PR-UX-1 (CRITICAL — P1); kod do dodania w `useAuthStore.ts` |

### 3.7. Schema Versioning (z REFACTOR_ROADMAP.md)

| Funkcja | Szczegóły |
|---------|-----------|
| **Wersjonowanie schematu dokumentu** | `PR-REFACTOR-PRODUCTION-READY-PLAN.md`: "NO schema versioning (user documents will break on updates)" — grep `schemaVersion/SCHEMA_VERSION` = pusto |

### 3.8. E2E Tests (z REFACTOR_ROADMAP.md)

| Funkcja | Szczegóły |
|---------|-----------|
| **E2E tests dla krytycznych flowów** (signup → upgrade) | `PR-REFACTOR-PRODUCTION-READY-PLAN.md` — istnieją tylko 3 testy unitowe (viewportUtils, vision.logic, documentSlice.orientationTransform) |

### 3.9. Dodatkowe funkcje z dokumentacji

| Funkcja | Źródło | Status |
|---------|--------|--------|
| **Grid snap** | `FEATURE_SPEC.md` §2.2: "Grid snap: None (free positioning)" | Jawnie wyłączone (MVP decision) |
| **Export MP4** | `S2_ANIMATION_MODULE_PLAN.md` §2.12: "defer to Sprint 3" | Nie zaimplementowane |
| **Step auto-save on element move** | `S2_ANIMATION_MODULE_PLAN.md` §2.3 | W toku (auto-save działa ogólnie, ale nie per-step) |
| **Playing state UI** (dim editing controls) | `S2_ANIMATION_MODULE_PLAN.md` §2.7 | Nie zaimplementowane |
| **Step count badge w TopBar** | `S2_ANIMATION_MODULE_PLAN.md` §2.7 | Nie zaimplementowane |
| **Analytics dashboard** | `MONETIZATION_PLAN.md` §5: "Not implemented, no plans" | Jawnie wykluczone |
| **API access** | `MONETIZATION_PLAN.md` §5: "Not implemented, no plans" | Jawnie wykluczone |
| **Team branding** | `MONETIZATION_PLAN.md` §5: "Not implemented" | Jawnie wykluczone |
| **Team templates** | `MONETIZATION_PLAN.md` §5: "Not implemented" | Jawnie wykluczone |
| **All pitch styles** | `MONETIZATION_PLAN.md`: not gated | Dostępne dla wszystkich |

---

## 📊 Podsumowanie statystyczne

| Kategoria | Liczba |
|-----------|--------|
| **✅ Zrealizowane funkcje** | ~95 |
| **🔄 W toku / częściowe** | ~35 |
| **⏳ Zaplanowane (nietknięte)** | ~28 |
| **🔴 BLOCKERS przed launch** | 3 (B1, B2, B3) |
| **🟡 HIGH priority bugs** | 1 (H1: player number delete-to-0) — H2 naprawione |
| **⚠️ Architektura (6 issues)** | 6 |
| **🔥 Hotfixy Stage 1** | 4 (B1, B2, U1, B4) |
| **Testy** | 25 (arrowRenumber) + 3 istniejące = 28 testów |
| **TODO w kodzie** | 14 |
| **TODO w packages/ui** | 1 (ProjectsDrawer inline rename) |

### Stan branchy na 2026-06-09

| Branch | Ostatni commit | Opis |
|--------|---------------|------|
| `develop` (HEAD) | `7c5882d` | Migracja na natywnego Copilota + audyt useBoardPageState + rozbudowa SYSTEM_ARCHITECTURE |
| `main` | `a5c58ee` | 1 commit za developem (Backup przed przeniesieniem z iCloud) |
| `origin/main` (remote) | `a5c58ee` | Zsynchronizowany z lokalnym main |

> ⚠️ **Uwaga:** Branch `develop` wyprzedza `main` o 1 commit. Zmiany na `develop` (usunięcie `.clinerules/`, dodanie `.github/copilot-instructions.md`, audyt wydajnościowy `useBoardPageState`, rozbudowa `SYSTEM_ARCHITECTURE.md` o +181 linii) nie zostały jeszcze zmergowane do `main`.

---

> **Wnioski:** Aplikacja TMC Studio ma solidny, szeroki fundament MVP z ~85 w pełni działającymi funkcjami. Główne ryzyko przed publicznym launch stanowią 3 BLOCKERS (B1: post-logout data leak, B2: RLS na project_shares, B3: niezweryfikowane RLS na profiles/folders). Drugim priorytetem jest dokończenie 2 HIGH-priority bugów (H1: player number delete-to-0, H2: ENTER key editing). Trzecia warstwa to architektoniczne problemy (6 issues z `ARCHITECTURE_DIAGNOSIS_6_ISSUES.md`) i dokończenie L1 Pin/Rename. Funkcje Team, Sharing, Onion skin, Step thumbnails są wyłącznie na papierze.
>
> **Rekomendacja na dziś:** Zmergować `develop` → `main`, a następnie zająć się BLOCKERS (B1-B3) jako absolutnym priorytetem przed jakimkolwiek publicznym udostępnieniem aplikacji.

> **Wnioski:** Aplikacja TMC Studio ma solidny, szeroki fundament MVP z ~85 w pełni działającymi funkcjami. Główne ryzyko przed publicznym launch stanowią 3 BLOCKERS (B1: post-logout data leak, B2: RLS na project_shares, B3: niezweryfikowane RLS na profiles/folders). Drugim priorytetem jest dokończenie 2 HIGH-priority bugów (H1: player number delete-to-0, H2: ENTER key editing). Trzecia warstwa to architektoniczne problemy (6 issues) i dokończenie L1 Pin/Rename. Funkcje Team, Sharing, Onion skin, Step thumbnails są wyłącznie na papierze.