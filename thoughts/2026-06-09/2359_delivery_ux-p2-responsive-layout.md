# Delivery — P2: Responsywny Layout RightInspector + Canvas
**Data:** 2026-06-09 23:59
**Iteracja:** 1

## Zadanie
Zaimplementować P2 — Responsywny Layout RightInspector z 4 breakpointami + BottomSheet.

## Co zrobiłem

### Krok 1 — useUIStore breakpoint + useViewportSync
- Dodano typ `Breakpoint = 'sm' | 'md' | 'lg' | 'xl'`
- Dodano funkcję `getBreakpoint(width)`: ≥1280→xl, ≥1024→lg, ≥768→md, else→sm
- Dodano stan `breakpoint: Breakpoint` i akcję `setBreakpoint` do UIState
- Inicjalizacja: `getBreakpoint(window.innerWidth)`
- Nowy hook `hooks/useViewportSync.ts` nasłuchuje `resize` i aktualizuje breakpoint

### Krok 2 — BottomSheet.tsx (NOWY)
- Nowy komponent w `packages/ui/src/BottomSheet.tsx`
- Render przez `createPortal(…, document.body)`
- Props: `isOpen`, `onClose`, `children`, `maxHeight?: 'md' | 'sm'`
- Backdrop: `fixed inset-0 z-40 bg-black/40 animate-fade-in`
- Sheet: `fixed bottom-0 left-0 right-0 z-50 animate-slide-up`, rounded-t-2xl
- max-h: 'md'→60vh, 'sm'→75vh
- Drag handle: pasek `w-10 h-1 bg-border`, `touch-none`
- Swipe down (>60px) → close
- Zawartość: `overflow-y-auto`

### Krok 3 — RightInspector 4 breakpointy
**xl (>1280px):** istniejący sidebar bez zmian
**lg (1024-1280px):** wąski pasek ikon (w-12), hover rozszerza do w-[200px], expanded = fixed panel z backdrop
**md (768-1024px):** FAB (`fixed bottom-20 right-4 z-30`) + BottomSheet 60vh
**sm (<768px):** FAB + BottomSheet 75vh

Dodano helpery: `renderTabContent()`, `renderTabs()`, `FABButton`, `SheetContent`

### Krok 4 — BoardPage.tsx
- Dodano `useViewportSync()` (jeden raz)
- Przekazano `breakpoint` prop do RightInspector
- `useBoardPageState.ts`: dodano `breakpoint` selektor z useUIStore

### Krok 5 — index.ts
- Eksport: `export { BottomSheet } from './BottomSheet.js'`

## Napotkane problemy
- Emoji w JSX powodowały problemy z dopasowaniem w `replace_string_in_file`. Rozwiązane przez edycję fragmentaryczną.
- Duplikacja `<div>` w lg expanded panel — naprawiona.
- `breakpoint` dostał się do `PropsTab` przez pomyłkę — usunięty.
- `handleContentTouchMove` zduplikowana w BottomSheet — deduplikacja.
- `useCallback` unused w BottomSheet — prefix `_e`.

## Wynik
- 4 breakpointy działają bez regresji na xl
- BottomSheet z swipe-to-close i backdrop-closem
- Build: 5/5 successful

## Status DoD
- [x] xl — sidebar działa bez regresji
- [x] lg — wąski pasek ikon, hover/klik rozszerza
- [x] md — FAB widoczny, BottomSheet otwiera się
- [x] sm — FAB + BottomSheet 75vh
- [x] Canvas nie nakrywany na żadnym breakpoincie
- [x] FAB nie nakrywa ZoomWidget (bottom-20 vs bottom-4)
- [x] Swipe-down zamyka BottomSheet
- [x] Backdrop tap zamyka BottomSheet
- [x] Resize listener z cleanup
- [x] Build przechodzi
- [x] thoughts zapisany

## Dla następnej iteracji / następnego agenta
P2 gotowe. Wszystkie 4 punkty z planu UX/UI zaimplementowane (P6→P5→P1→P4→P3→P2).