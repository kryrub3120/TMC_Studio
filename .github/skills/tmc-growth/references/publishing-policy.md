# Publishing Policy

## Wersja v0.1

- Przygotowuj zmiany w branchu lub PR.
- Wymagaj jawnej akceptacji człowieka w bieżącej rozmowie przed deployem strony
  i zmianą głównej obietnicy.
- Wymagaj akceptacji przed wysłaniem maila, DM, oferty albo publikacją social.
- Nie zapisuj sekretów API, tokenów ani danych klientów w skillu i repozytorium.
- Nie publikuj automatycznie stron porównawczych, cenowych ani prawnych.

## Bramka PR

Wymagaj:

- potwierdzonej prawdy produktowej;
- kompletnego EN oraz wszystkich deklarowanych tłumaczeń;
- builda i audytu publicznych stron;
- testu CTA i routingu;
- sprawdzenia widoku mobilnego oraz desktopowego;
- poprawnego obrazu social;
- określonego eventu konwersji;
- listy zmian w sitemap i linkowaniu wewnętrznym.

Automatyczne publikowanie można rozważyć dopiero po minimum 20 zaakceptowanych stronach bez istotnej korekty procesu.

Po akceptacji agent może wykonać wyłącznie kontrolowany deploy Netlify zgodny z
bramką R-PROD w `docs/SYSTEM_ARCHITECTURE.md`. Zgoda na deploy nie obejmuje
zmian sekretów, zdalnej bazy Supabase ani ustawień Stripe.
