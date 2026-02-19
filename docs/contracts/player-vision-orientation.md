# Player Vision & Orientation Contracts

**Last Updated:** 2026-02-20 (v0.2.2)

## Vision System

### Global Setting
```typescript
playerOrientationSettings.showVision: boolean | undefined
```

- `true` = Vision enabled globally
- `false` or `undefined` = Vision **disabled** (normalized to `false`)
- **Opt-in by default** (undefined becomes false)

### Per-Player Override
```typescript
player.showVision: boolean | undefined
```

- `false` = Vision disabled for this player (explicit override)
- `undefined` = Inherit global setting
- `true` = Vision enabled for this player (explicit override)

### Zoom Gating
- **Vision is NOT zoom-gated** (always visible when enabled)
- Vision displays regardless of zoom level (unlike arms which require `zoomThreshold`)

## Orientation System

### Default Orientation
```typescript
player.orientation: number | undefined
```

- Default: `0` degrees (north/up)
- Normalized on document load
- Prevents NaN issues on rotation transforms

### Transforms
- Orientation transforms on portrait ↔ landscape rotation
- Transform applies to all players with defined orientation
- Maintains relative facing direction after rotate

### Arms Rendering
- **Arms ARE zoom-gated** (require `zoomThreshold`, default 100%)
- Arms render ABOVE body (z-order fix in v0.2.2)
- Visible on all player shapes (circles, triangles, etc.)

### Number Rotation
- Numbers rotate with player orientation
- **180° flip when upside-down** for readability
- Always legible regardless of player facing

## Z-Order (Render Layers)

```
Vision (bottom)
  ↓
Body
  ↓
Arms
  ↓
Number (top)
```

- **v0.2.2 fix:** Arms moved above body (previously behind)
- Ensures arms visible on solid shapes like circles

## Keyboard Shortcuts

### V — Toggle Selected Player Vision
- Toggles `player.showVision` for selected player(s)
- Cycles: `undefined` → `true` → `false` → `true` ...

### Shift+V — Deterministic All-Players Toggle
- **Logic:**
  - If ANY player has vision OFF → set all to ON
  - If ALL players have vision ON → set all to OFF
- **Consistent behavior** (no random toggling)
- Shows toast with player count

## Migration Notes

### Documents Created Before v0.2.2
- `showVision: undefined` → normalized to `false` (vision OFF)
- `player.orientation: undefined` → normalized to `0` (north)
- No breaking changes (existing `true` values preserved)

### Rendering Fixes
- Arms now visible on all shapes (v0.2.2 z-order fix)
- Numbers always readable (auto-flip implementation)
