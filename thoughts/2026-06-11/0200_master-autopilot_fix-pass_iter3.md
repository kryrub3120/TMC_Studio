# MasterAutopilot - LOOP AGAIN Fix Pass (iter 2)
**Data:** 2026-06-11
**Iteracja:** 3

## Co zostało naprawione

### 1. Thumbnail generator — realnie zarejestrowany i używany
**Problem:** `setThumbnailGenerator()` był zdefiniowany ale nigdzie nie wywołany.

**Fix:**
- `BoardPage.tsx`: `useEffect` rejestruje generator pobierający `stage.toDataURL({ mimeType: 'image/png', pixelRatio: 0.25 })` → `fetch` → `blob`
- Cleanup: `return () => setThumbnailGenerator(null)` na unmount
- Import: `import { setThumbnailGenerator } from '../../store/slices/documentSlice'`

### 2. SaveStatus w ProjectsDrawer — realnie przekazywany
**Problem:** `projectItems` nie zawierały `saveStatus`, choć `ProjectItem.saveStatus` był zdefiniowany.

**Fix:**
- `AppShell.tsx`: dodano `projectSaveStatus = useUIStore(...)`
- `projectItems.map()`: current project dostaje `saveStatus: cloudProjectId === p.id ? projectSaveStatus : undefined`
- Pozostałe projekty mają `undefined` (kropka nie wyświetlona)

### 3. Cloud save result w manualSave
**Problem:** `manualSave()` nie sprawdzał wyniku `saveToCloud()` (tylko catch). `projectSaveStatus` ustawiał `saved` nawet gdy cloud zapis się nie powiódł.

**Fix:**
- `saveToCloud()` zwraca `false` gdy offline lub fail → `cloudSuccess = false`
- `manualSave()` zwraca `Promise<boolean>` z `cloudSuccess`
- `projectSaveStatus` = `'saved'` tylko gdy `cloudSuccess === true`
- Thumbnail generowany tylko przy `cloudSuccess` (nie ma sensu przy failed cloud)

### 4. Cmd+S toast
**Problem:** `Saved to cloud ☁️` pokazywał się zawsze, nawet gdy cloud save failed.

**Fix:**
- Cmd+S: `manualSave().then((cloudSaved) => showToast(cloudSaved ? 'Saved to cloud ☁️' : 'Cloud save failed'))`

### Bonus: autosaveService.markDirty() ustawia projectSaveStatus
- `AutosaveService.markDirty()` teraz woła `useUIStore.getState().setProjectSaveStatus('unsaved')`
- To naprawia status dla wszystkich 13 miejsc w `CommandRegistry` które wołają `autosaveService.markDirty()` po każdej akcji użytkownika

## Zmienione pliki
- `apps/web/src/app/board/BoardPage.tsx` — thumbnailGenerator registration + cleanup
- `apps/web/src/store/slices/documentSlice.ts` — manualSave zwraca boolean
- `apps/web/src/hooks/useKeyboardShortcuts.ts` — toast z cloud result
- `apps/web/src/app/AppShell.tsx` — projectSaveStatus do projectItems
- `apps/web/src/services/AutosaveService.ts` — + import useUIStore, markDirty ustawia status
- `apps/web/src/commands/CommandRegistry.ts` — naprawiony JSDoc

## Verification
- `pnpm typecheck` — 9/9 PASS
- `pnpm --filter @tmc/web test` — 99/99 PASS
- `rg -n "setThumbnailGenerator" apps/web` — BoardPage.tsx: definicja + użycie
- `rg -n "manualSave" apps/web` — documentSlice.ts (def) + useKeyboardShortcuts.ts (użycie)
- `rg -n "projectSaveStatus" apps/web` — useUIStore.ts (def/set) + documentSlice.ts (set) + AutosaveService.ts (set) + AppShell.tsx (read/deliver) + BoardPage.tsx (read/display)
- `rg -n "saveStatus" apps/web packages` — AppShell.tsx (wstawia), ProjectsDrawer.tsx (wyświetla), HelpSidebar.tsx (wyświetla)

## SprintGate: ACCEPT Sprint G/E/F ✅