---
name: stripe-qa
description: Szczegolowa weryfikacja Stripe w TMC Studio w TEST mode: checkout, webhooki, idempotencja, customer portal, subscription refresh i entitlementy.
---

# Skill: Stripe QA

Weryfikacja integracji Stripe: checkout, webhooki, subskrypcje, customer portal, premium access.

---

## Zawsze przeczytaj najpierw

### Kod

- `netlify/functions/create-checkout.ts` - tworzenie Checkout Session.
- `netlify/functions/stripe-webhook.ts` - webhook handler i synchronizacja subskrypcji.
- `netlify/functions/create-portal-session.ts` - Stripe Customer Portal.
- `netlify/functions/_stripeConfig.ts` - backendowy mapping Price ID -> tier.
- `apps/web/src/config/stripe.ts` - frontendowy mapping Price ID -> tier.
- `apps/web/src/hooks/useBillingController.ts` - otwieranie portalu billingowego.
- `apps/web/src/hooks/usePaymentReturn.ts` - powrot po checkout/portal i retry po webhook race.
- `apps/web/src/lib/entitlements.ts` oraz `apps/web/src/hooks/useEntitlements.ts` - gating funkcji premium.
- `apps/web/src/store/useAuthStore.ts` i `apps/web/src/lib/supabase.ts` - odswiezanie profilu i `subscription_tier`.

### Dokumenty

- `docs/PAYMENT_FOUNDATION.md`.
- `docs/CURRENT_SPRINT_PLAN.md`.
- `docs/archive/planning/DEPLOYMENT_CHECKLIST.md`, jesli potrzebny historyczny kontekst deploy.
- `docs/WEBHOOK_TEST_MODE_SETUP.md`.
- `docs/ENTITLEMENTS.md`.
- `docs/PR-PAY-5-COMPLETE.md` - regresja `current_period_end`.
- `docs/PR-PAY-6-SUBSCRIPTION-REFRESH-FIX.md` - regresja odswiezania po checkout.
- `docs/AGENTS_CHECKLIST.md`.
- `docs/SYSTEM_ARCHITECTURE.md` sekcja 11.

## Kiedy uzywac

- Zmiana w kodzie platnosci/subskrypcji.
- Zmiana webhooka Stripe.
- Zmiana checkout flow.
- Zmiana customer portal.
- Zmiana premium entitlement / dostepu do funkcji.
- Review PR zwiazanego z platnosciami.

## Zasady (krytyczne)

- **TEST mode only** - uzywaj tylko testowych Price IDs i testowych kluczy.
- **Nie pros o sekrety w czacie** - nie pytaj uzytkownika o Stripe secret keys, webhook secrets ani service role keys w rozmowie.
- **Nie printuj sekretow** - nie wypisuj `.env`, tokenow, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Nie uzywaj LIVE keys** - nigdy `pk_live_*` / `sk_live_*`.
- **Nie wykonuj produkcyjnych dzialan** - nie tworz produktow/cen w LIVE, nie wysylaj faktur, nie rob refundow, nie deployuj.
- **Nie uruchamiaj produkcyjnych webhookow** - testuj lokalnie przez Netlify/Stripe CLI albo opisuj manual QA.
- **Price IDs musza byc spójne** miedzy `apps/web/src/config/stripe.ts` i `netlify/functions/_stripeConfig.ts`.

---

## Architektura Stripe w TMC Studio

### Checkout

`PricingModal` wysyla request do `/.netlify/functions/create-checkout` z:

- `priceId`
- `successUrl`
- `cancelUrl`
- `userId` -> `client_reference_id`
- `email`
- `customerId`, jesli istnieje

`create-checkout.ts` tworzy `mode: 'subscription'`, `line_items`, `success_url`, `cancel_url`, opcjonalnie `customer` albo `customer_email`.

### Webhook

`stripe-webhook.ts` obsluguje:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Wazne zachowania:

- weryfikacja podpisu przez `STRIPE_WEBHOOK_SECRET`,
- idempotencja przez tabele `stripe_webhook_events`,
- `client_reference_id` jako primary lookup usera,
- fallback po `stripe_customer_id`,
- fallback po email customera,
- `getTierFromPriceId()` z `_stripeConfig.ts`,
- zapis `subscription_tier`, `subscription_expires_at`, `stripe_customer_id`.

