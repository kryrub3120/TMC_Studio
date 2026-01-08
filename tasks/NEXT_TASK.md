# TMC Studio - Current Status & Next Steps

**Last Updated:** 2026-01-08  
**Production URL:** https://tmcstudio.app

---

## ✅ COMPLETED (Phase 1 - Infrastructure)

### Supabase
- [x] Project: `pgacjczecyfnwsaadyvj`
- [x] Database schema deployed (profiles, projects, templates)
- [x] Auth redirect URLs configured for `tmcstudio.app`
- [x] RLS policies active

### Netlify  
- [x] Site: `tmc-studio` → `tmcstudio.app`
- [x] Custom domain with SSL
- [x] SPA routing fixed
- [x] Netlify Functions deployed

### Stripe (Live Mode!)
- [x] Products created (Pro + Team)
- [x] Webhook: `https://tmcstudio.app/.netlify/functions/stripe-webhook`
- [x] Price IDs configured in code

**Price IDs:**
| Plan | Monthly | Yearly |
|------|---------|--------|
| Pro | `price_1SnQvaANogcZdSR39JL60iCS` | `price_1SnQvaANogcZdSR3f6Pv3xZ8` |
| Team | `price_1SnQvzANogcZdSR3BiUrQvqc` | `price_1SnQwfANogcZdSR3Kdp2j8FB` |

### Environment Variables (9 total)
- [x] `VITE_SUPABASE_URL`
- [x] `VITE_SUPABASE_ANON_KEY`
- [x] `SUPABASE_URL`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [x] `STRIPE_SECRET_KEY`
- [x] `STRIPE_WEBHOOK_SECRET`
- [x] `NODE_VERSION` (20)
- [x] `PNPM_VERSION` (9)
- [x] `NPM_FLAGS` (--include=dev)

---

## 🚧 TODO (Phase 2 - Auth & Logic)

### Authentication
- [ ] **Google OAuth Setup**
  - Configure in Supabase: Authentication → Providers → Google
  - Get OAuth credentials from Google Cloud Console
  - Add `accounts.google.com` to authorized domains
  
- [ ] **Magic Link Testing**
  - Test email signup flow
  - Verify redirect back to app
  - Check profile creation trigger

- [ ] **Session Persistence**
  - Test token refresh
  - Handle expired sessions gracefully

### Payment Flow
- [ ] **Checkout Testing**
  - Test Pro monthly checkout
  - Test Team yearly checkout
  - Verify webhook updates `subscription_tier`
  
- [ ] **Test Cards:**
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - 3D Secure: `4000 0025 0000 3155`

### Frontend Logic
- [ ] **AuthModal integration**
  - Connect to actual Supabase auth
  - Handle loading states
  - Show proper error messages

- [ ] **PricingModal**
  - Connect upgrade buttons to Stripe checkout
  - Pass user email to checkout session

- [ ] **ProjectsDrawer**
  - Fetch projects from Supabase
  - Implement save/load project
  - Handle cloud sync

### Database Functions
- [ ] **Profile creation trigger** (on auth.users insert)
- [ ] **Subscription tier check** function
- [ ] **Project ownership validation**

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Sign up with email → verify email → login
- [ ] Sign in with Google (after setup)
- [ ] Create a project → save → reload → verify data
- [ ] Upgrade to Pro → verify subscription_tier changes
- [ ] Cancel subscription → verify downgrade to free

### API Testing
```bash
# Health check
curl https://tmcstudio.app/.netlify/functions/health

# Create checkout (needs auth)
curl -X POST https://tmcstudio.app/.netlify/functions/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_1SnQvaANogcZdSR39JL60iCS","successUrl":"https://tmcstudio.app/success","cancelUrl":"https://tmcstudio.app/cancel"}'
```

---

## 📝 Quick Reference

### Local Development
```bash
cd "TMC Studio"
pnpm install
pnpm dev              # Start all packages
# Frontend: http://localhost:5173
```

### Netlify CLI
```bash
netlify status        # Check project link
netlify env:list      # List env vars
netlify deploy --prod # Manual deploy
```

### Supabase CLI
```bash
supabase login
supabase link --project-ref pgacjczecyfnwsaadyvj
supabase db push      # Push migrations
```

---

## 🔗 Important Links

- **Production:** https://tmcstudio.app
- **Netlify Dashboard:** https://app.netlify.com/projects/tmc-studio
- **Supabase Dashboard:** https://supabase.com/dashboard/project/pgacjczecyfnwsaadyvj
- **Stripe Dashboard:** https://dashboard.stripe.com
- **GitHub:** https://github.com/kryrub3120/TMC_Studio

---

## ⚠️ Known Issues

1. **Google OAuth not configured yet** - only Magic Link works
2. **No profile avatar upload** - using initials for now
3. **Stripe in Live Mode** - be careful with real charges!

---

## 📅 Session Log

### 2026-01-08
- ✅ Supabase schema deployed
- ✅ Stripe products created (Pro + Team)
- ✅ Netlify functions deployed
- ✅ Custom domain `tmcstudio.app` configured
- ✅ Fixed 404 error (SPA redirect condition)
- ✅ All environment variables set
