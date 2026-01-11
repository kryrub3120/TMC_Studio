# TMC Studio — Monetization & Entitlement Plan
## Version 1.0 | January 2026

---

## Overview

This document defines the **single source of truth** for TMC Studio's monetization strategy, entitlements, and implementation roadmap.

**Core Philosophy:**
- Product-led growth: Show value first, monetize later
- Guest Mode First: No login required to use the product
- Truthful pricing: Only advertise features that exist
- Incremental implementation: Ship PRs in safe order

---

## 1. Plan Types

| Plan | Description | Storage |
|------|-------------|---------|
| **Guest** | No account, browser-only | Local (browser) |
| **Free** | Authenticated, limited | Cloud (Supabase) |
| **Pro** ($9/mo) | Unlimited individual | Cloud (Supabase) |
| **Team** ($29/mo) | Multi-seat, centralized billing | Cloud (Supabase) |

---

## 2. Final Entitlement Matrix (TRUTHFUL)

| Feature | Guest | Free | Pro | Team |
|---------|-------|------|-----|------|
| **Projects** | 1 local | 3 cloud | Unlimited | Unlimited |
| **Cloud sync** | ✗ | ✓ | ✓ | ✓ |
| **PNG export** | ✓ | ✓ | ✓ | ✓ |
| **GIF export** | ✗ | ✗ | ✓ | ✓ |
| **PDF export** | ✗ | ✗ | ✓ | ✓ |
| **Steps/project** | 5 | 10 | Unlimited | Unlimited |
| **Folders** | ✗ | 3 | Unlimited | Unlimited |
| **Team seats** | — | — | — | 5 included |
| **Priority support** | ✗ | ✗ | ✓ | ✓ |

---

## 3. Implementation Status

### ✅ DONE (no gating)
- PNG export
- GIF export (works for all, needs gating)
- PDF export (works for all, needs gating)
- Cloud sync (for authenticated users)

### ✅ ENFORCED
- Export gating (GIF/PDF for Pro+) - PR-MON-EXPORT complete
- Project limits (Guest: 1, Free: 3, Pro/Team: unlimited) - PR-MON-PROJECT-LIMITS complete
- Step limits (Guest: 5, Free: 10, Pro/Team: unlimited) - PR-MON-STEP-LIMITS complete

### 🚧 NEEDS ENFORCEMENT
- Folder limits (3 for Free)

### ❌ NOT IMPLEMENTED (removed from copy)
- Analytics dashboard
- API access
- Team branding
- Shared project library (future)
- Team templates

---

## 4. Pricing Modal Copy

### IMPORTANT: Guest vs Free Distinction

**Guest** (not authenticated):
- Has currentPlan = 'guest'
- Sees Free button as "Create Free Account" (calls onSignUp)
- Does NOT have cloud sync until they sign up

**Free** (authenticated with free account):
- Has currentPlan = 'free'
- Sees Free button as "Current Plan" (disabled)

### Free ($0/forever)
```
- Up to 3 projects
- Cloud sync & backup
- PNG export
- Organize with folders
```

**Note:** "Organize with folders" feature must exist before shipping. If folders are not implemented, remove from copy.

### Pro ($9/month) — Most Popular
```
- Unlimited projects
- GIF & PDF export
- Unlimited steps
- Priority support
```

### Team ($29/month)
```
- Everything in Pro
- 5 team member seats
- Centralized billing
- Coming: Shared library
```

### Footer Legal Copy
**UPDATED (removed risky promises):**
```
Cancel anytime. Questions? Contact support.
```

**REMOVED (unverified legal promise):**
```
❌ "All plans include 14-day money-back guarantee"
```
This was removed because we don't have a refund policy or process in place. Only promise what we can deliver.

---

## 5. Features NOT to Advertise

| Feature | Reason |
|---------|--------|
| Analytics dashboard | Not implemented, no plans |
| API access | Not implemented, no plans |
| Team branding | Not implemented |
| All pitch styles | Not gated, everyone has access |
| Team templates | Not implemented |

---

## 6. Upgrade Triggers

### When to Show Prompts

| Trigger | For | Target Tier | Prompt Type |
|---------|-----|-------------|-------------|
| 2nd project attempt | Guest | Free | "Sign up free" |
| GIF/PDF export click | Guest/Free | Pro | Inline: "Pro feature" |
| 4th project attempt | Free | Pro | Modal: "Upgrade for unlimited" |
| 11th step attempt | Free | Pro | Toast: "Upgrade for more steps" |
| "Upgrade" button | Any | Pro/Team | Pricing modal |

### When NOT to Interrupt

- First app load
- During active drawing
- During animation playback
- During export in progress
- Immediately after signup

---

## 7. PR Roadmap

### Execution Order

```
PR-MON-COPY (copy only, no logic)     ← CURRENT
    ↓
PR-MON-CORE (entitlements lib)
    ↓
PR-MON-EXPORT (gate GIF/PDF)
    ↓
PR-MON-PROJECT-LIMITS (3 for Free)
    ↓
[optional] PR-MON-STEP-LIMITS
    ↓
[future] PR-MON-TEAM-MVP
```

### PR Details

| PR | Scope | Risk | Effort |
|----|-------|------|--------|
| PR-MON-COPY | Fix pricing text only | Very Low | 1 hour |
| PR-MON-CORE | Create entitlements.ts, useEntitlements.ts | Low | 2-3 hours |
| PR-MON-EXPORT | Disable GIF/PDF for non-Pro | Low | 2-3 hours |
| PR-MON-PROJECT-LIMITS | Enforce 3 projects for Free | Medium | 3-4 hours |
| PR-MON-STEP-LIMITS | Enforce 10 steps for Free | Low | 2 hours |
| PR-MON-TEAM-MVP | Seats, invites, billing | High | 2-3 days |

