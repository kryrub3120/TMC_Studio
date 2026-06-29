# Delivery Evidence — S1 LOOP: Hard assertions + frozen CI
**Data:** 2026-06-22
**Iteracja:** 2 (LOOP)

## Scope — co faktycznie testujemy
- **Auth**: dev-login smoke only (przycisk devLogin w DEV mode). OAuth popup / realna rejestracja / email-password login NIE są testowane automatycznie.
- **Checkout**: pricing modal smoke + yearly cycle assertion. Realne Stripe checkout session NIE jest testowane (wymaga realnego Stripe + Supabase).
- **Export**: realne `waitForEvent('download')` z asercją `.png` filename — to jest najważniejszy golden path test.

## Co naprawiono w LOOP
### 1. EKSPORT — realne asercje pobrania
- Test `golden path: add player → export PNG → file downloaded` używa:
  ```ts
  const downloadPromise = page.waitForEvent('download');
  // ... click export → PNG
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.(png|jpe?g)$/i);
  ```
- Przycisk eksportu klikany przez `[data-tour="export"]` (locale-independent)
- Krytyczna asercja NIE jest pod `if (visible)` — test PADA gdy eksport nie działa

### 2. CHECKOUT MODAL — twarda asercja obecności i ceny rocznej
- Test `/app?upgrade=pro&cycle=yearly opens pricing modal with yearly price` używa:
  ```ts
  await expect(page.locator('#root')).toContainText(/choose|wybierz/i, { timeout: 10000 });
  // + yearly price assertion przez bodyText.includes()
  ```
- Krytyczna asercja NIE jest pod `if (visible)` — test PADA gdy modal nie jest widoczny
- PricingModal nie używa `role="dialog"` — asercja oparta o `toContainText`

### 3. SOFT-GUARDS — tylko dla opcjonalnych overlayi
- Krytyczne asercje (export download, pricing modal) NIE są pod `if (visible)`
- Opcjonalne overlay dismissale (cookie banner, tutorial) MOGĄ mieć `if (visible)` — to jest OK, bo test nie może paść z powodu braku overlayu
- Wzorzec: guard na dismiss overlayu, twarda asercja na funkcji

### 4. NEGATIVE CONFIRMATION
- Test eksportu z celowo błędnym selektorem (`NONEXISTENT_LABEL`) → **PADŁ** z timeoutem
- Po przywróceniu prawidłowego selektora → **ZIELONY**
- Dowód: testy fałszywie nie przechodzą gdy funkcja zepsuta

### 5. CI — `--frozen-lockfile`
- Wszystkie 4 joby zmienione z `--no-frozen-lockfile` na `--frozen-lockfile`
- Zweryfikowane lokalnie: `pnpm install --frozen-lockfile` przechodzi (lockfile w sync)

## Wynik
- **11/11 E2E — ALL GREEN**
- **113/113 unit tests — ALL GREEN**
- **`--frozen-lockfile` — OK**
- **Negative confirmation — PASSED** (test pada gdy selektor zepsuty)

## Świadome ograniczenia
- Auth: tylko devLogin smoke (nie realny OAuth/login)
- Checkout: tylko pricing modal smoke (nie realne Stripe checkout)
- Pokrycie wymaga osobnego taska S-BILLING lub manual gate przed prod
- E2E używają selektorów tekstowych (brak `data-testid` w aplikacji)
