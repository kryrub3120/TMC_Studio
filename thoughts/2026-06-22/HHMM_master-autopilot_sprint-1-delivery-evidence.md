# Delivery Evidence — S1: E2E golden path
**Iteracja:** 1

## Co zaimplementowano
- `e2e/playwright.config.ts` — konfiguracja Playwright z chromium
- `e2e/global-setup.ts` — global setup dla E2E
- `e2e/fixtures.ts` — custom fixtures (devLogin helper)
- `e2e/tactical-board.spec.ts` — 4 testy: open canvas, add players, export dropdown, add away player
- `e2e/auth.spec.ts` — 3 testy: guest without auth, dev login as Pro, close modal without login
- `e2e/checkout.spec.ts` — 4 testy: pricing page renders, CTA links, /app?upgrade=pro modal, feature comparison
- Root `package.json` — dodane `e2e` i `e2e:ui` skrypty
- Instalacja `@playwright/test` i `playwright` jako devDependencies

## Decyzje implementacyjne
- Selektor-based (nie testid) — brak modyfikacji kodu aplikacji
- force:true clicks dla overlay interception
- Escape + "Pomiń" dla dismiss tutoriala
- Polskie i angielskie selektory dla locale-independent assertions
- Jeden worker, brak parallel — stability over speed

## Użyte skille
- regression-testing: zastosowany dobor testów per zakres

## Zmienione pliki
- `package.json` — dodane e2e skrypty
- `pnpm-lock.yaml` — nowe zależności playwright
- `e2e/*` — nowe pliki testowe
- `thoughts/2026-06-22/*` — dokumentacja

## Ryzyka implementacyjne
- Testy oparte na selektorach tekstowych — kruche przy zmianach UI
- Dev login wymaga DEV mode — nie działa na prod build