# Entitlements System

This document explains how TMC Studio's entitlements and permission system works. This is technical documentation for developers.

## Overview

The entitlements system controls **who can do what** based on their subscription plan. It provides a centralized, type-safe way to check permissions throughout the application.

**Location:** `apps/web/src/lib/entitlements.ts`

## Plan Types

TMC Studio has four plan types:

```typescript
type Plan = 'guest' | 'free' | 'pro' | 'team';
```

### Plan Hierarchy

| Plan | Authentication | Subscription Tier | Description |
|------|---------------|-------------------|-------------|
| **Guest** | ❌ No account | N/A | Anonymous user, local-only storage |
| **Free** | ✅ Authenticated | `free` | Default plan after account creation |
| **Pro** | ✅ Authenticated | `pro` | Paid individual plan |
| **Team** | ✅ Authenticated | `team` | Paid team plan (future) |

**Plan Derivation Logic:**
```typescript
function derivePlan(isAuthenticated: boolean, subscriptionTier?: 'free' | 'pro' | 'team'): Plan {
  if (!isAuthenticated) return 'guest';
  return subscriptionTier ?? 'free';
}
```

## Entitlements Matrix

Each plan has a specific set of entitlements:

| Entitlement | Guest | Free | Pro | Team |
|-------------|-------|------|-----|------|
| **Max Projects** | 1 | 3 | ∞ | ∞ |
| **Max Steps/Project** | 5 | 10 | ∞ | ∞ |
| **Max Folders** | 0 | 3 | ∞ | ∞ |
| **Cloud Sync** | ❌ | ✅ | ✅ | ✅ |
| **Export PNG** | ✅ | ✅ | ✅ | ✅ |
| **Export GIF** | ❌ | ❌ | ✅ | ✅ |
| **Export PDF** | ❌ | ❌ | ✅ | ✅ |
| **Team Features** | ❌ | ❌ | ❌ | ✅ |

**Source of Truth:** `ENTITLEMENTS_BY_PLAN` object in `entitlements.ts`

## Permission Checking: `can()`

The core function for checking permissions is `can()`:

```typescript
function can(
  plan: Plan,
  action: EntitledAction,
  context?: { projectCount?: number; stepCount?: number; folderCount?: number }
): CanResult
```

### Return Values

The `can()` function returns one of three values:

```typescript
type CanResult = boolean | 'soft-prompt' | 'hard-block';
```

| Return Value | Meaning | UI Behavior |
|--------------|---------|-------------|
| `true` | ✅ **Allowed** | Perform action normally |
| `'soft-prompt'` | ⚠️ **Approaching limit** | Show upgrade hint, but allow action |
| `'hard-block'` | 🚫 **Not allowed** | Prevent action, show limit modal |

### When to Use Each

#### `true` - Allowed
- User has the feature in their plan
- User hasn't hit a limit
- Action can proceed normally

**Example:**
```typescript
const canExport = can('pro', 'exportGIF'); // true
// → User can export GIF, show export button as enabled
```

#### `'soft-prompt'` - Approaching Limit
- User is **one away** from hitting a limit
- We want to give them a heads-up
- They can still perform the action this time

**Example:**
```typescript
const canAdd = can('free', 'addStep', { stepCount: 9 }); // 'soft-prompt'
// → Show toast: "You have 9/10 steps. Upgrade to Pro for unlimited!"
// → Still allow adding the step
```

#### `'hard-block'` - Not Allowed
- User has hit a hard limit
- Feature is not in their plan
- Must prevent the action

**Example:**
```typescript
const canAdd = can('guest', 'addStep', { stepCount: 5 }); // 'hard-block'
// → Show LimitReachedModal (guest-step, 5/5)
// → Do NOT add the step
```

## Entitled Actions

```typescript
type EntitledAction =
  | 'createProject'
  | 'exportPNG'
  | 'exportGIF'
  | 'exportPDF'
  | 'addStep'
  | 'createFolder'
  | 'syncToCloud'
  | 'inviteMember';
```

