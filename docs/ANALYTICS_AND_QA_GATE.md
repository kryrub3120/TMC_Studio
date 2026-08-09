# Analytics & QA Gate (S6)

_Utworzono: 2026-06-15 · Domyka Fazę 1_

## Analityka — co wdrożono

Moduł `apps/web/src/lib/analytics.ts` jest **gated zgodą**: nic nie wysyła,
dopóki użytkownik nie zaakceptuje analityki w banerze. Zdarzenia trafiają do
Plausible przez skonfigurowany host lub zgodne API eventów.

### Wpięte zdarzenia lejka

| Event | Gdzie odpala | Status |
|---|---|---|
| `landing_view` | `LandingPage` mount | ✅ |
| `pricing_view` | `PricingPage` mount | ✅ |
| `open_board` | `AppShell` mount (+ start timera TTFE) | ✅ |
| `export` | każdy eksport (png/gif/pdf/svg) | ✅ |
| `first_export` (+ `ttfeMs`) | pierwszy eksport w sesji | ✅ |
| `limit_hit` | modale limitów (projekty/foldery/kroki) | ✅ |
| `upgrade` | aktywacja subskrypcji po powrocie ze Stripe | ✅ |
| `signup` | rejestracja konta email | ✅ |
| `auth_success` | udane logowanie email lub Google | ✅ |
| `first_element_added` | dodanie pierwszego elementu | ✅ |
| `plan_selected` | wybór Free, Pro albo Team wraz z cyklem | ✅ |
| `checkout_started` | rozpoczęcie tworzenia sesji Stripe | ✅ |
| `checkout_failed` | błąd przed przekierowaniem do Stripe | ✅ |
| `checkout_cancelled` | powrót z anulowanego Checkout | ✅ |
| `billing_portal_opened` | rozpoczęcie wejścia do Customer Portal | ✅ |
| `billing_portal_failed` | błąd otwarcia Customer Portal | ✅ |

### Kluczowa metryka: time-to-first-export (TTFE)
Timer startuje przy montażu edytora (`startBoardSession`), a `first_export` niesie `ttfeMs`. To bezpośredni dowód obietnicy „30 sekund". Cel: mediana < 60 s.

### Kontrola przed płatnym ruchem
Sprawdzić w panelu Plausible, czy wszystkie zdarzenia lejka są widoczne po
wyrażeniu zgody oraz utworzyć cele dla `signup`, `checkout_started` i `upgrade`.

## QA Gate — checklist (uruchomić lokalnie na macOS)

> W tym środowisku nie dało się uruchomić `vite build` / testów / Lighthouse — `node_modules` jest zbudowane pod macOS (brak natywnego rollupa `linux-arm64`). Poniższe odpalić lokalnie.

- [ ] `pnpm --filter @tmc/web build` — build przechodzi
- [ ] `pnpm --filter @tmc/web test` — testy zielone
- [ ] **Lighthouse** na `/` i `/pricing`: perf + a11y ≥ 90
- [ ] **Routing:** `/` = landing (bez bundla edytora), `/board` = edytor (`/app` → legacy redirect), Tauri otwiera `/board`
- [ ] **Deep-linki** bez regresji: `/privacy` `/terms` `/cookies` `/refunds` `/legal` `/accessibility` `/download` `/invite` `/pricing`
- [ ] **i18n:** przełączanie PL/EN/ES zmienia całą treść; brak „surowych" kluczy; fallback EN działa
- [ ] **Baner cookie:** pojawia się raz, opt-in działa, wybór zapisany; analityka OFF do akceptacji
- [ ] **Mobile:** landing i pricing responsywne
- [ ] **Płatności (z `@StripeTester`):** checkout B2C PL/DE/ES (VAT w cenie), B2B reverse charge, faktura, webhook → `subscriptionTier` w Supabase, anulowanie przez Customer Portal
- [ ] **OG preview:** debugger social dla `/` i `/pricing`
- [ ] **Analityka:** po zgodzie eventy `landing_view`/`open_board`/`first_export(ttfeMs)` widoczne w logu

## Stan Fazy 1 (sprinty)

| Sprint | Zakres | Status |
|---|---|---|
| S1 | rozdział `/` od `/board`, lazy-load, fix URL-i, `/app` → legacy redirect | ✅ |
| S2 | landing (treść) | ✅ w S1 (sekcje gotowe; brak tylko animacji hero — placeholder) |
| S3 | `/pricing` | ✅ |
| S4 | zgodność UE (strony + baner) | ✅ (treści do przeglądu prawnika; checkbox odstąpienia w Stripe — TODO) |
| S5 | SEO + wydajność | ✅ (hreflang/prerender = osobny follow-up) |
| S6 | analityka + QA gate | ✅ |

## Pozostałe drobne follow-upy (poza Fazą 1)
- Animacja hero (WebM/MP4) zamiast placeholdera.
- Checkbox prawa odstąpienia w Stripe Checkout (`STRIPE_TAX_SETUP.md`).
- Prerender per-locale + hreflang, gdy ES/PL SEO stanie się priorytetem.
- Przegląd prawny treści + audyt WCAG.
