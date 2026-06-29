# Master Autopilot Run — S-QA: Bramka jakości przed launchem
**Data:** 2026-06-22
**Limit:** 2 sprinty, 3 próby na sprint

## Główny plan
Zapewnić, że nic nie wejdzie na prod bez zielonego lint/typecheck/test/build i że golden path działa.

## Sprinty zidentyfikowane
| Sprint | Cel | Zależności |
|--------|-----|------------|
| S1 | E2E golden path (Playwright): gość → stwórz taktykę → eksport; rejestracja/login; checkout w trybie TEST | - |
| S2 | CI gate: workflow blokuje PR przy failu; root package.json ma jasny test pipeline | S1 |

## Decyzje początkowe
- E2E: Playwright (jedyny sensowny wybór dla nowoczesnego SPA)
- CI: rozszerzenie istniejącego `ci.yml` o E2E job
- Kod aplikacji tylko CZYTANY — bugi raportowane, nie naprawiane tutaj
- Skille: regression-testing, ci-debug, release-readiness
