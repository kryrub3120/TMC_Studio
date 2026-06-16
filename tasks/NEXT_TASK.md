# Current Task: WEBSITE LAUNCH — Faza 1 (marketing + sprzedaż + prawo UE)

## Status: PLAN GOTOWY — START S1

Pełny plan: **`tasks/WEBSITE_LAUNCH_SPRINT_PLAN.md`** (sprinty S1→S6).

---

## Kontekst

Blokery beta (Security B1-B3, Sprinty A-G) — domknięte (patrz sekcja niżej). Kolejny etap to **warstwa marketingowo-sprzedażowa**, żeby `tmcstudio.app` mógł sprzedawać subskrypcje.

Oś produktu: **„Narysuj dowolną taktykę w 30 sekund."** Treść **PL-first**, język domyślny **EN (x-default)**, reszta wg lokalizacji/preferencji użytkownika.

## Source of Truth (decyzje produktowo-prawne)

- `docs/SITE_ARCHITECTURE.md` — mapa stron + zgodność UE (RODO, cookies, prawo odstąpienia, VAT, EAA)
- `docs/WEBSITE_LAUNCH_PLAN.md` — pozycjonowanie, blueprint treści, lejek PLG, KPI, decyzje
- `docs/STRIPE_TAX_SETUP.md` — analiza krajów + konfiguracja Stripe Tax / VAT OSS
- `tasks/WEBSITE_LAUNCH_SPRINT_PLAN.md` — rozpisane sprinty S1-S6 z DoD

## Zatwierdzone decyzje

- Domena: **tmcstudio.app** (produkt), tacticsmadeclear.com = marka-parasol
- Rozdział **`/` (landing) od `/app` (edytor)**
- Płatności: **Stripe + Stripe Tax** (nie MoR); VAT OSS + faktury po naszej stronie
- Watermark Guest/Free: lewy dolny róg, `tmcstudio.app`, znika w Pro
- `/product`: sekcje na landingu na start
- Języki: **EN domyślny**, **PL** (priorytet treści), **ES = castellano**; reszta wg lokalizacji

## Co już istnieje (nie budować od nowa)

- **i18n**: `packages/ui/src/i18n.tsx` (en/pl/es, detekcja, domyślny EN) + `LanguageSwitcher`
- **Stripe/billing**: `apps/web/src/config/stripe.ts`, `useBillingController`, `useEntitlements`, `lib/entitlements.ts`
- **Strony prawne**: `pages/{PrivacyPolicy,TermsOfService,CookiePolicy}.tsx` (do audytu UE)

---

## Next Steps

1. **S1** — rozdział `/` (landing) od `/app` (edytor) — blokuje resztę
2. **S2** — Landing Page (PL-first, 10 sekcji)
3. **S3** — `/pricing` (podpięte pod istniejący billing)
4. **S4** — zgodność UE (audyt + `/refunds` `/legal` `/accessibility` + baner cookie)
5. **S5** — i18n treści + SEO (hreflang, prerender) + wydajność
6. **S6** — analityka (time-to-first-export) + QA gate

Track równoległy: **Stripe Tax / VAT OSS** (`docs/STRIPE_TAX_SETUP.md`, `@StripeTester` + księgowy), **audyt prawny** treści, **audyt WCAG**.

---

## Immediate Prompt

```text
@MasterAutopilot wykonaj tasks/WEBSITE_LAUNCH_SPRINT_PLAN.md, sprinty S1→S6.
Zacznij od S1 (rozdział / od /app). Wykorzystaj istniejącą i18n i billing — nie buduj ich od nowa.
```

---

## Archiwum: domknięte blokery beta (audyt 2026-06-12)

- **Security B1-B3** ✅ (post-logout leak, RLS project_shares, RLS profiles/folders)
- **Sprint A** ✅ (quick wins, player labels)
- **Sprint E** ✅ (Help Sidebar + Floating Help)
- **Sprint F** ✅ (Coach Tour onboarding)
- **Sprint G** ✅ (Save Panel / ProjectsDrawer / Autosave)
- **Docs Cleanup** ✅

Szczegóły: `docs/CURRENT_SPRINT_PLAN.md`, `docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md`, `docs/archive/`.
