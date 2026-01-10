# Contributing to TMC Studio

Thank you for your interest in contributing to TMC Studio! 🎉

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v9 or higher (install with `npm install -g pnpm`)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/kryrub3120/TMC_Studio.git
   cd TMC_Studio
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
TMC_Studio/
├── apps/
│   └── web/                    # Main React+Vite web application
│       └── src/
│           ├── App.tsx         # ~100 LOC - composition only
│           ├── components/
│           │   └── Canvas/     # BoardCanvas, layers, overlays
│           ├── hooks/          # Custom hooks (keyboard, animation, etc.)
│           ├── services/       # Business logic services
│           ├── commands/       # Command palette registry
│           └── store/          # Zustand state management
│               ├── slices/     # Individual state slices
│               └── middleware/ # Undo, autosave middleware
├── packages/
│   ├── core/                   # Pure TypeScript - types, operations
│   ├── board/                  # React-Konva canvas components
│   ├── ui/                     # Tailwind UI components
│   └── presets/                # Formation presets
├── docs/                       # Architecture documentation
│   ├── SYSTEM_ARCHITECTURE.md  # High-level system design
│   ├── DATA_MODEL.md           # Domain types and DB schema
│   ├── SERVICE_MODULE_BREAKDOWN.md # Module extraction plan
│   └── ZUSTAND_SLICES.md       # State management guide
├── supabase/                   # Database migrations & config
├── netlify/                    # Serverless functions
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
├── commitlint.config.js        # Conventional commits config
├── package.json                # Root package scripts
└── turbo.json                  # Turborepo configuration
```

## 🛠 Available Commands

### Root Commands (run from project root)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all packages in watch mode |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm clean` | Remove all build artifacts |

### Package-specific Commands

```bash
# Run only web app
pnpm --filter @tmc/web dev

# Build only core package
pnpm --filter @tmc/core build

# Type check specific package
pnpm --filter @tmc/board typecheck
```

## 🌳 Branch Workflow

We use **Git Flow** workflow:

- `main` - Production-ready code
- `develop` - Main development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature

```bash
# Create feature branch from develop
git checkout develop
git pull
git checkout -b feature/my-feature-name

# Work on your feature...
# When ready, push and create PR to develop
git push -u origin feature/my-feature-name
```

## 📝 Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, no logic changes)
- `refactor`: Code restructuring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Examples

```bash
git commit -m "feat(board): add player drag snapping"
git commit -m "fix(core): correct undo history indexing"
git commit -m "docs: update README with shortcuts"
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests (when implemented)
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Type Checking

```bash
# Check all packages
pnpm typecheck
```

## 🎨 Code Style

- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS
- **Formatting**: Prettier (runs on save)

### Key Principles

1. **Type Safety**: Avoid `any`, use proper interfaces
2. **Pure Functions**: Prefer pure functions for core logic
3. **Component Size**: Keep components small and focused
4. **Naming**: Use descriptive, meaningful names

## 🔄 Pull Request Process

1. **Create** a feature branch from `develop`
2. **Implement** your changes
3. **Test** locally (typecheck, build)
4. **Push** and create a Pull Request
5. **Wait** for CI checks to pass
6. **Request** review from maintainers
7. **Address** any feedback
8. **Merge** when approved

### PR Checklist

- [ ] Code builds without errors
- [ ] TypeScript has no errors
- [ ] PR description explains the changes
- [ ] Tests added/updated (if applicable)
- [ ] Documentation updated (if applicable)

## 📦 Adding Dependencies

### Adding to a Package

```bash
# Add to specific package
pnpm --filter @tmc/core add lodash

