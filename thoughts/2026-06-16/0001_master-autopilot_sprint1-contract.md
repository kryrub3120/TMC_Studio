# Sprint Contract - S1: Release Readiness QA
**Data:** 2026-06-16 00:00

## Cel sprintu
Przeprowadzenie pełnej oceny gotowości release — `pnpm typecheck`, `pnpm build`, `pnpm lint`, testy, dokumentacja, brak blockerów.

## Zakres
- Uruchomienie komend CI (typecheck, build, lint) na branchu `develop`
- Weryfikacja testów (`pnpm --filter @tmc/web test`)
- Sprawdzenie dokumentacji: CHANGELOG.md, INDEX.md, FEATURE_SPEC.md, DATA_MODEL.md
- Sprawdzenie docs/DESKTOP_RELEASE_CHECKLIST.md pod kątem aktualności
- Raport z ewentualnymi problemami

## Poza zakresem
- Zmiany w kodzie (poza naprawą krytycznych błędów)
- Merge do main (S2)

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| release-readiness | Ocena gotowosci releasu | Wyniki komend + docs status |
| regression-testing | Sprawdzenie braku regresji | Wyniki testow |

## Kryteria akceptacji
- [ ] typecheck przechodzi
- [ ] build przechodzi
- [ ] lint przechodzi
- [ ] testy przechodza
- [ ] CHANGELOG.md zawiera aktualna sekcje 0.6.0
- [ ] Brak blockerow do releasu