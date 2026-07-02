# TMC Studio - Current Sprint Plan

**Data:** 2026-07-02
**Status:** ACTIVE, krotki wskaznik operacyjny  
**Source of truth:** `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md`

---

## Zakonczone sprinty

### Sprint TXT1–TXT6 — Label Editor Upgrade (Wariant B, Multiline, Align, Unified Shortcuts)

**Status:** ✅ DONE (2026-07-02)
**Source of truth:** `tasks/LABEL_EDITOR_UPGRADE_2026-07-01.md`

Cel: nowy wygląd chipa tekstowego (Wariant B), edycja wieloliniowa, auto-kontrast, wyrównanie tekstu, jeden model skrótów klawiszowych dla wszystkich typów elementów.

Zrealizowane punkty:

1. **TXT1 — Nowy chip (Wariant B)** — `TextNode.tsx`: solid fill, 2px border (`borderColor`/`borderWidth`, auto `darkenHex`), radius 8, elevation shadow, auto-kontrast (`getContrastInk`). W print mode fill/shadow znikają, border zostaje.
2. **TXT2 — Multiline + auto-fit** — Enter = save, Shift+Enter = newline. `useAutosizeTextarea` (scrollHeight + mirror span). auto-width w edytorze.
3. **TXT3 — Wyrównanie tekstu** — pole `textAlign` (`left`/`center`/`right`/`justify`). `Alt+←/→` cykluje align. Nowy `TextAlignToolbar.tsx` z bold/italic + 4 align przyciskami.
4. **TXT4 — Jeden model skrótów: kolor** — `Alt+↑/↓` działa na tekście (naprawiona martwa gałąź). Cykluje kolor dla wszystkich typów elementów.
5. **TXT5 — Jeden model skrótów: rozmiar** — `Shift++`/`Shift+-` zmienia rozmiar każdego typu (player/ball radius, equipment scale, zone W×H, text fontSize, arrow stroke ±1, drawing stroke ±2). Stare `Cmd+Alt+=/-` i equipment-only `+/-` wycofane.
6. **TXT6 — Ctrl+B/I + word-wrap** — `Ctrl/Cmd+B/I` toggle bold/italic podczas edycji i na zaznaczonym tekście. `boxWidth` do ręcznego word-wrap przez boczne uchwyty Transformera.
7. **Nowe testy** — 13 testów w `labelEditorShortcuts.logic.test.ts` (resizeSelected, cycleSelectedColor, cycleTextAlign, textAlignCycleWraps).
8. **i18n** — nowe klucze: `alignLeft`, `alignCenter`, `alignRight`, `alignJustify` w en/pl/es.
9. **Dokumentacja** — `FEATURE_SPEC.md` §1.6, `COMMANDS_MAP.md`, `DATA_MODEL.md` zaktualizowane.
10. **Weryfikacja**: typecheck + 129/129 testów (w tym 13 nowych) + build + `git diff --check` — wszystkie zielone.

Evidence:
- 24 pliki zmodyfikowane, +644/-119.
- Nowe pliki: `TextAlignToolbar.tsx`, `labelEditorShortcuts.logic.test.ts`, `useAutosizeTextarea.ts`.
- Task: `tasks/LABEL_EDITOR_UPGRADE_2026-07-01.md`.

### Sprint Auth V3 — Web-Only Launch Flow (S-AUTH3)

**Status:** ✅ DONE (2026-07-01)  
**Source of truth:** `tasks/AUTH_FLOW_V3_COMPLEX_PLAN_2026-07-01.md`, `docs/WEB_LAUNCH_CHECKLIST.md`

Cel: przygotowanie auth flow i routingu na wyłączność webowego launchu. Zero blokad ze strony desktopu.

Zrealizowane punkty:

1. **S-AUTH3.0 — Popup regression fix** — blokada renderowania app w popupie Google OAuth.
2. **S-AUTH3.1 — Web popup adapter + surface resolver** — `oauthWebPopup.ts`, `oauthSurface.ts`, `authFlow.ts` z dedykowanym stanem `authFlow`.
3. **S-AUTH3.4 — COOP hotfix (2026-07-01)** — usunięto polling `popup.closed` (COOP blokuje odczyt w produkcji). Parent window używa `Promise.race()` — równolegle czeka na `postMessage` i na realną sesję Supabase przez 120s.
4. **Routing web-only**:
   - `/board` jako kanoniczna ścieżka aplikacji.
   - `/app` → `/board` legacy redirect z zachowaniem query i hash.