# Add as dev dependency
pnpm --filter @tmc/web add -D vitest
```

### Adding to Root

```bash
# Add to root (usually dev tools)
pnpm add -D -w prettier
```

## 🏗 Architecture Guidelines

> 📚 **Architecture documentation**:
> - [`docs/SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md) — High-level system design
> - [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — Domain types & database schema
> - [`docs/SERVICE_MODULE_BREAKDOWN.md`](docs/SERVICE_MODULE_BREAKDOWN.md) — Module extraction plan
> - [`docs/ZUSTAND_SLICES.md`](docs/ZUSTAND_SLICES.md) — State management guide
> - [`docs/IMPLEMENTATION_CONTRACTS.md`](docs/IMPLEMENTATION_CONTRACTS.md) — **⚠️ BINDING** contracts, PR plan, Definition of Done

### Package Responsibilities

| Package | Purpose | Dependencies |
|---------|---------|--------------|
| `@tmc/core` | Pure domain logic, types, serialization | None |
| `@tmc/board` | React-Konva canvas components | `@tmc/core`, `react-konva` |
| `@tmc/ui` | Tailwind UI components | `@tmc/core`, `react` |
| `@tmc/presets` | Static data (formations) | `@tmc/core` |
| `apps/web` | Application composition | All packages |

### State Management (Zustand Slices)

> 📚 **Full documentation**: See [`docs/ZUSTAND_SLICES.md`](docs/ZUSTAND_SLICES.md)

We use **sliced Zustand stores** for maintainability:

```typescript
// ✅ Good: Import specific slice
import { useAppStore } from './store';
const elements = useAppStore((s) => s.elements);
const addPlayer = useAppStore((s) => s.addPlayerAtCursor);

// ❌ Avoid: Full store subscription
const store = useAppStore(); // Re-renders on ANY change
```

**Available slices:**
- `elementsSlice` - Element CRUD operations
- `selectionSlice` - Selection state
- `historySlice` - Undo/Redo
- `stepsSlice` - Animation steps
- `cloudSlice` - Cloud sync

### Canvas Architecture

> 📚 **Full documentation**: See [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)

**Six-Layer Strategy:**

```
Stage
├── Layer 1: PitchLayer (STATIC) - Re-renders: on theme change
├── Layer 2: ZonesLayer - Re-renders: on zone add/remove
├── Layer 3: ArrowsLayer - Re-renders: on arrow change
├── Layer 4: PlayersLayer - Re-renders: on drag/animation
├── Layer 5: DrawingLayer - Re-renders: during drawing
└── Layer 6: OverlayLayer - Re-renders: on interaction
```

**Memoization Rule:**

```typescript
// All board nodes must use React.memo with custom equality
export const PlayerNode = React.memo(
  function PlayerNode({ player, isSelected }) {
    // ...
  },
  (prev, next) => {
    return prev.player.id === next.player.id &&
           prev.player.position === next.player.position &&
           prev.isSelected === next.isSelected;
  }
);
```

### Services & Hooks

> 📚 **Full documentation**: See [`docs/SERVICE_MODULE_BREAKDOWN.md`](docs/SERVICE_MODULE_BREAKDOWN.md)

**Services** (no React dependencies):
- `KeyboardService` - Shortcut registration
- `ExportService` - PNG/GIF/PDF export
- `AutosaveService` - Debounced save
- `CommandRegistry` - Command palette

**Hooks** (React integration):
- `useKeyboardShortcuts` - Global shortcuts
- `useAnimationPlayback` - RAF animation
- `useCanvasInteraction` - Mouse/touch
- `useInterpolation` - Position interpolation

### Data Types (Discriminated Unions)

```typescript
// ✅ Good: Use type guards
import { isPlayerElement, isArrowElement } from '@tmc/core';

elements.forEach(el => {
  if (isPlayerElement(el)) {
    console.log(el.team, el.number); // TypeScript knows it's Player
  }
});

// ❌ Avoid: Manual type checks
if (el.type === 'player') { ... }
```

## 🐛 Reporting Bugs

1. **Check** existing issues first
2. **Create** a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/Node version
   - Screenshots (if applicable)

## 💡 Feature Requests

1. **Check** existing discussions/issues
2. **Create** an issue with:
   - Clear description
   - Use case explanation
   - Mockups/examples (if helpful)

## ❓ Questions?

- Open a GitHub Discussion
- Check existing documentation
- Review code comments

---

Thank you for contributing! 🙏
