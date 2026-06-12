---
name: ci-debug
description: Naprawa problemow z buildem, typecheck, lintem i CI minimalnymi zmianami bez refaktoru przy okazji.
---

# Skill: CI/Debug

Naprawa problemow z buildem, typecheck, lintem i CI w TMC Studio.

---

## Kiedy uzywac

- `pnpm typecheck`, `pnpm build`, `pnpm lint` albo `pnpm --filter ...` failuje.
- GitHub Actions / Netlify build failuje.
- Import/export/type error po zmianach cross-package.
- Vite/Vitest/TS config problem.

---

## Zawsze przeczytaj najpierw

- Root `package.json`.
- Dotkniety package `package.json`.
- `turbo.json`.
- `tsconfig.json` root i package tsconfig.
- `apps/web/vite.config.ts`, jesli problem dotyczy web/test/build.
- Pierwszy realny blad z outputu, nie tylko ostatnia linie.

---

## Command map

Root:

```bash
pnpm typecheck
pnpm build
pnpm lint
```

Narrow:

```bash
pnpm --filter @tmc/web typecheck
pnpm --filter @tmc/web build
pnpm --filter @tmc/web test
pnpm --filter @tmc/ui typecheck
pnpm --filter @tmc/board typecheck
pnpm --filter @tmc/core typecheck
pnpm --filter @tmc/presets typecheck
```

---

## Debug workflow

1. Reproduce narrowest failing command.
2. Read first error with file, line, code/rule.
3. Identify whether error is:
   - missing import/export,
   - stale public API,
   - TS type mismatch,
   - ESM/CJS/import extension issue,
   - lint/no-unused-vars,
   - test environment issue,
   - Vite bundle issue.
4. Patch smallest affected area.
5. Re-run the same command.
6. If fixed, run next broader relevant command.

---

## Minimal fix rules

- Nie refaktoruj przy okazji.
- Nie zmieniaj TS/ESLint/Vite config, chyba ze blad jest w konfiguracji.
- Nie dodawaj dependency bez zgody usera.
- Nie uzywaj `// @ts-ignore`.
- `// @ts-expect-error` tylko gdy jest intentional i opisane.
- Nie usuwaj testu, zeby build przeszedl.
- Nie zmieniaj public API pakietu bez aktualizacji eksportow i zaleznosci.

---

## Common TMC issues

- Nowy komponent w `packages/ui/src` wymaga eksportu w `packages/ui/src/index.ts`.
- Zmiana w `packages/core/src/types.ts` moze wymagac update w `packages/board`, `packages/ui`, `apps/web`.
- Web package uzywa Vitest node environment z `apps/web/src/test-setup.ts`.
- Netlify functions uzywaja ESM/TypeScript i Stripe API version z funkcji.
- Frontend nie powinien importowac backend-only `_stripeConfig.ts`.
- Functions nie powinny importowac z `apps/web/src/config/stripe.ts`.

---

## Expected evidence

- Failing command przed poprawka.
- Pierwszy istotny blad.
- Minimalna przyczyna.
- Zmienione pliki.
- Command po poprawce i wynik.
- Jesli nie naprawiono: blokada, dalszy krok i ryzyko.
