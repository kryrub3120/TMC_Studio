# Delivery - Sprint Editor Polish
**Data:** 2026-06-18
**Iteracja:** 1

## Zadanie
Wykonanie 5 PR-ów z tasks/SPRINT_EDITOR_PROPERTIES_2026-06-18.md w kolejności: PR-1 → PR-2 → PR-3 → PR-4 → PR-5.

## Decyzje i uzasadnienie
- **PR-1**: Zastąpiono heurystykę `label.length * 0.62` rzeczywistym pomiarem przez offscreen canvas `measureText()` z memoizacją w Map. Długie nazwiska są capped do 160px z ellipsis. `wrap="none"` + zwiększona wysokość Text do LBL_PILL_H (zamiast 14) zapobiega clippingowi.
- **PR-2**: Header inspektora używa teraz `t('inspector.elementType.' + el.type)` i `t('inspector.team.' + el.team)`. Współrzędne domyślnie widoczne, toggle z localStorage. LayersTab: usunięto `label` z hardcoded stringów — render już używa `t('inspector.layerNames.'+key)`.
- **PR-3**: Nadano `id` każdemu itemowi skrótów w helpSidebarData.ts i CheatSheetOverlay. Render: `t('shortcuts.'+item.id)`. W CheatSheetOverlay zmieniono `text-muted` na `text-text` dla opisów (kontrast dark mode).
- **PR-4**: `ZoneElement` rozszerzony o `borderWidth?: number` (default 3) i `showCorners?: boolean` (default false). ZoneNode: `strokeWidth` z `borderWidth`, dash skalowany względem grubości, markery narożne. RightInspector: sekcja zone z segmented control (solid/dashed/none), slider grubości, color input, toggle narożników.
- **PR-5**: `ArrowElement` rozszerzony o `startHead?: ArrowHead` (default 'none') i `endHead?: ArrowHead` (default 'arrow'). Typ `ArrowHead = 'arrow' | 'none' | 'bar' | 'dot'`. ArrowNode: zastąpiono `<Arrow>` (który zawsze rysuje grot) przez `<Line>` + własne komponenty grotów `renderArrowHead`/`renderBothHeads`. Implementacja: `arrow` (trójkąt), `bar` (kreska), `dot` (kółko), `none` (brak). Groty zorientowane wg stycznej krzywej. RightInspector: sekcja arrow head z selectami start/end + shortcut buttons (double head / hide heads).

## Co zrobiłem
1. **PR-1**: `packages/board/src/PlayerNode.tsx` — dodałem `measureTextWidth()` z offscreen canvas + cache, zastąpiłem heurystykę labela
2. **PR-2**: `packages/ui/src/RightInspector.tsx` — header i18n, coordinate toggle, czyszczenie layers tab
3. **PR-2**: `packages/ui/src/locales/{pl,en,es}.ts` — inspector.elementType, inspector.team, showCoordinates
4. **PR-3**: `packages/ui/src/helpSidebarData.ts` — dodano `id` do wszystkich shortcutów
5. **PR-3**: `packages/ui/src/HelpSidebar.tsx` — render `t('shortcuts.'+item.id)`
6. **PR-3**: `packages/ui/src/CheatSheetOverlay.tsx` — dodano `id` + render `t('shortcuts.'+item.id)`, text-muted→text-text
7. **PR-3**: `packages/ui/src/locales/{pl,en,es}.ts` — dodano sekcję `shortcuts: { ... }`
8. **PR-4**: `packages/core/src/types.ts` — ZoneElement: borderWidth?, showCorners?
9. **PR-4**: `packages/board/src/ZoneNode.tsx` — dynamiczne strokeWidth/dash, corner markers
10. **PR-4**: `packages/ui/src/RightInspector.tsx` — zone section + InspectorElement props + onUpdateElement extension
11. **PR-4**: `packages/ui/src/locales/{pl,en,es}.ts` — inspector.zone.*
12. **PR-5**: `packages/core/src/types.ts` — ArrowHead type, ArrowElement: startHead?, endHead?
13. **PR-5**: `packages/board/src/ArrowNode.tsx` — renderArrowHead, renderBothHeads, Line+heads zamiast <Arrow>
14. **PR-5**: `packages/ui/src/RightInspector.tsx` — arrow head section + props extension
15. **PR-5**: `packages/ui/src/locales/{pl,en,es}.ts` — inspector.arrow.*

## Napotkane problemy
1. **Locale structure corruption**: przy dodawaniu shortcuts do locales, struktura plików się rozsypała (duplikacja `commands`, oddzielenie `confirm`/`toast` od `commands`). Rozwiązanie: reset plików przez `git checkout` i ponowne precyzyjne dodanie kluczy.
2. **Unused import Arrow**: po zastąpieniu `<Arrow>` przez `<Line>` w ArrowNode, import `Arrow` z react-konva stał się nieużywany - TS build error. Rozwiązanie: usunięcie z importów.
3. **A11y warnings**: select i color input bez aria-label — dodałem `aria-label` przez `t()`.
4. **renderShootArrow**: shoot arrow ma swoją skomplikowaną logikę (double line + triangle head). Zaktualizowałem małą ścieżkę (total < 10) na Line+heads + dodałem startHead do głównej ścieżki.

## Evidence
- `pnpm build` — 5/5 tasks successful
- `pnpm lint` — 5/5 tasks successful, 0 errors (103 pre-existing warnings)
- TypeScript compilation passed for all changed packages (core, board, ui, web)

## Status DoD
- [x] PR-1: Etykiety bez ucięć (realny pomiar + cache + max width + ellipsis)
- [x] PR-2: i18n nagłówka + warstw + toggle współrzędnych
- [x] PR-3: i18n skrótów (helpSidebar + cheatsheet) + kontrast dark mode
- [x] PR-4: Strefy — kontrolki linii granicznej + narożniki
- [x] PR-5: Strzałki — opcje grota (ukrycie/podwójny/typ) na obu końcach
- [x] pnpm build + lint przechodzą
- [x] Wszystkie stringi przez t() z pl+en+es
- [x] Wsteczna kompatybilność (nowe pola opcjonalne z fallbackiem)

## Dla nastepnej iteracji
Sprint kompletny — wszystkie 5 PR-ów zdefiniowanych w planie.