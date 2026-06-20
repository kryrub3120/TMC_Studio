# Current Task: Auth Flow (Google OAuth popup) — dokumentacja i porządki

**Status:** 🟢 READY
**Source of truth:** `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md` + `docs/CURRENT_SPRINT_PLAN.md`

---

## Zakończone

**Auth Flow hotfix** — ✅ DONE (2026-06-20)
Google OAuth w popupie zamiast redirectu. Szczegóły: `docs/AUTH_FLOW.md`, `docs/CURRENT_SPRINT_PLAN.md`.

**Sprint 1 - Security & Billing Hardening** — ✅ DONE (2026-06-18)
**Sprint 0.5 - Release & Deploy Verification (triage produkcyjny)** — ✅ DONE (2026-06-18)

---

## Aktualny stan

Dokumentacja auth flow jest gotowa (`docs/AUTH_FLOW.md`), sekcja w `FEATURE_SPEC.md` (#15) dodana, INDEX.md i CURRENT_SPRINT_PLAN.md zaktualizowane.

## Następny sprint

**Sprint 2 - Quality Gate i testy minimalne** — do wznowienia.

Cel: każda zmiana przed launchem ma przechodzić przez automatyczną bramkę.

1. Root test pipeline — `pnpm test` przez turbo, vitest w `@tmc/core` i `@tmc/web`.
2. CI — lint job + test job odkomentowany w `.github/workflows/ci.yml`.
3. Core smoke tests — `packages/core/src/core.test.ts` (6 testów).

Opcjonalnie:
- E2E smoke (golden path) przed Sprint 3.
