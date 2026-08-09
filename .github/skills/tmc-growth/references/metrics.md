# Metrics

## Lejek

Używaj eventów z `apps/web/src/lib/analytics.ts`:

1. `landing_view`
2. `open_board`
3. `first_element_added`
4. `first_export` z `ttfeMs`
5. `signup`
6. `limit_hit`
7. `pricing_view`
8. `upgrade`
9. `content_view` z `path`, `kind` i `language`
10. `content_open_board` z `source` i opcjonalnym `formation`

## Raport

Raportuj wolumen i konwersję między kolejnymi etapami. Rozdzielaj źródło, kampanię, stronę wejścia, język i urządzenie, jeżeli dane istnieją.

Nie zastępuj brakujących danych estymacją. Oznacz event jako `UNVERIFIED`, jeśli istnieje w kodzie, ale nie potwierdzono odbioru w Plausible lub innym systemie.

## Priorytety

- Przed product-market fit: aktywacja i pierwszy eksport.
- Po stabilnej aktywacji: rejestracja i powrót użytkownika.
- Po potwierdzeniu potrzeby: Free do Pro/Team, MRR i churn.
- Dla contentu: kwalifikowane wejścia i przejścia do tablicy, nie sama liczba odsłon.
