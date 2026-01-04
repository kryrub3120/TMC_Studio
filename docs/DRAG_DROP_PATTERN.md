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

**Last updated:** 2026-01-04
**Pattern version:** 1.0
**Components using pattern:** ZoneNode, ArrowNode
