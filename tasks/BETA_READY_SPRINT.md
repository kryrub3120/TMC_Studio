# Sprint "BETA READY" — Plan działania

> **Data:** 2026-02-19  
> **Cel:** Działająca beta z feedback loopem w ciągu 1–2 dni  
> **Filozofia:** PLG → value first → sygnał od użytkowników → dopiero refaktory architektury  
> **Status:** 📋 DO ZROBIENIA

---

## Zasada prowadząca

```
Beta → feedback → refaktor.
NIE: refaktor → czekamy → może kiedyś beta.
```

Refaktory `cmd.*`, podział wielkich plików, migracja architektury — **po** zebraniu sygnałów od użytkowników. To jest spójne z PLG i filozofią "zero dark patterns".

---

## Mapa sprintu

```
PR-1A  →  PR-1B  →  PR-2  →  BETA LAUNCH  →  OPS   →  DOC CLEANUP
  │          │         │           │             │
V/Shift+V  Inspector  Logger   Feedback     Analytics  Archiwizacja
 fix       showVision          form+invites  minimal    starych docs
  ↓
 2h         2-3h       2h        1h           2h         1h
```

---

## PR-1A — Stabilizacja skrótów V / Shift+V

> **Plik:** `apps/web/src/hooks/useKeyboardShortcuts.ts`  
> **Effort:** 1-2h  
> **Merge moment:** Przed beta launch

### Problem

1. Klawisz `v` jest przechwytywany w dwóch miejscach naraz — w `switch(key)` i w osobnym bloku `e.code === 'KeyV'` → double-trigger
2. Brak guard na `orientationEnabled` — V działa i robi coś wizualnie, nawet gdy orientation jest wyłączone  
3. Focus na `<input>` / `<textarea>` w inspektorze "zjada" skrót globalnie, ale niespójnie

### Rozwiązanie (minimalne, bez cmd.* migracji)

**Krok 1: Usuń duplikat przechwytywania**

Scentralizuj w jednym miejscu. Wybierz: albo `switch(key)` albo `e.code` — nie oba.

```ts
// W switch(key), case 'v':
case 'v':
  if (isCmd) { pasteClipboard(); break; }
  if (isShift) {
    // Shift+V = toggle orientation dla wszystkich graczy
    handleOrientationToggleAll();
    break;
  }
  // V = toggle showVision dla zaznaczonych
  handleVisionToggleSelected();
  break;
```

**Krok 2: Guard na `orientationEnabled`**

```ts
function handleVisionToggleSelected() {
  const orientationEnabled = getPitchSettings().playerOrientationSettings?.enabled;
  if (!orientationEnabled) {
    showToast('Enable player orientation first (Inspector → Orientation)');
    return;
  }
  // ... toggle vision dla selectedIds
}

function handleOrientationToggleAll() {
  const orientationEnabled = getPitchSettings().playerOrientationSettings?.enabled;
  if (!orientationEnabled) {
    showToast('Enable player orientation first (Inspector → Orientation)');
    return;
  }
  // ... toggle orientation dla wszystkich graczy
}
```

**Krok 3: Focus guard — już powinien działać**

Sprawdź czy istniejący focus guard (`if (e.target instanceof HTMLInputElement) return;`) obejmuje też `contentEditable`. Jeśli nie — dodaj:

```ts
const tagName = (e.target as HTMLElement).tagName;
if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;
if ((e.target as HTMLElement).contentEditable === 'true') return;
```

### Akceptacja

- [ ] V toggleuje vision tylko dla zaznaczonych → toast potwierdzający
- [ ] Shift+V toggleuje orientation → toast
- [ ] Gdy orientation wyłączone → toast wyjaśniający, zero crash
- [ ] Focus w inspector input → V nie działa (nie zaznacza zawodnika, nie zmienia nic)
- [ ] Cmd+V → paste działa (bez regresji)

---

## PR-1B — showVision toggle w RightInspector + guard PlayerNode

