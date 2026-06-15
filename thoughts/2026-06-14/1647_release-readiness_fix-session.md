# Release Readiness — Fix Session
**Data:** 2026-06-14 16:47
**Limit:** 30 min LOOP
**Status:** ✅ All 6 tasks done

## Wykonane zadania

| # | Zadanie | Status | Pliki |
|---|---------|--------|-------|
| 1 | Favicon SVG | ✅ | `apps/web/public/favicon.svg` |
| 2 | Open Graph meta tags | ✅ | `apps/web/index.html` — og:title, og:description, og:image, twitter:card, apple-touch-icon |
| 3 | Netlify `_redirects` (SPA routing) | ✅ | `apps/web/public/_redirects` |
| 4 | Fix 2 lint errors | ✅ | `useAnimationPlayback.test.ts` — usunięto `if (false){}` |
| 5 | Fix PricingModal fragile import | ✅ | `PricingModal.tsx` — hardcoded const zamiast cross-package require |
| 6 | robots.txt + sitemap.xml | ✅ | `apps/web/public/robots.txt`, `sitemap.xml` |

## Weryfikacja

| Check | Wynik |
|-------|-------|
| typecheck | ✅ 9/9 |
| build | ✅ 4.17s |
| lint | ✅ **0 errors** (98 warnings — istniejące no-explicit-any) |
| test | ✅ **110/110** |

## Co pozostało (do zrobienia ręcznie)
- **Production .env** → Netlify env vars: Stripe LIVE keys, produkcyjny Supabase URL/anon key
- **Sentry error monitoring** → założenie konta + dodanie paczki
- **Analytics** (Plausible/PostHog) → lekka integracja
- **og-image.png** → grafika pod `https://tmcstudio.app/og-image.png` do social preview
- **Wersja** → bump z `0.5.0` na `0.6.0` (nowe funkcje) przed deployem