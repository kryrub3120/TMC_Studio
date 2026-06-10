# Delivery - Sprint 0 Sanity Check
**Data:** 2026-06-10 17:40
**Iteracja:** 1

## Zadanie
Zweryfikować realny stan kodu przed implementacją — sprawdzić ścieżki komponentów, id/name na Group, historię undo, showLabel, AutosaveService i API Konva Stage dla blob/thumbnail.

## Decyzje i uzasadnienie
- Pracuję tylko na odczycie — zero zmian funkcjonalnych.
- Wszystkie ścieżki potwierdzone przez bezpośrednie odczytanie plików.
- Zidentyfikowano jeden poważny problem (BŁĄD w toggleAutoNumbering) i kilka obszarów do uwagi.

## Co zrobiłem

### S0.1-S0.4: id/name na Group w komponentach Konva

**TextNode.tsx** (`packages/board/src/TextNode.tsx`)
- `<Group id={text.id}>` — **TAK**, id jest na korzeniu.
- Brak atrybutu `name`. Do Transformera można użyć `groupRef.current`.

**ZoneNode.tsx** (`packages/board/src/ZoneNode.tsx`)
- `<Group id={zone.id}>` — **TAK**, id jest na korzeniu.
- Ma 8-punktowy resize przez window events (nie Konva Transformery). 
- Resize działa przez `handleResizeStart` z `onMouseDown` na małych Rect handle.

**PlayerNode.tsx** (`packages/board/src/PlayerNode.tsx`)
- `<Group id={player.id}>` — **TAK**, id jest na korzeniu.
- ALT+drag rotation na sub-elementach Circle (hit zone), nie na Group.
- Rotation przez window events (mousemove/mouseup), nie Konva Transformer.

**ArrowNode.tsx** (`packages/board/src/ArrowNode.tsx`)
- `<Group id={arrow.id}>` — **TAK**, id jest na korzeniu.
- Endpoint handles (Circle) na tym samym Group co strzałka.
- Drag endpointów przez window events.

**BallNode.tsx** (`packages/board/src/BallNode.tsx`)
- `<Group id={ball.id}>` — **TAK**, id jest na korzeniu.

**Wniosek:** Wszystkie elementy mają `id` na korzeniu `<Group>`. Transformer można podpiąć przez `stage.findOne('#' + id)`. Żaden element nie ma atrybutu `name`.

### S0.5: Historia undo — historySlice.ts

**Ścieżka:** `apps/web/src/store/slices/historySlice.ts`
- **`pushHistory`**: Działa z guardem `isContinuous`. Blokuje snapshot podczas drag/resize/draw.
- **`deleteSelected`**: W `elementsSlice.ts` — woła `pushHistory()` po operacji. NIE woła `renumberAllArrows()` (funkcja nie istnieje jeszcze w kodzie).
- **`toggleAutoNumbering`**: W `documentSlice.ts` — TYLKO toggle flagi, NIE woła `pushHistory()`.
- **Zgodność:** Plan mówi, że `toggleAutoNumbering` powinien wołać `pushHistory` i ewentualnie `renumberAllArrows`. Obecnie **NIE** woła `pushHistory` — to jest BUG. Po zmianie `isAutoNumbering`, brak snapshotu undo dla tej zmiany.

### S0.6: toggleAutoNumbering — potwierdzenie BUG-a

**Plik:** `apps/web/src/store/slices/documentSlice.ts` linia 411-414

```typescript
toggleAutoNumbering: () => {
  set((state) => ({
    isAutoNumbering: !state.isAutoNumbering,
  }));
},
```

**Stan obecny:**
1. ✗ **NIE woła `pushHistory()`** — zmiana `isAutoNumbering` nie jest zapisywana w historii undo.
2. ✗ **NIE woła `renumberAllArrows()`** — funkcja nie istnieje, więc włączenie auto-numeracji nie ponumeruje istniejących strzałek.
3. ✗ **NIE ma warunku** — brak logiki `if (wasOff) renumberAllArrows()` która była opisana w planie.

