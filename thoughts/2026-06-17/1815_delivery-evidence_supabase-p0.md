# Delivery Evidence — Supabase P0 (pre-launch DB prep)
**Data:** 2026-06-17 17:15
**Iteracja:** 1

## Co zaimplementowano

1. **`.env.local`** — utworzony z produkcyjnymi wartościami Supabase (URL + anon key) ze źródła `.env.local.prod.bak`
2. **`package.json`** — dodany skrypt `supabase:link-prod` jawnie linkujący do produkcji (`pgacjczecyfnwsaadyvj`), aby user nie użył przypadkowo `supabase:link` który wskazuje dev

## Co zweryfikowano (audyt)

### Ryzyko storage policies (`20260615000003_tighten_storage_policies.sql`)
- Tworzy 2 polityki (`CREATE POLICY`) bez `DROP POLICY IF EXISTS`/`IF NOT EXISTS`
- Jeśli polityki istnieją na prod, push wywali się z "policy already exists"
- Tracking migracji to chroni (nie odpali drugi raz), ale jeśli polityki dodano ręcznie → trzeba sprawdzić `SELECT * FROM pg_policies WHERE tablename = 'objects'`
- **Wniosek:** niskie ryzyko, wystarczy `diff --linked` przed pushem

### `20260615000002_simplify_org_roles.sql`
- `UPDATE` admin/coach → member — idempotentny (drugie przejście = no-op)
- `DROP CONSTRAINT IF EXISTS` — bezpieczne
- **Wniosek:** bezpieczne

### Pozostałe migracje
- Brak destrukcyjnego DDL (DROP TABLE, TRUNCATE, DELETE FROM)
- Wszystkie `DROP POLICY/TRIGGER/FUNCTION` to standardowe "drop+recreate" RLS
- **Wniosek:** zestaw 14 migracji bezpieczny, jedyne ryzyko to storage policies

### `health.ts`
- Używa `process.env.NODE_ENV || 'development'`
- Na Netlify trzeba ustawić zmienną środowiskową `NODE_ENV=production` (lub własną `ENVIRONMENT=production` i zmienić kod)

## Zmienione pliki
- `apps/web/.env.local` — nowy plik z prod Supabase URL + anon key
- `package.json` — dodany skrypt `supabase:link-prod`

## Checklista wykonawcza dla usera
```bash
# Krok 1: Zaloguj CLI (raz, token z dashboardu)
supabase login

# Krok 2: Linkuj DO PRODUKCJI (poda hasło DB z dashboardu)
pnpm supabase:link-prod

# Krok 3: Porównaj migracje lokalne vs remote
supabase migration list --linked

# Krok 4: Zobacz realną różnicę schematu
supabase db diff --linked --schema public

# Krok 5: Podgląd co push zrobi (bez zapisu)
supabase db push --linked --dry-run

# Krok 6: Jeśli 3-5 OK → zastosuj migracje
supabase db push --linked
```