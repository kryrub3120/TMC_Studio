# Weryfikacja ustaleń audytu TMC Studio
**Data:** 2026-06-18
**Metoda:** Ponowna eksploracja kodu źródłowego + weryfikacja ustaleń z poprzedniego raportu

---

## 0. Podsumowanie weryfikacji

| Twierdzenie z poprzedniego audytu | Status | Uwagi |
|------------------------------------|--------|-------|
| Brak CI/CD | ❌ **BŁĘDNE** | `.github/workflows/ci.yml` ISTNIEJE i ma lint+typecheck+build |
| Brak testów poza `store/slices/__tests__/` | ✅ POTWIERDZONE | |
| Brak weryfikacji JWT w Netlify Functions | ✅ POTWIERDZONE | create-checkout.ts nie sprawdza JWT, używa userId/customerId z body |
| CORS `*` w funkcjach | ✅ POTWIERDZONE | `Access-Control-Allow-Origin: '*'` w create-checkout i create-portal-session |
| In-memory rate limit | ✅ POTWIERDZONE | `_rateLimit.ts` ma komentarz "in-memory limiter, NOT distributed" |
| Brak indeksu `stripe_customer_id` | ❌ **BŁĘDNE** | `idx_profiles_stripe_customer_id` ISTNIEJE (partial, WHERE NOT NULL) |
| Team plan bez `canShareProjects: true` | ✅ POTWIERDZONE | Team ma `canShareProjects: false` z komentarzem `// Future: shared library` |
| Team plan ma 5 seats + invite | ✅ POTWIERDZONE | `maxSeats: 5`, `canInviteMembers: true` |
| PWA odrzucone, desktop za 2-3 msc | ✅ ZATWIERDZONE | Wg decyzji użytkownika |
| Team plan komunikacja słaba | ✅ POTWIERDZONE | `PricingPage` nie ma kalkulatora oszczędności |
| Landing page słaby | ✅ POTWIERDZONE | `LandingPage` to MVP, use-case pages nie istnieją |
| Stripe API `2025-12-15.clover` | ✅ POTWIERDZONE | Hardcoded w 3 funkcjach |
| `document JSONB` bez GIN | ✅ POTWIERDZONE | Brak GIN index w migracjach |
| Brak soft delete | ✅ POTWIERDZONE | `ON DELETE CASCADE` w projektach |
| Brak pagination | ✅ POTWIERDZONE | Brak cursor/offset w widocznych query |

**Kluczowa korekta:** CI/CD ISTNIEJE — to ustalenie było błędne. Trzeba zaktualizować raport.

---

## 1. Szczegóły weryfikacji

### 1.1 CI/CD (KOREKTA — ISTNIEJE)

**Plik:** `.github/workflows/ci.yml`

**Co działa:**
- ✅ Trigger na push do `main`/`develop` i PR do `main`/`develop`
- ✅ Job `lint-and-typecheck` — uruchamia `pnpm typecheck`
- ✅ Job `build` — zależy od lint, uruchamia build
- ✅ Node 24, pnpm 9.15.0 z cache

**Co NIE działa / brakuje:**
- ❌ Brak job `test` — nie uruchamia `pnpm test` mimo że workflow istnieje
- ❌ Brak `pnpm lint` w pipeline (jest `typecheck` + `build`, ale brak lint job)
- ❌ Brak coverage raportu
- ❌ Brak dep review / security audit
- ❌ Brak preview deploys na PR

**Wniosek:** CI jest **częściowe** — typecheck + build tak, lint + test nie. Trzeba rozbudować.

### 1.2 Weryfikacja JWT w Netlify Functions (KRYTYCZNE — POTWIERDZONE)

**Plik:** `netlify/functions/create-checkout.ts`

```typescript
// Linie 79-82: Parsowanie body BEZ weryfikacji JWT
const body: CheckoutRequest = JSON.parse(event.body || '{}');
const { priceId, successUrl, cancelUrl, userId, customerId, email } = body;

// Linie 104-108: userId z body trafia do Stripe jako client_reference_id
if (userId) {
  sessionParams.client_reference_id = userId;
}

// Linie 110-115: customerId z body trafia do Stripe
if (customerId) {
  sessionParams.customer = customerId;
} else if (email) {
  sessionParams.customer_email = email;
}
```

**Potwierdzone ryzyko:**
1. Brak `import { verifyAuth }` z JWT verification
2. Brak porównania `sub` z JWT vs `userId` z body
3. `customerId` z body — atakujący może użyć cudzego customer ID
4. `email` z body — atakujący może podać dowolny email (ale Stripe i tak weryfikuje płatność)

**Webhook `stripe-webhook.ts` jest bezpieczny** — weryfikuje Stripe signature, nie JWT (poprawne).

### 1.3 In-memory Rate Limit (POTWIERDZONE)

**Plik:** `netlify/functions/_rateLimit.ts`

