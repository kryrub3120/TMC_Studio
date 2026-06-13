# Master Autopilot - UX Audit & Plan: TopBar Export + BottomBar Redesign
**Data:** 2026-06-12 12:00
**Limit:** 30 min (LOOP)

---

## Main Run Brief

### Cel
1. **TopBar Export** — zastąpienie pojedynczego przycisku Export rozwijanym menu z opcjami: Export JPG, Export PNG, Export PDF, Export as GIF (dotyczy animacji i rysunku)
2. **BottomBar redesign** — usunięcie niepotrzebnych elementów (github itd), dodanie atrakcyjnych UX rozwiązań dla first impression użytkownika
3. **First impression UX** — atrakcyjne, topowe rozwiązania dla nowego użytkownika

### Zakres
- Audyt obecnego stanu: TopBar.tsx, BottomStepsBar.tsx, ExportService, useExportController, BoardPage
- Propozycje zmian z uzasadnieniem UX
- Plan implementacji podzielony na sprinty

### Poza zakresem
- Implementacja kodu (tylko plan i propozycje)
- Zmiany w backendzie / Stripe
- Zmiany w dokumentacji

---

## Sprint 1: Export Menu w TopBar

### Sprint Contract

#### Cel sprintu
Zastąpienie pojedynczego przycisku Export w TopBar rozwijanym menu dropdown z opcjami eksportu.

#### Obecny stan (audyt)

**TopBar.tsx** (lokalizacja: ~l.895):
```tsx
{/* Export */}
<IconButton onClick={onExport} title="Export PNG" dataTour="export">
  <ExportIcon className="w-4 h-4" />
</IconButton>
```

Obecnie `onExport` wywołuje `state.exportController.exportPNG` — tylko PNG.

**Dostępne exporty (już zaimplementowane):**
| Format | Funkcja | Pro? | Status |
|--------|---------|------|--------|
| PNG (pojedynczy) | `exportController.exportPNG()` | Nie | ✅ Działa przez `stage.toDataURL()` |
| PNG (all steps) | `exportController.exportAllSteps()` | Nie | ✅ Działa |
| GIF animowany | `exportController.exportGIF()` | Tak ent** | ✅ Działa (gifenc) |
| PDF | `exportController.exportPDF()` | Tak ent** | ✅ Działa (jspdf) |
| SVG | `exportController.exportSVG()` | Tak ent** | ✅ Działa |
| JPG | **NIE ISTNIEJE** | - | ❌ Brak |

**Uwaga:** `exportController` jest dostępny w `BoardPage` przez `state.exportController`.

#### Propozycja UI: Expandable Export Dropdown

```
┌─────────────────────────────────┐
│ [Export Icon ▾]  Export         │  ← przycisk w TopBar (jak Players, Arrows itd)
├─────────────────────────────────┤
│ 📷 PNG — Current step     ⌘E   │  ← szybka akcja
│ 📷 PNG — All steps        ⇧⌘E  │
│ 🖼️ JPG — Current step          │
│ 📄 PDF — All steps        ⇧⌘P  │  ← Pro (gwiazdka)
│ 🎬 GIF Animation          ⇧⌘G  │  ← Pro (gwiazdka)
│ ───────────────────────         │
│ 🔒 Pro features marked with ⭐  │  ← subtelna informacja
└─────────────────────────────────┘
```

#### UX uzasadnienie
1. **Widoczność** — Export jest główną akcją użytkownika (zapisanie swojej pracy). Powinien być w TopBar, nie schowany.
2. **Kontekst** — dropdown pokazuje WSZYSTKIE opcje, user nie musi zgadywać.
3. **Hierarchia** — najczęstszy PNG na górze, Pro features niżej z oznaczeniem.
4. **Nie dodajemy JPG jako osobnej funkcji** — JPG to to samo co PNG tylko z innym formatem i białym tłem (oszczędność miejsca). Można dodać prostą konwersję.

#### Potrzebne zmiany

