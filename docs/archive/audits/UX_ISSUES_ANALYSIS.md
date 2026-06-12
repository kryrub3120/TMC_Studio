 # UX Issues Analysis - TMC Studio
**Date:** 26.01.2026  
**Author:** Code Review & User Testing

## Executive Summary

During user testing, 5 critical UX issues were identified that significantly impact the user experience. These issues range from data loss risks (P1) to missing expected features (P2-P5). This document analyzes each issue, identifies root causes, and proposes solutions.

---

## 🔴 Problem 1: Guest Drawing Not Saved After Login (CRITICAL - P1)

### Issue Description
**User Flow:**
1. Guest user creates a tactical board with multiple elements
2. User realizes they need to save → logs in/signs up
3. After login, the drawing is visible but NOT automatically saved to cloud
4. If user doesn't manually edit something, autosave never triggers
5. User closes browser → drawing is lost

**User Impact:**
- **Data loss risk** - work can be lost
- **Trust damage** - user did exactly what was asked (logged in) but still lost data
- **Conversion blocker** - discourages signup if first experience is losing work

### Root Cause Analysis

**File:** `apps/web/src/store/useAuthStore.ts`

```typescript
// In onAuthStateChange callback (line ~80)
onAuthStateChange(async (user) => {
  console.log('[Auth] State changed - user:', user?.email ?? 'none');
  
  set({
    user,
    isAuthenticated: !!user,
    isPro: user?.subscription_tier === 'pro' || user?.subscription_tier === 'team',
    isTeam: user?.subscription_tier === 'team',
  });

  // Load preferences from cloud if user is authenticated
  if (user) {
    // ⚠️ ONLY loads preferences (theme, grid, snap)
    // ⚠️ DOES NOT sync local document to cloud
    const cloudPrefs = await getPreferences();
    // ...
  }
});
```

**File:** `apps/web/src/store/useBoardStore.ts`

```typescript
// Autosave only triggers after markDirty() is called
markDirty: () => {
  set({ isDirty: true });
  get().scheduleAutoSave();
},

// markDirty is called ONLY by pushHistory()
pushHistory: () => {
  // ...
  get().markDirty(); // ← Only way to trigger autosave
},

// pushHistory is called ONLY by edit actions
// NOT by login event
```

**The Problem:**
1. After login, auth state changes but board state doesn't become "dirty"
2. No trigger to check if local document should be synced to cloud
3. Autosave waits for first edit, which may never come

### Proposed Solution

**Approach: Post-Login Auto-Sync**

1. **Detect unsaved work** in `useAuthStore.initialize()` after successful login
2. **Prompt user** if they want to save their current work to cloud
3. **Auto-save** to cloud if confirmed

**Implementation Plan:**

```typescript
// In useAuthStore.ts - onAuthStateChange callback

if (user) {
  // ... existing preference loading ...
  
  // NEW: Check if there's unsaved work from guest session
  const { useBoardStore } = await import('./useBoardStore');
  const currentDoc = useBoardStore.getState().document;
  const hasLocalWork = currentDoc.steps[0]?.elements.length > 0;
  const notSavedToCloud = !useBoardStore.getState().cloudProjectId;
  
  if (hasLocalWork && notSavedToCloud) {
    // Prompt user to save
    const shouldSave = window.confirm(
      'You have unsaved work from your guest session. Would you like to save it to your cloud account?'
    );
    
    if (shouldSave) {
      console.log('[Auth] Auto-saving guest work to cloud...');
      const success = await useBoardStore.getState().saveToCloud();
      if (success) {
        await useBoardStore.getState().fetchCloudProjects();
        console.log('[Auth] Guest work saved to cloud ✓');
      }
    }
  }
}
```

**Alternative Approaches Considered:**

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Auto-save silently | Seamless UX | May create unwanted projects | ❌ Rejected |
| Always prompt | User control | Extra click | ✅ **Selected** |
| Show banner | Non-blocking | Easy to miss | ❌ Rejected |

---

## 🔴 Problem 2: No Layer Order Control (Z-Index) (HIGH - P2)

### Issue Description
**User Scenario:**
> "I put a zone over the penalty area to highlight the attacking space, then added text labels. The zone covers the text! I tried moving the text, but it's still under the zone. There's no way to bring the text to front."

**Current Limitations:**
- Rendering order is **hardcoded** by element type
- Elements render in fixed layers: `zones → arrows → players → ball → equipment → text → drawings`
- No per-element z-index
- No "Bring to Front" / "Send to Back" functionality

### Root Cause Analysis

