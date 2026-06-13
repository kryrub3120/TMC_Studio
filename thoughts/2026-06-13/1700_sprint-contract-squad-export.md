# Sprint Contract - Squad Redesign + Export Fix
**Data:** 2026-06-13
**Limit:** 30 min

## Cel sprintu
Implementacja 5 usprawnień: export w 100% rozdzielczości, redesign Squad Bench (4 teams, Free/Premium limity), atrakcyjniejsze panele drużyn w Settings + TopBar CTA, wizualizacja postaci zawodników w Squad Bench.

## Zakres
1. **Export fix**: dynamiczny pixelRatio w `exportUtils.ts` i `useExportController.ts` — zawsze full resolution boardu
2. **Squad Bench redesign**: wizualizacja (shape+number), wszystkie 4 teamy, Free limit 5, Premium limit 25/team, empty=+ikony, default hidden
3. **Settings → Squad**: obsługa team3/team4, limity Free/Premium
4. **TopBar badge**: CTA "Preset your squad — easy drag & drop"
5. **BoardPage wiring**: przekazanie limits, team3/team4

## Poza zakresem
- Zmiana architektury store
- Migracje bazy danych
- Zmiana systemu premium gating
- Refaktor TeamsPanel/PitchPanel

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| ui-delivery | zmiana SquadBench, SettingsModal, TopBar, BoardPage | zgodnosc z DESIGN_SYSTEM.md |
| regression-testing | po zmianach SquadBench i exportu | typecheck + testy |

## Kryteria akceptacji
- [ ] Export PNG/JPG daje obraz w pełnej rozdzielczości boiska (canvasWidth * 2) niezależnie od zoom
- [ ] Squad Bench pokazuje shape+number dla każdego zawodnika
- [ ] Squad Bench wspiera wszystkie 4 drużyny (home/away/team3/team4)
- [ ] Free: max 5 zawodników łącznie, reszta z kłódką
- [ ] Premium: max 25 zawodników na drużynę
- [ ] Pusty stan Squad Bench: 5 slotów z ikonką +
- [ ] Settings → Squad: team3/team4, limity Free/Premium
- [ ] TopBar: badge "Preset your squad"

## Definition of Done
- [ ] Kod zgodny z planem
- [ ] Typecheck przechodzi
- [ ] UI zgodne z design systemem
- [ ] Brak znanych regresji

## Ryzyka
- Typ `SquadPlayerItem` w SquadBench jest lokalny — trzeba zaktualizować lub użyć core type
- SettingsModal ma własny typ `SquadPlayerSettings` — trzeba zsynchronizować