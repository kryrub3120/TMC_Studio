# TMC Studio - Current Sprint Plan

**Data:** 2026-06-12
**Status:** ACTIVE SOURCE OF TRUTH dla kolejnych sprintow
**Bazowany na:** `docs/PLAN_BRAKUJACYCH_FUNKCJI.md`, `thoughts/2026-06-10/2350_master-verifier_sprint-plan-verification.md`, `docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md`

---

## Cel

Ten dokument jest krotkim, aktualnym planem operacyjnym dla `Delivery` i `MasterAutopilot`.

Jesli inne dokumenty planistyczne mowia cos sprzecznego o kolejnych sprintach, ten dokument ma pierwszenstwo do czasu kolejnej aktualizacji.

---

## Aktualna decyzja planu

1. **Sprint E** jest wdrozony jako Help Sidebar + restart tutoriala. ✅ DONE
2. **Sprint F** jest wdrozony jako 6-krokowy Coach Tour onboarding. ✅ DONE
3. **Sprint Docs Cleanup** (obecny) — aktualizacja dokumentacji po sprintach E/F/G.
4. **Security Sprint B1-B3** pozostaje najwazniejszym blockerem przed publicznym ruchem/beta launch.
5. **Sprint G** idzie po security, bo dotyka zapisu, projektow i statusu sync.
6. Stary zakres "Sprint E - Reszta" z `docs/archive/planning/IMPLEMENTATION_PLAN_SPRINTS.md` jest historyczny i nie jest aktywnym sprintem.

---

## Kolejnosc wykonania

| Kolejnosc | Sprint | Status | Zakres | Glowne dokumenty |
|-----------|--------|--------|--------|------------------|
| 1 | Security B1-B3 | NEXT | Post-logout data leak, RLS `project_shares`, RLS `profiles` / `project_folders` | `docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md` |
| 2 | Sprint A verification | OPTIONAL CHECK | Potwierdzenie quick wins i podpisow zawodnikow | `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` |
| 3 | Sprint G | PLANNED | Save Panel, ProjectsDrawer polish, status zapisu, thumbnail throttling | `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` |
| 4 | Sprint E | DONE | Help Sidebar + restart tutoriala | `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` |
| 5 | Sprint F | DONE | Coach Tour onboarding, 6 krokow, spotlight/arrow/keycaps/demo | `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` |
| 6 | Sprint I/J | LATER | Dalsze post-beta / quality / release items | `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` |
| 7 | Epik K/L | LATER | Premium / team / wieksze epiki | `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` |

---

## Konflikty rozstrzygniete

### Sprint E

`docs/archive/planning/IMPLEMENTATION_PLAN_SPRINTS.md` definiowal Sprint E jako "Reszta" (auto-expand, thumbnails, FAB, tutorial). Ten zakres jest juz nieaktualny jako aktywny Sprint E.

Aktualnie:

- **Sprint E** = Help Sidebar + Floating Help Button.
- **Thumbnail / auto-expand notes** = historyczne notatki albo osobny przyszly zakres, jesli wroci potrzeba.
- **Tutorial** = Sprint F, wdrozony jako Coach Tour w `TutorialOverlay.tsx`.

### Sprint F

Pierwotny plan mowil o prostym 5-step tooltipie tylko dla pustej tablicy. Po decyzji produktowej zakres zostal rozszerzony i wdrozony jako 6-krokowy first-experience Coach Tour:

- wskazywanie realnych elementow UI przez `data-tour`,
- spotlight + strzalka + target label,
- keycaps i mini-demo w kazdym kroku,
- restart z Help Sidebar,
- brak blokady `elements.length === 0`, bo nowy board startuje z gotowa formacja.

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
