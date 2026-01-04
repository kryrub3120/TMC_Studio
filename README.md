# TMC Studio — Tactical Board & Animation

**Fast, professional football tactics board for analysts, coaches, and content creators.**

Built by [Tactics Made Clear](https://tacticsmadeclear.com)

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

Open http://localhost:5173

---

## 📖 User Guide

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| **Elements** |  |
| Add Home Player | `P` |
| Add Away Player | `Shift+P` |
| Add Ball | `B` |
| Add Pass Arrow | `A` (then drag) |
| Add Run Arrow | `R` (then drag) |
| Add Zone | `Z` (then drag) |
| **Selection** |  |
| Select All | `Cmd/Ctrl+A` |
| Clear Selection | `Escape` |
| Multi-select | `Shift+Click` |
| Marquee Select | Click+Drag on empty area |
| **Edit** |  |
| Duplicate | `Cmd/Ctrl+D` |
| Delete | `Delete` / `Backspace` |
| Undo | `Cmd/Ctrl+Z` |
| Redo | `Shift+Cmd/Ctrl+Z` |
| **Groups** |  |
| Create Group | `Ctrl+G` |
| Ungroup | `Ctrl+Shift+G` |
| **View** |  |
| Toggle Inspector | `I` |
| Focus Mode | `F` |
| Show Shortcuts | `?` |
| Zoom In | `Cmd/Ctrl++` |
| Zoom Out | `Cmd/Ctrl+-` |
| Zoom Fit | `Shift+1` |
| **Move Elements** |  |
| Nudge 5px | `Arrow keys` |
| Nudge 1px | `Shift+Arrow keys` |
| Cycle Color | `Alt+Up/Down` |
| Stroke Width | `Alt+Left/Right` |
| **Other** |  |
| Command Palette | `Cmd/Ctrl+K` |
| Save | `Cmd/Ctrl+S` |
| Export PNG | `Cmd/Ctrl+E` |

### Features

#### 🎯 Elements
- **Players**: Home (red) and Away (blue) with jersey numbers
- **Ball**: Standard football
- **Arrows**: Pass (dashed white) and Run (solid blue) arrows
- **Zones**: Rectangular highlight areas

#### 📐 Drawing Tools
- Click `A`, `R`, or `Z` to activate tool
- Click and drag on pitch to draw
- Tool auto-deactivates after drawing

#### 🎨 Inspector Panel (press `I`)
- **Props tab**: Edit selected element properties
- **Layers tab**: Toggle visibility by category + manage groups
- **Objects tab**: Search and select elements

#### 📦 Groups
- Select multiple elements → `Ctrl+G` to group
- Groups appear in Layers tab
- Double-click group name to rename
- Click eye icon to hide/show all group members
- Click lock icon to lock group (coming soon)
- `Ctrl+Shift+G` to ungroup

#### 🔍 Zoom
- Use widget in bottom-right corner
- `Cmd/Ctrl++` / `Cmd/Ctrl+-`
- `Shift+1` to fit to screen

#### 🎬 Focus Mode
- Press `F` to hide all UI
- Hover top edge to exit

---

## 🏗️ Architecture

### Monorepo Structure

```
TMC Studio/
├── apps/
│   └── web/              # React + Vite web app
├── packages/
│   ├── core/             # Data models, serialization
│   ├── board/            # Konva canvas components
│   ├── ui/               # UI components (TopBar, Inspector, etc.)
│   └── presets/          # Formations, templates (WIP)
├── docs/                 # Documentation
└── tasks/                # Development tasks
```

### Tech Stack
- **Framework**: React 18 + Vite
- **Canvas**: Konva (react-konva)
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Build**: pnpm + Turborepo
- **Language**: TypeScript (strict mode)

### Data Model

```typescript
// Board Document
interface BoardDocument {
  id: string;
  name: string;
  steps: Step[];        // Animation frames
  createdAt: string;
  updatedAt: string;
}

// Step (animation frame)
interface Step {
  id: string;
  elements: BoardElement[];
  duration: number;
}

// Elements
type BoardElement = PlayerElement | BallElement | ArrowElement | ZoneElement;
```

---

## 🛠️ Development

### Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript check
pnpm clean        # Clean build artifacts
```

### Adding a Package

```bash
# Add to specific workspace
pnpm add <package> --filter @tmc/web

# Add dev dependency
pnpm add -D <package> --filter @tmc/core
```

### Project Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start web dev server |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |

---

## 📄 License

MIT © Tactics Made Clear
