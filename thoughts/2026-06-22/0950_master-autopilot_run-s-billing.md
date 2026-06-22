# Master Autopilot Run — S-BILLING: Stripe gotowy do sprzedaży (live)
**Data:** 2026-06-22 09:50
**Limit:** 2 sprinty, 3 proby na sprint

## Główny plan
Doprowadzić lejek płatności do stanu, w którym po ręcznym wpięciu kluczy live sprzedaż po prostu działa.

## Sprinty zidentyfikowane
| Sprint | Cel | Zależności |
|--------|-----|------------|
| S1 | Bug rocznego cyklu: wybór „yearly" propaguje właściwy priceId aż do create-checkout (PricingModal initialCycle → priceId). Plus spec dla S-SITE jak /pricing ma przekazać cykl do modala. | - |
| S2 | Webhook hardening + testy: idempotencja stripe-webhook, obsługa checkout.session.completed / customer.subscription.updated / customer.subscription.deleted, poprawny flip tier w DB. Rozszerz billing.security.test.ts o te eventy. Zweryfikuj getTierFromPriceId. | S1 |

## Decyzje początkowe
- Kolejność: S1 → S2 (S2 zależy od poprawnego S1)
- S1 dotyczy frontendu (PricingModal) + stanu w AppShell
- S2 dotyczy backendu (stripe-webhook) + testów
- Obydwa sprinty modyfikują billing.security.test.ts — uważać na konflikty

## Główne ryzyka
- PricingModal może nie resetować cyklu przy ponownym otwarciu (stale state)
- Stale `pricingUpgradeCycle` w AppShell może powodować błędny domyślny cykl
- publishableKey w pricingConfig może być niezsynchronizowany