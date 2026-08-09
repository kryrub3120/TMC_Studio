# Content Model

## Typy Startowe

1. **Product landing:** konkretne zastosowanie produktu i wejście do tablicy.
2. **Template:** prawdziwa taktyka lub ćwiczenie z podglądem i możliwością otwarcia.
3. **Guide:** rozwiązanie realnego zadania trenera lub analityka.
4. **Comparison:** dopiero po ręcznym użyciu obu produktów i udokumentowaniu kryteriów.

## Brief

Przygotuj przed implementacją:

- roboczy slug i język;
- główna intencja oraz odbiorca;
- jedno zdanie obietnicy;
- dowód dostępny w produkcie;
- główne CTA i docelowy URL;
- trzy do pięciu pytań, na które strona ma odpowiedzieć;
- strony do linkowania wewnętrznego;
- wymagany obraz, animacja albo szablon;
- event konwersji;
- ryzyko kanibalizacji.

## Kryterium Publikacji

Publikuj tylko stronę, która jest użyteczna bez znajomości frazy SEO i daje użytkownikowi materiał, przykład lub działanie niedostępne na innych stronach TMC Studio.

## Aktualny Klaster v0.1

- Strony produktowe i szablony są zdefiniowane w `apps/web/src/seo/growthContent.ts`.
- Szablony mogą używać wyłącznie rzeczywistych presetów z `@tmc/presets`.
- Parametry `source` i `formation` prowadzą do mierzalnego wejścia na tablicę.
- Rekordy `supabase/seed.sql` z pustą listą elementów nie są gotowymi szablonami contentowymi.
