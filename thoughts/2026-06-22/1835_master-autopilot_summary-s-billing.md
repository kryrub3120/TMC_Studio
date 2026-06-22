# Master Autopilot Summary — S-BILLING: Stripe gotowy do sprzedaży (live)
**Data:** 2026-06-22 18:35

## Sprinty
| Sprint | Status | Iteracje | Pliki |
|--------|--------|----------|-------|
| S1 — Bug rocznego cyklu | **ACCEPT** | 1 | `PricingModal.tsx`, `AppShell.tsx`, `create-checkout.ts`, `_stripeConfig.ts`, `billing.security.test.ts` |
| S2 — Webhook hardening + testy | **ACCEPT** | 1 | `billing.security.test.ts` |

## Podsumowanie
Wszystkie kryteria akceptacji głównego planu zostały spełnione:
- **Pełny lejek checkout (monthly i yearly)**: priceId monthly/yearly → poprawny `billing_cycle` w metadata → poprawna sesja Stripe. Naprawiony bug `priceId.includes('yearly')` (który nie działał, bo price ID nie zawiera słowa 'yearly').
- **Webhook idempotentny**: test potwierdza, że duplicate event zwraca 200 z `duplicate: true`, nie dubluje skutku. Obsługa checkout.session.completed / customer.subscription.updated / customer.subscription.deleted z flipem tieru w DB.
- **52/52 testów zielonych**: Pozostałe testy (CORS, auth, checkout security, portal security, config consistency) nienaruszone.
- **Bump v0.8.0→0.8.1 + CHANGELOG**: PATCH bump.
- **Raport zawiera CHECKLISTĘ RĘCZNEGO GO-LIVE** (poniżej).
- **Spec S-SITE**: dostarczona w `thoughts/2026-06-22/1808_spec-s-site-cycle-propagation.md`

## Użyte skille
| Sprint | Skill | Zastosowanie |
|--------|-------|-------------|
| S1 | stripe-qa | weryfikacja propagacji priceId, billingCycle |
| S1 | ui-delivery | zmiana PricingModal.tsx (body requestu) |
| S1, S2 | regression-testing | 52/52 testów zielonych |
| S2 | stripe-qa | webhook event flow, idempotencja |
| S2 | security-privacy-review | env vars, secrets, signature verification |

## Zmienione pliki (7)
1. `netlify/functions/_stripeConfig.ts` — dodano `PRICE_TO_CYCLE`, `getCycleFromPriceId()`
2. `netlify/functions/create-checkout.ts` — przyjmuje `billingCycle` z body, używa `getCycleFromPriceId()`
3. `packages/ui/src/PricingModal.tsx` — `billingCycle: cycle` w body requestu
4. `apps/web/src/app/AppShell.tsx` — reset `pricingUpgradeCycle` przy zamknięciu modala
5. `netlify/functions/__tests__/billing.security.test.ts` — +3 testy yearly + 17 testów webhook + 2 testy cycle
6. `package.json`, `apps/web/package.json`, `packages/{ui,core,board,presets}/package.json` — bump 0.8.0→0.8.1
7. `CHANGELOG.md` — dodano sekcję 0.8.1

## Orchestration Review
- Master Autopilot zrealizował oba sprinty w 1 iteracji każdy (bez wewnętrznych loopów).
- Skill Selection dobrany per sprint adekwatnie do zakresu.
- DeliveryPass nie rozszerzył zakresu.
- Wszystkie artefakty (Sprint Contract, Delivery Evidence, Master Verification) zapisane w `thoughts/`.

---

# 🚀 CHECKLISTA RĘCZNEGO GO-LIVE (dla usera)

Poniższe kroki wykonuje **user ręcznie** przed wpięciem kluczy live. Agent NIE wykonuje tych akcji.

## 1. Przygotowanie konta Stripe live

- [ ] Załóż konto Stripe (lub przełącz z test na live)
- [ ] Utwórz produkty i ceny w **live mode**:
  - Pro Monthly
  - Pro Yearly
  - Team Monthly
  - Team Yearly
- [ ] Skopiuj **live Price IDs** z Dashboard → Products

