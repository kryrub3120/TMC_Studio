# Delivery — Sprint 3: Pricing, monetizacja i komunikacja wartości
**Data:** 2026-06-18 14:00
**Iteracja:** 1

## Zadanie
Wykonanie Sprintu 3 z `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md`:
- jedno źródło prawdy dla cen i Price IDs
- przekazywanie cyklu (monthly/yearly) z `/pricing` do modala
- Team kalkulator (5×Pro vs Team)
- Save 17% badge dla yearly
- domyślnie monthly, yearly premiowane

## Decyzje i uzasadnienie
- Utworzono `packages/ui/src/pricingConfig.ts` jako wspólny config dla display prices i Price IDs. PricingModal wcześniej miał własne kopie STRIPE_PRICES — teraz oba komponenty (PricingPage + PricingModal) czytają z jednego źródła.
- `PricingModal` otrzymuje `initialCycle` prop — przychodzi z URL `/app?upgrade=pro&cycle=yearly` → AppShell parsuje → przekazuje przez ModalOrchestrator → PricingModal otwiera się na yearly.
- `ISave 17%` badge (`SAVE_PERCENT = 17`) dodany przy yearly toggle w obu komponentach.
- Team kalkulator: sekcja pod FAQ pokazująca 5×Pro vs Team z oszczędnościami.
- Trial usunięty z planu (decyzja użytkownika: Free ma wystarczająco opcji premium).

## Co zrobiłem
1. Utworzył `packages/ui/src/pricingConfig.ts` — DISPLAY_PRICES, STRIPE_PRICES, SAVE_PERCENT, ANNUAL_SAVINGS, getSavingsText()
2. Zaktualizował `packages/ui/src/PricingModal.tsx` — import z pricingConfig, przyjmuje `initialCycle`, Save 17% badge
3. Zaktualizował `packages/ui/src/index.ts` — eksport nowego configu
4. Zaktualizował `apps/web/src/pages/PricingPage.tsx` — używa DISPLAY_PRICES, SAVE_PERCENT, przekazuje `&cycle=` w linkach, Team calculator section
5. Zaktualizował `apps/web/src/app/AppShell.tsx` — parsuje `cycle` z URL, przekazuje do ModalOrchestrator
6. Zaktualizował `apps/web/src/app/orchestrators/ModalOrchestrator.tsx` — przekazuje `pricingInitialCycle` do PricingModal
7. Dodał i18n: `teamCalc` sekcja w en.ts, pl.ts, es.ts

## Napotkane problemy
- Duplikacja starej definicji interfejsu w PricingModal.tsx po edycji — usunięto
- Lokalna definicja `Cycle` w PricingPage.tsx kolidowała z importem — usunięto
- i18n: pierwsze edycje w pl.ts/es.ts nie utrwaliły się (git status clean) — ponowione

## Evidence
- `pnpm typecheck` — 9/9 successful ✅
- `pnpm build` — 5/5 successful ✅ (warnings tylko istniejące, nie nowe)

## Status DoD
- [x] Ceny i Price IDs idą przez jedno źródło prawdy (pricingConfig.ts)
- [x] Wybrany cykl billingowy zgadza się z checkout (przekazywany przez URL)
- [x] Team plan ma kalkulator wartości (5×Pro = $45 vs Team = $29)
- [x] Save 17% badge przy yearly toggle
- [x] Wszystkie user-facing teksty w i18n (en/pl/es)

## Zmienione pliki
- `packages/ui/src/pricingConfig.ts` — NOWY
- `packages/ui/src/PricingModal.tsx`
- `packages/ui/src/index.ts`
- `packages/ui/src/locales/en.ts`
- `packages/ui/src/locales/pl.ts`
- `packages/ui/src/locales/es.ts`
- `apps/web/src/pages/PricingPage.tsx`
- `apps/web/src/app/AppShell.tsx`
- `apps/web/src/app/orchestrators/ModalOrchestrator.tsx`