# Master Autopilot — Rozbicie working tree na 10 commitów
**Data:** 2026-06-18
**Agent:** MasterAutopilot

## Zadanie
Rozbicie dużego, niezacommitowanego working tree (~80 plików) na czyste, tematyczne commity wg planu `tasks/COMMIT_PLAN_AND_BACKLOG_2026-06-18.md`.

## Decyzje i uzasadnienie

### Pliki mieszane (huby) — podejście
Zgodnie z planem, dla plików zawierających hunki z wielu funkcji:
- **`BoardPage.tsx`** — dominanta C6 (ławka/bottom bar), ale zawiera też tutorial (C3). Rozdzielenie hunków nie było bezpieczne → całość w C6, odnotowane w opisie.
- **`useUIStore.ts`** — zmiany C5 (arrowDefaults/zoneDefaults) + C8. Został dodany w całości w C8, z adnotacją w opisie.
- **`locales/{en,pl,es}.ts`** — klucze z C2/C3/C5/C7. Całość w C7, z adnotacją.
- **`AppShell.tsx`** / **`TopBar.tsx`** — billing + pitch + tutorial + defaulty. Całość w C8.

### Nowe pliki nieśledzone
- `netlify/functions/_auth.ts`, `_cors.ts`, `vitest.config.ts`, `__tests__/billing.security.test.ts` → C2 (billing)
- `packages/ui/src/pricingConfig.ts` → C2 (billing)
- `apps/web/src/shortcuts/shortcutMap.ts`, `shortcutMap.test.ts` → C8 (wiring)
- `packages/core/src/core.test.ts`, `packages/core/vitest.config.ts` → osobny C10 (test:core)
- `apps/web/public/og-image.svg` → C9 (docs/assets)
- `thoughts/2026-06-17/`, `thoughts/2026-06-18/` → C9 (docs)
- `docs/archive/planning/*_SUPERSEDED.md`, `tasks/archive/*_SUPERSEDED.md` → C9 (przeniesione przez git mv)

### Typecheck
- `netlify/functions/` ma pre-existing type errors (mocki, vitest config) — nie są regresją.
- Główna aplikacja i paczki — typecheck czysty.

## Wynik
10 commitów, czysty working tree, brak nieśledzonych plików.

## Status DoD
- [x] Wszystkie pliki przypisane do właściwych commitów
- [x] Working tree czysty (git status = empty)
- [x] Typecheck głównej aplikacji przechodzi
- [x] Żadne build artifacty (dist/) nie trafiły do commitów

## Dla następnej iteracji
- `netlify/functions/__tests__/billing.security.test.ts` ma problemy typów (mock Supabase, brak vitest types) — do naprawy w przyszłości, ale nie blokuje.
- 2 pre-existing TS6133/unused errors w `netlify/functions/stripe-webhook.ts` i `health.ts`.