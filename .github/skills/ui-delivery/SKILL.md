---
name: ui-delivery
description: Implementacja zmian UI/React/Tailwind/Konva zgodnie z design systemem, mobile-first, a11y, command boundaries i tokenami TMC Studio.
---

# Skill: UI Delivery

Zmiany UI/React/Tailwind/Konva w TMC Studio.

---

## Kiedy uzywac

- Implementacja albo modyfikacja komponentu w `packages/ui/src/`.
- Zmiana canvasa, warstw, Konva nodes albo viewportu w `packages/board/src/` lub `apps/web/src/app/board/`.
- Zmiana flow w `apps/web/src/app/`, `apps/web/src/hooks/`, `packages/ui/src/*Modal.tsx`, `RightInspector`, `ProjectsDrawer`, `PricingModal`.
- Zmiana styli, layoutu, responsywnosci, a11y, animacji, toolbarow, bottom sheetow, drawerow.

---

## Zawsze przeczytaj najpierw

- `docs/DESIGN_SYSTEM.md`.
- `docs/AGENTS_CHECKLIST.md`.
- `docs/UX_PATTERNS.md`, jesli zmiana dotyczy modali, drawerow, onboarding, pricing albo user journey.
- `docs/DRAG_DROP_PATTERN.md`, jesli zmiana dotyczy drag/resize/preview.
- `docs/IMPLEMENTATION_CONTRACTS.md`, jesli zmiana dotyczy command pattern, history albo canvas interactions.
- Lokalny komponent najblizej zmiany.

Typowe pliki:

- `packages/ui/src/index.ts` - eksport nowych komponentow.
- `packages/ui/src/theme/tokens.css` - tokeny.
- `apps/web/tailwind.config.js` - Tailwind mapping.
- `apps/web/src/index.css` - globalne klasy/utilities.
- `apps/web/src/app/board/BoardPage.tsx`, `BoardCanvasSection.tsx`, `BoardOverlays.tsx`.
- `apps/web/src/app/board/canvas/CanvasAdapter.tsx`, `CanvasElements.tsx`.
- `packages/board/src/*Node.tsx` - Konva nodes.

---

## Zasady implementacji

- Mobile-first: projektuj od `sm`/`md`, potem `lg`/`xl`.
- Uzywaj istniejacych komponentow z `packages/ui/src` zamiast tworzyc nowe.
- Nowy komponent UI dodaj w `packages/ui/src/Nazwa.tsx` i eksportuj w `packages/ui/src/index.ts`.
- Kolory przez tokeny: `bg-surface`, `bg-surface2`, `text-text`, `text-muted`, `border-border`, `text-accent`, `bg-accent`.
- Team colors i drawing palette moga uzywac kontrolowanych hexow z `SHARED_COLORS`/team config.
- Zero inline styles w DOM UI, chyba ze to kontrolowany kolor/podglad swatcha albo wymagane przez canvas/Konva.
- Z-index przez tokeny: `z-canvas`, `z-inspector`, `z-topbar`, `z-bottombar`, `z-toast`, `z-modal`, `z-palette`.
- Interaktywne ikon-only controls musza miec `aria-label`.
- Focus visible dla klawiatury.
- Animacje przez istniejace klasy i duration tokens (`duration-fast`, `duration-normal`).
- Nie dodawaj biblioteki ikon bez zgody. Jesli projekt uzywa inline SVG, utrzymaj ten pattern.

---

## i18n (obowiazkowe)

Kazdy user-facing tekst przechodzi przez warstwe tlumaczen. Zero hardcoded stringow w UI.

- **3 jezyki zawsze:** nowy lub zmieniony tekst dodaj jako klucz w `packages/ui/src/locales/en.ts`, `pl.ts` ORAZ `es.ts`. Te same klucze, ta sama struktura we wszystkich trzech.
- **Komponenty React:** `const { t } = useTranslation();` z `@tmc/ui`, uzywaj `t('namespace.key')`. Parametry: `t('key', { count })`.
- **Kod nie-Reactowy** (store, slices, utils nie bedace hookami): nie wolaj `useTranslation()`. Zapisz sentinel-klucz (np. `auth.errorOfflineMode`) i tlumacz w komponencie renderujacym (wzorzec: `error.startsWith('auth.error') ? t(error) : error`).
- **Nazewnictwo kluczy:** grupuj po obszarze/komponencie (`projectToast.*`, `settings.*`, `palette.*`). Nie tworz duplikatow — najpierw sprawdz, czy klucz juz istnieje.
- **Nie tlumacz:** nazwy marki (`TMC Studio`), keywordy potwierdzen (`DELETE`), `logger.*`/`console.*`, komentarze, meta/SEO.
- Pelna regula: `docs/SYSTEM_ARCHITECTURE.md` §11 Tier 1.

