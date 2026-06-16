# TMC Studio — Architektura stron, strategia sprzedaży i zgodność z UE

_Utworzono: 2026-06-15 · Status: propozycja produktowa_

Dokument opisuje **jakie strony powinna mieć strona `tmcstudio.app`**, jak złożyć je w spójny lejek sprzedażowo-promocyjny zgodny z filozofią Product-Led Growth (patrz `PRODUCT_PHILOSOPHY.md`), jakie wymogi prawne UE musimy spełnić oraz jak rozłożyć to na trzy wersje językowe: **EN (główny), ES, PL**.

---

## 1. Klient docelowy (kto, co, dlaczego płaci)

Z produktu wynikają trzy persony — strony marketingowe powinny mówić do każdej z nich osobno.

| Persona | Kim jest | Główna potrzeba | Co ją konwertuje | Plan docelowy |
|---|---|---|---|---|
| **Trener / Analityk** | Trenerzy klubów amatorskich i akademii, asystenci, analitycy | Szybkie przygotowanie planu treningu / odprawy meczowej | Formacje, kroki animacji, eksport PDF do druku, praca offline (desktop) | Pro |
| **Twórca treści** | YouTuberzy, konta taktyczne na X/IG/TikTok, dziennikarze | Estetyczne, animowane wizualizacje taktyki | Eksport GIF/MP4, jakość wizualna, branding | Pro |
| **Klub / sztab (zespół)** | Akademie, kluby, sztaby wieloosobowe | Współdzielenie projektów, spójność, role | Współpraca, foldery, zarządzanie miejscami | Team |
| **Hobbysta / kibic** | Fani taktyki, gracze Football Managera | Zabawa, eksperymenty | Darmowy, bezbarierowy start | Guest → Free |

Wniosek dla stron: potrzebujemy (a) jednej **strony głównej** z jasną wartością, (b) **stron rozwiązań/use-case** pod persony, (c) **strony cennika**, (d) **strony download** (desktop), (e) bloga/SEO oraz (f) kompletu **stron prawnych UE**.

---

## 2. Pełna mapa stron (sitemap)

Legenda: 🟢 istnieje · 🟡 częściowo / do przebudowy · 🔴 do zbudowania

### 2.1 Warstwa marketingowa (publiczna, indeksowana w Google)

| Ścieżka | Strona | Status | Cel |
|---|---|---|---|
| `/` | **Landing / Home** | 🟡 (dziś to od razu apka) | Wartość, dowód, CTA „Try free" + „See plans" |
| `/product` lub sekcje na `/` | **Product / Features** | 🔴 | Pełny przegląd funkcji (board, animacje, eksport) |
| `/use-cases/coaches` | **Dla trenerów** | 🔴 | Use-case + język persony |
| `/use-cases/creators` | **Dla twórców treści** | 🔴 | Use-case + przykłady eksportu GIF |
| `/use-cases/clubs` | **Dla klubów / zespołów** | 🔴 | Współpraca, plan Team, kontakt sprzedażowy |
| `/pricing` | **Cennik** | 🔴 | Porównanie Guest/Free/Pro/Team, ceny z VAT, FAQ rozliczeniowe |
| `/download` | **Pobierz (desktop)** | 🟢 | macOS/Windows z GitHub Releases |
| `/blog` + `/blog/{slug}` | **Blog / SEO** | 🔴 | Ruch organiczny: „4-3-3 explained", tutoriale |
| `/changelog` | **Co nowego** | 🟡 (jest `CHANGELOG.md`) | Transparentność, retencja, SEO |
| `/help` lub `/docs` | **Centrum pomocy** | 🟡 (jest plan overhaul) | Skróty, poradniki, redukcja churn |
| `/about` | **O nas / Tactics Made Clear** | 🔴 | Zaufanie, EEAT, kontekst marki |
| `/contact` | **Kontakt** | 🔴 | Wymóg UE (dane firmy) + sprzedaż Team |
| `/roadmap` | **Roadmapa** (opcjonalnie) | 🔴 | Społeczność, zbieranie głosów |

### 2.2 Warstwa aplikacji (za logowaniem / guest)

