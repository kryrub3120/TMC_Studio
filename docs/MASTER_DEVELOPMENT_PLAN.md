# 🚀 TMC Studio - Master Development Plan

**Wersja:** 2.0  
**Data:** 2026-01-08  
**Status:** Aktywny rozwój z integracją Supabase

---

## 📊 Obecny Stan Projektu

### ✅ Ukończone Sprinty (v0.4)

| Sprint | Nazwa | Status |
|--------|-------|--------|
| S1 | MVP Core | ✅ 100% |
| S2 | Animation System | ✅ 100% |
| S3 | Pro Features | ✅ 100% |
| S4 | Export & Customization | ✅ 100% |

### 🔄 W trakcie (v0.5)

| Sprint | Nazwa | Status |
|--------|-------|--------|
| S5 | Quality & UX | 🔄 60% |

### 📁 Struktura Monorepo

```
TMC Studio/
├── apps/
│   └── web/                 # React + Vite aplikacja
├── packages/
│   ├── core/               # Typy, serializacja, logika
│   ├── board/              # Komponenty Konva canvas
│   ├── ui/                 # UI komponenty (TopBar, Inspector)
│   └── presets/            # Formacje, szablony
├── docs/                   # Dokumentacja
├── tasks/                  # Zadania rozwojowe
└── supabase/               # 🆕 Konfiguracja Supabase
```

---

## 🗄️ Integracja Supabase

### Credentials

```
Project URL: https://pgacjczecyfnwsaadyvj.supabase.co
Anon Key: sb_publishable_SAUMCKnlRg70wb1Ig-x0ng_CjHleGc5
```

### Schemat Bazy Danych

#### Tabele

```sql
-- 1. Users (rozszerzenie auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free', -- free, pro, team
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects (dokumenty tablicy)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Board',
  description TEXT,
  document JSONB NOT NULL, -- BoardDocument
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Project shares (współdzielenie)
CREATE TABLE public.project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  permission TEXT DEFAULT 'view', -- view, edit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Templates (szablony publiczne)
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT, -- attack, defense, set-piece, training
  document JSONB NOT NULL,
  thumbnail_url TEXT,
  author_id UUID REFERENCES public.profiles(id),
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX idx_templates_category ON public.templates(category);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Profiles: tylko właściciel może czytać/edytować swój profil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Projects: właściciel lub persons z share
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create own projects"
  ON public.projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (user_id = auth.uid());
```

---

## 🛠️ Konfiguracja Środowiska

### 1. Instalacja Supabase CLI

```bash
# macOS (Homebrew)
brew install supabase/tap/supabase

# Lub npm
npm install -g supabase
```

### 2. Struktura Plików

```
TMC Studio/
├── .env.local                    # Lokalne zmienne (nie commitować)
├── .env.example                  # Przykładowe zmienne
├── supabase/
│   ├── config.toml              # Konfiguracja projektu Supabase
│   ├── migrations/              # Migracje SQL
│   │   ├── 20260108000000_initial_schema.sql
│   │   └── 20260108000001_rls_policies.sql
│   ├── seed.sql                 # Dane testowe
│   └── functions/               # Edge Functions (future)
├── apps/web/
│   ├── .env.local               # Supabase URL + anon key
│   └── src/
│       └── lib/
│           └── supabase.ts      # Klient Supabase
```

### 3. Zmienne Środowiskowe

```bash
# apps/web/.env.local
VITE_SUPABASE_URL=https://pgacjczecyfnwsaadyvj.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SAUMCKnlRg70wb1Ig-x0ng_CjHleGc5
```

---

## 📋 Plan Rozwoju - Fazy

### Faza 1: Fundament Backend (Tydzień 1-2)

#### 1.1 Setup Supabase
- [x] Utworzenie projektu Supabase
- [ ] Inicjalizacja Supabase CLI w projekcie
- [ ] Utworzenie schematu bazy danych
- [ ] Konfiguracja RLS policies
- [ ] Setup auth (email/password + OAuth Google)

#### 1.2 Integracja Frontend
- [ ] Instalacja @supabase/supabase-js
- [ ] Klient Supabase w `apps/web/src/lib/supabase.ts`
- [ ] Auth context/provider
- [ ] Protected routes
- [ ] User profile w TopBar

#### 1.3 Cloud Save
- [ ] Migracja z localStorage na Supabase
- [ ] Auto-sync projektu
- [ ] Conflict resolution (last-write-wins)
- [ ] Offline mode z sync przy połączeniu

### Faza 2: System Użytkowników (Tydzień 3-4)

#### 2.1 Auth Flow
- [ ] Sign Up (email + password)
- [ ] Sign In
- [ ] Password reset
- [ ] OAuth (Google)
- [ ] Session management

