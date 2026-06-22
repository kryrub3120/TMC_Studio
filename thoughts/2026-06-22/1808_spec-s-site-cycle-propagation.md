# Spec sprintu S-SITE — Propagacja cyklu z PricingPage do PricingModal
**Data:** 2026-06-22
**Cel:** Zapewnić, że wybór cyklu (monthly/yearly) na publicznej `/pricing` jest poprawnie przekazywany do in-app PricingModal.
**Przeznaczenie:** Dla Sprintu S-SITE modyfikującego `apps/web/src/pages/PricingPage.tsx`.

## Stan obecny (już działa)

PricingPage już ustawia `&cycle=` w URL, a AppShell czyta go w useEffect:

```
/app?upgrade=pro&cycle=yearly  → setPricingUpgradeCycle('yearly') → PricingModal initialCycle='yearly'
/app?upgrade=pro               → setPricingUpgradeCycle('monthly') → PricingModal initialCycle='monthly'
```

## Co S-SITE może zmienić / poprawić

### 1. Obsługa click-through z /pricing dla zalogowanego usera

Obecnie **wszyscy** klikający `/app?upgrade=pro` — zarówno gueście jak i zalogowani — trafiają do PricingModal. Dla zalogowanego usera modal jest OK (wywołuje checkout). Dla gościa modal pokazuje sign-up CTA.

S-SITE może rozważyć:
- Jeśli user jest już zalogowany (sprawdzić przez `supabase.auth.getSession()` → sesja istnieje) → od razu otwórz checkout, pomijając modal.
- Jeśli guest → pokaż PricingModal jak teraz.

**Aktualny flow (nie zmieniać bez potrzeby):**
```
PricingPage
  └─ Link → /app?upgrade=pro&cycle=yearly
       └─ AppShell.useEffect → setPricingUpgradeCycle('yearly')
            └─ billingController.openPricingModal()
                 └─ PricingModal przyjmuje initialCycle='yearly' (z props)
                      └─ create-checkout z billingCycle='yearly' w body
```

### 2. Validation cyklu

`cycle` z URL powinien być walidowany. W AppShell jest już bezpieczne:
```ts
const cycle: 'monthly' | 'yearly' = cycleParam === 'yearly' ? 'yearly' : 'monthly';
```

Jeśli S-SITE doda własne parsowanie, użyj tego samego wzorca.

### 3. Reset cyklu przy zamknięciu

S-BILLING już naprawił: `onClosePricingModal` resetuje `pricingUpgradeCycle` do `'monthly'`.
S-SITE nie musi tego duplikować, wystarczy nie usuwać tego fixu.

## Czego NIE robić

- **Nie zmieniać PricingModal.tsx** w S-SITE — logika initialCycle jest już gotowa.
- **Nie zmieniać AppShell.tsx** — hook usePaymentReturn nie potrzebuje cyklu.
- **Nie dodawać nowych parametrów URL** — `upgrade` i `cycle` wystarczają.

## Testy w S-SITE

- Kliknięcie "Get Pro" z cyklem yearly → otwiera PricingModal z yearly jako domyślnym
- Kliknięcie "Get Pro" bez cyklu → otwiera PricingModal z monthly jako domyślnym
- Zamknięcie modala → cykl wraca do monthly (przy następnym otwarciu)
- Bezpieczeństwo: `cycle` z URL nie może być spoofowany (walidacja)

## Pliki do zmiany w S-SITE

- `apps/web/src/pages/PricingPage.tsx` — tylko jeśli zmiana UX (np. pomijanie modala dla zalogowanych)

## Ryzyka

- Jeśli S-SITE zmieni strukturę linków `/app?upgrade=...`, musi zachować `cycle` param.
- Zmiana w AppShell (np. refactor useEffect) może zerwać przepływ — trzymaj ten useEffect stabilny.