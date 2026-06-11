# MasterAutopilot - LOOP AGAIN Fix Pass
**Data:** 2026-06-11
**Iteracja:** 2

## Co zostało naprawione

### 1. Thumbnail throttling — realnie podpięty
**Problem:** `onGenerateThumbnail` i `lastThumbnailGeneration` istniały w `AutosaveService` ale nikt nie wołał `autosaveService.configure()`, więc thumbnail NEVER działał.

**Fix:**
- Usunięto martwy kod z `AutosaveService.ts` (zostawiono klasę jako jest, nie jest już używana do thumbnails).
- Dodano **modułowy callback** `thumbnailGenerator` w `documentSlice.ts` — `setThumbnailGenerator()`.
- `performAutoSave()` (autosave co 2s): generuje thumbnail max raz na 30s (`lastThumbnailTs`).
- `manualSave()` (Cmd+S): **zawsze** generuje thumbnail, ale resetuje timer (`lastThumbnailTs = Date.now()`) aby autosave nie zrobił drugiego.
- W Cmd+S handlerze (`useKeyboardShortcuts.ts`) zastąpiono `saveDocument()` + `saveToCloud()` → `manualSave()`.

### 2. Save status — realnie aktualizowany
**Problem:** `setProjectSaveStatus` istniał w useUIStore ale nikt go nie wołał. `isSaved` był hardcoded `true`.

**Fix:**
- `markDirty()` woła `useUIStore.getState().setProjectSaveStatus('unsaved')`.
- `performAutoSave()` aktualizuje `saving` → `saved`/`error`.
- `manualSave()` aktualizuje `saving` → `saved`/`error`.
- `isSaved` w `useBoardPageState.ts` teraz pochodzi z `!isDirty` (reaktywny).

### 3. TutorialOverlay — poprawne warunki
**Problem:** Tutorial renderował się na podstawie `!tutorialCompleted && elements.length === 0`, a efekt triggera używał `if` zamiast `setShowTutorial` z false.

**Fix:**
- Efekt triggera ustawia `state.setShowTutorial(shouldShow)` z `true/false`.
- Render: `{state.showTutorial && <TutorialOverlay .../>}`.
- Dodano `!state.helpSidebarOpen` do warunków blokady.

### 4. deleteConfirmId — nie czyszczony na mouseLeave
**Problem:** `onMouseLeave` w projekcie kasował `deleteConfirmId`, co zamykało otwarty ConfirmModal.

**Fix:** Usunięto `if (deleteConfirmId === project.id) setDeleteConfirmId(null)` z `onMouseLeave`.

## Zmienione pliki
- `apps/web/src/store/slices/documentSlice.ts` — thumbnailGenerator callback, manualSave, generateThumbnail, save status updates
- `apps/web/src/hooks/useKeyboardShortcuts.ts` — Cmd+S używa `manualSave()`
- `apps/web/src/app/routes/useBoardPageState.ts` — prawdziwy `isSaved` z `isDirty`
- `apps/web/src/app/board/BoardPage.tsx` — tutorial trigger + condition fix
- `packages/ui/src/ProjectsDrawer.tsx` — usunięto deleteConfirmId clear

## Verification
- `pnpm typecheck` — 9/9 PASS
- `pnpm --filter @tmc/web test` — 99/99 PASS

## Manual QA Checklist (niewykonalne w headless)

### Save status
- [ ] Dodaj element → TopBar pokazuje "Unsaved" (zamiast "Saved")
- [ ] Cmd+S → TopBar pokazuje "Saving..." → "Saved"
- [ ] Odśwież stronę → status "Saved" (bo isDirty === false)
- [ ] HelpSidebar: otwórz → Save Status sekcja pokazuje aktualny stan

### Thumbnail
- [ ] Utwórz projekt cloud → zapisz → thumbnail zapisany w Supabase Storage
- [ ] Autosave: edytuj → odczekaj 2s → thumbnail po 30s (nie przy każdym)
- [ ] Cmd+S: thumbnail generowany natychmiast, bez duplikacji

### Delete confirm
- [ ] Kliknij kosz na projekcie → ConfirmModal się otwiera
- [ ] Najedź na inny projekt → ConfirmModal NIE znika
- [ ] ESC → ConfirmModal się zamyka
- [ ] Confirm → projekt usunięty

### Tutorial first-run
- [ ] Fresh state: tutorial pokazuje się na pustej tablicy
- [ ] Skip → znika → odświeżenie → NIE pojawia się ponownie
- [ ] Otwórz CheatSheet → tutorial NIE pokazuje się
- [ ] Otwórz HelpSidebar → tutorial NIE pokazuje się
- [ ] Print Mode → tutorial NIE pokazuje się
- [ ] Po załadowaniu istniejącego projektu → tutorial NIE pokazuje się

## Pozostałe ryzyka
- 🟢 NISKIE: `thumbnailGenerator` callback rejestrowany przez `setThumbnailGenerator()` — musi być ustawiony przed pierwszym save. Jeśli nie ustawiony, thumbnail nie jest generowany (fail silent).
- 🟢 NISKIE: `isSaved` = `!isDirty` — to znaczy że po autosave (po 2s) status wróci na "Saved", nawet jeśli cloud save nie działa. Cloud failure obsługiwany osobno przez `projectSaveStatus = 'error'`.
- 🟢 NISKIE: Floating button (`bottom-6 right-6`) i ZoomWidget (`bottom-4 right-4`) mogą na siebie nachodzić.

## SprintGate: ACCEPT Sprint G/E/F ✅