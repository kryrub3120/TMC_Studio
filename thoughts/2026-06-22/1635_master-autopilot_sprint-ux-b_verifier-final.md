# MasterAutopilot — Sprint UX-B MasterVerifier (poprawiony)
**Data:** 2026-06-22 16:35
**Sprint:** Sprint UX-B (Cloud Sync + Redesign, P1)
**Iteracja:** 2 (INTERNAL LOOP po werdykcie)
**Wersja:** 0.7.2 → 0.8.0 (MINOR)

## Co naprawiono w iteracji 2

| Podpunkt | Przed | Po |
|----------|-------|----|
| B1.2 — sync pól | `UserPreferences` miało tylko 4 pola; `setArrowDefaults`/`setZoneDefaults` nie wołały sync | Rozszerzono `UserPreferences` o `arrowDefaults`, `zoneDefaults`, `gridSize`, `defaultArrowType`, `stepDuration`, `inspector`; `queueSync` wołany ze wszystkich setterów |
| B1.3 — debounce | `syncPreferencesToCloud` robiło `await updatePreferences()` przy każdym toggle | `queueSync()` akumuluje batch + `debouncedSyncPreferences()` fires 600ms po ostatniej zmianie |
| B1.4 — load pełny | `useAuthStore` wczytywało tylko theme/grid/snap/bottomBar z chmury | Wczytuje wszystkie 10+ pól (w tym arrowDefaults, zoneDefaults, gridSize, itd.) |
| B1.5 — migracja local→cloud | Brak — pusta chmura = lokalne preferencje nigdy nie wypchnięte | Przy `cloudPrefs` pusty/null: push lokalnego stanu `useUIStore.getState()` do chmury przez `updatePreferences()` |
| B1.6 — martwe klucze | `preferencesHint` w 3 locale mówił „Cloud sync coming in future" | Zmieniono na „synced across devices via cloud" |
| B1.7 — updated_at | Brak kolumny + brak triggera do last-write-wins | Nowa migracja `20260622000000_add_preferences_updated_at.sql` — kolumna + trigger |

## DoD verification

- [x] B1: arrowDefaults/zoneDefaults synchronizują się między urządzeniami przez `queueSync`
- [x] B1: debounce 600ms na zapisach do chmury
- [x] B1: load pełnego zestawu preferencji przy Google login
- [x] B1: migracja local→cloud przy pierwszym logowaniu
- [x] B1: martwe klucze locale zaktualizowane
- [x] B1: migracja `preferences_updated_at` + trigger dla last-write-wins
- [x] B2: panel preferencji przeprojektowany
- [x] Build (5/5) + typecheck + testy (113/113)

## Decyzja SprintGate: ACCEPT SPRINT (po korekcie)
Wszystkie 7 podpunktów B1 domknięte.