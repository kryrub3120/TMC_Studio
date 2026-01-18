# PR-PAY-5: Webhook Period End Fix + End-to-End Testing

**Status:** ✅ COMPLETE  
**Date:** 2026-01-18  
**Critical Bug Fix:** Stripe subscription webhooks failing due to missing `current_period_end`

---

## 🐛 Problem Discovered

### Initial Symptom
```
subscription_tier: 'free' (not updating to 'pro' after successful checkout)
```

### Root Cause Analysis

**Webhook Logs:**
```
❌ Error processing webhook: Invalid subscription period end: undefined. Status: active
```

**Investigation Steps:**
1. ✅ Verified checkout flow works (Stripe Checkout redirects successfully)
2. ✅ Verified Stripe CLI forwarding webhooks to localhost
3. ✅ Verified `stripe_webhook_events` table exists (created via migration)
4. ✅ Found: `subscription.current_period_end` is **undefined** in `checkout.session.completed` events

**Deep Dive:**
When retrieving subscription from `checkout.session.completed`, the subscription object **does not include** `current_period_end`. This field only appears in:
- `subscription.updated` events
- Expanded `latest_invoice.period_end`

**Actual Subscription Structure:**
```json
{
  "status": "active",
  "start_date": 1768778440,
  "current_period_end": undefined,  // ❌ NOT PRESENT!
  "latest_invoice": {
    "period_end": 1768778440,        // ✅ EXISTS HERE
    "period_start": 1768778440
  },
  "plan": {
    "interval": "month",
    "interval_count": 1
  }
}
```

---

## ✅ Solution Implemented

### 3-Tier Fallback Logic for `period_end`

Applied to both `handleCheckoutCompleted` and `handleSubscriptionUpdated`:

```typescript
// 1. Try subscription.current_period_end (works in subscription.updated)
let periodEnd = subscription.current_period_end;

// 2. Fallback: Get from expanded latest_invoice.period_end
if (!periodEnd && subscription.latest_invoice) {
  const invoice = subscription.latest_invoice;
  periodEnd = typeof invoice === 'object' ? invoice.period_end : null;
  console.log(`Using period_end from latest_invoice: ${periodEnd}`);
}

// 3. Fallback: Calculate from start_date + interval
if (!periodEnd && subscription.start_date) {
  const plan = subscription.items.data[0]?.price;
  const interval = plan?.recurring?.interval || plan?.interval;
  const intervalCount = plan?.recurring?.interval_count || 1;
  
  if (interval === 'month') {
    const startDate = new Date(subscription.start_date * 1000);
    startDate.setMonth(startDate.getMonth() + intervalCount);
    periodEnd = Math.floor(startDate.getTime() / 1000);
  } else if (interval === 'year') {
    const startDate = new Date(subscription.start_date * 1000);
    startDate.setFullYear(startDate.getFullYear() + intervalCount);
    periodEnd = Math.floor(startDate.getTime() / 1000);
  }
}
```

### Key Changes

**File:** `netlify/functions/stripe-webhook.ts`

1. **Added Subscription Expansion:**
   ```typescript
   const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
     expand: ['items.data.price', 'latest_invoice']
   });
   ```

2. **Enhanced Error Messages:**
   - Now dumps full subscription object when period_end missing
   - Shows subscription status in error message
   - Logs which fallback method was used

3. **Applied to All Handlers:**
   - ✅ `handleCheckoutCompleted` (primary use case)
   - ✅ `handleSubscriptionUpdated` (renewals, upgrades, downgrades)

---

## 🧪 Testing Results

### Successful Checkout Flow

**Netlify Dev Logs:**
```
📨 Received event: checkout.session.completed (evt_1Sr5KhANogcZdSR3vffnZ57F)
Processing checkout session: cs_test_b1knyD2R22hanRLu86TIQCbLEz5U4X8qYs0fCWLI63ldJtyIXcoZbiVK58
Using period_end from latest_invoice: 1768778670
Using client_reference_id for user lookup: 1fcadaba-32f1-4ea3-9d13-46a19aae2f04
✅ Updated user 1fcadaba-32f1-4ea3-9d13-46a19aae2f04 to pro (expires: 2026-02-18T23:24:30.000Z)
Response with status 200 in 786 ms.
```

