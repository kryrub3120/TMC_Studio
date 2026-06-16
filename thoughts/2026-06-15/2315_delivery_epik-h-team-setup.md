# Delivery Evidence - Epik H: Premium Team Setup + H3 Club Onboarding
**Data:** 2026-06-15 23:15
**Iteracja:** 1

## Zadanie
Wdrożenie Premium Team Setup (Club Premium) + Club Premium Onboarding flow.

## Co zaimplementowano

### TeamH1 — Migracja DB + RLS
- `supabase/migrations/20260615000004_add_team_tables.sql`
  - Tabela `teams` (id, name, owner_id, max_members, stripe_customer_id, active)
  - Tabela `team_members` (team_id, user_id, role CHECK admin/member, UNIQUE)
  - Tabela `team_invites` (team_id, invited_email, status, expires_at 7d)
  - Kolumna `team_id` w `profiles`
  - RLS: owner ALL, members SELECT, invites per email
  - Indexy na owner_id, stripe_customer_id, team_id, user_id, email

### TeamH2 — entitlements + webhook + auth

**entitlements.ts:**
- `derivePlan()` przyjmuje 3. parametr `teamId` — jeśli ustawione, zwraca 'team'
- `can('inviteMember')` działa dla planu 'team'

**supabase.ts (User type):**
- Dodane `team_id?: string | null`

**useAuthStore.ts:**
- Dodane `teamId: string | null` w stanie i interfejsie
- Ustawiane w onAuthStateChange, devLogin, signOut
- `devLogin('team')` ustawia `teamId: 'dev-team-id'`

**useEntitlements.ts:**
- Pobiera `teamId` z `useAuthStore`
- Przekazuje do `derivePlan(isAuthenticated, subscription_tier, teamId)`

**stripe-webhook.ts:**
- `handleCheckoutCompleted()`: po checkout `team` wywołuje `ensureTeamForUser()`
- `ensureTeamForUser()`: idempotentne tworzenie teamu (sprawdza stripe_customer_id)
  - Tworzy `teams` z name='My Club'
  - Dodaje owner jako admin w `team_members`
  - Update `profiles.team_id`
- Idempotentność: sprawdza czy team z `stripe_customer_id` już istnieje

### TeamH3 — Club Premium Onboarding

**ClubWelcomeModal.tsx (NOWY):**
- 3-step onboarding: Name team → Invite member → Complete
- Step 1: inline form do nazwania teamu
- Step 2: CTA do otwarcia OrganizationPanel (Team panel)
- Step 3: podsumowanie benefitów
- Skip/do-later opcje

**i18n:**
- `club.welcome.*` w en.ts, pl.ts, es.ts (15+ kluczy)

## Zmienione pliki (11)
- `supabase/migrations/20260615000004_add_team_tables.sql` — NOWY
- `apps/web/src/lib/entitlements.ts` — derivePlan z teamId
- `apps/web/src/lib/supabase.ts` — User type z team_id
- `apps/web/src/store/useAuthStore.ts` — teamId state + devLogin team
- `apps/web/src/hooks/useEntitlements.ts` — teamId z useAuthStore
- `netlify/functions/stripe-webhook.ts` — ensureTeamForUser()
- `packages/ui/src/ClubWelcomeModal.tsx` — NOWY
- `packages/ui/src/index.ts` — export ClubWelcomeModal
- `packages/ui/src/locales/en.ts` — club.welcome.*
- `packages/ui/src/locales/pl.ts` — club.welcome.*
- `packages/ui/src/locales/es.ts` — club.welcome.*

## Wynik
- [x] Migracja DB z RLS
- [x] Entitlements: teamId → plan 'team'
- [x] Auth: teamId w useAuthStore
- [x] Stripe webhook: autotworzenie teamu po checkout team
- [x] ClubWelcomeModal z 3 krokami
- [x] i18n en/pl/es
- [x] TypeScript czysty (packages/ui + apps/web)

## Co dalej
- H4 — Integracja końcowa: podpięcie ClubWelcomeModal w App.tsx
- Stripe QA przez @StripeTester
- Testy manualne flow: checkout → webhook → team creation → onboarding