# TMC Studio - Professional Drag & Drop Pattern

## Overview

TMC Studio uses a **window events-based drag pattern** for all interactive canvas elements. This pattern provides smooth, professional UX without the coordinate jumping issues that plague Konva's built-in `draggable` for complex operations.

## The Pattern

### Why Not Konva's `draggable`?

Konva's `draggable` works well for simple element dragging, but causes issues when:
- Dragging handles within a group (resize handles, endpoints)
- The group position and handle position both change
- Coordinate systems need transformation

### Our Solution: Window Events + Preview State

```
┌──────────────────────────────────────────────────────────────┐
│                    DRAG & DROP PATTERN                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. MOUSEDOWN on handle                                      │
│     └─> Store: mouseStartX/Y, elementStartX/Y               │
│     └─> Set: draggingHandle = 'handleName'                  │
│                                                              │
│  2. MOUSEMOVE (window event)                                 │
│     └─> Calculate delta: mouse - mouseStart                  │
│     └─> Preview position: elementStart + delta               │
│     └─> Render preview (not saved to store yet)             │
│                                                              │
│  3. MOUSEUP (window event)                                   │
│     └─> Commit: save final position to store                │
│     └─> Clear: dragging state + preview                     │
│     └─> Push: history for undo/redo                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Implementation Template

### State Structure

```typescript
// Dragging state
const [draggingHandle, setDraggingHandle] = useState<string | null>(null);
const dragDataRef = useRef<{
  startMouseX: number;
  startMouseY: number;
  startElementX: number;
  startElementY: number;
} | null>(null);

// Preview position (local visual feedback)
const [previewPosition, setPreviewPosition] = useState<Position | null>(null);
```

### Mouse Down Handler

```typescript
const handleMouseDown = useCallback(
  (handleName: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true; // Prevent parent drag
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    // Get mouse position relative to stage container
    const rect = stage.container().getBoundingClientRect();
    const mouseX = e.evt.clientX - rect.left;
    const mouseY = e.evt.clientY - rect.top;
    
    // Store initial positions
    dragDataRef.current = {
      startMouseX: mouseX,
      startMouseY: mouseY,
      startElementX: element.position.x,
      startElementY: element.position.y,
    };
    
    setDraggingHandle(handleName);
  },
  [element.position]
);
```

### Window Events Effect

```typescript
useEffect(() => {
  if (!draggingHandle) return;
  
  const handleMouseMove = (e: MouseEvent) => {
    const stage = groupRef.current?.getStage();
    if (!stage || !dragDataRef.current) return;
    
    // Get mouse position relative to stage
    const rect = stage.container().getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate delta from start
    const dx = mouseX - dragDataRef.current.startMouseX;
    const dy = mouseY - dragDataRef.current.startMouseY;
    
    // Calculate new position
    const newX = dragDataRef.current.startElementX + dx;
    const newY = dragDataRef.current.startElementY + dy;
    
    // Update preview (visual feedback only)
    setPreviewPosition({ x: newX, y: newY });
  };
  
  const handleMouseUp = () => {
    // Commit final position to store
    if (previewPosition) {
      onPositionChange(element.id, previewPosition);
    }
    
    // Clear all state
    setDraggingHandle(null);
    setPreviewPosition(null);
    dragDataRef.current = null;
  };
  
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
}, [draggingHandle, previewPosition, element.id, onPositionChange]);
```

### Rendering with Preview

```typescript
// Use preview position during drag, actual position otherwise
const displayX = previewPosition?.x ?? element.position.x;
const displayY = previewPosition?.y ?? element.position.y;

