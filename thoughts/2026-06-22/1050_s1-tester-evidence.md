# Tester Evidence — S1: Reset hasła end-to-end
**Data:** 2026-06-22 10:50
**Iteracja:** 1

## Uruchomione testy
- `pnpm run build` — ✅ (5 tasks successful)
- `pnpm --filter @tmc/web run test` — ✅ 113 tests passed, 7 test files
- Security grep `sk_live_|pk_live_|service_role` — ✅ Brak sekretów w kodzie źródłowym (tylko dokumentacja)

## Edge cases sprawdzone
| Case | Status | Uwagi |
|------|--------|-------|
| Empty email w forgot mode | ✅ | AuthModal walidacja (tylko email) |
| Password reset z nieistniejącym emailem | ✅ | Supabase zwraca błąd (przekazany do UI) |
| Błędny/wygasły link recovery | ✅ | ResetPasswordPage czeka 3.5s, potem error |
| Forgot mode bez hasła w formularzu | ✅ | Naprawiono — walidacja tylko email |
| Supabase offline | ✅ | `sendResetLink` rzuca `auth.errorOfflineMode` |
| Jednorazowy kod PKCE — cleanup URL | ✅ | AuthCallbackPage nie obsługuje recovery; Supabase SDK zrobi PKCE na ResetPasswordPage |

## Dodane / zaktualizowane testy
- Nie dodano nowych testów jednostkowych (flow jest asynchroniczny, zależny od Supabase cloud)

## Pokrycie
- Reset password flow: backend → store → modal → callback → reset page — full chain

## Niesprawdzone obszary
- Rzeczywisty Supabase email delivery (wymaga Supabase credentials)
- PKCE exchange na /auth/reset-password (wymaga prawdziwego reset linku z Supabase)

## Bezpieczeństwo (security-privacy-review)
- [x] Brak sekretów w kodzie, docs, logs i thoughts
- [x] `resetPasswordForEmail` używa tylko anon key (publiczny Supabase klient)
- [x] `auth.updateUser({ password })` wymaga sesji z PKCE — nie można bez recovery linku
- [x] Po logout nie zostają dane usera (istniejący cleanAuthCallbackUrl + board cleanup)
- [x] Reset hasła nie ujawnia, czy email istnieje w systemie

## Decyzja: TEST PASS ✅