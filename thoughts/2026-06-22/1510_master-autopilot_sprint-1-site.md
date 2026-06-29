# Sprint Contract - S1: LandingPage + PublicPageShell redesign
**Data:** 2026-06-22

## Cel sprintu
Ujednolicenie wszystkich stron publicznych pod spójnym nav/footerem, poprawa wizualna LandingPage, zgodność z DESIGN_SYSTEM.md.

## Zakres
- **apps/web/src/pages/PublicPageShell.tsx**: dodać spójny footer (taki sam jak w LandingPage), uspójnić header
- **apps/web/src/pages/LandingPage.tsx**: dodać brakującą sekcję "Everywhere" (download teaser), uspójnić użycie tokenów
- **apps/web/src/pages/CookiePolicy.tsx**: zastąpić hardcoded `text-slate-950` i `text-slate-500` tokenami design systemu
- **apps/web/src/pages/PricingPage.tsx**: użyć PublicPageShell lub uspójnić header/footer
- **packages/ui/src/locales/en.ts**: dodać brakujące klucze footer.download - SPRAWDZIĆ czy istnieją
- apps/web/public/sitemap.xml: dodać /download URL

## Poza zakresem
- Logika bilingowa, cykl płatności (S2)
- Strony legal jako treść (S3)
- Zmiany w komponentach ui library (PricingModal, AuthModal, itp.)

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| ui-delivery | Zmiana UI stron publicznych, nav/footer, layout | zgodność z DESIGN_SYSTEM.md, tokeny zamiast hexów |
| design-system-review | Weryfikacja zgodności UI z design systemem | raport z klasyfikacją trafień grep |
| docs-update | Bump wersji, FEATURE_SPEC, sitemap | lista zaktualizowanych dokumentów |

## Kryteria akceptacji
- LandingPage i PublicPageShell mają spójny nav/footer
- LandingPage czyta się dobrze w light/dark, responsywny
- CookiePolicy używa tokenów zamiast hardcoded klas
- i18n wszystkie klucze w en/pl/es (te same)
- typecheck/build zielone

## Definition of Done (z copilot-instructions.md)
- [x] Kod zgodny z planem
- [ ] i18n: zero hardcoded user-facing stringów; nowe klucze w en/pl/es
- [ ] typecheck/build zielone
- [ ] Brak znanych regresji
- [ ] Evidence zapisane

## Zależności od poprzednich sprintów
- Brak

## Ryzyka
- PricingPage może wymagać refaktora (ma własny header/footer) — rozwiążemy to w S2
- LandingPage "Everywhere" sekcja i18n istnieje ale nie jest renderowana — dodać
