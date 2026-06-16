# Security & Privacy Review — Full Audit & Fix
**Data:** 2026-06-15 09:00
**Skill:** security-privacy-review (.github/skills/security-privacy-review/SKILL.md)

## Przeczytane dokumenty
- `docs/SYSTEM_ARCHITECTURE.md` §11 Hard Rules
- `docs/DB_CONVENTIONS.md`
- `docs/DATA_MODEL.md`
- `docs/ENTITLEMENTS.md`
- `netlify.toml`
- Wszystkie migracje Supabase (8 plików)
- `apps/web/src/lib/supabase.ts`
- `apps/web/src/store/useAuthStore.ts`
- `netlify/functions/*.ts` (5 funkcji)

## Znalezione problemy

| Severity | Problem | Plik | Status |
|----------|---------|------|--------|
| 🔴 HIGH | `flowType: 'implicit'` — token w URL, brak PKCE | `supabase.ts:36` | ✅ FIXED → pkce |
| 🔴 HIGH | Brak CSP → XSS podatność | `netlify.toml` | ✅ FIXED |
| 🔴 HIGH | Brak rate limiting na API | Funkcje Netlify | ✅ FIXED |
| 🟡 MEDIUM | Brak Permissions-Policy | `netlify.toml` | ✅ FIXED |
| 🟡 MEDIUM | Brak security.txt | `/.well-known/` | ✅ ADDED |
| 🟡 MEDIUM | Storage bucket brak DELETE policy | `migrations/initial` | ✅ FIXED |
| 🟢 LOW | Node 18 deprecated dla supabase-js | `package.json` | ⏭️ Do osobnego sprintu |
| 🟢 LOW | Error messages mogą leakować | Funkcje | ⏭️ Do osobnego sprintu |

## Wykonane zmiany

### 1. PKCE Auth (🔴 HIGH)
- **Plik**: `apps/web/src/lib/supabase.ts`
- **Zmiana**: `flowType: 'implicit'` → `flowType: 'pkce'`
- **Efekt**: Token nie leakuje przez URL, PKCE challenge/verify chroni przed przechwyceniem

### 2. Content Security Policy (🔴 HIGH)
- **Plik**: `netlify.toml`
- **Dodano**: Pełna CSP z `default-src 'self'`, ograniczone `connect-src` do Supabase/Stripe/Google, `frame-src` tylko Stripe/Google
- **Efekt**: XSS mitigation, ograniczenie skąd mogą pochodzić resource'y

### 3. Rate Limiting (🔴 HIGH)
- **Plik**: `netlify/functions/_rateLimit.ts` (nowy)
- **Zastosowano w**:
  - `create-checkout.ts` — 5 req/min/IP
  - `create-portal-session.ts` — 3 req/min/IP
  - `stripe-webhook.ts` — 20 req/min/IP (liberalny — Stripe retry)
- **Efekt**: Ochrona przed brute-force i DoS na endpointach

### 4. Permissions-Policy (🟡 MEDIUM)
- **Plik**: `netlify.toml`
- **Dodano**: `camera=(), microphone=(), geolocation=(), interest-cohort=()`

### 5. security.txt (🟡 MEDIUM)
- **Plik**: `apps/web/public/.well-known/security.txt` (nowy)
- **Endpoint**: `https://tmcstudio.app/.well-known/security.txt` ✅ 200 OK

### 6. Storage Policies (🟡 MEDIUM)
- **Plik**: `supabase/migrations/20260615000000_tighten_storage_policies.sql` (nowy)
- **Dodano**: DELETE policies dla avatars i thumbnails z weryfikacją właściciela

## Wyniki grep-check (secrets leak)
```
rg -n "sk_live_|pk_live_|service_role" .
→ Tylko .env.local i .env.example (oczekiwane, bezpieczne)
→ Netlify functions: STRIPE_SECRET_KEY → process.env, nie w kodzie
```

## Testy po deployu

| Test | Wynik |
|------|-------|
| Health endpoint | ✅ `{"status":"ok","stripeWebhook":true,"supabase":true}` |
| CSP header | ✅ `content-security-policy: ...` obecny |
| Permissions-Policy | ✅ `camera=(), microphone=()...` |
| X-Frame-Options | ✅ `DENY` |
| Rate limiting (10 req → checkout) | ✅ 5×400, 5×429 (działa!) |
| security.txt | ✅ `https://tmcstudio.app/.well-known/security.txt` → 200 |
| Checkout endpoint | ✅ Działa (sessionId + URL) |

## Decyzja
**SECURITY PASS** ✅ — wszystkie HIGH i MEDIUM naprawione, zweryfikowane na produkcji.

## Zmienione pliki
- `apps/web/src/lib/supabase.ts` — PKCE
- `netlify.toml` — CSP, Permissions-Policy, headers
- `netlify/functions/_rateLimit.ts` — nowy rate limiter
- `netlify/functions/create-checkout.ts` — rate limiting
- `netlify/functions/create-portal-session.ts` — rate limiting
- `netlify/functions/stripe-webhook.ts` — rate limiting
- `supabase/migrations/20260615000000_tighten_storage_policies.sql` — nowa migracja
- `apps/web/public/.well-known/security.txt` — nowy plik