# Auth Flow V3 - comprehensive web + desktop login redesign

**Data:** 2026-07-01
**Status:** IN PROGRESS - S-AUTH3.0 implemented, S-AUTH3.1 mostly implemented, S-AUTH3.2 partially implemented, S-AUTH3.3 scaffolded
**Priorytet:** P0 jesli blokuje login/release, inaczej P1 po UX-C
**Typ:** auth architecture refactor + desktop deep-link readiness + UX simplification
**Source of truth:** ten plik

**Web launch decision 2026-07-01:** pierwszy launch jest WWW-only. Produkcja: `https://tmcstudio.app`, landing `/`, kanoniczna aplikacja `/board`, legacy `/app` przekierowuje do `/board`, hosting Netlify, Supabase prod `pgacjczecyfnwsaadyvj`. Desktop/Tauri OAuth zostaje jako later readiness i nie blokuje WWW release. Szczegoly operacyjne: `docs/WEB_LAUNCH_CHECKLIST.md`.

---

## Executive summary

Aktualny Google OAuth popup flow naprawil problem opuszczania aplikacji, ale wprowadzil zbyt zlozony przeplyw:

1. Modal auth zamyka sie natychmiast.
2. Glowna aplikacja pokazuje osobny status "Logowanie przez Google".
3. Male popup okno przechodzi Google -> Supabase -> `/auth/callback`.
4. Callback wysyla `postMessage` do opener i probuje zamknac okno.
5. Glowna aplikacja czeka na `postMessage`, potem polluje Supabase session.
6. Dopiero potem pobiera profil, preferencje i projekty/foldery.

Regresja z testu 2026-07-01: jezeli callback dziala w popupie, ale `window.opener` jest niedostepny, `AuthCallbackPage` fallbackuje do `navigate('/app')`. Wtedy pelna aplikacja renderuje sie w malym oknie popupu 500x680.

V3 ma rozdzielic flow dla web i desktopu:

- **Web:** stabilny, ograniczony popup lub prosty full-page redirect. Popup nigdy nie moze wejsc w pelny edytor.
- **Desktop/Tauri:** external browser + custom protocol/deep link do glownego okna aplikacji. Nie uzywac zwyklego webview popupu jako docelowego miejsca logowania.
- **Core auth state:** jedna jawna maszyna stanow zamiast rozproszonych flag i timeoutow.
- **UX:** login ma wygladac jak jeden kontrolowany proces, z jasnym statusem, retry i cancel.

---

## Decyzja produktowo-techniczna

Rekomendowany wariant docelowy:

1. **Web production:** popup OAuth zostaje, ale zostaje "sandboxowany":
   - callback popupu moze tylko wyslac wynik, zamknac sie albo pokazac recovery screen,
   - callback popupu nigdy nie nawigowac do `/app`,
   - parent window jest jedynym miejscem, gdzie wlaczamy pelna aplikacje po OAuth.
2. **Desktop/Tauri production:** external browser + deep link:
   - klik Google otwiera systemowa przegladarke,
   - Supabase redirectuje na web callback lub custom protocol bridge,
   - finalny callback wraca do glownego okna Tauri,
   - desktop nie renderuje aplikacji w malym popup/webview.
3. **Email/password:** zostaje inline w modalu i nie uzywa popupow.
4. **Profil/preferencje/projekty:** po auth session UI przechodzi w authenticated state szybko; ciezsza hydracja idzie progresywnie.

Alternatywa akceptowalna dla web, jesli popup dalej bedzie zawodny: full-page redirect dla Google na webie. Jest prostszy i najbardziej odporny, ale uzytkownik chwilowo opuszcza edytor. Desktop nadal powinien miec external browser + deep link.

---

## Problemy do rozwiazania

### P0 - popup moze renderowac pelna aplikacje

Aktualne miejsce ryzyka:

- `apps/web/src/pages/AuthCallbackPage.tsx`
- `finish()` robi `navigate('/app')`, jezeli `isPopup` jest true, ale nie ma `window.opener`.

Wymaganie V3:

- Jezeli `isPopup` jest true, callback route nie moze renderowac `/app`.
- Brak `opener` to stan recovery, nie fallback do edytora.

### P0 - brak jawnego desktop auth contract

Aktualnie desktop korzysta z tej samej logiki `window.open` co web.

Ryzyka:

