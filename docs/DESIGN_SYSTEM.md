# 🎨 TMC Studio — Design System

**Version:** 1.0.0  
**Created:** 2026-06-09  
**Status:** Living Document  
**Audience:** Wszystkie agenty (Implementer, Tester) — czytaj przed każdą zmianą UI.

---

## 📋 Table of Contents

1. [Brand Overview](#brand-overview)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Sizing](#spacing--sizing)
5. [Border Radius](#border-radius)
6. [Shadows](#shadows)
7. [Z-Index Layers](#z-index-layers)
8. [Dark Mode](#dark-mode)
9. [Animations](#animations)
10. [Component Library](#component-library)
11. [Pitch Themes](#pitch-themes)
12. [Drawing Palette](#drawing-palette)
13. [Component CSS Classes](#component-css-classes)
14. [SVG / Icons Convention](#svg--icons-convention)
15. [Layering Rules](#layering-rules)
16. [Adoption Status — Legacy Classes](#adoption-status--legacy-classes)

---

## 1. Brand Overview

| Atrybut | Wartość |
|---------|---------|
| **Nazwa** | TMC Studio (Tactics Made Clear) |
| **Styl** | Czysty, funkcjonalny, sportowy. Inspirowany nowoczesnymi narzędziami tactical/training |
| **Font** | Inter (sans), JetBrains Mono (mono) |
| **Akcent** | Zielony (`#12CFA0` / `#2EE6A6`) |
| **Dark mode** | `.dark` class na `<html>`, wszystkie kolory zdefiniowane w CSS vars |
| **Framework** | Tailwind CSS via CSS vars + własne klasy w `index.css` |

---

## 2. Color System

### 2.1 Design Token Colors

Tokeny są zdefiniowane w `packages/ui/src/theme/tokens.css` i zmapowane na klasy Tailwind w `apps/web/tailwind.config.js`.

**ZASADA:** Zawsze używaj klas Tailwind (`bg-surface`, `text-muted`, `border-border`). **Nigdy nie hardcoduj hexów** — chyba że to kolor zespołu lub drawing palette.

| Token | CSS Var | Light (hex) | Dark (hex) | Klasa Tailwind |
|-------|---------|-------------|------------|----------------|
| **bg** | `--color-bg` | `#F6F8FC` | `#0B1220` | `bg-bg` |
| **surface** | `--color-surface` | `#FFFFFF` | `#111B2E` | `bg-surface` |
| **surface2** | `--color-surface2` | `#F1F4FA` | `#182338` | `bg-surface2` |
| **border** | `--color-border` | `#D7DFEA` | `#22314D` | `border-border` |
| **text** | `--color-text` | `#0B1220` | `#E8EEF9` | `text-text` |
| **muted** | `--color-muted` | `#516079` | `#A7B3C9` | `text-muted` |
| **accent** | `--color-accent` | `#12CFA0` | `#2EE6A6` | `bg-accent` / `text-accent` |
| **accent-hover** | `--color-accent-hover` | `#0FB58C` | `#12CFA0` | `bg-accent-hover` |
| **pitch** | `--color-pitch` | `#3d9c5a` | `#2d8a3e` | `bg-pitch` |
| **pitch-lines** | `--color-pitch-lines` | `rgba(255,255,255,0.85)` | `rgba(255,255,255,0.9)` | `text-pitch-lines` |

### 2.2 Team Colors (Static)

Używane dla zawodników home/away. Zdefiniowane w `tailwind.config.js`.

| Nazwa | Hex | Przeznaczenie |
|-------|-----|--------------|
| `team-home` | `#e63946` | Zawodnicy gospodarzy (podstawowy) |
| `team-away` | `#457b9d` | Zawodnicy gości (podstawowy) |
| `team-home-light` | `#f87171` | Jasny wariant home |
| `team-away-light` | `#60a5fa` | Jasny wariant away |
| `ball` | `#ffffff` | Kolor piłki |
| `selection` | `#ffd60a` | Kolor selekcji / zaznaczenia |

**Przykład:**
```tsx
<circle className="fill-team-home" />
<circle className="fill-team-away" />
<circle className="fill-ball" />
```

### 2.3 Drawing Palette (user colors)

Zdefiniowana w `packages/ui/src/colors.ts` jako `SHARED_COLORS`. Używana we wszystkich color pickerach.

```ts
export const SHARED_COLORS = [
  '#000000', // black
  '#ff0000', // red
  '#ff6b6b', // light red
  '#00ff00', // green
  '#3b82f6', // blue
  '#eab308', // yellow
  '#f97316', // orange
  '#ffffff', // white
];
```

Funkcje pomocnicze: `getColorsForMode(isPrintMode)` (filtruje white w print mode), `sanitizeColorForPrint(color, isPrintMode)`.

---

## 3. Typography

Zdefiniowana w `apps/web/tailwind.config.js` i `apps/web/src/index.css`.

| Klasa | Rozmiar | Line-Height | Przeznaczenie |
|-------|---------|-------------|--------------|
| `text-xs` | 0.75rem (12px) | 1rem | Etykiety, badge, metadane |
| `text-sm` | 0.8125rem (13px) | 1.25rem | Body w komponentach, opisy |
| `text-base` | 0.875rem (14px) | 1.5rem | Domyślny tekst |
| `text-lg` | 1rem (16px) | 1.75rem | Nagłówki sekcji |
| `text-xl` | 1.125rem (18px) | 1.75rem | Duże nagłówki |

**Font stack:**
- Sans: `Inter`, `system-ui`, `-apple-system`, `sans-serif`
- Mono: `JetBrains Mono`, `Menlo`, `Monaco`, `monospace`

**Zasady:**
- Globalne `-webkit-font-smoothing: antialiased` i `-moz-osx-font-smoothing: grayscale`
- Do kodu/koordynatów używaj `font-mono` (JetBrains Mono)
- Do statystyk/koordynatów dodaj klasę `tabular-nums` (własna utility)

---

## 4. Spacing & Sizing

Zdefiniowane w `packages/ui/src/theme/tokens.css` i zmapowane w `tailwind.config.js`.

| Token | px | rem | Klasa Tailwind |
|-------|-----|------|---------------|
| `--spacing-xs` | 4px | 0.25rem | `p-xs`, `gap-xs`, `m-xs` |
| `--spacing-sm` | 8px | 0.5rem | `p-sm`, `gap-sm`, `m-sm` |
| `--spacing-md` | 12px | 0.75rem | `p-md`, `gap-md`, `m-md` |
| `--spacing-lg` | 16px | 1rem | `p-lg`, `gap-lg`, `m-lg` |
| `--spacing-xl` | 24px | 1.5rem | `p-xl`, `gap-xl`, `m-xl` |

**Zasady:**
- Do wewnętrznych odstepów w komponentach: `p-sm`, `p-md`, `p-lg`
- Do odstępów między elementami: `gap-sm`, `gap-md`, `gap-lg`
- Do odstępów między sekcjami: `space-y-md`, `space-y-lg`

---

## 5. Border Radius

| Token | Wartość | Klasa Tailwind |
|-------|---------|---------------|
| `--radius-sm` | 4px | `rounded-sm` |
| `--radius-md` | 8px | `rounded-md` |
| `--radius-lg` | 12px | `rounded-lg` |
| `--radius-xl` | 16px | `rounded-xl` |

---

## 6. Shadows

| Token | Light | Dark | Klasa |
|-------|-------|------|-------|
| `--shadow-sm` | Subtelny, mały | Bardzo subtelny | `shadow-sm` |
| `--shadow-md` | Standardowy panel | Standardowy dark | `shadow-md` |
| `--shadow-lg` | Duży dropdown/modal | Duży dark | `shadow-lg` |
| `--shadow-canvas` | Canvas (board) | Canvas dark | `shadow-canvas` |

---

## 7. Z-Index Layers

Hierarchia nakładania — **nigdy nie używaj `z-` z hardcoded wartością**. Używaj klas tokenów.

| Warstwa | Wartość | Co się tam znajduje |
|---------|---------|---------------------|
| `z-canvas` | 1 | Canvas boiska (Konva) |
| `z-inspector` | 10 | Panel inspektora (prawy) |
| `z-topbar` | 20 | Górny pasek nawigacji |
| `z-bottombar` | 20 | Dolny pasek kroków |
| `z-cheatsheet` | 30 | Cheatsheet overlay |
| `z-toast` | 40 | Toast notifications |
| `z-modal` | 50 | Modale (Auth, Pricing, Confirm, etc.) |
| `z-palette` | 60 | Command palette |

---

## 8. Dark Mode

Aktywowany przez klasę `.dark` na elemencie `<html>`.

**Zasady:**
- Wszystkie kolory mają osobne wartości dla `.dark` — zdefiniowane w `tokens.css`
- **Nigdy nie hardcoduj kolorów dla dark mode** — zawsze używaj tokenów
- Dark mode zmienia: wszystkie kolory, cienie (bardziej subtelne), kolory boiska

---

## 9. Animations

### 9.1 Transition Durations

| Klasa | Czas trwania |
|-------|-------------|
| `duration-fast` | 150ms |
| `duration-normal` | 200ms |
| `duration-slow` | 300ms |

### 9.2 Keyframe Animations

Dostępne klasy animacji (zdefiniowane w `tokens.css` + `tailwind.config.js`):

| Klasa | Animacja | Użycie |
|-------|----------|--------|
| `animate-fade-in` | fadeIn | Pojawianie się elementów |
| `animate-slide-up` | slideUp | Pojawianie się od dołu (8px) |
| `animate-slide-down` | slideDown | Pojawianie się od góry (-8px) |
| `animate-toast` | toastSlide | Toast (1.2s, fade in → wait → fade out) |
| `animate-in` | animateIn | Scale(0.95→1) z fade, 200ms |

---

## 10. Component Library

Wszystkie komponenty znajdują się w `packages/ui/src/`. Są eksportowane z `packages/ui/src/index.ts`.

### 10.1 Core Components

| Komponent | Props | Opis |
|-----------|-------|------|
| **Button** | `variant` ('primary'\|'secondary'\|'ghost'\|'danger'), `size` ('sm'\|'md'\|'lg'), `icon`, `active` | Uniwersalny przycisk. **UWAGA:** wciąż używa starych klas (`bg-blue-600`, `bg-gray-700`) — patrz sekcja 16 |
| **ContextMenu** | `x`, `y`, `items: ContextMenuItem[]`, `onClose`, `header?` | Menu kontekstowe (prawy klik). Pozycjonowanie z korektą viewport. Header od PR-UX-5 |
| **ConfirmModal** | `title`, `message`, `confirmLabel?`, `cancelLabel?`, `onConfirm`, `onCancel`, `variant?` ('danger'\|'default') | Modal potwierdzenia |
| **AuthModal** | (brak props — wewnętrzny stan) | Modal logowania/rejestracji (Supabase + magic link) |
| **PricingModal** | `isOpen`, `onClose`, `currentPlan?` | Modal z planami cenowymi (guest/free/pro/team) |
| **UpgradeSuccessModal** | `isOpen`, `onClose`, `planName` | Modal po udanym upgrade |
| **LimitReachedModal** | `type` ('projects'\|'team') | Modal gdy limit został osiągnięty |

### 10.2 Navigation & Layout

| Komponent | Props | Opis |
|-----------|-------|------|
| **TopBar** | `projectName`, `isSaved`, `focusMode`, `theme`, `plan?`, `userInitials?`, `isSyncing?`, `stepInfo?`, `isOnline?`, wiele callbacków | Górny pasek nawigacji. Zawiera: logo, nazwę projektu, status save, Export, Focus, Theme toggle, Help, Cmd+K. Responsywny (PR-UX3) |
| **Toolbar** | `onAddPlayer`, `onAddBall`, `onDuplicate`, `onDelete`, `onUndo`, `onRedo`, `onSave`, `onLoad`, `onNewBoard`, `canUndo`, `canRedo`, `hasSelection` | Legacy toolbar. **UWAGA:** używa starych klas (`bg-gray-800`, `text-white`) — patrz sekcja 16 |
| **BottomStepsBar** | `steps: StepInfo[]`, `currentIndex`, `duration`, callbacki | Dolny pasek kroków animacji |
| **Footer** | (brak props) | Stopka z informacją o wersji |
| **RightPanel** | Legacy right panel | Starszy panel boczny |
| **RightInspector** | `elements`, `onUpdate`, `onDelete`, `onReorder`, `onSelectLayer` | Inspektor elementów (prawa strona). Responsywny drawer na xl (PR-UX3) |

### 10.3 Overlays & Modals

| Komponent | Props | Opis |
|-----------|-------|------|
| **EmptyStateOverlay** | `onOpenPalette`, `onNewBoard` | Ekran powitalny dla nowych użytkowników (PR-UX2) |
| **CheatSheetOverlay** | `isOpen`, `onClose` | Skróty klawiszowe (pełna lista) |
| **ShortcutsHint** | (auto-show z useUIStore) | Krótka podpowiedź skrótów (1 raz na sesję — localStorage) |
| **CommandPaletteModal** | `isOpen`, `onClose`, `actions: CommandAction[]` | Command palette (Cmd+K) |
| **QuickEditOverlay** | `element`, `onUpdate`, `onClose` | Szybka edycja elementu (PR-ALT-1) |

### 10.4 Auth & User

| Komponent | Props | Opis |
|-----------|-------|------|
| **UserMenu** | `plan`, `userInitials`, `onOpenAccount`, `onUpgrade`, `onLogout` | Menu użytkownika (awatar + dropdown) |
| **OfflineBanner** | `isOnline` | Banner offline (PR-L5-MINI) |

### 10.5 Project Management

| Komponent | Props | Opis |
|-----------|-------|------|
| **ProjectsDrawer** | `projects`, `folders`, `onSelect`, `onCreateFolder`, `onMoveToFolder`, `onDelete`, `onRename`, `onPin`, `onDuplicate`, `onColorChange` | Drawer z listą projektów. Obsługuje: foldery, pinowanie, przeciąganie (FIX-6B) |
| **ContextMenu** | (patrz Core) | Używany w ProjectsDrawer dla prawokliku na projekt/folder |
| **FolderColorPicker** | `currentColor`, `onSelect` | Wybór koloru dla folderu |
| **FolderOptionsModal** | `folder`, `onUpdate`, `onDelete` | Opcje folderu (rename, kolor, delete) |
| **CreateFolderModal** | `onCreate`, `onClose` | Tworzenie nowego folderu |

### 10.6 Board-specific

| Komponent | Props | Opis |
|-----------|-------|------|
| **PitchPanel** | `settings: PitchSettings`, `onUpdate` | Panel ustawień boiska (theme preset, kolory, linie, orientacja, widok) |
| **TeamsPanel** | `home`, `away`, `onUpdate` | Panel ustawień drużyn (nazwa, kolory) |
| **ZoomWidget** | `zoom`, `onZoomIn`, `onZoomOut`, `onReset` | Widget zoomu (lewy dolny róg) |
| **SelectionToolbar** | `count`, `onGroup`, `onUngroup`, `onDuplicate`, `onDelete` | Pasek narzędzi przy selekcji wielu elementów |

### 10.7 Utility

| Komponent | Props | Opis |
|-----------|-------|------|
| **ToastHint** | `message`, `type` ('info'\|'success'\|'error'), `onDismiss` | Toast notification |
| **SettingsModal** | `isOpen`, `onClose` | Modal ustawień |

---

## 11. Pitch Themes

Zdefiniowane w `packages/core/src/types.ts`. Oparte na typie `PitchTheme = 'grass' | 'indoor' | 'chalk' | 'futsal' | 'custom'`.

| Theme | primaryColor | stripeColor | Stripes |
|-------|-------------|-------------|---------|
| `grass` | `#2d8a3e` | `#268735` | ✅ |
| `indoor` | `#c4a35a` | `#b8974d` | ❌ |
| `chalk` | `#3b5249` | `#334944` | ✅ |
| `futsal` | `#2563eb` | `#1d4ed8` | ❌ |
| `custom` | `#2d8a3e` | `#268735` | ✅ (dziedziczy grass) |

Struktura: `PitchSettings` zawiera `theme`, `primaryColor`, `stripeColor`, `lineColor`, `showStripes`, `orientation`, `view`, `lines`.

Stała `PITCH_THEMES: Record<PitchTheme, Omit<PitchSettings, 'theme'>>` w `packages/core/src/types.ts`.

---

## 12. Drawing Palette

Zdefiniowana w `packages/ui/src/colors.ts`. Używana w color pickerach dla elementów drawing (strzałki, linie, adnotacje).

```ts
export const SHARED_COLORS = [
  '#000000', // black
  '#ff0000', // red
  '#ff6b6b', // light red
  '#00ff00', // green
  '#3b82f6', // blue
  '#eab308', // yellow
  '#f97316', // orange
  '#ffffff', // white
];
```

Funkcje:
- `getColorsForMode(isPrintMode)` — zwraca dostępne kolory; w print mode filtruje biały
- `sanitizeColorForPrint(color, isPrintMode)` — render-time: zamienia biały na czarny w print mode

---

## 13. Component CSS Classes

Zdefiniowane w `apps/web/src/index.css` w `@layer components`. Używaj gdy istnieją, nie twórz własnych odpowiedników.

| Klasa | Przeznaczenie | Kluczowe style |
|-------|--------------|----------------|
| `.input-field` | Pole tekstowe | `bg-surface2`, `border-border`, focus: `border-accent` |
| `.card` | Kontener karty | `bg-surface`, `rounded-lg`, `border-border`, `shadow-md` |
| `.panel` | Panel boczny | `bg-surface`, `border-border` |
| `.icon-button` | Przycisk z samą ikoną | `p-2`, `rounded`, hover: `bg-surface2` |
| `.kbd` | Badge skrótu klawiszowego | `bg-surface2`, `border-border`, `font-mono`, `text-xs` |

**Przykład:**
```tsx
<input className="input-field" placeholder="Search..." />
<div className="card p-lg">
  <span className="kbd">Ctrl+S</span>
</div>
```

---

## 14. SVG / Icons Convention

**Stan obecny:** Nie ma systemu ikon (React Icons, Lucide, Heroicons itp.). Wszystkie ikony to inline SVG definiowane w komponentach.

**Zasady:**
- **Nie dodawaj biblioteki ikon bez zgody** użytkownika (R-MVP)
- Jeśli potrzebujesz ikony — stwórz inline SVG w pliku, naśladując wzór z `TopBar.tsx` lub `Toolbar.tsx`
- Wzór: komponent funkcyjny z opcjonalnym `className` (domyślnie `w-4 h-4`)
- Używaj `fill="none" stroke="currentColor" strokeWidth="2"` dla ikon outline
- Dla ikon filled: `fill="currentColor"`
- Ikony kolorowe (team): ustaw kolor jako klasę lub prop

**Przykład wzorca:**
```tsx
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
```

---

## 15. Layering Rules

1. **Zero inline styles** — wyłącznie klasy Tailwind lub własne klasy z `index.css`
2. **Używaj TYLKO komponentów z istniejącej biblioteki** — nie twórz nowych, jeśli istniejący komponent może być użyty
3. **Mobile-first** — projektuj od małych ekranów w górę

**Breakpointy (Tailwind):**
| Breakpoint | Min-width | Przeznaczenie |
|------------|-----------|--------------|
| `sm:` | 640px | Tablety wertykalne, większe telefony |
| `md:` | 768px | Tablety horyzontalne, mały desktop — mobile-first od tych breakpointów w górę |
| `lg:` | 1024px | Desktop, laptop |
| `xl:` | 1280px | Duży desktop, szerokie ekrany |

**Zasada:** Projektuj najpierw dla mobile (domyślne klasy bez prefixu), potem dodawaj warianty z prefixami.

4. **Dostępność obowiązkowa:**
   - `aria-label` na interaktywnych elementach bez tekstu
   - `role` odpowiedni dla elementów (dialog, menu, button)
   - Kontrast: tekst na kolorowym tle minimum 4.5:1
   - Focus visible: domyślnie `focus:ring-2 focus:ring-offset-2` (zdefiniowane globalnie w `index.css` dla `*:focus-visible`)
5. **Spójność z sąsiednimi komponentami** — patrz jak zrobiono w podobnym komponencie, naśladuj wzór
6. **Zachowaj warstwy z-index** — używaj tokenów (`z-modal`, `z-toast`), nie ręcznych wartości
7. **Kolor akcentu** (`accent`) to zielony — używaj tylko dla aktywnych/primary akcji. Nie używaj go do dekoracji

---

## 16. Adoption Status — Legacy Classes

Niektóre komponenty wciąż używają starych, hardcoded klas Tailwind zamiast tokenów. **Nie naprawiaj tego bez osobnego zadania** — ale bądź świadomy.

| Komponent | Stare klasy | Powinno być | Zastąp przez |
|-----------|-------------|-------------|-------------|
| **Button.tsx** | `bg-blue-600`, `bg-gray-700`, `text-gray-200`, `text-gray-300`, `text-white`, `hover:bg-blue-700`, `hover:bg-gray-600`, `hover:bg-gray-700` | `bg-accent`, `bg-surface`, `text-text`, `text-muted`, `hover:bg-accent-hover`, `hover:bg-surface2` | Nowy Button (do stworzenia) — na razie używaj `className` z tokenami ręcznie: `bg-accent text-white rounded-lg px-3 py-2 text-sm` |
| **Toolbar.tsx** | `bg-gray-800`, `text-white`, `text-gray-400`, `text-gray-600`, `border-gray-700`, `hover:text-red-300`, `hover:text-blue-300` | `bg-surface`, `text-text`, `text-muted`, `border-border`, `text-team-home`, `text-team-away` | `TopBar.tsx` (istnieje!) + własne elementy z tokenami |

**Status:** ⏳ Do refactoringu w osobnej PR.

---

## Appendix A: Agent Quick Reference (Cheatsheet)

**Gdy tworzysz UI:**

```
✅ DO:
  <div className="bg-surface text-text p-lg rounded-lg shadow-md">
  <button className="icon-button active">
  <span className="kbd">Ctrl+S</span>
  <span className="text-muted text-xs">

❌ DON'T:
  <div style={{ backgroundColor: '#fff' }}>
  <button className="bg-gray-700 text-white">
  <div className="bg-blue-600">
```

**Gdy potrzebujesz komponentu — najpierw sprawdź sekcję 10. Jeśli istnieje, użyj go. Nie twórz nowego.**