1. **TopBar.tsx** — zamienić `IconButton` na `ToolMenuButton` z dropdown (wzór: `PlayersMenu`, `ArrowsMenu`)
2. **TopBarProps** — zmienić `onExport: () => void` na:
   ```ts
   onExportPNG: () => void;
   onExportAllStepsPNG: () => void;
   onExportJPG: () => void;
   onExportPDF: () => void;
   onExportGIF: () => void;
   ```
   lub jeden callback z parametrem:
   ```ts
   onExport: (format: 'png' | 'png-all' | 'jpg' | 'pdf' | 'gif') => void;
   ```
3. **BoardTopBarSection.tsx** — przepiąć callbacki z `useExportController`
4. **Export JPG** — dodać w `exportUtils.ts` / `ExportService.ts`: konwersja PNG → JPG z białym tłem
5. **Skróty klawiszowe** — dodać w `useKeyboardShortcuts.ts`:
   - `⌘E` → PNG current step
   - `⇧⌘E` → PNG all steps
   - `⇧⌘P` → PDF
   - `⇧⌘G` → GIF

#### Entitlements (Pro check)
- `can('exportGIF')` — już istnieje
- `can('exportPDF')` — już istnieje
- `can('exportSVG')` — już istnieje
- Dla JPG: brak entitlement (darmowy, bo to trywialna konwersja)

#### Kryteria akceptacji
- [ ] Dropdown Export w TopBar z opcjami PNG, PNG all, JPG, PDF, GIF
- [ ] PDF i GIF oznaczone jako Pro (gwiazdka, blokada + redirect do PricingModal)
- [ ] Skróty klawiszowe dla najczęstszych opcji
- [ ] Export JPG działa (białe tło, jakość 0.92)
- [ ] Stany loading podczas generowania PDF/GIF (toast)

---

## Sprint 2: BottomBar Redesign — UX Audit

### Sprint Contract

#### Cel sprintu
Przeprojektowanie Bottom Bara tak, by był atrakcyjny wizualnie i funkcjonalnie, bez zbędnych elementów (github itd).

#### Obecny stan (audyt)

**BottomStepsBar.tsx** — obecnie pełni tylko funkcję sterowania animacją:
- Lewo: Prev, Play/Pause, Next, Loop, Duration dropdown
- Centrum: chipy kroków (z delete na hover + add step)
- Prawo: licznik "Step X / Y"

**W BoardPage** BottomStepsBar jest renderowany jako:
```tsx
{ANIMATION_ENABLED && (
  <BottomStepsBar ... />
)}
```

**Ukryty za feature flag** `ANIMATION_ENABLED` — jeśli flaga jest off, nie ma bottom bara w ogóle.

**Toolbar.tsx** — LEGACY toolbar (używa starych `bg-gray-800`, `text-white`). Jest ODDZIELNYM komponentem, nie wchodzi w skład BoardPage (jest w starszej strukturze).

**Co NIE powinno znaleźć się w BottomBar (wniosek użytkownika):**
- GitHub (obecnie nie ma)
- Linki zewnętrzne
- Footer/stopka

#### Problemy obecnego BottomBar
1. **Empty state gdy brak animacji** — jeśli `ANIMATION_ENABLED = false`, bottom bar znika całkowicie — user nie ma żadnego paska na dole.
2. **Tylko funkcja playbacku** — nie wykorzystuje potencjału bottom bara jako secondary toolbar.
3. **Brak first impression** — nowy użytkownik widzi tylko chipy "Step 1" bez kontekstu.

#### Propozycja: Smart BottomBar w 3 trybach

**Tryb 1: Empty Canvas (nowy użytkownik)**
```
┌──────────────────────────────────────────────────────────────────┐
│  💡 Quick start: [Add Player] [Add Ball] [Draw Arrow]  [🤖 AI] │
│  Press ⌘K for all commands                          [Tutorial]  │
└──────────────────────────────────────────────────────────────────┘
```

