# Sprint Contract — S3: Dług sync z UX-B
**Data:** 2026-06-22 11:35
**Sprint:** 3/3

## Cel sprintu
(a) Zweryfikować, że beforeunload flush używa JSONB-merge (merge_preferences RPC z auth.uid()) — już wdrożone, tylko potwierdzić i udokumentować.
(b) Zdecydować o preferences_updated_at: jeśli używany w cloud-wins przy load → zostawić; jeśli martwy → usunąć kolumnę + trigger.

## Zakres
- apps/web/src/store/useUIStore.ts — weryfikacja beforeunload flush
- supabase/migrations — jeśli usuwamy kolumnę: nowa migracja drop
- docs/AUTH_FLOW.md — dokumentacja email confirmation flow
- docs/VERSIONING.md, CHANGELOG.md, package.json — bump wersji

## Poza zakresem
- Zmiany w netlify/functions
- Zmiany w architekturze sync
- Nowe funkcje

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| regression-testing | Po zmianach | typecheck, build, test |
| docs-update | AUTH_FLOW.md, VERSIONING.md, CHANGELOG.md | docs aktualne |

## Kryteria akceptacji
- [ ] Beforeunload flush zweryfikowany: używa JSONB-merge przez RPC z auth.uid()
- [ ] preferences_updated_at: albo używany (last-write-wins przy load) albo usunięty
- [ ] AUTH_FLOW.md zaktualizowany o email confirm i reset flow
- [ ] Bump wersji 0.8.0 → 0.9.0 + CHANGELOG
- [ ] Build/test zielone

## Ryzyka
- Drop kolumny = migracja, wymaga rollback planu
- Cloud-wins vs last-write-wins: sprawdzić, czy applyCloudPreferences używa updated_at