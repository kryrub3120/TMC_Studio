# 🎯 Plan przebudowy systemu pomocy i tutoriala

**Data:** 2026-06-15 (zaktualizowano 2026-06-18)
**Status:** H1 ✅ DONE, H2 ✅ DONE, Epik H (Team Setup) ✅ DONE, H3 ✅ DONE, **Coach Tour v2 ✅ DONE**
**Wersja doc:** 1.2.0
**Wersja implementacji:** Coach Tour v2 — jeden tutorial (9 kroków) dla wszystkich planów, ujawnianie realnych paneli
**Bazowany na:** `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md`, `docs/FEATURE_SPEC.md`, `docs/ENTITLEMENTS.md`, `docs/CURRENT_SPRINT_PLAN.md`, kodzie źródłowym. Historyczny plan bazowy: `docs/archive/planning/PLAN_BRAKUJACYCH_FUNKCJI_2026-06-10_SUPERSEDED.md`.

---

## 🔄 Aktualizacja 2026-06-18 — Coach Tour v2 (reveal-based)

Tutorial przeszedł przebudowę z modelu „etykieta na elemencie" na **ujawnianie realnego UI**. Kluczowe różnice względem v1:

- **Jeden tutorial dla wszystkich planów.** `getStepsForPlan()` zwraca te same 9 kroków niezależnie od planu (guest/free/pro/team). Wcześniejszy wariant „krok 9 tylko dla team" został usunięty.
- **Każdy krok otwiera prawdziwy element**, a `TutorialOverlay` mierzy go po otwarciu (callback `onStepShow` → `BoardPage.handleTutorialStepShow`):
  | Krok | Element ujawniany | Mechanizm |
  |------|-------------------|-----------|
  | 1 Zawodnicy | rozwijane menu „Zawodnicy" | prop `tutorialMenu='players'` → `PlayersMenu` |
  | 2 Strzałki | menu „Strzałki" | `tutorialMenu='arrows'` |
  | 3 Kierunek | Inspektor + zaznaczony zawodnik, sekcja „Zaawansowane" (orientacja/ramiona/stożek) | `selectElement` + `setInspectorOpen` |
  | 4 Sprzęt | menu „Sprzęt" | `tutorialMenu='equipment'` |
  | 5 Kadra | rozwinięta Ławka składu | `setSquadVisible(true)` |
  | 6 Animacja | dolny pasek animacji / oś kroków | `setBottomBarHeight` + flaga animacji |
  | 7 Zapis | szuflada Projektów | `onOpenProjectsDrawer` |
  | 8 Eksport | menu „Eksport" | `tutorialMenu='export'` |
  | 9 Ustawienia | pływający modal Ustawień | `onOpenSettingsModal` |
- **Spotlight celuje w panele**, nie w przyciski — panele menu/szuflada/modal mają własne `data-tour` (`players-menu`, `arrows-menu`, `equipment-menu`, `export-menu`, `projects-panel`, `settings-modal`). `--z-tutorial` podniesiony do 55, by karta i podświetlenie były nad pełnoekranowymi overlayami (z-50).
- **Krok 9 = „Zarządzaj swoimi ustawieniami"** (zamiast „Zarządzaj klubem"). `TEAM_STEP` → `SETTINGS_STEP`.
- **Finalny przycisk:** „Stwórz swoją pierwszą grafikę" (`tutorial.finish`).
- **Nawigacja ręczna** (←/→/Enter/Esc), bez auto-przewijania. Atrapy-demo w karcie tylko jako fallback bez realnego celu.
- **`ClubWelcomeModal` wyłączony** (auto-open) — był nieprzetłumaczony (`club.welcome.*`) i dublował tutorial; club/team przechodzą to samo jedno onboarding.

Pliki: `packages/ui/src/{TutorialOverlay,tutorialSteps,TopBar,ProjectsDrawer,SettingsModal,RightInspector}.tsx`, `theme/tokens.css`, `locales/*`; `apps/web/src/app/board/{BoardPage,BoardTopBarSection}.tsx`, `routes/useBoardPageState.ts`, `AppShell.tsx`.

---

## Executive Summary

Obecny system pomocy (Sprint E + F) jest w pełni funkcjonalny, ale **nie jest świadomy roli użytkownika**. 

**Problem:** Zarówno 6-krokowy Coach Tour, jak i Help Sidebar pokazują tę samą treść niezależnie od tego, czy użytkownik jest guestem, free, pro, czy członkiem Club Premium.