> **Pliki:** `packages/ui/src/RightInspector.tsx`, `packages/board/src/PlayerNode.tsx`  
> **Effort:** 2-3h  
> **Merge moment:** Razem z PR-1A lub zaraz po

### Problem

Typ `PlayerOrientationSettings` ma pole `showVision: boolean`, ale:
1. `RightInspector` props nie przekazuje `showVision`
2. Brak toggle UI w inspektorze
3. `PlayerNode` może renderować arms/vision nawet gdy `enabled = false`

### Rozwiązanie

**Krok 1: Dodaj `showVision` do RightInspector props**

```tsx
// W interface PlayerOrientationSettingsProps (lub jak to jest zdefiniowane)
playerOrientationSettings?: {
  enabled: boolean;
  showArms: boolean;
  showVision: boolean;  // ← DODAJ
  zoomThreshold: number;
};
```

**Krok 2: Dodaj toggle UI w inspectorze**

W sekcji Orientation, obok toggle `showArms`, dodaj toggle `showVision`:

```tsx
{/* Show Vision toggle */}
<div className="flex items-center justify-between">
  <span className="text-sm text-gray-400">Vision cone</span>
  <Toggle
    checked={playerOrientationSettings.showVision}
    onChange={() => onUpdatePlayerOrientation({
      ...playerOrientationSettings,
      showVision: !playerOrientationSettings.showVision
    })}
    disabled={!playerOrientationSettings.enabled}
  />
</div>
```

**Krok 3: Guard w PlayerNode**

```tsx
// PRZED (brak guardu):
const showVision = orientationSettings.showVision === true && player.showVision !== false;

// PO (z guard na enabled):
const showVision =
  orientationEnabled &&                          // ← GUARD
  orientationSettings.showVision === true &&
  player.showVision !== false;

const showArms =
  orientationEnabled &&                          // ← GUARD
  orientationSettings.showArms === true;
```

### Akceptacja

- [ ] Toggle "Vision cone" widoczny w inspektorze gdy orientation enabled
- [ ] Toggle jest disabled gdy orientation wyłączone
- [ ] Włączenie/wyłączenie reflektuje się natychmiast na canvas
- [ ] Arms nie renderują się gdy `enabled = false` (nawet jeśli showArms = true)
- [ ] Vision nie renderuje się gdy `enabled = false` (nawet jeśli showVision = true)
- [ ] Stan persystuje w cloud save

---

## PR-2 — Globalny logger (wyciszenie 101 console.log)

> **Pliki:** Nowy `apps/web/src/lib/logger.ts` + find & replace  
> **Effort:** 2h  
> **Merge moment:** Przed beta launch (produkcja-ready)

### Problem

101 `console.log/warn/error` w `apps/web/src` — debug logi które:
- Zaśmiecają konsolę użytkownika
- Ujawniają wewnętrzną logikę
- Nie są kontrolowane poziomem ważności

### Rozwiązanie: minimalny logger z __DEV__ flagą

**Krok 1: Stwórz `apps/web/src/lib/logger.ts`**

```ts
/**
 * Minimal logger — wyłączone w produkcji gdy VITE_DEBUG != 'true'
 */
const isDev = import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true';

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.log('[INFO]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);  // warn zawsze (ale nadpisany w prod możliwy)
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);  // error zawsze
  },
};
```

**Krok 2: Zamiana console.log → logger.debug**

Strategia zamiany:
- `console.log('[Auth]...` → `logger.debug('[Auth]...`
- `console.log('[Autosave]...` → `logger.debug('[Autosave]...`
- `console.log('[Projects]...` → `logger.debug('[Projects]...`
- `console.warn(...)` → `logger.warn(...)`
- `console.error(...)` → `logger.error(...)` (zostawić — to są prawdziwe błędy)

Komendy pomocnicze do masowej zamiany:
```bash
# Znajdź wszystkie console.log (do ręcznego przeglądu)
grep -rn "console\.log" apps/web/src --include="*.ts" --include="*.tsx"
```

**Krok 3: Re-export z `apps/web/src/lib/index.ts`**

```ts
export { logger } from './logger';
```

