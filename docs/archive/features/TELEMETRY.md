# Telemetry & Analytics

This document defines TMC Studio's approach to telemetry and analytics. We collect the minimum data needed to improve the product while respecting user privacy.

**Philosophy:** Privacy-first. No spy shit.

---

## Core Principles

1. **Transparent** - Users know what we collect and why
2. **Minimal** - Only collect what's necessary
3. **Anonymous** - No personally identifiable information
4. **Opt-out** - Users can disable telemetry
5. **Secure** - Data is encrypted in transit
6. **Purposeful** - Only collect data we'll actually use

---

## What We Collect

### ✅ UX Events (ALLOWED)

These events help us understand how users interact with TMC Studio:

#### Feature Usage
```typescript
{
  event: 'feature_used',
  feature: 'export_gif' | 'add_step' | 'apply_formation' | etc.,
  timestamp: '2026-01-11T20:00:00Z',
  session_id: 'anonymous-uuid', // Changes each session
}
```

**Purpose:** Understand which features are popular/ignored

**Examples:**
- `feature_used: export_gif` - GIF export was clicked
- `feature_used: add_step` - User added a step
- `feature_used: apply_formation_433` - User applied 4-3-3 formation

---

#### Flow Completion
```typescript
{
  event: 'flow_completed',
  flow: 'signup' | 'upgrade' | 'export' | 'create_project',
  success: boolean,
  duration_ms: number,
  timestamp: '2026-01-11T20:00:00Z',
}
```

**Purpose:** Identify friction points in user journeys

**Examples:**
- `flow_completed: signup, success: true` - User completed signup
- `flow_completed: upgrade, success: false` - User abandoned upgrade
- `flow_completed: export_gif, success: true, duration_ms: 2341` - GIF export completed

---

#### Error Occurred
```typescript
{
  event: 'error_occurred',
  error_type: 'export_failed' | 'save_failed' | 'auth_failed',
  error_code: string, // Generic code, no stack trace
  timestamp: '2026-01-11T20:00:00Z',
}
```

**Purpose:** Detect and fix bugs

**Examples:**
- `error_occurred: export_failed, error_code: 'EXPORT_TIMEOUT'`
- `error_occurred: save_failed, error_code: 'NETWORK_ERROR'`

**Note:** NO stack traces, NO user data in error messages

---

#### Session Started
```typescript
{
  event: 'session_started',
  plan: 'guest' | 'free' | 'pro' | 'team',
  is_authenticated: boolean,
  timestamp: '2026-01-11T20:00:00Z',
}
```

**Purpose:** Understand active user patterns

**Examples:**
- `session_started: plan=guest, is_authenticated=false`
- `session_started: plan=pro, is_authenticated=true`

---

#### Limit Reached
```typescript
{
  event: 'limit_reached',
  limit_type: 'step' | 'project' | 'export',
  current_plan: 'guest' | 'free' | 'pro',
  timestamp: '2026-01-11T20:00:00Z',
}
```

**Purpose:** Understand conversion friction

**Examples:**
- `limit_reached: limit_type=step, current_plan=guest` - Guest hit 5 step limit
- `limit_reached: limit_type=export_gif, current_plan=free` - Free user tried GIF export

---

### ❌ What We DO NOT Collect

**Never collected:**

- ❌ **Project content** - No tactical board data
- ❌ **User identities** - No names, emails, IP addresses
- ❌ **Personal data** - No PII of any kind
- ❌ **Cross-session tracking** - No persistent user IDs
- ❌ **Third-party trackers** - No Google Analytics, Facebook Pixel, etc.
- ❌ **Behavioral profiling** - No ad targeting data
- ❌ **Location data** - No IP geolocation
- ❌ **Device fingerprinting** - No browser fingerprints
- ❌ **Keystroke logging** - No input tracking
- ❌ **Mouse tracking** - No cursor movements
- ❌ **Session recordings** - No screen captures

---

## Implementation

### Option 1: Self-Hosted Plausible

