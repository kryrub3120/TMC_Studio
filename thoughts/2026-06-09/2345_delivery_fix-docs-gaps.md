# Delivery — Poprawa luk w dokumentacji
**Data:** 2026-06-09 23:45
**Iteracja:** 1

## Zadanie
Poprawić 5 luk w dokumentacji znalezionych przez Testera w plikach `docs/DESIGN_SYSTEM.md` i `docs/DB_CONVENTIONS.md`.

## Proces myślenia
1. Przeczytałem oba pliki w całości, aby zrozumieć kontekst i dokładne miejsce wstawienia zmian.
2. W DESIGN_SYSTEM.md sekcja 15 (Layering Rules) — breakpointy trzeba dodać po punkcie 3, focus ring poprawić w punkcie 4.
3. W DESIGN_SYSTEM.md sekcja 16 — do tabeli dodać trzecią kolumnę "Zastąp przez" z wartościami dla Button.tsx i Toolbar.tsx.
4. W DB_CONVENTIONS.md sekcja 5 R4 — dodać przykład composite index po przykładzie pojedynczego indeksu.
5. W DB_CONVENTIONS.md sekcja 5 R1 — dodać punkt 4 z instrukcją jak pytać użytkownika.

## Co zrobiłem
1. **DESIGN_SYSTEM.md 1a** — Dodałem tabelę breakpointów Tailwind w sekcji 15 (po punkcie "Mobile-first"), z 4 breakpointami: sm (640px), md (768px), lg (1024px), xl (1280px) wraz z zasadą mobile-first.
2. **DESIGN_SYSTEM.md 1b** — Poprawiłem opis focus ring z `shadow-accent` na `focus:ring-2 focus:ring-offset-2` z adnotacją o `*:focus-visible`.
3. **DESIGN_SYSTEM.md 1c** — Dodałem kolumnę "Zastąp przez" w tabeli sekcji 16 z opisami: dla Button — nowy komponent do stworzenia (tymczasowo ręczne klasy), dla Toolbar — istniejący TopBar.tsx.
4. **DB_CONVENTIONS.md 2a** — Dodałem przykład indeksu złożonego `idx_projekty_user_created` na `public.projects(user_id, created_at DESC)` w sekcji 5 R4.
5. **DB_CONVENTIONS.md 2b** — Dodałem punkt 4 w sekcji 5 R1 z instrukcją użycia `vscode_askQuestions` lub opisania zmiany w wiadomości.

## Napotkane problemy
Brak — wszystkie zmiany były prostymi wstawieniami/wymianami w dokumentacji.

## Wynik
Wszystkie 5 luk poprawionych w jednej iteracji. Wszystkie kryteria DoD spełnione.

## Status DoD
- [x] DESIGN_SYSTEM.md ma tabelę breakpointów z wartościami px w sekcji 15
- [x] focus ring w sekcji 15 jest zgodny z kodem (`focus:ring-2 focus:ring-offset-2`)
- [x] sekcja 16 ma kolumnę "Zastąp przez" dla każdego legacy komponentu
- [x] DB_CONVENTIONS.md ma przykład composite index w sekcji 5
- [x] DB_CONVENTIONS.md ma wzmiankę o `vscode_askQuestions` lub informację jak pytać użytkownika w sekcji 5
- [x] Żaden plik kodu źródłowego nie zmodyfikowany — tylko dokumentacja (.md)
- [x] thoughts/ zapisany

## Dla następnej iteracji / następnego agenta
Brak — zadanie zamknięte.