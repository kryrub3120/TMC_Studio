# MVP — 4 równoległe runy MasterAutopilot

**Data:** 2026-06-22
**Cel:** doprowadzić TMC Studio do publicznego, płatnego launchu w czterech równoległych strumieniach.
**Tryb launchu:** publiczny + sprzedaż (live Stripe). Legal/cookie UE w zakresie MVP (z markerami `TODO: legal review`).
**Aplikacje natywne / Apple Sign-In:** poza zakresem — tylko www, apki po launchu.

---

## 0. Warunek wstępny — zanim odpalisz cokolwiek równolegle

Równoległe MasterAutopiloty NIE koordynują się między sobą. Bez izolacji wejdą sobie w pliki.

### Krok 0.1 — commit obecnego stanu (UX-A + UX-B)
Working tree ma ~28 plików niezacommitowanych. Najpierw czysty `develop`:

```bash
cd "/Users/krystianrubajczyk/Documents/PROGRAMOWANIE/TMC Studio "
rm -f .git/index.lock
git add -A
git commit -m "feat(prefs): UX-A flow hardening + UX-B cloud sync (v0.8.0)"
# opcjonalnie podziel na 2 commity (UX-A / UX-B) jeśli chcesz czystszą historię
```

### Krok 0.2 — worktree per strumień (fizyczna izolacja)
```bash
git worktree add ../TMC-auth   -b feat/auth   develop
git worktree add ../TMC-billing -b feat/billing develop
git worktree add ../TMC-site   -b feat/site   develop
git worktree add ../TMC-qa     -b feat/qa     develop
```
Każdy MasterAutopilot odpalasz w osobnym zadaniu, wskazując jego worktree jako katalog roboczy. Po `ACCEPT SPRINT` mergujesz branch do `develop` i pozostałe robią `git rebase develop`.

