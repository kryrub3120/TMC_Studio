# Master Verification — S1: Reset hasła end-to-end
**Data:** 2026-06-22 10:55
**Iteracja:** 1
**Sprint Contract:** thoughts/2026-06-22/1015_sprint-contract_S1.md

## Weryfikacja zakresu
- [x] DeliveryPass zrealizował wszystko z zakresu
- [x] DeliveryPass nie rozszerzył zakresu

## Weryfikacja DoD
- [x] `resetPasswordForEmail()` w supabase.ts — woła Supabase API z redirectTo na `/auth/reset-password`
- [x] `sendResetLink()` w useAuthStore — działa, obsługuje błędy
- [x] AuthModal forgot mode: walidacja tylko email, wywołuje `onSendResetLink`
- [x] `/auth/reset-password` — formularz ustawienia nowego hasła, po sukcesie redirect do /app
- [x] Stany błędów: expired link, invalid code, server error (wszystkie obsłużone)
- [x] i18n: `auth.resetEmailSent` w en/pl/es
- [x] Build zielony (pnpm run build — 5/5 successful)

## Weryfikacja evidence
- [x] Delivery Evidence wystarczające
- [x] Tester Evidence wystarczające
- [x] Testy przechodzą (113 tests passed)

## Zgodność z architekturą
- [x] Hard Rules (SYSTEM_ARCHITECTURE.md §11) zachowane
- [x] i18n: brak hardcoded user-facing stringów; nowe klucze w en/pl/es
- [x] AGENTS_CHECKLIST.md respektowana
- [x] Użyte skille (security-privacy-review, ui-delivery, regression-testing) zastosowane poprawnie

## Regresje
- [x] Brak regresji w sąsiednich funkcjach

## Zgodność z głównym planem
- [x] Sprint zgodny z głównym planem S-AUTH
- [x] Nie wprowadza konfliktów z S2/S3

## Decyzja MasterVerifier: ACCEPT ✅