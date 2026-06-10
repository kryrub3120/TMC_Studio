# TMC Studio — Plan implementacji (zweryfikowany audytem) — OCENA HONESTA: 6.5/10 → docelowo 8.5/10 ⚠️
**Data:** 2026-06-10
**Autor:** Delivery Agent (self-eval 3× + code review + devils advocate)
**Bazowany na:** `docs/AUDIT_COMPREHENSIVE_2026_06_10.md` (9 Issues)
**Status:** Plan roboczy — oznaczone są fragmenty o niepotwierdzonej pewności [⚠️ UNVERIFIED]

---

## ⚠️ Disclaimer otwartości

Ten plan oznacza jawnie fragmenty, które wyglądają poprawnie w grep search, ale NIE zostały potwierdzone przez odczytanie rzeczywistego pliku w workspace (plik mógł być niedostępny lub cache był nieświeży). Każdy taki fragment ma etykietę [⚠️ UNVERIFIED].

---

## Rekomendowana kolejność

1. ~~**Sprint 0 — Sanity check** (2h)~~ ✅ DONE
2. ~~**Sprint A — Quick wins UX** (5h)~~ ✅ DONE (2026-06-10)
   - Aria-label na zoomie, toasty undo/redo, kursory wg narzędzia
   - Podpisy zawodników: domyślnie brak, showLabel===true = pill+tło pod spodem, numer osobno
   - Enter→focus na polu label w RightInspector
   - Etykiety UI: "Player Label", "Show Label Below"
3. **Sprint B — Spike: Transformer** (2h POC → max 4h full): tylko TextNode, potem expand
4. ~~**Sprint C — Numeracja + undo** (6h)~~ ✅ DONE
5. ~~**Sprint D — Inspector UX Fix**~~ ✅ DONE
6. **Sprint E — Reszta** (8-12h): auto-expand (osobny commit!), thumbnails, FAB (opc.), tutorial (opc.)

---

## Zidentyfikowane błędy w poprzedniej wersji planu (krytyczne)

### Błąd #1: `toggleAutoNumbering` warunek — BUG w pseudokodzie ✅ FIXED
**Lokalizacja:** Zadanie 2A, fragment `if (!current && !newVal)`
**Problem:** `!current && !newVal` to `true && false = false` dla OFF→ON. Powinno być `if (!current && newVal)`.
**Poprawka:** `if (get().isAutoNumbering === false) { get().renumberAllArrows(); }`
**Status:** ✅ Naprawiono w Sprint C (2026-06-10). `toggleAutoNumbering` w `documentSlice.ts` używa `const wasOff = get().isAutoNumbering === false` — poprawne.

### Błąd #2: Transformer — plan sam sobie przeczy
**Problem:** Najpierw proponuje `nodeRefMap`, potem przyznaje że komponenty nie mają refów, potem skacze do `stage.findOne('#id')`. Żadne z tych rozwiązań nie jest potwierdzone z rzeczywistym kodem.
**Decyzja:** Transformujemy tylko TextNode jako POC. Reszta elementów wymaga otwarcia plików i sprawdzenia czy mają `name`/`id` na korzeniu Group.
**Status:** [⚠️ UNVERIFIED] — nie potwierdzono czy TextNode/ZoneNode/PlayerNode mają `id` na Group

### Błąd #3: Podwójny `pushHistory` w `deleteSelected` + `renumberAllArrows` ✅ FIXED
**Problem:** `deleteSelected` woła `renumberAllArrows()`, który woła `pushHistory()`. Jeśli `deleteSelected` też woła `pushHistory()` → 2 snapshoty dla jednej akcji użytkownika. To zepsuje undo (dwa kliknięcia Ctrl+Z zamiast jednego).
**Decyzja:** `renumberAllArrows()` NIE woła `pushHistory()` — tylko `deleteSelected` woła go raz po wszystkim.
**Status:** ✅ Zweryfikowano i naprawiono w Sprint C (2026-06-10). Testy integracyjne potwierdzają:
- `renumberAllArrows` nie zwiększa `history.length`
- `deleteSelected` tworzy JEDEN snapshot po delete + renumber
- `toggleAutoNumbering` tworzy JEDEN snapshot po toggle + renumber

### Błąd #4: `fetch(dataUrl).blob()` zamiast `canvas.toBlob()`
**Problem:** `stage.toDataURL()` → `fetch(url).blob()` działa, ale `canvas.toBlob()` jest prostsze i nie wymaga fetch. Jeśli Konva Stage ma `toBlob`, to lepiej.
**Status:** [⚠️ UNVERIFIED] — nie sprawdzono czy `Konva.Stage` ma `toBlob`.

