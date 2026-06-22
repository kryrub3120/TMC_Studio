# TMC Studio - Current Sprint Plan

**Data:** 2026-06-18  
**Status:** ACTIVE, krotki wskaznik operacyjny  
**Source of truth:** `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md`

---

## Zakonczone sprinty

### Sprint 0.5 — Release & Deploy Verification (triage produkcyjny)

**Status:** ✅ DONE (2026-06-18)

Cel: zamknięcie deploy gap przed dalszymi sprintami.

Zrealizowane punkty:

1. **Wszystkie PROBLEMY 0–14** z `tasks/TRIAGE_PRODUKCJA_2026-06-18.md` naprawione w kodzie:
   - #0: Netlify/Supabase/OAuth config zweryfikowany.
   - #1–14: 16 poprawek (style domyślne strzałek/stref, skład/GK/GKcolor, i18n, skróty, FAQ, watermark, wizja/orientacja, dark mode, feedback) — wszystkie jako ✅ FIXED-UNDEPLOYED.
2. Warningi builda usunięte (Supabase dynamic/static import, Browserslist).
3. Instrukcja przeklikania (sekcje A–G) w pliku triage.
4. Weryfikacja: typecheck (core/ui/web), testy (core 6, web 113), build (ui, web) — wszystkie zielone.

Evidence:
- Plik: `tasks/TRIAGE_PRODUKCJA_2026-06-18.md`
- 23 pliki zmodyfikowane w `apps/web`, `packages/ui`, `packages/board`, `packages/core`

---

### Sprint 1 - Security & Billing Hardening

**Status:** ✅ DONE (2026-06-18)

Zrealizowane punkty:

1. CORS allowlist dla Netlify Functions — `netlify/functions/_cors.ts` z allowlista, env override, Vary: Origin.
2. Auth helper — `netlify/functions/_auth.ts` z `verifyAuth()` i `AuthError`.
3. `create-checkout` — uwierzytelnianie JWT, `client_reference_id` z auth, `customer`/`customer_email` z profilu/auth, priceId allowlista, URL-e walidowane, metadane.
4. `create-portal-session` — CORS allowlist, auth JWT, customer z profilu (nie z body), returnUrl walidacja.
5. Stripe config — TEST/LIVE komentarze, backend/frontend/PricingModal spojnosc, test porownujacy.
6. Testy billing functions — 38 testow (CORS, auth, checkout security, portal security, config consistency) — wszystkie zielone.

Evidence:
- Pliki: `netlify/functions/_cors.ts`, `_auth.ts`, `_stripeConfig.ts`, `create-checkout.ts`, `create-portal-session.ts`
- Testy: `netlify/functions/__tests__/billing.security.test.ts` — 38/38 passed

---

## Aktualny sprint

### Sprint 2 - Quality Gate i testy minimalne (S-QA)

**Status:** ✅ DONE (2026-06-22)

Cel: bramka jakosci — lint/typecheck/test/build/e2e blokuja PR.

Zrealizowane punkty:

1. **E2E golden path (Playwright)** — 11 testow w 3 specach:
   - `tactical-board.spec.ts` (4): guest board, add players, **export PNG z `waitForEvent('download')` i asercja `.png` filename**, Shift+P.
   - `auth.spec.ts` (3): guest state, dev login smoke, close modal.
   - `checkout.spec.ts` (4): pricing page, CTA, **/app?upgrade=pro modal z yearly price**, feature comparison.
2. **CI gate** — `.github/workflows/ci.yml`:
   - E2E job (`pnpm e2e`) po buildzie.
   - `--frozen-lockfile` zamiast `--no-frozen-lockfile` we wszystkich 4 jobach.
3. **Konfiguracja**:
   - `e2e/playwright.config.ts` z webServer auto-start, chromium.
   - `.gitignore` — test-results, playwright-report.
   - Wersja 0.8.0 → 0.9.0 (MINOR), CHANGELOG zaktualizowany.
4. **Weryfikacja**: 113/113 unit tests + 11/11 e2e green. `--frozen-lockfile` OK.

Evidence:
- `e2e/*` (5 plikow) — Playwright config, fixtures, specs.
- `.github/workflows/ci.yml` — E2E job.
- `thoughts/2026-06-22/` — dokumentacja Master Autopilot.

Swiadome ograniczenia:
- Auth: devLogin smoke only (nie realny OAuth).
- Checkout: pricing modal smoke only (nie realne Stripe checkout).
- Cloud features (Supabase): nie testowane E2E (brak .env.local).

---
2. CI — lint job + test job odkomentowany w `.github/workflows/ci.yml`.
3. Core smoke tests — `packages/core/src/core.test.ts` (6 testow).

Pozostaje:
- E2E smoke (golden path) — opcjonalnie przed Sprint 3.

---

## Hotfix — Auth Flow (Google OAuth popup)

**Status:** ✅ DONE (2026-06-20)

Cel: Google login nie wywala uzytkownika z aplikacji. Popup zamiast redirectu.

Zrealizowane punkty:

1. **Popup flow** — `window.open('', 'tmc-google-auth')` z loading spinnerem, postMessage z callbacka do głównej karty.
2. **Non-blocking status** — `isOAuthInProgress` + `GoogleAuthStatus` toast w AppShell.
3. **AuthCallbackPage** — wykrywa czy jest popupem (popup → postMessage + close, fallback → navigate).
4. **AuthModal** — zamyka się od razu po starcie Google.
5. **Singleton listenera** — `onAuthStateChange` zakładany raz, brak kaskadowych fetchy.
6. **PKCE fix** — `cleanAuthCallbackUrl()` dopiero po potwierdzonej sesji (nie po 400ms).
7. **Dokumentacja** — `docs/AUTH_FLOW.md` z pełnym opisem, diagramami i sekwencjami.
8. **FEATURE_SPEC** — nowa sekcja 15 (Authentication & Auth Flow).

Evidence:
- Pliki: `useAuthStore.ts`, `AuthCallbackPage.tsx`, `supabase.ts`, `AppShell.tsx`, `AuthModal.tsx`, locale (en/es/pl)
- Dokumentacja: `docs/AUTH_FLOW.md`, `docs/FEATURE_SPEC.md` (sec 15)
- Weryfikacja: `tsc --noEmit + vite build` — OK

---

## Kolejnosc sprintow do launchu

| Kolejnosc | Sprint | Priorytet | Cel |
|---|---|---:|---|| — | Auth Flow hotfix | P0 | Google OAuth popup zamiast redirectu || 1 | Security & Billing Hardening | P0 | Bezpieczny checkout, portal, Stripe config |
| 2 | Quality Gate i testy minimalne | P1 | CI lint/test/typecheck/build + core/billing/E2E smoke |
| 3 | Pricing i monetizacja | P1 | Spojnosc pricing -> modal -> checkout, Team value |
| 4 | Activation UX | P1 | First tactic + first export bez pomocy |
| 5 | Landing, legal, SEO, tracking | P1 | Strona gotowa do sprzedazy i minimum UE |
| 6 | Data, performance, observability | P1/P2 | Projekty, bundle, monitoring |
| 7 | Beta launch gate | P1 | QA matrix + 10-20 beta users |
| 8 | Public launch | P1 | Kontrolowane wydanie na rynek |

---

## Zasada

Nie przeskakujemy do desktopu, marketplace, realtime collaboration, referral ani triala przed zamknieciem Sprintow 1-5.
