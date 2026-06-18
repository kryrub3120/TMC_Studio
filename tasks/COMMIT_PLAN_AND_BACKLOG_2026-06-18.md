# Commit Plan + Analiza + Backlog dla agentów — 2026-06-18

Branch: `develop`. Working tree: **~102 zmienione/usunięte pliki** (kilka nurtów naraz: edytor,
tutorial, billing/pricing, layout canvas, i18n, docs, infra).

## ⚠️ Blocker (dlaczego commity nie zostały zrobione automatycznie)

W `.git/` znajduje się osierocony **`index.lock`** (0 B). Środowisko, w którym przygotowano te
zmiany, **nie ma uprawnień do usuwania plików w `.git/`** (`rm .git/index.lock` → „Operation not
permitted"), a git odmawia `add`/`commit`, dopóki lock istnieje. Próba commitu przez alternatywny
index też zawiedzie na aktualizacji refów (też wymaga zapisu w `.git/`).

**Najpierw, na swojej maszynie:**
```bash
rm -f .git/index.lock
git status   # potwierdź, że działa
```

Potem wykonaj plan poniżej.

---

## Analiza working tree

Working tree miesza kilka niezależnych nurtów pracy (nic nie było commitowane od
`c9d0a6d feat(ux): pitch-first layout, guided tutorial, dark public site + brand v1.1`):

- **Edytor (ta sesja):** groty strzałek + grubość, obrys stref, domyślne style użytkownika,
  kondensacja inspektora, układ ławki/paska, fix scrolla i przelewania widoku, fix wpięcia PR-4/PR-5.
- **Tutorial:** „coach tour" ujawniający realne elementy UI.
- **Billing/pricing:** wspólny config cen + utwardzenie checkout/portal.
- **Layout/canvas (pitch-first):** duże zmiany w `Pitch.tsx` i warstwach canvas.
- **i18n:** tłumaczenia helpera + brakujące klucze + stringi nowych funkcji.
- **Docs/infra:** porządki w `docs/`, `tasks/`, CHANGELOG, CI, deps.

**Pliki-„huby" dzielone między funkcje** (zawierają hunki z wielu nurtów — przy ścisłej atomowości
użyj `git add -p`, inaczej commit zbierze drobne zmiany z innych funkcji):
`apps/web/src/app/AppShell.tsx`, `packages/ui/src/TopBar.tsx`, `apps/web/src/store/useUIStore.ts`,
`apps/web/src/app/board/BoardPage.tsx`, `packages/ui/src/locales/{en,pl,es}.ts`.

Weryfikacja: `tsc --noEmit` czysty dla `core`, `board`, `ui` oraz `apps/web`.

---

## Rekomendowana sekwencja commitów

Kolejność: infra → niezależne funkcje → edytor → i18n → huby → docs.
Każdy blok to `git add <pliki> && git commit -m "<tytuł>" -m "<opis>"`.

### C1 — chore(build): CI, zależności, turbo
```
.github/workflows/ci.yml  package.json  packages/core/package.json  turbo.json  pnpm-lock.yaml
```
> Konfiguracja CI/pnpm, bump zależności, cache turbo.

### C2 — feat(billing): wspólny config cen + utwardzenie checkout/portal
```
apps/web/src/config/stripe.ts  apps/web/src/pages/PricingPage.tsx  packages/ui/src/PricingModal.tsx
netlify/functions/_stripeConfig.ts  netlify/functions/create-checkout.ts  netlify/functions/create-portal-session.ts
```
> Jedno źródło prawdy cen, propagacja cyklu monthly/yearly, allowlisty origin/URL, customer z auth.

### C3 — feat(tutorial): coach tour ujawnia realne elementy UI
```
packages/ui/src/TutorialOverlay.tsx  packages/ui/src/tutorialSteps.ts  packages/ui/src/ProjectsDrawer.tsx
packages/ui/src/theme/tokens.css  apps/web/src/app/board/BoardTopBarSection.tsx
```
> Kroki otwierają i podświetlają prawdziwe menu/panele; jeden tutorial dla wszystkich planów; fix pętli renderu.

