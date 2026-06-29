# Sprint Gate Decision — S1: Reset hasła end-to-end

## Decyzja
**ACCEPT SPRINT** ✅

## Uzasadnienie
- MasterVerifier zatwierdził wszystkie kryteria DoD
- Build zielony (5/5)
- Testy przechodzą (113/113)
- Brak regresji
- i18n kompletne (en/pl/es)
- Security check: brak sekretów w kodzie
- **Intencjonalne odstępstwo od planu:** redirectTo na `/auth/reset-password` zamiast `/auth/callback?type=recovery` — udokumentowane w docs/AUTH_FLOW.md §12 i sprint-contract S1

## Uwagi dla S2 (Email confirmation flow)
- ResetPasswordPage jest nową stroną — S2 może potrzebować podobnego podejścia dla email confirm
- AuthModal ma już tryb register z successMessage dla `auth.verifyEmail` — S2 powinna rozszerzyć ten mechanizm o resend
- S2 nie potrzebuje zmieniać AuthCallbackPage (recovery redirect idzie wprost na /auth/reset-password)