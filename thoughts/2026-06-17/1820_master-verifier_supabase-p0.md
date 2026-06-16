# Master Verification — Supabase P0 (pre-launch DB prep)
**Data:** 2026-06-17 17:20
**Iteracja:** 1

---

## Weryfikacja zakresu

- [x] DeliveryPass zrealizowal wszystko z zakresu
- [x] DeliveryPass nie rozszerzyl zakresu

## Weryfikacja DoD

| Kryterium | Status |
|-----------|--------|
| `.env.local` istnieje z produkcyjnymi Supabase URL + anon key | ✅ Skopiowane z `.env.local.prod.bak` |
| `.env.local` jest w `.gitignore` | ✅ Potwierdzone (linia 27 `.gitignore`) |
| Nowy skrypt `supabase:link-prod` w `package.json` | ✅ Dodany |
| Checklista wykonawcza dla usera (kroki CLI) | ✅ W Delivery Evidence |
| Ryzyko storage policies udokumentowane | ✅ W audycie |

## Weryfikacja evidence

- [x] Delivery Evidence wystarczajace — opis zmian, audyt ryzyka, checklista
- [x] Sekrety bezpieczne — `.env.local` w `.gitignore`, nie commitowany
- [x] Zmiana w `package.json` minimalna (dodanie jednego skryptu)

## Zgodność z architekturą

- [x] Bezpieczeństwo: sekrety nie wyciekają
- [x] Środowiska: Dev vs Prod rozdzielone (osobne skrypty link)
- [x] Brak modyfikacji produkcyjnej bazy — user wykonuje lokalnie przez CLI
- [x] `.env.production` nie modyfikowany

## Użyte skille
- `security-privacy-review`: potwierdzono .gitignore, sekrety bezpieczne
- `db-migration`: audyt 14 migracji, ryzyko storage policies
- `ci-debug`: dodanie skryptu do package.json

## Uwagi dla usera
1. Przed `supabase:link-prod` uruchom `supabase login` (token z dashboardu)
2. Do linkowania potrzebne hasło DB (Settings → Database w dashboardzie Supabase)
3. Zawsze rob `diff --linked` i `dry-run` przed `push`
4. Na Netlify ustaw `NODE_ENV=production` w zmiennych środowiskowych