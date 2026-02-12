# Diagnoza architektoniczna TMC Studio – 6 problemów

> **Status:** Diagnoza kompletna. Czekam na sygnał do implementacji.
> **Data:** 2026-02-12

---

## Podsumowanie problemów

| # | Problem | Warstwa | Severity |
|---|---|---|---|
| 1 | Toggle "Show orientation" i "Show arms" wpływają na siebie | view + store | Medium |
| 2 | Skróty V / Shift+V nie działają lub niestabilnie | view | High |
| 3 | Wizja zawodnika zbyt słabo widoczna | view | Medium |
| 4 | Podfoldery w Projects UI nie widoczne | view + store | Medium |
| 5 | Przy zmniejszeniu okna boisko jest ucinane | view | **High (UX blocker)** |
| 6 | Przy zmianie orientacji elementy nie transformują się spójnie | store | **High (data corruption)** |

---

## 1. Toggle „Show orientation" i „Show arms" wpływają na siebie

**Warstwa:** view (`RightInspector.tsx`) + store (`documentSlice.ts`)

### Przyczyna główna

1. **Brak `showVision` w `RightInspector` props** – typ to:
   ```ts
   playerOrientationSettings?: { enabled: boolean; showArms: boolean; zoomThreshold: number };
   ```
   Brak `showVision`! W `PlayerOrientationSettings` (types.ts) jest pełny:
   ```ts
   { enabled: boolean; showArms: boolean; showVision: boolean; zoomThreshold: number }
   ```

2. **Brak toggle UI dla `showVision`** w inspectorze – jest tylko `enabled` i `showArms`.

3. **UX confusion:** Gdy `enabled` jest `false`, `showArms` toggle jest `disabled` wizualnie, ale stan `showArms: true` jest zachowany. Kliknięcie `enabled` ON → arms już były ON → wizualnie arms "same się włączają".

### ✅ Fix (z korekt użytkownika)

- Dodać `showVision` do `RightInspector` (typ + toggle UI)
- W `PlayerNode` renderować:
  - orientation wedge/vision **tylko gdy `enabled=true`**
  - arms **tylko gdy `enabled=true && showArms=true`**
- Wtedy nie ma "magii" po ponownym ON, nawet jeśli stan `showArms` był zachowany

### Pliki do zmiany
- `packages/ui/src/RightInspector.tsx` – dodać `showVision` prop i toggle
- `packages/board/src/PlayerNode.tsx` – upewnić się że arms/vision tylko gdy enabled=true

---

## 2. Skróty V oraz Shift+V nie działają lub działają niestabilnie

**Warstwa:** view (`useKeyboardShortcuts.ts`)

### Przyczyna główna

1. **Podwójne przechwytywanie klawisza `V`** – W `switch(key)`:
   ```ts
   case 'v':
     if (isCmd) { pasteClipboard(); }
     break;
   ```
   A potem po switch:
   ```ts
   if (e.code === 'KeyV' && !isCmd) { ... }
   ```
   Teoretycznie powinno działać, ale...

2. **Focus guard** – Jeśli focus jest na `<input>`, `<textarea>` lub `contentEditable`, skróty są ignorowane. User może być w inspector input.

3. **Brak `orientationEnabled` check** – Skrót `V` toggleuje `player.showVision` niezależnie od tego, czy `playerOrientationSettings.enabled` jest `true`. User widzi toast ale nic się nie zmienia wizualnie.

4. **Możliwe `preventDefault()` wcześniej** – Jeśli masz global handler dla "v" w innym miejscu, V może być "zjedzone" zanim dotrze do bloku `e.code === 'KeyV'`.

### ✅ Fix (z korekt użytkownika)

- Scentralizować V-handling w jednej gałęzi (bez duplikatów)
- Dodać guard `orientationEnabled` + toast wyjaśniający
- Sprawdzić czy nie ma innego handlera zjadającego V

### Pliki do zmiany
- `apps/web/src/hooks/useKeyboardShortcuts.ts`

---

## 3. Wizja zawodnika jest zbyt słabo widoczna

