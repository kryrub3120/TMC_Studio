# MasterAutopilot — Sprint UX-A MasterVerifier
**Data:** 2026-06-22 15:45
**Sprint:** Sprint UX-A (Flow & Bug Hardening, P0)
**Wersja:** 0.7.1 → 0.7.2 (PATCH)

## DoD verification

- [x] A1: niezalogowany przy zapisie (Cmd+S) widzi toast "Zaloguj się — to darmowe"; brak zapisu lokalnego
- [x] A2: AccountMenu dla `plan === 'guest'` pokazuje tylko przycisk "Zaloguj się" — brak Wyloguj
- [x] A3: 6 pozycji menu (Opcje edytora, Ustawienia boiska, Ustawienia drużyny, Twój profil, separator+Upgrade, Wyloguj). Klucze locale w pl/en/es.
- [x] A4: 26+ kluczy `contextMenu.*` w pl/en/es — `canvasContextMenu.ts` już używa `translate(t, 'contextMenu.${key}', fallback)`
- [x] A5: `handleGoogleSignIn` zamyka modal przed OAuth; auth flow działa w tle
- [x] A6: `arrowDefaults`/`zoneDefaults` persist potwierdzony — działa i przeżywa reload
- [x] A7: `text-muted/70` → `text-muted` w HelpSidebar/FaqCategory/FaqSearch
- [x] A8: `inspectorActiveTab` w useUIStore + stage handler przełącza na Props przy dwukliku; usunięto `cancelBubble` z PlayerNode/TextNode
- [x] `tsc --noEmit` + build + lint (0 errors) + testy (119/119) zielone
- [x] `CHANGELOG.md` zaktualizowany; wersja zbumpowana (0.7.1 → 0.7.2); Footer dynamiczny

## Commands evidence
```bash
pnpm --filter @tmc/ui typecheck  # OK
pnpm --filter @tmc/board typecheck  # OK
pnpm --filter @tmc/web typecheck  # OK
pnpm build  # 5/5 tasks, all successful
pnpm lint  # 0 errors, 112 warnings (pre-existing)
pnpm --filter @tmc/web test  # 113/113 passed
pnpm --filter @tmc/core test  # 6/6 passed
```

## Changed files
- packages/ui/src/TopBar.tsx — AccountMenu restructuring (A2/A3)
- packages/ui/src/UserMenu.tsx — unaffected (A2 handled in TopBar)
- packages/ui/src/RightInspector.tsx — controlled activeTab prop (A8)
- packages/ui/src/HelpSidebar.tsx — contrast fix (A7)
- packages/ui/src/FaqCategory.tsx — contrast fix (A7)
- packages/ui/src/FaqSearch.tsx — contrast fix (A7)
- packages/ui/src/AuthModal.tsx — Google login flow (A5)
- packages/ui/src/locales/en.ts — contextMenu.* + topbar.* A3 new keys + signInToSave
- packages/ui/src/locales/pl.ts — same
- packages/ui/src/locales/es.ts — same
- packages/board/src/PlayerNode.tsx — removed cancelBubble (A8)
- packages/board/src/TextNode.tsx — removed cancelBubble (A8)
- apps/web/src/store/useUIStore.ts — inspectorActiveTab state (A8)
- apps/web/src/app/routes/useBoardPageState.ts — inspectorActiveTab wiring (A8)
- apps/web/src/app/board/BoardPage.tsx — TopBar props + RightInspector activeTab (A8)
- apps/web/src/app/board/BoardTopBarSection.tsx — new props passthrough
- apps/web/src/app/board/useBoardPageEffects.ts — dblclick handler for element→props tab (A8)
- apps/web/src/hooks/useKeyboardShortcuts.ts — guest save CTA (A1)
- package.json + 5x packages/*/package.json — version bump 0.7.2
- CHANGELOG.md — full list of changes

## Not changed (out of scope)
- Apps/web/src/app/orchestrators/ModalOrchestrator.tsx — not needed for A5
- Apps/web/src/store/slices/documentSlice.ts — persist already correct
- docs/ — updated via docs-update skill

## Decyzja SprintGate: ACCEPT SPRINT
