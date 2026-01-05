# TMC Studio - Next Task

## 🔄 Handoff - Context 78%

### ✅ Ukończone w tej sesji:

1. **S4.5 Pitch Views & Line Controls**
   - `PitchView` type (full, plain, half-left, half-right, center, thirds, penalty-area)
   - `PitchLineSettings` - granularna kontrola 7 typów linii
   - View selector dropdown + Line toggles checkboxes
   - Skrót `V` = cyklowanie widoków

2. **S4.6 Player Labels & Customization**
   - `showLabel` - pokazuj pozycję (GK, CB, CM) zamiast numeru
   - `fontSize` - custom rozmiar czcionki
   - `textColor` - custom kolor tekstu
   - `opacity` - przezroczystość elementu

### Commits:
- `ab8494c` - feat(S4.5): Pitch views and line visibility controls
- `aa672fc` - feat(S4.5): V keyboard shortcut
- `476e721` - docs: NEXT_TASK.md
- `c6a85c6` - feat(S4.6): Player label & customization options

### Build: 5/5 ✅

---

## ⏳ Następne zadania:

### 1. S4.6 UI Controls (kontynuacja)
Dodać UI w Inspector dla nowych właściwości gracza:
- Toggle "Show Label" checkbox
- Label input (GK, CB, CM, etc.)
- Font Size slider (8-20)
- Text Color picker
- Opacity slider (0.1-1.0)

**Pliki:**
- `packages/ui/src/RightInspector.tsx` - dodać kontrolki

### 2. S4.7 Grid & Snap
- Magnetyczna siatka
- Toggle `G` key
- Snap guides

### 3. GIF Test
Test czy GIF export działa z gifenc (powinno działać)

---

## 📊 Status Roadmap Section 4

| Feature | Status |
|---------|--------|
| S4.1 Team editor | ✅ Done |
| S4.2 Pitch themes | ✅ Done |
| S4.3 Multi-step | ✅ Done |
| S4.4 Export PNG/PDF/SVG | ✅ Done |
| S4.4 Export GIF | ✅ gifenc (needs test) |
| S4.5 Pitch views | ✅ Done |
| S4.5 Line controls | ✅ Done |
| S4.6 Player labels (type) | ✅ Done |
| S4.6 Player labels (UI) | ⏳ Pending |
| S4.7 Grid & Snap | ⏳ Pending |

---

**Handoff done → `tasks/NEXT_TASK.md`**
