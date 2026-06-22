# Delivery Evidence - S1: LandingPage + PublicPageShell redesign
**Data:** 2026-06-22
**Iteracja:** 1

## Co zaimplementowano
1. **PublicPageShell.tsx** — dodano `PublicFooter` (shared footer component) dla spójności na wszystkich publicznych stronach. Header już istniał i jest używany przez legal pages.
2. **LandingPage.tsx** — zastąpiono własny footer przez `PublicFooter`; dodano brakującą sekcję "Everywhere" (download teaser) między keyboard-first a use-cases.
3. **CookiePolicy.tsx** — zamieniono wszystkie hardcoded `text-slate-950` → `text-text`, `text-slate-500` → `text-muted`.
4. **PrivacyPolicy.tsx** — zamieniono `text-slate-950` → `text-text`.
5. **TermsOfService.tsx** — zamieniono wszystkie 10 wystąpień `text-slate-950` → `text-text`.
6. **sitemap.xml** — dodano `/download` URL.
7. **package.json (6 plików)** — bump 0.8.0 → 0.9.0 (MINOR).
8. **CHANGELOG.md** — dodano secję 0.9.0 z S1 zmianami.

## Decyzje implementacyjne
- **PublicFooter w PublicPageShell** zamiast w osobnym pliku: zachowuje spójność z istniejącym patternem (CompanyPanel też jest w PublicPageShell).
- **LandingPage nie używa PublicPageShell**: ma inny layout (full-width hero, sekcje) — tylko footer jest wspólny. To celowe — LandingPage nie potrzebuje legal-page shellu.
- **Sekcja "Everywhere"**: klucze i18n `landing.everywhere.*` już istniały w en/pl/es, ale nie były renderowane na LandingPage. Dodałem render.
- **PricingPage nie został zmieniony**: ma własny footer (uboższy niż PublicFooter) — to zostanie ujednolicone w S2.

## Uzyte skille
- ui-delivery: refaktor footer, dodanie sekcji Everywhere, tokeny zamiast hexów
- docs-update: bump wersji + CHANGELOG + sitemap

## Zmienione pliki
- apps/web/src/pages/PublicPageShell.tsx — dodano PublicFooter
- apps/web/src/pages/LandingPage.tsx — PublicFooter + Everywhere section
- apps/web/src/pages/CookiePolicy.tsx — tokeny zamiast hardcoded
- apps/web/src/pages/PrivacyPolicy.tsx — tokeny zamiast hardcoded
- apps/web/src/pages/TermsOfService.tsx — tokeny zamiast hardcoded
- apps/web/public/sitemap.xml — dodano /download
- package.json — bump 0.9.0
- apps/web/package.json — bump 0.9.0
- packages/core/package.json — bump 0.9.0
- packages/presets/package.json — bump 0.9.0
- packages/ui/package.json — bump 0.9.0
- packages/board/package.json — bump 0.9.0
- CHANGELOG.md — dodano sekcję 0.9.0

## Ryzyka implementacyjne
- **typecheck/build**: pre-existing errors (workspace resolution, Node 18 vs 20). Żaden błąd nie pochodzi z moich plików. Sprawdzono: `InvitePage.tsx` (niezmieniony) ma te same `Cannot find module '@tmc/ui'` — to workspace issue.
- **PricingPage**: ma własny footer, ale to zostanie naprawione w S2.