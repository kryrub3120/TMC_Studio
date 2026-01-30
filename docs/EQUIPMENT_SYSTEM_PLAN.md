# Equipment System Refactor Plan

**Version:** 1.0  
**Date:** 2026-01-30  
**Status:** Ready for Implementation  
**Related:** Stage 3.3 — Equipment System Refactor + PPM UX

---

## Executive Summary

Refactor `EquipmentNode.tsx` into a modular, testable architecture to support current and future equipment types (drabinki, rebounder, marker_disc, agility_ring, training_zone, etc.).

**Key Issues:**
- EquipmentNode contains 7+ shape renderers inline (~280 lines)
- Hit area calculation duplicated/inline
- Adding new equipment requires modifying monolithic file
- PPM context menu works but needs verification
- Equipment resize shortcuts (+/-) don't work

**Goals:**
1. Modularize shapes into separate files
2. Centralize hit bounds calculation
3. Verify PPM bubbling (RMB shows menu, no marquee)
4. Add keyboard resize support (+/- keys scale by 15%)
5. Update documentation with equipment standards

---

## Current State Analysis

### File Structure (Before)
```
packages/board/src/
  EquipmentNode.tsx  (~280 lines)
    - 7 shape components inline
    - getHitAreaBounds() switch statement
    - Event handlers
    - Selection rendering
```

### Context Menu State
✅ **Already correct** in `apps/web/src/utils/canvasContextMenu.ts`:
- "Change Color" at top (Alt+↓ shortcut)
- "Rotate" with [ ] shortcut
- Layer controls
- Copy/Delete actions

### PPM Event Handling
✅ **Already correct** in `EquipmentNode.tsx`:
```typescript
handleContextMenu(e) {
  e.evt.preventDefault();        // ✅ Blocks browser menu
  // NO e.cancelBubble = true     // ✅ Lets event reach Stage
}

handleMouseDown(e) {
  if (e.evt.button === 2) {
    e.cancelBubble = true;        // ✅ Blocks marquee on RMB
  }
}
```

---

## Target Architecture

### File Structure (After)
```
packages/board/src/
  equipment/
    index.ts              - EQUIPMENT_RENDERERS map + exports
    types.ts              - EquipmentShapeProps type
    hitBounds.ts          - getEquipmentHitBounds() function
    goal.tsx              - GoalShape component
    ladder.tsx            - LadderShape component
    hurdle.tsx            - HurdleShape component
    cone.tsx              - ConeShape component
    mannequin.tsx         - MannequinShape component
    hoop.tsx              - HoopShape component
    pole.tsx              - PoleShape component
  EquipmentNode.tsx       (~100 lines shell)
```

### Responsibilities

**equipment/types.ts**
- Define `EquipmentShapeProps` interface
- Document rendering contract

**equipment/hitBounds.ts**
- Single source of truth for hit area calculation
- Handles scale for all equipment types
- Returns `{ x, y, width, height }` for each type

**equipment/{shape}.tsx**
- Pure visual component (no event handlers)
- Props: `{ color, scale, variant }`
- All shapes have `listening={false}`

**equipment/index.ts**
- Export `EQUIPMENT_RENDERERS` map
- Type-safe renderer lookup

**EquipmentNode.tsx**
- Shell/wrapper component
- Hit area management
- Event handling (select, drag, context menu)
- Selection rendering
- Uses `EQUIPMENT_RENDERERS[type]` for shape

---

## Implementation Plan

### Phase 1: Create Module Structure

#### 1.1 Create Folder
```bash
mkdir -p packages/board/src/equipment
```

#### 1.2 Create `types.ts`
```typescript
/**
 * Equipment Shape Components Contract
 * 
 * Shape components are PURE VISUALS:
 * - No event handlers inside
 * - All interaction via EquipmentNode hitRect
 * - listening={false} on all internal shapes
 * 
 * Future equipment additions:
 * 1. Create new {type}.tsx file with this contract
 * 2. Add entry to EQUIPMENT_RENDERERS map
 * 3. Add hit bounds to getEquipmentHitBounds()
 * 4. No changes to EquipmentNode.tsx needed
 */
export type EquipmentShapeProps = {
  color: string;
  scale: number;
  variant: string;
};
```

---

### Phase 2: Extract Shape Components

Move each shape renderer to its own file with **zero behavior changes**.

