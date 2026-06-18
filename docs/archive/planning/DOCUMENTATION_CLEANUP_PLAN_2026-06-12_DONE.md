# TMC Studio - Documentation Cleanup Plan

**Data:** 2026-06-12
**Status:** ✅ WYKONANY — cleanup i archiwizacja zakończone
**Source of truth:** `docs/CURRENT_SPRINT_PLAN.md`

---

## Cel

Zmniejszyc balagan w dokumentacji bez utraty historii, audytow i evidence dla agentow.

**Stan: WYKONANY.** Wszystkie fazy (1-4) zrealizowane podczas Sprint Docs Cleanup (2026-06-12).

---

## Podsumowanie wykonania

### Phase 2 — oznaczenia aktualnosci
- Wszystkie dokumenty oznaczone poprawnie: SUPERSEDED / HISTORICAL / STALE
- Source of truth: `CURRENT_SPRINT_PLAN.md` + `NEXT_TASK.md`

### Phase 3 — archiwizacja
- Historyczne PR-y → `docs/archive/pr/` (24 pliki)
- Audyty → `docs/archive/audits/` (6 plików)
- Stare plany → `docs/archive/planning/` (12 plików + 4 stuby)
- Inventory → `docs/archive/inventory/` (2 pliki + stub)
- Strategie → `docs/archive/strategy/` (9 plików)
- Statusy → `docs/archive/status/` (3 pliki)
- Features → `docs/archive/features/` (3 pliki)
- Modules → `docs/archive/modules/` (3 pliki)
- Guides → `docs/archive/guides/` (1 plik)
- Stare taski → `tasks/archive/` (8 plików)

### Phase 4 — opcjonalne porzadki (wykonane)
1. ✅ Feature inventory — zarchiwizowane jako `FEATURE_STATUS_2026-06-10.md`
2. ✅ Linki w archiwalnych dokumentach — stuby zawierają linki do aktualnych source of truth
3. ✅ Thoughts — zachowane jako evidence, nie ruszane
4. ✅ Docs audit — wykonany (6 dokumentów zaktualizowanych, 7 zweryfikowanych jako aktualne)

### Stan koncowy `docs/` root
**18 aktywnych plikow** — tylko te potrzebne do pracy:
- Plan: `CURRENT_SPRINT_PLAN.md`, `PLAN_BRAKUJACYCH_FUNKCJI.md`, `PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md`
- Agent workflow: `AGENT_ORCHESTRATION.md`
- Produkt: `PRODUCT_PHILOSOPHY.md`, `FEATURE_SPEC.md`, `ENTITLEMENTS.md`, `UX_PATTERNS.md`
- Architektura: `ARCHITECTURE_OVERVIEW.md`, `SYSTEM_ARCHITECTURE.md`, `DATA_MODEL.md`, `IMPLEMENTATION_CONTRACTS.md`
- Engineering: `DB_CONVENTIONS.md`, `DESIGN_SYSTEM.md`, `COMMANDS_MAP.md`, `DRAG_DROP_PATTERN.md`
- Indeks: `INDEX.md`, `DOCUMENTATION_CLEANUP_PLAN.md`
