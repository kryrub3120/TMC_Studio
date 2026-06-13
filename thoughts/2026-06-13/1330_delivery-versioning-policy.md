# Delivery — Versioning Policy + Multi-Platform Strategy
**Data:** 2026-06-13 13:30
**Limit:** 30 min

## Zadanie
1. Audyt obecnego wersjonowania — niespójne wersje (root 0.1.0, web 0.2.2, core 0.2.0 itd.)
2. Zaprojektowanie polityki wersjonowania dla web + mobile + desktop
3. Aktualizacja plików i dokumentacji

## Decyzje i uzasadnienie

### System: SemVer + CalVer hybrid

| Element | Standard | Uzasadnienie |
|---------|----------|-------------|
| Product version | **SemVer 2.0.0** (`0.5.0`) | Komunikuje severity zmian użytkownikom i deweloperom |
| Build metadata | **CalVer** (`+20260613.1200.web`) | Umożliwia precyzyjny rollback per platforma |
| Multi-platform | **Single shared version** | Jeden feature release = jeden numer wszędzie |

Wzorce: VS Code (monthly releases), Figma (SemVer, same version web+desktop), Linear (single version).

### Pre-1.0 Convention
- `0.x.y`: `MINOR` bump dla nowych funkcji (w tym breaking changes jeśli udokumentowane)
- `PATCH` bump dla bug fixów
- Wersje synchronizowane między wszystkimi package.json

### Polityka multi-platform
- **Jeden numer na wszystkie platformy** — iOS, Android, macOS, Windows, Linux
- Pierwszy build na nowej platformie = aktualna wersja produktu
- Feature flags dla cross-platform parity
- Platform-specific entries w CHANGELOG (oznaczone `[ios]`, `[android]`, `[desktop]`)

## Co zrobiono

### 1. Utworzono `docs/VERSIONING.md`
Pełny dokument polityki: SemVer, CalVer, pre-release tags, multi-platform strategy,
release cadence, monorepo version alignment, tagging, CHANGELOG struktura, przykłady.

### 2. Zsynchronizowano wersje (0.5.0)
| Plik | Był → Stał się |
|------|---------------|
| `package.json` (root) | 0.1.0 → **0.5.0** |
| `apps/web/package.json` | 0.2.2 → **0.5.0** |
| `packages/core/package.json` | 0.2.0 → **0.5.0** |
| `packages/ui/package.json` | 0.2.0 → **0.5.0** |
| `packages/board/package.json` | 0.2.0 → **0.5.0** |
| `packages/presets/package.json` | 0.2.0 → **0.5.0** |

### 3. Zaktualizowano dokumentację
| Dokument | Zmiana |
|----------|--------|
| `docs/VERSIONING.md` | **NOWY** — pełna polityka wersjonowania |
| `CHANGELOG.md` | [Unreleased] → [0.5.0], dodano linki wersji na dole |
| `docs/FEATURE_SPEC.md` | Version: 0.5.0, Last Updated: 2026-06-13 |
| `docs/DESIGN_SYSTEM.md` | Version: 1.1.0 (niezależne od produktu), Last Updated |
| `docs/SYSTEM_ARCHITECTURE.md` | Version: 2.0.0 (niezależne), Last Updated |
| `docs/INDEX.md` | Dodano VERSIONING.md do tabeli |

## Evidence
- typecheck apps/web ✅
- Wszystkie 6 package.json mają 0.5.0
- CHANGELOG.md ma 0.5.0 z linkami v0.5.0
- docs/VERSIONING.md opisuje SemVer, CalVer, multi-platform

## Wynik
✅ Polityka wersjonowania ustanowiona i udokumentowana
✅ Wszystkie wersje zsynchronizowane do 0.5.0
✅ Gotowe na mobile i desktop — jeden numer na wszystkie platformy