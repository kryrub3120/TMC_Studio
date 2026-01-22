# Deployment Checklist - TMC Studio BETA

**Date:** 2026-01-22  
**Environment:** BETA TESTING (TEST Stripe keys)
**Status:** 🧪 Beta Mode - Testing with TEST cards before going LIVE

---

## 🧪 Current Status: BETA MODE

We are currently in **BETA testing phase** using **TEST Stripe keys** on production.

**Why?**
- Validate complete flow (signup → upgrade → pro features) with beta testers
- Gather UX/UI feedback before charging real money
- Test payment integration with no financial risk
- Identify and fix bugs before LIVE launch

**Beta testers will:**
- Use TEST card: `4242 4242 4242 4242`
- Go through full signup/upgrade flow
- Test Pro features (GIF export, unlimited projects, etc.)
- Provide feedback on usability

---

## ✅ BETA Configuration Complete

### Environment Variables (Netlify)
- [x] `STRIPE_SECRET_KEY` set to **TEST key** (`sk_test_...`)
- [x] `STRIPE_PUBLISHABLE_KEY` set to **TEST key** (`pk_test_...`)
- [x] `STRIPE_WEBHOOK_SECRET` configured for TEST mode
- [x] `SUPABASE_SERVICE_ROLE_KEY` configured
- [x] Frontend env vars (`VITE_*`) configured

### Code Configuration
- [x] TEST Price IDs in `apps/web/src/config/stripe.ts`
- [x] Entitlements system working
- [x] Payment flow complete (PR-PAY-1 through PR-PAY-5)
- [x] Webhooks handling all events correctly

### Supabase
- [x] All migrations applied
- [x] `stripe_webhook_events` table exists (idempotency)
- [x] RLS policies configured

---

## ⚠️ CRITICAL: Environment Variables

All Stripe keys are **TEST mode** - safe to use for beta testing!

### Current Netlify Environment Variables (BETA/TEST)

```bash
# Stripe TEST Keys (BETA TESTING)
STRIPE_SECRET_KEY=sk_test_... # TEST mode
STRIPE_PUBLISHABLE_KEY=pk_test_... # TEST mode
STRIPE_WEBHOOK_SECRET=whsec_... # TEST webhook

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Frontend Environment Variables (TEST mode)

```bash
# These are PUBLIC (safe to expose in frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # TEST mode
```

**✅ All configured and working!**

---

## 🎯 Pre-Deployment Checklist

### 1. Stripe Configuration

- [x] **Webhook Endpoint Created**
  - URL: `https://tmcstudio.app/.netlify/functions/stripe-webhook`
  - Webhook ID: `we_1SnR3fANogcZdSR3JEcKYwK5`
  - API Version: `2025-12-15.clover`
  - Status: Active ✅

- [x] **Webhook Events Configured** (5 events)
  - [ ] Verify: `checkout.session.completed`
  - [ ] Verify: `customer.subscription.updated`
  - [ ] Verify: `customer.subscription.deleted`
  - [ ] Verify: `invoice.payment_succeeded`
  - [ ] Verify: `invoice.payment_failed`

- [ ] **Products & Prices Created**
  - [ ] Pro Monthly ($9 USD) - Get Price ID from Stripe Dashboard
  - [ ] Pro Yearly ($90 USD) - Get Price ID
  - [ ] Team Monthly ($29 USD) - Get Price ID
  - [ ] Team Yearly ($290 USD) - Get Price ID

- [ ] **Update `apps/web/src/config/stripe.ts`** with LIVE Price IDs
  - Replace test Price IDs with production Price IDs
  - Keep test IDs commented for reference

### 2. Supabase Configuration

- [ ] **Database Tables Exist**
  - [ ] `profiles` table with `stripe_customer_id` column
  - [ ] `profiles` table with `subscription_tier` column
  - [ ] `profiles` table with `subscription_expires_at` column
  - [ ] `stripe_webhook_events` table (idempotency) ⚠️ CRITICAL!
  - [ ] RLS policies configured correctly

- [ ] **Migrations Applied**
  - [ ] `20260108000001_add_stripe_customer_id.sql`
  - [ ] `20260111000000_add_stripe_webhook_events.sql` ⚠️ REQUIRED!
  - [ ] All other migrations

- [ ] **Service Role Key Obtained**
  - Go to Supabase → Project Settings → API
  - Copy `service_role` key (NOT `anon` key!)

### 3. Code Ready

- [x] PR-PAY-1: Stripe config implemented
- [x] PR-PAY-2: User context in checkout
- [ ] All TypeScript errors fixed
- [ ] Build passes: `pnpm build`
- [ ] Lint passes: `pnpm lint`

### 4. Netlify Deployment

- [ ] **Site Created**
  - Site URL: `https://tmcstudio.app`
  - Build command: `pnpm build`
  - Publish directory: `apps/web/dist`

- [ ] **Environment Variables Set** (see above)

- [ ] **Build & Deploy Logs Look Good**
  - No errors
  - Functions deployed successfully

---

