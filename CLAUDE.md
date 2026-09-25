# TMC Studio — zasady dla agentów

Czytaj przed każdą zmianą. Szczegóły procesu: `docs/AGENT_ORCHESTRATION.md`.

## Bieżący cel: launch

- Plan i pełna checklista (P0/P1/P2, etapy E1–E4): dokument „TMC Studio — audyt i plan wdrożenia”
  https://claude.ai/code/artifact/42984cc2-d597-4fdf-b590-b30adf0549bf (zakładka „Checklista launchu”).
- Zasada: nie zaczynaj etapu N+1, dopóki P0 z etapu N nie są zamknięte.
- Stan na 2026-09-26:
  - E1 zapis: PR #5 zmergowany do `main`.
  - Migracje produkcji zgodne z repo: 20260622×2, 20260811, 20260925 (uprawnienia funkcji) wypchnięte
    przez `supabase db push`; 20260925011411 (polityki bucketu `thumbnails`) zastosowana ręcznie i
    odtworzona 1:1 jako plik w PR #7.
  - Otwarte PR: #7 (naprawa E2E w CI: etykieta ⌥1/Alt+1 + plik migracji miniatur, CI zielone),
    #6 (E2E zapisu i animacji), #8 (monitoring zapisów w Sentry). Kolejność merge: #7 → #6 → #8.
  - Sentry: uptime tmcstudio.app co 1 min + alert e-mail na nowe/eskalujące błędy; alerty `module:save`
    do skonfigurowania po merge #8 (`docs/ERROR_MONITORING.md`).
- Następne kroki: merge #7 → #6 → #8 → test zapisu na produkcji → scenariusz zespołowy (3 konta) → reszta E2.
- Lokalnie: Playwright 1.61 nie importuje lokalnych modułów specs na Node 22.15.0 — E2E uruchamiaj na Node 20
  albo nowszym 22.x. Projekt dev Supabase jest wstrzymany; CLI nie jest podlinkowane.

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