**File:** `packages/core/src/types.ts`

```typescript
export interface BoardElement = 
  PlayerElement | BallElement | ArrowElement | 
  ZoneElement | TextElement | DrawingElement | EquipmentElement;

// ⚠️ MISSING: zIndex property
```

**File:** `apps/web/src/App.tsx` (line ~1400+)

```tsx
<Layer>
  <Pitch />
  
  {/* HARDCODED order - zones always on bottom */}
  {elements.filter(isZoneElement).map(...)}      // Layer 1
  {elements.filter(isArrowElement).map(...)}     // Layer 2
  {elements.filter(isPlayerElement).map(...)}    // Layer 3
  {elements.filter(isBallElement).map(...)}      // Layer 4
  {elements.filter(isEquipmentElement).map(...)} // Layer 5
  {elements.filter(isTextElement).map(...)}      // Layer 6
  {elements.filter(isDrawingElement).map(...)}   // Layer 7
</Layer>
```

**Why This Was Done:**
- Simplifies rendering logic
- Ensures common sense defaults (zones under players, etc.)
- Avoids z-fighting issues

**Why Users Need Control:**
- Zone can cover text labels → unreadable
- Text can be under equipment → need to bring forward
- Aesthetic control (layering for visual effect)

### Proposed Solution

**Phase 1: Add Z-Index Support**

1. **Update core types:**

```typescript
// packages/core/src/types.ts
export interface BoardElementBase {
  id: ElementId;
  position: Position;
  zIndex?: number; // Optional for backward compatibility
}

// Default z-indexes by type (if not set)
export const DEFAULT_Z_INDEXES = {
  zone: 10,
  arrow: 20,
  drawing: 30,
  player: 40,
  ball: 50,
  equipment: 60,
  text: 70,
};
```

2. **Update store actions:**

```typescript
// apps/web/src/store/useBoardStore.ts

bringToFront: (id: ElementId) => {
  const maxZ = Math.max(...elements.map(el => el.zIndex ?? 0));
  set(state => ({
    elements: state.elements.map(el => 
      el.id === id ? { ...el, zIndex: maxZ + 1 } : el
    )
  }));
  get().pushHistory();
},

sendToBack: (id: ElementId) => {
  const minZ = Math.min(...elements.map(el => el.zIndex ?? 0));
  set(state => ({
    elements: state.elements.map(el => 
      el.id === id ? { ...el, zIndex: minZ - 1 } : el
    )
  }));
  get().pushHistory();
},

bringForward: (id: ElementId) => {
  // Move up one position in z-order
},

sendBackward: (id: ElementId) => {
  // Move down one position in z-order
},
```

3. **Update rendering:**

```tsx
// App.tsx - replace type-based filtering with z-index sorting

const sortedElements = useMemo(() => {
  return [...elements].sort((a, b) => {
    const aZ = a.zIndex ?? DEFAULT_Z_INDEXES[a.type];
    const bZ = b.zIndex ?? DEFAULT_Z_INDEXES[b.type];
    return aZ - bZ;
  });
}, [elements]);

<Layer>
  <Pitch />
  {sortedElements.map(element => {
    if (isZoneElement(element)) return <ZoneNode ... />;
    if (isArrowElement(element)) return <ArrowNode ... />;
    // etc.
  })}
</Layer>
```

**Phase 2: Add UI Controls**

1. **Context Menu** (Problem 5)
2. **Inspector Panel** - Layer order section
3. **Keyboard Shortcuts:**
   - `Cmd+Shift+]` → Bring to Front
   - `Cmd+Shift+[` → Send to Back
   - `Cmd+]` → Bring Forward
   - `Cmd+[` → Send Backward

---

## 🟡 Problem 3: Inconsistent Color Change Shortcuts (MEDIUM - P4)

### Issue Description
**User Feedback:**
> "I can change arrow color with Alt+↑/↓, but I can't change text color the same way. Each element type seems to have different shortcuts. It's confusing."

### Current State

**File:** `apps/web/src/store/useBoardStore.ts`

```typescript
cycleSelectedColor: (direction) => {
  // Works for: arrows, zones, drawings
  // Does NOT work for: text, players
  
  if (isArrowElement(el)) {
    // Changes el.color ✓
  }
  if (el.type === 'zone') {
    // Changes el.fillColor ✓
  }
  if (el.type === 'drawing') {
    // Changes el.color ✓
  }
  // ⚠️ MISSING: text color support
  // ⚠️ MISSING: player textColor support
}
```

