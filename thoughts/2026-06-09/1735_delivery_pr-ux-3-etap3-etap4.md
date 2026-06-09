# Delivery — PR-UX-3 ETAP 3 + ETAP 4: Auto-fit/Center + Viewport Lock
**Data:** 2026-06-09 17:35
**Iteracja:** 1 (LOOP)
**Branch:** `feature/ux-3-virtual-canvas`

---

## Zadanie
Zaimplementować ETAP 3 (Auto-fit on load & Auto-center) i ETAP 4 (Viewport Lock "Kłódka") zgodnie z planem `PR-UX-3-VIRTUAL-CANVAS-VIEWPORT-PLAN.md`.

---

## Proces myślenia

### ETAP 3 — Auto-fit & Auto-center

**Kluczowa decyzja: `centerPanOffset` jako helper**
Zamiast pisać formułę centrującą inline w każdym miejscu, wydzieliłem do `viewportUtils.ts`. Formuła: `pan = (container - canvas * zoom) / 2`. Round-trip invariant sprawdzony w testach.

**Auto-fit on load:**
- `hasInitializedRef` — React ref przechowujący flagę "czy już wykonaliśmy pierwsze centrowanie".
- `containerSize <= MIN_CONTAINER_SIZE` guard — nie centrujemy na 0. ResizeObserver musi najpierw dostarczyć prawdziwy rozmiar.
- `setPanOffset(centerPanOffset(...))` — ustawia Group panOffset na środek przy pierwszym renderze z prawidłowymi wymiarami.

**Auto-center na resize:**
- `window.addEventListener('resize', handleResize)` — niezależnie od `ResizeObserver` który wymierza kontener.
- Warunek `userZoom > 1` — centrujemy tylko gdy zoom ≤ 1 (pitch mieści się w viewporcie). Przy zoom > 1 pozwalamy użytkownikowi manewrować własnym panem.
- Wykorzystuje `useUIStore.getState().zoom` w handlerze (nie w closure) żeby zawsze mieć aktualną wartość.
- Po centrowaniu tworzy się odpowiedni margines — kontener ma już padding z `containerPadding` (16/24px) wliczony w `fitZoom`.

**Padding:** `containerPadding` (16px mobile, 24px desktop) odejmowany od wymiarów kontenera w `fitZoom = min((W-pad)/canvasW, (H-pad)/canvasH, MAX_FIT_UPSCALE)`. Boisko nie dotyka krawędzi.

### ETAP 4 — Viewport Lock (Kłódka)

**Architektura (R-MVP):**
- `viewportLocked` w `useUIStore` (UI state, nie undoable) → persisted przez `partialize`.
- Mutacja przez `cmd.view.toggleViewportLock()` — spełnia regułę "UI → commands only".
- Odczyt przez selektor `useUIStore(s => s.viewportLocked)` w `BoardCanvasSection`.

**Szczelność kłódki:**
- **Ctrl/Cmd+Wheel zoom:** guard w `handleWheel` na początku handlera — `if (viewportLocked) return` (przed `preventDefault`). Używa `useUIStore.getState()` (getter wewnątrz efektu closure).
- **Space+drag pan:** guard w `handleContainerPointerDown` — `if (viewportLocked) return`.
- **Touch pinch/pan:** `locked` param przekazany do `useTouchGestures`, guard w `handleTouchStart` na początku (przed `preventDefault`).
- **Interakcje taktyczne:** nietknięte — wybór/drag elementów przechodzi przez Konva node handlers w Stage, nie przez ręczne controllery pana. Kłódka nie blokuje klikania zawodników ani rysowania strzałek.

**UI — ZoomWidget:**
- Dodałem `LockIcon` i `UnlockIcon` jako inline SVGi (żadnych nowych zależności).
- Przycisk z `aria-pressed`, `aria-label`, `focus-visible:ring-2`.
- Kolor: `text-accent bg-accent/10` gdy locked, `text-muted` gdy unlocked.
- Widoczny tylko gdy `onToggleLock` jest przekazany (opcjonalny prop — zachowuje wsteczną kompatybilność).

