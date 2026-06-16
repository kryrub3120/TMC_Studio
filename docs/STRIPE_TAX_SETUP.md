# TMC Studio — Sprzedaż międzynarodowa: analiza krajów i konfiguracja Stripe

_Utworzono: 2026-06-15 · Status: instrukcja wdrożeniowa dla agenta · Decyzja: Stripe + Stripe Tax (nie MoR)_

> **To nie jest porada podatkowa.** Konfigurację techniczną może wykonać agent, ale **rejestrację VAT OSS, progi i deklaracje musi potwierdzić księgowy/doradca podatkowy.** Stripe Tax *liczy i pobiera* podatek oraz przygotowuje dane do deklaracji — ale **deklaracje składamy my**.

---

## 0. Kluczowe założenie (potwierdź przed startem)

Dokument zakłada, że **podmiot sprzedający (firma TMC Studio / Tactics Made Clear) jest zarejestrowany w Polsce (UE)**. To zmienia całą logikę progów i rejestracji.

- **Jeśli firma jest w PL (UE)** → obowiązuje pan-unijny próg **€10 000/rok** na sprzedaż transgraniczną B2C; poniżej naliczamy polski VAT 23%, powyżej rejestrujemy się w **OSS (procedura unijna)** i naliczamy VAT kraju klienta.
- **Jeśli firma jest poza UE** → brak progu €10 000, VAT od kraju klienta **od pierwszej sprzedaży**, rejestracja w **OSS (procedura nieunijna)**.

➡️ **Działanie agenta:** ustaw w Stripe poprawny kraj firmy; resztę progów monitoruje Stripe Tax.

---

## 1. Strategia rynkowa — gdzie sprzedajemy

Sprzedajemy **globalnie cyfrowo** (SaaS nie wymaga wysyłki), ale priorytety i lokalizacja idą za językami **EN / ES (castellano) / PL**.

| Tier | Rynki | Język UI | Waluta prezentacji | Priorytet |
|---|---|---|---|---|
| **T1 — rdzeń** | Polska, Hiszpania, Irlandia + globalny angielski | PL / ES / EN | PLN / EUR / USD | Launch |
| **T2 — reszta UE-27** | DE, FR, IT, NL, PT, BE, AT, i pozostałe | EN (+ES/PL gdzie pasuje) | EUR | Launch (VAT przez OSS) |
| **T3 — Europa poza UE** | UK, Szwajcaria, Norwegia | EN | GBP / EUR / USD | Faza 2 |
| **T4 — świat** | USA, Kanada, Australia, reszta | EN | USD | Faza 2 |

Technicznie Stripe + Stripe Tax obsłuży każdy kraj od razu — kwestia jest **podatkowa (gdzie mamy obowiązek rejestracji)**, nie techniczna. Zaczynamy od UE + globalny angielski, kolejne jurysdykcje włączamy, gdy Stripe Tax zasygnalizuje przekroczenie progu.

---

## 2. Logika podatkowa (jak Stripe ma liczyć)

### 2.1 B2C w UE (konsument)
VAT **wg kraju klienta**, stawka standardowa (usługi cyfrowe = brak stawek obniżonych). Ceny pokazujemy **brutto (tax-inclusive)** — wymóg ochrony konsumenta UE. Lokalizację klienta Stripe ustala na podstawie kraju karty/adresu IP/adresu rozliczeniowego (UE wymaga 2 niesprzecznych dowodów — Stripe to robi).

### 2.2 B2B w UE (firma z VAT-UE)
Jeśli klient poda **ważny numer VAT-UE**, stosujemy **reverse charge** (odwrotne obciążenie) — Stripe Tax automatycznie waliduje numer w VIES i zeruje VAT, oznaczając transakcję jako reverse charge. Cena netto.

### 2.3 Polska (kraj firmy)
Klient z PL → polski VAT **23%** zawsze (krajowa sprzedaż, nie OSS).

### 2.4 Poza UE
- **UK:** sprzedaż usług cyfrowych konsumentom w UK → rejestracja UK VAT (dla podmiotu spoza UK brak progu) i 20% VAT. Stripe Tax obsłuży po dodaniu rejestracji.
- **USA:** sales tax na SaaS różni się per stan; obowiązek dopiero po przekroczeniu **progów nexus** danego stanu. Stripe Tax monitoruje i alarmuje — rejestrujemy się stanowo dopiero gdy próg przekroczony.
- **Szwajcaria, Norwegia, Kanada, Australia:** własne progi rejestracji; Stripe Tax monitoruje.

➡️ **Zasada:** nie rejestrujemy się wszędzie z góry. Stripe Tax pilnuje progów i powiadamia; rejestrację dokłada się, gdy próg zostanie przekroczony.

---

## 3. Stawki VAT 2026 — tabela referencyjna (UE-27 + sąsiedzi)

Stawka **standardowa** (usługi cyfrowe). Źródło: Tax Foundation, stan na styczeń 2026.

