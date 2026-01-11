# PAYMENT FOUNDATION - TMC Studio

**Status:** 🚧 In Progress  
**Target:** Production-ready Stripe payments  
**Last Updated:** 2026-01-11

---

## Overview

This document tracks the implementation of production-ready payment infrastructure for TMC Studio's Guest → Free → Pro monetization model.

**Goal:** Enable users to upgrade using Stripe test cards, with webhooks correctly updating Supabase, UI reacting to subscription changes, and all edge cases handled safely.

---

## Current State Analysis

### ✅ What Exists

- **Backend Functions:**
  - `create-checkout.ts` - Creates Stripe checkout sessions
  - `stripe-webhook.ts` - Handles 5 webhook event types
  - `create-portal-session.ts` - Customer billing portal access

- **Database:**
  - `profiles.subscription_tier` - 'free' | 'pro' | 'team'
  - `profiles.stripe_customer_id` - Links to Stripe customer
  - `profiles.subscription_expires_at` - Subscription end date

- **Frontend:**
  - `entitlements.ts` - Plan limits and permission checking
  - `useEntitlements()` - React hook for plan access
  - `PricingModal` - Shows 3 plan tiers
  - `UpgradeSuccessModal` - Post-payment celebration
  - `useAuthStore` - Tracks `isPro`/`isTeam` flags

### ❌ What's Missing/Broken

1. **Configuration Issues:**
   - PricingModal uses placeholder Price IDs (`'price_pro_monthly'`)
   - No centralized Stripe config
   - Webhook PRICE_TO_TIER map has placeholder IDs

2. **Integration Gaps:**
   - Checkout doesn't receive user email/customerId
   - No idempotency in webhooks (could process events twice)
   - No webhook audit trail

3. **UX Issues:**
   - Race condition: UI may show before webhook completes
   - No loading state during subscription activation
   - Customer Portal return doesn't refresh subscription
   - No manual "Refresh Subscription" fallback

---

## Architecture: Payment Flow