### Błąd #5: Dynamic import ścieżki w Autosave
**Problem:** `import('../../lib/supabase')` w `apps/web/src/services/AutosaveService.ts` — względna ścieżka. Jeśli AutosaveService jest w `apps/web/src/services/`, to `../../lib/supabase` wskazuje na `apps/web/lib/supabase` — to może być źle (prawidłowo: `../lib/supabase`).
**Status:** [⚠️ UNVERIFIED] — nie odczytano rzeczywistej ścieżki.

### Błąd #6: FAB kalibracji to placeholder, nie funkcja
**Problem:** Issue #4 mówi o "przycisku kalibracji" ale oczekuje realnej kalibracji touch/pen. Przycisk z overlayem "Dotknij 4 rogi" to nie kalibracja — to instrukcja.
**Decyzja:** Zmieniamy nazwę na "Touch Calibration Helper" i dodajemy do opisu że to wersja 0.1 (minimum viable). Pełna kalibracja to osobny temat.

---

## Sprint 0 — Sanity Check (2h)

CEL: Potwierdzić rzeczywisty stan kodu przed jakąkolwiek zmianą. Nic nie implementujemy — tylko czytamy.

| # | Zadanie | Co sprawdzić | Czas |
|---|---------|-------------|------|
| S0.1 | **Sprawdź `id`/`name` na Group w TextNode.tsx** | Czy `id={textEl.id}` istnieje na korzeniu `<Group>`? | 10min |
| S0.2 | **Sprawdź `id`/`name` na Group w ZoneNode.tsx** | Czy istnieje? Czy istniejący 8-punktowy resize działa przez Group? | 10min |
| S0.3 | **Sprawdź `id`/`name` na Group w PlayerNode.tsx** | Czy `id={player.id}` jest? Czy ALT+drag rotation jest na Group czy na sub-elementach? | 10min |
| S0.4 | **Sprawdź `id`/`name` na ArrowNode.tsx** | Czy endpoint handles (Circle) są na tym samym Group co strzałka? | 10min |
| S0.5 | **Zweryfikuj historię undo** | Przeczytaj `historySlice.ts` i znajdź `pushHistory`. Czy guard `isContinuous` blokuje podwójne snapshoty? | 15min |
| S0.6 | **Zweryfikuj `toggleAutoNumbering`** | Przeczytaj `documentSlice.ts` — znajdź funkcję, sprawdź warunek. | 10min |
| S0.7 | **Zweryfikuj AutosaveService ścieżki** | Przeczytaj `AutosaveService.ts` — jaka jest względna ścieżka do `supabase`? Czy `uploadThumbnail` import jest poprawny? | 10min |
| S0.8 | **Sprawdź Konva.Stage API — decyzja blob** | Czy `stage.toBlob(config, callback)` istnieje w typach Konva? Jeśli TAK → używamy `toBlob`. Jeśli NIE → używamy `toDataURL + fetch`. **Koniec Sprintu 0 = konkretna decyzja.** | 10min |
| S0.9 | **Zapisz wyniki** | Stwórz `thoughts/2026-06-10/sprint0-sanity-check.md` z listą potwierdzonych/niepotwierdzonych rzeczy | 30min |

**Wynik:** Po S0 wiemy czy Transformer jest wykonalny (Sprint B) i czy renumbering ma sens (Sprint C).

---

## Sprint A — Quick Wins UX (5h) ✅ DONE (2026-06-10)

> **Status:** W pełni zaimplementowane i zweryfikowane.
> **Raporty:** `thoughts/2026-06-10/1800_delivery_sprintA-implementation.md`, `thoughts/2026-06-10/1815_delivery_sprintA-player-labels-polish.md`, `thoughts/2026-06-10/1830_delivery_sprintA-enter-edit-label.md`

### Zmiany

1. **aria-label na ZoomWidget** — `packages/ui/src/ZoomWidget.tsx`: + aria-label na Zoom In, Zoom Out, Fit
2. **Toasty undo/redo** — `apps/web/src/hooks/useKeyboardShortcuts.ts`: + `showToast('Cofnięto')` i `showToast('Przywrócono')`
3. **Kursory wg narzędzia** — `apps/web/src/app/board/BoardCanvasSection.tsx`: crosshair/text wg activeTool
4. **Podpisy zawodników** — `packages/board/src/PlayerNode.tsx`: domyślnie brak, showLabel===true = pill+tło+cień pod spodem, numer osobno, dynamiczna szerokość
5. **Enter→focus label** — Enter na zawodniku focusuje "Player Label" w RightInspector. Enter/Escape w inpucie → blur