5. **Aktualizacja linków** — landing, pricing, auth callback, Stripe return, billing portal.
6. **S-AUTH3.3 — Scaffold desktop (Tauri deep-link)** — `oauthDesktopBridge.ts`, `lib.rs`, `tauri.conf.json` — gotowe, ale nie blokuje web launchu.
7. **Dokumentacja**:
   - `docs/WEB_LAUNCH_CHECKLIST.md` — checklista web launchu + COOP workaround.
   - `tasks/AUTH_FLOW_V3_COMPLEX_PLAN_2026-07-01.md` — pełny plan.
   - `docs/AUTH_FLOW.md` — zaktualizowany o web-only scope i COOP sekwencję.
8. **Weryfikacja**: typecheck + 116/116 testów + build + `git diff --check` — wszystkie zielone.
7. **Weryfikacja**: typecheck + 116/116 testów + build + `git diff --check` — wszystkie zielone. Merge `develop` → `main` i push.

Evidence:
- 33 pliki zmodyfikowane, +1602/-202.
- Commity: `42e7309` (develop), `5a929f5` (main — merge).

### Sprint 0.5 — Release & Deploy Verification (triage produkcyjny)

**Status:** ✅ DONE (2026-06-18)

Cel: zamknięcie deploy gap przed dalszymi sprintami.

Zrealizowane punkty:

1. **Wszystkie PROBLEMY 0–14** z `tasks/TRIAGE_PRODUKCJA_2026-06-18.md` naprawione w kodzie:
   - #0: Netlify/Supabase/OAuth config zweryfikowany.
   - #1–14: 16 poprawek (style domyślne strzałek/stref, skład/GK/GKcolor, i18n, skróty, FAQ, watermark, wizja/orientacja, dark mode, feedback) — wszystkie jako ✅ FIXED-UNDEPLOYED.
2. Warningi builda usunięte (Supabase dynamic/static import, Browserslist).
3. Instrukcja przeklikania (sekcje A–G) w pliku triage.
4. Weryfikacja: typecheck (core/ui/web), testy (core 6, web 113), build (ui, web) — wszystkie zielone.

Evidence:
- Plik: `tasks/TRIAGE_PRODUKCJA_2026-06-18.md`
- 23 pliki zmodyfikowane w `apps/web`, `packages/ui`, `packages/board`, `packages/core`

---

### Sprint 1 - Security & Billing Hardening

**Status:** ✅ DONE (2026-06-18)

Zrealizowane punkty:

1. CORS allowlist dla Netlify Functions — `netlify/functions/_cors.ts` z allowlista, env override, Vary: Origin.
2. Auth helper — `netlify/functions/_auth.ts` z `verifyAuth()` i `AuthError`.
3. `create-checkout` — uwierzytelnianie JWT, `client_reference_id` z auth, `customer`/`customer_email` z profilu/auth, priceId allowlista, URL-e walidowane, metadane.
4. `create-portal-session` — CORS allowlist, auth JWT, customer z profilu (nie z body), returnUrl walidacja.
5. Stripe config — TEST/LIVE komentarze, backend/frontend/PricingModal spojnosc, test porownujacy.
6. Testy billing functions — 38 testow (CORS, auth, checkout security, portal security, config consistency) — wszystkie zielone.

Evidence:
- Pliki: `netlify/functions/_cors.ts`, `_auth.ts`, `_stripeConfig.ts`, `create-checkout.ts`, `create-portal-session.ts`
- Testy: `netlify/functions/__tests__/billing.security.test.ts` — 38/38 passed

---

## Aktualny sprint

### Sprint UX-C — Editor Viewport, Pan i Squad Bench

**Status:** 🟢 READY (2026-06-29)  
**Source of truth:** `tasks/UX_EDITOR_VIEWPORT_BENCH_2026-06-29.md`

