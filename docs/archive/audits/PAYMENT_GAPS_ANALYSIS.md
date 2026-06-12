# PAYMENT GAPS ANALYSIS - What's Missing & What Needs to Change

**Last Updated:** 2026-01-11  
**Purpose:** Detailed analysis of EVERY file that needs changes for production-ready payments

---

## 🔴 CRITICAL GAPS (Must Fix Before Testing)

### 1. **PricingModal.tsx** - Placeholder Price IDs

**Current State:**
```tsx
const plans: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    priceId: 'price_pro_monthly', // ❌ PLACEHOLDER
    // ...
  },
  {
    id: 'team',
    name: 'Team',
    price: '$29',
    priceId: 'price_team_monthly', // ❌ PLACEHOLDER
    // ...
  },
];
```

**What's Missing:**
- No real Stripe Price IDs
- Hardcoded prices don't match actual Stripe products
- No yearly pricing options visible
- No environment-aware config (test vs production)

**What Needs to Change:**
1. Create `apps/web/src/config/stripe.ts` with real Price IDs
2. Import STRIPE_PRICES from config
3. Support monthly AND yearly pricing
4. Show price toggle (Monthly/Yearly)

---

### 2. **PricingModal.tsx** - User Context Missing

**Current State:**
```tsx
// Checkout request body
body: JSON.stringify({
  priceId: plan.priceId,
  successUrl: `${window.location.origin}/?checkout=success`,
  cancelUrl: `${window.location.origin}/?checkout=cancelled`,
  // ❌ NO USER EMAIL
  // ❌ NO CUSTOMER ID
  // ❌ NO USER ID
}),
```