return (
  <Group x={displayX} y={displayY}>
    {/* Element content */}
    <Rect {...props} />
    
    {/* Resize handles (only when selected) */}
    {isSelected && (
      <Circle
        x={width}
        y={height}
        radius={6}
        onMouseDown={(e) => handleMouseDown('resize-se', e)}
        // Cursor feedback
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'se-resize';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
      />
    )}
  </Group>
);
```

## Applied Components

### ZoneNode (`packages/board/src/ZoneNode.tsx`)

**Uses pattern for:** 8-point resize handles (nw, n, ne, e, se, s, sw, w)

```typescript
// Resize handles calculated from position + width/height
// Each handle adjusts position and/or dimensions independently
```

### ArrowNode (`packages/board/src/ArrowNode.tsx`)

**Uses pattern for:** Start and end endpoint handles

```typescript
// Arrow uses center-based positioning
// Endpoints are relative to center
// Pattern handles the coordinate transformation
```

### Future: PlayerNode, BallNode, GoalNode

All new interactive elements should use this pattern for:
- Position dragging (main element)
- Resize operations
- Rotation handles
- Custom interaction points

## Style Shortcuts Integration

Elements that use this pattern also benefit from keyboard shortcuts:

| Keys | Action | Elements |
|------|--------|----------|
| `Alt+↑/↓` | Cycle colors (6 presets) | Arrows, Zones |
| `Alt+←/→` | Adjust stroke/border width | Arrows, Zones |
| `Arrow keys` | Nudge 5px | All elements |
| `Shift+Arrow` | Nudge 1px (precision) | All elements |

### Color Presets

```typescript
const COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#22c55e', // Green
  '#eab308', // Yellow
  '#a855f7', // Purple
  '#f97316', // Orange
];
```

## Benefits of This Pattern

1. **No coordinate jumping** - Preview position is calculated from deltas, not absolute positions
2. **Smooth dragging** - Window events capture mouse even outside canvas
3. **Predictable behavior** - Same pattern for all interactive elements
4. **Clean state management** - Preview is local, final position goes to store
5. **Undo/redo friendly** - History pushed only on mouseup
6. **Cursor feedback** - Handle hover shows appropriate cursor

## Migration Checklist

When adding new interactive elements:

- [ ] Use `useState` for `draggingHandle` (string or null)
- [ ] Use `useRef` for `dragDataRef` (mouse + element start positions)
- [ ] Use `useState` for `previewPosition` (or relevant preview state)
- [ ] Implement `handleMouseDown` with `cancelBubble = true`
- [ ] Add `useEffect` for window mousemove/mouseup
- [ ] Render with `preview ?? actual` position
- [ ] Add cursor feedback on handle hover
- [ ] Test: drag handles, release anywhere, undo/redo

## Testing

```bash
# Build to verify no TypeScript errors
pnpm build

# Run dev server and test:
pnpm dev

# Test checklist:
# 1. Create zone (Z key, drag)
# 2. Select zone, drag resize handles
# 3. Verify: no jumping, smooth resize
# 4. Create arrow (A key, drag)
# 5. Select arrow, drag endpoint handles
# 6. Verify: no jumping, smooth endpoint move
# 7. Test Alt+Arrow for style changes
# 8. Test Cmd+Z for undo
```

---

**Last updated:** 2026-06-12
**Pattern version:** 2.0
**Components using pattern:** ZoneNode, ArrowNode, PlayerNode (ALT+drag rotation), EquipmentNode

---

## Virtual Canvas Architecture

### DOM Layout (Flex Containment Chain)

Od Sprintu D3 (PR-UX-3) canvas używa następującej struktury DOM, która pozwala na skalowanie i auto-dopasowanie:

```
BoardPage (flex flex-col min-h-0 h-screen)
  └── TopBar
  └── div (flex-1 flex min-w-0 min-h-0 overflow-hidden p-4 relative)
       └── BoardCanvasSection (absolute inset-0 overflow-hidden flex items-center justify-center)
            └── CanvasShell (w-full h-full)
                 └── Konva Stage + overlays