| Ścieżka | Strona | Status |
|---|---|---|
| `/app` (lub `/board`) | **Edytor / Board** | 🟢 (dziś pod `/`) |
| `/login`, `/signup` | **Auth** (email + Google) | 🟢 (modal) |
| `/account` | **Ustawienia konta** (profil, bezpieczeństwo, preferencje) | 🟢 (modal) |
| `/billing` | **Subskrypcja / faktury** | 🟢 (modal) |
| `/invite` | **Zaproszenia do zespołu** | 🟢 |

> Rekomendacja architektoniczna: **oddzielić landing (`/`) od edytora (`/app`)**. Dziś `/` to od razu narzędzie — to dobre dla retencji, ale złe dla SEO i sprzedaży. Wzorzec docelowy: `/` = marketing z przyciskiem „Open the board" → `/app` (guest mode od razu, zero tarcia, zgodnie z filozofią PLG).

### 2.3 Warstwa prawna UE (stopka, każda strona)

| Ścieżka | Strona | Status |
|---|---|---|
| `/privacy` | **Polityka prywatności (RODO/GDPR)** | 🟢 do audytu |
| `/terms` | **Regulamin / Terms of Service** | 🟢 do audytu |
| `/cookies` | **Polityka cookies** | 🟢 do audytu |
| `/refunds` | **Zwroty i odstąpienie od umowy** | 🔴 |
| `/legal` lub `/imprint` | **Dane firmy / Impressum** | 🔴 |
| `/dpa` | **Umowa powierzenia (DPA)** dla planu Team | 🔴 |
| `/accessibility` | **Deklaracja dostępności (EAA)** | 🔴 |
| baner zgody | **Cookie consent (opt-in)** | 🔴/🟡 |

---

## 3. Strategia sprzedaży i promocji (lejek)

Spójna z `PRODUCT_PHILOSOPHY.md`: **wartość najpierw, brak dark patterns, Guest → Free → Pro jako podróż, nie lejek-pułapka.**

### 3.1 Logika lejka po stronach

1. **Pozyskanie (TOFU)** — blog/SEO, social (eksporty GIF jako naturalna reklama), `/use-cases/*`. Każdy eksport GIF/PNG może nieść dyskretny watermark „made with tmcstudio.app" (dla Guest/Free) — to organiczny kanał akwizycji.
2. **Zainteresowanie (MOFU)** — `/` i `/product` pokazują wartość; główne CTA: **„Open the board — no signup"** (guest mode). Drugorzędne: „See plans".
3. **Aktywacja** — `/app` w trybie guest: użytkownik tworzy pierwszą taktykę zanim cokolwiek go zatrzyma.
4. **Konwersja Free** — kontekstowy prompt przy limicie (5 kroków guest) → „Continue for free".
5. **Konwersja Pro** — prompt pojawia się **tylko** przy realnej potrzebie (eksport GIF/PDF, brak miejsca na projekty), z linkiem do `/pricing`.
6. **Ekspansja Team** — `/use-cases/clubs` + „Talk to us" (sprzedaż wspomagana, nie self-serve od razu).
7. **Retencja** — `/changelog`, `/help`, e-maile o nowych funkcjach.

### 3.2 Strona `/pricing` — co musi zawierać

- Tabela 4 planów (Guest / Free / Pro / Team) zgodna z `ENTITLEMENTS.md` (projekty, kroki, foldery, eksporty, sync).
- Przełącznik **miesięcznie / rocznie** (rabat roczny = główna dźwignia LTV).
- **Ceny brutto z VAT** dla konsumentów UE (patrz §4.5) + przelicznik waluty (EUR/PLN/USD).
- Sekcja **FAQ rozliczeniowe**: „Czy Free jest naprawdę darmowy?", „Czy mogę anulować?", „Jak działają zwroty?".
- Język wg filozofii: „Compare plans", „Upgrade when you need it", „Free stays free forever".
- **Bez fałszywej pilności** i bez liczników — to świadomy anty-cel produktu.

### 3.3 Promocja i dowód społeczny

- Sekcje z **opiniami / logo klubów** na `/` i `/use-cases/*` — uwaga: opinie muszą być **prawdziwe i weryfikowalne** (dyrektywa Omnibus, §4.6).
- Galeria przykładowych animacji (eksporty produktu) — najsilniejszy „showroom".
- Program poleceń / afiliacja (opcjonalnie, faza 2).

---

## 4. Zgodność z prawem UE (wymagania)

