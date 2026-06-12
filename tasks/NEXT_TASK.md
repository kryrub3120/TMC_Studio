# Current Task: ALL SPRINTS A-G COMPLETE — BETA BLOCKERS CLEARED

## Status: ALL DONE — READY FOR BETA DECISION

---

## Co zostało zrobione (kompletny audyt 2026-06-12)

### Security Sprint B1-B3 ✅ (zweryfikowane w kodzie)
| Task | Status | Dowód |
|------|--------|-------|
| **B1** — Post-logout data leak | ✅ DONE | `useAuthStore.ts`: `signOut()` czyści board, localStorage `tmc-studio-board`, autosave timer |
| **B2** — RLS `project_shares` | ✅ DONE | Migracja `20260209000000_reenable_rls_project_shares.sql` — RLS enabled, deny-by-default |
| **B3** — RLS `profiles` + `project_folders` | ✅ DONE | profiles RLS + 3 policies (initial schema), folders RLS + 4 policies (20260109000002) |

### Sprint A — Quick Wins + Player Labels ✅ (zweryfikowane w kodzie)
| Komponent | Dowód |
|-----------|--------|
| aria-label na ZoomWidget | ZoomWidget.tsx l.88,120,138,155 |
| Toast undo/redo | useKeyboardShortcuts.ts l.331-335 |
| Cursor states per tool | cursorUtils.ts istnieje, używany w BoardCanvasSection |
| Podpisy zawodników (showLabel) | PlayerNode.tsx l.611-644 |
| Enter→focus label | useKeyboardShortcuts.ts l.40,619 |

### Sprint F — Coach Tour onboarding ✅
- `TutorialOverlay.tsx` — 6 kroków, spotlight, arrow, keycaps, mini-demo
- `tutorialSteps.ts` — definicje kroków z data-tour targetami
- Restart z HelpSidebar (`replayTutorial()`)

### Sprint E — Help Sidebar + Floating Help Button ✅
- `FloatingHelpButton.tsx` — pływający przycisk (z-floating)
- `HelpSidebar.tsx` — panel pomocy/skrótów/statusu (z-sidebar, non-modal, 4 sekcje)
- `helpSidebarData.ts` — współdzielona struktura shortcutów

### Sprint G — Save Panel / ProjectsDrawer / Autosave ✅ (wszystkie zadania)
| Komponent | Status | Dowód |
|-----------|--------|-------|
| ProjectsDrawer — lista projektów | ✅ DONE | Sortowanie `updatedAt DESC`, pinned first |
| ProjectsDrawer — pinned section | ✅ DONE | `isPinned` sorting + 📌 indicator + Pin/Unpin context menu |
| ProjectsDrawer — inline rename | ✅ DONE | `handleDoubleClick` → inline `renameValue` input (Enter/ESC) |
| ProjectsDrawer — folder color chip | ✅ DONE | `folder.color` div + `FolderColorPicker` w CreateFolderModal/FolderOptionsModal |
| ProjectsDrawer — delete z ConfirmModal | ✅ DONE | ConfirmModal zamiast window.confirm |
| ProjectsDrawer — empty states | ✅ DONE | Guest → "Zaloguj się", Authenticated → "Brak projektów" |
| AutosaveService — thumbnail throttling | ✅ DONE | 30s throttle, forceThumbnail() na pierwszy zapis |
| useUIStore — projectSaveStatus | ✅ DONE | 'unsaved' \| 'saving' \| 'saved' \| 'error' |

### Sprint Docs Cleanup ✅
- 6 dokumentów zaktualizowanych, 7 zweryfikowanych jako aktualne
- `docs/archive/` — wszystkie historyczne plany, PR-y, audyty zarchiwizowane
- `DOCUMENTATION_CLEANUP_PLAN.md` — oznaczony jako WYKONANY

---

## Source of Truth

- `docs/CURRENT_SPRINT_PLAN.md` — aktualny plan operacyjny
- `docs/PLAN_BRAKUJACYCH_FUNKCJI.md` — szczegolowy opis sprintow i dalszych epikow
- `docs/FEATURE_SPEC.md` — kanoniczne zachowanie produktu
- `CHANGELOG.md` — wpis do commita/release notes
- `docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md` — security / pre-launch blockers (✅ zweryfikowane jako fixed)
- `docs/AGENT_ORCHESTRATION.md` — jak uruchamiac Delivery i MasterAutopilot

---

## Next Steps — BETA DECISION POINT

Wszystkie blokery S0-SG są domknięte. Kolejny krok to decyzja o **beta readiness**:

1. **Release-readiness assessment** — uruchomić `@Delivery` ze skillem `release-readiness`
   - Weryfikacja dokumentacji
   - Deployment checklist
   - Manual QA
2. **Stripe QA** — uruchomić `@StripeTester` do weryfikacji checkout/webhook/subscription
3. **Produkcyjne migracje DB** — wykonać `supabase db push` na hosted Supabase
4. **Netlify deploy** — wdrożenie na produkcję
5. **Beta launch** — ogłoszenie + monitoring

### 💡 Rekomendacja
Przed betą uruchomić `release-readiness` skill (`.github/skills/release-readiness/SKILL.md`) który przeprowadzi pełną ocenę gotowości do releasu.

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