Komentarz w kodzie (linie 5-8):
```typescript
/**
 * IMPORTANT: This is an in-memory limiter, NOT distributed.
 * Each Netlify function instance has its own counter.
 * Acceptable for MVP — upgrade to Redis-based for production scale.
 */
```

**Potwierdzone:** Autor wie o problemie, oznaczył jako "MVP". Rozwiązanie: Upstash Redis.

### 1.4 Indeks `stripe_customer_id` (KOREKTA — ISTNIEJE)

**Plik:** `supabase/migrations/20260108000001_add_stripe_customer_id.sql`

```sql
-- Linie 13-15
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
  ON public.profiles(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;
```

**Wniosek:** Indeks istnieje, partial (WHERE NOT NULL) — optymalny. Poprawione w raporcie.

Dodatkowo w `20260615000004_add_team_tables.sql`:
```sql
-- Linie 21
CREATE INDEX IF NOT EXISTS idx_teams_stripe_customer ON public.teams(stripe_customer_id);
```

**Oba indeksy istnieją.** Trzeba usunąć "Brak indeksu na `profiles.stripe_customer_id`" z listy TODO.

### 1.5 Team Plan Entitlements (POTWIERDZONE)

**Plik:** `apps/web/src/lib/entitlements.ts`

```typescript
// Linie 89-97
team: {
  maxProjects: 'unlimited',
  maxStepsPerProject: 'unlimited',
  maxFolders: 'unlimited',
  cloudSync: true,
  canExportPNG: true,
  canExportGIF: true,
  canExportPDF: true,
  maxSeats: 5,
  canInviteMembers: true,
  canShareProjects: false, // Future: shared library
},
```

**Wniosek:** Team ma 5 seats + invite ✅, ale `canShareProjects: false` ❌ (z TODO "Future: shared library"). To ograniczenie — Team może zaprosić 5 osób, ale nie mogą współdzielić projektów. **To jest prawdziwy problem wartości Team planu.**

### 1.6 PricingPage — Kalkulator oszczędności (POTWIERDZONE BRAK)

**Plik:** `apps/web/src/pages/PricingPage.tsx`

Widoczna struktura: PLANS = ['guest', 'free', 'pro', 'team'], ceny z `PRICE` constant, matrix z `ENTITLEMENTS_BY_PLAN`, ale **brak sekcji "Dla klubów"** z porównaniem:
- 5 × Pro = $45/mo
- 1 × Team = $29/mo
- Oszczędność: $16/mo = $192/rok

**Wniosek:** Komunikacja wartości Team jest słaba. Dodanie kalkulatora to P1.

### 1.7 Landing Page (POTWIERDZONE)

**Plik:** `apps/web/src/pages/LandingPage.tsx`

Widoczne sekcje:
- Hero z animowanym SVG (HeroDemo)
- Pillars (4 kafle: speed, movement, export, everywhere, share, players, steps)
- CTA "Open the board — no signup"
- LanguageSwitcher

**Brakuje:**
- Social proof (testimoniale, logo klubów, liczba użytkowników)
- Use-case pages (`/use-cases/coaches`, `/creators`, `/clubs`) — zaplanowane w `WEBSITE_LAUNCH_PLAN.md`
- Demo wideo (jest tylko animowane SVG)
- Blog/SEO content
- Lead magnet (free template pack za email)

**Wniosek:** Landing to MVP. `WEBSITE_LAUNCH_PLAN.md` ma pełny blueprint — do wdrożenia.

### 1.8 DB — Brak GIN, pagination, soft delete (POTWIERDZONE)

**Migracje sprawdzone:**
- `document` w `projects` — JSONB, brak GIN index
- Brak `LIMIT/OFFSET` w widocznych query (frontend + backend)
- `ON DELETE CASCADE` w `projects`, brak `deleted_at` kolumny
- Brak full-text search (`tsvector`)
- Brak materialized views

**Wniosek:** Wszystkie słabe strony DB potwierdzone.

### 1.9 Inne weryfikacje (POTWIERDZONE)

- **Stripe API wersja:** `2025-12-15.clover` w `stripe-webhook.ts:31`, `create-checkout.ts:18`, `create-portal-session.ts:14` ✅
- **i18n 3 języki:** `en.ts`, `pl.ts`, `es.ts` (sprawdzone w strukturze) ✅
- **Konva + Zustand + React 18:** zgodne z README ✅
- **Entitlements system:** soft-prompt/hard-block działają (potwierdzone w `can()`) ✅
- **Stripe idempotentność:** `stripe_webhook_events` z INSERT-first pattern ✅

---

## 2. Zaktualizowane priorytety (po weryfikacji)

### P0 (krytyczne, natychmiast)