**Konsekwencja:** Ctrl+Z nie cofnie toggle auto-numbering. Shift+N → potem Ctrl+Z = nic się nie dzieje (albo undo innej akcji).

### S0.7: AutosaveService ścieżki

**Plik:** `apps/web/src/services/AutosaveService.ts`
- **Singleton** — brak bezpośrednich importów z `supabase.ts`.
- **Brak thumbnail generation** — `executeSave()` woła tylko `this.config.onSave()`, nie generuje blob z Stage.
- `AutosaveService` nie ma dostępu do `stageRef` — potrzebuje `configure()` lub `setStageRef()`.
- `uploadThumbnail()` istnieje w `apps/web/src/lib/supabase.ts` (linia 760), przyjmuje `(projectId: string, file: Blob)` i zwraca `Promise<string | null>`.

### S0.8: Konva.Stage API — decyzja blob

**Plik:** `node_modules/.pnpm/konva@9.3.22/node_modules/konva/lib/Node.d.ts` linia 227

```typescript
toBlob(config?: {
    x?: number; y?: number; width?: number; height?: number;
    pixelRatio?: number; mimeType?: string; quality?: number;
    callback?: (blob: Blob | null) => void;
}): Promise<unknown>;
```

**WNIOSEK: `Konva.Stage.toBlob()` istnieje w Konva 9.3.22** (Stage dziedziczy z Node). Zwraca Promise. Można używać bezpośrednio — NIE potrzebujemy `fetch(dataURL).blob()`.

**Rekomendacja:** Używać `stage.toBlob({ pixelRatio: 0.25, mimeType: 'image/png' })` zamiast `fetch(stage.toDataURL()).blob()`.

### S0.9: showLabel i label rendering w PlayerNode

**Plik:** `packages/board/src/PlayerNode.tsx` linia 521-560

**Mechanizm renderowania podpisu zawodnika:**

1. **Na zawodniku (na body):** Gdy `showLabel=true` i `label` istnieje LUB gdy `number` nie jest null — wyświetla na środku ciała, z rotacją (flip dla readability).
   ```tsx
   {((player.showLabel && player.label) || player.number != null) && (
     <Group rotation={textRotation} listening={false}>
       <Text text={player.showLabel && player.label ? player.label : String(player.number)} ... />
     </Group>
   )}
   ```

2. **Pod zawodnikiem (below body):** Gdy `label` istnieje i `showLabel=false` (lub undefined) — wyświetla label poniżej ciała, NIE rotuje.
   ```tsx
   {player.label && !player.showLabel && (
     <Text x={-30} y={r + 4} width={60} text={player.label} ... />
   )}
   ```

**Domyślne zachowanie `showLabel`:**
- Typ: `boolean | undefined` (opcjonalne pole w `PlayerElement`)
- Gdy `undefined` → traktowane jako `false` → numer na zawodniku, label pod spodem (jeśli istnieje)
- Gdy `true` → label na zawodniku zamiast numeru, label NIE jest pokazywany pod spodem
- Gdy `false` → numer na zawodniku, label pod spodem (jeśli istnieje)

**Efekt:** Label jest renderowany **W DWÓCH MIEJSCACH** — na zawodniku (gdy showLabel=true) lub pod zawodnikiem (gdy showLabel=false). To oznacza, że zawodnik może mieć jednocześnie numer na sobie i label pod spodem.

## Napotkane problemy
- Ścieżka workspace ma trailing space ("TMC Studio ") — to utrudniło pierwsze odczyty, ale po użyciu proper ścieżek wszystko działa.
- `toBlob` w Konva dziedziczy z `Node` → `Stage` ma tę metodę. Zwraca Promise.

## Evidence
- Wszystkie komponenty przeczytane i zweryfikowane
- Konva Stage types: `toBlob` istnieje z callback i Promise API
- `toggleAutoNumbering` — potwierdzony BUG: brak pushHistory
- `uploadThumbnail` — istnieje w supabase.ts, nieużywany przez AutosaveService
- `deleteSelected` — NIE woła renumberAllArrows (funkcja nie istnieje), woła pushHistory

## Wynik