---

## Konva / Canvas rules

- Preview podczas drag/resize/rotate trzymaj lokalnie lub w intent path bez spamowania history.
- Commit do history tylko na koniec akcji (`pointerUp`, drop, explicit apply).
- `CanvasAdapter` bundluje dane i przekazuje propsy do `CanvasElements`; nie mieszaj odpowiedzialnosci.
- `CanvasElements` i node components nie powinny importowac store, jesli da sie przekazac props/callback.
- Dla zoom/pan sprawdz `BoardCanvasSection.tsx`, `useViewportSync.ts`, `viewportUtils.ts`.
- Dla resize/drag trzymaj wzorzec preview/commit z `ZoneNode.tsx`, `ArrowNode.tsx`, `useBoardPageHandlers.ts`.
- Zmiany w `PlayerNode`, `ArrowNode`, `ZoneNode`, `TextNode`, `EquipmentNode` sprawdz pod selekcje, hover, drag, memoization i hit bounds.

---

## Command / store boundaries

- UI user actions powinny isc przez commands/callbacki, nie bezposrednio w losowe slice actions.
- Jesli dotykasz starego miejsca, ktore juz uzywa store selectors w `useBoardPageState.ts`, nie rob big-bang refaktoru. Zmien minimalnie i zapisz ryzyko architektoniczne.
- Nie dodawaj nowych raw `useBoardStore.getState()` w komponentach UI bez uzasadnienia.
- Nie dodawaj nowych cross-slice calls bez sprawdzenia `docs/SYSTEM_ARCHITECTURE.md` i `docs/IMPLEMENTATION_CONTRACTS.md`.

---

## Verification checklist

- [ ] Komponent dziala przy pustych danych.
- [ ] Komponent dziala przy duzej ilosci danych / dlugich nazwach.
- [ ] Mobile layout nie nachodzi na canvas, bottom bar, zoom widget ani modale.
- [ ] Stany loading/error/empty sa obsluzone albo nie dotycza.
- [ ] Icon-only controls maja `aria-label`.
- [ ] Focus visible dziala.
- [ ] Brak nieuzasadnionych hardcoded hexow.
- [ ] Brak nieuzasadnionych inline styles.
- [ ] Z-index przez tokeny.
- [ ] Dark mode nie ma kontrastowych regresji.
- [ ] Konva/canvas nie tworzy dodatkowych history snapshotow podczas preview.
- [ ] `packages/ui/src/index.ts` zaktualizowany, jesli dodano eksportowany komponent.
- [ ] `docs/FEATURE_SPEC.md` zaktualizowany, jesli zmieniono user-facing behavior.
- [ ] Brak hardcoded user-facing stringow — wszystko przez `t()`.
- [ ] Nowe klucze i18n istnieja w `en.ts`, `pl.ts` ORAZ `es.ts` (te same klucze).

---

## Przydatne checks

```bash
rg -n "style=\\{\\{|#[0-9a-fA-F]{3,8}|z-\\[|z-10|z-20|z-50|bg-gray|text-blue|border-gray" packages/ui apps/web/src packages/board/src
rg -n "aria-label" packages/ui/src apps/web/src
# i18n: wykryj kandydatow na hardcoded user-facing stringi w komponentach
rg -n ">[A-Z][a-zA-Z ]{3,}<|(placeholder|title|aria-label|alt)=\"[A-Z][a-zA-Z ]{3,}\"" packages/ui/src apps/web/src --type tsx
# i18n: sprawdz parytet nowego klucza we wszystkich jezykach (podmien NAZWA_KLUCZA)
rg -n "NAZWA_KLUCZA:" packages/ui/src/locales/en.ts packages/ui/src/locales/pl.ts packages/ui/src/locales/es.ts
pnpm --filter @tmc/web typecheck
pnpm --filter @tmc/ui typecheck
pnpm --filter @tmc/board typecheck
```

Uwaga: grep moze wykryc dozwolone hex values w team colors, drawing palette i Konva. Nie traktuj kazdego trafienia jako blad; sklasyfikuj je.

---

## Expected evidence

- Lista przeczytanych dokumentow i komponentow.
- Lista zmienionych plikow.
- Uzyte komponenty/patterny i dlaczego.
- Lista tokenow/klas istotnych dla zmiany.
- Wyniki typecheck/build/test albo powod pominiecia.
- Manual UI checks: desktop + mobile viewport.
- Screenshot/opis wizualny, jesli zmiana jest widoczna.
- Lista swiadomych odstepstw od design systemu, jesli sa.
