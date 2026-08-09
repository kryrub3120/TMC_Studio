# Current Task: LAUNCH-1 - Monitoring, Stripe LIVE readiness i beta

**Status:** ACTIVE
**Updated:** 2026-08-09
**Source of truth:** `docs/WEB_LAUNCH_CHECKLIST.md`,
`docs/ERROR_MONITORING.md`, `docs/STRIPE_TAX_SETUP.md`

## Cel

Przejsc od technicznie gotowego produktu do kontrolowanej sprzedazy. Nie
dodajemy teraz duzych modulow edytora. Najpierw zapewniamy wykrywanie awarii,
bezpieczny billing LIVE i mierzalna bete.

## Stan

- Produkcja: `https://tmcstudio.app`.
- Google OAuth: produkcyjny redirect + PKCE potwierdzony.
- SEO: 60 prerenderowanych stron EN/PL/ES, sitemap wdrozony i zgloszony.
- Quality gate: 139 web tests, 40 billing tests, 36 Playwright E2E.
- Stripe: TEST mode, bez realnych obciazen.
- Monitoring: implementacja error-only gotowa; brak produkcyjnego DSN.

## Kolejnosc wykonania

1. Utworzyc lub wybrac projekt Sentry dla web production.
2. Ustawic w Netlify `VITE_SENTRY_DSN` i
   `VITE_SENTRY_ENVIRONMENT=production`, przebudowac oraz wdrozyc.
3. Wyslac jedno kontrolowane zdarzenie z deploy preview i potwierdzic je w
   Sentry; usunac kod testowy przed produkcja.
4. Potwierdzic dane sprzedawcy i decyzje podatkowe z
   `docs/STRIPE_TAX_SETUP.md`.
5. Skonfigurowac katalog produktow/cen, Tax, Customer Portal i webhook LIVE.
6. Podmienic komplet kluczy Stripe atomowo: publishable, secret, webhook oraz
   price IDs. Nie mieszac kluczy TEST i LIVE.
7. Wykonac minimalny zakup LIVE, potwierdzic entitlement, fakture, portal,
   anulowanie i refund.
8. Zaprosic 10-20 testerow; przez pierwsze 7 dni codziennie przegladac bledy,
   aktywacje, eksporty i rozpoczecia checkoutu.

## Bramka publicznego ruchu

- Brak otwartych bledow P0/P1 w auth, zapisie, eksporcie i checkout.
- Monitoring odbiera zdarzenia z produkcji.
- Zakup LIVE i refund przechodza end-to-end.
- Dane firmy, polityki, ceny brutto i podatki sa potwierdzone.
- Jest kanal supportu oraz osoba odpowiedzialna za odpowiedz w 24 godziny.

## Potrzebne od wlasciciela

- Publiczny browser DSN projektu Sentry.
- Potwierdzenie danych prawnych podmiotu i decyzji VAT/OSS z ksiegowym.
- Akceptacja momentu wykonania pierwszej realnej platnosci i refundu.
