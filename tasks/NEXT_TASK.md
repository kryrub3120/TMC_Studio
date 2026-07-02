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

**Label Editor Upgrade — Wariant B, Multiline, Wyrownanie, Jeden Model Skrotow** — ✅ DONE (2026-07-01)
- TXT1-TXT6 zrealizowane: chip Wariant B (`TextNode.tsx`, `types.ts`), multiline editing (Enter=nowa linia, Ctrl/Cmd+Enter=zapisz, `useAutosizeTextarea.ts`), wyrownanie tekstu (`textAlign`, `Alt+←/→`, menu kontekstowe), ujednolicony `Shift+"+"/"-"` resize i naprawiony `Alt+↑/↓` color-cycle dla tekstu (`elementsSlice.ts`, `useKeyboardShortcuts.ts`).
- `T` (addTextAtCursor) i semantyka Escape (anuluj) nietkniete, zgodnie z wymaganiem.
- Dokumentacja zaktualizowana: `docs/COMMANDS_MAP.md`, `docs/DATA_MODEL.md`, `CHANGELOG.md`, cheat sheet (`CheatSheetOverlay.tsx`, `helpSidebarData.ts`), i18n (en/pl/es).
- Typecheck zielony dla `@tmc/core`, `@tmc/board`, `@tmc/ui`, `@tmc/web`.
- Nowy test `apps/web/src/store/slices/__tests__/labelEditorShortcuts.logic.test.ts` (resize dispatch per typ, text color-cycle regression, alignment cycle) — logika zweryfikowana recznie przez `node` (assercje przeszly), ale **`pnpm test`/`pnpm build` nie dalo sie uruchomic w tej sesji** — brakujacy natywny binarny pakiet `@rollup/rollup-linux-arm64-gnu` w sandboxie i zablokowany dostep do npm registry (infrastruktura, niezwiazane ze zmianami). Zalecane: uruchomic `pnpm test` i `pnpm build` lokalnie/w CI przed merge jako ostatni krok DoD.
- Szczegoly: `tasks/LABEL_EDITOR_UPGRADE_2026-07-01.md`.

**Auth Flow V3 — Web-Only Launch Flow** — ✅ DONE (2026-07-01)
- S-AUTH3.0 (popup regression fix), S-AUTH3.1 (web popup adapter + surface resolver), routing `/board` kanoniczne, `/app` → `/board` legacy redirect.
- Linki landing/pricing/auth/Stripe/billing portal zaktualizowane na `/board`.
- Desktop/Tauri scaffold (S-AUTH3.3) zachowany, nie blokuje web launchu.
- Dokumentacja: `docs/WEB_LAUNCH_CHECKLIST.md`, `docs/AUTH_FLOW.md`, `tasks/AUTH_FLOW_V3_COMPLEX_PLAN_2026-07-01.md`.
- Merge `develop` → `main` (commity: `42e7309`, `5a929f5`).
- Szczegóły: `tasks/AUTH_FLOW_V3_COMPLEX_PLAN_2026-07-01.md`, `docs/WEB_LAUNCH_CHECKLIST.md`, `docs/CURRENT_SPRINT_PLAN.md`.

**Auth Flow hotfix** — ✅ DONE (2026-06-20, wchłonięty przez Auth V3)
Google OAuth popup zamiast redirectu. Szczegoly: `docs/AUTH_FLOW.md`, `docs/CURRENT_SPRINT_PLAN.md`.

**Sprint 2 - Quality Gate i testy minimalne** — ✅ DONE (2026-06-22)
**Sprint 1 - Security & Billing Hardening** — ✅ DONE (2026-06-18)
**Sprint 0.5 - Release & Deploy Verification** — ✅ DONE (2026-06-18)