**Tryb 2: Edycja (elementy na canvasie, animacja OFF)**
```
┌──────────────────────────────────────────────────────────────────┐
│  Undo  Redo  │  Duplicate  Delete  │  [Step 1] [+ Add Step]     │
│  Layers: 15 elements                              Zoom: 85%     │
└──────────────────────────────────────────────────────────────────┘
```

**Tryb 3: Animacja (steps > 1 lub playback aktywny)**
```
┌──────────────────────────────────────────────────────────────────┐
│  ◀◀  ▶️  ▶▶  🔁  0.8s  │  [Step1] [Step2●] [+]  │  Anim info │
│  Undo  Redo  │  📐 Align tools                        2/5 steps │
└──────────────────────────────────────────────────────────────────┘
```

#### Konkretne propozycje UX (top solutions)

1. **Contextual Bottom Bar** — zmienia zawartość zależnie od kontekstu (tak jak w Figma/Canva/Linear)
   - Gdy canvas pusty: quick actions + onboarding
   - Gdy elementy: edit tools + step timeline
   - Gdy animacja aktywna: playback + edit tools

2. **Step Thumbnails** — zamiast tekstowych chipów, miniaturki kroków (jak w CapCut/DaVinci)
   - Znacznie lepsze first impression
   - Użytkownik od razu WIDZI co się dzieje
   - Wymaga: generator miniatur (częściowo gotowy — `setThumbnailGenerator` w BoardPage)

3. **Quick Action Bar** — zawsze widoczne: Undo/Redo + Step counter
   - Undo/Redo to najczęściej używane akcje po dodaniu elementów
   - Przeniesienie ich z górnego toolbaru na dół = naturalna pozycja kciuka na mobile

4. **Progress / Timeline** — wizualna oś czasu z krokami (nie tylko chipy)
   - Lepsza skalowalność przy 10+ krokach
   - Możliwość przeciągania kroków (future)

5. **Micro Interactions** — delikatne animacje:
   - Płynne przejścia między trybami
   - Pulse na przycisku Play gdy można odtworzyć
   - Wibracja/glow przy dodaniu pierwszego elementu

6. **AI Quick Actions** (future) — przycisk "AI Suggest" w BottomBar
   - Dla first impression: pokazuje, że app jest nowoczesna
   - Może sugerować formację na podstawie ustawienia zawodników

#### Co usunąć z BottomBar (obecnie)
- Nic niepotrzebnego nie ma — BottomStepsBar jest czysty funkcjonalnie
- Legacy Toolbar (`Toolbar.tsx`) ma podejrzane elementy (github?), ale NIE jest używany w BoardPage

#### Co PRZENIEŚĆ do BottomBar z innych miejsc
| Element | Skąd | Uzasadnienie |
|---------|------|-------------|
| Undo/Redo | Legacy Toolbar lub skróty | Najczęstsze akcje, dostępne jednym kliknięciem |
| Step counter | Już jest | Zostać |
| Zoom info | ZoomWidget | Pasywny podgląd zoomu |

#### Kryteria akceptacji
- [ ] BottomBar nie znika całkowicie (minimum: step/undo/redo)
- [ ] Contextualny — zmienia zawartość zależnie od stanu canvasa
- [ ] Step thumbnails zamiast tekstowych chipów (lub opcjonalnie)
- [ ] Undo/Redo dostępne z bottom bara
- [ ] Płynne animacje przejść
- [ ] Zero zbędnych elementów (github, linki, stopka)

---

## Sprint 3: First Impression UX

### Sprint Contract

#### Cel sprintu
Ulepszenie pierwszego wrażenia użytkownika po wejściu do app.

#### Obecny stan
- EmptyStateOverlay: "Press ⌘K to start" z przyciskami Add Player, Add Ball, Add Arrow
- TutorialOverlay: 6-krokowy coach tour (Sprint F)
- ShortcutsHint: jednorazowa podpowiedź

#### Problemy
1. EmptyStateOverlay jest STATYCZNY — tylko tekst i przyciski
2. Tutorial jest fajny, ale pojawia się PO zamknięciu emptystate
3. Brak "wow effect" — pierwsze sekundy są płaskie

