# Equipment Integration - Part 2

## ✅ Completed (17a28b2)
- EquipmentElement type in types.ts
- createEquipment() in board.ts
- EquipmentNode component with SVG shapes
- All 7 equipment types: goal, mannequin, cone, ladder, hoop, hurdle, pole

## ⏳ Remaining Work

### 1. Add to useBoardStore.ts
```typescript
// Add import
import { EquipmentType, EquipmentVariant, createEquipment } from '@tmc/core';

// Add action type
addEquipmentAtCursor: (type: EquipmentType, variant?: EquipmentVariant) => void;

// Add implementation
addEquipmentAtCursor: (equipmentType, variant = 'standard') => {
  const { cursorPosition } = get();
  const position = cursorPosition ?? { 
    x: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.width / 2,
    y: DEFAULT_PITCH_CONFIG.padding + DEFAULT_PITCH_CONFIG.height / 2,
  };
  const equipment = createEquipment(position, equipmentType, variant);
  get().addElement(equipment);
},
```

### 2. Add keyboard shortcuts in App.tsx
```typescript
// In handleKeyDown:
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

case 'k': // Cone
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

### 3. Render Equipment in App.tsx Layer section
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

### 4. Update CheatSheetOverlay.tsx
Add to Elements section:
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

## Keyboard Shortcuts Summary
| Key | Element | Variant |
|-----|---------|---------|
| G | Goal | standard |
| ⇧G | Goal | mini |
| M | Mannequin | standard |
| ⇧M | Mannequin | flat (lying) |
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
