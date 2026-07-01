# TMC Studio — Kompleksowy plan strony i launchu

_Utworzono: 2026-06-15 · Status: plan wykonawczy · Uzupełnia `SITE_ARCHITECTURE.md`_

## Atut przewodni (oś całego planu)

> **„Narysuj dowolną taktykę w 30 sekund. Wszystko pod ręką, z każdego urządzenia."**

Każda strona, sekcja i komunikat ma udowadniać ten jeden obietnicę. Cztery filary, które ją tworzą i które przewijają się przez cały marketing:

| Filar | Obietnica | Dowód w produkcie |
|---|---|---|
| ⚡ **Szybkość** | Od pomysłu do gotowej taktyki w 30 s | Formacje pod klawiszami `1-6`, dodanie zawodnika `P`, piłka `B`, strzałka `A` |
| ⌨️ **Minimum kroków** | Zero klikania po menu | Skróty klawiszowe na wszystko, **Command Palette `Cmd/Ctrl+K`** |
| 🌍 **Z każdego urządzenia** | Komputer, laptop, desktop offline | Web + desktop (macOS/Win, Tauri), **cloud sync**, offline-first |
| 🎬 **Gotowe do udostępnienia** | Eksport jednym skrótem | PNG/GIF/PDF/SVG, animacje krok-po-kroku |

Reszta dokumentu przekłada to na pozycjonowanie, treść stron, lejek, technikę, prawo i roadmapę.

---

## 1. Pozycjonowanie i messaging

### 1.1 Główne komunikaty (hierarchia)

- **H1 / hero:** „Draw any football tactic in 30 seconds." (EN) · „Dibuja cualquier táctica en 30 segundos." (ES) · „Narysuj dowolną taktykę w 30 sekund." (PL)
- **Sub-headline:** „Keyboard-fast tactics board for coaches, analysts and creators. Works in your browser and on desktop — your boards sync everywhere."
- **CTA główne:** „Open the board — no signup" → `/board` (guest mode).
- **CTA drugie:** „See plans" → `/pricing`.

### 1.2 Taglines per persona (do use-case'ów i kampanii)

| Persona | Tagline | Akcent |
|---|---|---|
| Trener / analityk | „Prepare your session before the kettle boils." | Szybkość + PDF do druku |
| Twórca treści | „From idea to shareable GIF in under a minute." | Eksport GIF, jakość |
| Klub / sztab | „One board, your whole staff, every device." | Współpraca + sync |
| Hobbysta | „Open it. Draw it. No account needed." | Bezbarierowy start |

### 1.3 Reguły tonu (z `PRODUCT_PHILOSOPHY.md`)

Mówimy wartością, nie presją. „Continue for free", „Compare plans", „Upgrade when you need it". Zero fałszywej pilności, zero pop-upów na wejściu. Liczby (30 s, 1 skrót) zamiast przymiotników.

### 1.4 Spójność marki — ZDECYDOWANE

Domena produktu: **`tmcstudio.app`** (zatwierdzone). `tacticsmadeclear.com` zostaje jako marka-parasol z przekierowaniem na produkt. Przed launchem: jeden zestaw logotypów/OG-images i ujednolicenie README (dziś miesza obie nazwy).

---

## 2. Blueprint treści — strona po stronie

### 2.1 `/` Landing (sekcje w kolejności)

1. **Hero** — H1 (30 s) + sub + dwa CTA + **animowana demonstracja** (zapętlony GIF/MP4: ktoś wpisze `4`, `P`, `A` i w kilka sekund powstaje schemat). To najważniejszy „dowód obietnicy".
2. **Pasek zaufania** — logo klubów / liczba użytkowników / oceny (tylko prawdziwe — Omnibus).
3. **„How it works in 30 seconds"** — 3 kroki z mini-klipami: *Pick a formation (`1-6`) → Add movement (`A`/`R`) → Export (`Cmd+E`)*.
4. **Filary** (4 kafle z §atutu) — każdy z mikro-animacją i podpisem-skrótem.
5. **Keyboard-first** — wizualizacja klawiatury z podświetlonymi skrótami + „Command Palette `Cmd+K`". Sekcja-magnes dla power-userów.
6. **Everywhere** — web + desktop + sync; pasek „Available on macOS · Windows · any browser" z linkiem do `/download`.
7. **Use-case'y** — 3 karty (trener / twórca / klub) → linki do podstron.
8. **Eksporty / galeria** — siatka realnych animacji (showroom).
9. **Pricing teaser** — Free vs Pro w pigułce + „Free stays free forever" → `/pricing`.
10. **FAQ** + **stopka** z kompletem linków prawnych i selektorem języka.