### Krok 0.3 — kolejność merge (minimalizuje konflikty)
`feat/billing` → `feat/auth` → `feat/qa` → `feat/site` (site ostatni, bo dotyka najwięcej plików stron i najłatwiej go rebase'ować).

---

## 1. Mapa własności plików (żeby runy się nie biły)

| Strumień | Wyłączny owner plików | Nie dotyka |
|----------|----------------------|------------|
| **S-AUTH** | `apps/web/src/store/useAuthStore.ts`, `apps/web/src/store/useUIStore.ts`, `apps/web/src/lib/supabase.ts` (auth+prefs), `packages/ui/src/AuthModal.tsx`, `apps/web/src/pages/AuthCallbackPage.tsx`, klucze `auth.*` w locales | netlify/functions, pages stron, e2e |
| **S-BILLING** | `netlify/functions/*`, `apps/web/src/config/stripe.ts`, `packages/ui/src/PricingModal.tsx` (logika cyklu) | useAuthStore, strony, locales (poza `pricing.*`) |
| **S-SITE** | `apps/web/src/pages/{LandingPage,PublicPageShell,DownloadPage,LegalNoticePage,RefundsPage,AccessibilityPage,CookiePolicy,PricingPage}.tsx`, SEO meta, klucze `landing.*`/`legal.*` | stores, netlify/functions |
| **S-QA** | `e2e/*`, `.github/workflows/ci.yml`, root `package.json` (test pipeline) | kod aplikacji (tylko czyta) |

### Jedyny realny szew: `PricingPage.tsx`
Owner = **S-SITE** (wygląd + treść). S-BILLING **nie** edytuje `PricingPage.tsx` — zamiast tego w swoim raporcie dostarcza spec poprawki propagacji cyklu (`/pricing` → `PricingModal` z właściwym `initialCycle`/`priceId`), a S-SITE go wdraża. Logika cyklu w samym `PricingModal.tsx` należy do S-BILLING.

### Współdzielone additywnie (niskie ryzyko): `locales/{pl,en,es}.ts`
AUTH dokłada `auth.*`, SITE dokłada `landing.*`/`legal.*`, BILLING `pricing.*`. Różne namespace'y → konflikt tylko jak dwa runy ruszą tę samą linię; merge prosty.

---

## 2. Bramki ręczne (agent ich NIE robi — Twój regulamin MasterAutopilota)

- **Live Stripe:** wymiana kluczy test→live (env w Netlify) + realny test kartą + przełączenie webhooka na live endpoint. Agent przygotowuje kod i checklistę; klikasz Ty po `ACCEPT` S-BILLING.
- **Legal review:** treści prawne (ToS, Privacy, Refunds, Cookie) agent pisze jako szkic z markerem `TODO: legal review`; finalną akceptację robi człowiek/prawnik.
- **Migracje prod:** `supabase db push` na produkcję — ręcznie wg `LAUNCH_NEXT_STEPS.md`.

---

## 3. Run Brief — S-AUTH

```text
@MasterAutopilot LOOP 3 sprinty 3proby na sprint:

# Main Plan — S-AUTH: domknięcie logowania (web-only)

## Cel
Domknąć email auth tak, by żaden użytkownik nie został zablokowany, i posprzątać dług sync z UX-B.
Apple/magic-link = POZA ZAKRESEM (tylko www).

## Zakres (wyłączny owner)
useAuthStore.ts, useUIStore.ts, lib/supabase.ts (auth+prefs), AuthModal.tsx, AuthCallbackPage.tsx, klucze auth.* w en/pl/es.

## Sprinty
| Sprint | Cel | Zależności |
|--------|-----|------------|
| S1 | Reset hasła end-to-end: backend resetPasswordForEmail + strona/route resetu + obsługa linku w AuthCallbackPage + stany błędów. Przycisk „sendResetLink" w AuthModal przestaje być martwy. | - |
| S2 | Email confirmation flow: obsługa potwierdzenia maila po signUp (resend, komunikat „sprawdź skrzynkę", poprawne lądowanie linku confirm). | S1 |
| S3 | Dług sync z UX-B: (a) flush beforeunload robi JSONB-merge zamiast nadpisania całego preferences (RPC `preferences = preferences || batch` albo read-merge), (b) wpiąć preferences_updated_at w realny last-write-wins przy load, albo świadomie usunąć kolumnę jeśli zostajemy przy cloud-wins. | - |

## Kryteria akceptacji
- Reset hasła: użytkownik dostaje link, ustawia nowe hasło, loguje się. Działa na prod-like.
- Email confirm: signup bez potwierdzenia komunikuje stan; resend działa.
- Flush beforeunload nie kasuje pól spoza batcha (test: zmień 1 pole, zamknij kartę <600ms, sprawdź że reszta prefs w chmurze nietknięta).
- updated_at albo używany, albo usunięty — bez martwego scaffoldingu.
- i18n auth.* w en/pl/es. typecheck/build/test zielone. Bump wersji + CHANGELOG.

## Skille
security-privacy-review (auth, tokeny, RLS), ui-delivery (AuthModal), regression-testing, docs-update (AUTH_FLOW.md).

## Poza zakresem
Apple, magic-link/OTP, SSO, jakiekolwiek pliki stron i netlify/functions.
```

---

## 4. Run Brief — S-BILLING

```text
@MasterAutopilot LOOP 2 sprinty 3proby na sprint:

# Main Plan — S-BILLING: Stripe gotowy do sprzedaży (live)

## Cel
Doprowadzić lejek płatności do stanu, w którym po ręcznym wpięciu kluczy live sprzedaż po prostu działa.

## Zakres (wyłączny owner)
netlify/functions/* (create-checkout, create-portal-session, stripe-webhook, _stripeConfig), config/stripe.ts, PricingModal.tsx (logika cyklu).
NIE edytuje PricingPage.tsx — dostarcza spec poprawki cyklu dla S-SITE.

## Sprinty
| Sprint | Cel | Zależności |
|--------|-----|------------|
| S1 | Bug rocznego cyklu: zapewnić, że wybór „yearly" propaguje właściwy priceId aż do create-checkout (PricingModal initialCycle → priceId). Plus spec dla S-SITE jak /pricing ma przekazać cykl do modala. | - |
| S2 | Webhook hardening + testy: idempotencja stripe-webhook, obsługa checkout.session.completed / customer.subscription.updated / customer.subscription.deleted, poprawny flip tier w DB. Rozszerzyć billing.security.test.ts o te eventy. Weryfikacja mapowania price→tier (getTierFromPriceId). | S1 |

## Kryteria akceptacji
- W trybie TEST: pełny lejek checkout (monthly i yearly) tworzy poprawną sesję z właściwym priceId.
- Webhook idempotentny (podwójny event nie dubluje skutku); tier flipuje w DB na sub.created/updated/deleted.
- Testy billing zielone, pokrywają 3 eventy. typecheck/build zielone. Bump wersji + CHANGELOG.
- Raport zawiera CHECKLISTĘ RĘCZNEGO GO-LIVE dla użytkownika (env live, webhook endpoint, test kartą).

## Skille
stripe-qa, security-privacy-review, regression-testing.

## Poza zakresem
Wpięcie kluczy live / akcje na koncie Stripe / env produkcyjne (to robi user ręcznie). Pliki stron, auth store.
```

---

## 5. Run Brief — S-SITE

```text
@MasterAutopilot LOOP 3 sprinty 3proby na sprint:

# Main Plan — S-SITE: landing + cała otoczka stronowa

## Cel
Z „strasznie chujowego" landingu i otoczki zrobić spójną, sprzedającą warstwę publiczną gotową na ruch.

## Zakres (wyłączny owner)
pages/{LandingPage,PublicPageShell,DownloadPage,PricingPage,LegalNoticePage,RefundsPage,AccessibilityPage,CookiePolicy}.tsx, SEO meta, klucze landing.*/legal.* w en/pl/es.

## Sprinty
| Sprint | Cel | Zależności |
|--------|-----|------------|
| S1 | Redesign LandingPage + PublicPageShell: spójny nav/footer, hero z jasną propozycją wartości, sekcje funkcji, CTA do rejestracji/pricing. Zgodność z DESIGN_SYSTEM.md, zero hardcoded hexów. | - |
| S2 | PricingPage: czytelne plany/limity/cena, toggle miesiąc/rok, wdrożenie spec propagacji cyklu od S-BILLING (yearly → modal z właściwym cyklem). | spec z S-BILLING |
| S3 | Legal/SEO: ToS/Privacy/Refunds/Cookie jako szkice z `TODO: legal review`, cookie/consent UE, meta+OG tags, sitemap/robots. | - |

## Kryteria akceptacji
- Landing czytelny w light/dark, responsywny, Lighthouse bez czerwonych a11y/perf blockerów.
- /pricing jasno komunikuje wartość i limity; toggle rok/miesiąc działa i przenosi właściwy cykl do checkoutu.
- Strony legal istnieją, oznaczone do review, cookie banner UE działa.
- i18n landing.*/legal.* w en/pl/es. typecheck/build zielone. Bump wersji + CHANGELOG.

## Skille
ui-delivery, design-system-review, docs-update.

## Poza zakresem
Logika checkoutu/cyklu w PricingModal i netlify/functions (to S-BILLING), stores, auth.
```

---

## 6. Run Brief — S-QA

```text
@MasterAutopilot LOOP 2 sprinty 3proby na sprint:

# Main Plan — S-QA: bramka jakości przed launchem

## Cel
Zapewnić, że nic nie wejdzie na prod bez zielonego lint/typecheck/test/build i że golden path działa.

## Zakres (wyłączny owner)
e2e/* (nowe), .github/workflows/ci.yml, root package.json (test pipeline). Kod aplikacji tylko CZYTA.

## Sprinty
| Sprint | Cel | Zależności |
|--------|-----|------------|
| S1 | E2E golden path (Playwright): gość → stwórz taktykę → eksport; rejestracja/login; checkout w trybie TEST. Min. 1 happy path per scenariusz. | - |
| S2 | CI gate: workflow blokuje PR przy failu pnpm lint / typecheck / test / build. Root package.json ma jasny `test` pipeline dla całego monorepo. | S1 |

## Kryteria akceptacji
- E2E przechodzą lokalnie i w CI; golden path realny (nie smoke-only).
- CI faktycznie blokuje czerwony PR (zweryfikowane na celowo zepsutym branchu).
- typecheck/build zielone. Bump wersji jeśli dotyczy + CHANGELOG.

## Skille
regression-testing, ci-debug, release-readiness.

## Poza zakresem
Zmiany w kodzie aplikacji (jeśli E2E wykryje bug — raportuj do właściwego strumienia, nie naprawiaj tutaj).
```

---

## 7. Po wszystkich czterech ACCEPT — final gate

1. Merge wg kolejności z §0.3, rebase pozostałych.
2. Jeden run `release-readiness` na zmergowanym `develop` (może być osobny MasterAutopilot albo @Delivery).
3. Ręczne bramki: live Stripe (test kartą), legal review, `supabase db push` na prod.
4. Beta QA 10–20 osób (wg `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md` §3 definicja launch-ready).

## Poza MVP (backlog post-launch)
Apple/SSO, apki natywne (Tauri/desktop), realtime collab, Sentry+structured logs, bundle analysis, soft-delete/trash, referral. Wg audytu §4 P2.
