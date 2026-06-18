#!/usr/bin/env bash
# Rozbicie working tree na tematyczne commity — 2026-06-18 (branch: develop)
# Uruchom z katalogu repo:  bash tasks/commit_split_2026-06-18.sh
set -euo pipefail

# 0) Sprzątanie po sandboxie (osierocony lock + ewentualne staged) ---------
rm -f .git/index.lock
git reset -q   # wyczyść staging, zostaw zmiany w plikach

# C1 — chore(build): CI, zależności, turbo --------------------------------
git add .github/workflows/ci.yml package.json packages/core/package.json turbo.json pnpm-lock.yaml
git commit -m "chore(build): update CI, deps and turbo config" \
  -m "Konfiguracja CI/pnpm, bump zależności, cache turbo."

# C2 — feat(billing): pricing config + utwardzenie checkout/portal --------
git add apps/web/src/config/stripe.ts apps/web/src/pages/PricingPage.tsx packages/ui/src/PricingModal.tsx \
        netlify/functions/_stripeConfig.ts netlify/functions/create-checkout.ts netlify/functions/create-portal-session.ts
git commit -m "feat(billing): shared pricing config + checkout/portal hardening" \
  -m "Jedno źródło prawdy cen, propagacja cyklu monthly/yearly, allowlisty origin/URL, customer z auth."

# C3 — feat(tutorial): coach tour ujawnia realne elementy UI --------------
git add packages/ui/src/TutorialOverlay.tsx packages/ui/src/tutorialSteps.ts packages/ui/src/ProjectsDrawer.tsx \
        packages/ui/src/theme/tokens.css apps/web/src/app/board/BoardTopBarSection.tsx
git commit -m "feat(tutorial): coach tour reveals real UI elements" \
  -m "Kroki otwierają i podświetlają prawdziwe menu/panele; jeden tutorial dla wszystkich planów; fix pętli renderu."

# C4 — feat(pitch): pitch-first layout + refactor canvas  (ZWERYFIKUJ DIFFY)
git add packages/board/src/Pitch.tsx packages/board/src/BallNode.tsx packages/board/src/EquipmentNode.tsx \
        packages/board/src/TextNode.tsx apps/web/src/app/board/BoardCanvasSection.tsx \
        apps/web/src/app/board/canvas/CanvasAdapter.tsx apps/web/src/components/Canvas/BoardCanvas.tsx \
        apps/web/src/hooks/useCanvasEventsController.ts apps/web/src/store/slices/documentSlice.ts \
        apps/web/src/store/slices/groupsSlice.ts apps/web/src/store/slices/historySlice.ts \
        apps/web/src/store/types.ts apps/web/src/utils/canvasContextMenu.ts packages/ui/src/PitchPanel.tsx \
        apps/web/index.html apps/web/public/favicon.svg
git commit -m "feat(pitch): pitch-first layout and canvas refactor" \
  -m "UWAGA: zmiany spoza ostatniej sesji — zweryfikowane przed scaleniem."

# C5 — feat(editor): groty + grubość strzałek, obrys stref, defaulty -------
git add packages/core/src/types.ts packages/board/src/ArrowNode.tsx packages/board/src/ZoneNode.tsx \
        packages/board/src/PlayerNode.tsx packages/ui/src/RightInspector.tsx packages/ui/src/SettingsModal.tsx \
        packages/ui/src/index.ts apps/web/src/store/slices/elementsSlice.ts \
        apps/web/src/app/board/useBoardPageHandlers.ts apps/web/src/app/routes/useBoardPageState.ts \
        apps/web/src/app/orchestrators/ModalOrchestrator.tsx apps/web/src/app/board/canvas/CanvasElements.tsx \
        apps/web/src/components/Canvas/layers/ArrowsLayer.tsx apps/web/src/components/Canvas/layers/ZonesLayer.tsx \
        apps/web/src/components/Canvas/layers/PlayersLayer.tsx
git commit -m "feat(editor): arrow heads + thickness, zone borders, user style defaults" \
  -m "ArrowElement.startHead/endHead, ZoneElement.borderWidth/showCorners; ArrowDefaults/ZoneDefaults." \
  -m "Akcje store updateArrowStyle/updateZoneStyle, routing w handlerze, mapowanie w inspectorElement," \
  -m "render grotów/obrysu (obrys jako osobny kryjący kształt), 'Ustaw jako domyślne' + edytor w Preferencjach," \
  -m "fix etykiety zawodnika (realny pomiar tekstu zamiast heurystyki)."

# C6 — feat(editor): układ ławki/paska animacji + inspektor ----------------
git add packages/ui/src/SquadBench.tsx packages/ui/src/SmartBottomBar.tsx apps/web/src/app/board/BoardPage.tsx
git commit -m "feat(editor): squad bench + bottom bar layout, inspector polish" \
  -m "Ławka jako poziomy pasek (przełącznik z boku), pasek animacji in-flow + ukrywanie," \
  -m "min-h-0 (fix przelewania/dublowania widoku), domyślna szerokość inspektora 340px, kondensacja sekcji strzałki."

# C7 — fix(i18n): helper + brakujące klucze + stringi funkcji --------------
git add packages/ui/src/locales/en.ts packages/ui/src/locales/pl.ts packages/ui/src/locales/es.ts \
        packages/ui/src/HelpSidebar.tsx packages/ui/src/CheatSheetOverlay.tsx packages/ui/src/helpSidebarData.ts \
        packages/ui/src/CommandPaletteModal.tsx
git commit -m "fix(i18n): translate helper + add 14 missing keys (pl/en/es)" \
  -m "Tłumaczenie skrótów w helperze, brakujące klucze (topbar.pitch itd.), klucze grotów/stref/defaultów, kontrast."

# C8 — chore(app): wspólne wiring huby (mieszane) --------------------------
git add apps/web/src/app/AppShell.tsx packages/ui/src/TopBar.tsx apps/web/src/store/useUIStore.ts \
        apps/web/src/hooks/useKeyboardShortcuts.ts apps/web/src/commands/commandPalette/createCommandActions.ts \
        apps/web/src/store/useAuthStore.ts
git commit -m "chore(app): shared wiring (AppShell, TopBar, stores, shortcuts)" \
  -m "Pliki dotykane przez wiele funkcji (edytor + tutorial + billing). W razie potrzeby rozdziel hunki (git add -p)."

# C9 — docs: changelog, plany, status, porządki ---------------------------
git rm -q docs/DOCUMENTATION_CLEANUP_PLAN.md docs/PLAN_BRAKUJACYCH_FUNKCJI.md \
          docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md tasks/WEBSITE_LAUNCH_SPRINT_PLAN.md
git add CHANGELOG.md README.md docs tasks
git commit -m "docs: update changelog, plans, sprint status and cleanup" \
  -m "Wpisy CHANGELOG (2026-06-18), status sprintu edytora, plan commitów + backlog, usunięcie nieaktualnych planów."

echo
echo "== GOTOWE =="
git log --oneline -9
echo
echo "Pozostałe niezacommitowane (jeśli są):"
git status --short