**Warstwa:** view (`PlayerNode.tsx`)

### Przyczyna główna

W `renderVision()`:
```tsx
<Wedge
  radius={120}
  angle={60}
  fill={colors.fill}     // Team color
  opacity={0.14}          // ← 14% opacity - za niskie!
  listening={false}
/>
```

**Problemy:**
1. **`opacity: 0.14`** – zbyt niskie, przy jasnych kolorach praktycznie niewidoczne
2. **Brak stroke** – wedge nie ma obramowania
3. **`radius: 120` stały** – nie skaluje się z zoomem/player.radius
4. **`fill={colors.fill}`** – na zielonym boisku daje muddy color

### ✅ Fix

- Opacity 0.22-0.30
- Dodać delikatny `stroke` z wyższym opacity
- Rozważyć skalowanie radius z `player.radius`

### Pliki do zmiany
- `packages/board/src/PlayerNode.tsx`

---

## 4. Podfoldery w Projects UI nie są widoczne

**Warstwa:** store (supabase model) + view (`ProjectsDrawer.tsx`)

### Przyczyna główna

Backend model **ma** `parent_id` w `ProjectFolder`:
```ts
export interface ProjectFolder {
  parent_id: string | null;
  ...
}
```

Ale **UI nie obsługuje hierarchii!** `FolderItem` interface:
```ts
export interface FolderItem {
  id: string;
  name: string;
  color: string;
  // ❌ Brak parent_id / children
}
```

Renderer wyświetla flat list – brak rekurencji, indentacji, rozwijania.

### ✅ Fix

- Dodać `parentId` do `FolderItem`
- Zbudować tree structure w rendererze
- Nested display z indent

### Pliki do zmiany
- `packages/ui/src/ProjectsDrawer.tsx`
- `apps/web/src/hooks/useProjectsController.ts` – mapper folders

---

## 5. Przy zmniejszeniu okna boisko jest ucinane i nie można go przesunąć

**Warstwa:** view (`BoardPage.tsx`, `BoardCanvasSection.tsx`)

### Przyczyna główna

Zoom jest CSS `transform: scale()` na fixed-size canvas:

```tsx
// BoardCanvasSection.tsx
<div 
  className="shadow-canvas rounded-[20px] overflow-hidden ..."
  style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
>
```

**Problemy:**
1. **CSS `transform: scale()` nie zmienia layout size** – przeglądarka traktuje element jako 1130×760px
2. **`transformOrigin: 'center'`** – przeskalowany element "wystaje" symetrycznie, scroll nie ma dostępu
3. **`overflow-hidden` na BoardCanvasSection** – ucina overflow
4. **`zoomFit` jest hardcode `set({ zoom: 1 })`** – nie oblicza rzeczywistego fit
5. **Brak pan/drag na stage**

### ✅ Must-do fix (z korekt użytkownika)

**Odejść od CSS `transform: scale()` na wrapperze** → zoom/fit liczyć pod Stage:
- Albo: fizyczny resize Stage width/height × zoom
- Albo: pan + poprawny scroll origin
- Auto-zoom-fit na resize: `computeFitZoom = min(containerW/canvasW, containerH/canvasH)`

### Pliki do zmiany
- `apps/web/src/app/board/BoardCanvasSection.tsx`
- `apps/web/src/app/board/BoardPage.tsx`
- `apps/web/src/store/useUIStore.ts` – `zoomFit()`

---

## 6. Przy zmianie orientacji pitch elementy nie transformują się spójnie

**Warstwa:** store (`documentSlice.ts`)

### Przyczyna główna

Transform logic w `documentSlice.updatePitchSettings()` ma luki:

1. **`DrawingElement` nie jest transformowany** – `drawing` ma `points: number[]` – nie są transformowane
2. **`TextElement`** – obraca się geometrycznie, ale tekst po obróceniu będzie pod kątem 90°
3. **Brak transformacji `player.orientation`** – jeśli player patrzył na prawo (90°) w landscape, po portrait powinien patrzeć w dół (180°), ale:
   ```ts
   if (el.type === 'equipment') { next.rotation = ... } // ← tylko equipment!
   ```
   Brak `if (el.type === 'player' && el.orientation !== undefined)`

