# TMC Studio - Current Sprint Plan

**Data:** 2026-06-10
**Status:** ACTIVE SOURCE OF TRUTH dla kolejnych sprintow
**Bazowany na:** `docs/PLAN_BRAKUJACYCH_FUNKCJI.md`, `thoughts/2026-06-10/2350_master-verifier_sprint-plan-verification.md`, `docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md`

---

## Cel

Ten dokument jest krotkim, aktualnym planem operacyjnym dla `Delivery` i `MasterAutopilot`.

Jesli inne dokumenty planistyczne mowia cos sprzecznego o kolejnych sprintach, ten dokument ma pierwszenstwo do czasu kolejnej aktualizacji.

---

## Aktualna decyzja planu

1. **Security Sprint B1-B3** idzie pierwszy.
2. **Sprint G** idzie po security.
3. **Sprint E** oznacza teraz **Help Sidebar + Floating Help Button**.
4. Stary zakres "Sprint E - Reszta" z `docs/archive/planning/IMPLEMENTATION_PLAN_SPRINTS.md` jest historyczny i nie jest aktywnym sprintem.
5. **Sprint F** idzie po Sprint E, bo oba dotykaja overlayow w `CanvasShell.tsx` / `BoardPage.tsx`.

---

## Kolejnosc wykonania

| Kolejnosc | Sprint | Status | Zakres | Glowne dokumenty |
|-----------|--------|--------|--------|------------------|
| 1 | Security B1-B3 | NEXT | Post-logout data leak, RLS `project_shares`, RLS `profiles` / `project_folders` | `docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md` |
| 2 | Sprint A verification | OPTIONAL CHECK | Potwierdzenie quick wins i podpisow zawodnikow | `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` |
| 3 | Sprint G | PLANNED | Save Panel, ProjectsDrawer polish, status zapisu, thumbnail throttling | `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` |
| 4 | Sprint E | PLANNED | Help Sidebar + Floating Help Button | `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` |
| 5 | Sprint F | PLANNED | Tutorial overlay | `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` |
| 6 | Sprint I/J | LATER | Dalsze post-beta / quality / release items | `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` |
| 7 | Epik K/L | LATER | Premium / team / wieksze epiki | `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` |

---

## Konflikty rozstrzygniete

### Sprint E

`docs/archive/planning/IMPLEMENTATION_PLAN_SPRINTS.md` definiowal Sprint E jako "Reszta" (auto-expand, thumbnails, FAB, tutorial). Ten zakres jest juz nieaktualny jako aktywny Sprint E.

Aktualnie:

- **Sprint E** = Help Sidebar + Floating Help Button.
- **Thumbnail / auto-expand notes** = historyczne notatki albo osobny przyszly zakres, jesli wroci potrzeba.
- **Tutorial** = Sprint F.

### Beta readiness

`tasks/NEXT_TASK.md` nie powinien juz oznaczac bety jako gotowej do launchu, dopoki Security B1-B3 nie zostanie zamkniete i zweryfikowane.

---

## Jak uruchamiac agentow

### Security jako osobny Delivery

```text
@Delivery LOOP 3proby:
Zaimplementuj Security Sprint B1-B3 z docs/CURRENT_SPRINT_PLAN.md i docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md.

Wymagane skille / checklisty:
- security-privacy-review
- db-migration
- regression-testing

Nie dotykaj produkcji. Migracje testuj lokalnie. Zapisz evidence w thoughts/YYYY-MM-DD/.
```

### Wielosprintowy MasterAutopilot po security

```text
@MasterAutopilot LOOP 4 sprinty 3proby na sprint:
Wykonaj sprinty G, E, F oraz finalne release-readiness wedlug docs/CURRENT_SPRINT_PLAN.md.

Przed startem przeczytaj:
- docs/CURRENT_SPRINT_PLAN.md
- docs/PLAN_BRAKUJACYCH_FUNKCJI.md
- docs/AGENT_ORCHESTRATION.md
- .github/copilot-instructions.md

W kazdym sprincie dobierz minimalny zestaw skilli, wykonaj DeliveryPass, TesterPass, FixPass, MasterVerifier i SprintGate.
Pytaj uzytkownika tylko przy blockerach, decyzjach produktowych albo ryzyku prod/data/payment.
```

---

## Dokumenty pomocnicze

- `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` - szczegolowy plan zakresow.
- `docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md` - security / pre-launch blockers.
- `docs/AGENT_ORCHESTRATION.md` - workflow `Delivery` i `MasterAutopilot`.
- `thoughts/2026-06-10/2350_master-verifier_sprint-plan-verification.md` - ostatnia weryfikacja planu.
- `docs/archive/planning/IMPLEMENTATION_PLAN_SPRINTS.md` - historyczny plan A-D/E legacy, nie aktywny source of truth.
