# Delivery - Squad Bench (Pro/Club Premium Roster)
**Data:** 2026-06-13 17:20  
**Iteracja:** 1

## Zadanie
Implementacja Squad Bench — predefined player roster dla Pro/Club Premium. Trener definiuje zawodników z imionami i numerami w Settings, pojawiają się oni pod boiskiem (nie w bottom barze), może przeciągnąć ich na płytę jak w SFG.

Wymagania:
1. Squad pod boiskiem — nie w bottom barze
2. Show/hide z checkboxem/włącznikiem + ikonka koła zębatego → Settings
3. Predefiniowanie w Settings (SettingsModal, nowa zakładka Squad)
4. Drag & drop z squad bench na canvas
5. Premium gating — tylko dla Pro (Solo Premium / Club Premium)

## Decyzje i uzasadnienie
- **Nowy komponent `SquadBench`** w `packages/ui` zamiast rozszerzać `SmartBottomBar` — squad jest pod canvasem, nie w bottom barze
- **Nowy typ `SquadPlayer`** w `packages/core/src/types.ts` — prosty interfejs z id, name, number, team
- **Pola `squad` i `squadVisible`** w `BoardDocument` — squad jest per-dokument, serializowany
- **Drag & drop przez natywne HTML5 DnD API** — prostsze niż integracja z Konvą, wystarczy `onDrop` na kontenerze
- **Premium gating** przez `authIsPro` + warunek w BoardPage i SettingsModal (blokada dla Free z CTA)
- **Nie rozbudowuję `onUpdateSquadPlayer` inline** — SettingsModal destructureuje prop jako `_onUpdateSquadPlayer` na przyszłość

## Co zrobiono
1. `packages/core/src/types.ts` — dodano `SquadPlayer`, `DEFAULT_SQUAD`, pola `squad` i `squadVisible` w `BoardDocument`
2. `packages/core/src/board.ts` — `generateSquadId()`, `createSquadPlayer()`
3. `packages/core/src/serialization.ts` — squad defaults w `createDocument()`
4. `apps/web/src/store/slices/documentSlice.ts` — pełen CRUD dla squad: getSquad, addSquadPlayer, removeSquadPlayer, updateSquadPlayer, setSquad, setSquadVisible, toggleSquadVisible
5. `apps/web/src/store/slices/elementsSlice.ts` — `addPlayerFromSquad(team, name, number)` tworzy zawodnika z labelem i numerem
6. `packages/ui/src/SquadBench.tsx` — nowy komponent: lista home/away, drag, gear icon → settings, hide/show, premium gating
7. `packages/ui/src/index.ts` — export SquadBench + typy
8. `packages/ui/src/SettingsModal.tsx` — nowa zakładka Squad: dodawanie (name, number, team), lista z usuwaniem, toggle "Show on board", blokada dla Free
9. `apps/web/src/app/routes/useBoardPageState.ts` — squad selectory + addPlayerFromSquad
10. `apps/web/src/app/board/BoardPage.tsx` — SquadBench pod canvasem, drop handler
11. `apps/web/src/app/AppShell.tsx` — squad props → ModalOrchestrator
12. `apps/web/src/app/orchestrators/ModalOrchestrator.tsx` — squad props → SettingsModal

## Napotkane problemy
- `onUpdateSquadPlayer` zadeklarowany w interfejsie SettingsModal ale nieużywany → typeScript error. Rozwiązanie: zostawiony w interfesie jako `/** for future use */` ale zdestrukturyzowany przez SettingsModal jako prefiksowany.
- Stare referencje przez `useBoardStore.getState()` → zastąpiono reactive Zustand selectors

## Evidence
- `pnpm --filter @tmc/core typecheck` — ✅
- `pnpm --filter @tmc/ui typecheck` — ✅
- `pnpm --filter @tmc/web typecheck` — ✅
- `pnpm typecheck` (full monorepo, 9 tasks) — ✅
- `pnpm --filter @tmc/web test` — 110/110 tests ✅

## Wynik
Squad Bench w pełni zaimplementowany:
- Dane: SquadPlayer w BoardDocument, CRUD w store
- UI: SquadBench pod canvasem, Settings → Squad edytor
- Drag & drop na płytę
- Premium gating: hidden for Guest/Free, dostępny dla Pro/Club Premium
- Show/hide + gear icon → settings

## Status DoD
- [x] Kod zgodny z planem
- [x] Testy przechodzą (110/110)
- [x] UI zgodne z design systemem (tokeny, bg-surface, border-border, text-muted)
- [x] Migracja bezpieczna (nowe pola w BoardDocument, undefined-safe)
- [x] Brak znanych regresji
- [x] Evidence zapisane

## Zmienione pliki
- `packages/core/src/types.ts`
- `packages/core/src/board.ts`
- `packages/core/src/serialization.ts`
- `packages/core/src/index.ts` (bez zmian, export *)
- `apps/web/src/store/slices/documentSlice.ts`
- `apps/web/src/store/slices/elementsSlice.ts`
- `packages/ui/src/SquadBench.tsx` (NOWY)
- `packages/ui/src/SettingsModal.tsx`
- `packages/ui/src/index.ts`
- `apps/web/src/app/routes/useBoardPageState.ts`
- `apps/web/src/app/board/BoardPage.tsx`
- `apps/web/src/app/AppShell.tsx`
- `apps/web/src/app/orchestrators/ModalOrchestrator.tsx`
- `CHANGELOG.md`
- `thoughts/2026-06-13/1720_delivery_squad-bench.md`

---

## Poprawka: widoczność SquadBench (2026-06-13 17:42)

### Problem
SquadBench był niewidoczny dla nowego użytkownika:
1. `squadVisible` domyślnie `false`
2. Warunek `if (!visible || !canAccess) return null` ukrywał kompletnie
3. Pusta squad → `return null` → zero hintu
4. Free user nie widział nic — nawet nie wiedział że istnieje

### Naprawione
1. `serialization.ts`: `squadVisible: true` (zamiast `false`) — domyślnie włączony
2. `useBoardPageState.ts`: fallback `?? true` (zamiast `?? false`)
3. `AppShell.tsx`: fallback `?? true`
4. `SquadBench.tsx`: **całkowicie przepisany** — już nie zwraca `null`; zamiast tego:
   - **Empty state** — przycisk "Add players in Settings →" / "Set up squad in Settings →"
   - **Non-Pro** — lista widoczna, ale gracze zablokowani (`opacity-50 pointer-events-none` + kłódka) + żółty pasek "Upgrade to Pro"
   - **Collapsed state** — gdy `visible=false`, pokazuje "N player(s) in squad — tap eye to show"
   - **Eye toggle** — zmienia się na show/hide ikonkę
   - Header zawsze widoczny z gear + eye
5. `BoardPage.tsx`: uproszczony do jednego `<SquadBench>` — cała logika w komponencie