---
name: db-migration
description: Bezpieczne lokalne migracje Supabase/Postgres z RLS, indeksami, seed updates, rollbackiem i zakazem produkcyjnych akcji.
---

# Skill: DB Migration

Migracje Supabase/Postgres w TMC Studio.

---

## Kiedy uzywac

- Nowa tabela/kolumna/indeks/polityka RLS.
- Zmiana typu, default, constraint, trigger, function.
- Zmiana `supabase/seed.sql`.
- Zmiana `apps/web/src/lib/supabase.ts` typow/profili wynikajaca ze schematu.
- Zmiana billing/team/project storage w bazie.

---

## Zawsze przeczytaj najpierw

- `docs/DB_CONVENTIONS.md`.
- `docs/DATA_MODEL.md`.
- `docs/AGENTS_CHECKLIST.md`.
- `docs/SYSTEM_ARCHITECTURE.md` sekcja 11.
- Istniejace migracje w `supabase/migrations/`.
- `supabase/seed.sql`, jesli dotykasz danych startowych.
- `apps/web/src/lib/supabase.ts`, jesli zmiana wymaga typow/helpers.

---

## Zakazy

- Nie uruchamiaj `supabase db push`.
- Nie uruchamiaj `pnpm supabase:push`.
- Nie uruchamiaj `supabase link` do hosted projektu.
- Nie modyfikuj produkcji, Netlify env ani `.env.production`.
- Nie printuj sekretow ani service role key.
- Nie usuwaj danych bez jawnej zgody uzytkownika.

---

## Naming / structure

Format repo:

```text
supabase/migrations/YYYYMMDDHHMMSS_opis.sql
```

Przyklady istniejace:

- `20260108000000_initial_schema.sql`
- `20260111000000_add_stripe_webhook_events.sql`
- `20260209000001_add_pin_feature.sql`

Zasady:

- timestamp rosnacy, bez duplikatu,
- opis krotki po angielsku,
- SQL z naglowkiem i sekcjami,
- `IF NOT EXISTS` / `OR REPLACE` tam, gdzie mozliwe,
- osobne indeksy,
- RLS dla nowych tabel.

---

## Implementation checklist

- [ ] Udowodnij, ze zmiana wymaga DB, a nie tylko frontend/local state.
- [ ] Sprawdz aktualny schemat i istniejace migracje.
- [ ] Zaproponuj migracje i ryzyko przed jej uruchomieniem, jesli operacja moze zmieniac dane lub blokowac tabele.
- [ ] Dodaj migracje idempotentna.
- [ ] Dla nowej tabeli: `ENABLE ROW LEVEL SECURITY`.
- [ ] Dodaj RLS policies dla SELECT/INSERT/UPDATE/DELETE zgodnie z ownership model.
- [ ] Dodaj indeksy dla FK, owner/user IDs i czesto querykowanych kolumn.
- [ ] Dodaj default/backfill, jesli potrzebne.
- [ ] Zaktualizuj `supabase/seed.sql`, jesli seed przestaje przechodzic.
- [ ] Zaktualizuj `docs/DATA_MODEL.md`, jesli tabela/kolumna jest znaczaca.
- [ ] Zaktualizuj `apps/web/src/lib/supabase.ts`, jesli typy user/profile/data model sie zmieniaja.

---

## Local verification

Preferowane:

```bash
supabase start
supabase db reset
pnpm --filter @tmc/web typecheck
```

Jesli Supabase nie jest dostepny lokalnie, nie udawaj weryfikacji. Zapisz:

- czego nie uruchomiono,
- dlaczego,
- jakie ryzyko zostaje,
- jaka manualna komenda jest potrzebna.

---

## RLS review

Dla kazdej nowej/zmienionej tabeli:

- [ ] Czy user moze czytac tylko swoje rekordy?
- [ ] Czy INSERT wymusza `auth.uid()`/owner?
- [ ] Czy UPDATE/DELETE ograniczone do ownera/admina?
- [ ] Czy service role use jest tylko po stronie backend/functions?
- [ ] Czy project sharing/team access nie otwiera globalnego read/write?
- [ ] Czy policies unikaja recursion problem znanego z `fix_rls_recursion`?

---

## Rollback plan

Opisz:

- jak cofnac kolumne/tabele/index/policy,
- czy rollback traci dane,
- czy potrzebny backup/manual export,
- czy rollback wymaga osobnej migracji.

---

## Expected evidence

- Sciezka migracji.
- Streszczenie SQL.
- Lista tabel/kolumn/policies/indexow.
- Wynik lokalnego `supabase db reset` albo powod pominiecia.
- Wynik typecheck, jesli typy/frontend dotkniete.
- Aktualizacje `DATA_MODEL.md`/`seed.sql`/typow.
- Rollback plan.
- Ryzyka i niezweryfikowane obszary.
