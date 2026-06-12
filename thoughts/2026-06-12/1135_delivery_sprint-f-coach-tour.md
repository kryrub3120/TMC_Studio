# Delivery note — Sprint F Coach Tour

## Summary

Implemented Sprint F as a 6-step Coach Tour onboarding instead of the original simple 5-step tooltip. The tour is meant to be the first experience for a guest: fast, visual, anchored to real UI targets, and focused on actions that make the board feel immediately usable.

## Product decisions captured

- First-run tutorial is now a Coach Tour with spotlight, curved arrow, target label, keycaps, mini-demo, progress, Back/Next/Skip.
- Steps cover: shortcuts, Inspector/PPM editing, pitch/player orientation and vision, equipment shortcuts, export, more options/Pro.
- Restart from Help Sidebar force-shows the tutorial on the current board.
- The old `elements.length === 0` gate was removed because the default new board starts with an initial formation, so the tutorial must work on the real starter state.
- Orientation copy follows current product shortcuts: `O` for pitch orientation, `[`, `]`, `V` for player orientation/vision. `W` remains Print Mode.

## Files touched

- `packages/ui/src/TutorialOverlay.tsx`
- `packages/ui/src/tutorialSteps.ts`
- `packages/ui/src/TopBar.tsx`
- `packages/ui/src/RightInspector.tsx`
- `packages/ui/src/HelpSidebar.tsx`
- `packages/ui/src/BottomStepsBar.tsx`
- `apps/web/src/store/useUIStore.ts`
- `apps/web/src/app/board/BoardPage.tsx`
- `apps/web/src/app/routes/useBoardPageState.ts`
- `apps/web/src/store/slices/documentSlice.ts`

## Verification

- `packages/ui`: `tsc --noEmit` passed.
- `apps/web`: `tsc --noEmit` passed.
- `apps/web`: `vitest run` passed, 99/99 tests.
- Browser QA desktop 1280x720: restart from Help Sidebar shows the Coach Tour, spotlight/arrow/card are visible and aligned.
- Browser QA mobile 390x844: Coach card remains inside the viewport and no console errors were observed.

## Follow-up

- Optional analytics can be added later for tour completion/skip/drop-off per step.
- Copy can be localized after the rest of the UI language strategy is decided.
