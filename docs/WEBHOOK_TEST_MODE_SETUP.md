# Webhook Test Mode Setup Guide
## Stripe Test Mode Webhook Configuration

**Problem**: Płatności testowe nie aktualizują subscription tier w bazie danych  
**Root Cause**: Webhook jest skonfigurowany tylko dla LIVE mode, nie TEST mode  
**Solution**: Dodaj osobny webhook endpoint dla Stripe Test Mode

---

## 🔍 Diagnosis

### Symptomy
- ✅ Płatność w Stripe test mode przechodzi
- ✅ User wraca z ?checkout=success
- ❌ Subscription tier pozostaje "free" w bazie
- ❌ Logi pokazują: `[getCurrentUser] tier: free`

### Dlaczego?
Stripe ma **2 osobne środowiska**:
- **Test Mode** - używa `pk_test_...` / `sk_test_...` / `whsec_test_...`
- **Live Mode** - używa `pk_live_...` / `sk_live_...` / `whsec_live_...`

**Webhooks w test mode NIE są wysyłane do live mode endpointów!**

---

## ✅ Solution: Configure Test Mode Webhook

### Step 1: Create Test Mode Webhook in Stripe

1. Przejdź do **[Stripe Dashboard](https://dashboard.stripe.com/)**
2. **WAŻNE**: Przełącz się na **"Viewing test data"** (toggle w prawym górnym rogu)
3. Nawigacja: **Developers** → **Webhooks** → **Add endpoint**

4. **Endpoint URL**:
   ```
   https://tmcstudio.netlify.app/.netlify/functions/stripe-webhook
   ```

5. **Description**: `TMC Studio Test Webhook`

6. **Events to send**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

7. Kliknij **"Add endpoint"**

8. **🔑 SKOPIUJ Signing Secret**
   - Po utworzeniu webhooka, kliknij "Reveal" przy "Signing secret"
   - Skopiuj wartość zaczynającą się od `whsec_...`
   - **To jest INNE niż live mode secret!**

---

### Step 2: Update Netlify Environment Variable

1. Przejdź do **[Netlify Dashboard](https://app.netlify.com/)**
2. Wybierz site: **tmcstudio** (lub twoja nazwa)
3. Nawigacja: **Site settings** → **Environment variables**

4. Znajdź zmienną: `STRIPE_WEBHOOK_SECRET`

5. **Zaktualizuj wartość**:
   - Usuń obecny (live mode) secret
   - Wklej nowy (test mode) secret (z Step 1)
   - Kliknij **Save**

   **Alternatywnie** (jeśli chcesz mieć oba):
   - Możesz dodać `STRIPE_WEBHOOK_SECRET_TEST` jako osobną zmienną
   - Wymaga to zmiany w kodzie `stripe-webhook.ts` aby wybrać odpowiedni secret

---

### Step 3: Redeploy Site

Po zmianie environment variables:

1. W Netlify Dashboard przejdź do: **Deploys**
2. Kliknij: **Trigger deploy** → **Deploy site**
3. Poczekaj ~2-3 minuty na build + deploy

**Lub** push dowolnej zmiany do GitHuba (auto-trigger deploy).

---

### Step 4: Test Payment Flow

1. **Otwórz app**: https://tmcstudio.netlify.app
2. **Zaloguj się** (lub stwórz nowe konto)
3. **Upgrade to Pro**: Settings → Upgrade
4. **Test Card Details**:
   - Card: `4242 4242 4242 4242`
   - Date: Dowolna przyszła data (np. `12/34`)
   - CVC: Dowolne 3 cyfry (np. `123`)
   - ZIP: Dowolny (np. `12345`)

5. **Po powrocie** sprawdź w Console DevTools:
   ```
   [getCurrentUser] User ... - tier: pro  ✅
   ```

6. **Verify UI**:
   - TopBar pokazuje badge "PRO"
   - Settings pokazuje "Current Plan: Pro"
   - Unlimited projects, animations enabled

---

## 🧪 Verify Webhook is Working

### Option A: Stripe Dashboard
1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. Upewnij się że jesteś w **test mode**
3. Kliknij na test webhook endpoint
4. Sprawdź **"Recent deliveries"**
5. Powinien być event `checkout.session.completed` ze statusem **200 OK**

### Option B: Netlify Function Logs
1. **Netlify Dashboard** → **Functions** → `stripe-webhook`
2. Sprawdź logi - powinny pokazać:
   ```
   📨 Received event: checkout.session.completed
   ✅ Updated user ... to pro
   ```

### Option C: Supabase Database
1. **Supabase Dashboard** → **SQL Editor**
2. Wykonaj query:
   ```sql
   SELECT email, subscription_tier, stripe_customer_id, subscription_expires_at
   FROM profiles
   WHERE email = 'twoj-email@example.com';
   ```
3. Sprawdź czy `subscription_tier = 'pro'`

---

## 🚨 Troubleshooting

### Problem: Webhook nadal nie działa po redeploy

**Check 1**: Upewnij się że webhook jest w test mode
- Stripe Dashboard musi pokazywać "Viewing test data"

**Check 2**: Verify endpoint URL
- Musi być dokładnie: `https://tmcstudio.netlify.app/.netlify/functions/stripe-webhook`
- Bez trailing slash!

**Check 3**: Check Netlify logs
- Netlify Dashboard → Functions → stripe-webhook → View logs
- Szukaj błędów webhook signature verification

**Check 4**: Verify secret zaczyna się od `whsec_`
- Test mode: `whsec_...`
- Live mode: różny `whsec_...`

### Problem: "Subscription Activating..." nigdy się nie kończy

To normalne jeśli webhook nie przeszedł - app próbuje 3 razy z retry:
- Attempt 1: Immediate
- Attempt 2: After 1.2s
- Attempt 3: After 2.4s

Po 3 próbach pokazuje się toast: "Subscription processing - refresh page in a few moments"

**Fix**: Skonfiguruj webhook poprawnie (powyższe kroki), potem wykonaj nową płatność.

### Problem: Chcę przetestować UI bez konfiguracji webhooka

**Manual Database Update** (tymczasowe):

```sql
UPDATE profiles
SET 
  subscription_tier = 'pro',
  subscription_expires_at = NOW() + INTERVAL '1 month',
  stripe_customer_id = 'cus_test_manual'
WHERE email = 'twoj-email@example.com';
```

Wykonaj w Supabase SQL Editor, potem odśwież stronę.

---

## 📋 Checklist: Test vs Live Mode

### Test Mode Configuration (Development)
- [ ] Stripe webhook utworzony w TEST mode
- [ ] Webhook ma secret `whsec_...` (test)
- [ ] Netlify `STRIPE_WEBHOOK_SECRET` = test secret
- [ ] Frontend używa `pk_test_...` (już jest)
- [ ] Functions używają `sk_test_...` (już jest)

### Live Mode Configuration (Production - Future)
- [ ] Stripe webhook utworzony w LIVE mode
- [ ] Webhook ma secret `whsec_...` (live - inny!)
- [ ] Netlify `STRIPE_WEBHOOK_SECRET` = live secret
- [ ] Frontend używa `pk_live_...`
- [ ] Functions używają `sk_live_...`

**WAŻNE**: Zawsze używaj matching secrets (test with test, live with live).

---

## 🎯 Quick Reference

| Environment | Publishable Key | Secret Key | Webhook Secret |
|-------------|----------------|------------|----------------|
| **Test** | `pk_test_...` | `sk_test_...` | `whsec_...` (test) |
| **Live** | `pk_live_...` | `sk_live_...` | `whsec_...` (live) |

---

## ✅ Success Criteria

After proper configuration:
1. ✅ Test payment completes in Stripe
2. ✅ Webhook fires and shows in Stripe logs (200 OK)
3. ✅ Database updates: `subscription_tier = 'pro'`
4. ✅ UI shows "PRO" badge in TopBar
5. ✅ Console shows: `[getCurrentUser] tier: pro`
6. ✅ UpgradeSuccessModal appears

---

## 📚 Related Docs

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe Test Mode](https://stripe.com/docs/testing)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- `docs/PR-PAY-6-SUBSCRIPTION-REFRESH-FIX.md` - Kod fix (już done)
- `docs/DEPLOYMENT_CHECKLIST.md` - Pre-launch checklist

---

**Status**: Awaiting webhook configuration for test mode ⏳