- webview moze zgubic `window.opener`,
- Google/Supabase moga zachowywac sie inaczej w embedded webview,
- callback moze zakonczyc sie w dodatkowym oknie zamiast w glownej aplikacji,
- nie ma jasnej separacji URL-i web vs desktop.

Wymaganie V3:

- Desktop ma miec dedykowana sciezke OAuth i callbacku.
- Glowna aplikacja Tauri ma byc jedynym miejscem, gdzie finalizujemy state auth.

### P1 - flow jest za dlugie i slabo czytelne

Aktualne miejsca:

- `packages/ui/src/AuthModal.tsx` zamyka modal przed OAuth.
- `apps/web/src/app/AppShell.tsx` pokazuje oddzielny status.
- `apps/web/src/store/useAuthStore.ts` ma `isOAuthInProgress`, `waitForOAuthPopup`, `waitForOAuthSession`, dodatkowy polling i prefetch.

Wymaganie V3:

- Jeden komponent/stan auth flow komunikuje caly proces.
- Uzytkownik widzi jasne etapy: "Otwieramy Google", "Dokoncz w oknie", "Wracamy do TMC", "Synchronizujemy konto".
- Jest `Cancel` i `Retry`.
- Hydracja profilu i projektow nie blokuje podstawowego przejscia do logged-in UI.

### P1 - luki testowe

Aktualne E2E auth testuje tylko devLogin.

Wymaganie V3:

- Test popup callback bez opener.
- Test parent receiving popup success/error via mocked callback.
- Test full-page redirect fallback.
- Test desktop auth bridge na poziomie unit/integration bez realnego Google.

### P2 - env confusion

Aktualne `apps/web/vite.config.ts` ustawia `envDir` na root repo. `apps/web/.env.local` nie jest zrodlem prawdy dla Vite.

Wymaganie V3:

- Jasno opisac i wymusic env source of truth.
- Startup log/check pokazuje Supabase project host bez sekretow.
- Test/diagnostic script wykrywa niespojnosc root/app env.

---

## Docelowa architektura

### Moduly

Nowy podzial odpowiedzialnosci:

| Modul | Odpowiedzialnosc |
|---|---|
| `auth/AuthFlowController` | jedna maszyna stanow dla OAuth/email auth |
| `auth/oauthWebPopup` | web popup open, postMessage, close detection, timeout |
| `auth/oauthWebRedirect` | full-page redirect fallback |
| `auth/oauthDesktopBridge` | Tauri external browser + deep-link contract |
| `AuthCallbackPage` | lekka strona callback, bez renderowania edytora w popupie |
| `useAuthStore` | user/session state, bez low-level popup details |
| `AuthModal` | UI dla login/register/reset + OAuth progress |

Pliki moga byc dostosowane do aktualnego stylu repo. Nie trzeba tworzyc wszystkich modulow jako nowe pliki, jesli lokalny pattern lepiej pasuje, ale granice odpowiedzialnosci powinny zostac zachowane.

### Maszyna stanow

Proponowany model:

```ts
type AuthFlowStatus =
  | 'idle'
  | 'emailSubmitting'
  | 'oauthOpening'
  | 'oauthWaitingForProvider'
  | 'oauthCallbackReceived'
  | 'sessionReady'
  | 'profileHydrating'
  | 'done'
  | 'cancelled'
  | 'error';
```

Minimalny state:

```ts
type AuthFlowState = {
  status: AuthFlowStatus;
  method: 'email' | 'google' | null;
  surface: 'web-popup' | 'web-redirect' | 'desktop-deeplink' | null;
  startedAt: number | null;
  popup?: Window | null;
  error?: string | null;
  retryable: boolean;
};
```

Zasady:

- `isAuthenticated` wynika z sesji/uzytkownika, nie z samego `status`.
- `profileHydrating` nie blokuje podstawowego logged-in UI.
- Jeden flow naraz. Kolejny start anuluje poprzedni albo pokazuje retry.
- Timeouty i cleanup sa centralnie w controllerze.

---

## Sekwencje docelowe

### Web popup happy path

```text
AuthModal
  -> AuthFlowController.startGoogle()
  -> oauthWebPopup.open()
  -> Supabase signInWithOAuth(skipBrowserRedirect: true)
  -> popup.location = providerUrl
  -> popup /auth/callback
  -> Supabase getSession/exchange
  -> postMessage success to parent
  -> popup close
  -> parent getSession once/retry short
  -> set basic user/session
  -> close/progress UI
  -> hydrate profile/preferences/projects in background
```