```
┌─────────────────────────────────────────────────────┐
│ USER ACTION: Click "Upgrade to Pro"                 │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ FRONTEND: PricingModal.tsx                          │
│  • Get user email from useAuthStore                 │
│  • Get stripe_customer_id if exists                 │
│  • POST to create-checkout with:                    │
│    - priceId (from stripe.ts config)                │
│    - email or customerId                            │
│    - successUrl, cancelUrl                          │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ BACKEND: create-checkout.ts                         │
│  • Create Stripe checkout session                   │
│  • Add client_reference_id = supabase_user_id       │
│  • Return checkout URL                              │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ STRIPE: Checkout Page                               │
│  • User enters card 4242 4242 4242 4242            │
│  • Stripe processes payment                         │
│  • Creates Customer, Subscription, Invoice          │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ STRIPE WEBHOOKS: Fired to our endpoint              │
│  1. checkout.session.completed                      │
│  2. customer.subscription.created                   │
│  3. invoice.payment_succeeded                       │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ BACKEND: stripe-webhook.ts                          │
│  • Verify webhook signature                         │
│  • Check idempotency (event not already processed)  │
│  • Extract subscription tier from Price ID          │
│  • UPDATE profiles SET                              │
│      subscription_tier = 'pro',                     │
│      subscription_expires_at = ...,                 │
│      stripe_customer_id = 'cus_xxx'                 │
│  • Log event to audit table                         │
│  • Return 200 OK                                    │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ FRONTEND: App.tsx (User returned)                   │
│  • Detect ?checkout=success in URL                  │
│  • Poll/retry: useAuthStore.initialize()            │
│  • Wait for subscription_tier update                │
│  • Show UpgradeSuccessModal 🎉                      │
│  • useEntitlements() now returns { plan: 'pro' }    │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Plan: 5 PRs

### PR-PAY-1: Stripe Products & Configuration ✅
**Status:** Ready to implement  
**Files:**
- NEW: `apps/web/src/config/stripe.ts`
- `packages/ui/src/PricingModal.tsx`
- `netlify/functions/stripe-webhook.ts`
- `.env.example`

**Tasks:**
- [ ] Create Stripe Products in Dashboard (Test Mode)
- [ ] Create Stripe Prices (Pro Monthly/Yearly, Team Monthly/Yearly)
- [ ] Document Price IDs in config
- [ ] Update PricingModal to import from config
- [ ] Update webhook PRICE_TO_TIER map

---

### PR-PAY-2: Checkout Session Fixes
**Status:** Blocked by PR-PAY-1  
**Files:**
- `packages/ui/src/PricingModal.tsx`
- `netlify/functions/create-checkout.ts`

**Tasks:**
- [ ] Pass user email to checkout
- [ ] Pass customerId if exists
- [ ] Add client_reference_id with Supabase user ID
- [ ] Handle unauthenticated users (redirect to sign-in)

---

### PR-PAY-3: Webhook Correctness & Idempotency
**Status:** Blocked by PR-PAY-2  
**Files:**
- `netlify/functions/stripe-webhook.ts`
- NEW: `supabase/migrations/xxx_webhook_events.sql`

**Tasks:**
- [ ] Create webhook_events audit table
- [ ] Add idempotency check (skip if event already processed)
- [ ] Use client_reference_id to find user
- [ ] Return 500 on DB errors (triggers Stripe retry)
- [ ] Enhanced logging

---

### PR-PAY-4: UI Sync & Refresh Logic
**Status:** Blocked by PR-PAY-3  
**Files:**
- `apps/web/src/App.tsx`
- `packages/ui/src/UpgradeSuccessModal.tsx`

**Tasks:**
- [ ] Add polling after checkout (3 retries, 1s apart)
- [ ] Show loading state in success modal
- [ ] Handle portal return (?portal=return)
- [ ] Refresh subscription on portal return
- [ ] Show toast on tier changes

---

### PR-PAY-5: Test Scenarios & Failure Handling
**Status:** Blocked by PR-PAY-4  
**Files:**
- `apps/web/src/App.tsx`
- `packages/ui/src/SettingsModal.tsx`
- NEW: `docs/PAYMENT_TESTING.md`

**Tasks:**
- [ ] Handle payment failures gracefully
- [ ] Handle expired sessions
- [ ] Add "Refresh Subscription" button
- [ ] Document all test scenarios
- [ ] Test with all Stripe test cards

---

## Test Scenarios

### Stripe Test Cards
| Card Number | Expiry | CVC | Result |
|-------------|--------|-----|--------|
| 4242 4242 4242 4242 | Any future | Any | ✅ Success |
| 4000 0000 0000 0002 | Any future | Any | ❌ Card declined |
| 4000 0000 0000 9995 | Any future | Any | ❌ Insufficient funds |

### Critical Path Tests

1. **Happy Path** ✅
   - Sign in → Upgrade to Pro → Enter 4242 card → Success modal → Can export GIF

2. **Payment Decline** ❌
   - Sign in → Upgrade → Enter 0002 card → See error → Can retry

3. **Cancellation** 🔁
   - Pro user → Manage Billing → Cancel → Returns to Free → GIF blocked

4. **Webhook Retry** 🔄
   - Payment succeeds → Webhook fails → Stripe retries → Eventually updates DB

---

## "Ready for Testers" Checklist

### Environment Setup
- [ ] Stripe test mode products created
- [ ] STRIPE_SECRET_KEY set in Netlify
- [ ] STRIPE_WEBHOOK_SECRET set in Netlify
- [ ] SUPABASE_SERVICE_ROLE_KEY set in Netlify
- [ ] Webhook endpoint registered in Stripe Dashboard

### Functionality
- [ ] Can upgrade from Free to Pro
- [ ] UpgradeSuccessModal appears
- [ ] UI shows Pro tier correctly
- [ ] GIF export unlocked
- [ ] Can manage billing (portal)
- [ ] Can cancel subscription
- [ ] Downgrades to Free on cancel

### Edge Cases
- [ ] Payment decline shows friendly error
- [ ] Can retry after decline
- [ ] Webhook idempotency works
- [ ] UI handles slow webhooks (race condition)
- [ ] No console errors

---

## Rollback Plan

If payments break in production:

1. **Immediate:** Disable upgrade button in PricingModal (show "Temporarily disabled")
2. **Manual:** Process refunds in Stripe Dashboard
3. **Database:** Manually update `profiles.subscription_tier` if needed
4. **Monitoring:** Check Stripe Dashboard > Webhooks for failures

---

## References

- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
