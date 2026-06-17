# 🟢 TMC Studio — Brand Assets (Logo, Favicon, OG)

**Version:** brand v1.1 (2026-06-17)
**Audience:** Wszystkie agenty (Implementer, Tester, Web) — czytaj przed użyciem/edycją logo, favicona, grafik social/OG.
**Scope:** Wyłącznie assety marki (znak, wordmark, favicon, social, OG). Tokeny kolorów/typografii UI → `docs/DESIGN_SYSTEM.md` + `packages/ui/src/theme/tokens.css` (source of truth). Tego dokumentu **nie** duplikujemy z tokenami — tu opisujemy konstrukcję i użycie assetów.

> Źródło plików: katalog `brand/`. Podgląd całości: `brand/brand-guide.html` (otwórz w przeglądarce).

---

## 1. Koncepcja

Znak = **boisko piłkarskie z góry + jedna pewna strzałka taktyczna**. Przekaz: **szybkie rysowanie taktyki** ("Draw tactics in seconds").

Zasady, które trzymają spójność:
- Boisko to **tło/kontekst** (linie w kolorze akcentu, stłumione).
- Strzałka to **bohater** — najjaśniejszy element, zawsze "nad" boiskiem, z **konturem w kolorze tła** (knockout), dzięki czemu nie zlewa się z liniami.
- Jeden ruch, jeden grot. Bez bałaganu.

---

## 2. Inventory plików

| Plik | viewBox / rozmiar | Zastosowanie | Tło |
|------|-------------------|--------------|-----|
| `brand/logo-mark.svg` | 512×512 | Znak podstawowy (app icon, avatar) | ciemne (navy) |
| `brand/logo-mark-on-light.svg` | 512×512 | Znak na jasnym tle | jasne |
| `brand/logo-horizontal.svg` | 880×200 | **Primary** — nagłówki, nav, stopki, email | ciemne |
| `brand/logo-stacked.svg` | 400×400 | Kompozycje kwadratowe | ciemne |
| `brand/logo-white.svg` | 880×200 | Mono biały — na kolorze/zdjęciu | dowolne |
| `brand/favicon.svg` | 32×32 | Favicon (uproszczony) | ciemne |
| `brand/social-profile.svg` | 400×400 | Avatar X/LinkedIn | ciemne + grid |
| `brand/og-banner.svg` | 1200×630 | OG / YouTube header | ciemne + grid |
| `brand/_pitch-def.svg.frag` | — | Reużywalny fragment (boisko + strzałka) z placeholderami | — |

---

## 3. Kolory używane w assetach

Wartości stałe w SVG (assety są samodzielne, **nie** czytają CSS vars). Muszą być zgodne z tokenami z `tokens.css`.

| Rola w znaku | Hex | Token odpowiednik |
|--------------|-----|-------------------|
| Tło ciemne / kontur strzałki (dark) | `#0B1220` | `--color-bg` (dark) |
| Linie boiska (dark) | `#12CFA0` | `--color-accent` (light) |
| Strzałka (dark) | `#2EE6A6` | `--color-accent` (dark) |
| Strzałka (on-light) | `#0FB58C` | `--color-accent-hover` |
| Tło jasne / kontur (light) | `#F6F8FC` | `--color-bg` (light) |
| Linie boiska (on-light) | `#0B1220` | `--color-text` (light) |
| Tekst jasny w grafikach | `#E8EEF9` | `--color-text` (dark) |
| Podpis/meta | `#516079` | `--color-muted` (light) |

**Reguła wariantu (kolor / kontur):**

| Tło | Linie boiska | Strzałka | Kontur strzałki (casing) |
|-----|--------------|----------|--------------------------|
| Ciemne `#0B1220` | `#12CFA0` @0.7 | `#2EE6A6` | `#0B1220` |
| Jasne `#F6F8FC` | `#0B1220` @0.5 | `#0FB58C` | `#F6F8FC` |
| Kolor/zdjęcie (mono) | `white` @0.6 | `white` | `rgba(11,18,32,0.55)` |

---

## 4. Geometria boiska (układ współrzędnych 512×512)

To jest **kanon**. Każdy wariant skaluje ten sam zestaw przez zewnętrzny `<g transform>`. Skopiuj 1:1 — nie improwizuj proporcji.

Boisko (landscape) w obrębie `512×512`, narożnik logo `rx=96`.

