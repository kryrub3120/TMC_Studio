# UX Implementation Plan - TMC Studio
**Date:** 26.01.2026  
**Reference:** `UX_ISSUES_ANALYSIS.md`

## Overview

This document provides step-by-step implementation plans for all 5 UX issues identified during user testing. Each issue is structured as a separate PR following the PR0-PR6 migration plan principles.

---

## PR-UX-1: Guest Login Sync ⚠️ CRITICAL

**Priority:** P1 (CRITICAL - prevents data loss)  
**Effort:** 🟡 Medium (~4 hours)  
**Files Changed:** 2-3 files, ~50 lines

### Problem
Guest users lose their work after logging in because autosave doesn't trigger without an edit action.

### Solution
Add post-login detection and prompt to save guest work to cloud.

### Implementation Steps

#### Step 1: Add sync logic to auth store
**File:** `apps/web/src/store/useAuthStore.ts`

```typescript
// In onAuthStateChange callback, after preference loading

if (user) {
  // Existing preference loading...
  console.log('[Auth] Preferences loaded from cloud');
  
  // NEW: Check for unsaved guest work
  try {
    const { useBoardStore } = await import('./useBoardStore');
    const state = useBoardStore.getState();
    const hasLocalWork = state.document.steps[0]?.elements.length > 0;
    const notSavedToCloud = !state.cloudProjectId;
    
    if (hasLocalWork && notSavedToCloud) {
      console.log('[Auth] Detected unsaved guest work, prompting user...');
      
      // Small delay to let UI update first
      setTimeout(async () => {
        const shouldSave = window.confirm(
          '💾 Save Your Work?\n\n' +
          'You have unsaved work from your guest session. ' +
          'Would you like to save it to your cloud account?'
        );
        
        if (shouldSave) {
          console.log('[Auth] Saving guest work to cloud...');
          const success = await state.saveToCloud();
          
          if (success) {
            await state.fetchCloudProjects();
            console.log('[Auth] ✓ Guest work saved to cloud');
            
            // Show success toast
            const { useUIStore } = await import('./useUIStore');
            useUIStore.getState().showToast('✓ Your work has been saved to the cloud!');
          } else {
            console.error('[Auth] ✗ Failed to save guest work');
            const { useUIStore } = await import('./useUIStore');
            useUIStore.getState().showToast('⚠️ Failed to save. Try Cmd+S to save manually.');
          }
        } else {
          console.log('[Auth] User declined to save guest work');
        }
      }, 500);
    }
  } catch (error) {
    console.error('[Auth] Error checking for guest work:', error);
  }
}
```

#### Step 2: Add telemetry (optional)
**File:** `apps/web/src/store/useAuthStore.ts`

```typescript
// Track guest-to-cloud conversions for analytics
if (shouldSave) {
  // Log event: guest_work_saved
  console.log('[Telemetry] Guest work saved after login');
}
```

#### Step 3: Test scenarios

1. **Happy path:**
   - Guest creates drawing
   - Logs in → sees prompt
   - Clicks OK → work saved to cloud
   - Refresh page → work still there

2. **Decline path:**
   - Guest creates drawing
   - Logs in → sees prompt
   - Clicks Cancel → work stays in localStorage
   - Can still save manually with Cmd+S

3. **Empty path:**
   - Guest opens app (no drawing)
   - Logs in → NO prompt (nothing to save)

4. **Already saved path:**
   - User creates drawing while logged in
   - Logs out, logs back in → NO prompt (already saved)

### Edge Cases to Handle

1. **Multiple tabs:** Only the active tab should prompt
2. **Slow network:** Show loading state during save
3. **Save failure:** Show error message, don't lose local work
4. **OAuth flow:** Works after Google sign-in too

### Success Criteria

