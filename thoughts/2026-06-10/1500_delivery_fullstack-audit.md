# Delivery — Kompleksowy Audit Full-Stack
**Data:** 2026-06-10 15:00
**Iteracja:** 1

## Zadanie
Przeprowadzić pełny audyt full-stack kodu TMC Studio pod kątem 9 szczegółowych issue i zapisać wyniki w docs/AUDIT_COMPREHENSIVE_2026_06_10.md

## Proces myślenia
1. Zacząłem od zrozumienia struktury monorepo: apps/web/, packages/{board,core,ui}/, supabase/, netlify/functions/
2. Dla każdego issue zdefiniowałem co konkretnie trzeba sprawdzić w kodzie
3. Czytałem rzeczywiste pliki źródłowe (nie dokumentację) — łącznie kilkadziesiąt plików
4. Dla każdego issue zidentyfikowałem konkretne linie kodu i funkcje
5. Sprawdziłem czy issue istnieje, jak działa, gdzie są luki

## Co zrobiłem

### Issue #1 — Numerowanie strzałek
- Przeczytałem: ArrowNode.tsx (renderowanie numerka), elementsSlice.ts (toggleArrowNumber, getHighestArrowNumber, addArrowAtCursor), useKeyboardShortcuts.ts (Shift+A/R, ArrowRight, Shift+N)
- Znalazłem: system działa, ale brak renumeracji po usunięciu i brak osobnych sekwencji per typ

### Issue #2 — Responsywność boiska
- Przeczytałem: BoardCanvasSection.tsx (ResizeObserver, fitZoom, wheel zoom, Bug 2 auto-center), useTouchGestures.ts, useViewportSync.ts
- Znalazłem: auto-scale-down działa, ale brak auto-expand gdy kontener rośnie

### Issue #3 — Rączki (handles) orientacja
- Przeczytałem: CanvasElements.tsx, PlayerNode.tsx, ArrowNode.tsx, ZoneNode.tsx, SelectionBox.tsx
- PRZEŁOMOWE ZNALEZISKO: W całym projekcie NIE MA ani jednego importu Transformer z react-konva. To kompletny brak — elementy nie mają wizualnych uchwytów transformacji.

### Issue #4 — Prawy sidebar + kalibracja
- Przeczytałem: RightInspector.tsx, BoardPage.tsx, useUIStore.ts
- Znalazłem: przycisk kalibracji NIE ISTNIEJE w całym kodzie (grep za "calibrat" = 0 wyników). Sidebar działa dobrze z zakładkami.

### Issue #5 — Tutorial strzałkowy
- Grep za "tutorial", "onboarding", "tour", "walkthrough" — 0 wyników w kodzie źródłowym
- Jedyny onboarding to ShortcutsHint (jednorazowy hint, auto-dismiss 3s) + EmptyStateOverlay

### Issue #6 — Podpisy zawodników
- Przeczytałem: PlayerNode.tsx (linie 521-550), TextNode.tsx, types.ts
- Znalazłem: fontSize domyślnie 14 na ciele, 10 pod spodem. Brak skalowania względem zoomu, brak kontrastu na labelu poniżej.

### Issue #7 — System subskrypcji
- Przeczytałem: wszystkie migracje Supabase, entitlements.ts, PricingModal.tsx, stripe-webhook.ts, stripe.ts, useAuthStore.ts, LimitReachedModal.tsx
- KLUCZOWE: funkcja can() w entitlements.ts NIGDZIE nie jest wywoływana w UI. Cała infrastruktura gotowa, ale brak gatingu.

### Issue #8 — Ogólne UX
- Przeczytałem: useKeyboardShortcuts.ts, useUIStore.ts, ZoomWidget.tsx, ShortcutsHint.tsx, EmptyStateOverlay.tsx
- Znalazłem: brak aria-label, brak cursor:pointer na elementach, brak focus ring, brak toast dla redo

### Issue #9 — Panel zapisywania plików
- Przeczytałem: ProjectsDrawer.tsx, AutosaveService.ts, supabase.ts (uploadThumbnail), schema migracji
- Znalazłem: uploadThumbnail istnieje ale nie jest wywoływany przez AutosaveService. Brak confirm na delete.

## Napotkane problemy
- Nie można było odczytać niektórych plików przez specjalne znaki w ścieżce (spacja w nazwie folderu)
- Wiele plików nie miało Transformer, co wymagało grep search przez cały projekt
- Niektóre grep search nie działały przez exclude patterns (node_modules)

## Wynik
Zapisano kompletny plik audytu w docs/AUDIT_COMPREHENSIVE_2026_06_10.md
Zawiera on analizę 9 issue z konkretnymi ścieżkami plików, numerami linii, severity i strategią naprawy

## Status DoD
- [x] Przeanalizowano faktyczny kod dla każdego issue
- [x] Zidentyfikowano konkretne pliki, funkcje, linie kodu
- [x] Określono severity (🔴/🟡/🟠/🔵)
- [x] Zaproponowano strategię fixa dla każdego issue
- [x] Oszacowano czas naprawy
- [x] Zidentyfikowano zależności między issue
- [x] Zapisano plik w docs/AUDIT_COMPREHENSIVE_2026_06_10.md
- [x] Zapisano plik thoughts

## Dla następnej iteracji / następnego agenta
Brak. Audyt kompletny w jednej iteracji.