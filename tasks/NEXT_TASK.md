# Current Task: BETA-TESTING

## Status: 🚀 READY TO LAUNCH

---

## What We're Doing

**BETA Testing Phase**: Launch product to beta testers with TEST Stripe mode to gather UX/UI feedback on complete flow (signup → upgrade → pro features) before going LIVE.

---

## Context

- **V1 Foundation:** ✅ Complete
- **Payment Integration:** ✅ Complete (PR-PAY-1 through PR-PAY-5)
- **Stripe Mode:** TEST keys configured in Netlify
- **Goal:** Validate UX/UI and payment flow before switching to LIVE mode

---

## Beta Testing Checklist

### Pre-Launch
- [x] V1 code complete and deployed
- [x] Stripe TEST keys configured in Netlify
- [x] TEST Price IDs in code
- [x] All migrations applied to Supabase
- [ ] Beta testing plan documented
- [ ] Test scenarios defined
- [ ] Feedback form prepared

### During Beta
- [ ] Send invites to beta testers
- [ ] Monitor signup flow
- [ ] Track upgrade conversions
- [ ] Collect UX/UI feedback
- [ ] Monitor Stripe webhook success rate
- [ ] Document bugs and issues

### Post-Beta
- [ ] Review all feedback
- [ ] Implement critical bug fixes
- [ ] Make UI/UX improvements
- [ ] Create LIVE products in Stripe
- [ ] Update code with LIVE Price IDs
- [ ] Switch Netlify to LIVE Stripe keys
- [ ] Final production test
- [ ] GO LIVE! 🚀

---

## Test Scenarios for Beta Testers

### Scenario 1: Guest User Flow
1. Visit site without login
2. Create a simple tactical board
3. Try to create 2nd project → should trigger signup
4. Complete signup flow
5. Verify gets Free account (3 projects)

### Scenario 2: Free → Pro Upgrade
1. Login with Free account
2. Create 3 projects (hit limit)
3. Try to create 4th → limit reached modal
4. Click "Upgrade to Pro"
5. Complete Stripe checkout (TEST card: 4242 4242 4242 4242)
6. Verify redirect back with success message
7. Verify Pro badge appears
8. Verify unlimited projects unlocked

### Scenario 3: Pro Features
1. As Pro user, create 10+ projects (no limit)
2. Create board with 15+ steps (no limit for Pro)
3. Export GIF (should work)
4. Export PDF (should work)
5. Test Customer Portal (manage billing)

### Scenario 4: Cancellation Flow
1. Open Customer Portal
2. Cancel subscription
3. Verify tier drops to Free
4. Verify limits re-apply (3 projects, 10 steps)

---

## Feedback Collection

Key questions for testers:
- Was signup flow intuitive?
- Was upgrade process clear and trustworthy?
- Were pricing/features easy to understand?
- Any confusing UI elements?
- Any bugs encountered?
- Would you pay real money for this?

---

## Related Docs

- `docs/BETA_TESTING_PLAN.md` - Detailed beta plan
- `docs/ROADMAP.md` - Sprint 7: Beta Phase
- `docs/DEPLOYMENT_CHECKLIST.md` - Beta mode status