**Rozwiązanie:** Przebudowa na **role-aware help system**, który:
1. ✅ **H1 DONE** — Tutorial 8 kroków z role variants dla guest/free/pro/team
2. 🔲 **H2 PLAN** — FAQ/Help Center Module
3. 🔲 **H3 PLAN** — Club Premium Onboarding Flow
4. 🔲 **H4 PLAN** — Integracja + Testy + i18n

---

## Executive Summary

Obecny system pomocy (Sprint E + F) jest w pełni funkcjonalny, ale **nie jest świadomy roli użytkownika**. 

**Problem:** Zarówno 6-krokowy Coach Tour, jak i Help Sidebar pokazują tę samą treść niezależnie od tego, czy użytkownik jest guestem, free, pro, czy członkiem Club Premium.

**Rozwiązanie:** Przebudowa na **role-aware help system**, który:
1. Adaptuje tutorial do planu użytkownika
2. Pokazuje Club Adminom, gdzie zarządzać drużyną
3. Dodaje moduł FAQ/Help Center z kontekstowymi odpowiedziami
4. Integruje wszystkie elementy w spójne doświadczenie

---

## Audyt obecnego stanu

### ✅ Co już działa

| Komponent | Status | Lokalizacja |
|-----------|--------|-------------|
| `TutorialOverlay.tsx` | ✅ DZIAŁA | `packages/ui/src/` |
| `tutorialSteps.ts` | ✅ DZIAŁA | `packages/ui/src/` |
| `HelpSidebar.tsx` | ✅ DZIAŁA | `packages/ui/src/` |
| `helpSidebarData.ts` | ✅ DZIAŁA | `packages/ui/src/` |
| `FloatingHelpButton.tsx` | ✅ DZIAŁA | `packages/ui/src/` |
| i18n `tutorial.*` + `help.*` | ✅ DZIAŁA | `packages/ui/src/locales/` |
| `useUIStore.ts` tutorial/help state | ✅ DZIAŁA | `apps/web/src/store/` |

### ❌ Co brakuje

| Luka | Opis | Dotknięci użytkownicy |
|------|------|----------------------|
| **Role-aware tutorial** | 6 kroków pokazuje `[Pro]` na końcu, ale Club Admin nie widzi team features | WSZYSCY (różne role) |
| **Club Premium onboarding** | Osoba z Club Premium nie ma guide'a "jak dodać członków drużyny" | Club Admin / Team Members |
| **FAQ/Help Center** | Brak modułu z najczęstszymi pytaniami | WSZYSCY |
| **Contextual help** | Pomoc nie zmienia się w zależności od tego, co user robi | WSZYSCY |
| **Pro feature highlight** | Free user nie widzi jasno "co traci" vs "co zyskuje" | Guest / Free |
| **Team management guide** | Po zakupie Club Premium brak wskazówek "co teraz" | Club Admin |

---

## Proponowane zmiany — podział na sprinty

| Sprint | Nazwa | Priorytet | Zależności | Czas |
|--------|-------|-----------|------------|------|
| **H1** | Role-aware Tutorial | 🟡 HIGH | Sprint F (istniejący) | 3-4h |
| **H2** | FAQ/Help Center Module | 🟡 HIGH | Sprint E (istniejący) | 4-6h |
| **H3** | Club Premium Onboarding Flow | 🔵 MEDIUM | Epik H (Premium Team Setup) | 3-5h |
| **H4** | Integracja + Testy + i18n | 🟡 HIGH | H1-H3 | 2-3h |

---

## Sprint H1 — Role-aware Tutorial ✅ DONE (2026-06-15)

### Cel
Coach Tour (6 → 8 kroków) dostosowuje się do planu użytkownika. Free user widzi CTA do Pro, Club Admin widzi team features (krok 9), Guest widzi CTA do rejestracji.

### Zakres zrealizowany

#### H1.1 — Nowa struktura 8 kroków (storytelling trenerski)