### Akceptacja

- [ ] Zero `console.log` w build produkcyjnym (sprawdź devtools w prod bundlu)
- [ ] `logger.error` i `logger.warn` dalej widoczne (to są realne błędy)
- [ ] `VITE_DEBUG=true` reaktywuje debug logi (do debugowania na staging)
- [ ] TypeScript OK (zero nowych błędów)

---

## BETA LAUNCH — Operacja (nie PR)

> **Effort:** 2-3h  
> **Moment:** Po merge PR-1A + PR-1B + PR-2

### Krok 1: Formularz feedbacku (30 min)

Stwórz formularz w **Tally** (lub Google Forms) z polami:

```
Twoja rola:          [ Trener / Analityk / Creator / Inne ]
Device:              [ Desktop / Tablet / Mobile ]

Co próbowałeś zrobić? (wolne pole)
Co NIE zadziałało?   (wolne pole)
Co "wow"?            (wolne pole)

Polecasz innym: [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]

Email (opcjonalnie): _______________
```

**Link do formularza umieść:**
- W `UserMenu` (dropdown po kliknięciu avatara): `"📝 Give feedback"`
- W `SettingsModal` (sekcja dolna): `"Share feedback"`

### Krok 2: Beta invites (1h)

**Docelowa grupa:** 10-20 trenerów/analityków/creatorów z twojego środowiska

**Szablon wiadomości (PL):**

```
Cześć [imię],

Buduję TMC Studio — szybką deskę taktyczną z animacją kroków 
dla trenerów i analityków. V1 właśnie gotowa, szukam pierwszych testerów.

Co możesz zrobić:
• Narysuj ustawienie i animację taktyki
• Wyeksportuj jako GIF/PDF
• Daj mi znać co Cię wkurza (10 min wystarczy)

Link: [URL produkcyjny]
Formularz feedbacku: [link]

Stripe jest w trybie testowym — subskrypcja jest bezpłatna.
Karta testowa: 4242 4242 4242 4242 | dowolna data | dowolny CVC

Z góry dzięki!
```

### Krok 3: Minimal analytics — 5 kluczowych eventów (1-2h)

Nie instaluj pełnego analytics. Wystarczy 5 eventów przez prosty helper:

**Stwórz `apps/web/src/utils/analytics.ts`:**

```ts
/**
 * Minimal analytics — łatwe do zamiany na Posthog/Mixpanel/Plausible później
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  // Na razie: tylko console.info w dev, nic w prod
  // TODO: zamień na Posthog/Plausible gdy zdecydujesz na narzędzie
  if (import.meta.env.DEV) {
    console.info('[Analytics]', event, properties);
  }
}
```

**Dodaj w 5 kluczowych miejscach:**

```ts
// 1. signup_success — useAuthStore.ts po rejestracji
trackEvent('signup_success', { method: 'email' | 'google' });

// 2. project_create — useProjectsController.ts po createProject
trackEvent('project_create');

// 3. export_click — useExportController.ts
trackEvent('export_click', { format: 'png' | 'gif' | 'pdf' });

// 4. pricing_open — gdziekolwiek otwiera się PricingModal
trackEvent('pricing_open');

// 5. checkout_start — przed redirectem do Stripe
trackEvent('checkout_start', { plan: 'pro' });
```

*Gdy zdecydujesz na narzędzie (Posthog/Plausible/Mixpanel), zamień body `trackEvent` — bez ruszania 5 call-site'ów.*

---

## DOC CLEANUP — Archiwizacja starych dokumentów

> **Effort:** 1h  
> **Moment:** Równolegle lub po Beta Launch

### Kandydaci do archiwizacji (zrobione/superseded)

Przenieś do `docs/archive/` (zachowaj historię, ale usuń z aktywnego widoku):

