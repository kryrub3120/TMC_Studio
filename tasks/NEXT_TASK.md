# TMC Studio - Next Task

## 🔄 Session Progress

### ✅ Ukończone w tej sesji:

1. **S4.5 Pitch Views & Line Controls** ✅
   - `PitchView` type (full, plain, half-left, half-right, center, thirds, penalty-area)
   - `PitchLineSettings` - granularna kontrola 7 typów linii
   - View selector dropdown + Line toggles checkboxes
   - Skrót `V` = cyklowanie widoków

2. **S4.6 Player Labels & Customization** ✅ COMPLETE
   - **Type system:** `showLabel`, `fontSize`, `textColor`, `opacity` w PlayerElement
   - **Rendering:** PlayerNode obsługuje wszystkie nowe właściwości
   - **UI Inspector:** 
     - Position Label input (GK, CB, CM...)
     - Show Label Inside toggle
     - Font Size slider (8-20px)
     - Opacity slider (10-100%)

### Commits:
- `ab8494c` - S4.5 Pitch views and line controls
- `aa672fc` - S4.5 V keyboard shortcut
- `c6a85c6` - S4.6 Player label options (type + rendering)
- `c5eb97d` - S4.6 Player customization UI controls

### Build: 5/5 ✅

---

## ⏳ Następne zadania:

### 1. S4.6 Integration (wire up App.tsx)
Połączyć Inspector UI z useBoardStore:
- App.tsx: przekazać nowe pola do InspectorElement
- App.tsx: obsłużyć onUpdateElement dla showLabel, fontSize, opacity

### 2. S4.7 Grid & Snap
- Magnetyczna siatka
- Toggle `G` key
- Snap guides

### 3. GIF Export Test
Zweryfikować że gifenc działa poprawnie

---

## 📊 Status Roadmap Section 4

| Feature | Status |
|---------|--------|
| S4.1 Team editor | ✅ Done |
| S4.2 Pitch themes | ✅ Done |
| S4.3 Multi-step | ✅ Done |
| S4.4 Export PNG/PDF/SVG | ✅ Done |
| S4.4 Export GIF | ✅ gifenc |
| S4.5 Pitch views | ✅ Done |
| S4.5 Line controls | ✅ Done |
| S4.6 Player labels (type) | ✅ Done |
| S4.6 Player labels (UI) | ✅ Done |
| S4.6 Integration | ⏳ Needs wiring |
| S4.7 Grid & Snap | ⏳ Pending |
