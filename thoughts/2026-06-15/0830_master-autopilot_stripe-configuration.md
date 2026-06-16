# Master Autopilot - Stripe Configuration
**Data:** 2026-06-15 08:30
**Limit:** N/A (pojedyncze zadanie konfiguracyjne)

## Zadanie
Skonfigurować Stripe w TMC Studio: klucze API, webhooki, weryfikacja połączenia z Supabase.

## Co zrobiono

### 1. Audyt istniejącego kodu
- **Netlify Functions** (5 plików): `health.ts`, `_stripeConfig.ts`, `create-checkout.ts`, `stripe-webhook.ts`, `create-portal-session.ts` — wszystkie gotowe, napisane w TypeScript ES modules
- **Frontend**: `apps/web/src/config/stripe.ts` (Price IDs), `apps/web/src/hooks/useBillingController.ts` (modale + billing portal)
- **Entitlements**: `apps/web/src/lib/entitlements.ts` — pełny system planów (guest/free/pro/team)
- **Konfiguracja**: `netlify.toml` z redirectami `/api/*` → funkcje, SPA fallback

### 2. Zebrane i skonfigurowane klucze (.env.local)
| Zmienna | Wartość |
|---------|---------|
| `VITE_SUPABASE_URL` | `https://euxauavanukyfofhkrqp.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (anon public key) |
| `SUPABASE_URL` | j.w. |
| `SUPABASE_SERVICE_ROLE_KEY` | (service role key) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_da75c901c6d1a90fd15f38dc1a0221be9132fa118c14a1b194e3745e5f8c7e3a` |

### 3. Zweryfikowane w Stripe (TEST mode)
- **Produkty**: Pro (`prod_Tohd7r2cIsnyd4`), Team (`prod_TohcdIXdQzrCpN`) — oba aktywne
- **Ceny** (wszystkie 4 zgodne z kodem):
  - Pro mies. $9 → `price_1Sr4E7ANogcZdSR3Dwu2aPbV` ✅
  - Pro rok $90 → `price_1Sr4JVANogcZdSR3locOvXlL` ✅
  - Team mies. $29 → `price_1Sr4MEANogcZdSR3nM2fRLT8` ✅
  - Team rok $290 → `price_1Sr4DaANogcZdSR3OCEudUHk` ✅
- **Stripe CLI**: zalogowany na konto `acct_1SnQmaANogcZdSR3` (TMCSTUDIO.APP)
- **Webhook forwarding**: `stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook` — aktywny

### 4. Testy połączeń
- **Stripe API**: ✅ Balance retrieved (livemode: false, TEST mode)
- **Supabase**: ✅ Połączono, profiles count: 0

### 5. Znany problem: lambda-local vs ES modules
Netlify CLI v18 i v21 używa `lambda-local` który nie obsługuje `require()` dla ES modules. Funkcje są skompilowane do `apps/web/.netlify/functions-serve/` gdzie `package.json` ma `"type": "module"`. **Problem występuje TYLKO lokalnie** — na produkcji Netlify używa własnego runtime'u który obsługuje ES modules.

**Obejście**: Do testów lokalnych można:
- Uruchomić funkcje przez `node --loader ts-node/esm` bezpośrednio
- Lub deploynąć na Netlify (gdzie działa bez zmian)

## Decyzje
- Użyto TEST mode Stripe (klucze `pk_test_` / `sk_test_`)
- Webhook secret wygenerowany przez Stripe CLI
- Wszystkie Price IDs w kodzie są TEST mode i zgodne z dashboardem

## Ryzyka
- Przed przejściem na LIVE trzeba wymienić Price IDs na produkcyjne
- Stripe CLI key wygasa po 90 dniach
- Node 18 jest deprecated dla supabase-js — warto zaktualizować do Node 20

## Status
- [x] Klucze Stripe skonfigurowane
- [x] Klucze Supabase skonfigurowane
- [x] Stripe API działa (TEST mode)
- [x] Supabase działa
- [x] Webhook forwarding aktywny
- [x] .env.local kompletny
- [x] Produkty i ceny zweryfikowane

## Deploy na Netlify (2026-06-15 09:00)
- **Deploy URL**: `https://tmcstudio.app`
- **Env vars na Netlify**: wszystkie 10 zmiennych (w tym nowy `VITE_STRIPE_PUBLISHABLE_KEY`)
- **Health endpoint**: ✅ `GET /.netlify/functions/health` → `{"status":"ok","stripeWebhook":true,"supabase":true}`
- **Checkout endpoint**: ✅ `POST /.netlify/functions/create-checkout` → zwróciło sessionId + Stripe Checkout URL
- **Funkcje zbundlowane**: 5 funkcji (health, _stripeConfig, create-checkout, stripe-webhook, create-portal-session) — na produkcji Netlify działa bez problemu z ES modules (inaczej niż lokalny `lambda-local`)