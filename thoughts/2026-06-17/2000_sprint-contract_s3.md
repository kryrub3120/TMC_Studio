# Sprint Contract - S3 (jedno źródło prawdy skrótów + kontrast lawki)
**Data:** 2026-06-17 20:00
**Limit:** 3 próby / ~12 min

## Cel
Utworzyć `apps/web/src/shortcuts/shortcutMap.ts` jako jedno źródło prawdy dla skrótów klawiszowych, przepiąć useKeyboardShortcuts/command palette/cheatsheet/PPM na mapowanie, dodać test + + A2 kontrast lawki.

## Zakres
1. Utworzyć `apps/web/src/shortcuts/shortcutMap.ts` z mapą `ShortcutEntry[]` (id, keys, context, action, i18nLabel)
2. Przepiąć `useKeyboardShortcuts` na czytanie z mapy (logowanie konfliktów w dev)
3. Przepiąć `createCommandActions.ts` na mapę
4. Przepiąć `CheatSheetOverlay.tsx` na mapę (usunąć hardcoded sekcje)
5. Dodać `shortcutMap.test.ts` (duplikaty + martwe skroty)
6. Dodać tryb "shortcut audit" w dev
7. A2 - audyt kontrastu SquadBench

## Poza zakresem
- Nie zmieniamy logiki skrótów — tylko refaktor źródła danych
- Nie zmieniamy ContextMenu.tsx (już zrobiony w S1)
- Nie zmieniamy zachowania Space, S, L itd.

## i18n
`shortcuts.*` namespace w en/pl/es

## Kryteria akceptacji
- [ ] shortcutMap.ts istnieje z wszystkimi skrótami
- [ ] CheatSheet czyta z mapy (nie hardcoded)
- [ ] Command palette czyta z mapy
- [ ] useKeyboardShortcuts waliduje przy starcie (dev)
- [ ] Test przechodzi: 0 duplikatów, 0 martwych skrótów
- [ ] Kontrast SquadBench >= 4.5:1