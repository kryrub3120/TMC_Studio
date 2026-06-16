# Delivery Evidence - H2 FAQ/Help Center Module
**Data:** 2026-06-15 22:45
**Iteracja:** 1

## Zadanie
Dodanie modułu FAQ / Help Center do HelpSidebar z rolami i wyszukiwarką.

## Co zaimplementowano

### Nowe pliki (4)
- `packages/ui/src/helpFaqData.ts` — 5 kategorii, 17 pytań, `getFaqForPlan()`, `searchFaq()`
- `packages/ui/src/FaqSearch.tsx` — wyszukiwarka z ikoną i clear
- `packages/ui/src/FaqCategory.tsx` — rozwijana kategoria z icon + count
- `packages/ui/src/FaqItem.tsx` — accordion z odpowiedzią + opcjonalne CTA

### Modyfikacje (6)
- `HelpSidebar.tsx` — dwie zakładki (Shortcuts / ❓ Help Center), FAQ section, `plan`, callbacki
- `locales/en/pl/es.ts` — wszystkie FAQ teksty
- `index.ts` — export FAQ komponentów + `getFaqForPlan/searchFaq`
- `BoardPage.tsx` — podpięcie callbacków FAQ CTA

### Decyzje implementacyjne
- FAQ jako osobna zakładka (nie sekcja na dole scrolla) — nie przeciąża UI
- `FaqCta` z `action` enum zamiast callback props — jeden handler `handleFaqCta` dispatchuje do odpowiednich callbacków
- `searchFaq()` działa na `questionKey`/`answerKey`/`id` — case-insensitive
- `visibleForPlans` filtr na kategoriach i pytaniach — elastyczne role-aware
- Plan default 'guest' (bezpieczny fallback gdy brak autoryzacji)

## Wynik
- [x] FAQ jako osobna zakładka w HelpSidebar
- [x] 5 kategorii, 17 pytań
- [x] Role-aware (Guest/Free/Pro/Team)
- [x] Wyszukiwarka z real-time filtrowaniem
- [x] CTA w odpowiedziach (Pricing, Team, Settings, Auth, Save)
- [x] i18n en/pl/es
- [x] TypeScript czysty (packages/ui + apps/web)

## Co dalej
- H3 (Club Premium Onboarding) — zależny od Epiku H
- H4 (Integracja + testy) — po H3