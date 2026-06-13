# Master Autopilot — Audyt: Settings/User System + Animation System
**Data:** 2026-06-13 14:00

---

## 🔴 CZĘŚĆ 1: Audyt Systemu Settings i Uprawnień (Free / Solo Premium / Team Premium)

### 1.1 Architektura

| Komponent | Lokalizacja | Opis |
|-----------|------------|------|
| `SettingsModal` | `packages/ui/src/SettingsModal.tsx` | Modal ustawień (4 zakładki: Profile, Security, Billing, Preferences) |
| `PricingModal` | `packages/ui/src/PricingModal.tsx` | Modal subskrypcji (plany: Free / Pro $15 / Team $29) |
| `entitlements.ts` | `apps/web/src/lib/entitlements.ts` | Logika uprawnień per plan |
| `useEntitlements.ts` | `apps/web/src/hooks/useEntitlements.ts` | Hook React do odczytu uprawnień |
| `useAuthStore.ts` | `apps/web/src/store/useAuthStore.ts` | Stan auth (user, subscription_tier) |
| `AppShell.tsx` | `apps/web/src/app/AppShell.tsx` | Orkiestracja wszystkich modali |

### 1.2 Plany i uprawnienia (entitlements.ts)

| Uprawnienie | Guest | Free | Pro ($15) | Team ($29) |
|------------|-------|------|-----------|------------|
| Max projektów | 1 | 3 | ∞ | ∞ |
| Max kroków | 5 | 10 | ∞ | ∞ |
| Max folderów | 0 | 3 | ∞ | ∞ |
| Cloud Sync | ❌ | ✅ | ✅ | ✅ |
| Export PNG/JPG | ✅ | ✅ | ✅ | ✅ |
| Export GIF/PDF | ❌ | ❌ | ✅ | ✅ |
| Team members | ❌ | ❌ | ❌ | 5 |
| Invite members | ❌ | ❌ | ❌ | ✅ |

**Status:** ⚠️ Działa w `entitlements.ts`, ale UI gating nie jest w pełni zintegrowane.

### 1.3 SettingsModal — Audyt funkcjonalny

#### Zakładka Profile (👤)
- [x] Formularz full_name
- [x] Avatar (upload)
- [x] Wyświetlanie planu (badge Free/Pro/Team)
- **Problemy:**
  - ⚠️ Używa starych klas Tailwind (`bg-blue-600`, `bg-gray-700`, `text-white`) — niezgodne z design tokenami (`bg-accent`, `text-text`)
  - ⚠️ Theme w dark mode hardcoded (`bg-[#1a1a2e]`) — nie używa `bg-surface`
  - ⚠️ Avatar upload nie ma spinnera/feedbacku

#### Zakładka Security (🔒)
- [x] Zmiana hasła
- [x] Usuwanie konta (z DELETE confirmation)
- **Problemy:**
  - ⚠️ Brak obsługi 2FA/MFA (Supabase to wspiera)

#### Zakładka Billing (💳)
- [x] Wyświetlanie obecnego planu z badge
- [x] Upgrade nudge dla Free → Pro
- [x] Manage Billing → Stripe Customer Portal
- [x] Wyświetlanie `subscription_expires_at`
- **Problemy:**
  - ⚠️ Guest user nie widzi billing section (ale Guest nie ma konta → OK)
  - ⚠️ Team Premium: brak UI do zarządzania członkami (invite/remove) — `canInviteMembers` jest w entitlements ale nie ma UI
  - ✅ Team plan jest w PricingModal ($29/miesiąc)

#### Zakładka Preferences (⚙️)
- [x] Theme toggle (light/dark)
- [x] Grid toggle
- [x] Snap toggle
- **Problemy:**
  - ⚠️ "Saved locally" — brak cloud sync dla preferencji (noted as future update)
  - ⚠️ Brak preferencji dla: domyślnego zoomu, języka, jednostek miar

### 1.4 PricingModal — Audyt

