# 🗄️ TMC Studio — Database Conventions

**Version:** 1.0.0  
**Created:** 2026-06-09  
**Status:** Living Document  
**Audience:** Wszystkie agenty (Implementer, Tester) — czytaj przed każdą zmianą schematu bazy.

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Migration Naming Convention](#2-migration-naming-convention)
3. [Migration Template](#3-migration-template)
4. [Local Workflow (Step by Step)](#4-local-workflow-step-by-step)
5. [Safe Migration Rules](#5-safe-migration-rules)
6. [Production — ZAKAZANE](#6-production--zakazane)
7. [Seed Data](#7-seed-data)
8. [Schema Inspection (for agents)](#8-schema-inspection-for-agents)
9. [RLS Rules](#9-rls-rules)
10. [Error Recovery](#10-error-recovery)
11. [Agent Quick Reference (Cheatsheet)](#11-agent-quick-reference-cheatsheet)

---

## 1. Architecture Overview

| Aspekt | Wartość |
|--------|---------|
| **Platforma** | Supabase (Postgres 17) |
| **Lokalnie** | `supabase start` — API `:54321`, DB `:54322`, Shadow `:54320` |
| **Hosted** | `euxauavanukyfofhkrqp` (projekt Supabase) |
| **Klient** | `apps/web/src/lib/supabase.ts` (Supabase JS client) |
| **Konfiguracja** | `supabase/config.toml` |
| **Migracje** | `supabase/migrations/` |
| **Seed** | `supabase/seed.sql` |

---

## 2. Migration Naming Convention

**Format:** `YYYYMMDDHHMMSS_opis.sql`

**Przykłady z projektu:**
```
20260108000000_initial_schema.sql
20260108000001_add_stripe_customer_id.sql
20260109000000_fix_rls_recursion.sql
20260109000001_fix_rls_complete.sql
20260109000002_add_project_organization.sql
20260110000000_add_user_preferences.sql
20260111000000_add_stripe_webhook_events.sql
20260209000000_reenable_rls_project_shares.sql
20260209000001_add_pin_feature.sql
```

**Zasady:**
- Timestamp = data + padding zerami (np. `20260209000001` dla 2026-02-09, pierwsza migracja dnia)
- Zawsze rosnący timestamp — **nigdy nie duplikuj ani nie cofaj timestampu**
- Opis w kebab-case, krótki, angielski (np. `add_pin_feature`, `fix_rls_recursion`)
- Maksymalnie 5-6 słów w opisie

---

## 3. Migration Template

Każdy plik migracji MUSI zawierać:

```sql
-- TMC Studio - [Tytuł]
-- Migration: YYYYMMDDHHMMSS_opis.sql
-- Description: [Krótki opis co zmienia]

-- =====================================================
-- 1. [NAZWA ZMIANY 1]
-- =====================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS new_column TEXT;

-- Index (jeśli potrzebny)
CREATE INDEX IF NOT EXISTS idx_projects_new_column ON public.projects(new_column);

-- =====================================================
-- 2. [NAZWA ZMIANY 2]
-- =====================================================

-- ... kolejne zmiany
```

**Wymagane elementy:**
1. **Nagłówek** z nazwą migracji i opisem
2. **`IF NOT EXISTS`** / **`OR REPLACE`** — migracje muszą być idempotentne
3. **Sekcje** z `=====` — grupuj zmiany logicznie
4. **Indeksy** dodawaj osobno po kolumnie (jeśli potrzebne)
5. **RLS** — jeśli tworzysz tabelę (patrz sekcja 9)

---

## 4. Local Workflow (Step by Step)

Gdy potrzebujesz zmienić schemat bazy:

```
┌─────────────────────────────┐
│  1. Sprawdź czy supabase    │
│     jest uruchomiony        │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  2. Utwórz plik migracji    │
│     supabase/migrations/    │
│     YYYYMMDDHHMMSS_opis.sql │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  3. ZAPYTAJ UŻYTKOWNIKA    │
│     o zgodę na wykonanie    │
│     (obowiązkowe!)          │
└──────────┬──────────────────┘
           ↓ (po zgodzie)
┌─────────────────────────────┐
│  4. supabase db reset       │
│     (usuwa dane, stosuje    │
│      wszystkie migracje     │
│      + seed.sql)            │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  5. Zweryfikuj:             │
│     - Tabele istnieją       │
│     - Seed zadziałał       │
│     - Aplikacja działa      │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  6. Raportuj wynik          │
│     użytkownikowi           │
└─────────────────────────────┘
```

**Komendy:**
```bash
# Uruchom lokalny Supabase
supabase start

# Zatrzymaj
supabase stop

# Reset bazy (usuwa dane, reaplikuje migracje + seed)
supabase db reset

# Generuj diff (do sprawdzenia co się zmieniło)
pnpm supabase:diff

# Status migracji
supabase db status
```

---

## 5. Safe Migration Rules

> ⚠️ **OBOWIĄZKOWE** — te zasady wynikają z `SYSTEM_ARCHITECTURE.md §11`

### R1 — Zawsze pytaj użytkownika przed migracją
**Przed wykonaniem** `supabase db reset` lub `supabase migration up`, agent MUSI:
1. Opisać co migracja zmienia
2. Zgłosić ryzyka (np. blokada tabeli, utrata danych, duża tabela)
3. Poczekać na zgodę
4. **Jak pytać:** Użyj narzędzia `vscode_askQuestions` (z pojedynczym pytaniem "Czy zatwierdzasz?" z opcjami Tak/Nie) lub po prostu opisz zmianę w wiadomości i poczekaj na odpowiedź. **Nigdy nie wykonuj migracji bez jawnej zgody.**

**Wzór raportu ryzyka:**
```
Migracja: 20260209000001_add_pin_feature.sql
Zmiany: Dodaje kolumnę is_pinned do public.projects i public.project_folders
Ryzyko: NISKIE — tylko ADD COLUMN z DEFAULT, nie blokuje tabeli na długo
Zatwierdzić? [tak/nie]
```

### R2 — Testuj na Dev przed Prod
- Zawsze testuj lokalnie (`supabase db reset`) przed jakąkolwiek operacją na hosted
- Sprawdź czy seed.sql nadal działa po zmianie schematu
- Jeśli seed wymaga aktualizacji — zrób to w tej samej PR

### R3 — Idempotentność
- Każda migracja musi być bezpieczna do wielokrotnego uruchomienia
- Używaj `IF NOT EXISTS` dla CREATE TABLE / ADD COLUMN
- Używaj `OR REPLACE` dla funkcji i triggerów
- Używaj `DROP IF EXISTS` przed DROP

### R4 — Indeksy po kolumnach
Gdy dodajesz kolumnę która będzie używana w WHERE, JOIN lub ORDER BY:
```sql
CREATE INDEX IF NOT EXISTS idx_nazwa_tabeli_kolumna ON public.nazwa_tabeli(kolumna);
```

**Indeks złożony (na 2+ kolumnach) — gdy zapytania filtrują po wielu kolumnach:**
```sql
CREATE INDEX IF NOT EXISTS idx_projekty_user_created 
  ON public.projects(user_id, created_at DESC);
```

### R5 — Nie usuwaj kolumn bez zgody
- DROP COLUMN = utrata danych. Zawsze pytaj użytkownika osobno
- DROP TABLE = to samo
- Lepiej: oznacz kolumnę jako deprecated / nieużywaną, usunąć później

---

## 6. Production — ZAKAZANE

> ⛔ **Te komendy są ZABRONIONE dla agentów.** Wynikają z `SYSTEM_ARCHITECTURE.md §11` (R-PROD).

| Komenda | Ryzyko |
|---------|--------|
| `supabase db push` | Modyfikuje HOSTED database — utrata danych, przerwanie działania |
| `pnpm supabase:push` | To samo co wyżej |
| `supabase link --project-ref` | Linkuje do produkcji — potem `db push` może zrobić szkody |
| `netlify deploy --prod` | Deploy na produkcję |
| Edycja `.env.production` | Zmiana konfiguracji produkcyjnej |
| Użycie LIVE Stripe keys | Prawdziwe transakcje, obciążenia kart |

**Jeśli zadanie wymaga którejś z tych akcji → STOP. Powiedz użytkownikowi co trzeba zrobić i poproś o ręczne wykonanie.**

---

## 7. Seed Data

Plik: `supabase/seed.sql`

**Zawartość:**
- Przykładowe templaty (`public.templates`) — 5 domyślnych szablonów (4-3-3 Attack, Counter Attack, Set Piece - Corner, Rondo 4v2, High Press Trigger)
- Testowe dane do lokalnego developmentu

**Zasady:**
- `supabase db reset` automatycznie uruchamia `seed.sql`
- Przy zmianie schematu może być potrzeba aktualizacji seed
- Seed nie zawiera użytkowników — twórz ich przez Auth Studio (`http://127.0.0.1:54323`)
- Jeśli migracja dodaje kolumnę do istniejącej tabeli — uzupełnij seed o wartości dla tej kolumny

---

## 8. Schema Inspection (for agents)

Bezpieczne komendy do sprawdzenia stanu bazy:

```bash
# Podgląd tabel
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "\dt public.*"

# Opis tabeli
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "\d public.projects"

# Lista wszystkich migracji
ls supabase/migrations/

# Status migracji (które zastosowane)
supabase db status

# Wygeneruj diff między lokalną bazą a migracjami
pnpm supabase:diff
```

**UWAGA:** `psql` działa tylko gdy `supabase start` jest uruchomione.

---

## 9. RLS Rules

Każda nowa tabela MUSI mieć włączone Row Level Security.

**Wzór (z istniejących migracji):**
```sql
-- Enable RLS
ALTER TABLE public.nazwa_tabeli ENABLE ROW LEVEL SECURITY;

-- Polityka: tylko właściciel widzi swoje wiersze
CREATE POLICY "Users can manage their own records"
  ON public.nazwa_tabeli
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Polityka: odczyt dla publicznych danych (jeśli dotyczy)
CREATE POLICY "Anyone can read public data"
  ON public.nazwa_tabeli
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);
```

**Zasady RLS:**
- `FOR ALL` = SELECT, INSERT, UPDATE, DELETE
- `TO authenticated` = tylko zalogowani
- `TO anon` = niezalogowani
- `TO anon, authenticated` = wszyscy
- Zawsze sprawdzaj `user_id = auth.uid()` chyba że dane są celowo publiczne

---

## 10. Error Recovery

| Problem | Rozwiązanie |
|---------|-------------|
| `supabase db reset` nie działa | Sprawdź czy `supabase start` jest uruchomione. Spróbuj `supabase stop` → `supabase start` → `supabase db reset` |
| Migracja z błędem składni | `supabase db reset` cofnie wszystkie migracje. Popraw plik SQL i uruchom ponownie |
| Konflikt timestampu | Użyj późniejszego timestampu. Nie modyfikuj istniejących migracji |
| Seed nie działa po zmianie schematu | Zaktualizuj `supabase/seed.sql` — dodaj brakujące kolumny |
| Baza w złym stanie | `supabase db reset` = całkowity reset. Uważaj — usuwa wszystkie dane |

---

## 11. Agent Quick Reference (Cheatsheet)

**Gdy potrzebujesz zmienić bazę:**

```
1. Utwórz plik:  supabase/migrations/YYYYMMDDHHMMSS_opis.sql
   Użyj szablonu z sekcji 3 (z IF NOT EXISTS, indeksami, RLS)

2. Raportuj ryzyko i ZAPYTAJ UŻYTKOWNIKA O ZGODĘ

3. Po zgodzie:  supabase db reset

4. Zweryfikuj:  dane w seed.sql, aplikacja działa

5. NIGDY:      supabase db push (to na produkcję — tylko user)
```