### 2.2 `/product` (lub rozbudowane sekcje landingu)

Pełny przegląd: elementy (zawodnicy, piłka, strefy, strzałki, tekst), narzędzia rysowania, Inspector, grupy, **system animacji krok-po-kroku**, formacje, eksporty, focus mode, zoom, konto i sync. Każda funkcja opisana **przez korzyść + skrót**, nie przez nazwę techniczną.

### 2.3 `/use-cases/coaches` · `/creators` · `/clubs`

Szablon: problem persony → jak promise „30 s" go rozwiązuje → 3–4 funkcje kluczowe dla niej → przykład/wideo → CTA dopasowane (trener/twórca: „Open the board"; klub: „Talk to us" → `/contact`).

### 2.4 `/pricing`

Tabela Guest/Free/Pro/Team (źródło: `ENTITLEMENTS.md`), przełącznik mies./rok, **ceny brutto z VAT** + waluta wg rynku, FAQ rozliczeniowe, język bez dark patterns. (Szczegóły prawne: `SITE_ARCHITECTURE.md` §4.)

### 2.5 `/download`

Już istnieje (pobiera release z GitHub). Dodać: detekcję OS (podświetl właściwy przycisk), wymagania systemowe, „dlaczego desktop" (offline, szybkość, brak zakładek), link „lub użyj w przeglądarce" → `/board`.

### 2.6 Treść w 3 językach

Każda strona z §2.1–2.5 i strony prawne: **EN, ES, PL**. Hero, filary i CTA tłumaczone natywnie (nie maszynowo). Skróty klawiszowe zostają uniwersalne (`Cmd/Ctrl`), ale opisy lokalizowane.

---

## 3. Lejek PLG i konwersja

```
SEO/Social ──► Landing (/) ──► /app guest (rysuje w 30 s) ──► limit ──► Free ──► realna potrzeba ──► Pro ──► klub ──► Team
   ▲ GIF z watermarkiem „made with tmcstudio.app" zamyka pętlę akwizycji ◄──────────────────────────┘
```

- **Aktywacja = pierwsza taktyka w guest mode.** Mierzymy „time-to-first-export" — musi potwierdzać obietnicę 30 s.
- **Prompty upgrade kontekstowe** (limit kroków/projektów, eksport GIF/PDF) — nigdy na wejściu.
- **Pętla wirusowa (ZDECYDOWANE):** watermark na eksportach Guest/Free → darmowa dystrybucja → ruch na `/`. Specyfikacja: **lewy dolny róg, tekst `tmcstudio.app`, niskie krycie (~40–50%), mały, niekontrastowy** — ma być elegancki i nieprzeszkadzający, nie psuć grafiki trenera. Znika w planie Pro.

---

## 4. Plan techniczny

### 4.1 Rozdział landing / app
- Wydzielić `/` (marketing, SSG/statyczny, lekki) od `/board` (edytor). Edytor leniwie ładowany — landing nie ciągnie Konvy/edytora. `/app` pozostaje jako legacy redirect do `/board`.
- Router: marketing `BrowserRouter` + prefiks języka; desktop (Tauri) `HashRouter` startuje wprost w `/board`.

### 4.2 i18n (EN/ES/PL)
- Wprowadzić `react-i18next` (dziś brak warstwy i18n). Teksty → `locales/{en,es,pl}/*.json`.
- URL: podkatalogi `/en` `/es` `/pl` + `hreflang` + `x-default=en` (patrz `SITE_ARCHITECTURE.md` §5).
- Selektor języka w nagłówku i stopce; zapis wyboru do preferencji (już synchronizowanych w chmurze).

### 4.3 SEO
- Lokalizowane `<title>`/meta/OG per strona, `sitemap.xml` z wariantami językowymi, dane strukturalne `SoftwareApplication` + `FAQPage`.
- Strony marketingowe prerenderowane (statyczne) dla indeksacji i szybkości.

### 4.4 Wydajność = część obietnicy
Skoro sprzedajemy szybkość, strona musi być szybka. Budżet: **LCP < 2,0 s**, hero bez blokujących skryptów, animacje hero jako zoptymalizowany MP4/WebM (nie ciężki GIF), lazy-load galerii. Wynik Lighthouse ≥ 90 (perf + a11y).

### 4.5 Analityka (świadoma prywatności)
Eventy lejka: `landing_view → open_board → first_element_added → first_export → signup → limit_hit → pricing_view → upgrade`. Kluczowa metryka produktu: **time-to-first-export**. Narzędzie cookie-less lub za zgodą (zgodnie z banerem opt-in).

---