Rules:

- Popup callback success without parent should show recovery screen, never `/app`.
- Parent must detect `popup.closed` and fail fast with a clear retry.
- Timeout should be shorter and staged:
  - opening provider: 10s,
  - waiting provider: 120s,
  - session sync after callback: 8s.

### Web popup no opener

```text
popup /auth/callback
  -> isPopup = true
  -> window.opener missing
  -> do not navigate('/app')
  -> show "Return to the main TMC Studio window" recovery screen
  -> attempt window.close()
```

Acceptance:

- Body does not contain editor/topbar.
- URL does not become `/app`.
- User is not trapped: close/retry instructions visible.

### Web redirect fallback

```text
AuthModal
  -> startGoogle(surface: web-redirect)
  -> save current board locally
  -> supabase.signInWithOAuth(skipBrowserRedirect: false)
  -> full page leaves app
  -> /auth/callback in main window
  -> session exchange
  -> navigate('/app')
  -> restore board from local storage
  -> hydrate profile in background
```

Use when:

- popup blocked,
- browser policy breaks opener,
- explicit product decision to simplify web login.

### Desktop/Tauri external browser + deep link

Target:

```text
Tauri main window
  -> startGoogle(surface: desktop-deeplink)
  -> request OAuth URL from Supabase
  -> open external browser
  -> provider login
  -> callback bridge
  -> deep link into Tauri main window
  -> main window exchanges/loads session
  -> close progress UI
```

Implementation note:

- Verify exact Tauri v2 deep-link plugin/API during implementation.
- Avoid embedded Google login inside Tauri webview unless explicitly required.
- Register a custom protocol such as `tmcstudio://auth/callback` only if Supabase/Google redirect allowlists can support it safely.
- If Supabase does not support the desired custom protocol directly in this setup, use a web callback bridge:
  - Supabase redirects to `https://tmcstudio.app/auth/desktop-callback?code=...`,
  - web callback validates/encodes a one-time result,
  - page redirects to `tmcstudio://auth/callback?...`,
  - Tauri main window receives it.

Security rule:

- Never put long-lived access tokens in custom protocol URLs.
- Prefer PKCE code/session exchange handled by Supabase SDK where possible.
- If a bridge is needed, use short-lived one-time tokens or signed state, not raw session tokens.

---

## Work breakdown

### S-AUTH3.0 - Immediate guard before full refactor

Goal: eliminate "app in popup" regression first.

Status 2026-07-01: implemented.

Evidence:

- `AuthCallbackPage` no longer navigates popup callbacks without opener to `/app`.
- Recovery UI is shown for popup callbacks that cannot notify the opener.
- Regression E2E added in `e2e/auth.spec.ts`.
- Manual simulation with system Chrome: popup URL stayed `/auth/callback`, recovery UI rendered, editor/topbar did not render.
- `pnpm --filter @tmc/web typecheck` passed.
- `pnpm --filter @tmc/web test` passed.
- `pnpm --filter @tmc/web build` passed.
- `pnpm exec playwright test --config=e2e/playwright.config.ts e2e/auth.spec.ts` could not run locally because Playwright Chromium is not installed in this environment.

Tasks:

1. Update `AuthCallbackPage.finish()`:
   - if `isPopup` and `window.opener` exists: postMessage + close,
   - if `isPopup` and no opener: show recovery screen + attempt close,
   - only non-popup callback can `navigate('/app')`.
2. Add recovery copy in locale files:
   - title,
   - description,
   - close button,
   - "open app" only if this is clearly not a popup.
3. Add test:
   - navigate to `/auth/callback?error=...` with `window.name='tmc-google-auth'`,
   - assert URL is not `/app`,
   - assert editor UI is not rendered.

Acceptance:

- Reproduced bug is gone.
- No behavior change for normal non-popup redirect.
- Typecheck/test/build green.

### S-AUTH3.1 - Extract OAuth surface strategy

Goal: isolate web popup, web redirect, and desktop deeplink decisions.

Status 2026-07-01: partially implemented.

Implemented:

- `resolveGoogleOAuthSurface()` added in `apps/web/src/auth/oauthSurface.ts`.
- `VITE_AUTH_GOOGLE_SURFACE=popup|redirect|desktop` first-pass resolver added.
- Web popup adapter extracted to `apps/web/src/auth/oauthWebPopup.ts`.
- `useAuthStore` no longer owns popup HTML, `window.open`, `postMessage` wait, or popup closed polling directly.
- Popup closed polling added.
- Popup blocked path falls back to full-page redirect.
- Desktop surface is detected but currently falls back to web redirect with a warning until the Tauri deep-link bridge is implemented.

