# Sprint Contract — S1: Bug rocznego cyklu
**Data:** 2026-06-22 09:55

## Cel sprintu
Naprawić bug, w którym wybór „yearly" nie propaguje poprawnie priceId przez cały łańcuch: PricingModal initialCycle → priceId → create-checkout. Dostarczyć spec dla S-SITE jak /pricing ma przekazać cykl do modala.

## Zakres
- `packages/ui/src/PricingModal.tsx` — dodać `billingCycle` do body requestu checkout
- `packages/ui/src/pricingConfig.ts` — dodać helper/być źródłem typu
- `netlify/functions/create-checkout.ts` — przyjąć `billingCycle` z body, fix `billingCycle` derivation
- `apps/web/src/app/AppShell.tsx` — reset `pricingUpgradeCycle` po zamknięciu modala (anti-stale)
- `netlify/functions/__tests__/billing.security.test.ts` — dodać test yearly priceId + billingCycle
- `apps/web/src/pages/PricingPage.tsx` — **NIE edytować**, tylko dostarczyć spec

## Poza zakresem
- PricingPage.tsx (NIE edytować)
- Pliki inne niż wymienione
- Zmiana architektury Stripe/webhook

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| stripe-qa | zmiana checkout flow + priceId | yearly priceId propagowany do create-checkout |
| ui-delivery | zmiana PricingModal.tsx | brak regresji UI, i18n nienaruszone |
| regression-testing | po implementacji S1 | testy zielone, typecheck/build OK |

## Kryteria akceptacji
- [ ] PricingModal wysyła `billingCycle` w body do create-checkout
- [ ] create-checkout używa `billingCycle` z body (fallback: derive z priceId)
- [ ] `billingCycle` w metadata jest poprawny dla yearly i monthly
- [ ] `pricingUpgradeCycle` resetowany przy zamknięciu modala (nie zostaje 'yearly' na stałe)
- [ ] Testy pokrywają yearly priceId
- [ ] Dostarczona spec dla S-SITE

## i18n
- Żadne nowe stringi nie są dodawane — zmiany dotyczą logiki i body requestu

## Limit wewnętrznego loopa
3 próby

## Ryzyka
- Zmiana body create-checkout może powodować konflikty, jeśli frontend nie jest zsynchronizowany
- Testy integracyjne mogą wymagać mockowania yearly priceId