> To nie jest opinia prawna. Przed publikacją skonsultuj treści z prawnikiem. Poniżej zakres do pokrycia.

### 4.1 RODO / GDPR — Polityka prywatności (`/privacy`)

Musi opisywać: tożsamość administratora (Tactics Made Clear + dane), jakie dane zbieramy (konto, e-mail, avatar, dane techniczne, dane płatnicze przez procesora), **podstawy prawne** przetwarzania, **cele**, okresy retencji, **podmioty przetwarzające** (Supabase, hosting Netlify, procesor płatności, Google OAuth, analityka), transfery poza EOG (mechanizmy SCC), oraz **prawa użytkownika** (dostęp, sprostowanie, usunięcie, przenoszenie, sprzeciw). Funkcje „eksport danych" i „usuń konto" już są w produkcie — to wspiera prawo do przenoszenia i bycia zapomnianym.

### 4.2 ePrivacy / Cookies (`/cookies` + baner zgody)

Cookies inne niż niezbędne (analityka, marketing) wymagają **uprzedniej zgody opt-in** — baner musi dawać równorzędne „Akceptuj" / „Odrzuć", bez pre-zaznaczonych checkboxów. Polityka cookies wymienia konkrety: nazwa, cel, czas życia, dostawca. Zgodę trzeba dać się **wycofać** równie łatwo.

### 4.3 Regulamin / ToS (`/terms`)

Zakres usługi, konto, dozwolone użycie, własność IP, ograniczenie odpowiedzialności, prawo właściwe i sąd, zasady subskrypcji (odnowienia, anulowanie), zgodność z **dyrektywą o treściach cyfrowych (2019/770)** — gwarancja zgodności usługi z umową i środki ochrony.

### 4.4 Prawo odstąpienia (`/refunds`) — kluczowe dla SaaS B2C

Konsument w UE ma **14 dni na odstąpienie** od umowy zawartej na odległość. Dla treści/usług cyfrowych dostarczanych natychmiast trzeba uzyskać **wyraźną zgodę** użytkownika na rozpoczęcie świadczenia przed upływem 14 dni **oraz** potwierdzenie, że traci on prawo odstąpienia (checkbox przy zakupie). Bez tego ryzykujemy obowiązek zwrotu. Strona musi jasno opisać: jak anulować, politykę zwrotów proporcjonalnych, brak zwrotu po świadomym zrzeczeniu się prawa.

### 4.5 VAT na usługi cyfrowe (OSS)

Sprzedaż subskrypcji konsumentom w UE = **VAT wg kraju klienta** (rozliczenie przez procedurę **VAT OSS**). Dla B2C **ceny pokazujemy brutto** (z VAT). Dla B2B z ważnym numerem VAT-UE — mechanizm reverse charge. Faktury muszą zawierać wymagane dane. **Decyzja: zostajemy przy Stripe + Stripe Tax** (nie MoR). Stripe Tax nalicza i pobiera właściwą stawkę per kraj oraz przygotowuje dane do deklaracji, ale **rozliczenie VAT OSS i faktury pozostają po naszej stronie** (potrzebny księgowy/doradca). Pełny przewodnik konfiguracji i analiza krajów: `STRIPE_TAX_SETUP.md`.

### 4.6 Dyrektywa Omnibus (transparentność cen i opinie)

Przy promocjach trzeba pokazać **najniższą cenę z 30 dni** przed obniżką. Opinie użytkowników muszą być prawdziwe i oznaczone, jeśli weryfikowane — **zakaz fałszywych recenzji**. Dotyczy to sekcji social proof na landingu i `/pricing`.

### 4.7 Dane firmy / Impressum (`/legal`)

Wymóg dyrektywy o e-commerce: pełna nazwa podmiotu, adres, e-mail kontaktowy, nr rejestrowy/NIP. W Niemczech (rynek ES/EN obejmie też DACH) **Impressum jest obowiązkowe** — warto mieć od razu. Link w stopce na każdej stronie.

### 4.8 European Accessibility Act (`/accessibility`)