## 🚀 Deployment Steps

### Step 1: Get LIVE Stripe Price IDs

1. Go to Stripe Dashboard → Products
2. Create products if they don't exist:
   - **Pro Plan**
     - Monthly: $9 USD → Copy Price ID
     - Yearly: $90 USD → Copy Price ID
   - **Team Plan**
     - Monthly: $29 USD → Copy Price ID
     - Yearly: $290 USD → Copy Price ID

### Step 2: Update Code with LIVE Price IDs

```bash
# Edit apps/web/src/config/stripe.ts
# Replace Price IDs with LIVE ones from Stripe Dashboard
```

**Example:**
```typescript
export const STRIPE_PRICES = {
  pro: {
    monthly: 'price_LIVE_xxx...', // From Stripe Dashboard
    yearly: 'price_LIVE_yyy...',
  },
  team: {
    monthly: 'price_LIVE_zzz...',
    yearly: 'price_LIVE_www...',
  },
} as const;
```

### Step 3: Set Netlify Environment Variables

1. Go to Netlify Dashboard
2. Your Site → Site Settings → Environment Variables
3. Add ALL variables from section above
4. **DO NOT** commit secrets to git!

### Step 4: Deploy

```bash
# Option A: Push to main (if auto-deploy enabled)
git add .
git commit -m "feat: add Stripe payment integration (PR-PAY-1 + PR-PAY-2)"
git push origin main

# Option B: Manual deploy via Netlify Dashboard
# Netlify → Deploys → Trigger deploy
```

### Step 5: Verify Deployment

1. **Check Functions Deployed**
   - Netlify → Functions tab
   - ✅ `create-checkout`
   - ✅ `stripe-webhook`
   - ✅ `create-portal-session`

2. **Test Webhook Connection**
   - Stripe Dashboard → Webhooks → Your endpoint
   - Click "Send test webhook"
   - Check: Status 200 OK
   - Check: Netlify function logs show event received

3. **Check Frontend Build**
   - Visit `https://tmcstudio.app`
   - Open DevTools → Console
   - No errors about missing env vars
   - Stripe publishable key loaded

---

## 🧪 Post-Deployment Testing

### Test 1: Basic Flow (CRITICAL)

1. **Sign Up / Sign In** → https://tmcstudio.app
2. **Click "Upgrade to Pro"**
3. **Verify in DevTools → Network:**
   - Request to `create-checkout` succeeds
   - Response has `url` field
   - Request includes `userId`, `email`
4. **Click checkout button**
5. **Enter TEST card:** `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
6. **Complete payment**
7. **Verify redirect:** Back to `https://tmcstudio.app/?checkout=success`
8. **Verify UI shows "Pro" badge**
9. **Check Supabase:**
   - `profiles.subscription_tier` = 'pro'
   - `profiles.stripe_customer_id` populated
10. **Check Stripe Dashboard:**
    - New customer created
    - Subscription active
    - Payment succeeded

### Test 2: Webhook Delivery

1. Stripe Dashboard → Webhooks → Your endpoint
2. Click webhook ID
3. Check "Recent deliveries"
4. ✅ Verify: All events show 200 status
5. ❌ If failed: Check Netlify function logs

### Test 3: Pro Features Unlocked

1. Try creating 4th project (should work for Pro)
2. Try adding 11th step (should work for Pro)
3. Try exporting GIF (should work for Pro)
4. Try exporting PDF (should work for Pro)

### Test 4: Cancellation Flow

1. Click "Manage Billing" in settings
2. Opens Stripe Customer Portal
3. Cancel subscription
4. ✅ Verify: Webhook fires `customer.subscription.deleted`
5. ✅ Verify: DB updated to `subscription_tier` = 'free'
6. ✅ Verify: UI shows "Free" badge
7. ✅ Verify: Pro features locked

---

## ⚠️ Troubleshooting

### Issue: Webhook Returns 500 Error

**Check:**
1. Netlify function logs: `Netlify → Functions → stripe-webhook → Logs`
2. Missing env var? Check `SUPABASE_SERVICE_ROLE_KEY`
3. Database connection issue? Check Supabase RLS policies

**Fix:**
- Ensure all env vars set correctly
- Redeploy if env vars were just added
- Check function logs for specific error

### Issue: Payment Success but DB Not Updated

**Check:**
1. Stripe Dashboard → Webhooks → Recent deliveries STATUS
2. Netlify function logs for error messages
3. Supabase profiles table directly (maybe RLS blocking?)

**Possible Causes:**
- Webhook secret mismatch
- Supabase service role key wrong
- User not found by email/ID
- RLS policy blocking update

**Fix:**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check webhook calls `updateUserSubscription()` successfully

### Issue: "Price ID not found in config"

**Check:**
1. `apps/web/src/config/stripe.ts` has LIVE Price IDs
2. Netlify deployed latest code
3. Clear browser cache / hard refresh

**Fix:**
- Update config file with production Price IDs
- Redeploy
- Test again

### Issue: User Doesn't See Pro Badge After Payment

