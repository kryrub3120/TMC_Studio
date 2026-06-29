# Sprint Contract — S2: Email confirmation flow
**Data:** 2026-06-22 11:05
**Sprint:** 2/3

## Cel sprintu
Zapewnić kompletny email confirmation flow po signUp: komunikat „sprawdź skrzynkę", możliwość resend, poprawne lądowanie linku confirm, obsługa stanu unconfirmed_user.

## Zakres
- apps/web/src/lib/supabase.ts — dodanie `resendConfirmationEmail()`
- apps/web/src/store/useAuthStore.ts — dodanie `resendConfirmation()` + wykrywanie unconfirmed po signIn
- packages/ui/src/AuthModal.tsx — dodanie przycisku resend po signUp, komunikat o niepotwierdzonym koncie przy login
- packages/ui/src/locales/en.ts, pl.ts, es.ts — nowe klucze i18n
- apps/web/src/pages/AuthCallbackPage.tsx — obsługa email confirmation (Supabase automatycznie obsługuje przez PKCE)

## Poza zakresem
- Apple/magic-link/OTP/SSO
- Zmiany w netlify/functions
- Zmiany w supabase/migrations

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| ui-delivery | AuthModal — stany unconfirmed + resend | i18n parity, typecheck |
| regression-testing | Po implementacji | typecheck, build, test |
| docs-update | AUTH_FLOW.md — sekcja email confirm | AUTH_FLOW.md update |

## Kryteria akceptacji
- [ ] signUp z komunikatem „sprawdź skrzynkę" (istnieje — auth.verifyEmail)
- [ ] Resend confirmation button w AuthModal po signUp
- [ ] signIn z niepotwierdzonym emailem → komunikat o potrzebie weryfikacji + resend
- [ ] `resendConfirmationEmail()` w supabase.ts
- [ ] `resendConfirmation()` w useAuthStore
- [ ] i18n: nowe klucze w en/pl/es
- [ ] typecheck/build zielone

## Ryzyka
- Supabase identyfikuje unconfirmed userów przez `user.email_confirmed_at === null` lub kod błędu `email_not_confirmed`
- Po signIn z niepotwierdzonym emailem Supabase zwraca błąd, nie sesję