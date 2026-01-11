# Current Task: PR-MON-COPY

## Status: 🚧 IN PROGRESS

---

## What We're Doing

**PR-MON-COPY**: Fix pricing modal copy to remove false promises and align with actual product capabilities.

---

## Scope

- [x] Create MONETIZATION_PLAN.md (source of truth)
- [x] Update `PricingModal.tsx` — fix tier copy + guest support
- [x] Update `UpgradeSuccessModal.tsx` — fix feature lists
- [x] Fix guest vs free distinction (currentPlan type)
- [x] Remove risky legal promises (14-day guarantee)
- [ ] Verify no other files reference false features

---

## Changes Implemented

### ✅ PricingModal.tsx

**CRITICAL FIX: Guest vs Free Distinction**
- ✅ Updated `currentPlan` type: `'guest' | 'free' | 'pro' | 'team'`
- ✅ Dynamic CTA: Guest sees "Create Free Account", Free sees "Current Plan"
- ✅ Free button for guests calls `onSignUp()` to start signup flow

**CRITICAL FIX: Footer Legal**
- ✅ Removed "14-day money-back guarantee" (no refund policy in place)
- ✅ Changed to: "Cancel anytime. Questions? Contact support."

### Original PricingModal.tsx Changes

**Free tier — REMOVE:**
- "Local save only" (Free users get cloud sync)
- "Basic pitch customization" (not gated)

**Free tier — UPDATE TO:**
- Up to 3 projects
- Cloud sync & backup
- PNG export
- Organize with folders

**Pro tier — REMOVE:**
- "Team templates" (not implemented)
- "All pitch styles & sports" (not gated)

**Pro tier — UPDATE TO:**
- Unlimited projects
- GIF & PDF export
- Unlimited steps
- Priority support

**Team tier — REMOVE:**
- "Analytics dashboard" (not implemented)
- "API access" (not implemented)
- "Team branding" (not implemented)
- "Shared project library" (not implemented — mark as "Coming Soon")

**Team tier — UPDATE TO:**
- Everything in Pro
- 5 team member seats
- Centralized billing
- Coming: Shared library

### UpgradeSuccessModal.tsx

**Pro features — REMOVE:**
- "All pitch styles" (not gated)

**Pro features — KEEP:**
- Export animated GIFs ✓
- Export multi-page PDFs ✓
- Unlimited cloud sync ✓
- Unlimited projects ✓

**Team features — REMOVE:**
- "Team branding" (not implemented)
- "Analytics dashboard" (not implemented)
- "API access" (not implemented)

**Team features — UPDATE TO:**
- Up to 5 team members
- Shared project library → "Coming: Shared library"
- Everything in Pro

---

## Source of Truth

See: `docs/MONETIZATION_PLAN.md`

---

## After This PR

Next: **PR-MON-CORE** — Create entitlements system (`lib/entitlements.ts`)

---

## Monetization PR Roadmap

| PR | Status | Description |
|----|--------|-------------|
| PR-MON-COPY | 🚧 IN PROGRESS | Fix pricing text |
| PR-MON-CORE | ⏳ NEXT | Entitlements system |
| PR-MON-EXPORT | ⏳ PLANNED | Gate GIF/PDF exports |
| PR-MON-PROJECT-LIMITS | ⏳ PLANNED | Enforce project limits |
| PR-MON-TEAM-MVP | ⏳ FUTURE | Team seats & invites |
