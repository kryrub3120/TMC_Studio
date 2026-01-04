# S1.8 Part 2: Groups UI in Inspector

## Goal
Add Groups section in RightInspector Layers tab.

## Completed This Session ✅
- **S1.6 Multi-Selection Drag** - Players + Ball drag together
- **S1.7 Groups System Core** - Ctrl+G/Ctrl+Shift+G working
- **S1.8 Part 1 Store Actions** - All group management functions

### Store Functions Ready
```typescript
// useBoardStore exports
- createGroup()           // Creates group from selected (min 2)
- ungroupSelection()      // Removes groups containing selected
- selectGroup(id)         // Selects all group members
- getGroups()            // Returns Group[]
- toggleGroupLock(id)    // Toggle locked state
- toggleGroupVisibility(id) // Toggle visible state
- renameGroup(id, name)  // Rename group
```

## TODO: Groups UI (~30 min)

### 1. Add Group type export to @tmc/ui (`packages/ui/src/index.ts`)
```typescript
// Add Group to exported types in RightInspector
export interface GroupData {
  id: string;
  name: string;
  memberIds: string[];
  locked: boolean;
  visible: boolean;
}
```

### 2. Update RightInspector Props
```typescript
// packages/ui/src/RightInspector.tsx
interface RightInspectorProps {
  // existing props...
  groups?: GroupData[];
  onSelectGroup?: (groupId: string) => void;
  onToggleGroupLock?: (groupId: string) => void;
  onToggleGroupVisibility?: (groupId: string) => void;
}
```

### 3. Add Groups Section in Layers Tab
```tsx
{/* In Layers tab, before individual layer toggles */}
{groups && groups.length > 0 && (
  <div className="space-y-1 mb-4">
    <div className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
      Groups
    </div>
    {groups.map((group) => (
      <div
        key={group.id}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface2 cursor-pointer transition-colors"
        onClick={() => onSelectGroup?.(group.id)}
      >
        <FolderIcon className="h-4 w-4 text-accent" />
        <span className="flex-1 text-sm truncate">{group.name}</span>
        <span className="text-xs text-muted">{group.memberIds.length}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleGroupLock?.(group.id); }}
          className="p-1 hover:bg-surface rounded"
        >
          {group.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3 text-muted" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleGroupVisibility?.(group.id); }}
          className="p-1 hover:bg-surface rounded"
        >
          {group.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted" />}
        </button>
      </div>
    ))}
  </div>
)}
```

### 4. Wire in App.tsx
```tsx
// Import groups getter
const groups = useBoardStore((s) => s.getGroups());
const selectGroup = useBoardStore((s) => s.selectGroup);
const toggleGroupLock = useBoardStore((s) => s.toggleGroupLock);
const toggleGroupVisibility = useBoardStore((s) => s.toggleGroupVisibility);

// Pass to RightInspector
<RightInspector
  // existing props...
  groups={groups}
  onSelectGroup={selectGroup}
  onToggleGroupLock={toggleGroupLock}
  onToggleGroupVisibility={toggleGroupVisibility}
/>
```

## Files to Modify
1. `packages/ui/src/RightInspector.tsx` - Add groups section
2. `packages/ui/src/index.ts` - Export GroupData type
3. `apps/web/src/App.tsx` - Wire group handlers

## Commands
```bash
pnpm dev
pnpm build

# Test:
# 1. Create 3+ players
# 2. Cmd+A to select all
# 3. Ctrl+G to create group
# 4. Check Inspector Layers tab - group should appear
# 5. Click group → all members selected
# 6. Click lock/eye icons → toggle state
```

## Future: S1.9+ 
- Animation timeline
- Keyframe interpolation
- Group visibility actually hides elements
- Group locked prevents editing