### C4 — feat(pitch): pitch-first layout + refactor canvas  ⚠️ ZWERYFIKUJ DIFFY
```
packages/board/src/Pitch.tsx  packages/board/src/BallNode.tsx  packages/board/src/EquipmentNode.tsx
packages/board/src/TextNode.tsx  apps/web/src/app/board/BoardCanvasSection.tsx
apps/web/src/app/board/canvas/CanvasAdapter.tsx  apps/web/src/components/Canvas/BoardCanvas.tsx
apps/web/src/hooks/useCanvasEventsController.ts  apps/web/src/store/slices/documentSlice.ts
apps/web/src/store/slices/groupsSlice.ts  apps/web/src/store/slices/historySlice.ts
apps/web/src/store/types.ts  apps/web/src/utils/canvasContextMenu.ts  packages/ui/src/PitchPanel.tsx
apps/web/index.html  apps/web/public/favicon.svg
```
> Zmiany spoza tej sesji — przejrzyj `git diff <plik>` i ewentualnie rozbij dalej.

### C5 — feat(editor): groty + grubość strzałek, obrys stref, domyślne style użytkownika
```
packages/core/src/types.ts  packages/board/src/ArrowNode.tsx  packages/board/src/ZoneNode.tsx
packages/board/src/PlayerNode.tsx  packages/ui/src/RightInspector.tsx  packages/ui/src/SettingsModal.tsx
packages/ui/src/index.ts  apps/web/src/store/slices/elementsSlice.ts
apps/web/src/app/board/useBoardPageHandlers.ts  apps/web/src/app/routes/useBoardPageState.ts
apps/web/src/app/orchestrators/ModalOrchestrator.tsx  apps/web/src/app/board/canvas/CanvasElements.tsx
apps/web/src/components/Canvas/layers/ArrowsLayer.tsx
apps/web/src/components/Canvas/layers/ZonesLayer.tsx
apps/web/src/components/Canvas/layers/PlayersLayer.tsx
```
> `ArrowElement.startHead/endHead`, `ZoneElement.borderWidth/showCorners`, `ArrowDefaults`/`ZoneDefaults`.
> Akcje store `updateArrowStyle`/`updateZoneStyle`, routing w handlerze, mapowanie w `inspectorElement`,
> render grotów/obrysu, „Ustaw jako domyślne" + edytor w Preferencjach. Fix etykiety zawodnika (pomiar tekstu).
> (UWAGA: `useUIStore.ts` z polami `arrowDefaults/zoneDefaults` jest w C8 — albo przenieś go tutaj.)

### C6 — feat(editor): układ ławki/paska animacji + kondensacja inspektora
```
packages/ui/src/SquadBench.tsx  packages/ui/src/SmartBottomBar.tsx  apps/web/src/app/board/BoardPage.tsx
```
> Ławka jako poziomy pasek (przełącznik z boku), pasek animacji in-flow + ukrywanie, `min-h-0` (fix przelewania),
> domyślna szerokość inspektora 340 px. (`BoardPage.tsx` to hub — patrz uwaga niżej.)

### C7 — fix(i18n): helper + brakujące klucze + stringi funkcji (pl/en/es)
```
packages/ui/src/locales/en.ts  packages/ui/src/locales/pl.ts  packages/ui/src/locales/es.ts
packages/ui/src/HelpSidebar.tsx  packages/ui/src/CheatSheetOverlay.tsx  packages/ui/src/helpSidebarData.ts
packages/ui/src/CommandPaletteModal.tsx
```
> Tłumaczenie skrótów w helperze, 14 brakujących kluczy (`topbar.pitch` itd.), klucze grotów/stref/defaultów,
> poprawa kontrastu. (Locale to huby — zawierają też klucze z C2/C3.)