Remaining:

- Add desktop-deeplink surface.
- Replace desktop fallback with real Tauri external browser + deep-link bridge.

Tasks:

1. Add `resolveOAuthSurface()`:
   - `desktop-deeplink` when Tauri is detected and feature flag enabled,
   - `web-popup` by default for browser,
   - `web-redirect` fallback when popup unavailable or feature flag enabled.
2. Move popup-specific helpers out of `useAuthStore` or behind a narrow adapter:
   - `openOAuthPopup`,
   - `writeOAuthPopupShell`,
   - `waitForOAuthPopup`.
3. Add popup closed polling:
   - check `popup.closed` every 500ms,
   - reject with user-friendly retryable error.
4. Preserve board save before leaving current surface.

Acceptance:

- `useAuthStore.signInWithGoogle()` no longer owns low-level popup mechanics.
- Strategy can be tested without real Google.
- Popup blocked case falls back or shows clear retry.

### S-AUTH3.2 - Auth flow state machine and UX

Goal: one coherent login UI.

Status 2026-07-01: partially implemented.

Implemented:

- `AuthFlowState` and `AuthFlowStatus` added in `apps/web/src/auth/authFlow.ts`.
- `useAuthStore` now tracks `authFlow` through email submit, OAuth opening, provider wait, callback received, session ready, done/error.
- `AuthModal` uses parent-provided OAuth status instead of local Google-only progress state.
- AuthModal progress copy remains one coherent Google progress panel.
- `authFlow` idle shape covered by unit test.

Remaining:

- Add cancel action wired to popup close/redirect fallback where possible.
- Replace legacy `isOAuthInProgress` once all callers use `authFlow`.
- Add richer transition tests for error/cancel/session-ready paths.

Tasks:

1. Add centralized `authFlow` state:
   - status,
   - method,
   - surface,
   - error,
   - retryable.
2. Replace `isOAuthInProgress` as UI driver with `authFlow.status`.
3. Update `AuthModal`:
   - do not fully disappear immediately after Google click,
   - switch to progress state or compact progress sheet,
   - show cancel/retry,
   - keep email/register/forgot states simple.
4. Update `GoogleAuthStatus` or replace it:
   - one source of copy/status,
   - no duplicate toast + overlay messaging.
5. After session is ready:
   - close auth UI,
   - show welcome toast,
   - hydrate profile/preferences/projects in background.

Acceptance:

- User sees one continuous auth flow.
- Error returns the user to a retryable state.
- Login success does not wait for cloud project prefetch.

### S-AUTH3.3 - Desktop/Tauri auth bridge

Goal: desktop auth does not depend on webview popup.

Status 2026-07-01: scaffold implemented, pending Rust/toolchain and real OAuth allowlist verification.

Implemented:

- Tauri `deep-link` plugin added in `Cargo.toml` and initialized in `src/lib.rs`.
- Tauri `single-instance` plugin added for desktop and initialized before deep-link.
- `tauri.conf.json` registers `tmcstudio` desktop scheme and enables `withGlobalTauri`.
- `default.json` capability includes `core:event:default` and `deep-link:default`.
- Frontend desktop bridge added in `apps/web/src/auth/oauthDesktopBridge.ts`.
- Desktop bridge opens external browser via `window.__TAURI__.opener.openUrl`, listens for `tmcstudio://auth/callback?code=...`, and exchanges the PKCE code with Supabase.

Evidence:

- `pnpm --filter @tmc/web typecheck` passed.
- `pnpm --filter @tmc/web test` passed.
- `pnpm --filter @tmc/web build` passed.
- `pnpm --filter @tmc/web tauri info` detects `tauri-plugin-deep-link`, but this local environment has no `rustc`/`cargo`, so Rust compile was not verified here.

Remaining:

- Verify `cargo check` / `tauri build` on a machine with Rust installed.
- Add Supabase redirect allowlist entry for `tmcstudio://auth/callback`.
- Add Google/Supabase production checklist evidence.
- Manual macOS installed-app smoke, because Tauri docs note desktop deep links are normally triggered for installed apps.

Tasks:

1. Confirm Tauri v2 deep-link plugin/API and platform setup.
2. Add desktop capability:
   - open external browser using existing opener plugin or platform API,
   - receive callback in main window,
   - route callback payload to web auth controller.
3. Add redirect URLs to config docs:
   - Supabase auth redirect allowlist,
   - Google OAuth redirect allowlist,
   - Netlify production/staging URLs,
   - desktop custom protocol or bridge URL.
4. Add desktop callback route/page only if needed:
   - `AuthDesktopCallbackPage` or bridge under `/auth/desktop-callback`.
5. Add graceful fallback:
   - if deep link unavailable, use web redirect instructions,
   - no silent mini-window app render.

Acceptance:

- Tauri Google login opens external browser.
- Main Tauri window receives success/error.
- No extra app window remains open after auth.
- macOS build/manual QA documented. Windows/Linux checklist prepared if not tested.

### S-AUTH3.4 - Tests and diagnostics

Goal: auth regressions are caught before manual testing.

Tasks:

1. Unit tests:
   - surface resolver,
   - state machine transitions,
   - callback classification: popup vs redirect.
2. E2E/integration:
   - popup callback without opener never navigates to `/app`,
   - popup success postMessage updates parent with mocked session,
   - popup close before callback returns retryable error,
   - redirect callback can navigate to `/app`.
3. Env diagnostics:
   - script or test prints Supabase host from Vite env without secrets,
   - detect root/app `.env` mismatch and document expected behavior.
4. CI:
   - include new tests in existing `pnpm test`/`pnpm e2e` where feasible,
   - avoid real Google credentials in CI.

Acceptance:

- CI catches the exact 2026-07-01 regression.
- CI does not require real Google login.
- Manual OAuth smoke remains documented for production.

### S-AUTH3.5 - Documentation and rollout

Goal: future agents do not reintroduce the old flow.

Tasks:

1. Update `docs/AUTH_FLOW.md`:
   - mark old popup flow as V2,
   - document V3 surfaces,
   - include desktop callback sequence.
2. Update `docs/SYSTEM_ARCHITECTURE.md` auth section if present.
3. Update `tasks/NEXT_TASK.md` when this becomes active.
4. Add release checklist:
   - Supabase redirect URLs,
   - Google OAuth redirect URLs,
   - Netlify env,
   - Tauri protocol registration,
   - manual smoke matrix.

Acceptance:

- Docs match code.
- Deployment checklist is explicit enough for production.

---

## File map

Likely touched files:

| File | Expected work |
|---|---|
| `apps/web/src/pages/AuthCallbackPage.tsx` | popup/no-opener guard, recovery UI |
| `apps/web/src/store/useAuthStore.ts` | remove low-level popup ownership, use flow controller |
| `apps/web/src/lib/supabase.ts` | OAuth helper remains thin, maybe add diagnostics |
| `apps/web/src/app/AppShell.tsx` | replace `isOAuthInProgress` UI with auth flow UI |
| `packages/ui/src/AuthModal.tsx` | Google progress/cancel/retry state |
| `packages/ui/src/locales/en.ts` | auth V3 copy |
| `packages/ui/src/locales/pl.ts` | auth V3 copy |
| `packages/ui/src/locales/es.ts` | auth V3 copy |
| `apps/web/src-tauri/*` | desktop deep-link/external browser setup |
| `e2e/auth.spec.ts` | callback/popup regression tests |
| `docs/AUTH_FLOW.md` | V3 architecture docs |

Potential new files:

| File | Purpose |
|---|---|
| `apps/web/src/auth/authFlow.ts` | state machine/types |
| `apps/web/src/auth/oauthSurface.ts` | surface resolver |
| `apps/web/src/auth/oauthWebPopup.ts` | popup adapter |
| `apps/web/src/auth/oauthDesktopBridge.ts` | Tauri bridge adapter |
| `apps/web/src/auth/__tests__/authFlow.test.ts` | unit tests |
| `apps/web/src/auth/__tests__/oauthSurface.test.ts` | unit tests |

Use repo patterns over exact names if existing architecture suggests a better location.

---

## UX requirements

### Auth modal

Default priority:

1. Google button as primary CTA.
2. Email/password as secondary but visible.
3. Register and forgot password as inline secondary actions.
4. Dev login stays DEV-only and should not visually dominate normal local screenshots unless actively testing.

States:

