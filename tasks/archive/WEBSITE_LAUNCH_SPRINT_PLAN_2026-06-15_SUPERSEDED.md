# Sprint Plan — Website Launch (Faza 1)

_Utworzono: 2026-06-15 · Tryb: `@MasterAutopilot` (S1→S6) lub `@Delivery` per sprint_

Cel: domknąć **warstwę marketingowo-sprzedażową + minimum prawne UE**, tak by `tmcstudio.app` mógł sprzedawać. Oś: **„Narysuj dowolną taktykę w 30 sekund."** Treść **najpierw PL**, język **domyślny EN (x-default)**, pozostałe serwowane wg lokalizacji/preferencji użytkownika.

> Dokumenty bazowe (Source of Truth): `docs/SITE_ARCHITECTURE.md`, `docs/WEBSITE_LAUNCH_PLAN.md`, `docs/STRIPE_TAX_SETUP.md`.

---

## Co już istnieje (nie budować od nowa)

| Obszar | Stan | Lokalizacja |
|---|---|---|
| **i18n** | ✅ gotowa lekka warstwa (`useTranslation`-like, en/pl/es, detekcja `navigator.language`, localStorage, domyślny EN) | `packages/ui/src/i18n.tsx`, `locales/{en,pl,es}.*`, `LanguageSwitcher.tsx` |
| **Stripe / billing** | ✅ podpięty (checkout, entitlements, payment return) | `apps/web/src/config/stripe.ts`, `hooks/useBillingController.ts`, `useEntitlements.ts`, `lib/entitlements.ts` |
| **Strony prawne** | 🟡 istnieją, do audytu UE | `apps/web/src/pages/{PrivacyPolicy,TermsOfService,CookiePolicy}.tsx` |
| **Download** | ✅ | `apps/web/src/pages/DownloadPage.tsx` |
| **Routing** | 🟡 `/` = od razu edytor (App) | `apps/web/src/main.tsx` |

➡️ Wniosek: i18n i Stripe są gotowe — **skupiamy się na stronach (landing, pricing), treści i zgodności prawnej.**

---

## S1 — Rozdział `/` (landing) od `/app` (edytor)

**Zakres:**
- Przenieść `<App/>` z `/` na **`/app`** (edytor; guest mode bez zmian).
- Na `/` osadzić nowy `<LandingPage/>`.
- Dodać redirecty: stare linki do `/` aplikacji → `/app`; przycisk „Open the board" na landingu → `/app`.
- **Tauri:** router startuje wprost na `/app` (warunek `isTauri` w `main.tsx`).
- Lazy-load edytora — landing nie ładuje bundla Konvy/edytora.

**DoD:** `/` renderuje landing bez ładowania edytora; `/app` to dotychczasowy edytor; Tauri otwiera `/app`; brak regresji w deep-linkach (`/privacy`, `/download`, `/invite`).

---

## S2 — Landing Page (`/`) — treść PL-first

**Zakres (sekcje wg `WEBSITE_LAUNCH_PLAN.md` §2.1):**
1. Hero — H1 „Narysuj dowolną taktykę w 30 sekund" + sub + 2 CTA (`Open the board` / `Zobacz plany`) + miejsce na animowane demo (WebM/MP4, placeholder na start).
2. Pasek zaufania (logo/oceny — tylko prawdziwe).
3. „Jak to działa w 30 s" — 3 kroki ze skrótami (`1-6` → `A`/`R` → `Cmd+E`).
4. 4 filary (szybkość / minimum kroków / wszędzie / gotowe do udostępnienia).
5. Keyboard-first + Command Palette `Cmd+K`.
6. Everywhere (web + desktop + sync) → link do `/download`.
7. 3 karty use-case (trener / twórca / klub).
8. Galeria eksportów.
9. Pricing teaser → `/pricing`.
10. FAQ + stopka z linkami prawnymi i `LanguageSwitcher`.

**Wymagania techniczne:**
- Wszystkie teksty przez istniejący `t()` — klucze dodać do `locales/{pl,en,es}` (PL kompletny, EN kompletny, ES = castellano).
- Mobile-first, Tailwind, zgodne z `docs/DESIGN_SYSTEM.md`.
- Dostępność (WCAG 2.1 AA): nagłówki, kontrast, alty, nawigacja klawiaturą.

**DoD:** landing kompletny i responsywny; przełączenie języka PL/EN/ES zmienia całą treść; Lighthouse a11y ≥ 90; hero < 1,5 MB.

---

## S3 — Pricing (`/pricing`)

