# Master Autopilot Run - S-SITE: landing + cała otoczka stronowa
**Data:** 2026-06-22 15:00
**Limit:** 3 sprinty, 3 próby na sprint

## Glowny plan
Z "strasznie chujowego" landingu i otoczki zrobić spójną, sprzedającą warstwę publiczną gotową na ruch.

## Sprinty zidentyfikowane
| Sprint | Cel | Zaleznosci |
|--------|-----|------------|
| S1 | Redesign LandingPage + PublicPageShell: spójny nav/footer, feature sections, CTA. | - |
| S2 | PricingPage: czytelne plany/limity/cena, toggle miesiąc/rok, wdrożenie spec propagacji cyklu od S-BILLING (już zaimplementowane w AppShell). | spec z S-BILLING |
| S3 | Legal/SEO: strony oznaczone TODO: legal review, cookie/consent, meta+OG tags, sitemap/robots. | - |

## Decyzje poczatkowe
- LandingPage ma własny header/footer — PublicPageShell ma własny. Należy je ujednolicić.
- DownloadPage nie używa PublicPageShell — też do refaktora.
- i18n: landing.* i legal.* w en.ts są kompletne; pl.ts/es.ts mogą mieć braki.
- Wersja: 0.8.0 → 0.9.0 (MINOR bump — nowe funkcje).
- S-BILLING spec cyklu jest już zaimplementowany w AppShell i PricingPage (URL params → PricingModal initialCycle). S2 będzie głównie weryfikacją i ewentualnymi drobnymi poprawkami.