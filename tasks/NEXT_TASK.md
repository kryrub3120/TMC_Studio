# Current Task: Sprint UX-C — Editor Viewport, Pan i Squad Bench

**Status:** 🟢 READY
**Source of truth:** `tasks/UX_EDITOR_VIEWPORT_BENCH_2026-06-29.md`

---

## Aktualne zadanie

**Sprint UX-C — Editor Viewport, Pan i Squad Bench** — 🟢 READY

Cel: tablica ma byc glownym, duzym i wygodnym obszarem pracy na laptopach; po powiekszeniu ma dac sie naturalnie przesuwac; Squad Bench ma startowac ukryty i zapamietywac preferencje; overlaye nie moga nachodzic na siebie.

Update 2026-06-29 po rownoleglym agencie: CSP/auth/legal/topbar/cursor-placement byly ruszone w osobnym strumieniu, ale C1-C6 UX-C pozostaja TODO. Szczegoly i lista plikow dirty sa w sekcji "Aktualizacja po rownoleglym agencie" w source of truth.

Zakres:

1. Domyslny rozmiar tablicy + poprawne `Dopasuj do widoku`.
2. Pan przez drag pustego obszaru tablicy, bez psucia dragowania elementow.
3. Overlay safe areas dla zoom/help/squad/bottom bar/inspector.
4. Squad Bench default hidden.
5. Squad Bench visibility jako preferencja uzytkownika, persisted lokalnie i w cloud prefs po zalogowaniu.
6. Manual QA na viewportach laptopowych.

Command dla agenta:

```text
Zrealizuj `tasks/UX_EDITOR_VIEWPORT_BENCH_2026-06-29.md`.
Najpierw przeczytaj caly brief oraz `docs/UX_PATTERNS.md`, `docs/DESIGN_SYSTEM.md`.
Uwzglednij sekcje "Aktualizacja po rownoleglym agencie — 2026-06-29".
Nie ruszaj Postmarka, mailingu ani landing page.
Nie cofaj zmian drugiego agenta; szczegolnie zachowaj cursor position tracking w `useCanvasEventsController.ts`.
Po implementacji uruchom typecheck/test/build i wypelnij evidence manual QA dla viewportow laptopowych.
```

---

## Zakonczone / kontekst

**Auth Flow hotfix** — ✅ DONE (2026-06-20)  
Google OAuth w popupie zamiast redirectu. Szczegoly: `docs/AUTH_FLOW.md`, `docs/CURRENT_SPRINT_PLAN.md`.

**Sprint 2 - Quality Gate i testy minimalne** — ✅ DONE (2026-06-22)  
CI/test/build/e2e gate opisane w `docs/CURRENT_SPRINT_PLAN.md`.

**Sprint 1 - Security & Billing Hardening** — ✅ DONE (2026-06-18)
**Sprint 0.5 - Release & Deploy Verification** — ✅ DONE (2026-06-18)