---

## 8. Team Plan — Staged Approach

### Team MVP (minimum sellable)
- Team owner creates team
- 5 seats included
- Email invitations
- Member management
- Centralized Stripe billing
- Per-member individual projects

### Team v2 (future)
- Shared project library
- Transfer projects to team
- Admin role

### NOT Building
- Real-time collaboration
- Analytics dashboard
- API access
- Team branding
- Custom domains
- SSO/SAML
- Role-based permissions

---

## 9. Data Model (Team MVP)

```sql
-- teams
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  stripe_subscription_id TEXT,
  max_seats INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- team_memberships
CREATE TABLE team_memberships (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  UNIQUE(team_id, user_id)
);

-- team_invitations
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);
```

---

## 10. Stripe Configuration

### Price IDs (TO BE CREATED)
- Pro Monthly: `price_pro_monthly_live`
- Pro Yearly: `price_pro_yearly_live`
- Team Monthly: `price_team_monthly_live`
- Team Yearly: `price_team_yearly_live`

**Note:** Current price IDs in code are placeholders and must be replaced with real Stripe IDs.

---

## 10. Entitlements Implementation

### Where the entitlements live

**Core Infrastructure:**
- **`apps/web/src/lib/entitlements.ts`** - Types, constants, and helper functions
  - `Plan` type: `'guest' | 'free' | 'pro' | 'team'`
  - `Entitlements` interface with all feature flags
  - `ENTITLEMENTS_BY_PLAN` - Canonical mapping (single source of truth)
  - `getEntitlements(plan)` - Retrieve entitlements for a plan
  - `derivePlan(isAuth, subscriptionTier)` - Derive plan from auth state
  - `can(plan, action, context?)` - Permission checker with soft/hard blocking
  
- **`apps/web/src/hooks/useEntitlements.ts`** - React hook
  - Reads from `useAuthStore` (existing auth state)
  - Returns: `{ plan, entitlements, can, isGuest, isPro, isTeam }`
  - Optimized with `useMemo` for stable references

### How to use `useEntitlements()`

```tsx
import { useEntitlements } from '@/hooks/useEntitlements';

function ExportButtons() {
  const { plan, can, isPro } = useEntitlements();
  
  // Check if user can export GIF (PR-MON-EXPORT)
  const canExportGIF = can('exportGIF');
  // Returns: true | 'soft-prompt' | 'hard-block'
  
  if (canExportGIF === 'hard-block') {
    // Show upgrade prompt or disable button
  }
  
  // Check project limit with context (PR-MON-PROJECT-LIMITS)
  const canCreateProject = can('createProject', { projectCount: 2 });
  
  // Convenience flags
  if (isPro) {
    // Pro/Team features
  }
}
```

### Plan Derivation Logic

```typescript
// Guest = not authenticated
if (!isAuthenticated) return 'guest';

// Free = authenticated with no subscription
if (isAuthenticated && !subscriptionTier) return 'free';

// Pro/Team = subscription tier from Stripe webhook → profiles.subscription_tier
return subscriptionTier; // 'pro' | 'team'
```

### Status: PR-MON-CORE (✅ Complete)

**What was added:**
- ✅ Entitlements types and constants
- ✅ Permission checking infrastructure
- ✅ `useEntitlements()` hook exported

**What was NOT added (by design):**
- ❌ No UI behavior changes
- ❌ No button disabling or gating yet
- ❌ Hook is exported but NOT consumed by UI components

### Enforcement PRs (Future)

| PR | Scope | Uses |
|----|-------|------|
| **PR-MON-EXPORT** | Gate GIF/PDF export buttons | `can('exportGIF')`, `can('exportPDF')` |
| **PR-MON-PROJECT-LIMITS** | Enforce 3-project limit for Free | `can('createProject', { projectCount })` |
| **PR-MON-STEP-LIMITS** | Enforce 10-step limit for Free | `can('addStep', { stepCount })` |

---

## 11. Upgrade Nudges (UX-only)

### Implemented (PR-MON-UPGRADE-NUDGE)

**✅ Settings Modal Upgrade Card (Free users)**
- Location: Settings → Billing tab
- Shown: Only for Free users
- Content: "You're on Free — Upgrade to Pro for more"
- Lists: Unlimited projects, unlimited steps, GIF & PDF export, priority support
- CTA: "Upgrade to Pro →" button
- Dismissible: User can close settings or navigate away
- Non-intrusive: Only shown when user explicitly opens Settings

### Status
- ✅ Core conversion UX complete (Settings upgrade card)
- ✅ No new gating added
- ✅ No behavior regressions
- ✅ Uses existing PricingModal

### Future Enhancements (Optional)
- Passive inline reminders when approaching limits (session-only)
- Guest signup nudge after meaningful usage (≥3 steps, ≥3 minutes)
- These are low-priority as core gating already shows appropriate prompts

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-11 | Initial plan created | AI + KR |
| 2026-01-11 | Added Section 10: Entitlements Implementation (PR-MON-CORE) | AI + KR |
| 2026-01-11 | Added Section 11: Upgrade Nudges (PR-MON-UPGRADE-NUDGE) | AI + KR |
