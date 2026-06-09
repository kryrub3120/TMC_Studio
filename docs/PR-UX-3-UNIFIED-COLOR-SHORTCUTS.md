# PR-UX-3: Unified Color Shortcuts

**Status:** ✅ COMPLETE (100%)  
**Type:** UX Enhancement  
**Scope:** Color cycling for all element types

---

## 📋 Overview

Extended the `cycleSelectedColor()` function to work with ALL element types (Text and Players), not just Arrows/Zones/Drawings. This provides a consistent UX across the entire application.

---

## ✅ Implementation Summary

### **What Was Done:**

**File:** `apps/web/src/store/useBoardStore.ts`

Extended `cycleSelectedColor(direction)` to handle:

1. **Text Elements** - Cycles `color` property
2. **Player Elements** - Cycles `textColor` property (overrides team color)
3. **Arrows** - Already supported (cycles `color`)
4. **Zones** - Already supported (cycles `fillColor`)
5. **Drawings** - Already supported (cycles `color`)

### **Code Changes:**

```typescript
cycleSelectedColor: (direction) => {
  const { selectedIds } = get();
  if (selectedIds.length === 0) return;
  
  // PR-UX-3: Expanded color palette for all element types
  const COLORS = ['#ff0000', '#ff6b6b', '#00ff00', '#3b82f6', '#eab308', '#f97316', '#ffffff'];
  
  set((state) => ({
    elements: state.elements.map((el) => {
      if (selectedIds.includes(el.id)) {
        // ... existing code for Arrows, Zones, Drawings ...
        
        // PR-UX-3: Text elements have color property
        if (isTextElement(el)) {
          const current = el.color ?? '#ffffff';
          const currentIndex = COLORS.indexOf(current);
          const newIndex = currentIndex === -1 
            ? 0 
            : (currentIndex + direction + COLORS.length) % COLORS.length;
          return { ...el, color: COLORS[newIndex] };
        }
        
        // PR-UX-3: Players have textColor override (or team color)
        if (isPlayerElement(el)) {
          // ✅ ETAP 1: getTeamSettings() → użyj `s.document.teamSettings` jako selektor w komponentach
          const teamSettings = get().getTeamSettings();
          const current = el.textColor ?? teamSettings?.[el.team].primaryColor ?? '#ffffff';
          const currentIndex = COLORS.indexOf(current);
          const newIndex = currentIndex === -1 
            ? 0 
            : (currentIndex + direction + COLORS.length) % COLORS.length;
          return { ...el, textColor: COLORS[newIndex] };
        }
      }
      return el;
    }),
  }));
  get().pushHistory();
},
```

---

## 🎮 User Interface

### **Keyboard Shortcuts** (Already Exist in App.tsx)

- **`Alt+↑`** - Previous color
- **`Alt+↓`** - Next color

Works for ALL element types now!

### **Color Palette:**

```typescript
const COLORS = [
  '#ff0000',  // Strong Red
  '#ff6b6b',  // Light Red
  '#00ff00',  // Green
  '#3b82f6',  // Blue
  '#eab308',  // Yellow
  '#f97316',  // Orange
  '#ffffff',  // White
];
```

---

## 🔧 Technical Details

### **How It Works:**

1. **Text Elements:**
   - Property: `color`
   - Default: `#ffffff` (white)
   - Cycles through palette

2. **Player Elements:**
   - Property: `textColor` (new override)
   - Default: Team color (from teamSettings)
   - Cycles through palette
   - Overrides team color when set

3. **Existing Types:**
   - Arrows: `color` property
   - Zones: `fillColor` property
   - Drawings: `color` property

### **Backward Compatibility:**

✅ **No breaking changes:**
- `textColor` is optional on PlayerElement
- Falls back to team color if not set
- Existing documents work without modification

---

## ✅ Testing Checklist

- [x] **Arrow:** Alt+↓ → color cycles ✓
- [x] **Zone:** Alt+↓ → fillColor cycles ✓
- [x] **Drawing:** Alt+↓ → color cycles ✓
- [x] **Text:** Alt+↓ → color cycles ✓ (NEW)
- [x] **Player:** Alt+↓ → textColor cycles ✓ (NEW)
- [x] Undo/Redo works for all color changes
- [x] Changes persist after save/load

---

## 🚀 Usage Examples

### **Text Color Change**
```typescript
// Select text element
// Press Alt+↓ → text color changes
// Press Alt+↑ → previous color
```

### **Player Number Color**
```typescript
// Select player
// Press Alt+↓ → number color changes (overrides team color)
// Press Alt+↑ → previous color
```

### **Quick Workflow:**
1. Add player (P)
2. Select player
3. Alt+↓ repeatedly → cycle through colors to find perfect match
4. Result: Player with custom number color!

---

## 📊 Impact

**User Benefits:**
- ✅ Consistent color shortcuts across ALL elements
- ✅ No need to remember different shortcuts for different types
- ✅ Faster workflow - keyboard-driven color changes
- ✅ Visual customization without opening menus

**Developer Benefits:**
- ✅ Single function handles all types
- ✅ Easy to maintain
- ✅ Extensible for future element types

---

## 🎯 Success Criteria

✅ **COMPLETE:**
- [x] Text color cycling works
- [x] Player textColor override works
- [x] Existing element types still work
- [x] Undo/redo integration
- [x] Backward compatibility maintained

---

## 👥 Related Work

- **PR-UX-1:** Guest Login Sync ✅
- **PR-UX-2:** Layer Control ✅
- **PR-UX-3:** Unified Color Shortcuts ✅ (THIS PR)
- **PR-UX-4:** Zone Border Styles (next)
- **PR-UX-5:** Canvas Context Menu (next)

---

## 📚 References

- **Architecture:** `docs/ARCHITECTURE_OVERVIEW.md`
- **UX Analysis:** `docs/UX_ISSUES_ANALYSIS.md`
- **Implementation Plan:** `docs/UX_IMPLEMENTATION_PLAN.md`
- **Project Rules:** `.clinerules/project_rules_custom_instruction.md`

---

## 💡 Future Enhancements

**Optional improvements:**
1. **Visual Color Picker:** UI widget for mouse-driven color selection
2. **Color Presets:** Save favorite colors for quick access
3. **Team Color Templates:** Define custom team color palettes
4. **Gradient Support:** Animate color transitions between steps

---

**Completion:** 2026-01-26  
**Effort:** ~30 minutes (quick win!)  
**ROI:** High (improves consistency across entire app)
