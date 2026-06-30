# Docs Update - Fix: Produkcja - logowanie, CSP, UI
**Data:** 2026-06-30 00:45

## Zadanie
Update dokumentacji po zmianach fixing 6 problemów produkcyjnych.

## Decyzje i uzasadnienie
- AUTH_FLOW.md: najważniejszy dokument do aktualizacji - zmiana w signIn race condition jest krytyczna dla debugowania auth w przyszłości
- FEATURE_SPEC.md: dodanie notki o cursor tracking w sekcji 1.1.1 oraz aktualizacja tabeli triggerów
- CHANGELOG.md: wszystkie fixy trafiają do [Unreleased] - nie ma bumpa wersji bo bug fixy (PATCH), a nie ma oficjalnego releasu
- docs/INDEX.md: nie wymaga zmian - wszystkie dokumenty nadal istnieją i mają poprawne opisy
- VERSIONING.md: nie wymaga zmian - nie bumpujemy wersji po bug fixach bez releasu

## Co zrobiono
- **docs/AUTH_FLOW.md**: naprawiona uszkodzona tabela w sekcji 5, dodana sekcja A.7.1 o race condition fix, zaktualizowana data
- **docs/FEATURE_SPEC.md**: zaktualizowana wersja (0.9.0), dodana notka o cursor tracking w 1.1.1, dodany trigger TopBar dropdown
- **CHANGELOG.md**: dodana sekcja Unreleased z 5 fixami

## Status DoD
- [x] docs/AUTH_FLOW.md - zaktualizowany, sekcja A.7.1 dodana
- [x] docs/FEATURE_SPEC.md - zaktualizowany sekcja 1.1.1
- [x] CHANGELOG.md - zaktualizowany
- [x] docs/INDEX.md - zweryfikowany, nie wymaga zmian
- [x] Brak TODO/TBD/UNVERIFIED w zaktualizowanych dokumentach
- [x] Wszystkie zmiany dokumentują faktyczny stan kodu