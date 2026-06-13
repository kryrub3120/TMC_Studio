# Delivery - Verifikacja Premium Export + Dokumentacja
**Data:** 2026-06-13 13:00

## Zadanie
1. Sprawdzić czy PDF i GIF są realnie zablokowane za premium
2. Jeśli nie → naprawić
3. Zaktualizować dokumentację

## Decyzje i uzasadnienie

### Premium export — zweryfikowany jako działający ✅

**Łańcuch blokady PDF/GIF:**

1. `entitlements.ts` — `ENTITLEMENTS_BY_PLAN`: Guest/Free → `canExportGIF: false`, `canExportPDF: false`
2. `useEntitlements.ts` — `can('exportGIF')`/`can('exportPDF')` zwraca `'hard-block'` dla Guest/Free
3. `useExportController.ts` — `exportGIF()` i `exportPDF()` wołają `can()` przed exportem:
   - `if (gifAllowed !== true) { onOpenPricingModal(); showToast('...Pro feature...'); return; }`
4. `TopBar.tsx` — `ExportMenu`:
   - `const isLocked = item.pro && !isPro` → dla Guest/Free przyciski są `disabled` z gwiazdką ⭐
   - Kliknięcie na zablokowany przycisk → nic się nie dzieje (disabled)
   - Pro/Team → przyciski aktywne, `onExport(format)` wywołuje odpowiednią funkcję

**Nic nie wymagało naprawy — cały łańcuch był poprawny.**

## Co zrobiono

### 1. Weryfikacja kodu
- `apps/web/src/lib/entitlements.ts` — zawiera `canExportGIF: false`, `canExportPDF: false` dla Guest/Free
- `apps/web/src/hooks/useExportController.ts` — `exportGIF()` sprawdza `can('exportGIF')`, `exportPDF()` sprawdza `can('exportPDF')`
- `packages/ui/src/TopBar.tsx` — `ExportMenu` blokuje przyciski dla Guest/Free + gwiazdka ⭐

### 2. Aktualizacja dokumentacji

| Dokument | Zmiana |
|----------|--------|
| `docs/DESIGN_SYSTEM.md` | Dodano `confettiDrop` do animacji, zaktualizowano TopBar (Export dropdown) i SmartBottomBar w tabeli komponentów, dodano `showCelebration` do EmptyStateOverlay |
| `docs/FEATURE_SPEC.md` | Cała sekcja 12 Export przepisana: nowy UI Export dropdown, JPG export, PDF/GIF jako Pro z entitlements, SVG jako experimental bez UI |
| `docs/ENTITLEMENTS.md` | Dodano `exportJPG` jako darmowy, zaktualizowano matrix o JPG |
| `docs/ARCHITECTURE_OVERVIEW.md` | ExportService → PNG/JPG/GIF/PDF |
| `CHANGELOG.md` | Dodano wpisy: Export dropdown, SmartBottomBar, First Impression UX |

### 3. Type check
- `@tmc/ui` build ✅
- `apps/web` typecheck ✅

## Dowody
- `can('exportGIF')` dla 'guest' → `'hard-block'` w `entitlements.ts`
- `can('exportPDF')` dla 'free' → `'hard-block'` w `entitlements.ts`
- `ExportMenu` w TopBar → `isLocked = item.pro && !isPro` z `disabled` i gwiazdką
- `exportGIF()` w useExportController → `if (gifAllowed !== true) { onOpenPricingModal(); ... return; }`

## Wynik
✅ Premium Export działa poprawnie — nic nie wymagało naprawy.
✅ Dokumentacja zaktualizowana dla wszystkich zmian.