#### 2.1 `goal.tsx`
```typescript
import React from 'react';
import { Group, Line } from 'react-konva';
import type { EquipmentShapeProps } from './types';

/**
 * GoalShape - V4 top-forward perspective (premium wireframe)
 * listening={false} on ALL shapes (interaction handled by EquipmentNode)
 */
export const GoalShape: React.FC<EquipmentShapeProps> = ({ color, scale, variant }) => {
  // Base dimensions
  const baseW = variant === 'mini' ? 54 : 110;
  const baseH = variant === 'mini' ? 30 : 44;
  const baseD = variant === 'mini' ? 16 : 26;

  const width = baseW * scale;
  const height = baseH * scale;
  const depth = baseD * scale;

  // Perspective offsets
  const dx = Math.round(depth * 0.3);
  const dy = -Math.round(depth * 0.6);

  // ... (exact copy of current GoalShape implementation)

  return (
    <Group listening={false}>
      {/* All child shapes also have listening={false} */}
    </Group>
  );
};
```

**Same pattern for:**
- `ladder.tsx` - LadderShape
- `hurdle.tsx` - HurdleShape
- `cone.tsx` - ConeShape
- `mannequin.tsx` - MannequinShape
- `hoop.tsx` - HoopShape
- `pole.tsx` - PoleShape

---

### Phase 3: Centralize Hit Bounds

#### 3.1 `hitBounds.ts`
```typescript
import type { EquipmentElement } from '@tmc/core';

/**
 * Calculate hit area bounds for equipment
 * Returns bounding box in local coordinates (relative to equipment position)
 */
export function getEquipmentHitBounds(element: EquipmentElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const { equipmentType, variant, scale } = element;

  switch (equipmentType) {
    case 'goal': {
      // Existing 3D bounding box logic
      const baseW = variant === 'mini' ? 54 : 110;
      const baseH = variant === 'mini' ? 30 : 44;
      const baseD = variant === 'mini' ? 16 : 26;
      
      const width = baseW * scale;
      const height = baseH * scale;
      const depth = baseD * scale;
      
      const dx = depth * 0.3;
      const dy = -depth * 0.6;
      
      const margin = 8;
      const minX = -width/2 - margin;
      const maxX = width/2 + dx + margin;
      const minY = -height/2 + dy - margin;
      const maxY = height/2 + margin;
      
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    case 'ladder': {
      const width = 40 * scale;
      const height = 60 * scale; // 5 rungs * spacing
      return { x: -width/2, y: -height/2, width, height };
    }

    case 'hurdle': {
      const width = 50 * scale;
      const height = 25 * scale;
      return { x: -width/2, y: -height/2, width, height };
    }

    case 'cone': {
      const size = variant === 'tall' ? 28 : 20;
      const radius = size * scale;
      return { x: -radius, y: -radius, width: radius * 2, height: radius * 2 };
    }

    case 'mannequin': {
      const bodyWidth = 12 * scale;
      const bodyHeight = variant === 'flat' ? 20 * scale : 65 * scale;
      const width = variant === 'flat' ? 50 * scale : bodyWidth + 10;
      const height = bodyHeight + 10;
      return { x: -width/2, y: -height/2, width, height };
    }

    case 'hoop': {
      const radius = 20 * scale + 4 * scale; // radius + strokeWidth
      return { x: -radius, y: -radius, width: radius * 2, height: radius * 2 };
    }

    case 'pole': {
      const width = 10 * scale;
      const height = 55 * scale;
      return { x: -width/2, y: -height/2, width, height };
    }

    default:
      return { x: -40 * scale, y: -40 * scale, width: 80 * scale, height: 80 * scale };
  }
}
```

---

### Phase 4: Create Renderer Map

#### 4.1 `index.ts`
```typescript
import { GoalShape } from './goal';
import { LadderShape } from './ladder';
import { HurdleShape } from './hurdle';
import { ConeShape } from './cone';
import { MannequinShape } from './mannequin';
import { HoopShape } from './hoop';
import { PoleShape } from './pole';

/**
 * Equipment renderer map
 * Add new equipment types here
 */
export const EQUIPMENT_RENDERERS = {
  goal: GoalShape,
  ladder: LadderShape,
  hurdle: HurdleShape,
  cone: ConeShape,
  mannequin: MannequinShape,
  hoop: HoopShape,
  pole: PoleShape,
} as const;

export type EquipmentType = keyof typeof EQUIPMENT_RENDERERS;

// Re-export utilities
export { getEquipmentHitBounds } from './hitBounds';
export type { EquipmentShapeProps } from './types';
```

---

### Phase 5: Simplify EquipmentNode.tsx

Keep only shell/orchestration logic (~100 lines):

