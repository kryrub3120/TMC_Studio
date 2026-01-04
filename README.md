# TMC Studio — Tactical Board and Animation

**by Tactics Made Clear**

Ultra-fast football tactics board with step-based animation for analysts.

## 🎯 Features (MVP)

- **Full Football Pitch** - Realistic pitch rendering with standard markings
- **Player Management** - 11 Home (red) + 11 Away (blue) players with numbers
- **Ball Element** - Add and position the ball on the pitch
- **Selection** - Single click or multi-select with Shift/Ctrl+Click
- **Drag & Snap** - Drag players and ball with snap-to-grid functionality
- **Undo/Redo** - Full history support
- **Save/Load** - Persist your board to localStorage
- **Keyboard Shortcuts** - Fast workflow with keyboard controls

## ⌨️ Keyboard Shortcuts

### Command Palette
| Key | Action |
|-----|--------|
| `Cmd/Ctrl + K` | Open command palette (search any action) |

### Elements
| Key | Action |
|-----|--------|
| `P` | Add Home player at cursor |
| `Shift + P` | Add Away player at cursor |
| `B` | Add ball at cursor |

### Edit
| Key | Action |
|-----|--------|
| `Cmd/Ctrl + D` | Duplicate selection |
| `Cmd/Ctrl + Z` | Undo |
| `Shift + Cmd/Ctrl + Z` | Redo |
| `Cmd/Ctrl + A` | Select all |
| `Cmd/Ctrl + S` | Save to localStorage |
| `Delete/Backspace` | Delete selection |
| `Escape` | Clear selection |

### View
| Key | Action |
|-----|--------|
| `F` | Toggle Focus Mode (hide UI) |
| `I` | Toggle Inspector Panel |
| `?` | Toggle Keyboard Shortcuts |

### Steps & Animation
| Key | Action |
|-----|--------|
| `N` | Add new step |
| `←` / `→` | Previous / Next step |
| `Space` | Play / Pause |
| `L` | Toggle Loop |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+

### Installation

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
pnpm build
```

## 📁 Project Structure

```
tmc-studio/
├── apps/
│   └── web/                    # React + Vite web application
│       ├── src/
│       │   ├── App.tsx         # Main application component
│       │   ├── main.tsx        # Entry point
│       │   ├── index.css       # Global styles (Tailwind)
│       │   └── store/
│       │       └── useBoardStore.ts  # Zustand state management
│       ├── index.html
│       ├── vite.config.ts
│       └── tailwind.config.js
│
├── packages/
│   ├── core/                   # Core TypeScript library
│   │   └── src/
│   │       ├── types.ts        # Type definitions
│   │       ├── board.ts        # Board operations
│   │       ├── step.ts         # Animation step management
│   │       └── serialization.ts # Save/Load utilities
│   │
│   ├── board/                  # React-Konva canvas components
│   │   └── src/
│   │       ├── Pitch.tsx       # Football pitch rendering
│   │       ├── PlayerNode.tsx  # Draggable player circle
│   │       ├── BallNode.tsx    # Draggable ball element
│   │       └── SelectionBox.tsx # Multi-select rectangle
│   │
│   ├── ui/                     # UI components (Tailwind)
│   │   └── src/
│   │       ├── Button.tsx      # Reusable button component
│   │       ├── Toolbar.tsx     # Main toolbar
│   │       └── RightPanel.tsx  # Properties panel
│   │
│   └── presets/                # Formation presets (placeholder)
│       └── src/
│           └── formations.ts   # Formation schemas
│
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # PNPM workspace config
├── turbo.json                  # Turborepo config
└── tsconfig.json               # Root TypeScript config
```

## 🏗️ Data Model

### BoardDocument

The main document structure for saving/loading:

```typescript
interface BoardDocument {
  version: string;          // Document version (e.g., "1.0.0")
  name: string;             // Board name
  createdAt: string;        // ISO timestamp
  updatedAt: string;        // ISO timestamp
  currentStepIndex: number; // Active step index
  steps: Step[];            // Animation steps
  pitchConfig: PitchConfig; // Pitch dimensions
}
```

### BoardElement

Elements on the board (players or ball):

```typescript
// Player element
interface PlayerElement {
  id: string;
  type: 'player';
  position: { x: number; y: number };
  team: 'home' | 'away';
  number: number;
  label?: string;
}

// Ball element
interface BallElement {
  id: string;
  type: 'ball';
  position: { x: number; y: number };
}
```

### Step (Animation)

Each step represents a frame in the animation:

```typescript
interface Step {
  id: string;
  name: string;
  elements: BoardElement[];
  duration: number; // milliseconds
}
```

### PitchConfig

Pitch dimensions and grid settings:

```typescript
interface PitchConfig {
  width: number;    // Pitch width (default: 1050)
  height: number;   // Pitch height (default: 680)
  padding: number;  // Padding around pitch (default: 40)
  gridSize: number; // Snap grid size (default: 10)
}
```

## 🛠️ Technology Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Canvas**: Konva + react-konva
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Monorepo**: pnpm + Turborepo

## 🔮 Architecture (Future-Ready)

The architecture is designed for:

- **Desktop App**: Ready for Tauri integration
- **Animation Timeline**: Step-based animation system in place
- **Formation Presets**: Schema placeholders ready
- **Export Features**: Serialization utilities implemented

## 📦 Package Commands

### Root commands

```bash
pnpm dev        # Start all packages in dev mode
pnpm build      # Build all packages
pnpm typecheck  # TypeScript type checking
pnpm clean      # Clean all build artifacts
```

### Package-specific

```bash
# Run only web app
pnpm --filter @tmc/web dev

# Build only core package
pnpm --filter @tmc/core build
```

## 🎨 Design System

### Theme Support

TMC Studio supports both **Light** and **Dark** themes, with automatic persistence of your preference.

### Colors

- **Home Team**: Red (`#e63946`)
- **Away Team**: Blue (`#457b9d`)
- **Ball**: White (`#ffffff`)
- **Selection**: Yellow (`#ffd60a`)
- **Pitch**: Green (`#2d8a3e`)
- **Accent**: Emerald (`#12CFA0`)

### UI Components

The UI package (`@tmc/ui`) provides:

| Component | Description |
|-----------|-------------|
| `TopBar` | Header with logo, project name, theme toggle, and actions |
| `RightInspector` | Collapsible properties panel with Props/Layers tabs |
| `BottomStepsBar` | Animation timeline with step chips and playback controls |
| `CommandPaletteModal` | VS Code-style command search (Cmd/Ctrl+K) |
| `CheatSheetOverlay` | Keyboard shortcuts reference card |
| `ToastHint` | Brief notification for tool activations |

### UI Architecture

- **Focus Mode**: Press `F` to hide all UI and focus on the canvas
- **Command Palette First**: Access any action via `Cmd/Ctrl + K`
- **Responsive Inspector**: Toggle with `I` key or collapse button

## 📝 License

MIT © Tactics Made Clear

---

**TMC Studio** — Making tactics clear, one board at a time.
