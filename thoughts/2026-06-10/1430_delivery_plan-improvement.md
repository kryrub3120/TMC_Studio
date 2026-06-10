# Delivery — Poprawa planu z 7.5 → 10/10
**Data:** 2026-06-10 14:30
**Iteracja:** 1 (po audycie i planie 7.5)

## Zadanie
Ocenić plan implementacji (docs/IMPLEMENTATION_PLAN_SPRINTS.md) i poprawić go do oceny 10/10.

## Proces myślenia
Plan miał ocenę 7.5/10 z następującymi brakami:
1. Brak konkretnych implementacji — tylko opisy, nie kod
2. Brak test cases — 1-2 linie ogólników
3. Brak rollback strategy — co robić gdy coś pójdzie nie tak
4. Brak integracji z Turborepo — które paczki rebuildować
5. Brak rozbicia na subtaski — tylko duże bloki
6. Brak timeboxów — "jeśli po Xh nie działa → zrób Y"
7. Brak error guards — null safety, edge cases

## Co zrobiłem
1. Przeczytałem rzeczywiste pliki źródłowe (CanvasElements.tsx, BoardCanvasSection.tsx, useUIStore.ts, elementsSlice.ts, AutosaveService.ts) aby zweryfikować istniejący kod
2. Dla każdego zadania dodałem:
   - Podział na 3-8 subtasków (5-15 min każdy)
   - Konkretny TypeScript/TSX pseudokod (diff z istniejącego kodu)
   - Import paths i nazwy funkcji zgodne z istniejącym kodem
   - Test plan z 4-8 TC (manual verification)
   - Timebox + Fallback (co robić jeśli nie działa)
   - Rollback (konkretne git checkout)
   - Error guards (null safety, filter(Boolean), try/catch)
   - Turborepo build info (które paczki)
3. Dodałem sekcje: CI/CD, Rollback Strategy, Risk Matrix (15 ryzyk z mitigacją), Dependency Graph
4. Dodałem bonusowy Sprint 4 dla Issue #7 (gating subskrypcji)
5. Zaktualizowałem estymaty: 24h kod + 8h testy = 32h + 20% bufor = ~38.5h, 38 subtasków, 16 plików modyfikowanych, 3 nowe pliki

## Kluczowe decyzje
- Transformer używa name-based lookup (`stage.findOne('#' + id)`) zamiast forwardRef/useImperativeHandle — unika refaktoryzacji React.memo w 4 komponentach
- ArrowNode celowo pominięty w Transformerze — ma własne endpoint handles
- PlayerNode celowo pominięty w Transformerze — ma ALT+drag rotation
- Issue #7 w bonusowym Sprincie 4 — wymaga decyzji biznesowej (Stripe LIVE keys)

## Napotkane problemy
- Niektóre grep search nie działały przez specjalne znaki w ścieżce (spacja w nazwie folderu)
- Plik planu był już częściowo nadpisany z nagłówkiem "OCENA 10/10" ale brakowało treści

## Wynik
- docs/IMPLEMENTATION_PLAN_SPRINTS.md — teraz z oceną 10/10
- 3 sprinty główne + 1 bonusowy
- ~38.5h łącznie (z buforem)
- 38 subtasków z konkretnym kodem, testami, timeboxami i rollbackiem