---
name: release-readiness
description: Ocena gotowosci sprintu, bety albo releasu TMC Studio: checks, docs, blockers, Stripe TEST mode, deployment checklist i manual QA.
---

# Skill: Release Readiness

Ocena, czy zestaw zmian jest gotowy do bety/releasu albo do przekazania userowi.

---

## Kiedy uzywac

- Po zakonczeniu wszystkich sprintow MasterAutopilot.
- Przed merge/release/beta launch.
- Po zmianach platnosci, auth, DB, entitlements, export, cloud sync.
- Gdy user pyta "czy mozemy to puszczac?".

---

## Zawsze przeczytaj najpierw

- `docs/CURRENT_SPRINT_PLAN.md`.
- `tasks/NEXT_TASK.md`.
- `docs/archive/planning/DEPLOYMENT_CHECKLIST.md`, jesli potrzebny historyczny kontekst deploy.
- `docs/archive/planning/BETA_TESTING_PLAN.md`, jesli potrzebny historyczny kontekst beta.
- `docs/archive/inventory/FEATURE_STATUS_2026-06-10.md`, jesli potrzebna stara inwentaryzacja.
- `docs/archive/strategy/ROADMAP.md`, jesli potrzebny historyczny roadmap context.
- `docs/INDEX.md`.
- `CHANGELOG.md`.
- `docs/AGENT_ORCHESTRATION.md`, jesli release obejmuje prace agentow.
- Final Master Summary / sprint thoughts.

---

## Release gate checklist

### Repo / code

- [ ] `git status` znany i brak nieoczekiwanych plikow.
- [ ] Zmiany sa w zakresie zatwierdzonego planu.
- [ ] Brak przypadkowych zmian w `.env*`, prod config, generated junk.
- [ ] Brak nowych dependency bez zgody.

### Commands

Dobierz do zakresu:

```bash
pnpm typecheck
pnpm build
pnpm lint
pnpm --filter @tmc/web test
```

Jesli komendy nie zostaly uruchomione, zapisz dlaczego i jakie ryzyko zostaje.

### Docs

- [ ] `docs/FEATURE_SPEC.md` aktualny po user-facing changes.
- [ ] `docs/INDEX.md` aktualny.
- [ ] `docs/DATA_MODEL.md` aktualny po DB changes.
- [ ] `docs/ENTITLEMENTS.md`/payment docs aktualne po billing changes.
- [ ] `CHANGELOG.md` zaktualizowany, jesli to release-worthy.

### Product / QA

- [ ] Krytyczne happy paths przetestowane.
- [ ] Mobile/manual UI checks wykonane, jesli UI.
- [ ] Undo/redo sprawdzone, jesli canvas mutation.
- [ ] Guest/free/pro/team states sprawdzone, jesli entitlements.
- [ ] Stripe TEST mode sprawdzony, jesli billing.
- [ ] DB/RLS local verification wykonane, jesli migrations.

### Blockers

- [ ] Brak `BLOCKER` w Master Summary.
- [ ] Brak nieuzasadnionych `PARTIAL`.
- [ ] Known risks maja ownera/decyzje.
- [ ] Production actions sa oznaczone jako manual user steps.

---

## Beta readiness extras

- [ ] TEST Stripe mode potwierdzony.
- [ ] Beta test scenarios sa jasne.
- [ ] Feedback loop opisany.
- [ ] User-facing copy nie obiecuje niegotowych funkcji.
- [ ] Privacy/Terms/Cookie docs nie sa sprzeczne z flow.

---

## Expected evidence

- Lista przeczytanych dokumentow.
- Wyniki komend.
- Lista manual QA.
- Status docs.
- Lista blockerow/ryzyk.
- Decyzja: `READY`, `READY WITH RISKS`, `NOT READY`, `BLOCKED`.
- Konkretne next steps przed release/beta.