| Element | Specyfikacja | stroke-width |
|---------|--------------|--------------|
| Bramki (2×) | `rect x=50 y=241 w=10 h=30` (lewa), `x=452 y=241 ...` (prawa); `stroke-linejoin=round` | 5 |
| Obramowanie | `rect x=60 y=115 w=392 h=282` | 7 |
| Łuki narożne (4×, r=14) | TL `M 60 129 A 14 14 0 0 1 74 115` · TR `M 438 115 A 14 14 0 0 1 452 129` · BL `M 74 397 A 14 14 0 0 1 60 383` · BR `M 452 383 A 14 14 0 0 1 438 397` | 4 |
| Linia środkowa | `line x1=256 y1=115 x2=256 y2=397` | 5 |
| Koło środkowe | `circle cx=256 cy=256 r=44` | 5 |
| Punkt środkowy | `circle cx=256 cy=256 r=5` (fill) | — |
| Pole karne lewe | `rect x=60 y=181 w=62 h=150` | 4.5 |
| Punkt karny lewy (11 m) | `circle cx=101 cy=256 r=4` (fill) | — |
| Łuk pola karnego lewy (D) | `M 122 224.3 A 38 38 0 0 1 122 287.7` | 4.5 |
| Pole karne prawe | `rect x=390 y=181 w=62 h=150` | 4.5 |
| Punkt karny prawy (11 m) | `circle cx=411 cy=256 r=4` (fill) | — |
| Łuk pola karnego prawy (D) | `M 390 224.3 A 38 38 0 0 0 390 287.7` | 4.5 |

Cała grupa boiska ma `opacity` zależną od wariantu (dark 0.7, og-banner 0.6, on-light 0.5, mono 0.6).

**Skala (ref.):** ~3.73 px/m wzdłuż, ~4.15 px/m wszerz. Pole karne 16.5 m ≈ 62 px głębokości; punkt karny 11 m ≈ 41 px od linii końcowej; łuk karny r = 9.15 m ≈ 38 px (rysujemy tylko część poza polem karnym).

---

## 5. Strzałka taktyczna (bohater) — układ 512

Dwie warstwy: **kontur** (kolor tła, grubszy — robi knockout na liniach boiska), potem **strzałka** (kolor akcentu).

```svg
<g>
  <!-- kontur (separacja od linii boiska) -->
  <path d="M 145 312 C 205 188, 315 182, 366 210" fill="none" stroke="{CASING}" stroke-width="25" stroke-linecap="round"/>
  <polygon points="400,228 350,227 373,187" fill="{CASING}"/>
  <circle cx="145" cy="312" r="18" fill="{CASING}"/>
  <!-- strzałka -->
  <path d="M 145 312 C 205 188, 315 182, 366 210" fill="none" stroke="{ARROW}" stroke-width="15" stroke-linecap="round"/>
  <polygon points="396,226 356,225 373,193" fill="{ARROW}"/>
  <circle cx="145" cy="312" r="13" fill="{ARROW}"/>
</g>
```

Reguły:
- Kontur ZAWSZE = kolor tła pod znakiem. To on daje "przerwę" tam, gdzie strzałka krzyżuje linie/koło.
- Linia kończy się dokładnie u podstawy grota (brak wystającego "nub"). Nie wydłużaj `path` poza `366,210`.
- Brak `filter`/glow — celowo usunięty (teal glow zlewał się z boiskiem).
- Start: punkt + (opcjonalnie) aureola tylko w dużych formatach; w znaku zostaje sam punkt.

---

## 6. Reużywalny fragment

`brand/_pitch-def.svg.frag` zawiera pełne boisko + strzałkę z placeholderami:

- `STROKE` → kolor linii boiska
- `ARROW` → kolor strzałki
- `CASING` → kolor konturu (= tło)

Generowanie wariantu = wstaw fragment do `<g transform=...>`, podmień 3 placeholdery (np. `sed`/template). Tak powstały wszystkie pliki — trzymaj tę metodę przy zmianach, żeby warianty zostały zsynchronizowane.

---

## 7. Favicon — celowo uproszczony

Przy 32 px pełne oznaczenia zlewają się w plamę. Favicon zostawia **tylko**: obramowanie, linię środkową, koło + strzałkę z konturem i grotem. **Nie** dodawaj tu pól karnych, łuków, punktów ani bramek bez ponownego testu czytelności w 16/32 px.

