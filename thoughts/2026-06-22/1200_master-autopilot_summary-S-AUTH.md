# Master Autopilot Summary — S-AUTH: domknięcie logowania (web-only)
**Data:** 2026-06-22 12:00

## Sprinty
| Sprint | Status | Iteracje | Pliki zmienione |
|--------|--------|----------|-----------------|
| S1 — Reset hasła end-to-end | ACCEPT | 1 | 12 plików (supabase.ts, useAuthStore, AuthModal, ResetPasswordPage new, routes, ModalOrchestrator, AppShell, i18n en/pl/es) |
| S2 — Email confirmation flow | ACCEPT | 1 | 7 plików (supabase.ts, useAuthStore, AuthModal, ModalOrchestrator, AppShell, i18n en/pl/es) |
| S3 — Dług sync z UX-B | ACCEPT | 1 | 9 plików (migration new, AUTH_FLOW.md, 6× package.json, CHANGELOG.md) |

## Podsumowanie

### Co zrealizowano
- **Reset hasła:** `resetPasswordForEmail()` → `sendResetLink()` → AuthModal forgot fix → `/auth/reset-password` z PKCE
- **Email confirm:** `resendConfirmationEmail()` → detekcja unconfirmed przy login → resend button w AuthModal
- **Sync debt cleanup:** beforeunload flush audyt (poprawny JSONB-merge przez RPC, auth.uid()); usunięcie martwej kolumny `preferences_updated_at`
- **i18n:** 8 nowych kluczy auth.* w en/pl/es
- **Wersja:** 0.8.0 → 0.9.0 + CHANGELOG

### Poza zakresem (not planned)
Apple, magic-link, SSO, netlify/functions

### Użyte skille
| Sprint | Skille |
|--------|--------|
| S1 | security-privacy-review, ui-delivery, regression-testing |
| S2 | ui-delivery, regression-testing |
| S3 | regression-testing, docs-update |

### Build & Test
- `pnpm run build` — ✅ 5/5 successful (wersja 0.9.0)
- `pnpm --filter @tmc/web run test` — ✅ 113/113 tests passed (7 test files)
- Security secrets grep — ✅ Brak sekretów w kodzie źródłowym

## Zmienione pliki (full list)
```
apps/web/src/lib/supabase.ts                    # resetPasswordForEmail + resendConfirmationEmail + signUp emailRedirectTo
apps/web/src/store/useAuthStore.ts              # sendResetLink + resendConfirmation + unconfirmed email detection
apps/web/src/pages/ResetPasswordPage.tsx         # NEW — reset form
apps/web/src/pages/index.ts                      # export ResetPasswordPage
apps/web/src/main.tsx                            # /auth/reset-password route
apps/web/src/pages/AuthCallbackPage.tsx          # revert (unchanged)
apps/web/src/app/AppShell.tsx                    # sendResetLink + resendConfirmation wiring
apps/web/src/app/orchestrators/ModalOrchestrator.tsx  # onSendResetLink + onResendConfirmation props
packages/ui/src/AuthModal.tsx                    # forgot mode fix + resend UI
packages/ui/src/locales/en.ts                    # auth.resetEmailSent, errorEmailNotConfirmed, etc.
packages/ui/src/locales/pl.ts                    # jw.
packages/ui/src/locales/es.ts                    # jw.
supabase/migrations/20260622120000_drop_preferences_updated_at.sql  # NEW — drop dead column
package.json (root)                              # 0.8.0 → 0.9.0
apps/web/package.json                            # 0.8.0 → 0.9.0
packages/*/package.json                          # 0.8.0 → 0.9.0
CHANGELOG.md                                     # [0.9.0] release
docs/AUTH_FLOW.md                                # Sections 12, 13 added
```

## Ryzyka / Uwagi
- ResetPasswordPage czeka do 3.5s na PKCE exchange — może być za krótko na wolnych sieciach
- Unconfirmed email detection przez string match na błędzie Supabase — może się zmienić w przyszłych wersjach SDK

## Co dalej
- Wszystkie sprinty zaakceptowane ✅
- Gotowe do przeglądu przez użytkownika
- Opcje: ACCEPT / STOP / CHANGE PLAN