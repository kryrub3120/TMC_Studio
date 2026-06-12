# Plan: Players w top barze (4 drużyny) + resize equipmentu

Data: 2026-06-12
Status: zatwierdzony, w realizacji

## Decyzje (potwierdzone z userem)
- Gracze w top barze jako 4 drużyny (Team 1–4) — trenerzy robią gry na 4 zespoły.
- Team 3/4 dla wszystkich (bez bramki Pro).
- Resize equipmentu: uchwyty przeciągania (jak strefy) + scroll kółkiem nad zaznaczonym elementem.

## Część A — Gracze w top barze (4 drużyny)
1. core/types.ts: Team -> home|away|team3|team4; TeamSettings + opcjonalne team3/team4; DEFAULT_TEAM_SETTINGS 4 kolory. Back-compat bez migracji.
2. board/PlayerNode.tsx: uzupełnić defaulty kolorów.
3. ui/TopBar.tsx: PlayersMenu (wzór EquipmentMenu), prop onAddPlayer(team) przez BoardTopBarSection -> useBoardPageState.
4. TeamsPanel.tsx / SettingsModal.tsx: 2 -> 4 drużyny.
5. useKeyboardShortcuts.ts: skróty dla Team 3/4 (opcjonalnie).

## Część B — Resize equipmentu
6. Uchwyty: wspólny komponent z ZoneNode -> EquipmentNode (tryb scale).
7. Scroll: kółko nad zaznaczonym el. skaluje, blokuje scroll strony.
8. ladder.tsx: fix grubości; audyt geometrii + hitBounds.ts dla 8 typów.

## Kolejność
B8 -> B7 -> B6 -> A1 -> A2 -> A3 -> A4 -> weryfikacja.
