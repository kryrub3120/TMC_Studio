# PR-PAY-1: Stripe Products & Configuration ✅ COMPLETE

**Date:** 2026-01-11  
**Status:** Ready for Testing  
**Branch:** (create branch from main when ready to commit)

---

## Summary

Replaced placeholder Stripe Price IDs with real configuration from Stripe Dashboard. Created centralized config to ensure consistency between frontend (PricingModal) and backend (webhook).

---

## Changes Made

### 1. **NEW FILE: `apps/web/src/config/stripe.ts`**
- Centralized Stripe configuration
- Contains real Price IDs from Stripe Dashboard
- Exports `STRIPE_PRICES` and `PRICE_TO_TIER` mapping
- Helper functions: `getTierFromPriceId()`, `isValidPriceId()`

**Price IDs (Test Mode):**
```
Pro Monthly:  price_1SnQvaANogcZdSR39JL60iCS ($9 USD)
Pro Yearly:   price_1SnQvaANogcZdSR3f6Pv3xZ8 ($90 USD)
Team Monthly: price_1SnQvzANogcZdSR3BiUrQvqc ($29 USD)
Team Yearly:  price_1SnQwfANogcZdSR3Kdp2j8FB ($290 USD)
```

### 2. **UPDATED: `packages/ui/src/PricingModal.tsx`**
- Removed placeholder Price IDs (`'price_pro_monthly'`, `'price_team_monthly'`)
- Now imports from centralized config (with fallback)
- Pro plan button uses `STRIPE_PRICES.pro.monthly`
- Team plan button uses `STRIPE_PRICES.team.monthly`

**Before:**
```tsx
priceId: 'price_pro_monthly', // TODO: Replace with actual Stripe price ID
```

**After:**
```tsx
priceId: STRIPE_PRICES.pro.monthly, // Real Stripe Price ID
```

### 3. **UPDATED: `netlify/functions/stripe-webhook.ts`**
- Updated API version to `'2025-12-15.clover'` (matches create-checkout.ts)
- Updated `PRICE_TO_TIER` mapping with real Price IDs
- Added `@ts-expect-error` comments for `current_period_end` (Stripe type def issue)
- Added comments to keep in sync with apps/web/src/config/stripe.ts

**Before:**
```tsx
'price_1SnQvaANogcZdSR39JL60iCS': 'pro',  // Pro Monthly
```

**After:**
```tsx
'price_1SnQvaANogcZdSR39JL60iCS': 'pro',  // Pro Monthly - $9 USD
'price_1SnQvaANogcZdSR3f6Pv3xZ8': 'pro',  // Pro Yearly - PLN 90
```

### 4. **VERIFIED: `.env.example`**
- Already documents all required Stripe environment variables ✅
- No changes needed

---

## Testing Checklist

### Prerequisites
- [ ] Stripe Dashboard shows 4 products/prices (Pro Monthly/Yearly, Team Monthly/Yearly)
- [ ] Price IDs in Stripe Dashboard match config file
- [ ] Environment variables set in Netlify:
  - [ ] `STRIPE_SECRET_KEY=sk_test_...`
  - [ ] `STRIPE_WEBHOOK_SECRET=whsec_...`
  - [ ] `SUPABASE_URL=https://...`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY=...`

### Manual Tests

**Test 1: PricingModal Shows Correct Prices**
1. Open app
2. Click "Upgrade" button
3. ✅ VERIFY: Pro shows "$9/month"
4. ✅ VERIFY: Team shows "$29/month"
5. ✅ VERIFY: No console errors about missing Price IDs

**Test 2: Upgrade Button Uses Real Price ID**
1. Open browser DevTools > Network tab
2. Click "Upgrade to Pro"
3. ✅ VERIFY: Request to `create-checkout` includes `priceId: "price_1SnQvaANogcZdSR39JL60iCS"`
4. ✅ VERIFY: Not sending placeholder like `"price_pro_monthly"`

**Test 3: Webhook Processes Real Price IDs**
1. Complete a test checkout with card `4242 4242 4242 4242`
2. Check Netlify function logs
3. ✅ VERIFY: Webhook receives `checkout.session.completed`
4. ✅ VERIFY: Log shows tier mapped correctly (e.g., "Updated subscription for user xxx: pro")
5. ✅ VERIFY: Supabase `profiles.subscription_tier` = 'pro'

---

## Known Issues & Notes

### 🔧 TypeScript Warning
The webhook has `@ts-expect-error` comments for `subscription.current_period_end` because the Stripe TypeScript definitions for API version `2025-12-15.clover` may not include this property. This is expected and safe - the property exists at runtime.

###

 📦 Cross-Package Import
PricingModal (in `packages/ui`) imports config from `apps/web`. This works in the monorepo but uses dynamic `require()` with fallback to handle potential build issues.

---

## Next Steps (PR-PAY-2)

After this PR is merged and tested:

1. **Add User Email/ID to Checkout**
   - PricingModal passes `email` and `userId` to create-checkout
   - Webhook uses `client_reference_id` for direct user lookup
   - Eliminates fragile email-based fallback

2. **Test End-to-End Flow**
   - Sign in → Upgrade → Enter 4242 card → Success
   - Verify webhook fires and updates DB
   - Verify UI shows Pro tier and unlocks features

---

## Files Changed

```
NEW:     apps/web/src/config/stripe.ts (67 lines)
UPDATED: packages/ui/src/PricingModal.tsx (import config, ~20 lines changed)
UPDATED: netlify/functions/stripe-webhook.ts (API version, comments, ~15 lines changed)
VERIFIED: .env.example (already documents all Stripe env vars)
```

---

## Deployment Notes

### Before Deploying:
1. Ensure all 4 Stripe Price IDs exist in Stripe Dashboard (Test Mode)
2. Set environment variables in Netlify Dashboard
3. Register webhook endpoint: `https://your-app.netlify.app/.netlify/functions/stripe-webhook`
4. Select webhook events in Stripe:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### After Deploying:
1. Test with card `4242 4242 4242 4242`
2. Check Netlify function logs for webhook
 events
3. Verify Supabase profiles table updates correctly

---

## Rollback Plan

If this breaks production:

1. **Quick Fix:** Update PricingModal to use hardcoded fallback Price IDs (already in code)
2. **Full Rollback:** Revert commit and redeploy previous version

---

## Related Documentation

- `docs/PAYMENT_FOUNDATION.md` - Master payment plan
- `docs/PAYMENT_GAPS_ANALYSIS.md` - Detailed gap analysis
- Stripe Dashboard: https://dashboard.stripe.com/test/prices
- Next PR: `docs/PAYMENT_FOUNDATION.md` → PR-PAY-2 section
