# S4.3 Pitch Orientation (Portrait/Landscape)

## Goal
Implement working pitch orientation toggle - portrait rotates pitch 90°, changes dimensions, and transforms element positions.

## Current State
- Orientation toggle exists in PitchPanel UI (Landscape/Portrait buttons)
- Orientation value is stored in pitchSettings
- BUT clicking Portrait does nothing - pitch stays horizontal

## What Needs to Happen

### 1. Change Pitch Dimensions
In portrait mode:
- Swap width ↔ height in PitchConfig
- Canvas: 680x1050 instead of 1050x680

### 2. Transform Element Positions
When switching orientation, all elements need position transformation:
```typescript
// Landscape → Portrait
newX = pitchHeight - oldY
newY = oldX

// Portrait → Landscape  
newX = oldY
newY = pitchWidth - oldX
```

### 3. Update Formations
Formations in `packages/presets/src/formations.ts` use positions 0-1 relative.
- When portrait: swap x↔y in getAbsolutePositions()

### 4. Update Canvas Stage
App.tsx needs to:
- Read orientation from pitchSettings
- Swap canvasWidth/canvasHeight
- Stage width/height adjust

## Step-by-step Plan

1. **Create getPitchDimensions() helper**
   ```typescript
   // packages/core/src/types.ts
   export function getPitchDimensions(orientation: PitchOrientation): PitchConfig {
     if (orientation === 'portrait') {
       return {
         ...DEFAULT_PITCH_CONFIG,
         width: DEFAULT_PITCH_CONFIG.height,
         height: DEFAULT_PITCH_CONFIG.width,
       };
     }
     return DEFAULT_PITCH_CONFIG;
   }
   ```

2. **Update App.tsx canvasWidth/canvasHeight**
   ```typescript
   const pitchDimensions = useMemo(() => 
     getPitchDimensions(pitchSettings?.orientation ?? 'landscape'),
     [pitchSettings?.orientation]
   );
   const canvasWidth = pitchDimensions.width + pitchDimensions.padding * 2;
   const canvasHeight = pitchDimensions.height + pitchDimensions.padding * 2;
   ```

3. **Update Pitch.tsx to use dynamic dimensions**

4. **Transform elements on orientation change**
   - In store: watch orientation changes
   - Transform all element positions
   - Recalculate formations

5. **Update formations getAbsolutePositions()**
   - Add orientation parameter
   - Swap x/y for portrait

## Files to edit
- `packages/core/src/types.ts` - getPitchDimensions()
- `apps/web/src/App.tsx` - dynamic canvasWidth/Height  
- `packages/board/src/Pitch.tsx` - accept dynamic config
- `apps/web/src/store/useBoardStore.ts` - transform elements on change
- `packages/presets/src/formations.ts` - orientation support

## Complexity: HIGH
This touches multiple parts of the codebase and needs careful testing.

## Commands
```bash
pnpm build  
pnpm dev
```
