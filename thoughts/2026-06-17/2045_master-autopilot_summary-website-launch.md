# Master Autopilot Summary - Website Launch (S1-S6)
**Data:** 2026-06-17 20:45

## Stan realizacji: WEBSITE_LAUNCH_SPRINT_PLAN

| Sprint | Status | Co zrobione |
|--------|--------|-------------|
| **S1** Rozdział `/` vs `/app` | ✅ DONE (wcześniej) | Landing na `/`, edytor na `/app`, lazy-load Konvy, Tauri → HashRouter + `/app` |
| **S2** Landing Page (10 sekcji) | ✅ DONE (wcześniej) | Hero, "Jak działa", filary, keyboard-first, everywhere, use-case, galeria, pricing teaser, FAQ, stopka + structured data (SoftwareApplication + FAQPage) |
| **S3** Pricing | ✅ DONE (wcześniej) | Tabela 4 planów, toggle roczny/miesięczny, FAQ, CTA → `/app?upgrade=plan` |
| **S4** Zgodność prawna UE | ✅ DONE (wcześniej) | Privacy, Terms, Cookie + ConsentBanner, Refunds, Legal, Accessibility — wszystkie strony istnieją |
| **S5** i18n + SEO | ✅ DONE (wcześniej) | en.ts=1606 / pl.ts=1486 / es.ts=1486 linii, sitemap.xml (44 urle, hreflang en/pl/es/x-default), structured data na landing+pricing, useDocumentMeta per page |
| **S6** Analityka + QA | ✅ **DOKOŃCZONE (2026-06-17)** | 8/8 eventów wpiętych: `LANDING_VIEW`, `OPEN_BOARD`, `FIRST_ELEMENT_ADDED` (dopięty), `FIRST_EXPORT`, `EXPORT`, `SIGNUP` (dopięty), `LIMIT_HIT`, `PRICING_VIEW`, `UPGRADE` |

## Co zrobiono dzisiaj w S6

Dopięto 2 brakujące eventy:
- **`FIRST_ELEMENT_ADDED`** — `elementsSlice.ts` → `addElement()` sprawdza `prevLength === 0` i wysyła event z typem elementu (`player`, `ball`, `arrow`, itd.)
- **`SIGNUP`** — `useAuthStore.ts` → `signUp()` wysyła `track(EVENTS.SIGNUP, { method: 'email' })`

Google OAuth signup — odłożony (backend nie rozróżnia signin vs signup w callbacku)

## Pliki zmodyfikowane (dzisiejsze S6)
- `apps/web/src/store/slices/elementsSlice.ts` — +import analytics, +FIRST_ELEMENT_ADDED
- `apps/web/src/store/useAuthStore.ts` — +import analytics, +SIGNUP w signUp()

## Build: ✅ `tsc --noEmit` clean

## Co dalej (sugerowane sprinty)
1. **Stripe Tax / VAT OSS** — konfiguracja podatków wg `docs/STRIPE_TAX_SETUP.md` (równolegle z `@StripeTester`)
2. **Audyt prawny** — oznaczyć `TODO: legal review` na stronach prawnych
3. **Release-readiness assessment** — `release-readiness` skill, final checklist przed launch
4. **Deploy na Netlify** + migracje prod
5. **Beta launch**