#!/usr/bin/env bash
#
# TMC Studio — desktop helper (Tauri).
# Usage:
#   ./scripts/desktop.sh setup     # install deps + check toolchain
#   ./scripts/desktop.sh dev       # run the app in a native window (hot reload)
#   ./scripts/desktop.sh build     # build local installers (.dmg / .app)
#   ./scripts/desktop.sh release X.Y.Z   # bump version, commit, tag, push (CI builds the rest)
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }

need() { command -v "$1" >/dev/null 2>&1 || { red "Missing: $1"; return 1; }; }

cmd_setup() {
  green "→ Checking toolchain"
  need node || { red "Install Node 20+"; exit 1; }
  if ! command -v pnpm >/dev/null 2>&1; then
    green "→ Enabling pnpm via corepack"; corepack enable || true
  fi
  if ! command -v cargo >/dev/null 2>&1; then
    red "Rust not found. Install it once with:"
    echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
  fi
  green "→ Installing dependencies (updates pnpm-lock.yaml)"
  pnpm install
  green "✓ Setup done. Next: ./scripts/desktop.sh dev"
}

cmd_dev()   { cd apps/web && pnpm tauri:dev; }
cmd_build() { cd apps/web && pnpm tauri:build; green "✓ Installers in apps/web/src-tauri/target/release/bundle/"; }

cmd_release() {
  local v="${1:-}"
  [ -n "$v" ] || { red "Usage: ./scripts/desktop.sh release X.Y.Z"; exit 1; }
  [[ "$v" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { red "Version must be X.Y.Z"; exit 1; }
  green "→ Bumping apps/web/package.json to $v"
  node -e "const f='apps/web/package.json';const j=require('./'+f);j.version='$v';require('fs').writeFileSync(f,JSON.stringify(j,null,2)+'\n')"
  green "→ Committing + tagging v$v"
  git add -A
  git commit -m "release(desktop): v$v"
  git tag "v$v"
  git push origin HEAD
  git push origin "v$v"
  green "✓ Pushed tag v$v — GitHub Actions is building macOS + Windows now."
  green "  When it finishes: open GitHub → Releases → publish the draft."
}

case "${1:-}" in
  setup)   cmd_setup ;;
  dev)     cmd_dev ;;
  build)   cmd_build ;;
  release) shift; cmd_release "${1:-}" ;;
  *) echo "Usage: $0 {setup|dev|build|release X.Y.Z}"; exit 1 ;;
esac
