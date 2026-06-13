# Delivery Evidence - Squad Redesign + Export Fix
**Data:** 2026-06-13 19:00
**Iteracja:** 1

## Co zaimplementowano

### 1. Export 100% resolution fix
- **`apps/web/src/hooks/useExportController.ts`**: Dynamiczny `pixelRatio` dla exportów PNG, PNG-all, JPG, GIF, PDF. Zamiast stałego `pixelRatio: 2`, wyliczany jest `Math.max(2, Math.ceil(canvasWidth / stageW))` — zapewnia full resolution canvasu niezależnie od zoomu viewportu.
- Dotyczy: `exportPNG`, `exportAllSteps`, `exportJPG`, a także frame capture dla GIF i PDF.

### 2. Squad Bench redesign (shape+number, 4 teams, Free/Premium limits)
- **`packages/ui/src/SquadBench.tsx`** — gruntowna przebudowa:
  - **Wizualizacja postaci**: każdy zawodnik pokazuje kształt drużyny (triangle/circle/square/diamond) z numerem w środku (SVG `PlayerShapeGlyph`)
  - **4 drużyny**: home/away/team3/team4 w osobnych sekcjach
  - **Free limit**: max 5 slotów łącznie — pierwsze 5 odblokowane, reszta z kłódką (`LockedSlot`)
  - **Premium limit**: 25 per team (max 100), pokazuje puste sloty z plusem (`EmptySlot`)
  - **Empty state**: dla home team pokazuje 5 pustych slotów z ikonką `+`
  - **Licznik**: w headerze `{count}/{limit}`
  - **Eye toggle**: domyślnie schowany (`squadVisible`), tap eye to show

### 3. Settings → Squad (4 teams, limits)
- **`packages/ui/src/SettingsModal.tsx`**: 
  - `SquadPlayerSettings.team` typ rozszerzony z `'home'|'away'` → `Team`
  - Team select: Team 1/2/3/4 zamiast Home/Away
  - Licznik `{count}/{limit}` w headerze
  - Free: opis "up to 5 squad players. Pro — up to 25 per team"
  - Premium przy full (100): żółty warning
  - Player list: kolory i etykiety dla team3/team4

### 4. TopBar squad badge + CTA
- **`packages/ui/src/TopBar.tsx`**: 
  - Nowy prop `onOpenSquadSettings` w `TopBarProps`
  - PlayersMenu rozszerzone: na dole dropdownu badge "Preset your squad" z opisem "Easy drag & drop onto the pitch" + ikona squad
  - Kliknięcie → `onOpenSquadSettings` otwiera Settings → Squad
- **`apps/web/src/app/board/BoardTopBarSection.tsx`**: przekazanie `onOpenSquadSettings`
- **`apps/web/src/app/board/BoardPage.tsx`**: podpięcie `onOpenSquadSettings={onOpenSettingsModal}`

### 5. BoardPage wiring
- **`apps/web/src/app/board/BoardPage.tsx`**: SquadBench dostaje `freeLimit={5}` i `premiumPerTeamLimit={25}`

## Użyte skille
- `ui-delivery` — zmiany SquadBench, SettingsModal, TopBar, BoardPage

## Zmienione pliki
- `packages/ui/src/SquadBench.tsx` — redesign (shape glyphs, 4 teams, limits)
- `packages/ui/src/SettingsModal.tsx` — team3/team4, limits, SquadPlayerSettings.team
- `packages/ui/src/TopBar.tsx` — onOpenSquadSettings + CTA badge w PlayersMenu
- `apps/web/src/app/board/BoardTopBarSection.tsx` — prop forwarding
- `apps/web/src/app/board/BoardPage.tsx` — wiring SquadBench limits + onOpenSquadSettings
- `apps/web/src/hooks/useExportController.ts` — dynamiczny pixelRatio

## Zweryfikowano
- `@tmc/core` typecheck ✅
- `@tmc/ui` typecheck ✅
- `@tmc/board` typecheck ✅
- `@tmc/web` typecheck ✅
- `@tmc/web` lint — pre-existing errors tylko w useAnimationPlayback.test.ts (nie moje)
- `@tmc/web` test — 110/110 ✅

## Ryzyka implementacyjne
- `SquadPlayerItem` w SquadBench i `SquadPlayerSettings` w SettingsModal to osobne typy — przy dłuższym projekcie warto zunifikować
- Dynamic pixelRatio może produkować duże pliki przy canvasWidth ~1130 × pixelRatio 4+ — to jednak oczekiwane dla "100% resolution"