## 5. Promocja, SEO i treści

- **Blog/SEO (`/blog`):** tutoriale i „evergreen" pod frazy: „football formations explained", „4-3-3 vs 4-2-3-1", „how to make tactic animations", „free tactics board". Każdy artykuł = CTA do `/board`.
- **Social loop:** krótkie animacje eksportowane z produktu na X/IG/TikTok/YouTube Shorts; watermark kieruje ruch.
- **Społeczności:** subreddity taktyczne, grupy trenerskie, Discordy FM/football analytics — dzielenie się szablonami.
- **Współprace:** twórcy taktyczni (afiliacja faza 3), akademie (plan Team).
- **Launch:** Product Hunt + posty „I built a 30-second tactics board".

---

## 6. Roadmapa wykonawcza (fazy, zadania, kryteria akceptacji)

### Faza 1 — Launch-ready (priorytet: sprzedaż + minimum prawne)
| # | Zadanie | Kryterium akceptacji |
|---|---|---|
| 1.1 | Rozdzielić `/` (landing) i `/board` (edytor); `/app` → `/board` redirect | Landing nie ładuje bundla edytora; guest wchodzi na `/board` jednym klikiem |
| 1.2 | Zbudować landing wg §2.1 z animacją hero | Sekcje 1–10 wdrożone, hero MP4 < 1,5 MB |
| 1.3 | Wdrożyć i18n EN+PL (teksty do JSON) | Przełącznik działa, hreflang poprawny |
| 1.4 | Strona `/pricing` z cenami brutto VAT | Tabela zgodna z `ENTITLEMENTS.md`, mies./rok |
| 1.5 | Audyt + uzupełnienie `/privacy` `/terms` `/cookies` | Zgodne z RODO/ePrivacy (lista `SITE_ARCHITECTURE.md` §4) |
| 1.6 | `/refunds` + `/legal` (Impressum) | Dane firmy + prawo odstąpienia + checkbox zrzeczenia w checkout |
| 1.7 | Baner cookie opt-in | Równorzędne Akceptuj/Odrzuć, brak pre-zaznaczeń |
| 1.8 | Detekcja OS na `/download` | Właściwy przycisk podświetlony |
| 1.9 | Eventy analityki + time-to-first-export | Lejek mierzony end-to-end |

### Faza 2 — Wzrost
Use-case'y (coaches/creators/clubs) · `/blog` + 5–10 artykułów · publiczny `/changelog` · `/about` · `/contact` · **język ES** · deklaracja `/accessibility` + audyt WCAG 2.1 AA · watermark eksportu.

### Faza 3 — Skalowanie
`/help` overhaul · `/dpa` + self-serve Team · `/roadmap` · program poleceń/afiliacja · es-419 · rozważyć kolejne języki (DE/FR/IT).

---

## 7. KPI / metryki sukcesu

| Metryka | Cel kierunkowy | Dlaczego |
|---|---|---|
| **Time-to-first-export** | < 60 s mediana | Bezpośredni dowód obietnicy „30 s" |
| Landing → open_board | > 40% | Skuteczność hero/CTA |
| Guest → Free (signup) | rośnie m/m | Aktywacja |
| Free → Pro | zdrowy, bez wymuszania | Dopasowanie wartości |
| LCP landingu | < 2,0 s | Szybkość = część marki |
| Ruch organiczny z bloga/social | rośnie m/m | Pętla akwizycji |

---

## 8. Decyzje — ZATWIERDZONE

1. **Domena:** `tmcstudio.app` (produkt) · `tacticsmadeclear.com` = marka-parasol z przekierowaniem.
2. **Rozdział `/` (marketing) od `/board` (edytor):** tak. `/app` → `/board` legacy redirect.
3. **Płatności:** **Stripe + Stripe Tax** (nie MoR). Stripe nalicza VAT per kraj; rozliczenie VAT OSS i faktury po naszej stronie. Pełna konfiguracja i analiza krajów: `STRIPE_TAX_SETUP.md`.
4. **Watermark Guest/Free:** tak — lewy dolny róg, `tmcstudio.app`, niskie krycie, elegancki, znika w Pro (spec w §3).
5. **`/product`:** na start **bogate sekcje na landingu `/`**, bez osobnej strony; osobny `/product` dopiero gdy treści urosną.
6. **Hiszpański:** **castellano (es-ES)** na start (rynek Hiszpanii / UE); **es-419** w Fazie 3, jeśli pojawi się ruch z LatAm.

> Checklist prawny UE w komplecie: `SITE_ARCHITECTURE.md` §4. Przed publikacją: audyt prawny treści i audyt WCAG.
