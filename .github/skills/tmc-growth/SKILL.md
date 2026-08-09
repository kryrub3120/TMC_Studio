---
name: tmc-growth
description: Audytowanie i rozwijanie mierzalnego growth TMC Studio. Używać przy technicznym SEO, planowaniu i tworzeniu publicznych stron EN/PL/ES, briefach contentowych, linkowaniu wewnętrznym, sitemap i hreflang, repurposingu treści, analizie lejka, raportach wzrostu oraz przygotowaniu kontrolowanego PR do publikacji. Nie używać do masowego spamu ani automatycznej publikacji bez zatwierdzenia.
---

# TMC Growth

Rozwijaj pozyskiwanie użytkowników na podstawie prawdziwych możliwości produktu i mierzalnych wyników. Traktuj aplikację, treści, dystrybucję i analitykę jako jeden lejek.

## Wybierz Tryb

- **Audyt SEO:** sprawdź build, routing, metadane, indeksowalność, sitemap, hreflang, 404, linkowanie i wydajność.
- **Brief lub strona:** sprawdź intencję, kanibalizację, prawdę produktową, przygotuj treść i CTA do konkretnego działania.
- **Repurposing:** przekształć zatwierdzoną stronę w materiały kanałowe bez zmiany głównej obietnicy.
- **Raport wzrostu:** połącz ruch, aktywację, rejestrację i płatność; zaznacz brakujące dane zamiast je szacować.

## Zbierz Kontekst

1. Przeczytaj `references/product-truth.md` przed użyciem funkcji, cen, limitów lub obietnic.
2. Przeczytaj `references/seo-rules.md` przed zmianą routingu, meta, sitemap lub wersji językowych.
3. Przeczytaj `references/content-model.md` przed przygotowaniem strony albo briefu.
4. Przeczytaj `references/metrics.md` przed raportem lub zmianą CTA i lejka.
5. Przeczytaj `references/publishing-policy.md` przed PR, deployem, socialem lub outreach.
6. Sprawdź aktualny `git status`; nie nadpisuj niezwiązanych zmian.
7. Sprawdź daty dokumentów marketingowych. Nie traktuj planów turniejowych ani kampanii z przeszłości jako aktywnych.

## Wykonaj Audyt

1. Zbuduj publiczną stronę komendą z Node 22:

```bash
source "$HOME/.nvm/nvm.sh" && nvm use --silent && pnpm --filter @tmc/web build
```

2. Uruchom walidator:

```bash
node .github/skills/tmc-growth/scripts/audit-public-pages.mjs apps/web/dist
```

3. Sprawdź przynajmniej `/`, `/pricing/`, `/pl/`, `/es/`, jedną stronę prawną, `/board` oraz nieistniejący URL w prawdziwej przeglądarce.
4. Dla produkcji sprawdź surowy HTML i status HTTP, nie tylko DOM po wykonaniu JavaScriptu.
5. Raportuj osobno: blocker, problem wysoki, usprawnienie i brak danych.

## Przygotuj Treść

1. Zacznij od jednej intencji i jednego głównego zadania użytkownika.
2. Przeszukaj istniejące tytuły, H1 i slugi; nie twórz strony konkurującej z istniejącą.
3. Wybierz dowód z produktu: działający szablon, eksport, animację lub realny workflow.
4. Przygotuj najpierw EN. Dodaj PL i ES dopiero z pełną treścią i kontrolą językową.
5. Dodaj jedno główne CTA prowadzące do `/board` albo konkretnego szablonu. Nie używaj ogólnego CTA, jeżeli istnieje dokładniejsze działanie.
6. Dodaj linki do odpowiedniego klastra, pricing i strony produktowej.
7. Uruchom build, audyt publicznych stron i testy routingu przed przekazaniem PR.

## Pilnuj Jakości

- Nie twórz wielu stron tylko dla wariantów frazy.
- Nie wymyślaj funkcji, klientów, wyników, opinii ani oszczędności czasu.
- Nie publikuj stron porównawczych bez praktycznej weryfikacji konkurenta.
- Nie dodawaj schema, jeżeli nie odpowiada widocznej treści i wspieranemu typowi.
- Nie tłumacz wyłącznie nawigacji; każda wersja językowa musi mieć pełną treść.
- Nie publikuj automatycznie i nie wysyłaj automatycznie ofert w wersji v0.1.
- Nie uznawaj liczby stron za KPI. Mierz kwalifikowany ruch, uruchomienia tablicy, pierwszy eksport, rejestrację i płatność.

## Zwróć Wynik

Podaj:

1. Zweryfikowane dane wejściowe i źródła prawdy.
2. Zmienione lub proponowane adresy i ich intencje.
3. Wyniki builda, audytu oraz testów.
4. Ryzyka, brakujące dane i elementy wymagające akceptacji.
5. Najbliższy mierzalny eksperyment zamiast ogólnej listy pomysłów.
