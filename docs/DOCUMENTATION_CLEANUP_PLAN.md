# TMC Studio - Documentation Cleanup Plan

**Data:** 2026-06-10
**Status:** SAFE CLEANUP PLAN - bez usuwania plikow
**Source of truth:** `docs/CURRENT_SPRINT_PLAN.md`

---

## Cel

Zmniejszyc balagan w dokumentacji bez utraty historii, audytow i evidence dla agentow.

Ten plan nie usuwa dokumentow. Najpierw oznaczamy aktualnosc, dopiero potem mozna archiwizowac lub kasowac po zgodzie uzytkownika.

Po ostatnich porzadkach root `docs/` ma zostawac maly: tylko aktywny plan, agent workflow, bazowa architektura, spec, reguly techniczne i kilka kontraktow operacyjnych.

---

## Zasada nadrzedna

Jesli agent ma watpliwosc, czy dokument jest aktualny:

1. Najpierw czyta `docs/CURRENT_SPRINT_PLAN.md`.
2. Potem `tasks/NEXT_TASK.md`.
3. Dopiero potem szczegolowe dokumenty pomocnicze.

---

## Dokumenty aktywne

| Dokument | Rola |
|----------|------|
| `docs/CURRENT_SPRINT_PLAN.md` | Aktywny plan operacyjny |
| `tasks/NEXT_TASK.md` | Najblizsze zadanie |
| `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` | Szczegoly sprintow G/E/F |
| `docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md` | Lista security/pre-launch blockerow do ponownej weryfikacji |
| `docs/AGENT_ORCHESTRATION.md` | Workflow agentow |
| `.github/copilot-instructions.md` | Reguly agentow i developmentu |

Aktywne root docs zostawione jako podstawa dzialania:

- `docs/INDEX.md`
- `docs/CURRENT_SPRINT_PLAN.md`
- `docs/PLAN_BRAKUJACYCH_FUNKCJI.md`
- `docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md`
- `docs/AGENT_ORCHESTRATION.md`
- `docs/PRODUCT_PHILOSOPHY.md`
- `docs/FEATURE_SPEC.md`
- `docs/ARCHITECTURE_OVERVIEW.md`
- `docs/SYSTEM_ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/ENTITLEMENTS.md`
- `docs/IMPLEMENTATION_CONTRACTS.md`
- `docs/DB_CONVENTIONS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/COMMANDS_MAP.md`
- `docs/DRAG_DROP_PATTERN.md`
- `docs/UX_PATTERNS.md`
- `docs/DOCUMENTATION_CLEANUP_PLAN.md`

---

## Dokumenty historyczne / snapshoty

| Dokument | Dlaczego nie jest source of truth |
|----------|-----------------------------------|
| Dawny `docs/IMPLEMENTATION_PLAN_SPRINTS.md` | Historyczny plan A-D i legacy zakres E |
| Dawny `docs/DEPLOYMENT_CHECKLIST.md` | Snapshot beta setup z 2026-01-22 |
| Dawny `docs/BETA_TESTING_PLAN.md` | Plan beta, uzyc dopiero po release-readiness |
| Dawny `tasks/BETA_READY_SPRINT.md` | Stary plan beta sprintu z 2026-02-19 |
| Dawny `docs/FEATURE_STATUS.md` | Inwentaryzacja na starym commicie, wymaga odswiezenia |
| Dawny `docs/ROADMAP.md` | Strategiczny kierunek; nie aktualny task/launch gate |
| Dawny `docs/UX_FIXES_IMPLEMENTATION_PLAN.md` | Stary plan UX oznaczony jako gotowy do wykonania |
| `docs/PR-*` | Historyczne PR/spec docs |
| `tasks/archive/*` | Archiwum evidence i zakonczonych zadan |
| `thoughts/*` | Evidence sesji agentow - nie usuwac automatycznie |

---

## Phase 2 - wykonane oznaczenia

- `docs/IMPLEMENTATION_PLAN_SPRINTS.md` oznaczony jako `SUPERSEDED`.
- `tasks/NEXT_TASK.md` zmieniony na `BLOCKED BEFORE BETA`.
- `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` oznaczony jako szczegolowy plan pomocniczy.
- `docs/DEPLOYMENT_CHECKLIST.md` oznaczony jako historical beta snapshot.
- `tasks/BETA_READY_SPRINT.md` oznaczony jako historical beta plan.
- `docs/FEATURE_STATUS.md` oznaczony jako stale inventory snapshot.

---

## Phase 3 - wykonane archiwizowanie

Wykonane bez usuwania zawartosci:

| Stara sciezka | Archiwum | Co zostalo w starej sciezce |
|---------------|----------|-----------------------------|
| `docs/IMPLEMENTATION_PLAN_SPRINTS.md` | `docs/archive/planning/IMPLEMENTATION_PLAN_SPRINTS.md` | Stub z linkiem do aktualnego planu |
| `docs/DEPLOYMENT_CHECKLIST.md` | `docs/archive/planning/DEPLOYMENT_CHECKLIST.md` | Stub z ostrzezeniem launchowym |
| `tasks/BETA_READY_SPRINT.md` | `tasks/archive/BETA_READY_SPRINT.md` | Stub z linkiem do `NEXT_TASK` |
| `docs/BETA_TESTING_PLAN.md` | `docs/archive/planning/BETA_TESTING_PLAN.md` | Stub z launch warning |
| `docs/FEATURE_STATUS.md` | `docs/archive/inventory/FEATURE_STATUS_2026-06-10.md` | Stub z informacja o starym commicie |
| `docs/UX_FIXES_IMPLEMENTATION_PLAN.md` | `docs/archive/planning/UX_FIXES_IMPLEMENTATION_PLAN.md` | Stub z linkiem do aktualnego planu |

Nie ruszono:

- `thoughts/` - evidence sesji agentow.
- `docs/PR-*` - historyczne PR/spec docs.
- `tasks/archive/*` - juz istniejace archiwum.

---

## Phase 4 - opcjonalne dalsze porzadki

W duzej mierze wykonane: historyczne PR-y, audyty, stare plany, strategie, statusy i snapshoty zostaly przeniesione do `docs/archive/` albo `tasks/archive/`.

Pozostale opcjonalne kroki:

1. Odswiezyc feature inventory od zera, jesli bedzie potrzebne agentom.
2. Zweryfikowac linki w archiwalnych dokumentach, jesli kiedys beda potrzebne.
3. Zrobic osobny cleanup `thoughts/`, tylko jesli uzytkownik tego chce.
4. Nie kasowac nic bez sprawdzenia linkow przez `rg`.
