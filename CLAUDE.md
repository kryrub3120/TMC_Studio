# TMC Studio — zasady dla agentów

Czytaj przed każdą zmianą. Szczegóły procesu: `docs/AGENT_ORCHESTRATION.md`.

## Bieżący cel: launch

- Plan i pełna checklista (P0/P1/P2, etapy E1–E4): dokument „TMC Studio — audyt i plan wdrożenia”
  https://claude.ai/code/artifact/42984cc2-d597-4fdf-b590-b30adf0549bf (zakładka „Checklista launchu”).
- Zasada: nie zaczynaj etapu N+1, dopóki P0 z etapu N nie są zamknięte.
- Stan na 2026-09-25 (wieczór):
  - E1 zapis: naprawiony w PR #5 (`fix/e1-save-integrity`), E2E zapisu/animacji w PR #6
    (`test/e2-save-animation-e2e`). Oba NIE są jeszcze zmergowane ani wdrożone na produkcję.
  - Migracje produkcji zastosowane (20260622×2, 20260811 naprawiona historia, 20260925 uprawnienia funkcji).
  - Sentry: uptime tmcstudio.app co 1 min + alert e-mail na nowe/eskalujące błędy.
  - Netlify: dashboard był zablokowany za fakturę; karta zaktualizowana 25.09, odblokowanie do 24 h.
- Następne kroki: merge #5 → deploy → test na produkcji → merge #6 → poprawka błędu RLS przy uploadzie
  miniatury (Sentry: "new row violates row-level security policy", bucket `thumbnails`) → reszta E2.

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