1. **🔴 JWT verification w Netlify Functions** — POTWIERDZONE, krytyczne
2. **🔴 CORS allowlist + CSP** — POTWIERDZONE, krytyczne
3. **🔴 In-memory rate limit** — POTWIERDZONE, ale autor wie (marked as MVP). Migracja na Redis przed skokiem ruchu.

### P1 (ważne, sprint)

4. **🟡 Free trial Pro (7 dni)** — wzrost konwersji
5. **🟡 Kalkulator oszczędności Team na PricingPage** — komunikacja wartości Team
6. **🟡 `canShareProjects: true` dla Team** — realna wartość Team (shared library)
7. **🟡 Landing page wg `WEBSITE_LAUNCH_PLAN.md`** — social proof, use-cases, demo wideo
8. **🟡 Pagination DB (cursor-based)** — wydajność przy ∞ projektach (Pro/Team)
9. **🟡 Autosave debounce** — zmniejszenie obciążenia DB
10. **🟡 Onboarding tour** — time-to-first-value

### P2 (średni priorytet)

11. **🟢 Testy jednostkowe `@tmc/core`** — ROI
12. **🟢 Testy integracyjne Netlify Functions** — bezpieczeństwo
13. **🟢 Rozbudowa CI (lint + test job)** — CI jest częściowe
14. **🟢 Partial JSONB extraction** — wydajność list
15. **🟢 Full-text search** — UX
16. **🟢 Soft delete** — undo
17. **🟢 Empty states + tooltips + undo/redo UI** — UX
18. **🟢 Pinch-zoom mobile** — mobile UX
19. **🟢 Stripe API stabilna wersja** — mniej ryzyka
20. **🟢 Sentry / error tracking** — observability
21. **🟢 Bundle analysis + code-splitting** — wydajność

### P3 (niskie / przyszłe)

22. ⚪ Templates gallery w app
23. ⚪ Desktop Tauri (2-3 msc, planowane)
24. ⚪ Templates marketplace
25. ⚪ Realtime collaboration
26. ⚪ SSO/SAML
27. ⚪ Webhook signature rotation
28. ⚪ 2FA dla Team
29. ⚪ GDPR self-service data export/delete
30. ⚪ Materialized views

---

## 3. Poprawki do poprzedniego raportu

### Usunięte z listy "do zrobienia" (błędne ustalenia)

- ❌ ~~Brak CI/CD~~ → CI ISTNIEJE, ale jest niekompletne (brak lint + test job). **Zmieniono na: "Rozbudowa CI (dodać lint + test job)"**
- ❌ ~~Brak indeksu na `profiles.stripe_customer_id`~~ → INDEKS ISTNIEJE (partial). **Usunięte z TODO.**

### Dodane do weryfikacji

- ✅ CI jest częściowe — typecheck + build działają, lint + test nie
- ✅ Indeks `stripe_customer_id` istnieje w 2 miejscach (profiles + teams)

### Bez zmian (potwierdzone)

- JWT verification — krytyczne
- CORS `*` — krytyczne
- In-memory rate limit — ważne (autor wie)
- Team `canShareProjects: false` — problem wartości
- Brak GIN, pagination, soft delete — wszystkie potwierdzone
- Landing page słaby — potwierdzone

---

## 4. Wnioski

**Weryfikacja potwierdza 90% ustaleń.** Jedyna znacząca korekta: CI/CD istnieje (częściowo).

**Najważniejsze wnioski:**

1. **CI jest, ale niepełne** — to dobra wiadomość (fundament istnieje), ale trzeba dodać lint + test job + coverage.

2. **JWT verification to P0** — największe ryzyko w całym audycie. Atakujący może podszyć się pod dowolnego userId w checkout. Implementacja: helper `_auth.ts` z `jose` + weryfikacja w każdej funkcji.

3. **Team plan ma ukrytą wartość** — 5 seats + invite daje oszczędność 36% vs 5× Pro ($192/rok). Problem: brak komunikacji + `canShareProjects: false` ogranicza użyteczność. Fix: kalkulator + `canShareProjects: true` + shared library UI.

4. **Landing page to MVP** — `WEBSITE_LAUNCH_PLAN.md` ma pełny blueprint z 10 sekcjami (hero, trust bar, how it works, pillars, keyboard-first, everywhere, use-cases, exports, pricing, FAQ). Do wdrożenia wg planu.

5. **DB potrzebuje pagination** — Pro/Team mają ∞ projektów, ale brak LIMIT/cursor. Przy 100+ projektach wydajność spadnie.

6. **Desktop (Tauri) za 2-3 msc** — potwierdzone przez użytkownika. PWA odrzucone. Plan: shared core, offline-first, auto-update.

---

**Raport zapisany w:** `thoughts/2026-06-18/0001_master-autopilot_audit-weryfikacja.md`

**Następny krok:** Zaktualizować `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md` z poprawkami (usunięcie błędnych ustaleń, dodanie sekcji o częściowym CI).

**Decyzja:** ACCEPT / LOOP AGAIN / STOP?
