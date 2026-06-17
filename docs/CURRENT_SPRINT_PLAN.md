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

1. **Sprint E** — Help Sidebar + Floating Help Button. ✅ DONE
2. **Sprint F** — 6-krokowy Coach Tour onboarding. ✅ DONE
3. **Sprint G** — Save Panel / ProjectsDrawer / Autosave (wszystkie zadania L1). ✅ DONE
4. **Security Sprint B1-B3** — Post-logout data leak, RLS project_shares, RLS profiles/folders. ✅ DONE (zweryfikowane w kodzie 2026-06-12)
5. **Sprint A** — Quick Wins + Player Labels + Enter→edit. ✅ DONE (zweryfikowane w kodzie 2026-06-12)
6. **Sprint Docs Cleanup** — audyt i aktualizacja 6 dokumentów. ✅ DONE
7. Stary zakres "Sprint E - Reszta" — historyczny, nieaktywny.

---

## Stan obecny

**Wszystkie sprinty A-G domknięte. Migracje DB na produkcji (6/6).** Kolejny krok to decyzja o betcie:

1. **Release-readiness assessment** — uruchomić `@Delivery` ze skillem `release-readiness`
2. **Stripe QA** — uruchomić `@StripeTester`
3. ~~Produkcyjne migracje DB~~ — `supabase db push` ✅ **ZROBIONE (2026-06-17)**
4. **Netlify deploy** — wdrożenie
5. **Beta launch**

---

## Kolejnosc

| Kolejnosc | Sprint | Status | Zakres |
|-----------|--------|--------|--------|
| 1 | Security B1-B3 | ✅ DONE | Post-logout data leak, RLS project_shares, profiles, folders |
| 2 | Sprint A verification | ✅ DONE | Quick Wins, player labels, Enter→edit, aria-label, cursors |
| 3 | Sprint G | ✅ DONE | Save Panel, ProjectsDrawer polish, pinned, rename, color chip, thumbnail |
| 4 | Sprint E | ✅ DONE | Help Sidebar + Floating Help Button |
| 5 | Sprint F | ✅ DONE | Coach Tour onboarding |
| 6 | **Produkcyjne migracje DB** | ✅ **DONE (2026-06-17)** | 6 migracji 20260615000000-05 na prod, Local=Remote |
| 7 | Release-readiness | NEXT | Pełna ocena gotowości do bety |
| 8 | Stripe QA | NEXT | Weryfikacja checkout/webhook/subscription |
| 9 | Sprint I/J/K/L | LATER | Post-beta / premium / team features |

---
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