**File:** `apps/web/src/hooks/useKeyboardShortcuts.ts`

- `Alt+↑/↓` → `cycleSelectedColor()` (arrows/zones/drawings only)
- `↑/↓` → Text: fontSize (when text selected)
- `←/→` → Text: bold/italic (when text selected)
- **No shortcut for text color!**

### Root Cause
Different element types have different color properties:
- Arrows: `color`
- Zones: `fillColor`, `borderColor`
- Text: `color`
- Players: `textColor` (override of team color)
- Drawings: `color`

The `cycleSelectedColor()` function only handles some of these.

### Proposed Solution

**Unify Color Shortcuts:**

```typescript
// Update cycleSelectedColor to handle ALL types

cycleSelectedColor: (direction) => {
  const COLORS = ['#ff0000', '#ff6b6b', '#00ff00', '#3b82f6', '#eab308', '#f97316', '#ffffff'];
  
  set((state) => ({
    elements: state.elements.map((el) => {
      if (!selectedIds.includes(el.id)) return el;
      
      const getCurrentColor = () => {
        if (isArrowElement(el)) return el.color ?? '#ffffff';
        if (el.type === 'zone') return el.fillColor ?? '#22c55e';
        if (el.type === 'drawing') return el.color ?? '#ff0000';
        if (isTextElement(el)) return el.color ?? '#ffffff'; // NEW
        if (isPlayerElement(el)) return el.textColor ?? teamSettings[el.team].primaryColor; // NEW
        return null;
      };
      
      const currentColor = getCurrentColor();
      if (!currentColor) return el;
      
      const currentIndex = COLORS.indexOf(currentColor);
      const newIndex = (currentIndex + direction + COLORS.length) % COLORS.length;
      const newColor = COLORS[newIndex];
      
      // Apply new color based on element type
      if (isArrowElement(el)) return { ...el, color: newColor };
      if (el.type === 'zone') return { ...el, fillColor: newColor };
      if (el.type === 'drawing') return { ...el, color: newColor };
      if (isTextElement(el)) return { ...el, color: newColor }; // NEW
      if (isPlayerElement(el)) return { ...el, textColor: newColor }; // NEW
      
      return el;
    }),
  }));
}
```

**Keyboard Shortcut Mapping:**

| Shortcut | Action | Works For |
|----------|--------|-----------|
| `Alt+↑` | Previous color | ALL element types |
| `Alt+↓` | Next color | ALL element types |
| `C` | Open color picker (future) | ALL element types |

---

## 🟡 Problem 4: No Line Style Controls for Zones (LOW - P5)

### Issue Description
**User Request:**
> "I want to make some zones with dashed borders (to show optional movement areas) and some with solid borders (to show required zones). How do I change the line style?"

### Current State

**Types exist but no UI:**

```typescript
// packages/core/src/types.ts
export interface ZoneElement {
  // ...
  borderStyle?: 'solid' | 'dashed' | 'none'; // ✓ Exists
  borderColor?: string;                       // ✓ Exists
  // borderWidth?: number;                    // ❌ Missing
}
```

**Rendering works:**

```tsx
// packages/board/src/ZoneNode.tsx
const borderDash = zone.borderStyle === 'dashed' ? [6, 3] : undefined;
const borderStroke = zone.borderStyle !== 'none' ? (zone.borderColor || zone.fillColor) : undefined;

<Rect
  stroke={borderStroke}
  strokeWidth={3} // ⚠️ HARDCODED
  dash={borderDash}
/>
```

**Missing:**
1. UI to change `borderStyle`
2. UI to change `borderColor` (separate from fillColor)
3. Property for `borderWidth` (different thicknesses)
4. Keyboard shortcuts

### Proposed Solution

**Phase 1: Add Missing Property**

```typescript
// packages/core/src/types.ts
export interface ZoneElement {
  // ...
  borderWidth?: number; // NEW: 0-8px range
}
```

**Phase 2: Add Store Actions**

```typescript
// useBoardStore.ts

cycleBorderStyle: () => {
  const STYLES = ['solid', 'dashed', 'none'];
  set((state) => ({
    elements: state.elements.map((el) => {
      if (selectedIds.includes(el.id) && el.type === 'zone') {
        const currentStyle = el.borderStyle || 'solid';
        const currentIndex = STYLES.indexOf(currentStyle);
        const newStyle = STYLES[(currentIndex + 1) % STYLES.length];
        return { ...el, borderStyle: newStyle };
      }
      return el;
    }),
  }));
  get().pushHistory();
},
```

**Phase 3: Add UI Controls**