| # | Etap | Demo | Target | Skróty |
|---|------|------|--------|--------|
| 1 | 🏋️ Warm-up — Set up your players | `shortcuts` | `[data-tour="shortcuts"]` | P, Shift+P, 1-6 |
| 2 | 🏃 Movement — Draw your tactics | `arrows` | `[data-tour="shortcuts"]` | A, R, S, Shift+N |
| 3 | 🧭 Direction — Show where players look | `orientation` | `[data-tour="orientation-panel"]` | [, ], V, O |
| 4 | 🏋️ Equipment — Build your drill | `equipment` | `[data-tour="equipment"]` | J, K, Y, U, Z, T |
| 5 | 📋 Squad — Your full roster at hand | `squad` | `[data-tour="squad"]` | Drag & drop |
| 6 | ▶️ Animation — Bring your tactic to life | `steps` | `[data-tour="steps"]` | N, ←, →, Space, L |
| 7 | 💾 Save — Never lose your work | `save` | `[data-tour="shortcuts"]` | ⌘S, ⌘O |
| 8 | 📤 Share — Export and share | `export` | `[data-tour="export"]` | ⌘E, ⇧⌘G, ⇧⌘P, ? |
| 9* | 👥 Club — Manage your team (Club Admin only) | `team` | `[data-tour="team"]` | Team panel |

#### H1.2 — Role variants

| Plan | Zmiana |
|------|--------|
| **Guest** | Krok 7: CTA "Sign up free" zamiast cloud save. Krok 8: "Sign up free" |
| **Free** | Krok 5: limit 5 squad slots info. Krok 7: upgrade hint. Krok 8: "Upgrade to Pro" |
| **Pro** | Krok 8: "You have full export access — PNG, GIF, PDF" |
| **Team (Club Admin)** | Dodatkowy krok 9: Team Management |
| **Team Member** | Krok 8: "You have Club Premium — full access" |

#### H1.3 — Nowe demo komponenty

| Demo | Komponent | Opis |
|------|-----------|------|
| `arrows` | `ArrowsDemo` | 3 typy strzałek (pass/run/shoot) + auto-numbering |
| `squad` | `SquadDemo` | 3 przykładowych zawodników z nazwami + pusty slot |
| `steps` | `StepsDemo` | Oś czasu 3 kroków + playback controls (Space/N/L) |
| `save` | `SaveDemo` | ⌘S shortcut + lista projektów z statusem |
| `team` | `TeamDemo` | Panel team: admin + member + invite button |

#### H1.4 — Nowe data-tour targety

- `[data-tour="steps"]` — w `SmartBottomBar.tsx` (playback controls container)
- `[data-tour="squad"]` — w `SquadBench.tsx` (root div)
- `[data-tour="team"]` — w `RightInspector.tsx` (do dodania po Epiku H)

#### H1.5 — Pliki zmodyfikowane

| Plik | Zmiana |
|------|--------|
| `packages/ui/src/tutorialSteps.ts` | 8 kroków + rola variants + `getStepsForPlan()` + typ `Plan` |
| `packages/ui/src/TutorialOverlay.tsx` | Prop `plan`, 5 nowych dem, `getStepsForPlan()` zamiast `TUTORIAL_STEPS` |
| `packages/ui/src/locales/en.ts` | Nowe klucze (8 kroków, 5 nowych dem, role-aware) |
| `packages/ui/src/locales/pl.ts` | Nowe klucze PL |
| `packages/ui/src/locales/es.ts` | Nowe klucze ES |
| `packages/ui/src/index.ts` | Export `getStepsForPlan`, `Plan`, `TutorialStepContent` |
| `packages/ui/src/SmartBottomBar.tsx` | `data-tour="steps"` |
| `packages/ui/src/SquadBench.tsx` | `data-tour="squad"` |
| `apps/web/src/app/routes/useBoardPageState.ts` | `plan` z `useEntitlements()` |
| `apps/web/src/app/board/BoardPage.tsx` | `plan={state.plan}` do TutorialOverlay |
| **Pro** | Krok 6 → "You're on Pro! Try advanced features" (pomijamy upselling) |
| **Team/Club Admin** | Dodatkowy krok 7: "Manage your team — add members, control access" |
| **Team Member** | Krok 6 → "You have Club Premium access — enjoy unlimited features" |

#### H1.2 — Nowy krok 7: Team Management (dla Club Admin)

| Właściwość | Wartość |
|-------------|---------|
| Eyebrow | "Your team, your control" |
| Title | "Add members to your Club" |
| Description | "Open the Team panel in Inspector to invite coaches and staff. You manage who has access." |
| Target | `[data-tour="team"]` w RightInspector |
| Demo | `team` (nowy komponent demo) |
| Keycaps | Team panel, Invite, Manage |
| CTA | "Start building" |

#### H1.3 — Nowy `TeamDemo` komponent