### Portal

`create-portal-session.ts`:

- wymaga Bearer token,
- weryfikuje usera przez Supabase,
- pobiera `profiles.stripe_customer_id`,
- tworzy Stripe Billing Portal session,
- zwraca `url`.

### Powrot do aplikacji

`usePaymentReturn.ts`:

- obsluguje `?checkout=success`,
- retry `initialize()` do 3 razy po 1.2s, bo webhook moze jeszcze nie zapisac profilu,
- obsluguje `?checkout=cancelled`,
- obsluguje `?portal=return`,
- czysci query string przez `history.replaceState`.

## Checkout flow checklist

- [ ] Frontend wysyla `priceId`, `successUrl`, `cancelUrl`.
- [ ] Dla zalogowanego usera request zawiera `userId` jako zrodlo `client_reference_id`.
- [ ] Dla usera z `stripe_customer_id` checkout reuse'uje customer, zamiast tworzyc duplikat.
- [ ] Dla usera bez customer ID checkout przekazuje email.
- [ ] Checkout session tworzy sie poprawnie z testowym Price ID.
- [ ] `mode` to `subscription`, quantity = 1.
- [ ] Po udanym checkoutcie redirect na `?checkout=success`.
- [ ] Anulowanie checkoutu (cancel) nie pozostawia wiszacej sesji.
- [ ] Cancel redirect wraca na `?checkout=cancelled` i UI pokazuje neutralny stan.
- [ ] Cena i ilosc sa zgodne z wybranym planem.
- [ ] Nie da sie wyslac pustego `priceId`.
- [ ] Invalid Stripe response pokazuje czytelny blad dla usera i nie odblokowuje premium.

## Price mapping checklist

- [ ] `apps/web/src/config/stripe.ts` i `netlify/functions/_stripeConfig.ts` maja te same Price IDs.
- [ ] Mapping Pro monthly/yearly -> `pro`.
- [ ] Mapping Team monthly/yearly -> `team`.
- [ ] Fallback backendowego `getTierFromPriceId()` nie powoduje niezamierzonego upgrade'u dla nieznanego price ID.
- [ ] Komentarze TEST/LIVE w configach sa zgodne z rzeczywistymi ID.
- [ ] `PricingModal` i backend nie maja rozjechanych hardcoded fallbackow.

## Webhook checklist

- [ ] Brak `stripe-signature` daje 400.
- [ ] Zly podpis daje 400 i nie zapisuje zmian w profilu.
- [ ] Brak wymaganych env vars daje kontrolowany 500 bez sekretow w logu.
- [ ] `claimEvent()` robi INSERT-first do `stripe_webhook_events`.
- [ ] Duplikat eventu zwraca 200 `{ duplicate: true }` i nie powtarza side effectow.
- [ ] Udany event oznacza `status: success`, `processed_at`.
- [ ] Blad eventu oznacza `status: error`, `error_message`, `processed_at`, a funkcja zwraca 500 dla retry Stripe.
- [ ] `checkout.session.completed` aktualizuje `profiles.subscription_tier`, `subscription_expires_at`, `stripe_customer_id`.
- [ ] `checkout.session.completed` uzywa `client_reference_id` jako primary lookup.
- [ ] Fallback customer ID dziala dla starszych sesji bez `client_reference_id`.
- [ ] Fallback email nie tworzy niepoprawnego user mappingu.
- [ ] `customer.subscription.updated` odnawia/zmienia tier dla `active` i `trialing`.
- [ ] `customer.subscription.updated` cofa do `free` dla `canceled` albo `unpaid`.
- [ ] `customer.subscription.deleted` cofa dostep premium do `free`.
- [ ] `invoice.payment_succeeded` nie dubluje update'u, jesli renewale sa obslugiwane przez subscription.updated.
- [ ] `invoice.payment_failed` nie cofa natychmiast premium, jesli Stripe retry ma jeszcze dzialac.

## Known regression checks

