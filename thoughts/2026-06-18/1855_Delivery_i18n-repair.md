# Delivery - i18n repair pass (iteracja 2)
**Data:** 2026-06-18

## Co było nie tak
Audyt wykazał 4 braki w i18n:

### 3 brakujące klucze w `inspector` namespace
- `inspector.locked`, `inspector.lockToggle`, `inspector.lockHint` — nie istniały w żadnym z 3 locale
- RightInspector.tsx woła `t('inspector.locked')` jako title sekcji (linia 335)
- RightInspector woła `t('inspector.lockToggle')` jako label + ariaLabel
- RightInspector woła `t('inspector.lockHint')` jako description

### 1 hardcoded string
- `RightInspector.tsx:405` — `description="V / Shift+V"` zamiast `t(...)`

### Naprawa
- Dodano `inspector.locked`, `inspector.lockToggle`, `inspector.lockHint` do en/pl/es
- Dodano `inspector.visionConeHint` do en/pl/es
- Zamieniono `description="V / Shift+V"` na `description={t('inspector.visionConeHint')}`
- Usunięto nieużywany import `ArrowHead` z `elementsSlice.ts` (build error)

## Wynik
- `pnpm build` — 5/5 successful
- `pnpm lint` — 0 errors
- Wszystkie ~115 `t()` call sites w RightInspector/HelpSidebar/CheatSheetOverlay mają kompletne klucze w en/pl/es

## Pliki zmienione
- `packages/ui/src/locales/en.ts` — +4 klucze
- `packages/ui/src/locales/pl.ts` — +4 klucze
- `packages/ui/src/locales/es.ts` — +4 klucze
- `packages/ui/src/RightInspector.tsx` — `description="V / Shift+V"` → `t(...)`
- `apps/web/src/store/slices/elementsSlice.ts` — usunięto nieużywany import `ArrowHead`