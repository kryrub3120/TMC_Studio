# TMC Studio - Documentation Index

Ten katalog zawiera aktywne dokumenty potrzebne do prowadzenia prac nad produktem. Historyczne PR-y, stare plany, checklisty, audyty i snapshoty sa w `docs/archive/` oraz `tasks/archive/`.

---

## Source of Truth

Czytaj w tej kolejnosci:

1. `docs/CURRENT_SPRINT_PLAN.md` - krotki wskaznik aktualnego sprintu i ostatnie decyzje.
2. `tasks/NEXT_TASK.md` - najblizsze zadanie wykonawcze.
3. `docs/FEATURE_SPEC.md` - aktualne zachowanie funkcji, w tym presety boiska.
4. `docs/AUTH_FLOW.md` - mechanizm logowania Google OAuth (same-tab redirect + PKCE).
5. `docs/WEB_LAUNCH_CHECKLIST.md` - checklista web launchu (routing, env, pre-launch verification).
6. `docs/SYSTEM_ARCHITECTURE.md` - architektura i granice warstw.
7. `docs/ENTITLEMENTS.md` - plany, limity, gating.
8. `docs/SITE_ARCHITECTURE.md`, `docs/WEBSITE_LAUNCH_PLAN.md`, `docs/STRIPE_TAX_SETUP.md` - marketing, legal, billing.
9. `docs/ERROR_MONITORING.md` - konfiguracja raportowania bledow produkcyjnych.
10. `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md` - historyczny snapshot audytu; aktualne decyzje sa w dokumentach powyzej.

Jesli dokument w archiwum mowi cos sprzecznego z powyzszymi plikami, wygrywa aktualny source of truth.

---

## Active Planning

| Dokument | Rola |
|---|---|
| `AUDYT_KOMPLEKSOWY_2026-06-18.md` | Historyczny snapshot audytu i pierwotnego planu launchu |
| `CURRENT_SPRINT_PLAN.md` | Aktualny sprint i kolejnosc prac |
| `tasks/NEXT_TASK.md` | Najblizsze zadanie operacyjne |
| `AUTH_FLOW.md` | Mechanizm logowania Google OAuth (same-tab redirect + PKCE) |
| `WEB_LAUNCH_CHECKLIST.md` | Checklista web launchu: routing, env, pre-launch verification |
| `FEATURE_SPEC.md` | Kanoniczna specyfikacja zachowania produktu; aktywne boiska: full / half / penalty-area |
| `ANALYTICS_AND_QA_GATE.md` | Pomocniczy gate analityki i QA |

---

## Agent System

| Dokument | Rola |
|---|---|
| `AGENT_ORCHESTRATION.md` | Jak uzywac `Delivery` i `MasterAutopilot` |
| `.github/copilot-instructions.md` | Zasady techniczne i workflow |
| `.github/agents/` | Definicje agentow |
| `.github/skills/` | Skille uzywane przez MasterAutopilot |
| `.github/skills/tmc-growth/` | Kontrolowany workflow SEO, contentu i analityki wzrostu |
| `docs/GROWTH_ENGINE.md` | Aktualny klaster growth, lejek, eksperyment i bramka publikacji |

---

## Product And Architecture

| Dokument | Rola |
|---|---|
| `PRODUCT_PHILOSOPHY.md` | Filozofia produktu |
| `FEATURE_SPEC.md` | Spec funkcjonalna |
| `ARCHITECTURE_OVERVIEW.md` | Ogolny obraz architektury |
| `SYSTEM_ARCHITECTURE.md` | Infrastruktura, backend, deployment |
| `DATA_MODEL.md` | Model danych |
| `VERSIONING.md` | Polityka wersjonowania |
| `ENTITLEMENTS.md` | Uprawnienia, plany, gating |

---

## Website, Legal, Billing

| Dokument | Rola |
|---|---|
| `SITE_ARCHITECTURE.md` | Mapa stron i zgodnosc UE |
| `WEBSITE_LAUNCH_PLAN.md` | Pozycjonowanie i blueprint strony |
| `STRIPE_TAX_SETUP.md` | Stripe Tax / VAT |
| `ERROR_MONITORING.md` | Sentry error monitoring i zmienne produkcyjne |
| `EU_COMPLIANCE_CHECKLIST.md` | Checklist compliance |
| `SEO_PERFORMANCE_NOTES.md` | Notatki SEO/performance |

---

## Engineering Rules

| Dokument | Rola |
|---|---|
| `IMPLEMENTATION_CONTRACTS.md` | Kontrakty implementacyjne |
| `DB_CONVENTIONS.md` | Reguly DB/Supabase |
| `DESIGN_SYSTEM.md` | Reguly UI i design systemu |
| `BRAND_ASSETS.md` | Logo, favicon, OG, social |
| `COMMANDS_MAP.md` | Mapa komend |
| `DRAG_DROP_PATTERN.md` | Wzorce drag/drop canvasu |
| `UX_PATTERNS.md` | Wzorce UX |

---

## Archive

Archiwum jest zachowane jako evidence i historia, ale nie jest aktywnym planem pracy.

| Folder | Zawartosc |
|---|---|
| `archive/planning/` | Stare plany, checklisty, beta docs |
| `archive/pr/` | Historyczne dokumenty PR |
| `archive/audits/` | Audyty i analizy |
| `archive/status/` | Statusy zakonczonych prac |
| `archive/features/` | Stare dokumenty funkcji |
| `archive/modules/` | Plany i statusy modulow |
| `archive/strategy/` | Roadmapy i strategie historyczne |
| `archive/inventory/` | Snapshoty inwentaryzacji |
| `tasks/archive/` | Historyczne taski |