| Plik | Powód |
|------|-------|
| `docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md` | Superseded przez `CANVAS_STABILIZATION_COMPLETE.md` |
| `docs/PR-FIX-1-3-SHORTCUTS-INSPECTOR-VISION.md` | Zastąpiony przez zadania tego sprintu |
| `docs/PR-FIX-4-ZOOM-REFACTOR-SUMMARY.md` | Zakończony, szczegóły w CANVAS_STABILIZATION_COMPLETE |
| `docs/PR-FIX-4-REGRESSION-FIX.md` | j.w. |
| `docs/PR-FIX-5-ORIENTATION-TRANSFORM-COMPLETE.md` | Zakończony |
| `docs/H3_CONFIRM_MODAL_CHECKLIST.md` | Zakończony (wchodzi w CHANGELOG) |
| `docs/L1_PIN_RENAME_IMPLEMENTATION_STATUS.md` | Zakończony |
| `docs/PLAYER_ORIENTATION_IMPLEMENTATION_PLAN.md` | Wdrożony, nie plan — status doc |
| `docs/PR-UX-1-GUEST-LOGIN-SYNC.md` | Zakończony |
| `docs/PR-UX-2-LAYER-CONTROL.md` | Zakończony |
| `docs/PR-UX-3-UNIFIED-COLOR-SHORTCUTS.md` | Zakończony |
| `docs/PR-UX-5-CONTEXT-MENU-DESIGN.md` | Zakończony |
| `docs/PR-PAY-1-COMPLETE.md` → `docs/PR-PAY-6-*` | Wszystkie zakończone |
| `docs/PR-REFACTOR-1-KEYBOARD-SHORTCUTS-CHECKLIST.md` | Stary plan |
| `docs/UX_FIXES_IMPLEMENTATION_PLAN.md` | Superseded |
| `docs/UX_IMPLEMENTATION_PLAN.md` | Superseded |
| `docs/UX_ISSUES_ANALYSIS.md` | Superseded |

### Zostaw aktywne (reference docs)

| Plik | Rola |
|------|------|
| `docs/ARCHITECTURE_OVERVIEW.md` | Żywy blueprint |
| `docs/ARCHITECTURE_DIAGNOSIS_6_ISSUES.md` | Aktualna diagnoza (PR-FIX-1/3/6 czekają) |
| `docs/CANVAS_STABILIZATION_COMPLETE.md` | Master status canvas |
| `docs/ROADMAP.md` | Sprint 7 in progress |
| `docs/CODE_REVIEW_STATUS_2026_02_19.md` | Ten review |
| `docs/BETA_TESTING_PLAN.md` | Aktywny sprint |
| `docs/ENTITLEMENTS.md` | Spec entitlements |
| `docs/DATA_MODEL.md` | Reference DB model |
| `docs/MODULE_BOUNDARIES.md` | Żywy kontrakt |
| `docs/COMMANDS_MAP.md` | Reference cmd.* |
| `docs/MASTER_DEVELOPMENT_PLAN.md` | High-level |
| `docs/MONETIZATION_PLAN.md` | Aktywny |

### Komendy do archiwizacji

```bash
mkdir -p docs/archive

# Przenieś zakończone/superseded plany
mv docs/PRE_LAUNCH_AUDIT_AND_FIX_PLAN.md docs/archive/
mv docs/PR-FIX-1-3-SHORTCUTS-INSPECTOR-VISION.md docs/archive/
mv docs/PR-FIX-4-ZOOM-REFACTOR-SUMMARY.md docs/archive/
mv docs/PR-FIX-4-REGRESSION-FIX.md docs/archive/
mv docs/PR-FIX-5-ORIENTATION-TRANSFORM-COMPLETE.md docs/archive/
mv docs/H3_CONFIRM_MODAL_CHECKLIST.md docs/archive/
mv docs/L1_PIN_RENAME_IMPLEMENTATION_STATUS.md docs/archive/
mv docs/PLAYER_ORIENTATION_IMPLEMENTATION_PLAN.md docs/archive/
mv docs/PR-UX-1-GUEST-LOGIN-SYNC.md docs/archive/
mv docs/PR-UX-2-LAYER-CONTROL.md docs/archive/
mv docs/PR-UX-3-UNIFIED-COLOR-SHORTCUTS.md docs/archive/
mv docs/PR-UX-5-CONTEXT-MENU-DESIGN.md docs/archive/
mv docs/PR-PAY-1-COMPLETE.md docs/archive/
mv docs/PR-PAY-2-COMPLETE.md docs/archive/
mv docs/PR-PAY-3-COMPLETE.md docs/archive/
mv docs/PR-PAY-4-COMPLETE.md docs/archive/
mv docs/PR-PAY-5-COMPLETE.md docs/archive/
mv docs/PR-PAY-6-SUBSCRIPTION-REFRESH-FIX.md docs/archive/
mv docs/PR-REFACTOR-1-KEYBOARD-SHORTCUTS-CHECKLIST.md docs/archive/
mv docs/PR-REFACTOR-PRODUCTION-READY-PLAN.md docs/archive/
mv docs/UX_FIXES_IMPLEMENTATION_PLAN.md docs/archive/
mv docs/UX_IMPLEMENTATION_PLAN.md docs/archive/
mv docs/UX_ISSUES_ANALYSIS.md docs/archive/
```