W `TutorialOverlay.tsx` dodać `TeamDemo`:
- Mini panel team z listą 3 placeholderowych członków
- Przycisk "Invite member" + avatar + rola
- Animowany flow dodawania członka

#### H1.4 — Modyfikacja `TutorialOverlay.tsx`

- Przyjmuje nowy prop `plan?: Plan` (z `useEntitlements()`)
- Przy renderowaniu kroków: łączy bazowy step z `roleVariants[plan]`
- Dla team/clubAdmin: dodaje krok 7
- Przekazuje plan do `StepDemo` aby odpowiednio renderować dema

#### H1.5 — i18n (en.ts, pl.ts, es.ts)

Dodać nowe klucze:
```
tutorial.steps.7.*          — nowy krok team
tutorial.steps.1-6.variants.* — role-specific overrides
tutorial.demos.team         — team demo component
tutorial.roleLabel.{plan}   — "Tutorial for {plan} users"
```

### Poza zakresem H1
- Tutorial analytics (który plan, które kroki skipnięte) — osobny feature później
- Interaktywny tutorial (user musi wykonać akcję) — zbyt skomplikowane na MVP
- A/B testing różnych wariantów tutoriala

### Pliki do modyfikacji
- `packages/ui/src/tutorialSteps.ts` — rozszerzenie typów + rola variants
- `packages/ui/src/TutorialOverlay.tsx` — prop `plan`, warunkowe renderowanie, nowe dema
- `packages/ui/src/locales/en.ts` — nowe klucze i18n
- `packages/ui/src/locales/pl.ts` — nowe klucze i18n
- `packages/ui/src/locales/es.ts` — nowe klucze i18n
- `apps/web/src/app/board/BoardPage.tsx` — przekazanie `plan` do TutorialOverlay

### Kryteria akceptacji H1
- [ ] Guest: tutorial kończy się "Sign up for free"
- [ ] Free: tutorial kończy się "Upgrade to Pro"
- [ ] Pro: tutorial kończy się informacją o Pro features
- [ ] Club Admin: tutorial ma 7 kroków, ostatni o team management
- [ ] Team Member: tutorial pokazuje "You have Club Premium access"
- [ ] `roleVariants` nie psuje istniejących kroków (fallback do base)
- [ ] i18n: wszystkie nowe teksty w en/pl/es
- [ ] Test regresji: istniejący 6-krokowy tutorial działa dla guest

---

## Sprint H2 — FAQ / Help Center Module ✅ DONE (2026-06-15)

### Cel
Dodanie zakładki "Help Center" z najczęściej zadawanymi pytaniami w HelpSidebar. Wyszukiwarka, kategorie, rozwijane odpowiedzi, role-aware filtrowanie.

### Zakres zrealizowany

#### H2.1 — Nowe pliki

| Plik | Opis |
|------|------|
| `packages/ui/src/helpFaqData.ts` | 5 kategorii FAQ, 17 pytań, `getFaqForPlan()`, `searchFaq()` |
| `packages/ui/src/FaqSearch.tsx` | Pole wyszukiwania z ikoną + clear button |
| `packages/ui/src/FaqCategory.tsx` | Rozwijana kategoria z headerem + item count |
| `packages/ui/src/FaqItem.tsx` | Accordion pytanie/odpowiedź z opcjonalnym CTA |

#### H2.2 — Kategorie FAQ (5)

| Kategoria | Dla kogo | Ilość pytań |
|-----------|----------|-------------|
| 🚀 Getting Started | Guest, Free | 4 |
| ⭐ Pro Features | Free, Pro, Team | 4 |
| 👥 Club Premium | Team (Club Admin/Member) | 3 |
| 🔧 Troubleshooting | Wszyscy | 3 |
| ⚙️ Account & Billing | Wszyscy (per plan) | 3 |

#### H2.3 — Role-aware FAQ

- Kategorie i pytania filtrowane przez `visibleForPlans`
- Guest widzi: Getting Started + Troubleshooting + Account Billing (z CTA do rejestracji)
- Free widzi: Getting Started + Pro Features (z CTA do upgrade) + Troubleshooting + Account
- Pro widzi: Pro Features + Troubleshooting + Account
- Team widzi: Club Premium + Pro Features + Troubleshooting + Account

#### H2.4 — CTA w odpowiedziach

| Akcja | Cel |
|-------|-----|
| `pricing` | Otwiera PricingModal |
| `teamPanel` | Otwiera Team panel |
| `settings` | Otwiera Settings |
| `signup` | Otwiera AuthModal |
| `save` | Manual save |
| `export` | Otwiera export |

