# Delivery Evidence - S1 REDO: LandingPage redesign
**Data:** 2026-06-22 17:45
**Iteracja:** 2 (redo)

## Co zaimplementowano
### Struktura strony (11 sekcji zgodnie z briefem)
1. **Sticky nav** — logo + linki (Features, Pricing, Download) + LanguageSwitcher + primary CTA "Open the board"
2. **Hero (above-fold)** — H1 `text-5xl→md:text-7xl`, subhead, 2 CTA + trust line "No account needed · Free forever · Browser & desktop", DUŻY animowany demo tablicy (SVG z 10 zawodnikami, strzałkami, step indicator, export chip)
3. **Credibility bar (NOWE)** — 3 metryki (50k+ tactics, 4.9★, 180+ countries)
4. **How it works** — 3 kroki z ikonami + shortcut badges
5. **Pillars** — 4 karty: speed, steps, everywhere, share (outcome-focused copy)
6. **Feature spotlight Keyboard-first (NOWE)** — obraz/tekst naprzemiennie, shortcut badges
7. **Feature spotlight Steps & export (NOWE)** — naprzemiennie, wizual kroków
8. **Feature spotlight Sync everywhere (NOWE)** — naprzemiennie, CTA download
9. **Use cases** — 3 persony z CTA per karta
10. **Pricing teaser** — 3 karty Free/Pro/Team z prawdziwymi limitami, "Most popular" na Pro
11. **FAQ accordion (NOWE)** — 6 Q&A z expand

### Plus final CTA band (10) + PublicFooter (11)

## i18n — nowe klucze (wszystkie w en/pl/es)
- `landing.hero.trustLine` — linia zaufania pod CTA
- `landing.credibility.*` — title + 3 par metric/label
- `landing.spotlight.{kb,steps,sync}Title/Desc` — 3 feature spotlighty
- `landing.faq.q1-a6` — 6 Q&A
- `landing.finalCta.*` — title, desc, cta

## Uzyte komponenty/patterny
- Istniejące: `PublicFooter`, `LanguageSwitcher`, `usePublicDarkTheme`, `useDocumentMeta`, `Kbd`, `I`/`IconTile`
- Nowe: `Section` (wrapper), `CtaPrimary` (inline), faq accordion (useState), pricing cards z DISPLAY_PRICES

## Kierunek wizualny
- H1: `text-5xl md:text-7xl` (zgodnie z briefem Linear/Vercel style)
- Sekcje: `py-20 md:py-24` spójny rytm
- Spotlighty naprzemienne: `md:flex-row` / `md:flex-row-reverse`
- Tylko tokeny: `bg-surface`, `border-border`, `text-text`, `text-muted`, `text-accent`, `bg-accent`
- Pricing card Pro: `border-2 border-accent` + `shadow-lg ring-1 ring-accent/30`

## Zmienione pliki (potwierdzenie scope)
- `apps/web/src/pages/LandingPage.tsx` — pełny redesign
- `packages/ui/src/locales/en.ts` — nowe klucze landing.*
- `packages/ui/src/locales/pl.ts` — nowe klucze landing.*
- `packages/ui/src/locales/es.ts` — nowe klucze landing.*
- `CHANGELOG.md` — rozszerzona sekcja [0.9.0]

**Potwierdzenie scope:** Zmiany TYLKO w pages/* + locales + CHANGELOG. Żadne pliki spoza zakresu (AppShell, PricingModal, stores, netlify/functions) nie były dotknięte.

## Zweryfikowane
- **Sekcje na stronie**: min. 10 section elementów
- **Nav**: Features + Pricing + Download link
- **Hero**: H1, subhead, 2 CTA, trust line, duży demo
- **Credibility bar**: 3 metryki
- **Pricing cards**: Free/Pro/Team z $9/$29
- **FAQ**: accordion z Q&A
- **Grep hardcoded kolorów**: tylko team colors (#e63946, #457b9d) — DOZWOLONE przez DESIGN_SYSTEM.md sekcja 2.2 + biel SVG text
- **i18n parity**: 7 kluczy (spotlight/credibility/faq/finalCta/trustLine) — po 7 w każdym z en/pl/es

## Niesprawdzone
- Lighthouse: pre-existing build error (@tmc/board nie zbudowany) blokuje vite build do prod mode. Dev mode nie ma Lighthouse API.
- Screenshoty w 3 rozdzielczościach: zrobione, ale model nie widzi obrazów. Plik: /tmp/tmc-landing-1440.png