## Summary

<!-- What changes and why. Link the launch checklist item if there is one. -->

## Checklist

- [ ] Bug fix comes with a test that fails without the fix
- [ ] Green: `pnpm test`, `pnpm test:functions`, `pnpm typecheck`, `pnpm lint`, `pnpm build`
- [ ] E2E (`pnpm e2e`) run for changes in the editor, saving, auth or billing
- [ ] Migration: file in `supabase/migrations`, `pnpm test:db` green, applied with `supabase db push` (never by hand)
- [ ] New texts in `packages/ui/src/locales/{en,pl,es}.ts`
- [ ] Screenshot for UI changes
- [ ] Impact on existing user data described (none / migration / cleanup)
- [ ] `CHANGELOG.md` updated when this goes into a release