### C8 — chore(app): wspólne wiring huby  ⚠️ MIESZANE — rozważ `git add -p`
```
apps/web/src/app/AppShell.tsx  packages/ui/src/TopBar.tsx  apps/web/src/store/useUIStore.ts
apps/web/src/hooks/useKeyboardShortcuts.ts  apps/web/src/commands/commandPalette/createCommandActions.ts
apps/web/src/store/useAuthStore.ts
```
> Pliki dotykane przez wiele funkcji (edytor + tutorial + billing). Dla atomowej historii rozdziel hunki.

### C9 — docs: changelog, plany, status sprintu, porządki
```
CHANGELOG.md  README.md  docs/  tasks/NEXT_TASK.md  tasks/SPRINT_EDITOR_PROPERTIES_2026-06-18.md
tasks/COMMIT_PLAN_AND_BACKLOG_2026-06-18.md
git rm docs/DOCUMENTATION_CLEANUP_PLAN.md docs/PLAN_BRAKUJACYCH_FUNKCJI.md \
       docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md tasks/WEBSITE_LAUNCH_SPRINT_PLAN.md
```

> Uwaga o hubach: `useUIStore.ts`, `BoardPage.tsx`, `AppShell.tsx`, `TopBar.tsx`, `locales/*` należą
> jednocześnie do kilku commitów. Jeśli zależy Ci na czystej, atomowej historii — użyj `git add -p`
> i przypisz hunki do właściwego commitu. Jeśli akceptujesz drobne „przecieki" — commituj plik całością
> w commicie jego dominującej funkcji (jak wyżej).

---

## Backlog dla agentów (przyszła praca)

### P1 — domknięcie funkcji edytora
1. **Defaulty dla zawodników i piłki** — rozszerz wzorzec `ArrowDefaults`/`ZoneDefaults` o `PlayerDefaults`
   (kształt/kolor/rozmiar/font) i `BallDefaults`; „Ustaw jako domyślne" + edytor w Preferencjach.
2. **Cloud sync nowych preferencji** — `arrowDefaults`/`zoneDefaults` są tylko w localStorage; dopnij do
   `syncPreferencesToCloud` + schemat Supabase (kolumna `preferences`).
3. **Testy** — unit dla `updateArrowStyle`/`updateZoneStyle`, round-trip serializacji nowych pól
   (`startHead/endHead/borderWidth/showCorners`), snapshot sekcji inspektora (strzałka/strefa).

### P2 — jakość i18n
4. **Guard i18n w CI** — dodaj skrypt sprawdzający, że każdy `t('a.b')` ma klucz w en/pl/es (baza = `en`);
   wykryje surowe klucze zanim trafią na prod. (Bazę można oprzeć o prototyp użyty w tej sesji.)
5. **Audyt dev-only stringów** — np. `topbar.devFree: 'Bez Premium'` (polski tekst w `en.ts`); uporządkuj
   lub odetnij dev-only przed launchem.

### P3 — layout / a11y / QA
6. **Weryfikacja skalowania sceny Konvy** po przejściu paska animacji na in-flow — e2e/visual test rozmiaru
   boiska przy zwijaniu ławki/paska i zmianie breakpointów (sm/md).
7. **Ławka składu** — opcjonalne strzałki przewijania zamiast scrolla, UX dodawania per drużyna, QA na małych ekranach.
8. **A11y nowych kontrolek** — `SegmentedControl` z ikonami: potwierdź odczyt przez czytnik ekranu (mają `title`/`aria-label`),
   focus ring, nawigacja klawiaturą.
9. **Strefy-poligony** — QA markerów narożnych i obrysu dla `shape === 'polygon'`.

### P4 — higiena repo
10. **Lock + historia** — usuń `.git/index.lock`, wykonaj plan commitów; rozważ pre-commit hook
    (lint + typecheck) i mniejsze, tematyczne PR-y, by uniknąć kolejnego dużego, mieszanego working tree.

