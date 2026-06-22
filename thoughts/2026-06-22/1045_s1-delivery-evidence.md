# Delivery Evidence — S1: Reset hasła end-to-end
**Data:** 2026-06-22 10:45
**Iteracja:** 1

## Co zaimplementowano

### 1. `apps/web/src/lib/supabase.ts`
- Dodano `resetPasswordForEmail()` — woła Supabase `auth.resetPasswordForEmail()` z PKCE, redirectTo na `/auth/reset-password`

### 2. `apps/web/src/store/useAuthStore.ts`
- Zaimportowano `resetPasswordForEmail` (alias `supabaseResetPasswordForEmail`)
- Dodano action `sendResetLink(email)` — publiczna metoda na store
- Obsługa błędów: offline mode, Supabase error, przekazanie re-throw

### 3. `packages/ui/src/AuthModal.tsx`
- Dodano prop `onSendResetLink`
- Naprawiono forgot mode: walidacja TYLKO email (bez hasła)
- Implementacja submit dla forgot: woła `onSendResetLink`, pokazuje `auth.resetEmailSent`, resetuje form, wraca do login

### 4. `apps/web/src/pages/ResetPasswordPage.tsx` (NOWY plik)
- Strona `/auth/reset-password` — formularz ustawienia nowego hasła
- Sprawdza sesję (PKCE exchange przez Supabase SDK z `detectSessionInUrl`)
- Czeka do 3.5s na completion exchange (backoff retry)
- Po sukcesie `updateUser({ password })`, redirect do `/app`

### 5. `apps/web/src/pages/index.ts`
- Eksport `ResetPasswordPage`

### 6. `apps/web/src/main.tsx`
- Dodano import `ResetPasswordPage`
- Dodano route `/auth/reset-password`

### 7. `apps/web/src/app/AppShell.tsx`
- Dodano `sendResetLink` z useAuthStore
- Przekazano `onSendResetLink={sendResetLink}` do ModalOrchestrator

### 8. `apps/web/src/app/orchestrators/ModalOrchestrator.tsx`
- Dodano `onSendResetLink` do props i przekazano do AuthModal

### 9. `packages/ui/src/locales/en.ts`, `pl.ts`, `es.ts`
- Dodano klucz `auth.resetEmailSent` we wszystkich 3 językach

## Decyzje implementacyjne
- **Recovery redirect bezpośrednio na `/auth/reset-password` (intentional deviation from original contract)** — nie przez AuthCallbackPage. Pierwotny plan zakładał redirect przez `/auth/callback?type=recovery`, ale AuthCallbackPage ma złożoną logikę OAuth popup (postMessage, wykrywanie popup, fallback polling). Reset hasła nie potrzebuje tej złożoności. Supabase SDK `detectSessionInUrl:true` automatycznie wykonuje PKCE exchange na dowolnym URL zawierającym `?code=...`. ResetPasswordPage ma własny retry loop (500/1500/3000ms) na wypadek race condition z React Router. **Decyzja udokumentowana w docs/AUTH_FLOW.md §12.**
- **ResetPasswordPage używa `auth.updateUser({ password })`** — standardowe API Supabase do zmiany hasła po recovery
- **Walidacja forgot mode tylko email** — AuthModal nie wymuszał hasła w formularzu forgot, ale walidacja wymagała → naprawiono

## Zmienione pliki
- apps/web/src/lib/supabase.ts
- apps/web/src/store/useAuthStore.ts
- apps/web/src/pages/index.ts
- apps/web/src/main.tsx
- apps/web/src/pages/ResetPasswordPage.tsx (NOWY)
- apps/web/src/pages/AuthCallbackPage.tsx (revert to original)
- apps/web/src/app/AppShell.tsx
- apps/web/src/app/orchestrators/ModalOrchestrator.tsx
- packages/ui/src/AuthModal.tsx
- packages/ui/src/locales/en.ts
- packages/ui/src/locales/pl.ts
- packages/ui/src/locales/es.ts

## Build verification
- `pnpm run build` — 5 tasks successful, ok
- Zmiany w moich plikach: 0 TS errors (tylko pre-existing @tmc/core/ui module resolution)

## Ryzyka implementacyjne
- ResetPasswordPage czeka na PKCE exchange do 3.5s — może być za krótko dla wolnej sieci
- Supabase `detectSessionInUrl: true` może nie zawsze działać z recovery flow z powodu race condition z React Router