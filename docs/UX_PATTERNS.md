# UX Patterns

This document describes the user experience patterns used in TMC Studio, particularly around modals, upgrade flows, and limit handling.

## Core UX Principles

Every UX pattern in TMC Studio follows these rules:

1. **Context First** - Always explain WHY a modal appeared
2. **Value Clear** - Show WHAT the user gets
3. **Path Forward** - Provide clear next steps
4. **No Surprises** - Never interrupt without reason
5. **Respectful** - No dark patterns or manipulation

## Modal System

TMC Studio uses several modals for different purposes. Each has specific rules for when it can appear.

### LimitReachedModal

**Purpose:** Explain when user hits a limit and guide them to the next tier (Guest → Free or Free → Pro)

**Location:** `packages/ui/src/LimitReachedModal.tsx`

**When It Appears:**
- ✅ User tries to create a 2nd project as guest
- ✅ User tries to add 6th step as guest
- ✅ User tries to create a 4th project as free user
- ✅ User tries to add 11th step as free user

**When It Does NOT Appear:**
- ❌ On app load
- ❌ During canvas interactions
- ❌ Randomly as interruptions

**Modal Structure:**

```
┌─────────────────────────────────────┐
│  [emoji]                         [×]│
│                                     │
│  Title: "You've reached X limit"   │
│  Context: What user just did        │
│  Progress bar: X/Y                  │
│  Description: Why this matters      │
│                                     │
│  Benefits box:                      │
│  ✓ Benefit 1                        │
│  ✓ Benefit 2                        │
│  ✓ Benefit 3                        │
│                                     │
│  [Primary CTA]                      │
│  [Compare plans]                    │
│                                     │
│  Microcopy: "Free stays free..."    │
└─────────────────────────────────────┘
```

**Content Patterns:**

| Type | Emoji | Title | Primary CTA | Triggers |
|------|-------|-------|-------------|----------|
| **guest-step** | 🚀 | "You've reached the Guest limit" | "Continue for free" | Opens AuthModal |
| **guest-project** | 🚀 | "You've reached the Guest limit" | "Continue for free" | Opens AuthModal |
| **free-step** | ⭐ | "Free plan limit reached" | "Upgrade to Pro" | Opens PricingModal |
| **free-project** | ⭐ | "Free plan limit reached" | "Upgrade to Pro" | Opens PricingModal |

**Key Features:**
1. **Micro-context:** Explicitly states what user just did
   - ✅ "You've added 5 steps—that's the Guest limit."
   - ❌ "You've hit a limit."

2. **Progress indicator:** Visual bar showing X/Y
   - Shows how close user is to limit
   - Provides concrete numbers

3. **Benefits box:** What they get from upgrading
   - Guest → Free: Cloud sync, more projects/steps
   - Free → Pro: Unlimited everything, advanced exports

4. **Reassuring microcopy:**
   - "Free stays free forever. No credit card required."
   - Reduces anxiety about signing up

**Implementation Example:**
```typescript
// When user tries to add step beyond limit
const handleAddStep = () => {
  const canAdd = can('addStep', { stepCount: steps.length });
  
  if (canAdd === 'hard-block') {
    setLimitReachedModal({
      open: true,
      type: isGuest ? 'guest-step' : 'free-step',
      currentCount: steps.length,
      maxCount: isGuest ? 5 : 10,
    });
    return; // Don't add the step
  }
  
  // Proceed with adding step
  addStep();
};
```

---

### AuthModal

**Purpose:** Allow users to sign in or create a free account

**Location:** `packages/ui/src/AuthModal.tsx`

**When It Appears:**
- ✅ User clicks "Sign In" in menu
- ✅ User hits a guest limit and clicks "Continue for free"
- ✅ User tries to use cloud sync as guest

**When It Does NOT Appear:**
- ❌ On app load
- ❌ Automatically after timeout
- ❌ As an interruption during work

**Key Messaging:**

| Context | Header | Subheader |
|---------|--------|-----------|
| **Default** | "Continue for free" | "Sign in to save your work and unlock the Free plan." |
| **From limit** | "Continue for free" | "Sign in to save your work and unlock the Free plan." |

**Design Decisions:**
1. **"Continue for free"** - Not "Sign Up" or "Register"
   - Removes payment anxiety
   - Emphasizes free tier is default

2. **Google OAuth first** - Reduces friction
   - One-click sign-in
   - No password to remember

3. **Clear free messaging** - "Free stays free forever. No credit card required."
   - Addresses common objections upfront

4. **Mode switching** - Login ↔ Register in same modal
   - No new page loads
   - Smooth experience

**Flow:**
```
Guest hits limit
  ↓
LimitReachedModal appears
  ↓
User clicks "Continue for free"
  ↓
AuthModal opens (mode: register)
  ↓
User signs up
  ↓
Modal closes
  ↓
Plan changes to 'free'
  ↓
User can now proceed
```

---

### PricingModal

**Purpose:** Show pricing plans and allow upgrade to Pro

**Location:** `packages/ui/src/PricingModal.tsx`