- [ ] `checkout.session.completed` nie zaklada, ze `subscription.current_period_end` zawsze istnieje.
- [ ] Gdy `current_period_end` nie istnieje, kod uzywa `latest_invoice.period_end` albo wylicza z `start_date + recurring.interval`.
- [ ] Brak `period_end` konczy sie jawnym bledem, nie cichym upgrade'em bez daty.
- [ ] Po powrocie z checkoutu UI odswieza profil z DB, nie uzywa stalego cache auth usera.
- [ ] `usePaymentReturn` retryuje aktywacje subskrypcji i rozroznia delayed webhook od sukcesu.
- [ ] Po `?checkout=success` query string jest czyszczony.
- [ ] Po `?portal=return` profil jest odswiezany i UI pokazuje zmiane tieru, jesli zaszla.

## Customer portal checklist

- [ ] `create-portal-session` wymaga `Authorization: Bearer <token>`.
- [ ] Brak tokena daje 401.
- [ ] Nieprawidlowy token daje 401.
- [ ] Brak profilu daje 404.
- [ ] Brak `stripe_customer_id` daje 400 i czytelny komunikat.
- [ ] Portal session tworzy sie poprawnie dla usera z customer ID.
- [ ] `returnUrl` jest bezpiecznie przekazywany i wraca do `?portal=return`.
- [ ] W portalu widac aktualna subskrypcje.
- [ ] W portalu mozna anulowac subskrypcje.
- [ ] Po anulowaniu webhook `customer.subscription.deleted` cofa entitlement.

## Subscription entitlement checklist

- [ ] Nowy uzytkownik ma domyslny plan (free).
- [ ] Po subskrypcji: premium funkcje sa odblokowane.
- [ ] Po wygasnieciu/anulowaniu: premium funkcje sa zablokowane.
- [ ] Refresh statusu dziala (re-check z Stripe).
- [ ] Kluczowe funkcje sa chronione (entitlement gate).
- [ ] `derivePlan()` i `getEntitlements()` daja zgodny wynik dla `free`, `pro`, `team`.
- [ ] Upgrade `pro` odblokowuje limity Pro.
- [ ] Upgrade `team` odblokowuje limity Team.
- [ ] Downgrade/cancel nie zostawia premium UI w stanie aktywnym po refreshu.

## Local QA workflow

Jesli zadanie wymaga realnego Stripe QA, preferowany lokalny flow:

1. Uruchom lokalnie app/Netlify functions, jesli to potrzebne i bezpieczne.
2. Uzyj Stripe TEST mode.
3. Forwarduj webhook:

```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

4. Wykonaj checkout test card `4242 4242 4242 4242`.
5. Sprawdz logs funkcji `create-checkout` i `stripe-webhook`.
6. Sprawdz `profiles.subscription_tier`, `subscription_expires_at`, `stripe_customer_id`.
7. Sprawdz `stripe_webhook_events` dla event ID, statusu i idempotencji.

Jesli nie mozna uruchomic Stripe CLI lub lokalnych funkcji, zapisz manual checklist i oznacz `Niezweryfikowane obszary`.

## Commands / checks

- `pnpm typecheck`
- `pnpm build` po zmianach w Netlify functions lub shared config.
- Testy jednostkowe, jesli istnieja dla `entitlements`, `usePaymentReturn`, `_stripeConfig`.
- `rg -n "pk_live|sk_live|whsec_live|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET" .` tylko jako kontrola wystapien, bez printowania wartosci `.env`.

## Expected evidence

- Lista przeczytanych plikow i dokumentow.
- Lista sprawdzonych scenariuszy checkout/webhook/portal/entitlement.
- Wyniki testow automatycznych.
- Wyniki manual QA albo informacja dlaczego nie wykonano.
- Potwierdzenie, ze uzyto TEST mode.
- Potwierdzenie, ze nie uzyto LIVE keys.
- Potwierdzenie, ze nie printowano sekretow.
- Potwierdzenie, ze nie wykonano produkcyjnych akcji.
- Stan `profiles` po checkout/cancel/portal, jesli testowano manualnie.
- Stan `stripe_webhook_events` po webhookach, jesli testowano manualnie.
- Lista niezweryfikowanych obszarow i ryzyko.
