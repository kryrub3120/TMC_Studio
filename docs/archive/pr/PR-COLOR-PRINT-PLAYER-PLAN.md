# PR: Color Palette, Print Mode, and Player Enhancements

**Status:** Planning  
**Date:** 30.01.2026  
**Scope:** Shared color palette, print mode sanitization, first player numbering, per-player color override

---

## Requirements Summary

1. **Shared Color Palette:** Add black (#000000) to all color pickers/cycles
2. **Print Mode:** 
   - Remove white (#ffffff) from selectable colors in print mode
   - Sanitize white to black at render-time (NO document mutation)
   - Print mode is UI-only state (NOT part of document/history)
3. **Player Creation:**
   - First player per team: `number: undefined` (no number shown)
   - Subsequent players: incremental numbers (1, 2, 3...)
   - First player uses default team color (no override)
4. **Player Color Override:**
   - Add `PlayerElement.color?: string` for per-player fill override
   - PPM: "Change Color…" with preset palette + custom picker + reset option
   - `effectiveColor = player.color ?? defaultTeamColor`
5. **Text Enhancements:**
   - In print mode: default to black (#000000)
   - PPM: "Change Color…" picker
   - Block/sanitize white in print mode

---

## Architecture Decisions

### 1. Shared Color Palette Location

**Decision:** `packages/ui/src/colors.ts`

**Rationale:**
- UI package already handles presentation/pickers
- Avoids cross-package imports (packages can't import from apps/web)
- Can be imported by both packages/ui components and apps/web

**Exports:**
```ts
export const SHARED_COLORS: string[];
export function getColorsForMode(isPrintMode: boolean): string[];
export function sanitizeColorForPrint(color: string, isPrintMode: boolean): string;
```

### 2. Print Mode State Management

**Decision:** UI-only state in `apps/web/src/store/useUIStore.ts`

**Rationale:**
- Print mode toggle must NOT create undo entries
- Must NOT be persisted in document
- Must NOT trigger autosave/dirty flag
- Only affects rendering, not data

**State:**
```ts
isPrintMode: boolean;
togglePrintMode: () => void;
```

**Visual Changes:**
- Pitch background becomes white (render-time only)
- White colors sanitized to black (render-time only)
- Toggle via W key updates UI state + pitch colors simultaneously

### 3. Player Number Logic

**Current:** `getNextPlayerNumber()` starts from 1  
**Change:** In `addPlayerAtCursor()`, check if first player for team

**Result:**
- 1st player: `number: undefined` → no number displayed
- 2nd player: `number: 1`
- 3rd player: `number: 2`
- etc.

---

## Implementation Plan

### PR-1: Shared Palette + Print Sanitization

**File: `packages/ui/src/colors.ts` (NEW)**
```ts
/** Shared color palette */
export const SHARED_COLORS = [
  '#000000', // black - NEW
  '#ff0000', '#ff6b6b', '#00ff00', '#3b82f6', 
  '#eab308', '#f97316', '#ffffff',
];

/** Get colors for current mode (filter white in print mode) */
export function getColorsForMode(isPrintMode: boolean): string[] {
  return isPrintMode 
    ? SHARED_COLORS.filter(c => c.toLowerCase() !== '#ffffff')
    : SHARED_COLORS;
}

/** Sanitize white to black in print mode */
export function sanitizeColorForPrint(
  color: string | undefined, 
  isPrintMode: boolean
): string {
  if (!color) return isPrintMode ? '#000000' : '#ffffff';
  const normalized = color.trim().toLowerCase();
  if (isPrintMode && normalized === '#ffffff') {
    return '#000000';
  }
  return color;
}
```

**File: `packages/ui/src/index.ts`**
- Export `{ SHARED_COLORS, getColorsForMode, sanitizeColorForPrint }`

**File: `apps/web/src/store/useUIStore.ts`**
- Add state: `isPrintMode: boolean` (default: false)
- Add action: `togglePrintMode: () => void`

**File: `apps/web/src/hooks/useKeyboardShortcuts.ts`**
- Update W key handler to toggle `isPrintMode` state
- Simultaneously update pitch colors for visual effect
- NO pushHistory, NO markDirty

**File: `apps/web/src/store/slices/elementsSlice.ts`**
- Replace COLORS array with `import { SHARED_COLORS } from '@tmc/ui'`
- Use `SHARED_COLORS` in `cycleSelectedColor()`

**File: `packages/ui/src/TeamsPanel.tsx`**
- Replace `COLOR_PRESETS` with `import { SHARED_COLORS } from './colors'`

---

### PR-2: Player Render-Time Sanitization

**File: `packages/board/src/PlayerNode.tsx`**

**Changes:**
1. Add prop: `isPrintMode?: boolean`
2. Update `getTeamColors()`:
   ```ts
   import { sanitizeColorForPrint } from '@tmc/ui';
   
   function getTeamColors(
     team: 'home' | 'away', 
     teamSettings?: TeamSettings,
     isGoalkeeper?: boolean,
     player?: PlayerElement,
     isPrintMode?: boolean
   ): TeamColors {
     const settings = teamSettings ?? DEFAULT_TEAM_SETTINGS;
     const teamSetting = settings[team];
     
     // Priority: player.color > goalkeeper color > team color
     let primaryHex = player?.color ?? (
       isGoalkeeper
         ? (teamSetting.goalkeeperColor ?? DEFAULT_GK_COLOR)
         : teamSetting.primaryColor
     );
     
     // Sanitize white in print mode
     primaryHex = sanitizeColorForPrint(primaryHex, isPrintMode ?? false);
     
     const darkenedStroke = darkenColor(primaryHex, 20);
     return { fill: primaryHex, stroke: darkenedStroke, text: teamSetting.secondaryColor };
   }
   ```
3. Update memo comparison to include `player.color`

---

### PR-3: Text Render-Time Sanitization

**File: `packages/board/src/TextNode.tsx`**

**Changes:**
1. Add prop: `isPrintMode?: boolean`
2. Update render logic:
   ```ts
   import { sanitizeColorForPrint } from '@tmc/ui';
   
   // Default black in print mode, white otherwise
   const defaultColor = isPrintMode ? '#000000' : '#ffffff';
   const effectiveColor = sanitizeColorForPrint(
     text.color ?? defaultColor,
     isPrintMode ?? false
   );
   ```
3. Use `effectiveColor` in Text component
4. Update memo comparison to include `isPrintMode`

---

### PR-4: First Player Number Logic

**File: `apps/web/src/store/slices/elementsSlice.ts`**

**Update `addPlayerAtCursor`:**
```ts
addPlayerAtCursor: (team) => {
  const { cursorPosition, elements } = get();
  const position = cursorPosition ?? { 
    x: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.width / 2,
    y: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.height / 2,
  };
  
  // First player for team = no number (undefined)
  // Subsequent players = incremental (1, 2, 3...)
  const teamPlayers = elements.filter(
    (el) => isPlayerElement(el) && el.team === team
  );
  const isFirstPlayer = teamPlayers.length === 0;
  const number = isFirstPlayer ? undefined : getNextPlayerNumber(elements, team);
  
  const player = createPlayer(position, team, number);
  get().addElement(player);
},
```

**Note:** `getNextPlayerNumber()` remains unchanged (starts from 1)

---

### PR-5: Player Color Override

**File: `packages/core/src/types.ts`**

**Add to `PlayerElement`:**
```ts
export interface PlayerElement extends BoardElementBase {
  type: 'player';
  team: Team;
  number?: number | null;
  label?: string;
  shape?: PlayerShape;
  showLabel?: boolean;
  fontSize?: number;
  textColor?: string;
  opacity?: number;
  isGoalkeeper?: boolean;
  radius?: number;
  color?: string; // NEW - Per-player fill color override
}
```

**File: `apps/web/src/store/slices/elementsSlice.ts`**

**Add action:**
```ts
updatePlayerColor: (id: ElementId, color: string | undefined) => {
  set((state) => ({
    elements: state.elements.map((el) => {
      if (el.id === id && isPlayerElement(el)) {
        if (color === undefined) {
          // Reset to team default
          const { color: _removed, ...rest } = el as any;
          return rest;
        }
        return { ...el, color };
      }
      return el;
    }),
  }));
  get().pushHistory();
},
```

---

### PR-6: PPM "Change Color" Menu Items

**File: `apps/web/src/utils/canvasContextMenu.ts`**

**Add to handlers interface:**
```ts
onChangePlayerColor?: () => void;
onChangeTextColor?: () => void;
```

**Update player menu:**
```ts
if (isPlayerElement(element)) {
  return [
    { label: 'Change Number', icon: '🔢', onClick: handlers.onChangeNumber!, shortcut: 'double-tap' },
    { label: 'Change Color…', icon: '🎨', onClick: handlers.onChangePlayerColor! }, // NEW
    { label: 'Switch Team', icon: '🔄', onClick: handlers.onSwitchTeam!, shortcut: 'Shift+P' },
    // ... rest
  ];
}
```

**Update text menu:**
```ts
if (isTextElement(element)) {
  return [
    { label: 'Edit Text', icon: '✏️', onClick: handlers.onEdit!, shortcut: 'Enter' },
    { label: 'Change Color…', icon: '🎨', onClick: handlers.onChangeTextColor! }, // NEW
    // ... rest
  ];
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `packages/ui/src/colors.ts` | **NEW** - Shared palette + sanitization |
| `packages/ui/src/index.ts` | Export colors module |
| `packages/core/src/types.ts` | Add `color?: string` to PlayerElement |
| `packages/board/src/PlayerNode.tsx` | Add `isPrintMode` prop, use `player.color`, sanitize |
| `packages/board/src/TextNode.tsx` | Add `isPrintMode` prop, sanitize white, default black |
| `apps/web/src/store/useUIStore.ts` | Add `isPrintMode` state |
| `apps/web/src/store/slices/elementsSlice.ts` | Use SHARED_COLORS, first player logic, `updatePlayerColor` |
| `apps/web/src/utils/canvasContextMenu.ts` | Add player/text "Change Color…" handlers |
| `packages/ui/src/TeamsPanel.tsx` | Use SHARED_COLORS |
| `apps/web/src/hooks/useKeyboardShortcuts.ts` | Toggle `isPrintMode` on W key |

**Note:** Wherever PlayerNode/TextNode are rendered (e.g., Pitch.tsx), pass `isPrintMode` from UI store.

---

## Manual Test Checklist

### Color Palette
- [ ] Black (#000000) appears in all color cycling (arrows, zones, equipment)
- [ ] Black appears in TeamsPanel color presets
- [ ] All color pickers use shared SHARED_COLORS

### Print Mode (W key toggle)
- [ ] Toggle sets `isPrintMode` in UI store (verify in React DevTools)
- [ ] Pitch background becomes white visually
- [ ] White players render as black
- [ ] White text renders as black
- [ ] Color pickers hide white option when in print mode
- [ ] Toggle does NOT create undo entry (Cmd+Z should not undo toggle)
- [ ] Toggle does NOT trigger autosave indicator

### Player Creation
- [ ] Add first home player → no number shown
- [ ] Add second home player → number "1" shown
- [ ] Add third home player → number "2" shown
- [ ] Add first away player → no number shown
- [ ] Add second away player → number "1" shown
- [ ] First players use default team colors

### Player Color Override
- [ ] Right-click player → "Change Color…" appears
- [ ] Clicking opens color picker UI
- [ ] Selecting color changes player fill (not text)
- [ ] Player with custom color keeps it when team colors change
- [ ] "Reset to team default" option removes override
- [ ] Color change creates undo entry

### Text Color
- [ ] In print mode: new text defaults to black
- [ ] Right-click text → "Change Color…" appears
- [ ] Clicking opens color picker
- [ ] Selecting color changes text color
- [ ] White text sanitized to black in print mode
- [ ] Color change creates undo entry

### History/Dirty Semantics
- [ ] Print mode toggle: NO undo, NO dirty
- [ ] Player color change: YES undo, YES dirty
- [ ] Text color change: YES undo, YES dirty
- [ ] Player creation: YES undo, YES dirty

---

## Implementation Order

1. ✅ Create planning document (this file)
2. Create `packages/ui/src/colors.ts` + export
3. Add `isPrintMode` to useUIStore
4. Update PlayerNode with sanitization
5. Update TextNode with sanitization
6. Update elementsSlice (shared colors + first player + updatePlayerColor)
7. Update canvasContextMenu (PPM handlers)
8. Update TeamsPanel (use shared colors)
9. Update keyboard shortcuts (W key toggle)
10. Wire `isPrintMode` prop to PlayerNode/TextNode renders
11. Manual testing per checklist

---

## Notes

- **No App.tsx changes** - per constraints
- **No new dependencies** - using existing patterns
- **History semantics preserved** - only mutations push history
- **Minimal file scope** - focused on core types, nodes, store, menu
