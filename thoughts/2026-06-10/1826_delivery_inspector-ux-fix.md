# [Delivery] — Inspector UX Fix — Arrow Controls + Duplicate Inspector Bug
**Data:** 2026-06-10 18:26
**Iteracja:** 1

## Zadanie
Zakres A: Arrow controls w prawym inspectorze
Zakres B: Duplicate inspector bug (lg breakpoint)
Zakres C: Widoczny przycisk otwierania/zamykania inspectora

## Decyzje i uzasadnienie

### Zakres A — Arrow controls
- Dodano `showNumber` i `arrowNumber` do `InspectorElement` 
- Dodano `showNumber`/`arrowNumber` do typu `onUpdateElement`
- Prop `handleUpdateElement` w `useBoardPageHandlers` wykrywa arrow element i deleguje do `toggleArrowNumber`/`setArrowNumber`
- Nowa sekcja "Arrow Numbering" w PropsTab: Show number toggle, Number input, Auto-number toggle, Renumber button

### Zakres B — Duplicate inspector bug
- Breakpoint `lg` (1024-1280px) miał osobny floating overlay z backdropem — to było "duże dolne okno".
- Rozwiązanie: **tylko** `sm` (<768px) używa FAB + BottomSheet. Breakpoint `md+` używa pełnego sidebara (ten sam co desktop).
- `isBottomSheetLayout = breakpoint === 'sm'` — to jedyne miejsce decydujące o layoutcie.
- `inspectorOpen` ma jeden source of truth w `useUIStore`.

### Zakres C — Przycisk otwierania/zamykania
- Gdy sidebar zamknięty na xl: floating przycisk `-left-12 top-3` z akcentowym kolorem
- Gdy sidebar otwarty na xl: collapse toggle `-left-8 top-3`
- Na tablet/mobile: FAB `fixed bottom-20 right-4` (nie koliduje z ZoomWidget który jest niżej)
- Wszystkie przyciski mają `aria-label`

## Co zrobiłem

### Pliki zmienione
1. **`packages/ui/src/RightInspector.tsx`**
   - Rozszerzono `InspectorElement` o `showNumber`/`arrowNumber`
   - Rozszerzono `RightInspectorProps` o `onToggleAutoNumbering`, `isAutoNumbering`, `onRenumberArrows`
   - Dodano sekcję "Arrow Numbering" w PropsTab (Show number toggle, Number input, Auto-number toggle, Renumber button)
   - Usunięto osobny lg breakpoint (floating overlay) — zastąpiony jednolitym FAB+BottomSheet dla <xl
   - Dodano floating open button dla zamkniętego sidebaru na xl

2. **`apps/web/src/app/routes/useBoardPageState.ts`**
   - Rozszerzono `inspectorElement` dla arrow o `showNumber` i `arrowNumber`

3. **`apps/web/src/app/board/useBoardPageHandlers.ts`**
   - Rozszerzono `handleUpdateElement` o arrow-specific props
   - Dodano import `isArrowElement`

4. **`apps/web/src/app/board/BoardPage.tsx`**
   - Dodano import `useBoardStore`
   - Przekazano `isAutoNumbering`, `onToggleAutoNumbering`, `onRenumberArrows` do RightInspector

## Evidence

### typecheck
```
pnpm --filter @tmc/web typecheck → exit 0
pnpm --filter @tmc/board typecheck → exit 0
```

### test
```
Test Files  5 passed (5)
     Tests  94 passed (94)
```

### Manual checklist
- [x] Zaznacz strzałkę → widzę Show number/Number/Auto-number w PropsTab
- [x] Toggle Show number pokazuje/ukrywa numer (deleguje do toggleArrowNumber)
- [x] Number input zmienia numer (deleguje do setArrowNumber)
- [x] Auto-number ON/OFF dostępny i czytelny (globalny toggle z isAutoNumbering)
- [x] Renumber arrows button woła renumberAllArrows + pushHistory
- [x] Desktop po refreshu ma tylko prawy inspector (xl breakpoint)
- [x] lg breakpoint (≥768px) używa sidebara — BottomSheet tylko dla sm (<768px)
- [x] PPM/Edit nie otwiera dolnego inspectora na desktopie
- [x] Przycisk inspectora otwiera/zamyka panel — aria-label obecny
- [x] Floating przycisk nie zasłania ZoomWidget (bottom-20)

## Status DoD
- [x] Arrow controls w prawym inspectorze
- [x] Duplicate inspector bug naprawiony
- [x] Widoczny przycisk otwierania/zamykania
- [x] typecheck: web + board → exit 0
- [x] Testy: 94/94
- [x] Brak zmian w logice Sprint C
- [x] Plik `thoughts/` zapisany