### Action Details

#### Limit-Based Actions (with context)

These actions check against numeric limits and support soft-prompts:

**`createProject`**
- Requires: `{ projectCount: number }`
- Guest: hard-block at 1 project
- Free: soft-prompt at 2, hard-block at 3 projects
- Pro/Team: always true

**`addStep`**
- Requires: `{ stepCount: number }`
- Guest: soft-prompt at 4, hard-block at 5 steps
- Free: soft-prompt at 9, hard-block at 10 steps
- Pro/Team: always true

**`createFolder`**
- Requires: `{ folderCount: number }`
- Guest: hard-block at 0 (no folders)
- Free: hard-block at 3 folders
- Pro/Team: always true

#### Feature-Based Actions (no context)

These actions are simple on/off based on plan:

**`exportPNG`**
- All plans: true

**`exportGIF`**
- Guest/Free: 'hard-block'
- Pro/Team: true

**`exportPDF`**
- Guest/Free: 'hard-block'
- Pro/Team: true

**`syncToCloud`**
- Guest: 'hard-block'
- Free/Pro/Team: true

**`inviteMember`**
- Guest/Free/Pro: 'hard-block'
- Team: true

## React Hook: `useEntitlements()`

**Location:** `apps/web/src/hooks/useEntitlements.ts`

Provides React access to entitlements system:

```typescript
const { plan, entitlements, can, isGuest, isPro } = useEntitlements();
```

### Return Values

```typescript
interface UseEntitlementsResult {
  plan: Plan;                    // Current user's plan
  entitlements: Entitlements;    // Full entitlements object
  can: (action, context?) => CanResult;  // Permission checker
  isGuest: boolean;              // Convenience flag
  isPro: boolean;                // true for pro OR team
  isTeam: boolean;               // true for team only
}
```

### Usage Example

```typescript
function ExportButton() {
  const { can } = useEntitlements();
  
  const handleExportGIF = () => {
    const gifAllowed = can('exportGIF');
    
    if (gifAllowed !== true) {
      // Show upgrade modal
      setPricingModalOpen(true);
      showToast('GIF export is a Pro feature ⭐');
      return;
    }
    
    // Proceed with export
    exportGIF();
  };
  
  return <button onClick={handleExportGIF}>Export GIF</button>;
}
```

## Enforcement Rules

### Where Enforcement Is ALLOWED ✅

1. **User-initiated actions**
   - Export buttons clicked
   - Add step button clicked
   - Create project button clicked

2. **Contextual moments**
   - When user tries a Pro feature
   - When user hits a limit

3. **Explicit user requests**
   - User clicks "Pricing" in menu
   - User opens settings

### Where Enforcement Is NOT ALLOWED ❌

1. **On app load**
   - Never show pricing modal on startup
   - Never block access to the app itself

2. **During creative work**
   - Don't interrupt canvas interactions
   - Don't interrupt animations

3. **Silently or without context**
   - Always explain WHY a limit was hit
   - Always show WHAT the user tried to do
   - Always provide next steps

## UI Integration Patterns

### Pattern 1: Hard-Block Export

```typescript
const handleExportGIF = async () => {
  const allowed = can('exportGIF');
  
  if (allowed !== true) {
    setPricingModalOpen(true);
    showToast('GIF export is a Pro feature ⭐');
    return;  // STOP - don't proceed
  }
  
  // Proceed with export
  await exportGIF();
};
```

### Pattern 2: Soft-Prompt Before Limit

```typescript
const addStep = () => {
  const stepCount = currentSteps.length;
  const canAddStep = can('addStep', { stepCount });
  
  // Hard-block at limit
  if (canAddStep === 'hard-block') {
    setLimitReachedModalOpen(true);
    return;  // STOP
  }
  
  // Soft-prompt approaching limit
  if (canAddStep === 'soft-prompt') {
    showToast(`You have ${stepCount}/10 steps. Upgrade for unlimited!`);
  }
  
  // Add the step (works for both true and soft-prompt)
  addStepToBoard();
};
```

