# Sprint Contract — S2: CI gate
**Data:** 2026-06-22

## Cel sprintu
CI workflow blokuje PR przy failu pnpm lint / typecheck / test / build. Root package.json ma jasny test pipeline dla całego monorepo.

## Zakres
- `.github/workflows/ci.yml` — dodanie E2E job, dodanie fail-fast dla wszystkich jobów
- Root `package.json` — test pipeline już istnieje (pnpm test → turbo run test), ale dodamy E2E jako część CI

## Poza zakresem
- Zmiany w kodzie aplikacji
- Zmiany w konfiguracji deploymentu

## Skille
- ci-debug: rozszerzenie istniejącego workflow
- regression-testing: weryfikacja po zmianach

## Kryteria akceptacji
- [ ] CI ma E2E job po buildzie
- [ ] CI blokuje PR przy failu dowolnego joba (lint/typecheck/test/build/e2e)
- [ ] typecheck/build zielone

## Definition of Done
- [ ] Kod zgodny z planem
- [ ] Testy przechodzą
- [ ] Brak regresji
- [ ] Evidence zapisane