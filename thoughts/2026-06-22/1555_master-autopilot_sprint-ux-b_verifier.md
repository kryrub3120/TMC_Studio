# MasterAutopilot — Sprint UX-B MasterVerifier
**Data:** 2026-06-22 15:55
**Sprint:** Sprint UX-B (Cloud Sync + Redesign, P1)
**Wersja:** 0.7.2 → 0.8.0 (MINOR)

## DoD verification

- [x] B1: migracja `profiles.preferences` (JSONB) + `getPreferences`/`updatePreferences` — istnieją i działają
- [x] B1: `syncPreferencesToCloud` debounced upsert — działa w `useUIStore` (theme, grid, snap, bottomBar, inspector)
- [x] B1: local-first — preferencje persistowane w localStorage, cloud sync jako tło
- [x] B1: migracja lokalnych przy pierwszym logowaniu — przez `useAuthStore.signInWithGoogle` (linia 624-637 loadPreferences)
- [x] B1: usunięto info "zapisane lokalnie / w przyszłości" — footer w preferencjach zastąpiony pustym
- [x] B1: RLS na `profiles` istnieje (migracja bazowa), preferencje per-właściciel
- [x] B2: panel preferencji przeprojektowany — karty z `rounded-lg border bg-surface2 p-4`, grid 2-kolumnowy dla arrow defaults
- [x] Build (5/5) + typecheck (ui/web/board/core) + testy (113/113) + lint (0 błędów)
- [x] CHANGELOG zaktualizowany; wersja 0.8.0 we wszystkich package.json

## Decyzja SprintGate: ACCEPT SPRINT
Cloud sync już istniał jako infrastruktura (migracja, funkcje, RLS). UX-B domknął redesign panelu i potwierdził działanie sync.