#### H2.5 — Integracja

- `HelpSidebar.tsx` ma teraz dwie zakładki: Shortcuts | ❓ Help Center
- Nowe callbacki: `onOpenPricing`, `onOpenTeamPanel`, `onOpenSettings`, `onOpenAuthModal`
- `BoardPage.tsx` przekazuje props z istniejących handlerów

#### H2.6 — Zmodyfikowane pliki

| Plik | Zmiana |
|------|--------|
| `packages/ui/src/helpFaqData.ts` | NOWY |
| `packages/ui/src/FaqSearch.tsx` | NOWY |
| `packages/ui/src/FaqCategory.tsx` | NOWY |
| `packages/ui/src/FaqItem.tsx` | NOWY |
| `packages/ui/src/HelpSidebar.tsx` | Zakładki (shortcuts/faq), FAQ section, `plan`, callbacki |
| `packages/ui/src/locales/en.ts` | `faq.*` — 17 pytań + odpowiedzi |
| `packages/ui/src/locales/pl.ts` | `faq.*` — PL |
| `packages/ui/src/locales/es.ts` | `faq.*` — ES |
| `packages/ui/src/index.ts` | Export FAQ komponentów |
| `apps/web/src/app/board/BoardPage.tsx` | `plan`, `onOpenPricing`, `onOpenSettings`, `onOpenAuthModal` |

#### H2.1 — Nowa sekcja FAQ w HelpSidebar

W `HelpSidebar.tsx` dodać 5. sekcję (między Tips a Save Status):

```
[Sekcja 5: FAQ / Help Center]
├── 🔍 Szukaj w pomocy...
├── 📁 Getting Started (Guest/Free)
│   ├── How do I add a player?
│   ├── How do I save my project?
│   └── What can I do for free?
├── 📁 Pro Features (Pro/Team)
│   ├── How do I export GIF/PDF?
│   ├── How do I create unlimited projects?
│   └── How do I manage my subscription?
├── 📁 Club Premium (Club Admin / Team)
│   ├── How do I add team members?
│   ├── How do I manage billing?
│   └── How do I remove a member?
├── 📁 Troubleshooting
│   ├── My project didn't save
│   ├── I can't see my changes
│   └── Export not working
└── 📁 Account & Billing
    ├── How do I change my plan?
    ├── How do I cancel my subscription?
    └── Can I switch from monthly to yearly?
```

#### H2.2 — Nowe komponenty

| Komponent | Opis | Lokalizacja |
|-----------|------|-------------|
| `HelpFaqSection.tsx` | Kontener FAQ z kategoriami i search | `packages/ui/src/` |
| `FaqCategory.tsx` | Rozwijana kategoria z pytaniami | `packages/ui/src/` |
| `FaqItem.tsx` | Pojedyncze pytanie z rozwijaną odpowiedzią | `packages/ui/src/` |
| `FaqSearch.tsx` | Wyszukiwarka z filtrowaniem | `packages/ui/src/` |

#### H2.3 — Dane FAQ

Nowy plik `helpFaqData.ts` w `packages/ui/src/`:

```typescript
interface FaqCategory {
  id: string;
  titleKey: string;  // i18n key
  icon: string;      // emoji
  /** Which plans see this category */
  visibleForPlans?: Plan[];
  items: FaqItem[];
}

interface FaqItem {
  id: string;
  questionKey: string;
  answerKey: string;
  /** Optional: link to CTA (e.g., Open PricingModal) */
  cta?: {
    labelKey: string;
    action: 'pricing' | 'teamPanel' | 'settings' | 'export' | 'save';
  };
  /** Optional: only show for certain plans */
  visibleForPlans?: Plan[];
}
```

#### H2.4 — Integracja z HelpSidebar

- Nowy przycisk w nagłówku HelpSidebar: "❓ Help" / "💬 FAQ" (toggle między shortcuts a FAQ)
- Lub: FAQ jako przewijana sekcja na dole sidebara
- **Decyzja:** FAQ jako osobna zakładka/toggle w sidebarze (nie przeciążać jednego scrolla)

#### H2.5 — FAQ role-aware

- Kategorie i pytania filtrowane per plan:
  - Guest: widzi "Getting Started", "Account & Billing" (sign up CTA)
  - Free: widzi "Getting Started", "Pro Features" (z CTA do Upgrade)
  - Pro: widzi "Pro Features", "Account & Billing", "Troubleshooting"
  - Club Admin: widzi WSZYSTKO + "Club Premium" (team management)
  - Team Member: widzi "Club Premium" (ograniczone do własnego dostępu)

