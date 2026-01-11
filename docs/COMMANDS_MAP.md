# Commands Map

This document provides a comprehensive mapping of all commands in TMC Studio, their keyboard shortcuts, types, and purposes.

## Command Types

TMC Studio uses two types of commands:

- **Intent** - High-frequency, no side effects, no history commit
- **Effect** - User actions with side effects, history commit, autosave trigger

---

## Quick Reference Table

| Command | Shortcut | Type | Description | Location |
|---------|----------|------|-------------|----------|
| **Canvas Actions** |
| `addPlayer` | P | Effect | Add player at cursor | CommandRegistry |
| `addBall` | B | Effect | Add ball at cursor | CommandRegistry |
| `addArrow` | A (pass), R (run) | Effect | Add arrow (click-drag) | CommandRegistry |
| `addZone` | Z (rect), Shift+Z (ellipse) | Effect | Add tactical zone | CommandRegistry |
| `addText` | T | Effect | Add text label | CommandRegistry |
| `startDrawing` | D / H | Intent | Start freehand drawing/highlight | CommandRegistry |
| `clearDrawings` | C | Effect | Clear all drawings | CommandRegistry |
| **Selection** |
| `select` | Click | Intent | Select element | OverlayLayer |
| `multiSelect` | Shift+Click | Intent | Add to selection | OverlayLayer |
| `marqueeSelect` | Drag empty area | Intent | Marquee selection | OverlayLayer |
| `selectAll` | Cmd+A | Intent | Select all elements | App |
| `deselectAll` | Esc | Intent | Clear selection | App |
| **Editing** |
| `move` | Drag | Intent | Move element(s) | OverlayLayer |
| `nudge` | Arrow keys | Intent | Nudge 5px (1px with Shift) | App |
| `delete` | Backspace/Delete | Effect | Delete selected | App |
| `duplicate` | Cmd+D | Effect | Duplicate selected | App |
| `copy` | Cmd+C | Effect | Copy to clipboard | App |
| `paste` | Cmd+V | Effect | Paste from clipboard | App |
| `cycleColor` | Alt+Up/Down | Intent | Cycle element color | App |
| `adjustStroke` | Alt+Left/Right | Intent | Adjust stroke width | App |
| `cycleShape` | S (player), E (zone) | Intent | Cycle element shape | App |
| **Groups** |
| `group` | Cmd+G | Effect | Group selected elements | CommandRegistry |
| `ungroup` | Cmd+Shift+G | Effect | Ungroup selection | CommandRegistry |
| **Steps** |
| `addStep` | N | Effect | Add new step | CommandRegistry |
| `deleteStep` | X | Effect | Delete current step | CommandRegistry |
| `goToStep` | Click step | Intent | Navigate to step | App |
| `renameStep` | Double-click step | Intent | Rename step | App |
| **Animation** |
| `playPause` | Space | Intent | Toggle animation playback | App |
| `toggleLoop` | L | Intent | Toggle loop mode | App |
| **History** |
| `undo` | Cmd+Z | Effect | Undo last action | App |
| `redo` | Cmd+Shift+Z | Effect | Redo last undone action | App |
| **Formations** |
| `applyFormation` | 1-6, Shift+1-6 | Effect | Apply formation preset | App |
| **Export** |
| `exportPNG` | Cmd+E | Effect | Export single PNG | ExportService |
| `exportAllPNGs` | Shift+Cmd+E | Effect | Export all steps as PNGs | ExportService |
| `exportGIF` | Shift+Cmd+G | Effect | Export animated GIF (Pro) | ExportService |
| `exportPDF` | Shift+Cmd+P | Effect | Export multi-page PDF (Pro) | ExportService |
| `exportSVG` | Cmd+K → "Export SVG" | Effect | Export SVG | ExportService |
| **Project** |
| `save` | Cmd+S | Effect | Save project | App |
| `newProject` | Cmd+N | Effect | New project | App |
| `openCommandPalette` | Cmd+K | Intent | Open command palette | App |
| **View** |
| `toggleFocus` | F | Intent | Toggle focus mode | App |
| `toggleOrientation` | O | Intent | Toggle pitch orientation | App |
| `togglePrintMode` | W | Intent | Toggle print-friendly mode | App |
| `zoomIn` | Cmd++ | Intent | Zoom in | App |
| `zoomOut` | Cmd+- | Intent | Zoom out | App |
| `zoomFit` | Cmd+0 | Intent | Fit to screen | App |
| `showCheatSheet` | ? | Intent | Show keyboard shortcuts | App |

