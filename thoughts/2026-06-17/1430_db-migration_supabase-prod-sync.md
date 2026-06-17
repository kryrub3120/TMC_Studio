# Master Autopilot — Supabase Prod DB Sync + Docs Update
**Data:** 2026-06-17 14:30
**Iteracja:** 1

## Zadanie
Wykonanie migracji Supabase na produkcję, naprawa rozjazdu Local/Remote, aktualizacja docs, commit i merge do main.

## Kontekst
- Produkcja: `pgacjczecyfnwsaadyvj` (zlinkowane)
- 6 migracji z 2026-06-15 (`20260615000000`–`20260615000005`) czekało na prod
- Wcześniej MCP w Claude Desktop zastosował SQL bezpośrednio → powstały wpisy z timestampem `20260617085714-85808` zamiast `20260615000000-05`

## Decyzje i uzasadnienie
- **Naprawa przez `supabase migration repair`, nie `db push`** — Docker nie był dostępny, a `db pull` wygenerował dokładny plan naprawy
- **`DROP POLICY IF EXISTS` dodane do `20260615000003`** — plik nie miał guardów idempotencji, co było ryzykiem na przyszłość
- **PATCH bump `0.6.0` → `0.6.1`** — tylko fixy bezpieczeństwa i DB, żadnych nowych funkcji user-facing
- **.bak usunięty** — nie powinien być w repo

## Co zrobiono
1. `supabase migration list --linked` — potwierdzono 6 migracji bez Remote
2. `supabase migration repair --status reverted` na 6 MCP-wprowadzonych timestampach
3. `supabase migration repair --status applied` na 6 lokalnych migracjach
4. `supabase migration list --linked` — 15/15 Local = Remote ✅
5. `git diff` potwierdził modyfikację `20260615000003_tighten_storage_policies.sql` (dodano DROP POLICY IF EXISTS)
6. Usunięto `.bak`
7. Zaktualizowano:
   - `CHANGELOG.md` — nowa sekcja `[0.6.1] - 2026-06-17` (Security + Fixed)
   - `LAUNCH_NEXT_STEPS.md` — sekcja 1 oznaczona jako ✅ ZROBIONE z opisem procesu
   - `docs/CURRENT_SPRINT_PLAN.md` — DB migracje oznaczone jako DONE
8. Bump wersji 0.6.0 → 0.6.1 we wszystkich 6 `package.json`

## Evidence
- `supabase migration list --linked` → 15/15 Local = Remote
- Wszystkie TS/build-related pliki nietknięte (Footer dynamiczny)
- Zmienione pliki: 10 plików (docs + package.json + .sql)

## Status DoD
- [x] Kod/DB działa zgodnie z planem
- [x] Migracje bezpieczne i zastosowane na prod
- [x] Dokumentacja zaktualizowana
- [x] Wersja bumpnięta (PATCH)
- [x] Evidence zapisane