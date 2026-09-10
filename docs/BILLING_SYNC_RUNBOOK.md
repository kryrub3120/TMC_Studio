# Billing Sync Runbook

**Status:** Active  
**Last updated:** 2026-09-10  
**Applies to:** TMC Studio web production billing, Stripe Live, Supabase production

## Purpose

This runbook covers the safe diagnosis and repair of entitlement drift: Stripe
Live says a subscription is active, but `profiles.subscription_tier` in Supabase
still shows `free`.

The application UI treats Supabase `profiles.subscription_tier` as the current
plan source. Stripe is the payment source of truth, and webhooks synchronize the
result into Supabase.

## Required Production Environment

Netlify production functions need all of these variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

All Supabase variables must point to the same production project. Stripe
publishable, secret, and webhook secrets must all belong to the same Stripe Live
account and mode.

## Webhook Behavior

The Stripe webhook handler synchronizes paid access from:

- `checkout.session.completed`
- `customer.subscription.updated`
- `invoice.payment_succeeded`

Modern Stripe API responses can expose period dates on the subscription item
rather than the subscription object. The canonical period end resolution order is:

1. `subscription.items.data[0].current_period_end`
2. `subscription.current_period_end` for older API shapes
3. expanded latest invoice `period_end`
4. calculated fallback from `start_date` and the price recurring interval

Downgrade events (`customer.subscription.deleted`, `canceled`, `unpaid`) must
not immediately overwrite a paid plan if the customer still has another active
or trialing subscription. The handler checks Stripe first and synchronizes the
active subscription when one exists.

## Diagnosis

Use read-only checks first:

1. Confirm Netlify production health at `/api/health`.
2. In Supabase production, find exactly one `profiles` row by verified user id
   or email and inspect only `subscription_tier`, `subscription_expires_at`,
   `stripe_customer_id`, and `team_id`.
3. In Stripe Live, retrieve the same customer and list subscriptions.
4. Confirm the active subscription price ID maps to Pro or Team in
   `netlify/functions/_stripeConfig.ts`.
5. Check `stripe_webhook_events` for matching event IDs, `status`, timestamps,
   and any `error_message`.

Do not trust local `.env` files as proof of production state. Local development
can intentionally point to the development Supabase project.

## Safe Repair

Prefer a fixed synchronization path over manual edits. A manual profile update is
allowed only when all of these are true:

- The target Supabase profile is uniquely identified.
- The profile `stripe_customer_id` matches the Stripe Live customer.
- Stripe Live has an active or trialing subscription.
- The subscription price maps to the intended paid tier.
- The period end has been read from Stripe and recorded in UTC.

The minimal repair is limited to the verified profile row:

- Set `subscription_tier` to the mapped paid tier.
- Set `subscription_expires_at` to the Stripe subscription period end.
- Keep `stripe_customer_id` unchanged unless it is missing and the customer was
  verified by the checkout `client_reference_id` or email fallback.

Never replay old webhooks or edit multiple profiles during an emergency repair
unless the batch has a separate reviewed migration or one-off sync script.
