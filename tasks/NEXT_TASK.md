# Current Task: Release 0.6.1 — deploy i merge do main

**Status:** 🟢 READY FOR RELEASE
**Source of truth:** `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md`

---

## Poprzednie sprinty

**Sprint 1 - Security & Billing Hardening** — ✅ DONE (2026-06-18)
**Sprint 0.5 - Release & Deploy Verification (triage produkcyjny)** — ✅ DONE (2026-06-18)

---

## Cel

Wydać release z hotfixami PROBLEMÓW 0–14, zmergować develop → main i zaktualizować dokumentację.

## Zakres

1. CHANGELOG — przenieść `[Unreleased]` do nowej sekcji `0.7.0` (minor: nowe funkcje + fixy).
2. Bump wersji na wszystkich `package.json` (root, apps/web, packages/*).
3. Commit + push develop.
4. Merge develop → main.
5. Tag release na main.
6. Push main + tag.
7. Deploy na Netlify (automatyczny po pushu na main).
Najpierw napraw security checkout/portal, potem testy.
Nie ruszaj desktopu, marketplace, realtime, triala ani redesignu.
```
