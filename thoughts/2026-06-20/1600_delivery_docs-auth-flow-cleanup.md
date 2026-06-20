# Delivery — dokumentacja auth flow i porządki w docs/
**Data:** 2026-06-20
**Iteracja:** 1

## Zadanie
Opisać ostatnią zmianę (Google OAuth popup flow) w dokumentacji, zrobić porządek w docs/ i tasks/

## Decyzje i uzasadnienie
- **Nowy dokument AUTH_FLOW.md** — pełny opis architektury, sekwencji, maszyny stanów, polityki czyszczenia URL. Osobny plik, bo SYSTEM_ARCHITECTURE.md i FEATURE_SPEC.md są już długie.
- **Sekcja 15 w FEATURE_SPEC.md** — dodana jako user-facing spec auth flow. Przesunięto Pricing na sekcję 16.
- **AUDYT_KOMPLEKSOWY** — dodany sprint Auth Flow jako ad-hoc hotfix, zaktualizowana tabela kolejności.
- **SYSTEM_ARCHITECTURE.md** — dodana sekcja Google OAuth Popup Flow z diagramem ASCII.
- **CURRENT_SPRINT_PLAN.md** — Sprint 2 oznaczony jako PAUSED (przerwany przez auth hotfix), dodany wpis Auth Flow.
- **NEXT_TASK.md** — zaktualizowany wskazuje Sprint 2 jako następny.
- **Archiwizacja** — COMMIT_PLAN_AND_BACKLOG i SPRINT_EDITOR_PROPERTIES przeniesione do tasks/archive/ z sufiksem _DONE.
- **Nie ruszane** — thoughts/2026-06-18/2350_master-autopilot_commit-split-complete.md i tmc_google_logo_120.png (nieśledzone, nie nasze).

## Co zrobiłem
1. docs/AUTH_FLOW.md — utworzony z pełnym opisem (11 sekcji, diagramy, sekwencje, tabela plików)
2. docs/FEATURE_SPEC.md — dodana sekcja 15 (Authentication & Auth Flow), przesunięta numeracja Pricing na 16
3. docs/INDEX.md — dodany AUTH_FLOW.md do source of truth i tabeli
4. docs/CURRENT_SPRINT_PLAN.md — dodany wpis Auth Flow hotfix, Sprint 2 → PAUSED
5. docs/AUDYT_KOMPLEKSOWY_2026-06-18.md — dodany Sprint Auth Flow, zaktualizowana tabela kolejności i prompt
6. docs/SYSTEM_ARCHITECTURE.md — dodana sekcja Google OAuth Popup Flow z diagramem
7. tasks/NEXT_TASK.md — przepisany na aktualny stan
8. tasks/archive/ — przeniesione stare plany

## Status DoD
- [x] Dokumentacja auth flow istnieje (AUTH_FLOW.md)
- [x] FEATURE_SPEC ma sekcję auth (sec 15)
- [x] INDEX.md wskazuje nowe dokumenty
- [x] CURRENT_SPRINT_PLAN odzwierciedla aktualny stan
- [x] NEXT_TASK wskazuje Sprint 2
- [x] Stare plany zarchiwizowane
- [x] SYSTEM_ARCHITECTURE uwzględnia popup flow
- [x] AUDYT zaktualizowany o zakończony sprint
- [x] Wszystko commitnięte i zmergowane do main
