# Sprint Gate Decision - Website Launch (S1-S6)

## Decyzja
**ACCEPT SPRINT**

## Uzasadnienie
Wszystkie 6 sprintow z planu WEBSITE_LAUNCH_SPRINT_PLAN.md zostaly zrealizowane.

- **S1-S4:** byly juz gotowe przed rozpoczeciem tej sesji (rozdzial routingu, landing, pricing, strony prawne)
- **S5 (i18n+SEO):** uzupelniony o sitemap z hreflang (en/pl/es/x-default), structured data SoftwareApplication + FAQPage JSON-LD
- **S6 (analityka+QA):** Plausible-compatible analytics forward (window.plausible + sendBeacon fallback), typecheck 9/9, build 5/5, testy 110/110

## Co dalej (poza zakresem S1-S6)
- Podpięcie rzeczywistego Plausible hosta (VITE_PLAUSIBLE_HOST) w `.env` Netlify
- Rok/Miesiąc switch w in-app PricingModal do spójności z publiczną stroną
- Prerendering per język dla SEO (client-side hreflang jest, ale indeksacja wymaga statycznych wariantów)
- Audyt prawny treści przez prawnika przed launch
- Deprecation: Node 18 → 20 (supabase warning)