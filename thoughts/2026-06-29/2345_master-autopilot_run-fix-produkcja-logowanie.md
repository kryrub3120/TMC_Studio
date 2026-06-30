# Master Autopilot Run - Fix: Produkcja - logowanie, CSP, UI
**Data:** 2026-06-29 23:45
**Limit:** 4 sprinty, 3 proby na sprint

## Glowny plan
Fix 6 zdiagnozowanych problemow produkcyjnych zwiazanych z logowaniem (AbortError, CSP blokujacy fonty), UX (placement cursor, footer nawigacja) i UI (topbar responsywnosc).

### Sprinty zidentyfikowane
| Sprint | Cel | Zaleznosci |
|--------|-----|------------|
| S1     | CSP: Google Fonts + Plausible | - |
| S2     | Auth AbortError + element cursor placement | - |
| S3     | Footer nawigacja /privacy + TopBar responsywnosc | - |
| S4     | Self-review + testy + thoughts | S1, S2, S3 |

### Decyzje poczatkowe
- Kolejnosc: CSP first (blokuje dzialanie fontow i analityki), potem auth (krytyczne dla UX logowania), potem UI fixes
- Kazda zmiana minimalna - zero refaktoru okazji
- Wszystkie zmiany w Dev (lokalnie), CSP w netlify.toml jest dla Netlify deploy