```typescript
import React from 'react';
import { Group, Rect } from 'react-konva';
import type { EquipmentElement } from '@tmc/core';
import { EQUIPMENT_RENDERERS, getEquipmentHitBounds } from './equipment';

export interface EquipmentNodeProps {
  element: EquipmentElement;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export const EquipmentNode: React.FC<EquipmentNodeProps> = ({
  element,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  const { id, position, equipmentType, variant, rotation, color, scale } = element;
  
  // Get hit area from centralized function
  const hitBounds = getEquipmentHitBounds(element);
  
  // Get shape renderer from map
  const ShapeComponent = EQUIPMENT_RENDERERS[equipmentType];
  
  // Event handlers (unchanged)
  const handleClick = (e: any) => {
    const addToSelection = e.evt?.shiftKey ?? false;
    onSelect(id, addToSelection);
  };
  
  const handleContextMenu = (e: any) => {
    e.evt.preventDefault();
    // Let event bubble to Stage for global menu
  };
  
  const handleMouseDown = (e: any) => {
    if (e.evt.button === 2) {
      e.cancelBubble = true; // Block marquee on RMB
    }
  };
  
  const handleMouseEnter = (e: any) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'move';
  };
  
  const handleMouseLeave = (e: any) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'default';
  };
  
  const handleDragEnd = (e: any) => {
    onDragEnd(id, e.target.x(), e.target.y());
  };
  
  return (
    <Group
      id={id}
      x={position.x}
      y={position.y}
      rotation={rotation}
      draggable
      onDragEnd={handleDragEnd}
    >
      {/* Hit area (listening=true) */}
      <Rect
        x={hitBounds.x}
        y={hitBounds.y}
        width={hitBounds.width}
        height={hitBounds.height}
        fill="transparent"
        listening={true}
        onClick={handleClick}
        onTap={handleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onPointerDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Selection highlight (listening=false) */}
      {isSelected && (
        <Rect
          x={hitBounds.x}
          y={hitBounds.y}
          width={hitBounds.width}
          height={hitBounds.height}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[5, 5]}
          opacity={0.6}
          fill="transparent"
          listening={false}
        />
      )}
      
      {/* Equipment shape (listening=false) */}
      <Group listening={false}>
        {ShapeComponent && <ShapeComponent color={color} scale={scale} variant={variant} />}
      </Group>
    </Group>
  );
};

export default EquipmentNode;
```

---

## Phase 6: Equipment Keyboard Resize

**NEW REQUIREMENT:** Equipment should scale with +/- keys (±15% per press)

### Implementation

#### 6.1 Add to `packages/core/src/types.ts`
Verify `EquipmentElement` has `scale` property (should already exist):
```typescript
export interface EquipmentElement extends BaseElement {
  type: 'equipment';
  equipmentType: 'goal' | 'cone' | 'mannequin' | 'pole' | 'ladder' | 'hoop' | 'hurdle';
  variant: string;
  scale: number; // ✅ Should exist
}
```

#### 6.2 Add Store Action (if needed)
Check `apps/web/src/store/slices/elementsSlice.ts` for resize action:
```typescript
// If doesn't exist, add:
resizeEquipment: (state, action: PayloadAction<{ ids: string[]; delta: number }>) => {
  const { ids, delta } = action.payload;
  
  ids.forEach(id => {
    const element = state.elements.find(el => el.id === id);
    if (element && element.type === 'equipment') {
      const currentScale = element.scale ?? 1;
      const newScale = Math.max(0.25, Math.min(3, currentScale + delta));
      element.scale = newScale;
    }
  });
},
```

#### 6.3 Update Keyboard Shortcuts
In `apps/web/src/hooks/useKeyboardShortcuts.ts`, add equipment resize handling:

```typescript
// Find existing +/- handling (currently for players only)
// Extend to support equipment:

case '+':
case '=':
  if (isCmd || isCtrl) {
    // Zoom (existing)
  } else {
    // Resize selected elements
    const selected = elements.filter(el => el.id in selectedIds);
    
    const playerIds = selected.filter(el => el.type === 'player').map(el => el.id);
    const equipmentIds = selected.filter(el => el.type === 'equipment').map(el => el.id);
    
    if (playerIds.length > 0) {
      // Existing player resize logic
      resizeSelected({ percent: 15 });
    }
    
    if (equipmentIds.length > 0) {
      resizeEquipment({ ids: equipmentIds, delta: 0.15 }); // +15%
    }
  }
  break;

case '-':
case '_':
  // Similar pattern for shrink (-15%)
  if (equipmentIds.length > 0) {
    resizeEquipment({ ids: equipmentIds, delta: -0.15 }); // -15%
  }
  break;
```

