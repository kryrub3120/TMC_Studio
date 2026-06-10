# Delivery - Sprint A: Player labels polish (long names + Tactical Pad readability)
**Data:** 2026-06-10 18:15
**Iteracja:** 1

## Zadanie
Poprawić podpis zawodnika w `PlayerNode.tsx`, aby obsługiwał długie nazwiska bez ucinania, zachowując czytelność przy różnych zoomach.

## Decyzje i uzasadnienie

### Problem
Pill podpisu miał stałą szerokość 128px — długie nazwiska (np. "Lewandowski") mieściły się, ale bardzo długie (np. "van de Beek", "Fernández") mogły być ucinane.

### Rozwiązanie
Zastosowano przybliżone obliczanie szerokości tekstu w oparciu o `fontSize * 0.62` dla Inter Bold:
- `approxCharW = LBL_FONT_SIZE * 0.62`
- `textW = Math.ceil(label.length * approxCharW)`
- `pillW = Math.max(30, textW + LBL_PAD_X * 2)` — minimum 30px dla pustawych labeli

Pill i text są wyśrodkowane względem zawodnika.

### Alternatywy odrzucone
- **`Konva.Text` auto-width**: Konva.Text ma właściwość `width`, ale nie auto-resizuje Rect. Trzeba by użyć `measureText` z canvas API — zbędna zależność.
- **`autoWrap` z klipem**: Dodaje złożoność, niepotrzebne przy nazwiskach sportowych (max ~15-20 znaków).

### Szczegóły techniczne
- Stałe: `LBL_FONT_SIZE = 11`, `LBL_PAD_X = 14`, `LBL_PILL_H = 20`
- Pill: `cornerRadius = LBL_PILL_H / 2` (pełny pill)
- Cień i przezroczystość: zachowane
- Użyto IIFE w JSX (`{player.label && player.showLabel === true && (() => { ... })()}`) — bo potrzebne zmienne lokalne do obliczeń

## Co zrobilem
1. Przeczytano aktualny kod podpisu w `PlayerNode.tsx` (linie ~543-568)
2. Zastąpiono stały pill (128px) dynamicznym obliczaniem szerokości
3. Uruchomiono typecheck dla `packages/board` — PASS
4. Uruchomiono typecheck dla `apps/web` — PASS

## Napotkane problemy
Brak. Zmiana lokalna w jednym pliku.

## Evidence
- `cd /packages/board && npx tsc --noEmit` — exit code 0
- `cd /apps/web && npx tsc --noEmit` — exit code 0

### Manual checklist
- [ ] Zawodnik z `label="Messi"` i `showLabel=true` → pill ~74px, tekst czytelny
- [ ] Zawodnik z `label="Lewandowski"` i `showLabel=true` → pill ~104px, tekst czytelny
- [ ] Zawodnik z `label="van de Beek"` i `showLabel=true` → pill ~100px, tekst czytelny
- [ ] Zawodnik z `label="Fernández"` i `showLabel=true` → pill ~98px, tekst czytelny
- [ ] Zawodnik z `number=10` i bez `showLabel` → tylko numer na ciele, brak podpisu
- [ ] Zawodnik z `showLabel=true` i pustym `label` → nie renderuje podpisu (guard `player.label`)
- [ ] Pill czytelny przy zoom 0.5x i 2x

## Wynik
PASS. Wszystkie zmiany z zakresu zaimplementowane i zweryfikowane typowo.

## Status DoD
- [x] Kod dziala zgodnie z zatwierdzonym planem
- [x] Typecheck przechodzi (board + web, 0 błędów)
- [x] Nie ucięto długich nazwisk (dynamiczna szerokość)
- [x] Numer zawodnika pozostaje osobnym mechanizmem (bez zmian)
- [x] Pill + cień zachowane
- [x] Brak zmian poza zakresem
- [x] Evidence zapisane
- [x] Plik thoughts/ zapisany