### ✅ Must-do fix (z korekt użytkownika)

- Transform dla `drawing.points[]` (każdy punkt ×2)
- Rotate dla `player.orientation` (±90°)
- Text alignment fix / rotation

### Pliki do zmiany
- `apps/web/src/store/slices/documentSlice.ts` – `transformBoardElement()`

---

# Proponowana kolejność napraw (zaktualizowana)

**Priorytet produkcyjny** (z korekt użytkownika):

| Pozycja | PR | Problem | Razionale |
|---|---|---|---|
| **1** | PR-FIX-4 | Pitch clipping/overflow | **UX blocker** – na małych oknach app wygląda jak zepsuta |
| **2** | PR-FIX-5 | Orientation transform gaps | **Data corruption** – drawing + player.orientation psuje stan |
| **3** | PR-FIX-1 | V / Shift+V shortcuts | User confusion, ale nie psuje danych |
| **4** | PR-FIX-3 | Inspector showVision + zależności | UX confusion z toggleami |
| **5** | PR-FIX-2 | Vision visibility | Czysto wizualne |
| **6** | PR-FIX-6 | Subfolders UI | Nowa feature, może poczekać |

---

# Must-do w każdym PR (żeby nie wróciło)

## PR-FIX-4: Pitch clipping / scaling

- [ ] Odejść od CSS `transform: scale()` na wrapperze
- [ ] Zoom/fit liczyć pod Stage (fizyczny resize LUB pan + poprawny scroll origin)
- [ ] `zoomFit()` = `min(containerW/canvasW, containerH/canvasH)`
- [ ] Responsive behavior na window resize

## PR-FIX-5: Orientation transform gaps ✅ COMPLETE

- [x] Transform dla `drawing.points[]` (iteracja po parach x,y)
- [x] Rotate dla `player.orientation` (±90° zależnie od direction)
- [x] Text alignment/rotation fix
- [x] Unit test dla `transformBoardElement()`

**Status:** ✅ DONE (2026-02-12)  
**See:** `docs/PR-FIX-5-ORIENTATION-TRANSFORM-COMPLETE.md`

## PR-FIX-1: V / Shift+V shortcuts

- [ ] Scentralizować V-handling w jednej gałęzi
- [ ] Guard `orientationEnabled` + toast wyjaśniający
- [ ] Sprawdzić czy nie ma innego handlera zjadającego V
- [ ] Focus auto-blur inspector inputs on canvas click (opcjonalne)

## PR-FIX-3: Inspector showVision + zależności

- [ ] Spójny kontrakt `PlayerOrientationSettings` (enabled/showArms/showVision/zoomThreshold) w typach
- [ ] Dodać `showVision` do RightInspector props
- [ ] Toggle UI dla `showVision` w inspector
- [ ] PlayerNode: arms/vision tylko gdy `enabled=true`

## PR-FIX-2: Vision visibility

- [ ] Opacity 0.14 → 0.22-0.30
- [ ] Dodać stroke z wyższym opacity
- [ ] Rozważyć skalowanie radius z player.radius

## PR-FIX-6: Subfolders UI

- [ ] Dodać `parentId` do `FolderItem` interface
- [ ] Mapper w useProjectsController zachowuje `parent_id`
- [ ] Tree structure builder w rendererze
- [ ] Nested display z indent/collapse

---

# Status

| PR | Status |
|---|---|
| PR-FIX-4 | ✅ COMPLETE (2026-02-12) |
| PR-FIX-5 | ✅ COMPLETE (2026-02-12) |
| PR-FIX-1 | ⏳ Czeka na sygnał |
| PR-FIX-3 | ⏳ Czeka na sygnał |
| PR-FIX-2 | ⏳ Czeka na sygnał |
| PR-FIX-6 | ⏳ Czeka na sygnał |

---

**Następny krok:** Czekam na sygnał do rozpoczęcia implementacji PR-FIX-4 (pitch clipping).
