# Backend & Payment Integration - Complete

## ✅ Phase 1: Supabase Integration - DONE
- [x] `apps/web/src/lib/supabase.ts` - Klient SDK
- [x] `supabase/migrations/20260108000000_initial_schema.sql` - Schemat DB
- [x] `supabase/migrations/20260108000001_add_stripe_customer_id.sql` - Stripe integration
- [x] `supabase/seed.sql` - Dane testowe
- [x] `supabase/config.toml` - Konfiguracja CLI

## ✅ Phase 2: Netlify Functions - DONE
- [x] `netlify.toml` - Konfiguracja Netlify
- [x] `netlify/functions/stripe-webhook.ts` - Stripe webhook handler
- [x] `netlify/functions/health.ts` - Health check endpoint
- [x] `netlify/functions/tsconfig.json` - TypeScript config
- [x] `.env.example` - Dokumentacja zmiennych środowiskowych

## ✅ TypeScript Status: PASS (9/9 tasks)

---

## 🚀 Next Steps (Manual)

### 1. Zainstaluj Supabase CLI i połącz projekt (~5 min)

```bash
# Install CLI (jeśli nie masz)
brew install supabase/tap/supabase

# Login
supabase login

# Link projekt
cd "/Users/krystianrubajczyk/Documents/PROGRAMOWANIE/TMC Studio "
supabase link --project-ref pgacjczecyfnwsaadyvj

# Push migracji
supabase db push
```

### 2. Skonfiguruj Netlify (~3 min)

```bash
# Install Netlify CLI (jeśli nie masz)
npm install -g netlify-cli

# Login
netlify login

# Init nowy site lub link istniejący
netlify init
# lub
netlify link
```

### 3. Dodaj zmienne środkowiskowe w Netlify Dashboard

Przejdź do: **Site Settings → Environment Variables**

```env
# Required for Netlify Functions
SUPABASE_URL=https://pgacjczecyfnwsaadyvj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<z Supabase Dashboard>
STRIPE_SECRET_KEY=sk_test_xxx  # Z https://dashboard.stripe.com/apikeys
STRIPE_WEBHOOK_SECRET=whsec_xxx  # Po utworzeniu webhook
```

### 4. Skonfiguruj Stripe Webhook

1. Przejdź do: https://dashboard.stripe.com/webhooks
2. Kliknij "Add endpoint"
3. URL: `https://YOUR-SITE.netlify.app/api/stripe-webhook`
4. Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Skopiuj `Webhook signing secret` do env

### 5. Test lokalnie (~2 min)

```bash
# Start Netlify dev (z functions)
netlify dev

# Test health endpoint
curl http://localhost:8888/api/health

# Test Stripe webhook (z Stripe CLI)
stripe listen --forward-to localhost:8888/api/stripe-webhook
```

---

## 📁 Project Structure (After Changes)

```
TMC Studio/
├── apps/web/
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.ts          # ✅ Supabase client
│   │   └── ...
│   └── .env.local                    # ✅ Local credentials
├── netlify/
│   └── functions/
│       ├── stripe-webhook.ts        # ✅ Payment webhook
│       ├── health.ts                # ✅ Health check
│       └── tsconfig.json            # ✅ TS config
├── supabase/
│   ├── migrations/
│   │   ├── 20260108000000_initial_schema.sql      # ✅ Base schema
│   │   └── 20260108000001_add_stripe_customer_id.sql  # ✅ Stripe
│   ├── config.toml                  # ✅ CLI config
│   └── seed.sql                     # ✅ Test data
├── netlify.toml                     # ✅ Netlify config
├── .env.example                     # ✅ Env documentation
└── docs/
    └── MASTER_DEVELOPMENT_PLAN.md   # ✅ Full roadmap
```

---

## 🔜 Future Tasks (W3-W4)

1. **Auth UI** - Login/Register komponenty
2. **Projects Dashboard** - Lista projektów użytkownika
3. **Cloud Save** - Auto-sync do Supabase
4. **Stripe Checkout** - /pricing page z Checkout
5. **Billing Portal** - /settings/billing

---

## 📚 Resources

- [Supabase Dashboard](https://supabase.com/dashboard/project/pgacjczecyfnwsaadyvj)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Netlify Dashboard](https://app.netlify.com)
- [Master Plan](../docs/MASTER_DEVELOPMENT_PLAN.md)
3. **Cloud Save** - zamiana localStorage na Supabase
