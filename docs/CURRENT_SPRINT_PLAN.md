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

### Sprint 2 - Quality Gate i testy minimalne

**Status:** 🟢 ACTIVE
**Priorytet:** P1

Cel: kazda zmiana przed launchem ma przechodzic przez automatyczna bramke.

1. Root test pipeline — `pnpm test` przez turbo, vitest w `@tmc/core` i `@tmc/web`.
2. CI — lint job + test job odkomentowany w `.github/workflows/ci.yml`.
3. Core smoke tests — `packages/core/src/core.test.ts` (6 testow).

Pozostaje:
- E2E smoke (golden path) — opcjonalnie przed Sprint 3.

---

## Kolejnosc sprintow do launchu

| Kolejnosc | Sprint | Priorytet | Cel |
|---|---|---:|---|
| 1 | Security & Billing Hardening | P0 | Bezpieczny checkout, portal, Stripe config |
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
