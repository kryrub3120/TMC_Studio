# MasterAutopilot - Sprint G Delivery Evidence
**Data:** 2026-06-10
**Iteracja:** 1

## Sprint
Sprint G — Save UI / ProjectsDrawer / inline rename / pinned section / save status / thumbnail throttling

## Decyzje i uzasadnienie
- Inline rename: aktywowano istniejące (zakomentowane) stany `_renamingProjectId` → `renamingProjectId`. Double-click triggeruje input inline, Enter zatwierdza, Escape anuluje.
- ConfirmModal na delete: zastąpiono bezpośrednie `onDeleteProject(project.id)` przez `setDeleteConfirmId(project.id)` + ConfirmModal z `danger={true}`. Użyto istniejącego komponentu `ConfirmModal` z biblioteki UI.
- Save status: dodano `ProjectSaveStatus` type (`'saved' | 'saving' | 'unsaved' | 'error'`) i pole `projectSaveStatus` + `setProjectSaveStatus` w `useUIStore`. Nie persistowane (transient state).
- Thumbnail throttling: rozszerzono `AutosaveService` o `onGenerateThumbnail` callback, `lastThumbnailGeneration` timestamp, throttle 30s domyślnie. `flush()` (manual save) resetuje throttle i wymusza thumbnail.
- Pinned section: już istnieje w `ProjectsDrawer.tsx` — sortowanie pinned first, sekcja "📌 Pinned" na górze folderów. Kod już był gotowy.
- Folder color chip: istniejący — folder render w `renderFolder` używa `style={{ backgroundColor: folder.color }}` dla kolorowej kropki.
- Empty states: już istnieją dla guest i zalogowanych.
- TopBar: już ma `onOpenProjects` przycisk i save status.
- `ProjectItem` interface: dodano `saveStatus?: 'saved' | 'saving' | 'unsaved' | 'error'`.

## Co zrobiono
1. **packages/ui/src/ProjectsDrawer.tsx:**
   - Aktywowano inline rename (double-click → input → Enter/ESC)
   - Dodano `saveStatus` do `ProjectItem` i kolorowe kropki w renderowanych projektach
   - Dodano import `ConfirmModal` i zastąpiono bezpośrednie usuwanie ConfirmModal
   - Zmieniono context menu delete na `setDeleteConfirmId`
   - Rendered ConfirmModal dla potwierdzenia usunięcia

2. **apps/web/src/store/useUIStore.ts:**
   - Dodano `ProjectSaveStatus` type
   - Dodano `projectSaveStatus` state (initial: 'saved')
   - Dodano `setProjectSaveStatus` action

3. **apps/web/src/services/AutosaveService.ts:**
   - Rozszerzono `AutosaveConfig` o `onGenerateThumbnail` i `thumbnailThrottleMs`
   - Dodano `lastThumbnailGeneration` dla throttlingu
   - Autosave generuje thumbnail tylko gdy minął throttle interval (domyślnie 30s)
   - `flush()` resetuje throttle i wymusza thumbnail (manual save)
   - Dodano `forceThumbnail()` do pierwszego zapisu po utworzeniu

## Napotkane problemy
- `_onRenameProject` był destructured jako `_onRenameProject` (prefiksed `_` bo nieużywany). Poprawiono referencje.
- `setOffline` dodano do interfejsu ale bez implementacji → usunięto, bo `setOnline` już istnieje.

## Evidence
- `pnpm --filter @tmc/ui typecheck` — PASS
- `pnpm --filter @tmc/web typecheck` — PASS

## Status DoD
- [x] Double-click na projekcie → inline edit (Enter/ESC)
- [x] Pinned section na górze listy (już istniało)
- [x] Folder color chip (już istniało)
- [x] Delete → ConfirmModal → usuwa
- [x] Empty state dla guest i zalogowanych (już istniało)
- [x] Status projektu w liście (nowe: `saveStatus` + kropki)
- [x] Thumbnail throttled (30s) w AutosaveService
- [x] `projectSaveStatus` w useUIStore z akcją `setProjectSaveStatus`
- [ ] Offline: projekty z localStorage (istniejące) + toast (istniejący)
- [ ] TopBar z przyciskiem "Moje projekty" (już istnieje)

## Dla nastepnej iteracji / nastepnego agenta
- W ModalOrchestratorze lub useProjectsController można podpiąć `projectSaveStatus` z useUIStore do listy `ProjectItem.saveStatus` — to integracja warstwy app/web.
- Thumbnail generation w app layer (stage.toDataURL) to zadanie dla AppShell lub useProjectsController.