#### H2.6 — i18n

Nowe klucze dla FAQ:
```
faq.title                  — "Help Center"
faq.search                 — "Search help…"
faq.noResults              — "No results found"
faq.categories.*           — nazwy kategorii
faq.items.*.question       — pytania
faq.items.*.answer         — odpowiedzi
faq.items.*.cta            — etykiety CTA
faq.showMore               — "Show {{count}} more questions"
faq.filteredByPlan         — "Showing answers for {{plan}} plan"
```

### Poza zakresem H2
- Artykuły pomocy zewnętrzne (link do docs) — osobny feature
- Video tutoriale — nie MVP
- Community forum — nie MVP

### Pliki do modyfikacji
- `packages/ui/src/HelpSidebar.tsx` — nowa zakładka FAQ
- `packages/ui/src/helpFaqData.ts` — NOWY plik z danymi FAQ
- `packages/ui/src/FaqSearch.tsx` — NOWY komponent
- `packages/ui/src/FaqCategory.tsx` — NOWY komponent
- `packages/ui/src/FaqItem.tsx` — NOWY komponent
- `packages/ui/src/locales/en.ts` — nowe klucze
- `packages/ui/src/locales/pl.ts` — nowe klucze
- `packages/ui/src/locales/es.ts` — nowe klucze
- `packages/ui/src/index.ts` — export nowych komponentów

### Kryteria akceptacji H2
- [ ] FAQ sekcja dostępna w HelpSidebar jako osobna zakładka
- [ ] Guest widzi pytania o rejestrację, free user o upgrade
- [ ] Club Admin widzi dodatkową kategorię "Club Premium"
- [ ] Wyszukiwarka filtruje pytania w czasie rzeczywistym
- [ ] Rozwijane odpowiedzi (accordion)
- [ ] CTA w odpowiedziach (np. "Otwórz Pricing" → PricingModal)
- [ ] i18n: wszystkie teksty w en/pl/es
- [ ] Brak regresji w istniejącym HelpSidebar

---

## Sprint H3 — Club Premium Onboarding Flow

### Cel
Po wykupieniu Club Premium użytkownik (Club Admin) dostaje **dedykowany onboarding** zamiast standardowego tutoriala. Pokazuje mu krok po kroku, jak skonfigurować drużynę i dodać członków.

**Zależność:** Wymaga gotowego Epiku H (Premium Team Setup) — tabel `teams`, `team_members`, `team_invites`, panelu Team w RightInspector.

### Zakres

#### H3.1 — Club Premium Welcome Flow

Gdy user pierwszy raz loguje się po zakupie Club Premium:

1. **Welcome modal** — "🎉 Welcome to Club Premium!" z krótkim overview
2. **Krok 1:** "Name your team" — inline form w modalu
3. **Krok 2:** "Invite your first member" — otwiera Team panel z pre-filled emailem
4. **Krok 3:** "You're all set!" — podsumowanie, link do Customer Portal

**Warunek pokazania:**
- `subscription_tier === 'team'` (Club Premium)
- `!hasSeenClubWelcome` (nowe pole w localStorage lub profiles)
- `team_members` count === 1 (tylko admin, nikt nie dodany)

#### H3.2 — Stan onboardingu

W `useUIStore.ts` dodać:
```
clubWelcomeSeen: boolean
setClubWelcomeSeen: (seen: boolean) => void
```

#### H3.3 — Komponenty

| Komponent | Opis | Lokalizacja |
|-----------|------|-------------|
| `ClubWelcomeModal.tsx` | Modal powitalny z krokami | `packages/ui/src/` |
| `ClubStepNameTeam.tsx` | Krok: nazwij drużynę | `packages/ui/src/` |
| `ClubStepInvite.tsx` | Krok: zaproś członka | `packages/ui/src/` |
| `ClubStepComplete.tsx` | Krok: gotowe | `packages/ui/src/` |

#### H3.4 — i18n

Nowe klucze:
```
club.welcome.title          — "Welcome to Club Premium!"
club.welcome.steps.*        — poszczególne kroki
club.welcome.nameTeam       — "Name your team"
club.welcome.inviteMember   — "Invite your first member"
club.welcome.complete       — "You're all set!"
club.welcome.skip           — "I'll do this later"
club.welcome.finish         — "Start coaching"
```

