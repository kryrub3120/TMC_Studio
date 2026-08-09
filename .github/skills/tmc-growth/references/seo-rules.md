# SEO Rules

## Architektura

- Zachowaj edytor jako nieindeksowalne SPA pod `/board`.
- Prerenderuj publiczne strony podczas builda.
- Używaj EN bez prefiksu oraz pełnych wariantów `/pl/` i `/es/`.
- Używaj końcowego `/` dla statycznych publicznych adresów poza rootem.
- Generuj routing, canonical, hreflang i sitemap z jednego rejestru w `apps/web/src/seo/publicSeo.ts`.
- Zwracaj prawdziwe HTTP 404 dla nieznanych ścieżek.

## Wymagania Strony

Każda indeksowalna strona musi mieć:

- dokładnie jeden czytelny H1;
- unikalne title i description;
- self-canonical;
- wzajemne alternaty EN, PL, ES i `x-default`;
- zgodny `html[lang]`;
- rzeczywistą treść w surowym HTML;
- indeksowalne linki `<a href>`;
- reprezentacyjny obraz PNG 1200x630 dla social;
- schema tylko wtedy, gdy odpowiada widocznej treści.

## Granice

- Nie używaj FAQ schema jako domyślnego sposobu zdobywania rich results.
- Nie wpisuj `/board`, auth, invite, checkout ani redirectów do sitemap.
- Nie generuj stron dla synonimów bez odrębnej potrzeby użytkownika.
- Nie przekierowuj automatycznie na podstawie IP lub języka przeglądarki; pokaż jawny przełącznik.
- Nie zmieniaj całego frameworka aplikacji tylko dla publicznego SEO bez osobnej decyzji architektonicznej.
