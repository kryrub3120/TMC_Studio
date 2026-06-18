# Current Task: Sprint 2 - Quality Gate i testy minimalne

**Status:** 🟢 ACTIVE
**Source of truth:** `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md`

---

## Poprzedni sprint

**Sprint 1 - Security & Billing Hardening** — ✅ DONE (2026-06-18)

Zrealizowane:
- `_cors.ts` — CORS allowlist z env override
- `_auth.ts` — verifyAuth() z Supabase JWT
- `create-checkout.ts` — auth, profile, allowlist, metadane
- `create-portal-session.ts` — auth, profile, returnUrl validation
- `_stripeConfig.ts` — TEST/LIVE, price ID consistency test
- 38 testow billing functions — wszystkie zielone

---

## Cel Sprint 2

Kazda zmiana przed launchem ma przechodzic przez automatyczna bramke.

## Zakres

1. Root test pipeline — `pnpm test` przez turbo.
2. CI — dodac `pnpm lint` i job `test`.
3. Core smoke tests.

## Zrealizowane

- Root `package.json` + `turbo.json` — task `test` dodany.
- `packages/core` — vitest config + `core.test.ts` (6 testow: createDocument, generateId, createInitialBoard).
- `.github/workflows/ci.yml` — lint job dodany, test job odkomentowany.
- `pnpm typecheck` — 9/9 OK.
- `pnpm lint` — 0 errors.
- `pnpm test` — 6 taskow OK (157 testow: 113 web + 38 billing + 6 core).

## Do rozwazenia przed Sprint 3

- E2E golden path smoke (opcjonalne, moze byc osobny ticket).

---

## Immediate Prompt

```text
Wykonaj Sprint 1 z docs/AUDYT_KOMPLEKSOWY_2026-06-18.md.
Najpierw napraw security checkout/portal, potem testy.
Nie ruszaj desktopu, marketplace, realtime, triala ani redesignu.
```