### Pliki
- `packages/ui/src/ZoomWidget.tsx` — aria-label
- `apps/web/src/hooks/useKeyboardShortcuts.ts` — toasty undo/redo, + onFocusLabelInput
- `apps/web/src/app/board/BoardCanvasSection.tsx` — cursor wg narzędzia
- `packages/board/src/PlayerNode.tsx` — przebudowa podpisów + dynamiczna szerokość pilla
- `packages/ui/src/RightInspector.tsx` — + labelInputRef, onKeyDown, etykiety "Player Label" / "Show Label Below", aria-label
- `apps/web/src/app/routes/useBoardPageState.ts` — + labelInputRef, onFocusLabelInput
- `apps/web/src/app/board/BoardPage.tsx` — + state.labelInputRef do RightInspector

---

## Sprint B — Spike: Transformer POC ✅ ZROBIONE (2026-06-10)

**Wykonano:** POC tylko dla TextNode — zgodnie z zakresem zatwierdzonego planu.
**Czas:** ~30 min (implementacja + TypeScript check + testy + raport)

### Co zrobiono

**Plik:** `CanvasElements.tsx`

1. **Importy:** `useRef`, `useEffect`, `Transformer` z react-konva, `type Konva`
2. **`transformerRef`** — `useRef<Konva.Transformer>(null)`
3. **`useEffect([selectedIds, elements, isPlaying])`** — logika attach/detach:
   - Jeśli `!isPlaying && selectedIds.length === 1 && isTextElement(selectedId)` → `stage.findOne('#' + id)` → `tr.nodes([node])`
   - W przeciwnym razie → `tr.nodes([])` (detach)