- [ ] Guest work is never lost after login
- [ ] User is always prompted when there's unsaved work
- [ ] Declining the prompt doesn't break anything
- [ ] Works for both email/password and OAuth login
- [ ] No false positives (prompt when there's nothing to save)

---

## PR-UX-2: Layer Control (Z-Index)

**Priority:** P2 (HIGH - major feature gap)  
**Effort:** 🔴 High (~12 hours)  
**Files Changed:** 5-7 files, ~300 lines

### Problem
Users can't control which elements appear on top (zones always under text, etc.)

### Solution
Add `zIndex` property to all elements and implement layer control actions.

### Implementation Steps

#### Step 1: Update core types
**File:** `packages/core/src/types.ts`

```typescript
// Add zIndex to base interface
export interface BoardElementBase {
  id: ElementId;
  position: Position;
  zIndex?: number; // Optional for backward compatibility
}

// Add default z-indexes
export const DEFAULT_Z_INDEXES: Record<string, number> = {
  zone: 10,
  arrow: 20,
  drawing: 30,
  player: 40,
  ball: 50,
  equipment: 60,
  text: 70,
};

// Helper to get element's effective z-index
export function getElementZIndex(element: BoardElement): number {
  return element.zIndex ?? DEFAULT_Z_INDEXES[element.type] ?? 0;
}
```

#### Step 2: Add store actions
**File:** `apps/web/src/store/useBoardStore.ts`

```typescript
interface BoardState {
  // ... existing state ...
  
  // NEW: Layer control actions
  bringToFront: (id?: ElementId) => void;
  sendToBack: (id?: ElementId) => void;
  bringForward: (id?: ElementId) => void;
  sendBackward: (id?: ElementId) => void;
}

// Implementation
bringToFront: (id) => {
  const targetId = id ?? get().selectedIds[0];
  if (!targetId) return;
  
  const { elements } = get();
  const maxZ = Math.max(...elements.map(el => getElementZIndex(el)), 0);
  
  set((state) => ({
    elements: state.elements.map(el =>
      el.id === targetId ? { ...el, zIndex: maxZ + 10 } : el
    )
  }));
  get().pushHistory();
},

sendToBack: (id) => {
  const targetId = id ?? get().selectedIds[0];
  if (!targetId) return;
  
  const { elements } = get();
  const minZ = Math.min(...elements.map(el => getElementZIndex(el)), 0);
  
  set((state) => ({
    elements: state.elements.map(el =>
      el.id === targetId ? { ...el, zIndex: minZ - 10 } : el
    )
  }));
  get().pushHistory();
},

bringForward: (id) => {
  const targetId = id ?? get().selectedIds[0];
  if (!targetId) return;
  
  const { elements } = get();
  const sorted = [...elements].sort((a, b) => getElementZIndex(a) - getElementZIndex(b));
  const currentIndex = sorted.findIndex(el => el.id === targetId);
  
  if (currentIndex < sorted.length - 1) {
    const nextZ = getElementZIndex(sorted[currentIndex + 1]);
    set((state) => ({
      elements: state.elements.map(el =>
        el.id === targetId ? { ...el, zIndex: nextZ + 1 } : el
      )
    }));
    get().pushHistory();
  }
},

sendBackward: (id) => {
  const targetId = id ?? get().selectedIds[0];
  if (!targetId) return;
  
  const { elements } = get();
  const sorted = [...elements].sort((a, b) => getElementZIndex(a) - getElementZIndex(b));
  const currentIndex = sorted.findIndex(el => el.id === targetId);
  
  if (currentIndex > 0) {
    const prevZ = getElementZIndex(sorted[currentIndex - 1]);
    set((state) => ({
      elements: state.elements.map(el =>
        el.id === targetId ? { ...el, zIndex: prevZ - 1 } : el
      )
    }));
    get().pushHistory();
  }
},
```

#### Step 3: Update rendering (CRITICAL CHANGE)
**File:** `apps/web/src/App.tsx`

```tsx
// BEFORE: Type-based filtering
{elements.filter(isZoneElement).map(...)}
{elements.filter(isArrowElement).map(...)}
// etc.

// AFTER: Z-index based sorting
const sortedElements = useMemo(() => {
  return [...elements].sort((a, b) => {
    return getElementZIndex(a) - getElementZIndex(b);
  });
}, [elements]);

<Layer>
  <Pitch />
  
  {sortedElements.map((element) => {
    // Hide if group is invisible
    if (hiddenByGroup.has(element.id)) return null;
    
    // Render based on type
    if (isZoneElement(element) && layerVisibility.zones) {
      return <ZoneNode key={element.id} zone={element} ... />;
    }
    if (isArrowElement(element) && layerVisibility.arrows) {
      return <ArrowNode key={element.id} arrow={element} ... />;
    }
    if (isPlayerElement(element)) {
      const visible = element.team === 'home' 
        ? layerVisibility.homePlayers 
        : layerVisibility.awayPlayers;
      if (!visible) return null;
      return <PlayerNode key={element.id} player={element} ... />;
    }
    if (isBallElement(element) && layerVisibility.ball) {
      return <BallNode key={element.id} ball={element} ... />;
    }
    if (isTextElement(element) && layerVisibility.labels) {
      return <TextNode key={element.id} text={element} ... />;
    }
    if (isDrawingElement(element)) {
      return <DrawingNode key={element.id} drawing={element} ... />;
    }
    if (isEquipmentElement(element)) {
      return <EquipmentNode key={element.id} element={element} ... />;
    }
    return null;
  })}
</Layer>
```

#### Step 4: Add keyboard shortcuts
**File:** `apps/web/src/hooks/useKeyboardShortcuts.ts`

```typescript
// Add to shortcut registrations
{
  key: ']',
  modifiers: ['meta', 'shift'],
  action: () => {
    bringToFront();
    showToast('Brought to front');
  },
  description: 'Bring to Front',
  category: 'edit',
  when: () => selectedIds.length > 0,
},
{
  key: '[',
  modifiers: ['meta', 'shift'],
  action: () => {
    sendToBack();
    showToast('Sent to back');
  },
  description: 'Send to Back',
  category: 'edit',
  when: () => selectedIds.length > 0,
},
{
  key: ']',
  modifiers: ['meta'],
  action: () => {
    bringForward();
    showToast('Moved forward');
  },
  description: 'Bring Forward',
  category: 'edit',
  when: () => selectedIds.length > 0,
},
{
  key: '[',
  modifiers: ['meta'],
  action: () => {
    sendBackward();
    showToast('Moved backward');
  },
  description: 'Send Backward',
  category: 'edit',
  when: () => selectedIds.length > 0,
},
```

#### Step 5: Add command palette actions
**File:** `apps/web/src/App.tsx`

```typescript
// Add to commandActions array
{ 
  id: 'bring-to-front', 
  label: 'Bring to Front', 
  shortcut: '⌘⇧]',
  category: 'edit', 
  onExecute: () => bringToFront(),
  disabled: selectedIds.length === 0 
},
{ 
  id: 'send-to-back', 
  label: 'Send to Back', 
  shortcut: '⌘⇧[',
  category: 'edit', 
  onExecute: () => sendToBack(),
  disabled: selectedIds.length === 0 
},
```

### Testing Scenarios

1. **Basic z-index:**
   - Create zone
   - Add text → verify text on top
   - Select zone → Cmd+Shift+] → verify zone now on top