**What's Missing:**
- User email not passed (Stripe can't create customer)
- Existing stripe_customer_id not reused
- No Supabase user ID for webhook correlation

**What Needs to Change:**
1. Get user from `useAuthStore`
2. Pass `email: user.email`
3. Pass `customerId: user.stripe_customer_id` if exists
4. Add `userId: user.id` for client_reference_id

---

### 3. **create-checkout.ts** - No User Tracking

**Current State:**
```tsx
const sessionParams: Stripe.Checkout.SessionCreateParams = {
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: successUrl,
  cancel_url: cancelUrl,
  // ❌ NO client_reference_id
  // ❌ customer or customer_email conditional is weak
};
```

**What's Missing:**
- No `client_reference_id` to track which Supabase user is paying
- Webhook will struggle to find the user if email lookup fails

**What Needs to Change:**
1. Accept `userId` in request body
2. Add `client_reference_id: userId` to session
3. This allows webhook to directly query `profiles.id = client_reference_id`

---

### 4. **stripe-webhook.ts** - Placeholder Price IDs

**Current State:**
```tsx
const PRICE_TO_TIER: Record<string, 'free' | 'pro' | 'team'> = {
  // Pro plans
  'price_1SnQvaANogcZdSR39JL60iCS': 'pro',  // ❌ ARE THESE REAL?
  'price_1SnQvaANogcZdSR3f6Pv3xZ8': 'pro',  
  // Team plans
  'price_1SnQvzANogcZdSR3BiUrQvqc': 'team',
  'price_1SnQwfANogcZdSR3Kdp2j8FB': 'team',
};
```

**What's Missing:**
- Need verification these are actual Price IDs from Stripe
- No centralized config (duplicated with PricingModal)
- No handling for unknown Price IDs

**What Needs to Change:**
1. Import from shared `stripe.ts` config
2. Add fallback: if Price ID unknown, log error but don't crash

---

### 5. **stripe-webhook.ts** - No Idempotency

**Current State:**
```tsx
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout session:', session.id);
  // ❌ NO CHECK: Have we processed this event before?
  
  await updateUserSubscription(customerId, tier, expiresAt);
  // ❌ If webhook fires twice, user gets updated twice (harmless but wasteful)
}
```

**What's Missing:**
- No idempotency check (Stripe can send same event multiple times)
- No audit log of which events were processed

**What Needs to Change:**
1. Create `stripe_webhook_events` table with `event_id` unique constraint
2. Before processing: `INSERT INTO stripe_webhook_events (event_id, type, processed_at)`
3. If insert fails (duplicate), skip processing and return 200

---

### 6. **stripe-webhook.ts** - Customer Lookup Fragile

**Current State:**
```tsx
async function updateUserSubscription(customerId: string, tier, expiresAt) {
  // Try to find by stripe_customer_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    // ❌ Fallback: lookup by email from Stripe customer
    // ❌ What if email changed?
    // ❌ What if customer deleted?
  }
}
```

**What's Missing:**
- If `stripe_customer_id` not set, falls back to email (slow, brittle)
- If customer deleted in Stripe, fails completely
- No use of `client_reference_id` from session

**What Needs to Change:**
1. In `handleCheckoutCompleted`: extract `client_reference_id` from session
2. If present, query `profiles WHERE id = client_reference_id` (direct lookup!)
3. Only fall back to customer ID/email if no client_reference_id

---

### 7. **App.tsx** - Race Condition on Success

**Current State:**
```tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const checkoutStatus = params.get('checkout');
  
  if (checkoutStatus === 'success') {
    console.log('[Payment] Checkout success, refreshing user data...');
    useAuthStore.getState().initialize().then(() => {
      const user = useAuthStore.getState().user;
      if (user?.subscription_tier !== 'free') {
        setUpgradeSuccessModalOpen(true); // ✅ Shows modal
      }
      // ❌ BUT: What if webhook hasn't fired yet?
      // ❌ User sees nothing, thinks upgrade failed
    });
  }
}, []);
```

**What's Missing:**
- No retry/polling logic
- If webhook is slow (2-3 seconds), initialize() runs before DB update
- User sees no modal, thinks payment failed

**What Needs to Change:**
1. Show loading modal: "Activating your subscription..."
2. Poll every 1 second, up to 3 times
3. If still not upgraded after 3 attempts, show "Subscription processing, refresh page in a moment"

---

### 8. **UpgradeSuccessModal** - No Loading State

**Current State:**
```tsx
export function UpgradeSuccessModal({
  isOpen,
  onClose,
  plan,
}: UpgradeSuccessModalProps) {
  if (!isOpen) return null;
  
  // ❌ No loading state
  // ❌ Assumes subscription is already active
  
  return (
    <div>
      <h2>Welcome to {planName}!</h2>
      // ...
    </div>
  );
}
```

**What's Missing:**
- No way to show "Activating..." while waiting for webhook

**What Needs to Change:**
1. Add `isActivating?: boolean` prop
2. If `isActivating`: show spinner + "Activating your subscription..."
3. Once activated (tier updated): show confetti celebration

---

### 9. **App.tsx** - No Portal Return Handling

**Current State:**
```tsx
// User clicks "Manage Billing" → goes to Stripe Portal
// User cancels subscription in Portal
// User clicks "Return to app"
// ❌ App doesn't refresh subscription tier
// ❌ User still sees "Pro" until manual refresh
```

**What's Missing:**
- No detection of portal return
- No subscription refresh after portal changes

**What Needs to Change:**
1. Portal session should return to `/?portal=return`
2. Detect `?portal=return` in App.tsx
3. Call `useAuthStore.getState().initialize()` to refresh
4. Show toast: "Subscription updated"

---

### 10. **No Centralized Stripe Config**

**Current State:**
- Price IDs hardcoded in PricingModal
- Price IDs hardcoded in webhook
- No environment awareness (test vs prod)

**What's Missing:**
- Single source of truth for Stripe config

**What Needs to Change:**
Create `apps/web/src/config/stripe.ts`:
```tsx
export const STRIPE_PRICES = {
  pro: {
    monthly: 'price_1ABC123...',
    yearly: 'price_1ABC456...',
  },
  team: {
    monthly: 'price_1ABC789...',
    yearly: 'price_1ABC012...',
  },
} as const;

export const PRICE_TO_TIER = {
  [STRIPE_PRICES.pro.monthly]: 'pro',
  [STRIPE_PRICES.pro.yearly]: 'pro',
  [STRIPE_PRICES.team.monthly]: 'team',
  [STRIPE_PRICES.team.yearly]: 'team',
} as const;
```

---

## 🟡 MEDIUM PRIORITY GAPS (Should Fix Before Launch)

### 11. **No Webhook Audit Table**

**What's Missing:**
- No database record of webhook events
- Hard to debug "Why didn't subscription update?"

**What Needs to Change:**
Create migration:
```sql
CREATE TABLE stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB,
  processing_error TEXT
);
```

---

### 12. **No Manual Refresh Button**

**What's Missing:**
- If webhook fails and Stripe retries later, user has no way to see the update

**What Needs to Change:**
Add to SettingsModal:
```tsx
<button onClick={async () => {
  await useAuthStore.getState().initialize();
  showToast('Subscription refreshed');
}}>
  Refresh Subscription Status
</button>
```

---

### 13. **No Payment Failure Handling**

**What's Missing:**
- If payment fails, user just sees generic Stripe error
- No friendly "Your payment failed" message in app

**What Needs to Change:**
1. Detect `?checkout=cancelled` (user closed checkout)
2. Detect `?checkout=failed` (payment declined)
3. Show friendly modal: "Payment unsuccessful. Try again?"

---

### 14. **No Downgrade Notification**

**What's Missing:**
- User cancels in Portal → returns to app → no notification
- User doesn't realize they're back on Free tier

**What Needs to Change:**
1. On portal return, compare old tier vs new tier
2. If downgraded: show toast "You've cancelled Pro. Your features will remain active until [date]"

---

## 🟢 NICE-TO-HAVE IMPROVEMENTS

### 15. **Yearly Pricing Not Shown**

**Current:** Only monthly prices visible in PricingModal  
**Better:** Add toggle to show yearly (with discount: "Save 20%!")

---

### 16. **No Trial Period**

**Current:** Immediate charge  
**Better:** Offer 7-day free trial (change in Stripe Product settings)

---

### 17. **No Promo Codes**

**Current:** `allow_promotion_codes: true` in checkout (good!)  
**Better:** Show "Have a promo code?" in

 PricingModal before clicking upgrade

---

### 18. **No Cancellation Survey**

**Current:** User cancels, no feedback  
**Better:** "Why did you cancel?" survey (can be Portal setting or in-app)

---

## 📋 SUMMARY: Files That Need Changes

| File | Changes Needed | Priority |
|------|----------------|----------|
| `apps/web/src/config/stripe.ts` | **CREATE** - Centralized config | 🔴 CRITICAL |
| `packages/ui/src/PricingModal.tsx` | Import config, pass user email/ID | 🔴 CRITICAL |
| `netlify/functions/create-checkout.ts` | Add client_reference_id | 🔴 CRITICAL |
| `netlify/functions/stripe-webhook.ts` | Import config, add idempotency | 🔴 CRITICAL |
| `apps/web/src/App.tsx` | Add polling/retry, portal return | 🔴 CRITICAL |
| `packages/ui/src/UpgradeSuccessModal.tsx` | Add loading state | 🟡 MEDIUM |
| `supabase/migrations/xxx_webhook_events.sql` | **CREATE** - Audit table | 🟡 MEDIUM |
| `packages/ui/src/SettingsModal.tsx` | Add refresh button | 🟡 MEDIUM |
| `.env.example` | Document all Stripe env vars | 🟢 NICE |

---

## 🎯 NEXT STEPS

1. **Manual Stripe Setup** (do in Dashboard first):
   - Create Products (Pro, Team)
   - Create Prices (4 total: Pro Monthly/Yearly, Team Monthly/Yearly)
   - Copy Price IDs

2. **PR-PAY-1** (Configuration):
   - Create `stripe.ts` config with real IDs
   - Update PricingModal
   - Update webhook

3. **Test with 4242 card** - Verify end-to-end flow works

4. **Continue with PR-PAY-2 through PR-PAY-5** - Fix remaining gaps
