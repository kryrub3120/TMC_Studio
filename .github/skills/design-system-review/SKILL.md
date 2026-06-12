---
name: design-system-review
description: Review zgodnosci UI z design systemem TMC Studio, tokenami, spacingiem, radius, z-index, responsywnoscia i dostepnoscia.
---

# Skill: Design System Review

Niezalezna weryfikacja zmian UI przed akceptacja sprintu.

---

## Kiedy uzywac

- Po kazdej zmianie UI, canvas overlays, toolbarow, drawerow, modali, inspectorow.
- Przed `ACCEPT SPRINT`, gdy sprint dotyka `packages/ui`, `packages/board`, `apps/web/src/app`, `apps/web/src/hooks`.
- Gdy MasterVerifier potrzebuje sprawdzic zgodnosc wizualna i a11y.

---

## Zawsze przeczytaj najpierw

- `docs/DESIGN_SYSTEM.md`.
- `docs/AGENTS_CHECKLIST.md`.
- Zmienione komponenty i ich sasiednie komponenty.
- `packages/ui/src/theme/tokens.css`, jesli zmiana dotyczy tokenow.
- `apps/web/tailwind.config.js`, jesli zmiana dotyczy klas Tailwind.
- `docs/UX_PATTERNS.md`, jesli zmiana dotyczy user journey.

---

## Review scope

### Tokeny i kolory

- [ ] Kolory UI przez tokeny (`bg-surface`, `text-muted`, `border-border`, `bg-accent`).
- [ ] Hardcoded hex tylko dla team colors, drawing palette, pitch/canvas primitives lub udokumentowanej potrzeby.
- [ ] Brak nowych `bg-gray-*`, `text-blue-*`, `border-gray-*` w UI.
- [ ] Dark mode dziala z tymi samymi tokenami.

### Layout / spacing / typography

- [ ] Spacing zgodny z tokenami (`p-sm`, `p-md`, `gap-md`, itd.) albo lokalnym patternem.
- [ ] Radius zgodny (`rounded-sm`, `rounded-md`, `rounded-lg`) bez przesadnie pillowego UI.
- [ ] Typografia pasuje do kontenera: kompaktowe panele nie uzywaja hero-size text.
- [ ] Dlugie etykiety i nazwy nie wychodza poza kontener.
- [ ] Layout nie zmienia rozmiaru przy hover/focus/dynamic text.

### Z-index i overlaye

- [ ] Uzyte tokeny z-index, nie magic numbers.
- [ ] Modal/drawer/bottom sheet nie koliduje z toast, topbar, bottombar, zoom widget.
- [ ] Nie ma card-in-card ani nadmiarowych floating cards.

### Dostepnosc

- [ ] Icon-only controls maja `aria-label`.
- [ ] Przyciski i inputs maja sensowne labels.
- [ ] Focus visible dziala.
- [ ] Escape/Enter zachowania sa zachowane w modalach/inputach, jesli dotyczy.
- [ ] Role: `dialog`, `alertdialog`, `menu`, `button` zgodne z funkcja.

### Responsywnosc

- [ ] Mobile (`sm`), tablet (`md/lg`) i desktop (`xl`) maja sensowny layout.
- [ ] RightInspector / BottomSheet / FAB zachowuja oczekiwane breakpoints.
- [ ] Touch targets sa wystarczajace.
- [ ] Canvas pozostaje uzywalny po otwarciu paneli.

### Stany

- [ ] Loading state.
- [ ] Error state.
- [ ] Empty state.
- [ ] Disabled state.
- [ ] Success/feedback state przez toast/modal, jesli akcja jest user-facing.

---

## Przydatne checks

```bash
rg -n "style=\\{\\{|#[0-9a-fA-F]{3,8}|z-\\[|z-10|z-20|z-50|bg-gray|text-blue|border-gray" packages/ui apps/web/src packages/board/src
rg -n "aria-label|role=|tabIndex|onKeyDown" packages/ui/src apps/web/src
```

Kazde trafienie sklasyfikuj jako:

- OK - dozwolony canvas/team/palette/pattern,
- REVIEW - wymaga uzasadnienia,
- FIX - naruszenie design systemu.

---

## Expected evidence

- Lista sprawdzonych komponentow.
- Lista grep-checkow i klasyfikacja trafien.
- Wynik desktop/mobile review.
- Znalezione niezgodnosci z severity i plikiem.
- Decyzja: `Zgodne z design systemem` albo lista wymaganych poprawek.