**Pros:**
- Privacy-focused analytics
- GDPR compliant
- Simple dashboard
- Open source

**Setup:**
```typescript
// In main.tsx
if (import.meta.env.PROD && !userOptedOut) {
  import('plausible-tracker').then(({ default: Plausible }) => {
    const plausible = Plausible({
      domain: 'app.tmcstudio.com',
      apiHost: 'https://analytics.tmcstudio.com',
    });
    
    plausible.trackPageview();
  });
}
```

**Events:**
```typescript
plausible.trackEvent('feature_used', { 
  props: { feature: 'export_gif' } 
});
```

---

### Option 2: PostHog (Self-Hosted)

**Pros:**
- More advanced analytics
- Feature flags
- Session replay (can be disabled)
- A/B testing

**Setup:**
```typescript
// In main.tsx
import posthog from 'posthog-js';

if (import.meta.env.PROD && !userOptedOut) {
  posthog.init('PROJECT_KEY', {
    api_host: 'https://analytics.tmcstudio.com',
    disable_session_recording: true, // IMPORTANT
    disable_persistence: true, // No cookies
    autocapture: false, // Manual events only
    ip: false, // Don't capture IP
  });
}
```

**Events:**
```typescript
posthog.capture('feature_used', {
  feature: 'export_gif',
});
```

---

### Option 3: Custom Endpoint

**Pros:**
- Full control
- Minimal dependencies
- Exactly what we need

**Setup:**
```typescript
// analytics.ts
export const track = (event: string, props?: Record<string, any>) => {
  if (userOptedOut) return;
  
  fetch('https://api.tmcstudio.com/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      props,
      timestamp: new Date().toISOString(),
      session_id: getAnonymousSessionId(),
    }),
  }).catch(() => {
    // Silently fail - analytics should never break the app
  });
};
```

**Usage:**
```typescript
track('feature_used', { feature: 'export_gif' });
```

---

## Opt-Out Mechanism

### Settings Toggle

```typescript
// In SettingsModal.tsx
<label>
  <input
    type="checkbox"
    checked={analyticsEnabled}
    onChange={(e) => setAnalyticsEnabled(e.target.checked)}
  />
  <span>Help improve TMC Studio (anonymous usage data)</span>
  <button onClick={showPrivacyInfo}>What do we collect?</button>
</label>
```

### Local Storage
```typescript
// Store preference
localStorage.setItem('tmc_analytics_enabled', 'false');

// Check before sending
const userOptedOut = 
  localStorage.getItem('tmc_analytics_enabled') === 'false';
```

### Default: Opt-In

**Recommendation:** Ask on first use
```typescript
// On first app load
if (!localStorage.getItem('tmc_analytics_preference')) {
  showAnalyticsConsentModal();
}
```

---

## Privacy Notice

### In-App Copy

**Modal Title:** "Help Improve TMC Studio"

**Body:**
```
We collect anonymous usage data to understand which features
are used and where users encounter problems.

What we collect:
• Which features you use (e.g., "exported GIF")
• When errors occur (e.g., "export failed")
• Your plan type (guest/free/pro)

What we DON'T collect:
• Your project content
• Your personal information
• Your browsing history
• Your location

You can opt out at any time in Settings.
```

**CTAs:**
- [Yes, help improve TMC Studio] (enables analytics)
- [No thanks] (disables analytics)

---

## Data Retention

### Event Data
- **Retention:** 90 days
- **Why:** Enough to spot trends, not excessive
- **Deletion:** Automatic after 90 days

### Aggregated Data
- **Retention:** Indefinite
- **Format:** Aggregate metrics only (no individual events)
- **Example:** "30% of users export GIF" (not "User X exported GIF")

---

## GDPR Compliance

### User Rights

**Right to Access:**
- Users can't access their data because we don't store it tied to identity

**Right to Deletion:**
- Already anonymous, nothing to delete

**Right to Opt-Out:**
- Settings toggle provides easy opt-out

**Right to Data Portability:**
- Not applicable (anonymous data)