| State | UI |
|---|---|
| idle | Google CTA + email fields |
| opening | spinner + "Opening Google..." |
| waiting provider | "Finish in Google window" + cancel |
| callback received | "Returning to TMC Studio..." |
| session ready | close modal, welcome toast |
| profile hydrating | subtle background sync, no blocker |
| error | clear error + retry + alternate email login |

Copy principles:

- Avoid saying "popup" to end users unless needed.
- Use "window" in user-facing copy.
- Explain action, not implementation.
- Errors should be retryable where possible.

### Recovery screen in popup

When popup has no opener:

- Minimal branded screen.
- No editor import.
- No app navigation.
- Suggested copy:
  - "Login finished in this window"
  - "Return to the main TMC Studio window. If it did not update, close this window and try again."
  - Button: "Close window"

Do not show project/editor UI here.

---

## Security requirements

1. Keep PKCE.
2. Do not clean `?code=...` before Supabase exchange is confirmed.
3. Validate `postMessage` origin.
4. Include a nonce/state check for parent/popup messages if feasible.
5. Do not put access/refresh tokens in query params.
6. Do not store secrets in localStorage beyond Supabase session handling.
7. Desktop deep-link payload must not contain long-lived tokens.
8. Callback route must be lightweight and cannot load the editor in popup mode.

---

## Test plan

### Automated tests

1. `AuthCallbackPage` popup without opener:
   - setup `window.name = 'tmc-google-auth'`,
   - open `/auth/callback?error=access_denied`,
   - assert URL remains callback/recovery, not `/app`,
   - assert no topbar/editor text.
2. Popup success mocked:
   - parent opens callback-like child,
   - child sends postMessage,
   - parent receives success and proceeds to mocked `getSession`.
3. Popup user closes window:
   - `popup.closed` path rejects before 120s timeout,
   - UI shows retry.
4. Redirect callback:
   - non-popup callback can navigate to `/app`.
5. State machine:
   - invalid transitions are ignored or produce controlled errors.
6. Env diagnostics:
   - root env is documented source of truth.

### Manual smoke

Web:

| Scenario | Expected |
|---|---|
| Google login success | main app logged in, popup closes |
| Google cancel | main app shows retry, no stale spinner |
| Popup blocked | fallback/retry visible |
| Popup no opener simulation | no editor in popup |
| Email login | modal closes, app logged in |
| Register | verification message, no accidental logged-in state |
| Reset password | reset page still works with PKCE |

Desktop:

| Scenario | Expected |
|---|---|
| Google login | external browser opens |
| Deep link success | main window logs in |
| Deep link error/cancel | main window shows retry |
| App already open | callback targets existing main window |
| App closed during callback | documented fallback |

---

## Rollout plan

1. Ship S-AUTH3.0 hotfix first if auth regression is visible to users.
2. Behind feature flags, add V3 surface resolver:
   - `VITE_AUTH_GOOGLE_SURFACE=popup|redirect|desktop`.
3. Enable web V3 popup on staging.
4. Run manual smoke on staging with real Google account.
5. Enable desktop deep-link on a dev build only.
6. After desktop smoke, add production redirect allowlists.
7. Remove old popup fallback path after V3 has passed smoke.

Feature flags should be temporary and removed after stabilization.

---

## Acceptance criteria for full V3

V3 is complete when:

1. Popup callback can never render `/app`.
2. Web Google login has one coherent UI flow with retry/cancel.
3. Desktop Google login does not rely on embedded webview popup.
4. Auth session is applied before heavy profile/project prefetch blocks UI.
5. Automated tests cover callback/no-opener regression.
6. `docs/AUTH_FLOW.md` matches implementation.
7. Redirect allowlists and env source of truth are documented.
8. Manual smoke evidence is recorded for web and desktop.

---

## Implementation command for future agent

```text
Zrealizuj `tasks/AUTH_FLOW_V3_COMPLEX_PLAN_2026-07-01.md`.
Najpierw przeczytaj caly brief oraz `docs/AUTH_FLOW.md`.
Zacznij od S-AUTH3.0, bo usuwa regresje "app in popup".
Nie zmieniaj aktywnego UX-C zakresu, chyba ze user jawnie przelacza priorytet na auth.
Nie uzywaj realnego Google loginu w CI; testuj callback/popup przez mocki i symulacje.
Po implementacji uruchom typecheck/test/build oraz e2e auth smoke, a manual Google smoke opisz w evidence.
```