- [x] 3 plany: Free / Pro $15/miesiąc / Team $29/miesiąc
- [x] Rzeczywiste Stripe Price ID (price_1Sr4E7...)
- [x] Pro highlighted (niebieski)
- [x] CTA "Upgrade to Pro" dla nieuwierzytelnionych → signup flow
- **Problemy:**
  - ⚠️ PricingModal importuje `STRIPE_PRICES` przez `require('../../apps/web/src/config/stripe')` — kruche, fallback hardcoded ID
  - ⚠️ Brak yearly billing option (tylko monthly)
  - ⚠️ Brak feature comparison table (guest vs free vs pro vs team)
  - ⚠️ UpgradeSuccessModal nie pokazuje nazwy planu w czytelny sposób

### 1.5 Luki / Gaps

| Luka | Severity | Opis |
|------|----------|------|
| **UI gating niekompletne** | 🔴 HIGH | `entitlements.ts` mówi "Enforcement in UI happens in future PRs" — `can('createProject')`, `can('addStep')`, `can('createFolder')` nie są zintegrowane z UI. Guest może teoretycznie dodać >5 kroków |
| **SettingsModal legacy styles** | 🟡 MEDIUM | Używa `bg-[#1a1a2e]`, `bg-blue-600`, `text-white` zamiast tokenów |
| **Team Premium UI** | 🟡 MEDIUM | Brak UI do zarządzania członkami teamu |
| **PricingModal import** | 🟡 MEDIUM | `require()` cross-package jest kruchy |
| **Brak yearly billing** | 🟢 LOW | Tylko monthly opcja |
| **Preferences cloud sync** | 🔵 INFO | Oznaczone jako "future update" |

### 1.6 Rekomendacje

1. **Zintegrować gating UI** — `can('addStep')`, `can('createProject')`, `can('createFolder')` sprawdzane przed akcją (LimitReachedModal)
2. **Przebudować SettingsModal** na design tokeny (`bg-surface`, `text-text`, `bg-accent`)
3. **Dodać Team management UI** — lista członków, invite, remove (gdy Team plan aktywny)
4. **Dodać yearly pricing** w PricingModal
5. **Naprawić import STRIPE_PRICES** — przekazywać jako props

---

## 🔴 CZĘŚĆ 2: Audyt Systemu Animacji

### 2.1 Architektura

| Komponent | Lokalizacja | Opis |
|-----------|------------|------|
| `useAnimationPlayback` | `apps/web/src/hooks/useAnimationPlayback.ts` | Główny hook — pętla RAF z easing |
| `useAnimationInterpolation` | `apps/web/src/hooks/useAnimationInterpolation.ts` | Interpolacja pozycji/zon/arrow |
| `useBoardPageEffects` | `apps/web/src/app/board/useBoardPageEffects.ts` | Wrapper kompatybilności + gettery |
| `BottomStepsBar` | `packages/ui/src/BottomStepsBar.tsx` | Legacy — dolny pasek kroków (zastąpiony przez SmartBottomBar) |
| `SmartBottomBar` | `packages/ui/src/SmartBottomBar.tsx` | Nowy bottom bar z trybem animacji (inline) |
| `ANIMATION_ENABLED` | `apps/web/src/config/featureFlags.ts` | Feature flag (domyślnie: false w MVP) |
| `useBoardPageState` | `apps/web/src/app/routes/useBoardPageState.ts` | Stan kroków, playbacku, interpolacji |

### 2.2 Feature Flag: ANIMATION_ENABLED

- **Wartość domyślna:** `false` (MVP)
- **Włączenie:** `VITE_ANIMATION_ENABLED=true` w `.env.local`
- **Efekt gdy false:** Brak bottom bara, brak skrótów (L/N/X), brak pętli RAF, interpolacja nieaktywna
- **Efekt gdy true:** SmartBottomBar pokazuje playback + step chips

### 2.3 useAnimationPlayback — Audyt kodu

- [x] Getters pattern (getCurrentStepIndex, getStepsCount) — brak stale closures w RAF
- [x] Easing: easeInOutCubic
- [x] Loop: restart od kroku 0
- [x] Cleanup: cancelAnimationFrame + reset progress
- [x] Guard: ANIMATION_ENABLED → early return
- [x] Guard: steps <= 1 → pause + reset
- **Problemy:**
  - ⚠️ **Brak testów** — brak jednostkowych testów dla `useAnimationPlayback`
  - ⚠️ **Brak progress bara UI** — progress (0-1) jest w store ale nie pokazywany userowi
  - ⚠️ **Brak thumbnaili kroków** — BottomStepsBar pokazuje tylko tekstowe chipy

