---
name: security-privacy-review
description: Review bezpieczenstwa i prywatnosci TMC Studio: secrets, auth, RLS, post-logout data leaks, service role, produkcja, platnosci i dane usera.
---

# Skill: Security & Privacy Review

Review zmian pod katem bezpieczenstwa, prywatnosci i separacji Dev/Prod.

---

## Kiedy uzywac

- Zmiany w auth, Supabase, RLS, profiles, projects, shares, teams.
- Zmiany w Stripe/payment/webhook/customer portal.
- Zmiany w env/config/Netlify functions.
- Zmiany w user preferences, localStorage, cloud sync, autosave.
- Przed release/beta readiness.
- Gdy zmiana dotyka danych uzytkownika albo uprawnien.

---

## Zawsze przeczytaj najpierw

- `docs/SYSTEM_ARCHITECTURE.md` sekcja 11.
- `docs/DB_CONVENTIONS.md`, jesli DB/RLS.
- `docs/DATA_MODEL.md`, jesli dane/tabele.
- `docs/ENTITLEMENTS.md`, jesli premium/team access.
- `docs/PAYMENT_FOUNDATION.md`, jesli Stripe.
- `docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md`, jesli pre-launch/security blockers.
- Zmienione pliki backend/frontend.

---

## Critical rules

- Nigdy nie printuj sekretow.
- Nie modyfikuj `.env.production`.
- Nie uruchamiaj prod deploy ani remote DB push.
- Service role key tylko server-side / Netlify functions.
- Live Stripe keys tylko manualnie przez usera, nigdy przez agenta.
- Jesli review wymaga prod action, zatrzymaj i uzyj `ASK USER`.

---

## Secrets / env checklist

- [ ] Brak sekretow w kodzie, docs, logs i thoughts.
- [ ] Brak `pk_live_`, `sk_live_`, live webhook secrets w repo.
- [ ] Netlify functions nie zwracaja sekretow w error response.
- [ ] Frontend widzi tylko `VITE_*` i publiczne configi.
- [ ] Service role key nie trafia do browser bundle.

Przydatny check:

```bash
rg -n "sk_live_|pk_live_|whsec_|SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|service_role" .
```

Nie wypisuj wartosci z `.env`; jesli grep trafia w env file, raportuj tylko fakt i ryzyko.

---

## Auth / data isolation checklist

- [ ] Po logout nie zostaja dane poprzedniego usera w store/UI.
- [ ] Cloud sync/autosave nie zapisuje do niewlasciwego usera.
- [ ] Queries do `projects`, `project_folders`, `project_shares`, `profiles` sa ograniczone do usera/uprawnien.
- [ ] Guest/local state nie miesza sie z auth cloud state bez potwierdzenia.
- [ ] User preferences nie nadpisuja cudzych ustawien.

---

## RLS / DB checklist

- [ ] Nowe tabele maja RLS.
- [ ] SELECT/INSERT/UPDATE/DELETE policies sa zgodne z ownership/team/share model.
- [ ] Policies nie tworza recursion problem.
- [ ] Indeksy wspieraja policy/query columns.
- [ ] Backfill nie nadaje wszystkim userom dostepu.
- [ ] Public read/write jest jawnie uzasadnione albo zakazane.

---

## Stripe/payment checklist

- [ ] TEST mode only dla agent-run.
- [ ] Webhook verify signature.
- [ ] Idempotencja eventow.
- [ ] Nie ma natychmiastowego cofniecia premium przy pojedynczym `invoice.payment_failed`, jesli Stripe retry ma dzialac.
- [ ] Customer portal wymaga auth.
- [ ] Price mapping nie pozwala na niezamierzony upgrade.

---

## Privacy checklist

- [ ] Error messages dla usera nie ujawniaja internal IDs/secrets.
- [ ] Logs nie zawieraja PII poza koniecznym minimum.
- [ ] Thoughts nie zawieraja emaili/tokenow/secretow z realnego srodowiska.
- [ ] Dokumentacja nie instruuje agenta do wklejania sekretow w chat.

---

## Expected evidence

- Lista przeczytanych dokumentow/plikow.
- Wyniki grep-checkow z bezpiecznym streszczeniem.
- Lista ryzyk z severity.
- Decyzja: `SECURITY PASS`, `INTERNAL LOOP required`, albo `ASK USER/BLOCKED`.
- Konkretne poprawki wymagane przed akceptacja.