Cel: tablica ma byc glownym, duzym i wygodnym obszarem pracy na laptopach; po powiekszeniu ma dac sie naturalnie przesuwac; Squad Bench ma startowac ukryty i zapamietywac preferencje; overlaye nie moga nachodzic na siebie.

Zakres:

1. Domyslny rozmiar tablicy + poprawne `Dopasuj do widoku`.
2. Pan przez drag pustego obszaru tablicy, bez psucia dragowania elementow.
3. Overlay safe areas dla zoom/help/squad/bottom bar/inspector.
4. Squad Bench default hidden.
5. Squad Bench visibility jako preferencja uzytkownika, persisted lokalnie i w cloud prefs po zalogowaniu.
6. Manual QA na viewportach laptopowych.

DoD i manual QA matrix sa w `tasks/UX_EDITOR_VIEWPORT_BENCH_2026-06-29.md`.

---

### Sprint 2 - Quality Gate i testy minimalne (S-QA)

**Status:** ✅ DONE (2026-06-22)

Cel: bramka jakosci — lint/typecheck/test/build/e2e blokuja PR.

Zrealizowane punkty:

1. **E2E golden path (Playwright)** — 11 testow w 3 specach:
   - `tactical-board.spec.ts` (4): guest board, add players, **export PNG z `waitForEvent('download')` i asercja `.png` filename**, Shift+P.
   - `auth.spec.ts` (3): guest state, dev login smoke, close modal.
   - `checkout.spec.ts` (4): pricing page, CTA, **/board?upgrade=pro modal z yearly price**, feature comparison.
2. **CI gate** — `.github/workflows/ci.yml`:
   - E2E job (`pnpm e2e`) po buildzie.
   - `--frozen-lockfile` zamiast `--no-frozen-lockfile` we wszystkich 4 jobach.
3. **Konfiguracja**:
   - `e2e/playwright.config.ts` z webServer auto-start, chromium.
   - `.gitignore` — test-results, playwright-report.
   - Wersja 0.8.0 → 0.9.0 (MINOR), CHANGELOG zaktualizowany.
4. **Weryfikacja**: 113/113 unit tests + 11/11 e2e green. `--frozen-lockfile` OK.

Evidence:
- `e2e/*` (5 plikow) — Playwright config, fixtures, specs.
- `.github/workflows/ci.yml` — E2E job.
- `thoughts/2026-06-22/` — dokumentacja Master Autopilot.

Swiadome ograniczenia:
- Auth: devLogin smoke only (nie realny OAuth).
- Checkout: pricing modal smoke only (nie realne Stripe checkout).
- Cloud features (Supabase): nie testowane E2E (brak .env.local).

---
2. CI — lint job + test job odkomentowany w `.github/workflows/ci.yml`.
3. Core smoke tests — `packages/core/src/core.test.ts` (6 testow).

Pozostaje:
- E2E smoke (golden path) — opcjonalnie przed Sprint 3.

---

## Kolejnosc sprintow do launchu

| Kolejnosc | Sprint | Status | Cel |
|---:|---|:---:|---|
| — | Auth Flow V3 | ✅ DONE (2026-07-01) | Web-only auth & routing, `/board` kanoniczne |
| — | Auth Flow hotfix (popup) | ✅ DONE (2026-06-20, wchłonięty przez Auth V3) | Google OAuth popup zamiast redirectu |
| 1 | Security & Billing Hardening | ✅ DONE (2026-06-18) | Bezpieczny checkout, portal, Stripe config |
| 2 | Quality Gate i testy minimalne | ✅ DONE (2026-06-22) | CI lint/test/typecheck/build + core/billing/E2E smoke |
| 3 | Pricing i monetizacja | P1 | Spojnosc pricing -> modal -> checkout, Team value |
| 4 | Activation UX | P1 | First tactic + first export bez pomocy |
| 5 | Landing, legal, SEO, tracking | P1 | Strona gotowa do sprzedazy i minimum UE |
| 6 | Data, performance, observability | P1/P2 | Projekty, bundle, monitoring |
| 7 | Beta launch gate | P1 | QA matrix + 10-20 beta users |
| 8 | Public launch | P1 | Kontrolowane wydanie na rynek |

---

## Zasada

Nie przeskakujemy do desktopu, marketplace, realtime collaboration, referral ani triala przed zamknieciem Sprintow 1-5.
