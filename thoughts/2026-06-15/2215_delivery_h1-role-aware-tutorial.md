# Delivery Evidence - H1 Role-aware Tutorial
**Data:** 2026-06-15 22:15
**Iteracja:** 1

## Zadanie
Przebudowa tutoriala (Sprint F) na role-aware 8-krokowy storytelling trenerski.

## Co zaimplementowano

### tutorialSteps.ts
- Nowa struktura 8 kroków z storytellingiem trenerskim (od rozgrzewki → ruch → kierunek → sprzęt → kadra → animacja → zapis → eksport)
- Typ `Plan = 'guest' | 'free' | 'pro' | 'team'` (lokalny, mirror z entitlements)
- `TutorialStepContent` interface dla role variants
- `roleVariants` na krokach 5, 7, 8 dla guest/free/pro/team
- `getStepForPlan()` — merge base step z variantem
- `getStepsForPlan()` — zwraca kroki + opcjonalny krok 9 (team) dla Club Admin
- `TEAM_STEP` — osobny krok 9 dla Club Admin

### TutorialOverlay.tsx
- Nowy prop `plan?: Plan` (default: 'guest')
- Używa `getStepsForPlan(plan)` zamiast TUTORIAL_STEPS
- 5 nowych dem: `ArrowsDemo`, `SquadDemo`, `StepsDemo`, `SaveDemo`, `TeamDemo`
- Usunięte nieużywane: `InspectorDemo`, `PremiumDemo`
- Wszystkie progress bary i step count używają `steps.length` (dynamiczne)

### i18n (en.ts, pl.ts, es.ts)
- 8 kroków + target + cta per język
- 5 nowych dem: arrows, squad, steps, save, team
- Nowe klucze: awayPlayer, formation, passArrow, runArrow, shootArrow itd.
- Update "restartTutorial" z "5-step" na "guided tour"

### data-tour targety
- `SmartBottomBar.tsx`: `data-tour="steps"` na playback container
- `SquadBench.tsx`: `data-tour="squad"` na root div

### Integracja
- `useBoardPageState.ts`: `plan` z `useEntitlements()`
- `BoardPage.tsx`: `plan={state.plan}` do TutorialOverlay
- `index.ts`: export `getStepsForPlan`, `Plan`, `TutorialStepContent`

## Decyzje implementacyjne
- Typ `Plan` zdefiniowany lokalnie w tutorialSteps (uniknięcie zależności apps/web → packages/ui)
- `getStepsForPlan()` zwraca nową tablicę przy każdym wywołaniu — stabilność przez `useMemo` w TutorialOverlay
- Team step (krok 9) dodawany tylko dla `plan === 'team'`
- roleVariants używają `Partial<...>` — nie trzeba nadpisywać wszystkich pól

## Zmienione pliki
- `packages/ui/src/tutorialSteps.ts` — CORE: nowa struktura
- `packages/ui/src/TutorialOverlay.tsx` — CORE: plan prop + nowe dema
- `packages/ui/src/locales/en.ts` — i18n
- `packages/ui/src/locales/pl.ts` — i18n
- `packages/ui/src/locales/es.ts` — i18n
- `packages/ui/src/index.ts` — exporty
- `packages/ui/src/SmartBottomBar.tsx` — data-tour
- `packages/ui/src/SquadBench.tsx` — data-tour
- `apps/web/src/app/routes/useBoardPageState.ts` — plan
- `apps/web/src/app/board/BoardPage.tsx` — plan prop
- `docs/HELP_SYSTEM_OVERHAUL_PLAN.md` — update statusu

## Wynik
H1 w pełni zaimplementowany:
- [x] 8 kroków storytelling trenerski
- [x] role variants dla guest/free/pro/team
- [x] Club Admin ma krok 9 (team management)
- [x] Nowe demo komponenty
- [x] i18n en/pl/es
- [x] TypeScript czysty (packages/ui + apps/web)
- [x] Brak regresji w istniejącym HelpSidebar/FloatingButton

## Co dalej
- H2 (FAQ/Help Center Module) — do rozpoczęcia po zatwierdzeniu
- H3 (Club Premium Onboarding) — zależny od Epiku H
- `[data-tour="team"]` w RightInspector — dodać gdy Team Panel istnieje