#### 6.4 Update Context Menu (Optional)
Consider adding to `canvasContextMenu.ts`:
```typescript
if (isEquipmentElement(element)) {
  return [
    { label: 'Change Color', icon: '🎨', onClick: handlers.onCycleColor!, shortcut: 'Alt+↓' },
    { label: 'Resize', icon: '🔍', onClick: () => {}, shortcut: '+  –' }, // ← NEW
    { label: 'Rotate', icon: '🔄', onClick: () => {}, shortcut: '[  ]' },
    ...layerItems,
    ...commonItems,
  ];
}
```

---

## Phase 7: Update Documentation

### 7.1 Add Section to GOALS_AND_HOTFIXES_PLAN.md

Add after Stage 3.2:

```markdown
### Stage 3.3 — Equipment System Refactor + PPM UX

**Objective:** Modularize equipment rendering for scalability  
**Risk:** LOW  
**Estimated Effort:** 2 hours  
**Priority:** MEDIUM - Technical debt + future-proofing

#### Changes

**Modularization:**
- Extract 7 shape components to `equipment/` folder
- Centralize hit bounds in `getEquipmentHitBounds()`
- Create `EQUIPMENT_RENDERERS` map for type-safe lookup
- Simplify `EquipmentNode.tsx` to ~100 line shell

**PPM Fix Verification:**
- Verify RMB on equipment shows context menu (not browser menu)
- Verify RMB doesn't trigger marquee selection
- Existing implementation already correct (no code changes)

**Keyboard Resize:**
- `+` key: Enlarge equipment by 15%
- `-` key: Shrink equipment by 15%
- Works with multi-select equipment
- Scale range: 25%–300%

**Future Equipment Standard:**
1. Create new `{type}.tsx` file with `EquipmentShapeProps`
2. Add entry to `EQUIPMENT_RENDERERS` map
3. Add hit bounds case to `getEquipmentHitBounds()`
4. All shapes must have `listening={false}`
5. No changes to `EquipmentNode.tsx` needed

#### Definition of Done

- [ ] Equipment folder structure created
- [ ] All 7 shapes extracted to separate files
- [ ] Hit bounds centralized
- [ ] `EQUIPMENT_RENDERERS` map functional
- [ ] `EquipmentNode.tsx` simplified (<120 lines)
- [ ] RMB on equipment shows menu (no marquee)
- [ ] `+` key enlarges equipment by 15%
- [ ] `-` key shrinks equipment by 15%
- [ ] Multi-select equipment resize works
- [ ] `pnpm typecheck` passes
- [ ] No visual/behavioral regressions
- [ ] Documentation updated

**Test Checklist:**
```
✓ RMB on goal → context menu appears
✓ RMB on ladder → context menu appears
✓ RMB on goal → no marquee selection started
✓ LMB select equipment → selection works
✓ Drag equipment → position updates
✓ Select goal → press [ → rotation works
✓ Select goal → press + → goal enlarges
✓ Select goal → press - → goal shrinks
✓ Select 3 cones → press + → all enlarge
✓ Alt+↓ on equipment → color changes
```
```

---

## Testing Strategy

### Manual Tests (5-10 minutes)

| Test | Expected Behavior |
|------|-------------------|
| **Context Menu** | |
| RMB on goal | Menu shows "Change Color" at top |
| RMB on ladder | Menu appears, no browser menu |
| RMB on equipment | No marquee selection starts |
| **Selection** | |
| LMB click goal | Goal selects, blue dashed outline |
| Shift+LMB multiple | Multi-select works |
| **Movement** | |
| Drag goal | Position updates smoothly |
| Drag while rotated | Movement follows cursor |
| **Resize** | |
| Select goal → press `+` | Goal enlarges by ~15% |
| Press `+` 5 times | Goal reaches ~200% scale |
| Press `-` 3 times | Goal shrinks to ~150% |
| Select mannequin → press `-` | Shrinks correctly |
| Multi-select 3 cones → `+` | All enlarge together |
| **Rotation** | |
| Select goal → press `[` | Rotates -15° |
| Press `]` | Rotates +15° |
| **Color** | |
| Select hurdle → Alt+↓ | Color cycles through palette |

### Regression Tests

- [ ] Existing documents load without errors
- [ ] All equipment types render correctly
- [ ] Selection persists after resize
- [ ] Undo/redo works for resize operations
- [ ] Autosave triggers after resize
- [ ] `pnpm typecheck` passes
- [ ] No console errors

### Performance Tests

- [ ] Load board with 50+ equipment items
- [ ] Resize 20+ items simultaneously
- [ ] No perceivable lag (<100ms response)

---

## Out of Scope

Per original requirements:

❌ Pitch overlay goals (Stage 2 - separate feature)  
❌ ArrowNode changes  
❌ New menu architecture  
❌ Store refactoring (use existing slices)  
❌ History/autosave changes (preserve existing)

---

## Rollout Plan

### Step 1: Create Branch
```bash
git checkout -b feat/equipment-system-refactor
```

### Step 2: Create Module Files
1. Create `equipment/` folder
2. Create all 10 files (types, shapes, hitBounds, index)
3. Copy shape implementations 1:1

### Step 3: Update EquipmentNode.tsx
1. Import from `./equipment`
2. Remove inline shape components
3. Remove `getHitAreaBounds()` function
4. Use `EQUIPMENT_RENDERERS[type]` pattern

### Step 4: Add Keyboard Resize
1. Update store slice (if needed)
2. Update keyboard shortcuts handler
3. Add/verify scale clamping (0.25–3.0)

### Step 5: Test
1. Run `pnpm typecheck`
2. Manual test checklist
3. Regression tests
4. Load old documents

### Step 6: Document
1. Update GOALS_AND_HOTFIXES_PLAN.md
2. Create PR with screenshots
3. Document future equipment addition process

### Step 7: Merge
```bash
git push origin feat/equipment-system-refactor
# Create PR, review, merge to main
```

---

## Future Equipment Additions

### Process (Post-Refactor)

When adding new equipment (e.g., `rebounder`):

1. **Create shape file:** `equipment/rebounder.tsx`
```typescript
export const ReboundерShape: React.FC<EquipmentShapeProps> = ({ color, scale, variant }) => {
  return (
    <Group listening={false}>
      {/* Shape rendering */}
    </Group>
  );
};
```

2. **Add to renderer map:** `equipment/index.ts`
```typescript
import { RebounderShape } from './rebounder';

export const EQUIPMENT_RENDERERS = {
  // ... existing
  rebounder: RebounderShape,
} as const;
```

3. **Add hit bounds:** `equipment/hitBounds.ts`
```typescript
case 'rebounder': {
  const width = 60 * scale;
  const height = 80 * scale;
  return { x: -width/2, y: -height/2, width, height };
}
```

4. **Update core type:** `packages/core/src/types.ts`
```typescript
equipmentType: 'goal' | 'cone' | ... | 'rebounder';
```

5. **No changes needed to:**
- EquipmentNode.tsx ✅
- Event handlers ✅
- Context menu (auto-inherits) ✅

---

## Success Metrics

- **Code organization:** Equipment module self-contained
- **Maintainability:** Adding new equipment = 3 files touched
- **Zero regressions:** All existing functionality preserved
- **UX improvement:** Keyboard resize for equipment
- **Performance:** No measurable impact (<1ms)
- **Type safety:** Full TypeScript coverage

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing equipment | Copy implementations 1:1, test each type |
| Hit area regressions | Verify bounds match visual size |
| Import path issues | Use relative imports, verify with typecheck |
| PPM menu breaks | Verify event bubbling with manual test |
| Resize breaks multi-select | Test with 10+ selected items |
| Performance regression | Profile before/after with 50+ items |

---

## Deliverables Checklist

### Files Created
- [ ] `packages/board/src/equipment/types.ts`
- [ ] `packages/board/src/equipment/goal.tsx`
- [ ] `packages/board/src/equipment/ladder.tsx`
- [ ] `packages/board/src/equipment/hurdle.tsx`
- [ ] `packages/board/src/equipment/cone.tsx`
- [ ] `packages/board/src/equipment/mannequin.tsx`
- [ ] `packages/board/src/equipment/hoop.tsx`
- [ ] `packages/board/src/equipment/pole.tsx`
- [ ] `packages/board/src/equipment/hitBounds.ts`
- [ ] `packages/board/src/equipment/index.ts`

### Files Modified
- [ ] `packages/board/src/EquipmentNode.tsx` (simplified)
- [ ] `apps/web/src/store/slices/elementsSlice.ts` (resize action if needed)
- [ ] `apps/web/src/hooks/useKeyboardShortcuts.ts` (equipment resize)
- [ ] `docs/GOALS_AND_HOTFIXES_PLAN.md` (Stage 3.3 section)

### Quality Checks
- [ ] `pnpm typecheck` passes
- [ ] No console errors/warnings
- [ ] All manual tests pass
- [ ] Regression tests pass
- [ ] Git commit messages clear
- [ ] PR description with screenshots

---

**End of Document**
