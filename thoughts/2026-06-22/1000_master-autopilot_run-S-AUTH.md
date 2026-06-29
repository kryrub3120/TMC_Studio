# Master Autopilot Run — S-AUTH: domknięcie logowania (web-only)
**Data:** 2026-06-22
**Limit:** 3 sprinty, 3 próby na sprint

## Główny plan
Domknąć email auth tak, by żaden użytkownik nie został zablokowany, i posprzątać dług sync z UX-B.

## Sprinty zidentyfikowane
| Sprint | Cel | Zależności |
|--------|-----|------------|
| S1 | Reset hasła end-to-end | - |
| S2 | Email confirmation flow | S1 (AuthCallbackPage) |
| S3 | Dług sync z UX-B | - |

## Decyzje początkowe
- **Kolejność:** S1 → S2 → S3 (S2 wymaga AuthCallbackPage changes z S1)
- **Reset hasła:** Supabase `resetPasswordForEmail()` + route `/auth/callback?type=recovery` w AuthCallbackPage
- **Email confirm:** `user.confirmed_at` null → komunikat; resend przez `resend()` po 60s debounce
- **preferences_updated_at:** jeśli martwy → usunąć kolumnę i trigger; jeśli używany → zostawić
- **Wersja:** 0.8.0 → 0.9.0 (minor — trzy funkcje auth)
- **i18n:** wszystkie nowe teksty w en/pl/es, te same klucze

## Przeczytane dokumenty
- docs/SYSTEM_ARCHITECTURE.md (§1-11)
- docs/AUTH_FLOW.md (§1-11)
- .github/skills/security-privacy-review/SKILL.md
- .github/skills/ui-delivery/SKILL.md
- .github/skills/regression-testing/SKILL.md
- .github/skills/docs-update/SKILL.md

## Ryzyka
- **AuthCallbackPage** już obsługuje OAuth PKCE — dodanie reset/confirm może skomplikować logikę
- **beforeunload** flush nie może się psuć — już działa przez RPC
- **preferences_updated_at** — usunięcie kolumny to migracja, wymaga rollback planu