**CommandRegistry:**
- `ViewCommands` dodane do `CommandRegistry` type.
- Implementacja w `createCommandRegistry()`: deleguje do `useUIStore.getState()`.
- Centralny `cmd.view` export w `CommandRegistry.ts`.

---

## Co zrobiłem

### ETAP 3
1. **viewportUtils.ts**: `centerPanOffset(containerW, H, canvasW, H, zoom)` helper
2. **BoardCanvasSection.tsx**:
   - `hasInitializedRef` — pierwsze centrowanie na load
   - `window resize` listener — auto-center przy zoom ≤ 1
3. **viewportUtils.test.ts**: 5 testów dla `centerPanOffset`

### ETAP 4
1. **useUIStore.ts**: `viewportLocked` state + `toggleViewportLock`/`setViewportLock` + persystencja
2. **commands/types.ts**: `ViewCommands` interface → `view.toggleViewportLock`, `view.setViewportLock`
3. **commands/registry.ts**: implementacja w `createCommandRegistry()`
4. **commands/CommandRegistry.ts**: `cmd.view` export + import `useUIStore`
5. **BoardCanvasSection.tsx**: guards na wheel + space-drag + touch
6. **useTouchGestures.ts**: `locked` param + guard
7. **ZoomWidget.tsx**: `LockIcon`/`UnlockIcon` + lock toggle button
8. **useBoardPageState.ts**: `viewportLocked` + `toggleViewportLock` eksport
9. **BoardPage.tsx**: wiring do `ZoomWidget`

---

## Wynik

| Krok | Status |
|------|--------|
| `centerPanOffset` helper + testy (27/27) | ✅ |
| Auto-fit na load (`hasInitializedRef`) | ✅ |
| Auto-center na resize (zoom ≤ 1) | ✅ |
| Padding 16/24px — boisko nie dotyka krawędzi | ✅ (istniejący `containerPadding` w `fitZoom`) |
| `viewportLocked` w `useUIStore` + persist | ✅ |
| `cmd.view.toggleViewportLock` | ✅ |
| Wheel zoom guard | ✅ |
| Space+drag pan guard | ✅ |
| Touch pinch/pan guard | ✅ |
| Interakcje taktyczne działają (nieblokowane) | ✅ |
| `LockIcon`/`UnlockIcon` (na inline SVG, bez deps) | ✅ |
| a11y: `aria-pressed`, `aria-label`, focus ring | ✅ |
| TypeScript: 9/9 packages | ✅ |
| Testy: 27/27 | ✅ |
| ETAP 3 commit: `bc9dd30` | ✅ |
| ETAP 4 commit: `f9b435d` | ✅ |

---

## Status DoD (oba etapy)
- [x] First load: pitch centered + visible z marginesem
- [x] Resize window: pitch stays centered przy zoom ≤ 1
- [x] `pnpm typecheck` green (9/9)
- [x] 27/27 testów przechodzi
- [x] Kłódka toggluje się, stan persystuje
- [x] Locked: wheel zoom, pan, touch pinch — wyłączone
- [x] Locked: element selection/drag — działają
- [x] UI czyta przez selektor, mutuje przez `cmd.view.*`
- [x] Thoughts zapisany

---

## Dla następnej iteracji / następnego agenta

**Stan:** ETAP 1-4 skończone i committed na `feature/ux-3-virtual-canvas`.

| Commit | Hash | ETAP |
|--------|------|------|
| `refactor(canvas): add getCanvasWorldCoords...` | `342b1c7` | 1 |
| `fix(canvas): enforce virtual canvas invariant...` | `11710db` | 2 |
| `feat(canvas): auto-fit on load and auto-center...` | `bc9dd30` | 3 |
| `feat(ui): add viewport lock toggle...` | `f9b435d` | 4 |
| `docs(canvas): add thoughts and plan...` | `7ffed07` | docs |

**Następne:** ETAP 5 — Responsive paginated Shortcuts tooltip (`CheatSheetOverlay.tsx`):
- Dodać `activeTab` state + tab bar (Elements/Edit/View/More)
- Renderować tylko aktywną zakładkę
- Tab bar z `role="tablist"`, klawiatura, Design System tokens
- Mobile: wersja bottom-sheet (już jest) z krótszym panelem