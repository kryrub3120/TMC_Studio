# TMC Studio — Versioning Policy

**Version:** 1.1.0 (of this document)  
**Created:** 2026-06-13  
**Updated:** 2026-06-13 (sek 8-10: agent instructions + dynamic footer)  
**Status:** Active Policy  
**Applies to:** Web, Mobile (iOS/Android), Desktop (macOS/Windows/Linux)

---

## 1. Philosophy

TMC Studio uses a **hybrid versioning system** that combines:

- **SemVer 2.0.0** for the product version — communicates change severity to users and developers
- **CalVer build metadata** for CI/CD — enables precise rollback and platform traceability
- **Single shared version** across all platforms — one feature release = one version number everywhere

This approach is inspired by professional multi-platform tools:
- VS Code (monthly releases, single version across platforms)
- Figma (SemVer, same version on web + desktop)
- Linear (CalVer-adjacent, single version across all clients)

---

## 2. Product Version: SemVer `MAJOR.MINOR.PATCH`

```
MAJOR.MINOR.PATCH+PRE_RELEASE
  ↑      ↑      ↑         ↑
  |      |      |         +-- Pre-release suffix (e.g., -beta.1, -rc.2)
  |      |      +------------ Patch: bug fixes, small tweaks
  |      +------------------- Minor: new features, no breaking changes
  +-------------------------- Major: breaking changes, complete rewrites
```

### 2.1 Pre-1.0 Convention (`0.x.y`)

| Segment | Meaning | Example |
|---------|---------|---------|
| `0.1.0` | Initial MVP | First working prototype |
| `0.2.0` | Feature expansion | Animation system, export |
| `0.3.0` | New capabilities | Cloud sync, auth |
| `0.4.0` | Polish + onboarding | Tutorial, help sidebar |
| `0.6.0` | Current version | Squad Bench redesign, export 100% resolution, 4 teams, i18n PL/EN/ES, UI redesign Fazy 1-4, Settings rozbudowa, tłumaczenia |
| `0.x.y` | Pre-1.0 development | `0` = breaking changes happen at any minor bump |

**Rule:** In `0.x.y` phase, a `MINOR` bump can include breaking changes if clearly documented.

### 2.2 When to Bump

| Change | Bump | Example |
|--------|------|---------|
| Bug fix, typo, performance | `PATCH` | `0.5.0` → `0.5.1` |
| New feature, UI addition | `MINOR` | `0.5.0` → `0.6.0` |
| Breaking API change | `MINOR` (pre-1.0) or `MAJOR` (post-1.0) | `0.5.0` → `0.6.0` |
| Platform launch (mobile, desktop) | No version bump — same product version | `0.5.0` stays `0.5.0` |
| Public release ready | `MAJOR` = `1.0.0` | `0.9.0` → `1.0.0` |

### 2.3 Pre-release Tags

```
0.5.0-beta.1    ← first beta
0.5.0-beta.2    ← second beta
0.5.0-rc.1      ← release candidate
0.5.0           ← stable release
```

Used during betas and release testing. Documented in CHANGELOG.md under the release they belong to.

---

## 3. Build Metadata: CalVer `YYYYMMDD.HHMM`

Build metadata is **optional** and used only in CI/CD artifacts, never in user-facing product version.

```
0.5.0+20260613.1200.web
0.5.0+20260613.1200.ios
0.5.0+20260613.1200.android
0.5.0+20260613.1200.mac
0.5.0+20260613.1200.win
0.5.0+20260613.1200.linux
```

**Format:** `+YYYYMMDD.HHMM.platform`

| Segment | Value |
|---------|-------|
| `YYYYMMDD` | UTC date of build |
| `HHMM` | UTC time of build (24h) |
| `platform` | `web`, `ios`, `android`, `mac`, `win`, `linux` |

**Usage:** CI pipeline tags every deploy with build metadata for precise rollback.

---

## 4. Multi-Platform Version Strategy

### 4.1 One Version to Rule Them All

All platforms share **exactly one product version number**.

| Platform | Version Source | How |
|----------|---------------|-----|
| **Web (Netlify)** | `apps/web/package.json` | `npm version` tag → auto-deploy |
| **iOS** | App Store + Info.plist | Synced from `apps/web/package.json` |
| **Android** | build.gradle | Synced from root version |
| **Desktop (macOS)** | electron-builder config | Synced from root version |
| **Desktop (Windows/Linux)** | electron-builder config | Synced from root version |

### 4.2 Release Cadence

| Phase | Cadence | Version Pattern |
|-------|---------|-----------------|
| **MVP / Alpha** (current) | On-demand, per sprint | `0.1.0` → `0.6.0` |
| **Beta** (next) | Weekly | `0.6.0-beta.1`, `0.7.0-beta.1` |
| **Stable** (post-1.0) | Monthly | `1.1.0`, `1.2.0` |
| **Hotfix** | As needed | `0.6.1`, `1.1.1` |

### 4.3 Platform-Specific Builds

When a new platform is added (e.g., iOS), its **first build** uses the current product version.

Example: Web is at `0.5.0`. When iOS launches, its version is also `0.5.0` — feature-parity with web.

If a platform has **unique features not in web**, those are documented as platform-specific entries in CHANGELOG.md.

### 4.4 Feature Flags for Cross-Platform Parity

Features not yet available on a platform are gated behind:
- `featureFlags.ts` (web)
- Remote config (mobile)
- Runtime checks (desktop)

This prevents version skew — the version number stays consistent even if some features are rolling out gradually.

