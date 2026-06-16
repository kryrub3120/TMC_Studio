# Delivery Evidence - H4 Integracja końcowa
**Data:** 2026-06-15 23:45
**Iteracja:** 1

## Zadanie
Finalna integracja wszystkich zmian: ClubWelcomeModal + useUIStore.clubWelcomeSeen + podpięcie w AppShell.

## Co zaimplementowano

### useUIStore.ts
- Nowe pole `clubWelcomeSeen: boolean`
- `setClubWelcomeSeen(seen)` akcja
- Persist w localStorage (`partialize`)

### AppShell.tsx
- `useMemo` → `useEffect` dla triggera Club Welcome
- `teamId` z useAuthStore
- `clubWelcomeSeen` + `setClubWelcomeSeen` z useUIStore
- `clubWelcomeModalOpen` state
- useEffect: if teamId && !clubWelcomeSeen → show modal
- `handleSaveTeamName` — tworzy organizację przez `createOrganizationApi`
- `handleClubWelcomeComplete/Skip` — ustawia `clubWelcomeSeen`
- ClubWelcomeModal w JSX z `onOpenTeamPanel` → otwiera Settings → Club tab
- Import `ClubWelcomeModal` z `@tmc/ui`

### TypeScript
- packages/ui: czysty
- apps/web: czysty (po usunięciu unused `useMemo`)

## Zmienione pliki
- `apps/web/src/store/useUIStore.ts` — clubWelcomeSeen
- `apps/web/src/app/AppShell.tsx` — integracja ClubWelcomeModal

## Wynik
- [x] ClubWelcomeModal podpięty w AppShell
- [x] Trigger: teamId exists + !clubWelcomeSeen
- [x] Onboarding pokazuje się raz
- [x] Można skipnąć (nie wraca)
- [x] Save team name → tworzy organizację
- [x] Invite step → otwiera Settings → Club
- [x] TypeScript czysty

## Manual QA Checklist
1. devLogin('team') → powinien pokazać ClubWelcomeModal
2. Skip → modal znika, nie wraca po refresh
3. Name team → Enter → przechodzi do step 2
4. Invite → otwiera Settings → Club
5. Complete → zamyka modal
6. Tutorial działa osobno (nie koliduje z Club Welcome)
7. FAQ pokazuje kategorię "Club Premium" dla planu team
8. Tutorial ma krok 9 (Team Management) dla planu team