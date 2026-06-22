# Sprint Contract — S1: Reset hasła end-to-end
**Data:** 2026-06-22 10:15
**Sprint:** 1/3

## Cel sprintu
Zaimplementować kompletny flow resetu hasła: backend `resetPasswordForEmail` w supabase.ts, action w useAuthStore, strona/route resetu hasła, obsługa linku recovery w AuthCallbackPage, naprawa forgot mode w AuthModal, stany błędów.

## Zakres
- apps/web/src/lib/supabase.ts — dodanie `resetPasswordForEmail()`
- apps/web/src/store/useAuthStore.ts — dodanie `sendResetLink()` action
- apps/web/src/pages/AuthCallbackPage.tsx — obsługa `?type=recovery`
- apps/web/src/pages/ResetPasswordPage.tsx — NOWY: formularz ustawienia nowego hasła
- apps/web/src/pages/index.ts — eksport ResetPasswordPage
- apps/web/src/main.tsx — dodanie trasy `/auth/reset-password`
- packages/ui/src/AuthModal.tsx — fix forgot mode (walidacja + callback)
- apps/web/src/app/orchestrators/ModalOrchestrator.tsx — dodanie `onSendResetLink`
- apps/web/src/app/AppShell.tsx — wiring
- packages/ui/src/locales/en.ts, pl.ts, es.ts — nowe klucze i18n

## Poza zakresem
- Apple/magic-link/OTP/SSO
- Zmiany w netlify/functions
- Zmiany w supabase/migrations (nie potrzeba nowej DB struktury)

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| security-privacy-review | Zmiany w auth, Supabase, user data | secrets grep, auth isolation check, RLS check |
| ui-delivery | AuthModal, ResetPasswordPage, ModalOrchestrator | i18n parity, mobile layout, a11y, typecheck |
| regression-testing | Po implementacji | typecheck, build, manual flow |

## Kryteria akceptacji
- [ ] `resetPasswordForEmail()` w supabase.ts woła Supabase API z redirectTo na `/auth/callback?type=recovery`
- [ ] `sendResetLink()` w useAuthStore działa i obsługuje błędy
- [ ] AuthModal forgot mode: walidacja tylko email (nie wymaga hasła), wywołuje `onSendResetLink`
- [ ] AuthCallbackPage wykrywa `?type=recovery` i przekierowuje do reset formularza
- [ ] `/auth/reset-password` — formularz z nowym hasłem, po sukcesie redirect do /app
- [ ] Wszystkie stany błędów obsłużone: expired link, invalid code, server error
- [ ] i18n: wszystkie nowe teksty w en/pl/es
- [ ] typecheck zielone, build zielony

## Ryzyka
- Supabase PKCE flow: recovery code jest jednorazowy — trzeba uważać na cleanAuthCallbackUrl
- AuthCallbackPage ma już skomplikowaną logikę OAuth — recovery idzie wprost na /auth/reset-password (nie przez AuthCallbackPage)

### Aktualizacja po implementacji
**Decyzja:** redirectTo na `/auth/reset-password` (nie przez `/auth/callback?type=recovery` jak w oryginalnym planie). Uzasadnienie: Supabase SDK `detectSessionInUrl:true` wykonuje PKCE exchange na dowolnym URL. ResetPasswordPage ma retry loop zamiast polegać na AuthCallbackPage (które ma złożoną logikę OAuth popup). Decyzja udokumentowana w docs/AUTH_FLOW.md §12.