#### Propozycje (top UX solutions)

**1. Animated Empty State** zamiast statycznego overlay
- Delikatna animacja boiska z przykładową formacją (4-3-3) która się pojawia i znika
- Pokazuje MOŻLIWOŚCI, nie mówi o nich
- Inspiracja: Linear, Notion, Arc Browser

**2. Smart Quick Actions w BottomBar** (z Sprint 2)
- Gdy canvas pusty: duże, kolorowe przyciski "Dodaj pierwszego zawodnika", "Narysuj boisko"
- Z subtelną animacją pulse, żeby przyciągnąć wzrok

**3. Welcome Modal v2** (zamiast/kontynuacja tutoriala)
- Nie blokujący overlay w stylu "Witaj w TMC Studio! Oto 3 rzeczy które możesz zrobić"
- Z interaktywnym demo (nie tylko screenshot)
- Opcja "Pomiń" zawsze widoczna

**4. First Element Celebration**
- Gdy użytkownik doda PIERWSZY element: subtelna animacja (confetti lub glow)
- Wzmocnienie pozytywnego feedbacku
- Inspiracja: Duolingo, Notion

**5. Progressive Onboarding**
- Nie wszystko na raz
- Krok 1: "Dodaj zawodnika" → user dodaje → "Świetnie! Teraz przeciągnij go"
- Krok 2: "Dodaj piłkę" (skrót B)
- Krok 3: "Narysuj strzałkę" (skrót A)
- Zamiast dumpowania 6 kroków tutoriala naraz

**6. Ambient Canvas**
- Gdy canvas pusty: bardzo subtelny wzór/woda na boisku (animacja SVG)
- Nie pustka, tylko "żywe" tło
- Inspiracja: zielone boisko z delikatnym cieniowaniem

#### Kryteria akceptacji
- [ ] Empty state z animowanym przykładem (a nie tylko tekstem)
- [ ] Quick actions w BottomBar dla nowego użytkownika
- [ ] First element celebration (subtelna animacja)
- [ ] Progressive onboarding (krok po kroku)
- [ ] Ambient canvas (żywe tło)

---

## Priority & Dependencies

| Sprint | Zależności | Priorytet | Szacowany czas |
|--------|-----------|-----------|----------------|
| S1: Export Menu | Brak | HIGH | 2-3h |
| S2: BottomBar Redesign | S3 (częściowo) | HIGH | 4-6h |
| S3: First Impression UX | S2 (współdzielony BottomBar) | MEDIUM | 3-4h |

**Rekomendowana kolejność:** S1 → S2 → S3 (S2 i S3 mogą być równoległe po przygotowaniu BottomBar)

---

## Selected Skills

| Skill | Uzasadnienie | Sprint |
|-------|-------------|--------|
| `ui-delivery` | Wszystkie zmiany to UI/React/Tailwind | S1, S2, S3 |
| `design-system-review` | Zgodność z tokenami i design systemem | S2, S3 |
| `regression-testing` | Po każdej zmianie UI | S1, S2, S3 |

---

## Ryzyka

1. **BottomBar + feature flag** — BottomStepsBar jest pod `ANIMATION_ENABLED`. Nowy BottomBar musi być niezależny od tej flagi.
2. **Responsywność** — BottomBar na mobile musi być użyteczny (nie za dużo elementów)
3. **Export GIF/PDF timeout** — długie exporty mogą zablokować UI (już obsłużone przez toasty)
4. **Step thumbnails performance** — generowanie miniatur dla 10+ kroków może być kosztowne

---

## Decyzje początkowe

1. **Export Menu** — użyć istniejącego wzorca `ToolMenuButton` + `ToolMenuPanel` (jak PlayersMenu, ArrowsMenu)
2. **BottomBar** — nowy komponent `SmartBottomBar.tsx` zamiast modyfikacji `BottomStepsBar.tsx` (zachować kompatybilność wsteczną)
3. **First impression** — zacząć od Animated Empty State (największy "wow" przy najmniejszym koszcie)