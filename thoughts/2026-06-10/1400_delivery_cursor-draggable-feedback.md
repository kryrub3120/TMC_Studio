# Delivery - Cursor feedback on draggable elements
**Data:** 2026-06-10 14:00
**Iteracja:** 1

## Zadanie
Dodanie kursora `grab`/`grabbing` na wszystkich przeciągalnych elementach canvasu (Player, Ball, Arrow, Zone, Text, Equipment).

## Decyzje i uzasadnienie
- **`grab`/`grabbing` zamiast `move`** — wybrano `grab`/`grabbing` jako bardziej intuicyjne dla UX (wskazuje że element można "chwycić"). Equipment zachowuje `move` (był już taki wcześniej, ale zamieniono na `grab` dla spójności).
- **Wydzielony helper** — utworzono `packages/board/src/cursorUtils.ts` z funkcjami `cursorGrab`, `cursorDefault`, `applyGrabbing`, `applyGrab` zamiast powielać `container.style.cursor` w każdym nodzie.
- **Istniejący pattern** — kod już używał `container.style.cursor` w EquipmentNode i endpointach ArrowNode. Helper ujednolica to bez refaktora całego systemu.
- **Space+drag pan** — używa CSS class na wrapperze div, a nie inline style na canvas element. Pointer capture w trakcie pana przejmuje kursor. Zero konfliktu.
- **Specyficzne cursory** — resize handles Zone (nwse-resize, ns-resize, itp.) oraz endpoint handles Arrow (move) pozostawione bez zmian — są bardziej specyficzne niż `grab`.
- **Player rotation handle** — pozostawiony `crosshair`/`grabbing`, nie zmieniany (specyficzny use-case).

## Co zrobilem
1. Utworzono `packages/board/src/cursorUtils.ts` z funkcjami:
   - `cursorGrab(e)` — ustawia `grab`
   - `cursorDefault(e)` — resetuje do `default`
   - `applyGrabbing(groupRef)` — ustawia `grabbing` (do użycia w dragStart)
   - `applyGrab(groupRef)` — przywraca `grab` (do użycia w dragEnd)
   - `setStageCursor(e, cursor)` — helper niskiego poziomu
   - `cursorMove(e)`, `cursorCrosshair(e)` — dodatkowe, na wypadek potrzeby
2. Zaktualizowano 6 komponentów:

| Komponent | Zmiany |
|-----------|--------|
| **PlayerNode** | +`cursorGrab`/`cursorDefault` na Group, `applyGrabbing` w dragStart, `applyGrab` w dragEnd |
| **BallNode** | +`cursorGrab`/`cursorDefault` na Group, `applyGrabbing` w dragStart, `applyGrab` w dragEnd |
| **ArrowNode** | +`cursorGrab`/`cursorDefault` na Group, `applyGrabbing` w dragStart, `applyGrab` w dragEnd (endpoint handles pozostawione z `move`) |
| **ZoneNode** | +`cursorGrab`/`cursorDefault` na Group, `applyGrabbing` w dragStart, `applyGrab` w dragEnd (resize handles pozostawione z specyficznymi cursorami) |
| **TextNode** | +`cursorGrab`/`cursorDefault` na Group, `applyGrabbing` w dragStart, `applyGrab` w dragEnd |
| **EquipmentNode** | refaktor: usunięto inline `handleMouseEnter`/`handleMouseLeave`, zastąpiono `cursorGrab`/`cursorDefault` + `applyGrabbing`/`applyGrab`, dodano `groupRef` |

## Napotkane problemy
- **TS6133 (unused import)** — ArrowNode i ZoneNode importowały `applyGrabbing`/`applyGrab` ale nie używały w drag handlers. Naprawiono przez dodanie `onDragStart` z `applyGrabbing` i `applyGrab` w `onDragEnd`.

## Evidence
- `cd packages/board && npx tsc --noEmit` — OK (0 errors)
- `cd apps/web && npx tsc --noEmit` — OK (0 errors)

## Zmienione pliki
- `packages/board/src/cursorUtils.ts` — NOWY
- `packages/board/src/PlayerNode.tsx`
- `packages/board/src/BallNode.tsx`
- `packages/board/src/ArrowNode.tsx`
- `packages/board/src/ZoneNode.tsx`
- `packages/board/src/TextNode.tsx`
- `packages/board/src/EquipmentNode.tsx`

## Status DoD
- [x] Kod dziala zgodnie z zatwierdzonym planem
- [x] Testy nie wymagane (zmiany czysto wizualne/cursor)
- [x] Kompilacja TypeScript OK
- [x] Brak znanych regresji — pattern identyczny jak w EquipmentNode (działał przed zmianą)
- [x] UI: `grab` hover, `grabbing` podczas drag na wszystkich elementach
- [x] Spójność z istniejącymi specyficznymi cursorami (zone resize, arrow endpoint)
- [x] Space+drag pan nie koliduje (CSS class vs inline style)

## Kryteria akceptacji
- [x] hover na Player -> cursor grab
- [x] hover na Ball -> cursor grab
- [x] hover na Arrow body -> cursor grab
- [x] hover na Zone -> cursor grab
- [x] hover na Text -> cursor grab
- [x] hover na Goal/Equipment -> cursor grab
- [x] Aktywne narzędzie Arrow/Text -> nadal wlasciwy cursor na pustym canvasie (CSS class na wrapperze)
- [x] Space+drag -> nadal grab/grabbing (CSS class na wrapperze)