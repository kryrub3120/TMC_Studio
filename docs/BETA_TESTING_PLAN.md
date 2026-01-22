# Beta Testing Plan - TMC Studio

**Date:** 2026-01-22  
**Goal:** Validate V1 product with real users before LIVE launch  
**Duration:** 1-2 weeks  
**Testers:** 10-20 beta users

---

## 🎯 Objectives

1. **Validate UX/UI** - Is the product intuitive and enjoyable to use?
2. **Test Payment Flow** - Does signup → upgrade work smoothly?
3. **Find Bugs** - Identify issues before real users encounter them
4. **Gather Feedback** - What do users love? What's confusing?
5. **Measure Engagement** - Do users see value? Would they pay?

---

## 🧪 Beta Environment

### Configuration
- **Production URL:** https://tmcstudio.app
- **Stripe Mode:** TEST (no real payments)
- **Test Card:** `4242 4242 4242 4242` (any future expiry, any CVC, any ZIP)
- **Feedback Form:** [Link to Google Form or Typeform - to be created]

### What Testers Can Do
- ✅ Full product access (all features)
- ✅ Create unlimited projects
- ✅ Test Pro features with TEST card
- ✅ Experience complete flow from guest → free → pro
- ✅ Export GIFs, PDFs, PNGs

### What Testers Cannot Do
- ❌ Make real payments (TEST mode only)
- ❌ Access Team features (not implemented yet)

---

## 👥 Beta Tester Recruitment

### Target Profile
- **Primary:** Football coaches, analysts, content creators
- **Secondary:** Sports enthusiasts who create tactical content
- **Tech-savvy:** Comfortable with web apps, willing to give feedback

### Recruitment Channels
1. **Personal Network** - Friends, colleagues in football/coaching
2. **Twitter/X** - Post about beta launch, invite applications
3. **Reddit** - r/bootroom, r/footballtactics
4. **LinkedIn** - Reach out to coaches/analysts
5. **Discord/Slack** - Football analytics communities

### Invitation Template
```
Subject: You're invited to beta test TMC Studio 🏟️

Hi [Name],

I'm launching TMC Studio - a fast, intuitive tactical board for football coaches and analysts.

Would you be interested in beta testing? I'm looking for honest feedback on:
- Is it easy to use?
- Does it solve your needs?
- Any bugs or confusing parts?

✅ Full access to all features
✅ No payment required (test mode only)
✅ Your feedback shapes the final product

Interested? Reply and I'll send you access + test instructions.

Thanks!
[Your name]
```

---

## 📋 Test Scenarios

Beta testers should go through these scenarios:

### Scenario 1: Guest Mode Experience (5-10 min)
**Goal:** Can users create value immediately without signup?

1. Visit https://tmcstudio.app
2. Create a simple tactical board (e.g., 4-3-3 formation)
3. Add players, ball, arrows
4. Move elements around
5. Try to create 2nd project → signup prompt appears

**Success Criteria:**
- ✅ Board creation is intuitive
- ✅ Can accomplish basic task without login
- ✅ Signup CTA is clear but not pushy

**Feedback Questions:**
- Was it easy to create your first board?
- Did you understand you could use it without signing up?
- Anything confusing in the first 2 minutes?

---

### Scenario 2: Signup Flow (2-3 min)
**Goal:** Is signup frictionless?

1. Click "Sign Up" or hit Guest project limit
2. Choose Google OAuth or email/password
3. Complete signup
4. Land back in app with Free account

**Success Criteria:**
- ✅ Signup completes in <1 minute
- ✅ No errors or confusing steps
- ✅ User understands they now have Free account (3 projects)

**Feedback Questions:**
- Was signup easy?
- Any friction or confusion?
- Did you understand your account benefits?

---

### Scenario 3: Free User Exploration (10-15 min)
**Goal:** Do users see value in Free tier?

1. Create 3 projects (hit Free limit)
2. Test core features:
   - Formation presets (keys 1-6)
   - Player customization (jersey numbers, shapes)
   - Arrows, zones, drawings
   - Animation with steps
   - PNG export
3. Try to create 4th project → limit reached modal

**Success Criteria:**
- ✅ Users create meaningful boards
- ✅ Discover key features organically
- ✅ Understand value proposition

**Feedback Questions:**
- What features did you discover?
- What would you use this for? (match prep, analysis, content?)
- Did you hit any bugs or confusing UX?

---

### Scenario 4: Upgrade Flow (3-5 min)
**Goal:** Is upgrade seamless and trustworthy?

1. Hit project limit → LimitReachedModal appears
2. Click "Upgrade to Pro"
3. Review pricing modal
4. Click monthly or yearly plan
5. Complete Stripe checkout with TEST card: `4242 4242 4242 4242`
6. Redirected back with success message
7. See Pro badge in UI

**Success Criteria:**
- ✅ Pricing is clear and compelling
- ✅ Checkout feels secure (Stripe hosted page)
- ✅ Redirect back works correctly
- ✅ Pro status shows immediately

**Feedback Questions:**
- Was pricing clear? Fair?
- Did checkout feel trustworthy?
- Would you pay real money for this? Why/why not?

**⚠️ IMPORTANT:** Remind testers this is TEST mode - no real charges!

---

### Scenario 5: Pro Features (10-15 min)
**Goal:** Do Pro features deliver value?

1. As Pro user, create 10+ projects (no limit)
2. Create board with 15+ animation steps (no limit)
3. Export animated GIF (Shift+Cmd+G)
4. Export multi-page PDF (Shift+Cmd+P)
5. Export all steps as PNGs (Shift+Cmd+E)
6. Test Customer Portal (Settings → Manage Billing)