### Legal Basis

**Legitimate Interest:**
- Improving product quality
- Fixing bugs
- Understanding feature usage

**User Consent:**
- Opt-in/opt-out toggle
- Transparent notice

---

## Analytics Dashboard

### Key Metrics

**Engagement:**
- Daily/Monthly Active Users
- Session duration
- Features used per session

**Conversion:**
- Guest → Free conversion rate
- Free → Pro conversion rate
- Where users drop off in upgrade flow

**Product Health:**
- Error rate by feature
- Export success rate
- Save failure rate

**Feature Adoption:**
- % users using formations
- % users creating animations
- % users exporting GIF/PDF

---

## Example Events

### User Journey

```typescript
// App loads
track('session_started', { 
  plan: 'guest', 
  is_authenticated: false 
});

// User adds players
track('feature_used', { feature: 'add_player' });
track('feature_used', { feature: 'add_player' });

// User tries to add 6th step (limit!)
track('limit_reached', { 
  limit_type: 'step', 
  current_plan: 'guest' 
});

// User signs up
track('flow_completed', { 
  flow: 'signup', 
  success: true, 
  duration_ms: 15340 
});

// User exports GIF
track('feature_used', { feature: 'export_gif' });

// Export succeeds
track('flow_completed', { 
  flow: 'export_gif', 
  success: true, 
  duration_ms: 3421 
});
```

---

## Implementation Checklist

### Phase 1: Infrastructure
- [ ] Choose analytics provider (Plausible/PostHog/Custom)
- [ ] Set up self-hosted instance (if applicable)
- [ ] Create `track()` wrapper function
- [ ] Add opt-out mechanism to Settings

### Phase 2: Events
- [ ] Add `session_started` event
- [ ] Add `feature_used` events for key features
- [ ] Add `flow_completed` events for signup/upgrade/export
- [ ] Add `error_occurred` events for critical errors
- [ ] Add `limit_reached` events

### Phase 3: UI
- [ ] Create analytics consent modal
- [ ] Add privacy notice to Settings
- [ ] Add "What we collect" info modal
- [ ] Test opt-out flow

### Phase 4: Legal
- [ ] Update Privacy Policy
- [ ] Add analytics section to Terms of Service
- [ ] Add cookie notice (if using cookies)

### Phase 5: Dashboard
- [ ] Set up analytics dashboard
- [ ] Create key reports
- [ ] Share read-only access with team

---

## Anti-Patterns to Avoid

### ❌ DON'T: Track everything

```typescript
// BAD - Too much data
track('mouse_moved', { x: 123, y: 456 });
track('key_pressed', { key: 'a' });
track('element_hovered', { element: 'button' });
```

### ✅ DO: Track meaningful actions

```typescript
// GOOD - Actionable insights
track('feature_used', { feature: 'export_gif' });
track('flow_completed', { flow: 'upgrade', success: true });
```

---

### ❌ DON'T: Send sensitive data

```typescript
// BAD - Contains user data
track('project_created', { 
  name: 'My Tactics Board',  // User content!
  email: 'user@example.com'  // PII!
});
```

### ✅ DO: Send generic events

```typescript
// GOOD - No user data
track('feature_used', { feature: 'create_project' });
```

---

### ❌ DON'T: Track without consent

```typescript
// BAD - No opt-out check
track('session_started');
```

### ✅ DO: Check opt-out preference

```typescript
// GOOD - Respect user choice
if (!userOptedOut) {
  track('session_started');
}
```

---

## Related Documentation

- **Product Philosophy:** `docs/PRODUCT_PHILOSOPHY.md`
- **Privacy Policy:** (future `docs/PRIVACY_POLICY.md`)
- **Architecture:** `docs/ARCHITECTURE_OVERVIEW.md`

---

**Remember:** When in doubt, don't collect it. We can always add more telemetry later. We can't un-collect data we shouldn't have gathered.

**Mantra:** Privacy-first. No spy shit. Trust over metrics.