| Kraj | Kod | VAT std. | Uwagi |
|---|---|---|---|
| Polska | PL | **23%** | Kraj firmy — sprzedaż krajowa, nie OSS |
| Hiszpania | ES | **21%** | Rynek T1 (castellano) |
| Irlandia | IE | 23% | Rynek T1 (EN) |
| Niemcy | DE | 19% | |
| Francja | FR | 20% | |
| Włochy | IT | 22% | |
| Niderlandy | NL | 21% | |
| Belgia | BE | 21% | |
| Austria | AT | 20% | |
| Portugalia | PT | 23% | |
| Luksemburg | LU | 17% | Najniższy w UE |
| Malta | MT | 18% | |
| Cypr | CY | 19% | |
| Grecja | GR | 24% | |
| Chorwacja | HR | 25% | |
| Słowenia | SI | 22% | |
| Słowacja | SK | 23% | podniesiony w 2025 |
| Czechy | CZ | 21% | |
| Węgry | HU | **27%** | Najwyższy w UE |
| Rumunia | RO | 21% | podniesiony z 19% (sie 2025) |
| Bułgaria | BG | 20% | |
| Litwa | LT | 21% | |
| Łotwa | LV | 21% | |
| Estonia | EE | 24% | podniesiony z 22% (lip 2025) |
| Finlandia | FI | 25.5% | |
| Szwecja | SE | 25% | |
| Dania | DK | 25% | |
| **Poza UE** | | | |
| Wielka Brytania | GB | 20% | osobna rejestracja UK VAT |
| Norwegia | NO | 25% | VOEC dla cyfrowych |
| Szwajcaria | CH | 8.1% | |

> Nie wpisujemy tych stawek na sztywno — **Stripe Tax aktualizuje je automatycznie**. Tabela służy do weryfikacji cen brutto i kontroli.

---

## 4. Konfiguracja Stripe — krok po kroku (dla agenta)

### Krok 1 — Konto i dane firmy
1. W **Settings → Business settings** ustaw pełne dane prawne podmiotu (nazwa, adres PL, NIP/VAT-UE). Te dane trafią na faktury.
2. Ustaw walutę domyślną konta (**EUR** rekomendowane jako bazowa dla UE; PLN jeśli rozliczenia krajowe).

### Krok 2 — Włącz Stripe Tax
1. **Settings → Tax** → włącz **Stripe Tax** (automatyczne naliczanie).
2. Ustaw **origin address** = adres firmy w Polsce.
3. Ustaw **default product tax category** = **„Software as a service (SaaS)" / „Electronically supplied services"** (kod podatkowy dla usług cyfrowych). Dzięki temu Stripe wie, że to usługa cyfrowa rozliczana wg kraju klienta.
4. Włącz **monitoring progów** (threshold monitoring) — Stripe będzie alarmować przy zbliżaniu się do progu rejestracji w nowej jurysdykcji.

### Krok 3 — Rejestracje podatkowe (Tax registrations)
1. Dodaj **Poland (domestic)** — VAT 23%.
2. Po przekroczeniu €10 000 transgranicznie (lub od startu, jeśli decyzja księgowego) dodaj rejestrację **EU OSS (Union scheme)** — wtedy Stripe nalicza VAT kraju klienta dla całej UE.
3. **UK, US, CH, NO itd.** dodawaj **dopiero po sygnale przekroczenia progu** od Stripe Tax.
> Dodanie rejestracji w Stripe = Stripe zaczyna pobierać podatek dla danej jurysdykcji. Nie dodawaj rejestracji, których realnie nie mamy.

### Krok 4 — Katalog produktów i cen (Products & Prices)
Utwórz produkty zgodne z `ENTITLEMENTS.md`:

| Produkt | Plany (Prices) | Tax behavior | Waluty |
|---|---|---|---|
| **TMC Studio Pro** | miesięczny + roczny | **inclusive** (brutto) dla UE B2C | EUR, PLN, USD, GBP |
| **TMC Studio Team** | miesięczny + roczny (per seat) | **inclusive** | EUR, PLN, USD, GBP |

1. Każdej cenie przypisz **tax behavior = inclusive** (cena zawiera VAT — wymóg B2C w UE). Od **29 kwietnia 2026** Stripe przetwarza subskrypcje wg ustawień podatkowych konta (wcześniej zawsze tax-excluded), więc inclusive zadziała poprawnie także dla odnowień.
2. Ustaw **multi-currency prices** — osobna cena na walutę (EUR/PLN/USD/GBP), żeby klient widział lokalną walutę.
3. Przypisz **tax code = SaaS** na poziomie produktu (dziedziczy z domyślnego, ale potwierdź).
4. Plan **Free** i **Guest** nie mają ceny w Stripe — to logika entitlements w aplikacji.

