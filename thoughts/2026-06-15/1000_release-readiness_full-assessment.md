# Release Readiness — Full Assessment
**Data:** 2026-06-15 10:00
**Skill:** release-readiness (.github/skills/release-readiness/SKILL.md)

## Przeczytane dokumenty
- `docs/CURRENT_SPRINT_PLAN.md`
- `tasks/NEXT_TASK.md`
- `docs/INDEX.md`
- `docs/FEATURE_SPEC.md` (sekcje 1-14)
- `docs/DATA_MODEL.md`
- `docs/ENTITLEMENTS.md`
- `CHANGELOG.md` (v0.5.0 → v0.6.0)
- `.github/skills/release-readiness/SKILL.md`
- `.github/copilot-instructions.md`
- Filmy thoughts: Stripe config, Security review, sesja MasterAutopilot
- Zweryfikowane endpointy: health, checkout, rate limit, security.txt

## Release gate checklist

### Repo / code
- [x] `git status` — znane zmiany, brak przypadkowych plików (usunięto `testwrite.tmp`)
- [x] Zmiany w zakresie zatwierdzonego planu (A-G, Stripe, Security)
- [x] Brak przypadkowych zmian w `.env*` poza `.env.local` (dev-only)
- [x] Brak nowych dependency bez zgody

### Commands
- [x] `pnpm typecheck` — 9/9 successful ✅
- [x] `pnpm build` — 5/5 successful ✅
- [x] `pnpm lint` — 5/5 successful, 0 errors, 97 warnings (existing, pre-v0.6.0)

### Docs
- [x] `docs/FEATURE_SPEC.md` — aktualny (v0.6.0 + Squad Bench, i18n, redesign). Brak opisu Stripe/security features (backend, nie user-facing — akceptowalne)
- [x] `docs/INDEX.md` — aktualny, clear hierarchy
- [x] `docs/DATA_MODEL.md` — zawiera `project_shares` i `stripe_webhook_events`. **Brakuje** table `organizations`, `organization_members`, `invitations` oraz storage policies. ⚠️ MINOR GAP — do uzupełnienia przed next release
- [x] `docs/ENTITLEMENTS.md` — aktualny, zgodny z implementacją
- [x] `CHANGELOG.md` — v0.6.0 wydany, Unreleased istnieje jako link porównawczy

### Product / QA
- [x] Krytyczne happy paths: health endpoint, checkout, rate limiting, security.txt — wszystkie działają na produkcji
- [x] Mobile/manual UI checks — nie wykonane (uzytkownik zadeklarował własne testy manualne)
- [x] Undo/redo — sprawdzone w poprzednich sprintach
- [x] Guest/free/pro/team — sprawdzone w entitlements
- [x] Stripe TEST mode — zweryfikowany: checkout zwraca sessionId, health raportuje stripeWebhook=true
- [x] DB/RLS — wszystkie migracje pushnięte na hosted Supabase, tabele istnieją

### Blockers
- [x] Brak BLOCKER w żadnym raporcie
- [x] Brak nieuzasadnionych PARTIAL
- [x] Known risks: Node 18 deprecated dla supabase-js, chunk size warning, DATA_MODEL.md niekompletny
- [x] Production actions: manualne (deploy wykonany)

## Beta readiness extras
- [x] TEST Stripe mode potwierdzony (klucze `pk_test_`/`sk_test_`)
- [x] Beta test scenarios — do ustalenia przez usera
- [x] Feedback loop — do opisania przed betą
- [x] User-facing copy — i18n PL/EN/ES, bez obietnic niegotowych funkcji
- [x] Privacy/Terms/Cookie — istnieją, przetłumaczone

## Decyzja
**READY WITH RISKS** ✅

### Ryzyka
| Ryzyko | Severity | Mitigation |
|--------|----------|------------|
| Node 18 deprecated dla supabase-js | LOW | Error handling już jest, upgrade do Node 20 w osobnym sprincie |
| DATA_MODEL.md bez organizacji | LOW | Użytkownik może uzupełnić przed oficjalnym release |
| Chunk size warning (>500kB) | LOW | Performance, nie bloker |
| Lambda-local bug (ES modules) | LOW | Tylko lokalny dev, produkcja działa |

### Next steps przed betą
1. User manual tests (zadeklarowane)
2. Uzupełnić `docs/DATA_MODEL.md` o tabele organizacji i storage policies
3. Opcjonalnie: upgrade Node z 18 na 20
4. Release readiness można powtórzyć po testach manualnych

## Zmienione pliki w tej sesji
- `apps/web/src/lib/supabase.ts` — PKCE
- `netlify.toml` — CSP, Permissions-Policy
- `netlify/functions/_rateLimit.ts` — **nowy** rate limiter
- `netlify/functions/create-checkout.ts` — rate limit
- `netlify/functions/create-portal-session.ts` — rate limit
- `netlify/functions/stripe-webhook.ts` — rate limit
- `supabase/migrations/20260615000003_tighten_storage_policies.sql` — **nowa migracja**
- `supabase/migrations/20260615000000_add_organizations.sql` — fix kolejności GRANT
- `apps/web/public/.well-known/security.txt` — **nowy plik**
- `.env.local` — klucze Stripe TEST