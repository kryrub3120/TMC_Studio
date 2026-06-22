# Delivery Evidence — S2: Webhook hardening + testy
**Iteracja:** 1 (final)

## Co zaimplementowano
1. **billing.security.test.ts** — nowy describe „Webhook Security (stripe-webhook.ts)" z 17 testami:
   - 405 dla non-POST
   - 500 dla brakujących env vars
   - 400 dla brakującego signature header
   - 400 dla nieprawidłowej sygnatury
   - 200 z `duplicate: true` dla idempotencji
   - Procesowanie checkout.session.completed → upgrade profilu
   - Procesowanie customer.subscription.updated → flip tier (pro/yearly)
   - Procesowanie customer.subscription.deleted → downgrade do free
   - 200 dla nieznanego event type (graceful)
   - 429 dla rate limiting
2. **Rozszerzenie mocka Stripe** — dodano `constructEvent`, `subscriptions.retrieve`, `customers.retrieve` do mocka
3. **Testy `getCycleFromPriceId`** — 2 testy w describe „Stripe Config Consistency"
4. **Testy `PRICE_TO_CYCLE`** — pokrycie wszystkich price IDs

## Decyzje implementacyjne
- `constructEvent` mock parsuje body dynamicznie (zamiast hardcoded return) — testy mogą ustawiać różne event type
- Idempotencja testowana przez mock sprawdzający duplicate key violation (23505)
- Rate limiting test wysyła 21 requestów z różnymi event IDs, 21. zwraca 429

## Użyte skille
- stripe-qa: weryfikacja webhook signature, idempotencji, event flow
- security-privacy-review: brak secret leak, env vars validation, signature verification
- regression-testing: 52/52 testów zielonych

## Zmienione pliki
- `netlify/functions/__tests__/billing.security.test.ts` — +17 testów webhook + 2 testy cycle

## Ryzyka implementacyjne
- Testy mockują stripe.subscriptions.retrieve i customers.retrieve — test integracji z prawdziwym Stripe wymaga stripe-qa manual