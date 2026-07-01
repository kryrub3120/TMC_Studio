# SEO & Performance — Notes (S5)

_Utworzono: 2026-06-15 · Uzupełnia `WEBSITE_LAUNCH_PLAN.md` §4.3–4.4_

## Co wdrożono (S5)

| Element | Status | Gdzie |
|---|---|---|
| Per-page `<title>` + meta description | ✅ | `hooks/useDocumentMeta.ts` (landing, pricing), klucze `seo.*` w 3 językach |
| Canonical + OG/Twitter (per strona) | ✅ | `useDocumentMeta` aktualizuje `og:title/description/url`, `canonical` |
| OG bazowe + `og:site_name`/`og:locale` + `twitter:image` | ✅ | `apps/web/index.html` |
| JSON-LD `SoftwareApplication` | ✅ | statycznie w `index.html` |
| `sitemap.xml` (wszystkie strony publiczne) | ✅ | `apps/web/public/sitemap.xml` |
| `robots.txt` (+ `Disallow: /board`, `/invite`) ✅ | edytor i zaproszenia poza indeksem |

## Ważne ograniczenie: wielojęzyczne SEO (hreflang)

Obecna warstwa i18n jest **client-side** i serwuje wszystkie języki **pod tym samym URL-em** (wybór wg `navigator.language` / localStorage / przełącznika). To świadoma decyzja produktowa (EN domyślny, reszta wg lokalizacji), ale ma konsekwencję SEO:

- Crawler **bez JS** widzi statyczne meta z `index.html` (EN). Crawler **z JS** (Google) wykona `useDocumentMeta` i zobaczy język wykryty dla jego ustawień.
- **`hreflang` nie ma zastosowania**, dopóki nie istnieją osobne URL-e per język — nie ma alternatywnych adresów do wskazania.

### Follow-up, jeśli chcemy indeksować PL/ES osobno
Potrzebny **prerender per język na osobnych URL-ach** (np. `/`, `/es`, `/pl` lub `?lang=`), wtedy dokładamy `hreflang` + `x-default`. To większe zadanie (vite prerender / SSG dla stron marketingowych) — rekomendowane do osobnego sprintu, gdy ruch organiczny ES/PL będzie priorytetem. Na launch EN jako język indeksowany jest wystarczający.

## Budżet wydajności (do pilnowania)

- **LCP < 2,0 s** na `/` i `/pricing`.
- Edytor (Konva) jest **lazy-loaded** — landing nie ładuje jego bundla (S1). ✅
- Hero: docelowo animacja jako **WebM/MP4 < 1,5 MB** (dziś placeholder). Nie używać ciężkiego GIF-a.
- Fonty: Inter z Google Fonts z `preconnect` — rozważyć self-host / `font-display: swap` (jest `&display=swap`). OK.
- Galerie/obrazy: lazy-load (`loading="lazy"`) gdy dojdą realne assety (S2).

## Do weryfikacji w S6 (QA gate)
- Lighthouse **perf + a11y ≥ 90** na `/` i `/pricing`.
- Brak „surowych" kluczy i18n (fallback EN działa).
- Podgląd OG (debugger social) dla `/` i `/pricing`.
- FAQ structured data (`FAQPage`) — opcjonalnie dołożyć, jeśli zdecydujemy (musi odpowiadać widocznej treści i językowi).
