# Tester Evidence — S2: Email confirmation flow
**Data:** 2026-06-22 11:25
**Iteracja:** 1

## Uruchomione testy
- `pnpm run build` — ✅ 5/5 successful
- `pnpm --filter @tmc/web run test` — ✅ 113 tests passed, 7 files

## Edge cases
| Case | Status | Uwagi |
|------|--------|-------|
| signUp → successMessage z verifyEmail | ✅ | Istniało już (auth.verifyEmail) |
| signIn z niepotwierdzonym emailem → errorEmailNotConfirmed | ✅ | Nowa detekcja przez string match |
| Resend po error → komunikat sukcesu | ✅ | confirmationResent |
| Resend działa tylko dla login mode z błędem | ✅ | isUnconfirmedError guard |
| i18n parity (en/pl/es) | ✅ | 4 nowe klucze we wszystkich 3 językach |

## Decyzja: TEST PASS ✅