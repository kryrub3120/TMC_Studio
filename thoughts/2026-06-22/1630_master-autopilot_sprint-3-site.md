# Sprint Contract - S3: Legal/SEO/consent
**Data:** 2026-06-22

## Cel sprintu
Oznaczenie stron legal jako szkice z `TODO: legal review`, weryfikacja cookie consent i SEO meta.

## Zakres
- **apps/web/src/pages/PublicPageShell.tsx**: dodać LegalReviewBanner (wizualny znacznik "draft — pending legal review")
- **apps/web/src/pages/TermsOfService.tsx**: użyć LegalReviewBanner
- **apps/web/src/pages/PrivacyPolicy.tsx**: użyć LegalReviewBanner
- **apps/web/src/pages/CookiePolicy.tsx**: użyć LegalReviewBanner
- **apps/web/src/pages/RefundsPage.tsx**: użyć LegalReviewBanner
- **apps/web/src/pages/AccessibilityPage.tsx**: użyć LegalReviewBanner
- **apps/web/src/pages/LegalNoticePage.tsx**: użyć LegalReviewBanner
- apps/web/public/robots.txt: weryfikacja (już OK)
- apps/web/public/sitemap.xml: weryfikacja (już zaktualizowane w S1)
- i18n: dodać klucz legal.draftBanner

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| ui-delivery | LegalReviewBanner komponent | zgodność z DESIGN_SYSTEM.md |
| docs-update | Aktualizacja dokumentacji | lista doków |

## Kryteria akceptacji
- Strony legal mają widoczny znacznik "draft pending review"
- Cookie banner działa (już)
- Meta+OG tags są na każdej stronie (już przez useDocumentMeta)
- i18n: klucz legal.draftBanner w en/pl/es

## Poza zakresem
- Treść prawna (to robi prawnik)
- Zmiany w logice cookie/analytics