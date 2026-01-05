# TMC Studio - Next Task

## 🔄 Handoff - Context 81%

### ✅ Ukończone w tej sesji:
1. **S4.5 Pitch Views & Line Controls**
   - Dodano typy `PitchView` i `PitchLineSettings` w types.ts
   - Dodano `DEFAULT_PITCH_SETTINGS`, `DEFAULT_LINE_SETTINGS`, `PLAIN_PITCH_LINES`
   - Zaktualizowano Pitch.tsx z conditional rendering dla wszystkich linii boiska
   - Dodano UI w PitchPanel: View selector dropdown + Line toggles checkboxes
   - Przyciski "All" / "None" dla szybkiego toggle linii
   - Skrót klawiszowy `V` = cyklowanie widoków (Full → Plain → Half-left → Half-right)
   - Zaktualizowano CheatSheetOverlay

### Commits:
- `ab8494c` - feat(S4.5): Add pitch views and line visibility controls
- `aa672fc` - feat(S4.5): Add V keyboard shortcut for pitch view cycling

### Build: 5/5 ✅

---

## ⏳ Następne zadania (kolejność priorytetów):

### 1. GIF Export Fix (S4.4 niezakończone)
**Problem:** gif.js nie działa w Vite bundled builds (worker issues)

**Opcje rozwiązania:**
- A) Zastąpić gif.js biblioteką `modern-gif` lub `gifenc`
- B) Inline worker jako blob

**Pliki:**
- `apps/web/src/utils/exportUtils.ts`
- `apps/web/src/types/gif.js.d.ts`

---

### 2. Pitch Viewbox Clipping (S4.5 rozszerzenie)
**Cel:** viewBox dla widoków half-left, half-right, penalty-area, etc.

Obecnie View selector zmienia `view`, ale nie obcina boiska.
Można użyć Konva clipFunc lub zmienić viewBox na SVG.

---

### 3. S4.6 Player Labels & Customization
- Custom labels dla graczy (pozycje: GK, CB, CM)
- Font size, kolor tekstu
- Opacity slider dla elementów

---

### 4. S4.7 Grid & Snap
- Magnetyczna siatka
- Snap to grid toggle (G)
- Wyrównanie elementów

---

## 📊 Status Roadmap Section 4

| Feature | Status |
|---------|--------|
| S4.1 Team editor | ✅ Done |
| S4.2 Pitch themes | ✅ Done |
| S4.3 Multi-step | ✅ Done |
| S4.4 Export PNG/PDF/SVG | ✅ Done |
| S4.4 Export GIF | ❌ Worker issue |
| S4.5 Pitch views | ✅ Done |
| S4.5 Line controls | ✅ Done |
| S4.6 Labels | ⏳ Pending |
| S4.7 Grid & Snap | ⏳ Pending |

---

**Handoff done → `tasks/NEXT_TASK.md`**
