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
| Add Rect Zone | `Z` (then drag) |
| Add Ellipse Zone | `Shift+Z` (then drag) |
| Add Text Label | `T` |
| **Freehand Drawing** |  |
| Freehand Draw (red) | `D` (then drag) |
| Highlighter (yellow) | `H` (then drag) |
| Clear All Drawings | `C` |
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
| Cycle Player Shape | `S` |
| Cycle Zone Shape | `E` |
| **Groups** |  |
| Create Group | `Cmd/Ctrl+G` |
| Ungroup | `Cmd/Ctrl+Shift+G` |
| **View & Pitch** |  |
| Toggle Inspector | `I` |
| Focus Mode | `F` |
| Show Shortcuts | `?` |
| Toggle Orientation | `O` (landscape/portrait) |
| Print Friendly Mode | `W` (white pitch) |
| Zoom In | `Cmd/Ctrl++` |
| Zoom Out | `Cmd/Ctrl+-` |
| **Move Elements** |  |
| Nudge 5px | `Arrow keys` |
| Nudge 1px | `Shift+Arrow keys` |
| Cycle Color | `Alt+Up/Down` |
| Stroke Width | `Alt+Left/Right` |
| **Steps & Playback** |  |
| Previous Step | `←` (when nothing selected) |
| Next Step | `→` (when nothing selected) |
| Add Step | `N` |
| Delete Step | `X` |
| Play/Pause | `Space` |
| Toggle Loop | `L` |
| **Formations** |  |
| Apply Home Formation | `1-6` |
| Apply Away Formation | `Shift+1-6` |
| **Export** |  |
| Export PNG | `Cmd/Ctrl+E` |
| Export All Steps PNG | `Shift+Cmd/Ctrl+E` |
| Export Animated GIF | `Shift+Cmd/Ctrl+G` |
| Export PDF | `Shift+Cmd/Ctrl+P` |
| Export SVG | via Command Palette |
| **Other** |  |
| Command Palette | `Cmd/Ctrl+K` |
| Save | `Cmd/Ctrl+S` |

### Features

#### 🎯 Elements
- **Players**: Home and Away teams with customizable colors
- **Ball**: Standard football
- **Arrows**: Pass (red dashed) and Run (blue solid) arrows
- **Zones**: Rectangular and elliptical highlight areas
- **Text**: Labels with customizable font size, bold, italic, background

#### 📐 Drawing Tools
- Click `A`, `R`, `Z`, or `Shift+Z` to activate tool
- Click and drag on pitch to draw
- Tool auto-deactivates after drawing

#### 🎨 Inspector Panel (press `I`)
- **Props tab**: Edit selected element properties + quick actions
- **Layers tab**: Toggle visibility by category + manage groups
- **Objects tab**: Search and select elements
- **Teams tab**: Customize team names and colors
- **Pitch tab**: Customize pitch colors, stripes, and theme

#### 📦 Groups
- Select multiple elements → `Cmd/Ctrl+G` to group
- Groups appear in Layers tab
- Double-click group name to rename
- Click eye icon to hide/show all group members
- `Cmd/Ctrl+Shift+G` to ungroup

#### 🎬 Animation System
- **Steps**: Multiple animation frames (press `N` to add)
- **Playback**: Play/Pause with Space, loop with `L`
- **Smooth interpolation**: Elements animate between steps
- **Duration**: Adjustable per-step timing

#### ⚽ Formations
- Quick-apply preset formations with number keys 1-6
- Supports: 4-3-3, 4-4-2, 4-4-2♦, 4-2-3-1, 3-5-2, 5-3-2
- Use Shift+1-6 for away team formations

#### 📤 Export Options
- **PNG**: Single frame export
- **All PNGs**: Export each step as separate PNG
- **GIF**: Animated GIF of all steps
- **PDF**: Multi-page PDF (one step per page)
- **SVG**: Vector export of current view

#### 🔍 Zoom
- Use widget in bottom-right corner
- `Cmd/Ctrl++` / `Cmd/Ctrl+-`
- Portrait mode auto-zooms to 75%

#### 🎬 Focus Mode
- Press `F` to hide all UI
- Hover top edge to exit

#### 👤 User Account & Cloud Sync
- **Authentication**: Email/password or Google OAuth
- **Cloud Projects**: Save and sync your boards across devices
- **Settings Modal**: Access via user menu (top-right)
  - **Profile**: Update name and avatar (max 2MB images)
  - **Security**: Change password or delete account
  - **Billing**: Manage subscription (Free, Pro, Team tiers)
  - **Preferences**: Theme, Grid, Snap settings with cloud sync
- **Auto-save**: Projects auto-save to cloud when authenticated
- **Legal Pages**: Privacy Policy, Terms of Service, Cookie Policy

#### ☁️ Cloud Preferences Sync
- Theme (Dark/Light) syncs across devices
- Grid visibility preference syncs
- Snap to grid preference syncs
- Automatic sync on login
- Offline-first: works without internet, syncs when online

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
│   └── presets/          # Formations, templates
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
- **Export**: gifenc, jsPDF

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
type BoardElement = PlayerElement | BallElement | ArrowElement | ZoneElement | TextElement;
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
