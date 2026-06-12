---
name: architecture-review
description: Sprawdzanie zgodnosci kodu z architektura TMC Studio, hard rules, command pattern, granice modulow i anty-patterny przed akceptacja sprintu.
---

# Skill: Architecture Review

Niezalezna weryfikacja architektury sprintu.

---

## Kiedy uzywac

- Przed akceptacja kazdego sprintu z kodem.
- Przy zmianach w `apps/web/src/store`, `apps/web/src/commands`, `apps/web/src/app`, `apps/web/src/hooks`.
- Przy zmianach canvas/Konva, historii undo, autosave, entitlements, auth, billing.
- Przy nowych abstractions, nowych dependencies albo zmianach modulow.

---

## Zawsze przeczytaj najpierw

- `docs/SYSTEM_ARCHITECTURE.md` sekcja 11.
- `docs/ARCHITECTURE_OVERVIEW.md`.
- `docs/IMPLEMENTATION_CONTRACTS.md`.
- `docs/IMPLEMENTATION_CONTRACTS.md`.
- `docs/archive/strategy/MODULE_BOUNDARIES.md`, jesli zmiana dotyczy historycznych granic modulow.
- `docs/AGENTS_CHECKLIST.md`.
- Zmienione pliki i ich najblizsze sasiedztwo.

---

## Hard Rules check

- [ ] R-GIT: praca nie jest na `main`.
- [ ] R-PROD: brak produkcyjnych komend, brak `.env.production`, brak live Stripe/secrets.
- [ ] R-MVP: brak nowych zaleznosci bez zgody.
- [ ] R-MVP: brak spekulacyjnych abstrakcji.
- [ ] Zakres sprintu nie zostal rozszerzony.

---

## Architecture checks

### UI / commands / store

- [ ] Nowe UI mutations ida przez command/callback/facade zgodnie z lokalnym patternem.
- [ ] Brak nowych losowych `useBoardStore.getState()` w komponentach UI.
- [ ] Brak nowych raw store internals w leaf components.
- [ ] `App.tsx` pozostaje composition-only.
- [ ] Zustand slices nie importuja siebie nawzajem.
- [ ] Cross-slice orchestration jest jawna i uzasadniona.

### History / undo / preview

- [ ] Preview/drag/resize/rotate nie spamuje `pushHistory`.
- [ ] Commit history jest na koncu user action.
- [ ] Undo/redo dla zmienionej funkcji dziala jednym krokiem.
- [ ] Autosave nie jest odpalany przy kazdym ticku preview.

### Canvas boundaries

- [ ] `CanvasAdapter` zbiera dane i przekazuje props.
- [ ] `CanvasElements` renderuje i nie przejmuje logiki orchestration bez powodu.
- [ ] Node components (`PlayerNode`, `ArrowNode`, `ZoneNode`, itd.) nie importuja app store.
- [ ] Layering i event ownership sa jasne.

### Packages / public API

- [ ] `packages/core` nie importuje UI/web.
- [ ] `packages/ui` nie importuje `apps/web`, z wyjatkiem istniejacych legacy fallbackow oznaczonych jako ryzyko.
- [ ] `packages/board` nie importuje web app store.
- [ ] Nowy eksport dodany do odpowiedniego `index.ts`.

---

## Grep checks

```bash
rg -n "useBoardStore\\.getState\\(|useUIStore\\.getState\\(|pushHistory\\(|setState\\(" apps/web/src packages
rg -n "from ['\\\"]\\.\\./\\.\\./apps|from ['\\\"]apps/web|@tmc/web" packages
rg -n "pnpm add|netlify deploy|supabase db push|pnpm supabase:push|pk_live_|sk_live_" .
```

Nie kazde trafienie jest bledem. Porownaj z istniejacymi znanymi patternami i ocen tylko nowe/zmienione miejsca.

---

## Expected evidence

- Lista przeczytanych dokumentow.
- Lista sprawdzonych plikow.
- Wyniki grep-checkow z ocena trafien.
- Naruszenia: severity, plik, zasada, sugerowana poprawka.
- Potwierdzenie: `Architektura zgodna` albo `INTERNAL LOOP required`.
