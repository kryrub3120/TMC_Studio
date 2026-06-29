# Sprint Contract - S2: PricingPage redesign + cycle propagation
**Data:** 2026-06-22

## Cel sprintu
Uspójnienie PricingPage z design systemem, dodanie PublicFooter, weryfikacja propagacji cyklu.

## Zakres
- **apps/web/src/pages/PricingPage.tsx**: zastąpić własny footer przez PublicFooter, dodać "Everywhere" download teaser do use-cases section
- **apps/web/src/pages/DownloadPage.tsx**: opcjonalnie użyć PublicFooter (ma własny footer)
- Weryfikacja: cykl (monthly/yearly) propaguje przez PricingPage → AppShell → PricingModal

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| ui-delivery | Zmiana PricingPage footer, design tokens | zgodność z DESIGN_SYSTEM.md |
| design-system-review | Sprawdzenie zgodności z tokenami | raport grep |

## Kryteria akceptacji
- PricingPage używa PublicFooter zamiast własnego
- Toggle month/year działa i przenosi cykl do checkoutu (AppShell odczytuje `?cycle=` z URL)
- Brak hardcoded klas

## Poza zakresem
- Logika PricingModal, netlify/functions (S-BILLING)
- Zmiany w landing przekazie wizualnym

## Ryzyka
- PricingPage ma dużo własnego kodu — zmiana footera to prosta podmienka