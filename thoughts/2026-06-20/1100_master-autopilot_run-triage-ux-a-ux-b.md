# Master Autopilot Run - Triage UX-A + UX-B
**Data:** 2026-06-20 11:00
**Limit:** 2 sprinty, 3 proby na sprint, bez zatrzymania miedzy sprintami

## Glowny plan
Wykonac 2 sprinty z tasks/TRIAGE_PRODUKCJA_2026-06-20.md:
- S1 (UX-A): Flow & Bug Hardening - P0 (A1-A8)
- S2 (UX-B): Cloud Sync + UX/UI - P1 (B1-B2), po S1

Zasada nadrzedna: "po pierwsze nie wkurwiac" - usuwac tarcie, nie dodawac.
Cloud sync = DARMOWY (bez gatingu Pro).

## Sprinty zidentyfikowane
| Sprint | Cel | Zaleznosci |
|--------|-----|------------|
| S1     | UX-A: CTA zapisu dla goscia, brak Wyloguj, przebudowa menu (3+6), tlumaczenie PPM, brak modala po loginie, defaulty dzialaja, kontrast pomocy, dwuklik->Wlasciwosci | - |
| S2     | UX-B: Dokonczenie cloud sync + redesign panelu preferencji | S1 (B1.2 zalezy od A6) |

## Decyzje poczatkowe
- Cloud sync FREE (bez gatingu Pro) - decyzja produktowa juz podjeta
- S1 = PATCH lub MINOR (0.7.1 -> 0.7.2 albo 0.8.0); S2 = MINOR (0.8.0 albo 0.9.0 w zaleznosci od S1)
- Przyjmuje, ze A3 (przebudowa menu) to nowa IA -> MINOR dla S1, wiec 0.7.1 -> 0.8.0
- Nastepnie S2: 0.8.0 -> 0.9.0
- i18n: kazdy nowy user-facing tekst w en/pl/es - te same klucze
