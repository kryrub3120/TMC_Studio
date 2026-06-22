# Delivery Evidence — S2: Email confirmation flow
**Data:** 2026-06-22 11:20
**Iteracja:** 1

## Co zaimplementowano
### apps/web/src/lib/supabase.ts
- `resendConfirmationEmail(email)` — używa `supabase.auth.resend({ type: 'signup', email })`
- `signUp()` — dodano `emailRedirectTo` do `options`

### apps/web/src/store/useAuthStore.ts
- Zaimportowano `resendConfirmationEmail` (alias `supabaseResendConfirmation`)
- Dodano `resendConfirmation(email)` action
- `signIn` — wykrywa unconfirmed email i ustawia `auth.errorEmailNotConfirmed` zamiast surowego błędu

### packages/ui/src/AuthModal.tsx
- Dodano `onResendConfirmation` prop
- `isUnconfirmedError` = gdy `error === 'auth.errorEmailNotConfirmed'`
- Resend confirmation UI: yellow warning box + resend button
- Po resend: successMessage z `auth.confirmationResent`

### packages/ui/src/locales/en.ts, pl.ts, es.ts
- Dodano 4 nowe klucze: `errorEmailNotConfirmed`, `emailNotConfirmed`, `resendConfirmation`, `confirmationResent`

### apps/web/src/app/AppShell.tsx / ModalOrchestrator.tsx
- Wiring `resendConfirmation` → ModalOrchestrator → AuthModal

## Build verification
- `pnpm run build` — 5/5 successful ✅

## Decyzje implementacyjne
- Supabase `resend()` API wymaga `type: 'signup'` i `email`
- Unconfirmed detection: Supabase zwraca błąd bez `email_confirmed_at` w sesji — wykrywamy przez string match na błędzie
- AuthModal: resend dostępny tylko w trybie login z niepotwierdzonym emailem (nie w register — tam świeżo po signUp Supabase już wysłał maila)