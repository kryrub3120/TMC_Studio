# TMC Studio - Web Launch Checklist

**Status:** Active for first WWW launch  
**Production URL:** `https://tmcstudio.app`  
**Board URL:** `https://tmcstudio.app/board`  
**Legacy redirect:** `https://tmcstudio.app/app` -> `/board`  
**Supabase production project:** `https://pgacjczecyfnwsaadyvj.supabase.co`  
**Hosting:** Netlify  

## Scope

First launch is web-only. Tauri desktop OAuth/deep-link work stays in the repo as later readiness work, but it is not required to ship the public website.

Authentication scope for launch:

- Google OAuth.
- Email/password.
- Web popup as the default Google flow (z COOP workaround — hotfix 2026-07-01).
- Full-page redirect as fallback when popup opening fails.

## Known Production Issue: COOP-breaking popup.closed

**Problem:** `Cross-Origin-Opener-Policy` (COOP) na produkcji blokuje odczyt `popup.closed` po przejściu okna przez Google/Supabase. Stary kod (pre-2026-07-01) uznał to za zamknięcie okna i przerywał login.

**Hotfix (2026-07-01):**
1. Usunięto polling `popup.closed` z `waitForOAuthPopup()`.
2. Parent window używa `Promise.race()` — równolegle czeka na `postMessage` I na realną sesję Supabase przez 120s.
3. Jeśli COOP zerwie komunikację, login kończy się po wykryciu sesji pollingiem.

**Awaryjne ominięcie (Netlify env):**
```env
VITE_AUTH_GOOGLE_SURFACE=redirect
```
Wymusza pełny redirect zamiast popupu, omijając problem COOP całkowicie.

## Staging Decision

A separate staging domain is not required for the first launch.

Minimum recommended setup:

- Use Netlify Deploy Previews for PR smoke tests.
- Keep production at `https://tmcstudio.app`.
- Add a dedicated staging domain later if we need persistent QA, paid ads tests, or live Stripe/Supabase rehearsals without touching production.

## Netlify Environment Variables

Set in Netlify Dashboard -> Site configuration -> Environment variables:

- `VITE_SUPABASE_URL=https://pgacjczecyfnwsaadyvj.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<production anon key>`
- `VITE_AUTH_GOOGLE_SURFACE=popup`
- `VITE_AUTH_GOOGLE_SURFACE=redirect` (awaryjne — omija COOP, patrz sekcja COOP-breaking powyżej)
- `SUPABASE_URL=https://pgacjczecyfnwsaadyvj.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<production service role key>`
- `VITE_STRIPE_PUBLISHABLE_KEY=<publishable key>`
- `STRIPE_SECRET_KEY=<secret key>`
- `STRIPE_WEBHOOK_SECRET=<webhook secret>`

Netlify build command and publish directory are defined in `netlify.toml`.

## Supabase Auth Settings

In Supabase production project:

- Site URL: `https://tmcstudio.app`
- Redirect URLs:
  - `https://tmcstudio.app/auth/callback`
  - `http://localhost:3000/auth/callback`
  - Netlify deploy preview callback URLs if testing OAuth on previews.

For web-only launch, `tmcstudio://auth/callback` is not required.

## Google OAuth Client

In Google Cloud OAuth client used by Supabase:

- Authorized JavaScript origins:
  - `https://tmcstudio.app`
  - `http://localhost:3000`
  - Netlify preview origin if testing OAuth on previews.
- Authorized redirect URI:
  - `https://pgacjczecyfnwsaadyvj.supabase.co/auth/v1/callback`

## Routing

- `/` is the landing page.
- `/board` is the canonical board app URL.
- `/app` is kept as a compatibility redirect to `/board`, preserving query string and hash.
- `/auth/callback` handles Supabase OAuth/email callbacks.
- `/auth/reset-password` handles password reset.

## Pre-Launch Verification

Run locally:

1. `pnpm --filter @tmc/web typecheck`
2. `pnpm --filter @tmc/web test`
3. `pnpm --filter @tmc/web build`

Manual production smoke after Netlify deploy:

1. Open `https://tmcstudio.app`.
2. Click open board and verify URL is `/board`.
3. Open `https://tmcstudio.app/app?checkout=success` and verify it redirects to `/board?checkout=success`.
4. Sign in with Google.
5. Cancel Google login and verify the app does not render inside the popup.
6. Sign in with email/password.
7. Sign out and sign in again.
8. Start Stripe checkout from pricing and verify return URL is `/board?checkout=success`.
9. Open billing portal and verify return URL is `/board?portal=return`.

## Not Required For Web Launch

- Rust toolchain.
- Tauri build.
- Desktop deep-link registration.
- `tmcstudio://auth/callback` Supabase allowlist.