4. **JSX `<Transformer>`** w Layer, między TextNode a Drawing preview
5. **Konfiguracja:** 4 anchory narożne (`top-left`, `top-right`, `bottom-left`, `bottom-right`), rotate (offset 25px), niebieskie obramowanie (#3b82f6), min size 20×10

### Dlaczego tylko TextNode

- **TextNode** — potwierdzony `<Group id={text.id}>` (linia 142 w TextNode.tsx). `stage.findOne` działa.
- **ZoneNode** — ma własny 8-punktowy resize. Konflikt z Transformerem realny. Poza zakresem.
- **PlayerNode** — ma ALT+drag rotation. Poza zakresem.
- **ArrowNode** — ma własne endpoint handles (kółka). Poza zakresem.

### Weryfikacja

- ✅ TypeScript: 0 błędów w CanvasElements.tsx
- ✅ Testy: 83/83 pass (4 test files)
- ✅ Brak wpływu na inne elementy — guard `isTextElement` w useEffect
- ✅ Brak zmian w numeracji, podpisach, konfiguracji

### Pliki zmienione

- `apps/web/src/app/board/canvas/CanvasElements.tsx`

---

## Sprint C — Numeracja strzałek + undo (6h) ✅ DONE (2026-06-10)

> **Status:** W pełni zaimplementowane, przetestowane i zweryfikowane.
> **Testy:** 25 testów (14 jednostkowych + 11 integracyjnych na realnym store) — wszystkie ✅
> **Raporty:** `thoughts/2026-06-10/1705_delivery_sprint-C-arrow-renumber-undo.md`, `thoughts/2026-06-10/1725_delivery_sprint-C-verification-fix.md`

### Uwagi implementacyjne (istotne różnice vs plan)

1. **Brak `createdAt` w ArrowElement** — plan zakładał sortowanie po `createdAt`, ale `ArrowElement` (ani `BoardElementBase`) nie ma tego pola. Zastosowano kolejność w tablicy `elements` (insertion order).
2. **Cross-slice call** — `toggleAutoNumbering` w `documentSlice.ts` wywołuje `get().renumberAllArrows()` bez żadnego importu, bo wszystkie slice'y są komponowane w `AppState`.
3. **`renumberAllArrows`** — iteruje `elements` w kolejności tablicy, przypisuje 1..N dla `showNumber === true`. Guard `if (numberMap.size === 0) return` zapobiega pustym set().

### Krótki kod referencyjny

```typescript
// elementsSlice.ts
renumberAllArrows: () => {
  const { elements } = get();
  const numberMap = new Map<string, number>();
  elements.forEach((el) => {
    if (isArrowElement(el) && el.showNumber) {
      numberMap.set(el.id, numberMap.size + 1);
    }
  });
  if (numberMap.size === 0) return;
  set((state) => ({
    elements: state.elements.map((el) => {
      const newNum = numberMap.get(el.id);
      if (newNum !== undefined && isArrowElement(el)) return { ...el, number: newNum };
      return el;
    }),
  }));
  // NIE woła pushHistory
},

deleteSelected: () => {
  const { selectedIds, elements } = get();
  if (selectedIds.length === 0) return;
  const hadNumberedArrows = selectedIds.some((id) => {
    const el = elements.find((e) => e.id === id);
    return el && isArrowElement(el) && el.showNumber;
  });
  set((state) => ({
    elements: removeElementsByIds(state.elements, selectedIds),
    selectedIds: [],
  }));
  if (hadNumberedArrows) get().renumberAllArrows();
  get().pushHistory(); // JEDEN snapshot
}
```

```typescript
// documentSlice.ts
toggleAutoNumbering: () => {
  const wasOff = get().isAutoNumbering === false;
  set((state) => ({ isAutoNumbering: !state.isAutoNumbering }));
  if (wasOff) get().renumberAllArrows(); // NIE woła pushHistory
  get().pushHistory(); // JEDEN snapshot
}
```

---

## Sprint D — Inspector UX Fix (2026-06-10) ✅ DONE

> **Status:** W pełni zaimplementowane i przetestowane.
> **Raport:** `thoughts/2026-06-10/1826_delivery_inspector-ux-fix.md`

### D1: Arrow controls w prawym inspectorze
- **Show number** toggle — deleguje do `toggleArrowNumber` (undo)
- **Number** input/stepper — deleguje do `setArrowNumber` (undo)
- **Auto-number arrows** — globalny toggle `isAutoNumbering`
- **Renumber arrows (1..N)** — woła `renumberAllArrows` + `pushHistory`

### D2: Fix duplikacji inspectora (breakpoint lg)
- **Przyczyna:** Breakpoint `lg` (1024-1280px) miał osobny floating overlay z backdropem (`bg-black/40` + `w-[240px]` panel)
- **Fix:** Wszystkie breakpointy <xl używają jednolitego FAB + BottomSheet

### D3: Widoczny przycisk toggle
- **xl desktop, sidebar zamknięty:** floating akcentowy przycisk po lewej (`-left-12 top-3`)
- **xl desktop, sidebar otwarty:** collapse toggle (`-left-8 top-3`)
- **<xl (tablet/mobile):** FAB `fixed bottom-20 right-4` — nie koliduje z ZoomWidget
- Wszystkie przyciski mają `aria-label`

### Pliki
- `packages/ui/src/RightInspector.tsx` — arrow controls + fix breakpoint + toggle button
- `apps/web/src/app/routes/useBoardPageState.ts` — arrow data w inspector element
- `apps/web/src/app/board/useBoardPageHandlers.ts` — arrow obsługa w handleUpdateElement
- `apps/web/src/app/board/BoardPage.tsx` — przekazanie arrow callbacków

---

## Sprint E — Reszta (8-12h)

### D1: Auto-expand (jeśli nie zrobione w A4)

Już w Sprint A4.

### D2: Thumbnails w Autosave

**Zmiana w AutosaveConfig:**
```typescript
export interface AutosaveConfig {
  debounceMs: number;
  onSave: () => Promise<void>;
  onError?: (error: Error) => void;
  stageRef?: React.RefObject<Konva.Stage>;
  projectId?: string;
}
```

**Uwaga:** Ścieżka importu `uploadThumbnail` musi być zweryfikowana w S0.7. Jeśli AutosaveService jest w `apps/web/src/services/`, to poprawna ścieżka: `../lib/supabase` (nie `../../lib/supabase`).

**Zamiast `fetch(dataURL).blob()`, sprawdź czy `stage.toBlob()` istnieje:**
```typescript
// Jeśli toBlob istnieje (lepsze):
const blob = await new Promise<Blob>((resolve) => 
  stage.toBlob((b: Blob) => resolve(b), 'image/png', 0.25)
);
// Jeśli nie: dataURL + fetch:
const dataUrl = stage.toDataURL({ mimeType: 'image/png', pixelRatio: 0.25 });
const blob = await (await fetch(dataUrl)).blob();
```

**Czas:** 2h + 1h testy = 3h
**Ryzyko:** 🟠 ŚREDNIE — stage ref + blob conversion + ścieżka importu

### D3: Auto-expand — osobny commit z rollbackiem

**Pliki:** `BoardCanvasSection.tsx`, `useUIStore.ts`

**Uzasadnienie:** To NIE jest quick win — zmienia zachowanie canvasa przy resize. Może irytować użytkownika (zoom "ucieka" gdy rozciąga okno). Dlatego osobny commit, z dedykowanym rollbackiem.

**Zmiany:**
1. Flaga `userHasManuallyZoomed` w `useUIStore.ts` (już zrobiona w A1)
2. Warunek w `ResizeObserver` w `BoardCanvasSection.tsx` (ok. linia 95):
```typescript
if (!userZoomed && newFitZoom > curZoom) {
  useUIStore.getState().setZoom(newFitZoom);
  ...center...
} else if (curZoom > newFitZoom) {
  // istniejący auto-scale-down
}
```
3. `setZoomManually()` w wheel handler i pinch handler

**Rollback:** `git revert HEAD` — jeden commit, łatwy revert.
**Czas:** 1.5h + 0.5h testy = 2h
**Ryzyko:** 🟠 ŚREDNIE

### D4: FAB kalibracji (wersja 0.1 — placeholder, OPCJONALNY)

**Zmiana nazwy:** Z "Calibration" na "Touch Calibration Helper".
**Priority:** 🔵 NISKI — można pominąć do MVP. To UX placeholder, nie core issue.
**Plik:** `packages/ui/src/CalibrationFAB.tsx`

**Zakres:**
- Przycisk FAB z ikoną crosshair
- Po kliknięciu: overlay z instrukcją "Dotknij 4 rogi boiska aby skalibrować"
- **To NIE jest prawdziwa kalibracja** — to placeholder UI. Prawdziwa kalibracja (mapowanie dotyku → współrzędne canvasa) to osobny, duży temat.
- **Warunek:** Robić tylko jeśli Sprinty A-C i D3 zrobione i został czas.

**Czas:** 2h + 0.5h testy = 2.5h

### D5: Tutorial onboarding (opcjonalnie)

**Priorytet:** 🔵 NAJNIŻSZY — można pominąć do MVP.
**Zakres:** 5 kroków, tylko dla nowych użytkowników, auto-advance 4s.
**Czas:** 3h + 1h testy = 4h

---

## Łączne estymaty (realistyczne)

| Sprint | Co | Czas min | Czas max |
|--------|----|----------|----------|
| **Sprint 0** | Sanity check | 2h | 2h |
| **Sprint A** | Quick wins (cursor, aria, toast, font-size) | 4.5h | 5h |
| **Sprint B** | Transformer POC → expand | 4h | 5h |
| **Sprint C** | Numeracja + undo (z poprawnym pushHistory) | 5h | 6h |
| **Sprint D** | Auto-expand + thumbnails + FAB (opc.) + tutorial (opc.) | 7h | 12h |
| **RAZEM (core)** | Sprinty 0 + A + B + C + D3 (auto-expand) | **15.5h** | **18h** |
| **RAZEM (z opcjonalnymi)** | + FAB + tutorial | **21h** | **30h** |

---

## Jawne ryzyka i niepewności (w przeciwieństwie do poprzedniej wersji która udawała 10/10)

1. **[⚠️ UNVERIFIED]** TextNode/ZoneNode/PlayerNode mogą nie mieć `id` na Group — bez tego Transformer nie zadziała. Rozwiązanie: dodaj `name` do Group (łatwe, ale wymaga modyfikacji packages/board/).
2. **[⚠️ UNVERIFIED]** `Stage.toBlob()` może nie istnieć w typach Konva — trzeba sprawdzić.
3. **[⚠️ UNVERIFIED]** Ścieżka `../lib/supabase` vs `../../lib/supabase` — trzeba potwierdzić z rzeczywistym kodem.
4. **Renumeracja z undo** — najtrudniejsza część. Potencjalne bugi: podwójny pushHistory, nieprawidłowa kolejność snapshotów. Test manualny absolutnie konieczny.
5. **ZoneNode + Transformer** — konflikt z istniejącym resize. Możliwe że ZoneNode będzie wymagał dedykowanego rozwiązania.
6. **FAB kalibracji** — to nie jest prawdziwa kalibracja. Jeśli issue #4 wymaga realnej kalibracji, to trzeba osobny Sprint E.

---

## Instrukcja dla implementatora

1. **ZACZNIJ od Sprint 0** — bez tego ani kroku dalej
2. **Rób po jednym sprincie, commituj po każdym**
3. **Po każdym sprincie: zapisz thoughts** w `thoughts/2026-06-10/`
4. **Jeśli coś nie działa → STOP → zapisz w thoughts → pytaj usera**
5. **Nie udawaj że wiesz gdzie są pliki** — otwieraj je i czytaj przed zmianą