EAA obowiązuje od **28 czerwca 2025** — usługi e-commerce/cyfrowe kierowane do konsumentów UE muszą być **dostępne (WCAG 2.1 AA)**: kontrast, nawigacja klawiaturą, ARIA, alty. To dotyczy stron marketingowych i przepływu zakupu (sam edytor canvas jest trudniejszy, ale strony sprzedażowe muszą spełniać normę). Potrzebna **deklaracja dostępności**. Zalecany audyt WCAG przed launchem.

### 4.9 DPA dla planu Team (`/dpa`)

Gdy klient (klub) wprowadza dane swoich użytkowników, my jesteśmy podmiotem przetwarzającym → potrzebna **umowa powierzenia** do podpisu/akceptacji w przepływie Team.

---

## 5. Wersje językowe (EN · ES · PL)

### 5.1 Strategia URL

Rekomendacja: **podkatalogi z prefiksem językowym** (najlepsze SEO, najprostsze w utrzymaniu):

```
tmcstudio.app/          → przekierowanie wg języka przeglądarki / domyślnie /en
tmcstudio.app/en/...    → angielski (domyślny, hreflang x-default)
tmcstudio.app/es/...    → hiszpański
tmcstudio.app/pl/...    → polski
```

Każda strona marketingowa i prawna istnieje w trzech wariantach. **Edytor (`/app`) lokalizujemy przez UI i18n** (nie przez osobne URL — to aplikacja, nie treść SEO).

### 5.2 Implementacja techniczna

- Tagi **`hreflang`** dla każdej pary język/strona + `x-default` na EN.
- `lang` atrybut w `<html>`, lokalizowane `<title>`/meta, sitemap.xml z wariantami.
- Selektor języka w nagłówku/stopce; zapamiętanie wyboru (zgodne z preferencjami w chmurze, które już synchronizujemy).
- Biblioteka i18n (np. `react-i18next`) w `apps/web` — dziś **brak warstwy i18n**, trzeba ją wprowadzić; teksty wynieść do plików `en.json` / `es.json` / `pl.json`.
- **Ceny**: EUR jako bazowa dla ES/EN-EU, PLN dla PL, USD dla EN-global; brutto z VAT wg kraju.

### 5.3 Priorytet tłumaczeń (kolejność prac)

1. **EN** — pełen zakres (landing, pricing, prawne, app) — rynek globalny, baza.
2. **PL** — landing, pricing, prawne, app — rynek lokalny i zespół.
3. **ES** — landing, pricing, prawne, app — duży rynek piłkarski (Hiszpania + LatAm; rozważyć es-ES vs es-419 w fazie 2).

Strony prawne tłumaczy/weryfikuje osoba z kompetencjami prawnymi w danym języku (nie tłumaczenie maszynowe).

---

## 6. Rekomendowana kolejność wdrożenia (roadmapa stron)

**Faza 1 — Launch-ready (must-have prawne + sprzedaż):**
`/` jako landing oddzielony od `/app` · `/pricing` · audyt `/privacy` `/terms` `/cookies` · `/refunds` · `/legal` (Impressum) · baner cookie opt-in · `/download` (jest) · checkbox zrzeczenia prawa odstąpienia w checkout · podstawowy i18n EN+PL.

**Faza 2 — Wzrost:**
`/use-cases/coaches|creators|clubs` · `/blog` + 5–10 artykułów SEO · `/changelog` publiczny · `/about` · `/contact` · ES jako trzeci język · deklaracja `/accessibility` + audyt WCAG.

**Faza 3 — Skalowanie:**
`/help` (overhaul) · `/dpa` + self-serve Team · `/roadmap` · program poleceń · es-419.

---

## 7. Decyzje — ZATWIERDZONE

1. **Domena:** `tmcstudio.app` (produkt), `tacticsmadeclear.com` jako marka-parasol z przekierowaniem.
2. **Rozdział `/` (marketing) od `/app` (edytor):** tak.
3. **Płatności:** **Stripe + Stripe Tax** (nie MoR). VAT OSS i faktury po naszej stronie — przewodnik: `STRIPE_TAX_SETUP.md`.
4. **Watermark Guest/Free:** tak — lewy dolny róg, `tmcstudio.app`, niskie krycie, elegancki, znika w Pro.
5. **`/product`:** sekcje na landingu na start; osobna strona później.
6. **Hiszpański:** **castellano (es-ES)** na start; es-419 w Fazie 3.
7. **Audyt prawny** treści + **audyt WCAG** przed launchem — konieczne.
