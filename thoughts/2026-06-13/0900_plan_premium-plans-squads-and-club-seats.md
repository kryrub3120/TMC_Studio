# Plan: Solo/Team Premium — "Skład" (squad) + miejsca dla trenerów w klubie

Data: 2026-06-13
Status: do zatwierdzenia (decyzje wstępne potwierdzone z userem, plan implementacji do akceptacji)

## Decyzje potwierdzone z userem
- "Zespół" (skład zawodników) to NOWA, trwała encja — niezależna od projektów/sesji
  taktycznych. Trener tworzy 1 skład i może go używać w wielu projektach.
- Nazwy planów w UI: **Solo Premium** i **Team Premium** (zostaje obecna nazwa
  "Team", dopowiadamy w opisie "dla wielu trenerów / dla klubu").
- Limit miejsc dla trenerów w Team Premium: domyślnie 5.
  - 4/5 zajętych → soft prompt ("zostało 1 miejsce")
  - 5/5 → hard block + CTA "Skontaktuj się" (formularz/mail), limit per-konto
    konfigurowalny ręcznie w bazie po rozmowie handlowej.

## Model planów (bez zmiany wartości w DB — tylko etykiety + nowe wymiary)

| Plan (DB `subscription_tier`) | Etykieta UI | Trenerzy | Składy |
|---|---|---|---|
| `free` (niezalogowany = `guest`) | Free / Guest | 1 | 0 (guest) / 1 (free) |
| `pro` | **Solo Premium** | 1 | 1 |
| `team` | **Team Premium** | do 5 (admin + coaches) | 1 na trenera |

Nie zmieniamy stringów `subscription_tier` w bazie (`free|pro|team`) — tylko
etykiety w `PricingModal`/`TopBar`/docs. Unikamy migracji danych.

## Nowe wymiary w `entitlements.ts`
```ts
interface Entitlements {
  ...
  maxSquads: number | 'unlimited'; // guest:0, free:1, pro:1, team:1 (per-seat)
  maxCoachSeats: number;           // guest/free/pro: 1, team: 5 (default, editable per-org)
}
```
Nowe akcje w `EntitledAction`: `createSquad`, `inviteCoach`.
`can('inviteCoach', { seatCount })`:
- seatCount < maxSeats - 1 → `true`
- seatCount === maxSeats - 1 → `'soft-prompt'` (zostało 1 miejsce)
- seatCount >= maxSeats → `'hard-block'` (CTA kontakt)

## Nowy model danych (Supabase)

### `squads` (NOWA tabela)
- `id`, `owner_id` (FK profiles), `organization_id` (nullable FK), `name`,
  `players` JSONB (lista: imię, numer, pozycja), `created_at`, `updated_at`
- RLS: właściciel widzi/edytuje swój skład; w organizacji — coach widzi swój,
  admin widzi wszystkie składy organizacji (read-only podgląd, na start).

### `organizations` (NOWA tabela) — reprezentuje "Klub" (Team Premium)
- `id`, `name`, `owner_id` (admin, FK profiles), `seat_limit` INT DEFAULT 5,
  `stripe_customer_id`, `subscription_tier` DEFAULT 'team', timestamps

### `organization_members` (NOWA tabela)
- `id`, `organization_id`, `user_id` (nullable do akceptacji), `invited_email`,
  `role` ('admin'|'coach'), `status` ('invited'|'active'|'removed'), timestamps

### `profiles` (ALTER)
- `organization_id` UUID NULL — gdy ustawione, efektywny plan = `team`
  niezależnie od własnego `subscription_tier` (admin płaci za organizację).

## UI/UX — co trzeba dodać

1. **"Mój skład" (Squad)** — nowa sekcja w drawerze projektów / settings:
   lista zawodników (imię, nr, pozycja), edycja, jeden skład per trener
   (guest: lokalnie w localStorage, bez zapisu w cloud — zgodnie z entitlements).
   Przy starcie nowego projektu: opcja "wczytaj zawodników z mojego składu".

2. **Panel "Klub" (Team Premium, tylko admin)** — w `SettingsModal`:
   - lista trenerów (X/5 miejsc), status (aktywny/zaproszony)
   - zapraszanie przez e-mail
   - banner soft-prompt przy 4/5: "Zostało 1 miejsce w planie Team Premium"
   - przy 5/5: przycisk "Zaproś trenera" zablokowany, CTA
     "Potrzebujesz więcej miejsc? Skontaktuj się z nami" → mailto/formularz

3. **PricingModal** — aktualizacja opisów:
   - Solo Premium: "1 trener, 1 skład, eksport GIF/PDF, nielimitowane projekty"
   - Team Premium: "Do 5 trenerów w klubie, każdy z własnym składem,
     zarządzanie przez admina. Większy klub? Skontaktuj się z nami."

4. **Dev test login (z poprzedniej zmiany)** — w Fazie 3 dodam dodatkową
   przełączkę "jako admin klubu / jako trener w klubie", żeby przetestować
   panel "Klub" bez realnej organizacji w bazie.

## Fazowanie (każda faza osobno testowalna)

**Faza 1 — Etykiety i entitlements (niska ryzykowność, bez migracji DB)**
- `entitlements.ts`: `maxSquads`, `maxCoachSeats`, akcje `createSquad`/`inviteCoach`
- `PricingModal`, `TopBar` (plan badge): "Solo"/"Team Premium" + nowe opisy
- aktualizacja `docs/ENTITLEMENTS.md`

**Faza 2 — Skład (squad) jako nowa encja**
- migracja `squads` + RLS
- CRUD UI (lista zawodników, edycja), lokalny fallback dla guest
- integracja z nowym projektem ("wczytaj skład")

**Faza 3 — Organizacje / miejsca dla trenerów (Team Premium)**
- migracje `organizations`, `organization_members`, `profiles.organization_id`
- panel "Klub" w Settings (admin), zaproszenia, soft/hard limit 4/5 i 5/5
- rozszerzenie dev test login o rolę admina/trenera w klubie

**Faza 4 — Billing**
- Stripe: produkt/cena "Team Premium" (do 5 miejsc), webhook ustawia
  `organizations.subscription_tier` + `seat_limit`
- CTA "Skontaktuj się" → formularz/mail (poza Stripe, ręczna obsługa)

## Kolejność
Faza 1 → Faza 2 → Faza 3 → Faza 4, z weryfikacją (typecheck + manualny test
przez dev test-login) po każdej fazie.
