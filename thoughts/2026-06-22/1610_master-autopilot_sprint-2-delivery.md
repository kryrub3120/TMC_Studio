# Delivery Evidence - S2: PricingPage cycle propagation + footer
**Data:** 2026-06-22
**Iteracja:** 1

## Co zaimplementowano
1. **PricingPage.tsx**: zastąpiono własny footer przez shared `<PublicFooter />` (dodano import z `./PublicPageShell`)
2. **Weryfikacja cyklu**: sprawdzono, że:
   - PricingPage: `const upgradeHref = p === 'pro' || p === 'team' ? \`/app?upgrade=${p}&cycle=${cycle}\` : '/app'` — poprawnie propaguje cykl
   - AppShell: odczytuje `?cycle=` z URL, przekazuje do PricingModal jako `initialCycle`
   - PricingModal: `useState<Cycle>(initialCycle ?? 'monthly')` — działa
   - Wszystko już zaimplementowane, S-BILLING spec wdrożony

## Zmienione pliki
- apps/web/src/pages/PricingPage.tsx — PublicFooter + import

## Decyzje implementacyjne
- Poza footerem PricingPage ma własny header — celowo, bo PricingPage ma prostszy header niż LandingPage (bez features link)
- DownloadPage pozostawiono bez zmian — nie ma tradycyjnego footera (tylko feature strip + web fallback)