#### H3.5 — Club Premium badge w UI

Gdzie pokazać, że user ma Club Premium:
- W `UserMenu.tsx`: badge "Club Premium" zamiast "Pro"
- W `PricingModal.tsx`: Club Premium jako "Current plan" z info "You're on Club Premium"
- W `HelpSidebar.tsx`: informacja "You're Club Admin — manage your team"

### Poza zakresem H3
- Email powitalny po zakupie Club Premium — osobny feature
- Slack/Discord webhook powitalny — nie MVP
- Ankieta NPS po onboardingu — nie MVP

### Pliki do modyfikacji
- `packages/ui/src/ClubWelcomeModal.tsx` — NOWY
- `packages/ui/src/ClubStepNameTeam.tsx` — NOWY
- `packages/ui/src/ClubStepInvite.tsx` — NOWY
- `packages/ui/src/ClubStepComplete.tsx` — NOWY
- `packages/ui/src/UserMenu.tsx` — Club Premium badge
- `packages/ui/src/PricingModal.tsx` — Club Premium status
- `packages/ui/src/HelpSidebar.tsx` — Club Premium info
- `apps/web/src/store/useUIStore.ts` — clubWelcomeSeen
- `apps/web/src/App.tsx` — warunkowe renderowanie ClubWelcomeModal
- `packages/ui/src/locales/en.ts` — nowe klucze
- `packages/ui/src/locales/pl.ts` — nowe klucze
- `packages/ui/src/locales/es.ts` — nowe klucze

### Kryteria akceptacji H3
- [ ] Po pierwszym zalogowaniu z Club Premium → Welcome Modal
- [ ] Krok 1: nazwa drużyny zapisuje się do `teams.name`
- [ ] Krok 2: otwiera Team panel z polem email
- [ ] Krok 3: podsumowanie, przycisk "Start coaching"
- [ ] "I'll do this later" → welcome nie pokazuje się ponownie
- [ ] Badge "Club Premium" w UserMenu
- [ ] PricingModal pokazuje Club Premium jako aktualny plan
- [ ] i18n: wszystkie teksty w en/pl/es
- [ ] Brak regresji w istniejącym flow auth/subscription

---

## Sprint H4 — Integracja + Testy + i18n

### Cel
Integracja wszystkich trzech sprintów (H1-H3) + testy regresji + pełne pokrycie i18n.

### Zakres

#### H4.1 — Integracja w App.tsx / BoardPage.tsx

- `TutorialOverlay` dostaje `plan` z `useEntitlements()`
- `HelpSidebar` ma toggle między shortcuts a FAQ
- `ClubWelcomeModal` wyświetla się warunkowo (Club Premium + first time)
- Wszystkie komponenty współdzielą `useUIStore`

#### H4.2 — Testy

| Typ testu | Co testować | Pliki |
|-----------|-------------|-------|
| **Jednostkowe** | `tutorialSteps.ts` — roleVariants merge | `packages/ui/src/__tests__/tutorialSteps.test.ts` |
| **Jednostkowe** | `helpFaqData.ts` — filtrowanie per plan | `packages/ui/src/__tests__/helpFaqData.test.ts` |
| **Jednostkowe** | `FaqSearch.tsx` — filtrowanie | `packages/ui/src/__tests__/FaqSearch.test.tsx` |
| **Manual** | Coach Tour per plan (Guest/Free/Pro/Team) | — |
| **Manual** | FAQ per plan (Guest/Free/Pro/Team) | — |
| **Manual** | Club Premium Welcome Flow | — |
| **Manual** | Responsywność HelpSidebar + FAQ na mobile | — |

#### H4.3 — i18n pełne pokrycie

Weryfikacja:
- Wszystkie nowe klucze istnieją w `en.ts`, `pl.ts`, `es.ts`
- Żadne user-facing stringi nie są hardcoded
- `tutorial.steps.*.variants.*` dla każdego planu
- `faq.*` pytania i odpowiedzi dla każdej kategorii
- `club.welcome.*` dla Club Premium onboardingu

#### H4.4 — Regresje do sprawdzenia

- [ ] Istniejący 6-krokowy tutorial działa (Guest, bez zmian)
- [ ] HelpSidebar otwiera się i zamyka (FloatingHelpButton)
- [ ] Skróty w HelpSidebar są zgodne z `helpSidebarData.ts`
- [ ] ESC zamyka HelpSidebar
- [ ] Floating button znika w print mode
- [ ] `tutorialCompleted` persistuje w localStorage
- [ ] `replayTutorial()` działa z HelpSidebar
- [ ] i18n switch (en/pl/es) działa dla wszystkich nowych tekstów

