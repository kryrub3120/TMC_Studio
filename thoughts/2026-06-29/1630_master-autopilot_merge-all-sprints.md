# Master Autopilot Summary — Merge sprintów do main
**Data:** 2026-06-29

## Sprinty

| Sprint | Gałąź | Status | Iteracje | Pliki zmienione |
|--------|-------|--------|----------|-----------------|
| S-SITE | feat/site | ZMERGE → develop → main | 1 | LandingPage, PricingPage, i18n, design tokens, sitemap |
| S-BILLING | feat/billing | ZMERGE → develop → main | 1 | create-checkout, stripe webhook, PricingModal, testy |
| S-AUTH | feat/auth | ZMERGE → develop → main | 1 | ResetPasswordPage, auth flow, supabase RPC, locale |
| S-QA | feat/qa | ZMERGE → develop → main | 1 | E2E Playwright (11 testów), CI gate, thoughts |
| UX-3 | feature/ux-3-virtual-canvas | ZMERGE (w develop od początku) | — | canvas DOM, fixy (już w develop) |

## Podsumowanie

1. **feat/site** (0.9.0) — był na `origin/develop` i `origin/feat/site` już wcześniej
2. **feat/billing** (0.8.1) — miał diverged develop → zmergowano z `origin/develop`, zcommitowano kod i thoughts
3. **feat/auth** (0.9.0) — merge przez `TMC-auth` worktree, rozwiązano konflikty wersji i CHANGELOG
4. **feat/qa** (0.9.0) — merge, konflikt tylko CHANGELOG, dodano E2E + CI gate
5. **feature/ux-3-virtual-canvas** — wszystkie 3 commity już były ancestorami develop
6. **main** (HEAD: 78ce36e) — merge develop → main, pushnięty

## Rozwiązane konflikty

Wszystkie konflikty sprowadzały się do:
- **Wersje:** `0.8.1` (billing) vs `0.9.0` (site/develop) — wybrano `0.9.0`
- **CHANGELOG.md:** każda gałąź dodawała własne wpisy pod sekcją `0.9.0` — scalono ręcznie wszystkie (auth + site + billing + qa)

## Użyte skille

- brak (operacja czysto gitowa, nie kodowa)

## Gałęzie pushnięte na remote

- `develop` → latest (f43cc8a)
- `main` → latest (78ce36e)
- `feat/auth` → nowa gałąź na remote
- `feat/qa` → nowa gałąź na remote
- `feat/billing` → już na remote (był fast-forward do develop)
- `feat/site` → już na remote

## Co dalej — wytyczne testowe dla main

Poniższe testy należy wykonać na gałęzi `main` przed ogłoszeniem stabilności:

### 1. Auth (S-AUTH)
- [ ] **Rejestracja email:** załóż konto, potwierdź email → działa
- [ ] **Reset hasła:** /auth/reset-password → formularz, wysyłka linku
- [ ] **Google OAuth:** login popup → callback → działa bez ręcznego odświeżania
- [ ] **Email confirmation flow:** próba loginu bez potwierdzenia → komunikat + resend

### 2. Billing (S-BILLING)
- [ ] **Pricing Modal:** wyświetla ceny Free/Pro/Team (yearly/monthly toggle)
- [ ] **Checkout:** kliknij "Subscribe" na Pro yearly → przekierowanie do Stripe
- [ ] **Webhook:** symulacja `checkout.session.completed` (stripe CLI) → profil dostaje `premium`
- [ ] **Webhook idempotencja:** duplikat eventu → 200 z `duplicate: true`
- [ ] **Anulowanie subskrypcji:** webhook `customer.subscription.deleted` → downgrade do free

### 3. Site (S-SITE)
- [ ] **LandingPage:** wszystkie 11 sekcji renderują się (hero, credibility, how it works, spotlights, use cases, pricing teaser, FAQ, final CTA)
- [ ] **i18n:** przełącz PL/EN/ES → landing, pricing, legal pages po polsku/angielsku/hiszpańsku
- [ ] **Footer:** spójny we wszystkich landing/pricing/legal pages
- [ ] **LegalReviewBanner:** widoczny na Terms/Cookie/Privacy/Policy

### 4. QA (bramka jakości)
- [ ] **Unit testy:** `pnpm test` → 113 testów zielonych
- [ ] **E2E:** `pnpm e2e` → 11 Playwright testów golden path
- [ ] **CI:** `.github/workflows/ci.yml` → `--frozen-lockfile`, E2E job

### 5. Regression — funkcje dotknięte merge
- [ ] **Canvas:** board renderuje się, drag & drop działa (feat/billing dotknął PricingModal, nie powinien zepsuć canvasu)
- [ ] **Export PNG:** działa z canvasu
- [ ] **Cloud sync preferencji:** logowanie → preferencje z chmury
- [ ] **Inspector tab:** dwuklik elementu → przełącza na zakładkę Właściwości
- [ ] **Guest mode:** Cmd+S → toast z logowaniem, nie crash
- [ ] **Menu konta:** gość widzi "Zaloguj się", zalogowany widzi dropdown
- [ ] **Sitemap:** `/download` URL istnieje

## Znane ryzyka
- `apps/web/public/sitemap.xml` — w TMC-qa był zmodyfikowany, pominięty w merge (nie był w konflikcie). Sprawdzić czy sitemap jest aktualny.
- Wersja `0.9.0` — brak tagu na main. Rozważyć tagowanie `v0.9.0` po testach.
- `feature/ux-3-virtual-canvas` — commity są w develop ale gałąź nie usunięta. Rozważyć usunięcie.

## Pliki thoughts
- Ten plik
