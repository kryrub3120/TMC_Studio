# TMC Studio - Documentation Index

Ten katalog zawiera tylko dokumenty bazowe potrzebne do pracy nad projektem i do prowadzenia agentow.

Historyczne PR-y, stare plany, checklisty, audyty i snapshoty sa w `docs/archive/` oraz `tasks/archive/`.

---

## Source of Truth

Czytaj w tej kolejnosci:

1. `docs/CURRENT_SPRINT_PLAN.md` - aktualna kolejnosc sprintow i rozstrzygniete konflikty.
2. `tasks/NEXT_TASK.md` - najblizsze zadanie.
3. `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` - szczegoly zakresow sprintow.
4. `docs/AGENT_ORCHESTRATION.md` - workflow `Delivery` i `MasterAutopilot`.
5. `.github/copilot-instructions.md` - reguly agentow i developmentu.

Jesli dokument w archiwum mowi cos sprzecznego z powyzszymi plikami, wygrywa aktualny source of truth.

---

## Active Planning

| Dokument | Rola |
|----------|------|
| `CURRENT_SPRINT_PLAN.md` | Aktywny plan operacyjny |
| `PLAN_BRAKUJACYCH_FUNKCJI.md` | Szczegoly sprintow G/E/F i dalszych epikow |
| `PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md` | Security/pre-launch blockery do ponownej weryfikacji |
| `DOCUMENTATION_CLEANUP_PLAN.md` | Mapa porzadkow i archiwum (✅ WYKONANY 2026-06-12) |

---

## Agent System

| Dokument | Rola |
|----------|------|
| `AGENT_ORCHESTRATION.md` | Jak uzywac `Delivery` i `MasterAutopilot` |
| `.github/copilot-instructions.md` | Zasady techniczne i workflow |
| `.github/agents/` | Definicje agentow |
| `.github/skills/` | Skille uzywane przez MasterAutopilot |

---

## Product And Architecture

| Dokument | Rola |
|----------|------|
| `PRODUCT_PHILOSOPHY.md` | Filozofia produktu |
| `FEATURE_SPEC.md` | Spec funkcjonalna |
| `ARCHITECTURE_OVERVIEW.md` | Ogolny obraz architektury |
| `SYSTEM_ARCHITECTURE.md` | Infrastruktura, backend, deployment |
| `DATA_MODEL.md` | Model danych |
| `VERSIONING.md` | Polityka wersjonowania (SemVer + CalVer), multi-platform strategy |
| `ENTITLEMENTS.md` | Uprawnienia, plany, gating |

---

## Engineering Rules

| Dokument | Rola |
|----------|------|
| `IMPLEMENTATION_CONTRACTS.md` | Kontrakty implementacyjne |
| `DB_CONVENTIONS.md` | Reguly DB/Supabase |
| `DESIGN_SYSTEM.md` | Reguly UI i design systemu |
| `COMMANDS_MAP.md` | Mapa komend |
| `DRAG_DROP_PATTERN.md` | Wzorce drag/drop canvasu |
| `UX_PATTERNS.md` | Wzorce UX |

---

## Archive

Archiwum jest zachowane jako evidence i historia, ale nie jest aktywnym planem pracy.

| Folder | Zawartosc |
|--------|-----------|
| `archive/planning/` | Stare plany, checklisty, beta docs |
| `archive/pr/` | Historyczne dokumenty PR |
| `archive/audits/` | Audyty i analizy |
| `archive/status/` | Statusy zakonczonych prac |
| `archive/features/` | Stare dokumenty funkcji |
| `archive/modules/` | Plany i statusy modulow |
| `archive/strategy/` | Roadmapy i strategie historyczne |
| `archive/inventory/` | Snapshoty inwentaryzacji |
| `tasks/archive/` | Historyczne taski |