**Possible Causes:**
1. Webhook didn't fire (check Stripe)
2. Webhook fired but failed (check Netlify logs)
3. UI cached old data (auth store not refreshed)

**Fix (PR-PAY-4):**
- Add UI polling after checkout success
- Force auth store refresh on `/?checkout=success`

### Issue: "Invalid subscription period end: undefined" ⚠️ CRITICAL

**Error in Logs:**
```
❌ Error processing webhook: Invalid subscription period end: undefined. Status: active
```

**Root Cause (PR-PAY-5):**
- `subscription.current_period_end` is **undefined** in `checkout.session.completed` events
- This field only exists in `subscription.updated` events
- Must use `latest_invoice.period_end` or calculate from `start_date + interval`

**Fix (ALREADY IMPLEMENTED in PR-PAY-5):**
- Webhook handler now has 3-tier fallback:
  1. Try `subscription.current_period_end`
  2. Try `latest_invoice.period_end`
  3. Calculate from `start_date + interval`
- If you see this error, ensure latest code is deployed
- Check Netlify function logs show "Using period_end from latest_invoice"

**Verify Fix Working:**
```
✅ Logs show: "Using period_end from latest_invoice: 1768778670"
✅ Logs show: "✅ Updated user XXX to pro"
✅ Webhook returns 200 status
```

---

## 📊 Monitoring

### Daily Checks

1. **Stripe Dashboard → Payments**
   - Any failed payments?
   - Any disputes/chargebacks?

2. **Stripe Dashboard → Webhooks**
   - All events delivering successfully?
   - Any 500 errors?

3. **Netlify Functions Logs**
   - Any errors in `stripe-webhook`?
   - Any errors in `create-checkout`?

4. **Supabase Logs**
   - Any RLS policy violations?
   - Any database errors?

### Weekly Checks

1. Verify all subscriptions in Stripe match Supabase tiers
2. Check for orphaned customers (payment but no DB record)
3. Review cancellation rate

---

## 🔐 Security Notes

### ⚠️ NEVER Commit These:

```
❌ STRIPE_SECRET_KEY
❌ STRIPE_WEBHOOK_SECRET
❌ SUPABASE_SERVICE_ROLE_KEY
```

### ✅ Safe to Commit:

```
✅ VITE_STRIPE_PUBLISHABLE_KEY (public)
✅ VITE_SUPABASE_URL (public)
✅ VITE_SUPABASE_ANON_KEY (public with RLS)
```

### .env.local (Local Development ONLY)

Create `apps/web/.env.local` for local testing:

```bash
# Use TEST keys locally!
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

---

## 📞 Support Resources

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Docs:** https://stripe.com/docs/payments/checkout
- **Stripe Webhooks Guide:** https://stripe.com/docs/webhooks
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Netlify Dashboard:** https://app.netlify.com

---

## ✅ Ready to Go Live?

Before enabling payments for real users:

- [ ] All tests pass with test card
- [ ] Webhook delivering successfully
- [ ] DB updates correctly
- [ ] UI shows correct tier
- [ ] Pro features unlock/lock correctly
- [ ] Billing portal works
- [ ] Cancellation flow works
- [ ] Error handling tested
- [ ] All env vars set in Netlify
- [ ] Domain configured (tmcstudio.app)
- [ ] SSL enabled
- [ ] Terms of Service updated with refund policy
- [ ] Privacy Policy mentions Stripe

**If all checked:** Switch from test mode to live mode in Stripe, update keys, deploy! 🚀

---

## 🎉 Post-Launch

### First Real Payment Received?

1. ✅ Verify webhook fired
2. ✅ Verify DB updated
3. ✅ Verify user has Pro access
4. ✅ Send thank you email? (future feature)
5. ✅ Celebrate! 🎊

### Metrics to Track

- Conversion rate (free → pro)
- Churn rate (cancellations)
- Average subscription lifetime
- Revenue per user
- Payment success rate

---

**Current Status:** ✅ ALL PAYMENT PRs COMPLETE (PR-PAY-1 through PR-PAY-5)  
**Local Testing:** ✅ VERIFIED - Complete end-to-end payment flow working  
**Next:** Get LIVE Price IDs, set env vars, deploy to production!

**Completed Work:**
- ✅ PR-PAY-1: Stripe integration, pricing UI, config
- ✅ PR-PAY-2: Checkout flow with user context (client_reference_id)
- ✅ PR-PAY-3: Webhook idempotency (stripe_webhook_events table)
- ✅ PR-PAY-4: Subscription management, Customer Portal
- ✅ PR-PAY-5: Webhook period_end fallback fix (CRITICAL BUG FIX)

**Verified Features:**
- ✅ Checkout redirects to Stripe hosted page
- ✅ Webhooks process successfully (200 status)
- ✅ Database updates to `subscription_tier: 'pro'`
- ✅ UI shows Pro badge
- ✅ Pro limits unlocked (>10 boards, >10 steps)
- ✅ GIF/PDF export enabled
- ✅ Billing portal integration
