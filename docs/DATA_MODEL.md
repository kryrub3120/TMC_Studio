# 📊 TMC Studio — Data Model Documentation

**Version:** 1.0.0  
**Created:** 2026-01-09  
**Status:** Living Document  

---

## 📋 Table of Contents

1. [Domain Model Overview](#domain-model-overview)
2. [Board Elements](#board-elements)
3. [Document Structure](#document-structure)
4. [Settings & Configuration](#settings--configuration)
5. [Database Schema](#database-schema)
6. [Type Guards & Utilities](#type-guards--utilities)

---

## 🎯 Domain Model Overview

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BoardDocument                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ id: string                                               │   │
│  │ name: string                                             │   │
│  │ version: string                                          │   │
│  │ createdAt: ISO8601                                       │   │
│  │ updatedAt: ISO8601                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              │ 1:N                              │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                         Step                             │   │
│  │  id: string                                              │   │
│  │  name: string                                            │   │
│  │  duration: number                                        │   │
│  │  index: number                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              │ 1:N                              │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    BoardElement                          │   │
│  │  (Discriminated Union)                                   │   │
│  │  ┌──────────┬──────────┬──────────┬──────────────────┐  │   │
│  │  │ Player   │   Ball   │  Arrow   │  Zone   │  Text  │  │   │
│  │  │ Drawing  │Equipment │          │         │        │  │   │
│  │  └──────────┴──────────┴──────────┴──────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │   TeamSettings     │  │   PitchSettings    │                │
│  │  home: TeamSetting │  │  theme: PitchTheme │                │
│  │  away: TeamSetting │  │  orientation: ...  │                │
│  └────────────────────┘  └────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎭 Board Elements

### Discriminated Union Pattern

All board elements share a common discriminator field `type` which enables type-safe handling:

```typescript
// packages/core/src/types.ts

/** Union type for all board elements */
export type BoardElement = 
  | PlayerElement 
  | BallElement 
  | ArrowElement 
  | ZoneElement 
  | TextElement 
  | DrawingElement 
  | EquipmentElement;
```

### Element Types Reference

#### 1. PlayerElement

Represents a player on the tactical board.

```typescript
interface PlayerElement {
  // Discriminator
  type: 'player';
  
  // Identity
  id: ElementId;              // e.g., "player-1704825600000"
  
  // Position
  position: Position;         // { x: number, y: number }
  
  // Player Data
  team: Team;                 // 'home' | 'away'
  number: number;             // 1-99
  label?: string;             // Optional name/label
  
  // Visual Options
  shape?: PlayerShape;        // 'circle' | 'square' | 'triangle' | 'diamond'
  showLabel?: boolean;        // Show label instead of number
  fontSize?: number;          // Custom font size (default: 12)
  textColor?: string;         // Override team color
  opacity?: number;           // 0-1 (default: 1)
  isGoalkeeper?: boolean;     // Uses goalkeeperColor
}
```

**Usage Example:**
```typescript
const player: PlayerElement = {
  type: 'player',
  id: 'player-1704825600000',
  position: { x: 200, y: 300 },
  team: 'home',
  number: 10,
  shape: 'circle'
};
```

#### 2. BallElement

Represents the ball on the pitch.

```typescript
interface BallElement {
  type: 'ball';
  id: ElementId;
  position: Position;
}
```

#### 3. ArrowElement

Represents movement paths (passes, runs).

```typescript
interface ArrowElement {
  type: 'arrow';
  id: ElementId;
  
  // Arrow-specific (no position, uses endpoints)
  arrowType: ArrowType;       // 'pass' | 'run'
  startPoint: Position;
  endPoint: Position;
  curveControl?: Position;    // Optional bezier control
  
  // Visual
  color?: string;
  strokeWidth?: number;
}
```

**Visual Distinction:**
- `pass`: Dashed line, typically white
- `run`: Solid line, typically colored

#### 4. ZoneElement

Represents highlighted areas (defensive zones, pressing areas).

```typescript
interface ZoneElement {
  type: 'zone';
  id: ElementId;
  position: Position;         // Top-left corner
  
  // Dimensions
  width: number;
  height: number;
  
  // Shape & Style
  shape: ZoneShape;           // 'rect' | 'ellipse'
  fillColor: string;
  opacity: number;            // 0-1
  borderStyle?: 'solid' | 'dashed' | 'none';
  borderColor?: string;
}
```

#### 5. TextElement

Represents text annotations.

```typescript
interface TextElement {
  type: 'text';
  id: ElementId;
  position: Position;
  
  // Content
  content: string;
  
  // Typography
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  backgroundColor?: string;
}
```

#### 6. DrawingElement

Represents freehand strokes (coach marks, highlights).

```typescript
interface DrawingElement {
  type: 'drawing';
  id: ElementId;
  
  // No position - uses flat points array
  drawingType: DrawingType;   // 'freehand' | 'highlighter'
  points: number[];           // Flat [x1, y1, x2, y2, ...]
  
  // Visual
  color: string;
  strokeWidth: number;
  opacity: number;
}
```

#### 7. EquipmentElement

Represents training props (cones, goals, mannequins).

```typescript
interface EquipmentElement {
  type: 'equipment';
  id: ElementId;
  position: Position;
  
  // Equipment-specific
  equipmentType: EquipmentType;  // 'goal' | 'mannequin' | 'cone' | 'ladder' | 'hoop' | 'hurdle' | 'pole'
  variant: EquipmentVariant;     // 'standard' | 'mini' | 'tall' | 'flat'
  rotation: number;              // 0-360 degrees
  color: string;
  scale: number;                 // 0.5 - 2.0
}
```

---

## 📄 Document Structure

### BoardDocument

Complete document for save/load operations:

```typescript
interface BoardDocument {
  // Metadata
  version: string;            // Schema version (e.g., "1.0.0")
  name: string;               // Project name
  createdAt: string;          // ISO 8601 timestamp
  updatedAt: string;          // ISO 8601 timestamp
  
  // Content
  steps: Step[];              // Animation steps
  currentStepIndex: number;   // Active step
  
  // Configuration (always included)
  pitchConfig: PitchConfig;
  
  // Settings (optional for backward compat)
  teamSettings?: TeamSettings;
  pitchSettings?: PitchSettings;
}
```

### Step

Single animation frame:

```typescript
interface Step {
  id: string;                 // e.g., "step-1704825600000"
  name: string;               // e.g., "Phase 1", "Attack Setup"
  elements: BoardElement[];   // Elements in this step
  duration: number;           // Animation duration (seconds)
}
```

### Default Document Structure

```typescript
const defaultDocument: BoardDocument = {
  version: "1.0.0",
  name: "Untitled Board",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  currentStepIndex: 0,
  steps: [{
    id: "step-initial",
    name: "Step 1",
    elements: [],
    duration: 0.8
  }],
  pitchConfig: DEFAULT_PITCH_CONFIG,
  teamSettings: DEFAULT_TEAM_SETTINGS,
  pitchSettings: DEFAULT_PITCH_SETTINGS
};
```

---

## ⚙️ Settings & Configuration

### PitchConfig

Dimensional configuration:

```typescript
interface PitchConfig {
  width: number;              // 1050 (landscape) / 680 (portrait)
  height: number;             // 680 (landscape) / 1050 (portrait)
  padding: number;            // 40
  gridSize: number;           // 10
}

const DEFAULT_PITCH_CONFIG: PitchConfig = {
  width: 1050,
  height: 680,
  padding: 40,
  gridSize: 10
};
```

### PitchSettings

Visual customization:

```typescript
interface PitchSettings {
  theme: PitchTheme;          // 'grass' | 'indoor' | 'chalk' | 'futsal' | 'custom'
  primaryColor: string;       // Main grass color
  stripeColor: string;        // Alternating stripe color
  lineColor: string;          // Pitch markings color
  showStripes: boolean;
  orientation: PitchOrientation;  // 'landscape' | 'portrait'
  view: PitchView;            // Always 'full' (legacy field for backward compat)
  lines: PitchLineSettings;   // Line visibility (toggled via "Without Lines" in UI)
}

interface PitchLineSettings {
  showOutline: boolean;       // Pitch boundary
  showCenterLine: boolean;    // Half-way line
  showCenterCircle: boolean;  // Center circle
  showPenaltyAreas: boolean;  // 18-yard boxes
  showGoalAreas: boolean;     // 6-yard boxes
  showCornerArcs: boolean;    // Corner arcs
  showPenaltySpots: boolean;  // Penalty spots
}

// Note: PitchPanel UI simplified to single "Without Lines" toggle
// - OFF (default): All lines visible (DEFAULT_LINE_SETTINGS)
// - ON: All lines hidden (PLAIN_PITCH_LINES)
```

### TeamSettings

Team customization:

```typescript
interface TeamSettings {
  home: TeamSetting;
  away: TeamSetting;
}

interface TeamSetting {
  name: string;               // Team name
  primaryColor: string;       // Jersey color
  secondaryColor: string;     // Text/accent color
  goalkeeperColor?: string;   // GK jersey (default: #fbbf24)
}

const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  home: { 
    name: 'Home', 
    primaryColor: '#ef4444',  // Red
    secondaryColor: '#ffffff' 
  },
  away: { 
    name: 'Away', 
    primaryColor: '#3b82f6',  // Blue
    secondaryColor: '#ffffff' 
  }
};
```

---

## 🗄️ Database Schema

### Supabase Tables

#### `profiles` Table

User profile data:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `projects` Table

Stored tactical boards:

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES project_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  document JSONB NOT NULL,          -- BoardDocument
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_folder_id ON projects(folder_id);
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);
```

#### `project_folders` Table

Project organization:

```sql
CREATE TABLE project_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Projects: Users can only access their own projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Public projects are visible to all authenticated users
CREATE POLICY "Public projects visible to all"
  ON projects FOR SELECT
  USING (is_public = TRUE);
```

### JSONB Document Schema

The `document` column stores the complete `BoardDocument`:

```json
{
  "version": "1.0.0",
  "name": "4-3-3 Attack Setup",
  "createdAt": "2026-01-09T12:00:00.000Z",
  "updatedAt": "2026-01-09T15:30:00.000Z",
  "currentStepIndex": 0,
  "steps": [
    {
      "id": "step-1704825600000",
      "name": "Initial Formation",
      "duration": 0.8,
      "elements": [
        {
          "type": "player",
          "id": "player-1",
          "position": { "x": 200, "y": 300 },
          "team": "home",
          "number": 1,
          "isGoalkeeper": true
        },
        {
          "type": "ball",
          "id": "ball-1",
          "position": { "x": 565, "y": 380 }
        },
        {
          "type": "arrow",
          "id": "arrow-1",
          "arrowType": "pass",
          "startPoint": { "x": 200, "y": 300 },
          "endPoint": { "x": 400, "y": 350 }
        }
      ]
    }
  ],
  "pitchConfig": {
    "width": 1050,
    "height": 680,
    "padding": 40,
    "gridSize": 10
  },
  "teamSettings": {
    "home": { "name": "Home", "primaryColor": "#ef4444", "secondaryColor": "#ffffff" },
    "away": { "name": "Away", "primaryColor": "#3b82f6", "secondaryColor": "#ffffff" }
  },
  "pitchSettings": {
    "theme": "grass",
    "primaryColor": "#2d8a3e",
    "stripeColor": "#268735",
    "lineColor": "rgba(255, 255, 255, 0.85)",
    "showStripes": true,
    "orientation": "landscape",
    "view": "full",
    "lines": {
      "showOutline": true,
      "showCenterLine": true,
      "showCenterCircle": true,
      "showPenaltyAreas": true,
      "showGoalAreas": true,
      "showCornerArcs": true,
      "showPenaltySpots": true
    }
  }
}
```

---

## 🔧 Type Guards & Utilities

### Type Guards (Discriminated Union Handlers)

```typescript
// packages/core/src/types.ts

/** Check if element is a player */
export function isPlayerElement(el: BoardElement): el is PlayerElement {
  return el.type === 'player';
}

/** Check if element is a ball */
export function isBallElement(el: BoardElement): el is BallElement {
  return el.type === 'ball';
}

/** Check if element is an arrow */
export function isArrowElement(el: BoardElement): el is ArrowElement {
  return el.type === 'arrow';
}

/** Check if element is a zone */
export function isZoneElement(el: BoardElement): el is ZoneElement {
  return el.type === 'zone';
}

/** Check if element is text */
export function isTextElement(el: BoardElement): el is TextElement {
  return el.type === 'text';
}

/** Check if element is a drawing */
export function isDrawingElement(el: BoardElement): el is DrawingElement {
  return el.type === 'drawing';
}

/** Check if element is equipment */
export function isEquipmentElement(el: BoardElement): el is EquipmentElement {
  return el.type === 'equipment';
}

/** Check if element has a single position property */
export function hasPosition(el: BoardElement): el is 
  | PlayerElement 
  | BallElement 
  | ZoneElement 
  | TextElement 
  | EquipmentElement {
  return 'position' in el;
}
```

### Element Factory Functions

```typescript
// packages/core/src/board.ts

export function createPlayer(
  position: Position,
  team: Team,
  number: number
): PlayerElement {
  return {
    type: 'player',
    id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    position,
    team,
    number,
    shape: 'circle'
  };
}

export function createBall(position: Position): BallElement {
  return {
    type: 'ball',
    id: `ball-${Date.now()}`,
    position
  };
}

export function createArrow(
  startPoint: Position,
  arrowType: ArrowType
): ArrowElement {
  return {
    type: 'arrow',
    id: `arrow-${Date.now()}`,
    arrowType,
    startPoint,
    endPoint: {
      x: startPoint.x + 80,
      y: startPoint.y
    },
    color: '#ffffff',
    strokeWidth: 3
  };
}

export function createZone(
  position: Position,
  shape: ZoneShape = 'rect'
): ZoneElement {
  return {
    type: 'zone',
    id: `zone-${Date.now()}`,
    position,
    width: 120,
    height: 80,
    shape,
    fillColor: '#22c55e',
    opacity: 0.3,
    borderStyle: 'dashed'
  };
}

export function createText(
  position: Position,
  content: string = 'Text'
): TextElement {
  return {
    type: 'text',
    id: `text-${Date.now()}`,
    position,
    content,
    fontSize: 18,
    fontFamily: 'Inter, sans-serif',
    color: '#ffffff',
    bold: false,
    italic: false
  };
}

export function createEquipment(
  position: Position,
  equipmentType: EquipmentType,
  variant: EquipmentVariant = 'standard'
): EquipmentElement {
  return {
    type: 'equipment',
    id: `equipment-${Date.now()}`,
    position,
    equipmentType,
    variant,
    rotation: 0,
    color: getDefaultEquipmentColor(equipmentType),
    scale: 1
  };
}
```

### Utility Functions

```typescript
// packages/core/src/board.ts

export function moveElement(el: BoardElement, position: Position): BoardElement {
  if (hasPosition(el)) {
    return { ...el, position };
  }
  return el; // Arrows don't use this function
}

export function duplicateElements(
  elements: BoardElement[],
  offset: Position = { x: 12, y: 12 }
): BoardElement[] {
  return elements.map(el => {
    const newId = `${el.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (hasPosition(el)) {
      return {
        ...el,
        id: newId,
        position: {
          x: el.position.x + offset.x,
          y: el.position.y + offset.y
        }
      };
    }
    
    if (isArrowElement(el)) {
      return {
        ...el,
        id: newId,
        startPoint: {
          x: el.startPoint.x + offset.x,
          y: el.startPoint.y + offset.y
        },
        endPoint: {
          x: el.endPoint.x + offset.x,
          y: el.endPoint.y + offset.y
        }
      };
    }
    
    return { ...el, id: newId };
  });
}

export function filterElementsByIds(
  elements: BoardElement[],
  ids: ElementId[]
): BoardElement[] {
  return elements.filter(el => ids.includes(el.id));
}

export function removeElementsByIds(
  elements: BoardElement[],
  ids: ElementId[]
): BoardElement[] {
  return elements.filter(el => !ids.includes(el.id));
}
```

---

## 📐 Coordinate System

### Canvas Coordinate System

```
(0, 0) ────────────────────────────────────────────► X+
   │  ┌─────────────────────────────────────────┐
   │  │ padding (40px)                          │
   │  │  ┌─────────────────────────────────┐   │
   │  │  │                                 │   │
   │  │  │        PITCH AREA               │   │
   │  │  │        (1050 x 680)             │   │
   │  │  │                                 │   │
   │  │  │                                 │   │
   │  │  └─────────────────────────────────┘   │
   │  │                                        │
   │  └─────────────────────────────────────────┘
   ▼
   Y+

Total canvas size: (1050 + 40*2) x (680 + 40*2) = 1130 x 760
```

### Position Convention

- All element positions are **absolute canvas coordinates**
- Pitch origin is at `(padding, padding)` = `(40, 40)`
- Center of pitch: `(40 + 1050/2, 40 + 680/2)` = `(565, 380)`

---

## 🔄 Schema Versioning

### Version Field

The `version` field in `BoardDocument` enables forward-compatible migrations:

```typescript
const CURRENT_VERSION = "1.0.0";

function migrateDocument(doc: unknown): BoardDocument {
  const version = (doc as { version?: string }).version ?? "0.0.0";
  
  if (semver.lt(version, "1.0.0")) {
    // Migrate from pre-1.0 format
    doc = migrateToV1(doc);
  }
  
  // Future migrations...
  
  return doc as BoardDocument;
}
```

### Backward Compatibility Rules

1. **New optional fields**: Always add with default values
2. **Type changes**: Create migration function
3. **Removed fields**: Keep in schema but mark deprecated
4. **Breaking changes**: Bump major version

---

*Previous: [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)*  
*Next: [SERVICE_MODULE_BREAKDOWN.md](./SERVICE_MODULE_BREAKDOWN.md)*