### Potwierdzone ścieżki (OK)
| Obszar | Status | Uwagi |
|--------|--------|-------|
| TextNode.tsx | ✅ | `<Group id={text.id}>` |
| ZoneNode.tsx | ✅ | `<Group id={zone.id}>` + 8-punkt resize |
| PlayerNode.tsx | ✅ | `<Group id={player.id}>` + ALT+drag rotation |
| ArrowNode.tsx | ✅ | `<Group id={arrow.id}>` + endpoint drag |
| BallNode.tsx | ✅ | `<Group id={ball.id}>` |
| historySlice.ts | ✅ | `isContinuous` guard działa, pushHistory blokowany podczas drag |
| deleteSelected | ✅ | woła pushHistory, NIE woła renumberAllArrows |
| showLabel rendering | ✅ | podwójna lokalizacja: na zawodniku (showLabel=true) lub pod spodem (showLabel=false/undefined) |
| Konva Stage.toBlob | ✅ | istnieje w Konva 9.3.22, zwraca Promise |
| uploadThumbnail | ✅ | istnieje w supabase.ts, nieużywany |

### Znalezione problemy (BUGS / ryzyka)
| Problem | Lokalizacja | Ryzyko | Zalecenie |
|---------|-------------|--------|-----------|
| 🔴 **toggleAutoNumbering nie woła pushHistory** | documentSlice.ts:411 | Undo nie cofnie toggle | Dodać `pushHistory()` w Sprint C |
| 🔴 **toggleAutoNumbering nie woła renumberAllArrows** | documentSlice.ts:411 | Włączenie numeracji nie ponumeruje strzałek | Dodać `renumberAllArrows()` (najpierw stworzyć) w Sprint C |
| 🟡 **Brak thumbnail pipeline** | AutosaveService ↔ Konva | Thumbnails nie są generowane przy autosave | Dodać stageRef → toBlob → uploadThumbnail |
| 🟡 **Brak guarda na null stageRef w Autosave** | AutosaveService.ts | Brak sprawdzenia stageRef przed toBlob | Dodać guard przy implementacji thumbnail |
| 🟢 **Autosave nie ma stageRef** | AutosaveService.ts | Nie może wygenerować thumbnail | Dodać configure({ stageRef }) lub setStageRef() |

### Rekomendacja kolejnych sprintów

1. **Sprint A — Quick wins** (4.5h) — małe ryzyko, niezależne zmiany (cursor, aria, toast, font-size)
2. **Sprint B — Spike: Transformer** (POC 2h → max 4h) — tylko TextNode przez `stage.findOne('#id')`
3. **Sprint C — Numeracja + undo** (6h) — stworzyć `renumberAllArrows()`, naprawić `toggleAutoNumbering` (pushHistory + warunek), test undo
4. **Sprint D — Reszta** (8-12h) — thumbnail pipeline (stage.toBlob → uploadThumbnail), ewentualnie FAB/tutorial

### Priorytet naprawy toggleAutoNumbering
**Przed Sprint C:** toggleAutoNumbering to najpilniejszy fix — bez pushHistory i renumberAllArrows, feature auto-numeracji jest niespójny (undo nie działa, włączenie nie ponumeruje istniejących strzałek). Sugeruję włączyć to do Sprint A jako hotfix.

## Status DoD
- [x] Sprawdzone ścieżki TextNode, ZoneNode, PlayerNode, ArrowNode
- [x] Sprawdzone id/name na Group (wszystkie mają id)
- [x] Sprawdzone historySlice.ts, deleteSelected, pushHistory, toggleAutoNumbering
- [x] Sprawdzony showLabel i renderowanie labela (podwójna lokalizacja potwierdzona)
- [x] Sprawdzony AutosaveService i Konva Stage blob/thumbnail (toBlob istnieje)
- [x] Raport zapisany w thoughts/

## Dla następnej iteracji / następnego agenta
- Sprint C musi naprawić toggleAutoNumbering (pushHistory + renumberAllArrows)
- Pipeline thumbnail: stage.toBlob({pixelRatio: 0.25}) → uploadThumbnail(projectId, blob)
- Konva Stage.toBlob zwraca Promise — można użyć async/await