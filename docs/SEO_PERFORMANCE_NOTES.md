# SEO i wydajność publicznej strony

_Zaktualizowano: 2026-08-07_

## Aktualna architektura

- Edytor pozostaje SPA pod `/board` i nie jest indeksowany.
- Strony publiczne są renderowane statycznie podczas `pnpm --filter @tmc/web build`.
- EN używa adresów bez prefiksu, PL `/pl/`, ES `/es/`.
- Canonical, hreflang, routing i sitemap powstają z rejestru `apps/web/src/seo/publicSeo.ts`.
- Build tworzy 60 wersji HTML: 8 stron bazowych i 12 stron growth razy 3 języki.
- `spa.html` jest osobnym dokumentem `noindex,nofollow` dla edytora, auth i zaproszeń.
- Nieznane adresy są kierowane do `404.html` ze statusem HTTP 404 przez Netlify.

## Źródła implementacji

| Element | Lokalizacja |
|---|---|
| Rejestr tras i meta | `apps/web/src/seo/publicSeo.ts` |
| Trasy React | `apps/web/src/app/PublicRoutes.tsx` |
| SSR entry | `apps/web/src/entry-server.tsx` |
| Generator HTML i sitemap | `apps/web/scripts/prerender.mjs` |
| Redirecty i statusy | `netlify.toml`, `apps/web/public/_redirects` |
| Audyt builda | `.github/skills/tmc-growth/scripts/audit-public-pages.mjs` |

`apps/web/public/sitemap.xml` nie jest plikiem źródłowym. Sitemap jest generowana do `apps/web/dist/sitemap.xml`, dzięki czemu nie może rozjechać się z routingiem.

## Kontrola jakości

Po zmianie publicznych stron uruchom:

```bash
source "$HOME/.nvm/nvm.sh" && nvm use --silent
pnpm --filter @tmc/web build
node .github/skills/tmc-growth/scripts/audit-public-pages.mjs apps/web/dist
```

Audyt wymaga dla każdego adresu: unikalnego title i description, self-canonical, kompletu EN/PL/ES/x-default, jednego H1, zgodnego `html[lang]`, treści w surowym HTML i obrazu social PNG.

## Budżet wydajności

- Landing nie może preloadować `jsPDF`, GIF encoderów, Konva ani kodu edytora.
- Obraz social ma format PNG 1200x630.
- Docelowy LCP publicznych stron: poniżej 2,5 s na 75 percentylu danych rzeczywistych.
- Po podłączeniu Search Console i danych terenowych raportuj Core Web Vitals osobno dla mobile i desktop.

## Aktualny klaster contentowy

- 6 stron produktowych o wysokiej intencji.
- 6 stron szablonów opartych na realnych presetach `@tmc/presets`.
- CTA szablonu otwiera `/board` i ładuje wybraną jedenastkę gospodarzy.
- Eventy `content_view` i `content_open_board` mierzą stronę, język, typ oraz formację.
- Źródło treści: `apps/web/src/seo/growthContent.ts`; widok: `apps/web/src/pages/GrowthPage.tsx`.

Następny zakres powstaje dopiero po weryfikacji danych z tego klastra. Nie tworzyć stron ćwiczeń na podstawie pustych rekordów seed ani stron porównawczych bez ręcznego testu konkurenta.
