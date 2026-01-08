# Cloud Save - Zapisywanie projektów do Supabase

## Goal
Umożliwić zalogowanym użytkownikom zapisywanie i ładowanie projektów z chmury. Integracja z istniejącym `Cmd+S` oraz `ProjectsDrawer`.

## Current State
- ✅ Auth działa (Google OAuth)
- ✅ Profile tworzony automatycznie
- ✅ Tabela `projects` istnieje w Supabase
- ✅ RLS policies skonfigurowane
- ⚠️ Projekty zapisują się tylko do localStorage

## Files to Modify
- `apps/web/src/lib/supabase.ts` - funkcje API (już częściowo gotowe)
- `apps/web/src/store/useBoardStore.ts` - integracja cloud save
- `packages/ui/src/ProjectsDrawer.tsx` - lista projektów z chmury
- `packages/ui/src/TopBar.tsx` - wskaźnik syncu

## Steps

### Step 1: Cloud Save Integration
1. Dodać funkcję `saveProjectToCloud()` w `useBoardStore`
2. Zmodyfikować `saveDocument()` żeby zapisywało do Supabase jeśli user zalogowany
3. Dodać loading state podczas zapisu

### Step 2: Load Projects from Cloud
1. Dodać funkcję `loadProjectFromCloud(projectId)` w `useBoardStore`
2. Zintegrować z `ProjectsDrawer`
3. Wyświetlać listę projektów użytkownika

### Step 3: ProjectsDrawer Enhancement
1. Pokazać projekty z chmury zamiast/oprócz localStorage
2. Dodać akcje: Open, Delete, Rename
3. Wskaźnik czy projekt jest zsynchronizowany

### Step 4: Auto-sync (Optional)
1. Debounced auto-save przy zmianach
2. Conflict resolution (last-write-wins)
3. Offline queue

## Commands
```bash
pnpm dev
```

## Acceptance Criteria
- [ ] Cmd+S zapisuje projekt do Supabase (jeśli zalogowany)
- [ ] ProjectsDrawer pokazuje projekty z chmury
- [ ] Można otworzyć projekt z chmury
- [ ] Można usunąć projekt z chmury
- [ ] Toast notification po zapisie

## Priority
🔴 HIGH - to jest główna wartość dla użytkowników z kontem

## Estimated Time
~2-3 godziny

---

## Alternative Next Steps

### Option B: Stripe Payments
Setup płatności dla tier'ów Pro/Team:
- [ ] Stripe Dashboard konfiguracja
- [ ] Netlify Function - create-checkout
- [ ] Webhook handling - subscription updates
- [ ] Feature gating (limit 5 projektów dla free)

### Option C: Mobile/Touch Support
Optymalizacja dla urządzeń mobilnych:
- [ ] Touch pan/drag
- [ ] Pinch-to-zoom
- [ ] Responsive Inspector

### Option D: Step Thumbnails
Mini podglądy kroków animacji:
- [ ] Generate canvas thumbnails
- [ ] Show in BottomStepsBar
- [ ] Cache w localStorage

---

## Recommended Order
1. **Cloud Save** (high value, auth already works)
2. **Stripe Payments** (monetization)
3. **Step Thumbnails** (UX)
4. **Mobile Support** (reach)

---

*Created: 2026-01-08*
*Status: Ready for implementation*