### Pattern 3: Conditional UI Display

```typescript
function Toolbar() {
  const { can, plan } = useEntitlements();
  const gifAllowed = can('exportGIF');
  
  return (
    <div>
      {/* PNG always available */}
      <button onClick={exportPNG}>Export PNG</button>
      
      {/* GIF shows lock icon if blocked */}
      <button 
        onClick={exportGIF}
        disabled={gifAllowed === 'hard-block'}
      >
        Export GIF {gifAllowed !== true && '🔒'}
      </button>
      
      {/* Show plan badge */}
      <span>{plan === 'guest' ? 'Guest' : plan === 'free' ? 'Free' : 'Pro'}</span>
    </div>
  );
}
```

## Testing Entitlements

### Manual Testing Scenarios

1. **Guest → Free flow**
   - Start as guest (no login)
   - Try to add 6th step → Should show LimitReachedModal (guest-step)
   - Create account → Plan becomes 'free'
   - Can now add up to 10 steps

2. **Free → Pro flow**
   - Login as free user
   - Try to export GIF → Should show PricingModal
   - Upgrade to Pro
   - Can now export GIF

3. **Soft-prompt testing**
   - As free user with 8 steps
   - Add step → Should show toast (approaching limit)
   - Add another step (9th) → Should show toast again
   - Add 10th step → Hard-block modal

### Unit Test Template

```typescript
describe('can()', () => {
  it('blocks GIF export for free users', () => {
    expect(can('free', 'exportGIF')).toBe('hard-block');
  });
  
  it('soft-prompts at 9 steps for free plan', () => {
    expect(can('free', 'addStep', { stepCount: 9 })).toBe('soft-prompt');
  });
  
  it('hard-blocks at 10 steps for free plan', () => {
    expect(can('free', 'addStep', { stepCount: 10 })).toBe('hard-block');
  });
});
```

## Extending the System

### Adding a New Entitled Action

1. Add to `EntitledAction` type:
```typescript
type EntitledAction = 
  | /* existing actions */
  | 'newAction';
```

2. Add to entitlements interface:
```typescript
interface Entitlements {
  // existing fields
  canDoNewThing: boolean;
}
```

3. Update `ENTITLEMENTS_BY_PLAN`:
```typescript
const ENTITLEMENTS_BY_PLAN = {
  guest: { /* ... */ canDoNewThing: false },
  free: { /* ... */ canDoNewThing: false },
  pro: { /* ... */ canDoNewThing: true },
  team: { /* ... */ canDoNewThing: true },
};
```

4. Add case to `can()` function:
```typescript
switch (action) {
  // existing cases
  case 'newAction':
    return ent.canDoNewThing ? true : 'hard-block';
}
```

## Common Pitfalls

### ❌ DON'T: Check plan directly in UI

```typescript
// BAD - duplicates business logic
if (plan === 'pro' || plan === 'team') {
  exportGIF();
}
```

### ✅ DO: Use can() function

```typescript
// GOOD - centralized logic
if (can('exportGIF') === true) {
  exportGIF();
}
```

### ❌ DON'T: Show limits without context

```typescript
// BAD - user doesn't know why they can't proceed
if (can('addStep') === 'hard-block') {
  alert('Upgrade to Pro');
}
```

### ✅ DO: Explain the limit

```typescript
// GOOD - shows what happened and why
if (can('addStep', { stepCount }) === 'hard-block') {
  setLimitReachedModal({
    type: 'free-step',
    current: stepCount,
    max: 10,
  });
}
```

## Related Documentation

- **Product Philosophy:** See `docs/PRODUCT_PHILOSOPHY.md` for UX principles
- **UX Patterns:** See `docs/UX_PATTERNS.md` for modal flows
- **Monetization Plan:** See `docs/MONETIZATION_PLAN.md` for business context

---

**Remember:** Entitlements exist to guide users toward paid plans, not to annoy them. Always provide value first, enforce limits second.