## 2. Aktualizacja Price IDs w kodzie

- [ ] Zastąp testowe Price ID w **`netlify/functions/_stripeConfig.ts`**:
  - `STRIPE_PRICES.pro.monthly` = nowy live ID
  - `STRIPE_PRICES.pro.yearly` = nowy live ID
  - `STRIPE_PRICES.team.monthly` = nowy live ID
  - `STRIPE_PRICES.team.yearly` = nowy live ID
- [ ] Zastąp testowe Price ID w **`packages/ui/src/pricingConfig.ts`** (musi być zgodne z backendem)
- [ ] Zastąp testowe Price ID w **`apps/web/src/config/stripe.ts`** (musi być zgodne)

> Uwaga: Test „stripe price IDs are in sync" sprawdza zgodność wszystkich 3 plików — jeśli test przechodzi w TEST mode, przejdzie też po podmianie na live ID.

## 3. Konfiguracja Netlify (env vars — live)

W Dashboard Netlify → Site settings → Environment variables:

| Var | Wartość live |
|-----|-------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (z webhook endpoint) |
| `SUPABASE_URL` | Prod Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod service role key |
| `ALLOWED_ORIGINS` | (opcjonalnie: Netlify deploy previews) |

**NIGDY nie wpisuj live secretów w `.env.production` w repo — tylko w Netlify Dashboard.**

## 4. Webhook endpoint

- [ ] W Stripe Dashboard → Developers → Webhooks → **Add endpoint**
- [ ] Endpoint URL: `https://tmcstudio.app/.netlify/functions/stripe-webhook`
- [ ] Zdarzenia do wysłania:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Skopiuj **Signing secret** (`whsec_...`) → ustaw jako `STRIPE_WEBHOOK_SECRET` w Netlify

## 5. Test kartą (Stripe TEST mode → przełącz na test keys najpierw)

Przed przejściem na live, przetestuj pełny lejek na test keys:

- [ ] Otwórz PricingModal → wybierz Pro Monthly → Stripe Checkout → zapłać kartą testową `4242 4242 4242 4242`
- [ ] Sprawdź: powrót do `/app?checkout=success`, profil ma `subscription_tier='pro'`
- [ ] Otwórz Customer Portal → anuluj subskrypcję
- [ ] Sprawdź: profil ma `subscription_tier='free'`
- [ ] Powtórz dla yearly, Team monthly, Team yearly

## 6. Przełączenie na LIVE

- [ ] W Netlify → ustaw live `STRIPE_SECRET_KEY` (z `sk_live_`)
- [ ] W Netlify → ustaw live `STRIPE_WEBHOOK_SECRET` (z `whsec_` z live endpoint)
- [ ] Deploy do produkcji
- [ ] W Stripe Dashboard → dodaj **live** webhook endpoint (taki sam URL)
- [ ] Przetestuj checkout prawdziwą kartą na produkcji (mała kwota)
- [ ] Sprawdź webhook delivery w Stripe Dashboard

## Ryzyka go-live
- **Price ID mismatch** między frontendem a backendem → test config consistency to wychwyci
- **Webhook signing secret błędny** → 400 "Webhook Error" w logach Netlify
- **Service role key wyciek** → nigdy nie wpisuj w kodzie, tylko w env vars
- **CORS**: upewnij się, że `ALLOWED_ORIGINS` w Netlify zawiera produkcję (domyślnie jest `tmcstudio.app` i `www.tmcstudio.app`)

## Pliki thoughts z tej sesji
- `thoughts/2026-06-22/0950_master-autopilot_run-s-billing.md`
- `thoughts/2026-06-22/0955_master-autopilot_sprint-1-contract.md`
- `thoughts/2026-06-22/1808_master-autopilot_sprint-1-delivery-evidence.md`
- `thoughts/2026-06-22/1808_spec-s-site-cycle-propagation.md`
- `thoughts/2026-06-22/1810_master-autopilot_sprint-2-contract.md`
- `thoughts/2026-06-22/1830_master-autopilot_sprint-2-delivery-evidence.md`
- `thoughts/2026-06-22/1835_master-autopilot_summary-s-billing.md`