**When It Appears:**
- ✅ User clicks "Pricing" or "Compare plans" link
- ✅ User tries to use a Pro feature (GIF/PDF export)
- ✅ User hits a Free plan limit and clicks "Upgrade"

**When It Does NOT Appear:**
- ❌ On app load
- ❌ Periodically as a reminder
- ❌ When user hasn't tried to do something

**Content Structure:**

```
┌─────────────────────────────────────────────┐
│  Choose Your Plan                        [×]│
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Free    │  │   Pro    │  │  Team    │ │
│  │  $0/mo   │  │  $X/mo   │  │  $Y/mo   │ │
│  │          │  │          │  │          │ │
│  │ ✓ 3 proj │  │ ✓ Unlim. │  │ ✓ Unlim. │ │
│  │ ✓ 10 stp │  │ ✓ Unlim. │  │ ✓ Unlim. │ │
│  │ ✓ PNG    │  │ ✓ GIF/PDF│  │ ✓ GIF/PDF│ │
│  │          │  │          │  │ ✓ Team   │ │
│  │          │  │          │  │          │ │
│  │[Current] │  │[Upgrade] │  │[Contact] │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────┘
```

**Pricing Copy Rules:**

1. **Free is prominent** - Not hidden or de-emphasized
2. **Concrete limits** - "3 projects" not "Limited projects"
3. **Value-focused** - "Unlimited" not "Remove restrictions"
4. **No fake urgency** - Never "Limited time offer!"
5. **Honest team messaging** - "Coming soon" if not ready

**CTA Hierarchy:**

| User Plan | Free CTA | Pro CTA | Team CTA |
|-----------|----------|---------|----------|
| **Guest** | "Continue for free" | "Start Pro trial" | "Contact us" |
| **Free** | "Current plan" | "Upgrade to Pro" | "Contact us" |
| **Pro** | "Downgrade" | "Current plan" | "Upgrade to Team" |

**Design Decisions:**
1. **Show all three plans** - Even if user is free, show guest option
   - Transparency builds trust
   - User can see full journey

2. **Highlight current plan** - Clear visual indicator
   - User knows where they are

3. **Easy downgrade** - Same prominence as upgrade
   - No dark pattern hiding downgrades

---

### UpgradeSuccessModal

**Purpose:** Confirm successful upgrade and celebrate user's decision

**Location:** `packages/ui/src/UpgradeSuccessModal.tsx`

**When It Appears:**
- ✅ Immediately after successful Stripe checkout
- ✅ After webhook confirms subscription

**Content:**
```
┌─────────────────────────────────────┐
│               🎉                    │
│                                     │
│    Welcome to TMC Studio Pro!       │
│                                     │
│  You now have:                      │
│  ✓ Unlimited projects               │
│  ✓ Unlimited steps                  │
│  ✓ GIF & PDF export                 │
│  ✓ Priority support                 │
│                                     │
│  [Get started]                      │
└─────────────────────────────────────┘
```

**Purpose:**
1. **Positive reinforcement** - Celebrate the upgrade
2. **Reminder of benefits** - What they just unlocked
3. **Clear next step** - Guide back to product

---

### SettingsModal

**Purpose:** Allow users to manage account and preferences

**Location:** `packages/ui/src/SettingsModal.tsx`

**Plan-Aware Features:**

| Setting | Guest | Free | Pro |
|---------|-------|------|-----|
| **Theme toggle** | ✅ | ✅ | ✅ |
| **Account info** | ❌ | ✅ | ✅ |
| **Manage subscription** | ❌ | ❌ | ✅ |
| **Keyboard shortcuts** | ✅ | ✅ | ✅ |

**Design Decisions:**
1. **Show plan badge** - User sees their current plan
2. **Upgrade CTA if not Pro** - Contextual, not aggressive
3. **Stripe portal link** - Easy subscription management
4. **Logout always available** - No lock-in

---

## Toast Notifications

**Purpose:** Lightweight, non-blocking feedback

**When to Use:**
- ✅ Action confirmation ("Project saved")
- ✅ Soft-prompt limit warnings ("9/10 steps used")
- ✅ Feature gating ("GIF export is a Pro feature ⭐")
- ✅ Error feedback ("Export failed")

**When NOT to Use:**
- ❌ Critical errors (use modal)
- ❌ Hard limits (use LimitReachedModal)
- ❌ Complex information

**Toast Patterns:**

| Situation | Toast Message | Follow-up Action |
|-----------|--------------|------------------|
| **Soft-prompt step** | "You have X/10 steps. Upgrade to Pro for unlimited!" | None (allow action) |
| **Pro feature tried** | "GIF export is a Pro feature ⭐" | Open PricingModal |
| **Save success** | "Project saved ✓" | None |
| **Export success** | "PNG exported ✓" | None |
| **Error** | "Export failed - check console ❌" | None |

---

## Upgrade Flow Patterns

### Pattern 1: Guest Hits Limit