#### 2.2 Profile
- [ ] Widok ustawień użytkownika
- [ ] Avatar upload (Supabase Storage)
- [ ] Zmiana hasła

#### 2.3 Projects Dashboard
- [ ] Lista projektów użytkownika
- [ ] Tworzenie nowego projektu
- [ ] Usuwanie projektu
- [ ] Search i filtrowanie
- [ ] Grid/List view

### Faza 3: Współdzielenie (Tydzień 5-6)

#### 3.1 Sharing
- [ ] Generowanie share link
- [ ] View-only vs Edit mode
- [ ] Invite by email

#### 3.2 Public Projects
- [ ] Oznaczanie jako publiczny
- [ ] Embed code
- [ ] Social sharing

### Faza 4: Monetyzacja (Tydzień 7-8)

#### 4.1 Stripe Integration
- [ ] Stripe Checkout
- [ ] Webhook handling
- [ ] Subscription management
- [ ] Invoice history

#### 4.2 Feature Gating
- [ ] Free tier limits (5 projects, no GIF export)
- [ ] Pro tier ($9/mo)
- [ ] Team tier ($29/mo)

### Faza 5: Polish & Launch (Tydzień 9-10)

#### 5.1 Testing
- [ ] Unit tests (Vitest)
- [ ] E2E tests (Playwright)
- [ ] Performance testing

#### 5.2 Production
- [ ] Vercel deployment
- [ ] Custom domain
- [ ] SSL certificate
- [ ] CDN dla assets

#### 5.3 Launch
- [ ] Landing page
- [ ] Documentation
- [ ] Product Hunt launch
- [ ] Analytics (Mixpanel)

---

## 🔧 Workflow Pracy z Cline AI

### Komendy Szybkiego Dostępu

```bash
# Development
pnpm dev                # Start local server
pnpm build              # Production build
pnpm typecheck          # TypeScript check
pnpm lint               # ESLint

# Supabase
supabase start          # Local Supabase (Docker)
supabase db push        # Push migrations to remote
supabase db reset       # Reset local DB
supabase gen types      # Generate TypeScript types

# Git workflow
git status              # Check changes
git add .               # Stage all
git commit -m "msg"     # Commit
git push               # Push to remote
```

### Struktura Tasków dla Cline

Używaj formatu w `/tasks/NEXT_TASK.md`:

```markdown
# [Nazwa Tasku]

## Goal
Krótki opis celu

## Files to Modify
- path/to/file1.ts
- path/to/file2.tsx

## Steps
1. Step 1
2. Step 2
3. Step 3

## Commands
```bash
pnpm dev
```

## Acceptance Criteria
- [ ] Kryterium 1
- [ ] Kryterium 2
```

### Best Practices dla Cline

1. **Małe, atomowe zmiany** - jeden task = jedna funkcjonalność
2. **Testuj po każdej zmianie** - `pnpm typecheck && pnpm build`
3. **Commituj często** - lepiej więcej małych commitów
4. **Aktualizuj dokumentację** - README, ROADMAP, CHANGELOG
5. **Używaj task_progress** - trackuj postęp w parametrze

---

## 📅 Timeline (10 tygodni do v1.0)

```
Tydzień 1-2:  [█████░░░░░] Setup Supabase + Basic Auth
Tydzień 3-4:  [░░░░░░░░░░] User System + Projects
Tydzień 5-6:  [░░░░░░░░░░] Sharing + Collaboration
Tydzień 7-8:  [░░░░░░░░░░] Stripe + Subscriptions
Tydzień 9-10: [░░░░░░░░░░] Testing + Launch
```

### Milestones

| Data | Milestone | Wersja |
|------|-----------|--------|
| 15.01.2026 | Auth + Cloud Save | v0.6 |
| 01.02.2026 | Projects Dashboard | v0.7 |
| 15.02.2026 | Sharing | v0.8 |
| 01.03.2026 | Payments | v0.9 |
| 15.03.2026 | **Public Launch** | v1.0 |

---

## 🔗 Przydatne Linki

- **Supabase Dashboard:** https://supabase.com/dashboard/project/pgacjczecyfnwsaadyvj
- **Supabase Docs:** https://supabase.com/docs
- **Stripe Dashboard:** (do utworzenia)
- **Vercel Dashboard:** (do utworzenia)
- **GitHub Repo:** https://github.com/kryrub3120/TMC_Studio.git

---

## 📝 Changelog

### 2026-01-08
- Utworzono Master Development Plan
- Zdefiniowano schemat bazy danych
- Zaplanowano 5 faz rozwoju
- Skonfigurowano workflow Cline AI

---

*Następny task: [Supabase CLI Setup](/tasks/NEXT_TASK.md)*
