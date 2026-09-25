# TMC Studio — zasady dla agentów

Czytaj przed każdą zmianą. Szczegóły procesu: `docs/AGENT_ORCHESTRATION.md`.

## Bieżący cel: launch

- Plan i pełna checklista (P0/P1/P2, etapy E1–E4): dokument „TMC Studio — audyt i plan wdrożenia”
  https://claude.ai/code/artifact/42984cc2-d597-4fdf-b590-b30adf0549bf (zakładka „Checklista launchu”).
- Zasada: nie zaczynaj etapu N+1, dopóki P0 z etapu N nie są zamknięte.
- Stan na 2026-09-26:
  - Na `main`: E1 zapis (#5), naprawa E2E w CI + plik migracji miniatur (#7), E2E zapisu i animacji (#6),
    monitoring zapisów w Sentry (#8).
  - Migracje produkcji zgodne z repo do 20260925011411 włącznie.
  - PR #9 (zespoły: dostęp Team dla członków, odrzucanie zaproszeń, ochrona właściciela projektu, testy RLS):
    migracja `20260926000000` NIE jest jeszcze na produkcji — najpierw `supabase db push`, potem merge #9.
  - Ochrona `main`: wymagane checki Lint & Type Check, Build, Run Tests, E2E Tests (DB Tests dodać po merge #9).
  - Sentry: uptime tmcstudio.app co 1 min + alert e-mail na nowe/eskalujące błędy; alerty `module:save`
    do skonfigurowania (`docs/ERROR_MONITORING.md`).
- Następne kroki: migracja #9 na prod → merge #9 → scenariusz `docs/TEAM_SCENARIO.md` na produkcji → reszta E2.
- Lokalnie: Playwright 1.61 nie importuje lokalnych modułów specs na Node 22.15.0 — E2E uruchamiaj na Node 20
  albo nowszym 22.x. Projekt dev Supabase jest wstrzymany.

## Niezmienniki (łamanie = błąd P0)

1. **Zapis dokumentu** (`apps/web/src/store/slices/documentSlice.ts`):
   - elementy z canvasa zapisuj zawsze do `steps[currentStepIndex]` (helper `withCurrentStepElements`), nigdy do `steps[0]`;
   - każdy zapis do chmury idzie przez `enqueueCloudWrite`; stan (`cloudProjectId`, `document`) czytaj wewnątrz zadania w kolejce;
   - każda zmiana `cloudProjectId` idzie w parze z `persistCloudProjectId`;
   - „brudność” dokumentu oceniaj licznikiem `changeSeq`, nie `updatedAt`.
   - dokument przed zapisem do chmury przechodzi `validateBoardDocument` (`@tmc/core`); błąd = brak zapisu w chmurze
     + zdarzenie `save.invalid_document` w Sentry (kopia lokalna zostaje).
2. **Baza danych:** migracje tylko jako pliki w `supabase/migrations` + `supabase db push`. Nigdy ręcznie w dashboardzie ani przez MCP.
   Nowa funkcja `SECURITY DEFINER`: `SET search_path`, sprawdzenie `auth.uid()`, jawne `REVOKE ... FROM PUBLIC, anon`.
   Po migracji uruchom advisora Supabase (security).
   Testy RLS/funkcji: pgTAP w `supabase/tests/database`, lokalnie `pnpm db:start` (raz) i `pnpm test:db`
   (resetuje wyłącznie lokalną bazę); w CI job „DB Tests”.
3. **Produkcja Supabase** = `pgacjczecyfnwsaadyvj`. `pnpm supabase:link` i `.env.local` wskazują projekt dev.
4. **i18n:** każdy nowy tekst w `packages/ui/src/locales/{en,pl,es}.ts`.
5. **Sekrety:** nigdy `service_role`, kluczy Stripe secret ani tokenów Postmark w kodzie frontendu.

## Definition of Done

- Fix błędu = test, który bez fixa nie przechodzi.
- Zielone: `pnpm test`, `pnpm test:functions`, `pnpm typecheck`, `pnpm build`, `pnpm lint`
  (`pnpm test:db` dla zmian w `supabase/migrations`)
  (E2E `pnpm e2e` dla zmian w edytorze, zapisie, auth, billingu).
- Praca na gałęzi, merge do `main` tylko przez PR z zielonym CI i review właściciela.
- Wersja + `CHANGELOG.md` przy wydaniu; odhaczony punkt w checkliście launchu.