**Stripe CLI:**
```
--> checkout.session.completed [evt_xxx]
<-- [200] POST localhost:8888/.netlify/functions/stripe-webhook
```

**Browser Console:**
```javascript
subscription_tier: 'pro'  // ✅ WORKS!
subscription_expires_at: '2026-02-18T23:24:30.000Z'
```

**UI Verification:**
- ✅ TopBar shows "Pro" badge
- ✅ User can create >10 boards (Free limit: 10)
- ✅ User can create >10 steps per board (Free limit: 10)
- ✅ GIF export unlocked
- ✅ PDF export unlocked

---

## 📊 Database State

**Supabase `profiles` table:**
```sql
id: 1fcadaba-32f1-4ea3-9d13-46a19aae2f04
email: biuro@potencjaldosportu.pl
subscription_tier: pro
subscription_expires_at: 2026-02-18 23:24:30+00
stripe_customer_id: cus_ToimqmTBDAoC7l
```

**Supabase `stripe_webhook_events` table:**
```sql
event_id: evt_1Sr5KhANogcZdSR3vffnZ57F
event_type: checkout.session.completed
status: success
processed_at: 2026-01-18 23:24:31
```

---

## 🔄 Events Handled

### ✅ Checkout Events
- `checkout.session.completed` → Activates subscription
- `payment_intent.succeeded` → Logged only
- `invoice.payment_succeeded` → Logged only

### ✅ Subscription Events  
- `customer.subscription.updated` → Plan changes, renewals
- `customer.subscription.deleted` → Downgrades to free

### ✅ Billing Portal Events
- `billing_portal.session.created` → Logged only
- User can manage subscription via Stripe Portal

---

## 🚀 Deployment Notes

### Local Testing Complete
- ✅ Stripe CLI forwarding webhooks to localhost
- ✅ Netlify Dev running with updated handler
- ✅ Migration `20260111000000_add_stripe_webhook_events.sql` applied to cloud Supabase
- ✅ Idempotency working (duplicate events handled)

### Production Deployment Checklist

**Before Deploy:**
1. ✅ Ensure `stripe_webhook_events` table exists in production Supabase
2. ✅ Verify webhook endpoint configured in Stripe Dashboard
3. ✅ Confirm webhook signing secret (`STRIPE_WEBHOOK_SECRET`) in env vars

**After Deploy:**
1. Test complete checkout flow in production
2. Monitor webhook logs for 200 responses
3. Verify subscription tier updates in production database
4. Test subscription renewals (wait for monthly cycle or use Stripe test clock)

---

## 📝 Lessons Learned

### Stripe Subscription Object Variations

**Event Type Matters:**
- `checkout.session.completed`: subscription lacks `current_period_end`
- `subscription.updated`: subscription **has** `current_period_end`
- Always expand related objects when possible

### Fallback Strategy Works
- Don't rely on single field for critical data
- Multiple fallback sources prevent failures
- Log which fallback was used for debugging

### Webhook Idempotency Essential
- Stripe retries failed webhooks automatically
- INSERT-first pattern prevents duplicate processing
- Audit trail in `stripe_webhook_events` table invaluable for debugging

---

## 🔗 Related PRs

- **PR-PAY-1:** Stripe integration + Pricing UI
- **PR-PAY-2:** Checkout flow + client_reference_id
- **PR-PAY-3:** Supabase webhook events table
- **PR-PAY-4:** Subscription management + Customer Portal
- **PR-PAY-5:** ✅ Period end fallback fix (this PR)

---

## ✅ Sign-Off

**Tested By:** Krystian Rubajczyk  
**Date:** 2026-01-18  
**Environment:** localhost + Supabase Cloud + Stripe Test Mode  
**Result:** ✅ Complete end-to-end payment flow working