---

## Command Details

### Canvas Actions

#### Add Player
**Command:** `addPlayer(x: number, y: number, team: 'home' | 'away')`  
**Shortcut:** `P`  
**Type:** Effect  
**Side Effects:**
- Adds player to elements
- Commits to history
- Triggers autosave

**Usage:**
```typescript
cmd.addPlayer(300, 400, 'home');
```

---

#### Add Ball
**Command:** `addBall(x: number, y: number)`  
**Shortcut:** `B`  
**Type:** Effect  
**Side Effects:**
- Adds ball to elements (max 1 ball allowed)
- Commits to history
- Triggers autosave

---

#### Add Arrow
**Command:** `addArrow(type: 'pass' | 'run', startX, startY, endX, endY)`  
**Shortcut:** `A` (pass), `R` (run)  
**Type:** Effect  
**Interaction:** Click-drag to create  
**Colors:**
- Pass: Red (#ff0000), 4px, dashed
- Run: Blue (#3b82f6), 3px, solid

---

#### Add Zone
**Command:** `addZone(shape: 'rectangle' | 'ellipse', x, y, width, height)`  
**Shortcut:** `Z` (rectangle), `Shift+Z` (ellipse)  
**Type:** Effect  
**Interaction:** Click-drag to create

**Cycle Shape:** `E` key cycles between rectangle ↔ ellipse

---

#### Add Text
**Command:** `addText(x: number, y: number, text: string)`  
**Shortcut:** `T`  
**Type:** Effect  
**Editing:**
- Enter to edit
- ↑/↓ to change font size
- ←/→ to toggle bold/italic
- Shift+↑ to change background color

---

#### Drawing
**Commands:**
- `startDrawing(tool: 'freehand' | 'highlighter')`
- `addDrawingPoint(x, y)`
- `finishDrawing()`

**Shortcuts:**
- `D` - Freehand (red pen, 3px)
- `H` - Highlighter (yellow, 20px, 40% opacity)
- `C` - Clear all drawings

**Customization:**
- Alt+Up/Down - Cycle color
- Alt+Left/Right - Adjust stroke width (1-30px)

---

### Selection Commands

#### Select
**Command:** `select(id: string)`  
**Shortcut:** Click  
**Type:** Intent  
**Behavior:**
- Single selection clears previous
- Shift+Click adds to selection
- Click background deselects all

---

#### Marquee Selection
**Command:** `marqueeSelect(startX, startY, endX, endY)`  
**Shortcut:** Drag on empty area  
**Type:** Intent  
**Behavior:**
- Creates selection rectangle
- Selects all elements within bounds
- Shift+Drag adds to existing selection

---

### Editing Commands

#### Move
**Command:** `move(id: string, deltaX: number, deltaY: number)`  
**Shortcut:** Drag  
**Type:** Intent  
**Behavior:**
- NO history commit during drag
- History committed on pointerUp
- Multi-selection moves together
- Grouped elements move together

---

#### Nudge
**Command:** `nudge(direction: 'up' | 'down' | 'left' | 'right', distance: number)`  
**Shortcuts:**
- Arrow keys: 5px
- Shift+Arrow: 1px  
**Type:** Intent  
**History:** Each nudge is separate undo entry

---

#### Delete
**Command:** `deleteElements(ids: string[])`  
**Shortcut:** Backspace / Delete  
**Type:** Effect  
**Behavior:**
- Removes elements from current step
- Commits to history
- Can be undone

---

#### Duplicate
**Command:** `duplicateElements(ids: string[])`  
**Shortcut:** Cmd+D  
**Type:** Effect  
**Behavior:**
- Creates copies offset by 20px
- New elements are selected
- Commits to history

---

#### Copy/Paste
**Commands:**
- `copy(ids: string[])`
- `paste()`

**Shortcuts:**
- Cmd+C - Copy
- Cmd+V - Paste  
**Type:** Effect  
**Clipboard:** Uses browser clipboard API (JSON format)

---

### Group Commands

#### Group
**Command:** `groupElements(ids: string[])`  
**Shortcut:** Cmd+G  
**Type:** Effect  
**Requirements:** At least 2 elements selected  
**Behavior:**
- Creates group with auto-generated name
- Group members move/transform together
- Clicking any member selects whole group

---

#### Ungroup
**Command:** `ungroupElements(groupId: string)`  
**Shortcut:** Cmd+Shift+G  
**Type:** Effect  
**Behavior:**
- Dissolves group
- Members become individually selectable

---

### Step Commands

#### Add Step
**Command:** `addStep()`  
**Shortcut:** N  
**Type:** Effect  
**Entitlements:**
- Guest: max 5 steps (hard-block)
- Free: max 10 steps (hard-block)
- Pro: unlimited

**Behavior:**
- Clones current step
- New step becomes active
- Commits to history

---

#### Delete Step
**Command:** `deleteStep(index: number)`  
**Shortcut:** X  
**Type:** Effect  
**Requirements:** At least 1 step must remain  
**Behavior:**
- Removes step
- Nearby step becomes active
- Commits to history

---

#### Rename Step
**Command:** `renameStep(index: number, name: string)`  
**Shortcut:** Double-click step  
**Type:** Intent  
**UI:** Inline editing in BottomStepsBar

---

### Animation Commands

#### Play/Pause
**Command:** `togglePlayback()`  
**Shortcut:** Space  
**Type:** Intent  
**Behavior:**
- Starts/stops animation
- Uses requestAnimationFrame
- Respects step duration setting

---

#### Toggle Loop
**Command:** `toggleLoop()`  
**Shortcut:** L  
**Type:** Intent  
**Behavior:**
- Infinite loop on/off
- When off: stops at last step

---

### History Commands

#### Undo
**Command:** `undo()`  
**Shortcut:** Cmd+Z  
**Type:** Effect  
**Behavior:**
- Reverts to previous state
- Can undo multiple times
- Max history: 50 entries

---

#### Redo
**Command:** `redo()`  
**Shortcut:** Cmd+Shift+Z  
**Type:** Effect  
**Behavior:**
- Re-applies undone action
- Redo stack cleared on new action

---

### Formation Commands

#### Apply Formation
**Command:** `applyFormation(formation: Formation, team: 'home' | 'away')`  
**Shortcuts:**
- `1` - 4-3-3 (home)
- `2` - 4-4-2 (home)
- `3` - 4-4-2♦ (home)
- `4` - 4-2-3-1 (home)
- `5` - 3-5-2 (home)
- `6` - 5-3-2 (home)
- `Shift+1-6` - Same for away team

**Type:** Effect  
**Behavior:**
- Clears existing team players
- Adds new formation
- Commits to history

---

### Export Commands

#### Export PNG
**Command:** `exportPNG()`  
**Shortcut:** Cmd+E  
**Type:** Effect  
**Entitlements:** All plans  
**Output:** Single PNG of current step

---

#### Export All PNGs
**Command:** `exportAllPNGs()`  
**Shortcut:** Shift+Cmd+E  
**Type:** Effect  
**Entitlements:** All plans  
**Output:** ZIP with PNG for each step

---

#### Export GIF
**Command:** `exportGIF()`  
**Shortcut:** Shift+Cmd+G  
**Type:** Effect  
**Entitlements:** Pro only (hard-block)  
**Requirements:** At least 2 steps  
**Output:** Animated GIF using gifenc

---

#### Export PDF
**Command:** `exportPDF()`  
**Shortcut:** Shift+Cmd+P  
**Type:** Effect  
**Entitlements:** Pro only (hard-block)  
**Output:** Multi-page PDF (one step per page)

---

#### Export SVG
**Command:** `exportSVG()`  
**Shortcut:** Cmd+K → "Export SVG"  
**Type:** Effect  
**Entitlements:** All plans  
**Output:** SVG of current step

---

### Project Commands

#### Save
**Command:** `save()`  
**Shortcut:** Cmd+S  
**Type:** Effect  
**Behavior:**
- Local: Saves to localStorage
- Cloud (authenticated): Saves to Supabase
- Debounced autosave also triggers on changes

---

#### New Project
**Command:** `newProject()`  
**Shortcut:** Cmd+N  
**Type:** Effect  
**Entitlements:**
- Guest: max 1 project (hard-block)
- Free: max 3 projects (hard-block)
- Pro: unlimited

**Behavior:**
- Prompts to save current if dirty
- Resets board state
- Clears history

---

### View Commands

#### Toggle Focus Mode
**Command:** `toggleFocusMode()`  
**Shortcut:** F  
**Type:** Intent  
**Behavior:**
- Hides UI panels
- Shows only canvas
- Reversible

---

#### Toggle Orientation
**Command:** `toggleOrientation()`  
**Shortcut:** O  
**Type:** Intent  
**Options:** Portrait ↔ Landscape

---

#### Toggle Print Mode
**Command:** `togglePrintMode()`  
**Shortcut:** W  
**Type:** Intent  
**Behavior:**
- White pitch background
- Black lines
- Printer-friendly

---

#### Zoom
**Commands:**
- `zoomIn()`
- `zoomOut()`
- `zoomFit()`

**Shortcuts:**
- Cmd++ (zoom in)
- Cmd+- (zoom out)
- Cmd+0 (fit to screen)

**Type:** Intent

---

## Command Palette

**Shortcut:** Cmd+K

The command palette provides access to all commands via fuzzy search:

- Formation presets
- Export options
- View toggles
- Project actions

---

## Keyboard Shortcuts Summary

### Most Used

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Add player | P | P |
| Add ball | B | B |
| Delete | Backspace | Delete |
| Undo | Cmd+Z | Ctrl+Z |
| Redo | Cmd+Shift+Z | Ctrl+Shift+Z |
| Save | Cmd+S | Ctrl+S |
| Export PNG | Cmd+E | Ctrl+E |
| Add step | N | N |
| Play/Pause | Space | Space |

### Modifier Keys

| Modifier | Purpose |
|----------|---------|
| **Shift** | Add to selection, 1px nudge, away team |
| **Alt/Option** | Color/stroke cycling |
| **Cmd/Ctrl** | Copy, paste, duplicate, undo, save |
| **Cmd+Shift** | Redo, ungroup, advanced exports |

---

## Command Execution Flow

### Effect Command Flow

```
User Input (keyboard/mouse)
  ↓
Event Handler (App.tsx or OverlayLayer)
  ↓
CommandRegistry (orchestration)
  ↓
Store Actions (state updates)
  ↓
History Commit (undo stack)
  ↓
Autosave Trigger (debounced)
  ↓
UI Re-render
```

### Intent Command Flow

```
User Input
  ↓
Event Handler
  ↓
Store Actions (direct)
  ↓
UI Re-render
(No history, no autosave)
```

---

## Adding New Commands

### Checklist

1. **Define command** in `CommandRegistry.ts`
2. **Determine type** (Intent vs Effect)
3. **Add keyboard shortcut** in `useKeyboardShortcuts.ts`
4. **Add to command palette** (if applicable)
5. **Add entitlement check** (if paywalled)
6. **Update this doc** (COMMANDS_MAP.md)
7. **Update CheatSheetOverlay.tsx**

### Example

```typescript
// In CommandRegistry.ts
export const CommandRegistry = {
  // Effect command
  myNewCommand: (arg: string) => {
    store.doSomething(arg);
    store.commitHistory();
    store.markDirty(); // Trigger autosave
  },
  
  // Intent command
  myIntentCommand: () => {
    store.doSomethingLightweight();
    // No history, no autosave
  },
};

// In useKeyboardShortcuts.ts
if (e.key === 'M' && e.metaKey) {
  cmd.myNewCommand('value');
}
```

---

## Related Documentation

- **Modules:** `docs/MODULES.md`
- **Architecture:** `docs/ARCHITECTURE_OVERVIEW.md`
- **Entitlements:** `docs/ENTITLEMENTS.md`

---

**Remember:** Intent vs Effect is NOT about user intent—it's about side effects. If a command triggers history or autosave, it's an Effect command.
