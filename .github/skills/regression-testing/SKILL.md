---
name: regression-testing
description: Dobor i wykonanie testow regresji, edge case checks, komend pnpm oraz manual checks po implementacji.
---

# Skill: Regression Testing

Dobor testow i evidence po implementacji/fixach.

---

## Kiedy uzywac

- Po kazdym DeliveryPass.
- Po kazdym FixPass.
- Przed `ACCEPT SPRINT`.
- Gdy zmiana dotyczy store, commands, canvas, payments, auth, DB, exports, entitlements albo UI flow.

---

## Zawsze przeczytaj najpierw

- `package.json` w root.
- `apps/web/package.json`.
- Package-specific `package.json`, jesli zmiana dotyczy `packages/core`, `packages/ui`, `packages/board`, `packages/presets`.
- Istniejace testy w:
  - `apps/web/src/store/slices/__tests__/`
  - `apps/web/src/utils/__tests__/`
- Zmienione pliki i najblizsze testy.

---

## Test selection matrix

| Zmiana | Minimum checks |
|--------|----------------|
| Type-only/docs-only | grep/check dokumentacji; typecheck opcjonalnie |
| `packages/core` | `pnpm --filter @tmc/core typecheck`, root typecheck jesli API eksportowane |
| `packages/ui` | `pnpm --filter @tmc/ui typecheck`, `pnpm --filter @tmc/web typecheck` |
| `packages/board` | `pnpm --filter @tmc/board typecheck`, `pnpm --filter @tmc/web typecheck` |
| `apps/web/src/store` | `pnpm --filter @tmc/web test`, `pnpm --filter @tmc/web typecheck` |
| Canvas interaction | relevant unit tests + manual canvas check |
| Billing/Stripe | Stripe QA skill + typecheck/build |
| DB migration | DB Migration skill + local migration verification |
| Cross-package | root `pnpm typecheck`, root `pnpm build` if feasible |

---

## Edge cases

- Empty arrays / no selected element / no current project.
- `null`/`undefined` optional fields.
- Long names/labels.
- Rapid repeated clicks.
- Undo/redo after action.
- Mobile viewport.
- Offline/error state.
- Guest/free/pro/team entitlement states.
- For canvas: zoomed/panned viewport, selected groups, locked/hidden layers, playback mode.

---

## Commands

Prefer narrow commands first:

```bash
pnpm --filter @tmc/web test
pnpm --filter @tmc/web typecheck
pnpm --filter @tmc/ui typecheck
pnpm --filter @tmc/board typecheck
pnpm --filter @tmc/core typecheck
```

Broader checks when risk/blast radius is higher:

```bash
pnpm typecheck
pnpm build
pnpm lint
```

Root CI currently runs typecheck and build. Tests exist in `@tmc/web` via Vitest, but GitHub Actions may not run them unless CI is updated.

---

## Manual checks

Use manual checks when UI/canvas behavior is not covered by tests:

- Open app on desktop viewport.
- Check mobile viewport.
- Test the changed flow happy path.
- Test failure/empty state.
- Test undo/redo if canvas mutation.
- Test keyboard/focus if interactive UI.
- Capture screenshot or concise visual description.

---

## Expected evidence

- Dlaczego wybrano dane testy.
- Komendy uruchomione i wyniki.
- Lista testow dodanych/zmienionych.
- Manual checklist z wynikiem, jesli dotyczy.
- Niezweryfikowane obszary i ryzyko.
- Decyzja: pass / fail / partial.