**Success Criteria:**
- ✅ Unlimited features work as expected
- ✅ Exports are high quality
- ✅ No performance issues with many projects/steps

**Feedback Questions:**
- Are Pro features worth $9/month?
- Export quality good enough for your use case?
- Any features you'd want that are missing?

---

### Scenario 6: Cancellation Flow (2-3 min)
**Goal:** Can users easily cancel if needed?

1. Open Settings → Manage Billing
2. Customer Portal loads
3. Cancel subscription
4. Verify tier drops to Free
5. Verify limits re-apply (3 projects, 10 steps)
6. Verify GIF/PDF export locked again

**Success Criteria:**
- ✅ Cancellation is easy (no dark patterns)
- ✅ Downgrade happens immediately
- ✅ Data is preserved

**Feedback Questions:**
- Was cancellation straightforward?
- Did you feel in control of your subscription?

---

## 📊 Feedback Collection

### Feedback Form (Google Form / Typeform)

**Section 1: About You**
- Name (optional)
- Email (for follow-up)
- Role (coach, analyst, content creator, other)
- Experience level with tactical boards

**Section 2: First Impressions (1-5 scale)**
- How easy was it to create your first board?
- How intuitive was the interface?
- How valuable is this tool for your work?

**Section 3: Features**
- What features did you use most?
- What features were confusing or hard to find?
- What features are missing that you need?

**Section 4: Pricing**
- Is $9/month fair for Pro features? (Yes / No / Maybe)
- Would you pay for this with real money? (Yes / No / Unsure)
- If no, what would need to change?

**Section 5: Bugs & Issues**
- Did you encounter any bugs? Describe:
- Any performance issues?
- Any confusing UI/UX moments?

**Section 6: Open Feedback**
- What did you love?
- What frustrated you?
- How would you describe TMC Studio to a colleague?
- Any other thoughts?

---

## 🐛 Bug Tracking

Use GitHub Issues or Notion to track:

| ID | Description | Severity | Status | Reporter |
|----|-------------|----------|--------|----------|
| B1 | Example bug | High | Open | User A |

**Severity Levels:**
- **Critical:** Blocks core flow (signup, payment, save)
- **High:** Major feature broken
- **Medium:** Minor feature issue
- **Low:** Cosmetic/polish

---

## 📈 Success Metrics

### Quantitative
- **Signup Rate:** % of guests who sign up
- **Upgrade Rate:** % of free users who upgrade to Pro
- **Completion Rate:** % who complete full test scenarios
- **Bug Count:** Total bugs found (goal: <10 critical/high)

### Qualitative
- **NPS Score:** Would you recommend to a colleague? (0-10)
- **Feature Satisfaction:** Which features got highest ratings?
- **Pain Points:** What frustrated users most?

### Go/No-Go Criteria for LIVE Launch

✅ **GO** if:
- >80% of testers complete signup flow
- >50% would pay real money (at least "maybe")
- <5 critical bugs remaining
- Average UX rating >4/5
- At least 3 testers give glowing feedback

⚠️ **HOLD** if:
- Major bugs in core flows
- <40% would consider paying
- Consistent feedback about critical missing feature
- UX rating <3/5

---

## 🗓️ Timeline

### Week 1: Recruitment & Initial Testing
- **Day 1-2:** Send invites, onboard first 5 testers
- **Day 3-5:** Testers complete scenarios, submit feedback
- **Day 6-7:** Review initial feedback, triage bugs

### Week 2: Iteration & More Testing
- **Day 8-10:** Fix critical bugs, implement quick wins
- **Day 11-12:** Recruit 5-10 more testers, re-test
- **Day 13-14:** Collect final feedback, prepare go-live decision

### Week 3: Go Live Prep
- **Day 15-16:** Create LIVE Stripe products, get Price IDs
- **Day 17:** Update code, switch to LIVE keys
- **Day 18:** Final production test
- **Day 19:** Marketing prep (launch tweet, landing page, etc.)
- **Day 20:** 🚀 **GO LIVE!**

---

## 🎁 Tester Incentives

Consider offering:
- **Free Pro for 3 months** post-launch (as thank you)
- **Early access** to Team plan features
- **Public credit** on website / Twitter (optional)
- **Swag** (if budget allows - stickers, t-shirts)

---

## 📞 Support During Beta

### Communication Channels
- **Email:** [your email] for bug reports
- **Discord/Slack:** Private beta channel for quick questions
- **Weekly Check-in:** Send update email with progress

### Response Time
- Critical bugs: <24 hours
- General questions: <48 hours
- Feedback form review: Weekly digest

---

## ✅ Post-Beta Checklist

After beta completes:

- [ ] Review all feedback (synthesize themes)
- [ ] Fix critical bugs
- [ ] Implement top 3 quick-win features (if time allows)
- [ ] Update pricing/features based on feedback
- [ ] Thank all testers personally
- [ ] Write beta retrospective doc
- [ ] Make go/no-go decision
- [ ] If GO: Switch to LIVE mode and launch! 🚀

---

## Related Docs

- `tasks/NEXT_TASK.md` - Current beta testing status
- `docs/ROADMAP.md` - Sprint 7: Beta Phase
- `docs/DEPLOYMENT_CHECKLIST.md` - Beta configuration
- `docs/MONETIZATION_PLAN.md` - Pricing strategy

---

**Let's make TMC Studio amazing! 🏟️⚽**