1. **Inspector Panel** - when zone selected:
   - Border Style dropdown
   - Border Color picker
   - Border Width slider (0-8px)

2. **Keyboard Shortcuts:**
   - `Shift+E` → Cycle border style (solid → dashed → none)
   - `Alt+B` → Toggle border visibility
   - `Alt+←/→` → Adjust border width (already exists for stroke)

---

## 🟡 Problem 5: No Context Menu (RIGHT-CLICK) (MEDIUM - P3)

### Issue Description
**User Expectation:**
> "Right-click should open a quick menu with common actions: delete, duplicate, bring to front, etc. Like in Figma or other design tools."

### Current State

**Context Menu exists but limited:**

```typescript
// packages/ui/src/ContextMenu.tsx
export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  // ✓ Component exists and works well
  // ✓ Used in ProjectsDrawer for project management
  // ❌ NOT used on canvas elements
}
```

**Canvas has no right-click handler:**

```tsx
// App.tsx
<Stage
  onClick={handleStageClick}
  onMouseDown={handleStageMouseDown}
  // ❌ MISSING: onContextMenu
>
```

### Root Cause
- Focus was on keyboard-first workflow (Command Palette)
- Context menu implementation was deprioritized
- Canvas interaction layer needs refactoring for context menu support

### Proposed Solution

**Phase 1: Canvas Context Menu Infrastructure**

```typescript
// New hook: useCanvasContextMenu.ts

export function useCanvasContextMenu() {
  const [menuState, setMenuState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    elementId: string | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    elementId: null,
  });
  
  const showMenu = (e: MouseEvent, elementId: string | null) => {
    e.preventDefault();
    setMenuState({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      elementId,
    });
  };
  
  const hideMenu = () => setMenuState(prev => ({ ...prev, visible: false }));
  
  return { menuState, showMenu, hideMenu };
}
```

**Phase 2: Context Menu Items by Element Type**

```typescript
// utils/contextMenuItems.ts

export function getContextMenuItems(
  element: BoardElement | null,
  handlers: {
    onDelete: () => void;
    onDuplicate: () => void;
    onBringToFront: () => void;
    onSendToBack: () => void;
    onGroup: () => void;
    onLock: () => void;
    // ... more
  }
): ContextMenuItem[] {
  const common: ContextMenuItem[] = [
    { label: 'Delete', icon: '🗑️', onClick: handlers.onDelete, variant: 'danger' },
    { label: 'Duplicate', icon: '📋', onClick: handlers.onDuplicate },
    { divider: true } as ContextMenuItem,
    { label: 'Bring to Front', icon: '⬆️', onClick: handlers.onBringToFront },
    { label: 'Send to Back', icon: '⬇️', onClick: handlers.onSendToBack },
  ];
  
  if (!element) return common; // Empty space menu
  
  // Add type-specific items
  if (isPlayerElement(element)) {
    return [
      { label: 'Change Number', icon: '🔢', onClick: handlers.onChangeNumber },
      { label: 'Switch Team', icon: '🔄', onClick: handlers.onSwitchTeam },
      { divider: true } as ContextMenuItem,
      ...common,
    ];
  }
  
  if (isZoneElement(element)) {
    return [
      { label: 'Change Shape', icon: '◼️', onClick: handlers.onCycleShape },
      { label: 'Border Style', icon: '✏️', onClick: handlers.onBorderStyle },
      { divider: true } as ContextMenuItem,
      ...common,
    ];
  }
  
  return common;
}
```

**Phase 3: Integration**

```tsx
// App.tsx

const { menuState, showMenu, hideMenu } = useCanvasContextMenu();

const handleElementContextMenu = useCallback((e: MouseEvent, elementId: string) => {
  e.preventDefault();
  selectElement(elementId, false); // Select the element
  showMenu(e, elementId);
}, [selectElement, showMenu]);

<Stage
  onContextMenu={(e) => {
    const target = e.target;
    const elementId = target.id();
    
    if (elementId && elementId.startsWith('player-')) {
      handleElementContextMenu(e.evt, elementId);
    } else {
      // Empty space - show generic menu
      showMenu(e.evt, null);
    }
  }}
>

{/* Context Menu Overlay */}
{menuState.visible && (
  <ContextMenu
    x={menuState.x}
    y={menuState.y}
    items={getContextMenuItems(
      elements.find(el => el.id === menuState.elementId) ?? null,
      {
        onDelete: () => { deleteSelected(); hideMenu(); },
        onDuplicate: () => { duplicateSelected(); hideMenu(); },
        // ... more handlers
      }
    )}
    onClose={hideMenu}
  />
)}
```

