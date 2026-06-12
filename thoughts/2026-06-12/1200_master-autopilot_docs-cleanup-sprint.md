# MasterAutopilot — Docs Cleanup Sprint
**Data:** 2026-06-12 12:00
**Iteracja:** 1
**Limit:** 30 min

## Zadanie
Przeprowadzić pełny audyt dokumentacji vs kod po sprintach E/F/G, zaktualizować nieaktualne dokumenty, zrobić commit.

## Decyzje i uzasadnienie
- Audyt (Explorer subagent) wykazał ~79% aktualności dokumentacji
- **HIGH PRIORITY:** DESIGN_SYSTEM.md §7 (brak 3 z-index tokenów), DATA_MODEL.md §5 (brak 5 tabel DB), COMMANDS_MAP.md (brak ~40 skrótów)
- **MEDIUM PRIORITY:** DRAG_DROP_PATTERN.md (brak Virtual Canvas), SYSTEM_ARCHITECTURE.md (brak Hard Rules dla nowych komponentów), ARCHITECTURE_OVERVIEW.md (brak komponentów E/F/G)
- **AKTUALNE:** ENTITLEMENTS.md, IMPLEMENTATION_CONTRACTS.md, DB_CONVENTIONS.md, PRODUCT_PHILOSOPHY.md, INDEX.md, FEATURE_SPEC.md, UX_PATTERNS.md — bez zmian

## Co zrobiłem

### 1. DESIGN_SYSTEM.md §7
- Dodano 3 brakujące tokeny: `z-sidebar` (25), `z-floating` (35), `z-tutorial` (38)

### 2. COMMANDS_MAP.md
- Dodano sekcję Equipment (J, Shift+J, M, Shift+M, K, Shift+K, Y, Q, U + interakcje)
- Dodano sekcję Arrow Numbering (→, Shift+N, Shift+A, Shift+R, Renumber)
- Dodano sekcję Player Orientation & Vision (V, Shift+V, [, ], Alt+drag, Alt+scroll)
- Dodano sekcję Editing (text) — ↑↓←→, Shift+↑/↓
- Rozszerzono View o G (grid), I (inspector), +/-(plain), Ctrl+Scroll, 0 (fit)
- Poprawiono opis Arrow (dodano shoot type + prawidłowe kolory)
- Poprawiono opis Text (dodano wszystkie interakcje)
- Dodano Shift+P, Shift+C, resize radius, cycleShape (Shift+S)

### 3. DATA_MODEL.md §5 — kompletna wymiana sekcji Database Schema
- `profiles` — dodano stripe_customer_id, preferences JSONB, subscription_tier
- `projects` — dodano folder_id, tags, is_favorite, is_pinned, position
- `project_folders` — pełna definicja z parent_id, is_pinned, RLS
- `project_tags` — nowa tabela
- `project_shares` — z RLS (deny-by-default po migracji 20260209000000)
- `stripe_webhook_events` — nowa tabela dla idempotencji
- RLS Summary — wszystkie polityki

### 4. DRAG_DROP_PATTERN.md
- Nowa sekcja "Virtual Canvas Architecture" — DOM layout, render model, zoom & pan, viewport lock, auto-fit/auto-center, mobile touch, zoom-dependent features

### 5. ARCHITECTURE_OVERVIEW.md
- Rozszerzono AutosaveService o thumbnail throttling, projectSaveStatus, flush(), forceThumbnail()
- Dodano listę nowych komponentów E/F/G: FloatingHelpButton, HelpSidebar, TutorialOverlay, ProjectsDrawer, AutosaveService

### 6. SYSTEM_ARCHITECTURE.md §11
- Dodano Tier 1b — New Components Rules dla:
  - HelpSidebar & FloatingHelpButton (non-modal, z-index, ESC close)
  - TutorialOverlay (z-index, trigger warunki, data-tour, fallback)
  - AutosaveService & Thumbnail (debounce, throttling, offline, conflict)
  - ProjectsDrawer (pozycja, sortowanie, ConfirmModal, empty states)

### 7. CURRENT_SPRINT_PLAN.md
- Dodano wpis o Sprint Docs Cleanup jako obecnym sprincie

### 8. NEXT_TASK.md
- Kompletna aktualizacja: opis wszystkich wykonanych sprintów (E, F, G, Docs Cleanup)
- Aktualizacja Source of Truth i Next Order

### 9. Memory repo/docs_update_habit.md — zaktualizowano wzorzec po archiwizacji FEATURE_STATUS

## Napotkane problemy
- COMMANDS_MAP.md miał nieaktualne kolory arrow (pass: red #ff0000, run: blue #3b82f6) — poprawiono na aktualne (pass: #1a1a1a, run: #f97316)
- FEATURE_SPEC.md był już aktualny (zawierał §14 Onboarding & Help) — nie wymagał zmian
- CHANGELOG.md był już aktualny — nie wymagał zmian
- INDEX.md był aktualny — nie wymagał zmian

## Evidence
- DESIGN_SYSTEM.md §7 — dodane 3 wiersze, potwierdzone z tokens.css
- COMMANDS_MAP.md — ~40 nowych skrótów, potwierdzone z FEATURE_SPEC.md §10
- DATA_MODEL.md §5 — potwierdzone z 6 migracjami Supabase
- DRAG_DROP_PATTERN.md — potwierdzone z BoardPage.tsx, BoardCanvasSection.tsx, CanvasAdapter.tsx
- SYSTEM_ARCHITECTURE.md §11 — potwierdzone z FloatingHelpButton.tsx, HelpSidebar.tsx, TutorialOverlay.tsx, AutosaveService.ts
- ARCHITECTURE_OVERVIEW.md — potwierdzone z packages/ui/src/index.ts

## Pliki zmienione:
1. docs/DESIGN_SYSTEM.md
2. docs/COMMANDS_MAP.md
3. docs/DATA_MODEL.md
4. docs/DRAG_DROP_PATTERN.md
5. docs/ARCHITECTURE_OVERVIEW.md
6. docs/SYSTEM_ARCHITECTURE.md
7. docs/CURRENT_SPRINT_PLAN.md
8. tasks/NEXT_TASK.md
9. memories/repo/docs_update_habit.md
10. thoughts/2026-06-12/1200_master-autopilot_docs-cleanup-sprint.md

## Status DoD
- [x] Kod dziala zgodnie z zatwierdzonym planem (tylko dokumentacja)
- [x] Dokumentacja zaktualizowana: 6 dokumentów naprawionych, 2 zaktualizowane
- [x] FEATURE_SPEC.md, ENTITLEMENTS.md, DB_CONVENTIONS.md, PRODUCT_PHILOSOPHY.md, INDEX.md, UX_PATTERNS.md — zweryfikowane jako aktualne
- [x] UI zgodne z design systemem — N/A (tylko dokumentacja)
- [x] Migracja bezpieczna — N/A (tylko dokumentacja)
- [x] Brak znanych regresji — dokumentacja nie wpływa na kod
- [x] Evidence zapisane w raporcie
- [x] Plik thoughts/ zapisany

## Dla nastepnej iteracji / nastepnego agenta
- Security Sprint B1-B3 to najbliższy bloker przed beta launch
- Po jego wykonaniu należy ponownie sprawdzić docs pod kątem zmian DB/Rls
- Sprint G (Save Panel) ma pozostałe zadania L1 (pinned section UI, inline rename, folder color chip)