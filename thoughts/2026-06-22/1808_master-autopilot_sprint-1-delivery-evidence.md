# Delivery Evidence — S1: Bug rocznego cyklu
**Iteracja:** 1

## Co zaimplementowano
1. **PricingModal.tsx** — dodano `billingCycle: cycle` do body requestu checkout
2. **AppShell.tsx** — reset `pricingUpgradeCycle` do `'monthly'` przy zamknięciu modala (`onClosePricingModal`)
3. **create-checkout.ts** — przyjmuje `billingCycle` z body z fallbackiem do `getCycleFromPriceId()`
4. **_stripeConfig.ts** — dodano `PRICE_TO_CYCLE` i `getCycleFromPriceId()`
5. **billing.security.test.ts** — 3 nowe testy: yearly priceId, billingCycle override, plus fix testu "PricingModal config has matching price IDs" (zmiana ścieżki z PricingModal.tsx → pricingConfig.ts)

## Decyzje implementacyjne
- `billingCycle` z body jest preferowany nad derive z priceId (bezpieczniejszy, explicit)
- `getCycleFromPriceId()` używa tego samego wzorca co `getTierFromPriceId()` — mapowanie a nie string.includes
- Reset cyklu na `onClosePricingModal` zamiast useEffect cleanup (cleanup nie działa przy zamknięciu modala)

## Użyte skille
- stripe-qa: weryfikacja propagacji priceId
- ui-delivery: zmiana PricingModal.tsx (minimalna — tylko body requestu)
- regression-testing: sprawdzenie testów (40/40)

## Zmienione pliki
- `netlify/functions/_stripeConfig.ts` — dodano PRICE_TO_CYCLE, getCycleFromPriceId
- `netlify/functions/create-checkout.ts` — przyjmuje billingCycle z body, używa getCycleFromPriceId
- `packages/ui/src/PricingModal.tsx` — dodano billingCycle do body
- `apps/web/src/app/AppShell.tsx` — reset pricingUpgradeCycle po close
- `netlify/functions/__tests__/billing.security.test.ts` — 3 nowe testy + fix config path
- `thoughts/2026-06-22/1808_spec-s-site-cycle-propagation.md` — spec dla S-SITE

## Ryzyka implementacyjne
- Brak