### Ryzyka

| Ryzyko | Severity | Mitigation |
|--------|----------|------------|
| Tutorial staje się zbyt długi (7+ kroków) | 🟢 NISKIE | Role variants nie dodają kroków dla wszystkich, tylko dla Club Admin |
| FAQ przytłacza HelpSidebar | 🟠 ŚREDNIE | FAQ jako osobna zakładka z toggle, domyślnie shortcuts widoczne |
| Club Premium onboarding koliduje z existing tutorial | 🟠 ŚREDNIE | ClubWelcomeModal niezależny od TutorialOverlay — osobny stan |
| i18n pominięte w nowych komponentach | 🟢 NISKIE | Checklista w H4 to catchuje |
| Club Premium nie istnieje jeszcze w kodzie | 🔴 WYSOKIE | H3 blokowany przez Epik H — można zacząć H1 i H2 niezależnie |

---

## Proponowana kolejność

```
H1 (Role-aware Tutorial) ──────────────────────────┐
                                                    ├──→ H4 (Integracja)
H2 (FAQ Module) ───────────────────────────────────┘
                                                    │
H3 (Club Premium Onboarding) ─── (po Epiku H) ─────┘
```

- **H1 + H2:** Mogą być realizowane RÓWNOLEGLE (niezależne pliki)
- **H3:** Zależne od Epiku H (Premium Team Setup) — zacząć dopiero po H1 i H2
- **H4:** Po H1 + H2 (albo po wszystkich trzech, jeśli H3 gotowy)

### Minimalny viable (jeśli limit czasu)

Jeśli trzeba wybrać priorytety:
1. **H1** (Role-aware Tutorial) — największy impact, mała zmiana
2. **H2** (FAQ Module) — duża wartość, średnia zmiana
3. **H3** (Club Premium Onboarding) — tylko jeśli Club Premium już wdrożone

---

## Pliki do modyfikacji — pełna lista

### Nowe pliki
- `packages/ui/src/helpFaqData.ts`
- `packages/ui/src/FaqSearch.tsx`
- `packages/ui/src/FaqCategory.tsx`
- `packages/ui/src/FaqItem.tsx`
- `packages/ui/src/ClubWelcomeModal.tsx`
- `packages/ui/src/ClubStepNameTeam.tsx`
- `packages/ui/src/ClubStepInvite.tsx`
- `packages/ui/src/ClubStepComplete.tsx`
- `packages/ui/src/__tests__/tutorialSteps.test.ts` (opcjonalnie)
- `packages/ui/src/__tests__/helpFaqData.test.ts` (opcjonalnie)
- `packages/ui/src/__tests__/FaqSearch.test.tsx` (opcjonalnie)

### Modyfikowane pliki
- `packages/ui/src/tutorialSteps.ts`
- `packages/ui/src/TutorialOverlay.tsx`
- `packages/ui/src/HelpSidebar.tsx`
- `packages/ui/src/helpSidebarData.ts` (opcjonalnie rozszerzenie)
- `packages/ui/src/UserMenu.tsx`
- `packages/ui/src/PricingModal.tsx`
- `packages/ui/src/index.ts`
- `packages/ui/src/locales/en.ts`
- `packages/ui/src/locales/pl.ts`
- `packages/ui/src/locales/es.ts`
- `apps/web/src/store/useUIStore.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/app/board/BoardPage.tsx`

---

## Definicja Done (całość)

- [ ] Tutorial role-aware: Guest, Free, Pro, Team, Club Admin — każdy widzi odpowiednią treść
- [ ] FAQ/Help Center: wyszukiwarka, kategorie, rozwijane odpowiedzi, role-aware filtrowanie
- [ ] Club Premium onboarding: Welcome Modal z 3 krokami (nazwa teamu → invite → gotowe)
- [ ] Club Premium badge w UserMenu i PricingModal
- [ ] i18n: wszystkie nowe teksty w en/pl/es, zero hardcoded stringów
- [ ] Brak regresji w istniejącym TutorialOverlay, HelpSidebar, FloatingHelpButton
- [ ] Testy (jednostkowe + manualne) przechodzą
- [ ] `thoughts/` z evidence po każdym sprincie