**Zakres:**
- Tabela planów **Guest / Free / Pro / Team** ze źródła `lib/entitlements.ts` (projekty, kroki, foldery, eksporty PNG/GIF/PDF, sync).
- Przełącznik **miesięcznie / rocznie**.
- **Ceny brutto z VAT** + waluta wg rynku (PLN/EUR/USD/GBP) — spójne ze Stripe (`STRIPE_TAX_SETUP.md` §5).
- CTA: `Continue for free` / `Upgrade` → podpiąć pod istniejący `useBillingController`.
- FAQ rozliczeniowe (czy Free naprawdę darmowy, anulowanie, zwroty).
- Język bez dark patterns (filozofia produktu).

**DoD:** `/pricing` w 3 językach; przyciski uruchamiają istniejący checkout; ceny brutto; brak fałszywej pilności.

---

## S4 — Zgodność prawna UE

**Zakres (wg `SITE_ARCHITECTURE.md` §4):**
- **Audyt** `/privacy` `/terms` `/cookies` pod RODO/ePrivacy (administrator, podstawy prawne, procesory: Supabase/Netlify/Stripe/Google, prawa użytkownika, retencja).
- **Nowe strony:** `/refunds` (prawo odstąpienia 14 dni + zasady), `/legal` (Impressum/dane firmy), `/accessibility` (deklaracja EAA).
- **Baner cookie consent** — opt-in, równorzędne Akceptuj/Odrzuć, brak pre-zaznaczeń, możliwość wycofania zgody.
- **Checkbox** zgody na natychmiastowe świadczenie + utratę prawa odstąpienia w checkout (zapis w metadanych Stripe — `STRIPE_TAX_SETUP.md` §4 krok 5).
- Linki prawne w stopce każdej strony.

**DoD:** wszystkie strony prawne istnieją i są podlinkowane; baner cookie działa (opt-in, zapis preferencji); checkbox odstąpienia obecny w checkout; treści w 3 językach (prawne — do weryfikacji przez prawnika, oznaczyć `TODO: legal review`).

---

## S5 — i18n treści + SEO + wydajność

**Zakres:**
- Uzupełnić `locales/{pl,en,es}` o wszystkie klucze landing/pricing/legal (PL i EN kompletne; ES castellano).
- **SEO:** lokalizowane `<title>`/meta/OG per strona; `sitemap.xml`; tagi **`hreflang`** + `x-default=en`. Uwaga: obecny i18n jest client-side — dla indeksacji rozważyć **prerender per język** stron marketingowych (np. statyczne warianty `/`, `/pricing`).
- Dane strukturalne `SoftwareApplication` + `FAQPage`.
- **Budżet wydajności:** LCP < 2,0 s, hero jako WebM/MP4, lazy-load galerii.

**DoD:** Lighthouse perf + a11y ≥ 90 na `/` i `/pricing`; hreflang poprawny; sitemap zawiera warianty; brak brakujących kluczy i18n (fallback do EN nie zostawia „surowych" kluczy).

---

## S6 — Analityka + weryfikacja (gate przed launchem)

**Zakres:**
- Eventy lejka: `landing_view → open_board → first_element_added → first_export → signup → limit_hit → pricing_view → upgrade`.
- Kluczowa metryka: **time-to-first-export** (potwierdza promis 30 s).
- Narzędzie świadome prywatności / za zgodą (spójne z banerem cookie).
- **QA matrix:** zakup B2C PL/DE/ES (VAT w cenie), B2B reverse charge, faktura, webhook → `subscriptionTier` w Supabase, anulowanie przez Customer Portal (równolegle z `@StripeTester`).
- Weryfikacja: Lighthouse, przełączanie języków, deep-linki, mobile.

**DoD:** eventy raportowane end-to-end; time-to-first-export mierzone; QA matrix zielona; raport gotowości do launchu.

---

## Kolejność i zależności

```
S1 (routing) ──► S2 (landing) ──► S3 (pricing) ──► S4 (legal) ──► S5 (i18n+SEO) ──► S6 (analytics+QA)
```
S1 blokuje resztę. S2–S4 mogą iść częściowo równolegle po S1. S5 domyka treść/SEO. S6 to gate.

## Track równoległy (poza kodem frontu)
- **Stripe Tax / VAT OSS** — wg `docs/STRIPE_TAX_SETUP.md` (agent `@StripeTester` + potwierdzenia księgowego). Nie blokuje S1–S2.
- **Audyt prawny** treści (S4) i **audyt WCAG** (S5) — przed publikacją.

---

## Immediate Prompt (start)

```text
@MasterAutopilot wykonaj Sprint Plan z tasks/WEBSITE_LAUNCH_SPRINT_PLAN.md, sprinty S1→S6.
Source of Truth: docs/SITE_ARCHITECTURE.md, docs/WEBSITE_LAUNCH_PLAN.md, docs/STRIPE_TAX_SETUP.md.
Zacznij od S1 (rozdział / od /app). Treść PL-first, język domyślny EN (x-default), reszta wg lokalizacji.
Wykorzystaj istniejącą i18n (packages/ui/src/i18n.tsx) i billing (useBillingController) — nie buduj ich od nowa.
```
