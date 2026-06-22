# Sprint Contract — S2: Webhook hardening + testy
**Data:** 2026-06-22 18:10

## Cel sprintu
Rozszerzyć stripe-webhook o brakujące bezpieczeństwo, zweryfikować idempotencję, dodać testy dla 3 eventów subskrypcyjnych, zweryfikować `getTierFromPriceId` i `getCycleFromPriceId`.

## Zakres
- `netlify/functions/stripe-webhook.ts` — ewentualne poprawki (jeśli bug wykryty)
- `netlify/functions/__tests__/billing.security.test.ts` — nowy describe „Webhook Security" z testami mockowanymi
- `netlify/functions/_stripeConfig.ts` — zweryfikować `PRICE_TO_CYCLE` + `PRICE_TO_TIER` spójność

## Poza zakresem
- Zmiana architektury webhooka
- Dodawanie nowych eventów (np. invoice.payment_succeeded)
- Zmiana PricingModal, AppShell, PricingPage
- Stripe live keys

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| stripe-qa | webhook idempotencja + eventy | testy 3 eventów |
| security-privacy-review | webhook signature, env, service role | brak secret leak w kodzie |
| regression-testing | po implementacji | testy zielone (≥40+), typecheck/build OK |

## Kryteria akceptacji
- [ ] Testy webhook signature verification (brak → 400, zły → 400)
- [ ] Test checkout.session.completed — tworzy subskrypcję w DB (mock stripe.subscriptions.retrieve)
- [ ] Test customer.subscription.updated — zmiana tieru
- [ ] Test customer.subscription.deleted — downgrade do free
- [ ] Test idempotencji — duplicate event → 200 z `duplicate: true`
- [ ] Test rate limiting — 429
- [ ] Test unknown event type → 200 (graceful)
- [ ] Test getCycleFromPriceId — zwraca monthly/yearly poprawnie
- [ ] Test env vars validation
- [ ] Wszystkie testy zielone, typecheck/build OK

## i18n
- Żadne nowe stringi nie są dodawane

## Limit wewnętrznego loopa
3 próby

## Ryzyka
- Mockowanie stripe.webhooks.constructEvent w istniejącej strukturze testowej wymaga ostrożności
- Testy must not require actual Stripe webhook secret