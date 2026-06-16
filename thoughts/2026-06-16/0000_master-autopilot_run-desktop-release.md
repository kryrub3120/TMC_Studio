# Master Autopilot Run - Desktop Release v0.6.0
**Data:** 2026-06-16 00:00
**Limit:** Brak limitu (final release)

## Glowny plan
Realizacja `docs/DESKTOP_RELEASE_CHECKLIST.md` — merge develop → main + release readiness QA + desktop release build.

## Sprinty zidentyfikowane

| Sprint | Cel | Zaleznosci |
|--------|-----|------------|
| S1 | Release Readiness QA — typecheck, build, lint, docs, CHANGELOG | - |
| S2 | Merge develop → main (PR + merge) | S1 (QA musi przejsc) |
| S3 | Finalizacja wersji + CHANGELOG + Desktop Release build | S2 (main jako baza) |

## Decyzje poczatkowe
- Wersja `0.6.0` juz istnieje na `develop` — nie ma potrzeby bumpu.
- CHANGELOG juz zawiera pelna sekcje `[0.6.0]`.
- Desktop release workflow (`desktop-release.yml`) jest gotowy na GH Actions.
- Wymagane reczne kroki uzytkownika: dodanie sekretow VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY, uruchomienie workflow.