```

**Kluczowe własności:**
- `min-w-0` / `min-h-0` nadpisuje domyślny `min-size:auto` flexa, pozwalając dzieciom na shrink
- `absolute inset-0` zapobiega rozciąganiu przez intrinsic dimensions Konvy
- Overlaye (CheatSheet, ZoomWidget, ShortcutsHint) renderują się POZA kontenerem absolutnym

### Render Model

| Komponent | Rola |
|-----------|------|
| **Stage** | Wypełnia 100% viewport (width/height = kontenera) |
| **Layer** | Odbiera transform zoom/pan (scaleX, scaleY, x, y) |
| **Group (nie Layer)** | Zawiera elementy — NIE odbiera transform (tylko Layer) |

```
Stage (100% viewport, bez skalowania)
  └── Layer (scale, x, y — zoom i pan)
       └── Group 1..N (elementy boiska)
            └── PlayerNode, BallNode, ArrowNode, itd.
```

### Zoom & Pan System

**Zoom range:** 25%–200% (`ZOOM_MIN: 0.25`, `ZOOM_MAX: 2.0`)

**Efektywny zoom:**
```
effectiveZoom = userZoom × fitZoom
```

Gdzie `fitZoom` automatycznie wylicza się, aby dopasować boisko do kontenera.

**Auto-scale na resize okna:**
- `ResizeObserver` na pomiarowym kontenerze wykrywa zmianę rozmiaru
- Jeśli obecny zoom użytkownika przekracza zoom dopasowania dla nowego kontenera → zoom jest clampowany do fit i pan re-centrowany
- Bypassuje viewport lock (board nigdy nie może być ucięty przez resize okna)

### Zoom Shortcuts

| Shortcut | Behavior |
|----------|----------|
| `Cmd+=` / `+` (plain, bez zaznaczonego sprzętu) | Zoom in +25% |
| `Cmd+-` / `-` (plain, bez zaznaczonego sprzętu) | Zoom out -25% |
| `Ctrl+Scroll` | Zoom to cursor position |
| `0` (zero key) | Fit view (reset zoom + pan) |
| Zoom Widget buttons | +/- 25% or Fit |

**Uwaga:** Plain `+`/`-` są wyłączone gdy zaznaczono equipment (priorytet ma skalowanie sprzętu) i gdy viewport jest zablokowany.

### Pan Controls

| Trigger | Behavior |
|---------|----------|
| `Space+Drag` | Pan canvas |
| Two-finger drag (mobile) | Pan canvas |
| Pinch (mobile) | Zoom in/out |

**Pan clamping:** 80px margines poza krawędzie boiska
**Pan reset:** gdy zoom ≤ 1.0 (boisko mieści się w viewporcie)

### Viewport Lock

- Włączany/wyłączany przez `cmd.view` (toggle kłódki)
- Gdy locked: użytkownik nie może ręcznie zmienić zoom/pan
- Auto-scale na resize okna działa POMIMO locka (board nie może być ucięty)
- Przydatne do zachowania spójnego widoku podczas prezentacji

### Auto-Fit & Auto-Center

- **Auto-fit na load:** Po załadowaniu dokumentu zoom jest ustawiany tak, by całe boisko było widoczne
- **Auto-center na zoom-out:** Gdy użytkownik zoomuje out i boisko mieści się w viewporcie → pan jest auto-centrowany
- **Auto-center na resize:** Przy zmianie rozmiaru okna pan jest re-centrowany jeśli boisko mieści się w viewporcie

### Mobile Touch

- `touch-action: none` na kontenerze canvasa (zapobiega natywnym gestom przeglądarki)
- Pinch zoom: adjusts user zoom level
- Two-finger pan: moves viewport
- Single-finger drag: element interaction (if not on Space)
- Double-tap: activates text/number editing (if on player/text)

### Własności zoom-zależne

| Feature | Gated | Threshold |
|---------|-------|-----------|
| Arms rendering | ✅ Yes | `zoomThreshold` (default 40%) |
| Number rotation | ✅ Yes | `zoomThreshold` (default 40%) |
| Vision cone | ❌ No | Always visible |
