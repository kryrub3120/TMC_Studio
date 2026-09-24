# TMC Studio — zasady dla agentów

Czytaj przed każdą zmianą. Szczegóły procesu: `docs/AGENT_ORCHESTRATION.md`.

## Bieżący cel: launch

- Plan i pełna checklista (P0/P1/P2, etapy E1–E4): dokument „TMC Studio — audyt i plan wdrożenia”
  https://claude.ai/code/artifact/42984cc2-d597-4fdf-b590-b30adf0549bf (zakładka „Checklista launchu”).
- Zasada: nie zaczynaj etapu N+1, dopóki P0 z etapu N nie są zamknięte.
- Stan na 2026-09-25: E1 zrobione w kodzie na gałęzi `fix/e1-save-integrity` (zapis + migracja
  `20260925000000_harden_function_privileges.sql`). Czeka na push, deploy i `supabase db push`.
  Następnie E2: E2E zapisu/animacji, monitoring zapisów (Sentry), scenariusz zespołowy.

## Niezmienniki (łamanie = błąd P0)

1. **Zapis dokumentu** (`apps/web/src/store/slices/documentSlice.ts`):
   - elementy z canvasa zapisuj zawsze do `steps[currentStepIndex]` (helper `withCurrentStepElements`), nigdy do `steps[0]`;
   - każdy zapis do chmury idzie przez `enqueueCloudWrite`; stan (`cloudProjectId`, `document`) czytaj wewnątrz zadania w kolejce;
   - każda zmiana `cloudProjectId` idzie w parze z `persistCloudProjectId`;
   - „brudność” dokumentu oceniaj licznikiem `changeSeq`, nie `updatedAt`.
2. **Baza danych:** migracje tylko jako pliki w `supabase/migrations` + `supabase db push`. Nigdy ręcznie w dashboardzie ani przez MCP.
   Nowa funkcja `SECURITY DEFINER`: `SET search_path`, sprawdzenie `auth.uid()`, jawne `REVOKE ... FROM PUBLIC, anon`.
   Po migracji uruchom advisora Supabase (security).
3. **Produkcja Supabase** = `pgacjczecyfnwsaadyvj`. `pnpm supabase:link` i `.env.local` wskazują projekt dev.
4. **i18n:** każdy nowy tekst w `packages/ui/src/locales/{en,pl,es}.ts`.
5. **Sekrety:** nigdy `service_role`, kluczy Stripe secret ani tokenów Postmark w kodzie frontendu.

## Definition of Done

- Fix błędu = test, który bez fixa nie przechodzi.
- Zielone: `pnpm test`, `pnpm test:functions`, `pnpm typecheck`, `pnpm build`, `pnpm lint`
  (E2E `pnpm e2e` dla zmian w edytorze, zapisie, auth, billingu).
- Praca na gałęzi, merge do `main` tylko przez PR z zielonym CI i review właściciela.
- Wersja + `CHANGELOG.md` przy wydaniu; odhaczony punkt w checkliście launchu.