```
User: Adds 6th step
  ↓
App: can('addStep', { stepCount: 5 }) → 'hard-block'
  ↓
UI: Show LimitReachedModal (guest-step, 5/5)
  ↓
User: Clicks "Continue for free"
  ↓
UI: Show AuthModal
  ↓
User: Signs up
  ↓
App: Plan changes to 'free'
  ↓
UI: Close modals, user can now add up to 10 steps
  ↓
Toast: "Welcome! You now have 10 steps per project ✓"
```

### Pattern 2: Free User Tries Pro Feature

```
User: Clicks "Export GIF"
  ↓
App: can('exportGIF') → 'hard-block'
  ↓
UI: Show PricingModal + Toast "GIF export is a Pro feature ⭐"
  ↓
User: Clicks "Upgrade to Pro"
  ↓
App: Redirect to Stripe Checkout
  ↓
User: Completes payment
  ↓
Webhook: Updates user.subscription_tier = 'pro'
  ↓
App: Plan changes to 'pro'
  ↓
UI: Show UpgradeSuccessModal
  ↓
User: Clicks "Get started"
  ↓
UI: Close modal, user can now export GIF
```

### Pattern 3: Free User Approaching Limit

```
User: Adds 9th step (at soft-prompt threshold)
  ↓
App: can('addStep', { stepCount: 9 }) → 'soft-prompt'
  ↓
UI: Toast "You have 9/10 steps. Upgrade to Pro for unlimited!"
  ↓
App: Add the step anyway (soft-prompt allows action)
  ↓
User: Continues working
  ↓
[Later] User: Tries to add 11th step
  ↓
App: can('addStep', { stepCount: 10 }) → 'hard-block'
  ↓
UI: Show LimitReachedModal (free-step, 10/10)
```

---

## CTA Copy Guidelines

### Primary CTAs

| Context | ✅ Good | ❌ Bad |
|---------|--------|-------|
| **Guest → Free** | "Continue for free" | "Sign up", "Get started" |
| **Free → Pro** | "Upgrade to Pro" | "Go Pro!", "Unlock now!" |
| **See pricing** | "Compare plans" | "Pricing", "See prices" |
| **After limit** | "Create free account" | "Sign up to continue" |

### Secondary CTAs

| Context | ✅ Good | ❌ Bad |
|---------|--------|-------|
| **Pricing link** | "Compare plans" | "View pricing" |
| **Close modal** | [X] icon | "No thanks", "Maybe later" |
| **Learn more** | "Compare plans" | "Learn more" |

### Microcopy

| Context | ✅ Good | ❌ Bad |
|---------|--------|-------|
| **Below signup** | "Free stays free forever. No credit card required." | "No credit card needed" |
| **Below upgrade** | "Cancel anytime. No questions asked." | "Cancel anytime" |
| **Limit context** | "You've added 5 steps—that's the Guest limit." | "Limit reached" |

---

## Anti-Patterns to Avoid

### ❌ Modal on App Load
```typescript
// NEVER DO THIS
useEffect(() => {
  if (!isAuthenticated) {
    setAuthModalOpen(true); // Interrupts user immediately
  }
}, []);
```

### ❌ Aggressive Upsell
```typescript
// NEVER DO THIS
useEffect(() => {
  const timer = setInterval(() => {
    if (!isPro) {
      setPricingModalOpen(true); // Random interruptions
    }
  }, 60000); // Every minute!
}, []);
```

### ❌ Hidden Free Plan
```jsx
// NEVER DO THIS
{!isGuest && (
  <PricingModal showPlans={['pro', 'team']} /> // Hides free option
)}
```

### ❌ Guilt-Trip Copy
```jsx
// NEVER DO THIS
<p>You're missing out on Pro features!</p> // Feature-shaming
<p>Only 2 spots left at this price!</p> // Fake urgency
<p>Don't let your competition pass you!</p> // Fear-mongering
```

---

## Testing UX Patterns

### Manual Test Checklist

**Guest Limits:**
- [ ] Add 5th step → soft-prompt toast?
- [ ] Add 6th step → LimitReachedModal appears?
- [ ] Modal explains what happened and why?
- [ ] "Continue for free" → opens AuthModal?
- [ ] After signup → plan becomes 'free'?

**Free Limits:**
- [ ] Add 9th step → soft-prompt toast?
- [ ] Add 10th step → can still add?
- [ ] Add 11th step → LimitReachedModal appears?
- [ ] Modal shows 10/10 progress?

**Pro Features:**
- [ ] Click export GIF as free → PricingModal?
- [ ] Toast explains it's a Pro feature?
- [ ] After upgrade → can export GIF?

**Modal Behavior:**
- [ ] NO modals on app load?
- [ ] All modals have close button?
- [ ] All modals explain WHY they appeared?
- [ ] Backdrop click closes modal?

---

## Related Documentation

- **Product Philosophy:** See `docs/PRODUCT_PHILOSOPHY.md` for principles
- **Entitlements:** See `docs/ENTITLEMENTS.md` for permission logic
- **Monetization Plan:** See `docs/MONETIZATION_PLAN.md` for business context

---

**Remember:** UX patterns exist to guide users through value discovery, not to manipulate them into paying. Every modal should answer "Why am I seeing this?" and "What should I do next?"
