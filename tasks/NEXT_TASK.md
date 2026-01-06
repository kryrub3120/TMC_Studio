# Equipment Integration - Part 3 (Final)

## ✅ Completed
- `17a28b2` - EquipmentElement type, createEquipment(), EquipmentNode
- `07410cd` - addEquipmentAtCursor store action

## ⏳ Remaining (~15 min work)

### 1. Add keyboard shortcuts in App.tsx
Find `case 't':` section and add after it:
```typescript
case 'g': // Goal
  if (e.shiftKey) {
    addEquipmentAtCursor('goal', 'mini');
    showToast('Mini Goal');
  } else {
    addEquipmentAtCursor('goal');
    showToast('Goal');
  }
  break;

case 'm': // Mannequin  
  if (e.shiftKey) {
    addEquipmentAtCursor('mannequin', 'flat');
    showToast('Lying Mannequin');
  } else {
    addEquipmentAtCursor('mannequin');
    showToast('Mannequin');
  }
  break;

case 'k': // Cone/Pole
  if (e.shiftKey) {
    addEquipmentAtCursor('pole');
    showToast('Pole');
  } else {
    addEquipmentAtCursor('cone');
    showToast('Cone');
  }
  break;

case 'j': // Ladder
  addEquipmentAtCursor('ladder');
  showToast('Ladder');
  break;

case 'q': // Hoop
  addEquipmentAtCursor('hoop');
  showToast('Hoop');
  break;

case 'u': // Hurdle
  addEquipmentAtCursor('hurdle');
  showToast('Hurdle');
  break;
```

Also destructure `addEquipmentAtCursor` from useBoardStore().

### 2. Render Equipment in App.tsx canvas
Add import:
```typescript
import { EquipmentNode } from '@tmc/board';
import type { EquipmentElement } from '@tmc/core';
```

Add after zones layer (before arrows):
```tsx
{/* Equipment layer */}
{elements
  .filter((el) => el.type === 'equipment')
  .map((el) => (
    <EquipmentNode
      key={el.id}
      element={el as EquipmentElement}
      isSelected={selectedIds.includes(el.id)}
      onSelect={selectElement}
      onDragEnd={(id, x, y) => {
        moveElementById(id, { x, y });
        pushHistory();
      }}
    />
  ))}
```

### 3. Update CheatSheetOverlay.tsx
In `shortcuts` array, Elements section, ADD:
```typescript
{ key: 'G', description: 'Goal' },
{ key: '⇧G', description: 'Mini Goal' },
{ key: 'M', description: 'Mannequin' },
{ key: '⇧M', description: 'Lying Mannequin' },
{ key: 'K', description: 'Cone' },
{ key: '⇧K', description: 'Pole' },
{ key: 'J', description: 'Ladder' },
{ key: 'Q', description: 'Hoop' },
{ key: 'U', description: 'Hurdle' },
```

## Keyboard Shortcuts
| Key | Equipment | Variant |
|-----|-----------|---------|
| G | Goal | standard |
| ⇧G | Goal | mini |
| M | Mannequin | standard |
| ⇧M | Mannequin | flat |
| K | Cone | standard |
| ⇧K | Pole | - |
| J | Ladder | - |
| Q | Hoop | - |
| U | Hurdle | - |

## Commands
```bash
pnpm dev --filter @tmc/web
pnpm build
```