---

## Implementation Priority & Effort Estimation

| Problem | Impact | Effort | Lines Changed | Priority | PR Name |
|---------|--------|--------|---------------|----------|---------|
| **1. Guest Login Sync** | 🔴 Critical | 🟡 Medium | ~50 | **P1** | `ux-fix-1-guest-login-sync` |
| **2. Z-Index/Layers** | 🔴 High | 🔴 High | ~300 | **P2** | `ux-fix-2-layer-control` |
| **5. Context Menu** | 🟡 Medium | 🟡 Medium | ~200 | **P3** | `ux-fix-5-context-menu` |
| **3. Color Shortcuts** | 🟢 Low | 🟢 Low | ~80 | **P4** | `ux-fix-3-unified-colors` |
| **4. Zone Line Styles** | 🟢 Low | 🟢 Low | ~100 | **P5** | `ux-fix-4-zone-borders` |

### Recommended Implementation Order

1. **PR-UX-1**: Guest Login Sync (CRITICAL - prevents data loss)
2. **PR-UX-2**: Layer Control (HIGH - major feature gap)
3. **PR-UX-3**: Unified Color Shortcuts (LOW - polish)
4. **PR-UX-4**: Zone Border Styles (LOW - nice-to-have)
5. **PR-UX-5**: Context Menu (MEDIUM - can be last as keyboard shortcuts exist)

---

## Testing Checklist

### PR-UX-1: Guest Login Sync
- [ ] Create drawing as guest with 5+ elements
- [ ] Sign up with new account
- [ ] Verify prompt appears asking to save work
- [ ] Confirm save → verify drawing appears in cloud projects
- [ ] Verify drawing persists after browser refresh
- [ ] Test cancel → verify drawing stays in localStorage

### PR-UX-2: Layer Control
- [ ] Create zone → add text → verify text is on top
- [ ] Select zone → Bring to Front → verify zone covers text
- [ ] Select text → Send to Back → verify text goes under zone
- [ ] Verify z-index persists after save/load
- [ ] Test with 10+ overlapping elements

### PR-UX-3: Unified Colors
- [ ] Select arrow → Alt+↓ → verify color changes
- [ ] Select text → Alt+↓ → verify color changes
- [ ] Select player → Alt+↓ → verify textColor changes
- [ ] Select zone → Alt+↓ → verify fillColor changes

### PR-UX-4: Zone Borders
- [ ] Select zone → Shift+E → verify border cycles: solid → dashed → none
- [ ] Verify border color can be changed independently from fill
- [ ] Verify border width slider works (0-8px)
- [ ] Test save/load preserves border settings

### PR-UX-5: Context Menu
- [ ] Right-click on player → verify menu shows player-specific options
- [ ] Right-click on zone → verify menu shows zone-specific options
- [ ] Right-click on empty space → verify generic menu shows
- [ ] Test all menu actions work correctly
- [ ] Verify menu closes when clicking outside

---

## Notes & Considerations

### Backward Compatibility
All changes maintain **backward compatibility** with existing documents:
- `zIndex` is optional (defaults by type if missing)
- `borderWidth` is optional (defaults to 3 if missing)
- `borderStyle` already optional
- Existing documents will render correctly without migration

### Performance Impact
- **Z-Index sorting**: O(n log n) per render - negligible for <1000 elements
- **Context menu**: Only renders when visible - no performance impact
- **Color cycling**: Simple array lookup - instant

### Future Enhancements
1. **Custom z-index input** (Inspector panel)
2. **Color picker modal** (vs. cycling through preset colors)
3. **More border styles** (dotted, double, etc.)
4. **Context menu customization** (user preferences)
5. **Auto-save improvements** (more granular control)

---

## Conclusion

These 5 UX issues represent significant friction points in the user experience:

1. **Data loss risk** (P1) - Must fix immediately
2. **Missing expected features** (P2, P5) - Standard in design tools
3. **Inconsistent UX** (P3, P4) - Polish and professionalism

Implementing these fixes will:
- ✅ Prevent user frustration and data loss
- ✅ Match user expectations from other design tools
- ✅ Improve discoverability (context menu)
- ✅ Enhance creative control (layers, colors, styles)

**Estimated Total Time:** 3-5 days for all 5 PRs (experienced developer)

---

## References
- User testing session notes (verbal feedback)
- Figma UX patterns (layer control, context menu)
- VS Code command palette patterns (existing implementation)
- Current codebase architecture (store, components, types)