2. **Multiple elements:**
   - Create 5 overlapping elements
   - Test Cmd+] (forward) and Cmd+[ (backward)
   - Verify incremental changes

3. **Persistence:**
   - Change z-order
   - Save & reload → verify order maintained

4. **Animation:**
   - Verify z-order maintained during playback

### Migration Notes

**Backward Compatibility:**
- Old documents without `zIndex` will use `DEFAULT_Z_INDEXES[type]`
- No migration script needed
- Rendering will be identical for existing documents

---

## PR-UX-3: Unified Color Shortcuts

**Priority:** P4 (LOW - polish)  
**Effort:** 🟢 Low (~2 hours)  
**Files Changed:** 2 files, ~80 lines

### Problem
Color shortcuts work for arrows/zones/drawings but not for text/players.

### Solution
Extend `cycleSelectedColor()` to handle all element types.

### Implementation Steps

#### Step 1: Update color cycling function
**File:** `apps/web/src/store/useBoardStore.ts`

```typescript
cycleSelectedColor: (direction) => {
  const { selectedIds, elements, getTeamSettings } = get();
  if (selectedIds.length === 0) return;
  
  const COLORS = ['#ff0000', '#ff6b6b', '#00ff00', '#3b82f6', '#eab308', '#f97316', '#ffffff'];
  const teamSettings = getTeamSettings();
  
  set((state) => ({
    elements: state.elements.map((el) => {
      if (!selectedIds.includes(el.id)) return el;
      
      // Get current color based on element type
      let currentColor: string | null = null;
      if (isArrowElement(el)) {
        currentColor = el.color ?? '#ffffff';
      } else if (el.type === 'zone') {
        currentColor = el.fillColor ?? '#22c55e';
      } else if (el.type === 'drawing') {
        currentColor = el.color ?? '#ff0000';
      } else if (isTextElement(el)) {
        currentColor = el.color ?? '#ffffff'; // NEW
      } else if (isPlayerElement(el)) {
        // NEW: Use textColor override if set, else team color
        currentColor = el.textColor ?? teamSettings?.[el.team].primaryColor ?? '#ffffff';
      }
      
      if (!currentColor) return el;
      
      // Find next color
      const currentIndex = COLORS.indexOf(currentColor);
      const newIndex = currentIndex === -1 
        ? 0 
        : (currentIndex + direction + COLORS.length) % COLORS.length;
      const newColor = COLORS[newIndex];
      
      // Apply new color based on element type
      if (isArrowElement(el)) {
        return { ...el, color: newColor };
      } else if (el.type === 'zone') {
        return { ...el, fillColor: newColor };
      } else if (el.type === 'drawing') {
        return { ...el, color: newColor };
      } else if (isTextElement(el)) {
        return { ...el, color: newColor }; // NEW
      } else if (isPlayerElement(el)) {
        return { ...el, textColor: newColor }; // NEW
      }
      
      return el;
    }),
  }));
  get().pushHistory();
},
```

#### Step 2: Update keyboard shortcuts (already exists)
No changes needed - Alt+↑/↓ already calls `cycleSelectedColor()`

#### Step 3: Update command palette
**File:** `apps/web/src/App.tsx`

```typescript
// Add to commandActions
{ 
  id: 'cycle-color-next', 
  label: 'Next Color', 
  shortcut: 'Alt+↓',
  category: 'edit', 
  onExecute: () => {
    cycleSelectedColor(1);
    showToast('Color changed');
  },
  disabled: selectedIds.length === 0 
},
{ 
  id: 'cycle-color-prev', 
  label: 'Previous Color', 
  shortcut: 'Alt+↑',
  category: 'edit', 
  onExecute: () => {
    cycleSelectedColor(-1);
    showToast('Color changed');
  },
  disabled: selectedIds.length === 0 
},
```

### Testing

- [ ] Arrow: Alt+↓ → verify color cycles
- [ ] Zone: Alt+↓ → verify fillColor cycles
- [ ] Text: Alt+↓ → verify color cycles (NEW)
- [ ] Player: Alt+↓ → verify textColor cycles (NEW)
- [ ] Drawing: Alt+↓ → verify color cycles

---

## PR-UX-4: Zone Border Styles

**Priority:** P5 (LOW - nice-to-have)  
**Effort:** 🟢 Low (~3 hours)  
**Files Changed:** 4 files, ~100 lines

### Problem
Zone `borderStyle` property exists but there's no UI to change it.

### Solution
Add `borderWidth` property and UI controls for border customization.

### Implementation Steps

#### Step 1: Add missing property
**File:** `packages/core/src/types.ts`

```typescript
export interface ZoneElement {
  // ... existing ...
  borderStyle?: 'solid' | 'dashed' | 'none';
  borderColor?: string;
  borderWidth?: number; // NEW: 0-8px range, default 2
}
```

#### Step 2: Update rendering
**File:** `packages/board/src/ZoneNode.tsx`

```tsx
// Replace hardcoded strokeWidth
const borderDash = zone.borderStyle === 'dashed' ? [6, 3] : undefined;
const borderStroke = zone.borderStyle !== 'none' 
  ? (zone.borderColor || zone.fillColor) 
  : undefined;
const borderWidth = zone.borderWidth ?? 2; // NEW: Use property or default

<Rect
  stroke={borderStroke}
  strokeWidth={borderWidth} // CHANGED: was hardcoded 3
  dash={borderDash}
/>
```

#### Step 3: Add store action
**File:** `apps/web/src/store/useBoardStore.ts`

```typescript
cycleBorderStyle: () => {
  const { selectedIds } = get();
  if (selectedIds.length === 0) return;
  
  const STYLES: Array<'solid' | 'dashed' | 'none'> = ['solid', 'dashed', 'none'];
  
  set((state) => ({
    elements: state.elements.map((el) => {
      if (selectedIds.includes(el.id) && isZoneElement(el)) {
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

adjustBorderWidth: (delta: number) => {
  const { selectedIds } = get();
  if (selectedIds.length === 0) return;
  
  set((state) => ({
    elements: state.elements.map((el) => {
      if (selectedIds.includes(el.id) && isZoneElement(el)) {
        const current = el.borderWidth ?? 2;
        const newWidth = Math.max(0, Math.min(8, current + delta));
        return { ...el, borderWidth: newWidth };
      }
      return el;
    }),
  }));
  get().pushHistory();
},
```

#### Step 4: Add keyboard shortcut
**File:** `apps/web/src/hooks/useKeyboardShortcuts.ts`

```typescript
{
  key: 'e',
  modifiers: ['shift'],
  action: () => {
    const hasZone = elements.some(el => 
      selectedIds.includes(el.id) && isZoneElement(el)
    );
    if (hasZone) {
      cycleBorderStyle();
      const zone = elements.find(el => 
        selectedIds.includes(el.id) && isZoneElement(el)
      ) as ZoneElement;
      showToast(`Border: ${zone.borderStyle || 'solid'}`);
    }
  },
  description: 'Cycle Zone Border Style',
  category: 'edit',
  when: () => selectedIds.length > 0,
},
```

### Testing

- [ ] Select zone → Shift+E → verify cycles solid → dashed → none
- [ ] Verify border width can be adjusted (future: with UI slider)
- [ ] Verify save/load preserves border settings

---

## PR-UX-5: Canvas Context Menu

**Priority:** P3 (MEDIUM)  
**Effort:** 🟡 Medium (~6 hours)  
**Files Changed:** 5 files, ~200 lines

### Problem
No right-click context menu on canvas elements (common UX pattern missing).

### Solution
Implement context menu infrastructure with element-specific menu items.

### Implementation Steps

#### Step 1: Create hook
**File:** `apps/web/src/hooks/useCanvasContextMenu.ts`

```typescript
import { useState, useCallback } from 'react';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  elementId: string | null;
}

export function useCanvasContextMenu() {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    elementId: null,
  });
  
  const showMenu = useCallback((x: number, y: number, elementId: string | null) => {
    setMenuState({ visible: true, x, y, elementId });
  }, []);
  
  const hideMenu = useCallback(() => {
    setMenuState(prev => ({ ...prev, visible: false }));
  }, []);
  
  return { menuState, showMenu, hideMenu };
}
```

#### Step 2: Create menu items helper
**File:** `apps/web/src/utils/canvasContextMenu.ts`

```typescript
import type { BoardElement } from '@tmc/core';
import type { ContextMenuItem } from '@tmc/ui';
import { isPlayerElement, isZoneElement, isTextElement } from '@tmc/core';

export function getCanvasContextMenuItems(
  element: BoardElement | null,
  handlers: {
    onDelete: () => void;
    onDuplicate: () => void;
    onBringToFront: () => void;
    onSendToBack: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onGroup: () => void;
    // Element-specific
    onChangeNumber?: () => void;
    onSwitchTeam?: () => void;
    onCycleShape?: () => void;
    onEdit?: () => void;
  }
): ContextMenuItem[] {
  // Common items for all elements
  const common: ContextMenuItem[] = [
    { label: 'Delete', icon: '🗑️', onClick: handlers.onDelete, variant: 'danger' },
    { label: 'Duplicate', icon: '📋', onClick: handlers.onDuplicate },
    { label: 'Copy', icon: '📄', onClick: handlers.onCopy },
    { divider: true } as ContextMenuItem,
    { label: 'Bring to Front', icon: '⬆️', onClick: handlers.onBringToFront },
    { label: 'Send to Back', icon: '⬇️', onClick: handlers.onSendToBack },
  ];
  
  // Empty space menu
  if (!element) {
    return [
      { label: 'Paste', icon: '📋', onClick: handlers.onPaste },
      { divider: true } as ContextMenuItem,
      { label: 'Select All', icon: '☑️', onClick: handlers.onGroup },
    ];
  }
  
  // Player-specific items
  if (isPlayerElement(element)) {
    return [
      { label: 'Change Number', icon: '🔢', onClick: handlers.onChangeNumber! },
      { label: 'Switch Team', icon: '🔄', onClick: handlers.onSwitchTeam! },
      { label: 'Change Shape', icon: '◼️', onClick: handlers.onCycleShape! },
      { divider: true } as ContextMenuItem,
      ...common,
    ];
  }
  
  // Zone-specific items
  if (isZoneElement(element)) {
    return [
      { label: 'Change Shape', icon: '◼️', onClick: handlers.onCycleShape! },
      { label: 'Border Style', icon: '✏️', onClick: handlers.onEdit! },
      { divider: true } as ContextMenuItem,
      ...common,
    ];
  }
  
  // Text-specific items
  if (isTextElement(element)) {
    return [
      { label: 'Edit Text', icon: '✏️', onClick: handlers.onEdit! },
      { divider: true } as ContextMenuItem,
      ...common,
    ];
  }
  
  return common;
}
```

#### Step 3: Integrate into App.tsx
**File:** `apps/web/src/App.tsx`

```tsx
import { useCanvasContextMenu } from './hooks/useCanvasContextMenu';
import { getCanvasContextMenuItems } from './utils/canvasContextMenu';

// In App component
const { menuState, showMenu, hideMenu } = useCanvasContextMenu();

// Add context menu handler to Stage
<Stage
  // ... existing handlers ...
  onContextMenu={(e) => {
    e.evt.preventDefault();
    const target = e.target;
    const stage = target.getStage();
    const pos = stage?.getPointerPosition();
    
    if (!pos) return;
    
    // Check if clicked on an element
    const elementId = target.id();
    const clickedElement = elements.find(el => el.id === elementId);
    
    if (clickedElement) {
      // Element context menu
      selectElement(elementId, false);
      showMenu(pos.x, pos.y, elementId);
    } else {
      // Empty space menu
      showMenu(pos.x, pos.y, null);
    }
  }}
>

{/* Context Menu Overlay */}
{menuState.visible && (
  <ContextMenu
    x={menuState.x}
    y={menuState.y}
    items={getCanvasContextMenuItems(
      elements.find(el => el.id === menuState.elementId) ?? null,
      {
        onDelete: () => { deleteSelected(); hideMenu(); },
        onDuplicate: () => { duplicateSelected(); hideMenu(); },
        onBringToFront: () => { bringToFront(); hideMenu(); },
        onSendToBack: () => { sendToBack(); hideMenu(); },
        onCopy: () => { copySelection(); hideMenu(); showToast('Copied'); },
        onPaste: () => { pasteClipboard(); hideMenu(); showToast('Pasted'); },
        onGroup: () => { selectAll(); hideMenu(); },
        // Element-specific handlers
        onChangeNumber: () => {
          // Open number edit
          hideMenu();
        },
        onSwitchTeam: () => {
          // Switch player team
          hideMenu();
        },
        onCycleShape: () => {
          cyclePlayerShape(); // or cycleZoneShape based on type
          hideMenu();
        },
        onEdit: () => {
          // Open edit dialog
          hideMenu();
        },
      }
    )}
    onClose={hideMenu}
  />
)}
```

### Testing

- [ ] Right-click player → verify player menu shows
- [ ] Right-click zone → verify zone menu shows
- [ ] Right-click empty space → verify generic menu shows
- [ ] All menu items work correctly
- [ ] Menu closes on click outside
- [ ] Menu closes on Escape key

---

## Implementation Sequence

### Week 1
- **Day 1:** PR-UX-1 (Guest Login Sync) - CRITICAL
- **Day 2-3:** PR-UX-2 (Layer Control) - Major feature

### Week 2
- **Day 1:** PR-UX-3 (Unified Colors) - Quick win
- **Day 2:** PR-UX-4 (Zone Borders) - Polish
- **Day 3:** PR-UX-5 (Context Menu) - Final touch

---

## Rollout Strategy

1. **PR-UX-1** → Deploy immediately (prevents data loss)
2. **PR-UX-2** → Beta test with power users first
3. **PR-UX-3, 4, 5** → Bundle together as "UX Polish" release

---

## Success Metrics

After implementation, track:
- **Data loss incidents:** Should drop to 0
- **Layer control usage:** Track Cmd+Shift+] / Cmd+Shift+[ usage
- **Context menu usage:** Track right-click events
- **User satisfaction:** Survey after 2 weeks

---

## Notes

- All PRs follow PR0 principles (no runtime changes in types-only commits)
- Backward compatibility maintained for all changes
- No database migrations required
- Can be deployed independently or together
