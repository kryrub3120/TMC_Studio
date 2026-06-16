# Sprint Contract — Supabase P0 (pre-launch DB prep)
**Data:** 2026-06-17 17:00
**Iteracja:** 1

## Cel sprintu
Przygotować lokalną konfigurację Supabase do bezpiecznej migracji na produkcję (`pgacjczecyfnwsaadyvj`) oraz dostarczyć kompletną checklistę dla usera.

## Zakres
1. Utworzyć `.env.local` z produkcyjnymi wartościami Supabase (URL + anon key) — źródło: istniejący `.env.local.prod.bak`
2. Dodać skrypt `supabase:link-prod` w root `package.json` (bezpieczny, jawny link do produkcji)
3. Zweryfikować ryzyko `20260615000003_tighten_storage_policies.sql` — brak guardów idempotencji
4. Zweryfikować `health.ts` — raportuje NODE_ENV, doradzić fix
5. **Dostarczyć kompletną checklistę wykonawczą** dla usera (kroki CLI które musi odpalić lokalnie)

## Poza zakresem
- Modyfikacja produkcyjnej bazy danych (to robi user lokalnie przez supabase CLI)
- Modyfikacja `.env.production`
- Zmiana schematu/migracji
- Podgląd secretów/kluczy produkcyjnych (używamy istniejącego `.env.local.prod.bak`)

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| security-privacy-review | Dotyka sekretów, auth, RLS, env prod/dev | Potwierdzenie że .env.local jest w .gitignore; sekrety nie wyciekają |
| db-migration | Audyt 14 migracji, ryzyko storage policies | Lista migracji + ryzyka |
| ci-debug | Fix skryptów w package.json | `supabase:link-prod` działa |

## Kryteria akceptacji
- [x] `.env.local` istnieje z produkcyjnymi Supabase URL + anon key (kopiowane z `.env.local.prod.bak`)
- [x] `.env.local` jest w `.gitignore` (NIE commitowany)
- [x] Nowy skrypt `supabase:link-prod` w `package.json`
- [x] Checklista wykonawcza dla usera (kroki CLI)
- [x] Ryzyko storage policies udokumentowane

## Ryzyka
- **Storage policies bez guardów idempotencji** — jeśli polityki istnieją na prod, migracja wywali się
- **.env.local może być commitowany** — sprawdzić .gitignore
- **NODE_ENV na Netlify** — health zwraca "development" zamiast "production"