---

## 5. Monorepo Package Versioning

### 5.1 Version Alignment

All packages in the monorepo **must share the same product version**.

| Package | Current Version | Policy |
|---------|----------------|--------|
| `@tmc/web` | `0.5.0` | Leading version — source of truth |
| `@tmc/core` | `0.5.0` | Locked to web version |
| `@tmc/ui` | `0.5.0` | Locked to web version |
| `@tmc/board` | `0.5.0` | Locked to web version |
| `@tmc/presets` | `0.5.0` | Locked to web version |
| `tmc-studio` (root) | `0.5.0` | Workspace metadata only |

**Exception:** If a package is publicly published to npm, it needs independent SemVer. Currently all packages are `"private": true`.

### 5.2 Workspace Dependencies

All inter-package dependencies use `workspace:*` protocol:

```json
"dependencies": {
  "@tmc/core": "workspace:*",
  "@tmc/ui": "workspace:*"
}
```

This ensures that during development, packages always consume the local version.  
During CI/CD, `pnpm publish` replaces `workspace:*` with the actual version.

### 5.3 Version Bump Procedure

```bash
# Bump ALL packages and tag the release
pnpm version 0.6.0
```

Or individually:

```bash
# Bump only apps/web (source of truth), then sync others manually
cd apps/web && pnpm version minor
```

**Prefer the monorepo-wide approach.** Sync all packages to avoid confusion.

---

## 6. CHANGELOG.md Structure

The changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) with these additions:

### Release Header Format

```markdown
## [0.5.0] - 2026-06-13

### Added
- ... new features ...

### Changed
- ... user-facing changes ...

### Fixed
- ... bug fixes ...

### Internal
- ... refactors, tests, CI ...

### Docs
- ... documentation updates ...
```

### Pre-release Header Format

```markdown
## [0.6.0-beta.1] - 2026-06-20
```

### Platform-Specific Sections

When multi-platform is active, add platform badges:

```markdown
### Added
- **Export dropdown** [web] [ios] [android] [desktop]
- **Touch gestures** [ios] [android] — not available on web/desktop
```

---

## 7. Tagging Strategy

Git tags follow the product version:

```bash
git tag v0.5.0
git tag v0.5.0-beta.1
git tag v0.6.0+20260620.1400.web   # optional build metadata
git push --tags
```

Tags trigger CI/CD pipelines per platform:
- `v*` → web deploy (Netlify)
- `v*` + iOS config → App Store Connect
- `v*` + desktop config → electron-builder

---

## 8. UI: Dynamic Version in Footer

Wersja w stopce aplikacji jest **dynamiczna** — `AppShell.tsx` importuje `version` z `apps/web/package.json`:

```tsx
import appPkg from '../../package.json';

<Footer version={appPkg.version} ... />
```

**Zasada:** Nigdy nie hardcoduj wersji w `<Footer version="x.y.z">`. Po kazdym bumpie wersja w stopce aktualizuje sie automatycznie.

## 9. Agent Instructions

Agenci (Copilot, MasterAutopilot, Delivery) maja nastepujace instrukcje dotyczace wersjonowania:

| Plik | Co zawiera |
|------|-----------|
| `.github/copilot-instructions.md` | Sekcja **Wersjonowanie aplikacji** — zasady bumpa, CHANGELOG, Footer |
| `docs/AGENT_ORCHESTRATION.md` | Sekcja **Wersjonowanie** w rozdziale 5 — checklista na SprintGate |
| `docs/VERSIONING.md` (ten plik) | Pelna polityka |

Przed ACCEPT Sprint, MasterVerifier sprawdza:

- [ ] Czy sprint wymaga bumpa? Jesli tak — czy zostal wykonany na wszystkich `package.json`?
- [ ] Czy `CHANGELOG.md` odzwierciedla zmiany?
- [ ] Czy wersja w Footer jest dynamiczna (import z `package.json`)?

## 10. IDE / App Config Files

| File | Field | Value |
|------|-------|-------|
| `package.json` (root) | `version` | Product version (`0.5.0`) |
| `apps/web/package.json` | `version` | Product version (`0.5.0`) |
| `packages/*/package.json` | `version` | Product version (`0.5.0`) |
| `docs/FEATURE_SPEC.md` | `Version` | Product version + doc patch (`0.5.0`) |
| `docs/DESIGN_SYSTEM.md` | `Version` | Design system version (independent: `1.1.0`) |
| `docs/VERSIONING.md` | `Version` | Policy document version (independent: `1.1.0`) |
| `CHANGELOG.md` | `[Unreleased]` | Unreleased changes, released versions match product |

---

## 11. Examples

### Current State (2026-06-13)

```
Product version: 0.5.0
Type:            MVP feature release
Contains:
  - Sprint A: Quick wins UX
  - Sprint C: Arrow numbering + undo
  - Sprint E: Help sidebar + floating button
  - Sprint F: Coach Tour onboarding
  - Sprint G: Autosave + ProjectsDrawer
  - Export dropdown (PNG/JPG/PDF⭐/GIF⭐)
  - SmartBottomBar
  - First Impression UX (animated empty state + celebration)
  - Cone family (3 variants)
```

### Next Beta Release (example)

```
Product version: 0.6.0-beta.1
Type:            Beta release
Contains:
  - All 0.5.0 features
  - Bug fixes
  - Stripe QA
  - Production migration
```

### Stable 1.0.0 (example trigger)

```
All core features complete
No known critical bugs
Stripe payments verified
Multi-platform tested
```