### 2.4 useAnimationInterpolation — Audyt kodu

- [x] Interpolacja pozycji (Player, Ball, Equipment) — linear
- [x] Interpolacja stref (position, width, height)
- [x] Interpolacja strzałek (startPoint, endPoint)
- [x] Matching po `id` między krokami
- [x] Fade in/out dla elementów które znikają/pojawiają się
- **Problemy:**
  - ⚠️ **Brak interpolacji kolorów** — elementy zmieniają kolor skokowo między krokami
  - ⚠️ **Brak interpolacji rotacji** — equipment/players nie interpolują rotation między krokami
  - ⚠️ **Brak testów interpolacji** — brak coverage

### 2.5 SmartBottomBar — Tryb animacji

- [x] Play/Pause (przycisk akcentowy)
- [x] Prev/Next step
- [x] Loop toggle
- [x] Duration dropdown (0.6s/0.8s/1.2s)
- [x] Step chips (klikalne, double-click rename, delete na hover)
- [x] Add step button
- [x] Step counter (X/Y)
- **Problemy:**
  - ⚠️ **Brak progress bara** — user nie widzi postępu w ramach kroku
  - ⚠️ **Brak thumbnaili** — chipy tylko tekstowe
  - ⚠️ **Brak drag reorder kroków** — tylko delete + add

### 2.6 Steps Store (documentSlice)

- [x] `steps: Step[]` — tablica kroków
- [x] `currentStepIndex: number`
- [x] `addStep()` — duplikuje obecne elementy
- [x] `removeStep(index)` — minimum 1 krok
- [x] `goToStep(index)` — nawigacja
- [x] `renameStep(index, name)` — inline rename
- **Problemy:**
  - ⚠️ **Brak cofania kroków** — undo/redo dla step operations nie jest wspierane

### 2.7 Luki / Gaps

| Luka | Severity | Opis |
|------|----------|------|
| **Brak testów** | 🔴 HIGH | useAnimationPlayback + useAnimationInterpolation = 0 testów |
| **Brak progress bara** | 🟡 MEDIUM | Użytkownik nie widzi postępu w kroku |
| **Brak thumbnaili** | 🟡 MEDIUM | Tylko tekstowe chipy zamiast miniatur |
| **Brak interpolacji kolorów** | 🟢 LOW | Skokowa zmiana kolorów między krokami |
| **Brak interpolacji rotacji** | 🟢 LOW | Brak płynnej rotacji equipment/players |
| **Brak drag reorder** | 🟢 LOW | Nie można przeciągać kroków |
| **Brak undo dla step ops** | 🟡 MEDIUM | addStep/removeStep nie są undoable |

### 2.8 Rekomendacje

1. **Dodać testy** dla `useAnimationPlayback` (mocki timers) i `useAnimationInterpolation`
2. **Dodać progress bar** w SmartBottomBar — pasek postępu nad chipami kroków
3. **Dodać step thumbnails** — generator już istnieje (`setThumbnailGenerator` w BoardPage)
4. **Dodać color/rotation interpolation** — rozszerzyć `useAnimationInterpolation`
5. **Dodać undo dla step operations** — pushHistory w addStep/removeStep

---

## 📊 Podsumowanie

### Settings/User System: 7/10 ⚠️
- Mocne: Działa pełny cykl Free → Pro → Team, Stripe, entitlements zdefiniowane
- Słabe: UI gating niekompletny, legacy style w SettingsModal, brak Team management UI

### Animation System: 6/10 ⚠️
- Mocne: RAF loop z easing, getters pattern, interpolacja pozycji, SmartBottomBar
- Słabe: 0 testów, brak progress bara, brak thumbnaili, brak undo dla step ops

### Priorytet napraw
1. 🔴 **Testy animacji** — P0 przed betą
2. 🔴 **UI gating** — `can('addStep')`, `can('createProject')` w UI
3. 🟡 **Progress bar w animacji** — poprawa UX
4. 🟡 **SettingsModal → design tokeny** — spójność UI
5. 🟢 **Team management UI** — dopiero gdy Team plan aktywny