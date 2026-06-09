# ✅ TMC Studio — Agents Checklist

**Cel:** Listy kontrolne do odhaczenia PRZED każdym zadaniem UI i PRZED każdym zadaniem DB.
**Audience:** Wszystkie agenty (Implementer, Tester).

---

## 📋 Kiedy używać?

| Rodzaj zadania | Użyj checklisty |
|---------------|-----------------|
| Zmiana istniejącego komponentu UI | [UI Checklist A](#ui-checklist-a--przed-zmianą-komponentu) |
| Tworzenie nowego komponentu UI | [UI Checklist B](#ui-checklist-b--przed-tworzeniem-nowego-komponentu) |
| Zmiana schematu bazy danych | [DB Checklist](#db-checklist--przed-zmianą-schematu) |
| Dodanie/wyłączenie funkcji | Obie + [copilot-instructions.md](/.github/copilot-instructions.md) |

---

## UI Checklist A — Przed zmianą komponentu

### 1. Czy ten komponent już istnieje?
- [ ] Przeszukaj `packages/ui/src/` — czy jest już komponent który robi to samo?
- [ ] Sprawdź `docs/DESIGN_SYSTEM.md` §10 (Component Library)
- [ ] Jeśli istnieje → **nie twórz nowego, rozszerz istniejący**

### 2. Czy ten komponent jest legacy?
- [ ] Sprawdź `docs/DESIGN_SYSTEM.md` §16 (Adoption Status)
- [ ] Jeśli tak → **nie modyfikuj bez osobnego zadania**
- [ ] Jeśli mimo to musisz → użyj NOWYCH klas tokenów, NIE naśladuj starych

### 3. Jakie klasy CSS użyć?
- [ ] Zawsze klasy Tailwind: `bg-surface`, `text-muted`, `border-border`
- [ ] **Nigdy** hardcoded hexów: `bg-gray-xxx`, `text-blue-xxx`, `bg-blue-xxx`
- [ ] Nigdy inline styles (`style={{}}`)
- [ ] Sprawdź `docs/DESIGN_SYSTEM.md` §2 (kolory), §3 (fonty), §4 (spacing), §5 (radius)
- [ ] Użyj istniejących klas z §13 (`.input-field`, `.card`, `.icon-button`, `.kbd`) jeśli pasują

### 4. Czy mogę użyć tokenów z-index?
- [ ] Sprawdź `docs/DESIGN_SYSTEM.md` §7 — użyj `z-modal`, `z-toast`, `z-canvas` itp.
- [ ] **Nigdy** `z-10`, `z-50`, `z-[999]` — zawsze przez token

### 5. Animacje
- [ ] Sprawdź `docs/DESIGN_SYSTEM.md` §9 — użyj istniejących animacji jeśli pasują
- [ ] Do hover/transition: `duration-fast`(150ms), `duration-normal`(200ms)
- [ ] Nigdy nie twórz nowych `@keyframes` bez uzasadnienia

### 6. Dark mode
- [ ] Wszystkie kolory przez tokeny → dark mode działa automatycznie
- [ ] Jeśli potrzebujesz dark-specific style → klasa `.dark` w `tokens.css`
- [ ] **Nigdy** nie hardcoduj kolorów "dla darka"

### 7. Dostępność
- [ ] `aria-label` na interaktywnych elementach bez tekstu
- [ ] `role` właściwy (dialog, menu, button, alertdialog)
- [ ] Focus visible: domyślnie `focus:ring-2 focus:ring-offset-2`
- [ ] Kontrast tekstu minimum 4.5:1

### 8. Mobile-first
- [ ] Projektuj od małych ekranów
- [ ] Użyj breakpointów: `sm:`(640px), `md:`(768px), `lg:`(1024px), `xl:`(1280px)
- [ ] Responsywny drawer/inspector: wzór z RightInspector (PR-UX3)

---

## UI Checklist B — Przed tworzeniem nowego komponentu

### 1. Czy potrzebujesz ikony?
- [ ] **Nie dodawaj biblioteki ikon bez zgody** (R-MVP)
- [ ] Jeśli potrzebujesz → stwórz inline SVG wzorując się na `TopBar.tsx`
- [ ] Wzór: `const Icon: React.FC<{ className?: string }> = (...) => <svg className={className} ...>`
- [ ] Domyślny rozmiar: `w-4 h-4`
- [ ] Dla outline: `fill="none" stroke="currentColor" strokeWidth="2"`
- [ ] Dla filled: `fill="currentColor"`

### 2. Czy potrzebujesz koloru który nie istnieje?
- [ ] Sprawdź `docs/DESIGN_SYSTEM.md` §2 — czy to kolor zespołu (Team Colors)?
- [ ] Sprawdź §2.3 — czy to kolor z Drawing Palette (SHARED_COLORS)?
- [ ] Jeśli potrzebujesz zupełnie nowego koloru → **zgłoś do autora projektu**, nie dodawaj sam

### 3. Czy używasz właściwych klas dla typografii?
- [ ] `text-xs` (0.75rem) — etykiety, badge
- [ ] `text-sm` (0.8125rem) — body, opisy
- [ ] `text-base` (0.875rem) — domyślny
- [ ] `text-lg` (1rem) — nagłówki sekcji
- [ ] `text-xl` (1.125rem) — duże nagłówki
- [ ] `font-mono` — dla kodów, koordynatów, liczb

### 4. Nowy komponent w bibliotece?
- [ ] Dodaj go w `packages/ui/src/NazwaKomponentu.tsx`
- [ ] Eksport w `packages/ui/src/index.ts`
- [ ] Zaktualizuj `docs/DESIGN_SYSTEM.md` §10
- [ ] Zaktualizuj `docs/INDEX.md` jeśli to główny komponent

---

## DB Checklist — Przed zmianą schematu

### 1. Czy to zadanie faktycznie wymaga zmiany bazy?
- [ ] Sprawdź czy nie da się zrobić na froncie (localStorage, Zustand, obliczenia)
- [ ] Jeśli tak → kontynuuj

### 2. Stwórz plik migracji
- [ ] Nazwa: `supabase/migrations/YYYYMMDDHHMMSS_opis.sql` — format z `docs/DB_CONVENTIONS.md` §2
- [ ] Użyj szablonu z §3
- [ ] Dodaj `IF NOT EXISTS` / `OR REPLACE` (idempotentność)
- [ ] Dodaj indeksy (§5 R4)
- [ ] Jeśli nowa tabela → RLS (§9)

### 3. ZRAPORTUJ I POPROŚ O ZGODĘ
- [ ] Użyj `vscode_askQuestions` lub opisz w wiadomości
- [ ] Opisz co migracja zmienia
- [ ] Oszacuj ryzyko (LOCK TABLE? utrata danych? dużo wierszy?)
- [ ] **Nie wykonuj dopóki user nie powie "tak"**

### 4. Testuj lokalnie
- [ ] `supabase db reset` (jeśli supabase już uruchomione)
- [ ] Jeśli `supabase start` nie działa → uruchom `supabase start` najpierw
- [ ] Sprawdź czy seed.sql działa po migracji
- [ ] Jeśli seed nie działa → zaktualizuj `supabase/seed.sql`
- [ ] Sprawdź czy aplikacja (`pnpm dev`) działa

### 5. NIGDY
- [ ] NIE `supabase db push` — to produkcja (tylko user)
- [ ] NIE `pnpm supabase:push` — to produkcja (tylko user)
- [ ] NIE `supabase link` do hosted
- [ ] NIE edytuj `.env.production`
- [ ] NIE używaj LIVE Stripe keys

### 6. Po sukcesie
- [ ] Zaktualizuj `docs/DATA_MODEL.md` jeśli tabela/kolumna jest znacząca
- [ ] Zapisz thoughts w `thoughts/`

---

## Appendix: Quick Reference

| Dokument | Kiedy czytać |
|----------|-------------|
| `docs/DESIGN_SYSTEM.md` | Przed KAŻDĄ zmianą UI |
| `docs/DB_CONVENTIONS.md` | Przed KAŻDĄ zmianą schematu |
| `docs/SYSTEM_ARCHITECTURE.md` §11 | Zawsze — hard rules |
| `.github/copilot-instructions.md` | Zawsze — workflow agentów |
| `docs/DATA_MODEL.md` | Gdy zmieniasz struktury danych |
| `thoughts/` | Przed iteracją N>1 w trybie LOOP |