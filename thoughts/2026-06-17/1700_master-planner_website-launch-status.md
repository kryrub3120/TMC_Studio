# MasterPlanner — Stan realizacji S1-S6 Website Launch

**Data:** 2026-06-17 16:00
**Analiza:** kodu źródłowego, i18n locales, sitemap, analytics, routing

---

## Status Sprintów — szczegółowa ocena

### S1 — Rozdział `/` od `/app`
**Status: ✅ GOTOWE**

| Kryterium | Stan |
|-----------|------|
| `/` renderuje LandingPage | ✅ `main.tsx` – `HomeElement = LandingPage` |
| `/app` to edytor | ✅ lazy-loaded `<App/>` |
| Tauri otwiera `/app` | ✅ `isTauri ? <App/> : <LandingPage/>` |
| Lazy-load edytora | ✅ `React.lazy(() => import('./App'))` |
| Deep-linki niezgłuszone | ✅ `/privacy`, `/pricing`, `/download` (redirect do /app) |
| OAuth callback route guard | ✅ `OAuthCallbackRouteGuard` |

### S2 — Landing Page
**Status: ✅ GOTOWE (kompletny)**

Wszystkie 10 sekcji zrealizowane w `LandingPage.tsx`:
1. ✅ Hero z H1 + 2 CTA + demo placeholder
2. ✅ Nawigacja (Features, Pricing, LanguageSwitcher, Open the board)
3. ✅ "Jak to działa w 30 s" — 3 kroki z Kbd
4. ✅ 4 filary (szybkość/minimum kroków/wszędzie/gotowe do udostępnienia)
5. ✅ Keyboard-first + Cmd+K
6. ✅ Everywhere → link do download
7. ✅ 3 use-case karty (coaches/creators/clubs)
8. ✅ Pricing teaser → `/pricing`
9. ✅ FAQ + stopka z linkami prawnymi + LanguageSwitcher
10. ✅ Mobile-first, Tailwind, WCAG (skip-to-main, aria-labels)
11. ✅ i18n en/pl/es kompletne dla landing
12. ✅ SEO meta przez `useDocumentMeta`

### S3 — Pricing
**Status: ✅ GOTOWE (kompletny)**

- ✅ Tabela Guest/Free/Pro/Team z `ENTITLEMENTS_BY_PLAN`
- ✅ Przełącznik Monthly/Yearly z "2 months free"
- ✅ Ceny USD, VAT note dla UE
- ✅ FAQ billingowe (4 pytania)
- ✅ CTA przez `/app?upgrade=<plan>` → `useBillingController`
- ✅ "Most Popular" badge na Pro
- ✅ Matrix porównawczy
- ✅ i18n en/pl/es kompletne dla pricing
- ✅ SEO meta przez `useDocumentMeta`

### S4 — Zgodność prawna UE
**Status: ✅ GOTOWE (kompletny)**

- ✅ `PrivacyPolicy` — RODO: dane, cele, storage, sharing (Stripe/Supabase/Netlify/Google), prawa użytkownika
- ✅ `TermsOfService` — zasady korzystania
- ✅ `CookiePolicy` — typy cookies, zarządzanie
- ✅ `RefundsPage` — prawo odstąpienia 14 dni, zasady zwrotów
- ✅ `LegalNoticePage` — Imprint: KRS 0000945245, NIP 8982272393, adres, kontakt
- ✅ `AccessibilityPage` — Deklaracja dostępności (EAA)
- ✅ `CookieConsentBanner` — GDPR opt-in, równorzędne Akceptuj/Odrzuć
- ✅ `PublicPageShell` — wspólny shell + light theme
- ✅ COMPANY_DETAILS, CONTACT_EMAILS
- ✅ Linki prawne w stopce LandingPage i PricingPage

### S5 — i18n + SEO
**Status: 🟡 CZĘŚCIOWO — do dokończenia**

| Obszar | Stan | Co brakuje |
|--------|------|------------|
| i18n en.ts | ✅ kompletne (landing, pricing, legal, cookie, common) | — |
| i18n pl.ts | ✅ kompletne (identyczne klucze) | — |
| i18n es.ts | ✅ kompletne (identyczne klucze) | — |
| Sitemap | 🟡 istnieje 8 URLi | Brak hreflang wariantów (en/pl/es) |
| hreflang | ❌ brak | Dodać `<link rel="alternate" hreflang="..." ...>` |
| Structured data | ❌ brak | `SoftwareApplication` + `FAQPage` JSON-LD |
| Meta legal pages | ✅ wszystkie mają `useDocumentMeta` | — |

### S6 — Analityka + weryfikacja
**Status: 🟡 CZĘŚCIOWO — do dokończenia**

| Obszar | Stan | Co brakuje |
|--------|------|------------|
| Eventy lejka | ✅ LANDING_VIEW, OPEN_BOARD, FIRST_ELEMENT_ADDED, FIRST_EXPORT, EXPORT, SIGNUP, LIMIT_HIT, PRICING_VIEW, UPGRADE | — |
| TTFE (time-to-first-export) | ✅ `startBoardSession()` + `trackExport()` | — |
| Consent-gated | ✅ przez `getCookieConsent()?.analytics` | — |
| Provider | ❌ TODO: Plausible/PostHog | Wstawić prosty forward (np. `navigator.sendBeacon`) |
| QA: typecheck | ❌ nie sprawdzono | `pnpm typecheck` |
| QA: build | ❌ nie sprawdzono | `pnpm build` |
| QA: test | ❌ nie sprawdzono | `pnpm test` |

---

## Plan pozostałej pracy (do realizacji)

Na podstawie audytu — **S1-S4 są gotowe**. Do zrobienia zostały:

### Sprint S5 (i18n + SEO):
1. **Sitemap z hreflang** — rozszerzyć `sitemap.xml` o warianty językowe
2. **Alternate links** — dodać `hreflang` do `useDocumentMeta` (wersja klient-side, dla SEO potrzebne prerendering)
3. **Structured data** — dodać `SoftwareApplication` JSON-LD na landing + `FAQPage`
4. **Weryfikacja kompletności i18n** — cross-check kluczy między en/pl/es

### Sprint S6 (Analityka + QA):
1. **Analytics provider** — zastąpić TODO prostym Plausible-compatible forwardem
2. **QA: typecheck** — `pnpm typecheck`
3. **QA: build** — `pnpm build`
4. **QA: test** — `pnpm test`
5. **Master Verifier** — końcowa weryfikacja

---

## Podsumowanie

Z 6 sprintów zaplanowanych w WEBSITE_LAUNCH_SPRINT_PLAN.md:
- **4 sprinty (S1-S4): ✅ GOTOWE**
- **2 sprinty (S5-S6): 🟡 częściowo — ok. 2-3h pracy**

Główna oś czasu: S5 → S6. Po nich Final Master Summary.