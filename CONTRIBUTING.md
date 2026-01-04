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
│   └── web/              # Main React+Vite web application
├── packages/
│   ├── core/             # Core TypeScript models and utilities
│   ├── board/            # React-Konva canvas components
│   ├── ui/               # Tailwind UI components
│   └── presets/          # Formation presets (future)
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
├── package.json          # Root package scripts
└── turbo.json           # Turborepo configuration
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

### Core Package (`@tmc/core`)

- Pure TypeScript, no React
- All data models and types
- Board operations and serialization
- Should be usable without React

### Board Package (`@tmc/board`)

- React-Konva components
- Canvas rendering logic
- Player/Ball/Pitch nodes
- Drag and selection handling

### UI Package (`@tmc/ui`)

- Tailwind-based components
- Toolbar, panels, buttons
- Should be reusable

### Web App (`@tmc/web`)

- Main application
- Zustand store
- Route handling
- Integration layer

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
