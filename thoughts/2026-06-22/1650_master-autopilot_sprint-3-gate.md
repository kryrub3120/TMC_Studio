# Sprint Gate Decision - S3: Legal/SEO/consent

## Decyzja
**ACCEPT SPRINT**

## Uzasadnienie
- LegalReviewBanner dodany do wszystkich legal pages (Terms/Privacy/Cookies/Refunds/Legal/Accessibility)
- i18n klucz `legal.draftBanner` we wszystkich 3 językach
- Cookie banner już działa z localStorage + analytics opt-in
- SEO: useDocumentMeta na każdej stronie, sitemap + robots już skonfigurowane
- Brak zmian w logice cookie/analytics — poza zakresem

## Uwagi dla nastepnego sprintu
- Po review prawnym: usunąć LegalReviewBanner i zastąpić `updatedAt` właściwą datą