# brand/

Assety marki TMC Studio (logo, favicon, social, OG).

**📖 Dokumentacja dla agentów/developerów:** [`../docs/BRAND_ASSETS.md`](../docs/BRAND_ASSETS.md)
— geometria znaku, spec strzałki, warianty per tło, implementacja w kodzie (favicon/OG/React), export PNG/ICO, do/don't.

**Podgląd całości:** otwórz `brand-guide.html` w przeglądarce.

## Pliki
| Plik | Użycie |
|------|--------|
| `logo-horizontal.svg` | **Primary** — nav, nagłówki, stopki, email |
| `logo-mark.svg` / `logo-mark-on-light.svg` | Znak (ciemne / jasne tło) |
| `logo-stacked.svg` | Kompozycje kwadratowe |
| `logo-white.svg` | Mono biały — na kolorze/zdjęciu |
| `favicon.svg` | Favicon (uproszczony, 32×32) |
| `social-profile.svg` | Avatar social |
| `og-banner.svg` | OG / YouTube header (1200×630) |
| `_pitch-def.svg.frag` | Reużywalny fragment (boisko+strzałka) z placeholderami `STROKE`/`ARROW`/`CASING` |

> Zmieniasz znak? Edytuj `_pitch-def.svg.frag` i regeneruj warianty, żeby zostały spójne. Kolory UI aplikacji → `packages/ui/src/theme/tokens.css` (nie hardcoduj).