### Krok 5 — Checkout / Billing
1. Włącz **automatic tax** w Checkout/Payment Links/Billing.
2. Włącz **wymóg adresu rozliczeniowego** (billing address) — bez niego Stripe nie policzy VAT.
3. Włącz **collect Tax ID** → walidacja VAT-UE (VIES) → automatyczny reverse charge dla B2B.
4. Włącz **Customer Portal** (Settings → Billing → Customer portal): anulowanie, zmiana planu, pobieranie faktur — wspiera „łatwe anulowanie" wymagane przez UE.
5. Dodaj **pole zgody konsumenta na natychmiastowe świadczenie + utratę prawa odstąpienia** (custom field / checkbox w Checkout lub na własnej stronie checkout przed redirectem) — wymóg prawa odstąpienia (patrz `SITE_ARCHITECTURE.md` §4.4). Zapisz zgodę w metadanych transakcji.

### Krok 6 — Faktury (Invoicing)
1. Włącz **automatyczne faktury** dla subskrypcji.
2. Uzupełnij dane sprzedawcy, **kolejną numerację faktur**, stopkę z NIP/VAT-UE.
3. Włącz wysyłkę faktury e-mailem po płatności.

### Krok 7 — Integracja z aplikacją (Supabase)
1. Skonfiguruj **webhooki** Stripe → endpoint aplikacji: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`.
2. Na podstawie zdarzeń ustawiaj `subscriptionTier` użytkownika w Supabase (`free` / `pro` / `team`) — spójnie z `derivePlan()` w `entitlements.ts`.
3. Mapuj `price ID` → plan (Pro/Team) w configu.
4. Obsłuż **grace period** i `payment_failed` (downgrade do Free po nieudanej płatności).

### Krok 8 — Testy
1. Tryb **test mode**: zakup jako konsument PL (VAT 23% w cenie), konsument DE (19%), konsument ES (21%).
2. Zakup B2B z numerem VAT-UE → sprawdź **reverse charge** (VAT 0, oznaczenie na fakturze).
3. Sprawdź fakturę (dane, numeracja, stawka), webhook → poprawny `subscriptionTier` w Supabase.
4. Test anulowania przez Customer Portal i `payment_failed` → downgrade.

---

## 5. Prezentacja cen na stronie `/pricing`

- **Dla konsumentów UE: ceny brutto** (z VAT) — tak ustawiamy `inclusive`. Ta sama cena „na rękę" niezależnie od kraju; różni się tylko rozbicie VAT na fakturze.
- **B2B z VAT-UE:** po podaniu numeru cena netto (reverse charge).
- **Waluty:** PLN dla PL, EUR dla strefy euro/ES, GBP dla UK, USD globalnie. Selektor waluty lub auto-detekcja po kraju.
- **Omnibus:** przy promocjach pokazać najniższą cenę z 30 dni (patrz `SITE_ARCHITECTURE.md` §4.6).

---

## 6. Checklist dla agenta (kolejność)

- [ ] Potwierdzić kraj rejestracji firmy (zał. §0) — **z księgowym**
- [ ] Dane prawne firmy w Stripe + waluta domyślna
- [ ] Włączyć Stripe Tax (origin PL, kategoria SaaS, monitoring progów)
- [ ] Rejestracja Poland domestic; OSS Union scheme wg decyzji księgowego
- [ ] Produkty Pro + Team, ceny mies./rok, **tax behavior = inclusive**, waluty EUR/PLN/USD/GBP, tax code SaaS
- [ ] Checkout: automatic tax, billing address, collect + validate VAT ID (reverse charge)
- [ ] Customer Portal (anulowanie, faktury, zmiana planu)
- [ ] Checkbox zgody na świadczenie + utrata prawa odstąpienia, zapis w metadanych
- [ ] Automatyczne faktury z numeracją i danymi VAT
- [ ] Webhooki → Supabase `subscriptionTier`, mapowanie price→plan, obsługa payment_failed
- [ ] Testy: B2C PL/DE/ES, B2B reverse charge, faktura, webhook, anulowanie

---

## 7. Do potwierdzenia z księgowym (nie agent)
1. Kraj rejestracji firmy i forma prawna.
2. Czy rejestrujemy OSS od startu, czy dopiero po €10 000.
3. Próg i moment rejestracji UK VAT.
4. Czy/kiedy monitorujemy progi nexus w USA.
5. Wymogi formalne polskiej faktury (numeracja, dane, JPK).

---

## Źródła
- [VAT Rates in Europe, 2026 — Tax Foundation](https://taxfoundation.org/data/all/eu/value-added-tax-vat-rates-europe/)
- [The One Stop Shop — European Commission](https://vat-one-stop-shop.ec.europa.eu/one-stop-shop_en)
- [What is EU VAT & VAT OSS? — Stripe](https://stripe.com/guides/introduction-to-eu-vat-and-european-vat-oss)
- [Stripe Tax](https://stripe.com/tax) · [Collect customer tax IDs — Stripe Docs](https://docs.stripe.com/tax/checkout/tax-ids) · [Tax codes & behavior — Stripe Docs](https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior)
