# TMC Studio - Current Sprint Plan

**Data:** 2026-06-22  
**Status:** ACTIVE, krotki wskaznik operacyjny  
**Source of truth:** `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md`

---

## Zakończone sprinty

### S-BILLING — Stripe gotowy do sprzedaży (live)

**Status:** ✅ DONE (2026-06-22)

**Cel:** Doprowadzić lejek płatności do stanu, w którym po ręcznym wpięciu kluczy live sprzedaż po prostu działa.

**Sprint S1 — Bug rocznego cyklu:**
1. PricingModal wysyła `billingCycle` w body requestu do create-checkout.
2. create-checkout przyjmuje `billingCycle` z body (fallback: `getCycleFromPriceId()` z `_stripeConfig.ts`).
3. `_stripeConfig.ts` — dodano `PRICE_TO_CYCLE` i `getCycleFromPriceId()` (mapowanie, a nie fragile `priceId.includes('yearly')`).
4. AppShell — reset `pricingUpgradeCycle` do `'monthly'` przy zamknięciu modala (anti-stale).
5. +3 testy yearly priceId + billingCycle override.
6. Spec S-SITE: `thoughts/2026-06-22/1808_spec-s-site-cycle-propagation.md`

**Sprint S2 — Webhook hardening + testy:**
1. +17 testów stripe-webhook (signature verification, idempotencja, checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, rate limiting, unknown event).
2. +2 testy `getCycleFromPriceId` + `PRICE_TO_CYCLE`.
3. Mock Stripe rozszerzony o `constructEvent`, `subscriptions.retrieve`, `customers.retrieve`.
4. Security review: brak secret leak, env vars validation, signature verification.

**Testy:** 52/52 passed (billing.security.test.ts)
**Bump:** v0.8.0 → v0.8.1 (PATCH)
**Pliki:** `_stripeConfig.ts`, `create-checkout.ts`, `PricingModal.tsx`, `AppShell.tsx`, `billing.security.test.ts` + 6× `package.json` + `CHANGELOG.md`

**Raport:** `thoughts/2026-06-22/1835_master-autopilot_summary-s-billing.md` (z checklistą go-live)

---

## Sprinty archiwalne

### Sprint 0.5 — Release & Deployment Verification (triage produkcyjny)

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

### Sprint 2 - Quality Gate i testy minimalne

**Status:** � PAUSED (przerwany przez priorytetowy auth hotfix)
**Priorytet:** P1

Cel: kazda zmiana przed launchem ma przechodzic przez automatyczna bramke.

1. Root test pipeline — `pnpm test` przez turbo, vitest w `@tmc/core` i `@tmc/web`.
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