---

## Co ŚWIADOMIE ODKŁADAMY (post-beta)

> Wrócimy do tych rzeczy po zebraniu feedbacku od beta testerów.

| Temat | Dlaczego czekamy |
|-------|------------------|
| Migracja UI → `cmd.*` | Wymaga 2-3 dni, zero wartości dla użytkownika |
| CommandRegistry singleton (nie hook) | Architektura, nie feature |
| Podział `ProjectsDrawer.tsx` (1141 LOC) | Działa, brak widocznych bugów |
| Podział `useKeyboardShortcuts.ts` (884 LOC) | Działa, naprawiamy tylko konkretne bugi |
| PR-FIX-6: Subfolders UI | Nowa feature, nie bug — po beta |
| Stage 3: Goal net grid + shoot arrow | Visual quality — po beta |
| Testy: entitlements + auth flow | Przed kolejnym dużym refaktorem |
| Monitoring/analytics pełny | Po zebraniu Minimum Valuable Feedback |

---

## Harmonogram (2 dni do beta)

### Dzień 1 (4-6h coding)

| Czas | Zadanie |
|------|---------|
| 0-2h | **PR-1A**: V/Shift+V shortcuts fix + merge |
| 2-4h | **PR-1B**: showVision inspector + PlayerNode guard + merge |
| 4-6h | **PR-2**: Logger + wyciszenie console.log + merge |

### Dzień 2 (2-3h operacje)

| Czas | Zadanie |
|------|---------|
| 0-0.5h | Stwórz formularz feedbacku (Tally/Google Forms) |
| 0.5-1h | Dodaj link do feedbacku w UserMenu + Settings |
| 1-1.5h | Dodaj 5 analytics eventów (`trackEvent`) |
| 1.5-2h | Wyślij beta invites (10-20 osób) |
| 2-3h | **Doc cleanup**: archiwizacja starych plansów |

### Dzień 3+ (feedback loop)

```
Monitor: webhook Stripe (test mode) → conversion rate
Monitor: formularz feedbacku → co się sypie
Fix: krytyczne bugi wyłapane przez testerów
Iterate: na podstawie sygnałów
```

---

## Definition of Done — Beta Ready

- [ ] PR-1A merged: V/Shift+V działa stabilnie, guarded
- [ ] PR-1B merged: showVision toggle widoczny w inspektorze
- [ ] PR-2 merged: zero console.log w prod bundlu
- [ ] Formularz feedbacku działa (Tally/Google)
- [ ] Link do feedbacku w appce (UserMenu)
- [ ] 5 analytics eventów w kodzie (nawet jeśli no-op w prod)
- [ ] Beta invites wysłane do ≥ 10 osób
- [ ] Docs archiwizacja: ≥ 15 plansów w `docs/archive/`
- [ ] Changelog zaktualizowany dla PR-1A, 1B, 2

---

*Dokument stworzony: 2026-02-19 | Następna rewizja: po zebraniu pierwszego feedbacku*
