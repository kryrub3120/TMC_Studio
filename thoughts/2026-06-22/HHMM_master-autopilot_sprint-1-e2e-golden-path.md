# Sprint Contract — S1: E2E golden path (Playwright)
**Data:** 2026-06-22

## Cel sprintu
Stworzyć E2E testy Playwright pokrywające golden path aplikacji:
- Gość → tworzy taktykę → eksport
- Rejestracja/login
- Checkout w trybie TEST

## Zakres
- `e2e/playwright.config.ts` — konfiguracja Playwright
- `e2e/tactical-board.spec.ts` — happy path board creation + export
- `e2e/auth.spec.ts` — login flow
- `e2e/checkout.spec.ts` — pricing + checkout flow
- `e2e/global-setup.ts` — global setup/auth state
- Root `package.json` — dodanie skryptów E2E
- Pliki pomocnicze w `e2e/` (fixtures, utils)

## Poza zakresem
- Modyfikacja kodu aplikacji (brak testid, brak nowych hooków)
- Coverage 100% — tylko golden path
- Mobile E2E — tylko desktop viewport

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| regression-testing | E2E to testy regresji | testy przechodzą lokalnie, lista komend |

## Kryteria akceptacji
- [ ] E2E golden path (guest → board → export) działa
- [ ] Auth flow test działa (z devLogin)
- [ ] Checkout/pricing test działa (weryfikacja UI + redirect)
- [ ] Playwright config poprawny, testy uruchamialne lokalnie

## Definition of Done
- [ ] Kod zgodny z planem
- [ ] Testy napisane
- [ ] Testy przechodzą lokalnie
- [ ] Brak regresji w istniejących funkcjach
- [ ] Evidence zapisane

## Ryzyka
- Brak testid/aria w aplikacji → selektory mogą być kruche
- Auth popup OAuth nie testowalny automatycznie → używamy devLogin
- Stripe checkout wymaga realnej sesji → weryfikujemy UI i redirect URL