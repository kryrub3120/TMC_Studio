# TMC Studio — kolejny etap przed launch

_Stan na 2026-06-16. Produkcyjny projekt Supabase potwierdzony: `pgacjczecyfnwsaadyvj`._

---

## 1. Supabase (P0) — do odpalenia u Ciebie

Z sandboxa nie ma sieci do `*.supabase.co` ani CLI, więc poniższe komendy
odpalasz lokalnie. **Nie ma `db push` w ciemno** — najpierw `migration list`,
potem `diff`, dopiero na końcu push.

### Najpierw popraw konfigurację (inaczej wskażesz zły projekt!)

Te miejsca wskazują na **dev** `euxauavanukyfofhkrqp`, nie na produkcję:

- `package.json` → `"supabase:link": "supabase link --project-ref euxauavanukyfofhkrqp"`
- `.env.local` → `SUPABASE_PROJECT_ID=euxaua...` oraz oba `SUPABASE_URL`

Do operacji na produkcji linkuj jawnie ref produkcyjny (nie używaj `pnpm supabase:link`).

### Bezpieczna sekwencja

```bash
# 1. Zaloguj CLI (token z https://supabase.com/dashboard/account/tokens)
supabase login

# 2. Linkuj DO PRODUKCJI (poda hasło DB produkcyjnej z dashboardu → Settings → Database)
supabase link --project-ref pgacjczecyfnwsaadyvj

# 3. Porównaj 14 migracji lokalnych z tym, co JEST zastosowane na produkcji.
#    Kolumny Local / Remote: migracja bez znacznika w Remote = NIE jest na prod.
supabase migration list --linked

# 4. Jeśli list pokazuje rozjazd, zobacz realną różnicę schematu PRZED pushem:
supabase db diff --linked --schema public

# 5. Podgląd, co push by zrobił (bez zapisu):
supabase db push --linked --dry-run

# 6. Dopiero gdy 3–5 się zgadzają — zastosuj brakujące migracje:
supabase db push --linked
```

### Analiza ryzyka 14 migracji (z plików)

Przejrzałem wszystkie 14 `.sql`. Skrót:

- **Brak destrukcyjnego DDL.** Jedyny `DROP COLUMN` jest zakomentowany (notatka
  rollback w `add_stripe_customer_id`). Żadnych `DROP TABLE`, `TRUNCATE`,
  `DELETE FROM` na danych produkcyjnych.
- `DROP POLICY/TRIGGER/FUNCTION ... ` występują, ale zawsze jako idempotentne
  „drop+recreate" (standard RLS). Bezpieczne przy ponownym przejściu.
- **Jeden plik bez guardów idempotencji:** `20260615000003_tighten_storage_policies.sql`
  tworzy `CREATE POLICY ...` bez `DROP POLICY IF EXISTS`/`IF NOT EXISTS`. Jeśli te
  polityki storage już istnieją na prod, push tego pliku **wywali się** na
  „policy already exists". Tracking migracji to chroni (nie odpali drugi raz),
  ale gdyby polityki dodano ręcznie w dashboardzie — najpierw sprawdź
  `select polname from pg_policies where tablename='objects';`.
- `20260615000002_simplify_org_roles.sql` ma `UPDATE` na danych (admin/coach →
  member). Jest idempotentny (drugie przejście to no-op), CHECK-i robione przez
  `DROP CONSTRAINT IF EXISTS` → bezpieczne.
- `20260209000000_reenable_rls_project_shares.sql` = samo `ENABLE ROW LEVEL
  SECURITY` (idempotentne).

Wniosek: zestaw migracji jest bezpieczny do zastosowania w kolejności. Jedyny
realny przypadek brzegowy to storage policies — dlatego krok 4–5 (diff +
dry-run) przed pushem.

### Osobno: health zwraca `environment: "development"`

To nie jest sprawa migracji, tylko zmiennej środowiskowej na hostingu
(Netlify). Przed launch ustaw `NODE_ENV`/własny `ENVIRONMENT` na `production`,
żeby health i logi nie raportowały „development" na produkcji.

---

## 2. Pricing / checkout (zrobione w tej sesji)

- Płatne CTA na `/pricing` niosą intencję zakupu: `Pro`/`Team` linkują do
  `/app?upgrade=pro|team`, a `/app` po wejściu **automatycznie otwiera modal
  pricingu** (i czyści param z URL). Wcześniej karty rzucały usera na pustą
  planszę bez kontekstu.
- Karta `Pro` dostała badge „Most Popular" + mocniejsze wyróżnienie (ring),
  spójne z modalem in-app.
- Pliki: `apps/web/src/pages/PricingPage.tsx`, `apps/web/src/app/AppShell.tsx`.

**Do rozważenia (następny krok, nie blocker):** strona `/pricing` reklamuje plan
roczny ($90/$290 „2 months free"), ale in-app `PricingModal` checkoutuje **tylko
cykl miesięczny** (hardkodowane `STRIPE_PRICES.*.monthly`). Albo dodaj przełącznik
roczny do modalu i przekaż cykl z `/pricing`, albo zdejmij roczny toggle z
publicznej strony do czasu wdrożenia — teraz user wybierający „Yearly" i tak
zapłaci miesięcznie.

---

## 3. Przegląd ikon (zrobione — audyt, bez ryzykownych zmian)

Sprawdziłem wszystkie 189 inline `<svg>` w `apps` + `packages`:

- **Są spójniejsze niż sugeruje liczba.** 164/189 używa `viewBox="0 0 24 24"`,
  zdecydowana większość `strokeWidth=2` + `stroke="currentColor"`.
- Odchylenia są **celowe i poprawne**: znaki logo (sw=3, viewBox 44×28), flagi
  krajów (LanguageSwitcher), ilustracja piłki, oraz duże ikony empty-state
  (32px, cieńszy `sw=1.5` jest tu prawidłowy). Hardkodowany `#3b82f6` to kolor
  drużyny/zaznaczenia na canvasie i paleta folderów — **nie** błąd ikon.
- **Werdykt: nic do naprawy pod launch.** Mechaniczna „unifikacja" pogorszyłaby
  empty-state'y i logo bez zysku.
- Na przyszły pass (nie blocker): wspólny wrapper `<Icon>` (rozmiar/stroke/
  `aria-hidden` w jednym miejscu) lub `lucide-react`, plus uzupełnienie
  `aria-hidden` na ikonach dekoracyjnych (teraz 12/189).

---

## 4. Weryfikacja tej sesji

- TypeScript: **OK** dla `apps/web`, `packages/ui`, `packages/board`.
- `git diff --check`: czysto.
- `vitest` / `vite build`: **nie odpalone w tym sandboxie** — `node_modules`
  zainstalowane pod macOS, brak natywnego `@rollup/rollup-linux-arm64-gnu`, a
  rejestr npm zablokowany. Odpal u siebie `pnpm test` i `pnpm build` (przed
  zmianami przechodziły: 110 testów, build OK; moje zmiany są małe i TS-czyste).
- Migracji ani bazy **nie dotykałem.**