---

## 8. Implementacja w kodzie

### 8.1 Favicon
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<!-- fallback dla starszych: -->
<link rel="alternate icon" href="/favicon.png" sizes="32x32" />
```
SVG favicon: skopiuj `brand/favicon.svg` do `apps/web/public/favicon.svg`.

### 8.2 OG / social meta
OG wymaga rastru (większość scraperów nie renderuje SVG). Wyeksportuj `og-banner.svg` → PNG (patrz §11) do `apps/web/public/og-banner.png`.
```html
<meta property="og:image" content="https://tacticsmadeclear.com/og-banner.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
```

### 8.3 Logo w aplikacji
- Nagłówek/nav/stopka → `logo-horizontal.svg`.
- Na ciemnych panelach/zdjęciach → `logo-white.svg`.
- Import w React (Vite): `import LogoUrl from '@/assets/logo-horizontal.svg'` i `<img src={LogoUrl} alt="TMC Studio" />`, albo inline jako komponent gdy potrzebny CSS-currentColor (uwaga: te SVG mają stałe kolory, nie `currentColor`).
- **Tekst w SVG** używa `font-family: Inter, system-ui, sans-serif`. Upewnij się, że Inter jest załadowany (jest w aplikacji); bez Inter fallback `system-ui` jest OK, ale unikaj DejaVu (psuje ujemny tracking).

---

## 9. Clear space, min. rozmiary, wordmark

- **Clear space:** min. 1× szerokość znaku z każdej strony.
- **Min. rozmiar znaku:** 32 px (poniżej używaj favicona).
- **Wordmark:** `TMC` = Inter 800, `letter-spacing: -1`. `STUDIO` = Inter 400, tracking 8–14 px (wersalik). Nie ściskaj `TMC` mocniej niż -1 (litery zaczynają się stykać).
- **ALL-CAPS labelki:** tracking 8–14 px.

---

## 10. Tagline / voice

- **Primary:** „Draw tactics in seconds." (komunikuje szybkość)
- Alt: „Draw it. Animate it. Share it." · „Where tactics come to life."
- Opis: „Tactical Board & Animation · by Tactics Made Clear".

---

## 11. Export do rastru (PNG / ICO)

W repo SVG jest źródłem. Raster generuj na żądanie (np. do OG, app store, fallback favicon):

```bash
# PNG z SVG (ImageMagick)
convert -background none -density 300 brand/logo-mark.svg logo-1024.png
convert -background "#0B1220" brand/og-banner.svg -resize 1200x630 og-banner.png

# Favicon ICO (wielorozmiarowy)
convert -background none brand/favicon.svg -define icon:auto-resize=16,32,48 favicon.ico
```
> Preferuj `rsvg-convert`/`resvg`/headless Chrome jeśli dostępne — renderują tekst (Inter) i filtry wierniej niż ImageMagick.

---

## 12. Do / Don't

**Do**
- Strzałka zawsze z konturem w kolorze tła (knockout).
- Trzymaj geometrię z §4–5 bez zmian; warianty rób przez fragment z §6.
- Używaj `logo-horizontal.svg` jako podstawowego.

**Don't**
- Nie zlewaj strzałki z boiskiem (brak konturu = błąd).
- Nie dodawaj glow/cieni do strzałki ani logo.
- Nie rozciągaj/nie przebarwiaj znaku; nie używaj poniżej 32 px.
- Nie pakuj pełnych oznaczeń do favicona.
- Nie hardcoduj kolorów marki w UI aplikacji — tam tokeny (`bg-accent`, `text-accent`).

---

## 13. Changelog brandu

**v1.1 — 2026-06-17**
- Uproszczono i wzmocniono znak; strzałka jako bohater z konturem (knockout) i wyraźnym grotem.
- Przywrócono pełne oznaczenia boiska: bramki, łuki narożne, punkty karne (11 m), łuki pól karnych (D) — przeliczone pod aktualną geometrię pól (62×150).
- Favicon uproszczony dla czytelności w 32 px.
- og-banner przebudowany (tekst lewo / boisko prawo, bez kruchej nakładki gradientowej) + tagline „Draw tactics in seconds.".
- Tracking `TMC` poprawiony do -1.

**v1.0 — 2025**
- Pierwszy system identyfikacji (boisko + strzałka, paleta navy/teal).
