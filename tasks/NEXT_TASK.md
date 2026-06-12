# Current Task: COACH TOUR + DOCS CLEANUP — READY FOR COMMIT

## Status: READY FOR COMMIT

---

## Co zostało zrobione

### Sprint F — Coach Tour onboarding ✅
6-krokowy first-experience Coach Tour z spotlight, strzałką, keycaps i mini-demo:
- `packages/ui/src/TutorialOverlay.tsx` — główny komponent overlay
- `packages/ui/src/tutorialSteps.ts` — definicje 6 kroków
- Integracja w `useUIStore.ts`, `BoardPage.tsx`, `BoardCanvasSection.tsx`
- Restart z HelpSidebar

### Sprint E — Help Sidebar + Floating Help Button ✅
- `packages/ui/src/FloatingHelpButton.tsx` — pływający przycisk (z-floating)
- `packages/ui/src/HelpSidebar.tsx` — panel pomocy/skrótów/statusu (z-sidebar, non-modal)
- `packages/ui/src/helpSidebarData.ts` — dane shortcutów i wskazówek

### Sprint G — Save Panel / ProjectsDrawer / Autosave rozszerzenia ✅
- `packages/ui/src/ProjectsDrawer.tsx` — ulepszony panel projektów
- `apps/web/src/services/AutosaveService.ts` — thumbnail throttling, projectSaveStatus
- `apps/web/src/store/useUIStore.ts` — stany: projektSaveStatus, helpSidebarOpen, tutorial

### Sprint Docs Cleanup ✅
Aktualizacja dokumentacji po wprowadzonych zmianach:
- `docs/DESIGN_SYSTEM.md` §7 — dodane tokeny z-sidebar, z-floating, z-tutorial
- `docs/COMMANDS_MAP.md` — dodane ~40 brakujących skrótów (equipment, arrow numbering, orientation, text, zoom)
- `docs/DATA_MODEL.md` §5 — kompletna sekcja DB Schema (project_folders, project_tags, user_preferences, stripe_webhook_events, RLS project_shares, is_pinned)
- `docs/DRAG_DROP_PATTERN.md` — nowa sekcja Virtual Canvas Architecture (zoom, pan, viewport lock, auto-fit)
- `docs/ARCHITECTURE_OVERVIEW.md` — rozszerzony Service Layer (AutosaveService thumbnail), dodane komponenty E/F/G
- `docs/SYSTEM_ARCHITECTURE.md` §11 — dodane Hard Rules dla HelpSidebar, TutorialOverlay, AutosaveService, ProjectsDrawer

### Zweryfikowane jako aktualne (bez zmian)
- `ENTITLEMENTS.md` ✅, `IMPLEMENTATION_CONTRACTS.md` ✅, `DB_CONVENTIONS.md` ✅
- `PRODUCT_PHILOSOPHY.md` ✅, `INDEX.md` ✅, `FEATURE_SPEC.md` ✅
- `UX_PATTERNS.md` ✅, `DOCUMENTATION_CLEANUP_PLAN.md` ✅

---

## Source of Truth

- `docs/CURRENT_SPRINT_PLAN.md` — aktualny plan operacyjny (zaktualizowany)
- `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` — szczegolowy opis sprintow G/E/F i dalszych epikow
- `docs/FEATURE_SPEC.md` — kanoniczne zachowanie produktu
- `CHANGELOG.md` — wpis do commita/release notes
- `docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md` — security / pre-launch blockers
- `docs/AGENT_ORCHESTRATION.md` — jak uruchamiac Delivery i MasterAutopilot

---

## Next Order

1. **Security Sprint B1-B3** 🔴 NEXT
   - B1: post-logout data leak
   - B2: RLS na `project_shares`
   - B3: RLS na `profiles` / `project_folders`
2. **Sprint A verification** (opcjonalny, szybki sanity check)
3. **Sprint G dokończenie** — pozostałe zadania (pinned section UI, inline rename, folder color chip)
4. **Release-readiness / beta verification**

---

## Immediate Prompt

```text
Przygotuj commit:

feat(onboarding): add coach tour tutorial

Po commicie wracamy do Security Sprint B1-B3 z docs/CURRENT_SPRINT_PLAN.md i docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md.
```

---

## Beta Checklist Resume

Po security i release-readiness mozna wrocic do beta checklisty z:

- `docs/archive/planning/BETA_TESTING_PLAN.md`
- `docs/archive/planning/DEPLOYMENT_CHECKLIST.md`
